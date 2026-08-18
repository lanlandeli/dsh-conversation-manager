// The delete and unarchive compatibility adapters intentionally probe optional
// host extensions that are not part of the rc.7 public type surface.
// @ts-nocheck

/**
 * dsh-conversation-manager — host half.
 *
 * Uses rc.7 public session-query interfaces for reads and lineage. The
 * deletion and unarchive paths retain only the explicitly planned optional
 * host primitives because rc.7 does not expose public equivalents.
 */
import z from "schemastery";
import { SessionId } from "@deepseek-ai/dsh-session";
import { readdir, stat, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { requireSessionId, resolveLocatedArtifactContainer, resolveSafeRegularFile } from "./server/path-security.js";

const name = "dsh-conversation-manager";
// agentLoop 是可选能力（缺失时删除走 409 降级），故意不进 inject：
// cordis 的 inject 是必需依赖声明（缺失会阻塞插件启动），而 ctx.get
// 本身是无需声明的宽容读取，正适合这种"有则用、无则降级"的场景。
const inject = ["webServer", "sessions", "sessionPersistence", "sessionQuery", "workspaceRegistry", "agents"];
/** Empty configuration schema: this plugin owns no loader config. */
const Config = z.object({});

const FETCH_TOOL_RE = /search|fetch|download|browse/i;

/** Resolve the persistence-owned artifact through the rc.7 public contract. */
async function resolveSessionRecordDirectory(ctx, meta) {
	const location = ctx.get("sessionPersistence")?.locate(meta);
	if (location === void 0) throw new Error("session persistence has no local artifact for this session");
	return resolveLocatedArtifactContainer(location.path);
}
/** Open a directory in the OS file manager (cross-platform, fire-and-forget).
 * s7: 简单节流——同一目录 500ms 内重复打开只放行一次，避免狂点按钮弹出多个窗口。 */
let lastOpenedDir = "";
let lastOpenedAt = 0;
function openInFileManager(dir) {
	const now = Date.now();
	if (dir === lastOpenedDir && now - lastOpenedAt < 500) {
		return Promise.resolve({ throttled: true });
	}
	lastOpenedDir = dir;
	lastOpenedAt = now;
	const command = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
	return new Promise((resolveOpen, rejectOpen) => {
		const child = spawn(command, [dir], {
			detached: true,
			stdio: "ignore",
			...(process.platform === "win32" ? { shell: false } : {})
		});
		// 以 'error' 与 'spawn' 竞速：命令缺失/启动失败时如实上报，而不是无条件成功
		let settled = false;
		child.once("error", (error) => {
			if (settled) return;
			settled = true;
			rejectOpen(error);
		});
		child.once("spawn", () => {
			if (settled) return;
			settled = true;
			resolveOpen();
		});
		child.unref();
	});
}
/** Recursively compute the on-disk size of a session record directory. */
async function getDirectorySize(dir) {
	let total = 0;
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return total;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		try {
			if (entry.isDirectory()) {
				total += await getDirectorySize(full);
			} else if (entry.isFile() || entry.isSymbolicLink()) {
				const info = await stat(full);
				total += info.size;
			}
		} catch {
			// ignore unreadable entries
		}
	}
	return total;
}
/** Locate a session header through the unified rc.7 session-query corpus. */
async function findSessionMeta(ctx, sessionId) {
	const records = await ctx.get("sessionQuery").listSessions();
	return records.find((record) => record.header.id === sessionId)?.header;
}

// -- browser-trust fence (loopback + same-origin markers) --------------------
function header(headers, name) {
	const value = headers[name];
	return typeof value === "string" ? value : void 0;
}
function parseAuthority(authority) {
	try {
		return new URL(`http://${authority}`);
	} catch {
		return;
	}
}
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	const parts = hostname.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
function isTrustedApiRequest(request) {
	const host = header(request.headers, "host");
	if (host === void 0) return false;
	const hostUrl = parseAuthority(host);
	if (hostUrl === void 0) return false;
	if (!isLoopbackHostname(hostUrl.hostname)) return false;
	if (header(request.headers, "sec-fetch-site") === "cross-site") return false;
	const origin = header(request.headers, "origin");
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}

// -- HTTP helpers ------------------------------------------------------------
/** Whitelist of archived API methods; anything else is a 404. */
const ARCHIVED_API_METHODS = new Set(["details", "delete", "delete-file", "open-folder", "archive", "unarchive"]);
const MAX_JSON_BODY_BYTES = 1024 * 1024;
async function readJsonBody(req) {
	// m16: 非 JSON content-type 直接 415（允许缺失——无 body 的调用方不强制）
	const contentType = header(req.headers, "content-type");
	if (contentType !== void 0 && !/^application\/json\b/i.test(contentType.trim())) {
		const error = new Error("content-type must be application/json");
		error.status = 415;
		error.code = "unsupported-media-type";
		throw error;
	}
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
		total += buffer.length;
		if (total > MAX_JSON_BODY_BYTES) {
			const error = new Error("request body too large");
			error.status = 413;
			error.code = "body-too-large";
			throw error;
		}
		chunks.push(buffer);
	}
	const raw = Buffer.concat(chunks).toString("utf8");
	if (raw.trim() === "") return {};
	try {
		return JSON.parse(raw);
	} catch {
		const error = new Error("invalid JSON body");
		error.status = 400;
		error.code = "bad-json";
		throw error;
	}
}
function writeJson(res, status, body) {
	const json = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"content-length": Buffer.byteLength(json),
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(json);
}
function writeOk(res, value) {
	writeJson(res, 200, { ok: true, value });
}
function writeFail(res, message, status = 500, code = "internal") {
	writeJson(res, status, { ok: false, error: { code, message } });
}

// M8: 详情响应上限——fetches 只保留前 50 条、files 只保留前 200 条，
// 防止单会话数万次 fetch/write 时详情 JSON 膨胀到数十 MB 卡死浏览器。
const MAX_FETCHES = 50;
const MAX_FILES = 200;

/** Build the per-session detail snapshot. */
async function buildDetails(ctx, sessionId) {
	const records = await ctx.get("sessionQuery").listSessions();
	const record = records.find((item) => item.header.id === sessionId);
	if (record === void 0) {
		const error = new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	const snapshot = await ctx.get("sessionQuery").readSession(SessionId(sessionId));
	const meta = snapshot.session;
	const events = snapshot.events;
	let sizeBytes = null;
	try {
		const recordDirectory = await resolveSessionRecordDirectory(ctx, meta);
		sizeBytes = await getDirectorySize(recordDirectory);
	} catch {
		// keep null -> client shows "--"
	}
	let lastTime = typeof meta?.createdAt === "number" ? meta.createdAt : 0;
	const fileSet = new Map();
	const stats = {
		turns: 0,
		steps: 0,
		userMessages: 0,
		assistantMessages: 0,
		toolCalls: 0,
		attachments: 0,
		toolCounts: {},
		fetches: []
	};
	const turnSeen = new Set();
	const stepSeen = new Set();
	for (const event of events) {
		if (typeof event.time === "number" && event.time > lastTime) lastTime = event.time;
		const data = event.data;
		switch (event.type) {
			case "turn/start":
				if (typeof data?.turn === "number") turnSeen.add(data.turn);
				break;
			case "step/start":
				if (typeof data?.step === "number") stepSeen.add(data.step);
				break;
			case "user/message":
				stats.userMessages++;
				if (Array.isArray(data?.content)) for (const block of data.content) if (block?.type === "image") stats.attachments++;
				break;
			case "assistant/message":
				stats.assistantMessages++;
				break;
			case "tool/call":
				stats.toolCalls++;
				{
					const name = typeof data?.name === "string" ? data.name : "tool";
					stats.toolCounts[name] = (stats.toolCounts[name] ?? 0) + 1;
					if (FETCH_TOOL_RE.test(name)) {
						let query;
						try {
							const args = typeof data.arguments === "string" ? JSON.parse(data.arguments) : data.arguments;
							query = typeof args?.query === "string" ? args.query : typeof args?.url === "string" ? args.url : typeof args?.q === "string" ? args.q : void 0;
						} catch {
							query = void 0;
						}
						stats.fetches.push({
							tool: name,
							...query === void 0 || query === "" ? {} : { query }
						});
					}
				}
				break;
		}
		if (event.type === "tool/call") {
			const toolName = typeof data?.name === "string" ? data.name : "";
			if (toolName === "write" || toolName === "edit") {
				let args;
				try {
					args = typeof data.arguments === "string" ? JSON.parse(data.arguments) : data.arguments;
				} catch {
					continue;
				}
				const filePath = typeof args?.file_path === "string" ? args.file_path : void 0;
				if (filePath === void 0 || filePath === "") continue;
				if (!fileSet.has(filePath)) fileSet.set(filePath, toolName);
			}
		}
	}
	stats.turns = turnSeen.size;
	stats.steps = stepSeen.size;
	// M8: 截断响应体积——fetches 保留前 MAX_FETCHES 条（客户端渲染时同样截断），
	// files 保留前 MAX_FILES 条；统计计数不受影响（toolCounts 仍是全量）。
	if (stats.fetches.length > MAX_FETCHES) stats.fetches = stats.fetches.slice(0, MAX_FETCHES);
	const files = [...fileSet.entries()].map(([path, tool]) => ({ path, tool })).slice(0, MAX_FILES);
	const trace = await ctx.get("sessionQuery").traceSession(SessionId(sessionId));
	const lineage = {
		parentSessionId: typeof meta?.parentSession === "string" ? meta.parentSession : null,
		children: trace.descendants
			.filter((node) => node.session.header.origin !== "subagent")
			.map((node) => node.session.header.id)
	};
	return {
		sessionId,
		sizeBytes,
		createdAt: typeof meta?.createdAt === "number" ? meta.createdAt : null,
		updatedAt: lastTime || null,
		files,
		stats,
		lineage
	};
}

// -- registry 状态变更串行队列 ----------------------------------------------
// workspaceRegistry 的 requireState+setState 是读-改-写原语，官方核心经内部
// enqueueOperation 串行化；插件自己的 unarchive/fallback-delete 也走本队列，
// 避免与并发归档/取消归档请求交错时丢失更新。
let mutationTail = Promise.resolve();
function enqueueMutation(operation) {
	const result = mutationTail.then(() => operation());
	mutationTail = result.then(() => {}, () => {});
	return result;
}

/** Delete ONE session only (no subagent cascade): detach workspace accounting,
 * drop the archive-set entry through the public state primitives, and remove
 * the persisted artifact via its physical location. Subagent children are
 * intentionally LEFT ALONE — they surface as top-level rows afterwards unless
 * the user explicitly selected them for deletion. */
async function deleteSessionSingle(ctx, sessionId) {
	const registry = ctx.get("workspaceRegistry");
	const persistence = ctx.get("sessionPersistence");
	const sessions = ctx.get("sessions");
	// m1: 会话不存在时明确 404，而不是静默"成功"（用户会误以为已删除）。
	// 运行中会话由调用方（deleteSession）先 409 拦截，这里只处理已停止的。
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	// M2: detach 是 best-effort——单个 workspace 的 detachSession 失败（例如其
	// requireState/setState 持久化异常）不应阻塞整个删除，记录后继续。
	for (const ws of registry?.list() ?? []) {
		if (!ws.sessionIds.includes(sessionId)) continue;
		try {
			await ws.detachSession(sessionId);
		} catch (error) {
			console.error(`[dsh-conversation-manager] detachSession failed for workspace "${ws.path}":`, error);
		}
	}
	if (registry !== void 0 && typeof registry.requireState === "function" && typeof registry.setState === "function") {
		await enqueueMutation(async () => {
			// M3: 队列内读取最新 state（不基于外部缓存的旧快照计算写回）。
			// 该会话在归档集中时，顺带清理指向已不存在会话的孤儿归档条目
			// （并发 archive/unarchive/delete 跨队列交错可能残留此类条目）。
			const state = registry.requireState();
			if (!state.archivedSessionIds.includes(sessionId)) return;
			const existing = new Set((await ctx.get("sessionQuery").listSessions()).map((record) => record.header.id));
			const archivedSessionIds = state.archivedSessionIds.filter((id) => id !== sessionId && existing.has(id));
			await registry.setState({ ...state, archivedSessionIds });
		});
	}
	if (persistence !== void 0 && typeof persistence.remove === "function") {
		await persistence.remove(sessionId);
	} else {
		const location = persistence?.locate(meta);
		if (location !== void 0) {
			const dir = await resolveLocatedArtifactContainer(location.path);
			await rm(dir, { recursive: true, force: true });
		}
	}
}

/** Permanently delete one session (live-agent teardown + single-session removal).
 * M7 note: DSH host 端没有公开的"当前会话"API（sessions store 的 current 是
 * 浏览器端概念，host 侧 services 无对等物；agents 的 selection.current 是 agent
 * 内部状态），因此 host 端无法可靠拒绝删除"当前打开的会话"。保护策略：运行中
 * 会话 409 拒绝（下方）+ 客户端禁选 current 行 + README 说明本机进程可通过
 * 直接调用 API 删除当前会话的风险（与官方 deleteSession 行为一致）。 */
async function deleteSession(ctx, sessionId) {
	const agents = ctx.get("agents");
	const agent = agents?.get(sessionId);
	if (agent !== void 0 && agent.status === "running") {
		const error = new Error("会话正在运行，无法删除；请先停止该会话");
		error.status = 409;
		error.code = "session-busy";
		throw error;
	}
	if (agent !== void 0) {
		// Best-effort teardown, matching the official deleteSession handler:
		// flush buffered writes, then dispose the agent when the primitive is
		// reachable. agentLoop sits behind an isolate realm on preset-mounted
		// deployments and is usually NOT resolvable from this root context —
		// that must not block deletion (the official handler skips dispose in
		// exactly that case and still deletes).
		try {
			const sessions = ctx.get("sessions");
			const session = sessions?.get(sessionId);
			if (session !== void 0 && typeof sessions.flush === "function") {
				await sessions.flush(session);
			}
		} catch {
			// flush failure is non-fatal: the artifact removal below wins
		}
		const loop = ctx.get("agentLoop");
		if (loop !== void 0 && typeof loop.disposeAgent === "function") {
			try {
				await loop.disposeAgent(sessionId);
			} catch {
				// dispose failure is non-fatal; continue with removal
			}
		}
	}
	// 永远走"只删自己"路径：registry.deleteSession（补丁版）会级联删除
	// subagent 子会话，而本插件按设计不级联——除非用户显式勾选子代理。
	await deleteSessionSingle(ctx, sessionId);
	return { sessionId };
}

/** Delete one file, but only when it resolves strictly INSIDE a registered
 * workspace root (never the root itself — a recursive rm on the root would
 * erase the whole project directory).
 *
 * M6: 只允许删除普通文件（lstat 拒绝目录和符号链接，rm 非递归）；强制
 * 校验 path 必须属于该会话 buildDetails.files 的产出文件列表（防同源脚本
 * 删除工作区任意文件）。m3: 工作区根也经 realpath，避免符号链接/大小写
 * 别名导致合法删除被误拒。m4: 尾部分隔符规范化，避免 `root + sep` 双分隔符。 */
async function deleteFile(ctx, path, sessionId) {
	const ownerSessionId = requireSessionId(sessionId);
	const meta = await findSessionMeta(ctx, ownerSessionId);
	if (meta === void 0) {
		const error = new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	const details = await buildDetails(ctx, ownerSessionId);
	const known = new Set((details?.files ?? []).map((file) => file.path));
	if (!known.has(path)) {
		const error = new Error("只能删除该会话产出文件列表中的文件");
		error.status = 403;
		error.code = "not-produced-file";
		throw error;
	}
	const registry = ctx.get("workspaceRegistry");
	const roots = (registry?.list() ?? []).map((ws) => ws.path);
	const cwd = typeof meta.cwd === "string" && meta.cwd !== "" ? meta.cwd : void 0;
	const target = await resolveSafeRegularFile(path, cwd, roots);
	await rm(target, { recursive: false, force: true });
	return { path: target, deleted: true };
}

/** Open a session's record folder in the OS file manager. */
async function openSessionFolder(ctx, sessionId) {
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = new Error("找不到该会话的记录目录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	let dir;
	try {
		dir = await resolveSessionRecordDirectory(ctx, meta);
	} catch (cause) {
		if (cause?.code === "outside-session-root" || cause?.code === "invalid-session-artifact") throw cause;
		const error = new Error("会话记录文件夹不存在（可能已被删除）");
		error.status = 404;
		error.code = "folder-not-found";
		error.cause = cause;
		throw error;
	}
	await openInFileManager(dir);
	return { sessionId, path: dir, opened: true };
}

/** Archive one session into the registry-global archive set. */
async function archiveSession(ctx, sessionId) {
	const registry = ctx.get("workspaceRegistry");
	if (registry === void 0 || typeof registry.archiveSession !== "function") {
		const error = new Error("当前 Harness 版本不支持归档会话（缺少 workspaceRegistry.archiveSession）");
		error.status = 501;
		error.code = "unsupported";
		throw error;
	}
	// 会话不存在时给明确 404（官方 archiveSession 对不存在会话抛无 status 的错误，会落到 500）
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	await registry.archiveSession(sessionId);
	return { sessionId, archived: true };
}

/**
* Unarchive one session back into the active list. Uses the same public
* registry primitives the official archiveSession is built on
* (`requireState` + `setState`), so it works on a stock Harness without
* any core patch. The read-modify-write runs inside the plugin's serialized
* mutation queue so concurrent archive/unarchive requests cannot lose updates.
* M3 note: 插件 mutationTail 队列与官方 archiveSession 的 enqueueOperation 是
* 两套独立队列，极端并发（同一毫秒内 archive 与 unarchive/delete 交错）仍可能
* 丢失更新；删除操作已顺带清理孤儿归档条目自愈，残余窗口见 README 并发说明。
*/
async function unarchiveSession(ctx, sessionId) {
	const registry = ctx.get("workspaceRegistry");
	if (registry === void 0 || typeof registry.requireState !== "function" || typeof registry.setState !== "function") {
		const error = new Error("当前 Harness 版本不支持取消归档（缺少 workspaceRegistry 状态原语）");
		error.status = 501;
		error.code = "unsupported";
		throw error;
	}
	// 会话不存在时给明确 404，与 archive/delete/details 语义一致
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	await enqueueMutation(async () => {
		const state = registry.requireState();
		if (!state.archivedSessionIds.includes(sessionId)) return;
		await registry.setState({
			...state,
			archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
		});
	});
	return { sessionId, archived: false };
}

function apply(ctx) {
	ctx.effect(() => ctx.get("webServer")?.register({
		kind: "prefix",
		path: "/conversation-manager/api",
		handler: async (req, res) => {
			if (!isTrustedApiRequest(req)) {
				writeJson(res, 403, { ok: false, error: { code: "forbidden", message: "forbidden" } });
				return;
			}
			if (req.method !== "POST") {
				writeJson(res, 405, { ok: false, error: { code: "method-error", message: "method not allowed" } });
				return;
			}
			const pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
			const method = pathname.startsWith("/conversation-manager/api/") ? pathname.slice("/conversation-manager/api/".length) : void 0;
			if (method === void 0 || method.includes("/") || method === "") {
				writeJson(res, 404, { ok: false, error: { code: "not-found", message: "unknown archived API method" } });
				return;
			}
			// 方法白名单：未知 method 优先返回 404，而不是落到参数校验的 400
			if (!ARCHIVED_API_METHODS.has(method)) {
				writeJson(res, 404, { ok: false, error: { code: "not-found", message: `unknown archived API method "${method}"` } });
				return;
			}
			try {
				const payload = await readJsonBody(req);
				if (method === "delete-file") {
					const path = typeof payload.path === "string" ? payload.path : "";
					if (path === "") {
						writeJson(res, 400, { ok: false, error: { code: "bad-request", message: "path is required" } });
						return;
					}
					// 文件删除必须绑定会话，不能由调用方省略以绕过产出列表校验。
					const ownerSessionId = requireSessionId(payload.sessionId);
					writeOk(res, await deleteFile(ctx, path, ownerSessionId));
					return;
				}
				const sessionId = requireSessionId(payload.sessionId);
				if (method === "details") {
					// NOTE: do NOT pass req.signal — the node http IncomingMessage
					// signal auto-aborts the moment the body is fully read, which
					// would abort every persistence read with "This operation was
					// aborted". Detail reads are bounded enough to run uncancelled.
					writeOk(res, await buildDetails(ctx, sessionId));
				} else if (method === "delete") {
					writeOk(res, await deleteSession(ctx, sessionId));
				} else if (method === "open-folder") {
					writeOk(res, await openSessionFolder(ctx, sessionId));
				} else if (method === "archive") {
					writeOk(res, await archiveSession(ctx, sessionId));
				} else if (method === "unarchive") {
					writeOk(res, await unarchiveSession(ctx, sessionId));
				} else {
					writeJson(res, 404, { ok: false, error: { code: "not-found", message: `unknown archived API method "${method}"` } });
				}
			} catch (error) {
				writeFail(res, error instanceof Error ? error.message : String(error), typeof error?.status === "number" ? error.status : 500, typeof error?.code === "string" ? error.code : "internal");
			}
		}
	}), "dsh-conversation-manager: /conversation-manager/api routes");
}

export { Config, apply, inject, name };


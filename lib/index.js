import z from "schemastery";
import { SessionId } from "@deepseek-ai/dsh-session";
import { lstat, readdir, realpath, rm, stat } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
//#region src/server/path-security.ts
var RequestError = class extends Error {
	status;
	code;
	constructor(message, status, code) {
		super(message);
		this.status = status;
		this.code = code;
	}
};
function requireSessionId(value) {
	if (typeof value !== "string" || value.length === 0) throw new RequestError("sessionId is required", 400, "bad-request");
	if (value.length > 200) throw new RequestError("sessionId is too long", 400, "bad-request");
	return value;
}
function resolveProducedPath(rawPath, sessionCwd) {
	if (rawPath.length === 0) throw new RequestError("path is required", 400, "bad-request");
	if (rawPath.length > 32768) throw new RequestError("path is too long", 400, "bad-request");
	if (isAbsolute(rawPath)) return resolve(rawPath);
	if (sessionCwd === void 0 || sessionCwd.length === 0) throw new RequestError("无法安全解析相对文件路径：会话缺少工作目录", 409, "missing-session-cwd");
	return resolve(sessionCwd, rawPath);
}
function isStrictlyInside(root, target) {
	const rel = relative(root, target);
	return rel !== "" && rel !== "." && !rel.startsWith("..") && !isAbsolute(rel);
}
async function resolveSafeRegularFile(rawPath, sessionCwd, workspaceRoots) {
	const resolved = resolveProducedPath(rawPath, sessionCwd);
	let info;
	try {
		info = await lstat(resolved);
	} catch (error) {
		if (error.code === "ENOENT") throw new RequestError("文件不存在或已经删除", 404, "file-not-found");
		throw error;
	}
	if (info.isSymbolicLink()) throw new RequestError("为避免链接跳转，不能删除符号链接", 403, "symlink-not-allowed");
	if (!info.isFile()) throw new RequestError("只能删除普通文件", 403, "not-a-file");
	const target = await realpath(resolved);
	for (const root of workspaceRoots) try {
		if (isStrictlyInside(await realpath(resolve(root)), target)) return target;
	} catch {}
	throw new RequestError("只能删除工作区内的文件", 403, "outside-workspace");
}
/** Resolve a backend-owned artifact returned by SessionPersistence.locate(). */
async function resolveLocatedArtifactContainer(artifactPath) {
	const canonicalArtifact = await realpath(resolve(artifactPath));
	const info = await lstat(canonicalArtifact);
	const container = info.isDirectory() ? canonicalArtifact : info.isFile() ? dirname(canonicalArtifact) : void 0;
	if (container === void 0) throw new RequestError("会话记录目标不是文件或目录", 409, "invalid-session-artifact");
	return container;
}
//#endregion
//#region src/index.ts
/**
* dsh-conversation-manager — host half.
*
* Uses rc.7 public session-query interfaces for reads and lineage. The
* deletion and unarchive paths retain only the explicitly planned optional
* host primitives because rc.7 does not expose public equivalents.
*/
const name = "dsh-conversation-manager";
const inject = [
	"webServer",
	"sessions",
	"sessionPersistence",
	"sessionQuery",
	"workspaceRegistry",
	"agents"
];
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
	if (dir === lastOpenedDir && now - lastOpenedAt < 500) return Promise.resolve({ throttled: true });
	lastOpenedDir = dir;
	lastOpenedAt = now;
	const command = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
	return new Promise((resolveOpen, rejectOpen) => {
		const child = spawn(command, [dir], {
			detached: true,
			stdio: "ignore",
			...process.platform === "win32" ? { shell: false } : {}
		});
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
			if (entry.isDirectory()) total += await getDirectorySize(full);
			else if (entry.isFile() || entry.isSymbolicLink()) {
				const info = await stat(full);
				total += info.size;
			}
		} catch {}
	}
	return total;
}
/** Locate a session header through the unified rc.7 session-query corpus. */
async function findSessionMeta(ctx, sessionId) {
	return (await ctx.get("sessionQuery").listSessions()).find((record) => record.header.id === sessionId)?.header;
}
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
/** Whitelist of archived API methods; anything else is a 404. */
const ARCHIVED_API_METHODS = /* @__PURE__ */ new Set([
	"details",
	"delete",
	"delete-file",
	"open-folder",
	"archive",
	"unarchive"
]);
const MAX_JSON_BODY_BYTES = 1048576;
async function readJsonBody(req) {
	const contentType = header(req.headers, "content-type");
	if (contentType !== void 0 && !/^application\/json\b/i.test(contentType.trim())) {
		const error = /* @__PURE__ */ new Error("content-type must be application/json");
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
			const error = /* @__PURE__ */ new Error("request body too large");
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
		const error = /* @__PURE__ */ new Error("invalid JSON body");
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
	writeJson(res, 200, {
		ok: true,
		value
	});
}
function writeFail(res, message, status = 500, code = "internal") {
	writeJson(res, status, {
		ok: false,
		error: {
			code,
			message
		}
	});
}
const MAX_FETCHES = 50;
const MAX_FILES = 200;
/** Build the per-session detail snapshot. */
async function buildDetails(ctx, sessionId) {
	if ((await ctx.get("sessionQuery").listSessions()).find((item) => item.header.id === sessionId) === void 0) {
		const error = /* @__PURE__ */ new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	const snapshot = await ctx.get("sessionQuery").readSession(SessionId(sessionId));
	const meta = snapshot.session;
	const events = snapshot.events;
	let sizeBytes = null;
	try {
		sizeBytes = await getDirectorySize(await resolveSessionRecordDirectory(ctx, meta));
	} catch {}
	let lastTime = typeof meta?.createdAt === "number" ? meta.createdAt : 0;
	const fileSet = /* @__PURE__ */ new Map();
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
	const turnSeen = /* @__PURE__ */ new Set();
	const stepSeen = /* @__PURE__ */ new Set();
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
				if (Array.isArray(data?.content)) {
					for (const block of data.content) if (block?.type === "image") stats.attachments++;
				}
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
	if (stats.fetches.length > MAX_FETCHES) stats.fetches = stats.fetches.slice(0, MAX_FETCHES);
	const files = [...fileSet.entries()].map(([path, tool]) => ({
		path,
		tool
	})).slice(0, MAX_FILES);
	const trace = await ctx.get("sessionQuery").traceSession(SessionId(sessionId));
	const lineage = {
		parentSessionId: typeof meta?.parentSession === "string" ? meta.parentSession : null,
		children: trace.descendants.filter((node) => node.session.header.origin !== "subagent").map((node) => node.session.header.id)
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
	ctx.get("sessions");
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = /* @__PURE__ */ new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	for (const ws of registry?.list() ?? []) {
		if (!ws.sessionIds.includes(sessionId)) continue;
		try {
			await ws.detachSession(sessionId);
		} catch (error) {
			console.error(`[dsh-conversation-manager] detachSession failed for workspace "${ws.path}":`, error);
		}
	}
	if (registry !== void 0 && typeof registry.requireState === "function" && typeof registry.setState === "function") await enqueueMutation(async () => {
		const state = registry.requireState();
		if (!state.archivedSessionIds.includes(sessionId)) return;
		const existing = new Set((await ctx.get("sessionQuery").listSessions()).map((record) => record.header.id));
		const archivedSessionIds = state.archivedSessionIds.filter((id) => id !== sessionId && existing.has(id));
		await registry.setState({
			...state,
			archivedSessionIds
		});
	});
	if (persistence !== void 0 && typeof persistence.remove === "function") await persistence.remove(sessionId);
	else {
		const location = persistence?.locate(meta);
		if (location !== void 0) {
			const dir = await resolveLocatedArtifactContainer(location.path);
			await rm(dir, {
				recursive: true,
				force: true
			});
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
	const agent = ctx.get("agents")?.get(sessionId);
	if (agent !== void 0 && agent.status === "running") {
		const error = /* @__PURE__ */ new Error("会话正在运行，无法删除；请先停止该会话");
		error.status = 409;
		error.code = "session-busy";
		throw error;
	}
	if (agent !== void 0) {
		try {
			const sessions = ctx.get("sessions");
			const session = sessions?.get(sessionId);
			if (session !== void 0 && typeof sessions.flush === "function") await sessions.flush(session);
		} catch {}
		const loop = ctx.get("agentLoop");
		if (loop !== void 0 && typeof loop.disposeAgent === "function") try {
			await loop.disposeAgent(sessionId);
		} catch {}
	}
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
		const error = /* @__PURE__ */ new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	const details = await buildDetails(ctx, ownerSessionId);
	if (!new Set((details?.files ?? []).map((file) => file.path)).has(path)) {
		const error = /* @__PURE__ */ new Error("只能删除该会话产出文件列表中的文件");
		error.status = 403;
		error.code = "not-produced-file";
		throw error;
	}
	const roots = (ctx.get("workspaceRegistry")?.list() ?? []).map((ws) => ws.path);
	const target = await resolveSafeRegularFile(path, typeof meta.cwd === "string" && meta.cwd !== "" ? meta.cwd : void 0, roots);
	await rm(target, {
		recursive: false,
		force: true
	});
	return {
		path: target,
		deleted: true
	};
}
/** Open a session's record folder in the OS file manager. */
async function openSessionFolder(ctx, sessionId) {
	const meta = await findSessionMeta(ctx, sessionId);
	if (meta === void 0) {
		const error = /* @__PURE__ */ new Error("找不到该会话的记录目录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	let dir;
	try {
		dir = await resolveSessionRecordDirectory(ctx, meta);
	} catch (cause) {
		if (cause?.code === "outside-session-root" || cause?.code === "invalid-session-artifact") throw cause;
		const error = /* @__PURE__ */ new Error("会话记录文件夹不存在（可能已被删除）");
		error.status = 404;
		error.code = "folder-not-found";
		error.cause = cause;
		throw error;
	}
	await openInFileManager(dir);
	return {
		sessionId,
		path: dir,
		opened: true
	};
}
/** Archive one session into the registry-global archive set. */
async function archiveSession(ctx, sessionId) {
	const registry = ctx.get("workspaceRegistry");
	if (registry === void 0 || typeof registry.archiveSession !== "function") {
		const error = /* @__PURE__ */ new Error("当前 Harness 版本不支持归档会话（缺少 workspaceRegistry.archiveSession）");
		error.status = 501;
		error.code = "unsupported";
		throw error;
	}
	if (await findSessionMeta(ctx, sessionId) === void 0) {
		const error = /* @__PURE__ */ new Error("找不到该会话的记录（会话不存在）");
		error.status = 404;
		error.code = "session-not-found";
		throw error;
	}
	await registry.archiveSession(sessionId);
	return {
		sessionId,
		archived: true
	};
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
		const error = /* @__PURE__ */ new Error("当前 Harness 版本不支持取消归档（缺少 workspaceRegistry 状态原语）");
		error.status = 501;
		error.code = "unsupported";
		throw error;
	}
	if (await findSessionMeta(ctx, sessionId) === void 0) {
		const error = /* @__PURE__ */ new Error("找不到该会话的记录（会话不存在）");
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
	return {
		sessionId,
		archived: false
	};
}
function apply(ctx) {
	ctx.effect(() => ctx.get("webServer")?.register({
		kind: "prefix",
		path: "/conversation-manager/api",
		handler: async (req, res) => {
			if (!isTrustedApiRequest(req)) {
				writeJson(res, 403, {
					ok: false,
					error: {
						code: "forbidden",
						message: "forbidden"
					}
				});
				return;
			}
			if (req.method !== "POST") {
				writeJson(res, 405, {
					ok: false,
					error: {
						code: "method-error",
						message: "method not allowed"
					}
				});
				return;
			}
			const pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
			const method = pathname.startsWith("/conversation-manager/api/") ? pathname.slice(26) : void 0;
			if (method === void 0 || method.includes("/") || method === "") {
				writeJson(res, 404, {
					ok: false,
					error: {
						code: "not-found",
						message: "unknown archived API method"
					}
				});
				return;
			}
			if (!ARCHIVED_API_METHODS.has(method)) {
				writeJson(res, 404, {
					ok: false,
					error: {
						code: "not-found",
						message: `unknown archived API method "${method}"`
					}
				});
				return;
			}
			try {
				const payload = await readJsonBody(req);
				if (method === "delete-file") {
					const path = typeof payload.path === "string" ? payload.path : "";
					if (path === "") {
						writeJson(res, 400, {
							ok: false,
							error: {
								code: "bad-request",
								message: "path is required"
							}
						});
						return;
					}
					writeOk(res, await deleteFile(ctx, path, requireSessionId(payload.sessionId)));
					return;
				}
				const sessionId = requireSessionId(payload.sessionId);
				if (method === "details") writeOk(res, await buildDetails(ctx, sessionId));
				else if (method === "delete") writeOk(res, await deleteSession(ctx, sessionId));
				else if (method === "open-folder") writeOk(res, await openSessionFolder(ctx, sessionId));
				else if (method === "archive") writeOk(res, await archiveSession(ctx, sessionId));
				else if (method === "unarchive") writeOk(res, await unarchiveSession(ctx, sessionId));
				else writeJson(res, 404, {
					ok: false,
					error: {
						code: "not-found",
						message: `unknown archived API method "${method}"`
					}
				});
			} catch (error) {
				writeFail(res, error instanceof Error ? error.message : String(error), typeof error?.status === "number" ? error.status : 500, typeof error?.code === "string" ? error.code : "internal");
			}
		}
	}), "dsh-conversation-manager: /conversation-manager/api routes");
}
//#endregion
export { Config, apply, inject, name };

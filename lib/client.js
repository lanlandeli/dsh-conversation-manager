window.__ModuleLoader__.load({
	id: "dsh-conversation-manager",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/batch.ts
		async function runBatched(ids, operation, batchSize = 20) {
			const succeeded = [];
			const failed = [];
			for (let offset = 0; offset < ids.length; offset += batchSize) {
				const chunk = ids.slice(offset, offset + batchSize);
				(await Promise.allSettled(chunk.map((id) => operation(id)))).forEach((result, index) => {
					const id = chunk[index];
					if (id === void 0) return;
					if (result.status === "fulfilled") succeeded.push(id);
					else failed.push({
						id,
						message: result.reason instanceof Error ? result.reason.message : String(result.reason)
					});
				});
			}
			return {
				succeeded,
				failed
			};
		}
		//#endregion
		//#region src/client/i18n.ts
		const NS = "conversation-manager";
		const zh = {
			nav: "会话管理",
			title: "会话管理",
			"tab.all": "所有对话",
			"tab.archived": "归档会话",
			emptyAll: "没有未归档的对话",
			emptyArchived: "没有归档的会话",
			selectAll: "全选",
			selected: "已选 {n} 项",
			selectSession: "选择会话：{title}",
			delete: "删除选中",
			deleting: "正在删除…",
			archive: "归档对话",
			archiving: "正在归档…",
			unarchive: "恢复对话",
			unarchiving: "正在恢复…",
			"view.workspace": "按工作区",
			"view.flat": "单列表",
			search: "搜索会话",
			searchPlaceholder: "搜索标题或会话 ID…",
			"group.ungrouped": "未分组",
			"group.sessions": "{n} 个会话",
			batchResult: "成功 {ok} 项，失败 {fail} 项",
			batchFailedHint: "失败项仍保持选中，可直接重试。",
			archiveConfirm: "确认归档选中的 {n} 个对话？记录不会被删除。",
			selectionActions: "所选对话操作",
			openFolder: "打开记录目录",
			openFolderHint: "在文件管理器中打开 DSH 会话记录目录",
			openFolderSelectOne: "请选择一个对话以打开记录目录",
			confirm: "确认删除 {n} 个会话？会话记录将被永久删除，此操作不可恢复。",
			current: "当前会话",
			currentHint: "当前打开的会话不能选择或删除",
			subagent: "子代理",
			subagentExpand: "展开子代理",
			subagentCollapse: "收起子代理",
			details: "会话详情",
			detailsLoading: "正在加载详情…",
			detailsRefresh: "刷新详情",
			activity: "活动统计",
			loading: "正在加载…",
			retry: "重试",
			size: "占用空间",
			updated: "最后更新",
			turns: "轮次",
			steps: "步骤",
			userMessages: "用户消息",
			assistantMessages: "回复消息",
			toolCalls: "工具调用",
			attachments: "附件",
			tools: "工具使用",
			fetches: "网络获取 / 下载",
			noFetches: "无网络获取记录",
			lineage: "关联对话",
			parent: "父会话",
			children: "子会话（分叉）",
			files: "下载 / 产出文件",
			noFiles: "该对话没有产出文件",
			fileDelete: "删除选中文件",
			fileDeleteConfirm: "确认删除选中的 {n} 个文件？文件将被永久删除，此操作不可恢复。",
			fileDeleting: "正在删除文件…",
			none: "无",
			na: "—",
			"time.now": "刚刚",
			"time.minutes": "{n} 分钟前",
			"time.hours": "{n} 小时前",
			"time.days": "{n} 天前",
			"time.months": "{n} 个月前",
			"time.years": "{n} 年前",
			close: "关闭",
			cancel: "取消"
		};
		const en = {
			nav: "Session manager",
			title: "Session manager",
			"tab.all": "All conversations",
			"tab.archived": "Archived",
			emptyAll: "No active conversations",
			emptyArchived: "No archived sessions",
			selectAll: "Select all",
			selected: "{n} selected",
			selectSession: "Select session: {title}",
			delete: "Delete selected",
			deleting: "Deleting…",
			archive: "Archive conversation",
			archiving: "Archiving…",
			unarchive: "Restore conversation",
			unarchiving: "Restoring…",
			"view.workspace": "By workspace",
			"view.flat": "Flat list",
			search: "Search sessions",
			searchPlaceholder: "Search titles or session IDs…",
			"group.ungrouped": "Ungrouped",
			"group.sessions": "{n} sessions",
			batchResult: "{ok} succeeded, {fail} failed",
			batchFailedHint: "Failed items remain selected so you can retry them.",
			archiveConfirm: "Archive {n} selected conversation(s)? Their records will be kept.",
			selectionActions: "Selected conversation actions",
			openFolder: "Open records",
			openFolderHint: "Open the DSH session records directory in your file manager",
			openFolderSelectOne: "Select one conversation to open its records directory",
			confirm: "Delete {n} session(s)? Session records will be permanently removed. This cannot be undone.",
			current: "Current",
			currentHint: "The current session cannot be selected or deleted",
			subagent: "Subagent",
			subagentExpand: "Expand subagents",
			subagentCollapse: "Collapse subagents",
			details: "Session details",
			detailsLoading: "Loading details…",
			detailsRefresh: "Refresh details",
			activity: "Activity",
			loading: "Loading…",
			retry: "Retry",
			size: "Size on disk",
			updated: "Last updated",
			turns: "Turns",
			steps: "Steps",
			userMessages: "User messages",
			assistantMessages: "Replies",
			toolCalls: "Tool calls",
			attachments: "Attachments",
			tools: "Tool usage",
			fetches: "Web fetches / downloads",
			noFetches: "No web fetches",
			lineage: "Related conversations",
			parent: "Parent",
			children: "Children (forks)",
			files: "Downloads / produced files",
			noFiles: "This conversation produced no files",
			fileDelete: "Delete selected files",
			fileDeleteConfirm: "Delete {n} selected file(s)? Files will be permanently removed. This cannot be undone.",
			fileDeleting: "Deleting files…",
			none: "None",
			na: "—",
			"time.now": "now",
			"time.minutes": "{n} min ago",
			"time.hours": "{n}h ago",
			"time.days": "{n}d ago",
			"time.months": "{n}mo ago",
			"time.years": "{n}y ago",
			close: "Close",
			cancel: "Cancel"
		};
		//#endregion
		//#region src/client/model.ts
		function newestFirst(a, b) {
			if (a.current !== b.current) return a.current ? -1 : 1;
			return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
		}
		function directChildCounts(rows) {
			const ids = new Set(rows.map((row) => row.id));
			const counts = /* @__PURE__ */ new Map();
			for (const row of rows) {
				if (!row.subagent || row.parentId === void 0 || !ids.has(row.parentId)) continue;
				counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1);
			}
			return counts;
		}
		function descendantIds(rows, rootIds) {
			const children = /* @__PURE__ */ new Map();
			for (const row of rows) {
				if (row.parentId === void 0) continue;
				const list = children.get(row.parentId) ?? [];
				list.push(row.id);
				children.set(row.parentId, list);
			}
			const result = /* @__PURE__ */ new Set();
			const visit = (id) => {
				if (result.has(id)) return;
				result.add(id);
				for (const child of children.get(id) ?? []) visit(child);
			};
			for (const id of rootIds) visit(id);
			return result;
		}
		/**
		* Flattens the full parent/subagent tree. Search includes matching rows plus
		* their ancestors and automatically expands those paths so matching nested
		* subagents never disappear behind a filtered-out parent.
		*/
		function flattenSessionRows(rows, expandedParents, query = "", requestedRoots) {
			const rowById = new Map(rows.map((row) => [row.id, row]));
			const children = /* @__PURE__ */ new Map();
			for (const row of rows) {
				if (row.parentId === void 0 || !rowById.has(row.parentId)) continue;
				const list = children.get(row.parentId) ?? [];
				list.push(row);
				children.set(row.parentId, list);
			}
			for (const list of children.values()) list.sort(newestFirst);
			const normalized = query.trim().toLocaleLowerCase();
			const included = /* @__PURE__ */ new Set();
			if (normalized !== "") for (const row of rows) {
				if (!row.title.toLocaleLowerCase().includes(normalized) && !row.id.toLocaleLowerCase().includes(normalized)) continue;
				let cursor = row;
				const chain = /* @__PURE__ */ new Set();
				while (cursor !== void 0 && !chain.has(cursor.id)) {
					chain.add(cursor.id);
					included.add(cursor.id);
					cursor = cursor.parentId === void 0 ? void 0 : rowById.get(cursor.parentId);
				}
			}
			const roots = requestedRoots === void 0 ? rows.filter((row) => row.parentId === void 0 || !rowById.has(row.parentId)).sort(newestFirst).map((row) => row.id) : [...requestedRoots];
			const structurallyReachable = /* @__PURE__ */ new Set();
			const markReachable = (id) => {
				if (structurallyReachable.has(id)) return;
				structurallyReachable.add(id);
				for (const child of children.get(id) ?? []) markReachable(child.id);
			};
			for (const id of roots) markReachable(id);
			const result = [];
			const visited = /* @__PURE__ */ new Set();
			const visit = (id) => {
				if (visited.has(id)) return;
				const row = rowById.get(id);
				if (row === void 0) return;
				visited.add(id);
				if (normalized !== "" && !included.has(id)) return;
				result.push(row);
				if (normalized === "" && !expandedParents.has(id)) return;
				for (const child of children.get(id) ?? []) visit(child.id);
			};
			for (const root of roots) visit(root);
			if (requestedRoots === void 0) {
				for (const row of [...rows].sort(newestFirst)) if (!structurallyReachable.has(row.id) && !visited.has(row.id) && (normalized === "" || included.has(row.id))) visit(row.id);
			}
			return result;
		}
		//#endregion
		//#region src/client/styles.ts
		const styles = String.raw`
[data-conversation-manager] {
  --as-bg: var(--dsw-alias-bg-layer-1, #fff);
  --as-soft: var(--dsw-alias-interactive-bg-hover, #f3f5f7);
  --as-text: var(--dsw-alias-label-primary, #181b20);
  --as-muted: var(--dsw-alias-label-secondary, #69717d);
  --as-faint: var(--dsw-alias-label-tertiary, #8b929c);
  --as-border: var(--dsw-alias-border-l2, #dfe3e8);
  --as-accent: var(--dsw-accent-strong, #1677ff);
  --as-danger: var(--dsw-alias-state-error-primary, #d9363e);
  --as-shadow: 0 1px 2px rgba(18, 26, 41, .04), 0 8px 24px rgba(18, 26, 41, .04);
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--as-text);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.45;
}
[data-conversation-manager] *, [data-conversation-manager] *::before, [data-conversation-manager] *::after { box-sizing: border-box; }
.as-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.as-heading { font-size: 17px; line-height: 24px; font-weight: 650; letter-spacing: -.01em; }
.as-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--as-border); }
.as-tab { position: relative; min-height: 38px; display: inline-flex; align-items: center; gap: 7px; padding: 6px 13px; border: 0; border-radius: 9px 9px 0 0; color: var(--as-muted); background: transparent; cursor: pointer; font: inherit; }
.as-tab::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; border-radius: 2px; background: transparent; transform: scaleX(.55); transition: background 160ms ease, transform 180ms ease; }
.as-tab:hover { color: var(--as-text); background: var(--as-soft); }
.as-tab[aria-selected="true"] { color: var(--as-accent); }
.as-tab[aria-selected="true"]::after { background: var(--as-accent); transform: scaleX(1); }
.as-tab-count { min-width: 20px; height: 19px; padding: 0 6px; border-radius: 999px; color: var(--as-faint); background: var(--as-soft); font-size: 11px; line-height: 19px; text-align: center; }
[data-conversation-manager] > [role="tabpanel"] { display: grid; gap: 16px; }
.as-viewbar { display: flex; align-items: center; gap: 12px; }
.as-search { min-width: 150px; flex: 1; height: 44px; padding: 0 14px; border: 1px solid var(--as-border); border-radius: 12px; color: var(--as-text); background: var(--as-bg); font: inherit; outline: none; transition: border-color 150ms ease, box-shadow 150ms ease; }
.as-search::placeholder { color: var(--as-faint); }
.as-search:focus-visible { border-color: var(--as-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--as-accent) 14%, transparent); }
.as-segment { display: inline-flex; flex: none; gap: 4px; padding: 4px; border-radius: 12px; background: var(--as-soft); }
.as-segment button { min-height: 36px; padding: 5px 13px; border: 0; border-radius: 9px; color: var(--as-muted); background: transparent; cursor: pointer; font: inherit; font-size: 12px; }
.as-segment button[aria-pressed="true"] { color: var(--as-text); background: var(--as-bg); box-shadow: 0 1px 4px rgba(0,0,0,.1); }
.as-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; min-height: 44px; }
.as-toolbar-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 10px; }
.as-batch-actions { display: flex; align-items: center; gap: 10px; animation: as-actions-in 220ms cubic-bezier(.22,1,.36,1) both; }
.as-select-all { display: inline-flex; align-items: center; gap: 7px; color: var(--as-muted); cursor: pointer; }
.as-count { min-width: max-content; flex: 1; color: var(--as-faint); font-size: 12px; }
.as-checkbox { appearance: none; width: 17px; height: 17px; flex: none; margin: 0; border: 1px solid var(--as-border); border-radius: 5px; background: var(--as-bg); cursor: pointer; transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease, transform 140ms ease; }
.as-checkbox:checked { border-color: var(--as-accent); background: var(--as-accent); box-shadow: inset 0 0 0 4px var(--as-bg); }
.as-checkbox:indeterminate { border-color: var(--as-accent); background: linear-gradient(var(--as-accent), var(--as-accent)) center / 9px 2px no-repeat var(--as-bg); }
.as-checkbox:focus-visible { outline: 2px solid var(--as-accent); outline-offset: 2px; }
.as-list {
  block-size: min(500px, 56dvh);
  max-block-size: min(500px, 56dvh);
  min-block-size: 220px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 9px 14px;
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}
.as-group { display: contents; }
.as-group-header { min-height: 30px; display: flex; align-items: center; gap: 7px; margin-top: 10px; padding: 0 5px; color: var(--as-muted); }
.as-group-header:first-child { margin-top: 0; }
.as-group-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-weight: 600; }
.as-group-count { color: var(--as-faint); font-size: 11px; }
.as-row-stack { display: grid; gap: 0; }
.as-row { min-height: 54px; display: flex; align-items: center; gap: 12px; padding: 9px 13px; border: 1px solid var(--as-border); border-radius: 13px; background: var(--as-bg); box-shadow: none; animation: as-row-in 150ms ease-out both; transition: border-color 180ms ease, box-shadow 200ms cubic-bezier(.22,1,.36,1), background 180ms ease; }
.as-row:hover { border-color: color-mix(in srgb, var(--as-accent) 42%, var(--as-border)); box-shadow: 0 4px 16px rgba(18,26,41,.065); }
.as-row[data-selected="true"] { border-color: color-mix(in srgb, var(--as-accent) 56%, var(--as-border)); background: color-mix(in srgb, var(--as-accent) 5%, var(--as-bg)); box-shadow: 0 0 0 2px color-mix(in srgb, var(--as-accent) 10%, transparent); }
.as-row[data-current="true"] { color: var(--as-faint); }
.as-row[data-subagent="true"] { background: color-mix(in srgb, var(--as-accent) 3%, var(--as-bg)); border-color: color-mix(in srgb, var(--as-accent) 18%, var(--as-border)); }
.as-row[data-subagent="true"]:hover { background: color-mix(in srgb, var(--as-accent) 5%, var(--as-bg)); }
.as-row-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-time { flex: none; color: var(--as-faint); font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.as-badge { flex: none; display: inline-flex; align-items: center; gap: 4px; min-height: 21px; padding: 1px 7px; border: 1px solid var(--as-border); border-radius: 999px; color: var(--as-accent); background: var(--as-bg); font-size: 11px; }
button.as-badge { min-height: 26px; cursor: pointer; font: inherit; font-size: 11px; }
.as-subagent-toggle { padding-inline: 10px; }
.as-icon-button { width: 30px; height: 30px; flex: none; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; color: var(--as-faint); background: transparent; cursor: pointer; transition: color 180ms ease, background 180ms ease, transform 320ms cubic-bezier(.22,1,.36,1); }
.as-icon-button:hover { color: var(--as-text); background: var(--as-soft); }
.as-icon-button[aria-expanded="true"] { color: var(--as-accent); transform: rotate(90deg); }
.as-details-shell { min-height: 0; display: grid; grid-template-rows: 1fr; overflow: hidden; animation: as-detail-open 380ms cubic-bezier(.22,1,.36,1) both; }
.as-details-shell[data-state="closing"] { pointer-events: none; animation: as-detail-close 320ms cubic-bezier(.4,0,.2,1) both; }
.as-details-clip { min-height: 0; overflow: hidden; }
.as-details { min-height: 0; overflow: hidden; padding: 14px 15px; border: 1px solid var(--as-border); border-radius: 12px; background: color-mix(in srgb, var(--as-bg) 96%, var(--as-soft)); box-shadow: var(--as-shadow); }
.as-detail-head { display: flex; align-items: center; justify-content: flex-end; min-height: 28px; margin-bottom: 4px; }
.as-detail-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(145px,1fr)); gap: 8px; }
.as-detail-item { min-height: 38px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 10px; border-radius: 9px; background: var(--as-soft); font-variant-numeric: tabular-nums; }
.as-detail-label { color: var(--as-faint); font-size: 12px; }
.as-section-title { margin: 14px 0 7px; color: var(--as-muted); font-size: 12px; font-weight: 650; }
.as-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.as-chip { padding: 3px 9px; border: 1px solid color-mix(in srgb, var(--as-border) 70%, transparent); border-radius: 999px; color: var(--as-muted); background: var(--as-soft); font-size: 12px; }
.as-fetch-list, .as-file-list { display: grid; gap: 6px; }
.as-fetch-row { min-width: 0; display: flex; gap: 8px; color: var(--as-muted); font-size: 12px; }
.as-fetch-tool { flex: none; color: var(--as-text); font-weight: 550; }
.as-fetch-query { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.as-file-row { min-height: 36px; display: flex; align-items: center; gap: 9px; padding: 5px 8px; border: 1px solid var(--as-border); border-radius: 9px; cursor: pointer; transition: background 140ms ease, border-color 140ms ease; }
.as-file-row:hover { border-color: color-mix(in srgb, var(--as-accent) 38%, var(--as-border)); background: var(--as-soft); }
.as-file-path { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.as-file-tool { flex: none; color: var(--as-faint); font-size: 11px; }
.as-file-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
.as-lineage { display: grid; gap: 7px; }
.as-lineage-row { display: flex; justify-content: space-between; gap: 16px; color: var(--as-muted); font-size: 12px; }
.as-hint { color: var(--as-faint); font-size: 12px; }
.as-error { padding: 9px 11px; border-radius: 9px; color: var(--as-danger); background: color-mix(in srgb, var(--as-danger) 8%, transparent); font-size: 12px; }
.as-empty { min-height: 130px; display: grid; place-items: center; align-content: center; gap: 8px; color: var(--as-faint); text-align: center; }
.as-spinner { width: 18px; height: 18px; border: 2px solid var(--as-border); border-top-color: var(--as-accent); border-radius: 50%; animation: as-spin 700ms linear infinite; }
[data-conversation-manager] button:focus-visible { outline: 2px solid var(--as-accent); outline-offset: 2px; }
[data-conversation-manager] .as-danger { color: var(--as-danger); border-color: color-mix(in srgb, var(--as-danger) 45%, var(--as-border)); }
[data-conversation-manager] .as-danger:hover { background: color-mix(in srgb, var(--as-danger) 8%, transparent); }
@keyframes as-spin { to { transform: rotate(360deg); } }
@keyframes as-row-in { from { opacity: 0; } }
@keyframes as-actions-in { from { opacity: 0; transform: translateX(5px); } }
@keyframes as-detail-open {
  from { grid-template-rows: 0fr; margin-top: 0; opacity: 0; transform: translateY(-5px) scale(.995); }
  to { grid-template-rows: 1fr; margin-top: 12px; opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes as-detail-close {
  from { grid-template-rows: 1fr; margin-top: 12px; opacity: 1; }
  to { grid-template-rows: 0fr; margin-top: 0; opacity: 0; }
}
@media (max-width: 720px) {
  .as-viewbar { align-items: stretch; flex-direction: column; }
  .as-segment { width: 100%; }
  .as-segment button { flex: 1; }
  .as-toolbar { align-items: stretch; }
  .as-toolbar-actions { width: 100%; justify-content: flex-start; }
  .as-batch-actions { flex-wrap: wrap; }
  .as-count { width: 100%; order: 2; }
  .as-time { display: none; }
  .as-row { gap: 7px; padding-inline: 9px; }
  .as-details { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-conversation-manager] *, [data-conversation-manager] *::before, [data-conversation-manager] *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
  .as-row:hover { transform: none; }
}
`;
		//#endregion
		//#region src/client/index.tsx
		const inject = [
			"slots",
			"locale",
			"sessions",
			"workspaces"
		];
		const API_TIMEOUT_MS = 15e3;
		const DETAILS_CACHE_LIMIT = 50;
		const DETAILS_CACHE_TTL_MS = 3e4;
		const DETAILS_CLOSE_FALLBACK_MS = 500;
		function installStyles() {
			const id = "dsh-conversation-manager/styles";
			if (document.querySelector(`style[data-plugin-css=${JSON.stringify(id)}]`) !== null) return () => {};
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-conversation-manager";
			tag.dataset.pluginCss = id;
			tag.textContent = styles;
			document.head.appendChild(tag);
			return () => tag.remove();
		}
		async function api(method, payload, timeoutMs = API_TIMEOUT_MS) {
			const controller = new AbortController();
			const timer = window.setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetch(`/conversation-manager/api/${method}`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(payload ?? {}),
					signal: controller.signal
				});
				let body;
				try {
					body = await response.json();
				} catch {
					throw new Error(`archived API ${method} returned a non-JSON response (${response.status})`);
				}
				if (body === null || typeof body !== "object" || body.ok !== true) throw new Error(body?.error?.message ?? `archived API ${method} failed (${response.status})`);
				return body.value;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") throw new Error(`archived API ${method} timed out`);
				throw error;
			} finally {
				window.clearTimeout(timer);
			}
		}
		function formatBytes(bytes) {
			if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
			if (bytes < 1024) return `${bytes} B`;
			const units = [
				"KB",
				"MB",
				"GB",
				"TB"
			];
			let value = bytes;
			let unit = -1;
			do {
				value /= 1024;
				unit += 1;
			} while (value >= 1024 && unit < units.length - 1);
			return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
		}
		function shortId(id) {
			return id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id;
		}
		function sessionTitleOf(session, fallbackId) {
			if (session === void 0) return fallbackId ? shortId(fallbackId) : "";
			const projected = session.projectionValues?.title;
			if (typeof projected === "string" && projected !== "") return projected;
			if (typeof session.title === "string" && session.title !== "") return session.title;
			if (typeof session.displayTitle === "string" && session.displayTitle !== "") return session.displayTitle;
			return shortId(session.id);
		}
		function sessionParentIdOf(session) {
			return [
				session?.parentId,
				session?.parentSession,
				session?.header?.parentSession,
				session?.meta?.parentSession,
				session?.metadata?.parentSession
			].find((value) => typeof value === "string" && value !== "");
		}
		function isSubagentSession(session) {
			return session?.origin === "subagent" || session?.header?.origin === "subagent";
		}
		function sessionRow(id, session, current, fallbackId = id) {
			const parentId = sessionParentIdOf(session);
			return {
				id,
				title: sessionTitleOf(session, fallbackId),
				updatedAt: session?.updatedAt,
				current,
				subagent: isSubagentSession(session),
				...parentId === void 0 ? {} : { parentId }
			};
		}
		function timeLabel(updatedAt, now, t) {
			const diff = Math.max(0, now - updatedAt);
			const minute = 6e4;
			const hour = minute * 60;
			const day = hour * 24;
			if (diff < minute) return t("time.now");
			const pair = diff < hour ? ["minutes", Math.floor(diff / minute)] : diff < day ? ["hours", Math.floor(diff / hour)] : diff < day * 30 ? ["days", Math.floor(diff / day)] : diff < day * 365 ? ["months", Math.floor(diff / (day * 30))] : ["years", Math.floor(diff / (day * 365))];
			return t(`time.${pair[0]}`).replace("{n}", String(pair[1]));
		}
		function SelectAll({ checked, mixed, disabled, label, onChange }) {
			const ref = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (ref.current !== null) ref.current.indeterminate = mixed;
			}, [mixed]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: "as-select-all",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					ref,
					className: "as-checkbox",
					type: "checkbox",
					checked,
					disabled,
					onChange
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })]
			});
		}
		function SessionRowView({ row, selected, expanded, expandedParent, childCount, now, t, onSelect, onDragStart, onDragEnter, onToggleDetails, onToggleChildren }) {
			const detailsId = `archived-details-${encodeURIComponent(row.id)}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "as-row",
				"data-selected": selected || void 0,
				"data-current": row.current || void 0,
				"data-subagent": row.subagent || void 0,
				onPointerDown: row.current ? void 0 : onDragStart,
				onPointerEnter: row.current ? void 0 : onDragEnter,
				children: [
					row.current ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "as-badge",
						title: t("currentHint"),
						children: t("current")
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						className: "as-checkbox",
						type: "checkbox",
						checked: selected,
						onChange: () => onSelect(!selected),
						"aria-label": t("selectSession").replace("{title}", row.title),
						onPointerDown: (event) => event.stopPropagation()
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "as-row-title",
						title: row.title,
						children: row.title
					}),
					childCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "as-badge as-subagent-toggle",
						title: expandedParent ? t("subagentCollapse") : t("subagentExpand"),
						"aria-label": expandedParent ? t("subagentCollapse") : t("subagentExpand"),
						"aria-expanded": expandedParent,
						onPointerDown: (event) => event.stopPropagation(),
						onClick: () => onToggleChildren(row.id),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, { size: 12 }),
							t("subagent"),
							" · ",
							childCount
						]
					}),
					row.subagent && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "as-badge",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, { size: 12 }), t("subagent")]
					}),
					Number.isFinite(row.updatedAt) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
						className: "as-time",
						dateTime: new Date(row.updatedAt).toISOString(),
						title: new Date(row.updatedAt).toLocaleString(),
						children: timeLabel(row.updatedAt, now, t)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "as-icon-button",
						"aria-label": `${t("details")}: ${row.title}`,
						"aria-expanded": expanded,
						"aria-controls": detailsId,
						onPointerDown: (event) => event.stopPropagation(),
						onClick: () => onToggleDetails(row),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, {})
					})
				]
			});
		}
		function ArchivedSessionsSection({ useSessions, useWorkspaces, refresh, t }) {
			const sessions = useSessions((state) => state);
			const workspaceState = useWorkspaces((state) => state);
			const archivedIds = workspaceState?.archivedSessionIds ?? [];
			const workspaceItems = workspaceState?.items ?? [];
			const byId = sessions?.byId ?? {};
			const current = sessions?.current;
			const [tick, setTick] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				const timer = window.setInterval(() => setTick((value) => value + 1), 6e4);
				return () => window.clearInterval(timer);
			}, []);
			const now = Date.now() + tick * 0;
			const [tab, setTab] = (0, react.useState)("all");
			const [viewMode, setViewMode] = (0, react.useState)("flat");
			const [searchQuery, setSearchQuery] = (0, react.useState)("");
			const [expandedParents, setExpandedParents] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [selected, setSelected] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [expandedIds, setExpandedIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [closingIds, setClosingIds] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const closingTimers = (0, react.useRef)(/* @__PURE__ */ new Map());
			const closingFramesOne = (0, react.useRef)(/* @__PURE__ */ new Map());
			const closingFramesTwo = (0, react.useRef)(/* @__PURE__ */ new Map());
			const [detailsCache, setDetailsCache] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [detailsBusy, setDetailsBusy] = (0, react.useState)(() => /* @__PURE__ */ new Set());
			const [detailsErrors, setDetailsErrors] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [selectedFilesBySession, setSelectedFilesBySession] = (0, react.useState)(() => /* @__PURE__ */ new Map());
			const [mutation, setMutation] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [confirmOpen, setConfirmOpen] = (0, react.useState)(false);
			const [archiveConfirmOpen, setArchiveConfirmOpen] = (0, react.useState)(false);
			const [fileConfirmRow, setFileConfirmRow] = (0, react.useState)(null);
			const [dragMode, setDragMode] = (0, react.useState)(null);
			(0, react.useEffect)(() => () => {
				for (const timer of closingTimers.current.values()) window.clearTimeout(timer);
				for (const frame of closingFramesOne.current.values()) window.cancelAnimationFrame(frame);
				for (const frame of closingFramesTwo.current.values()) window.cancelAnimationFrame(frame);
			}, []);
			(0, react.useEffect)(() => {
				if (dragMode === null) return;
				const finish = () => setDragMode(null);
				window.addEventListener("pointerup", finish);
				window.addEventListener("blur", finish);
				return () => {
					window.removeEventListener("pointerup", finish);
					window.removeEventListener("blur", finish);
				};
			}, [dragMode]);
			const archivedSet = (0, react.useMemo)(() => new Set(archivedIds), [archivedIds]);
			const allRows = (0, react.useMemo)(() => {
				return (tab === "archived" ? archivedIds.map((id) => sessionRow(id, byId[id], id === current)) : Object.entries(byId).flatMap(([id, session]) => archivedSet.has(id) || session.blank ? [] : [sessionRow(id, session, id === current)])).sort((a, b) => a.current !== b.current ? a.current ? -1 : 1 : (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
			}, [
				tab,
				archivedIds,
				archivedSet,
				byId,
				current
			]);
			const rowById = (0, react.useMemo)(() => new Map(allRows.map((row) => [row.id, row])), [allRows]);
			const childCounts = (0, react.useMemo)(() => directChildCounts(allRows), [allRows]);
			const flatRows = (0, react.useMemo)(() => flattenSessionRows(allRows, expandedParents, searchQuery), [
				allRows,
				expandedParents,
				searchQuery
			]);
			const groups = (0, react.useMemo)(() => {
				if (tab !== "all" || viewMode !== "workspace") return [];
				const accounted = /* @__PURE__ */ new Set();
				const result = workspaceItems.flatMap((workspace) => {
					const roots = (workspace.sessionIds ?? []).filter((id) => rowById.has(id));
					const owned = descendantIds(allRows, roots);
					for (const id of owned) accounted.add(id);
					const rows = flattenSessionRows(allRows, expandedParents, searchQuery, roots);
					return rows.length === 0 ? [] : [{
						key: workspace.workspaceId,
						label: workspace.title,
						rows,
						total: owned.size
					}];
				});
				const ungroupedRows = allRows.filter((row) => !accounted.has(row.id));
				const ungrouped = flattenSessionRows(ungroupedRows, expandedParents, searchQuery);
				if (ungrouped.length > 0) result.push({
					key: "__ungrouped__",
					label: t("group.ungrouped"),
					rows: ungrouped,
					total: ungroupedRows.length
				});
				return result;
			}, [
				tab,
				viewMode,
				workspaceItems,
				allRows,
				expandedParents,
				searchQuery,
				rowById,
				t
			]);
			const rows = viewMode === "workspace" && tab === "all" ? groups.flatMap((group) => group.rows) : flatRows;
			const selectableIds = (0, react.useMemo)(() => [...new Set(rows.filter((row) => !row.current).map((row) => row.id))], [rows]);
			const visibleSelected = selectableIds.filter((id) => selected.has(id));
			const allSelected = selectableIds.length > 0 && visibleSelected.length === selectableIds.length;
			const partiallySelected = visibleSelected.length > 0 && !allSelected;
			const loading = (sessions?.phase === "pending" || workspaceState?.state === "loading" || workspaceState?.baselinesReady === false) && rows.length === 0;
			const applySelection = (0, react.useCallback)((id, value) => {
				setSelected((previous) => {
					const next = new Set(previous);
					if (value) next.add(id);
					else next.delete(id);
					return next;
				});
			}, []);
			const onRowPointerDown = (0, react.useCallback)((row, event) => {
				if (event.button !== 0 || event.target.closest("button,input")) return;
				const value = !selected.has(row.id);
				applySelection(row.id, value);
				if (event.pointerType === "mouse") setDragMode(value);
			}, [selected, applySelection]);
			const toggleChildren = (0, react.useCallback)((id) => {
				setExpandedParents((previous) => {
					const next = new Set(previous);
					if (next.has(id)) next.delete(id);
					else next.add(id);
					return next;
				});
			}, []);
			const loadDetails = (0, react.useCallback)(async (row, force = false) => {
				const cached = detailsCache.get(row.id);
				if (!force && cached !== void 0 && Date.now() - cached.fetchedAt < DETAILS_CACHE_TTL_MS) return;
				setDetailsBusy((previous) => new Set(previous).add(row.id));
				setDetailsErrors((previous) => {
					const next = new Map(previous);
					next.delete(row.id);
					return next;
				});
				try {
					const value = await api("details", { sessionId: row.id });
					setDetailsCache((previous) => {
						const next = new Map(previous);
						next.delete(row.id);
						next.set(row.id, {
							value,
							fetchedAt: Date.now()
						});
						while (next.size > DETAILS_CACHE_LIMIT) {
							const oldest = next.keys().next().value;
							if (oldest === void 0) break;
							next.delete(oldest);
						}
						return next;
					});
				} catch (reason) {
					setDetailsErrors((previous) => new Map(previous).set(row.id, reason instanceof Error ? reason.message : String(reason)));
				} finally {
					setDetailsBusy((previous) => {
						const next = new Set(previous);
						next.delete(row.id);
						return next;
					});
				}
			}, [detailsCache]);
			const cancelClosingWork = (0, react.useCallback)((id) => {
				const timer = closingTimers.current.get(id);
				if (timer !== void 0) window.clearTimeout(timer);
				closingTimers.current.delete(id);
				const frameOne = closingFramesOne.current.get(id);
				if (frameOne !== void 0) window.cancelAnimationFrame(frameOne);
				closingFramesOne.current.delete(id);
				const frameTwo = closingFramesTwo.current.get(id);
				if (frameTwo !== void 0) window.cancelAnimationFrame(frameTwo);
				closingFramesTwo.current.delete(id);
			}, []);
			const finishClosingDetails = (0, react.useCallback)((id) => {
				cancelClosingWork(id);
				const frameOne = window.requestAnimationFrame(() => {
					closingFramesOne.current.delete(id);
					const frameTwo = window.requestAnimationFrame(() => {
						closingFramesTwo.current.delete(id);
						setClosingIds((previous) => {
							const next = new Set(previous);
							next.delete(id);
							return next;
						});
					});
					closingFramesTwo.current.set(id, frameTwo);
				});
				closingFramesOne.current.set(id, frameOne);
			}, [cancelClosingWork]);
			const clearSelectedFiles = (0, react.useCallback)((id) => {
				setSelectedFilesBySession((previous) => {
					const next = new Map(previous);
					next.delete(id);
					return next;
				});
			}, []);
			const toggleDetails = (0, react.useCallback)((row) => {
				cancelClosingWork(row.id);
				if (expandedIds.has(row.id)) {
					setExpandedIds((previous) => {
						const next = new Set(previous);
						next.delete(row.id);
						return next;
					});
					setClosingIds((previous) => new Set(previous).add(row.id));
					const timer = window.setTimeout(() => finishClosingDetails(row.id), DETAILS_CLOSE_FALLBACK_MS);
					closingTimers.current.set(row.id, timer);
					clearSelectedFiles(row.id);
					return;
				}
				setClosingIds((previous) => {
					const next = new Set(previous);
					next.delete(row.id);
					return next;
				});
				setExpandedIds((previous) => new Set(previous).add(row.id));
				clearSelectedFiles(row.id);
				loadDetails(row);
			}, [
				expandedIds,
				loadDetails,
				cancelClosingWork,
				finishClosingDetails,
				clearSelectedFiles
			]);
			const batchMessage = (result) => result.failed.length === 0 ? null : `${t("batchResult").replace("{ok}", String(result.succeeded.length)).replace("{fail}", String(result.failed.length))}：${result.failed[0].message} ${t("batchFailedHint")}`;
			const mutateSessions = async (method, targets) => {
				setMutation(method);
				setError(null);
				try {
					const result = await runBatched(targets, (id) => api(method, { sessionId: id }));
					const failures = new Set(result.failed.map((item) => item.id));
					setSelected(failures);
					setDetailsCache((previous) => {
						const next = new Map(previous);
						for (const id of result.succeeded) next.delete(id);
						return next;
					});
					setError(batchMessage(result));
					return result;
				} catch (reason) {
					setError(reason instanceof Error ? reason.message : String(reason));
					return {
						succeeded: [],
						failed: targets.map((id) => ({
							id,
							message: String(reason)
						}))
					};
				} finally {
					try {
						await refresh();
					} catch (reason) {
						setError((previous) => [previous, reason instanceof Error ? reason.message : String(reason)].filter(Boolean).join(" · "));
					} finally {
						setMutation(null);
					}
				}
			};
			const deleteSelected = async () => {
				setConfirmOpen(false);
				await mutateSessions("delete", visibleSelected);
			};
			const archiveSelected = async () => {
				setArchiveConfirmOpen(false);
				await mutateSessions("archive", visibleSelected);
			};
			const unarchiveSelected = async () => {
				await mutateSessions("unarchive", visibleSelected);
			};
			const deleteFiles = async () => {
				const row = fileConfirmRow;
				setFileConfirmRow(null);
				if (row === null) return;
				const known = new Set((detailsCache.get(row.id)?.value.files ?? []).map((file) => file.path));
				const targets = [...selectedFilesBySession.get(row.id) ?? /* @__PURE__ */ new Set()].filter((path) => known.has(path));
				if (targets.length === 0) return;
				setMutation("delete-file");
				setError(null);
				try {
					const result = await runBatched(targets, (path) => api("delete-file", {
						path,
						sessionId: row.id
					}));
					setSelectedFilesBySession((previous) => {
						const next = new Map(previous);
						const failed = new Set(result.failed.map((item) => item.id));
						if (failed.size > 0) next.set(row.id, failed);
						else next.delete(row.id);
						return next;
					});
					setError(batchMessage(result));
					await loadDetails(row, true);
				} finally {
					setMutation(null);
				}
			};
			const switchTab = (next) => {
				for (const timer of closingTimers.current.values()) window.clearTimeout(timer);
				for (const frame of closingFramesOne.current.values()) window.cancelAnimationFrame(frame);
				for (const frame of closingFramesTwo.current.values()) window.cancelAnimationFrame(frame);
				closingTimers.current.clear();
				closingFramesOne.current.clear();
				closingFramesTwo.current.clear();
				setTab(next);
				setSelected(/* @__PURE__ */ new Set());
				setExpandedIds(/* @__PURE__ */ new Set());
				setClosingIds(/* @__PURE__ */ new Set());
				setSearchQuery("");
				setSelectedFilesBySession(/* @__PURE__ */ new Map());
			};
			const onTabKeyDown = (event) => {
				const order = ["all", "archived"];
				let index = order.indexOf(tab);
				if (event.key === "ArrowRight") index = (index + 1) % order.length;
				else if (event.key === "ArrowLeft") index = (index - 1 + order.length) % order.length;
				else if (event.key === "Home") index = 0;
				else if (event.key === "End") index = order.length - 1;
				else return;
				event.preventDefault();
				const next = order[index];
				if (next === void 0) return;
				switchTab(next);
				requestAnimationFrame(() => document.getElementById(`archived-tab-${next}`)?.focus());
			};
			const renderDetails = (row) => {
				const data = detailsCache.get(row.id)?.value;
				const busy = detailsBusy.has(row.id);
				const detailError = detailsErrors.get(row.id);
				const files = (data?.files ?? []).slice(0, 200);
				const stats = data?.stats;
				const tools = stats ? Object.entries(stats.toolCounts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 12) : [];
				const fetches = stats?.fetches ?? [];
				const parent = data?.lineage?.parentSessionId;
				const children = data?.lineage?.children ?? [];
				const selectedFiles = selectedFilesBySession.get(row.id) ?? /* @__PURE__ */ new Set();
				const fileSelectedCount = files.filter((file) => selectedFiles.has(file.path)).length;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					id: `archived-details-${encodeURIComponent(row.id)}`,
					className: "as-details",
					role: "region",
					"aria-label": `${t("details")}: ${row.title}`,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "as-detail-head",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "as-icon-button",
								title: t("detailsRefresh"),
								"aria-label": t("detailsRefresh"),
								disabled: busy,
								onClick: () => void loadDetails(row, true),
								children: "↻"
							})
						}),
						busy && data === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "as-empty",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "as-spinner",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("detailsLoading") })]
						}),
						detailError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "as-error",
							role: "alert",
							children: detailError
						}),
						data !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-detail-grid",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-detail-item",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-detail-label",
										children: t("size")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: formatBytes(data.sizeBytes) })]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-detail-item",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-detail-label",
										children: t("updated")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: data.updatedAt ? timeLabel(data.updatedAt, now, (key) => t(key)) : t("na") })]
								})]
							}),
							stats && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "as-section-title",
								children: t("activity")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-detail-grid",
								children: [
									[t("turns"), stats.turns],
									[t("steps"), stats.steps],
									[t("userMessages"), stats.userMessages],
									[t("assistantMessages"), stats.assistantMessages],
									[t("toolCalls"), stats.toolCalls],
									[t("attachments"), stats.attachments]
								].map(([label, value]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-detail-item",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-detail-label",
										children: label
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: value })]
								}, label))
							})] }),
							tools.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "as-section-title",
								children: t("tools")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-chips",
								children: tools.map(([name, count]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "as-chip",
									children: [
										name,
										" ×",
										String(count)
									]
								}, name))
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "as-section-title",
								children: t("fetches")
							}),
							fetches.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-hint",
								children: t("noFetches")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-fetch-list",
								children: fetches.map((fetch, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-fetch-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-fetch-tool",
										children: fetch.tool
									}), fetch.query && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-fetch-query",
										title: fetch.query,
										children: fetch.query
									})]
								}, `${index}:${fetch.tool}:${fetch.query ?? ""}`))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "as-section-title",
								children: t("files")
							}),
							files.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-hint",
								children: t("noFiles")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-file-list",
								children: files.map((file) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "as-file-row",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "as-checkbox",
											type: "checkbox",
											checked: selectedFiles.has(file.path),
											onChange: () => setSelectedFilesBySession((previous) => {
												const next = new Map(previous);
												const filesForSession = new Set(next.get(row.id) ?? []);
												if (filesForSession.has(file.path)) filesForSession.delete(file.path);
												else filesForSession.add(file.path);
												if (filesForSession.size > 0) next.set(row.id, filesForSession);
												else next.delete(row.id);
												return next;
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "📄"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "as-file-path",
											title: file.path,
											children: file.path
										}),
										file.tool && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "as-file-tool",
											children: file.tool
										})
									]
								}, file.path))
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-file-footer",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									className: "as-danger",
									variant: "outline",
									disabled: fileSelectedCount === 0 || mutation === "delete-file",
									onClick: () => setFileConfirmRow(row),
									children: mutation === "delete-file" ? t("fileDeleting") : `${t("fileDelete")}（${fileSelectedCount}）`
								})
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
								className: "as-section-title",
								children: t("lineage")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-lineage",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-lineage-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-detail-label",
										children: t("parent")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: parent ? byId[parent]?.title ?? shortId(parent) : t("none") })]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "as-lineage-row",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-detail-label",
										children: t("children")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: children.length === 0 ? t("none") : children.map((id) => byId[id]?.title ?? shortId(id)).join("、") })]
								})]
							})
						] })
					]
				});
			};
			const renderRow = (row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "as-row-stack",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionRowView, {
					row,
					selected: selected.has(row.id),
					expanded: expandedIds.has(row.id),
					expandedParent: expandedParents.has(row.id),
					childCount: childCounts.get(row.id) ?? 0,
					now,
					t,
					onSelect: (value) => applySelection(row.id, value),
					onDragStart: (event) => onRowPointerDown(row, event),
					onDragEnter: () => {
						if (dragMode !== null) applySelection(row.id, dragMode);
					},
					onToggleDetails: toggleDetails,
					onToggleChildren: toggleChildren
				}), (expandedIds.has(row.id) || closingIds.has(row.id)) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "as-details-shell",
					"data-state": closingIds.has(row.id) ? "closing" : "open",
					onAnimationEnd: (event) => {
						if (event.currentTarget === event.target && event.animationName === "as-detail-close") finishClosingDetails(row.id);
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "as-details-clip",
						children: renderDetails(row)
					})
				})]
			}, row.id);
			const activeCount = Object.values(byId).filter((session) => !archivedSet.has(session.id) && !session.blank).length;
			const folderCandidate = visibleSelected.length === 1 ? visibleSelected[0] : void 0;
			const fileConfirmCount = fileConfirmRow === null ? 0 : selectedFilesBySession.get(fileConfirmRow.id)?.size ?? 0;
			const panelId = `archived-panel-${tab}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				"data-conversation-manager": true,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "as-heading",
						children: t("title")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "as-tabs",
						role: "tablist",
						"aria-label": t("title"),
						children: ["all", "archived"].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							id: `archived-tab-${item}`,
							type: "button",
							role: "tab",
							className: "as-tab",
							"aria-selected": tab === item,
							"aria-controls": `archived-panel-${item}`,
							tabIndex: tab === item ? 0 : -1,
							onClick: () => switchTab(item),
							onKeyDown: onTabKeyDown,
							children: [t(`tab.${item}`), (item === "all" ? activeCount : archivedIds.length) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "as-tab-count",
								children: item === "all" ? activeCount : archivedIds.length
							})]
						}, item))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						id: panelId,
						role: "tabpanel",
						"aria-labelledby": `archived-tab-${tab}`,
						tabIndex: 0,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-viewbar",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										className: "as-sr-only",
										htmlFor: "archived-search",
										children: t("search")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "archived-search",
										className: "as-search",
										type: "search",
										value: searchQuery,
										"aria-label": t("search"),
										placeholder: t("searchPlaceholder"),
										onChange: (event) => {
											setSearchQuery(event.target.value);
											setSelected(/* @__PURE__ */ new Set());
										}
									}),
									tab === "all" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "as-segment",
										role: "group",
										"aria-label": t("title"),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": viewMode === "flat",
											onClick: () => {
												setViewMode("flat");
												setSelected(/* @__PURE__ */ new Set());
											},
											children: t("view.flat")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": viewMode === "workspace",
											onClick: () => {
												setViewMode("workspace");
												setSelected(/* @__PURE__ */ new Set());
											},
											children: t("view.workspace")
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-toolbar",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SelectAll, {
										checked: allSelected,
										mixed: partiallySelected,
										disabled: selectableIds.length === 0,
										label: t("selectAll"),
										onChange: () => setSelected(allSelected ? /* @__PURE__ */ new Set() : new Set(selectableIds))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "as-count",
										"aria-live": "polite",
										children: t("selected").replace("{n}", String(visibleSelected.length))
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "as-toolbar-actions",
										children: [visibleSelected.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "as-batch-actions",
											role: "group",
											"aria-label": t("selectionActions"),
											children: [tab === "all" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												disabled: mutation !== null,
												onClick: () => setArchiveConfirmOpen(true),
												children: mutation === "archive" ? t("archiving") : t("archive")
											}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												disabled: mutation !== null,
												onClick: () => void unarchiveSelected(),
												children: mutation === "unarchive" ? t("unarchiving") : t("unarchive")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												className: "as-danger",
												variant: "outline",
												disabled: mutation !== null,
												onClick: () => setConfirmOpen(true),
												children: mutation === "delete" ? t("deleting") : t("delete")
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											disabled: folderCandidate === void 0,
											title: folderCandidate === void 0 ? t("openFolderSelectOne") : t("openFolderHint"),
											onClick: () => {
												if (folderCandidate) api("open-folder", { sessionId: folderCandidate }).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, { size: 14 }),
												" ",
												t("openFolder")
											]
										})]
									})
								]
							}),
							error && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-error",
								role: "alert",
								children: error
							}),
							workspaceState?.error && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-error",
								role: "alert",
								children: [
									String(workspaceState.error.message ?? workspaceState.error),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => void refresh(),
										children: t("retry")
									})
								]
							}),
							rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "as-empty",
								children: [loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "as-spinner",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: loading ? t("loading") : t(tab === "all" ? "emptyAll" : "emptyArchived") })]
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "as-list",
								children: viewMode === "workspace" && tab === "all" ? groups.map((group) => {
									const groupId = `group-${encodeURIComponent(group.key)}`;
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
										className: "as-group",
										"aria-labelledby": groupId,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "as-group-header",
											id: groupId,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, { size: 14 }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "as-group-title",
													children: group.label
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "as-group-count",
													children: t("group.sessions").replace("{n}", String(group.total))
												})
											]
										}), group.rows.map(renderRow)]
									}, group.key);
								}) : rows.map(renderRow)
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: confirmOpen,
						onClose: () => {
							if (mutation === null) setConfirmOpen(false);
						},
						closeLabel: t("close"),
						title: t("delete"),
						description: t("confirm").replace("{n}", String(visibleSelected.length)),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => setConfirmOpen(false),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							className: "as-danger",
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => void deleteSelected(),
							children: mutation === "delete" ? t("deleting") : t("delete")
						})] })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: archiveConfirmOpen,
						onClose: () => {
							if (mutation === null) setArchiveConfirmOpen(false);
						},
						closeLabel: t("close"),
						title: t("archive"),
						description: t("archiveConfirm").replace("{n}", String(visibleSelected.length)),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => setArchiveConfirmOpen(false),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => void archiveSelected(),
							children: mutation === "archive" ? t("archiving") : t("archive")
						})] })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: fileConfirmRow !== null,
						onClose: () => {
							if (mutation === null) setFileConfirmRow(null);
						},
						closeLabel: t("close"),
						title: t("fileDelete"),
						description: t("fileDeleteConfirm").replace("{n}", String(fileConfirmCount)),
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => setFileConfirmRow(null),
							children: t("cancel")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							className: "as-danger",
							variant: "outline",
							disabled: mutation !== null,
							onClick: () => void deleteFiles(),
							children: mutation === "delete-file" ? t("fileDeleting") : t("fileDelete")
						})] })
					})
				]
			});
		}
		function refreshStores(ctx) {
			const sessions = ctx.sessions;
			const workspaces = ctx.workspaces;
			return Promise.all([sessions.refresh?.(), workspaces.refresh?.()]).then(() => void 0);
		}
		function apply(ctx) {
			ctx.effect(installStyles, "dsh-conversation-manager: styles");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-conversation-manager: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "conversation-manager",
				order: 200,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({ refresh: () => refreshStores(ctx) })
			}, (props) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ArchivedSessionsSection, {
				...props,
				t
			})));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
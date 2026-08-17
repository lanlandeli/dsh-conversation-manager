export const styles = String.raw`
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
`

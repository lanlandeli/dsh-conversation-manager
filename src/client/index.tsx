// DSH's client stores are pre-1.0 and do not yet expose a stable shared state
// type. This module keeps the runtime boundary defensive while the pure models
// and batch helpers remain strictly typed and unit tested.
// @ts-nocheck

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  IconBranchOutline16,
  IconFolderOpenOutline16,
  IconTriangleRightFill14,
  Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { runBatched } from './batch.js'
import { en, NS, zh } from './i18n.js'
import { descendantIds, directChildCounts, flattenSessionRows } from './model.js'
import type { SessionRow } from './model.js'
import { styles } from './styles.js'

export const inject = ['slots', 'locale', 'sessions', 'workspaces']

const API_TIMEOUT_MS = 15_000
const DETAILS_CACHE_LIMIT = 50
const DETAILS_CACHE_TTL_MS = 30_000
const DETAILS_CLOSE_FALLBACK_MS = 500

function installStyles(): () => void {
  const id = 'dsh-conversation-manager/styles'
  if (document.querySelector(`style[data-plugin-css=${JSON.stringify(id)}]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-conversation-manager'
  tag.dataset.pluginCss = id
  tag.textContent = styles
  document.head.appendChild(tag)
  return () => tag.remove()
}

async function api(method: string, payload: unknown, timeoutMs = API_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`/conversation-manager/api/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
    })
    let body: any
    try {
      body = await response.json()
    } catch {
      throw new Error(`archived API ${method} returned a non-JSON response (${response.status})`)
    }
    if (body === null || typeof body !== 'object' || body.ok !== true) {
      throw new Error(body?.error?.message ?? `archived API ${method} failed (${response.status})`)
    }
    return body.value
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(`archived API ${method} timed out`)
    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

function formatBytes(bytes: unknown): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = -1
  do { value /= 1024; unit += 1 } while (value >= 1024 && unit < units.length - 1)
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`
}

function shortId(id: string): string {
  return id.length > 20 ? `${id.slice(0, 10)}…${id.slice(-4)}` : id
}

function sessionTitleOf(session: any, fallbackId?: string): string {
  if (session === undefined) return fallbackId ? shortId(fallbackId) : ''
  const projected = session.projectionValues?.title
  if (typeof projected === 'string' && projected !== '') return projected
  if (typeof session.title === 'string' && session.title !== '') return session.title
  if (typeof session.displayTitle === 'string' && session.displayTitle !== '') return session.displayTitle
  return shortId(session.id)
}

function sessionParentIdOf(session: any): string | undefined {
  const candidates = [
    session?.parentId,
    session?.parentSession,
    session?.header?.parentSession,
    session?.meta?.parentSession,
    session?.metadata?.parentSession,
  ]
  return candidates.find((value): value is string => typeof value === 'string' && value !== '')
}

function isSubagentSession(session: any): boolean {
  return session?.origin === 'subagent' || session?.header?.origin === 'subagent'
}

function timeLabel(updatedAt: number, now: number, t: (key: string) => string): string {
  const diff = Math.max(0, now - updatedAt)
  const minute = 60_000
  const hour = minute * 60
  const day = hour * 24
  if (diff < minute) return t('time.now')
  const pair = diff < hour ? ['minutes', Math.floor(diff / minute)]
    : diff < day ? ['hours', Math.floor(diff / hour)]
      : diff < day * 30 ? ['days', Math.floor(diff / day)]
        : diff < day * 365 ? ['months', Math.floor(diff / (day * 30))]
          : ['years', Math.floor(diff / (day * 365))]
  return t(`time.${pair[0]}`).replace('{n}', String(pair[1]))
}

function SelectAll({ checked, mixed, disabled, label, onChange }: {
  checked: boolean
  mixed: boolean
  disabled: boolean
  label: string
  onChange: () => void
}): ReactNode {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (ref.current !== null) ref.current.indeterminate = mixed }, [mixed])
  return <label className="as-select-all"><input ref={ref} className="as-checkbox" type="checkbox" checked={checked} disabled={disabled} onChange={onChange} /><span>{label}</span></label>
}

function SessionRowView({ row, selected, expanded, expandedParent, childCount, now, t, onSelect, onDragStart, onDragEnter, onToggleDetails, onToggleChildren }: any): ReactNode {
  const detailsId = `archived-details-${encodeURIComponent(row.id)}`
  return <div
    className="as-row"
    data-selected={selected || undefined}
    data-current={row.current || undefined}
    data-subagent={row.subagent || undefined}
    onPointerDown={row.current ? undefined : onDragStart}
    onPointerEnter={row.current ? undefined : onDragEnter}
  >
    {row.current
      ? <span className="as-badge" title={t('currentHint')}>{t('current')}</span>
      : <input className="as-checkbox" type="checkbox" checked={selected} onChange={() => onSelect(!selected)} aria-label={t('selectSession').replace('{title}', row.title)} onPointerDown={event => event.stopPropagation()} />}
    <span className="as-row-title" title={row.title}>{row.title}</span>
    {childCount > 0 && <button type="button" className="as-badge as-subagent-toggle" title={expandedParent ? t('subagentCollapse') : t('subagentExpand')} aria-label={expandedParent ? t('subagentCollapse') : t('subagentExpand')} aria-expanded={expandedParent} onPointerDown={event => event.stopPropagation()} onClick={() => onToggleChildren(row.id)}><IconBranchOutline16 size={12} />{t('subagent')} · {childCount}</button>}
    {row.subagent && <span className="as-badge"><IconBranchOutline16 size={12} />{t('subagent')}</span>}
    {Number.isFinite(row.updatedAt) && <time className="as-time" dateTime={new Date(row.updatedAt).toISOString()} title={new Date(row.updatedAt).toLocaleString()}>{timeLabel(row.updatedAt, now, t)}</time>}
    <button type="button" className="as-icon-button" aria-label={`${t('details')}: ${row.title}`} aria-expanded={expanded} aria-controls={detailsId} onPointerDown={event => event.stopPropagation()} onClick={() => onToggleDetails(row)}><IconTriangleRightFill14 /></button>
  </div>
}

function ArchivedSessionsSection({ useSessions, useWorkspaces, refresh, t }: any): ReactNode {
  const sessions = useSessions((state: any) => state)
  const workspaceState = useWorkspaces((state: any) => state)
  const archivedIds: string[] = workspaceState?.archivedSessionIds ?? []
  const workspaceItems: any[] = workspaceState?.items ?? []
  const byId = sessions?.byId ?? {}
  const current = sessions?.current
  const [tick, setTick] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setTick(value => value + 1), 60_000); return () => window.clearInterval(timer) }, [])
  const now = Date.now() + tick * 0

  const [tab, setTab] = useState<'all' | 'archived'>('all')
  const [viewMode, setViewMode] = useState<'flat' | 'workspace'>('flat')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [closingIds, setClosingIds] = useState<Set<string>>(() => new Set())
  const closingTimers = useRef<Map<string, number>>(new Map())
  const closingFramesOne = useRef<Map<string, number>>(new Map())
  const closingFramesTwo = useRef<Map<string, number>>(new Map())
  const [detailsCache, setDetailsCache] = useState<Map<string, { value: any; fetchedAt: number }>>(() => new Map())
  const [detailsBusy, setDetailsBusy] = useState<Set<string>>(() => new Set())
  const [detailsErrors, setDetailsErrors] = useState<Map<string, string>>(() => new Map())
  const [selectedFilesBySession, setSelectedFilesBySession] = useState<Map<string, Set<string>>>(() => new Map())
  const [mutation, setMutation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false)
  const [fileConfirmRow, setFileConfirmRow] = useState<SessionRow | null>(null)
  const [dragMode, setDragMode] = useState<boolean | null>(null)

  useEffect(() => () => {
    for (const timer of closingTimers.current.values()) window.clearTimeout(timer)
    for (const frame of closingFramesOne.current.values()) window.cancelAnimationFrame(frame)
    for (const frame of closingFramesTwo.current.values()) window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (dragMode === null) return
    const finish = (): void => setDragMode(null)
    window.addEventListener('pointerup', finish)
    window.addEventListener('blur', finish)
    return () => { window.removeEventListener('pointerup', finish); window.removeEventListener('blur', finish) }
  }, [dragMode])

  const archivedSet = useMemo(() => new Set(archivedIds), [archivedIds])
  const allRows = useMemo<SessionRow[]>(() => {
    const rows: SessionRow[] = tab === 'archived'
      ? archivedIds.map(id => ({ id, title: sessionTitleOf(byId[id], id), updatedAt: byId[id]?.updatedAt, current: id === current, subagent: isSubagentSession(byId[id]), parentId: sessionParentIdOf(byId[id]) }))
      : Object.entries(byId).flatMap(([id, session]: any) => archivedSet.has(id) || session.blank ? [] : [{ id, title: sessionTitleOf(session), updatedAt: session.updatedAt, current: id === current, subagent: isSubagentSession(session), parentId: sessionParentIdOf(session) }])
    return rows.sort((a, b) => a.current !== b.current ? (a.current ? -1 : 1) : (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
  }, [tab, archivedIds, archivedSet, byId, current])
  const rowById = useMemo(() => new Map(allRows.map(row => [row.id, row])), [allRows])
  const childCounts = useMemo(() => directChildCounts(allRows), [allRows])
  const flatRows = useMemo(() => flattenSessionRows(allRows, expandedParents, searchQuery), [allRows, expandedParents, searchQuery])
  const groups = useMemo(() => {
    if (tab !== 'all' || viewMode !== 'workspace') return []
    const accounted = new Set<string>()
    const result = workspaceItems.flatMap(workspace => {
      const roots = (workspace.sessionIds ?? []).filter((id: string) => rowById.has(id))
      const owned = descendantIds(allRows, roots)
      for (const id of owned) accounted.add(id)
      const rows = flattenSessionRows(allRows, expandedParents, searchQuery, roots)
      return rows.length === 0 ? [] : [{ key: workspace.workspaceId, label: workspace.title, rows, total: owned.size }]
    })
    const ungroupedRows = allRows.filter(row => !accounted.has(row.id))
    const ungrouped = flattenSessionRows(ungroupedRows, expandedParents, searchQuery)
    if (ungrouped.length > 0) result.push({ key: '__ungrouped__', label: t('group.ungrouped'), rows: ungrouped, total: ungroupedRows.length })
    return result
  }, [tab, viewMode, workspaceItems, allRows, expandedParents, searchQuery, rowById, t])
  const rows = viewMode === 'workspace' && tab === 'all' ? groups.flatMap(group => group.rows) : flatRows
  const selectableIds = useMemo(() => [...new Set(rows.filter(row => !row.current).map(row => row.id))], [rows])
  const visibleSelected = selectableIds.filter(id => selected.has(id))
  const allSelected = selectableIds.length > 0 && visibleSelected.length === selectableIds.length
  const partiallySelected = visibleSelected.length > 0 && !allSelected
  const loading = (sessions?.phase === 'pending' || workspaceState?.state === 'loading' || workspaceState?.baselinesReady === false) && rows.length === 0

  const applySelection = useCallback((id: string, value: boolean) => {
    setSelected(previous => { const next = new Set(previous); if (value) next.add(id); else next.delete(id); return next })
  }, [])
  const onRowPointerDown = useCallback((row: SessionRow, event: any) => {
    if (event.button !== 0 || event.target.closest('button,input')) return
    const value = !selected.has(row.id)
    applySelection(row.id, value)
    if (event.pointerType === 'mouse') setDragMode(value)
  }, [selected, applySelection])
  const toggleChildren = useCallback((id: string) => {
    setExpandedParents(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  const loadDetails = useCallback(async (row: SessionRow, force = false) => {
    const cached = detailsCache.get(row.id)
    if (!force && cached !== undefined && Date.now() - cached.fetchedAt < DETAILS_CACHE_TTL_MS) return
    setDetailsBusy(previous => new Set(previous).add(row.id))
    setDetailsErrors(previous => { const next = new Map(previous); next.delete(row.id); return next })
    try {
      const value = await api('details', { sessionId: row.id })
      setDetailsCache(previous => {
        const next = new Map(previous)
        next.delete(row.id)
        next.set(row.id, { value, fetchedAt: Date.now() })
        while (next.size > DETAILS_CACHE_LIMIT) next.delete(next.keys().next().value)
        return next
      })
    } catch (reason) {
      setDetailsErrors(previous => new Map(previous).set(row.id, reason instanceof Error ? reason.message : String(reason)))
    } finally {
      setDetailsBusy(previous => { const next = new Set(previous); next.delete(row.id); return next })
    }
  }, [detailsCache])
  const cancelClosingWork = useCallback((id: string) => {
    const timer = closingTimers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    closingTimers.current.delete(id)
    const frameOne = closingFramesOne.current.get(id)
    if (frameOne !== undefined) window.cancelAnimationFrame(frameOne)
    closingFramesOne.current.delete(id)
    const frameTwo = closingFramesTwo.current.get(id)
    if (frameTwo !== undefined) window.cancelAnimationFrame(frameTwo)
    closingFramesTwo.current.delete(id)
  }, [])
  const finishClosingDetails = useCallback((id: string) => {
    cancelClosingWork(id)
    const frameOne = window.requestAnimationFrame(() => {
      closingFramesOne.current.delete(id)
      const frameTwo = window.requestAnimationFrame(() => {
        closingFramesTwo.current.delete(id)
        setClosingIds(previous => { const next = new Set(previous); next.delete(id); return next })
      })
      closingFramesTwo.current.set(id, frameTwo)
    })
    closingFramesOne.current.set(id, frameOne)
  }, [cancelClosingWork])
  const clearSelectedFiles = useCallback((id: string) => {
    setSelectedFilesBySession(previous => { const next = new Map(previous); next.delete(id); return next })
  }, [])
  const toggleDetails = useCallback((row: SessionRow) => {
    cancelClosingWork(row.id)
    if (expandedIds.has(row.id)) {
      setExpandedIds(previous => { const next = new Set(previous); next.delete(row.id); return next })
      setClosingIds(previous => new Set(previous).add(row.id))
      const timer = window.setTimeout(() => finishClosingDetails(row.id), DETAILS_CLOSE_FALLBACK_MS)
      closingTimers.current.set(row.id, timer)
      clearSelectedFiles(row.id)
      return
    }
    setClosingIds(previous => { const next = new Set(previous); next.delete(row.id); return next })
    setExpandedIds(previous => new Set(previous).add(row.id))
    clearSelectedFiles(row.id)
    void loadDetails(row)
  }, [expandedIds, loadDetails, cancelClosingWork, finishClosingDetails, clearSelectedFiles])

  const batchMessage = (result: any): string | null => result.failed.length === 0 ? null : `${t('batchResult').replace('{ok}', String(result.succeeded.length)).replace('{fail}', String(result.failed.length))}：${result.failed[0].message} ${t('batchFailedHint')}`
  const mutateSessions = async (method: string, targets: string[]): Promise<any> => {
    setMutation(method)
    setError(null)
    try {
      const result = await runBatched(targets, id => api(method, { sessionId: id }))
      const failures = new Set(result.failed.map(item => item.id))
      setSelected(failures)
      setDetailsCache(previous => { const next = new Map(previous); for (const id of result.succeeded) next.delete(id); return next })
      setError(batchMessage(result))
      return result
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
      return { succeeded: [], failed: targets.map(id => ({ id, message: String(reason) })) }
    } finally {
      try {
        await refresh()
      } catch (reason) {
        setError(previous => [previous, reason instanceof Error ? reason.message : String(reason)].filter(Boolean).join(' · '))
      } finally {
        setMutation(null)
      }
    }
  }
  const deleteSelected = async (): Promise<void> => { setConfirmOpen(false); await mutateSessions('delete', visibleSelected) }
  const archiveSelected = async (): Promise<void> => { setArchiveConfirmOpen(false); await mutateSessions('archive', visibleSelected) }
  const unarchiveSelected = async (): Promise<void> => { await mutateSessions('unarchive', visibleSelected) }

  const deleteFiles = async (): Promise<void> => {
    const row = fileConfirmRow
    setFileConfirmRow(null)
    if (row === null) return
    const known = new Set((detailsCache.get(row.id)?.value.files ?? []).map((file: any) => file.path))
    const selectedFiles = selectedFilesBySession.get(row.id) ?? new Set<string>()
    const targets = [...selectedFiles].filter(path => known.has(path))
    if (targets.length === 0) return
    setMutation('delete-file')
    setError(null)
    try {
      const result = await runBatched(targets, path => api('delete-file', { path, sessionId: row.id }))
      setSelectedFilesBySession(previous => {
        const next = new Map(previous)
        const failed = new Set(result.failed.map(item => item.id))
        if (failed.size > 0) next.set(row.id, failed)
        else next.delete(row.id)
        return next
      })
      setError(batchMessage(result))
      await loadDetails(row, true)
    } finally {
      setMutation(null)
    }
  }

  const switchTab = (next: 'all' | 'archived'): void => {
    for (const timer of closingTimers.current.values()) window.clearTimeout(timer)
    for (const frame of closingFramesOne.current.values()) window.cancelAnimationFrame(frame)
    for (const frame of closingFramesTwo.current.values()) window.cancelAnimationFrame(frame)
    closingTimers.current.clear()
    closingFramesOne.current.clear()
    closingFramesTwo.current.clear()
    setTab(next)
    setSelected(new Set())
    setExpandedIds(new Set())
    setClosingIds(new Set())
    setSearchQuery('')
    setSelectedFilesBySession(new Map())
  }
  const onTabKeyDown = (event: any): void => {
    const order: Array<'all' | 'archived'> = ['all', 'archived']
    let index = order.indexOf(tab)
    if (event.key === 'ArrowRight') index = (index + 1) % order.length
    else if (event.key === 'ArrowLeft') index = (index - 1 + order.length) % order.length
    else if (event.key === 'Home') index = 0
    else if (event.key === 'End') index = order.length - 1
    else return
    event.preventDefault()
    const next = order[index]
    switchTab(next)
    requestAnimationFrame(() => document.getElementById(`archived-tab-${next}`)?.focus())
  }

  const renderDetails = (row: SessionRow): ReactNode => {
    const entry = detailsCache.get(row.id)
    const data = entry?.value
    const busy = detailsBusy.has(row.id)
    const detailError = detailsErrors.get(row.id)
    const files = (data?.files ?? []).slice(0, 200)
    const stats = data?.stats
    const tools = stats ? Object.entries(stats.toolCounts ?? {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 12) : []
    const fetches = stats?.fetches ?? []
    const parent = data?.lineage?.parentSessionId
    const children: string[] = data?.lineage?.children ?? []
    const selectedFiles = selectedFilesBySession.get(row.id) ?? new Set<string>()
    const fileSelectedCount = files.filter((file: any) => selectedFiles.has(file.path)).length
    return <section id={`archived-details-${encodeURIComponent(row.id)}`} className="as-details" role="region" aria-label={`${t('details')}: ${row.title}`}>
      <div className="as-detail-head"><button type="button" className="as-icon-button" title={t('detailsRefresh')} aria-label={t('detailsRefresh')} disabled={busy} onClick={() => void loadDetails(row, true)}>↻</button></div>
      {busy && data === undefined && <div className="as-empty"><span className="as-spinner" aria-hidden="true" /><span>{t('detailsLoading')}</span></div>}
      {detailError && <div className="as-error" role="alert">{detailError}</div>}
      {data !== undefined && <>
        <div className="as-detail-grid"><div className="as-detail-item"><span className="as-detail-label">{t('size')}</span><strong>{formatBytes(data.sizeBytes)}</strong></div><div className="as-detail-item"><span className="as-detail-label">{t('updated')}</span><strong>{data.updatedAt ? timeLabel(data.updatedAt, now, t) : t('na')}</strong></div></div>
        {stats && <><h3 className="as-section-title">{t('activity')}</h3><div className="as-detail-grid">{[[t('turns'),stats.turns],[t('steps'),stats.steps],[t('userMessages'),stats.userMessages],[t('assistantMessages'),stats.assistantMessages],[t('toolCalls'),stats.toolCalls],[t('attachments'),stats.attachments]].map(([label,value]) => <div className="as-detail-item" key={label}><span className="as-detail-label">{label}</span><strong>{value}</strong></div>)}</div></>}
        {tools.length > 0 && <><h3 className="as-section-title">{t('tools')}</h3><div className="as-chips">{tools.map(([name,count]) => <span className="as-chip" key={name}>{name} ×{count}</span>)}</div></>}
        <h3 className="as-section-title">{t('fetches')}</h3>
        {fetches.length === 0 ? <div className="as-hint">{t('noFetches')}</div> : <div className="as-fetch-list">{fetches.map((fetch: any, index: number) => <div className="as-fetch-row" key={`${index}:${fetch.tool}:${fetch.query ?? ''}`}><span className="as-fetch-tool">{fetch.tool}</span>{fetch.query && <span className="as-fetch-query" title={fetch.query}>{fetch.query}</span>}</div>)}</div>}
        <h3 className="as-section-title">{t('files')}</h3>
        {files.length === 0 ? <div className="as-hint">{t('noFiles')}</div> : <><div className="as-file-list">{files.map((file: any) => <label className="as-file-row" key={file.path}><input className="as-checkbox" type="checkbox" checked={selectedFiles.has(file.path)} onChange={() => setSelectedFilesBySession(previous => {
          const next = new Map(previous)
          const filesForSession = new Set(next.get(row.id) ?? [])
          if (filesForSession.has(file.path)) filesForSession.delete(file.path)
          else filesForSession.add(file.path)
          if (filesForSession.size > 0) next.set(row.id, filesForSession)
          else next.delete(row.id)
          return next
        })} /><span aria-hidden="true">📄</span><span className="as-file-path" title={file.path}>{file.path}</span>{file.tool && <span className="as-file-tool">{file.tool}</span>}</label>)}</div><div className="as-file-footer"><Button className="as-danger" variant="outline" disabled={fileSelectedCount === 0 || mutation === 'delete-file'} onClick={() => setFileConfirmRow(row)}>{mutation === 'delete-file' ? t('fileDeleting') : `${t('fileDelete')}（${fileSelectedCount}）`}</Button></div></>}
        <h3 className="as-section-title">{t('lineage')}</h3><div className="as-lineage"><div className="as-lineage-row"><span className="as-detail-label">{t('parent')}</span><span>{parent ? byId[parent]?.title ?? shortId(parent) : t('none')}</span></div><div className="as-lineage-row"><span className="as-detail-label">{t('children')}</span><span>{children.length === 0 ? t('none') : children.map(id => byId[id]?.title ?? shortId(id)).join('、')}</span></div></div>
      </>}
    </section>
  }

  const renderRow = (row: SessionRow): ReactNode => <div className="as-row-stack" key={row.id}>
    <SessionRowView row={row} selected={selected.has(row.id)} expanded={expandedIds.has(row.id)} expandedParent={expandedParents.has(row.id)} childCount={childCounts.get(row.id) ?? 0} now={now} t={t} onSelect={(value: boolean) => applySelection(row.id, value)} onDragStart={(event: any) => onRowPointerDown(row, event)} onDragEnter={() => { if (dragMode !== null) applySelection(row.id, dragMode) }} onToggleDetails={toggleDetails} onToggleChildren={toggleChildren} />
    {(expandedIds.has(row.id) || closingIds.has(row.id)) && <div className="as-details-shell" data-state={closingIds.has(row.id) ? 'closing' : 'open'} onAnimationEnd={event => { if (event.currentTarget === event.target && event.animationName === 'as-detail-close') finishClosingDetails(row.id) }}><div className="as-details-clip">{renderDetails(row)}</div></div>}
  </div>

  const activeCount = Object.values(byId).filter((session: any) => !archivedSet.has(session.id) && !session.blank).length
  const folderCandidate = visibleSelected.length === 1 ? visibleSelected[0] : undefined
  const fileConfirmCount = fileConfirmRow === null ? 0 : selectedFilesBySession.get(fileConfirmRow.id)?.size ?? 0
  const panelId = `archived-panel-${tab}`
  return <div data-conversation-manager>
    <div className="as-heading">{t('title')}</div>
    <div className="as-tabs" role="tablist" aria-label={t('title')}>
      {(['all','archived'] as const).map(item => <button id={`archived-tab-${item}`} type="button" role="tab" className="as-tab" aria-selected={tab === item} aria-controls={`archived-panel-${item}`} tabIndex={tab === item ? 0 : -1} onClick={() => switchTab(item)} onKeyDown={onTabKeyDown} key={item}>{t(`tab.${item}`)}{(item === 'all' ? activeCount : archivedIds.length) > 0 && <span className="as-tab-count">{item === 'all' ? activeCount : archivedIds.length}</span>}</button>)}
    </div>
    <div id={panelId} role="tabpanel" aria-labelledby={`archived-tab-${tab}`} tabIndex={0}>
      <div className="as-viewbar"><label className="as-sr-only" htmlFor="archived-search">{t('search')}</label><input id="archived-search" className="as-search" type="search" value={searchQuery} aria-label={t('search')} placeholder={t('searchPlaceholder')} onChange={event => { setSearchQuery(event.target.value); setSelected(new Set()) }} />{tab === 'all' && <div className="as-segment" role="group" aria-label={t('title')}><button type="button" aria-pressed={viewMode === 'flat'} onClick={() => { setViewMode('flat'); setSelected(new Set()) }}>{t('view.flat')}</button><button type="button" aria-pressed={viewMode === 'workspace'} onClick={() => { setViewMode('workspace'); setSelected(new Set()) }}>{t('view.workspace')}</button></div>}</div>
      <div className="as-toolbar"><SelectAll checked={allSelected} mixed={partiallySelected} disabled={selectableIds.length === 0} label={t('selectAll')} onChange={() => setSelected(allSelected ? new Set() : new Set(selectableIds))} /><span className="as-count" aria-live="polite">{t('selected').replace('{n}', String(visibleSelected.length))}</span><div className="as-toolbar-actions">{visibleSelected.length > 0 && <div className="as-batch-actions" role="group" aria-label={t('selectionActions')}>{tab === 'all' ? <Button variant="outline" disabled={mutation !== null} onClick={() => setArchiveConfirmOpen(true)}>{mutation === 'archive' ? t('archiving') : t('archive')}</Button> : <Button variant="outline" disabled={mutation !== null} onClick={() => void unarchiveSelected()}>{mutation === 'unarchive' ? t('unarchiving') : t('unarchive')}</Button>}<Button className="as-danger" variant="outline" disabled={mutation !== null} onClick={() => setConfirmOpen(true)}>{mutation === 'delete' ? t('deleting') : t('delete')}</Button></div>}<Button variant="outline" disabled={folderCandidate === undefined} title={folderCandidate === undefined ? t('openFolderSelectOne') : t('openFolderHint')} onClick={() => { if (folderCandidate) void api('open-folder', { sessionId: folderCandidate }).catch(reason => setError(reason instanceof Error ? reason.message : String(reason))) }}><IconFolderOpenOutline16 size={14} /> {t('openFolder')}</Button></div></div>
      {error && <div className="as-error" role="alert">{error}</div>}
      {workspaceState?.error && <div className="as-error" role="alert">{String(workspaceState.error.message ?? workspaceState.error)} <button type="button" onClick={() => void refresh()}>{t('retry')}</button></div>}
      {rows.length === 0 ? <div className="as-empty">{loading && <span className="as-spinner" aria-hidden="true" />}<span>{loading ? t('loading') : t(tab === 'all' ? 'emptyAll' : 'emptyArchived')}</span></div> : <div className="as-list">{viewMode === 'workspace' && tab === 'all' ? groups.map(group => { const groupId = `group-${encodeURIComponent(group.key)}`; return <section className="as-group" aria-labelledby={groupId} key={group.key}><div className="as-group-header" id={groupId}><IconFolderOpenOutline16 size={14} /><span className="as-group-title">{group.label}</span><span className="as-group-count">{t('group.sessions').replace('{n}', String(group.total))}</span></div>{group.rows.map(renderRow)}</section> }) : rows.map(renderRow)}</div>}
    </div>
    <Modal open={confirmOpen} onClose={() => { if (mutation === null) setConfirmOpen(false) }} closeLabel={t('close')} title={t('delete')} description={t('confirm').replace('{n}', String(visibleSelected.length))} footer={<><Button variant="outline" disabled={mutation !== null} onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button><Button className="as-danger" variant="outline" disabled={mutation !== null} onClick={() => void deleteSelected()}>{mutation === 'delete' ? t('deleting') : t('delete')}</Button></>} />
    <Modal open={archiveConfirmOpen} onClose={() => { if (mutation === null) setArchiveConfirmOpen(false) }} closeLabel={t('close')} title={t('archive')} description={t('archiveConfirm').replace('{n}', String(visibleSelected.length))} footer={<><Button variant="outline" disabled={mutation !== null} onClick={() => setArchiveConfirmOpen(false)}>{t('cancel')}</Button><Button variant="outline" disabled={mutation !== null} onClick={() => void archiveSelected()}>{mutation === 'archive' ? t('archiving') : t('archive')}</Button></>} />
    <Modal open={fileConfirmRow !== null} onClose={() => { if (mutation === null) setFileConfirmRow(null) }} closeLabel={t('close')} title={t('fileDelete')} description={t('fileDeleteConfirm').replace('{n}', String(fileConfirmCount))} footer={<><Button variant="outline" disabled={mutation !== null} onClick={() => setFileConfirmRow(null)}>{t('cancel')}</Button><Button className="as-danger" variant="outline" disabled={mutation !== null} onClick={() => void deleteFiles()}>{mutation === 'delete-file' ? t('fileDeleting') : t('fileDelete')}</Button></>} />
  </div>
}

export function apply(ctx: any): void {
  ctx.effect(installStyles, 'dsh-conversation-manager: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-conversation-manager: dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'conversation-manager',
    order: 200,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({
      refresh: async () => { await ctx.sessions.refresh(); await ctx.workspaces.refresh() },
    }),
  }, (props: any) => <ArchivedSessionsSection {...props} t={t} />))
}

export interface SessionRow {
  id: string
  title: string
  updatedAt?: number
  current: boolean
  subagent: boolean
  parentId?: string
}

function newestFirst(a: SessionRow, b: SessionRow): number {
  if (a.current !== b.current) return a.current ? -1 : 1
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
}

export function directChildCounts(rows: readonly SessionRow[]): Map<string, number> {
  const ids = new Set(rows.map(row => row.id))
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!row.subagent || row.parentId === undefined || !ids.has(row.parentId)) continue
    counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1)
  }
  return counts
}

export function descendantIds(rows: readonly SessionRow[], rootIds: readonly string[]): Set<string> {
  const children = new Map<string, string[]>()
  for (const row of rows) {
    if (row.parentId === undefined) continue
    const list = children.get(row.parentId) ?? []
    list.push(row.id)
    children.set(row.parentId, list)
  }
  const result = new Set<string>()
  const visit = (id: string): void => {
    if (result.has(id)) return
    result.add(id)
    for (const child of children.get(id) ?? []) visit(child)
  }
  for (const id of rootIds) visit(id)
  return result
}

/**
 * Flattens the full parent/subagent tree. Search includes matching rows plus
 * their ancestors and automatically expands those paths so matching nested
 * subagents never disappear behind a filtered-out parent.
 */
export function flattenSessionRows(
  rows: readonly SessionRow[],
  expandedParents: ReadonlySet<string>,
  query = '',
  requestedRoots?: readonly string[],
): SessionRow[] {
  const rowById = new Map(rows.map(row => [row.id, row]))
  const children = new Map<string, SessionRow[]>()
  for (const row of rows) {
    if (row.parentId === undefined || !rowById.has(row.parentId)) continue
    const list = children.get(row.parentId) ?? []
    list.push(row)
    children.set(row.parentId, list)
  }
  for (const list of children.values()) list.sort(newestFirst)

  const normalized = query.trim().toLocaleLowerCase()
  const included = new Set<string>()
  if (normalized !== '') {
    for (const row of rows) {
      if (!row.title.toLocaleLowerCase().includes(normalized) && !row.id.toLocaleLowerCase().includes(normalized)) continue
      let cursor: SessionRow | undefined = row
      const chain = new Set<string>()
      while (cursor !== undefined && !chain.has(cursor.id)) {
        chain.add(cursor.id)
        included.add(cursor.id)
        cursor = cursor.parentId === undefined ? undefined : rowById.get(cursor.parentId)
      }
    }
  }

  const roots = requestedRoots === undefined
    ? rows.filter(row => row.parentId === undefined || !rowById.has(row.parentId)).sort(newestFirst).map(row => row.id)
    : [...requestedRoots]

  // Keep track of rows that belong to a valid root-to-child path regardless of
  // expansion state. This lets the damaged-data fallback below surface cycles
  // without accidentally appending ordinary collapsed children as new roots.
  const structurallyReachable = new Set<string>()
  const markReachable = (id: string): void => {
    if (structurallyReachable.has(id)) return
    structurallyReachable.add(id)
    for (const child of children.get(id) ?? []) markReachable(child.id)
  }
  for (const id of roots) markReachable(id)

  const result: SessionRow[] = []
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visited.has(id)) return
    const row = rowById.get(id)
    if (row === undefined) return
    visited.add(id)
    if (normalized !== '' && !included.has(id)) return
    result.push(row)
    if (normalized === '' && !expandedParents.has(id)) return
    for (const child of children.get(id) ?? []) visit(child.id)
  }
  for (const root of roots) visit(root)
  // Cycles have no root, so give them a visible recovery path. For scoped
  // workspace calls, do not append sessions from other workspaces.
  if (requestedRoots === undefined) {
    for (const row of [...rows].sort(newestFirst)) {
      if (!structurallyReachable.has(row.id) && !visited.has(row.id) && (normalized === '' || included.has(row.id))) visit(row.id)
    }
  }
  return result
}

import { describe, expect, it } from 'vitest'
import { directChildCounts, flattenSessionRows } from '../src/client/model.js'
import type { SessionRow } from '../src/client/model.js'

const rows: SessionRow[] = [
  { id: 'root', title: 'Main conversation', current: false, subagent: false },
  { id: 'child', title: 'Research worker', current: false, subagent: true, parentId: 'root' },
  { id: 'grandchild', title: 'Unique nested result', current: false, subagent: true, parentId: 'child' },
]

describe('session row model', () => {
  it('keeps subagents hidden until their parent is explicitly expanded', () => {
    expect(flattenSessionRows(rows, new Set()).map(row => row.id)).toEqual(['root'])
  })

  it('supports arbitrarily nested expanded subagents', () => {
    expect(flattenSessionRows(rows, new Set(['root', 'child'])).map(row => row.id)).toEqual(['root', 'child', 'grandchild'])
  })

  it('keeps a matching nested subagent visible with its ancestors during search', () => {
    expect(flattenSessionRows(rows, new Set(), 'unique').map(row => row.id)).toEqual(['root', 'child', 'grandchild'])
  })

  it('counts children only from the current tab row set', () => {
    expect(directChildCounts(rows).get('root')).toBe(1)
    expect(directChildCounts(rows.slice(0, 1)).get('root')).toBeUndefined()
  })

  it('does not loop forever on damaged cyclic lineage', () => {
    const cyclic: SessionRow[] = [
      { id: 'a', title: 'A', current: false, subagent: true, parentId: 'b' },
      { id: 'b', title: 'B', current: false, subagent: true, parentId: 'a' },
    ]
    expect(flattenSessionRows(cyclic, new Set(['a', 'b'])).map(row => row.id).sort()).toEqual(['a', 'b'])
  })
})

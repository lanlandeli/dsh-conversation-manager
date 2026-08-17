import { describe, expect, it } from 'vitest'
import { runBatched } from '../src/client/batch.js'

describe('runBatched', () => {
  it('keeps per-item success and failure results', async () => {
    const result = await runBatched(['a', 'b', 'c'], async id => {
      if (id === 'b') throw new Error('blocked')
    }, 2)
    expect(result.succeeded).toEqual(['a', 'c'])
    expect(result.failed).toEqual([{ id: 'b', message: 'blocked' }])
  })
})

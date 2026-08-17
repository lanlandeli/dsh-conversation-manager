export interface BatchFailure {
  id: string
  message: string
}

export interface BatchResult {
  succeeded: string[]
  failed: BatchFailure[]
}

export async function runBatched(
  ids: readonly string[],
  operation: (id: string) => Promise<unknown>,
  batchSize = 20,
): Promise<BatchResult> {
  const succeeded: string[] = []
  const failed: BatchFailure[] = []
  for (let offset = 0; offset < ids.length; offset += batchSize) {
    const chunk = ids.slice(offset, offset + batchSize)
    const settled = await Promise.allSettled(chunk.map(id => operation(id)))
    settled.forEach((result, index) => {
      const id = chunk[index]
      if (id === undefined) return
      if (result.status === 'fulfilled') succeeded.push(id)
      else failed.push({ id, message: result.reason instanceof Error ? result.reason.message : String(result.reason) })
    })
  }
  return { succeeded, failed }
}

import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { isStrictlyInside, requireSessionId, resolveProducedPath, resolveSafeArtifactContainer, resolveSafeArtifactDirectory, resolveSafeRegularFile } from '../src/server/path-security.js'

const created: string[] = []
afterEach(async () => { await Promise.all(created.splice(0).map(path => rm(path, { recursive: true, force: true }))) })

describe('path security', () => {
  it('requires a bounded session id', () => {
    expect(() => requireSessionId(undefined)).toThrow(/required/)
    expect(() => requireSessionId('x'.repeat(201))).toThrow(/too long/)
    expect(requireSessionId('session-1')).toBe('session-1')
  })

  it('resolves relative output paths from the owning session cwd', () => {
    const result = resolveProducedPath('reports/result.txt', 'C:\\work\\project')
    expect(result.toLowerCase()).toContain('work')
    expect(result.toLowerCase()).toContain('reports')
  })

  it('rejects roots and traversal siblings', () => {
    expect(isStrictlyInside('/workspace', '/workspace')).toBe(false)
    expect(isStrictlyInside('/workspace', '/workspace/file.txt')).toBe(true)
    expect(isStrictlyInside('/workspace', '/workspace-other/file.txt')).toBe(false)
  })

  it('allows only a real regular file inside a registered workspace', async () => {
    const root = await mkdtemp(join(tmpdir(), 'archived-safe-'))
    created.push(root)
    await mkdir(join(root, 'out'))
    await writeFile(join(root, 'out', 'result.txt'), 'ok')
    await expect(resolveSafeRegularFile('out/result.txt', root, [root])).resolves.toBe(join(root, 'out', 'result.txt'))
  })

  it('rejects symbolic-link deletion targets when supported by the platform', async () => {
    const root = await mkdtemp(join(tmpdir(), 'archived-link-'))
    created.push(root)
    await writeFile(join(root, 'target.txt'), 'ok')
    try { await symlink(join(root, 'target.txt'), join(root, 'link.txt')) } catch { return }
    await expect(resolveSafeRegularFile('link.txt', root, [root])).rejects.toMatchObject({ code: 'symlink-not-allowed' })
  })

  it('keeps fallback artifact deletion strictly inside the canonical session root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'archived-root-'))
    const outside = await mkdtemp(join(tmpdir(), 'archived-outside-'))
    created.push(root, outside)
    await mkdir(join(root, 'session'))
    await expect(resolveSafeArtifactDirectory(root, join(root, 'session'))).resolves.toBe(join(root, 'session'))
    await expect(resolveSafeArtifactDirectory(root, outside)).rejects.toMatchObject({ code: 'outside-session-root' })
  })

  it('resolves artifact files and folders to the same owning session directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'archived-container-'))
    created.push(root)
    const session = join(root, 'project', 'session-1')
    await mkdir(session, { recursive: true })
    const artifact = join(session, 'session.jsonl')
    await writeFile(artifact, '{}')
    await expect(resolveSafeArtifactContainer(root, artifact)).resolves.toBe(session)
    await expect(resolveSafeArtifactContainer(root, session)).resolves.toBe(session)
  })
})

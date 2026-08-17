import { lstat, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve } from 'node:path'

export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
  }
}

export function requireSessionId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new RequestError('sessionId is required', 400, 'bad-request')
  }
  if (value.length > 200) throw new RequestError('sessionId is too long', 400, 'bad-request')
  return value
}

export function resolveProducedPath(rawPath: string, sessionCwd: string | undefined): string {
  if (rawPath.length === 0) throw new RequestError('path is required', 400, 'bad-request')
  if (rawPath.length > 32_768) throw new RequestError('path is too long', 400, 'bad-request')
  if (isAbsolute(rawPath)) return resolve(rawPath)
  if (sessionCwd === undefined || sessionCwd.length === 0) {
    throw new RequestError('无法安全解析相对文件路径：会话缺少工作目录', 409, 'missing-session-cwd')
  }
  return resolve(sessionCwd, rawPath)
}

export function isStrictlyInside(root: string, target: string): boolean {
  const rel = relative(root, target)
  return rel !== '' && rel !== '.' && !rel.startsWith('..') && !isAbsolute(rel)
}

export async function resolveSafeRegularFile(
  rawPath: string,
  sessionCwd: string | undefined,
  workspaceRoots: readonly string[],
): Promise<string> {
  const resolved = resolveProducedPath(rawPath, sessionCwd)
  let info
  try {
    info = await lstat(resolved)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new RequestError('文件不存在或已经删除', 404, 'file-not-found')
    }
    throw error
  }
  if (info.isSymbolicLink()) throw new RequestError('为避免链接跳转，不能删除符号链接', 403, 'symlink-not-allowed')
  if (!info.isFile()) throw new RequestError('只能删除普通文件', 403, 'not-a-file')

  const target = await realpath(resolved)
  for (const root of workspaceRoots) {
    try {
      const canonicalRoot = await realpath(resolve(root))
      if (isStrictlyInside(canonicalRoot, target)) return target
    } catch {
      // Ignore stale workspace entries.
    }
  }
  throw new RequestError('只能删除工作区内的文件', 403, 'outside-workspace')
}

export async function resolveSafeArtifactDirectory(sessionRoot: string, artifactPath: string): Promise<string> {
  const canonicalRoot = await realpath(resolve(sessionRoot))
  const canonicalArtifact = await realpath(resolve(artifactPath))
  if (!isStrictlyInside(canonicalRoot, canonicalArtifact)) {
    throw new RequestError('拒绝删除：会话记录目录不在会话根目录内', 403, 'outside-session-root')
  }
  const info = await lstat(canonicalArtifact)
  if (!info.isDirectory()) throw new RequestError('会话记录目标不是目录', 409, 'invalid-session-artifact')
  return canonicalArtifact
}

/** Resolve either a session artifact file or its directory to the owning
 * session directory, while keeping the result inside the canonical root. */
export async function resolveSafeArtifactContainer(sessionRoot: string, artifactPath: string): Promise<string> {
  const canonicalRoot = await realpath(resolve(sessionRoot))
  const canonicalArtifact = await realpath(resolve(artifactPath))
  const info = await lstat(canonicalArtifact)
  const container = info.isDirectory() ? canonicalArtifact : info.isFile() ? dirname(canonicalArtifact) : undefined
  if (container === undefined) throw new RequestError('会话记录目标不是文件或目录', 409, 'invalid-session-artifact')
  if (!isStrictlyInside(canonicalRoot, container)) {
    throw new RequestError('拒绝访问：会话记录目录不在会话根目录内', 403, 'outside-session-root')
  }
  return container
}

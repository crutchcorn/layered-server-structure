import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

export const ROUTE_VERBS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'ws',
  'sse',
] as const

type RouteVerb = (typeof ROUTE_VERBS)[number]

const routeVerbSet = new Set<string>(ROUTE_VERBS)

export type DirectoryPlacement = 'subroute' | 'routes-root' | 'other'

export type ParsedRoleFile =
  | {
      kind: 'valid'
      baseName: string
      verb: RouteVerb | undefined
      isIndexName: boolean
    }
  | {
      kind: 'invalid-verb'
      baseName: string
      modifier: string
    }

export function parseRoleFilename(
  basename: string,
  role: 'route' | 'logic',
): ParsedRoleFile | undefined {
  const pattern =
    role === 'route'
      ? /^(.+)\.route\.(?:[cm]?[jt]s|[jt]sx)$/i
      : /^(.+)\.logic\.(?:[cm]?[jt]s)$/i
  const match = pattern.exec(basename)
  if (!match?.[1]) return undefined

  const stem = match[1]
  const parts = stem.split('.')
  if (parts.length === 1) {
    const baseName = parts[0]!
    return {
      kind: 'valid',
      baseName,
      verb: undefined,
      isIndexName: baseName.toLowerCase() === 'index',
    }
  }

  if (parts.length === 2) {
    const [baseName, rawModifier] = parts as [string, string]
    const normalized = rawModifier.toLowerCase()
    if (routeVerbSet.has(normalized)) {
      return {
        kind: 'valid',
        baseName,
        verb: normalized as RouteVerb,
        isIndexName: baseName.toLowerCase() === 'index',
      }
    }
    return {
      kind: 'invalid-verb',
      baseName,
      modifier: rawModifier,
    }
  }

  return {
    kind: 'invalid-verb',
    baseName: parts[0] ?? stem,
    modifier: parts.slice(1).join('.'),
  }
}

export function classifyDirectory(directory: string): DirectoryPlacement {
  const normalized = directory.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  const current = segments.at(-1)
  const parent = segments.at(-2)
  if (current === 'routes') return 'routes-root'
  if (parent === 'routes') return 'subroute'
  return 'other'
}

/** Collect immediate sibling filenames (including an unsaved editor buffer) matching predicate. */
export function collectMatchingSiblings(
  filename: string,
  matches: (basename: string) => boolean,
): string[] | undefined {
  const directory = path.dirname(filename)
  const currentBasename = path.basename(filename)
  const files = new Set<string>()
  if (matches(currentBasename)) {
    files.add(currentBasename)
  }

  let entries
  try {
    // Read siblings every time so partial/editor lint sees additions/removals.
    entries = readdirSync(directory, { withFileTypes: true })
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error.code === 'ENOENT' || error.code === 'ENOTDIR')
    ) {
      return undefined
    }
    throw error
  }

  for (const entry of entries) {
    if (!matches(entry.name)) continue
    if (
      entry.isFile() ||
      (entry.isSymbolicLink() &&
        statSync(path.join(directory, entry.name), {
          throwIfNoEntry: false,
        })?.isFile())
    ) {
      files.add(entry.name)
    }
  }

  return [...files].sort()
}

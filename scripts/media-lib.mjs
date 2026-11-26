import { readFile, readdir, lstat } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

export const LIMIT = 25 * 1024 * 1024
export const root = resolve(import.meta.dirname, '..')
export const catalog = JSON.parse(await readFile(resolve(root, 'media/catalog.json'), 'utf8'))
export const paths = [...new Set([catalog.hero, ...catalog.performances.flatMap((item) => [item.src, `posters/${item.poster}.jpg`])])]

export function safePath(directory, path) {
  if (!path || path.includes('\\') || path.startsWith('/') || path.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error(`Invalid catalog path: ${path}`)
  const target = resolve(directory, path)
  if (relative(directory, target).startsWith('..')) throw new Error(`Path outside media directory: ${path}`)
  return target
}

export async function inspect(directory, selected = paths) {
  const issues = []
  for (const path of selected) {
    try {
      const stat = await lstat(safePath(directory, path))
      if (!stat.isFile() || stat.isSymbolicLink()) issues.push(`${path}: not a regular file`)
      else if (stat.size > LIMIT) issues.push(`${path}: ${(stat.size / 1024 / 1024).toFixed(2)} MiB > 25 MiB`)
    } catch (error) { issues.push(`${path}: ${error.code || error.message}`) }
  }
  return issues
}

export async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) files.push(...(await walk(resolve(directory, entry.name))).map((path) => `${entry.name}/${path}`))
    else files.push(entry.name)
  }
  return files
}

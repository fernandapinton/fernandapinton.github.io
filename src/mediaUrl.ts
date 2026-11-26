// Paths are decoded, relative paths from the catalog; encode each segment once.
export function resolveMediaUrl(path: string, base = '/media') {
  if (!path || path.startsWith('/') || path.includes('\\') || path.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new Error(`Invalid media path: ${path}`)
  }
  return `${base.replace(/\/+$/, '')}/${path.split('/').map(encodeURIComponent).join('/')}`
}

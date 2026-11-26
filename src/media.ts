import { resolveMediaUrl } from './mediaUrl'

const base = import.meta.env.VITE_MEDIA_BASE_URL?.trim() || `${import.meta.env.BASE_URL}media`

export function mediaUrl(path: string) {
  return resolveMediaUrl(path, base)
}

import { catalog, paths } from './media-lib.mjs'

const base = process.env.VITE_MEDIA_BASE_URL?.replace(/\/+$/, '')
if (!base?.startsWith('https://')) throw new Error('Set VITE_MEDIA_BASE_URL to the deployed media HTTPS URL.')
const failures = []
for (const path of paths) {
  const url = `${base}/${path.split('/').map(encodeURIComponent).join('/')}`
  const audiovisual = /\.(mp4|mp3)$/.test(path)
  try {
    const response = await fetch(url, { method: audiovisual ? 'GET' : 'HEAD', headers: audiovisual ? { Range: 'bytes=0-1023', Origin: 'https://example.github.io' } : {}, signal: AbortSignal.timeout(30_000) })
    await response.body?.cancel()
    const expectedType = path.endsWith('.mp4') ? 'video/mp4' : path.endsWith('.mp3') ? 'audio/mpeg' : 'image/jpeg'
    if (!response.ok || !response.headers.get('content-type')?.startsWith(expectedType)) throw new Error(`HTTP ${response.status} / ${response.headers.get('content-type')}`)
    if (audiovisual && (response.status !== 206 || !response.headers.get('content-range')?.startsWith('bytes 0-1023/') || response.headers.get('access-control-allow-origin') !== '*')) throw new Error('Range (206/Content-Range) or anonymous CORS missing')
    console.log(`OK ${path}`)
  } catch (error) { failures.push(`${path}: ${error.message}`) }
}
if (failures.length) throw new Error(failures.join('\n'))
console.log(`Verified ${paths.length} deployed references including ${catalog.performances.length} videos.`)

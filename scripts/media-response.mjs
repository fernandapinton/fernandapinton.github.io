export function validateMediaResponse(path, response, expectedBytes, allowFullResponse = false) {
  const audiovisual = /\.(mp4|mp3)$/.test(path)
  const expectedType = path.endsWith('.mp4') ? 'video/mp4' : path.endsWith('.mp3') ? 'audio/mpeg' : 'image/jpeg'
  if (!response.ok || !response.headers.get('content-type')?.startsWith(expectedType)) {
    throw new Error(`HTTP ${response.status} / ${response.headers.get('content-type')}`)
  }
  if (!audiovisual) return 'image'
  if (response.headers.get('access-control-allow-origin') !== '*') throw new Error('Anonymous CORS missing')
  if (response.status === 206) {
    if (response.headers.get('content-range') !== `bytes 0-1023/${expectedBytes}` || Number(response.headers.get('content-length')) !== 1024) {
      throw new Error('Invalid partial response (Content-Range or Content-Length)')
    }
    return 'partial'
  }
  if (allowFullResponse && response.status === 200) {
    if (Number(response.headers.get('content-length')) !== expectedBytes || response.headers.has('content-range')) {
      throw new Error('Full response size does not match the selected publication file')
    }
    return 'full'
  }
  throw new Error('Range response required; full responses need explicit MEDIA_ALLOW_FULL_RESPONSES=true')
}

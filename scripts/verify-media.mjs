import { stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { catalog, paths, root, safePath } from './media-lib.mjs'
import { validateMediaResponse } from './media-response.mjs'

const base = process.env.VITE_MEDIA_BASE_URL?.replace(/\/+$/, '')
if (!base?.startsWith('https://')) throw new Error('Set VITE_MEDIA_BASE_URL to the deployed media HTTPS URL.')
const failures = []
const allowFullResponse = process.env.MEDIA_ALLOW_FULL_RESPONSES === 'true'
let fullResponses = 0
for (const path of paths) {
  const url = `${base}/${path.split('/').map(encodeURIComponent).join('/')}`
  const audiovisual = /\.(mp4|mp3)$/.test(path)
  try {
    const { size } = await stat(safePath(resolve(root, 'media/published'), path))
    const response = await fetch(url, { method: audiovisual ? 'GET' : 'HEAD', headers: audiovisual ? { Range: 'bytes=0-1023', Origin: 'https://example.github.io' } : {}, signal: AbortSignal.timeout(30_000) })
    await response.body?.cancel()
    const delivery = validateMediaResponse(path, response, size, allowFullResponse)
    if (delivery === 'full') fullResponses++
    console.log(`OK ${path}${delivery === 'full' ? ' (200: full-file delivery accepted)' : ''}`)
  } catch (error) { failures.push(`${path}: ${error.message}`) }
}
if (failures.length) throw new Error(failures.join('\n'))
console.log(`Verified ${paths.length} deployed references including ${catalog.performances.length} videos.`)
if (fullResponses) console.log(`${fullResponses} full-file responses accepted explicitly; seeking and download size depend on browser buffering.`)

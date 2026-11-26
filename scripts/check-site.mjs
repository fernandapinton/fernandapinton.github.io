import { resolve } from 'node:path'
import { stat } from 'node:fs/promises'
import { root, walk } from './media-lib.mjs'

const directory = resolve(root, 'dist')
const files = await walk(directory)
const forbidden = files.filter((path) => path.startsWith('media/') || /\.(?:mp4|mp3|wav|webm|mov|jpe?g|png|webp|avif)$/i.test(path))
if (forbidden.length) throw new Error(`External media leaked into site build: ${forbidden.join(', ')}`)
let bytes = 0
for (const path of files) bytes += (await stat(resolve(directory, path))).size
console.log(`Site artifact verified: ${files.length} files, ${(bytes / 1024).toFixed(1)} KiB; external audiovisual assets absent.`)

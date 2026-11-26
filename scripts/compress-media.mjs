// Optional maintenance tool. Requires portable FFmpeg/FFprobe; no runtime dependency.
import { spawnSync, spawn } from 'node:child_process'
import { mkdir, stat, writeFile, readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { root, LIMIT } from './media-lib.mjs'

const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'
const ffprobe = process.env.FFPROBE_PATH || 'ffprobe'
const jobs = [
  ['video/sesc.mp4', 'delivery/sesc-v1.mp4', 'optimized/sesc.mp4'],
  ['video/clube da esquina n 2.mp4', 'delivery/clube-da-esquina-v1.mp4', 'optimized/clube-da-esquina.mp4'],
  ['video/malemolencia casamento t&a.mp4', 'delivery/malemolencia-v1.mp4', 'optimized/malemolencia.mp4'],
]
function probe(path) {
  const result = spawnSync(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', path], { encoding: 'utf8', windowsHide: true })
  if (result.status !== 0) throw new Error(result.error?.message || result.stderr)
  return JSON.parse(result.stdout)
}
async function run(args) {
  await new Promise((accept, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ['ignore', 'ignore', 'inherit'], windowsHide: true })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`FFmpeg exited ${code}`)))
  })
}
const report = []
for (const [source, destination, previous] of jobs) {
  const input = resolve(root, 'public/media', source)
  const output = resolve(root, 'public/media', destination)
  try { await stat(output); throw new Error(`Refusing to overwrite ${destination}; use a new version filename.`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const before = probe(input)
  const duration = Number(before.format.duration)
  // 23 MiB target, leaving container overhead and bitrate variance below 25 MiB.
  const bitrate = Math.floor(23 * 1024 * 1024 * 8 / duration / 1000) - 128
  if (!Number.isFinite(bitrate) || bitrate < 150) throw new Error(`${source}: too long for acceptable publication quality under 25 MiB; review manually.`)
  const shortSide = bitrate < 700 ? 480 : 720
  await mkdir(dirname(output), { recursive: true })
  const log = resolve(root, '.tools', `pass-${report.length}`)
  await mkdir(dirname(log), { recursive: true })
  const video = ['-map', '0:v:0', '-c:v', 'libx264', '-preset', 'medium', '-b:v', `${bitrate}k`, '-pix_fmt', 'yuv420p', '-vf', `scale='if(gte(iw,ih),-2,min(${shortSide},iw))':'if(gte(iw,ih),min(${shortSide},ih),-2)',setsar=1`, '-r', '30', '-passlogfile', log]
  console.log(`Encoding ${source}: ${duration}s, ${bitrate} kbps video + 128 kbps AAC`)
  await run(['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', input, ...video, '-pass', '1', '-an', '-f', 'null', '-'])
  await run(['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', input, ...video, '-pass', '2', '-map', '0:a:0', '-c:a', 'aac', '-b:a', '128k', '-map_metadata', '-1', '-movflags', '+faststart', output])
  const after = probe(output)
  const size = (await stat(output)).size
  if (size > LIMIT || Math.abs(Number(after.format.duration) - duration) > .25) throw new Error(`Validation failed for ${destination}`)
  report.push({ source, destination, previous, sourceBytes: (await stat(input)).size, bytes: size, duration: Number(after.format.duration), width: after.streams[0].width, height: after.streams[0].height, video: after.streams[0].codec_name, audio: after.streams.find((s) => s.codec_type === 'audio')?.codec_name })
  console.log(`Validated ${destination}: ${(size / 1024 / 1024).toFixed(2)} MiB`)
}
// Update references only after every full-length derivative has passed validation.
const path = resolve(root, 'media/catalog.json')
const catalog = JSON.parse(await readFile(path, 'utf8'))
for (const item of catalog.performances) {
  const replacement = report.find((entry) => entry.previous === item.src)
  if (replacement) item.src = replacement.destination
}
await writeFile(path, JSON.stringify(catalog, null, 2) + '\n')
await writeFile(resolve(root, 'media/encoding-report.json'), JSON.stringify(report, null, 2) + '\n')

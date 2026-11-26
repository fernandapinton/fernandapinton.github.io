import { copyFile, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { constants } from 'node:fs'
import { root, paths, safePath, inspect, walk } from './media-lib.mjs'

const command = process.argv[2]
const local = resolve(root, 'public/media')
const published = resolve(root, 'media/published')
const output = resolve(root, 'media-dist')

async function copySelected(source, destination) {
  for (const path of paths) {
    const target = safePath(destination, path)
    await mkdir(dirname(target), { recursive: true })
    await copyFile(safePath(source, path), target)
  }
}

if (command === 'audit') {
  let total = 0
  console.log('Bytes\tMiB\tReferenced\tPath')
  for (const path of await walk(local)) {
    const { size } = await stat(safePath(local, path))
    total += size
    console.log(`${size}\t${(size / 1024 / 1024).toFixed(2)}\t${paths.includes(path)}\t${path}`)
  }
  console.log(`TOTAL: ${total} bytes (${(total / 1024 / 1024).toFixed(2)} MiB)`)
  console.log((await inspect(local)).join('\n') || 'All selected local files fit Cloudflare Pages.')
} else if (command === 'local') {
  const issues = await inspect(published)
  if (issues.length) throw new Error(issues.join('\n'))
  for (const path of paths) {
    const destination = safePath(local, path)
    await mkdir(dirname(destination), { recursive: true })
    try { await copyFile(safePath(published, path), destination, constants.COPYFILE_EXCL) }
    catch (error) { if (error.code !== 'EEXIST') throw error }
  }
  console.log('Local media restored; existing local files preserved.')
} else if (command === 'stage') {
  // Explicit opt-in: only catalog assets can enter the tracked publication directory.
  const issues = await inspect(local)
  if (issues.length) throw new Error(`Resolve local publication files before staging:\n${issues.join('\n')}`)
  await copySelected(local, published)
  console.log(`Staged ${paths.length} selected assets. Review media/published before committing.`)
} else if (command === 'build') {
  // Remove stale output on failure too, so it cannot be uploaded accidentally.
  await rm(output, { recursive: true, force: true })
  const issues = await inspect(published)
  if (issues.length) throw new Error(`Media build blocked:\n${issues.join('\n')}`)
  if (paths.length + 2 > 20_000) throw new Error('Cloudflare Free limit: 20,000 files')
  await copySelected(published, output)
  await writeFile(resolve(output, '_headers'), await readFile(resolve(root, 'media/_headers')))
  await writeFile(resolve(output, '404.html'), '<!doctype html><html lang="en"><title>Not found</title><p>Media not found.</p></html>\n')
  console.log(`Built ${paths.length} assets in media-dist; no originals or unlisted files included.`)
} else throw new Error('Use audit, local, stage or build')

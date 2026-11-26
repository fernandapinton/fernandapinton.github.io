import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, open, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspect, LIMIT, safePath } from '../scripts/media-lib.mjs'

test('publication validation accepts 25 MiB but rejects missing and oversized assets', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-media-'))
  try {
    await mkdir(join(directory, 'video'))
    for (const [name, size] of [['exact', LIMIT], ['large', LIMIT + 1]] as const) {
      const file = await open(join(directory, `video/${name}.mp4`), 'w')
      await file.truncate(size)
      await file.close()
    }
    assert.deepEqual(await inspect(directory, ['video/exact.mp4']), [])
    const issues = await inspect(directory, ['video/large.mp4', 'video/missing.mp4'])
    assert.equal(issues.length, 2)
    assert.match(issues[0], /large.mp4.*25 MiB/)
    assert.match(issues[1], /missing.mp4.*ENOENT/)
    assert.throws(() => safePath(directory, '../private.wav'))
  } finally { await rm(directory, { recursive: true, force: true }) }
})

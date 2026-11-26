import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveMediaUrl } from '../src/mediaUrl.ts'

test('media URLs encode spaces, unicode and reserved filename characters', () => {
  assert.equal(resolveMediaUrl('video/canção t&a #1.mp4', 'https://cdn.example/media/'), 'https://cdn.example/media/video/can%C3%A7%C3%A3o%20t%26a%20%231.mp4')
})

test('local and replacement providers preserve semantic paths', () => {
  assert.equal(resolveMediaUrl('posters/sesc.jpg'), '/media/posters/sesc.jpg')
  assert.equal(resolveMediaUrl('posters/sesc.jpg', '/portfolio/media'), '/portfolio/media/posters/sesc.jpg')
  assert.equal(resolveMediaUrl('posters/sesc.jpg', 'https://other.example/v2'), 'https://other.example/v2/posters/sesc.jpg')
})

test('catalog paths cannot escape the media directory', () => {
  for (const path of ['../private.wav', '/private.wav', 'a/../private.wav', 'a\\b', 'a//b']) {
    assert.throws(() => resolveMediaUrl(path))
  }
})

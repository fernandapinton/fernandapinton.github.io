import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMediaResponse } from '../scripts/media-response.mjs'

function video(status: number, headers: Record<string, string> = {}) {
  return new Response(null, { status, headers: { 'Content-Type': 'video/mp4', 'Access-Control-Allow-Origin': '*', ...headers } })
}

test('full video delivery requires explicit opt-in and the exact publication size', () => {
  const response = video(200, { 'Content-Length': '4096' })
  assert.throws(() => validateMediaResponse('video/sesc.mp4', response, 4096), /explicit/)
  assert.equal(validateMediaResponse('video/sesc.mp4', response, 4096, true), 'full')
  assert.throws(() => validateMediaResponse('video/sesc.mp4', response, 5000, true), /size/)
  assert.throws(() => validateMediaResponse('video/sesc.mp4', video(200), 4096, true), /size/)
})

test('opt-in does not accept missing CORS, HTML fallbacks, missing files or invalid partial responses', () => {
  assert.throws(() => validateMediaResponse('video/sesc.mp4', video(200, { 'Content-Length': '4096', 'Access-Control-Allow-Origin': '' }), 4096, true), /CORS/)
  assert.throws(() => validateMediaResponse('video/sesc.mp4', video(200, { 'Content-Type': 'text/html' }), 4096, true), /text\/html/)
  assert.throws(() => validateMediaResponse('video/sesc.mp4', video(404), 4096, true), /404/)
  assert.throws(() => validateMediaResponse('video/sesc.mp4', video(206, { 'Content-Length': '1024', 'Content-Range': 'bytes 0-1023/5000' }), 4096, true), /partial/)
})

test('valid partial responses continue to pass without full-file opt-in', () => {
  assert.equal(validateMediaResponse('video/sesc.mp4', video(206, { 'Content-Length': '1024', 'Content-Range': 'bytes 0-1023/4096' }), 4096), 'partial')
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { restingPose, stackPose, wrapIndex } from '../src/components/stackMotion.ts'
import type { CardPose } from '../src/components/stackMotion.ts'

function samePosition(actual: CardPose, expected: CardPose) {
  for (const key of ['x', 'y', 'angle', 'scale'] as const) {
    assert.ok(Math.abs(actual[key] - expected[key]) < .000001, `${key}: ${actual[key]} != ${expected[key]}`)
  }
}

test('finishing a forward cycle changes no card position at the index handoff', () => {
  for (const count of [2, 3, 4, 11]) {
    for (let depth = 0; depth < count; depth++) {
      const end = stackPose(depth, count, 320, -120, 'forward-under')
      samePosition(end, restingPose(wrapIndex(depth - 1, count), count))
    }
  }
})

test('finishing a backward cycle changes no card position at the index handoff', () => {
  for (const count of [2, 3, 4, 11]) {
    for (let depth = 0; depth < count; depth++) {
      const end = stackPose(depth, count, 320, 120, 'backward-in')
      samePosition(end, restingPose(wrapIndex(depth + 1, count), count))
    }
  }
})

test('the fourth card moves continuously from the hidden center to the right corner', () => {
  const start = stackPose(3, 11, 320, 0, 'idle')
  const halfway = stackPose(3, 11, 320, -120, 'idle')
  const end = stackPose(3, 11, 320, -240, 'idle')
  assert.equal(start.x, 0)
  assert.ok(halfway.x > start.x && halfway.x < end.x)
  assert.ok(halfway.scale > start.scale && halfway.scale < end.scale)
  samePosition(end, restingPose(2, 11))
})

test('the outgoing card exits left above the deck and returns right below every card', () => {
  const exit = stackPose(0, 11, 320, -120, 'forward-out')
  const returned = stackPose(0, 11, 320, -120, 'forward-under')
  assert.ok(exit.x < -320)
  assert.ok(exit.layer > restingPose(0, 11).layer)
  assert.equal(returned.x, 0)
  for (let depth = 1; depth < 11; depth++) {
    assert.ok(returned.layer < stackPose(depth, 11, 320, -120, 'forward-under').layer)
  }
})

test('backward navigation lifts the previous bottom card along its own left-hand path', () => {
  const emerging = stackPose(10, 11, 320, 120, 'idle')
  const outside = stackPose(10, 11, 320, 120, 'backward-out')
  const incoming = stackPose(10, 11, 320, 120, 'backward-in')
  assert.ok(emerging.x < 0 && emerging.x > outside.x)
  assert.equal(emerging.layer, 0)
  assert.ok(outside.x < -320)
  assert.equal(outside.layer, 0)
  assert.ok(incoming.layer > restingPose(0, 11).layer)
  samePosition(incoming, restingPose(0, 11))
  samePosition(stackPose(0, 11, 320, 120, 'idle'), { x: -4, y: 5, angle: -1.5, scale: .985, layer: 12 })
  samePosition(stackPose(0, 11, 320, 120, 'backward-in'), restingPose(1, 11))
})

test('a cancelled drag restores all positions and wrapping works in both directions', () => {
  for (let depth = 0; depth < 11; depth++) samePosition(stackPose(depth, 11, 320, 0, 'idle'), restingPose(depth, 11))
  assert.equal(wrapIndex(-1, 11), 10)
  assert.equal(wrapIndex(11, 11), 0)
  assert.equal(wrapIndex(22, 11), 0)
})

test('the previous card fully clears the pile before lifting, including tall mobile cards', () => {
  const horizontalRadius = (width: number, height: number, pose: CardPose) => {
    const angle = Math.abs(pose.angle) * Math.PI / 180
    return (width * Math.cos(angle) + height * Math.sin(angle)) * pose.scale / 2
  }
  for (const [width, height] of [[220, 450], [294, 520], [320, 900], [220, 1400]]) {
    const incoming = stackPose(10, 11, width, 90, 'backward-out', height)
    const incomingRight = width / 2 + incoming.x + horizontalRadius(width, height, incoming)
    const pileLeft = Math.min(...Array.from({ length: 10 }, (_, depth) => {
      const pose = restingPose(depth, 11)
      return width / 2 + pose.x - horizontalRadius(width, height, pose)
    }))
    assert.equal(incoming.layer, 0)
    assert.ok(incomingRight < pileLeft - 8, `${width}x${height}: incoming ${incomingRight}, pile ${pileLeft}`)
  }
})

test('reentry starts only after a stationary foreground lift, above every other card', () => {
  for (const count of [2, 3, 4, 11]) {
    const outside = stackPose(count - 1, count, 294, 100, 'backward-out', 520)
    const lifted = stackPose(count - 1, count, 294, 100, 'backward-lift', 520)
    const entering = stackPose(count - 1, count, 294, 100, 'backward-in', 520)
    samePosition(lifted, outside)
    assert.equal(outside.layer, 0)
    assert.equal(lifted.layer, entering.layer)
    for (let depth = 0; depth < count - 1; depth++) {
      assert.ok(lifted.layer > stackPose(depth, count, 294, 100, 'backward-lift', 520).layer)
      assert.ok(entering.layer > stackPose(depth, count, 294, 100, 'backward-in', 520).layer)
      samePosition(stackPose(depth, count, 294, 100, 'backward-lift', 520), restingPose(depth + 1, count))
    }
  }
})

test('a right drag starts descending the entire pile before release', () => {
  for (const depth of [0, 1, 2]) {
    const rest = restingPose(depth, 11)
    const target = restingPose(depth + 1, 11)
    const early = stackPose(depth, 11, 320, 24, 'idle')
    const halfway = stackPose(depth, 11, 320, 120, 'idle')
    const end = stackPose(depth, 11, 320, 240, 'idle')
    assert.ok(early.scale < rest.scale && early.scale > halfway.scale)
    assert.ok(halfway.scale < early.scale && halfway.scale > target.scale)
    samePosition(end, target)
  }
})

test('retracing a right drag reverses the pile without changing the selected card', () => {
  for (const depth of [0, 1, 2, 3, 10]) {
    const outward = [0, 24, 60, 120, 180, 240].map((distance) => stackPose(depth, 11, 320, distance, 'idle'))
    const returning = [240, 180, 120, 60, 24, 0].map((distance) => stackPose(depth, 11, 320, distance, 'idle'))
    returning.forEach((pose, i) => samePosition(pose, outward[outward.length - i - 1]))
    samePosition(returning[returning.length - 1], restingPose(depth, 11))
  }
})

test('the pile is already descended before reentry and stays still while the previous card enters', () => {
  for (let depth = 0; depth < 10; depth++) {
    const beforeLift = stackPose(depth, 11, 320, 90, 'backward-out')
    const lifted = stackPose(depth, 11, 320, 90, 'backward-lift')
    const duringEntry = stackPose(depth, 11, 320, 90, 'backward-in')
    samePosition(beforeLift, restingPose(depth + 1, 11))
    samePosition(lifted, beforeLift)
    samePosition(duringEntry, beforeLift)
    assert.equal(beforeLift.layer, duringEntry.layer)
  }
})

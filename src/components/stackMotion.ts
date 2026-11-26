export type StackPhase = 'idle' | 'forward-out' | 'forward-under' | 'backward-out' | 'backward-lift' | 'backward-in'
export type CardPose = { x: number; y: number; angle: number; scale: number; layer: number }

export const stackDurations: Record<StackPhase, number> = {
  idle: 320,
  'forward-out': 300,
  'forward-under': 400,
  'backward-out': 300,
  'backward-lift': 0,
  'backward-in': 460,
}

export function wrapIndex(index: number, length: number) {
  return length ? ((index % length) + length) % length : 0
}

export function restingPose(depth: number, count: number): CardPose {
  const position = depth === 0 ? { x: 0, y: 0, angle: 0, scale: 1 }
    : depth === 1 ? { x: -8, y: 10, angle: -3, scale: .97 }
      : depth === 2 ? { x: 12, y: 18, angle: 5, scale: .94 }
        : { x: 0, y: 0, angle: 0, scale: .90 }
  return { ...position, layer: count - depth + 1 }
}

function between(from: CardPose, to: CardPose, progress: number): CardPose {
  const mix = (start: number, end: number) => start + (end - start) * progress
  return { x: mix(from.x, to.x), y: mix(from.y, to.y), angle: mix(from.angle, to.angle), scale: mix(from.scale, to.scale), layer: from.layer }
}

export function stackPose(depth: number, count: number, width: number, drag: number, phase: StackPhase, height = width * 1.6): CardPose {
  const rest = restingPose(depth, count)
  // A rotated, tall card extends farther horizontally than its own width.
  // Leave enough room for the entire card to clear the pile before lifting it.
  const angle = 16 * Math.PI / 180
  const exit = Math.max(width + 80, width / 2 + (width * Math.cos(angle) + height * Math.sin(angle)) / 2 + 48)
  const forward = phase === 'forward-out' || phase === 'forward-under'
  const backward = phase === 'backward-out' || phase === 'backward-lift' || phase === 'backward-in'

  if (forward && depth === 0) {
    return phase === 'forward-out'
      ? { x: -exit, y: 0, angle: -16, scale: 1, layer: count + 2 }
      : { ...restingPose(count - 1, count), layer: 0 }
  }
  if (depth === count - 1 && (backward || (phase === 'idle' && drag > 0))) {
    if (phase === 'backward-in') return { ...restingPose(0, count), layer: count + 2 }
    const progress = backward ? 1 : Math.min(drag / (width * .9), .88)
    return { ...between(rest, { x: -exit, y: 0, angle: -12, scale: .90, layer: 0 }, progress), layer: phase === 'backward-lift' ? count + 2 : 0 }
  }
  if (backward || (phase === 'idle' && drag > 0)) {
    // Reverse the pile continuously under the finger, including when the user
    // retraces the gesture. Complete the descent while the old card exits;
    // keep the pile stationary throughout its foreground reentry.
    if (backward) return restingPose(depth + 1, count)
    return between(rest, restingPose(depth + 1, count), Math.min(drag / (width * .75), 1))
  }
  if (forward || (phase === 'idle' && drag < 0)) {
    if (depth === 0) return { ...rest, x: drag, angle: Math.max(-16, drag / 22), layer: count + 2 }
    const progress = forward ? 1 : Math.min(-drag / (width * .75), 1)
    return between(rest, restingPose(depth - 1, count), progress)
  }
  return rest
}

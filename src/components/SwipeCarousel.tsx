import { ArrowRightIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { stackDurations, stackPose, wrapIndex } from './stackMotion'
import type { StackPhase } from './stackMotion'

type CarouselItem = { poster: string; title: string }
type Gesture = { id: number; x: number; y: number; distance: number; lastX: number; lastTime: number; velocity: number; dragging: boolean; width: number }

export function SwipeCarousel<T extends CarouselItem>({ items, label, renderCard }: {
  items: T[]
  label: string
  renderCard: (item: T, preview: boolean, prepare: boolean, moving?: boolean) => ReactNode
}) {
  const deckRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const suppressClick = useRef(false)
  const restoreFocus = useRef(false)
  const dragFrame = useRef<number | null>(null)
  const pendingDrag = useRef(0)
  const clearanceFrame = useRef<number | null>(null)
  const currentPhase = useRef<StackPhase>('idle')
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<StackPhase>('idle')
  const [drag, setDrag] = useState(0)
  const [width, setWidth] = useState(320)
  const [height, setHeight] = useState(512)
  const [dragging, setDragging] = useState(false)
  const busy = phase !== 'idle'

  function checkCompletionNextFrame() {
    if (clearanceFrame.current !== null) return
    clearanceFrame.current = requestAnimationFrame(() => {
      clearanceFrame.current = null
      completePhase()
    })
  }

  function completePhase() {
    if (currentPhase.current !== phase) return
    if (phase === 'backward-out') {
      const cards = Array.from(deckRef.current?.querySelectorAll<HTMLElement>(':scope > .carousel-layer > .carousel-card') ?? [])
      const incoming = cards.find((card) => Number(card.dataset.depth) === items.length - 1)
      const pile = cards.filter((card) => card !== incoming)
      const pileLeft = Math.min(...pile.map((card) => card.getBoundingClientRect().left))
      const pileMoving = pile.some((card) => card.getAnimations().some((animation) => animation.playState === 'running'))
      // Late transition events and timer fallbacks must never lift a card that
      // still overlaps the pile. Wait for its actual painted position to clear.
      if (!incoming || incoming.getBoundingClientRect().right > pileLeft - 8 || pileMoving) {
        checkCompletionNextFrame()
        return
      }
    }
    if (phase === 'backward-in') {
      const incoming = deckRef.current?.querySelector<HTMLElement>(`.carousel-card[data-depth="${items.length - 1}"]`)
      if (incoming) {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(incoming).transform)
        const moving = incoming.getAnimations().some((animation) => animation.playState === 'running')
        if (moving || Math.abs(matrix.e) > .25 || Math.abs(matrix.f) > .25 || Math.abs(matrix.a - 1) > .001 || Math.abs(matrix.d - 1) > .001 || Math.abs(matrix.b) > .001 || Math.abs(matrix.c) > .001) {
          // Keep the foreground frame until reentry has actually settled;
          // a timer must not restore native video surfaces mid-transition.
          checkCompletionNextFrame()
          return
        }
      }
    }
    if (phase === 'forward-out' || phase === 'backward-out') {
      const nextPhase = phase === 'forward-out' ? 'forward-under' : 'backward-lift'
      currentPhase.current = nextPhase
      setPhase(nextPhase)
    }
    else if (phase === 'backward-lift') {
      currentPhase.current = 'backward-in'
      setPhase('backward-in')
    }
    else if (phase === 'forward-under' || phase === 'backward-in') {
      setIndex((current) => wrapIndex(current + (phase === 'forward-under' ? 1 : -1), items.length))
      setDrag(0)
      currentPhase.current = 'idle'
      setPhase('idle')
    }
  }

  const finishAnimation = useEffectEvent(completePhase)
  useLayoutEffect(() => {
    currentPhase.current = phase
    return () => {
      if (clearanceFrame.current !== null) cancelAnimationFrame(clearanceFrame.current)
      clearanceFrame.current = null
    }
  }, [phase])
  useEffect(() => {
    if (phase === 'idle') return
    if (phase === 'backward-lift') {
      // Commit the foreground stacking context while the card is stationary
      // outside the pile, before its video surface starts moving back over it.
      let secondFrame: number | null = null
      const firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => finishAnimation())
      })
      return () => {
        cancelAnimationFrame(firstFrame)
        if (secondFrame !== null) cancelAnimationFrame(secondFrame)
      }
    }
    // transitionend is primary; the timer also completes background-tab or
    // interrupted transitions so navigation cannot get stuck.
    const timer = window.setTimeout(() => finishAnimation(), stackDurations[phase] + 100)
    return () => window.clearTimeout(timer)
  }, [phase])

  useLayoutEffect(() => {
    if (restoreFocus.current && phase === 'idle') {
      activeRef.current?.focus({ preventScroll: true })
      restoreFocus.current = false
    }
  }, [index, phase])

  useEffect(() => () => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current)
  }, [])

  function cancelPendingDrag() {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current)
    dragFrame.current = null
  }

  function navigate(direction: 1 | -1) {
    if (busy || items.length < 2) return
    cancelPendingDrag()
    activeRef.current?.querySelector('video')?.pause()
    restoreFocus.current = document.activeElement === activeRef.current
    setWidth(deckRef.current?.clientWidth ?? 320)
    setHeight(activeRef.current?.offsetHeight ?? 512)
    setDragging(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex((current) => wrapIndex(current + direction, items.length))
      setDrag(0)
    } else {
      setPhase(direction === 1 ? 'forward-out' : 'backward-out')
    }
  }

  function begin(id: number, x: number, y: number, target: EventTarget | null, time: number) {
    suppressClick.current = false
    if (busy || items.length < 2 || !(target instanceof HTMLElement)) return
    if (target.closest('a, button, input')) return
    if (target instanceof HTMLVideoElement && y > target.getBoundingClientRect().bottom - 56) return
    const cardWidth = deckRef.current?.clientWidth ?? 320
    setWidth(cardWidth)
    setHeight(activeRef.current?.offsetHeight ?? 512)
    gesture.current = { id, x, y, distance: 0, lastX: x, lastTime: time, velocity: 0, dragging: false, width: cardWidth }
  }

  function move(id: number, x: number, y: number, time: number) {
    const start = gesture.current
    if (!start || start.id !== id) return false
    const distance = x - start.x
    if (!start.dragging) {
      const vertical = y - start.y
      if (Math.abs(vertical) > Math.abs(distance) && Math.abs(vertical) > 10) {
        gesture.current = null
        return false
      }
      if (Math.abs(distance) < 8) return false
      start.dragging = true
      suppressClick.current = true
      activeRef.current?.querySelector('video')?.pause()
      setDragging(true)
    }
    const elapsed = time - start.lastTime
    if (elapsed > 0) start.velocity = (x - start.lastX) / elapsed
    start.lastTime = time
    start.lastX = x
    start.distance = distance
    pendingDrag.current = distance
    if (dragFrame.current === null) {
      dragFrame.current = requestAnimationFrame(() => {
        setDrag(pendingDrag.current)
        dragFrame.current = null
      })
    }
    return true
  }

  function finish(id: number, time: number, cancelled = false) {
    const start = gesture.current
    if (!start || start.id !== id) return
    gesture.current = null
    cancelPendingDrag()
    setDragging(false)
    const threshold = Math.min(96, start.width * .22)
    const flick = Math.abs(start.distance) > 24 && time - start.lastTime < 100
      && Math.abs(start.velocity) > .5 && Math.sign(start.velocity) === Math.sign(start.distance)
    if (!cancelled && start.dragging && (Math.abs(start.distance) >= threshold || flick)) navigate(start.distance < 0 ? 1 : -1)
    else setDrag(0)
  }

  const touchStart = useEffectEvent((event: TouchEvent) => {
    if (event.touches.length !== 1) {
      if (gesture.current) finish(gesture.current.id, event.timeStamp, true)
      return
    }
    const touch = event.touches[0]
    begin(touch.identifier, touch.clientX, touch.clientY, event.target, event.timeStamp)
  })
  const touchMove = useEffectEvent((event: TouchEvent) => {
    const touch = Array.from(event.touches).find(({ identifier }) => identifier === gesture.current?.id)
    if (touch && move(touch.identifier, touch.clientX, touch.clientY, event.timeStamp) && event.cancelable) event.preventDefault()
  })
  const touchEnd = useEffectEvent((event: TouchEvent) => {
    const touch = Array.from(event.changedTouches).find(({ identifier }) => identifier === gesture.current?.id)
    if (!touch) return
    const wasDragging = gesture.current?.dragging
    finish(touch.identifier, event.timeStamp, event.type === 'touchcancel')
    if (wasDragging && event.cancelable) event.preventDefault()
  })
  useEffect(() => {
    const deck = deckRef.current
    if (!deck) return
    const start = (event: TouchEvent) => touchStart(event)
    const move = (event: TouchEvent) => touchMove(event)
    const end = (event: TouchEvent) => touchEnd(event)
    deck.addEventListener('touchstart', start, { passive: true })
    deck.addEventListener('touchmove', move, { passive: false })
    deck.addEventListener('touchend', end, { passive: false })
    deck.addEventListener('touchcancel', end)
    return () => {
      deck.removeEventListener('touchstart', start)
      deck.removeEventListener('touchmove', move)
      deck.removeEventListener('touchend', end)
      deck.removeEventListener('touchcancel', end)
    }
  }, [])

  function endPointer(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    if (event.pointerType === 'touch') return
    finish(event.pointerId, event.timeStamp, cancelled)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  if (!items.length) return null
  return (
    <div className="performance-carousel" role="region" aria-roledescription="carrossel" aria-label={label}>
      <p className="carousel-hint">Arraste para descobrir <ArrowRightIcon aria-hidden="true" /></p>
      <div className={`carousel-stage${dragging ? ' is-dragging' : ''}${busy ? ' is-animating' : ''}`} data-phase={phase} ref={deckRef}>
        {items.map((item, itemIndex) => {
          const depth = wrapIndex(itemIndex - index, items.length)
          const active = depth === 0
          const actor = (phase.startsWith('forward') && active) || (phase.startsWith('backward') && depth === items.length - 1)
          const pose = stackPose(depth, items.length, width, drag, phase, height)
          const prepare = depth < 4 || depth === items.length - 1
          return (
            <div className="carousel-layer" key={item.poster} style={{ zIndex: pose.layer }}>
            <div
              ref={active ? activeRef : undefined}
              className={`carousel-card ${active ? 'carousel-card--active' : 'carousel-card--preview'}`}
              style={{ '--card-x': `${pose.x}px`, '--card-y': `${pose.y}px`, '--card-angle': `${pose.angle}deg`, '--card-scale': pose.scale, '--motion-duration': `${stackDurations[phase]}ms` } as CSSProperties}
              data-depth={depth}
              role={active ? 'group' : undefined}
              aria-roledescription={active ? 'slide' : undefined}
              aria-label={active ? `${index + 1} de ${items.length}: ${item.title}` : undefined}
              aria-hidden={!active || undefined}
              inert={!active || busy}
              tabIndex={active ? 0 : undefined}
              onTransitionEnd={(event) => {
                if (actor && phase !== 'backward-lift' && event.target === event.currentTarget && event.propertyName === 'transform') completePhase()
              }}
              onPointerDown={(event) => {
                if (!active || event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return
                begin(event.pointerId, event.clientX, event.clientY, event.target, event.timeStamp)
              }}
              onPointerMove={(event) => {
                if (event.pointerType === 'touch') return
                if (move(event.pointerId, event.clientX, event.clientY, event.timeStamp) && !event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerUp={endPointer}
              onPointerCancel={(event) => endPointer(event, true)}
              onLostPointerCapture={(event) => endPointer(event, true)}
              onClickCapture={(event) => {
                if (suppressClick.current) {
                  event.preventDefault()
                  event.stopPropagation()
                  suppressClick.current = false
                }
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                  event.preventDefault()
                  navigate(event.key === 'ArrowRight' ? 1 : -1)
                }
              }}
            >
              {renderCard(item, !active || busy, prepare, dragging || busy)}
            </div>
            </div>
          )
        })}
      </div>
      <div className="carousel-controls" role="group" aria-label={`Navegação de ${label}`}>
        <button type="button" aria-label="Vídeo anterior" disabled={busy || items.length < 2} onClick={() => navigate(-1)}><CaretLeftIcon aria-hidden="true" /></button>
        <span className="carousel-count" role="status" aria-live="polite" aria-atomic="true"><strong>{String(index + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span><span className="sr-only"> de </span>{String(items.length).padStart(2, '0')}<span className="sr-only"> — {items[index].title}</span></span>
        <button type="button" aria-label="Próximo vídeo" disabled={busy || items.length < 2} onClick={() => navigate(1)}><CaretRightIcon aria-hidden="true" /></button>
      </div>
    </div>
  )
}

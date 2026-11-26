import { CaretDoubleLeftIcon, CaretDoubleRightIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'
import './DesktopCarousel.css'

type CarouselItem = { poster: string; title: string }

function wrap(position: number, length: number) {
  return ((position % length) + length) % length
}

export function DesktopCarousel<T extends CarouselItem>({ items, label, renderCard }: {
  items: T[]
  label: string
  renderCard: (item: T, preview: boolean, prepare: boolean, moving?: boolean) => ReactNode
}) {
  const [position, setPosition] = useState(0)
  const [theater, setTheater] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const previewVideo = useRef<HTMLVideoElement | null>(null)
  const hovering = useRef(false)
  const index = items.length ? wrap(position, items.length) : 0

  function stopPreview() {
    hovering.current = false
    previewVideo.current?.pause()
    setTheater(false)
  }

  function startPreview() {
    const video = mainRef.current?.querySelector('video')
    if (!video || hovering.current) return
    hovering.current = true
    if (previewVideo.current !== video) {
      video.muted = false
      video.loop = true
      previewVideo.current = video
    }
    setTheater(true)
    void video.play().then(() => {
      // A slow media response must not start playback after hover has ended.
      if (!hovering.current || previewVideo.current !== video) video.pause()
    }).catch(() => {
      // Native controls remain available if the browser cannot autoplay.
    })
  }

  function navigate(direction: -1 | 1) {
    if (items.length < 2) return
    stopPreview()
    const moveFocus = document.activeElement === mainRef.current
    setPosition((current) => current + direction)
    if (moveFocus) requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }))
  }

  useEffect(() => () => {
    hovering.current = false
    previewVideo.current?.pause()
  }, [])

  useEffect(() => {
    if (!theater) return
    const close = () => {
      hovering.current = false
      previewVideo.current?.pause()
      setTheater(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onVisibility = () => {
      if (document.hidden) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, { passive: true })
    window.addEventListener('blur', close)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close)
      window.removeEventListener('blur', close)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [theater])

  if (!items.length) return null

  return (
    <div className={`desktop-carousel${theater ? ' is-theater' : ''}`} role="region" aria-roledescription="carrossel" aria-label={label}>
      {theater && createPortal(<div className="desktop-theater-overlay" aria-hidden="true" />, document.body)}
      <div className="desktop-carousel-layout">
        <button className="desktop-carousel-arrow" type="button" aria-label="Vídeo anterior" disabled={items.length < 2} onClick={() => navigate(-1)}>
          <CaretDoubleLeftIcon weight="bold" aria-hidden="true" />
        </button>
        <div className="desktop-carousel-stage">
          {items.map((item, itemIndex) => {
            const offset = wrap(itemIndex - index, items.length)
            const slot = offset === 0 ? 0 : offset === 1 ? 1 : offset === items.length - 1 ? -1 : offset <= items.length / 2 ? 2 : -2
            const active = slot === 0
            const visible = Math.abs(slot) <= 1
            return (
              <div
                key={item.poster}
                ref={active ? mainRef : undefined}
                className={`desktop-carousel-slide ${active ? 'desktop-carousel-slide--main' : 'desktop-carousel-slide--preview'}${visible ? '' : ' desktop-carousel-slide--hidden'}`}
                style={{ '--slide-x': `${slot * 44}%`, '--slide-scale': active ? (theater ? 1.12 : 1) : .78 } as CSSProperties}
                role={active ? 'group' : undefined}
                aria-roledescription={active ? 'slide' : undefined}
                aria-label={active ? `${index + 1} de ${items.length}: ${item.title}` : undefined}
                tabIndex={active ? 0 : undefined}
                onPointerLeave={active ? stopPreview : undefined}
                onKeyDown={active ? (event) => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                    event.preventDefault()
                    navigate(event.key === 'ArrowRight' ? 1 : -1)
                  }
                } : undefined}
              >
                <div aria-hidden={!active || undefined} inert={!active} onPointerOver={(event) => {
                  if (active && event.pointerType !== 'touch' && event.target instanceof HTMLVideoElement) startPreview()
                }}>{renderCard(item, !active, visible)}</div>
                <button className="desktop-carousel-preview-link" hidden={active || !visible} type="button" aria-label={`Ver ${item.title}`} onClick={() => navigate(slot < 0 ? -1 : 1)} />
              </div>
            )
          })}
        </div>
        <button className="desktop-carousel-arrow" type="button" aria-label="Próximo vídeo" disabled={items.length < 2} onClick={() => navigate(1)}>
          <CaretDoubleRightIcon weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className="desktop-carousel-footer">
        <p>Passe o mouse ou dê play para assistir</p>
        <span className="carousel-count" role="status" aria-live="polite" aria-atomic="true">
          <strong>{String(index + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span><span className="sr-only"> de </span>{String(items.length).padStart(2, '0')}<span className="sr-only"> — {items[index].title}</span>
        </span>
      </div>
    </div>
  )
}

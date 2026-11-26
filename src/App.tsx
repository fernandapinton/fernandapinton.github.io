import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, ArrowUpRightIcon, AsteriskIcon, EnvelopeSimpleIcon, StarIcon, WhatsappLogoIcon } from '@phosphor-icons/react'
import type { CSSProperties, SyntheticEvent } from 'react'
import { memo, useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './components/ThemeToggle'
import { SwipeCarousel } from './components/SwipeCarousel'
import { DesktopCarousel } from './components/DesktopCarousel'
import { useDesktopCarousel } from './hooks/useDesktopCarousel'
import catalog from '../media/catalog.json'
import { mediaUrl } from './media'
import './App.css'

// Personalize a apresentação, a bio, os projetos e os links neste bloco.
const profile = {
  firstName: 'Fernanda',
  lastName: 'Pinton',
  intro: 'Fernanda Pinton interpreta MPB, jazz e pop com grande sensibilidade. De Belo Horizonte, leva sua voz a palcos e celebrações.',
  bio: [
    'Unindo a riqueza rítmica e poética da MPB à sofisticação harmônica do jazz contemporâneo e ao frescor do pop internacional, Fernanda Pinton destaca-se pela sensibilidade interpretativa e por um timbre brilhante e envolvente. Natural de Belo Horizonte, a cantora constrói apresentações marcadas pela elegância, proximidade com o público e intensa entrega emocional.',
    'Com uma curadoria de repertório cuidadosa, Fernanda Pinton transita com naturalidade entre clássicos e nomes atuais da música brasileira (como Marisa Monte, Elis Regina, Djavan, João Gilberto, Marina Sena, Céu e Mariana Froes) e grandes referências internacionais do pop e do jazz, incluindo Amy Winehouse, Raye e Laufey.',
    'Atualmente, Fernanda dedica-se aos palcos e eventos sociais na capital mineira, oferecendo uma experiência sonora sofisticada e acolhedora para recepções, jantares, celebrações e espaços culturais.',
  ],
  email: 'fernandapintonmiguel@gmail.com',
  whatsapp: '5531987154804',
  phone: '(31) 98715-4804',
  instagram: '', // Insira a URL completa do perfil.
  youtube: '',
  spotify: '',
}

// Títulos e contextos extraídos dos arquivos enviados. Edite aqui para atualizar os créditos.
// Os três primeiros vídeos aparecem em destaque, nesta ordem.
const performances = catalog.performances

function pauseOtherMedia(event: SyntheticEvent<HTMLMediaElement>) {
  document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
    if (media !== event.currentTarget) media.pause()
  })
}

const PerformanceCard = memo(function PerformanceCard({ performance, preview = false, prepare = false, moving = false }: { performance: typeof performances[number]; preview?: boolean; prepare?: boolean; moving?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const frameRequest = useRef<number | null>(null)
  const [hasFrame, setHasFrame] = useState(false)
  const [pausedFrame, setPausedFrame] = useState<string | null>(null)
  const capturedTime = useRef<number | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) video.volume = .5
    return () => {
      video?.pause()
      if (video && frameRequest.current !== null) video.cancelVideoFrameCallback?.(frameRequest.current)
    }
  }, [])

  useEffect(() => {
    if (preview) videoRef.current?.pause()
  }, [preview])

  function revealFrame(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    if (frameRequest.current !== null) video.cancelVideoFrameCallback?.(frameRequest.current)
    if (typeof video.requestVideoFrameCallback === 'function') {
      frameRequest.current = video.requestVideoFrameCallback(() => {
        setHasFrame(true)
        frameRequest.current = null
      })
    } else {
      setHasFrame(true)
    }
  }

  function capturePausedFrame(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    if (video.readyState < 2 || !video.videoWidth || capturedTime.current === video.currentTime) return
    try {
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 720 / video.videoWidth)
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      setPausedFrame(canvas.toDataURL('image/jpeg', .85))
      capturedTime.current = video.currentTime
    } catch {
      // Cross-origin sources can keep using the supplied poster instead.
    }
  }

  return (
    <article className="project" style={{ '--video-ratio': performance.aspectRatio } as CSSProperties}>
      {performance.featured && <span className="performance-badge"><StarIcon weight="fill" aria-hidden="true" />Destaque</span>}
      <div className={`performance-media${hasFrame ? ' has-frame' : ''}${preview ? ' is-preview' : ''}${moving ? ' is-moving' : ''}`}>
      <video
        ref={videoRef}
        className="performance-video"
        controls={!preview}
        muted={false}
        crossOrigin="anonymous"
        playsInline
        preload={prepare || !preview ? 'metadata' : 'none'}
        poster={mediaUrl(`posters/${performance.poster}.jpg`)}
        aria-label={`${performance.title} — ${performance.context}`}
        onPlay={pauseOtherMedia}
        onPlaying={revealFrame}
        onSeeked={revealFrame}
        onPause={capturePausedFrame}
      >
        <source src={mediaUrl(performance.src)} type="video/mp4" />
        Seu navegador não oferece reprodução de vídeo.
      </video>
      <img className="performance-poster" src={pausedFrame ?? mediaUrl(`posters/${performance.poster}.jpg`)} alt="" loading="lazy" decoding="async" draggable={false} />
      </div>
      <div className="project-copy">
        <h3>{performance.context}</h3>
        <p className="project-category"><em>{performance.title}</em></p>
        <a className="media-file-link" href={mediaUrl(performance.src)}>Abrir vídeo</a>
      </div>
    </article>
  )
})

function PerformanceCarousel({ items, label }: { items: typeof performances; label: string }) {
  const desktop = useDesktopCarousel()
  const Carousel = desktop ? DesktopCarousel : SwipeCarousel
  return (
    <Carousel items={items} label={label} renderCard={(performance, preview, prepare, moving = false) => <PerformanceCard performance={performance} preview={preview} prepare={prepare} moving={moving} />} />
  )
}

function WorkSection() {
  return (
    <section className="work section" id="trabalhos" aria-labelledby="trabalhos-title">
      <div className="shell">
        <div className="section-heading">
          <h2 id="trabalhos-title">Apresentações</h2>
          <p>Fernanda ao vivo</p>
        </div>
        <PerformanceCarousel items={performances} label="Apresentações de Fernanda Pinton" />
      </div>
    </section>
  )
}

function App() {
  const name = `${profile.firstName} ${profile.lastName}`
  const contacts = [
    { label: 'Whatsapp', hoverLabel: profile.phone, href: `https://wa.me/${profile.whatsapp}`, icon: WhatsappLogoIcon, ariaLabel: `Conversar pelo Whatsapp: ${profile.phone}` },
    { label: 'Email', hoverLabel: profile.email, href: `mailto:${profile.email}`, icon: EnvelopeSimpleIcon, ariaLabel: `E-mail: ${profile.email}` },
    { label: 'Instagram', hoverLabel: null, href: profile.instagram, icon: null, ariaLabel: 'Instagram' },
    { label: 'YouTube', hoverLabel: null, href: profile.youtube, icon: null, ariaLabel: 'YouTube' },
    { label: 'Spotify', hoverLabel: null, href: profile.spotify, icon: null, ariaLabel: 'Spotify' },
  ].filter(({ href }) => href)

  return (
    <>
      <a className="skip-link" href="#conteudo">Ir para o conteúdo</a>
      <header className="site-header" id="inicio">
        <div className="shell header-inner">
          <a className="wordmark" href="#inicio" aria-label={`${name}, início`}>
            {profile.firstName} <span className="surname">{profile.lastName}</span>
          </a>
          <nav aria-label="Navegação principal">
            <a href="#sobre">Sobre</a>
            <a href="#trabalhos">Trabalhos</a>
            <a className="nav-contact" href="#contato">Contato <ArrowUpRightIcon aria-hidden="true" /></a>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <main id="conteudo">
        <section className="hero" aria-labelledby="intro">
          <div className="shell hero-inner">
            <div className="hero-copy">
              <h1 id="intro"><span className="first-name">{profile.firstName}</span> <span className="surname">{profile.lastName}</span></h1>
              <p className="hero-description">{profile.intro}</p>
              <div className="hero-actions">
                <a className="primary-link" href="#trabalhos">Ouça Fernanda <ArrowDownIcon weight="bold" aria-hidden="true" /></a>
                <a className="text-link" href="#sobre">Sobre <ArrowRightIcon weight="bold" aria-hidden="true" /></a>
              </div>
            </div>
            <div className="hero-art">
              <div className="hero-photo">
                <img src={mediaUrl(catalog.hero)} alt="Fernanda Pinton cantando ao microfone durante uma apresentação" width="576" height="1280" fetchPriority="high" />
              </div>
              <AsteriskIcon className="hero-spark" weight="bold" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="about" id="sobre" aria-labelledby="about-title">
          <div className="shell about-inner">
            <h2 id="about-title">Sobre</h2>
            <div className="about-copy">
              {profile.bio.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </section>

        <WorkSection />

        <section className="contact" id="contato" aria-labelledby="contact-title">
          <div className="shell contact-inner">
            <div>
              <h2 id="contact-title">Entre em contato</h2>
              <p>Shows, recepções, jantares e celebrações em Belo Horizonte.</p>
            </div>
            <ul aria-label="Links de contato">
              {contacts.map(({ label, hoverLabel, href, icon: Icon, ariaLabel }) => (
                <li key={label}>
                  <a href={href} aria-label={ariaLabel}>
                    <span className="contact-label">
                      {Icon && <Icon weight="bold" aria-hidden="true" />}
                      <span className={`contact-text${hoverLabel ? ' contact-text--reveal' : ''}`}>
                        <span className="contact-text-default">{label}</span>
                        {hoverLabel && <span className="contact-text-hover" aria-hidden="true">{hoverLabel}</span>}
                      </span>
                    </span>
                    <ArrowUpRightIcon weight="bold" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="shell site-footer">
        <span>© {name}</span>
        <a className="text-link" href="#inicio">Voltar ao topo <ArrowUpIcon aria-hidden="true" /></a>
      </footer>
    </>
  )
}

export default App

import { PauseIcon, PlayIcon, SpeakerHighIcon, SpeakerSlashIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import type { CSSProperties, SyntheticEvent } from 'react'

function formatTime(seconds: number) {
  const wholeSeconds = Math.floor(seconds)
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`
}

export default function AudioPlayer({ src, onPlay }: { src: string; onPlay: (event: SyntheticEvent<HTMLMediaElement>) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState('')

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    setError('')
    try {
      await audio.play()
    } catch {
      setError('Não foi possível reproduzir. Tente novamente ou abra o áudio pelo link.')
    }
  }

  function updateDuration(event: SyntheticEvent<HTMLAudioElement>) {
    const value = event.currentTarget.duration
    setDuration(Number.isFinite(value) ? value : 0)
  }

  return (
    <div className="audio-player" role="group" aria-label="Player de Gravação Feluma">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={(event) => { setPlaying(true); onPlay(event) }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={updateDuration}
        onDurationChange={updateDuration}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setMuted(event.currentTarget.muted)
        }}
        onError={() => setError('Não foi possível carregar a gravação. Abra o áudio pelo link.')}
      >
        <source src={src} type="audio/mpeg" />
      </audio>
      <button className="audio-play" type="button" aria-label={playing ? 'Pausar gravação' : 'Reproduzir gravação'} onClick={togglePlayback}>
        {playing ? <PauseIcon weight="fill" aria-hidden="true" /> : <PlayIcon weight="fill" aria-hidden="true" />}
      </button>
      <div className="audio-timeline">
        <input
          className="audio-range"
          type="range"
          aria-label="Posição na gravação"
          aria-valuetext={`${formatTime(currentTime)} de ${formatTime(duration)}`}
          min="0"
          max={duration || 1}
          step="0.1"
          value={Math.min(currentTime, duration)}
          disabled={!duration}
          style={{ '--range-progress': `${duration ? currentTime / duration * 100 : 0}%` } as CSSProperties}
          onChange={(event) => {
            const value = Number(event.target.value)
            if (audioRef.current) audioRef.current.currentTime = value
            setCurrentTime(value)
          }}
        />
        <span className="audio-time">{formatTime(currentTime)} <span>/ {duration ? formatTime(duration) : '–:––'}</span></span>
      </div>
      <div className="audio-volume">
        <button type="button" aria-label={muted || volume === 0 ? 'Ativar som' : 'Silenciar'} onClick={() => {
          const audio = audioRef.current
          if (!audio) return
          if (audio.volume === 0) audio.volume = 1
          audio.muted = !audio.muted && volume > 0
        }}>
          {muted || volume === 0 ? <SpeakerSlashIcon aria-hidden="true" /> : <SpeakerHighIcon aria-hidden="true" />}
        </button>
        <input
          className="audio-range"
          type="range"
          aria-label="Volume"
          aria-valuetext={`${Math.round((muted ? 0 : volume) * 100)}%`}
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          style={{ '--range-progress': `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
          onChange={(event) => {
            if (!audioRef.current) return
            audioRef.current.volume = Number(event.target.value)
            audioRef.current.muted = false
          }}
        />
      </div>
      {error && <p className="audio-error" role="alert">{error}</p>}
    </div>
  )
}

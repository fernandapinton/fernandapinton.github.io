import { Desktop, Moon, Sun } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react'
import type { ThemePreference } from '../contexts/theme'
import { useTheme } from '../hooks/useTheme'

const themeOptions = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'system', label: 'Automático (sistema)', Icon: Desktop },
  { value: 'dark', label: 'Escuro', Icon: Moon },
] satisfies { value: ThemePreference; label: string; Icon: typeof Sun }[]

export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [tooltip, setTooltip] = useState<ThemePreference | null>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const unselectedOptions = themeOptions.filter(option => option.value !== preference)

  function getOptionOffset(value: ThemePreference) {
    if (value === preference) return 0
    return value === unselectedOptions[0].value ? -1 : 1
  }

  function closeControl(restoreFocus = false) {
    setExpanded(false)
    setTooltip(null)
    if (restoreFocus) {
      controlRef.current?.querySelector<HTMLButtonElement>("button[aria-pressed='true']")?.focus()
    }
  }

  useEffect(() => {
    if (!expanded) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!controlRef.current?.contains(event.target as Node)) closeControl()
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [expanded])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault()
      closeControl(true)
      return
    }

    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    if (!expanded) setExpanded(true)

    requestAnimationFrame(() => {
      const buttons = [...controlRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []]
        .sort((first, second) => Number(first.dataset.offset) - Number(second.dataset.offset))
      const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
      if (currentIndex < 0) return

      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length
      buttons[nextIndex]?.focus()
    })
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) closeControl()
  }

  function selectTheme(value: ThemePreference) {
    setTooltip(null)
    if (!expanded && value === preference) {
      setExpanded(true)
      return
    }

    if (value !== preference) setPreference(value)
    setExpanded(false)
  }

  return (
    <div
      ref={controlRef}
      className={`theme-control${expanded ? ' is-expanded' : ''}`}
      role="group"
      aria-label="Tema de aparência"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onPointerLeave={event => { if (event.pointerType === 'mouse') closeControl() }}
    >
      <div className="theme-control-panel">
        {themeOptions.map(({ value, label, Icon }) => {
          const selected = preference === value
          const offset = getOptionOffset(value)
          return (
            <span
              className={`theme-option${selected ? ' is-selected' : ''}`}
              key={value}
              style={{ '--theme-option-offset': offset } as CSSProperties}
              onPointerEnter={event => { if (selected && event.pointerType === 'mouse') setExpanded(true) }}
            >
              <button
                type="button"
                className="theme-option-button"
                aria-label={label}
                aria-pressed={selected}
                aria-expanded={selected ? expanded : undefined}
                aria-hidden={!expanded && !selected}
                data-offset={offset}
                tabIndex={expanded || selected ? 0 : -1}
                onClick={() => selectTheme(value)}
                onPointerEnter={event => { if (event.pointerType === 'mouse') setTooltip(value) }}
                onPointerLeave={() => setTooltip(current => current === value ? null : current)}
              >
                <Icon size={18} aria-hidden="true" />
              </button>
              <span className="theme-tooltip" role="tooltip" hidden={tooltip !== value}>{label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { resolveTheme, ThemeContext, THEME_STORAGE_KEY } from './theme'
import type { Theme, ThemePreference } from './theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, updatePreference] = useState<ThemePreference>(() => {
    const applied = document.documentElement.dataset.themePreference
    return applied === 'light' || applied === 'system' ? applied : 'dark'
  })
  const [theme, setTheme] = useState<Theme>(() => resolveTheme(preference))

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const sync = () => {
      const resolved = resolveTheme(preference)
      setTheme(resolved)
      document.documentElement.dataset.theme = resolved
      document.documentElement.dataset.themePreference = preference
      document.documentElement.style.colorScheme = resolved
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#160f1b' : '#fffcf2')
    }
    sync()
    media?.addEventListener('change', sync)
    return () => media?.removeEventListener('change', sync)
  }, [preference])

  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
      updatePreference(event.newValue === 'light' || event.newValue === 'system' ? event.newValue : 'dark')
    }
    window.addEventListener('storage', syncStorage)
    return () => window.removeEventListener('storage', syncStorage)
  }, [])

  function setPreference(next: ThemePreference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch { /* The current tab still works when storage is unavailable. */ }
    updatePreference(next)
  }

  return <ThemeContext.Provider value={{ theme, preference, setPreference }}>{children}</ThemeContext.Provider>
}

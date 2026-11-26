import { createContext } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'
export const THEME_STORAGE_KEY = 'fefe-theme-preference'
export function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system'
    ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference
}
export type ThemeContextValue = { theme: Theme; preference: ThemePreference; setPreference: (preference: ThemePreference) => void }
export const ThemeContext = createContext<ThemeContextValue | null>(null)

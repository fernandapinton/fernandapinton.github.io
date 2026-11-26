import { useSyncExternalStore } from 'react'

const desktopQuery = '(min-width: 900px) and (hover: hover) and (pointer: fine)'

function subscribe(onChange: () => void) {
  const query = window.matchMedia(desktopQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useDesktopCarousel() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(desktopQuery).matches, () => false)
}

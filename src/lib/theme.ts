import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

/** Mirrors the pre-paint script in index.html: an explicit choice wins, otherwise follow the OS */
export function setTheme(mode: ThemeMode) {
  try {
    if (mode === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // Storage blocked: the class below still applies for this session
  }
  const dark = mode === 'dark' || (mode === 'system' && media().matches)
  document.documentElement.classList.toggle('dark', dark)
}

export function isDarkTheme() {
  return document.documentElement.classList.contains('dark')
}

/** Re-renders when the .dark class on <html> changes (OS change or manual switch) */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribeToThemeClass, isDarkTheme, () => false)
}

function subscribeToThemeClass(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

/** The explicit choice saved by the pre-paint script's key, or "system" */
export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

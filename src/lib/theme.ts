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

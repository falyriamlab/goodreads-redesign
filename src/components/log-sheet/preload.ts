/**
 * The LogSheet chunk (and vaul with it) isn't in the initial bundle. It's preloaded:
 * - shortly after any control that opens it is on screen (useLogSheet): on a phone there's no hover, so a
 *   visible "Finished it" is the intent signal;
 * - right away when a pointer or keyboard focus reaches one ([data-log-sheet-opener], LogSheetProvider).
 */
type LogSheetModule = typeof import('./LogSheet')

let loaded: LogSheetModule | null = null
let loading: Promise<LogSheetModule> | null = null

/** The module once it's in memory: the provider then renders the sheet on the same tap (no Suspense, no wait) */
export const loadedLogSheet = () => loaded

export function loadLogSheet(): Promise<LogSheetModule> {
  loading ??= import('./LogSheet').then(
    (m) => (loaded = m),
    (error: unknown) => {
      loading = null // offline: try again on the next opener, hover or tap
      throw error
    },
  )
  return loading
}

export function preloadLogSheet() {
  loadLogSheet().catch(() => {})
}

/**
 * Once the main thread is free after the opener rendered. The route's own chunk is already in by then (the opener
 * is part of it), and scripts outrank the covers still loading.
 */
export function schedulePreload(): () => void {
  if (loading) return () => {}
  if (typeof window.requestIdleCallback !== 'function') {
    const timer = window.setTimeout(preloadLogSheet, 50) // Safari
    return () => window.clearTimeout(timer)
  }
  const idle = window.requestIdleCallback(preloadLogSheet, { timeout: 300 })
  return () => window.cancelIdleCallback(idle)
}

/**
 * Page chunks that fail to load. After a new deploy the old hashed chunks are gone (404), so an app that was
 * already open fails on its next navigation: reloading once picks up the new build. Offline, a reload
 * can't help (and would show the browser's own offline page), so it never reloads then.
 */
const KEY = 'chunk-reload-at'
const WINDOW_MS = 10_000

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  )
}

/** Reloads the page if it's a missing chunk, we're online and we haven't just reloaded for it. Returns true when it reloads. */
export function reloadOnceForChunkError(error: unknown, now = Date.now(), reload = () => window.location.reload()): boolean {
  if (!isChunkLoadError(error) || !navigator.onLine) return false
  try {
    const last = sessionStorage.getItem(KEY)
    // Reloaded a moment ago and it failed again: show the recovery screen instead of looping
    if (last !== null && now - Number(last) < WINDOW_MS) return false
    sessionStorage.setItem(KEY, String(now))
  } catch {
    return false
  }
  reload()
  return true
}

/**
 * Runs fn in idle time after the page has loaded, for preloading what the first screen doesn't need.
 * Waiting for `load` (plus `delay`) matters: the main thread is also "idle" while the route's own chunk is still
 * downloading, and a preload then would compete with it. Returns a cancel function.
 */
export function whenIdle(fn: () => void, delay = 1500): () => void {
  let timer: number | undefined
  let idle: number | undefined
  const schedule = () => {
    timer = window.setTimeout(() => {
      // Safari has no requestIdleCallback
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(fn, { timeout: 2000 })
      else fn()
    }, delay)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })
  return () => {
    window.removeEventListener('load', schedule)
    window.clearTimeout(timer)
    if (idle !== undefined) window.cancelIdleCallback(idle)
  }
}

import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * Back closes the top overlay (Android back button, iOS edge swipe, browser Back), instead of leaving the page.
 *
 * While an overlay is open it owns one history entry at the same URL. Its state copies the router's
 * (same key and index, so React Router sees a no-op POP) plus a stack of open overlay ids.
 * - Back pops that entry: every overlay that's no longer in the stack closes.
 * - Closing from the UI (×, swipe, Escape, Save) consumes the entry with history.back().
 * - Navigating away while it's open leaves the entry behind; when Back later lands on it, it's skipped,
 *   so there's never a Back press that does nothing.
 */
const STACK = '__overlays'
const openIds = new Set<string>()

const stackOf = (state: unknown): string[] => {
  const stack = (state as Record<string, unknown> | null)?.[STACK]
  return Array.isArray(stack) ? (stack as string[]) : []
}

// Landing on an entry whose overlay isn't open any more (stale): step over it
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    const stack = stackOf(event.state)
    if (stack.length > 0 && !openIds.has(stack[stack.length - 1])) history.back()
  })
}

export function useBackToClose(open: boolean, close: () => void) {
  const id = useId()
  const closeRef = useRef(close)
  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return
    openIds.add(id)
    const state = (history.state ?? {}) as Record<string, unknown>
    const stack = stackOf(state)
    // Already on top (StrictMode re-runs this effect): keep the one entry
    if (stack[stack.length - 1] !== id) history.pushState({ ...state, [STACK]: [...stack, id] }, '')

    const onPop = (event: PopStateEvent) => {
      if (!stackOf(event.state).includes(id)) {
        openIds.delete(id)
        closeRef.current()
      }
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      if (!openIds.delete(id)) return // already closed by Back
      // Closed from the UI. Wait a tick: if the close came with a navigation (a link in the sheet),
      // the router pushes its entry first and ours is no longer on top, so it's left for the skip above.
      setTimeout(() => {
        if (openIds.has(id)) return // reopened meanwhile (StrictMode)
        const stack = stackOf(history.state)
        if (stack[stack.length - 1] === id) history.back()
      }, 0)
    }
  }, [open, id])
}

/**
 * Open state for an overlay root (Drawer, Popover, DropdownMenu), controlled or not, with Back wired in.
 * Returns the props to spread on the primitive's Root.
 */
export function useBackClosableState({
  open: openProp,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false)
  const controlled = openProp !== undefined
  const open = controlled ? openProp : uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [controlled, onOpenChange],
  )
  useBackToClose(open, () => setOpen(false))
  return { open, onOpenChange: setOpen }
}

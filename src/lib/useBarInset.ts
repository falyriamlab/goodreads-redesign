import { useEffect, useId, type RefObject } from 'react'

/**
 * Fixed and sticky bars publish their real height as --bar-inset-top / --bar-inset-bottom on <html>, which
 * index.css turns into scroll-padding: keyboard focus and scrollIntoView then stop short of the bars instead of
 * leaving the focused control underneath them. A bar that isn't fixed or sticky at the moment (TopBar in
 * landscape, the Discover button in landscape) or is hidden counts as 0.
 */
const heights = new Map<string, { edge: 'top' | 'bottom'; px: number }>()

function publish() {
  const sum = (edge: 'top' | 'bottom') => [...heights.values()].filter((h) => h.edge === edge).reduce((s, h) => s + h.px, 0)
  document.documentElement.style.setProperty('--bar-inset-top', `${sum('top')}px`)
  document.documentElement.style.setProperty('--bar-inset-bottom', `${sum('bottom')}px`)
}

export function useBarInset(ref: RefObject<HTMLElement | null>, edge: 'top' | 'bottom') {
  const id = useId()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const position = getComputedStyle(el).position
      const overlays = position === 'fixed' || position === 'sticky'
      heights.set(id, { edge, px: overlays ? el.getBoundingClientRect().height : 0 })
      publish()
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Rotating the phone switches bars between fixed and static (index.css, the "short" variant)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      heights.delete(id)
      publish()
    }
  }, [ref, edge, id])
}

/**
 * A screen's own action bar (composer, selection actions) is mounted: in landscape the bottom nav steps aside
 * for it (index.css), like the tab bar in a chat app. Screens still have a back button in the TopBar.
 */
let actionBars = 0
export function useActionBar() {
  useEffect(() => {
    actionBars++
    document.documentElement.dataset.actionBar = ''
    return () => {
      actionBars--
      if (actionBars === 0) delete document.documentElement.dataset.actionBar
    }
  }, [])
}

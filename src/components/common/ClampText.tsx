import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type ClampTextProps = {
  children: string
  /** Tailwind line-clamp class, e.g. "line-clamp-3" */
  clamp: string
  className?: string
}

/** Clamped paragraph with a "Read more" toggle that only appears when text is actually cut */
export function ClampText({ children, clamp, className }: ClampTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded, children])

  return (
    <div>
      <p ref={ref} className={cn('whitespace-pre-line', !expanded && clamp, className)}>
        {children}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

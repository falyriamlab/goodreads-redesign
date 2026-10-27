import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useActionBar, useBarInset } from '@/lib/useBarInset'

type Props = {
  /** Accessible name of the form landmark, e.g. "Comment on this buddy read" */
  label: string
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

/**
 * A composer pinned above the bottom nav. It renders a spacer of its own height,
 * so the end of the page never hides behind it.
 */
export function FixedComposer({ label, onSubmit, children }: Props) {
  const ref = useRef<HTMLFormElement>(null)
  const [height, setHeight] = useState(0)
  useBarInset(ref, 'bottom')
  useActionBar()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setHeight(el.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div aria-hidden="true" style={{ height }} />
      <form
        ref={ref}
        aria-label={label}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(e)
        }}
        className="fixed inset-x-0 bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))] short:bottom-[env(safe-area-inset-bottom)] z-40 mx-auto w-full max-w-app border-t border-border bg-background px-4 py-3 short:flex short:items-end short:gap-3 short:py-2"
      >
        {children}
      </form>
    </>
  )
}

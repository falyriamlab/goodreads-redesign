import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from '@/lib/toast'
import { LogSheetContext, type LogSheetOptions } from './context'
import { loadedLogSheet, loadLogSheet, preloadLogSheet } from './preload'

type Session = { id: number; bookId: string; options: LogSheetOptions }

// Pointer or keyboard focus on a control that opens the sheet: preload right away
const OPENER = '[data-log-sheet-opener]'

export function LogSheetProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const counter = useRef(0)
  // Not React.lazy: a Suspense boundary holds its reveal ~300ms even when the chunk is already here.
  // Preloaded (see preload.ts), the sheet renders on the same tap; otherwise as soon as it arrives.
  const [mod, setMod] = useState(loadedLogSheet)
  useEffect(() => {
    if (!session || mod) return
    loadLogSheet().then(setMod, () => {
      setSession(null)
      setOpen(false)
      toast("Couldn't open that. Check your connection and try again.")
    })
  }, [session, mod])

  useEffect(() => {
    const onIntent = (event: Event) => {
      if (event.target instanceof Element && event.target.closest(OPENER)) preloadLogSheet()
    }
    const events = ['pointerover', 'pointerdown', 'focusin'] as const
    events.forEach((type) => document.addEventListener(type, onIntent, { passive: true }))
    return () => events.forEach((type) => document.removeEventListener(type, onIntent))
  }, [])

  const openSheet = useCallback((bookId: string, options: LogSheetOptions = {}) => {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // A menu item disappears with its menu, so callers from menus pass the trigger explicitly
    returnFocusRef.current = options.returnFocus ?? active
    // Preloaded after this provider mounted: pick it up now, so the sheet renders in this same update
    const preloaded = loadedLogSheet()
    if (preloaded) setMod(preloaded)
    counter.current += 1
    setSession({ id: counter.current, bookId, options })
    setOpen(true)
  }, [])

  const api = useMemo(() => ({ open: openSheet }), [openSheet])

  return (
    <LogSheetContext.Provider value={api}>
      {children}
      {session && mod && (
          <mod.LogSheet
            // New key per open: the form re-initializes from the store every time
            key={session.id}
            bookId={session.bookId}
            options={session.options}
            open={open}
            onOpenChange={setOpen}
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              const target = returnFocusRef.current
              if (target?.isConnected) return target.focus()
              // The opener can disappear (e.g. "Finished it" leaves Currently reading):
              // fall back to the page heading so focus never drops to <body>
              const heading = document.querySelector<HTMLElement>('main h1')
              if (heading) {
                heading.tabIndex = -1
                heading.focus()
              }
            }}
          />
      )}
    </LogSheetContext.Provider>
  )
}

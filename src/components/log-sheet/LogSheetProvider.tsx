import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { LogSheetContext, type LogSheetOptions } from './context'
import { LogSheet } from './LogSheet'

type Session = { id: number; bookId: string; options: LogSheetOptions }

export function LogSheetProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const counter = useRef(0)

  const openSheet = useCallback((bookId: string, options: LogSheetOptions = {}) => {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // A menu item disappears with its menu, so callers from menus pass the trigger explicitly
    returnFocusRef.current = options.returnFocus ?? active
    counter.current += 1
    setSession({ id: counter.current, bookId, options })
    setOpen(true)
  }, [])

  const api = useMemo(() => ({ open: openSheet }), [openSheet])

  return (
    <LogSheetContext.Provider value={api}>
      {children}
      {session && (
        <LogSheet
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

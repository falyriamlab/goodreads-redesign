import { useLayoutEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { LogSheetProvider } from '@/components/log-sheet/LogSheetProvider'
import { Toaster } from '@/components/ui/sonner'
import { syncDirectionFromSearch } from '@/lib/direction'

// Toasts go at the top, just under the TopBar: the bottom is taken by the nav and the log sheet,
// and a toast there would cover sheet actions (e.g. "Start reading" in What's next?)
const toastOffset = { top: 'calc(3.5rem + 0.5rem + env(safe-area-inset-top))' }

/** Wraps every route: the log sheet can be opened from anywhere, and it can navigate */
export function RootLayout() {
  const { search } = useLocation()
  // Dev toggle for the visual-pass directions (?direction=a|b|current)
  useLayoutEffect(() => syncDirectionFromSearch(search), [search])

  return (
    <LogSheetProvider>
      <Outlet />
      {/* New pages start at the top; back/forward restores the previous position */}
      <ScrollRestoration />
      <Toaster
        position="top-center"
        offset={toastOffset}
        mobileOffset={toastOffset}
        toastOptions={{
          classNames: {
            toast: 'cn-toast font-sans',
            // Undo needs a real touch target (sonner's default button is 24px tall)
            actionButton: 'h-11! min-w-11! px-4! text-sm! font-semibold!',
            // Second action (e.g. "Change shelf"): theme tokens, same 44px target
            cancelButton: 'h-11! min-w-11! px-4! text-sm! font-semibold! bg-muted! text-foreground! border! border-border!',
          },
        }}
      />
    </LogSheetProvider>
  )
}

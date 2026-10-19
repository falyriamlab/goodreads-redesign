import { Outlet, useLocation } from 'react-router'
import { useDirection } from '@/lib/direction'
import { cn } from '@/lib/utils'
import { BottomNav } from './BottomNav'

/** Mobile-first column, centered at max 430px on larger screens */
export function AppShell() {
  const direction = useDirection()
  const { pathname } = useLocation()
  // visual-pass: direction B's pill nav only on the two explored screens
  const pill = direction === 'b' && (pathname === '/' || pathname.startsWith('/book/'))

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-background sm:border-x sm:border-border">
      {/* Bottom padding = nav height (3.5rem + 1px border) + safe area, so content never hides behind the nav */}
      <main
        className={cn(
          'flex flex-1 flex-col',
          pill ? 'pb-[calc(4.5rem+1.5rem+env(safe-area-inset-bottom))]' : 'pb-[calc(3.5rem+1px+env(safe-area-inset-bottom))]',
        )}
      >
        <Outlet />
      </main>
      <BottomNav variant={pill ? 'pill' : 'bar'} />
    </div>
  )
}

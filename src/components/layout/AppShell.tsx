import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'

/** Mobile-first column, centered at max 430px on larger screens */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-background sm:border-x sm:border-border">
      {/* Bottom padding = nav height (3.5rem + 1px border) + safe area, so content never hides behind the nav */}
      <main className="flex flex-1 flex-col pb-[calc(3.5rem+1px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

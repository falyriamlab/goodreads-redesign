import { Home, Library, Search, User, Users, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

type Tab = {
  to: string
  label: string
  icon: LucideIcon
  /** Exact match only (Home would otherwise match every route) */
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  // Not `end`: /discover/search keeps the Discover tab active
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
]

/** Direction B (visual-pass): a floating pill. The active tab is a filled pill + bold label, never color alone. */
function PillNav() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-app px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <ul className="grid grid-cols-5 gap-1 rounded-full border border-border bg-card/95 p-1.5 text-card-foreground shadow-cover backdrop-blur">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[0.6875rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  isActive ? 'bg-foreground font-bold text-background' : 'font-medium text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function BottomNav({ variant = 'bar' }: { variant?: 'bar' | 'pill' }) {
  if (variant === 'pill') return <PillNav />
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-app border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            {/* NavLink sets aria-current="page" on the active link */}
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                  // Active state uses text-foreground (primary on background is < 3:1 in light mode)
                  // plus weight and an indicator bar, so it never relies on color alone
                  isActive
                    ? 'font-semibold text-foreground before:absolute before:inset-x-5 before:top-0 before:h-0.5 before:rounded-full before:bg-primary'
                    : 'font-medium text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6" strokeWidth={isActive ? 2.5 : 1.75} aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

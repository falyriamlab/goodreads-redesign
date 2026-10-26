import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TopBarProps = {
  /** Rendered as the page's <h1>. Omit when the page has its own <h1> (e.g. the book hero). */
  title?: string
  /** Right-aligned slot, e.g. icon buttons */
  actions?: ReactNode
  /** Shows a back button (for screens outside the bottom nav, like Search or a book) */
  back?: boolean
  /** Where Back goes on a direct visit with no history */
  backFallback?: string
  className?: string
}

export function TopBar({ title, actions, back = false, backFallback = '/', className }: TopBarProps) {
  const navigate = useNavigate()

  function goBack() {
    // react-router stores the history index; fall back on a direct visit
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(backFallback, { replace: true })
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/80',
        className,
      )}
    >
      <div className="flex h-14 items-center gap-1 px-2">
        {back && (
          <Button variant="ghost" size="icon" className="size-11" aria-label="Go back" onClick={goBack}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </Button>
        )}
        {title ? (
          <h1 className={cn('min-w-0 flex-1 truncate text-2xl font-bold tracking-tight', !back && 'pl-2')}>
            {title}
          </h1>
        ) : (
          <div className="flex-1" />
        )}
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </div>
    </header>
  )
}

type TopBarIconButtonProps = {
  label: string
  icon: ReactNode
  onClick?: () => void
  /** Renders a link instead of a button */
  to?: string
}

/** Icon-only action for the TopBar: 44px touch target, accessible name via aria-label */
export function TopBarIconButton({ label, icon, onClick, to }: TopBarIconButtonProps) {
  if (to) {
    return (
      <Button asChild variant="ghost" size="icon" className="size-11 [&_svg]:size-5">
        <Link to={to} aria-label={label}>
          {icon}
        </Link>
      </Button>
    )
  }
  return (
    <Button variant="ghost" size="icon" className="size-11 [&_svg]:size-5" aria-label={label} onClick={onClick}>
      {icon}
    </Button>
  )
}

type TopBarBadgeLinkProps = {
  /** "Notifications": the accessible name becomes "Notifications, 3 unread" */
  label: string
  icon: ReactNode
  to: string
  count: number
}

/** Icon link with an unread badge. The badge shows the number (not just a colored dot). */
export function TopBarBadgeLink({ label, icon, to, count }: TopBarBadgeLinkProps) {
  return (
    <Button asChild variant="ghost" size="icon" className="relative size-11 [&_svg]:size-5">
      <Link to={to} aria-label={count > 0 ? `${label}, ${count} unread` : label}>
        {icon}
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[0.6875rem] leading-none font-bold text-background ring-2 ring-background tabular-nums"
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
    </Button>
  )
}

import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { seeMoreClass } from '@/lib/ui'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  title: ReactNode
  kicker?: string
  /** One line under the title, e.g. why a recommendation fits */
  note?: string
  /** "See more" / "See all", always right-aligned. srLabel adds context for screen readers. */
  link?: { to: string; label: 'See more' | 'See all'; srLabel?: string }
  /** Anything else on the right (e.g. a button) when there's no link */
  action?: ReactNode
  /** Heading level stays h2; tabIndex lets deep links move focus to it */
  focusable?: boolean
  className?: string
}

/** Marginalia rule 5: one h2 style for every section, with the link on the right */
export function SectionHeader({ id, title, kicker, note, link, action, focusable, className }: Props) {
  return (
    <div className={cn('flex items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        {kicker && <p className="kicker text-muted-foreground">{kicker}</p>}
        <h2 id={id} tabIndex={focusable ? -1 : undefined} className="section-title outline-none">
          {title}
        </h2>
        {note && <p className="mt-0.5 text-sm text-muted-foreground">{note}</p>}
      </div>
      {link ? (
        <Link to={link.to} className={seeMoreClass}>
          {link.label}
          {link.srLabel && <span className="sr-only"> {link.srLabel}</span>}
        </Link>
      ) : (
        action
      )}
    </div>
  )
}

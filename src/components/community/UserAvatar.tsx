import { Link } from 'react-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'
import type { Author } from './people'

type Props = {
  author: Author
  size?: 'sm' | 'md'
  /** Render as a 44px link to the profile (default) or as plain decoration */
  link?: boolean
  className?: string
}

/** Initials avatar. As a link, its name is "{name}'s profile". */
export function UserAvatar({ author, size = 'md', link = true, className }: Props) {
  const avatar = (
    <Avatar className={cn(size === 'md' ? 'size-10' : 'size-8')}>
      <AvatarFallback
        className={cn(
          'font-semibold',
          // You = ink, everyone else = stone (neutral: --primary is for actions)
          author.isMe ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground',
          size === 'sm' && 'text-xs',
        )}
      >
        {initials(author.name)}
      </AvatarFallback>
    </Avatar>
  )
  if (!link) return <span aria-hidden="true" className={cn('shrink-0', className)}>{avatar}</span>
  return (
    <Link
      to={author.href}
      aria-label={author.isMe ? 'Your profile' : `${author.name}'s profile`}
      className={cn(
        'flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        className,
      )}
    >
      {avatar}
    </Link>
  )
}

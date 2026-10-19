import { ThumbsUp } from 'lucide-react'
import { likeCount, likeKey, type LikeKind } from '@/lib/community'
import { cn } from '@/lib/utils'
import { useLibrary } from '@/state/library'

type Props = {
  kind: LikeKind
  id: string
  /** Likes from other people */
  base: number
  className?: string
}

/**
 * Toggle with a fixed name ("Like") and aria-pressed for the state.
 * The count sits next to the button (not inside), so the name never changes.
 * Liked = filled icon + bold text, not just color.
 */
export function LikeButton({ kind, id, base, className }: Props) {
  const key = likeKey(kind, id)
  const liked = useLibrary((s) => s.likes.includes(key))
  const toggleLike = useLibrary((s) => s.toggleLike)
  const count = likeCount(base, liked)

  return (
    <span className={cn('inline-flex items-center', className)}>
      <button
        type="button"
        aria-pressed={liked}
        onClick={() => toggleLike(key)}
        className={cn(
          'inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-md px-2 text-sm transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          liked ? 'font-semibold text-foreground' : 'text-muted-foreground',
        )}
      >
        <ThumbsUp className={cn('size-4', liked && 'fill-current')} aria-hidden="true" />
        Like
      </button>
      <span className={cn('text-sm tabular-nums', liked ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {count}
        <span className="sr-only"> {count === 1 ? 'like' : 'likes'}</span>
      </span>
    </span>
  )
}

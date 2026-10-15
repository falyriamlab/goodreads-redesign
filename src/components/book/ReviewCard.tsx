import { useId, useLayoutEffect, useRef, useState } from 'react'
import { BadgeCheck, EyeOff, Heart, MessageCircle, ThumbsUp } from 'lucide-react'
import type { Review } from '@/types/review'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StarRating } from './StarRating'

type ReviewCardProps = {
  review: Review
  className?: string
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export function ReviewCard({ review, className }: ReviewCardProps) {
  const textId = useId()
  const [revealed, setRevealed] = useState(!review.containsSpoilers)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const [liked, setLiked] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  // Only offer "Read more" when the 4-line clamp actually cuts text off
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el || expanded) return
    const measure = () => setOverflowing(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [expanded, revealed])

  return (
    <article className={cn('space-y-3 rounded-lg border border-border bg-card p-4 text-card-foreground', className)}>
      <header className="flex items-start gap-3">
        <Avatar size="lg">
          {review.author.avatarUrl && <AvatarImage src={review.author.avatarUrl} alt="" />}
          <AvatarFallback className="font-semibold">{initials(review.author.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{review.author.name}</h3>
            <span className="text-xs text-muted-foreground">· {review.postedAgo}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StarRating value={review.rating} size="sm" showValue />
            {review.loved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium">
                <Heart className="size-3.5 fill-current" aria-hidden="true" />
                Loved it
              </span>
            )}
            {review.verifiedRead && (
              <Badge variant="outline">
                <BadgeCheck aria-hidden="true" />
                Verified read
              </Badge>
            )}
          </div>
        </div>
      </header>

      {review.containsSpoilers && (
        <button
          type="button"
          aria-expanded={revealed}
          aria-controls={textId}
          onClick={() => setRevealed((v) => !v)}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted px-3 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <EyeOff className="size-4" aria-hidden="true" />
          {revealed ? 'Hide spoilers' : 'Spoilers ahead · Tap to reveal'}
        </button>
      )}

      <div id={textId} hidden={!revealed}>
        <p
          ref={textRef}
          className={cn('font-serif text-[0.9375rem] leading-relaxed whitespace-pre-line', !expanded && 'line-clamp-4')}
        >
          {review.text}
        </p>
        {(overflowing || expanded) && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      <footer className="flex items-center gap-1 text-sm text-muted-foreground">
        <button
          type="button"
          aria-pressed={liked}
          onClick={() => setLiked((v) => !v)}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            liked && 'font-semibold text-foreground',
          )}
        >
          <ThumbsUp className={cn('size-4', liked && 'fill-current')} aria-hidden="true" />
          <span>Like</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {review.likes + (liked ? 1 : 0)}
            <span className="sr-only"> likes</span>
          </span>
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          <span>
            {review.replies} {review.replies === 1 ? 'reply' : 'replies'}
          </span>
        </button>
      </footer>
    </article>
  )
}

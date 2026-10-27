import { useId, useState } from 'react'
import { BadgeCheck, EyeOff, Heart, MessageCircle } from 'lucide-react'
import type { Review } from '@/types/review'
import { ClampText } from '@/components/common/ClampText'
import { LikeButton } from '@/components/community/LikeButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatRelative } from '@/lib/date'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'
import { StarRating } from './StarRating'

type ReviewCardProps = {
  review: Review
  className?: string
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const textId = useId()
  const [revealed, setRevealed] = useState(!review.containsSpoilers)

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
            {review.author.isFriend && <span className="text-xs font-medium">· Friend</span>}
            <span className="text-xs text-muted-foreground">
              · <time dateTime={review.postedAt}>{formatRelative(review.postedAt)}</time>
            </span>
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
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted px-3 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <EyeOff className="size-4" aria-hidden="true" />
          {revealed ? 'Hide spoilers' : 'Spoilers ahead · Tap to reveal'}
        </button>
      )}

      <div id={textId} hidden={!revealed}>
        <ClampText clamp="line-clamp-4" className="text-[0.9375rem] leading-relaxed">
          {review.text}
        </ClampText>
      </div>

      <footer className="flex items-center gap-1 text-sm text-muted-foreground">
        {/* Likes live in the store, shared with the same review in the Community feed */}
        <LikeButton kind="review" id={review.id} base={review.likes} className="mr-2" />
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

import { useId, useState } from 'react'
import { EyeOff, MessageCircle, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { ClampText } from '@/components/common/ClampText'
import { formatTimeAgo } from '@/lib/date'
import { getBookById } from '@/mocks/books'
import { reviews } from '@/mocks/reviews'
import type { Book } from '@/types/book'
import type { Activity } from '@/types/community'
import { LikeButton } from './LikeButton'
import { useAuthor } from './people'
import { UserAvatar } from './UserAvatar'

const actionLinkClass =
  'inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

/** One feed event: who did what, with the book, time, Like and (for reviews) Comment */
export function ActivityItem({ activity }: { activity: Activity }) {
  const textId = useId()
  const bodyId = useId()
  const author = useAuthor(activity.userId)
  const book = getBookById(activity.bookId) as Book
  const review = activity.reviewId ? reviews.find((r) => r.id === activity.reviewId) : undefined
  const reviewText = review?.text ?? activity.reviewText
  const spoilers = review?.containsSpoilers ?? activity.containsSpoilers ?? false
  const [revealed, setRevealed] = useState(!spoilers)

  const name = <strong className="font-semibold">{author.name}</strong>
  const title = <strong className="font-semibold">{book.title}</strong>
  const sentence = {
    finished: <>{name} finished {title}</>,
    started: <>{name} started {title}</>,
    rated: <>{name} rated {title}</>,
    reviewed: <>{name} reviewed {title}</>,
    added_to_shelf: <>{name} added {title} to {activity.shelfName}</>,
    created_list: <>{name} created the list <strong className="font-semibold">{activity.shelfName}</strong></>,
    buddy_read_post: <>{name} posted in the {title} buddy read</>,
  }[activity.type]

  const rating = activity.rating ?? review?.rating ?? null

  return (
    <article aria-labelledby={textId} className="flex gap-2 py-4">
      <UserAvatar author={author} className="-mt-1.5 -ml-1.5" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <p id={textId} className="text-sm leading-snug">
          {sentence}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <time dateTime={activity.createdAt}>{formatTimeAgo(activity.createdAt)}</time>
          {activity.type === 'buddy_read_post' && activity.chapter && <span>· Ch. {activity.chapter}</span>}
        </p>
        {rating !== null && ['finished', 'rated', 'reviewed'].includes(activity.type) && (
          <StarRating value={rating} size="xs" showValue />
        )}

        {activity.type === 'created_list' && activity.listBookIds && (
          <p className="text-xs text-muted-foreground">
            {activity.listBookIds.map((id) => getBookById(id)?.title).join(' · ')}
          </p>
        )}

        {reviewText && (
          <div className="space-y-2">
            {spoilers && (
              <button
                type="button"
                aria-expanded={revealed}
                aria-controls={bodyId}
                onClick={() => setRevealed((v) => !v)}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted px-3 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <EyeOff className="size-4" aria-hidden="true" />
                {revealed ? 'Hide spoilers' : 'Spoilers ahead · Tap to reveal'}
              </button>
            )}
            <div id={bodyId} hidden={!revealed}>
              <ClampText clamp="line-clamp-3" className="text-[0.9375rem] leading-relaxed">
                {reviewText}
              </ClampText>
            </div>
          </div>
        )}

        <div className="-ml-2 flex flex-wrap items-center gap-1">
          {review ? (
            <LikeButton kind="review" id={review.id} base={review.likes} />
          ) : (
            <LikeButton kind="activity" id={activity.id} base={activity.likes} />
          )}
          {activity.type === 'reviewed' && (
            <Link to={`/book/${book.id}#reviews`} className={actionLinkClass}>
              <MessageCircle className="size-4" aria-hidden="true" />
              Comment<span className="sr-only"> on {author.name}'s review</span>
            </Link>
          )}
          {activity.type === 'buddy_read_post' && activity.buddyReadId && (
            <Link to={`/community/buddy/${activity.buddyReadId}`} className={actionLinkClass}>
              <MessagesSquare className="size-4" aria-hidden="true" />
              Open buddy read<span className="sr-only"> for {book.title}</span>
            </Link>
          )}
        </div>
      </div>
      <Link
        to={`/book/${book.id}`}
        aria-label={book.title}
        className="shrink-0 self-start rounded-cover outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <BookCover book={book} size="sm" />
      </Link>
    </article>
  )
}

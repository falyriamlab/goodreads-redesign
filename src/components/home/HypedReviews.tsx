import { useId } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { ReviewCard } from '@/components/book/ReviewCard'
import { getBookById } from '@/mocks/books'
import { reviews } from '@/mocks/reviews'
import type { Book } from '@/types/book'

export function HypedReviews() {
  const headingId = useId()
  const top = [...reviews].sort((a, b) => b.likes - a.likes).slice(0, 2)

  return (
    <section aria-labelledby={headingId} className="space-y-3 px-4">
      <h2 id={headingId} className="text-lg font-bold tracking-tight">
        Reviews everyone's hyping this week
      </h2>
      <ul className="space-y-4">
        {top.map((review) => {
          const book = getBookById(review.bookId) as Book
          return (
            <li key={review.id} className="space-y-2">
              {/* The book link sits above the card: ReviewCard has its own buttons, so nothing is nested */}
              <Link
                to={`/book/${book.id}#reviews`}
                className="flex min-h-14 items-center gap-3 rounded-lg outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <BookCover book={book} size="sm" className="w-10" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{book.title}</span>
                  <span className="block text-xs text-muted-foreground">See all reviews</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
              <ReviewCard review={review} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import { useId } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatRating } from '@/lib/rating'
import { initials } from '@/lib/initials'
import { getBookById } from '@/mocks/books'
import { friends } from '@/mocks/friends'
import type { Book } from '@/types/book'

export function FriendsReading() {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="space-y-3 px-4">
      <h2 id={headingId} className="text-lg font-bold tracking-tight">
        Your friends are reading
      </h2>
      <ul className="grid grid-cols-4 gap-3">
        {friends.map((friend) => {
          const book = getBookById(friend.bookId) as Book
          const label =
            friend.status === 'reading'
              ? `${friend.name} is reading ${book.title}`
              : `${friend.name} rated ${book.title} ${formatRating(friend.rating)} stars`
          return (
            <li key={friend.id}>
              {/* One link per cell; its name comes from aria-label, so the visuals are hidden from AT */}
              <Link
                to={`/book/${book.id}`}
                aria-label={label}
                className="flex flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden="true" className="relative w-full">
                  <BookCover book={book} size="sm" className="w-full" />
                  <Avatar size="sm" className="absolute -right-1.5 -bottom-1.5 ring-2 ring-background">
                    <AvatarFallback className="bg-secondary text-[0.625rem] font-semibold text-secondary-foreground">
                      {initials(friend.name)}
                    </AvatarFallback>
                  </Avatar>
                </span>
                <span aria-hidden="true" className="flex min-h-4 items-center">
                  {friend.status === 'reading' ? (
                    <span className="text-xs font-medium">Reading</span>
                  ) : (
                    <StarRating value={friend.rating} size="xs" />
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

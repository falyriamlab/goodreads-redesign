import { useId } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatRating } from '@/lib/rating'
import { initials } from '@/lib/initials'
import { getBookById } from '@/mocks/books'
import { readers } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

export function FriendsReading() {
  const headingId = useId()
  const following = useLibrary((s) => s.following)
  // People you follow (Community and profiles share the list)
  const friends = readers.filter((r) => following.includes(r.id)).slice(0, 8)
  if (friends.length === 0) return null

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
            <li key={friend.id} className="relative">
              {/* Book link: its name comes from aria-label, so the visuals are hidden from AT */}
              <Link
                to={`/book/${book.id}`}
                aria-label={label}
                className="flex flex-col items-center gap-1.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden="true" className="w-full">
                  <BookCover book={book} size="sm" className="w-full" />
                </span>
                <span aria-hidden="true" className="flex min-h-4 items-center">
                  {friend.status === 'reading' ? (
                    <span className="text-xs font-medium">Reading</span>
                  ) : (
                    <StarRating value={friend.rating} size="xs" />
                  )}
                </span>
              </Link>
              {/* Profile link: a sibling over the cover corner (never nested), 44px hit area */}
              <Link
                to={`/u/${friend.handle}`}
                aria-label={`${friend.name}'s profile`}
                className="absolute -right-3 bottom-3 z-10 flex size-11 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar size="sm" className="ring-2 ring-background">
                  <AvatarFallback className="bg-secondary text-[0.625rem] font-semibold text-secondary-foreground">
                    {initials(friend.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

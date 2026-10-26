import { BookCover } from '@/components/book/BookCover'
import type { Book } from '@/types/book'

/**
 * Book page hero: the screen's one paper band (rule 1) with the cover as an object,
 * a centered serif title and a facts strip.
 * Band text: --band-foreground 10.77:1 / 11.89:1, --band-muted-foreground 5.57:1 / 5.94:1.
 */
export function BookHero({ book }: { book: Book }) {
  return (
    <div className="-mx-4 -mt-4 bg-band px-4 pt-8 pb-6 text-center text-band-foreground">
      <BookCover book={book} className="mx-auto w-40" />
      {book.series && (
        <p className="kicker mt-6 text-band-muted-foreground">
          {book.series} · Book {book.seriesNumber}
        </p>
      )}
      {/* One of the two places Playfair is used (the other: share cards) */}
      <h1 className="mt-2 font-serif text-[1.875rem] leading-tight text-balance">{book.title}</h1>
      <p className="mt-2 text-base">{book.author}</p>
      <dl className="mt-6 grid grid-cols-3 divide-x divide-band-muted-foreground/40 border-y border-band-muted-foreground/40 py-3">
        <Fact label="Pages" value={String(book.pages)} />
        <Fact label="Chapters" value={book.chapterCount ? String(book.chapterCount) : '–'} />
        <Fact label="Ratings" value={book.ratingsCount === null ? 'None yet' : book.ratingsCount.toLocaleString('en-US')} />
      </dl>
      {!book.isPublished && <p className="mt-3 text-sm font-semibold">Not out yet</p>}
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    // dt first in the DOM; flex-col-reverse puts the number on top
    <div className="flex flex-col-reverse items-center px-1">
      <dt className="text-xs text-band-muted-foreground">{label}</dt>
      <dd className="text-lg font-bold tabular-nums">{value}</dd>
    </div>
  )
}

import { useId } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { buddyReaderCount, progressLabel, spanLabel } from '@/lib/community'
import { getBookById } from '@/mocks/books'
import { buddyReads } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { BuddyRead } from '@/types/community'

export function BuddyReadsTab() {
  const joined = useLibrary((s) => s.joinedBuddyReads)
  const mine = buddyReads.filter((br) => joined.includes(br.id))
  const open = buddyReads.filter((br) => !joined.includes(br.id))

  return (
    <div className="space-y-10 px-4 pt-4 pb-10">
      <BuddyList title="Your buddy reads" list={mine} joined empty="You haven't joined a buddy read yet." />
      <BuddyList title="Open to join" list={open} joined={false} empty="You're in every buddy read. Overachiever." />
    </div>
  )
}

function BuddyList({ title, list, joined, empty }: { title: string; list: BuddyRead[]; joined: boolean; empty: string }) {
  const headingId = useId()
  const entries = useLibrary((s) => s.entries)
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="section-title">
        {title}
      </h2>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {list.map((br) => {
            const book = getBookById(br.bookId) as Book
            return (
              <li key={br.id}>
                <Link
                  to={`/community/buddy/${br.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <BookCover book={book} size="sm" />
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block font-serif font-semibold">{book.title}</span>
                    <span className="block text-sm">
                      {buddyReaderCount(br, joined)} readers · {spanLabel(br.currentSpan)}
                    </span>
                    <span className="block text-xs text-muted-foreground">{progressLabel(book, entries[book.id])}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

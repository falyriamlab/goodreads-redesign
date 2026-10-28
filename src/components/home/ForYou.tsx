import { useId } from 'react'
import { Link } from 'react-router'
import { BookCard } from '@/components/book/BookCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import type { useHomeData } from './useHomeData'

type Data = ReturnType<typeof useHomeData>

export function ForYou({ recs, hide }: Pick<Data, 'recs' | 'hide'>) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <SectionHeader
        id={id}
        kicker="Picked for you"
        title="For you"
        note={recs[0]?.reason}
        link={{ to: '/discover', label: 'See Discover' }}
        className="px-4"
      />
      {recs.length === 0 ? (
        <p className="mx-4 rounded-xl border border-dashed border-muted-foreground p-4 text-sm text-muted-foreground">
          You've seen it all for now.{' '}
          <Link to="/discover" className="font-semibold text-foreground underline underline-offset-4">
            See Discover
          </Link>
          .
        </p>
      ) : (
        // pt-4 leaves room for the dismiss button on the cover corner
        <ul className="flex gap-6 relative overflow-x-auto px-4 pt-4 pb-2">
          {recs.map(({ book }) => (
            <li key={book.id} className="shrink-0">
              <BookCard book={book} onDismiss={() => hide(book.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

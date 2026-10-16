import { useId } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { BookCard } from '@/components/book/BookCard'
import { recommend } from '@/lib/recommend'
import { currentUser } from '@/mocks/user'
import { useLibrary } from '@/state/library'

const linkClass =
  'inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function ForYou() {
  const headingId = useId()
  const entries = useLibrary((s) => s.entries)
  const dismissed = useLibrary((s) => s.dismissedRecommendations)
  const dismiss = useLibrary((s) => s.dismiss)
  const undoDismiss = useLibrary((s) => s.undoDismiss)

  const recs = recommend({
    entries,
    dismissed,
    user: { genres: currentUser.favoriteGenres, moods: currentUser.favoriteMoods, pace: currentUser.preferredPace },
  })

  function hide(bookId: string) {
    dismiss(bookId)
    toast("Hidden. We'll read the room.", { action: { label: 'Undo', onClick: () => undoDismiss(bookId) } })
  }

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-start justify-between gap-3 px-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-bold tracking-tight">
            For you
          </h2>
          {recs.length > 0 && <p className="text-sm text-muted-foreground">{recs[0].reason}</p>}
        </div>
        <Link to="/discover" className={linkClass}>
          See more<span className="sr-only"> recommendations</span>
        </Link>
      </div>

      {recs.length === 0 ? (
        <p className="mx-4 rounded-xl border border-dashed border-muted-foreground p-4 text-sm text-muted-foreground">
          You've seen it all for now.{' '}
          <Link to="/discover" className="font-semibold text-foreground underline underline-offset-4">
            Check Discover
          </Link>
          .
        </p>
      ) : (
        // pt-5 / gap-6 leave room for the dismiss button, which sits on the cover corner
        <ul className="flex gap-6 overflow-x-auto px-4 pt-5 pb-2">
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

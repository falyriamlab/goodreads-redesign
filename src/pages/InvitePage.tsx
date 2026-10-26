import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { BookCover } from '@/components/book/BookCover'
import { Button } from '@/components/ui/button'
import { initials } from '@/lib/initials'
import { getBookById } from '@/mocks/books'
import { getReaderByHandle } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/** /invite/:handle: the landing a friend sees from "Copy invite link" (outside the app shell: they aren't a member yet) */
export function InvitePage() {
  const { handle = '' } = useParams()
  const profile = useLibrary((s) => s.profile)
  const reader = getReaderByHandle(handle)
  const inviter =
    handle === profile.handle
      ? { name: profile.displayName, handle: profile.handle, favorites: profile.favorites }
      : reader && { name: reader.name, handle: reader.handle, favorites: reader.favorites }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col justify-center gap-8 bg-background px-6 py-10 sm:border-x sm:border-border">
      <p className="text-center font-serif text-3xl font-bold tracking-tight">goodreads</p>
      {inviter ? (
        <>
          <div className="space-y-4 text-center">
            <div
              aria-hidden="true"
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground"
            >
              {initials(inviter.name)}
            </div>
            <h1 className="font-serif text-3xl leading-tight font-semibold text-balance">{inviter.name} invited you to read along</h1>
            <p className="text-sm text-muted-foreground">@{inviter.handle} wants to swap recs, buddy read and cheer on your reading goal.</p>
          </div>

          {inviter.favorites.length > 0 && (
            <section aria-labelledby="invite-top4" className="space-y-4">
              <h2 id="invite-top4" className="section-title text-center">
                {inviter.name.split(' ')[0]}'s top {inviter.favorites.length}
              </h2>
              <ul className="grid grid-cols-4 gap-3">
                {inviter.favorites.map((id) => {
                  const book = getBookById(id) as Book
                  return (
                    <li key={id}>
                      <BookCover book={book} className="w-full" />
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <Button size="lg" className="min-h-12 w-full text-base" onClick={() => toast('Coming soon.')}>
            Join Goodreads
          </Button>
        </>
      ) : (
        <div className="space-y-3 text-center">
          <h1 className="font-serif text-2xl font-semibold">This invite link isn't valid.</h1>
          <p className="text-sm text-muted-foreground">Ask your friend to send it again.</p>
        </div>
      )}
      <Link
        to="/"
        className="mx-auto inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Back to the app
      </Link>
    </main>
  )
}

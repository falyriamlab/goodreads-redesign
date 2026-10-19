import { useId } from 'react'
import { Link } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { UpdateProgress } from '@/components/book/UpdateProgress'
import { BuddyReads } from '@/components/home/BuddyReads'
import { FriendsReading } from '@/components/home/FriendsReading'
import { HomeActions } from '@/components/home/HomeActions'
import { HypedReviews } from '@/components/home/HypedReviews'
import { TopBar } from '@/components/layout/TopBar'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import type { Book } from '@/types/book'
import { readingProgress } from '../progress'
import { CardChip, DismissButton, ProgressBar } from '../shared'
import { useHomeData } from '../useHomeData'

/*
 * Direction B · Night Shelf — immersive, dark-first.
 * The top of Home is always dark (the `dark` class scopes the dark palette, in light mode too),
 * covers bleed into their cards, titles sit on a scrim over the cover.
 * Text only ever sits where the scrim is ≥ 90% opaque (worst case white cover: 9.96:1 / 4.98:1 muted).
 * Motion: cover rise on entry + progress fill.
 */

const kicker = 'text-xs font-semibold tracking-[0.16em] uppercase'
const linkClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function HomeB() {
  const data = useHomeData()
  return (
    <>
      <TopBar className="dark border-transparent text-foreground" actions={<HomeActions />} />
      {/* Dark-first band: greeting, now reading and the challenge */}
      <div className="dark bg-background pb-8 text-foreground">
        <header className="px-4 pt-3 pb-5">
          <p className={`${kicker} text-muted-foreground`}>{data.today}</p>
          <h1 className="mt-1 font-serif text-[2.5rem] leading-tight font-semibold tracking-tight">Hey, {data.firstName}</h1>
        </header>
        <NowReading reading={data.reading} />
        <Challenge data={data} />
      </div>

      <div className="space-y-8 pt-8 pb-10">
        <ForYou recs={data.recs} hide={data.hide} />
        <FriendsReading />
        <HypedReviews />
        <BuddyReads />
      </div>
    </>
  )
}

function NowReading({ reading }: { reading: ReturnType<typeof useHomeData>['reading'] }) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="sr-only">
        Now reading
      </h2>
      {reading.length === 0 ? (
        <p className="px-4 text-sm text-muted-foreground">
          Nothing on the go.{' '}
          <Link to="/discover" className="font-semibold text-foreground underline underline-offset-4">
            Find your next read
          </Link>
        </p>
      ) : (
        <ul className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">
          {reading.map(({ book, currentPage }) => (
            <li key={book.id} className={reading.length > 1 ? 'w-[88%] shrink-0 snap-start' : 'w-full'}>
              <ImmersiveCard book={book} currentPage={currentPage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Currently reading, B: the cover bleeds behind the whole card under a flat 90% scrim */
function ImmersiveCard({ book, currentPage }: { book: Book; currentPage: number }) {
  const logSheet = useLogSheet()
  const p = readingProgress(book, currentPage)
  return (
    <article className="relative isolate h-full overflow-hidden rounded-3xl border border-border">
      {book.coverUrl && (
        <img src={book.coverUrl} alt="" aria-hidden="true" className="absolute inset-0 -z-10 size-full scale-125 object-cover blur-2xl" />
      )}
      {/* Flat scrim: every point of the card is ≥ 90% scrim, so text passes wherever it lands */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-scrim/90" />
      <div className="space-y-4 p-4 text-on-scrim">
        <div className="flex gap-4">
          <BookCover
            book={book}
            className="w-24 rounded-md shadow-cover ring-0 motion-safe:animate-[cover-rise_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]"
          />
          <div className="min-w-0 flex-1">
            <p className={`${kicker} text-on-scrim-muted`}>Now reading</p>
            <h3 className="font-serif text-2xl leading-tight font-semibold">
              <Link
                to={`/book/${book.id}`}
                className="inline-flex min-h-11 items-center outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="line-clamp-2">{book.title}</span>
              </Link>
            </h3>
            <p className="truncate text-sm text-on-scrim-muted">{book.author}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="flex items-baseline gap-1">
            <span className="font-serif text-[56px] leading-none font-semibold tabular-nums">{p.percent}</span>
            <span className="font-serif text-xl">%</span>
          </p>
          <p className="pb-1 text-sm text-on-scrim-muted">{p.detail}</p>
        </div>
        <ProgressBar percent={p.percent} label={`Progress in ${book.title}`} valueText={p.detail} />
        <div className="flex gap-2">
          <UpdateProgress book={book} currentPage={currentPage} className="flex-1 px-2" />
          <Button className="min-h-11 flex-1 px-2" onClick={(e) => logSheet.open(book.id, { intent: 'read', returnFocus: e.currentTarget })}>
            Finished it
          </Button>
        </div>
      </div>
    </article>
  )
}

function Challenge({ data }: { data: ReturnType<typeof useHomeData> }) {
  const id = useId()
  const { challenge, pace } = data
  return (
    <section aria-labelledby={id} className="mx-4 mt-6 space-y-3 border-t border-border pt-6">
      <div className="flex items-start justify-between gap-3">
        <h2 id={id} className={`${kicker} pt-3 text-muted-foreground`}>
          {challenge.year} challenge
        </h2>
        <Link to="/profile" className={linkClass}>
          View<span className="sr-only"> reading challenge</span>
        </Link>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="font-serif text-[72px] leading-none font-semibold tracking-tight tabular-nums">{challenge.read}</span>
        <span className="font-serif text-3xl text-muted-foreground">/ {challenge.goal}</span>
      </p>
      <ProgressBar
        percent={data.challengePercent}
        label={`${challenge.year} reading challenge`}
        valueText={`${challenge.read} of ${challenge.goal} books`}
      />
      <p className="text-sm">{pace.message}</p>
    </section>
  )
}

function ForYou({ recs, hide }: { recs: ReturnType<typeof useHomeData>['recs']; hide: (id: string) => void }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-4">
        <div className="min-w-0">
          <h2 id={id} className="font-serif text-2xl leading-tight font-semibold">
            For you
          </h2>
          {recs[0] && <p className="text-sm text-muted-foreground">{recs[0].reason}</p>}
        </div>
        <Link to="/discover" className={linkClass}>
          See more<span className="sr-only"> recommendations</span>
        </Link>
      </div>
      <ul className="flex gap-4 overflow-x-auto px-4 pt-3 pb-6">
        {recs.map(({ book }) => (
          <li key={book.id} className="shrink-0">
            <OverlayCard book={book} onDismiss={() => hide(book.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * BookCard, B: title and author on the cover, over a bottom scrim.
 * The scrim is flat 90% for the bottom 50% of the cover, then fades out; the text box
 * (max ~4 lines) stays inside the flat part, so its worst point is 90% scrim over a white cover.
 */
function OverlayCard({ book, onDismiss }: { book: Book; onDismiss: () => void }) {
  return (
    <article className="relative w-36">
      {/* The whole cover is the link; its name is the visible title + author (the cover image is decorative here) */}
      <Link
        to={`/book/${book.id}`}
        className="relative block overflow-hidden rounded-xl shadow-cover outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span aria-hidden="true">
          <BookCover book={book} className="w-36 rounded-none ring-0" />
        </span>
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-scrim/90 via-scrim/90 via-50% to-transparent to-80%" />
        <span className="absolute inset-x-0 bottom-0 max-h-[50%] overflow-hidden p-2.5 pb-7 text-on-scrim">
          <h3 className="line-clamp-2 font-serif text-sm leading-snug font-semibold">{book.title}</h3>
          <span className="block truncate text-xs text-on-scrim-muted">{book.author}</span>
        </span>
      </Link>
      <div className="absolute inset-x-0 -bottom-4 flex justify-center">
        <CardChip book={book} />
      </div>
      <DismissButton book={book} onDismiss={onDismiss} className="-top-4 -right-4" />
    </article>
  )
}

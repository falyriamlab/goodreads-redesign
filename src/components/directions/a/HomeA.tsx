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
import { readingProgress, stretchedLink } from '../progress'
import { CardChip, DismissButton, ProgressBar } from '../shared'
import { useHomeData } from '../useHomeData'

/*
 * Direction A · Marginalia — editorial, light-first.
 * Serif display type, covers as physical objects (shadow, no text on them),
 * one full-bleed paper band for the challenge. Motion: progress fill + card press.
 */

const kicker = 'text-xs font-semibold tracking-[0.16em] uppercase'
const linkClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function HomeA() {
  const data = useHomeData()
  return (
    <>
      <TopBar actions={<HomeActions />} />
      <header className="px-4 pt-5 pb-1">
        <p className={`${kicker} text-muted-foreground`}>{data.today}</p>
        <h1 className="mt-1 font-serif text-4xl leading-tight font-semibold tracking-tight">Hey, {data.firstName}</h1>
      </header>

      <div className="space-y-10 pt-6 pb-10">
        <NowReading reading={data.reading} />
        <ChallengeBand data={data} />
        <ForYou recs={data.recs} hide={data.hide} />
        <FriendsReading />
        <HypedReviews />
        <BuddyReads />
      </div>
    </>
  )
}

function SectionHeading({ id, kicker: k, title, note }: { id: string; kicker?: string; title: string; note?: string }) {
  return (
    <div className="min-w-0 px-4">
      {k && <p className={`${kicker} text-muted-foreground`}>{k}</p>}
      <h2 id={id} className="font-serif text-2xl leading-tight font-semibold">
        {title}
      </h2>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  )
}

function NowReading({ reading }: { reading: ReturnType<typeof useHomeData>['reading'] }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <SectionHeading id={id} kicker="On your nightstand" title="Now reading" />
      {reading.length === 0 ? (
        <p className="px-4 text-sm text-muted-foreground">
          Nothing on the go.{' '}
          <Link to="/discover" className="font-semibold text-foreground underline underline-offset-4">
            Find your next read
          </Link>
        </p>
      ) : (
        <ul className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2">
          {reading.map(({ book, currentPage }) => (
            <li key={book.id} className={reading.length > 1 ? 'w-[88%] shrink-0 snap-start' : 'w-full'}>
              <NowReadingCard book={book} currentPage={currentPage} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NowReadingCard({ book, currentPage }: { book: Book; currentPage: number }) {
  const logSheet = useLogSheet()
  const p = readingProgress(book, currentPage)
  return (
    <article className="h-full space-y-4 rounded-2xl bg-card p-4 text-card-foreground shadow-cover">
      <div className="flex gap-4">
        <BookCover book={book} className="w-24 rounded-sm shadow-cover ring-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-xl leading-tight font-semibold">
            <Link to={`/book/${book.id}`} className="inline-flex min-h-11 items-center outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="line-clamp-2">{book.title}</span>
            </Link>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{book.author}</p>
          {/* Display number: Source Serif at 56px */}
          <p className="mt-2 flex items-baseline gap-1">
            <span className="font-serif text-[56px] leading-none font-semibold tabular-nums">{p.percent}</span>
            <span className="font-serif text-xl">%</span>
          </p>
          <p className="text-xs text-muted-foreground">{p.detail}</p>
        </div>
      </div>
      <ProgressBar percent={p.percent} label={`Progress in ${book.title}`} valueText={p.detail} />
      <div className="flex gap-2">
        <UpdateProgress book={book} currentPage={currentPage} className="flex-1 px-2" />
        <Button className="min-h-11 flex-1 px-2" onClick={(e) => logSheet.open(book.id, { intent: 'read', returnFocus: e.currentTarget })}>
          Finished it
        </Button>
      </div>
    </article>
  )
}

/** Full-bleed paper band. Text uses --band-foreground / --band-muted-foreground (5.57:1 light, 5.94:1 dark). */
function ChallengeBand({ data }: { data: ReturnType<typeof useHomeData> }) {
  const id = useId()
  const { challenge, pace } = data
  return (
    <section aria-labelledby={id} className="space-y-4 bg-band px-4 py-8 text-band-foreground">
      <h2 id={id} className={`${kicker} text-band-muted-foreground`}>
        {challenge.year} reading challenge
      </h2>
      <p className="flex items-baseline gap-3">
        <span className="font-serif text-[72px] leading-none font-semibold tracking-tight tabular-nums">{challenge.read}</span>
        <span className="font-serif text-2xl">of {challenge.goal} books</span>
      </p>
      <ProgressBar
        percent={data.challengePercent}
        label={`${challenge.year} reading challenge`}
        valueText={`${challenge.read} of ${challenge.goal} books`}
        trackClassName="bg-background"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{pace.message}</p>
        <Link to="/profile" className={linkClass}>
          View<span className="sr-only"> reading challenge</span>
        </Link>
      </div>
    </section>
  )
}

function ForYou({ recs, hide }: { recs: ReturnType<typeof useHomeData>['recs']; hide: (id: string) => void }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex items-end justify-between gap-3 pr-4">
        <SectionHeading id={id} kicker="Picked for you" title="For you" note={recs[0]?.reason} />
        <Link to="/discover" className={linkClass}>
          See more<span className="sr-only"> recommendations</span>
        </Link>
      </div>
      <ul className="flex gap-5 overflow-x-auto px-4 pt-3 pb-4">
        {recs.map(({ book }) => (
          <li key={book.id} className="shrink-0">
            <EditorialCard book={book} onDismiss={() => hide(book.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * BookCard, A: the cover is an object (shadow, no overlay), the title is set in serif below.
 * One stretched link; chip and dismiss are siblings raised above it. Motion #2: press scale.
 */
function EditorialCard({ book, onDismiss }: { book: Book; onDismiss: () => void }) {
  return (
    <article className="relative flex w-32 flex-col transition-transform motion-safe:active:scale-[0.97]">
      <div className="relative">
        <BookCover book={book} className="w-32 rounded-sm shadow-cover ring-0" reserveBottom />
        <div className="absolute inset-x-0 -bottom-4 flex justify-center">
          <CardChip book={book} />
        </div>
        <DismissButton book={book} onDismiss={onDismiss} className="-top-4 -right-4" />
      </div>
      <h3 className="mt-6 line-clamp-2 font-serif text-base leading-snug font-semibold">
        <Link to={`/book/${book.id}`} className={stretchedLink}>
          {book.title}
        </Link>
      </h3>
      <p className="truncate text-xs text-muted-foreground">{book.author}</p>
    </article>
  )
}

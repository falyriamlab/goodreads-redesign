import { useEffect, useId, useState, type ReactNode } from 'react'
import { BookMarked, ChevronRight, Headphones, Landmark, MessagesSquare, Share2, Store, Tablet } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { BookCard } from '@/components/book/BookCard'
import { BookCover } from '@/components/book/BookCover'
import { BookActions } from '@/components/book-page/BookActions'
import { ReviewsSection } from '@/components/book-page/ReviewsSection'
import { ClampText } from '@/components/common/ClampText'
import { TopBar, TopBarIconButton } from '@/components/layout/TopBar'
import { formatDate } from '@/lib/date'
import { formatRating } from '@/lib/rating'
import { recommend } from '@/lib/recommend'
import { getBookById } from '@/mocks/books'
import { useLibrary, useLibraryEntry } from '@/state/library'
import type { Book } from '@/types/book'

export function BookPage() {
  const { id = '' } = useParams()
  const book = getBookById(id)

  if (!book) {
    return (
      <>
        <TopBar title="Book not found" back backFallback="/discover" />
        <p className="px-4 py-6 text-muted-foreground">This one's lowkey MIA. Try searching for it instead.</p>
      </>
    )
  }
  // key: reset local UI state (expanded sections, filters) when moving between books
  return <BookDetails key={book.id} book={book} />
}

function BookDetails({ book }: { book: Book }) {
  const navigate = useNavigate()
  const { hash } = useLocation()

  // Deep links like /book/:id#reviews: scroll to the section and move focus to its heading
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return
      target.scrollIntoView({ block: 'start' })
      target.querySelector<HTMLElement>('h2[tabindex]')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash, book.id])

  return (
    <>
      {/* 1. No title here: the book title is the page's <h1> in the hero */}
      <TopBar
        back
        backFallback="/discover"
        actions={
          <TopBarIconButton
            label={`Share ${book.title}`}
            icon={<Share2 aria-hidden="true" />}
            onClick={() => navigate(`/share?book=${book.id}`)}
          />
        }
      />

      <div className="space-y-8 px-4 pt-4 pb-8">
        <Hero book={book} />
        <BookActions book={book} />
        <Vibes book={book} />
        <ContentWarnings book={book} />
        <Section title="Synopsis">
          {book.synopsis ? (
            <ClampText clamp="line-clamp-3" className="font-serif leading-relaxed">
              {book.synopsis}
            </ClampText>
          ) : (
            <p className="text-sm text-muted-foreground">Synopsis coming soon.</p>
          )}
        </Section>
        <WhereToGetIt />
        <ReviewsSection book={book} />
        <YourHistory book={book} />
        <Discussions />
        <MoreLikeThis book={book} />
        <Editions book={book} />
      </div>
    </>
  )
}

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg font-bold tracking-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/* 2. Hero */
function Hero({ book }: { book: Book }) {
  return (
    <div className="flex gap-4">
      <BookCover book={book} size="lg" />
      <div className="min-w-0 flex-1 space-y-2 pt-1">
        <h1 className="font-serif text-2xl leading-tight font-semibold text-balance">{book.title}</h1>
        <p className="text-sm">
          {book.author}
          {book.series && (
            <span className="text-muted-foreground">
              {' '}
              · {book.series} #{book.seriesNumber}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {book.avgRating !== null && book.ratingsCount !== null
            ? `${formatRating(book.avgRating)} avg · ${book.ratingsCount.toLocaleString('en-US')} ratings`
            : 'No ratings yet'}
        </p>
        <p className="text-sm text-muted-foreground">
          {book.pages} pages{!book.isPublished && ' · Not out yet'}
        </p>
      </div>
    </div>
  )
}

/* 4. Moods, pace and tropes as links into Discover */
const pillLink =
  "relative inline-flex h-8 items-center rounded-full border border-muted-foreground px-3 text-xs font-medium text-foreground transition-colors outline-none after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"

function Vibes({ book }: { book: Book }) {
  const groups: { label: string; param: string; values: string[] }[] = [
    { label: 'Moods', param: 'mood', values: book.moods },
    { label: 'Pace', param: 'pace', values: [book.pace] },
    { label: 'Tropes', param: 'trope', values: book.tropes },
  ]
  return (
    <Section title="The vibe">
      <dl className="space-y-3">
        {groups.map((g) => (
          <div key={g.param} className="space-y-1.5">
            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g.label}</dt>
            <dd>
              <ul className="flex flex-wrap gap-x-2 gap-y-3">
                {g.values.map((v) => (
                  <li key={v}>
                    <Link to={`/discover?${g.param}=${encodeURIComponent(v)}`} className={pillLink}>
                      {g.param === 'pace' ? `${v} pace` : v}
                    </Link>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

/* 5. Content warnings */
function ContentWarnings({ book }: { book: Book }) {
  const [open, setOpen] = useState(false)
  const listId = useId()

  if (book.contentWarnings.length === 0) {
    return <p className="text-sm text-muted-foreground">No content warnings added yet.</p>
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {open ? 'Hide content warnings' : 'See content warnings'}
      </button>
      <ul id={listId} hidden={!open} className="list-disc space-y-1 pl-5 text-sm">
        {book.contentWarnings.map((w) => (
          <li key={w} className="capitalize">
            {w}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* 7. Where to get it (placeholder links, no prices) */
const stores = [
  { name: 'Kindle', detail: 'Ebook', icon: Tablet },
  { name: 'Audible', detail: 'Audiobook', icon: Headphones },
  { name: 'Library', detail: 'Borrow it for free', icon: Landmark },
  { name: 'Bookstores', detail: 'Shop local', icon: Store },
]

function WhereToGetIt() {
  return (
    <Section title="Where to get it">
      <ul className="divide-y divide-border rounded-lg border border-border">
        {stores.map(({ name, detail, icon: Icon }) => (
          <li key={name}>
            <a
              href="#"
              className="flex min-h-14 items-center gap-3 px-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">
                <span className="block text-sm font-semibold">{name}</span>
                <span className="block text-xs text-muted-foreground">{detail}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* 9. Your history */
function YourHistory({ book }: { book: Book }) {
  const entry = useLibraryEntry(book.id)
  const hasHistory = entry.startedAt !== null || entry.currentPage > 0 || entry.rereads > 0

  return (
    <Section title="Your history">
      {hasHistory ? (
        <dl className="grid grid-cols-3 gap-3 rounded-lg border border-border p-3 text-center">
          <div>
            <dt className="text-xs text-muted-foreground">Started</dt>
            <dd className="text-sm font-semibold">{entry.startedAt ? formatDate(entry.startedAt) : '–'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Current page</dt>
            <dd className="text-sm font-semibold">
              {entry.currentPage} <span className="font-normal text-muted-foreground">/ {book.pages}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Rereads</dt>
            <dd className="text-sm font-semibold">{entry.rereads}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No history yet. Your era starts now.</p>
      )}
    </Section>
  )
}

/* 10. Discussions (mock) */
function Discussions() {
  return (
    <Section title="Discussions">
      <a
        href="#"
        className="flex min-h-14 items-center gap-3 rounded-lg border border-border px-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <MessagesSquare className="size-5 shrink-0" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-sm font-semibold">Buddy read · ch. 1–10</span>
          <span className="block text-xs text-muted-foreground">Spoiler-free zone. Pull up a chair.</span>
        </span>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
      </a>
    </Section>
  )
}

/* 11. More books with this energy */
function MoreLikeThis({ book }: { book: Book }) {
  const entries = useLibrary((s) => s.entries)
  const dismissed = useLibrary((s) => s.dismissedRecommendations)
  // Same recommender as Home's "For you", matched against this book
  const similar = recommend({ entries, dismissed, base: book, limit: 6 }).map((r) => r.book)
  if (similar.length === 0) return null

  return (
    <Section title="More books with this energy">
      <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {similar.map((b) => (
          <li key={b.id} className="shrink-0">
            <BookCard book={b} />
          </li>
        ))}
      </ul>
    </Section>
  )
}

/* 12. Editions */
function Editions({ book }: { book: Book }) {
  if (book.editions.length === 0) return null
  const languages = [...new Set(book.editions.map((e) => e.language))]
  const formats = [...new Set(book.editions.map((e) => e.format))]
  const n = book.editions.length

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <BookMarked className="size-4 shrink-0" aria-hidden="true" />
      {n} {n === 1 ? 'edition' : 'editions'} · {languages.join(', ')} · {formats.join(', ')}
    </p>
  )
}

import { forwardRef, type ReactNode } from 'react'
import { Heart } from 'lucide-react'
import { BookCover } from '@/components/book/BookCover'
import { StarRating } from '@/components/book/StarRating'
import { capitalize } from '@/lib/filters'
import { formatRating } from '@/lib/rating'
import type { ShareStyle } from '@/lib/shareParams'
import type { Share } from '@/lib/stats'
import { cn } from '@/lib/utils'
import type { Book } from '@/types/book'

export type ShareCardContent =
  | {
      type: 'month'
      monthName: string
      year: number
      books: Book[]
      pages: number
      avgRating: number | null
      topRated: Book | null
    }
  | { type: 'year'; year: number; count: number; topGenres: Share[]; topCovers: Book[]; vibe: string[] }
  | {
      type: 'book'
      book: Book
      rating: number | null
      loved: boolean
      reviewSentence: string | null
      /** "Finished Oct 12, 2026" or "Currently reading · p. 312" */
      statusLine: string
    }
  | { type: 'top4'; books: Book[] }

type ShareCardProps = {
  content: ShareCardContent
  style: ShareStyle
  handle: string
  /** Descriptive alt for the whole card */
  alt: string
  /** Canvas-safe cover URL per book id; null = failed the CORS check, draw the placeholder so the export never breaks */
  coverUrls: Map<string, string | null>
}

export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1920

// Light/Dark force a palette on the card regardless of the app theme; Brand = theme indigo (always the light palette: white on --primary, 4.98:1)
const STYLE_CLASS: Record<ShareStyle, string> = {
  light: 'theme-light bg-background text-foreground',
  dark: 'theme-dark bg-background text-foreground',
  brand: 'theme-light bg-primary text-primary-foreground',
}

/** 1080×1920 (9:16) story card, rendered as DOM and scaled for the preview */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  { content, style, handle, alt, coverUrls },
  ref,
) {
  const brand = style === 'brand'
  // Secondary text: muted on Light/Dark; on Brand everything stays primary-foreground (4.98:1 on the indigo)
  const soft = brand ? '' : 'text-muted-foreground'
  const panel = brand ? 'border-4 border-primary-foreground' : 'bg-card text-card-foreground'
  const cover = (b: Book) => ({ ...b, coverUrl: coverUrls.get(b.id) ?? null })
  // A render helper (not a nested component) so covers don't remount on every render.
  // Same treatment as the app (rule 4): cover shadow token, the 4px cover radius, nothing on top.
  const renderCover = (book: Book, className?: string) => (
    <BookCover key={book.id} book={cover(book)} size="xl" crossOrigin="anonymous" className={className} />
  )

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className={cn('flex flex-col overflow-hidden p-24 font-sans', STYLE_CLASS[style])}
    >
      {/* min-h-0 + overflow-hidden: content can never push the @handle/wordmark footer off the card */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {content.type === 'month' && (
          <>
            <Kicker className={soft}>
              {content.monthName} {content.year} · Reading recap
            </Kicker>
            <Headline>My {content.monthName} book dump</Headline>
            {content.books.length === 0 ? (
              <p className={cn('mt-16 text-6xl leading-tight font-medium', soft)}>Nothing finished yet. The month isn't over.</p>
            ) : (
              <>
                {/* Columns by count so covers always fit above the stats: 1–3 in one row, 4 in one row, 5–6 in two */}
                <div
                  className={cn(
                    'mt-14 grid items-start justify-items-center gap-8',
                    ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-3', 'grid-cols-3'][
                      Math.min(content.books.length, 6)
                    ],
                  )}
                >
                  {content.books.slice(0, 6).map((b) => renderCover(b, content.books.length === 1 ? 'w-[440px]' : 'w-full'))}
                </div>
                <dl className="mt-auto grid grid-cols-3 gap-8 pt-14">
                  <StatBlock label={content.books.length === 1 ? 'book' : 'books'} value={String(content.books.length)} soft={soft} />
                  <StatBlock label="pages" value={content.pages.toLocaleString('en-US')} soft={soft} />
                  <StatBlock label="avg rating" value={content.avgRating === null ? '–' : formatRating(content.avgRating)} soft={soft} />
                </dl>
                {content.topRated && (
                  <p className="mt-12 text-5xl leading-tight">
                    <span className={soft}>Living rent-free in my head: </span>
                    <span className="font-bold">{content.topRated.title}</span>
                  </p>
                )}
              </>
            )}
          </>
        )}

        {content.type === 'year' && (
          <>
            <Kicker className={soft}>{content.year} · Year in books</Kicker>
            <Headline>
              {content.count} books in {content.year}
            </Headline>
            <div className="mt-14 flex gap-6">
              {content.topCovers.map((b) => renderCover(b, 'w-[204px]'))}
            </div>
            <div className={cn('mt-14 space-y-8 rounded-3xl p-12', panel)}>
              <p className="text-3xl font-semibold tracking-wide uppercase">Top genres</p>
              {content.topGenres.map((g) => (
                <div key={g.label} className="space-y-3">
                  <div className="flex justify-between text-5xl">
                    <span>{g.label}</span>
                    <span className="font-bold tabular-nums">{g.percent}%</span>
                  </div>
                  <div className={cn('h-5 overflow-hidden rounded-full', brand ? 'border-2 border-primary-foreground' : 'bg-muted')}>
                    <div className={cn('h-full rounded-full', brand ? 'bg-primary-foreground' : 'bg-primary')} style={{ width: `${g.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {content.vibe.length > 0 && (
              <p className="mt-auto pt-12 text-6xl leading-tight">
                <span className={soft}>Your vibe: </span>
                <span className="font-bold">{content.vibe.join(' · ')}</span>
              </p>
            )}
          </>
        )}

        {content.type === 'book' && (
          <>
            <Kicker className={soft}>{content.statusLine}</Kicker>
            <div className="mt-14 flex justify-center">
              {renderCover(content.book, 'w-[520px]')}
            </div>
            <h1 className="mt-14 text-center font-serif text-8xl leading-[1.05] font-semibold">{content.book.title}</h1>
            <p className={cn('mt-4 text-center text-4xl', soft)}>{content.book.author}</p>
            <div className="mt-10 flex items-center justify-center gap-8">
              {content.rating !== null && <StarRating value={content.rating} size="xl" tone={brand ? 'current' : 'rating'} />}
              {content.loved && (
                <span className="inline-flex items-center gap-3 text-4xl font-semibold">
                  <Heart className="size-14 fill-current" aria-hidden="true" />
                  Loved it
                </span>
              )}
            </div>
            {content.reviewSentence && (
              <blockquote className={cn('mt-12 rounded-3xl p-12 text-5xl leading-snug font-medium', panel)}>
                “{content.reviewSentence}”
              </blockquote>
            )}
          </>
        )}

        {content.type === 'top4' && (
          <>
            <Kicker className={soft}>All-time favorites</Kicker>
            <Headline>My top 4</Headline>
            <div className="mt-14 grid grid-cols-2 gap-x-12 gap-y-10">
              {content.books.map((b, i) => (
                <div key={b.id} className="space-y-4">
                  {renderCover(b, 'w-[330px]')}
                  <p className="font-serif text-4xl leading-tight font-semibold">
                    <span className={cn('mr-3 font-sans tabular-nums', soft)}>{i + 1}</span>
                    {b.title}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="mt-12 flex shrink-0 items-end justify-between border-t-4 border-current pt-10">
        <span className="text-4xl font-semibold">@{handle}</span>
        {/* Small text wordmark: this is a concept, not the real brand */}
        <span className="text-4xl font-bold tracking-tight">goodreads concept</span>
      </footer>
    </div>
  )
})

function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  // The app's kicker (0.16em tracking, uppercase), scaled ×2.5 for the 1080px card
  return <p className={cn('text-3xl font-semibold tracking-[0.16em] uppercase', className)}>{children}</p>
}

function Headline({ children }: { children: ReactNode }) {
  return <h1 className="mt-6 font-serif text-[120px] leading-[0.95] font-semibold tracking-tight">{children}</h1>
}

function StatBlock({ label, value, soft }: { label: string; value: string; soft: string }) {
  return (
    // dt must come first in the DOM; flex-col-reverse keeps the number on top visually
    <div className="flex flex-col-reverse">
      <dt className={cn('mt-2 text-3xl', soft)}>{capitalize(label)}</dt>
      <dd className="font-serif text-8xl leading-none font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

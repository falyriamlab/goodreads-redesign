import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Download, Link2, Share2 } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toBlob } from 'html-to-image'
import { toast } from 'sonner'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { TopBar } from '@/components/layout/TopBar'
import { CARD_HEIGHT, CARD_WIDTH, ShareCard, type ShareCardContent } from '@/components/share/ShareCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getChallengeProgress } from '@/lib/challenge'
import { formatDate } from '@/lib/date'
import { formatRating } from '@/lib/rating'
import { parseShareParams, shareSearch, type ShareStyle, type ShareTarget } from '@/lib/shareParams'
import { monthStats, topRatedOfYear, yearStats } from '@/lib/stats'
import { getBookById } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/* ---------- Cover CORS check: covers that can't be read cross-origin become placeholders ---------- */

const readable = (url: string) =>
  fetch(url, { mode: 'cors' })
    .then((r) => r.ok && (r.headers.get('content-type') ?? '').startsWith('image/'))
    .catch(() => false)

/**
 * Open Library's CORS is intermittent: the cover redirect sometimes lands on a mirror without
 * Access-Control-Allow-Origin. Try the URL, then once more with a cache-buster; resolve to the URL
 * that worked, or null (the card then draws the placeholder cover).
 */
const corsCache = new Map<string, Promise<string | null>>()
function readableCoverUrl(url: string): Promise<string | null> {
  let check = corsCache.get(url)
  if (!check) {
    const retry = `${url}${url.includes('?') ? '&' : '?'}cors=1`
    check = readable(url).then(async (ok) => (ok ? url : (await readable(retry)) ? retry : null))
    corsCache.set(url, check)
  }
  return check
}

/** Map of book id → cover URL safe to paint into the export canvas (null = use the placeholder) */
function useCanvasSafeCovers(books: Book[]) {
  const [state, setState] = useState<{ key: string; urls: Map<string, string | null> } | null>(null)
  const key = books.map((b) => b.id).join(',')
  // Latest list via a ref: the check re-runs only when the ids (key) change
  const booksRef = useRef(books)
  useEffect(() => {
    booksRef.current = books
  })
  useEffect(() => {
    let cancelled = false
    Promise.all(
      booksRef.current.map(async (b) => [b.id, b.coverUrl ? await readableCoverUrl(b.coverUrl) : null] as const),
    ).then((results) => {
      if (!cancelled) setState({ key, urls: new Map(results) })
    })
    return () => {
      cancelled = true
    }
  }, [key])
  return state?.key === key ? state.urls : null
}

const MONTH_NAME = (month: string) =>
  new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).toLocaleDateString('en-US', { month: 'long' })

const firstSentence = (text: string) => (text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text).trim()

export function SharePage() {
  const [params, setParams] = useSearchParams()
  const { target, style, bookId } = parseShareParams(params)
  const profile = useLibrary((s) => s.profile)
  const entries = useLibrary((s) => s.entries)
  const history = useLibrary((s) => s.history)
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const styleId = useId()
  const firstName = profile.displayName.split(' ')[0]

  const go = (next: ShareTarget, nextStyle: ShareStyle = style) => setParams(shareSearch(next, nextStyle, bookId), { replace: true })

  /* ---------- Card content + alt text ---------- */
  const { content, alt, title } = useMemo((): { content: ShareCardContent; alt: string; title: string } => {
    const top4 = () => {
      const favorites = profile.favorites.map((id) => getBookById(id)).filter((b): b is Book => Boolean(b))
      return {
        title: 'Top 4',
        content: { type: 'top4' as const, books: favorites },
        alt: `${firstName}'s top 4 books: ${favorites.map((b) => b.title).join(', ') || 'none picked yet'}.`,
      }
    }
    switch (target.type) {
      case 'month': {
        const m = monthStats(history, target.month)
        const monthName = MONTH_NAME(target.month)
        const year = Number(target.month.slice(0, 4))
        const avg = m.avgRating === null ? '' : `, average rating ${formatRating(m.avgRating)} stars`
        return {
          title: `${monthName} recap`,
          content: { type: 'month', monthName, year, books: m.finished.map((f) => f.book), pages: m.pages, avgRating: m.avgRating, topRated: m.topRated?.book ?? null },
          alt:
            m.books === 0
              ? `${firstName}'s ${monthName} ${year} reading recap: no finished books yet.`
              : `${firstName}'s ${monthName} ${year} reading recap: ${m.books} ${m.books === 1 ? 'book' : 'books'}, ${m.pages.toLocaleString('en-US')} pages${avg}. Top pick: ${m.topRated?.book.title ?? 'none'}.`,
        }
      }
      case 'year': {
        const s = yearStats(history, target.year)
        const challenge = getChallengeProgress(entries)
        const count = target.year === challenge.year ? challenge.read : s.books
        const vibe = s.topMoods.map((m) => m.label)
        return {
          title: `${target.year} recap`,
          content: {
            type: 'year',
            year: target.year,
            count,
            topGenres: s.topGenres,
            topCovers: topRatedOfYear(history, target.year).map((f) => f.book),
            vibe,
          },
          alt: `${firstName}'s ${target.year} in books: ${count} books. Top genres: ${s.topGenres.map((g) => `${g.label} ${g.percent}%`).join(', ')}. Vibe: ${vibe.join(', ')}.`,
        }
      }
      case 'book': {
        const book = getBookById(target.bookId)
        const e = entries[target.bookId]
        // Unknown book id: show the Top 4 card instead
        if (!book) return top4()
        {
          const statusLine =
            e?.status === 'read' && e.finishedAt
              ? `Finished ${formatDate(e.finishedAt)}`
              : e?.status === 'reading'
                ? `Currently reading · p. ${e.currentPage}`
                : e?.status === 'dnf'
                  ? `DNF at p. ${e.dnfPage ?? e.currentPage}`
                  : e?.status === 'want'
                    ? 'On my TBR'
                    : 'Just discovered'
          const rating = e?.rating ?? null
          return {
            title: book.title,
            content: { type: 'book', book, rating, loved: e?.loved ?? false, reviewSentence: e?.reviewText ? firstSentence(e.reviewText) : null, statusLine },
            alt: `${firstName} on ${book.title} by ${book.author}: ${statusLine}${rating !== null ? `, rated ${formatRating(rating)} stars` : ''}${e?.loved ? ', loved it' : ''}.`,
          }
        }
      }
      default:
        return top4()
    }
  }, [target, entries, history, profile, firstName])

  const coverBooks =
    content.type === 'month'
      ? content.books
      : content.type === 'year'
        ? content.topCovers
        : content.type === 'book'
          ? [content.book]
          : content.books
  const coverUrls = useCanvasSafeCovers(coverBooks)

  /* ---------- Preview scaling ---------- */
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / CARD_WIDTH)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  /* ---------- Export ---------- */
  async function renderPng(): Promise<Blob | null> {
    if (!cardRef.current) return null
    const start = performance.now()
    const blob = await toBlob(cardRef.current, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      pixelRatio: 1,
      // The preview is scaled down with a transform; export at full size
      style: { transform: 'none' },
    })
    const ms = Math.round(performance.now() - start)
    console.info(`[share] PNG ${CARD_WIDTH}×${CARD_HEIGHT} generated in ${ms}ms`)
    return blob
  }

  const fileName = `goodreads-${target.type}${target.type === 'month' ? `-${target.month}` : ''}.png`
  const [canShareFiles] = useState(() => {
    try {
      return typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })
    } catch {
      return false
    }
  })

  async function run(action: 'share' | 'save') {
    setBusy(true)
    try {
      const blob = await renderPng()
      if (!blob) throw new Error('no image')
      if (action === 'share') {
        await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })], title: alt })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.append(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        toast('Image saved.')
      }
    } catch (error) {
      // Cancelling the native share sheet isn't an error worth showing
      if ((error as Error).name !== 'AbortError') toast("Couldn't create the image. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('Link copied.')
    } catch {
      toast("Couldn't copy the link.")
    }
  }

  const tabs = [
    ...(bookId ? [{ value: 'book', label: 'Book' }] : []),
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'top4', label: 'Top 4' },
  ]

  return (
    <>
      <TopBar title="Share card" back backFallback="/profile" />
      <div className="space-y-4 pt-2 pb-8">
        <Tabs
          value={target.type}
          onValueChange={(v) => {
            const now = new Date()
            const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            go(
              v === 'book' && bookId
                ? { type: 'book', bookId }
                : v === 'year'
                  ? { type: 'year', year: now.getFullYear() }
                  : v === 'top4'
                    ? { type: 'top4' }
                    : { type: 'month', month },
            )
          }}
        >
          <TabsList variant="line" aria-label="Card type" className="h-auto w-full justify-start gap-0 border-b border-border px-2">
            {tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="min-h-11 min-w-11 flex-none px-3 text-muted-foreground data-active:font-semibold data-active:text-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-1.5 px-4">
          <p id={styleId} className="text-sm font-semibold">
            Style
          </p>
          <SegmentedRadio
            labelledBy={styleId}
            value={style}
            onChange={(s) => go(target, s)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'brand', label: 'Brand' },
            ]}
            className="[&>button]:text-sm"
          />
        </div>

        {/* Preview: the real 1080×1920 card, scaled to fit */}
        <div className="px-4">
          <div ref={frameRef} className="relative w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-border" style={{ height: CARD_HEIGHT * scale }}>
            <div className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
              {coverUrls ? (
                <ShareCard ref={cardRef} content={content} style={style} handle={profile.handle} alt={alt} coverUrls={coverUrls} />
              ) : (
                <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT }} className="animate-pulse bg-muted" />
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">1080 × 1920 · {title}</p>
        </div>

        <div className="grid gap-2 px-4" style={{ gridTemplateColumns: `repeat(${canShareFiles ? 3 : 2}, minmax(0, 1fr))` }}>
          {canShareFiles && (
            <Button size="lg" className="min-h-11" disabled={busy || !coverUrls} onClick={() => run('share')}>
              <Share2 aria-hidden="true" />
              Share
            </Button>
          )}
          <Button size="lg" variant={canShareFiles ? 'outline' : 'default'} className={canShareFiles ? 'min-h-11 border-muted-foreground' : 'min-h-11'} disabled={busy || !coverUrls} onClick={() => run('save')}>
            <Download aria-hidden="true" />
            Save image
          </Button>
          <Button size="lg" variant="outline" className="min-h-11 border-muted-foreground" onClick={copyLink}>
            <Link2 aria-hidden="true" />
            Copy link
          </Button>
        </div>
        <p aria-live="polite" className="sr-only">
          {busy ? 'Creating image…' : ''}
        </p>
      </div>
    </>
  )
}

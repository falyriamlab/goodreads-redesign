import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BookCard } from '@/components/book/BookCard'
import { BookCover } from '@/components/book/BookCover'
import { LovedButton } from '@/components/book/LovedButton'
import { ReviewCard } from '@/components/book/ReviewCard'
import { StarRating } from '@/components/book/StarRating'
import { StatusChip } from '@/components/book/StatusChip'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { Button } from '@/components/ui/button'
import { DIRECTIONS, setDirection, useDirection } from '@/lib/direction'
import { Switch } from '@/components/ui/switch'
import { getBookById } from '@/mocks/books'
import { reviews } from '@/mocks/reviews'
import { useIsDark } from '@/lib/theme'
import { LIBRARY_SEED, useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { ReadingStatus } from '@/types/library'

const book = (id: string) => getBookById(id) as Book

// Real cover via Open Library to exercise the image path; a bad URL shows the fallback
const withImage: Book = {
  ...book('fourth-wing'),
  coverUrl: 'https://covers.openlibrary.org/b/isbn/9781649374042-M.jpg?default=false',
}
const brokenImage: Book = {
  ...book('onyx-storm'),
  coverUrl: 'https://covers.openlibrary.org/b/isbn/0000000000-M.jpg?default=false',
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border px-4 py-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function ChipDemo({
  initial,
  published = true,
  variant = 'chip',
}: {
  initial: ReadingStatus | null
  published?: boolean
  variant?: 'chip' | 'compact' | 'primary'
}) {
  const [status, setStatus] = useState(initial)
  return (
    <Labeled label={`${variant} · ${initial ?? 'null'}${published ? '' : ' · unpublished'}`}>
      <StatusChip
        bookId="fourth-wing"
        bookTitle="Fourth Wing"
        status={status}
        onStatusChange={setStatus}
        isPublished={published}
        variant={variant}
      />
    </Labeled>
  )
}

export function ComponentsPage() {
  // Theme lives in the store (Settings → Appearance); this switch is a shortcut
  const dark = useIsDark()
  const setThemeMode = useLibrary((s) => s.setThemeMode)
  const direction = useDirection()
  const [rating, setRating] = useState<number | null>(4.25)
  const [unrated, setUnrated] = useState<number | null>(null)
  const [loved, setLoved] = useState(true)
  const [notLoved, setNotLoved] = useState(false)

  return (
    <div className="mx-auto min-h-dvh w-full max-w-app bg-background pb-16 sm:border-x sm:border-border">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
        <h1 className="text-xl font-bold tracking-tight">Component lab</h1>
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
          Dark mode
          <Switch
            checked={dark}
            onCheckedChange={(checked) => {
              setThemeMode(checked ? 'dark' : 'light')
            }}
          />
        </label>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <p className="text-sm text-muted-foreground">Every state on one page. Give it a vibe check before step 3.</p>
        {/* Clean slate for recording demos: wipes the persisted library, drafts and theme choice */}
        <Button
          variant="outline"
          className="min-h-11 border-muted-foreground"
          onClick={() => {
            try {
              localStorage.clear()
            } catch {
              // Storage blocked: a reload still resets in-memory state
            }
            window.location.reload()
          }}
        >
          Reset demo data
        </Button>
      </div>

      {/* visual-pass: pick a direction for Home and the book page (same as ?direction=a|b|current) */}
      <div className="space-y-2 px-4 pt-4">
        <p id="direction-label" className="text-sm font-semibold">
          Visual direction
        </p>
        <SegmentedRadio
          labelledBy="direction-label"
          describedBy="direction-hint"
          value={direction}
          onChange={setDirection}
          options={DIRECTIONS.map((d) => ({ value: d.value, label: d.name }))}
          className="[&>button]:text-xs"
        />
        <p id="direction-hint" className="text-xs text-muted-foreground">
          {DIRECTIONS.find((d) => d.value === direction)?.summary}. Applies to Home and the book page only.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            Open Home
          </Link>
          <Link to="/book/fourth-wing" className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
            Open Fourth Wing
          </Link>
        </div>
      </div>

      <Section title="BookCover" note="sm 56px · md 104px · lg 132px. Placeholder when coverUrl is null.">
        <div className="flex items-end gap-3">
          <Labeled label="sm">
            <BookCover book={book('six-of-crows')} size="sm" />
          </Labeled>
          <Labeled label="md">
            <BookCover book={book('the-song-of-achilles')} size="md" />
          </Labeled>
          <Labeled label="lg">
            <BookCover book={book('the-seven-husbands-of-evelyn-hugo')} size="lg" />
          </Labeled>
        </div>
        <div className="flex items-end gap-3">
          <Labeled label="image">
            <BookCover book={withImage} size="md" />
          </Labeled>
          <Labeled label="broken url → fallback">
            <BookCover book={brokenImage} size="md" />
          </Labeled>
        </div>
      </Section>

      <Section title="StatusChip" note="Local state only. In BookCard and the book page, Read / DNF open the log sheet.">
        <div className="flex flex-wrap gap-x-4 gap-y-5">
          <ChipDemo initial={null} />
          <ChipDemo initial="want" />
          <ChipDemo initial="reading" />
          <ChipDemo initial="read" />
          <ChipDemo initial="dnf" />
          <ChipDemo initial="want" published={false} />
          <ChipDemo initial={null} variant="compact" />
          <ChipDemo initial="reading" variant="compact" />
        </div>
        <div className="w-full">
          <ChipDemo initial="reading" variant="primary" />
        </div>
      </Section>

      <Section title="BookCard · default" note="Connected to the library store (persisted).">
        <div className="flex gap-4 overflow-x-auto pb-2">
          {['fourth-wing', 'six-of-crows', 'iron-flame', 'onyx-storm'].map((id) => (
            <BookCard key={id} book={book(id)} />
          ))}
        </div>
      </Section>

      <Section title="BookCard · grid" note="Library: cover, chip and stars.">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {['fourth-wing', 'six-of-crows', 'the-song-of-achilles', 'book-lovers', 'babel', 'iron-widow'].map((id) => (
            <BookCard key={id} book={book(id)} variant="grid" />
          ))}
        </div>
      </Section>

      <Section title="BookCard · row" note="Search results.">
        <div className="divide-y divide-border">
          {['fourth-wing', 'babel', 'red-white-and-royal-blue', 'iron-widow'].map((id) => (
            <BookCard key={id} book={book(id)} variant="row" />
          ))}
        </div>
        <Button variant="outline" size="lg" className="min-h-11" onClick={() => useLibrary.setState({ entries: LIBRARY_SEED })}>
          Reset library to seed
        </Button>
      </Section>

      <Section title="StarRating · display" note="Quarter stars with partial fill.">
        <div className="space-y-2">
          {[0, 0.25, 0.5, 0.75, 1.5, 3.75, 4.25, 5].map((v) => (
            <Labeled key={v} label={String(v)}>
              <StarRating value={v} size="md" showValue />
            </Labeled>
          ))}
          <Labeled label="null">
            <StarRating value={null} />
          </Labeled>
        </div>
      </Section>

      <Section title="StarRating · input" note="Drag or tap. Arrows ±0.25, Home/End, PageUp/PageDown ±1.">
        <Labeled label={`value: ${rating}`}>
          <StarRating mode="input" value={rating} onChange={setRating} label="Your rating for Fourth Wing" />
        </Labeled>
        <Labeled label={`value: ${unrated}`}>
          <StarRating mode="input" value={unrated} onChange={setUnrated} label="Your rating for Babel" />
        </Labeled>
      </Section>

      <Section title="LovedButton">
        <div className="flex flex-wrap items-center gap-3">
          <LovedButton pressed={loved} onPressedChange={setLoved} />
          <LovedButton pressed={notLoved} onPressedChange={setNotLoved} />
          <LovedButton pressed={loved} onPressedChange={setLoved} iconOnly />
          <LovedButton pressed={notLoved} onPressedChange={setNotLoved} iconOnly />
        </div>
      </Section>

      <Section title="ReviewCard" note="Long text (clamped), spoilers, and no rating / not verified.">
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </Section>
    </div>
  )
}

import { useEffect, useId, useRef, useState, type ComponentProps } from 'react'
import { CircleAlert } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { BookCover } from '@/components/book/BookCover'
import { LovedButton } from '@/components/book/LovedButton'
import { StarRating } from '@/components/book/StarRating'
import { statusMeta, statusOrder } from '@/components/book/statusMeta'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { SelectedCheck } from '@/components/common/SelectedCheck'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { todayISO } from '@/lib/date'
import { parsePageInput } from '@/lib/pageInput'
import { cn } from '@/lib/utils'
import { books, getBookById } from '@/mocks/books'
import { EMPTY_ENTRY, useChallengeProgress, useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { DnfReason, ReadingStatus } from '@/types/library'
import type { LogSheetOptions } from './context'

type LogSheetProps = {
  bookId: string
  options: LogSheetOptions
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus: ComponentProps<typeof DrawerContent>['onCloseAutoFocus']
}

const dnfReasons: { value: DnfReason; label: string }[] = [
  { value: 'not-for-me', label: 'Not for me' },
  { value: 'too-slow', label: 'Too slow' },
  { value: 'not-right-time', label: 'Not the right time' },
  { value: 'content', label: 'Content' },
]

// Form fields get a 3:1 boundary (WCAG 1.4.11); the theme's --input border is too light
const fieldClass = 'min-h-11 border-muted-foreground'
const toggleOnClass =
  'min-h-11 border-muted-foreground font-medium group/selected data-[state=on]:border-muted-foreground data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground'

const draftKey = (bookId: string) => `review-draft:${bookId}`

function readDraft(bookId: string): string | null {
  try {
    return localStorage.getItem(draftKey(bookId))
  } catch {
    return null
  }
}

function writeDraft(bookId: string, text: string | null) {
  try {
    if (text === null || text === '') localStorage.removeItem(draftKey(bookId))
    else localStorage.setItem(draftKey(bookId), text)
  } catch {
    // Storage unavailable: drafts just don't persist
  }
}

export function LogSheet({ bookId, options, open, onOpenChange, onCloseAutoFocus }: LogSheetProps) {
  const book = getBookById(bookId) as Book
  const navigate = useNavigate()
  const logBook = useLibrary((s) => s.logBook)
  const takeSnapshot = useLibrary((s) => s.takeSnapshot)
  const restoreSnapshot = useLibrary((s) => s.restoreSnapshot)
  const setStatusInStore = useLibrary((s) => s.setStatus)
  const entries = useLibrary((s) => s.entries)

  // Snapshot of the entry when the sheet opened: the form starts from it
  const [initial] = useState(() => useLibrary.getState().entries[bookId] ?? EMPTY_ENTRY)
  const [step, setStep] = useState<'form' | 'next'>('form')

  const [status, setStatus] = useState<ReadingStatus>(options.intent ?? initial.status ?? 'want')
  const [startedAt, setStartedAt] = useState(initial.startedAt ?? '')
  const [finishedAt, setFinishedAt] = useState(todayISO())
  const [rating, setRating] = useState<number | null>(options.rating ?? initial.rating)
  const [loved, setLoved] = useState(initial.loved)
  const [reviewText, setReviewText] = useState(() => readDraft(bookId) ?? initial.reviewText ?? '')
  const [containsSpoilers, setContainsSpoilers] = useState(initial.containsSpoilers)
  const [isReread, setIsReread] = useState(false)
  const [dnfPageText, setDnfPageText] = useState(String(initial.dnfPage ?? (initial.currentPage || '')))
  const [dnfReason, setDnfReason] = useState<DnfReason | null>(initial.dnfReason)
  const [draftStatus, setDraftStatus] = useState('')

  const reviewRef = useRef<HTMLTextAreaElement>(null)
  const nextHeadingRef = useRef<HTMLHeadingElement>(null)
  const dirtyRef = useRef(false)
  // Text typed in the last 500ms, not on disk yet
  const pendingDraftRef = useRef<string | null>(null)
  const ids = {
    status: useId(),
    started: useId(),
    finished: useId(),
    dateError: useId(),
    dnfPage: useId(),
    dnfPageError: useId(),
    dnfReason: useId(),
    review: useId(),
    reviewHelp: useId(),
    spoilers: useId(),
    reread: useId(),
  }

  const finishing = status === 'read' || status === 'dnf'
  const reviewAllowed = book.isPublished && finishing
  const dateError = finishing && startedAt !== '' && finishedAt !== '' && finishedAt < startedAt
  // DNF "Stopped at page" is optional, but never out of range
  const dnfPage = parsePageInput(dnfPageText, book.pages, { required: false })
  const pageError = status === 'dnf' && !dnfPage.valid
  const blocked = dateError || pageError

  // Review draft: saved per book, debounced 500ms, announced politely
  useEffect(() => {
    if (!dirtyRef.current) return
    pendingDraftRef.current = reviewText
    const timer = setTimeout(() => {
      writeDraft(bookId, reviewText)
      pendingDraftRef.current = null
      setDraftStatus(reviewText ? 'Draft saved' : '')
    }, 500)
    return () => clearTimeout(timer)
  }, [bookId, reviewText])

  // Closing inside the debounce window (Back, swipe, ×) still keeps the last words: flush on close and unmount
  useEffect(() => {
    if (open || pendingDraftRef.current === null) return
    writeDraft(bookId, pendingDraftRef.current)
    pendingDraftRef.current = null
  }, [open, bookId])
  useEffect(
    () => () => {
      if (pendingDraftRef.current !== null) writeDraft(bookId, pendingDraftRef.current)
    },
    [bookId],
  )

  useEffect(() => {
    if (step === 'next') nextHeadingRef.current?.focus()
  }, [step])

  // Header copy
  const challenge = useChallengeProgress()
  const alreadyCounted = initial.status === 'read' && initial.finishedAt?.startsWith(String(challenge.year))
  const n = challenge.read + (alreadyCounted ? 0 : 1)
  const header =
    status === 'read'
      ? { title: `You finished ${book.title}!`, subtitle: `Main character energy. That's ${n} of ${challenge.goal}.` }
      : status === 'dnf'
        ? { title: 'Not every book is for you.', subtitle: "DNFs don't count toward your challenge." }
        : { title: `Log ${book.title}`, subtitle: `by ${book.author}` }

  function save(share: boolean) {
    if (blocked) return
    const snapshot = takeSnapshot()
    logBook(bookId, {
      status,
      startedAt: startedAt || null,
      finishedAt: finishing ? finishedAt || null : null,
      rating,
      loved,
      reviewText: reviewAllowed ? reviewText : '',
      containsSpoilers,
      dnfPage: status === 'dnf' ? dnfPage.page : null,
      dnfReason: status === 'dnf' ? dnfReason : null,
      isReread,
    })
    pendingDraftRef.current = null
    if (reviewAllowed) writeDraft(bookId, null)
    toast('Logged.', { action: { label: 'Undo', onClick: () => restoreSnapshot(snapshot) } })

    if (share) {
      onOpenChange(false)
      navigate(`/share?type=book&book=${bookId}`)
    } else if (status === 'read') {
      setStep('next')
    } else {
      onOpenChange(false)
    }
  }

  // "What's next?": Want-to-read books, next in the same series first
  const nextUp = books
    .filter((b) => b.id !== bookId && entries[b.id]?.status === 'want')
    .sort((a, b) => Number(isNextInSeries(book, b)) - Number(isNextInSeries(book, a)))
    .slice(0, 3)

  return (
    // autoFocus: vaul defaults to false, which would leave focus outside the dialog
    <Drawer open={open} onOpenChange={onOpenChange} autoFocus>
      <DrawerContent
        className="mx-auto max-h-[92dvh] w-full max-w-app"
        onOpenAutoFocus={(event) => {
          if (options.focus === 'review' && reviewRef.current && !reviewRef.current.disabled) {
            event.preventDefault()
            reviewRef.current.focus()
          }
        }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {step === 'form' ? (
          <>
            <DrawerHeader className="flex-row items-center gap-3 text-left">
              <BookCover book={book} size="sm" />
              <div className="min-w-0 space-y-0.5">
                <DrawerTitle className="section-title">{header.title}</DrawerTitle>
                <DrawerDescription>{header.subtitle}</DrawerDescription>
              </div>
            </DrawerHeader>

            {/* data-vaul-no-drag: drags inside the form (star slider, text selection) never close the sheet */}
            <div data-vaul-no-drag className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              {/* 2. Status */}
              <fieldset className="min-w-0 space-y-2">
                <legend id={ids.status} className="text-sm font-semibold">
                  Status
                </legend>
                <SegmentedRadio
                  labelledBy={ids.status}
                  value={status}
                  onChange={setStatus}
                  options={statusOrder.map((s) => ({
                    value: s,
                    label: s === 'want' ? 'Want to read' : statusMeta[s].label,
                    disabled: !book.isPublished && (s === 'read' || s === 'dnf'),
                  }))}
                />
              </fieldset>

              {/* 3. Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={ids.started}>Started</Label>
                  <Input
                    id={ids.started}
                    type="date"
                    value={startedAt}
                    max={todayISO()}
                    onChange={(e) => setStartedAt(e.target.value)}
                    aria-invalid={dateError || undefined}
                    aria-describedby={dateError ? ids.dateError : undefined}
                    className={fieldClass}
                  />
                </div>
                {finishing && (
                  <div className="space-y-1.5">
                    <Label htmlFor={ids.finished}>Finished</Label>
                    <Input
                      id={ids.finished}
                      type="date"
                      value={finishedAt}
                      max={todayISO()}
                      onChange={(e) => setFinishedAt(e.target.value)}
                      aria-invalid={dateError || undefined}
                      aria-describedby={dateError ? ids.dateError : undefined}
                      className={fieldClass}
                    />
                  </div>
                )}
                {dateError && (
                  <p id={ids.dateError} role="alert" className="col-span-2 flex items-center gap-1.5 text-sm font-medium">
                    <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                    Finish date can't be before you started.
                  </p>
                )}
              </div>

              {/* 4. DNF details */}
              {status === 'dnf' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={ids.dnfPage}>Stopped at page</Label>
                    <Input
                      id={ids.dnfPage}
                      type="number"
                      inputMode="numeric"
                      value={dnfPageText}
                      onChange={(e) => setDnfPageText(e.target.value)}
                      aria-invalid={pageError || undefined}
                      aria-describedby={pageError ? ids.dnfPageError : undefined}
                      className={cn(fieldClass, 'w-32')}
                    />
                    {pageError && (
                      <p id={ids.dnfPageError} className="flex items-center gap-1.5 text-sm font-medium">
                        <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                        {dnfPage.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <p id={ids.dnfReason} className="text-sm font-medium">
                      Why? <span className="font-normal text-muted-foreground">(optional)</span>
                    </p>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      aria-labelledby={ids.dnfReason}
                      value={dnfReason ?? ''}
                      onValueChange={(v) => setDnfReason((v || null) as DnfReason | null)}
                      className="flex w-full flex-wrap"
                    >
                      {dnfReasons.map((r) => (
                        <ToggleGroupItem key={r.value} value={r.value} className={toggleOnClass}>
                          <SelectedCheck />
                          {r.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>
              )}

              {/* 5–6. Rating + loved */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold">Your rating</p>
                  <StarRating mode="input" value={rating} onChange={setRating} label={`Your rating for ${book.title}`} />
                </div>
                <LovedButton pressed={loved} onPressedChange={setLoved} />
              </div>

              {/* 7. Review (rule H5) */}
              <div className="space-y-1.5">
                <Label htmlFor={ids.review}>Your review</Label>
                <Textarea
                  ref={reviewRef}
                  id={ids.review}
                  value={reviewText}
                  disabled={!book.isPublished}
                  placeholder="Spill the tea…"
                  aria-describedby={ids.reviewHelp}
                  onChange={(e) => {
                    dirtyRef.current = true
                    setDraftStatus('')
                    setReviewText(e.target.value)
                  }}
                  className={cn(fieldClass, 'min-h-28 text-base')}
                />
                <div id={ids.reviewHelp} className="space-y-2">
                  {!book.isPublished ? (
                    <p className="text-sm text-muted-foreground">You can review it once it's out.</p>
                  ) : !finishing ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">Mark it as read to post your review</p>
                      <Button variant="outline" className="min-h-11 border-muted-foreground" onClick={() => setStatus('read')}>
                        Mark as read
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
                  {draftStatus}
                </p>
              </div>

              {/* 8. Checkboxes */}
              <div className="space-y-1">
                <div className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id={ids.spoilers}
                    checked={containsSpoilers}
                    disabled={!reviewAllowed}
                    onCheckedChange={(v) => setContainsSpoilers(v === true)}
                    className="size-5 border-muted-foreground"
                  />
                  <Label htmlFor={ids.spoilers} className="min-h-11 flex-1">
                    Contains spoilers
                  </Label>
                </div>
                {initial.everRead && status === 'read' && (
                  <div className="flex min-h-11 items-center gap-3">
                    <Checkbox
                      id={ids.reread}
                      checked={isReread}
                      onCheckedChange={(v) => setIsReread(v === true)}
                      className="size-5 border-muted-foreground"
                    />
                    <Label htmlFor={ids.reread} className="min-h-11 flex-1">
                      This is a reread
                    </Label>
                  </div>
                )}
              </div>
            </div>

            {/* 9. Actions */}
            <DrawerFooter className="grid grid-cols-2 gap-3 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button variant="secondary" size="lg" className="min-h-11" disabled={blocked} onClick={() => save(true)}>
                Save & share
              </Button>
              <Button size="lg" className="min-h-11" disabled={blocked} onClick={() => save(false)}>
                Save
              </Button>
            </DrawerFooter>
          </>
        ) : (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle asChild>
                <h2 ref={nextHeadingRef} tabIndex={-1} className="section-title outline-none">
                  What's next?
                </h2>
              </DrawerTitle>
              <DrawerDescription>Pick your next read while the vibes are high.</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto px-4">
              {nextUp.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Your Want to read shelf is empty.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {nextUp.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 py-3">
                      <BookCover book={b} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 book-title">{b.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {b.author}
                          {b.series && ` · ${b.series} #${b.seriesNumber}`}
                        </p>
                      </div>
                      <Button
                        className="min-h-11"
                        aria-label={`Start reading ${b.title}`}
                        onClick={() => {
                          setStatusInStore(b.id, 'reading')
                          onOpenChange(false)
                        }}
                      >
                        Start reading
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DrawerFooter className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button variant="outline" size="lg" className="min-h-11 border-muted-foreground" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

function isNextInSeries(current: Book, candidate: Book): boolean {
  return (
    current.series !== null &&
    candidate.series === current.series &&
    candidate.seriesNumber === (current.seriesNumber ?? 0) + 1
  )
}

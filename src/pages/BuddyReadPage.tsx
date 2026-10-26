import { useId, useRef, useState } from 'react'
import { ChevronDown, EyeOff, Lock } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { BookCover } from '@/components/book/BookCover'
import { useBuddyComments } from '@/components/community/data'
import { FixedComposer } from '@/components/community/FixedComposer'
import { LikeButton } from '@/components/community/LikeButton'
import { useAuthor } from '@/components/community/people'
import { UserAvatar } from '@/components/community/UserAvatar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buddyReaderCount, currentChapter, groupCommentsByChapter, spanLabel, type ChapterGroup } from '@/lib/community'
import { formatTimeAgo } from '@/lib/date'
import { cn } from '@/lib/utils'
import { getBookById } from '@/mocks/books'
import { getBuddyRead } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { BuddyComment, BuddyRead } from '@/types/community'

const selectClass =
  'min-h-11 rounded-lg border border-muted-foreground bg-card px-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function BuddyReadPage() {
  const { id = '' } = useParams()
  const br = getBuddyRead(id)
  const book = br && getBookById(br.bookId)
  if (!br || !book) {
    return (
      <>
        <TopBar title="Buddy read not found" back backFallback="/community?tab=buddy-reads" />
        <p className="px-4 py-6 text-sm text-muted-foreground">This buddy read wrapped up or never existed.</p>
      </>
    )
  }
  return <BuddyReadView key={br.id} br={br} book={book} />
}

const chapterId = (n: number) => `chapter-${n}`

function BuddyReadView({ br, book }: { br: BuddyRead; book: Book }) {
  const entry = useLibrary((s) => s.entries[book.id])
  const joined = useLibrary((s) => s.joinedBuddyReads.includes(br.id))
  const join = useLibrary((s) => s.joinBuddyRead)
  const leave = useLibrary((s) => s.leaveBuddyRead)
  const host = useAuthor(br.hostId)
  const comments = useBuddyComments(br.id)

  const myChapter = currentChapter(book, entry)
  const chapterCount = book.chapterCount ?? 1
  const groups = groupCommentsByChapter(comments, myChapter)
  // Chapters ahead of you that you chose to open anyway
  const [revealed, setRevealed] = useState<number[]>([])
  const [jumpTo, setJumpTo] = useState(myChapter)
  const jumpId = useId()

  function jump(chapter: number) {
    setJumpTo(chapter)
    const target = document.getElementById(chapterId(chapter))
    if (!target) return
    target.scrollIntoView({ block: 'start' })
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  const chaptersWithComments = groups.map((g) => g.chapter)
  const jumpOptions = [...new Set([...chaptersWithComments, myChapter])].sort((a, b) => a - b)

  return (
    <>
      <TopBar back backFallback="/community?tab=buddy-reads" />
      <div className="space-y-6 px-4 pt-4 pb-6">
        <header className="space-y-4">
          <div className="flex gap-4">
            <Link to={`/book/${book.id}`} aria-label={book.title} className="shrink-0 self-start rounded-cover outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <BookCover book={book} size="md" />
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Buddy read</p>
              <h1 className="text-2xl leading-tight font-bold">{book.title}</h1>
              <p className="text-sm">
                {buddyReaderCount(br, joined)} readers · hosted by {host.name}
              </p>
              <p className="text-sm">This week: {spanLabel(br.currentSpan)}</p>
              <p className="text-xs text-muted-foreground">
                {entry?.status === 'read'
                  ? 'You finished it: every chapter is open.'
                  : `You're on Ch. ${myChapter} of ${chapterCount} (from your page ${entry?.currentPage ?? 0}).`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor={jumpId} className="text-sm font-semibold">
                Chapter
              </label>
              <select id={jumpId} value={jumpTo} onChange={(e) => jump(Number(e.target.value))} className={selectClass}>
                {jumpOptions.map((n) => (
                  <option key={n} value={n}>
                    Ch. {n}
                    {n === myChapter ? ' (you)' : n > myChapter ? ' (ahead)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto">
              {joined ? (
                <Button
                  variant="outline"
                  className="min-h-11 border-muted-foreground"
                  onClick={() => {
                    leave(br.id)
                    toast(`You left the ${book.title} buddy read.`, { action: { label: 'Undo', onClick: () => join(br.id) } })
                  }}
                >
                  Leave
                </Button>
              ) : (
                <Button
                  className="min-h-11"
                  onClick={() => {
                    join(br.id)
                    toast("You're in. Pull up a chair.")
                  }}
                >
                  Join
                </Button>
              )}
            </div>
          </div>
        </header>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <ChapterSection
                key={g.chapter}
                group={g}
                isMine={g.chapter === myChapter}
                revealed={revealed.includes(g.chapter)}
                onToggleReveal={() =>
                  setRevealed((list) => (list.includes(g.chapter) ? list.filter((n) => n !== g.chapter) : [...list, g.chapter]))
                }
              />
            ))}
          </div>
        )}
      </div>

      {joined ? (
        <BuddyComposer
          br={br}
          myChapter={myChapter}
          chapterCount={chapterCount}
          onPosted={(c) => {
            // Your own comment is always visible, even in a chapter ahead of you
            if (c.chapter > myChapter) setRevealed((list) => (list.includes(c.chapter) ? list : [...list, c.chapter]))
            requestAnimationFrame(() =>
              document.getElementById(`comment-${c.id}`)?.scrollIntoView({ block: 'nearest' }),
            )
          }}
        />
      ) : (
        <p className="mx-4 mb-6 rounded-xl border border-dashed border-muted-foreground p-4 text-sm text-muted-foreground">
          Join the buddy read to comment.
        </p>
      )}
    </>
  )
}

function ChapterSection({
  group,
  isMine,
  revealed,
  onToggleReveal,
}: {
  group: ChapterGroup
  isMine: boolean
  revealed: boolean
  onToggleReveal: () => void
}) {
  const headingId = useId()
  const listId = useId()
  const hidden = group.ahead && !revealed
  const n = group.comments.length

  return (
    <section id={chapterId(group.chapter)} aria-labelledby={headingId} className="scroll-mt-16 space-y-4">
      <h2 id={headingId} tabIndex={-1} className="section-title flex items-center gap-2 outline-none">
        {group.ahead && <Lock className="size-4" aria-hidden="true" />}
        Ch. {group.chapter}
        {group.ahead && <span className="font-medium"> · You're not there yet</span>}
        {isMine && <span className="rounded-full border border-foreground px-2 py-0.5 text-xs font-semibold">You're here</span>}
      </h2>
      {group.ahead && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-muted-foreground bg-muted px-3 py-1">
          <p className="text-sm">
            {n} {n === 1 ? 'comment' : 'comments'} {hidden ? 'hidden' : 'shown'}
          </p>
          <button
            type="button"
            aria-expanded={revealed}
            aria-controls={listId}
            onClick={onToggleReveal}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {revealed ? 'Hide again' : 'Reveal anyway'}
            <ChevronDown className={cn('size-4 transition-transform', revealed && 'rotate-180')} aria-hidden="true" />
          </button>
        </div>
      )}
      <ul id={listId} hidden={hidden} className="space-y-3">
        {group.comments.map((c) => (
          <li key={c.id} id={`comment-${c.id}`}>
            <CommentItem comment={c} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CommentItem({ comment }: { comment: BuddyComment }) {
  const author = useAuthor(comment.authorId)
  const bodyId = useId()
  const [revealed, setRevealed] = useState(!comment.containsSpoilers)

  return (
    <article className="flex gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <UserAvatar author={author} size="sm" className="-mt-1.5 -ml-1.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-semibold">{author.isMe ? 'You' : author.name}</span>{' '}
          <span className="text-xs text-muted-foreground">
            · <time dateTime={comment.createdAt}>{formatTimeAgo(comment.createdAt)}</time>
          </span>
        </p>
        {comment.containsSpoilers && (
          <button
            type="button"
            aria-expanded={revealed}
            aria-controls={bodyId}
            onClick={() => setRevealed((v) => !v)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-input bg-muted px-3 text-sm font-medium outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <EyeOff className="size-4" aria-hidden="true" />
            {revealed ? 'Hide spoilers' : 'Spoilers ahead · Tap to reveal'}
          </button>
        )}
        <p id={bodyId} hidden={!revealed} className="text-sm leading-relaxed whitespace-pre-line">
          {comment.text}
        </p>
        <LikeButton kind="comment" id={comment.id} base={comment.likes ?? 0} className="-ml-2" />
      </div>
    </article>
  )
}

function BuddyComposer({
  br,
  myChapter,
  chapterCount,
  onPosted,
}: {
  br: BuddyRead
  myChapter: number
  chapterCount: number
  onPosted: (comment: BuddyComment) => void
}) {
  const post = useLibrary((s) => s.postBuddyComment)
  const [chapter, setChapter] = useState(myChapter)
  const [text, setText] = useState('')
  const [spoilers, setSpoilers] = useState(false)
  const [status, setStatus] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)
  const ids = { chapter: useId(), text: useId(), spoilers: useId() }

  return (
    <FixedComposer
      label="Comment on this buddy read"
      onSubmit={() => {
        const comment = post({ buddyReadId: br.id, chapter, text, containsSpoilers: spoilers })
        if (!comment) {
          setStatus('Write something first.')
          textRef.current?.focus()
          return
        }
        setText('')
        setSpoilers(false)
        setStatus(`Comment posted in Ch. ${chapter}.`)
        onPosted(comment)
        // Focus stays in the composer for the next thought
        textRef.current?.focus()
      }}
    >
      <div className="flex items-center gap-3">
        <label htmlFor={ids.chapter} className="text-sm font-semibold">
          Chapter
        </label>
        <select
          id={ids.chapter}
          value={chapter}
          onChange={(e) => setChapter(Number(e.target.value))}
          className={selectClass}
        >
          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              Ch. {n}
              {n === myChapter ? ' (you)' : ''}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Checkbox
            id={ids.spoilers}
            checked={spoilers}
            onCheckedChange={(v) => setSpoilers(v === true)}
            className="size-5 border-muted-foreground"
          />
          <Label htmlFor={ids.spoilers} className="min-h-11">
            Contains spoilers
          </Label>
        </div>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <label htmlFor={ids.text} className="sr-only">
          Comment on chapter {chapter}
        </label>
        <Textarea
          id={ids.text}
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Comment on Ch. ${chapter}`}
          rows={1}
          className="max-h-32 min-h-11 border-muted-foreground text-base"
        />
        <Button type="submit" className="min-h-11 shrink-0">
          Post
        </Button>
      </div>
      <p role="status" className="sr-only">
        {status}
      </p>
    </FixedComposer>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { BookPlus, SendHorizontal } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { BookCover } from '@/components/book/BookCover'
import { FixedComposer } from '@/components/community/FixedComposer'
import { resolveAuthor, type Author } from '@/components/community/people'
import { ShareBookDrawer } from '@/components/community/ShareBookDrawer'
import { UserAvatar } from '@/components/community/UserAvatar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { conversationMessages } from '@/lib/community'
import { formatMessageTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { getBookById } from '@/mocks/books'
import { getConversation } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import { ME, type Conversation, type Message } from '@/types/community'

export function ConversationPage() {
  const { id = '' } = useParams()
  const conversation = getConversation(id)
  if (!conversation) {
    return (
      <>
        <TopBar title="Conversation not found" back backFallback="/messages" />
        <p className="px-4 py-6 text-sm text-muted-foreground">We couldn't find this chat.</p>
      </>
    )
  }
  return <ConversationView key={conversation.id} conversation={conversation} />
}

/** A new run starts when the sender changes or 10+ minutes pass */
const startsRun = (prev: Message | undefined, m: Message) =>
  !prev || prev.fromId !== m.fromId || new Date(m.sentAt).getTime() - new Date(prev.sentAt).getTime() > 10 * 60_000

function ConversationView({ conversation }: { conversation: Conversation }) {
  const profile = useLibrary((s) => s.profile)
  const sent = useLibrary((s) => s.sentMessages)
  const sendMessage = useLibrary((s) => s.sendMessage)
  const markRead = useLibrary((s) => s.markConversationRead)
  const person = resolveAuthor(conversation.userId, profile.displayName, profile.handle)
  const messages = conversationMessages(conversation, sent)
  const firstName = person.name.split(' ')[0]

  const [text, setText] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const textId = useId()
  const logId = useId()

  // Opening the chat marks it read
  useEffect(() => {
    markRead(conversation.id)
  }, [conversation.id, markRead])

  // Start at (and follow) the latest message
  const count = messages.length
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight })
  }, [count])

  function send(body: string, bookId?: string) {
    if (!sendMessage(conversation.id, body, bookId)) return
    if (!bookId) setText('')
    textRef.current?.focus()
  }

  return (
    <>
      <TopBar title={person.name} back backFallback="/messages" actions={<UserAvatar author={person} />} />
      <div className="px-4 pt-4 pb-4">
        <h2 id={logId} className="sr-only">
          Messages with {person.name}
        </h2>
        {/* role="log" + aria-live: messages you send (and any new ones) are announced politely */}
        <ol role="log" aria-live="polite" aria-labelledby={logId} className="space-y-1">
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              person={person}
              firstOfRun={startsRun(messages[i - 1], m)}
              lastOfRun={!messages[i + 1] || startsRun(m, messages[i + 1])}
            />
          ))}
        </ol>
      </div>

      <FixedComposer label={`Message ${person.name}`} onSubmit={() => send(text)}>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Share a book"
            className="size-11 shrink-0 border-muted-foreground [&_svg]:size-5"
            onClick={() => setDrawerOpen(true)}
          >
            <BookPlus aria-hidden="true" />
          </Button>
          <label htmlFor={textId} className="sr-only">
            Message {firstName}
          </label>
          <Textarea
            id={textId}
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter adds a line (and never while an IME is composing)
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder={`Message ${firstName}`}
            rows={1}
            aria-describedby={`${textId}-hint`}
            className="max-h-32 min-h-11 border-muted-foreground text-base"
          />
          <span id={`${textId}-hint`} className="sr-only">
            Enter to send, Shift+Enter for a new line.
          </span>
          <Button type="submit" size="icon" aria-label="Send" className="size-11 shrink-0 [&_svg]:size-5">
            <SendHorizontal aria-hidden="true" />
          </Button>
        </div>
      </FixedComposer>

      <ShareBookDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recipientName={firstName}
        onPick={(bookId) => {
          setDrawerOpen(false)
          send('', bookId)
        }}
      />
    </>
  )
}

function MessageBubble({
  message,
  person,
  firstOfRun,
  lastOfRun,
}: {
  message: Message
  person: Author
  firstOfRun: boolean
  lastOfRun: boolean
}) {
  const mine = message.fromId === ME
  const book = message.bookId ? getBookById(message.bookId) : undefined

  return (
    // Yours: right-aligned, filled; theirs: left-aligned, outlined. Plus a spoken "You:" / "Maya:" prefix.
    <li className={cn('flex flex-col', mine ? 'items-end' : 'items-start', firstOfRun && 'pt-2')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-[0.9375rem] leading-snug whitespace-pre-line',
          mine
            ? 'rounded-br-md bg-foreground text-background'
            : 'rounded-bl-md border border-border bg-card text-card-foreground',
        )}
      >
        <span className="sr-only">{mine ? 'You' : person.name.split(' ')[0]}: </span>
        {message.text && <p>{message.text}</p>}
        {book && (
          <Link
            to={`/book/${book.id}`}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-lg p-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              message.text && 'mt-2',
              mine ? 'bg-background/15 hover:bg-background/25' : 'bg-muted hover:bg-muted/70',
            )}
          >
            <span aria-hidden="true">
              <BookCover book={book} size="sm" className="w-10" />
            </span>
            <span className="min-w-0">
              <span className="sr-only">Shared a book: </span>
              <span className="block text-sm leading-tight font-semibold">{book.title}</span>
              <span className="block text-xs">{book.author}</span>
            </span>
          </Link>
        )}
      </div>
      {lastOfRun && (
        <time dateTime={message.sentAt} className="px-1 pt-0.5 text-xs text-muted-foreground">
          {formatMessageTime(message.sentAt)}
        </time>
      )}
    </li>
  )
}

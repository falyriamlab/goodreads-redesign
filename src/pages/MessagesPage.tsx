import { Link } from 'react-router'
import { resolveAuthor } from '@/components/community/people'
import { UserAvatar } from '@/components/community/UserAvatar'
import { TopBar } from '@/components/layout/TopBar'
import { conversationMessages, isConversationUnread } from '@/lib/community'
import { formatMessageTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { getBookById } from '@/mocks/books'
import { conversations } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import { ME, type Message } from '@/types/community'

/** "You: Sounds good" / "Shared a book: Circe" */
function preview(m: Message): string {
  const body = m.bookId ? `Shared a book: ${getBookById(m.bookId)?.title ?? 'a book'}` : m.text
  return m.fromId === ME ? `You: ${body}` : body
}

export function MessagesPage() {
  const sent = useLibrary((s) => s.sentMessages)
  const readIds = useLibrary((s) => s.readConversations)
  const profile = useLibrary((s) => s.profile)

  const rows = conversations
    .map((c) => {
      const messages = conversationMessages(c, sent)
      return { c, last: messages[messages.length - 1], unread: isConversationUnread(c, readIds) }
    })
    .sort((a, b) => b.last.sentAt.localeCompare(a.last.sentAt))

  return (
    <>
      <TopBar title="Messages" back backFallback="/" />
      <ul aria-label="Conversations" className="divide-y divide-border px-4 pb-8">
        {rows.map(({ c, last, unread }) => {
          const person = resolveAuthor(c.userId, profile.displayName, profile.handle)
          return (
            <li key={c.id}>
              <Link
                to={`/messages/${c.id}`}
                className="flex items-center gap-3 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <UserAvatar author={person} link={false} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-sm', unread ? 'font-bold' : 'font-semibold')}>
                      {person.name}
                      {unread && <span className="sr-only">, unread</span>}
                    </span>
                    <time dateTime={last.sentAt} className="shrink-0 text-xs text-muted-foreground">
                      {formatMessageTime(last.sentAt)}
                    </time>
                  </span>
                  <span className={cn('block truncate text-sm', unread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {preview(last)}
                  </span>
                </span>
                {/* Dot + bold text: unread never relies on color alone */}
                {unread && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-foreground" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

import { useId } from 'react'
import { BookOpen, CheckCheck, Heart, MessageCircle, MessagesSquare, Sparkles, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { splitNotifications } from '@/lib/community'
import { formatTimeAgo } from '@/lib/date'
import { cn } from '@/lib/utils'
import { notifications } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { AppNotification, NotificationType } from '@/types/community'

const ICONS: Record<NotificationType, LucideIcon> = {
  reply: MessageCircle,
  review_like: Heart,
  friend_finished: BookOpen,
  buddy_comments: MessagesSquare,
  new_release: Sparkles,
}

export function NotificationsPage() {
  const readIds = useLibrary((s) => s.readNotifications)
  const markRead = useLibrary((s) => s.markNotificationRead)
  const markAll = useLibrary((s) => s.markAllNotificationsRead)
  const { fresh, earlier } = splitNotifications(notifications, readIds)

  return (
    <>
      <TopBar title="Notifications" back backFallback="/" />
      <div className="space-y-6 px-4 pt-3 pb-8">
        {fresh.length === 0 ? (
          <div className="space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
            <p className="font-semibold">All caught up.</p>
            <p className="text-sm text-muted-foreground">Go touch some pages.</p>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="min-h-11 border-muted-foreground"
              onClick={() => {
                markAll(notifications.map((n) => n.id))
                toast('All caught up.')
              }}
            >
              <CheckCheck aria-hidden="true" />
              Mark all as read
            </Button>
          </div>
        )}

        {fresh.length > 0 && <NotificationGroup title="New" list={fresh} unread onOpen={markRead} />}
        {earlier.length > 0 && <NotificationGroup title="Earlier" list={earlier} unread={false} onOpen={markRead} />}
      </div>
    </>
  )
}

function NotificationGroup({
  title,
  list,
  unread,
  onOpen,
}: {
  title: string
  list: AppNotification[]
  unread: boolean
  onOpen: (id: string) => void
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="section-title">
        {title}
      </h2>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
        {list.map((n) => {
          const Icon = ICONS[n.type]
          return (
            <li key={n.id}>
              <Link
                to={n.href}
                onClick={() => onOpen(n.id)}
                className={cn(
                  'flex items-start gap-3 px-3 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  unread && 'bg-muted/50',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    unread ? 'bg-foreground text-background' : 'border border-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  {/* Unread is said in words for screen readers and shown with weight + a dot, not color alone */}
                  {unread && <span className="sr-only">Unread: </span>}
                  <span className={cn('block text-sm', unread && 'font-semibold')}>{n.text}</span>
                  <span className="block text-xs text-muted-foreground">
                    <time dateTime={n.createdAt}>{formatTimeAgo(n.createdAt)}</time>
                  </span>
                </span>
                {unread && <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-foreground" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import { Bell, MessageCircle } from 'lucide-react'
import { TopBarBadgeLink } from '@/components/layout/TopBar'
import { unreadConversationCount, unreadNotificationCount } from '@/lib/community'
import { conversations, notifications } from '@/mocks/community'
import { useLibrary } from '@/state/library'

/** Home's TopBar actions: notifications + messages with unread badges */
export function HomeActions() {
  const readNotifications = useLibrary((s) => s.readNotifications)
  const readConversations = useLibrary((s) => s.readConversations)
  return (
    <>
      <TopBarBadgeLink
        label="Notifications"
        icon={<Bell aria-hidden="true" />}
        to="/notifications"
        count={unreadNotificationCount(notifications, readNotifications)}
      />
      <TopBarBadgeLink
        label="Messages"
        icon={<MessageCircle aria-hidden="true" />}
        to="/messages"
        count={unreadConversationCount(conversations, readConversations)}
      />
    </>
  )
}

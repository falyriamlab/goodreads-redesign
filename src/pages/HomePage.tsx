import { Bell, MessageCircle } from 'lucide-react'
import { BuddyReads } from '@/components/home/BuddyReads'
import { ChallengeCard } from '@/components/home/ChallengeCard'
import { CurrentlyReading } from '@/components/home/CurrentlyReading'
import { ForYou } from '@/components/home/ForYou'
import { FriendsReading } from '@/components/home/FriendsReading'
import { HypedReviews } from '@/components/home/HypedReviews'
import { TopBar, TopBarBadgeLink } from '@/components/layout/TopBar'
import { unreadConversationCount, unreadNotificationCount } from '@/lib/community'
import { conversations, notifications } from '@/mocks/community'
import { currentUser } from '@/mocks/user'
import { useLibrary } from '@/state/library'

const firstName = currentUser.name.split(' ')[0]

export function HomePage() {
  const readNotifications = useLibrary((s) => s.readNotifications)
  const readConversations = useLibrary((s) => s.readConversations)

  return (
    <>
      <TopBar
        title={`Hey, ${firstName}`}
        actions={
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
        }
      />
      <div className="space-y-8 pt-4 pb-8">
        <CurrentlyReading />
        <ChallengeCard />
        <ForYou />
        <FriendsReading />
        <HypedReviews />
        <BuddyReads />
      </div>
    </>
  )
}

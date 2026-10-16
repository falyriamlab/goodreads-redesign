import { Bell, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BuddyReads } from '@/components/home/BuddyReads'
import { ChallengeCard } from '@/components/home/ChallengeCard'
import { CurrentlyReading } from '@/components/home/CurrentlyReading'
import { ForYou } from '@/components/home/ForYou'
import { FriendsReading } from '@/components/home/FriendsReading'
import { HypedReviews } from '@/components/home/HypedReviews'
import { TopBar, TopBarIconButton } from '@/components/layout/TopBar'
import { currentUser } from '@/mocks/user'

const firstName = currentUser.name.split(' ')[0]
const comingSoon = () => toast('Coming soon.')

export function HomePage() {
  return (
    <>
      <TopBar
        title={`Hey, ${firstName}`}
        actions={
          <>
            <TopBarIconButton label="Notifications" icon={<Bell aria-hidden="true" />} onClick={comingSoon} />
            <TopBarIconButton label="Messages" icon={<MessageCircle aria-hidden="true" />} onClick={comingSoon} />
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

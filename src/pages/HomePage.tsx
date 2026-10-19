import { HomeA } from '@/components/directions/a/HomeA'
import { HomeB } from '@/components/directions/b/HomeB'
import { BuddyReads } from '@/components/home/BuddyReads'
import { ChallengeCard } from '@/components/home/ChallengeCard'
import { CurrentlyReading } from '@/components/home/CurrentlyReading'
import { ForYou } from '@/components/home/ForYou'
import { FriendsReading } from '@/components/home/FriendsReading'
import { HomeActions } from '@/components/home/HomeActions'
import { HypedReviews } from '@/components/home/HypedReviews'
import { TopBar } from '@/components/layout/TopBar'
import { useDirection } from '@/lib/direction'
import { currentUser } from '@/mocks/user'

const firstName = currentUser.name.split(' ')[0]

export function HomePage() {
  // visual-pass exploration: ?direction=a | b (dev toggle)
  const direction = useDirection()
  if (direction === 'a') return <HomeA />
  if (direction === 'b') return <HomeB />

  return (
    <>
      <TopBar title={`Hey, ${firstName}`} actions={<HomeActions />} />
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

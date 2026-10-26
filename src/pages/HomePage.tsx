import { BuddyReads } from '@/components/home/BuddyReads'
import { ChallengeCard } from '@/components/home/ChallengeCard'
import { CurrentlyReading } from '@/components/home/CurrentlyReading'
import { ForYou } from '@/components/home/ForYou'
import { FriendsReading } from '@/components/home/FriendsReading'
import { HomeActions } from '@/components/home/HomeActions'
import { HypedReviews } from '@/components/home/HypedReviews'
import { useHomeData } from '@/components/home/useHomeData'
import { TopBar } from '@/components/layout/TopBar'

export function HomePage() {
  const data = useHomeData()
  return (
    <>
      <TopBar actions={<HomeActions />} />
      <header className="px-4 pt-6">
        <p className="kicker text-muted-foreground">{data.today}</p>
        <h1 className="mt-1 font-serif text-4xl leading-tight font-semibold tracking-tight">Hey, {data.firstName}</h1>
      </header>
      <div className="space-y-10 pt-6 pb-10">
        <CurrentlyReading reading={data.reading} />
        <ChallengeCard challenge={data.challenge} pace={data.pace} percent={data.challengePercent} />
        <ForYou recs={data.recs} hide={data.hide} />
        <FriendsReading />
        <HypedReviews />
        <BuddyReads />
      </div>
    </>
  )
}

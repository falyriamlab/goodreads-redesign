import { UserPlus } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { BuddyReadsTab } from '@/components/community/BuddyReadsTab'
import { FeedTab } from '@/components/community/FeedTab'
import { GroupsTab } from '@/components/community/GroupsTab'
import { TopBar, TopBarIconButton } from '@/components/layout/TopBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { value: 'feed', label: 'Feed' },
  { value: 'buddy-reads', label: 'Buddy reads' },
  { value: 'groups', label: 'Groups' },
] as const

type Tab = (typeof TABS)[number]['value']

/** /community?tab=feed|buddy-reads|groups (Feed when missing) */
export function CommunityPage() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: Tab = TABS.some((t) => t.value === raw) ? (raw as Tab) : 'feed'

  return (
    <>
      <TopBar
        title="Community"
        actions={<TopBarIconButton label="Find friends" icon={<UserPlus aria-hidden="true" />} to="/community/find" />}
      />
      <Tabs
        value={tab}
        // replace: switching tabs shouldn't stack history entries
        onValueChange={(v) => setParams(v === 'feed' ? {} : { tab: v }, { replace: true })}
        className="gap-0"
      >
        <TabsList variant="line" aria-label="Community sections" className="h-auto w-full justify-start gap-0 border-b border-border px-2">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="min-h-11 flex-1 px-3 text-muted-foreground data-active:font-semibold data-active:text-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="feed">
          <FeedTab />
        </TabsContent>
        <TabsContent value="buddy-reads">
          <BuddyReadsTab />
        </TabsContent>
        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </>
  )
}

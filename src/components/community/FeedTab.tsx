import { useState } from 'react'
import { Link } from 'react-router'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { filterFeed } from '@/lib/community'
import { activities } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { FeedFilter } from '@/types/community'
import { ActivityItem } from './ActivityItem'
import { SelectedCheck } from '@/components/common/SelectedCheck'

const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'finished', label: 'Finished' },
  { value: 'lists', label: 'Lists' },
]

const toggleOnClass =
  'min-h-11 flex-1 border-muted-foreground px-3 font-medium group/selected data-[state=on]:border-muted-foreground data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground'

export function FeedTab() {
  const following = useLibrary((s) => s.following)
  const [filter, setFilter] = useState<FeedFilter>('all')
  const list = filterFeed(activities, filter, following)

  return (
    <div className="px-4 pt-4 pb-8">
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="Filter feed"
        value={filter}
        // Single choice that can't be cleared: ignore the "deselect" event
        onValueChange={(v) => v && setFilter(v as FeedFilter)}
        className="flex w-full"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem key={f.value} value={f.value} className={toggleOnClass}>
            <SelectedCheck />
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {following.length === 0 ? (
        <div className="mt-6 space-y-1 rounded-xl border border-dashed border-muted-foreground p-4">
          <p className="font-semibold">Your feed is quiet.</p>
          <p className="text-sm text-muted-foreground">Follow some readers and the tea starts flowing.</p>
          <Link
            to="/community/find"
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Find friends
          </Link>
        </div>
      ) : list.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-muted-foreground p-4 text-sm text-muted-foreground">
          Nothing here yet from the people you follow.
        </p>
      ) : (
        <ul aria-label="Activity" className="divide-y divide-border">
          {list.map((a) => (
            <li key={a.id}>
              <ActivityItem activity={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { Link } from 'react-router'
import { toast } from 'sonner'
import { formatTimeAgo } from '@/lib/date'
import { groups } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import { summarizeThreads, useAllReplies, useAllThreads } from './data'
import { JoinButton } from './JoinButton'

export function GroupsTab() {
  const joined = useLibrary((s) => s.joinedGroups)
  const joinGroup = useLibrary((s) => s.joinGroup)
  const leaveGroup = useLibrary((s) => s.leaveGroup)
  const threads = useAllThreads()
  const replies = useAllReplies()

  return (
    <ul aria-label="Groups" className="space-y-3 px-4 pt-4 pb-8">
      {groups.map((g) => {
        const isMember = joined.includes(g.id)
        const latest = summarizeThreads(g.id, threads, replies)[0]
        return (
          <li key={g.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground">
            {/* The link and the Join toggle are siblings, never nested */}
            <Link
              to={`/community/groups/${g.id}`}
              className="min-w-0 flex-1 space-y-1 rounded-md outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="block text-lg leading-tight font-semibold">{g.name}</span>
              <span className="block text-sm">{(g.memberCount + (isMember ? 1 : 0)).toLocaleString('en-US')} members</span>
              {latest && (
                <span className="block text-xs text-muted-foreground">
                  Latest: {latest.thread.title} ·{' '}
                  <time dateTime={latest.lastActivity}>{formatTimeAgo(latest.lastActivity)}</time>
                </span>
              )}
            </Link>
            <JoinButton
              label={`Join ${g.name}`}
              joined={isMember}
              onToggle={() => {
                if (isMember) {
                  leaveGroup(g.id)
                  toast(`You left ${g.name}.`, { action: { label: 'Undo', onClick: () => joinGroup(g.id) } })
                } else {
                  joinGroup(g.id)
                  toast(`Welcome to ${g.name}. Say hi!`)
                }
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}

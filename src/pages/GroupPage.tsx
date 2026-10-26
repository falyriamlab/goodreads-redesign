import { useId, useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { summarizeThreads, useAllReplies, useAllThreads } from '@/components/community/data'
import { JoinButton } from '@/components/community/JoinButton'
import { NewThreadDrawer } from '@/components/community/NewThreadDrawer'
import { resolveAuthor } from '@/components/community/people'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { formatTimeAgo } from '@/lib/date'
import { getGroup } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Group } from '@/types/community'

export function GroupPage() {
  const { id = '' } = useParams()
  const group = getGroup(id)
  if (!group) {
    return (
      <>
        <TopBar title="Group not found" back backFallback="/community?tab=groups" />
        <p className="px-4 py-6 text-sm text-muted-foreground">This group packed up and left.</p>
      </>
    )
  }
  return <GroupView key={group.id} group={group} />
}

function GroupView({ group }: { group: Group }) {
  const navigate = useNavigate()
  const profile = useLibrary((s) => s.profile)
  const joined = useLibrary((s) => s.joinedGroups.includes(group.id))
  const joinGroup = useLibrary((s) => s.joinGroup)
  const leaveGroup = useLibrary((s) => s.leaveGroup)
  const createThread = useLibrary((s) => s.createThread)
  const threads = summarizeThreads(group.id, useAllThreads(), useAllReplies())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const threadsHeadingId = useId()

  return (
    <>
      <TopBar title={group.name} back backFallback="/community?tab=groups" />
      <div className="space-y-10 px-4 pt-4 pb-10">
        <div className="space-y-3">
          <p className="text-sm">{group.description}</p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {(group.memberCount + (joined ? 1 : 0)).toLocaleString('en-US')} members · {threads.length} threads
            </p>
            <JoinButton
              label={`Join ${group.name}`}
              joined={joined}
              onToggle={() => {
                if (joined) {
                  leaveGroup(group.id)
                  toast(`You left ${group.name}.`, { action: { label: 'Undo', onClick: () => joinGroup(group.id) } })
                } else {
                  joinGroup(group.id)
                  toast(`Welcome to ${group.name}. Say hi!`)
                }
              }}
            />
          </div>
        </div>

        <section aria-labelledby={threadsHeadingId} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id={threadsHeadingId} className="section-title">
              Threads
            </h2>
            {joined && (
              <Button variant="outline" className="min-h-11 border-muted-foreground" onClick={() => setDrawerOpen(true)}>
                <Plus aria-hidden="true" />
                New thread
              </Button>
            )}
          </div>
          {!joined && <p className="text-sm text-muted-foreground">Join the group to start a thread or reply.</p>}
          <ul className="divide-y divide-border rounded-xl border border-border bg-card text-card-foreground">
            {threads.map(({ thread, replies, lastActivity }) => {
              const author = resolveAuthor(thread.authorId, profile.displayName, profile.handle)
              return (
                <li key={thread.id}>
                  <Link
                    to={`/community/groups/${group.id}/threads/${thread.id}`}
                    className="block space-y-1 px-3 py-3 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    <span className="block font-semibold">{thread.title}</span>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      <span>by {author.isMe ? 'you' : author.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" aria-hidden="true" />
                        {replies} {replies === 1 ? 'reply' : 'replies'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        active <time dateTime={lastActivity}>{formatTimeAgo(lastActivity)}</time>
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <NewThreadDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        groupName={group.name}
        onSubmit={(title, body) => {
          const threadId = createThread(group.id, title, body)
          if (!threadId) return false
          setDrawerOpen(false)
          toast('Thread posted. Let the discourse begin.')
          navigate(`/community/groups/${group.id}/threads/${threadId}`)
          return true
        }}
      />
    </>
  )
}

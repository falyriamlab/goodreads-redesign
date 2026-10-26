import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAllReplies, useAllThreads } from '@/components/community/data'
import { FixedComposer } from '@/components/community/FixedComposer'
import { JoinButton } from '@/components/community/JoinButton'
import { LikeButton } from '@/components/community/LikeButton'
import { useAuthor } from '@/components/community/people'
import { UserAvatar } from '@/components/community/UserAvatar'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatTimeAgo } from '@/lib/date'
import { getGroup } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { Group, GroupReply, GroupThread } from '@/types/community'

export function ThreadPage() {
  const { groupId = '', threadId = '' } = useParams()
  const group = getGroup(groupId)
  const thread = useAllThreads().find((t) => t.id === threadId && t.groupId === groupId)
  if (!group || !thread) {
    return (
      <>
        <TopBar title="Thread not found" back backFallback={group ? `/community/groups/${group.id}` : '/community?tab=groups'} />
        <p className="px-4 py-6 text-sm text-muted-foreground">This thread was deleted or never existed.</p>
      </>
    )
  }
  return <ThreadView key={thread.id} group={group} thread={thread} />
}

function ThreadView({ group, thread }: { group: Group; thread: GroupThread }) {
  const { hash } = useLocation()
  const replies = useAllReplies()
    .filter((r) => r.threadId === thread.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const joined = useLibrary((s) => s.joinedGroups.includes(group.id))
  const joinGroup = useLibrary((s) => s.joinGroup)
  const author = useAuthor(thread.authorId)
  const repliesHeadingId = useId()

  return (
    <>
      <TopBar back backFallback={`/community/groups/${group.id}`} />
      <div className="space-y-6 px-4 pt-4 pb-6">
        <article className="space-y-3">
          <Link
            to={`/community/groups/${group.id}`}
            className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {group.name}
          </Link>
          <h1 className="font-serif text-2xl leading-tight font-semibold">{thread.title}</h1>
          <div className="flex items-center gap-2">
            <UserAvatar author={author} className="-ml-1.5" />
            <p className="text-sm">
              <span className="font-semibold">{author.isMe ? 'You' : author.name}</span>
              <span className="text-muted-foreground">
                {' '}
                · <time dateTime={thread.createdAt}>{formatTimeAgo(thread.createdAt)}</time>
              </span>
            </p>
          </div>
          <p className="leading-relaxed whitespace-pre-line">{thread.body}</p>
          <LikeButton kind="thread" id={thread.id} base={thread.likes ?? 0} className="-ml-2" />
        </article>

        <section aria-labelledby={repliesHeadingId} className="space-y-4">
          <h2 id={repliesHeadingId} className="section-title">
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </h2>
          {/* role="log": new replies are announced politely */}
          <ul role="log" aria-live="polite" aria-labelledby={repliesHeadingId} className="space-y-3">
            {replies.map((r) => (
              <li key={r.id} id={`reply-${r.id}`}>
                <ReplyItem reply={r} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {joined ? (
        <ReplyComposer threadId={thread.id} autoFocus={hash === '#reply'} />
      ) : (
        <div className="mx-4 mb-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-muted-foreground p-4">
          <p className="text-sm text-muted-foreground">Join {group.name} to reply.</p>
          <JoinButton
            label={`Join ${group.name}`}
            joined={false}
            onToggle={() => {
              joinGroup(group.id)
              toast(`Welcome to ${group.name}. Say hi!`)
            }}
          />
        </div>
      )}
    </>
  )
}

function ReplyItem({ reply }: { reply: GroupReply }) {
  const author = useAuthor(reply.authorId)
  return (
    <article className="flex gap-2 rounded-lg border border-border bg-card p-3 text-card-foreground">
      <UserAvatar author={author} size="sm" className="-mt-1.5 -ml-1.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-semibold">{author.isMe ? 'You' : author.name}</span>{' '}
          <span className="text-xs text-muted-foreground">
            · <time dateTime={reply.createdAt}>{formatTimeAgo(reply.createdAt)}</time>
          </span>
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line">{reply.text}</p>
        <LikeButton kind="reply" id={reply.id} base={reply.likes ?? 0} className="-ml-2" />
      </div>
    </article>
  )
}

function ReplyComposer({ threadId, autoFocus }: { threadId: string; autoFocus: boolean }) {
  const postReply = useLibrary((s) => s.postReply)
  const [text, setText] = useState('')
  const textRef = useRef<HTMLTextAreaElement>(null)
  const textId = useId()

  // /…/threads/:id#reply (from a reply notification): ready to type
  useEffect(() => {
    if (autoFocus) textRef.current?.focus({ preventScroll: true })
  }, [autoFocus])

  return (
    <FixedComposer
      label="Reply to this thread"
      onSubmit={() => {
        const reply = postReply(threadId, text)
        if (!reply) {
          textRef.current?.focus()
          return
        }
        setText('')
        textRef.current?.focus()
        requestAnimationFrame(() => document.getElementById(`reply-${reply.id}`)?.scrollIntoView({ block: 'nearest' }))
      }}
    >
      <div className="flex items-end gap-2">
        <label htmlFor={textId} className="sr-only">
          Write a reply
        </label>
        <Textarea
          id={textId}
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply"
          rows={1}
          className="max-h-32 min-h-11 border-muted-foreground text-base"
        />
        <Button type="submit" className="min-h-11 shrink-0">
          Post
        </Button>
      </div>
    </FixedComposer>
  )
}

import { buddyComments as seedComments, groupReplies, groupThreads } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import type { BuddyComment, GroupReply, GroupThread } from '@/types/community'

/** Seed + your comments for a buddy read */
export function useBuddyComments(buddyReadId: string): BuddyComment[] {
  const mine = useLibrary((s) => s.buddyComments)
  return [...seedComments, ...mine].filter((c) => c.buddyReadId === buddyReadId)
}

export function useAllThreads(): GroupThread[] {
  const posted = useLibrary((s) => s.postedThreads)
  return [...groupThreads, ...posted]
}

export function useAllReplies(): GroupReply[] {
  const posted = useLibrary((s) => s.postedReplies)
  return [...groupReplies, ...posted]
}

export type ThreadSummary = { thread: GroupThread; replies: number; lastActivity: string }

/** A group's threads with reply counts, most recent activity first */
export function summarizeThreads(groupId: string, threads: GroupThread[], replies: GroupReply[]): ThreadSummary[] {
  return threads
    .filter((t) => t.groupId === groupId)
    .map((thread) => {
      const own = replies.filter((r) => r.threadId === thread.id)
      const lastActivity = own.reduce((latest, r) => (r.createdAt > latest ? r.createdAt : latest), thread.createdAt)
      return { thread, replies: own.length, lastActivity }
    })
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity))
}

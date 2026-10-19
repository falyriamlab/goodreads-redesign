import { getReader } from '@/mocks/community'
import { useLibrary } from '@/state/library'
import { ME } from '@/types/community'

export type Author = { id: string; name: string; handle: string; href: string; isMe: boolean }

/** Resolves a community user id (or ME) to a display name and profile link */
export function useAuthor(id: string): Author {
  const profile = useLibrary((s) => s.profile)
  return resolveAuthor(id, profile.displayName, profile.handle)
}

export function resolveAuthor(id: string, myName: string, myHandle: string): Author {
  if (id === ME) return { id, name: myName, handle: myHandle, href: '/profile', isMe: true }
  const r = getReader(id)
  return {
    id,
    name: r?.name ?? 'Unknown reader',
    handle: r?.handle ?? id,
    href: r ? `/u/${r.handle}` : '/community',
    isMe: false,
  }
}

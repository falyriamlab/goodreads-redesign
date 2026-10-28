import { toast } from '@/lib/toast'
import { getChallengePace } from '@/lib/challenge'
import { now } from '@/lib/clock'
import { recommend } from '@/lib/recommend'
import { books } from '@/mocks/books'
import { currentUser } from '@/mocks/user'
import { useChallengeProgress, useLibrary } from '@/state/library'

/** Home's data: reading list, recommendations, challenge and pace */
export function useHomeData() {
  const entries = useLibrary((s) => s.entries)
  const dismissed = useLibrary((s) => s.dismissedRecommendations)
  const dismiss = useLibrary((s) => s.dismiss)
  const undoDismiss = useLibrary((s) => s.undoDismiss)
  const challenge = useChallengeProgress()
  const pace = getChallengePace(challenge)

  const reading = books.filter((b) => entries[b.id]?.status === 'reading').map((book) => ({ book, currentPage: entries[book.id].currentPage }))
  const recs = recommend({
    entries,
    dismissed,
    user: { genres: currentUser.favoriteGenres, moods: currentUser.favoriteMoods, pace: currentUser.preferredPace },
  })

  function hide(bookId: string) {
    dismiss(bookId)
    toast("Hidden. We'll read the room.", { action: { label: 'Undo', onClick: () => undoDismiss(bookId) } })
  }

  return {
    firstName: currentUser.name.split(' ')[0],
    today: now().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    reading,
    recs,
    hide,
    challenge,
    pace,
    challengePercent: Math.min(100, Math.round((challenge.read / challenge.goal) * 100)),
  }
}

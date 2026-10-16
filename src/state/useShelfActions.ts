import { toast } from 'sonner'
import type { ReadingStatus } from '@/types/library'
import { useLibrary } from './library'

/** Status changes from chips/menus. Removing shows a toast whose Undo restores the full entry. */
export function useShelfActions() {
  const setStatus = useLibrary((s) => s.setStatus)
  const restoreEntry = useLibrary((s) => s.restoreEntry)

  return function changeStatus(bookId: string, status: ReadingStatus | null) {
    if (status !== null) return setStatus(bookId, status)
    const snapshot = useLibrary.getState().entries[bookId]
    setStatus(bookId, null)
    toast('Removed from shelves.', {
      action: { label: 'Undo', onClick: () => restoreEntry(bookId, snapshot) },
    })
  }
}

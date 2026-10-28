import { toast } from '@/lib/toast'
import type { ReadingStatus } from '@/types/library'
import { useLibrary } from './library'

/** Shelf changes from chips and menus, with Undo toasts that restore the full library state */
export function useShelfActions() {
  const setStatus = useLibrary((s) => s.setStatus)
  const takeSnapshot = useLibrary((s) => s.takeSnapshot)
  const restoreSnapshot = useLibrary((s) => s.restoreSnapshot)

  function changeStatus(bookId: string, status: ReadingStatus | null) {
    if (status !== null) return setStatus(bookId, status)
    const snapshot = takeSnapshot()
    setStatus(bookId, null)
    toast('Removed from shelves.', {
      action: { label: 'Undo', onClick: () => restoreSnapshot(snapshot) },
    })
  }

  /**
   * One tap on an unshelved book's chip: straight to Want to read.
   * The toast offers Undo and "Change shelf" (opens that chip's menu).
   */
  function quickAdd(bookId: string, openMenu: () => void) {
    const snapshot = takeSnapshot()
    setStatus(bookId, 'want')
    toast('Added to Want to read', {
      action: { label: 'Undo', onClick: () => restoreSnapshot(snapshot) },
      // sonner allows one action + one "cancel"; the cancel slot hosts the second action
      cancel: { label: 'Change shelf', onClick: openMenu },
    })
  }

  return { changeStatus, quickAdd }
}

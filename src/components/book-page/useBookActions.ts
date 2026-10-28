import { toast } from '@/lib/toast'
import type { LogRequest } from '@/components/book/StatusChip'
import { useLogSheet } from '@/components/log-sheet/context'
import { useLibrary, useLibraryEntry } from '@/state/library'
import { useShelfActions } from '@/state/useShelfActions'
import type { Book } from '@/types/book'

/** Shelf actions for the book page: status, love, lists and rating (rating an unfinished book opens the log) */
export function useBookActions(book: Book) {
  const entry = useLibraryEntry(book.id)
  const { changeStatus, quickAdd } = useShelfActions()
  const toggleLoved = useLibrary((s) => s.toggleLoved)
  const setRating = useLibrary((s) => s.setRating)
  const logSheet = useLogSheet()

  return {
    entry,
    isReading: entry.status === 'reading',
    chipProps: {
      bookId: book.id,
      bookTitle: book.title,
      status: entry.status,
      label: entry.status === 'reading' ? `Reading · p. ${entry.currentPage}` : undefined,
      isPublished: book.isPublished,
      onStatusChange: (status: Parameters<typeof changeStatus>[1]) => changeStatus(book.id, status),
      onQuickAdd: (openMenu: () => void) => quickAdd(book.id, openMenu),
      onRequestLog: ((bookId, intent, trigger) => logSheet.open(bookId, { intent, returnFocus: trigger })) as LogRequest,
    },
    toggleLoved: () => toggleLoved(book.id),
    addToList: () => toast('Lists drop soon.'),
    /** Rating a book you haven't finished = you finished it: log it with the rating prefilled */
    rate: (value: number) => {
      const slider = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (entry.status === 'read') return setRating(book.id, value)
      logSheet.open(book.id, { intent: 'read', rating: value, returnFocus: slider })
    },
  }
}

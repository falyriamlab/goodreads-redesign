import { SortableBookList } from '@/components/common/SortableBookList'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'

/** Want-to-read priority list ("My order") */
export function SortableWantList({ books }: { books: Book[] }) {
  const wantOrder = useLibrary((s) => s.wantOrder)
  const moveWant = useLibrary((s) => s.moveWant)

  return (
    <SortableBookList
      books={books}
      label="Want to read, in priority order"
      // `books` may be a filtered subset: translate the position into the full wantOrder
      onMove={(bookId, toIndex) => moveWant(bookId, wantOrder.indexOf(books[toIndex].id))}
    />
  )
}

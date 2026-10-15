import { useParams } from 'react-router'
import { TopBar } from '@/components/layout/TopBar'
import { getBookById } from '@/mocks/books'

export function BookPage() {
  const { id = '' } = useParams()
  const book = getBookById(id)

  return <TopBar title={book?.title ?? 'Book not found'} back />
}

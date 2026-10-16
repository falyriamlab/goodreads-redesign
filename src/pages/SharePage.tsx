import { useSearchParams } from 'react-router'
import { TopBar } from '@/components/layout/TopBar'
import { getBookById } from '@/mocks/books'

export function SharePage() {
  const [params] = useSearchParams()
  const book = getBookById(params.get('book') ?? '')

  return (
    <>
      <TopBar title="Share card" back />
      {book && <p className="px-4 py-4 text-sm text-muted-foreground">Share card for {book.title} is cooking.</p>}
    </>
  )
}

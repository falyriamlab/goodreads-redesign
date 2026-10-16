import Papa from 'papaparse'
import { books as catalog } from '@/mocks/books'
import type { Book } from '@/types/book'
import type { LibraryEntry, ReadingStatus } from '@/types/library'

// Same header as a real Goodreads export, so the file can be re-imported here (or elsewhere)
const HEADER = [
  'Book Id',
  'Title',
  'Author',
  'Author l-f',
  'Additional Authors',
  'ISBN',
  'ISBN13',
  'My Rating',
  'Average Rating',
  'Publisher',
  'Binding',
  'Number of Pages',
  'Year Published',
  'Original Publication Year',
  'Date Read',
  'Date Added',
  'Bookshelves',
  'Bookshelves with positions',
  'Exclusive Shelf',
  'My Review',
  'Spoiler',
  'Private Notes',
  'Read Count',
  'Owned Copies',
]

const SHELF: Record<ReadingStatus, string> = {
  read: 'read',
  reading: 'currently-reading',
  want: 'to-read',
  dnf: 'did-not-finish',
}

const slashDate = (iso: string | null) => (iso ? iso.replaceAll('-', '/') : '')
const lastFirst = (author: string) => {
  const parts = author.split(' ')
  return parts.length > 1 ? `${parts.at(-1)}, ${parts.slice(0, -1).join(' ')}` : author
}

/**
 * Goodreads-format CSV of the library.
 * Ratings keep quarter stars (Goodreads itself only stores whole stars), so a round trip through
 * our importer is lossless. Unknown fields (Book Id, Average Rating…) stay empty: no invented data.
 */
export function exportLibraryCsv(entries: Record<string, LibraryEntry>, books: Book[] = catalog): string {
  const rows = books
    .filter((b) => entries[b.id]?.status)
    .map((b) => {
      const e = entries[b.id]
      const shelf = SHELF[e.status as ReadingStatus]
      return [
        '',
        b.title,
        b.author,
        lastFirst(b.author),
        '',
        '=""',
        b.isbn13 ? `="${b.isbn13}"` : '=""',
        e.rating === null ? '0' : String(e.rating),
        '',
        '',
        '',
        String(b.pages),
        '',
        '',
        e.status === 'read' ? slashDate(e.finishedAt) : '',
        slashDate(e.addedAt),
        shelf === 'read' ? '' : shelf,
        '',
        shelf,
        e.reviewText ?? '',
        e.containsSpoilers ? 'true' : '',
        '',
        String(e.status === 'read' ? e.rereads + 1 : 0),
        '0',
      ]
    })
  return Papa.unparse({ fields: HEADER, data: rows })
}

/** Triggers a download of `text` as a file */
export function downloadText(text: string, fileName: string, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

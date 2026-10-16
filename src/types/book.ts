export type Pace = 'slow' | 'medium' | 'fast'

export type EditionFormat = 'hardcover' | 'paperback' | 'ebook' | 'audiobook'

export type Edition = {
  language: string
  format: EditionFormat
}

export type Book = {
  id: string
  title: string
  author: string
  /** null for standalones */
  series: string | null
  /** Position in the series; null for standalones */
  seriesNumber: number | null
  pages: number
  moods: string[]
  pace: Pace
  tropes: string[]
  coverUrl: string | null
  /** Short neutral summary; null until written */
  synopsis: string | null
  contentWarnings: string[]
  editions: Edition[]
  /** false for upcoming books: they can't be marked read or reviewed yet */
  isPublished: boolean
  /** null until we have real data — never fake ratings */
  avgRating: number | null
  ratingsCount: number | null
}

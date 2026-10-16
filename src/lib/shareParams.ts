export type ShareStyle = 'light' | 'dark' | 'brand'

export type ShareTarget =
  | { type: 'book'; bookId: string }
  | { type: 'month'; month: string }
  | { type: 'year'; year: number }
  | { type: 'top4' }

export type ShareParams = {
  target: ShareTarget
  style: ShareStyle
  /** Present when the page was opened for a book (the Book tab only shows then) */
  bookId: string | null
}

const STYLES: ShareStyle[] = ['light', 'dark', 'brand']
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/

const thisMonth = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

/**
 * /share?type=book&book={id} | month&month=2026-10 | year(&year=2026) | top4, plus &style=light|dark|brand.
 * Unknown or incomplete params fall back sensibly: a bare ?book= means a book card; a bad month means this month.
 */
export function parseShareParams(params: URLSearchParams, now = new Date()): ShareParams {
  const bookId = params.get('book') || null
  const style = STYLES.includes(params.get('style') as ShareStyle) ? (params.get('style') as ShareStyle) : 'brand'
  const type = params.get('type') ?? (bookId ? 'book' : 'month')

  let target: ShareTarget
  switch (type) {
    case 'book':
      target = bookId ? { type: 'book', bookId } : { type: 'month', month: thisMonth(now) }
      break
    case 'year': {
      const year = Number(params.get('year'))
      target = { type: 'year', year: Number.isInteger(year) && year > 1900 ? year : now.getFullYear() }
      break
    }
    case 'top4':
      target = { type: 'top4' }
      break
    default: {
      const month = params.get('month') ?? ''
      target = { type: 'month', month: MONTH_RE.test(month) ? month : thisMonth(now) }
    }
  }
  return { target, style, bookId }
}

/** Inverse of parseShareParams, for tabs and "Copy link" */
export function shareSearch(target: ShareTarget, style: ShareStyle, bookId: string | null): string {
  const p = new URLSearchParams({ type: target.type })
  if (target.type === 'book') p.set('book', target.bookId)
  else if (bookId) p.set('book', bookId)
  if (target.type === 'month') p.set('month', target.month)
  if (target.type === 'year') p.set('year', String(target.year))
  p.set('style', style)
  return p.toString()
}

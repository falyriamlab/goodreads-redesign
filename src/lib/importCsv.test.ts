import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { books } from '@/mocks/books'
import { LIBRARY_SEED } from '@/state/library'
import { matchRows, parseLibraryCsv, planImport, toImportItems } from './importCsv'

const goodreadsCsv = fs.readFileSync(path.resolve(__dirname, '../../public/samples/goodreads_export_sample.csv'), 'utf8')

// The same 10 books as a StoryGraph export (different headers, statuses and quarter-star ratings)
const storygraphCsv = [
  'Title,Authors,Contributors,ISBN/UID,Format,Read Status,Date Added,Last Date Read,Dates Read,Read Count,Moods,Pace,Character- or Plot-Driven?,Strong Character Development?,Loveable Characters?,Diverse Characters?,Flawed Characters?,Star Rating,Review,Content Warnings,Content Warning Description,Tags,Owned?',
  'Gone Girl,Gillian Flynn,,9780307588364,hardcover,read,2025/11/01,2025/11/20,,1,,,,,,,,4.75,,,,,No',
  'Fourth Wing,Rebecca Yarros,,9780349437002,paperback,read,2026/06/30,2026/10/14,,1,,,,,,,,5.0,,,,,No',
  'Babel,R.F. Kuang,,9780063021433,hardcover,read,2025/12/01,2026/01/30,,1,,,,,,,,4.0,,,,,No',
  'Normal People,Sally Rooney,,9781984822178,paperback,read,2025/09/15,2025/10/02,,1,,,,,,,,3.25,,,,,No',
  'The Love Hypothesis,Ali Hazelwood,,9781408734254,paperback,read,2025/12/20,2025/12/27,,1,,,,,,,,4.0,,,,,No',
  'Lessons in Chemistry,Bonnie Garmus,,9780593556672,hardcover,to-read,2026/04/18,,,0,,,,,,,,,,,,,No',
  'Red Rising,"Pierce Brown, Unknown",,sg-uid-123,paperback,currently-reading,2026/09/02,,,0,,,,,,,,,,,,,No',
  '"Tomorrow, and Tomorrow, and Tomorrow",Gabrielle Zevin,,,hardcover,read,2025/07/30,2025/08/09,,1,,,,,,,,5.0,,,,,No',
  'Pachinko,Min Jin Lee,,,paperback,read,2025/06/01,2025/06/21,,1,,,,,,,,5.0,,,,,No',
  'The Thursday Murder Club,Richard Osman,,,paperback,to-read,2026/02/11,,,0,,,,,,,,,,,,,No',
].join('\n')

describe('CSV import', () => {
  for (const [name, csv, format] of [
    ['Goodreads sample', goodreadsCsv, 'goodreads'],
    ['StoryGraph', storygraphCsv, 'storygraph'],
  ] as const) {
    it(`${name}: 8 of 10 match the catalog, 2 don't`, () => {
      const parsed = parseLibraryCsv(csv)
      expect(parsed.format).toBe(format)
      expect(parsed.rows).toHaveLength(10)
      const { matched, unmatched } = matchRows(parsed.rows, books)
      expect(matched).toHaveLength(8)
      expect(unmatched.map((r) => r.title)).toEqual(['Pachinko', 'The Thursday Murder Club'])
      // ISBN first, then title + author (Red Rising has a series suffix / non-ISBN UID)
      expect(matched.find((m) => m.book.id === 'gone-girl')?.by).toBe('isbn')
      expect(matched.find((m) => m.book.id === 'red-rising')?.by).toBe('title')
      expect(matched.find((m) => m.book.id === 'tomorrow-and-tomorrow-and-tomorrow')?.by).toBe('title')
    })
  }

  it('normalizes statuses, ratings and dates', () => {
    const { rows } = parseLibraryCsv(goodreadsCsv)
    expect(rows[0]).toEqual({
      title: 'Gone Girl',
      author: 'Gillian Flynn',
      isbn13: '9780307588364',
      rating: 5,
      status: 'read',
      dateRead: '2025-11-20',
    })
    expect(rows[5]).toMatchObject({ status: 'want', rating: null, dateRead: null })
    expect(rows[6]).toMatchObject({ status: 'reading', isbn13: null })
    const sg = parseLibraryCsv(storygraphCsv).rows
    expect(sg[0].rating).toBe(4.75)
    expect(sg[6].author).toBe('Pierce Brown')
  })

  it('conflicts: "Keep mine" skips books already in the library, "Use imported" overwrites them', () => {
    const { matched } = matchRows(parseLibraryCsv(goodreadsCsv).rows, books)
    const conflicts = ['gone-girl', 'fourth-wing', 'babel']

    const keep = planImport(matched, LIBRARY_SEED, 'keep')
    expect(keep.filter((p) => p.existing).map((p) => p.book.id)).toEqual(conflicts)
    expect(toImportItems(keep).map((i) => i.bookId)).not.toContain('fourth-wing')
    expect(toImportItems(keep)).toHaveLength(5)

    const use = planImport(matched, LIBRARY_SEED, 'use')
    expect(toImportItems(use)).toHaveLength(8)
    expect(toImportItems(use).find((i) => i.bookId === 'fourth-wing')).toEqual({
      bookId: 'fourth-wing',
      status: 'read',
      rating: 5,
      finishedAt: '2026-10-14',
    })
  })
})

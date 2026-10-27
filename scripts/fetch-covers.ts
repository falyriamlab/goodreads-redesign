/**
 * Self-hosted covers: `npm run covers` downloads every mock book's cover from Open Library in two sizes:
 * public/covers/{isbn13}.jpg (M, ≈180px wide, ~25 KB) and public/covers/l/{isbn13}.jpg (L, ≈330px wide, ~70 KB).
 * BookCover uses L wherever a cover is shown wider than ~120px, and lets the browser pick M or L elsewhere.
 *
 * Why: covers.openlibrary.org answers each request with two redirects to archive.org, which then
 * extracts the image from a zip: ~1.6 s per cover on a cold cache, so a first visit showed gray
 * placeholders for seconds. Served from our own origin they load with the page, and the share-card
 * export no longer depends on a third party's CORS headers.
 *
 * Open Library rate-limits ISBN lookups, so this goes one at a time and skips files it already has.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SIZES = [
  { size: 'M', dir: path.join(ROOT, 'public', 'covers') },
  { size: 'L', dir: path.join(ROOT, 'public', 'covers', 'l') },
]
// Editions whose ISBN cover on Open Library is low-res (Onyx Storm's is 143px wide even in L): use the
// work's cover id instead (same artwork, 333×500)
const COVER_ID_BY_ISBN: Record<string, number> = { '9781649377159': 14826089 }
const coverUrl = (isbn: string, size: string) =>
  COVER_ID_BY_ISBN[isbn]
    ? `https://covers.openlibrary.org/b/id/${COVER_ID_BY_ISBN[isbn]}-${size}.jpg`
    : `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`
const source = fs.readFileSync(path.join(ROOT, 'src', 'mocks', 'books.ts'), 'utf8')
const isbns = [...new Set([...source.matchAll(/isbn13: '(\d{13})'/g)].map((m) => m[1]))]

let fetched = 0
let present = 0
const missing: string[] = []
for (const { size, dir } of SIZES) {
  fs.mkdirSync(dir, { recursive: true })
  for (const isbn of isbns) {
    const file = path.join(dir, `${isbn}.jpg`)
    if (fs.existsSync(file)) {
      present++
      continue
    }
    const res = await fetch(coverUrl(isbn, size))
    if (!res.ok) {
      missing.push(`${isbn} (${size})`)
      continue
    }
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    fetched++
    await new Promise((r) => setTimeout(r, 400))
  }
}
console.log(`${isbns.length} ISBNs × 2 sizes: ${fetched} downloaded, ${present} already there`)
if (missing.length) console.log('No cover on Open Library (the app shows its placeholder):', missing.join(', '))

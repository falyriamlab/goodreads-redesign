/**
 * Self-hosted covers: `npm run covers` downloads every mock book's cover from Open Library
 * into public/covers/{isbn13}.jpg (medium size, ~25 KB each).
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
const OUT = path.join(ROOT, 'public', 'covers')
const source = fs.readFileSync(path.join(ROOT, 'src', 'mocks', 'books.ts'), 'utf8')
const isbns = [...new Set([...source.matchAll(/isbn13: '(\d{13})'/g)].map((m) => m[1]))]

fs.mkdirSync(OUT, { recursive: true })
let fetched = 0
const missing: string[] = []
for (const isbn of isbns) {
  const file = path.join(OUT, `${isbn}.jpg`)
  if (fs.existsSync(file)) continue
  const res = await fetch(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`)
  if (!res.ok) {
    missing.push(isbn)
    continue
  }
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  fetched++
  await new Promise((r) => setTimeout(r, 400))
}
console.log(`${isbns.length} ISBNs: ${fetched} downloaded, ${isbns.length - fetched - missing.length} already there`)
if (missing.length) console.log('No cover on Open Library (the app shows its placeholder):', missing.join(', '))

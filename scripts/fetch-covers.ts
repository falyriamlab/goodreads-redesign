/**
 * Self-hosted covers: `npm run covers` downloads every mock book's cover from Open Library in two sizes:
 * public/covers/{isbn13}.jpg (M, ≈180px wide, ~25 KB) and public/covers/l/{isbn13}.jpg (L, ≈330px wide, ~70 KB).
 * From the L it also makes WebP copies at 180, 240 and 333px (public/covers/w/), which the app serves first.
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

/*
 * WebP sizes for the app: 180, 240 and 333px wide at quality 0.75, made from the L JPG (the sharpest source)
 * with the system Chrome's canvas, so no image library is needed. public/covers/w/{isbn}-{width}.webp.
 * The JPGs stay as the <picture> fallback and for the share-card export.
 */
const WEBP_DIR = path.join(ROOT, 'public', 'covers', 'w')
const WEBP_WIDTHS = [180, 240, 333]
const todo = isbns.filter((isbn) => WEBP_WIDTHS.some((w) => !fs.existsSync(path.join(WEBP_DIR, `${isbn}-${w}.webp`))))
if (todo.length) {
  fs.mkdirSync(WEBP_DIR, { recursive: true })
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ channel: 'chrome' })
  const page = await browser.newPage()
  for (const isbn of todo) {
    const jpg = path.join(ROOT, 'public', 'covers', 'l', `${isbn}.jpg`)
    if (!fs.existsSync(jpg)) continue
    const dataUrl = `data:image/jpeg;base64,${fs.readFileSync(jpg).toString('base64')}`
    const outputs = await page.evaluate(
      async ({ dataUrl, widths }) => {
        const img = new Image()
        img.src = dataUrl
        await img.decode()
        return Promise.all(
          widths.map(async (w) => {
            // Never upscale: a source narrower than the target keeps its own width
            const width = Math.min(w, img.naturalWidth)
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = Math.round((img.naturalHeight * width) / img.naturalWidth)
            const ctx = canvas.getContext('2d')!
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.75))
            return { w, bytes: [...new Uint8Array(await blob.arrayBuffer())] }
          }),
        )
      },
      { dataUrl, widths: WEBP_WIDTHS },
    )
    for (const { w, bytes } of outputs) fs.writeFileSync(path.join(WEBP_DIR, `${isbn}-${w}.webp`), Buffer.from(bytes))
  }
  await browser.close()
  console.log(`WebP: ${todo.length} covers × ${WEBP_WIDTHS.length} sizes written to public/covers/w/`)
}

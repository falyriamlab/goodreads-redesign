/**
 * Static brand assets for the deploy: `npm run assets` (after `npm run capture`).
 *
 * - public/og-image.png (1200×630): the Brand month share card from case-study/share-cards/,
 *   framed with the project name, on the theme indigo
 * - public/favicon-32.png and public/apple-touch-icon.png (180×180): renders of public/favicon.svg
 *
 * Colors are the light theme tokens in sRGB (--primary at L 0.56 = rgb(92 94 232), --primary-foreground = white).
 * White on that indigo is 4.98:1. Type: Playfair Display SemiBold Italic + Plus Jakarta Sans, like the app.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const PUBLIC = path.join(ROOT, 'public')
const card = path.join(ROOT, 'case-study', 'share-cards', 'share-card-month-brand.png')
if (!fs.existsSync(card)) throw new Error('Run `npm run capture` first: the Brand month share card is missing')

const cardData = `data:image/png;base64,${fs.readFileSync(card).toString('base64')}`
const svg = fs.readFileSync(path.join(PUBLIC, 'favicon.svg'), 'utf8')

const og = `<!doctype html><html><head><meta charset="utf-8" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600&family=Plus+Jakarta+Sans:wght@400..800&display=swap" />
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: rgb(92 94 232); color: rgb(255 255 255);
    font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; gap: 56px; padding: 0 72px; }
  .text { flex: 1; }
  .kicker { font-size: 20px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; }
  h1 { font-family: 'Playfair Display', serif; font-style: italic; font-weight: 600; font-size: 76px; line-height: 1.02; letter-spacing: -0.02em; margin-top: 18px; }
  .sub { font-size: 26px; line-height: 1.4; margin-top: 24px; font-weight: 500; }
  .note { font-size: 18px; margin-top: 36px; font-weight: 500; }
  img { height: 540px; border-radius: 20px; box-shadow: 0 2px 4px rgb(0 0 0 / 0.2), 0 24px 48px -12px rgb(0 0 0 / 0.45); transform: rotate(3deg); }
</style></head><body>
  <div class="text">
    <p class="kicker">UX case study</p>
    <h1>Goodreads — Concept Redesign</h1>
    <p class="sub">Log from any cover. One search. A profile built for sharing.</p>
    <p class="note">Concept project. Not affiliated with Goodreads or Amazon.</p>
  </div>
  <img src="${cardData}" alt="" />
</body></html>`

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
  await page.setContent(og, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(PUBLIC, 'og-image.png') })

  for (const [file, size] of [
    ['favicon-32.png', 32],
    ['apple-touch-icon.png', 180],
  ] as const) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
    // iOS draws its own rounded mask: the touch icon gets a full square
    if (file === 'apple-touch-icon.png') await icon.evaluate(() => document.querySelector('rect')?.setAttribute('rx', '0'))
    await icon.screenshot({ path: path.join(PUBLIC, file), omitBackground: true })
  }
  console.log('Wrote public/og-image.png, public/favicon-32.png, public/apple-touch-icon.png')
} finally {
  await browser.close()
}

/**
 * Static brand assets for the deploy: `npm run assets` (after `npm run capture`).
 *
 * - public/og-image.png (1200×630): the Brand month share card from case-study/share-cards/,
 *   framed with the project name, on the theme indigo
 * - public/favicon-32.png, public/apple-touch-icon.png (180×180), public/icon-192.png and public/icon-512.png:
 *   renders of public/favicon.svg
 * - public/manifest.webmanifest: install name, icons and colors. theme_color and background_color are the light
 *   theme's --background, read from src/index.css and converted to sRGB by the browser (same as the theme-color meta).
 *   No service worker on purpose: nothing caches an old version after a deploy.
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
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ] as const) {
    const icon = await browser.newPage({ viewport: { width: size, height: size } })
    await icon.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
    // iOS draws its own rounded mask: the touch icon gets a full square
    if (file === 'apple-touch-icon.png') await icon.evaluate(() => document.querySelector('rect')?.setAttribute('rx', '0'))
    await icon.screenshot({ path: path.join(PUBLIC, file), omitBackground: true })
  }
  // Token → sRGB hex: the browser paints the oklch() value on a canvas and reads the pixel back
  const css = fs.readFileSync(path.join(ROOT, 'src', 'index.css'), 'utf8')
  const lightTheme = css.slice(css.indexOf(':root,'), css.indexOf('.dark,'))
  const background = /--background:\s*([^;]+);/.exec(lightTheme)?.[1]
  if (!background) throw new Error('--background not found in src/index.css')
  const hex = await page.evaluate((color) => {
    const ctx = document.createElement('canvas').getContext('2d')!
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  }, background)
  const manifest = {
    name: 'Goodreads Concept',
    short_name: 'GR Concept',
    description: 'A mobile-first concept redesign of Goodreads for a UX case study. Not affiliated with Goodreads or Amazon.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    lang: 'en',
    theme_color: hex,
    background_color: hex,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
  fs.writeFileSync(path.join(PUBLIC, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n')
  console.log('Wrote public/og-image.png, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png, manifest.webmanifest')
} finally {
  await browser.close()
}

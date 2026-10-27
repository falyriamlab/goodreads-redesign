/**
 * Case-study captures: `npm run capture` (builds, serves the build, then runs this).
 *
 * - Resets demo data from Settings and checks the demo clock is on (Oct 16, 2026, 10:00).
 * - case-study/screens/{light,dark}/NN-name.png at 390×844 (@2x)
 * - case-study/flows/fN-NN.png: each F1–F4 flow, one capture per tap (light)
 * - case-study/share-cards/*.png: the 4 Brand share cards, exported by the app itself
 * - case-study/audit.json + metrics.json: per-screen audit (44px, nesting, overflow, text contrast in light
 *   and dark) and tap counts
 *
 * Uses the system Chrome (channel: 'chrome'), so no browser download is needed.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'case-study')
const PORT = 4318
const BASE = `http://localhost:${PORT}`
const VIEWPORT = { width: 390, height: 844 }
type Scheme = 'light' | 'dark'

/* ---------- server ---------- */

async function startServer(): Promise<ChildProcess> {
  const server = spawn(`npx vite preview --port ${PORT} --strictPort`, { cwd: ROOT, shell: true, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return server
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('vite preview did not start')
}

function stopServer(server: ChildProcess) {
  if (process.platform === 'win32' && server.pid) spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
  else server.kill()
}

/* ---------- helpers ---------- */

async function newContext(browser: Browser, scheme: Scheme): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: scheme,
    acceptDownloads: true,
  })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
  return context
}

/** Settings → Data → Reset demo data → Reset, then make sure the demo clock is on */
async function resetDemo(page: Page) {
  await go(page, '/settings')
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reset', exact: true }).click()])
  await settle(page)
  const clock = page.locator('#demo-clock')
  if ((await clock.getAttribute('aria-checked')) !== 'true') await clock.click()
}

async function settle(page: Page) {
  await page.locator('h1').first().waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete), undefined, { timeout: 20_000 })
    .catch(() => {})
  await page.waitForTimeout(300)
}

async function go(page: Page, url: string) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' })
  await settle(page)
}

async function shot(page: Page, file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file, animations: 'disabled' })
  captures++
}

let captures = 0
const audits: { screen: string; overflow: number; nested: number; small: unknown[] }[] = []

/** 44px targets (counting ::after hit extensions), nothing interactive nested, no horizontal overflow */
async function audit(page: Page, screen: string) {
  const r = await page.evaluate(() => {
    const sel =
      'main a, main button, main input, main select, main textarea, header a, header button, nav a, [role="dialog"] a, [role="dialog"] button, [role="dialog"] input, [role="dialog"] textarea, [role="tab"], [role="radio"], [role="switch"], [role="checkbox"], [role="slider"]'
    const small = [...document.querySelectorAll<HTMLElement>(sel)]
      .filter((el) => el.getClientRects().length && !el.closest('[aria-hidden="true"]') && !el.closest('[hidden]') && !el.closest('[role="img"]'))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        const after = getComputedStyle(el, '::after')
        const abs = after.content !== 'none' && after.position === 'absolute'
        const stretched = abs && after.top === '0px' && after.left === '0px' && after.right === '0px'
        const extY = abs ? Math.max(0, -parseFloat(after.top) - parseFloat(after.bottom)) : 0
        const extX = abs ? Math.max(0, -parseFloat(after.left) - parseFloat(after.right)) : 0
        // Switches/checkboxes: their label row is the target
        const role = el.getAttribute('role')
        const row = (role === 'switch' || role === 'checkbox' || el.getAttribute('type') === 'checkbox') && el.parentElement && el.parentElement.getBoundingClientRect().height >= 44
        const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline'
        return {
          name: (el.getAttribute('aria-label') || el.textContent || el.id || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40),
          w: Math.round(rect.width + extX),
          h: Math.round(rect.height + extY),
          skip: stretched || row || inline,
        }
      })
      .filter((x) => !x.skip && (x.w < 44 || x.h < 44))
      .map(({ name, w, h }) => ({ name, w, h }))
    return {
      // clientWidth, not innerWidth: in mobile emulation the layout viewport grows with the overflow
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      nested: document.querySelectorAll('a a, a button, button a, button button, a input, button input').length,
      small,
    }
  })
  audits.push({ screen, ...r })
}

const contrastIssues: { screen: string; scheme: Scheme; text: string; ratio: number; min: number; fg: string; bg: string }[] = []

/**
 * Text contrast as rendered: every visible text node's color against the background actually behind it
 * (ancestor backgrounds composited in sRGB, opacity included). 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
 * Skips disabled controls (WCAG exempts them) and text over images or gradients (rule 4: never text on covers).
 */
async function auditContrast(page: Page, screen: string, scheme: Scheme) {
  const found = await page.evaluate(() => {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const rgba = (c: string) => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return [r / 255, g / 255, b / 255, a / 255]
    }
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const over = (top: number[], a: number, under: number[]) => top.slice(0, 3).map((c, i) => a * c + (1 - a) * under[i])
    const hex = (c: number[]) => '#' + c.slice(0, 3).map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
    const out: { text: string; ratio: number; min: number; fg: string; bg: string }[] = []
    const seen = new Set<Element>()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement
      if (!el || seen.has(el) || !node.textContent?.trim()) continue
      seen.add(el)
      if (!el.getClientRects().length || el.closest('[hidden], .sr-only, [disabled], [aria-disabled="true"], svg')) continue
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden') continue
      // Background stack: walk up until an opaque layer, keeping each translucent layer and the opacities
      const layers: { color: number[]; alpha: number }[] = []
      let alphaMul = 1
      let unknown = false
      for (let n: Element | null = el; n; n = n.parentElement) {
        const ns = getComputedStyle(n)
        alphaMul *= parseFloat(ns.opacity)
        if (ns.backgroundImage !== 'none') {
          unknown = true
          break
        }
        const c = rgba(ns.backgroundColor)
        if (c[3] > 0) {
          layers.push({ color: c, alpha: c[3] })
          if (c[3] >= 1) break
        }
      }
      if (unknown || alphaMul === 0) continue
      let bg = [1, 1, 1]
      for (const l of layers.reverse()) bg = over(l.color, l.alpha, bg)
      const fgRaw = rgba(s.color)
      const fg = over(fgRaw, fgRaw[3] * alphaMul, bg)
      const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a)
      const ratio = (hi + 0.05) / (lo + 0.05)
      const size = parseFloat(s.fontSize)
      const large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight) >= 700)
      const min = large ? 3 : 4.5
      if (ratio < min - 0.005)
        out.push({ text: (node.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40), ratio: Math.round(ratio * 100) / 100, min, fg: hex(fg), bg: hex(bg) })
    }
    return out
  })
  for (const f of found) contrastIssues.push({ screen, scheme, ...f })
}

/** Center it: scrollIntoViewIfNeeded can leave it under the fixed bottom nav */
async function centerOf(locator: ReturnType<Page['locator']>) {
  await locator.evaluate((el) => {
    // Inside a fixed bar (bottom nav, composer) there's nothing to scroll
    for (let n: Element | null = el; n; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return
    el.scrollIntoView({ block: 'center' })
  })
  await locator.page().waitForTimeout(150)
}

/** Counted tap on a locator (scrolls it into view first) */
let taps = 0
async function tap(page: Page, locator: ReturnType<Page['locator']>) {
  await centerOf(locator)
  await locator.click()
  taps++
}

/** The star slider takes a tap position: 4.25 → that point on the track */
async function tapRating(page: Page, scope: string, value: number) {
  const track = page.locator(`${scope} [role="slider"] > span`).first()
  await centerOf(track)
  const box = (await track.boundingBox())!
  await page.mouse.click(box.x + ((value - 0.125) / 5) * box.width, box.y + box.height / 2)
  taps++
}

const SHEET = '[data-slot="drawer-content"]'
async function sheetOpen(page: Page) {
  await page.locator(SHEET).waitFor({ state: 'visible' })
  await page.waitForTimeout(500)
}

/* ---------- screens ---------- */

async function captureScreens(browser: Browser, scheme: Scheme) {
  const context = await newContext(browser, scheme)
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)
  const dir = path.join(OUT, 'screens', scheme)
  let n = 0
  const save = async (name: string) => {
    n++
    await shot(page, path.join(dir, `${String(n).padStart(2, '0')}-${name}.png`))
    if (scheme === 'light') await audit(page, name)
    await auditContrast(page, name, scheme)
  }

  await go(page, '/')
  await save('home')

  await go(page, '/discover')
  for (const name of ['Dark', 'Unreliable narrator']) await page.locator('button[aria-pressed]', { hasText: name }).first().click()
  await page.getByRole('radio', { name: 'Fast' }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await save('discover-filters')

  await page.locator('a[href^="/discover/results"]').click()
  await page.locator('main ul.grid').waitFor()
  await settle(page)
  await save('results')

  await go(page, '/discover/search')
  await page.locator('input[type="search"]').fill('forth wing')
  await page.waitForFunction(() => document.querySelector('[aria-live="polite"]')?.textContent?.includes('result'))
  await settle(page)
  await save('search-forth-wing')

  // Book page: the whole page, one viewport at a time (overlapping a little)
  await go(page, '/book/fourth-wing')
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const step = VIEWPORT.height - 160
  for (let y = 0, part = 1; y < height - 200; y += step, part++) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(250)
    await save(`book-fourth-wing-${part}`)
  }

  // LogSheet in Read, then What's next
  await go(page, '/book/fourth-wing')
  await page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: 'Reading · p. 312' }).click()
  await page.getByRole('menuitemradio', { name: 'Read', exact: true }).click()
  await sheetOpen(page)
  await tapRating(page, SHEET, 4.25)
  await save('logsheet-read')
  await page.locator(`${SHEET} button`, { hasText: /^Save$/ }).click()
  await page.locator(SHEET, { hasText: "What's next?" }).waitFor()
  await page.waitForTimeout(500)
  await save('whats-next')
  await page.keyboard.press('Escape')
  await resetDemo(page)

  await go(page, '/library?shelf=read')
  await save('library-grid')
  await go(page, '/library?shelf=want')
  await save('library-my-order')

  await go(page, '/library')
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await sheetOpen(page)
  await page.getByRole('button', { name: 'Try with a sample file' }).click()
  await page.locator(SHEET, { hasText: 'matched' }).waitFor()
  await page.waitForTimeout(600)
  await save('import-summary')
  await page.keyboard.press('Escape')

  await go(page, '/library/journal')
  await save('journal')
  await go(page, '/profile')
  await save('profile')
  await go(page, '/profile/stats')
  await save('stats')
  await go(page, '/community')
  await save('feed')

  await go(page, '/community/buddy/br-fourth-wing')
  await page.locator('#chapter-27').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollBy(0, 120))
  await page.waitForTimeout(250)
  await save('buddy-read-spoilers')

  await go(page, '/notifications')
  await save('notifications')
  await go(page, '/messages/c-lucia')
  await save('conversation')
  await go(page, '/share?type=month&month=2026-10&style=brand')
  await page.waitForTimeout(800)
  await save('share')

  // Audit-only screens (not part of the case-study set)
  if (scheme === 'light') {
    for (const [name, url] of [
      ['visitor-profile', '/u/mayareadsdragons'],
      ['edit-profile', '/profile/edit'],
      ['settings', '/settings'],
      ['buddy-reads', '/community?tab=buddy-reads'],
      ['groups', '/community?tab=groups'],
      ['group', '/community/groups/romantasy-girlies'],
      ['thread', '/community/groups/bogota-book-club/threads/t-bb-2'],
      ['messages', '/messages'],
      ['find-friends', '/community/find'],
      ['invite', '/invite/sofiareads'],
      ['not-found', '/nope'],
      ['dev-components', '/dev/components'],
      ['library-list', '/library?shelf=read'],
    ] as const) {
      await go(page, url)
      if (name === 'library-list') await page.getByRole('button', { name: 'List view' }).click()
      await audit(page, name)
      await auditContrast(page, name, scheme)
    }
    await go(page, '/library?shelf=read')
    await page.getByRole('button', { name: 'Select' }).click()
    await page.getByRole('checkbox').first().click()
    await audit(page, 'library-selection')
  }
  await context.close()
}

/* ---------- flows (light), one capture per tap ---------- */

async function flow(browser: Browser, id: string, run: (page: Page, snap: () => Promise<void>) => Promise<string>) {
  const context = await newContext(browser, 'light')
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)
  let n = 0
  const snap = async () => {
    n++
    await page.waitForTimeout(450)
    await shot(page, path.join(OUT, 'flows', `${id}-${String(n).padStart(2, '0')}.png`))
  }
  taps = 0
  const note = await run(page, snap)
  await context.close()
  return { taps, note }
}

async function measureFlows(browser: Browser) {
  const metrics: Record<string, { taps: number; keys?: number; note: string }> = {}

  // F1 (sequence): from Home, finish Fourth Wing with 4.25 stars and start the next book
  metrics['F1 from Home'] = await flow(browser, 'f1', async (page, snap) => {
    await go(page, '/')
    await snap()
    await tap(page, page.getByRole('button', { name: 'Finished it' }).first())
    await sheetOpen(page)
    await snap()
    await tapRating(page, SHEET, 4.25)
    await snap()
    await tap(page, page.locator(`${SHEET} button`, { hasText: /^Save$/ }))
    await page.locator(SHEET, { hasText: "What's next?" }).waitFor()
    await snap()
    await tap(page, page.locator(`${SHEET} button`, { hasText: 'Start reading' }).first())
    await snap()
    return 'Finished it → 4.25 → Save → Start reading'
  })

  // F1 variants on the book page (measured, no sequence)
  metrics['F1 book page, via status'] = await flow(browser, 'f1-status', async (page) => {
    await go(page, '/book/fourth-wing')
    await tap(page, page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: 'Reading · p. 312' }))
    await tap(page, page.getByRole('menuitemradio', { name: 'Read', exact: true }))
    await sheetOpen(page)
    await tapRating(page, SHEET, 4.25)
    await tap(page, page.locator(`${SHEET} button`, { hasText: /^Save$/ }))
    await page.locator(SHEET, { hasText: "What's next?" }).waitFor()
    await page.waitForTimeout(400)
    await tap(page, page.locator(`${SHEET} button`, { hasText: 'Start reading' }).first())
    return 'Status → Read → 4.25 → Save → Start reading'
  })
  metrics['F1 book page, via rating'] = await flow(browser, 'f1-rating', async (page) => {
    await go(page, '/book/fourth-wing')
    await tapRating(page, 'section[aria-label="Your shelf"]', 4.25)
    await sheetOpen(page)
    await tap(page, page.locator(`${SHEET} button`, { hasText: /^Save$/ }))
    await page.locator(SHEET, { hasText: "What's next?" }).waitFor()
    await page.waitForTimeout(400)
    await tap(page, page.locator(`${SHEET} button`, { hasText: 'Start reading' }).first())
    return 'Tap 4.25 on Your rating → Save → Start reading'
  })

  // F2: typo-tolerant search from Home
  let keys = 0
  const f2 = await flow(browser, 'f2', async (page, snap) => {
    await go(page, '/')
    await snap()
    await tap(page, page.locator('nav a', { hasText: 'Discover' }))
    await page.locator('main a[href="/discover/search"]').waitFor()
    await snap()
    await tap(page, page.locator('main a[href="/discover/search"]'))
    await page.locator('input[type="search"]').waitFor()
    await snap()
    for (const ch of 'forth wing') {
      await page.keyboard.type(ch)
      keys++
    }
    await page.waitForFunction(() => document.querySelector('[aria-live="polite"]')?.textContent?.includes('result'))
    await snap()
    await tap(page, page.locator('main ul li h3 a', { hasText: 'Fourth Wing' }).first())
    await page.waitForURL('**/book/fourth-wing')
    await settle(page)
    await snap()
    return 'Discover → Search → type "forth wing" → Fourth Wing'
  })
  metrics.F2 = { ...f2, keys }

  // F3: discover by vibe and add a match to Want to read
  metrics.F3 = await flow(browser, 'f3', async (page, snap) => {
    await go(page, '/discover')
    await snap()
    await tap(page, page.locator('button[aria-pressed]', { hasText: 'Dark' }).first())
    await snap()
    await tap(page, page.getByRole('radio', { name: 'Fast' }))
    await snap()
    await tap(page, page.locator('button[aria-pressed]', { hasText: 'Unreliable narrator' }).first())
    await snap()
    await tap(page, page.locator('a[href^="/discover/results"]'))
    await page.locator('main ul.grid').waitFor()
    await settle(page)
    await snap()
    const first = page.locator('main ul.grid li').first()
    const title = (await first.locator('h3').textContent())?.trim()
    await tap(page, first.locator('[data-slot="dropdown-menu-trigger"]'))
    await page.locator('[data-sonner-toast]').waitFor()
    await snap()
    return `Dark → Fast → Unreliable narrator → Show → one-tap Want on "${title}"`
  })

  // F4: share the month recap from Profile (and keep the PNG)
  metrics.F4 = await flow(browser, 'f4', async (page, snap) => {
    await go(page, '/profile')
    await snap()
    await tap(page, page.getByRole('link', { name: 'Share your October recap' }))
    await page.locator('[role="img"][aria-label*="October"]').waitFor()
    await settle(page)
    await snap()
    const save = page.getByRole('button', { name: /Save image/ })
    await expectEnabled(save)
    const [download] = await Promise.all([page.waitForEvent('download'), tap(page, save)])
    await download.saveAs(path.join(OUT, 'flows', 'f4-export.png'))
    await snap()
    return 'Share your October recap → Save image'
  })

  return metrics
}

async function expectEnabled(locator: ReturnType<Page['locator']>) {
  for (let i = 0; i < 60; i++) {
    if (await locator.isEnabled()) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('button stayed disabled')
}

/* ---------- share cards (Brand) ---------- */

async function shareCards(browser: Browser) {
  const context = await newContext(browser, 'light')
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)
  const dir = path.join(OUT, 'share-cards')
  fs.mkdirSync(dir, { recursive: true })
  for (const [name, query] of [
    ['book', 'type=book&book=fourth-wing'],
    ['month', 'type=month&month=2026-10'],
    ['year', 'type=year&year=2026'],
    ['top4', 'type=top4'],
  ] as const) {
    await go(page, `/share?${query}&style=brand`)
    await page.waitForTimeout(800)
    const save = page.getByRole('button', { name: /Save image/ })
    await expectEnabled(save)
    const [download] = await Promise.all([page.waitForEvent('download'), save.click()])
    await download.saveAs(path.join(dir, `share-card-${name}-brand.png`))
    captures++
  }
  await context.close()
}

/* ---------- QA phase 1 checks (docs/qa-audit-2026-10-27.md, A1–A5) ---------- */

type Check = { id: string; check: string; pass: boolean; evidence: string }
const qa: Check[] = []
const record = (id: string, check: string, pass: boolean, evidence: string) => qa.push({ id, check, pass, evidence })
const storedEntry = (page: Page, bookId: string) =>
  page.evaluate((id) => JSON.parse(localStorage.getItem('goodreads-library')!).state.entries[id], bookId)

async function qaChecks(browser: Browser) {
  const context = await newContext(browser, 'light')
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)
  const drawer = page.locator(SHEET)

  // A1: Back closes every drawer and sheet, on the same URL; a second Back navigates
  const drawers: [string, string, () => Promise<unknown>][] = [
    ['LogSheet', '/', () => page.getByRole('button', { name: 'Finished it' }).first().click()],
    ['Discover filters', '/discover', () => page.getByRole('button', { name: /^See all/ }).first().click()],
    ['Import', '/library', () => page.getByRole('button', { name: 'Import', exact: true }).click()],
    ['Library filter', '/library?shelf=read', () => page.getByRole('button', { name: /^Filter/ }).click()],
    ['New shelf', '/library', () => page.getByRole('button', { name: 'New shelf' }).click()],
    ['Edit shelves', '/library', () => page.getByRole('button', { name: 'Edit shelves' }).click()],
    ['New thread', '/community/groups/bogota-book-club', () => page.getByRole('button', { name: /New thread/ }).click()],
    ['Share a book', '/messages/c-lucia', () => page.getByRole('button', { name: 'Share a book' }).click()],
    [
      'Favorite picker',
      '/profile/edit',
      async () => {
        await page.getByRole('button', { name: /^Remove .* from top 4$/ }).first().click()
        await page.getByRole('button', { name: /^Add a favorite/ }).click()
      },
    ],
  ]
  for (const [name, url, open] of drawers) {
    await go(page, '/settings')
    await go(page, url)
    await open()
    await sheetOpen(page)
    await page.goBack()
    await page.waitForTimeout(600)
    const closed = !(await drawer.isVisible())
    const sameUrl = page.url() === BASE + url
    await page.goBack()
    await page.waitForTimeout(600)
    const navigated = page.url() === BASE + '/settings'
    record('A1', `Back closes "${name}"`, closed && sameUrl && navigated, `closed: ${closed}, same URL: ${sameUrl}, 2nd Back → /settings: ${navigated}`)
  }

  // A1: unsaved review text survives Back and shows when the sheet reopens (typed < 500ms before Back)
  await go(page, '/')
  await page.getByRole('button', { name: 'Finished it' }).first().click()
  await sheetOpen(page)
  await page.locator(`${SHEET} textarea`).fill('Wingleader Violet, I am not okay.')
  await page.goBack()
  await page.waitForTimeout(600)
  await page.getByRole('button', { name: 'Finished it' }).first().click()
  await sheetOpen(page)
  const draft = await page.locator(`${SHEET} textarea`).inputValue()
  record('A1', 'LogSheet draft kept after Back', draft === 'Wingleader Violet, I am not okay.', `reopened textarea: "${draft}"`)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // A3: Current page, empty or out of range: inline error, Save disabled, nothing saved (also with Enter)
  for (const value of ['', '-5', '9999', '312.5']) {
    await go(page, '/book/fourth-wing')
    await page.getByRole('button', { name: 'Update progress' }).click()
    const input = page.locator('[data-slot="popover-content"] input')
    await input.fill(value)
    await input.press('Enter')
    await page.waitForTimeout(300)
    const describedBy = await input.getAttribute('aria-describedby')
    const message = describedBy ? await page.locator(`[id="${describedBy}"]`).textContent() : null
    const disabled = await page.locator('[data-slot="popover-content"] button[type="submit"]').isDisabled()
    const saved = (await storedEntry(page, 'fourth-wing')).currentPage
    const pass = message === 'Enter a page between 0 and 518.' && disabled && saved === 312
    record('A3', `Current page "${value}"`, pass, `message: "${message}", Save disabled: ${disabled}, stored page: ${saved}`)
  }
  await go(page, '/book/fourth-wing')
  await page.getByRole('button', { name: 'Update progress' }).click()
  await page.locator('[data-slot="popover-content"] input').fill('400')
  await page.locator('[data-slot="popover-content"] button[type="submit"]').click()
  await page.waitForTimeout(300)
  const valid = (await storedEntry(page, 'fourth-wing')).currentPage
  record('A3', 'Current page "400" saves', valid === 400, `stored page: ${valid}`)

  // A4: focus ring is solid --ring with a background-colored offset; ratios against background, card, band
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await go(page, '/book/fourth-wing')
    const r = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
      const px = (c: string) => {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = '#000'
        ctx.fillStyle = c
        ctx.fillRect(0, 0, 1, 1)
        return [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255)
      }
      const lum = ([r, g, b]: number[]) => {
        const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const cr = (a: number[], b: number[]) => {
        const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
        return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
      }
      const v = (n: string) => px(getComputedStyle(document.documentElement).getPropertyValue(n).trim())
      // The focused button's ring layer must be the solid token (alpha 1)
      const button = document.querySelector<HTMLElement>('section[aria-label="Your shelf"] button')!
      button.focus({ focusVisible: true } as FocusOptions)
      const shadow = getComputedStyle(button).boxShadow
      const ring = v('--ring')
      return { shadow, background: cr(ring, v('--background')), card: cr(ring, v('--card')), band: cr(ring, v('--band')) }
    })
    const solid = !/\/ 0\.5|, 0\.5\)/.test(r.shadow) && r.shadow !== 'none'
    const pass = solid && r.background >= 3 && r.card >= 3 && r.band >= 3
    record('A4', `Focus ring (${scheme})`, pass, `vs background ${r.background}, card ${r.card}, band ${r.band}; solid: ${solid}`)
  }
  await page.emulateMedia({ colorScheme: 'light' })

  // A5: covers shown wider than 120px use L; nothing visible is upscaled more than 1.5× at 3x (share export at 1x)
  const dpr3 = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const p3 = await dpr3.newPage()
  for (const url of ['/book/fourth-wing', '/', '/library?shelf=read', '/profile']) {
    await p3.goto(BASE + url, { waitUntil: 'networkidle' })
    await p3.waitForTimeout(500)
    const r = await p3.evaluate(async () => {
      const visible = [...document.querySelectorAll('img')].filter((i) => i.naturalWidth && i.getBoundingClientRect().top < innerHeight)
      // With a w-descriptor srcset, naturalWidth is density-corrected: read the chosen file's real pixels
      const measured = await Promise.all(
        visible.map(async (i) => {
          const file = new Image()
          file.src = i.currentSrc
          await file.decode()
          return { shown: i.getBoundingClientRect().width, natural: file.naturalWidth, src: i.currentSrc }
        }),
      )
      return measured.map((i) => ({ ...i, upscale: Math.round(((i.shown * 3) / i.natural) * 100) / 100 })).sort((a, b) => b.upscale - a.upscale)[0]
    })
    const large = r.shown > 120 ? r.src.includes('/covers/l/') : true
    record('A5', `Sharpest cover check ${url}`, large && r.upscale <= 1.5, `largest upscale ${r.upscale}× (${Math.round(r.shown)}px shown, ${r.natural}px source${r.shown > 120 ? ', L: ' + large : ''})`)
  }
  // Share card export (1080px PNG at 1x): the cover is painted at its layout width; L is the largest Open Library has
  await p3.goto(BASE + '/share?type=book&book=fourth-wing&style=brand', { waitUntil: 'networkidle' })
  await p3.waitForTimeout(800)
  const card = await p3.evaluate(async () => {
    const img = document.querySelector<HTMLImageElement>('[role="img"] img')!
    const file = new Image()
    file.src = img.currentSrc
    await file.decode()
    return { layout: img.offsetWidth, natural: file.naturalWidth, src: img.currentSrc }
  })
  const cardUpscale = Math.round((card.layout / card.natural) * 100) / 100
  record('A5', 'Share card export uses L', card.src.includes('/covers/l/'), `cover ${card.layout}px in the 1080px PNG from a ${card.natural}px L: ${cardUpscale}× (was 2.9× from M)`)
  await dpr3.close()

  // A2: offline → a page that isn't loaded yet shows the recovery screen in the shell, and the offline notice
  {
    const ctx = await newContext(browser, 'light')
    const p = await ctx.newPage()
    await p.goto(BASE)
    await resetDemo(p)
    await go(p, '/')
    await ctx.setOffline(true)
    await p.locator('nav a', { hasText: 'Library' }).click()
    await p.waitForTimeout(1200)
    const title = await p.locator('h1').first().textContent()
    const buttons = await p.locator('main button').allTextContents()
    const toast = await p.locator('[data-sonner-toast]', { hasText: "You're offline. Some pages may not load." }).isVisible()
    const nav = await p.locator('nav a', { hasText: 'Home' }).isVisible()
    record('A2', 'Offline: recovery screen + notice', title === 'Something went wrong loading this page' && buttons.includes('Try again') && buttons.includes('Go home') && toast && nav, `h1: "${title}", buttons: ${buttons.join(' / ')}, offline notice: ${toast}, bottom nav: ${nav}`)
    await ctx.setOffline(false)
    await p.waitForTimeout(800)
    const gone = !(await p.locator('[data-sonner-toast]', { hasText: "You're offline" }).isVisible())
    await p.getByRole('button', { name: 'Try again' }).click()
    await p.waitForLoadState('networkidle')
    await p.waitForTimeout(500)
    const recovered = (await p.locator('h1').first().textContent()) === 'Library'
    record('A2', 'Back online: notice goes, Try again loads the page', gone && recovered, `notice gone: ${gone}, after Try again h1: Library = ${recovered}`)
    await ctx.close()
  }

  // A2: a chunk deleted by a new deploy (404 while online): one automatic reload, then the recovery screen
  {
    const ctx = await newContext(browser, 'light')
    const p = await ctx.newPage()
    await p.goto(BASE)
    await resetDemo(p)
    await go(p, '/')
    let loads = 0
    p.on('load', () => loads++)
    await p.route('**/assets/StatsPage-*.js', (route) => route.fulfill({ status: 404, body: '' }))
    await p.evaluate(() => sessionStorage.removeItem('chunk-reload-at'))
    await p.goto(BASE + '/profile', { waitUntil: 'networkidle' })
    loads = 0
    await p.getByRole('link', { name: 'See all stats' }).click()
    await p.waitForTimeout(2500)
    const title = await p.locator('h1').first().textContent()
    record('A2', 'Missing chunk: reloads once, then recovery screen', loads === 1 && title === 'Something went wrong loading this page', `page reloads: ${loads}, then h1: "${title}"`)
    await p.unroute('**/assets/StatsPage-*.js')
    await p.getByRole('button', { name: 'Try again' }).click()
    await p.waitForLoadState('networkidle')
    await p.waitForTimeout(500)
    const h1 = await p.locator('h1').first().textContent()
    record('A2', 'After the deploy settles, Try again loads it', h1 !== 'Something went wrong loading this page', `h1 after Try again: "${h1}"`)
    await ctx.close()
  }
  await context.close()
}

/* ---------- main ---------- */

const server = await startServer()
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const dir of ['screens', 'flows', 'share-cards']) fs.rmSync(path.join(OUT, dir), { recursive: true, force: true })
  for (const scheme of ['light', 'dark'] as const) await captureScreens(browser, scheme)
  const metrics = await measureFlows(browser)
  await shareCards(browser)
  await qaChecks(browser)

  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify({ screens: audits, contrast: contrastIssues, qa }, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n')

  const failing = audits.filter((a) => a.overflow > 0 || a.nested > 0 || a.small.length > 0)
  console.log(`Captures: ${captures}`)
  console.log('Flows:', JSON.stringify(metrics, null, 2))
  console.log(`Audit: ${audits.length} screens, ${failing.length} with issues`)
  for (const a of failing) console.log(`  ${a.screen}:`, JSON.stringify({ overflow: a.overflow, nested: a.nested, small: a.small }))
  console.log(`Text contrast: ${contrastIssues.length} failing text nodes (light + dark)`)
  for (const c of contrastIssues) console.log(`  ${c.scheme} ${c.screen}: "${c.text}" ${c.ratio} < ${c.min} (${c.fg} on ${c.bg})`)
  console.log(`QA phase 1: ${qa.filter((c) => c.pass).length}/${qa.length} checks pass`)
  for (const c of qa) console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.id} ${c.check}: ${c.evidence}`)
} finally {
  await browser.close()
  stopServer(server)
}

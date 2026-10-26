/**
 * Case-study captures: `npm run capture` (builds, serves the build, then runs this).
 *
 * - Resets demo data from Settings and checks the demo clock is on (Oct 16, 2026, 10:00).
 * - case-study/screens/{light,dark}/NN-name.png at 390×844 (@2x)
 * - case-study/flows/fN-NN.png: each F1–F4 flow, one capture per tap (light)
 * - case-study/share-cards/*.png: the 4 Brand share cards, exported by the app itself
 * - case-study/audit.json + metrics.json: per-screen audit (44px, nesting, overflow) and tap counts
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

/* ---------- main ---------- */

const server = await startServer()
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const dir of ['screens', 'flows', 'share-cards']) fs.rmSync(path.join(OUT, dir), { recursive: true, force: true })
  for (const scheme of ['light', 'dark'] as const) await captureScreens(browser, scheme)
  const metrics = await measureFlows(browser)
  await shareCards(browser)

  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audits, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n')

  const failing = audits.filter((a) => a.overflow > 0 || a.nested > 0 || a.small.length > 0)
  console.log(`Captures: ${captures}`)
  console.log('Flows:', JSON.stringify(metrics, null, 2))
  console.log(`Audit: ${audits.length} screens, ${failing.length} with issues`)
  for (const a of failing) console.log(`  ${a.screen}:`, JSON.stringify({ overflow: a.overflow, nested: a.nested, small: a.small }))
} finally {
  await browser.close()
  stopServer(server)
}

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
import zlib from 'node:zlib'
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
const audits: { screen: string; overflow: number; nested: number; small: unknown[]; headings: string[] }[] = []

/**
 * 44px targets (counting ::after hit extensions), nothing interactive nested, no horizontal overflow,
 * and the heading outline: one h1, first, and no skipped level (h1 → h3)
 */
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
      headings: (() => {
        // An open modal (drawer, sheet) hides the page from assistive tech: its own outline is what's read,
        // starting at its title (an h2), so there it's checked for skipped levels only
        const modal = document.querySelector('[role="dialog"][data-state="open"]')
        const hs = [...(modal ?? document).querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]')].filter(
          (h) => modal || !h.closest('[aria-hidden="true"], [hidden], [role="img"]'),
        )
        const levels = hs.map((h) => Number(h.getAttribute('aria-level') ?? h.tagName.slice(1)))
        const issues: string[] = []
        const h1s = levels.filter((l) => l === 1).length
        if (!modal && h1s !== 1) issues.push(`${h1s} h1`)
        else if (!modal && levels[0] !== 1) issues.push(`starts at h${levels[0]}`)
        levels.forEach((l, i) => {
          if (i > 0 && l > levels[i - 1] + 1) issues.push(`h${levels[i - 1]} → h${l} "${hs[i].textContent!.trim().slice(0, 30)}"`)
        })
        return issues
      })(),
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
  // Let the drawer close (and give its Back entry back) before the next navigation
  await page.waitForTimeout(500)
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
  // Let the drawer close (and give its Back entry back) before the next navigation
  await page.waitForTimeout(500)

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
const record = (id: string, check: string, pass: boolean, evidence: string) => {
  qa.push({ id, check, pass, evidence })
  // Progress as it goes: the QA phases take minutes
  console.log(`  ${pass ? 'pass' : 'FAIL'} ${id} ${check}`)
}
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
    // The close animation takes ~0.5s after the popstate (≈840ms from Back in Playwright): wait for it, up to 2s
    const closed = await drawer.waitFor({ state: 'hidden', timeout: 2000 }).then(() => true, () => false)
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
  // Let the drawer close (and give its Back entry back) before the next navigation
  await page.waitForTimeout(500)
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

  // A5: nothing visible is upscaled more than 1.5× at 2x or 3x; covers shown wider than 120px get a ≥300px source
  for (const dpr of [2, 3]) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: dpr, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    for (const url of ['/book/fourth-wing', '/', '/library?shelf=read', '/profile']) {
      await p.goto(BASE + url, { waitUntil: 'networkidle' })
      await p.waitForTimeout(500)
      const r = await p.evaluate(async (density) => {
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
        return measured.map((i) => ({ ...i, upscale: Math.round(((i.shown * density) / i.natural) * 100) / 100 })).sort((a, b) => b.upscale - a.upscale)[0]
      }, dpr)
      const large = r.shown > 120 ? r.natural >= 300 : true
      const file = r.src.split('/covers/')[1]
      record('A5', `Sharpest cover ${url} at ${dpr}x`, large && r.upscale <= 1.5, `largest upscale ${r.upscale}× (${Math.round(r.shown)}px shown, ${file}, ${r.natural}px)`)
    }
    // Phase 2 A: cover bytes on Home after scrolling the whole page (a fresh context: cached covers report 0 bytes)
    if (dpr === 3) {
      const fresh = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
      const f = await fresh.newPage()
      await f.goto(BASE + '/', { waitUntil: 'networkidle' })
      await f.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 120))
        }
      })
      await f.waitForTimeout(1200)
      const kb = await f.evaluate(() =>
        Math.round(performance.getEntriesByType('resource').filter((e) => e.name.includes('/covers/')).reduce((s, e) => s + (e as PerformanceResourceTiming).encodedBodySize, 0) / 1024),
      )
      record('A', 'Home cover bytes at 3x < 450 KB', kb > 0 && kb < 450, `${kb} KB (273 KB before A5, 805 KB with L JPGs)`)
      await fresh.close()
    }
    await ctx.close()
  }
  const dpr3 = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  const p3 = await dpr3.newPage()
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

/* ---------- QA phase 2 checks (M1–M6, plus Back for popovers and menus) ---------- */

const ROUTES = [
  '/', '/discover', '/discover/search', '/discover/results?mood=dark&pace=fast', '/library', '/library?shelf=want', '/library?shelf=read',
  '/library/journal', '/community', '/community?tab=buddy-reads', '/community?tab=groups', '/community/find',
  '/community/buddy/br-fourth-wing', '/community/groups/bogota-book-club', '/community/groups/bogota-book-club/threads/t-bb-2',
  '/notifications', '/messages', '/messages/c-lucia', '/profile', '/profile/edit', '/profile/stats', '/settings',
  '/u/mayareadsdragons', '/book/fourth-wing', '/share?type=month&month=2026-10&style=brand', '/invite/sofiareads', '/nope',
]

/** Tabs through the page; returns focused elements whose center sits under a fixed or sticky bar */
async function coveredFocus(page: Page, presses: number) {
  const covered: string[] = []
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab')
    const hit = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const b = el.getBoundingClientRect()
      const x = Math.min(Math.max(b.left + b.width / 2, 0), innerWidth - 1)
      const y = Math.min(Math.max(b.top + b.height / 2, 0), innerHeight - 1)
      const top = document.elementFromPoint(x, y)
      if (!top || el.contains(top) || top.contains(el)) return null
      for (let n: Element | null = top; n; n = n.parentElement) {
        if (['fixed', 'sticky'].includes(getComputedStyle(n).position) && !n.contains(el)) return (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 30)
      }
      return null
    })
    if (hit) covered.push(hit)
  }
  return covered
}

async function qaPhase2(browser: Browser) {
  const context = await newContext(browser, 'light')
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)

  // M1: a focused tab panel shows the indicator
  for (const url of ['/library', '/profile', '/community']) {
    await go(page, url)
    let ring = 'not reached'
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const r = await page.evaluate(() => {
        const el = document.activeElement
        return el?.getAttribute('role') === 'tabpanel' ? getComputedStyle(el).boxShadow : null
      })
      if (r !== null) {
        ring = r
        break
      }
    }
    record('M1', `Tab panel focus visible ${url}`, ring !== 'none' && ring !== 'not reached', `panel box-shadow: ${ring === 'none' || ring === 'not reached' ? ring : 'solid --ring, 2px inset'}`)
  }

  // M2: keyboard focus never ends up under a fixed or sticky bar
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'light' })
    const p = await ctx.newPage()
    await p.goto(BASE)
    for (const url of ['/discover', '/book/fourth-wing', '/', '/library']) {
      await p.goto(BASE + url, { waitUntil: 'networkidle' })
      const covered = await coveredFocus(p, 70)
      record('M2', `Focus never under a bar ${url}`, covered.length === 0, `${covered.length} covered of 70 Tab presses${url === '/discover' ? ' (26 before)' : ''}${covered.length ? ': ' + covered.slice(0, 3).join(', ') : ''}`)
    }
    await ctx.close()
  }

  // M3: no horizontal overflow at 320, 360 and 430px on any route
  for (const width of [320, 360, 430]) {
    const ctx = await browser.newContext({ viewport: { width, height: 740 }, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    const over: string[] = []
    for (const url of ROUTES) {
      await p.goto(BASE + url, { waitUntil: 'networkidle' })
      const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (o > 0) over.push(`${url} +${o}px`)
    }
    record('M3', `No overflow at ${width}px (${ROUTES.length} routes)`, over.length === 0, over.length ? over.join(', ') : `0 of ${ROUTES.length} routes overflow${width === 320 ? ' (Edit profile was +32px)' : ''}`)
    await ctx.close()
  }

  // M4: landscape (844×390), fixed and sticky bars cover at most 25% of the height, at the top and scrolled
  {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    const worst: { url: string; share: number }[] = []
    for (const url of [...ROUTES, '/library?shelf=read#select']) {
      await p.goto(BASE + url.replace('#select', ''), { waitUntil: 'networkidle' })
      if (url.endsWith('#select')) {
        await p.getByRole('button', { name: 'Select' }).click()
        await p.getByRole('checkbox').first().click()
      }
      for (const y of [0, 600]) {
        await p.evaluate((top) => window.scrollTo(0, top), y)
        await p.waitForTimeout(150)
        const share = await p.evaluate(() => {
          const bars = [...document.querySelectorAll('body *')].filter((el) => {
            const s = getComputedStyle(el)
            const r = el.getBoundingClientRect()
            return ['fixed', 'sticky'].includes(s.position) && r.height > 0 && r.bottom > 0 && r.top < innerHeight && !el.closest('[data-sonner-toaster]')
          })
          const outer = bars.filter((el) => !bars.some((o) => o !== el && o.contains(el)))
          const covering = outer.filter((el) => getComputedStyle(el).position === 'fixed' || window.scrollY > 0)
          return Math.round((covering.reduce((s, el) => s + Math.min(el.getBoundingClientRect().height, innerHeight), 0) / innerHeight) * 100)
        })
        worst.push({ url: url + (y ? ' (scrolled)' : ''), share })
      }
    }
    worst.sort((a, b) => b.share - a.share)
    record('M4', 'Landscape: bars ≤ 25% of the height', worst[0].share <= 25, `worst: ${worst.slice(0, 3).map((w) => `${w.url} ${w.share}%`).join(', ')} (was up to 60%)`)
    await ctx.close()
  }

  // M5: 200% text, no horizontal overflow anywhere; the nav keeps 44px targets (icons only, labels for screen readers)
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    const over: string[] = []
    for (const url of ROUTES) {
      await p.goto(BASE + url, { waitUntil: 'networkidle' })
      await p.addStyleTag({ content: 'html { font-size: 200% !important }' })
      await p.waitForTimeout(250)
      const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (o > 0) over.push(`${url} +${o}px`)
    }
    record('M5', `200% text: no overflow (${ROUTES.length} routes)`, over.length === 0, over.length ? over.join(', ') : `0 of ${ROUTES.length} routes (was up to +233px)`)
    await p.goto(BASE + '/', { waitUntil: 'networkidle' })
    await p.addStyleTag({ content: 'html { font-size: 200% !important }' })
    await p.waitForTimeout(250)
    const nav = await p.evaluate(() =>
      [...document.querySelectorAll('[data-slot="bottom-nav"] a')].map((a) => ({
        w: Math.round(a.getBoundingClientRect().width),
        h: Math.round(a.getBoundingClientRect().height),
        hidden: getComputedStyle(a.querySelector('span')!).position === 'absolute',
        name: a.textContent?.trim(),
      })),
    )
    const ok = nav.every((n) => n.w >= 44 && n.h >= 44 && n.hidden && n.name)
    record('M5', '200% text: nav is icons only, 44px, still named', ok, nav.map((n) => `${n.name} ${n.w}×${n.h}`).join(', '))
    await ctx.close()
  }

  // M6: a title per screen, updated on navigation
  {
    const titles: string[] = []
    const expect: [string, string, () => Promise<unknown>][] = [
      ['/', 'Home · Goodreads Concept', () => go(page, '/')],
      ['nav → Library', 'Library · Goodreads Concept', () => page.locator('nav a', { hasText: 'Library' }).click()],
      ['/book/fourth-wing', 'Fourth Wing · Goodreads Concept', () => go(page, '/book/fourth-wing')],
      ['/profile/stats', 'Stats · Goodreads Concept', () => go(page, '/profile/stats')],
      ['/community/groups/bogota-book-club', 'Bogotá Book Club · Goodreads Concept', () => go(page, '/community/groups/bogota-book-club')],
    ]
    let ok = true
    for (const [label, want, nav] of expect) {
      await nav()
      await page.waitForTimeout(300)
      const t = await page.title()
      titles.push(`${label}: "${t}"`)
      if (t !== want) ok = false
    }
    // One title per screen: the shelf and community tabs are the same screen (same path), so they share it
    const titleByPath = new Map<string, Set<string>>()
    for (const url of ROUTES) {
      await go(page, url)
      const path = url.split('?')[0]
      titleByPath.set(path, (titleByPath.get(path) ?? new Set()).add(await page.title()))
    }
    const distinct = new Set([...titleByPath.values()].flatMap((s) => [...s]))
    record('M6', 'Title per screen, updated on navigation', ok, titles.join('; '))
    record('M6', `A distinct title per screen (${titleByPath.size} screens)`, distinct.size === titleByPath.size, `${distinct.size} distinct titles for ${titleByPath.size} screens (${ROUTES.length} routes; the tabs of Library and Community share their screen's)`)
  }

  // C: Back also closes popovers and menus, on the same URL; a second Back navigates
  const overlays: [string, string, () => Promise<unknown>, string][] = [
    ['Update progress popover', '/book/fourth-wing', () => page.getByRole('button', { name: 'Update progress' }).click(), '[data-slot="popover-content"]'],
    ['Shelf menu (status chip)', '/book/fourth-wing', () => page.locator('[data-slot="dropdown-menu-trigger"]', { hasText: 'Reading · p. 312' }).click(), '[data-slot="dropdown-menu-content"]'],
    ['Sort menu', '/library?shelf=read', () => page.getByRole('button', { name: /^Sort:/ }).click(), '[data-slot="dropdown-menu-content"]'],
  ]
  for (const [name, url, open, selector] of overlays) {
    await go(page, '/settings')
    await go(page, url)
    await open()
    await page.locator(selector).waitFor({ state: 'visible' })
    await page.goBack()
    await page.waitForTimeout(500)
    const closed = !(await page.locator(selector).isVisible())
    const sameUrl = page.url() === BASE + url
    await page.goBack()
    await page.waitForTimeout(500)
    const navigated = page.url() === BASE + '/settings'
    record('C', `Back closes "${name}"`, closed && sameUrl && navigated, `closed: ${closed}, same URL: ${sameUrl}, 2nd Back → /settings: ${navigated}`)
  }

  // C: the inset focus rings (rows, segments, nav) against the row's own background, light and dark
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    const results: { name: string; ratio: number }[] = []
    for (const [name, url, selector] of [
      ['Segment (checked)', '/discover', '[role="radio"][aria-checked="true"]'],
      ['Segment (unchecked)', '/discover', '[role="radio"][aria-checked="false"]'],
      ['Bottom nav tab', '/discover', '[data-slot="bottom-nav"] a'],
      ['Notification row (unread)', '/notifications', 'main ul a'],
      ['Book page row', '/book/fourth-wing', 'main a.focus-visible\\:ring-inset'],
    ] as const) {
      await go(page, url)
      const ratio = await page.evaluate((sel) => {
        const el = document.querySelector<HTMLElement>(sel)!
        el.focus({ focusVisible: true } as FocusOptions)
        const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
        const px = (c: string) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = '#000'
          ctx.fillStyle = c
          ctx.fillRect(0, 0, 1, 1)
          return [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255)
        }
        // The row's own background, composited over its ancestors
        const layers: number[][] = []
        for (let n: Element | null = el; n; n = n.parentElement) {
          const c = px(getComputedStyle(n).backgroundColor)
          if (c[3] > 0) layers.push(c)
          if (c[3] >= 1) break
        }
        let bg = [1, 1, 1]
        for (const l of layers.reverse()) bg = l.slice(0, 3).map((v, i) => l[3] * v + (1 - l[3]) * bg[i])
        const ring = px(getComputedStyle(document.documentElement).getPropertyValue('--ring').trim())
        const lum = ([r, g, b]: number[]) => {
          const f = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
        }
        const [a, b] = [lum(ring), lum(bg)].sort((x, y) => y - x)
        return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100
      }, selector)
      results.push({ name, ratio })
    }
    const min = Math.min(...results.map((r) => r.ratio))
    record('C', `Inset focus rings vs row background (${scheme})`, min >= 3, results.map((r) => `${r.name} ${r.ratio}`).join(', '))
  }
  await page.emulateMedia({ colorScheme: 'light' })
  await context.close()
}

/* ---------- QA phase 3 checks (M7, M8, B1–B8) ---------- */

/** Contrast helpers injected into the page: tokens and computed colors → sRGB, composited, WCAG ratio */
const COLOR_HELPERS = `
  window.__px = (c) => {
    const ctx = (window.__ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true }))
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = c
    ctx.fillRect(0, 0, 1, 1)
    return [...ctx.getImageData(0, 0, 1, 1).data].map((v) => v / 255)
  }
  window.__token = (name, el = document.documentElement) => window.__px(getComputedStyle(el).getPropertyValue(name).trim())
  window.__bg = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) {
      const c = window.__px(getComputedStyle(n).backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 1) break
    }
    let bg = [1, 1, 1]
    for (const l of layers.reverse()) bg = l.slice(0, 3).map((v, i) => l[3] * v + (1 - l[3]) * bg[i])
    return bg
  }
  window.__ratio = (a, b) => {
    const lum = ([r, g, bl]) => {
      const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
    }
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
    return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100
  }
  window.__same = (a, b) => a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) < 0.02)
`
/** The helpers above, as the page sees them */
type ColorHelpers = {
  __px: (color: string) => number[]
  __token: (name: string) => number[]
  __bg: (el: Element) => number[]
  __ratio: (a: number[], b: number[]) => number
  __same: (a: number[], b: number[]) => boolean
}

const dayAfter = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** gzip size (KB) of built files, by the names the browser requested */
const gzipKB = (files: string[]) =>
  Math.round(
    (files.reduce((sum, f) => sum + zlib.gzipSync(fs.readFileSync(path.join(ROOT, 'dist', 'assets', f)), { level: 9 }).length, 0) / 1024) * 10,
  ) / 10

async function qaPhase3(browser: Browser) {
  const context = await newContext(browser, 'light')
  await context.addInitScript(COLOR_HELPERS)
  const page = await context.newPage()
  await page.goto(BASE)
  await resetDemo(page)
  const pop = page.locator('[data-slot="popover-content"]')

  // M7: every bar's fill against its track ≥ 3:1, light and dark (the tracks used to be --muted: 1.01:1 in dark)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    const bars: string[] = []
    let min = Infinity
    let muted = 0
    for (const [url, where] of [
      ['/', 'Home'],
      ['/book/fourth-wing', 'Book'],
      ['/profile', 'Profile'],
      ['/profile/stats', 'Stats'],
    ] as const) {
      await go(page, url)
      const r = await page.evaluate(() => {
        const w = window as unknown as ColorHelpers
        const tracks = [...document.querySelectorAll<HTMLElement>('main .bg-track')].filter((t) => t.firstElementChild && t.getClientRects().length)
        return {
          ratios: tracks.map((t) => w.__ratio(w.__px(getComputedStyle(t.firstElementChild!).backgroundColor), w.__bg(t))),
          // A bar still on the old token would be a .bg-muted pill with a fill inside
          muted: [...document.querySelectorAll('main .rounded-full.bg-muted')].filter((t) => t.firstElementChild).length,
        }
      })
      muted += r.muted
      const ratios = r.ratios.sort((a, b) => a - b)
      if (ratios.length) {
        min = Math.min(min, ratios[0])
        bars.push(`${where} ${ratios.length} bars ${ratios[0]}${ratios[ratios.length - 1] !== ratios[0] ? `–${ratios[ratios.length - 1]}` : ''}`)
      }
    }
    const tokens = await page.evaluate(() => {
      const w = window as unknown as ColorHelpers
      return {
        ink: w.__ratio(w.__token('--foreground'), w.__token('--track')),
        primary: w.__ratio(w.__token('--primary'), w.__token('--track')),
        placeholder: w.__ratio(w.__token('--placeholder'), w.__token('--background')),
      }
    })
    record('M7', `Bar fill vs track ≥ 3:1 (${scheme})`, min >= 3 && muted === 0, `${bars.join(', ')}; tokens: challenge ink ${tokens.ink}, primary ${tokens.primary}; tracks left on --muted: ${muted}`)
    record('M7', `Cover placeholder visible (${scheme})`, tokens.placeholder > 1.1, `--placeholder vs --background ${tokens.placeholder}${scheme === 'dark' ? ' (--muted was 1.01)' : ''}`)
  }
  await page.emulateMedia({ colorScheme: 'light' })

  // M8: saving the last page offers to finish, in the same popover
  const openProgress = async (value: string) => {
    await go(page, '/book/fourth-wing')
    await page.getByRole('button', { name: 'Update progress' }).click()
    await pop.locator('input').fill(value)
    await pop.locator('input').press('Enter')
    await page.waitForTimeout(300)
  }
  await openProgress('518')
  const offer = (await pop.getByText("That's the last page!").isVisible()) && (await pop.getByText('Main character finish.').isVisible())
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim())
  const notYet = (await storedEntry(page, 'fourth-wing')).currentPage
  await pop.getByRole('button', { name: 'Just save progress' }).click()
  await page.waitForTimeout(800)
  const justSaved = await storedEntry(page, 'fourth-wing')
  const toastShown = await page.getByText('Progress saved.').isVisible()
  record(
    'M8',
    'Last page: offer, then "Just save progress"',
    offer && focused === 'Mark as read' && notYet === 312 && justSaved.currentPage === 518 && justSaved.status === 'reading' && !(await pop.isVisible()) && toastShown,
    `offer shown: ${offer}, focus on "${focused}", nothing saved before choosing (p. ${notYet}); after: p. ${justSaved.currentPage}, ${justSaved.status}, toast: ${toastShown}`,
  )
  await openProgress('518')
  await pop.getByRole('button', { name: 'Mark as read' }).click()
  await sheetOpen(page)
  const status = await page.locator(SHEET).locator('[role="radio"][aria-checked="true"]').first().textContent()
  const marked = (await storedEntry(page, 'fourth-wing')).currentPage
  record('M8', 'Last page: "Mark as read" opens the LogSheet on Read', status?.trim() === 'Read' && marked === 518, `sheet status: ${status?.trim()}, page kept: ${marked}`)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // M8: on Home, the reading card's main button is "Update progress" until the last page, then "Finished it"
  await go(page, '/')
  const mains = await page.evaluate(() => {
    const w = window as unknown as ColorHelpers
    const primary = w.__token('--primary')
    return [...document.querySelectorAll('main article')]
      .filter((a) => a.textContent!.includes('Finished it'))
      .map((a) => {
        const main = [...a.querySelectorAll('button')].filter((b) => w.__same(w.__px(getComputedStyle(b).backgroundColor), primary))
        return `${a.querySelector('h3')!.textContent!.trim()} (${a.querySelector('.stat-number')!.textContent}%): ${main.map((b) => b.textContent!.trim()).join(' + ') || 'none'}`
      })
  })
  const fw = mains.find((m) => m.startsWith('Fourth Wing'))
  const other = mains.find((m) => !m.startsWith('Fourth Wing'))
  record('M8', 'Home: "Finished it" is the primary at 100%', !!fw?.endsWith(': Finished it') && !!other?.endsWith(': Update progress'), mains.join('; '))

  // B1: no future dates (demo clock included): inline error, aria-describedby, Save disabled
  await resetDemo(page)
  await go(page, '/')
  await page.getByRole('button', { name: 'Finished it' }).first().click()
  await sheetOpen(page)
  const sheet = page.locator(SHEET)
  for (const field of ['Finished', 'Started'] as const) {
    const input = sheet.getByLabel(field, { exact: true })
    const today = (await input.getAttribute('max'))!
    const original = await input.inputValue()
    await input.fill(dayAfter(today))
    await page.waitForTimeout(200)
    const describedBy = await input.getAttribute('aria-describedby')
    const message = describedBy ? await page.locator(`[id="${describedBy}"]`).textContent() : null
    const invalid = await input.getAttribute('aria-invalid')
    const disabled = await sheet.getByRole('button', { name: 'Save', exact: true }).isDisabled()
    await input.fill(original || today)
    await page.waitForTimeout(200)
    const cleared = !(await sheet.getByRole('button', { name: 'Save', exact: true }).isDisabled())
    record(
      'B1',
      `${field} date in the future`,
      message?.trim() === "Dates can't be in the future." && invalid === 'true' && disabled && cleared,
      `${dayAfter(today)} (demo today ${today}): "${message?.trim()}", aria-invalid ${invalid}, Save disabled: ${disabled}; back to ${original || today}: Save enabled ${cleared}`,
    )
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // B2: invalid filters are dropped silently, with a replace (Back skips the bad URL); "0 books" only for a real zero
  const h1 = async () => (await page.locator('h1').first().textContent())?.trim()
  await go(page, '/settings')
  await go(page, '/discover/results?mood=zzz&pace=fast')
  const cleaned = page.url().replace(BASE, '')
  const fastTitle = await h1()
  await page.goBack()
  await page.waitForTimeout(500)
  const backTo = page.url().replace(BASE, '')
  record('B2', 'Invalid filter dropped, URL replaced', cleaned === '/discover/results?pace=fast' && backTo === '/settings' && fastTitle !== '0 books', `?mood=zzz&pace=fast → ${cleaned} ("${fastTitle}"); Back → ${backTo}`)
  await go(page, '/discover/results?mood=zzz')
  const allTitle = await h1()
  await go(page, '/discover/results?mood=adventurous&length=short&pace=slow')
  const zeroTitle = await h1()
  const zeroCopy = await page.getByText('No books match all of that.').isVisible()
  record('B2', '"0 books" only when valid filters match nothing', allTitle !== '0 books' && zeroTitle === '0 books' && zeroCopy, `?mood=zzz → "${allTitle}" (was "0 books"); adventurous + short + slow → "${zeroTitle}", empty state: ${zeroCopy}`)

  // B4: --destructive, light mode darkened to L 0.52
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    await go(page, '/settings')
    const d = await page.evaluate(() => {
      const w = window as unknown as ColorHelpers
      const destructive = w.__token('--destructive')
      return {
        background: w.__ratio(destructive, w.__token('--background')),
        card: w.__ratio(destructive, w.__token('--card')),
        onIt: w.__ratio(w.__token('--destructive-foreground'), destructive),
        white: w.__ratio([1, 1, 1], destructive),
      }
    })
    const pass = scheme === 'light' ? d.background >= 4.5 && d.card >= 4.5 && d.white >= 4.5 : true
    record('B4', `--destructive (${scheme})`, pass, `text on background ${d.background}, on card ${d.card}; white on it ${d.white}${scheme === 'dark' ? `, its foreground on it ${d.onIt} (dark unchanged)` : ''}`)
  }
  await page.emulateMedia({ colorScheme: 'light' })

  // B5: copy rule. Home's challenge card and For you, then a sweep of the UI chrome on every route
  await go(page, '/')
  const challenge = (await page.locator('main h2', { hasText: 'reading challenge' }).first().textContent())?.trim()
  const statsHref = await page.getByRole('link', { name: 'See stats', exact: true }).getAttribute('href')
  const seeDiscover = await page.getByRole('link', { name: 'See Discover', exact: true }).count()
  record('B5', 'Challenge card and For you links', challenge === '2026 reading challenge' && statsHref === '/profile/stats' && seeDiscover > 0, `h2 "${challenge}", "See stats" → ${statsHref}, "See Discover" links: ${seeDiscover}`)
  // Proper nouns that may follow another capitalized word (brands, names, screen names)
  const PROPER = ['Goodreads', 'Kindle', 'Audible', 'StoryGraph', 'Discover', 'Awards', 'Book', 'Club', 'Girlies', 'Wing', 'Flame', 'Chen', 'Lucía', 'Sofía', 'Herrera', 'Reads']
  const titleCase: string[] = []
  const verbs: string[] = []
  for (const url of ROUTES) {
    await go(page, url)
    const r = await page.evaluate((proper) => {
      const chrome = [...document.querySelectorAll<HTMLElement>('h1, h2, h3, legend, label, button, [role="tab"], [role="menuitem"], a')].filter(
        // User content (book titles, people, groups, threads) keeps its own capitals
        (el) => !el.closest('[role="img"], .book-title, article') && !el.matches('a[href^="/book/"], a[href^="/u/"], a[href^="/community/"], a[href^="/messages/"]'),
      )
      const texts = chrome.flatMap((el) =>
        [...el.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent!.trim()).filter(Boolean),
      )
      const flagged = texts.filter((t) => {
        const words = t.split(/\s+/)
        return words.some((w, i) => i > 0 && /^[A-Z][a-z]/.test(w) && /^[A-Z][a-z]/.test(words[i - 1]) && !proper.includes(w))
      })
      const nav = [...document.querySelectorAll('a, button')].map((el) => el.textContent!.trim()).filter((t) => /^(View|See more|Show more|Go to)\b/.test(t))
      return { flagged, nav }
    }, PROPER)
    titleCase.push(...r.flagged.map((t) => `${url}: "${t}"`))
    verbs.push(...r.nav.map((t) => `${url}: "${t}"`))
  }
  record('B5', `Sentence case in titles, buttons, tabs and links (${ROUTES.length} routes)`, titleCase.length === 0, titleCase.length ? titleCase.slice(0, 6).join(', ') : '0 Title Case strings outside proper nouns')
  record('B5', 'One navigation verb (no View / See more / Show more / Go to)', verbs.length === 0, verbs.length ? verbs.join(', ') : 'none left ("View" and "See more" were on Home, "Go to Home" on 404)')

  // B6: one chip. Pill, --muted-foreground border, no shadow; selected = --secondary + an icon
  await go(page, '/discover')
  await page.locator('[data-slot="chip"]').first().click()
  const chips: string[] = []
  let chipFails = 0
  for (const [url, where] of [
    ['/discover', 'Discover filters'],
    ['/library', 'Library shelves'],
    ['/discover/results?mood=dark&pace=fast', 'Results filters'],
    ['/', 'Home status chips'],
    ['/book/fourth-wing', 'Book tags'],
  ] as const) {
    if (url !== '/discover') await go(page, url)
    const r = await page.evaluate(() => {
      const w = window as unknown as ColorHelpers
      const els = [
        ...document.querySelectorAll<HTMLElement>('main [data-slot="chip"], main [data-slot="dropdown-menu-trigger"].rounded-full, main a.rounded-full[href^="/discover?"]'),
      ].filter((el) => el.getClientRects().length && !el.classList.contains('border-transparent'))
      const secondary = w.__token('--secondary')
      const border = w.__token('--muted-foreground')
      const bad: string[] = []
      let selected = 0
      for (const el of els) {
        const s = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        const isSelected = el.getAttribute('aria-pressed') === 'true' || w.__same(w.__px(s.backgroundColor), secondary)
        if (isSelected) selected++
        const problems = [
          s.boxShadow !== 'none' && 'shadow',
          parseFloat(s.borderTopLeftRadius) < rect.height / 2 - 0.5 && 'not a pill',
          !w.__same(w.__px(s.borderTopColor), border) && 'border',
          isSelected && !el.querySelector('svg') && 'selected without icon',
        ].filter(Boolean)
        if (problems.length) bad.push(`${el.textContent!.trim().slice(0, 20)}: ${problems.join('/')}`)
      }
      const heights = [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().height)))]
      return { count: els.length, selected, bad, heights }
    })
    chipFails += r.bad.length + (r.count === 0 ? 1 : 0)
    chips.push(`${where} ${r.count} (${r.selected} selected, ${r.heights.join('/')}px)${r.bad.length ? ' ✗ ' + r.bad.slice(0, 2).join(', ') : ''}`)
  }
  record('B6', 'One chip: pill, border, no shadow, selected = secondary + icon', chipFails === 0, chips.join('; '))
  await context.close()

  // B7: the initial bundle, and the LogSheet's first open
  const indexHtml = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8')
  const entry = /src="\/assets\/([^"]+\.js)"/.exec(indexHtml)![1]
  const fresh = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const f = await fresh.newPage()
  await f.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await f.locator('main article').first().waitFor()
  const scripts = () => f.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name.split('/').pop()!).filter((n) => n.endsWith('.js')))
  const first = await scripts()
  await f.waitForTimeout(6000)
  const deferred = (await scripts()).filter((n) => !first.includes(n))
  const leaked = first.filter((n) => /^(LogSheet|drawer|sonner)-/.test(n))
  const entryKB = gzipKB([entry])
  const initialKB = gzipKB(first)
  record('B7', 'Entry chunk < 100 KB gzip', entryKB < 100, `${entry} ${entryKB} KB gzip (125.2 before)`)
  record(
    'B7',
    'LogSheet, vaul and sonner out of the first screen',
    leaked.length === 0 && deferred.some((n) => n.startsWith('LogSheet-')) && deferred.some((n) => n.startsWith('sonner-')),
    `Home first screen: ${first.length} JS files, ${initialKB} KB gzip (209.1 before); loaded after, in idle time: ${deferred.join(', ')}`,
  )
  await fresh.close()
  // First open on a slow connection (Fast 3G: 150 ms RTT, 1.6 Mbps) while Home's covers are still loading.
  // The tap comes 2 s after the button appears (reading the card; no hover, it's a phone), then 1 s, then the
  // instant it appears (worst case). The criterion is on 2 s; the other two are reported as they are
  for (const delay of [2000, 1000, 0]) {
    const slow = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    const s = await slow.newPage()
    const cdp = await slow.newCDPSession(s)
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200_000, uploadThroughput: 90_000 })
    // Timed in the page, from the click event to the sheet in the DOM (Playwright's own click waits aren't the app's)
    await s.addInitScript(() => {
      const w = window as unknown as { t0?: number; t1?: number }
      addEventListener('click', () => (w.t0 ??= performance.now()), true)
      new MutationObserver(() => {
        if (w.t0 !== undefined && w.t1 === undefined && document.querySelector('[data-slot="drawer-content"]')) w.t1 = performance.now()
      }).observe(document, { childList: true, subtree: true })
    })
    await s.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
    const button = s.getByRole('button', { name: 'Finished it' }).first()
    await button.waitFor()
    await s.waitForTimeout(delay)
    await button.click()
    await s.locator(SHEET).waitFor({ state: 'visible' })
    const ms = Math.round(await s.evaluate(() => (window as unknown as { t0: number; t1: number }).t1 - (window as unknown as { t0: number }).t0))
    record(
      'B7',
      `First LogSheet open on Fast 3G, tap ${delay / 1000} s after the button appears`,
      delay === 2000 ? ms < 100 : true,
      `${ms} ms from tap to sheet (Phase 2, sheet in the initial bundle: ~40 ms)${delay === 2000 ? '' : '; reported, not a criterion'}`,
    )
    await slow.close()
  }

  // B8: manifest, icons, colors from the tokens, no service worker
  const m = await browser.newContext({ viewport: VIEWPORT })
  await m.addInitScript(COLOR_HELPERS)
  const mp = await m.newPage()
  await mp.goto(BASE + '/', { waitUntil: 'networkidle' })
  const manifest = await mp.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const json = link ? await (await fetch(link.href)).json() : null
    const icons: string[] = json
      ? await Promise.all(
          json.icons.map(async (i: { src: string; sizes: string }) => {
            const img = new Image()
            img.src = i.src
            await img.decode()
            return `${i.sizes}=${img.naturalWidth}`
          }),
        )
      : []
    const w = window as unknown as ColorHelpers
    const hex = '#' + w.__token('--background').slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
    return { href: link?.getAttribute('href'), json, icons, tokenHex: hex, workers: (await navigator.serviceWorker.getRegistrations()).length }
  })
  const j = manifest.json
  const iconsOk = manifest.icons.includes('192x192=192') && manifest.icons.includes('512x512=512')
  record(
    'B8',
    'Web manifest',
    !!j && j.name === 'Goodreads Concept' && !!j.short_name && j.display === 'standalone' && j.start_url === '/' && iconsOk && j.theme_color === manifest.tokenHex && j.background_color === manifest.tokenHex && manifest.workers === 0,
    `${manifest.href}: "${j?.name}" / "${j?.short_name}", ${j?.display}, start_url ${j?.start_url}, icons ${manifest.icons.join(', ')}, theme and background ${j?.theme_color} = --background ${manifest.tokenHex}, service workers: ${manifest.workers}`,
  )
  await m.close()
}

/* ---------- main ---------- */

const server = await startServer()
const browser = await chromium.launch({ channel: 'chrome' })
try {
  if (process.env.QA_ONLY !== '1') for (const dir of ['screens', 'flows', 'share-cards']) fs.rmSync(path.join(OUT, dir), { recursive: true, force: true })
  // QA_ONLY=1 skips the captures; QA_PHASES=3 (or 1,3…) runs only those QA phases. For debugging the checks
  const qaOnly = process.env.QA_ONLY === '1'
  const phases = (process.env.QA_PHASES ?? '1,2,3').split(',')
  if (!qaOnly) for (const scheme of ['light', 'dark'] as const) await captureScreens(browser, scheme)
  const metrics = qaOnly ? {} : await measureFlows(browser)
  if (!qaOnly) await shareCards(browser)
  if (phases.includes('1')) await qaChecks(browser)
  if (phases.includes('2')) await qaPhase2(browser)
  if (phases.includes('3')) await qaPhase3(browser)
  const outline = audits.filter((a) => a.headings.length > 0)
  record('B3', `Heading outline on every audited screen (${audits.length})`, outline.length === 0, outline.length ? outline.map((a) => `${a.screen}: ${a.headings.join(', ')}`).join('; ') : `${audits.length} of ${audits.length} screens: one h1, no skipped level (Results skipped h1 → h3)`)

  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify({ screens: audits, contrast: contrastIssues, qa }, null, 2) + '\n')
  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2) + '\n')

  const failing = audits.filter((a) => a.overflow > 0 || a.nested > 0 || a.small.length > 0 || a.headings.length > 0)
  console.log(`Captures: ${captures}`)
  console.log('Flows:', JSON.stringify(metrics, null, 2))
  console.log(`Audit: ${audits.length} screens, ${failing.length} with issues`)
  for (const a of failing) console.log(`  ${a.screen}:`, JSON.stringify({ overflow: a.overflow, nested: a.nested, small: a.small, headings: a.headings }))
  console.log(`Text contrast: ${contrastIssues.length} failing text nodes (light + dark)`)
  for (const c of contrastIssues) console.log(`  ${c.scheme} ${c.screen}: "${c.text}" ${c.ratio} < ${c.min} (${c.fg} on ${c.bg})`)
  console.log(`QA checks (phases 1–3): ${qa.filter((c) => c.pass).length}/${qa.length} pass`)
  for (const c of qa) console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.id} ${c.check}: ${c.evidence}`)
} finally {
  await browser.close()
  stopServer(server)
}

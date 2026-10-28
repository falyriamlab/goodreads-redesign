# Visual system: Marginalia

Marginalia is the app's only visual system: covers treated as physical objects, a quiet page with one strong moment per screen, and clear, neutral states. It was picked over Night Shelf (immersive, dark-first) in the visual-pass exploration. See [the PR](https://github.com/falyriamlab/goodreads-redesign/pull/new/visual-pass) for why.

Since theme v2 it runs on the **"Goodreads 1"** palette (tweakcn): indigo on stone. Type is **sans-first**: Plus Jakarta Sans for every title and number, and Playfair Display SemiBold Italic only for Home's greeting, the book hero title and the share-card headlines.

Everything below uses theme tokens from `src/index.css`. Contrast is computed in sRGB, as browsers blend (WCAG 2.x formula).

## Palette (theme v2)

Dark mode is the theme exactly as published. Light mode changes only the L of five tokens (same chroma and hue), for contrast:

| Token | Theme (light) | Ours (light) | ≈ sRGB | Why |
|---|---|---|---|---|
| `--primary` | L 0.5854 | `oklch(0.56 0.2041 277.1173)` | `#5c5ee8` | White on it: 4.98:1 (was 4.42) |
| `--muted-foreground` | L 0.5510 | `oklch(0.50 0.0234 264.3637)` | `#5d6371` | 4.78 on `--background`, 5.50 on `--card` |
| `--muted` | L 0.9232 | `oklch(0.86 0.0026 48.7171)` | `#d2d0cf` | Same as the background in the theme: cover placeholders and bar tracks disappeared |
| `--rating` | — (ours) | `oklch(0.58 0.16 70)` | `#b46400` | Stars: 3.51 on `--background`, 4.04 on `--card` |
| `--destructive` | L 0.6368 | `oklch(0.52 0.2078 25.3313)` | `#c5081f` | Text 4.88 on `--background`, 5.61 on `--card`; white on it 6.12 (was 2.998 on the background) |

`--ring` follows `--primary` (L 0.56 in light). Dark `--rating` stays `oklch(0.80 0.16 80)`.

**In dark mode `--primary-foreground` is dark** (`#1e1b18`, the stone background), not white. Everything on `--primary` uses `text-primary-foreground` and never a literal white, so primary buttons get dark text on the lighter indigo (`#818cf8`, 5.75:1). Share cards in Brand style always use the light palette (`theme-light`), so a saved PNG looks the same whatever the app theme. The og-image and the favicon use the light indigo with white too.

## Marginalia tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--band` | `oklch(0.962 0.02 85)` (warm paper) | `oklch(0.265 0.012 67)` | Paper band (rule 1) |
| `--band-foreground` | = `--foreground` | = `--foreground` | Text on the band: **13.10 / 12.44** |
| `--band-muted-foreground` | = `--muted-foreground` | = `--muted-foreground` | Secondary text on the band: **5.38 / 6.04** |
| `--cover-shadow` | `var(--shadow-md)` | `var(--shadow-md)` | Every cover (rule 4), as `shadow-cover`: the theme's own shadow |
| `--radius-cover` | 4px | 4px | Every cover (rule 4), as `rounded-cover`. Fixed: never follows `--radius` (1.25rem) |
| `--track` | `var(--muted)` | `var(--secondary)` | Every bar's track (`bg-track`): reading, challenge, Stats, genres, share cards |
| `--placeholder` | `var(--muted)` | `var(--secondary)` | A cover with no image, the cover skeleton and the share-card loader (`bg-placeholder`) |

## Contrast (theme v2)

| Pair | Light | Dark | Needs |
|---|---|---|---|
| **Text** | | | |
| `foreground` / `background` | 11.65 | 13.91 | 4.5 |
| `foreground` / `card` | 13.41 | 11.85 | 4.5 |
| `muted-foreground` / `background` | 4.78 | 6.75 | 4.5 |
| `muted-foreground` / `card` (stat units, pace message) | 5.50 | 5.76 | 4.5 |
| `muted-foreground` / `muted` | **3.92 ✗** | 6.68 | 4.5: never muted text inside a `bg-muted` panel; use `text-foreground` (9.55 / 13.76) |
| `primary-foreground` / `primary` (main buttons) | 4.98 | 5.75 | 4.5 |
| `secondary-foreground` / `secondary` (every selected state, shelved status chip) | 5.07 | 8.12 | 4.5 |
| `foreground` / `secondary` | 9.82 | 9.71 | 4.5 |
| `accent-foreground` / `accent` (search highlight) | 8.51 | 6.54 | 4.5 |
| **Bands** | | | |
| `band-foreground` / `band` | 13.10 | 12.44 | 4.5 |
| `band-muted-foreground` / `band` | 5.38 | 6.04 | 4.5 |
| `primary` button / `band` | 4.46 | 5.14 | 3 |
| `rating` / `band` | 3.95 | 8.07 | 3 |
| **Components** | | | |
| `primary` fill / `background` (buttons, tab indicator, focus ring) | 3.97 | 5.75 | 3 |
| `primary` fill / `card` | 4.56 | 4.90 | 3 |
| Selected-state border (`muted-foreground`) / `background` | 4.78 | 6.75 | 3 |
| Progress and chart bars: `primary` fill / `track` | 3.24 | 4.01 | 3 |
| **Challenge bar: `foreground` fill / `track`** | **9.52** | **9.70** | 3 |
| Challenge bar fill / `card` | 13.41 | 11.85 | 3 |
| `rating` / `background` | 3.51 | 9.02 | 3 |
| `rating` / `card` | 4.04 | 7.69 | 3 |
| `destructive` (alert icon, destructive text) / `background` | 4.88 | 4.55 | 4.5 (light; dark is the theme's, 3.88 on `card`) |
| White / `destructive` | 6.12 | — | 4.5 (dark uses its dark `--destructive-foreground`: 4.55) |
| `primary` as text / `background` | 3.97 | 5.75 | not used as text |

Not text, for reference: `--muted` vs `--background` is 1.22 (light) and 1.01 (dark): in dark mode the theme's `--muted` is the background itself. That's why tracks and cover placeholders use `--track` and `--placeholder`, which are `--secondary` in dark (1.43 vs the background). `npm run capture` also checks every rendered text node on 37 screens (light) and 23 (dark) against 4.5:1 / 3:1.

## Rules

### 1. Paper band (`bg-band`): at most one per screen
Only for the screen's hero moment:
- the cover on the book page
- the profile header
- the Journal summary ("All time" totals)
- the import result ("8 of 10 matched")

Text on it uses `text-band-foreground` and `text-band-muted-foreground`.

### 2. The reading challenge is a card (no brand band)
There is no full-width `bg-primary` band anywhere in the app. The only place indigo fills a whole surface is the Brand share card.

`ChallengeCard` (Home and the owner's Profile):
- `bg-card`, `border-border`, the theme radius (`rounded-lg`), 20px padding, inside the 16px page gutter.
- Header: "2026 reading challenge" (`section-title`, 18px) + an underlined **See stats** link to `/profile/stats` (rule 9). Once the goal is met it reads **Raise your goal** (same destination; there's no goal editor yet).
- "38" as a stat number (36px bold) + "of 46 books" (18px regular, muted) on the same baseline.
- The bar is **ink**: `--foreground` fill on the `--track`, 8px (`ProgressBar tone="ink"`), `role="progressbar"` labelled by the heading, `aria-valuetext="38 of 46 books"`. Fill vs track 9.52 / 9.70.
- The pace message (14px, muted) keeps its copy: "2 books ahead. Lowkey slaying.", "Goal crushed. Iconic.", and so on.

### 3. Stat numbers: sans 36px bold, never more than 2 places per screen
- `stat-number` (36px bold, tabular) with its unit beside it on the baseline: `stat-unit` (18px regular) + `text-muted-foreground` (or `text-band-muted-foreground` on the band).
- Used for the reading %, the challenge count, Stats ("Books finished"), the Journal totals and the import match count.
- Smaller numbers (Profile and Stats secondary stats, book facts) are 24px or 18px bold.
- A carousel or a single `<dl>` counts as one place.

| Screen | Places |
|---|---|
| Home | Now reading %, challenge |
| Book page | Reading % |
| Profile | Challenge |
| Stats | Books finished |
| Journal | All-time totals |
| Import | Matched count |

### 4. Covers: objects, never canvases
- `BookCover` always gets `shadow-cover` (the theme's `--shadow-md`) and `rounded-cover` (4px), with no ring. The theme's `rounded-sm/md/lg` (12–20px) never applies to a cover.
- The same goes for every cover-shaped thing: share-card covers, the empty "Add a favorite" slot, the loading skeleton and the focus ring of a link that wraps a cover.
- No text sits on a cover. Status chips go under the cover, in the carousel card and in the Library grid.
- The placeholder for a missing image shows the title (sans). That placeholder is the cover itself, not an overlay.
- Covers are self-hosted copies of Open Library's (`public/covers/`, `npm run covers`), so they load with the page and are always safe to paint into the share-card canvas.

### 5. Type: sans-first, Playfair in exactly three places
**Plus Jakarta Sans** sets every title and number:

| Role | Style |
|---|---|
| Page title (TopBar h1, and h1s like the profile name or a thread) | 24px bold |
| Section h2, card titles, drawer titles (`section-title`; `DrawerTitle` defaults to it) | 18px semibold |
| Book titles in cards, rows and grids (`book-title`) | 15px semibold |
| Stat numbers (`stat-number` + `stat-unit`) | 36px bold + 18px regular, muted |

**Playfair Display SemiBold Italic** (the only cut loaded, `font-synthesis: none`) is used in exactly three places:
1. Home's greeting ("Hey, Sofía", 30px);
2. the book title in the book page hero (30px);
3. the share cards' headlines (the card headline, the book title, the top 4 titles and the big stat numbers).

Nowhere else: not in page titles, section titles, stat numbers in the app, drawers or toasts. A fourth use means changing this rule first.

Everything else in a share card (kicker, quote, "Living rent-free…", "Your vibe…", genre labels, footer and wordmark) is sans. Body text (synopsis, reviews, comments) is sans everywhere. The mono (star values, rank numbers, the invite link) is Roboto Mono.

`SectionHeader` (`src/components/common/SectionHeader.tsx`) adds an optional uppercase `kicker`, a one-line note and a right-aligned **See all** or **See {destination}** link (rule 9; 44px target, underlined).

### 6. Motion: two, both off with reduced motion
1. **Bar fill**: progress bars grow in on mount (`fill-in`, 700ms, `motion-safe:` only).
2. **Card press**: cover cards scale to 0.97 while pressed (`motion-safe:active:scale`, see `pressable` in `src/lib/ui.ts`).

With `prefers-reduced-motion: reduce`, a global rule also flattens every other animation and transition, including the entrances of drawers, menus and toasts.

### 7. Spacing scale: 5 values
| Step | px | Tailwind | Use |
|---|---|---|---|
| 1 | 4 | `1` | icon to text, tight pairs |
| 2 | 8 | `2` | items inside a component (chip rows, button pairs) |
| 3 | 16 | `4` | inside a section (`space-y-4`), card padding, page gutter (`px-4`) |
| 4 | 24 | `6` | between related blocks (form groups, settings groups, drawer sections, chapters in a buddy read) |
| 5 | 40 | `10` | between page sections (`space-y-10`), page bottom (`pb-10`) |

Bands use `py-6` (24) of padding, so they read as full-bleed moments. The challenge card uses 20px (`p-5`).

### 8. Action color: `--primary` only where it means "act" or "progress"
`--primary` is used for:
- the main action button of a view (on a Home reading card "Update progress", and "Finished it" once the last page is saved; Discover's "Show N books"; the book page's "Want to read" before a book is shelved, a drawer's submit);
- progress bars and chart bars, **except the challenge bar** (ink);
- the active tab indicator (bottom nav and line tabs);
- focus rings and switches;
- the Brand share cards.

Every **selected state** is neutral, with one recipe: `--secondary` fill, `--muted-foreground` border, `--secondary-foreground` text, semibold, and a check or an icon:
- `StatusChip` with a shelf (Want, Reading, Read, DNF): the shelf's icon + its name.
- Selected segments (`SegmentedRadio`: pacing, sort, the LogSheet status, share style) and toggle groups (feed, journal and review filters, DNF reason): a check (`SelectedCheck`).
- Chips (rule 10): filter chips (vibes, tropes, shelves including "All") get a check; the active-filter chips on Results get the × that removes them.
- The Library grid/list switch: fill + border on the pressed icon.

Your avatar and your messages are ink; everyone else's are stone.

Elements painted with `--primary` (light, at rest, counted from computed styles on the whole page), before theme v2 → after:

| View | Before | After | What changed |
|---|---|---|---|
| Home | 6 | 5 | The challenge band is now a neutral card; 2 × "Finished it", 2 reading bars and the nav indicator stay |
| Discover | 5 | 2 | "Any" pace segment and 2 shelved status chips went neutral; "Show 40 books" and the nav indicator stay |
| Library | 3 | 2 | 2 "Reading" chips went neutral; the shelf tabs' active line is now indigo (it used to be clipped and invisible) |
| Book page | 2 | 1 | The "Reading · p. 312" chip went neutral; the progress bar stays |
| **Total** | **16** | **10** | |

### 9. Copy: sentence case, one navigation verb
**Sentence case** in titles, buttons, tabs, drawer titles and toasts: only the first word and proper nouns are capitalized ("2026 reading challenge", "Edit profile", "Share card", "Added to Want to read", where "Want to read" is a shelf's name).

**Navigation uses one verb, "See"** (going to more content, on another screen or expanded in place):
- **See all** opens or expands the full list of what the section shows ("See all stats", "See all 6 reviews", "See all tropes"; on Home's For you, "See all" in the header and "See all picks" in its empty state). Screen readers get the noun when the visible label is just "See all" (For you's reads "See all picks").
- **See {destination}** goes anywhere else, named after where it lands: "See stats" (challenge card), "See content warnings".
- Never "View", "See more", "Show more" or "Go to". "Go home" is the one exception: it's a recovery action on the error and 404 screens, not browsing.
- **Show** isn't navigation: it applies a selection, switches a view or collapses ("Show 40 books" on the filters, "Show as table", "Show fewer reviews").

Tone, unchanged: Gen-Z slang only in secondary text and toasts ("Main character finish.", "Lowkey slaying."), never in buttons or errors.

### 10. One chip
`Chip` (`src/components/common/Chip.tsx`, classes in `chipVariants`) is the only chip:
- Always a pill (`rounded-full`), with a `--muted-foreground` border (4.78:1, a 3:1 boundary) and **no shadow**.
- Selected: `--secondary` fill, semibold, `--secondary-foreground` text and a leading check, or the item's own icon (a shelf status, the × on Results). Never `--primary`, never color alone.
- Visual height under 44px; `::after` extends the hit area to 44px.

| Variant | Height | Text | Used by |
|---|---|---|---|
| `filter` | 36px | 14px | Discover vibes and tropes, Library shelves, Results' active filters |
| `status` | 32px | 12px semibold | `StatusChip` on cards (a dropdown trigger, so it uses `chipVariants`) |
| `tag` | 32px | 12px | The book page's moods, pace and tropes (links into Discover) |

The "New shelf" chip is a `filter` chip with a dashed border. The book page's full-width "Want to read" is a button, not a chip.

## Accessibility guardrails (unchanged)
- Touch targets ≥ 44px. Small visuals (chips, pills, dismiss) extend their hit area with `::after`.
- Nothing interactive is nested. Cards use one stretched link plus sibling buttons raised above it.
- States are never told by color alone: weight, fill, border, icon or a word goes with them.
- Indigo (`--primary`) is never small text on the page background (3.97:1 light). It's used as a fill, a bar or an indicator.

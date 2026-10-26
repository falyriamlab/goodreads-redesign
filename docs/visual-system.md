# Visual system: Marginalia

Marginalia is the app's only visual system. It's editorial and light-first: serif display type, covers treated as physical objects, and a quiet page with one strong moment per screen. It was picked over Night Shelf (immersive, dark-first) in the visual-pass exploration. See [the PR](https://github.com/falyriamlab/goodreads-redesign/pull/new/visual-pass) for why.

Since theme v2 it runs on the **"Goodreads 1"** palette (tweakcn): indigo on stone, with Playfair Display SemiBold Italic as the display serif.

Everything below uses theme tokens from `src/index.css`. Contrast is computed in sRGB, as browsers blend (WCAG 2.x formula).

## Palette (theme v2)

Dark mode is the theme exactly as published. Light mode changes only the L of four tokens (same chroma and hue), for contrast:

| Token | Theme (light) | Ours (light) | ≈ sRGB | Why |
|---|---|---|---|---|
| `--primary` | L 0.5854 | `oklch(0.56 0.2041 277.1173)` | `#5c5ee8` | White on it: 4.98:1 (was 4.42) |
| `--muted-foreground` | L 0.5510 | `oklch(0.50 0.0234 264.3637)` | `#5d6371` | 4.78 on `--background`, 5.50 on `--card` |
| `--muted` | L 0.9232 | `oklch(0.86 0.0026 48.7171)` | `#d2d0cf` | Same as the background in the theme: cover placeholders and bar tracks disappeared |
| `--rating` | — (ours) | `oklch(0.58 0.16 70)` | `#b46400` | Stars: 3.51 on `--background`, 4.04 on `--card` |

`--ring` follows `--primary` (L 0.56 in light). Dark `--rating` stays `oklch(0.80 0.16 80)`.

**In dark mode `--primary-foreground` is dark** (`#1e1b18`, the stone background), not white. Everything on `--primary` uses `text-primary-foreground` / `bg-primary-foreground` / `tone="current"` and never a literal white: the challenge band, its stars and progress bar, and the active states of the brand band all turn dark on the lighter indigo (`#818cf8`). Share cards in Brand style always use the light palette (`theme-light`), so a saved PNG looks the same whatever the app theme.

## Marginalia tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--band` | `oklch(0.962 0.02 85)` (warm paper) | `oklch(0.265 0.012 67)` | Paper band (rule 1) |
| `--band-foreground` | = `--foreground` | = `--foreground` | Text on the band: **13.10 / 12.44** |
| `--band-muted-foreground` | = `--muted-foreground` | = `--muted-foreground` | Secondary text on the band: **5.38 / 6.04** |
| `--cover-shadow` | `var(--shadow-md)` | `var(--shadow-md)` | Every cover (rule 4), as `shadow-cover`: the theme's own shadow |
| `--radius-cover` | 4px | 4px | Every cover (rule 4), as `rounded-cover`. Fixed: never follows `--radius` (1.25rem) |

## Contrast (theme v2)

| Pair | Light | Dark | Needs |
|---|---|---|---|
| `foreground` / `background` | 11.65 | 13.91 | 4.5 |
| `foreground` / `card` | 13.41 | 11.85 | 4.5 |
| `muted-foreground` / `background` | 4.78 | 6.75 | 4.5 |
| `muted-foreground` / `card` | 5.50 | 5.76 | 4.5 |
| `muted-foreground` / `muted` | **3.92 ✗** | 6.68 | 4.5: never muted text inside a `bg-muted` panel; use `text-foreground` (9.55 / 13.76) |
| `primary-foreground` / `primary` | 4.98 | 5.75 | 4.5 |
| `secondary-foreground` / `secondary` (shelved status chip) | 5.07 | 8.12 | 4.5 |
| `foreground` / `secondary` | 9.82 | 9.71 | 4.5 |
| `accent-foreground` / `accent` (search highlight) | 8.51 | 6.54 | 4.5 |
| `primary` fill / `background` (buttons, tab indicator, focus ring) | 3.97 | 5.75 | 3 |
| `primary` fill / `card` | 4.56 | 4.90 | 3 |
| Progress bar: `primary` fill / `muted` track | 3.25 | 5.69 | 3 |
| Brand band bar: `primary-foreground` fill / 20% track | 3.46 | 4.15 | 3 |
| `rating` / `background` | 3.51 | 9.02 | 3 |
| `rating` / `card` | 4.04 | 7.69 | 3 |
| Band: `band-foreground` / `band` | 13.10 | 12.44 | 4.5 |
| Band: `band-muted-foreground` / `band` | 5.38 | 6.04 | 4.5 |
| Band: `primary` button / `band` | 4.46 | 5.14 | 3 |
| Band: `rating` / `band` | 3.95 | 8.07 | 3 |
| `destructive` (alert icon) / `background` | **2.998** | 4.55 | 3 (the icon always sits next to the error text; 3.45 on `card`) |
| `primary` as text / `background` | 3.97 | 5.75 | not used as text |

Not text, for reference: `--muted` vs `--background` is 1.22 (light) and 1.01 (dark); in dark mode the theme's `--muted` is the background itself, so placeholders and bar tracks read through their shape, shadow and the fill beside them. `npm run capture` also checks every rendered text node on 37 screens (light) and 23 (dark) against 4.5:1 / 3:1.

## Rules

### 1. Paper band (`bg-band`): at most one per screen
Only for the screen's hero moment:
- the cover on the book page
- the profile header
- the Journal summary ("All time" totals)
- the import result ("8 of 10 matched")

Text on it uses `text-band-foreground` and `text-band-muted-foreground`.

### 2. Brand band (`bg-primary text-primary-foreground`): the challenge only
- Used for the reading challenge (Home and the owner's Profile) and for the Brand share cards.
- Big text is ≥ 24px: the h2 (`section-title`), the 72px number and "of 46 books".
- The small lines (pace message, "See all") rely on the 4.98 / 5.75 pair (medium or semibold, for extra margin).
- The progress bar on the band is a `primary-foreground` fill on a 20% `primary-foreground` track (3.46 / 4.15 between fill and track); the numbers are always written next to it.
- Stars on the band use `tone="current"`, so they take `primary-foreground` (white in light, stone in dark).
- Focus rings on the band use `ring-primary-foreground`, because the indigo ring would disappear.

### 3. Display numbers (Playfair Display SemiBold Italic, 56–72px): never more than 2 places per screen
- `display-xl` (72px) is for the challenge and the Stats headline ("12 books finished").
- `display-lg` (56px) is for the reading percentage, the Journal totals and the import match count.
- Both use lining, tabular figures.
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
- The placeholder for a missing image shows the title. That placeholder is the cover itself, not an overlay.
- Covers are self-hosted copies of Open Library's (`public/covers/`, `npm run covers`), so they load with the page and are always safe to paint into the share-card canvas.

### 5. Type: one serif cut, one h2 style
- The serif is **Playfair Display SemiBold Italic** (600 italic), the only cut loaded. Every `font-serif` asks for exactly that (`font-synthesis: none`, so nothing is faked). The sans is Plus Jakarta Sans; the mono (star values, rank numbers, the invite link) is Roboto Mono.
- `section-title`: Playfair, 24px. Used by every h2 on every screen, including drawer titles (`DrawerTitle` defaults to it).
- `SectionHeader` (`src/components/common/SectionHeader.tsx`) adds an optional uppercase `kicker`, a one-line note and a right-aligned **See more / See all** link (44px target, underlined).
- Page titles (h1, in the TopBar) are Playfair at 24px. Home's greeting and the book title are larger hero h1s.
- Book titles: Playfair at 16px and up (carousels, the results grid, Now reading, the book page). **Titles at 14px stay in Plus Jakarta Sans semibold** (search results, the Library list, rows, the book shared in a message): at that size the italic loses its x-height and slants out of the search highlight.
- Body text (synopsis, reviews, comments) is sans: Playfair is a display face.

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

Bands use `py-6` (24) or `py-8` (32, the brand band) of padding, so they read as full-bleed moments.

### 8. Action color: `--primary` only where it means "act" or "progress"
`--primary` is used for:
- the main action button of a view (Home's "Finished it", Discover's "Show N books", the book page's "Want to read" before a book is shelved, a drawer's submit);
- progress bars and chart bars;
- the challenge band and the Brand share cards;
- the active tab indicator (bottom nav and line tabs);
- focus rings, and switches.

Everything that shows a **state** is neutral, and carries a check, an icon or a word:
- `StatusChip` with a shelf (Want, Reading, Read, DNF): `bg-secondary` + the shelf's icon + its name.
- Selected segments (`SegmentedRadio`: pacing, sort, the LogSheet status, share style): ink fill (`bg-foreground text-background`) + a check.
- Toggle chips (vibes, tropes) and shelf chips (including "All"): ink fill + a check.
- Your avatar and your messages: ink; everyone else: stone.

Elements painted with `--primary` (light, at rest, counted from computed styles on the whole page), before → after theme v2:

| View | Before | After | What changed |
|---|---|---|---|
| Home | 6 | 6 | Already all action or progress: 2 × "Finished it", 2 progress bars, the challenge band, the nav indicator |
| Discover | 5 | 2 | "Any" pace segment and 2 shelved status chips went neutral; "Show 40 books" and the nav indicator stay |
| Library | 3 | 2 | 2 "Reading" chips went neutral; the shelf tabs' active line is now indigo (it used to be clipped and invisible) |
| Book page | 2 | 1 | The "Reading · p. 312" chip went neutral; the progress bar stays |
| **Total** | **16** | **11** | |

## Accessibility guardrails (unchanged)
- Touch targets ≥ 44px. Small visuals (chips, pills, dismiss) extend their hit area with `::after`.
- Nothing interactive is nested. Cards use one stretched link plus sibling buttons raised above it.
- States are never told by color alone: weight, fill, icon or a word goes with them.
- Indigo (`--primary`) is never small text on the page background (3.97:1 light). It's used as a fill, a bar or an indicator.

# Visual system: Marginalia

Marginalia is the app's only visual system. It's editorial and light-first: serif display type, covers treated as physical objects, and a quiet page with one strong moment per screen. It was picked over Night Shelf (immersive, dark-first) in the visual-pass exploration. See [the PR](https://github.com/falyriamlab/goodreads-redesign/pull/new/visual-pass) for why.

Everything below uses theme tokens from `src/index.css`. Contrast is computed in sRGB, as browsers blend (WCAG 2.x formula).

## Tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--band` | `oklch(0.945 0.018 95)` | `oklch(0.272 0.014 264)` | Paper band (rule 1) |
| `--band-foreground` | `oklch(0.3211 0 0)` | `oklch(0.9219 0 0)` | Text on the band: **10.77:1 / 11.89:1** |
| `--band-muted-foreground` | `oklch(0.48 0 0)` | `oklch(0.7155 0 0)` | Secondary text on the band: **5.57:1 / 5.94:1** |
| `--cover-shadow` | 2 layers, 12% + 35% black | 2 layers, 40% + 70% black | Every cover (rule 4), as `shadow-cover` |
| `--primary` / `--primary-foreground` | existing | existing | Brand band (rule 2): **4.69:1** (`--primary` at L 0.54) |

Never put plain `--muted-foreground` on the light band: it's only 4.35:1.

Other checks on the band: stars (`--rating`, a graphic, needs 3:1) 3.19 / 7.88; the primary button fill 4.00 / 3.19; `border-muted-foreground` outlines 4.35 / 5.94.

## Rules

### 1. Paper band (`bg-band`): at most one per screen
Only for the screen's hero moment:
- the cover on the book page
- the profile header
- the Journal summary ("All time" totals)
- the import result ("8 of 10 matched")

Text on it uses `text-band-foreground` and `text-band-muted-foreground`, never `text-muted-foreground`.

### 2. Brand band (`bg-primary text-primary-foreground`): the challenge only
- Used for the reading challenge (Home and the owner's Profile) and for the Brand share cards.
- Big text is ≥ 24px: the h2 (`section-title`), the 72px number and "of 46 books".
- The small lines (pace message, "See all") rely on the 4.69:1 pair (medium or semibold, for extra margin).
- The progress bar on the band is a white fill on a 20% white track (3.37:1 between fill and track); the numbers are always written next to it.
- Focus rings on the band use `ring-primary-foreground`, because the green ring would disappear.

### 3. Display numbers (Source Serif 4, 56–72px): never more than 2 places per screen
- `display-xl` (72px) is for the challenge and the Stats headline ("12 books finished").
- `display-lg` (56px) is for the reading percentage, the Journal totals and the import match count.
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
- `BookCover` always gets `shadow-cover` and `rounded-sm`, with no ring.
- No text sits on a cover. Status chips go under the cover, in the carousel card and in the Library grid.
- The placeholder for a missing image shows the title. That placeholder is the cover itself, not an overlay.
- Share cards use the same treatment, scaled to `rounded-lg`.

### 5. Section headings: one h2 style
- `section-title`: Source Serif 4, 24px, semibold, tight tracking.
- It's used by every h2 on every screen, including drawer titles (`DrawerTitle` defaults to it).
- `SectionHeader` (`src/components/common/SectionHeader.tsx`) adds an optional uppercase `kicker`, a one-line note and a right-aligned **See more / See all** link (44px target, underlined).
- Page titles (h1, in the TopBar) are Source Serif 4 at 24px. Home's greeting and the book title are larger hero h1s.

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

## Accessibility guardrails (unchanged)
- Touch targets ≥ 44px. Small visuals (chips, pills, dismiss) extend their hit area with `::after`.
- Nothing interactive is nested. Cards use one stretched link plus sibling buttons raised above it.
- States are never told by color alone: weight, fill, icon or a word goes with them.
- Green (`--primary`) is never small text on the page background (4.46:1 light, 3.60:1 dark). It's used as a fill or a bar.

import { cva } from 'class-variance-authority'

/**
 * The one chip (docs/visual-system.md, rule 10): a pill with a --muted-foreground border (3:1 boundary) and no shadow.
 * Selected = --secondary fill + semibold + a check or the item's own icon: never color alone, never --primary.
 * - filter: 36px, toggles a filter (Discover, Library shelves, Results' active filters)
 * - status: 32px, a shelf status on a card (StatusChip)
 * - tag: 32px, a link or label (the book's moods, pace and tropes)
 * The visual pill is under 44px tall: ::after extends the hit area to 44px.
 */
export const chipVariants = cva(
  "relative inline-flex shrink-0 items-center rounded-full border border-muted-foreground transition-colors outline-none after:absolute after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        filter: 'h-9 gap-1 px-3.5 text-sm after:-inset-y-1',
        status: 'h-8 gap-1 px-3 text-xs after:-inset-y-1.5',
        tag: 'h-8 gap-1 px-3 text-xs after:-inset-y-1.5',
      },
      selected: {
        true: 'bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/80',
        false: 'bg-background font-medium text-foreground hover:bg-muted',
      },
    },
    defaultVariants: { variant: 'filter', selected: false },
  },
)

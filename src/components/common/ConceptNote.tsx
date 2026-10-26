import { cn } from '@/lib/utils'

/** Discreet disclaimer for the public deploy (Settings and the invite landing) */
export function ConceptNote({ className }: { className?: string }) {
  return (
    <footer className={cn('border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground', className)}>
      <p>Concept redesign for a UX case study. Not affiliated with Goodreads or Amazon. Book covers from Open Library.</p>
    </footer>
  )
}

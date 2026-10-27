import { useId, useState } from 'react'
import { PenLine } from 'lucide-react'
import { ReviewCard } from '@/components/book/ReviewCard'
import { useLogSheet } from '@/components/log-sheet/context'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { readers } from '@/mocks/community'
import { getReviewsForBook } from '@/mocks/reviews'
import { useLibrary, useLibraryEntry } from '@/state/library'
import type { Book } from '@/types/book'
import { SelectedCheck } from '@/components/common/SelectedCheck'

type Filter = 'friends' | 'popular' | 'recent' | 'no-spoilers'

const filters: { value: Filter; label: string }[] = [
  { value: 'friends', label: 'Friends' },
  { value: 'popular', label: 'Popular' },
  { value: 'recent', label: 'Recent' },
  { value: 'no-spoilers', label: 'No spoilers' },
]

const PREVIEW_COUNT = 3

const toggleOnClass =
  'min-h-11 border-muted-foreground px-3 font-medium group/selected data-[state=on]:border-muted-foreground data-[state=on]:bg-secondary data-[state=on]:font-semibold data-[state=on]:text-secondary-foreground'

export function ReviewsSection({ book }: { book: Book }) {
  const headingId = useId()
  const listId = useId()
  const logSheet = useLogSheet()
  const entry = useLibraryEntry(book.id)
  const [active, setActive] = useState<Filter[]>(['popular'])
  const [showAll, setShowAll] = useState(false)

  const following = useLibrary((s) => s.following)
  // "Friend" = someone you follow (same list as Community and profiles)
  const followedNames = readers.filter((r) => following.includes(r.id)).map((r) => r.name)
  const all = getReviewsForBook(book.id).map((r) => ({ ...r, author: { ...r.author, isFriend: followedNames.includes(r.author.name) } }))
  let list = all
  if (active.includes('friends')) list = list.filter((r) => r.author.isFriend)
  if (active.includes('no-spoilers')) list = list.filter((r) => !r.containsSpoilers)
  if (active.includes('popular')) list = [...list].sort((a, b) => b.likes - a.likes)
  if (active.includes('recent')) list = [...list].sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  const visible = showAll ? list : list.slice(0, PREVIEW_COUNT)

  function onFiltersChange(next: string[]) {
    const added = next.filter((v) => !active.includes(v as Filter))
    // Popular and Recent are both sort orders: picking one drops the other
    let result = next as Filter[]
    if (added.includes('popular')) result = result.filter((v) => v !== 'recent')
    if (added.includes('recent')) result = result.filter((v) => v !== 'popular')
    setActive(result)
  }

  return (
    // id="reviews": target of /book/:id#reviews; scroll-mt clears the sticky TopBar
    <section id="reviews" aria-labelledby={headingId} className="scroll-mt-16 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} tabIndex={-1} className="section-title outline-none">
          Reviews
        </h2>
        <Button
          variant="outline"
          className="min-h-11 border-muted-foreground"
          onClick={(e) =>
            logSheet.open(book.id, {
              focus: 'review',
              intent: entry.status ?? undefined,
              returnFocus: e.currentTarget,
            })
          }
        >
          <PenLine aria-hidden="true" />
          Write a review
        </Button>
      </div>

      <ToggleGroup
        type="multiple"
        variant="outline"
        aria-label="Filter and sort reviews"
        value={active}
        onValueChange={onFiltersChange}
        className="flex w-full flex-wrap"
      >
        {filters.map((f) => (
          <ToggleGroupItem key={f.value} value={f.value} className={toggleOnClass}>
            <SelectedCheck />
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div id={listId} className="space-y-3">
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No reviews match these filters. Try loosening them up.
          </p>
        ) : (
          visible.map((review) => <ReviewCard key={review.id} review={review} />)
        )}
      </div>

      {list.length > PREVIEW_COUNT && (
        <Button
          variant="outline"
          className="min-h-11 w-full border-muted-foreground"
          aria-expanded={showAll}
          aria-controls={listId}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Show fewer reviews' : `See all ${list.length} reviews`}
        </Button>
      )}
    </section>
  )
}

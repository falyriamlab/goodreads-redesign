import { useId, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalize } from '@/lib/search'

export type FilterOption = { value: string; label: string }

type FilterDrawerProps = {
  title: string
  description: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
  onClear: () => void
  /** Adds a search field (long lists like tropes) */
  searchable?: boolean
  /** The element that opens the drawer (rendered as the trigger) */
  trigger: ReactNode
}

/** Bottom sheet with a checkbox list. Selections apply live; focus returns to the trigger on close. */
export function FilterDrawer({ title, description, options, selected, onToggle, onClear, searchable, trigger }: FilterDrawerProps) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const listId = useId()
  const visible = query ? options.filter((o) => normalize(o.label).includes(normalize(query))) : options

  return (
    <Drawer autoFocus onOpenChange={(open) => !open && setQuery('')}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="mx-auto max-h-[85dvh] w-full max-w-app">
        <DrawerHeader className="text-left">
          <DrawerTitle className="section-title">{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        {searchable && (
          <div className="relative px-4 pb-2">
            <Label htmlFor={searchId} className="sr-only">
              Search {title.toLowerCase()}
            </Label>
            <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
              aria-controls={listId}
              className="min-h-11 border-muted-foreground pl-9 text-base"
            />
          </div>
        )}

        <div data-vaul-no-drag className="flex-1 overflow-y-auto px-4">
          <ul id={listId} aria-label={title}>
            {visible.map((o) => {
              const id = `${listId}-${o.value}`
              return (
                <li key={o.value} className="flex min-h-11 items-center gap-3 border-b border-border last:border-b-0">
                  <Checkbox
                    id={id}
                    checked={selected.includes(o.value)}
                    onCheckedChange={() => onToggle(o.value)}
                    className="size-5 border-muted-foreground"
                  />
                  <Label htmlFor={id} className="min-h-11 flex-1 text-base font-normal">
                    {o.label}
                  </Label>
                </li>
              )
            })}
          </ul>
          {visible.length === 0 && <p className="py-4 text-sm text-muted-foreground">Nothing matches "{query}".</p>}
        </div>

        <DrawerFooter className="grid grid-cols-2 gap-3 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button variant="outline" size="lg" className="min-h-11 border-muted-foreground" disabled={selected.length === 0} onClick={onClear}>
            Clear
          </Button>
          <DrawerClose asChild>
            <Button size="lg" className="min-h-11">
              Done
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

import { useId, type ReactNode } from 'react'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
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
import { Label } from '@/components/ui/label'
import { EMPTY_LIBRARY_FILTER, type LibraryFilter } from '@/lib/libraryView'

type Props = {
  value: LibraryFilter
  onChange: (next: LibraryFilter) => void
  genres: string[]
  /** Only on the Read shelf */
  years: number[] | null
  trigger: ReactNode
}

const RATINGS = [
  { value: 'any', label: 'Any' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '4.5', label: '4.5+' },
]

export function LibraryFilterDrawer({ value, onChange, genres, years, trigger }: Props) {
  const ids = { genre: useId(), year: useId(), rating: useId() }
  const toggleGenre = (g: string) =>
    onChange({ ...value, genres: value.genres.includes(g) ? value.genres.filter((x) => x !== g) : [...value.genres, g] })

  return (
    <Drawer autoFocus>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="mx-auto max-h-[85dvh] w-full max-w-app">
        <DrawerHeader className="text-left">
          <DrawerTitle className="section-title">Filter</DrawerTitle>
          <DrawerDescription>Narrow down this shelf. Filters apply as you pick.</DrawerDescription>
        </DrawerHeader>
        <div data-vaul-no-drag className="flex-1 space-y-6 overflow-y-auto px-4 pb-2">
          <fieldset className="space-y-1">
            <legend id={ids.genre} className="text-sm font-semibold">
              Genre
            </legend>
            {genres.map((g) => {
              const id = `${ids.genre}-${g}`
              return (
                <div key={g} className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id={id}
                    checked={value.genres.includes(g)}
                    onCheckedChange={() => toggleGenre(g)}
                    className="size-5 border-muted-foreground"
                  />
                  <Label htmlFor={id} className="min-h-11 flex-1 text-base font-normal">
                    {g}
                  </Label>
                </div>
              )
            })}
          </fieldset>

          {years && years.length > 0 && (
            <div className="space-y-2">
              <p id={ids.year} className="text-sm font-semibold">
                Year read
              </p>
              <SegmentedRadio
                labelledBy={ids.year}
                value={value.year === null ? 'any' : String(value.year)}
                onChange={(v) => onChange({ ...value, year: v === 'any' ? null : Number(v) })}
                options={[{ value: 'any', label: 'Any' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
                className="[&>button]:text-sm"
              />
            </div>
          )}

          <div className="space-y-2">
            <p id={ids.rating} className="text-sm font-semibold">
              Minimum rating
            </p>
            <SegmentedRadio
              labelledBy={ids.rating}
              value={value.minRating === null ? 'any' : String(value.minRating)}
              onChange={(v) => onChange({ ...value, minRating: v === 'any' ? null : Number(v) })}
              options={RATINGS}
              className="[&>button]:text-sm"
            />
          </div>
        </div>
        <DrawerFooter className="grid grid-cols-2 gap-3 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button
            variant="outline"
            size="lg"
            className="min-h-11 border-muted-foreground"
            onClick={() => onChange(EMPTY_LIBRARY_FILTER)}
          >
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

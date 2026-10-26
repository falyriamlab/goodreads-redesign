import { useId, useMemo, useState, type ChangeEvent } from 'react'
import { CircleAlert, FileUp } from 'lucide-react'
import { toast } from 'sonner'
import { BookCover } from '@/components/book/BookCover'
import { statusMeta } from '@/components/book/statusMeta'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import {
  matchRows,
  parseLibraryCsv,
  planImport,
  toImportItems,
  type ConflictPolicy,
  type ImportFormat,
  type ImportRow,
  type MatchedRow,
} from '@/lib/importCsv'
import { formatShortDate } from '@/lib/date'
import { formatRating } from '@/lib/rating'
import { books } from '@/mocks/books'
import { useLibrary } from '@/state/library'

const SAMPLE_URL = '/samples/goodreads_export_sample.csv'
const FORMAT_LABEL: Record<ImportFormat, string> = { goodreads: 'Goodreads', storygraph: 'StoryGraph' }

type Parsed = { format: ImportFormat; total: number; matched: MatchedRow[]; unmatched: ImportRow[]; fileName: string }

export function ImportDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const entries = useLibrary((s) => s.entries)
  const importBooks = useLibrary((s) => s.importBooks)
  const takeSnapshot = useLibrary((s) => s.takeSnapshot)
  const restoreSnapshot = useLibrary((s) => s.restoreSnapshot)
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [error, setError] = useState('')
  const [policy, setPolicy] = useState<ConflictPolicy>('keep')
  const ids = { file: useId(), error: useId(), policy: useId(), policyHelp: useId() }

  const plan = useMemo(() => (parsed ? planImport(parsed.matched, entries, policy) : []), [parsed, entries, policy])
  const items = toImportItems(plan)
  const conflicts = plan.filter((p) => p.existing).length

  function load(text: string, fileName: string) {
    const { format, rows } = parseLibraryCsv(text)
    if (!format || rows.length === 0) {
      setParsed(null)
      setError("We couldn't read that file. Upload the CSV export from Goodreads or StoryGraph.")
      return
    }
    setError('')
    setParsed({ format, total: rows.length, fileName, ...matchRows(rows, books) })
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) load(await file.text(), file.name)
    e.target.value = ''
  }

  async function trySample() {
    const res = await fetch(SAMPLE_URL)
    load(await res.text(), 'goodreads_export_sample.csv')
  }

  function reset() {
    setParsed(null)
    setError('')
    setPolicy('keep')
  }

  function apply() {
    const snapshot = takeSnapshot()
    importBooks(items)
    toast(`Imported ${items.length} ${items.length === 1 ? 'book' : 'books'}.`, {
      action: { label: 'Undo', onClick: () => restoreSnapshot(snapshot) },
    })
    onOpenChange(false)
    reset()
  }

  return (
    <Drawer
      open={open}
      autoFocus
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <DrawerContent className="mx-auto max-h-[92dvh] w-full max-w-app">
        <DrawerHeader className="text-left">
          <DrawerTitle className="section-title">Import your library</DrawerTitle>
          <DrawerDescription>Bring your history from Goodreads or StoryGraph. Upload the CSV export.</DrawerDescription>
        </DrawerHeader>

        {!parsed ? (
          <div className="space-y-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="space-y-1.5">
              <label htmlFor={ids.file} className="text-sm font-semibold">
                CSV export file
              </label>
              <input
                id={ids.file}
                type="file"
                accept=".csv,text/csv"
                onChange={onFile}
                aria-describedby={error ? ids.error : undefined}
                aria-invalid={error ? true : undefined}
                className="block min-h-11 w-full rounded-lg border border-muted-foreground bg-card p-1.5 text-sm file:mr-3 file:min-h-9 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-semibold file:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </div>
            {error && (
              <p id={ids.error} role="alert" className="flex items-start gap-1.5 text-sm font-medium">
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                {error}
              </p>
            )}
            <Button variant="outline" className="min-h-11 w-full border-muted-foreground" onClick={trySample}>
              <FileUp aria-hidden="true" />
              Try with a sample file
            </Button>
            <p className="text-xs text-muted-foreground">
              Goodreads: My Books → Import and export → Export library. StoryGraph: Manage account → Export StoryGraph library.
            </p>
          </div>
        ) : (
          <>
            <div data-vaul-no-drag className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
              {/* Rule 1: the import result is this screen's paper band, with the match count as its display number */}
              <div className="-mx-4 bg-band px-4 py-5 text-band-foreground">
                <p aria-live="polite" className="flex items-baseline gap-2">
                  <span className="sr-only">Matched </span>
                  <span className="display-lg">{parsed.matched.length}</span>
                  <span className="font-serif text-2xl">of {parsed.total} matched</span>
                </p>
                <p className="mt-1 text-sm text-band-muted-foreground">
                  {FORMAT_LABEL[parsed.format]} export · {parsed.fileName}
                </p>
              </div>

              {conflicts > 0 && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <p id={ids.policy} className="text-sm font-semibold">
                    Already in your library
                  </p>
                  <p id={ids.policyHelp} className="text-sm text-muted-foreground">
                    {conflicts} {conflicts === 1 ? 'book is' : 'books are'} on your shelves already. Applies to all of them.
                  </p>
                  <SegmentedRadio
                    labelledBy={ids.policy}
                    describedBy={ids.policyHelp}
                    value={policy}
                    onChange={setPolicy}
                    options={[
                      { value: 'keep', label: 'Keep mine' },
                      { value: 'use', label: 'Use imported' },
                    ]}
                    className="[&>button]:text-sm"
                  />
                </div>
              )}

              <section aria-labelledby="import-matched" className="space-y-4">
                <h3 id="import-matched" className="text-sm font-semibold">
                  Matches
                </h3>
                <ul className="divide-y divide-border">
                  {plan.map((p) => (
                    <li key={p.book.id} className="flex items-center gap-3 py-2">
                      <BookCover book={p.book} size="sm" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-semibold">{p.book.title}</p>
                        <p className="text-xs">
                          {statusMeta[p.row.status].label}
                          {p.row.rating !== null && ` · ${formatRating(p.row.rating)} stars`}
                          {p.row.dateRead && ` · ${formatShortDate(p.row.dateRead)}`}
                        </p>
                        {p.existing && (
                          <p className="text-xs text-muted-foreground">
                            {p.apply ? 'Replaces' : 'Skipped, keeping'} your {statusMeta[p.existing.status!].label}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {parsed.unmatched.length > 0 && (
                <section aria-labelledby="import-unmatched" className="space-y-4 rounded-lg bg-muted p-3">
                  <h3 id="import-unmatched" className="text-sm font-semibold">
                    Couldn't match ({parsed.unmatched.length})
                  </h3>
                  <p className="text-xs">
                    These aren't in our catalog yet. Nothing about them was imported; you can add them from Search later.
                  </p>
                  <ul className="space-y-1 text-sm">
                    {parsed.unmatched.map((r) => (
                      <li key={`${r.title}-${r.author}`}>
                        {r.title} <span>· {r.author}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <DrawerFooter className="grid grid-cols-2 gap-3 border-t border-border pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button variant="outline" size="lg" className="min-h-11 border-muted-foreground" onClick={reset}>
                Choose another file
              </Button>
              <Button size="lg" className="min-h-11" disabled={items.length === 0} onClick={apply}>
                Import {items.length} {items.length === 1 ? 'book' : 'books'}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

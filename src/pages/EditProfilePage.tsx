import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CircleAlert, Plus, X } from 'lucide-react'
import { useBlocker, useNavigate } from 'react-router'
import { toast } from '@/lib/toast'
import { SortableBookList } from '@/components/common/SortableBookList'
import { TopBar } from '@/components/layout/TopBar'
import { FavoritePickerDrawer } from '@/components/profile/FavoritePickerDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { addFavorite, BIO_MAX, MAX_FAVORITES, moveFavorite, removeFavorite, validateHandle } from '@/lib/profile'
import { getBookById } from '@/mocks/books'
import { useLibrary } from '@/state/library'
import type { Book } from '@/types/book'
import type { Profile, ProfileSection } from '@/types/profile'

const SECTIONS: { value: ProfileSection; label: string }[] = [
  { value: 'reviews', label: 'Reviews' },
  { value: 'lists', label: 'Lists' },
  { value: 'journal', label: 'Journal' },
  { value: 'stats', label: 'Stats' },
]

const field = 'min-h-11 border-muted-foreground text-base'

export function EditProfilePage() {
  const navigate = useNavigate()
  const saved = useLibrary((s) => s.profile)
  const updateProfile = useLibrary((s) => s.updateProfile)
  const [draft, setDraft] = useState<Profile>(saved)
  const [handleError, setHandleError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  // A ref, not state: navigate() runs before a re-render, and the blocker must already know
  const savingRef = useRef(false)
  const handleRef = useRef<HTMLInputElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const ids = { name: useId(), handle: useId(), handleError: useId(), city: useId(), bio: useId(), bioCount: useId(), top4: useId() }

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  // In-page "Discard changes?" for any navigation away (back, tabs, Cancel) while dirty
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !savingRef.current && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (blocker.state === 'blocked') keepRef.current?.focus()
  }, [blocker.state])

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft((d) => ({ ...d, [key]: value }))
  const favorites = draft.favorites.map((id) => getBookById(id)).filter((b): b is Book => Boolean(b))

  function save(e: FormEvent) {
    e.preventDefault()
    const error = validateHandle(draft.handle)
    setHandleError(error)
    if (error) {
      handleRef.current?.focus()
      return
    }
    updateProfile(draft)
    savingRef.current = true
    toast('Profile saved.')
    navigate('/profile')
  }

  return (
    <>
      <TopBar title="Edit profile" back backFallback="/profile" />
      <form onSubmit={save} noValidate className="space-y-6 px-4 pt-4 pb-8">
        <div className="space-y-1.5">
          <Label htmlFor={ids.name}>Name</Label>
          <Input id={ids.name} value={draft.displayName} onChange={(e) => set('displayName', e.target.value)} maxLength={40} className={field} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={ids.handle}>Handle</Label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
              @
            </span>
            <Input
              ref={handleRef}
              id={ids.handle}
              value={draft.handle}
              onChange={(e) => {
                set('handle', e.target.value)
                // Re-validate live once an error is showing, so it clears as soon as it's fixed
                if (handleError) setHandleError(validateHandle(e.target.value))
              }}
              onBlur={() => setHandleError(validateHandle(draft.handle))}
              autoCapitalize="none"
              autoComplete="username"
              spellCheck={false}
              aria-invalid={handleError ? true : undefined}
              aria-describedby={handleError ? ids.handleError : undefined}
              className={`${field} pl-7`}
            />
          </div>
          {handleError && (
            <p id={ids.handleError} className="flex items-start gap-1.5 text-sm font-medium">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              {handleError}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={ids.city}>City</Label>
          <Input id={ids.city} value={draft.city} onChange={(e) => set('city', e.target.value)} maxLength={40} className={field} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={ids.bio}>Bio</Label>
          <Textarea
            id={ids.bio}
            value={draft.bio}
            maxLength={BIO_MAX}
            onChange={(e) => set('bio', e.target.value.slice(0, BIO_MAX))}
            aria-describedby={ids.bioCount}
            className={`${field} min-h-24`}
          />
          <p id={ids.bioCount} aria-live="polite" className="text-right text-xs text-muted-foreground tabular-nums">
            {draft.bio.length}/{BIO_MAX}
          </p>
        </div>

        {/* min-w-0: a fieldset is min-content wide by default, which pushed long titles past 320px */}
        <fieldset className="min-w-0 space-y-2">
          <legend id={ids.top4} className="text-sm font-semibold">
            Top 4
          </legend>
          {favorites.length > 0 && (
            <SortableBookList
              books={favorites}
              label="Top 4, in order"
              linkTitles={false}
              onMove={(bookId, toIndex) => set('favorites', moveFavorite(draft.favorites, bookId, toIndex))}
              renderAction={(b) => (
                <button
                  type="button"
                  aria-label={`Remove ${b.title} from top 4`}
                  onClick={() => set('favorites', removeFavorite(draft.favorites, b.id))}
                  className="flex size-11 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              )}
            />
          )}
          {draft.favorites.length < MAX_FAVORITES && (
            <Button type="button" variant="outline" className="min-h-11 w-full border-dashed border-muted-foreground" onClick={() => setPickerOpen(true)}>
              <Plus aria-hidden="true" />
              Add a favorite ({draft.favorites.length}/{MAX_FAVORITES})
            </Button>
          )}
        </fieldset>

        <fieldset className="min-w-0 space-y-1">
          <legend className="text-sm font-semibold">Show on my profile</legend>
          <p className="text-xs text-muted-foreground">Hidden sections stay visible to you, marked "Only you".</p>
          {SECTIONS.map((s) => {
            const id = `${ids.top4}-${s.value}`
            return (
              <div key={s.value} className="flex min-h-11 items-center justify-between gap-3">
                <Label htmlFor={id} className="min-h-11 flex-1 text-base font-normal">
                  {s.label}
                </Label>
                <Switch
                  id={id}
                  checked={draft.publicSections[s.value]}
                  onCheckedChange={(checked) => set('publicSections', { ...draft.publicSections, [s.value]: checked })}
                />
              </div>
            )
          })}
        </fieldset>

        {blocker.state === 'blocked' ? (
          // In-page confirmation, never window.confirm
          <div role="alertdialog" aria-labelledby="discard-title" className="space-y-3 rounded-xl border border-foreground bg-card p-4">
            <p id="discard-title" className="font-semibold">
              Discard changes?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button ref={keepRef} type="button" variant="outline" size="lg" className="min-h-11 border-muted-foreground" onClick={() => blocker.reset()}>
                Keep editing
              </Button>
              <Button type="button" size="lg" className="min-h-11" onClick={() => blocker.proceed()}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" size="lg" className="min-h-11 border-muted-foreground" onClick={() => navigate('/profile')}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="min-h-11">
              Save
            </Button>
          </div>
        )}
      </form>

      <FavoritePickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        exclude={draft.favorites}
        onPick={(id) => set('favorites', addFavorite(draft.favorites, id))}
      />
    </>
  )
}

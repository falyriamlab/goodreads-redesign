import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Download, Headphones, LogOut, RotateCcw, Tablet } from 'lucide-react'
import { toast } from 'sonner'
import { SegmentedRadio } from '@/components/common/SegmentedRadio'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { setDemoClock, useDemoClock } from '@/lib/clock'
import { downloadText, exportLibraryCsv } from '@/lib/exportCsv'
import { todayISO } from '@/lib/date'
import type { ThemeMode } from '@/lib/theme'
import { useLibrary } from '@/state/library'

const NOTIFICATIONS = [
  { id: 'replies', label: 'Replies' },
  { id: 'likes', label: 'Likes on reviews' },
  { id: 'friends', label: 'Friend activity' },
  { id: 'releases', label: 'New releases' },
]

export function SettingsPage() {
  const demoClock = useDemoClock()
  const themeMode = useLibrary((s) => s.themeMode)
  const setThemeMode = useLibrary((s) => s.setThemeMode)
  const entries = useLibrary((s) => s.entries)
  // Mock preferences: not persisted
  const [notify, setNotify] = useState<Record<string, boolean>>({ replies: true, likes: true, friends: false, releases: true })
  const [confirmReset, setConfirmReset] = useState(false)
  const cancelResetRef = useRef<HTMLButtonElement>(null)
  const appearanceId = useId()

  useEffect(() => {
    if (confirmReset) cancelResetRef.current?.focus()
  }, [confirmReset])

  function exportCsv() {
    downloadText(exportLibraryCsv(entries), `goodreads_library_export_${todayISO()}.csv`)
    toast('Library exported.')
  }

  return (
    <>
      <TopBar title="Settings" back backFallback="/profile" />
      <div className="space-y-6 px-4 pt-4 pb-8">
        <Group title="Appearance">
          <p id={appearanceId} className="sr-only">
            Theme
          </p>
          <SegmentedRadio
            labelledBy={appearanceId}
            value={themeMode}
            onChange={(v) => setThemeMode(v as ThemeMode)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
            className="[&>button]:text-sm"
          />
          <p className="text-xs text-muted-foreground">System follows your device setting.</p>
        </Group>

        <Group title="Notifications">
          {NOTIFICATIONS.map((n) => {
            const id = `notify-${n.id}`
            return (
              <div key={n.id} className="flex min-h-11 items-center justify-between gap-3">
                <Label htmlFor={id} className="min-h-11 flex-1 text-base font-normal">
                  {n.label}
                </Label>
                <Switch id={id} checked={notify[n.id]} onCheckedChange={(checked) => setNotify((s) => ({ ...s, [n.id]: checked }))} />
              </div>
            )
          })}
        </Group>

        <Group title="Connections">
          {[
            { name: 'Kindle', icon: <Tablet aria-hidden="true" /> },
            { name: 'Audible', icon: <Headphones aria-hidden="true" /> },
          ].map((c) => (
            <div key={c.name} className="flex min-h-14 items-center gap-3 [&>svg]:size-5">
              {c.icon}
              <span className="flex-1 text-sm font-semibold">{c.name}</span>
              <Button variant="outline" className="min-h-11 border-muted-foreground" onClick={() => toast('Coming soon.')}>
                Connect<span className="sr-only"> {c.name}</span>
              </Button>
            </div>
          ))}
        </Group>

        <Group title="Data">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <Label htmlFor="demo-clock" className="min-h-11 flex-1 text-base font-normal">
              Demo clock (Oct 16, 2026)
            </Label>
            <Switch id="demo-clock" checked={demoClock} onCheckedChange={setDemoClock} aria-describedby="demo-clock-hint" />
          </div>
          <p id="demo-clock-hint" className="text-xs text-muted-foreground">
            Keeps the sample data fresh: "2h ago" stays 2h ago. Turn it off to use today's date.
          </p>
          <Button variant="outline" className="min-h-11 w-full justify-start border-muted-foreground" onClick={exportCsv}>
            <Download aria-hidden="true" />
            Export my library (CSV)
          </Button>
          <p className="text-xs text-muted-foreground">Goodreads format, so you can import it here or anywhere else.</p>
          {confirmReset ? (
            <div role="group" aria-label="Confirm reset" className="space-y-2 rounded-lg bg-muted p-3">
              <p className="text-sm">Reset all demo data? Your shelves, journal and profile go back to the sample.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button ref={cancelResetRef} variant="outline" className="min-h-11 border-muted-foreground" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button
                  className="min-h-11"
                  onClick={() => {
                    try {
                      localStorage.clear()
                    } catch {
                      // Storage blocked: reload still resets in-memory state
                    }
                    window.location.reload()
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="min-h-11 w-full justify-start border-muted-foreground" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden="true" />
              Reset demo data
            </Button>
          )}
        </Group>

        <Group title="Account">
          <Button variant="outline" className="min-h-11 w-full justify-start border-muted-foreground" onClick={() => toast("You're signed out. Just kidding, it's a prototype.")}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </Group>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="section-title">
        {title}
      </h2>
      <div className="space-y-2 rounded-xl border border-border bg-card p-3 text-card-foreground">{children}</div>
    </section>
  )
}

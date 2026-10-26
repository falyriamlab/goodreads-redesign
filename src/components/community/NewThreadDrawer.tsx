import { CircleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  /** Returns false if the thread couldn't be created */
  onSubmit: (title: string, body: string) => boolean
}

const TITLE_MAX = 100

export function NewThreadDrawer({ open, onOpenChange, groupName, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ids = { title: useId(), body: useId(), error: useId() }

  function reset() {
    setTitle('')
    setBody('')
    setError(null)
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
      <DrawerContent className="mx-auto max-h-[90dvh] w-full max-w-app">
        <DrawerHeader className="text-left">
          <DrawerTitle className="section-title">New thread</DrawerTitle>
          <DrawerDescription>Posting in {groupName}.</DrawerDescription>
        </DrawerHeader>
        <form
          data-vaul-no-drag
          noValidate
          className="space-y-4 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !body.trim()) {
              setError(!title.trim() ? 'Add a title.' : 'Add a message.')
              document.getElementById(!title.trim() ? ids.title : ids.body)?.focus()
              return
            }
            if (onSubmit(title, body)) reset()
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor={ids.title} className="text-sm font-semibold">
              Title
            </label>
            <Input
              id={ids.title}
              value={title}
              maxLength={TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={error === 'Add a title.' || undefined}
              aria-describedby={error ? ids.error : undefined}
              className="min-h-11 border-muted-foreground text-base"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={ids.body} className="text-sm font-semibold">
              Message
            </label>
            <Textarea
              id={ids.body}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={error === 'Add a message.' || undefined}
              aria-describedby={error ? ids.error : undefined}
              rows={5}
              className="min-h-32 border-muted-foreground text-base"
            />
          </div>
          {error && (
            <p id={ids.error} role="alert" className="flex items-center gap-1.5 text-sm font-semibold">
              <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden="true" />
              {error}
            </p>
          )}
          <Button type="submit" className="min-h-11 w-full">
            Post thread
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

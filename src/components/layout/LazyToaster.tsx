import { useEffect, useState } from 'react'
import type { ToasterProps } from 'sonner'
import { whenIdle } from '@/lib/idle'
import { loadSonner, onToasterRequest } from '@/lib/toast'

type ToasterModule = typeof import('@/components/ui/sonner')

/**
 * The Toaster mounts on the first toast or in idle time, so sonner isn't part of the initial bundle (lib/toast).
 * Not React.lazy: a Suspense boundary would hold the first toast back ~300ms. A failed load (offline) renders
 * nothing instead of throwing, since this sits above every route's error screen.
 */
export function LazyToaster(props: ToasterProps) {
  const [mod, setMod] = useState<ToasterModule | null>(null)
  useEffect(() => {
    if (mod) return
    let cancelled = false
    const load = () => {
      loadSonner()
        .then(() => import('@/components/ui/sonner'))
        .then(
          (m) => !cancelled && setMod(m),
          () => {},
        )
    }
    const cancelIdle = whenIdle(load)
    const unsubscribe = onToasterRequest(load)
    return () => {
      cancelled = true
      cancelIdle()
      unsubscribe()
    }
  }, [mod])
  return mod ? <mod.Toaster {...props} /> : null
}

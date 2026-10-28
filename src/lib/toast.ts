import type { ExternalToast } from 'sonner'

type Sonner = typeof import('sonner')
type Message = Parameters<Sonner['toast']>[0]

/**
 * sonner stays out of the initial bundle: it loads on the first toast, or in idle time (whichever comes first),
 * together with the Toaster (LazyToaster). A toast fired before the Toaster mounts isn't lost: sonner replays
 * the active toasts to a Toaster that subscribes late.
 */
let sonner: Promise<Sonner> | undefined
const toasterRequests = new Set<() => void>()

export function loadSonner(): Promise<Sonner> {
  sonner ??= import('sonner').catch((error: unknown) => {
    sonner = undefined // offline or a stale deploy: the next toast tries again
    throw error
  })
  return sonner
}

/** LazyToaster listens here, so the first toast mounts it right away instead of waiting for idle time */
export function onToasterRequest(listener: () => void) {
  toasterRequests.add(listener)
  return () => {
    toasterRequests.delete(listener)
  }
}

export function toast(message: Message, data?: ExternalToast) {
  toasterRequests.forEach((listener) => listener())
  loadSonner().then(
    (m) => m.toast(message, data),
    () => {},
  )
}

toast.dismiss = (id?: string | number) => {
  // Nothing to dismiss if sonner never loaded
  sonner?.then(
    (m) => m.toast.dismiss(id),
    () => {},
  )
}

import { useEffect } from 'react'
import { toast } from '@/lib/toast'
import { useOnline } from '@/lib/useOnline'

const TOAST_ID = 'offline'

/** While offline, a persistent toast (announced like every toast); it goes away when the connection is back */
export function OfflineNotice() {
  const online = useOnline()
  useEffect(() => {
    if (online) toast.dismiss(TOAST_ID)
    else toast("You're offline. Some pages may not load.", { id: TOAST_ID, duration: Infinity })
  }, [online])
  return null
}

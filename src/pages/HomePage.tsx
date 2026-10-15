import { Bell, MessageCircle } from 'lucide-react'
import { TopBar, TopBarIconButton } from '@/components/layout/TopBar'

export function HomePage() {
  return (
    <TopBar
      title="Home"
      actions={
        <>
          <TopBarIconButton label="Notifications" icon={<Bell aria-hidden="true" />} />
          <TopBarIconButton label="Messages" icon={<MessageCircle aria-hidden="true" />} />
        </>
      }
    />
  )
}

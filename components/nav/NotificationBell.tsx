import Link from 'next/link'
import { Bell } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

/**
 * Server component — fetches unread count on every render.
 * Wrapped by Navbar (which is a client component) via a Suspense boundary,
 * but rendered server-side on each page navigation.
 */
export async function NotificationBell() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null)
    .eq('channel', 'in_app')

  const unread = count ?? 0

  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
      data-testid="notification-bell"
      className={cn(
        'relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground',
        'transition-colors hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
      {unread > 0 && (
        <span
          data-testid="unread-badge"
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}

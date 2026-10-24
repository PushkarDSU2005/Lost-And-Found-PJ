import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Bell, CheckCheck, MessageSquare, FileCheck, Package, AlertTriangle } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { markNotificationsRead } from '@/app/actions/messages'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Notification } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Notifications',
}

// Map event type → icon + label
const EVENT_META: Record<string, { icon: typeof Bell; label: string }> = {
  claim_submitted: { icon: FileCheck,     label: 'New claim on your item'   },
  claim_approved:  { icon: CheckCheck,    label: 'Claim approved'           },
  claim_rejected:  { icon: AlertTriangle, label: 'Claim rejected'           },
  claim_withdrawn: { icon: FileCheck,     label: 'Claim withdrawn'          },
  item_returned:   { icon: Package,       label: 'Item marked as returned'  },
  message_sent:    { icon: MessageSquare, label: 'New message'              },
}

function notifLink(n: Notification): string {
  const p = n.payload as Record<string, string>
  if (n.event_type === 'message_sent' && p.claim_id && p.item_id) {
    return `/items/${p.item_id}/claims/${p.claim_id}`
  }
  if (p.item_id && p.claim_id) {
    return `/items/${p.item_id}/claims`
  }
  if (p.item_id) return `/items/${p.item_id}`
  return '/notifications'
}

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = getSafeRedirectPath('/notifications', '/notifications')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, user_id, channel, event_type, payload, read_at, created_at')
    .eq('user_id', user.id)
    .eq('channel', 'in_app')
    .order('created_at', { ascending: false })
    .limit(50)

  const notifs = (notifications ?? []) as Notification[]
  const unreadIds = notifs.filter((n) => !n.read_at).map((n) => n.id)

  // Mark all as read on page load (server action)
  if (unreadIds.length > 0) {
    await markNotificationsRead(unreadIds)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        {notifs.length > 0 && (
          <span className="text-xs text-muted-foreground">{notifs.length} total</span>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
          <Bell className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <ul className="space-y-1" aria-label="Notifications" role="list">
          {notifs.map((n) => {
            const meta = EVENT_META[n.event_type] ?? { icon: Bell, label: n.event_type }
            const Icon = meta.icon
            const payload = n.payload as Record<string, string>
            const wasUnread = unreadIds.includes(n.id)

            return (
              <li key={n.id}>
                <Link
                  href={notifLink(n)}
                  data-testid="notification-item"
                  data-event={n.event_type}
                  className={cn(
                    'flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted/60',
                    wasUnread && 'bg-primary/5',
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                    wasUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                  )}>
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', wasUnread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                      {meta.label}
                    </p>
                    {payload.item_title && (
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {payload.item_title}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(n.created_at), 'd MMM yyyy · HH:mm')}
                    </p>
                  </div>
                  {wasUnread && (
                    <span
                      aria-label="Unread"
                      className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                    />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

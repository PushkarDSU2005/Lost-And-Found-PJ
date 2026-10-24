import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ShieldAlert } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { MessageThread } from '@/components/messaging/MessageThread'
import { MessageInput } from '@/components/messaging/MessageInput'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

const CLAIM_STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved:  'bg-[--color-found] text-[--color-found-foreground]',
  rejected:  'bg-destructive/10 text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
}

interface PageProps {
  params: Promise<{ id: string; claimId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('items').select('title').eq('id', id).single()
  return { title: data ? `Chat — ${data.title}` : 'Chat' }
}

export default async function ChatPage({ params }: PageProps) {
  const { id, claimId } = await params
  const supabase = await createSupabaseServerClient()

  // Auth gate
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = getSafeRedirectPath(`/items/${id}/claims/${claimId}`, '/items')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  // Load claim with item info and claimant
  const { data: claim } = await supabase
    .from('claims')
    .select('id, item_id, claimant_id, status, items!claims_item_id_fkey(reporter_id, title, status)')
    .eq('id', claimId)
    .single()

  if (!claim) notFound()

  const claimRow = claim as unknown as {
    id: string; item_id: string; claimant_id: string; status: string
    items: { reporter_id: string; title: string; status: string }
  }

  // Only the two parties + admin can access this chat
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role?: string } | null)?.role === 'admin'
  const isParticipant =
    user.id === claimRow.claimant_id ||
    user.id === claimRow.items.reporter_id

  if (!isParticipant && !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground">You don&apos;t have access to this chat.</p>
        <Link href={`/items/${id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-4')}>
          Back to item
        </Link>
      </div>
    )
  }

  // Load initial messages (SSR)
  const { data: msgs } = await supabase
    .from('messages')
    .select('id, claim_id, sender_id, body, created_at, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: true })
    .limit(100)

  const initialMessages = (msgs ?? []) as unknown as Message[]

  // Messaging is disabled once claim is in a terminal state
  const terminalStatuses = new Set(['rejected', 'withdrawn'])
  const chatDisabled = terminalStatuses.has(claimRow.status)

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 shrink-0">
        <Link
          href={`/items/${id}/claims`}
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), '-ml-1')}
          aria-label="Back to claims"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{claimRow.items.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                CLAIM_STATUS_STYLES[claimRow.status] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {claimRow.status}
            </span>
            <span className="text-xs text-muted-foreground">claim</span>
          </div>
        </div>
      </header>

      {/* Sensitive warning */}
      {chatDisabled && (
        <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 text-xs text-muted-foreground shrink-0">
          <ShieldAlert className="size-3.5 shrink-0" aria-hidden="true" />
          Messaging is closed for {claimRow.status} claims.
        </div>
      )}

      {/* Message thread (flex-1 scrollable) */}
      <MessageThread
        claimId={claimId}
        currentUserId={user.id}
        initialMessages={initialMessages}
      />

      {/* Input */}
      {!chatDisabled && (
        <MessageInput claimId={claimId} />
      )}
    </div>
  )
}

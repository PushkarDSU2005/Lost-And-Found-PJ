import Link from 'next/link'
import { format } from 'date-fns'
import { FileText, MessageSquare } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { WithdrawClaimButton } from './WithdrawClaimButton'
import type { ClaimStatus } from '@/lib/types'

const CLAIM_STATUS_STYLES: Record<ClaimStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved:  'bg-[--color-found] text-[--color-found-foreground]',
  rejected:  'bg-destructive/10 text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
}

interface MyClaimsTabProps {
  userId: string
}

export async function MyClaimsTab({ userId }: MyClaimsTabProps) {
  const supabase = await createSupabaseServerClient()

  const { data: claims } = await supabase
    .from('claims')
    .select('id, item_id, status, created_at, items!claims_item_id_fkey(id, title, report_type)')
    .eq('claimant_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  const claimsList = (claims ?? []) as unknown as Array<{
    id: string
    item_id: string
    status: ClaimStatus
    created_at: string
    items: { id: string; title: string; report_type: string }
  }>

  if (claimsList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
        <FileText className="size-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-foreground">No claims yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Browse found items and submit a claim to get started.</p>
        </div>
        <Link href="/browse?type=found" className={cn(buttonVariants({ size: 'sm' }), 'mt-2')}>
          Browse Found Items
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-3" role="list" data-testid="my-claims-list">
      {claimsList.map((claim) => {
        const canWithdraw = claim.status === 'pending'
        const canMessage = claim.status === 'approved' || claim.status === 'pending'

        return (
          <li
            key={claim.id}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            {/* Status badge */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                  CLAIM_STATUS_STYLES[claim.status],
                )}
              >
                {claim.status}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/items/${claim.item_id}`}
                className="block font-semibold text-foreground hover:text-primary"
              >
                {claim.items.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                Claimed {format(new Date(claim.created_at), 'd MMM yyyy')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              {canMessage && (
                <Link
                  href={`/items/${claim.item_id}/claims/${claim.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
                  data-testid="chat-button"
                >
                  <MessageSquare className="size-3.5" aria-hidden="true" />
                  Chat
                </Link>
              )}
              {canWithdraw && <WithdrawClaimButton claimId={claim.id} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

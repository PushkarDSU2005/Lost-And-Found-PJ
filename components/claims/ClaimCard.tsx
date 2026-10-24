'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { reviewClaim } from '@/app/actions/claims'
import type { ClaimStatus } from '@/lib/types'

export interface ClaimCardData {
  id: string
  claimant_id: string
  status: ClaimStatus
  proof_text: string | null
  admin_note: string | null
  reviewed_at: string | null
  created_at: string
  claimant?: { full_name: string | null } | null
}

interface ClaimCardProps {
  claim: ClaimCardData
  itemId: string
  /** When true, the finder/admin review controls are shown */
  canReview: boolean
}

const STATUS_STYLES: Record<ClaimStatus, string> = {
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved:  'bg-[--color-found] text-[--color-found-foreground]',
  rejected:  'bg-destructive/10 text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
}
const STATUS_ICONS: Record<ClaimStatus, typeof Clock> = {
  pending:   Clock,
  approved:  CheckCircle,
  rejected:  XCircle,
  withdrawn: XCircle,
}

export function ClaimCard({ claim, itemId, canReview }: ClaimCardProps) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const StatusIcon = STATUS_ICONS[claim.status]

  const handleReview = async (transition: 'approve' | 'reject') => {
    setBusy(true)
    setLocalError(null)
    try {
      const result = await reviewClaim({
        claim_id:   claim.id,
        transition,
        admin_note: note.trim() || undefined,
      })
      if (result && !result.success) {
        setLocalError(result.error)
      }
    } finally {
      setBusy(false)
    }
  }

  const claimantName = claim.claimant?.full_name?.split(' ')[0] ?? 'Anonymous'

  return (
    <article
      data-testid="claim-card"
      data-status={claim.status}
      className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="size-4 text-muted-foreground" aria-hidden="true" />
          {claimantName}
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            STATUS_STYLES[claim.status],
          )}
        >
          <StatusIcon className="size-3" aria-hidden="true" />
          {claim.status}
        </span>
      </div>

      {/* Proof text */}
      {claim.proof_text && (
        <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic">
          &ldquo;{claim.proof_text}&rdquo;
        </blockquote>
      )}

      {/* Admin note */}
      {claim.admin_note && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Note:</span> {claim.admin_note}
        </p>
      )}

      {/* Timestamps */}
      <p className="text-xs text-muted-foreground">
        Submitted {format(new Date(claim.created_at), 'd MMM yyyy')}
        {claim.reviewed_at && (
          <> · Reviewed {format(new Date(claim.reviewed_at), 'd MMM yyyy')}</>
        )}
      </p>

      {/* Review controls — only for finder/admin on pending claims */}
      {canReview && claim.status === 'pending' && (
        <div className="space-y-2 border-t border-border pt-3">
          {localError && (
            <p role="alert" className="text-xs text-destructive">{localError}</p>
          )}
          <div className="space-y-1">
            <Label htmlFor={`note-${claim.id}`} className="text-xs">
              Note to claimant (optional)
            </Label>
            <Textarea
              id={`note-${claim.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for your decision…"
              rows={2}
              className="text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="approve-claim"
              disabled={busy}
              onClick={() => handleReview('approve')}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {busy ? '…' : '✓ Approve'}
            </button>
            <button
              type="button"
              data-testid="reject-claim"
              disabled={busy}
              onClick={() => handleReview('reject')}
              className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              {busy ? '…' : '✗ Reject'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

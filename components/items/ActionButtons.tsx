'use client'

/**
 * ActionButtons — Claim, Report, Share buttons on the item detail page.
 *
 * Visibility rules (enforced here; the server already fetches viewer context):
 *   Claim    — visible if: authenticated + not owner + item status is 'open'
 *   Report   — visible if: authenticated + not owner
 *   Share    — always visible (uses Web Share API or clipboard fallback)
 *
 * The `viewerCtx` prop comes from the RSC so this stays a thin presentation
 * layer — no auth calls happen client-side.
 */

import { useState } from 'react'
import { Flag, Share2, FileCheck } from 'lucide-react'
import { toast } from '@/components/ToastProvider'
import { cn } from '@/lib/utils'
import type { ViewerContext } from '@/lib/items'
import type { ItemStatus } from '@/lib/types'

interface ActionButtonsProps {
  itemId: string
  itemTitle: string
  itemStatus: ItemStatus
  viewerCtx: ViewerContext
  pendingClaimsCount?: number
}

export function ActionButtons({
  itemId,
  itemTitle,
  itemStatus,
  viewerCtx,
  pendingClaimsCount = 0,
}: ActionButtonsProps) {
  const { userId, isOwner } = viewerCtx
  const isAuthenticated = !!userId
  const canClaim = isAuthenticated && !isOwner && itemStatus === 'open'
  const canReport = isAuthenticated && !isOwner

  const [sharing, setSharing] = useState(false)

  const handleShare = async () => {
    setSharing(true)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: itemTitle, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      // User cancelled share or clipboard denied — silent
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      data-testid="action-buttons"
      className="flex flex-wrap gap-2"
      aria-label="Item actions"
    >
      {/* Claim button */}
      {canClaim && (
        <a
          href={`/items/${itemId}/claim`}
          data-testid="claim-button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground',
            'transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <FileCheck className="size-4" aria-hidden="true" />
          Claim this item
        </a>
      )}

      {/* View claims — shown to owner */}
      {isOwner && (
        <a
          href={`/items/${itemId}/claims`}
          data-testid="view-claims-button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <FileCheck className="size-4" aria-hidden="true" />
          View Claims
          {pendingClaimsCount > 0 && (
            <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {pendingClaimsCount}
            </span>
          )}
        </a>
      )}

      {/* Report button */}
      {canReport && (
        <a
          href={`/items/${itemId}/report`}
          data-testid="report-button"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <Flag className="size-4" aria-hidden="true" />
          Report
        </a>
      )}

      {/* Share button — always shown */}
      <button
        type="button"
        data-testid="share-button"
        onClick={handleShare}
        disabled={sharing}
        aria-label="Share this item"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground',
          'transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50',
        )}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Share
      </button>

      {/* Sign-in prompt when unauthenticated */}
      {!isAuthenticated && itemStatus === 'open' && (
        <a
          href="/auth/login"
          data-testid="signin-to-claim"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground',
            'transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <FileCheck className="size-4" aria-hidden="true" />
          Sign in to claim
        </a>
      )}
    </div>
  )
}

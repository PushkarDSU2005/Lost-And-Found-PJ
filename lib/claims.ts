/**
 * lib/claims.ts
 * =============
 * Claim state machine and business-logic helpers.
 * Pure functions — no DB, no Next.js imports.
 * Imported by both server actions and unit tests.
 */

import type { ClaimStatus, ItemStatus } from '@/lib/types'

// ─── State machine ────────────────────────────────────────────────────────────

/**
 * Valid transitions:
 *   pending  → approved  (finder / admin)
 *   pending  → rejected  (finder / admin)
 *   pending  → withdrawn (claimant only)
 *   approved → rejected  (admin only — e.g. fraud discovered)
 * All other transitions are forbidden.
 */
export type ClaimTransition =
  | 'approve'
  | 'reject'
  | 'withdraw'

export interface TransitionGuard {
  allowed: boolean
  reason?: string
}

export function canTransition(
  current: ClaimStatus,
  transition: ClaimTransition,
): TransitionGuard {
  if (current === 'pending' && transition === 'approve')
    return { allowed: true }
  if (current === 'pending' && transition === 'reject')
    return { allowed: true }
  if (current === 'pending' && transition === 'withdraw')
    return { allowed: true }
  if (current === 'approved' && transition === 'reject')
    return { allowed: true }

  return {
    allowed: false,
    reason: `Cannot ${transition} a claim that is already '${current}'.`,
  }
}

export function nextStatus(transition: ClaimTransition): ClaimStatus {
  switch (transition) {
    case 'approve':  return 'approved'
    case 'reject':   return 'rejected'
    case 'withdraw': return 'withdrawn'
  }
}

// ─── Item-level guard for new claims ─────────────────────────────────────────

export interface SubmitClaimGuard {
  allowed: boolean
  code?:
    | 'ITEM_NOT_OPEN'
    | 'OWN_ITEM'
    | 'DUPLICATE'
    | 'BANNED'
    | 'UNAUTHENTICATED'
  reason?: string
}

export function canSubmitClaim(opts: {
  itemStatus: ItemStatus
  itemReporterId: string
  claimantId: string
  existingActiveClaimStatus: ClaimStatus | null
  isBanned: boolean
}): SubmitClaimGuard {
  if (opts.isBanned) {
    return { allowed: false, code: 'BANNED', reason: 'Your account has been suspended.' }
  }
  if (opts.itemStatus !== 'open') {
    return {
      allowed: false,
      code: 'ITEM_NOT_OPEN',
      reason: `This item is ${opts.itemStatus} and can no longer be claimed.`,
    }
  }
  if (opts.itemReporterId === opts.claimantId) {
    return { allowed: false, code: 'OWN_ITEM', reason: 'You cannot claim your own item.' }
  }
  // Block if any non-withdrawn claim already exists (pending OR approved)
  if (
    opts.existingActiveClaimStatus !== null &&
    opts.existingActiveClaimStatus !== 'withdrawn' &&
    opts.existingActiveClaimStatus !== 'rejected'
  ) {
    return {
      allowed: false,
      code: 'DUPLICATE',
      reason: 'You already have an active claim on this item.',
    }
  }
  return { allowed: true }
}

// ─── Reviewer guard ───────────────────────────────────────────────────────────

/**
 * Who can review (approve/reject) a claim:
 * - The item owner (finder) for pending claims
 * - An admin for any non-terminal claim
 */
export function canReviewClaim(opts: {
  reviewerId: string
  itemReporterId: string
  isAdmin: boolean
  claimStatus: ClaimStatus
  transition: 'approve' | 'reject'
}): TransitionGuard {
  const { allowed: transOk, reason: transReason } = canTransition(
    opts.claimStatus,
    opts.transition,
  )
  if (!transOk) return { allowed: false, reason: transReason }

  const isOwner = opts.reviewerId === opts.itemReporterId
  if (!isOwner && !opts.isAdmin) {
    return { allowed: false, reason: 'Only the item reporter or an admin can review claims.' }
  }
  // Only admin can reject an already-approved claim
  if (opts.claimStatus === 'approved' && opts.transition === 'reject' && !opts.isAdmin) {
    return { allowed: false, reason: 'Only an admin can reverse an approved claim.' }
  }
  return { allowed: true }
}

// ─── Verification answer check ────────────────────────────────────────────────

/**
 * Normalise a verification answer the same way the server does before hashing.
 * Used so we can hash the submitted answer and compare to stored hash.
 */
export function normaliseAnswer(raw: string): string {
  return raw.toLowerCase().trim()
}

// ─── Notification event types ─────────────────────────────────────────────────

export type ClaimEventType =
  | 'claim_submitted'   // finder gets notified
  | 'claim_approved'    // claimant gets notified
  | 'claim_rejected'    // claimant gets notified
  | 'claim_withdrawn'   // finder gets notified
  | 'item_returned'     // claimant gets notified
  | 'message_sent'      // other party in thread gets notified

export interface ClaimNotificationPayload {
  claim_id: string
  item_id: string
  item_title: string
  actor_name?: string
  admin_note?: string
}

'use server'

/**
 * Server actions for the claim flow.
 *
 * submitClaim   — claimant submits a new claim (with optional verification answer)
 * reviewClaim   — finder/admin approves or rejects a pending claim
 * markReturned  — item owner marks item as returned after approved claim
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { hashVerificationAnswer, sanitizeText } from '@/lib/sanitize'
import {
  canSubmitClaim,
  canReviewClaim,
  canTransition,
  nextStatus,
  normaliseAnswer,
  type ClaimEventType,
  type ClaimNotificationPayload,
} from '@/lib/claims'
import type { ClaimStatus } from '@/lib/types'
import { z } from 'zod'

// ─── Shared result type ───────────────────────────────────────────────────────

export type ClaimActionResult =
  | { success: true; claimId?: string }
  | { success: false; error: string; code: string }

// ─── submitClaim ──────────────────────────────────────────────────────────────

const submitClaimSchema = z.object({
  item_id:             z.string().uuid('Invalid item ID'),
  proof_text:          z.string().trim().min(1, 'Please describe how you can prove ownership').max(2000),
  verification_answer: z.string().trim().max(500).optional(),
})

export async function submitClaim(rawInput: unknown): Promise<ClaimActionResult> {
  // ── 1. Validate input ────────────────────────────────────────────────────
  const parsed = submitClaimSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      code: 'VALIDATION_ERROR',
      error: parsed.data
        ? 'Invalid input'
        : parsed.error.issues.map((i) => i.message).join(', '),
    }
  }
  const input = parsed.data

  // ── 2. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in to claim an item.' }

  // ── 3. Load profile (ban check) ──────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, role')
    .eq('id', user.id)
    .single()
  if (!profile) return { success: false, code: 'DB_ERROR', error: 'Could not load your profile.' }
  if ((profile as { is_banned: boolean }).is_banned) {
    return { success: false, code: 'BANNED', error: 'Your account has been suspended.' }
  }

  // ── 4. Load item via service role (item may be non-open — need accurate status) ───
  const service = createSupabaseServiceClient()
  const { data: item } = await service
    .from('items')
    .select('id, reporter_id, status, title, verification_answer_hash, verification_question')
    .eq('id', input.item_id)
    .single()
  if (!item) return { success: false, code: 'ITEM_NOT_FOUND', error: 'Item not found.' }
  // Distinguish "not found" from "found but not open"
  if ((item as { status: string }).status !== 'open') {
    return {
      success: false,
      code: 'ITEM_NOT_OPEN',
      error: `This item is ${(item as { status: string }).status} and can no longer be claimed.`,
    }
  }

  // ── 5. Check for existing claim ──────────────────────────────────────────
  const { data: existingClaim } = await supabase
    .from('claims')
    .select('status')
    .eq('item_id', input.item_id)
    .eq('claimant_id', user.id)
    .maybeSingle()
  const existingStatus = (existingClaim as { status: ClaimStatus } | null)?.status ?? null

  // ── 6. State machine guard ───────────────────────────────────────────────
  const guard = canSubmitClaim({
    itemStatus:                item.status,
    itemReporterId:            item.reporter_id,
    claimantId:                user.id,
    existingActiveClaimStatus: existingStatus,
    isBanned:                  (profile as { is_banned: boolean }).is_banned,
  })
  if (!guard.allowed) {
    return { success: false, code: guard.code ?? 'FORBIDDEN', error: guard.reason ?? 'Cannot claim this item.' }
  }

  // ── 7. Verify answer (if item has a verification question) ───────────────
  const storedHash = (item as { verification_answer_hash?: string | null }).verification_answer_hash
  if (storedHash) {
    if (!input.verification_answer?.trim()) {
      return {
        success: false,
        code: 'ANSWER_REQUIRED',
        error: 'This item requires you to answer the verification question.',
      }
    }
    const submittedHash = await hashVerificationAnswer(normaliseAnswer(input.verification_answer))
    if (submittedHash !== storedHash) {
      return {
        success: false,
        code: 'WRONG_ANSWER',
        error: 'Your answer does not match. Please check and try again.',
      }
    }
  }

  // ── 8. Insert claim row ──────────────────────────────────────────────────
  const { data: newClaim, error: insertError } = await supabase
    .from('claims')
    .insert({
      item_id:     input.item_id,
      claimant_id: user.id,
      proof_text:  sanitizeText(input.proof_text),
      status:      'pending',
    })
    .select('id')
    .single()

  if (insertError || !newClaim) {
    // PostgreSQL unique violation = duplicate claim
    if (insertError?.code === '23505') {
      return { success: false, code: 'DUPLICATE', error: 'You already have a claim on this item.' }
    }
    return { success: false, code: 'DB_ERROR', error: `Failed to submit claim: ${insertError?.message}` }
  }

  // ── 9. Notify finder (service role — bypasses RLS insert block) ──────────
  await sendNotification({
    userId:    item.reporter_id,
    eventType: 'claim_submitted',
    payload: {
      claim_id:   newClaim.id as string,
      item_id:    input.item_id,
      item_title: item.title as string,
    },
  })

  // Email the finder
  try {
    const { sendClaimReceivedEmail } = await import('@/lib/email/sender')
    await sendClaimReceivedEmail({
      recipientId: item.reporter_id,
      itemId:      input.item_id,
      itemTitle:   item.title as string,
    })
  } catch {
    // Best-effort — never fail the claim submission
  }

  redirect(`/items/${input.item_id}?claimed=1`)
}

// ─── reviewClaim ──────────────────────────────────────────────────────────────

const reviewClaimSchema = z.object({
  claim_id:   z.string().uuid(),
  transition: z.enum(['approve', 'reject']),
  admin_note: z.string().trim().max(500).optional(),
})

export async function reviewClaim(rawInput: unknown): Promise<ClaimActionResult> {
  const parsed = reviewClaimSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const input = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Load claim + item in one query
  const { data: claim } = await supabase
    .from('claims')
    .select('id, item_id, claimant_id, status, items(id, reporter_id, status, title, is_sensitive)')
    .eq('id', input.claim_id)
    .single()

  if (!claim) return { success: false, code: 'NOT_FOUND', error: 'Claim not found.' }

  const itemRow = (claim as unknown as { items: { id: string; reporter_id: string; status: string; title: string; is_sensitive: boolean } }).items
  const claimRow = claim as unknown as { id: string; item_id: string; claimant_id: string; status: ClaimStatus }

  // Is reviewer admin?
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role?: string } | null)?.role === 'admin'

  const guard = canReviewClaim({
    reviewerId:      user.id,
    itemReporterId:  itemRow.reporter_id,
    isAdmin,
    claimStatus:     claimRow.status,
    transition:      input.transition,
  })
  if (!guard.allowed) {
    return { success: false, code: 'FORBIDDEN', error: guard.reason ?? 'Not allowed.' }
  }

  const newClaimStatus = nextStatus(input.transition)

  // Update claim via service role — RLS UPDATE policy only allows claimant to withdraw
  // and admin to update any. The item reporter (finder) reviews via the service client.
  const { error: updateError } = await createSupabaseServiceClient()
    .from('claims')
    .update({
      status:      newClaimStatus,
      admin_note:  input.admin_note ? sanitizeText(input.admin_note) : null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.claim_id)

  if (updateError) {
    return { success: false, code: 'DB_ERROR', error: `Failed to update claim: ${updateError.message}` }
  }

  // If approving: set item status to 'claimed' (via service role)
  if (input.transition === 'approve') {
    await createSupabaseServiceClient()
      .from('items')
      .update({ status: 'claimed' })
      .eq('id', claimRow.item_id)
  }

  // Notify claimant
  const eventType: ClaimEventType = input.transition === 'approve' ? 'claim_approved' : 'claim_rejected'
  await sendNotification({
    userId:    claimRow.claimant_id,
    eventType,
    payload: {
      claim_id:   input.claim_id,
      item_id:    claimRow.item_id,
      item_title: itemRow.title,
      admin_note: input.admin_note,
    },
  })

  // Email the claimant
  try {
    const { sendClaimDecisionEmail } = await import('@/lib/email/sender')
    await sendClaimDecisionEmail({
      recipientId: claimRow.claimant_id,
      itemId:      claimRow.item_id,
      itemTitle:   itemRow.title,
      decision:    input.transition === 'approve' ? 'approved' : 'rejected',
      adminNote:   input.admin_note,
    })
  } catch {
    // Best-effort
  }

  redirect(`/items/${claimRow.item_id}/claims?reviewed=1`)
}

// ─── markReturned ─────────────────────────────────────────────────────────────

const markReturnedSchema = z.object({
  item_id: z.string().uuid(),
})

export async function markReturned(rawInput: unknown): Promise<ClaimActionResult> {
  const parsed = markReturnedSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  const { item_id } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Load item
  const { data: item } = await supabase
    .from('items')
    .select('id, reporter_id, status, title')
    .eq('id', item_id)
    .single()

  if (!item) return { success: false, code: 'NOT_FOUND', error: 'Item not found.' }

  const itemRow = item as { id: string; reporter_id: string; status: string; title: string }

  // Only reporter can mark returned, and only if claimed
  const isAdmin = await checkAdmin(supabase, user.id)
  if (itemRow.reporter_id !== user.id && !isAdmin) {
    return { success: false, code: 'FORBIDDEN', error: 'Only the item reporter can mark it as returned.' }
  }
  if (itemRow.status !== 'claimed') {
    return {
      success: false,
      code: 'WRONG_STATUS',
      error: `Item must be 'claimed' to mark as returned (currently '${itemRow.status}').`,
    }
  }

  await supabase.from('items').update({ status: 'resolved' }).eq('id', item_id)

  // Find approved claimant and notify
  const { data: approvedClaim } = await supabase
    .from('claims')
    .select('id, claimant_id')
    .eq('item_id', item_id)
    .eq('status', 'approved')
    .maybeSingle()

  if (approvedClaim) {
    await sendNotification({
      userId:    (approvedClaim as { claimant_id: string }).claimant_id,
      eventType: 'item_returned',
      payload: {
        claim_id:   (approvedClaim as { id: string }).id,
        item_id,
        item_title: itemRow.title,
      },
    })
  }

  redirect(`/items/${item_id}?returned=1`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function checkAdmin(supabase: ReturnType<typeof createSupabaseServerClient> extends Promise<infer T> ? T : never, userId: string): Promise<boolean> {
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return (data as { role?: string } | null)?.role === 'admin'
}

async function sendNotification(opts: {
  userId: string
  eventType: ClaimEventType
  payload: ClaimNotificationPayload
}) {
  try {
    const service = createSupabaseServiceClient()
    await service.from('notifications').insert({
      user_id:    opts.userId,
      channel:    'in_app',
      event_type: opts.eventType,
      payload:    opts.payload,
    })
  } catch (err) {
    // Notifications are best-effort — never fail the main operation
    console.error('[sendNotification] failed:', err)
  }
}

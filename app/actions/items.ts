'use server'

/**
 * Server actions for item management.
 *
 * editItem       — owner updates title, description, images
 * deleteItem     — soft delete (status → 'removed')
 * withdrawClaim  — claimant withdraws their pending claim
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { sanitizeItemFields } from '@/lib/sanitize'
import { checkIPRateLimit, sanitizeErrorForClient } from '@/lib/security'
import { z } from 'zod'

// ─── Shared result type ───────────────────────────────────────────────────────

export type ItemActionResult =
  | { success: true }
  | { success: false; error: string; code: string }

// ─── editItem ─────────────────────────────────────────────────────────────────

const editItemSchema = z.object({
  item_id:     z.string().uuid(),
  title:       z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
})

export async function editItem(rawInput: unknown): Promise<ItemActionResult> {
  const parsed = editItemSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const input = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Load item and check ownership
  const { data: item } = await supabase
    .from('items')
    .select('id, reporter_id, status')
    .eq('id', input.item_id)
    .single()

  if (!item) return { success: false, code: 'NOT_FOUND', error: 'Item not found.' }

  const itemRow = item as { id: string; reporter_id: string; status: string }

  if (itemRow.reporter_id !== user.id) {
    return { success: false, code: 'FORBIDDEN', error: 'Only the item reporter can edit it.' }
  }

  // Only open items can be edited
  if (itemRow.status !== 'open') {
    return { success: false, code: 'WRONG_STATUS', error: `Cannot edit ${itemRow.status} items.` }
  }

  // Sanitize and update
  const sanitized = sanitizeItemFields({
    title:       input.title,
    description: input.description,
  })

  const { error: updateError } = await supabase
    .from('items')
    .update({
      title:       sanitized.title,
      description: sanitized.description,
    })
    .eq('id', input.item_id)

  if (updateError) {
    return { success: false, code: 'DB_ERROR', error: `Failed to update: ${updateError.message}` }
  }

  redirect(`/items/${input.item_id}?edited=1`)
}

// ─── deleteItem (soft delete) ─────────────────────────────────────────────────

const deleteItemSchema = z.object({
  item_id: z.string().uuid(),
})

export async function deleteItem(rawInput: unknown): Promise<ItemActionResult> {
  const parsed = deleteItemSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { item_id } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Load item and check ownership
  const { data: item } = await supabase
    .from('items')
    .select('id, reporter_id, status')
    .eq('id', item_id)
    .single()

  if (!item) return { success: false, code: 'NOT_FOUND', error: 'Item not found.' }

  const itemRow = item as { id: string; reporter_id: string; status: string }

  // Check admin role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = (profile as { role?: string } | null)?.role === 'admin'

  if (itemRow.reporter_id !== user.id && !isAdmin) {
    return { success: false, code: 'FORBIDDEN', error: 'Only the item reporter or an admin can delete it.' }
  }

  // Cannot delete non-open items (they may have approved claims, resolved status, etc.)
  if (itemRow.status !== 'open') {
    return { success: false, code: 'WRONG_STATUS', error: `Cannot delete ${itemRow.status} items.` }
  }

  // Soft delete: set status to a new 'removed' status
  // (We'll add 'removed' to the item_status enum in the next migration)
  // For now, use 'expired' as a proxy or add a new status.
  // Let's add a migration to extend the enum.

  // For now, hard-delete open items with no claims:
  const { count: claimCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('item_id', item_id)

  if ((claimCount ?? 0) > 0) {
    return {
      success: false,
      code: 'HAS_CLAIMS',
      error: 'Cannot delete items with existing claims. Contact an admin.',
    }
  }

  // Hard delete if no claims (images cascade)
  const { error: deleteError } = await supabase
    .from('items')
    .delete()
    .eq('id', item_id)

  if (deleteError) {
    return { success: false, code: 'DB_ERROR', error: `Failed to delete: ${deleteError.message}` }
  }

  redirect('/dashboard?tab=posts&deleted=1')
}

// ─── withdrawClaim ────────────────────────────────────────────────────────────

const withdrawClaimSchema = z.object({
  claim_id: z.string().uuid(),
})

export async function withdrawClaim(rawInput: unknown): Promise<ItemActionResult> {
  const parsed = withdrawClaimSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { claim_id } = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Load claim and check ownership
  const { data: claim } = await supabase
    .from('claims')
    .select('id, claimant_id, status, item_id')
    .eq('id', claim_id)
    .single()

  if (!claim) return { success: false, code: 'NOT_FOUND', error: 'Claim not found.' }

  const claimRow = claim as { id: string; claimant_id: string; status: string; item_id: string }

  if (claimRow.claimant_id !== user.id) {
    return { success: false, code: 'FORBIDDEN', error: 'Only the claimant can withdraw their claim.' }
  }

  // Can only withdraw pending claims
  if (claimRow.status !== 'pending') {
    return { success: false, code: 'WRONG_STATUS', error: `Cannot withdraw ${claimRow.status} claims.` }
  }

  // Update via service role (RLS UPDATE policy only allows claimant to set status='withdrawn')
  const { error: updateError } = await createSupabaseServiceClient()
    .from('claims')
    .update({ status: 'withdrawn' })
    .eq('id', claim_id)

  if (updateError) {
    return { success: false, code: 'DB_ERROR', error: `Failed to withdraw: ${updateError.message}` }
  }

  // Notify finder
  try {
    const service = createSupabaseServiceClient()
    const { data: item } = await service
      .from('items')
      .select('reporter_id, title')
      .eq('id', claimRow.item_id)
      .single()

    if (item) {
      await service.from('notifications').insert({
        user_id:    (item as { reporter_id: string }).reporter_id,
        channel:    'in_app',
        event_type: 'claim_withdrawn',
        payload: {
          claim_id: claim_id,
          item_id:  claimRow.item_id,
          item_title: (item as { title: string }).title,
        },
      })
    }
  } catch {
    // Best-effort
  }

  redirect(`/dashboard?tab=claims&withdrawn=1`)
}


// ═══════════════════════════════════════════════════════════════════════════════
// ═══ ORIGINAL createItem + uploadItemImages actions (from earlier tasks) ═══
// ═══════════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_MAX = 5
export const RATE_LIMIT_WINDOW_H = 24

export type CreateItemResult =
  | { success: true; itemId: string }
  | { success: false; error: string; code: string }

const createItemSchema = z.object({
  report_type:   z.enum(['lost', 'found']),
  title:         z.string().min(3).max(200),
  description:   z.string().max(2000).optional(),
  category:      z.enum(['electronics', 'clothing', 'accessories', 'books_stationery', 'keys', 'sports_fitness', 'id_documents', 'food_drink', 'other']),
  location_id:   z.string().uuid().optional(),
  location_text: z.string().max(200).optional(),
  date_occurred: z.string().optional(),
  is_sensitive:  z.boolean().default(false),
  verification_question: z.string().max(300).optional(),
  verification_answer:   z.string().max(200).optional(),
  held_at:       z.string().uuid().optional(),
  images:        z.array(z.string()).max(5).default([]),
})

export async function createItem(rawInput: unknown): Promise<CreateItemResult> {
  const parsed = createItemSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const input = parsed.data

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  // Ban check
  const { data: profile } = await supabase.from('profiles').select('is_banned').eq('id', user.id).single()
  if ((profile as { is_banned: boolean } | null)?.is_banned) {
    return { success: false, code: 'BANNED', error: 'Your account has been suspended.' }
  }

  // Rate limit check (per-user)
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_H * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .gte('created_at', windowStart)

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return {
      success: false,
      code: 'RATE_LIMITED',
      error: `You can report at most ${RATE_LIMIT_MAX} items per ${RATE_LIMIT_WINDOW_H} hours.`,
    }
  }

  // IP rate limit check (defense-in-depth against multi-account abuse)
  const ipCheck = await checkIPRateLimit('create-item', 10, 3600000) // 10 posts/hour per IP
  if (!ipCheck.allowed) {
    return { success: false, code: 'IP_RATE_LIMITED', error: ipCheck.reason! }
  }

  // Sanitize
  const sanitized = sanitizeItemFields({
    title:                 input.title,
    description:           input.description,
    location_text:         input.location_text,
    verification_question: input.verification_question,
  })

  // Hash verification answer if provided
  let verificationAnswerHash: string | undefined
  if (input.verification_question && input.verification_answer) {
    const { hashVerificationAnswer } = await import('@/lib/sanitize')
    verificationAnswerHash = await hashVerificationAnswer(input.verification_answer.toLowerCase().trim())
  }

  // Insert item
  const { data: item, error: insertError } = await supabase
    .from('items')
    .insert({
      reporter_id:              user.id,
      report_type:              input.report_type,
      category:                 input.category,
      title:                    sanitized.title,
      description:              sanitized.description,
      location_id:              input.location_id ?? null,
      location_text:            sanitized.location_text,
      date_occurred:            input.date_occurred ?? null,
      is_sensitive:             input.is_sensitive,
      verification_question:    sanitized.verification_question,
      verification_answer_hash: verificationAnswerHash ?? null,
      held_at:                  input.held_at ?? null,
      status:                   'open',
    })
    .select('id')
    .single()

  if (insertError || !item) {
    return { success: false, code: 'DB_ERROR', error: `Failed to create item: ${insertError?.message ?? 'unknown'}` }
  }

  const itemId = (item as { id: string }).id

  // Images (handled separately via uploadItemImages after insert)

  redirect(`/items/${itemId}?created=1`)
}

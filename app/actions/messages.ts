'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/sanitize'
import {
  checkMessageContent,
  checkMessageRateLimit,
  canSendMessage,
  CONTENT_FILTER_MESSAGES,
  MSG_RATE_LIMIT,
  MSG_RATE_WINDOW_MIN,
} from '@/lib/messaging'
import { z } from 'zod'

// ─── Result type ──────────────────────────────────────────────────────────────

export type SendMessageResult =
  | { success: true; messageId: string }
  | { success: false; error: string; code: string }

// ─── sendMessage ──────────────────────────────────────────────────────────────

const sendMessageSchema = z.object({
  claim_id: z.string().uuid('Invalid claim ID'),
  body:     z.string().min(1, 'Message cannot be empty').max(1000),
})

export async function sendMessage(rawInput: unknown): Promise<SendMessageResult> {
  // ── 1. Validate ───────────────────────────────────────────────────────────
  const parsed = sendMessageSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const input = parsed.data

  // ── 2. Auth ───────────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in to send messages.' }

  // ── 3. Content filter ─────────────────────────────────────────────────────
  const contentCheck = checkMessageContent(input.body)
  if (!contentCheck.ok) {
    return {
      success: false,
      code: contentCheck.reason ?? 'CONTENT_REJECTED',
      error: CONTENT_FILTER_MESSAGES[contentCheck.reason!],
    }
  }

  // ── 4. Load claim + item via service role (claim may be on a non-open item) ─
  const service = createSupabaseServiceClient()
  const { data: claim } = await service
    .from('claims')
    .select('id, item_id, claimant_id, status, items!claims_item_id_fkey(reporter_id, title)')
    .eq('id', input.claim_id)
    .single()

  if (!claim) return { success: false, code: 'NOT_FOUND', error: 'Claim not found.' }

  const claimRow = claim as unknown as {
    id: string; item_id: string; claimant_id: string; status: string
    items: { reporter_id: string; title: string }
  }

  // ── 5. Participant check ──────────────────────────────────────────────────
  const { data: profile } = await supabase.from('profiles').select('role, is_banned').eq('id', user.id).single()
  const isAdmin   = (profile as { role?: string } | null)?.role === 'admin'
  const isBanned  = !!(profile as { is_banned?: boolean } | null)?.is_banned

  if (isBanned) return { success: false, code: 'BANNED', error: 'Your account has been suspended.' }

  const participantGuard = canSendMessage({
    senderId:       user.id,
    claimantId:     claimRow.claimant_id,
    itemReporterId: claimRow.items.reporter_id,
    claimStatus:    claimRow.status,
    isAdmin,
  })
  if (!participantGuard.allowed) {
    return { success: false, code: 'FORBIDDEN', error: participantGuard.reason ?? 'Not allowed.' }
  }

  // ── 6. Rate limit ─────────────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - MSG_RATE_WINDOW_MIN * 60 * 1000).toISOString()
  const { count: recentCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('claim_id', input.claim_id)
    .eq('sender_id', user.id)
    .gte('created_at', windowStart)

  const rateGuard = checkMessageRateLimit(recentCount ?? 0)
  if (!rateGuard.allowed) {
    return { success: false, code: 'RATE_LIMITED', error: rateGuard.reason! }
  }

  // ── 7. Insert message ─────────────────────────────────────────────────────
  const { data: msg, error: insertError } = await supabase
    .from('messages')
    .insert({
      claim_id:  input.claim_id,
      sender_id: user.id,
      body:      sanitizeText(input.body),
    })
    .select('id')
    .single()

  if (insertError || !msg) {
    return { success: false, code: 'DB_ERROR', error: `Failed to send message: ${insertError?.message ?? 'unknown'}` }
  }

  // ── 8. Notify the other party ─────────────────────────────────────────────
  const recipientId =
    user.id === claimRow.claimant_id
      ? claimRow.items.reporter_id
      : claimRow.claimant_id

  try {
    await service.from('notifications').insert({
      user_id:    recipientId,
      channel:    'in_app',
      event_type: 'message_sent',
      payload: {
        claim_id:   input.claim_id,
        item_title: claimRow.items.title,
        message_id: (msg as { id: string }).id,
      },
    })
  } catch {
    // Best-effort — don't fail the send if notification fails
  }

  // Email the recipient (digest logic inside)
  try {
    const { sendNewMessageEmail } = await import('@/lib/email/sender')
    await sendNewMessageEmail({
      recipientId,
      itemId:    claimRow.item_id,
      claimId:   input.claim_id,
      itemTitle: claimRow.items.title,
    })
  } catch {
    // Best-effort
  }

  return { success: true, messageId: (msg as { id: string }).id }
}

// ─── markNotificationsRead ────────────────────────────────────────────────────

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const now = new Date().toISOString()
  const query = supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (ids?.length) {
    await query.in('id', ids)
  } else {
    await query
  }
}

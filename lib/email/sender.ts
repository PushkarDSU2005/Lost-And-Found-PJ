/**
 * lib/email/sender.ts
 * ===================
 * High-level functions to send notification emails with digest logic.
 */

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { sendEmail } from './resend'
import {
  claimReceivedEmail,
  claimDecisionEmail,
  newMessageEmail,
  matchFoundEmail,
} from './templates'

const DIGEST_WINDOW_MIN = 10

// ─── Claim received ───────────────────────────────────────────────────────────

export async function sendClaimReceivedEmail(opts: {
  recipientId: string
  itemId: string
  itemTitle: string
}): Promise<void> {
  const service = createSupabaseServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, email, notify_email, is_banned')
    .eq('id', opts.recipientId)
    .single()

  if (!profile) return
  const { full_name, email, notify_email, is_banned } = profile as {
    full_name: string | null
    email: string
    notify_email: boolean
    is_banned: boolean
  }

  if (is_banned || !notify_email || !email) return

  await sendEmail({
    to:      email,
    subject: `New claim on "${opts.itemTitle}"`,
    html:    claimReceivedEmail({
      recipientName: full_name ?? 'there',
      itemTitle:     opts.itemTitle,
      itemId:        opts.itemId,
    }),
  })
}

// ─── Claim decision ───────────────────────────────────────────────────────────

export async function sendClaimDecisionEmail(opts: {
  recipientId: string
  itemId: string
  itemTitle: string
  decision: 'approved' | 'rejected'
  adminNote?: string
}): Promise<void> {
  const service = createSupabaseServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, email, notify_email, is_banned')
    .eq('id', opts.recipientId)
    .single()

  if (!profile) return
  const { full_name, email, notify_email, is_banned } = profile as {
    full_name: string | null
    email: string
    notify_email: boolean
    is_banned: boolean
  }

  if (is_banned || !notify_email || !email) return

  await sendEmail({
    to:      email,
    subject: `Claim ${opts.decision} — "${opts.itemTitle}"`,
    html:    claimDecisionEmail({
      recipientName: full_name ?? 'there',
      itemTitle:     opts.itemTitle,
      itemId:        opts.itemId,
      decision:      opts.decision,
      adminNote:     opts.adminNote,
    }),
  })
}

// ─── New message (digest: max 1 per 10 min per thread) ───────────────────────

export async function sendNewMessageEmail(opts: {
  recipientId: string
  itemId: string
  claimId: string
  itemTitle: string
}): Promise<void> {
  const service = createSupabaseServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, email, notify_email, is_banned')
    .eq('id', opts.recipientId)
    .single()

  if (!profile) return
  const { full_name, email, notify_email, is_banned } = profile as {
    full_name: string | null
    email: string
    notify_email: boolean
    is_banned: boolean
  }

  if (is_banned || !notify_email || !email) return

  // Digest logic: check when we last sent an email for this (recipientId, claimId)
  const windowStart = new Date(Date.now() - DIGEST_WINDOW_MIN * 60 * 1000).toISOString()
  const { data: recentEmail } = await service
    .from('notifications')
    .select('id')
    .eq('user_id', opts.recipientId)
    .eq('channel', 'email')
    .eq('event_type', 'message_sent')
    .gte('sent_at', windowStart)
    .contains('payload', { claim_id: opts.claimId })
    .maybeSingle()

  if (recentEmail) {
    // Already sent an email in the last 10 minutes for this thread — skip
    return
  }

  // Count unread message notifications for this thread
  const { count } = await service
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', opts.recipientId)
    .eq('channel', 'in_app')
    .eq('event_type', 'message_sent')
    .is('read_at', null)
    .contains('payload', { claim_id: opts.claimId })

  const messageCount = count ?? 1

  await sendEmail({
    to:      email,
    subject: messageCount > 1
      ? `${messageCount} new messages about "${opts.itemTitle}"`
      : `New message about "${opts.itemTitle}"`,
    html:    newMessageEmail({
      recipientName: full_name ?? 'there',
      itemTitle:     opts.itemTitle,
      itemId:        opts.itemId,
      claimId:       opts.claimId,
      messageCount,
    }),
  })

  // Record that we sent this email (channel=email, sent_at=now)
  await service.from('notifications').insert({
    user_id:    opts.recipientId,
    channel:    'email',
    event_type: 'message_sent',
    payload:    { claim_id: opts.claimId, item_id: opts.itemId, item_title: opts.itemTitle },
    sent_at:    new Date().toISOString(),
  })
}

// ─── Match found (strong match only) ──────────────────────────────────────────

export async function sendMatchFoundEmail(opts: {
  recipientId: string
  yourItemId: string
  yourItemTitle: string
  matchId: string
  matchTitle: string
  score: number
}): Promise<void> {
  const service = createSupabaseServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, email, notify_email, is_banned')
    .eq('id', opts.recipientId)
    .single()

  if (!profile) return
  const { full_name, email, notify_email, is_banned } = profile as {
    full_name: string | null
    email: string
    notify_email: boolean
    is_banned: boolean
  }

  if (is_banned || !notify_email || !email) return

  await sendEmail({
    to:      email,
    subject: `Potential match found for "${opts.yourItemTitle}"`,
    html:    matchFoundEmail({
      recipientName: full_name ?? 'there',
      yourItemTitle: opts.yourItemTitle,
      yourItemId:    opts.yourItemId,
      matchTitle:    opts.matchTitle,
      matchId:       opts.matchId,
      score:         opts.score,
    }),
  })

  // Record notification (prevent duplicate emails for the same match)
  await service.from('notifications').insert({
    user_id:    opts.recipientId,
    channel:    'in_app',
    event_type: 'match_found',
    payload:    { item_id: opts.yourItemId, match_id: opts.matchId, score: opts.score },
  })
}

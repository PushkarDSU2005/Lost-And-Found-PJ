/**
 * lib/messaging.ts
 * ================
 * Pure business-logic helpers for the messaging feature.
 * No DB, no Next.js imports — fully unit-testable.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const MESSAGE_MIN = 1
export const MESSAGE_MAX = 1000
/** Per-user per-claim rate limit: max messages per window */
export const MSG_RATE_LIMIT = 10
/** Rate limit window in minutes */
export const MSG_RATE_WINDOW_MIN = 1

// ─── Content filter ───────────────────────────────────────────────────────────

/**
 * URL pattern: matches http(s):// links and bare domains like example.com
 * We block links to prevent contact-detail sharing (phone numbers via URL
 * shorteners, direct email links, etc.).
 */
const URL_PATTERN = /https?:\/\/\S+|(\b[a-z0-9-]+\.[a-z]{2,}\b\/\S*)/i

/**
 * Basic profanity block-list (lowercase). Kept short intentionally —
 * expand via environment config in production.
 * Using a Set for O(1) lookups.
 */
const BLOCKED_WORDS = new Set([
  'spam', 'scam', 'phishing',
])

export interface ContentCheckResult {
  ok: boolean
  reason?: 'URL_DETECTED' | 'BLOCKED_WORD' | 'TOO_LONG' | 'EMPTY'
}

export function checkMessageContent(body: string): ContentCheckResult {
  const trimmed = body.trim()

  if (trimmed.length === 0)           return { ok: false, reason: 'EMPTY' }
  if (trimmed.length > MESSAGE_MAX)   return { ok: false, reason: 'TOO_LONG' }

  if (URL_PATTERN.test(trimmed))      return { ok: false, reason: 'URL_DETECTED' }

  const lower = trimmed.toLowerCase()
  for (const word of BLOCKED_WORDS) {
    // Whole-word match
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      return { ok: false, reason: 'BLOCKED_WORD' }
    }
  }

  return { ok: true }
}

export const CONTENT_FILTER_MESSAGES: Record<NonNullable<ContentCheckResult['reason']>, string> = {
  URL_DETECTED: 'Messages cannot contain links or URLs. Use the in-app chat only.',
  BLOCKED_WORD: 'Your message contains a word that is not allowed.',
  TOO_LONG:     `Messages cannot exceed ${MESSAGE_MAX} characters.`,
  EMPTY:        'Message cannot be empty.',
}

// ─── Rate limit guard ─────────────────────────────────────────────────────────

export interface RateLimitGuard {
  allowed: boolean
  reason?: string
}

export function checkMessageRateLimit(recentCount: number): RateLimitGuard {
  if (recentCount >= MSG_RATE_LIMIT) {
    return {
      allowed: false,
      reason: `You can send at most ${MSG_RATE_LIMIT} messages per ${MSG_RATE_WINDOW_MIN} minute. Please wait.`,
    }
  }
  return { allowed: true }
}

// ─── Participant check ────────────────────────────────────────────────────────

export interface ParticipantGuard {
  allowed: boolean
  reason?: string
}

export function canSendMessage(opts: {
  senderId: string
  claimantId: string
  itemReporterId: string
  claimStatus: string
  isAdmin: boolean
}): ParticipantGuard {
  const isParticipant =
    opts.senderId === opts.claimantId ||
    opts.senderId === opts.itemReporterId

  if (!isParticipant && !opts.isAdmin) {
    return { allowed: false, reason: 'Only the two parties on a claim can exchange messages.' }
  }

  // Both parties can message while claim is pending or approved.
  // Once rejected/withdrawn/resolved we could restrict, but we allow
  // brief wrap-up messages.
  if (opts.claimStatus === 'expired') {
    return { allowed: false, reason: 'This claim has expired. Messaging is closed.' }
  }

  return { allowed: true }
}

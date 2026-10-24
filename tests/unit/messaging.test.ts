/**
 * Unit tests for lib/messaging.ts — pure business logic.
 * No network, no DB.
 */
import { describe, it, expect } from 'vitest'
import {
  checkMessageContent,
  checkMessageRateLimit,
  canSendMessage,
  CONTENT_FILTER_MESSAGES,
  MESSAGE_MAX,
  MSG_RATE_LIMIT,
} from '@/lib/messaging'

// ─── checkMessageContent ──────────────────────────────────────────────────────

describe('checkMessageContent', () => {
  it('accepts a normal message', () => {
    expect(checkMessageContent('Hi, I can prove this is mine.').ok).toBe(true)
  })

  it('rejects an empty string', () => {
    const r = checkMessageContent('')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('EMPTY')
  })

  it('rejects a whitespace-only string', () => {
    const r = checkMessageContent('   ')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('EMPTY')
  })

  it(`rejects messages over ${MESSAGE_MAX} characters`, () => {
    const r = checkMessageContent('a'.repeat(MESSAGE_MAX + 1))
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('TOO_LONG')
  })

  it(`accepts messages exactly ${MESSAGE_MAX} characters`, () => {
    expect(checkMessageContent('a'.repeat(MESSAGE_MAX)).ok).toBe(true)
  })

  it('rejects https:// links', () => {
    const r = checkMessageContent('Call me at https://wa.me/123456')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('URL_DETECTED')
  })

  it('rejects http:// links', () => {
    const r = checkMessageContent('Check http://example.com/proof')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('URL_DETECTED')
  })

  it('rejects bare domain paths', () => {
    const r = checkMessageContent('Visit example.com/page to see')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('URL_DETECTED')
  })

  it('does not reject text that merely contains a TLD word', () => {
    // "com" alone without a domain pattern should be fine
    expect(checkMessageContent('I have it. Come collect it.').ok).toBe(true)
  })

  it('rejects the word "spam" (blocked word)', () => {
    const r = checkMessageContent('This is a spam message')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('BLOCKED_WORD')
  })

  it('rejects "scam" as a blocked word', () => {
    const r = checkMessageContent('Sounds like a scam to me')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('BLOCKED_WORD')
  })

  it('does not reject words that contain a blocked word as a substring', () => {
    // "camping" contains "cam" but not the whole word "scam"
    expect(checkMessageContent('I left it near the camping area.').ok).toBe(true)
  })

  it('every reason has a human-readable message in CONTENT_FILTER_MESSAGES', () => {
    const reasons: (keyof typeof CONTENT_FILTER_MESSAGES)[] = [
      'URL_DETECTED', 'BLOCKED_WORD', 'TOO_LONG', 'EMPTY',
    ]
    for (const reason of reasons) {
      expect(CONTENT_FILTER_MESSAGES[reason]).toBeTruthy()
    }
  })
})

// ─── checkMessageRateLimit ────────────────────────────────────────────────────

describe('checkMessageRateLimit', () => {
  it('allows when count is 0', () => {
    expect(checkMessageRateLimit(0).allowed).toBe(true)
  })

  it(`allows when count is exactly ${MSG_RATE_LIMIT - 1}`, () => {
    expect(checkMessageRateLimit(MSG_RATE_LIMIT - 1).allowed).toBe(true)
  })

  it(`blocks when count equals ${MSG_RATE_LIMIT}`, () => {
    const r = checkMessageRateLimit(MSG_RATE_LIMIT)
    expect(r.allowed).toBe(false)
    expect(r.reason).toBeTruthy()
  })

  it('blocks when count exceeds the limit', () => {
    expect(checkMessageRateLimit(MSG_RATE_LIMIT + 5).allowed).toBe(false)
  })
})

// ─── canSendMessage ───────────────────────────────────────────────────────────

const base = {
  senderId:       'claimant-uid',
  claimantId:     'claimant-uid',
  itemReporterId: 'reporter-uid',
  claimStatus:    'approved',
  isAdmin:        false,
}

describe('canSendMessage', () => {
  it('allows the claimant to send', () => {
    expect(canSendMessage({ ...base, senderId: 'claimant-uid' }).allowed).toBe(true)
  })

  it('allows the item reporter to send', () => {
    expect(canSendMessage({ ...base, senderId: 'reporter-uid' }).allowed).toBe(true)
  })

  it('allows an admin to send even if not a participant', () => {
    expect(canSendMessage({ ...base, senderId: 'admin-uid', isAdmin: true }).allowed).toBe(true)
  })

  it('blocks a random user who is not a participant or admin', () => {
    const r = canSendMessage({ ...base, senderId: 'random-uid' })
    expect(r.allowed).toBe(false)
  })

  it('blocks when claimStatus is expired', () => {
    const r = canSendMessage({ ...base, claimStatus: 'expired' })
    expect(r.allowed).toBe(false)
  })

  it('allows sending on pending claim (before approval)', () => {
    expect(canSendMessage({ ...base, claimStatus: 'pending' }).allowed).toBe(true)
  })

  it('allows sending on rejected claim (for wrap-up)', () => {
    expect(canSendMessage({ ...base, claimStatus: 'rejected' }).allowed).toBe(true)
  })
})

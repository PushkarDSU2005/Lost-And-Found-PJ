/**
 * Unit tests for lib/claims.ts — pure state machine logic.
 * No network calls, no DB.
 */
import { describe, it, expect } from 'vitest'
import {
  canTransition,
  canSubmitClaim,
  canReviewClaim,
  nextStatus,
  normaliseAnswer,
  type ClaimTransition,
} from '@/lib/claims'
import type { ClaimStatus } from '@/lib/types'

// ─── canTransition ────────────────────────────────────────────────────────────

describe('canTransition', () => {
  const ALLOWED: [ClaimStatus, ClaimTransition][] = [
    ['pending', 'approve'],
    ['pending', 'reject'],
    ['pending', 'withdraw'],
    ['approved', 'reject'],
  ]

  it.each(ALLOWED)('%s → %s is allowed', (from, tr) => {
    expect(canTransition(from, tr).allowed).toBe(true)
  })

  const BLOCKED: [ClaimStatus, ClaimTransition][] = [
    ['approved',  'approve'],
    ['approved',  'withdraw'],
    ['rejected',  'approve'],
    ['rejected',  'reject'],
    ['rejected',  'withdraw'],
    ['withdrawn', 'approve'],
    ['withdrawn', 'reject'],
    ['withdrawn', 'withdraw'],
  ]

  it.each(BLOCKED)('%s → %s is blocked', (from, tr) => {
    const result = canTransition(from, tr)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeDefined()
  })
})

// ─── nextStatus ───────────────────────────────────────────────────────────────

describe('nextStatus', () => {
  it('approve → approved', () => expect(nextStatus('approve')).toBe('approved'))
  it('reject  → rejected',  () => expect(nextStatus('reject')).toBe('rejected'))
  it('withdraw → withdrawn', () => expect(nextStatus('withdraw')).toBe('withdrawn'))
})

// ─── canSubmitClaim ───────────────────────────────────────────────────────────

const BASE_SUBMIT = {
  itemStatus:                'open'  as const,
  itemReporterId:            'reporter-uid',
  claimantId:                'other-uid',
  existingActiveClaimStatus: null,
  isBanned:                  false,
}

describe('canSubmitClaim', () => {
  it('allows a normal claim on an open item', () => {
    expect(canSubmitClaim(BASE_SUBMIT).allowed).toBe(true)
  })

  it('blocks a banned claimant', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, isBanned: true })
    expect(r.allowed).toBe(false)
    expect(r.code).toBe('BANNED')
  })

  it('blocks claiming own item', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, claimantId: 'reporter-uid' })
    expect(r.allowed).toBe(false)
    expect(r.code).toBe('OWN_ITEM')
  })

  it('blocks claim on non-open item', () => {
    const statuses = ['claimed', 'resolved', 'expired'] as const
    for (const s of statuses) {
      const r = canSubmitClaim({ ...BASE_SUBMIT, itemStatus: s })
      expect(r.allowed).toBe(false)
      expect(r.code).toBe('ITEM_NOT_OPEN')
    }
  })

  it('blocks duplicate pending claim', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, existingActiveClaimStatus: 'pending' })
    expect(r.allowed).toBe(false)
    expect(r.code).toBe('DUPLICATE')
  })

  it('blocks duplicate approved claim', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, existingActiveClaimStatus: 'approved' })
    expect(r.allowed).toBe(false)
    expect(r.code).toBe('DUPLICATE')
  })

  it('allows re-claim after withdrawal', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, existingActiveClaimStatus: 'withdrawn' })
    expect(r.allowed).toBe(true)
  })

  it('allows re-claim after rejection', () => {
    const r = canSubmitClaim({ ...BASE_SUBMIT, existingActiveClaimStatus: 'rejected' })
    expect(r.allowed).toBe(true)
  })
})

// ─── canReviewClaim ───────────────────────────────────────────────────────────

const BASE_REVIEW = {
  reviewerId:     'reporter-uid',
  itemReporterId: 'reporter-uid',
  isAdmin:        false,
  claimStatus:    'pending' as ClaimStatus,
  transition:     'approve' as const,
}

describe('canReviewClaim', () => {
  it('item reporter can approve pending claim', () => {
    expect(canReviewClaim(BASE_REVIEW).allowed).toBe(true)
  })

  it('item reporter can reject pending claim', () => {
    expect(canReviewClaim({ ...BASE_REVIEW, transition: 'reject' }).allowed).toBe(true)
  })

  it('non-owner non-admin cannot review', () => {
    const r = canReviewClaim({ ...BASE_REVIEW, reviewerId: 'stranger-uid' })
    expect(r.allowed).toBe(false)
  })

  it('admin can review even if not the reporter', () => {
    const r = canReviewClaim({
      ...BASE_REVIEW,
      reviewerId: 'admin-uid',
      isAdmin: true,
    })
    expect(r.allowed).toBe(true)
  })

  it('reporter cannot reverse an already-approved claim (only admin can)', () => {
    const r = canReviewClaim({
      ...BASE_REVIEW,
      claimStatus: 'approved',
      transition: 'reject',
      isAdmin: false,
    })
    expect(r.allowed).toBe(false)
  })

  it('admin can reverse an approved claim', () => {
    const r = canReviewClaim({
      ...BASE_REVIEW,
      reviewerId:  'admin-uid',
      claimStatus: 'approved',
      transition:  'reject',
      isAdmin:     true,
    })
    expect(r.allowed).toBe(true)
  })

  it('cannot approve an already-approved claim', () => {
    const r = canReviewClaim({ ...BASE_REVIEW, claimStatus: 'approved', transition: 'approve' })
    expect(r.allowed).toBe(false)
  })

  it('cannot review a withdrawn claim', () => {
    const r = canReviewClaim({ ...BASE_REVIEW, claimStatus: 'withdrawn', transition: 'approve' })
    expect(r.allowed).toBe(false)
  })

  it('cannot review a rejected claim', () => {
    const r = canReviewClaim({ ...BASE_REVIEW, claimStatus: 'rejected', transition: 'approve' })
    expect(r.allowed).toBe(false)
  })
})

// ─── normaliseAnswer ─────────────────────────────────────────────────────────

describe('normaliseAnswer', () => {
  it('lowercases', () => expect(normaliseAnswer('Green')).toBe('green'))
  it('trims whitespace', () => expect(normaliseAnswer('  green  ')).toBe('green'))
  it('handles empty string', () => expect(normaliseAnswer('')).toBe(''))
  it('preserves inner spaces', () => expect(normaliseAnswer('dark green')).toBe('dark green'))
})

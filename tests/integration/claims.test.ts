/**
 * Integration tests: claim flow — all transitions + edge cases.
 *
 * Runs against the real remote Supabase project.
 * Personas: anon, studentA (item owner), studentB (claimant), admin.
 *
 * Run: pnpm test:integration -- claims
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Real seed UUIDs ──────────────────────────────────────────────────────────

const SEED = {
  users: {
    studentA: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869', // item owner (avikjaiswal01)
    studentB: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', // claimant  (myoneplus373)
    admin:    '808220f8-5762-45ea-afb4-8ca1efe5b4d1',
  },
}

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function svc() { return createClient(URL, SVC, { auth: { persistSession: false } }) }
async function signedIn(email: string, pw: string): Promise<SupabaseClient> {
  const c = createClient(URL, ANON)
  const { error } = await c.auth.signInWithPassword({ email, password: pw })
  if (error) throw new Error(`Auth failed: ${error.message}`)
  return c
}

// ─── Mock server module so server actions run in vitest/node ─────────────────

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => _mockClient,
  createSupabaseServiceClient: () => svc(),
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    capturedRedirects.push(url)
    const err = new Error('NEXT_REDIRECT')
    Object.defineProperty(err, 'digest', { value: `NEXT_REDIRECT;replace;${url};303;` })
    throw err
  },
}))

const capturedRedirects: string[] = []
let _mockClient: SupabaseClient

// Import actions AFTER mocks
const { submitClaim, reviewClaim, markReturned } = await import('@/app/actions/claims')

// ─── Helper: call action and catch redirect throw ────────────────────────────

type AnyResult = { success: boolean; error?: string; code?: string } | undefined

async function call(fn: () => Promise<AnyResult>): Promise<AnyResult> {
  const prevLen = capturedRedirects.length
  try {
    return (await fn()) as AnyResult
  } catch (err) {
    if (capturedRedirects.length > prevLen) return { success: true }
    const digest = (err as { digest?: string }).digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) return { success: true }
    throw err
  }
}

// ─── Test fixtures ────────────────────────────────────────────────────────────

let testItemId: string        // open item owned by studentA, no verification question
let verifyItemId: string      // open item owned by studentA, WITH verification question
const createdClaimIds: string[] = []

beforeAll(async () => {
  if (!URL || !ANON || !SVC) throw new Error('Missing env vars')

  const service = svc()

  // Item 1: plain open item (no verification)
  const { data: item1 } = await service.from('items').insert({
    reporter_id: SEED.users.studentA,
    report_type: 'found',
    category: 'other',
    title: 'Claims integration test item',
    is_sensitive: false,
    status: 'open',
  }).select('id').single()
  testItemId = item1!.id

  // Item 2: open item WITH verification question
  const { hashVerificationAnswer } = await import('@/lib/sanitize')
  const hash = await hashVerificationAnswer('green')
  const { data: item2 } = await service.from('items').insert({
    reporter_id: SEED.users.studentA,
    report_type: 'found',
    category: 'other',
    title: 'Claims integration test item (with verification)',
    is_sensitive: false,
    status: 'open',
    verification_question: 'What colour is the strap?',
    verification_answer_hash: hash,
  }).select('id').single()
  verifyItemId = item2!.id

  // Ensure studentB is not banned
  await service.from('profiles').update({ is_banned: false }).eq('id', SEED.users.studentB)
})

afterAll(async () => {
  const service = svc()
  if (createdClaimIds.length) {
    await service.from('claims').delete().in('id', createdClaimIds)
  }
  if (testItemId)   await service.from('items').delete().eq('id', testItemId)
  if (verifyItemId) await service.from('items').delete().eq('id', verifyItemId)
  await service.from('profiles').update({ is_banned: false }).eq('id', SEED.users.studentB)
})

// ─── 1. Unauthenticated submit ────────────────────────────────────────────────

describe('submitClaim: unauthenticated', () => {
  it('rejects with UNAUTHENTICATED', async () => {
    _mockClient = createClient(URL, ANON) // no session
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'proof' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('UNAUTHENTICATED')
  })
})

// ─── 2. Owner claiming own item ───────────────────────────────────────────────

describe('submitClaim: owner cannot claim own item', () => {
  it('rejects with OWN_ITEM', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'my own item' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('OWN_ITEM')
    await _mockClient.auth.signOut()
  })
})

// ─── 3. Banned claimant ───────────────────────────────────────────────────────

describe('submitClaim: banned user', () => {
  it('rejects with BANNED', async () => {
    await svc().from('profiles').update({ is_banned: true }).eq('id', SEED.users.studentB)
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'proof' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('BANNED')
    await svc().from('profiles').update({ is_banned: false }).eq('id', SEED.users.studentB)
    await _mockClient.auth.signOut()
  })
})

// ─── 4. Verification answer required ─────────────────────────────────────────

describe('submitClaim: verification question', () => {
  it('rejects when answer not provided', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: verifyItemId, proof_text: 'proof' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('ANSWER_REQUIRED')
    await _mockClient.auth.signOut()
  })

  it('rejects when answer is wrong', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({
      item_id: verifyItemId,
      proof_text: 'proof',
      verification_answer: 'blue',
    }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('WRONG_ANSWER')
    await _mockClient.auth.signOut()
  })

  it('accepts correct answer (case-insensitive)', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({
      item_id: verifyItemId,
      proof_text: 'I know the strap colour',
      verification_answer: 'GREEN', // should match 'green' after normalisation
    }))
    expect(r?.success).toBe(true)

    // Clean up
    const { data: claim } = await svc().from('claims').select('id')
      .eq('item_id', verifyItemId).eq('claimant_id', SEED.users.studentB).single()
    if (claim) createdClaimIds.push((claim as { id: string }).id)
    await _mockClient.auth.signOut()
  })
})

// ─── 5. Successful claim submission ──────────────────────────────────────────

describe('submitClaim: success', () => {
  let claimId: string

  it('inserts a pending claim row', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'My initials are on it' }))
    expect(r?.success).toBe(true)

    const { data } = await svc().from('claims').select('id, status')
      .eq('item_id', testItemId).eq('claimant_id', SEED.users.studentB).single()
    expect(data).toBeTruthy()
    expect((data as { status: string }).status).toBe('pending')
    claimId = (data as { id: string }).id
    createdClaimIds.push(claimId)
    await _mockClient.auth.signOut()
  })

  // ─── 6. Duplicate claim ─────────────────────────────────────────────────

  it('rejects a duplicate pending claim', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'duplicate' }))
    expect(r?.success).toBe(false)
    expect(['DUPLICATE', 'DB_ERROR']).toContain(r?.code)
    await _mockClient.auth.signOut()
  })

  // ─── 7. Finder approves claim ───────────────────────────────────────────

  it('finder (studentA) approves the claim — item becomes claimed', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await call(() => reviewClaim({ claim_id: claimId, transition: 'approve' }))
    expect(r?.success).toBe(true)

    const { data: updatedClaim } = await svc().from('claims').select('status').eq('id', claimId).single()
    expect((updatedClaim as { status: string }).status).toBe('approved')

    const { data: updatedItem } = await svc().from('items').select('status').eq('id', testItemId).single()
    expect((updatedItem as { status: string }).status).toBe('claimed')
    await _mockClient.auth.signOut()
  })

  // ─── 8. Finder marks returned ───────────────────────────────────────────

  it('finder marks item as returned — item becomes resolved', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await call(() => markReturned({ item_id: testItemId }))
    expect(r?.success).toBe(true)

    const { data } = await svc().from('items').select('status').eq('id', testItemId).single()
    expect((data as { status: string }).status).toBe('resolved')
    await _mockClient.auth.signOut()
  })
})

// ─── 9. Claim on non-open item ───────────────────────────────────────────────

describe('submitClaim: item not open', () => {
  it('rejects with ITEM_NOT_OPEN when item is resolved', async () => {
    // testItemId is now 'resolved' from the flow above
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => submitClaim({ item_id: testItemId, proof_text: 'too late' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('ITEM_NOT_OPEN')
    await _mockClient.auth.signOut()
  })
})

// ─── 10. Non-owner cannot review ─────────────────────────────────────────────

describe('reviewClaim: unauthorised reviewer', () => {
  let pendingClaimId: string

  beforeAll(async () => {
    // Need a fresh open item + pending claim
    const { data: freshItem } = await svc().from('items').insert({
      reporter_id: SEED.users.studentA,
      report_type: 'found', category: 'other',
      title: 'Unauthorised review test', status: 'open',
    }).select('id').single()

    const { data: freshClaim } = await svc().from('claims').insert({
      item_id: freshItem!.id,
      claimant_id: SEED.users.studentB,
      proof_text: 'test proof',
      status: 'pending',
    }).select('id').single()
    pendingClaimId = (freshClaim as { id: string }).id
    createdClaimIds.push(pendingClaimId)
    // Track the item too
    createdClaimIds.push(freshItem!.id) // we'll clean it via cascade
  })

  it('studentB cannot approve their own claim', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await call(() => reviewClaim({ claim_id: pendingClaimId, transition: 'approve' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('FORBIDDEN')
    await _mockClient.auth.signOut()
  })
})

// ─── 11. Admin can review any claim ──────────────────────────────────────────

describe('reviewClaim: admin reviewer', () => {
  let adminTestClaimId: string
  let adminTestItemId: string

  beforeAll(async () => {
    const { data: item } = await svc().from('items').insert({
      reporter_id: SEED.users.studentA,
      report_type: 'found', category: 'other',
      title: 'Admin review test item', status: 'open',
    }).select('id').single()
    adminTestItemId = item!.id

    const { data: claim } = await svc().from('claims').insert({
      item_id: adminTestItemId,
      claimant_id: SEED.users.studentB,
      proof_text: 'admin test',
      status: 'pending',
    }).select('id').single()
    adminTestClaimId = (claim as { id: string }).id
    createdClaimIds.push(adminTestClaimId)
  })

  afterAll(async () => {
    if (adminTestItemId) await svc().from('items').delete().eq('id', adminTestItemId)
  })

  it('admin can reject a pending claim', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_ADMIN_EMAIL!, process.env.TEST_USER_ADMIN_PASSWORD!)
    const r = await call(() => reviewClaim({
      claim_id: adminTestClaimId,
      transition: 'reject',
      admin_note: 'Duplicate item',
    }))
    expect(r?.success).toBe(true)

    const { data } = await svc().from('claims').select('status, admin_note').eq('id', adminTestClaimId).single()
    expect((data as { status: string }).status).toBe('rejected')
    expect((data as { admin_note: string }).admin_note).toBe('Duplicate item')
    await _mockClient.auth.signOut()
  })
})

// ─── 12. Cannot mark returned if not claimed ─────────────────────────────────

describe('markReturned: wrong status', () => {
  it('rejects with WRONG_STATUS on an open item', async () => {
    // verifyItemId is still 'open' (the claim flow was on a different item)
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await call(() => markReturned({ item_id: verifyItemId }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('WRONG_STATUS')
    await _mockClient.auth.signOut()
  })
})

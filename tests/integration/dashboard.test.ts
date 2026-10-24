/**
 * Integration tests: Dashboard actions (edit, delete, withdraw).
 *
 * Tests:
 * 1. editItem — success, ownership check, wrong status
 * 2. deleteItem — success, ownership check, cannot delete with claims
 * 3. withdrawClaim — success, ownership check, wrong status
 *
 * Run: pnpm test:integration -- dashboard
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SEED = {
  studentA: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869',
  studentB: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4',
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

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

const { editItem, deleteItem, withdrawClaim } = await import('@/app/actions/items')

// ─── Helper ───────────────────────────────────────────────────────────────────

type ActionResult = { success: boolean; error?: string; code?: string } | undefined
async function callAction(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  const prevLen = capturedRedirects.length
  try {
    return (await fn()) as ActionResult
  } catch (err) {
    if (capturedRedirects.length > prevLen) return { success: true }
    const digest = (err as { digest?: string }).digest ?? ''
    if (digest.startsWith('NEXT_REDIRECT')) return { success: true }
    throw err
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let testItemId: string
let testItemWithClaimId: string
let testClaimId: string
const cleanup = { items: [] as string[], claims: [] as string[] }

beforeAll(async () => {
  const service = svc()

  // Item 1: owned by studentA, no claims
  const { data: item1 } = await service.from('items').insert({
    reporter_id: SEED.studentA, report_type: 'found', category: 'other',
    title: 'Dashboard test item', status: 'open',
  }).select('id').single()
  testItemId = item1!.id
  cleanup.items.push(testItemId)

  // Item 2: owned by studentA, has a claim
  const { data: item2 } = await service.from('items').insert({
    reporter_id: SEED.studentA, report_type: 'found', category: 'other',
    title: 'Dashboard test item with claim', status: 'open',
  }).select('id').single()
  testItemWithClaimId = item2!.id
  cleanup.items.push(testItemWithClaimId)

  const { data: claim } = await service.from('claims').insert({
    item_id: testItemWithClaimId, claimant_id: SEED.studentB,
    status: 'pending', proof_text: 'Test claim',
  }).select('id').single()
  testClaimId = (claim as { id: string }).id
  cleanup.claims.push(testClaimId)
})

afterAll(async () => {
  const service = svc()
  if (cleanup.claims.length) await service.from('claims').delete().in('id', cleanup.claims)
  if (cleanup.items.length) await service.from('items').delete().in('id', cleanup.items)
})

// ─── editItem ─────────────────────────────────────────────────────────────────

describe('editItem', () => {
  it('succeeds when owner edits own open item', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await callAction(() => editItem({ item_id: testItemId, title: 'Edited title', description: 'Edited desc' }))
    expect(r?.success).toBe(true)

    // Verify the update
    const { data } = await svc().from('items').select('title, description').eq('id', testItemId).single()
    expect((data as { title: string }).title).toBe('Edited title')
    expect((data as { description: string }).description).toBe('Edited desc')
    await _mockClient.auth.signOut()
  })

  it('rejects when non-owner tries to edit', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await callAction(() => editItem({ item_id: testItemId, title: 'Hacked' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('FORBIDDEN')
    await _mockClient.auth.signOut()
  })

  it('rejects when trying to edit non-open item', async () => {
    // Mark item as claimed
    await svc().from('items').update({ status: 'claimed' }).eq('id', testItemId)

    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await callAction(() => editItem({ item_id: testItemId, title: 'Try edit' }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('WRONG_STATUS')

    // Reset
    await svc().from('items').update({ status: 'open' }).eq('id', testItemId)
    await _mockClient.auth.signOut()
  })
})

// ─── deleteItem ───────────────────────────────────────────────────────────────

describe('deleteItem', () => {
  it('succeeds when owner deletes own open item with no claims', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await callAction(() => deleteItem({ item_id: testItemId }))
    expect(r?.success).toBe(true)

    // Verify deletion
    const { data } = await svc().from('items').select('id').eq('id', testItemId).maybeSingle()
    expect(data).toBeNull()

    // Remove from cleanup (already deleted)
    cleanup.items = cleanup.items.filter((id) => id !== testItemId)
    await _mockClient.auth.signOut()
  })

  it('rejects when trying to delete item with claims', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await callAction(() => deleteItem({ item_id: testItemWithClaimId }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('HAS_CLAIMS')
    await _mockClient.auth.signOut()
  })

  it('rejects when non-owner tries to delete', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await callAction(() => deleteItem({ item_id: testItemWithClaimId }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('FORBIDDEN')
    await _mockClient.auth.signOut()
  })
})

// ─── withdrawClaim ────────────────────────────────────────────────────────────

describe('withdrawClaim', () => {
  it('succeeds when claimant withdraws own pending claim', async () => {
    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await callAction(() => withdrawClaim({ claim_id: testClaimId }))
    expect(r?.success).toBe(true)

    // Verify withdrawal
    const { data } = await svc().from('claims').select('status').eq('id', testClaimId).single()
    expect((data as { status: string }).status).toBe('withdrawn')
    await _mockClient.auth.signOut()
  })

  it('rejects when non-claimant tries to withdraw', async () => {
    // Reset claim to pending
    await svc().from('claims').update({ status: 'pending' }).eq('id', testClaimId)

    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    const r = await callAction(() => withdrawClaim({ claim_id: testClaimId }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('FORBIDDEN')
    await _mockClient.auth.signOut()
  })

  it('rejects when trying to withdraw non-pending claim', async () => {
    // Set claim to approved
    await svc().from('claims').update({ status: 'approved' }).eq('id', testClaimId)

    _mockClient = await signedIn(process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    const r = await callAction(() => withdrawClaim({ claim_id: testClaimId }))
    expect(r?.success).toBe(false)
    expect(r?.code).toBe('WRONG_STATUS')

    // Reset
    await svc().from('claims').update({ status: 'pending' }).eq('id', testClaimId)
    await _mockClient.auth.signOut()
  })
})

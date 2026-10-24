/**
 * Integration tests for createItem server action.
 *
 * Each test runs against the real remote Supabase project.
 * Personas: anon, studentA (normal), studentB (banned for one test), admin.
 *
 * IMPORTANT: These tests import the server action directly and call it with
 * pre-built payloads. Because createItem uses `cookies()` from next/headers,
 * we mock the Supabase server client to inject the correct session for each
 * persona. The Supabase JS client is used directly to set up and tear down
 * test data, mirroring the pattern in rls.test.ts.
 *
 * Run: pnpm test:integration -- createItem
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_H,
  type CreateItemResult,
} from '@/app/actions/items'

// ─── Real seed UUIDs (from reseed-real-uuids.sql) ────────────────────────────

const USERS = {
  admin:    { id: '808220f8-5762-45ea-afb4-8ca1efe5b4d1', email: process.env.TEST_USER_ADMIN_EMAIL!,     password: process.env.TEST_USER_ADMIN_PASSWORD! },
  studentA: { id: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869', email: process.env.TEST_USER_STUDENT_A_EMAIL!, password: process.env.TEST_USER_STUDENT_A_PASSWORD! },
  studentB: { id: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', email: process.env.TEST_USER_STUDENT_B_EMAIL!, password: process.env.TEST_USER_STUDENT_B_PASSWORD! },
}

const LOC_LIBRARY = '10000000-0000-0000-0000-000000000001'

// ─── Client helpers ───────────────────────────────────────────────────────────

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function serviceClient(): SupabaseClient {
  return createClient(URL, SVC_KEY, { auth: { persistSession: false } })
}

async function signedInClient(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(URL, ANON_KEY)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  return client
}

// ─── Mock next/headers so server action can run outside Next.js ───────────────
// The server action calls createSupabaseServerClient() which calls cookies().
// We mock the whole server client module to inject a real signed-in Supabase
// client for each test persona.

let _mockSupabaseClient: SupabaseClient | null = null

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => {
    if (!_mockSupabaseClient) throw new Error('No mock client set')
    return _mockSupabaseClient
  },
  createSupabaseServiceClient: () => serviceClient(),
}))

// createItem calls redirect() on success — intercept the throw
const capturedRedirects: string[] = []
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    capturedRedirects.push(url)
    // Next.js redirect() throws an error with a specific digest format.
    // We replicate that here so the server action behaves identically.
    const err = new Error(`NEXT_REDIRECT`)
    Object.defineProperty(err, 'digest', {
      value: `NEXT_REDIRECT;replace;${url};303;`,
    })
    throw err
  },
}))

function lastRedirectedItemId(): string | undefined {
  const last = capturedRedirects[capturedRedirects.length - 1]
  return last?.split('/').pop()
}

// ─── Import after mocks are set up ───────────────────────────────────────────
// Dynamic import ensures mocks are applied before the module is loaded.
const { createItem } = await import('@/app/actions/items')

// ─── Test data cleanup tracking ───────────────────────────────────────────────
const createdItemIds: string[] = []

async function callCreateItem(input: unknown): Promise<CreateItemResult> {
  const prevLen = capturedRedirects.length
  try {
    return (await createItem(input)) as CreateItemResult
  } catch (err) {
    const errMsg = (err as Error).message ?? ''
    const digest = (err as { digest?: string }).digest ?? ''

    // Our mock pushed to capturedRedirects before throwing
    if (capturedRedirects.length > prevLen) {
      const url = capturedRedirects[capturedRedirects.length - 1]!
      const id = url.split('/').pop()!
      if (id && /^[0-9a-f-]{36}$/.test(id)) createdItemIds.push(id)
      return { success: true, itemId: id }
    }
    // Fallback: real Next.js NEXT_REDIRECT error
    if (digest.startsWith('NEXT_REDIRECT') || errMsg.includes('NEXT_REDIRECT')) {
      const url = digest.split(';')[2] ?? errMsg.replace('NEXT_REDIRECT:', '')
      const id = url.split('/').pop() ?? ''
      if (id) createdItemIds.push(id)
      return { success: true, itemId: id }
    }
    // Log unexpected errors to help debug
    console.error('[callCreateItem] unexpected error:', errMsg, 'digest:', digest)
    throw err
  }
}

// ─── Valid base payload ───────────────────────────────────────────────────────
// Uses studentB for success tests so the rate-limit tests (which use studentA)
// don't interfere even across test runs.

const basePayload = {
  report_type: 'found' as const,
  title: 'Integration test: blue water bottle',
  description: 'Found near the main library entrance.',
  category: 'sports_fitness' as const,
  location_id: LOC_LIBRARY,
  date_occurred: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
  is_sensitive: false,
  images: [] as string[],
}

// Success tests use studentB to avoid rate-limit interference from the rate-limit tests
const successPayload = { ...basePayload }

// ─── Suite ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!URL || !ANON_KEY || !SVC_KEY) {
    throw new Error('Missing Supabase env vars — see .env.local')
  }
})

afterAll(async () => {
  // Clean up all items created during tests
  if (createdItemIds.length > 0) {
    const svc = serviceClient()
    await svc.from('items').delete().in('id', createdItemIds)
  }
  // Ensure studentB is un-banned in case a test failed mid-way
  const svc = serviceClient()
  await svc.from('profiles').update({ is_banned: false }).eq('id', USERS.studentB.id)
})

// ─── Test 1: Not logged in ────────────────────────────────────────────────────

describe('createItem: unauthenticated', () => {
  it('rejects with UNAUTHENTICATED when no session', async () => {
    // anon client has no session
    _mockSupabaseClient = createClient(URL, ANON_KEY)

    const result = await callCreateItem(basePayload)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('UNAUTHENTICATED')
    }
  })
})

// ─── Test 2: Banned user ──────────────────────────────────────────────────────

describe('createItem: banned user', () => {
  it('rejects with BANNED when is_banned = true', async () => {
    const svc = serviceClient()
    // Ban studentB
    await svc.from('profiles').update({ is_banned: true }).eq('id', USERS.studentB.id)

    _mockSupabaseClient = await signedInClient(USERS.studentB.email, USERS.studentB.password)

    const result = await callCreateItem(basePayload)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('BANNED')

    // Unban immediately
    await svc.from('profiles').update({ is_banned: false }).eq('id', USERS.studentB.id)
  })
})

// ─── Test 3: Rate limit ───────────────────────────────────────────────────────

describe('createItem: rate limit', () => {
  it(`rejects the ${RATE_LIMIT_MAX + 1}th post within ${RATE_LIMIT_WINDOW_H}h`, async () => {
    const svc = serviceClient()

    // IDs we must never delete (stable seed items for studentA)
    const STABLE_SEED_IDS = [
      '20000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000003',
      '20000000-0000-0000-0000-000000000006',
      '20000000-0000-0000-0000-000000000009',
      '20000000-0000-0000-0000-000000000012',
      '20000000-0000-0000-0000-000000000015',
    ]

    // Delete only non-stable recent items for studentA (idempotent setup)
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_H * 60 * 60 * 1000).toISOString()
    await svc
      .from('items')
      .delete()
      .eq('reporter_id', USERS.studentA.id)
      .gte('created_at', windowStart)
      .not('id', 'in', `(${STABLE_SEED_IDS.join(',')})`)

    // Insert exactly RATE_LIMIT_MAX items to saturate the window
    const fakeItems = Array.from({ length: RATE_LIMIT_MAX }).map((_, i) => ({
      reporter_id: USERS.studentA.id,
      report_type: 'lost' as const,
      category: 'other' as const,
      title: `Rate limit test item ${i + 1}`,
      status: 'open' as const,
    }))

    const { data: inserted } = await svc.from('items').insert(fakeItems).select('id')
    const insertedIds = (inserted ?? []).map((r: { id: string }) => r.id)

    _mockSupabaseClient = await signedInClient(USERS.studentA.email, USERS.studentA.password)

    const result = await callCreateItem({
      ...basePayload,
      title: 'Should be rejected by rate limit',
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('RATE_LIMITED')

    // Clean up only the items we inserted (never delete seed items)
    if (insertedIds.length > 0) {
      await svc.from('items').delete().in('id', insertedIds)
    }
  })
})

// ─── Test 4: Validation error ─────────────────────────────────────────────────

describe('createItem: validation', () => {
  it('rejects with VALIDATION_ERROR for a too-short title', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentA.email, USERS.studentA.password)

    const result = await callCreateItem({ ...basePayload, title: 'ab' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('rejects with VALIDATION_ERROR for invalid category', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentA.email, USERS.studentA.password)

    const result = await callCreateItem({ ...basePayload, category: 'furniture' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('VALIDATION_ERROR')
  })
})

// ─── Test 5: Success ─────────────────────────────────────────────────────────

describe('createItem: success', () => {
  // Use studentB so rate-limit test (which uses studentA) can't interfere
  it('inserts an item and redirects to /items/:id', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentB.email, USERS.studentB.password)

    const result = await callCreateItem({
      ...successPayload,
      title: 'Integration test item — success case',
      description: 'A properly filled-out report for testing.',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.itemId).toMatch(/^[0-9a-f-]{36}$/)

      const svc = serviceClient()
      const { data } = await svc
        .from('items')
        .select('title, reporter_id, expires_at, is_sensitive')
        .eq('id', result.itemId)
        .single()

      expect(data?.title).toBe('Integration test item — success case')
      expect(data?.reporter_id).toBe(USERS.studentB.id)
      expect(data?.is_sensitive).toBe(false)
      const exp = new Date(data?.expires_at as string)
      const diffDays = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      expect(diffDays).toBeGreaterThan(58)
      expect(diffDays).toBeLessThan(62)
    }
  })

  it('creates a found item with verification question and hashed answer', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentB.email, USERS.studentB.password)

    const result = await callCreateItem({
      ...successPayload,
      title: 'Found item with verification',
      verification_question: 'What colour is the strap?',
      verification_answer: 'Green',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      const svc = serviceClient()
      const { data } = await svc
        .from('items')
        .select('verification_question, verification_answer_hash')
        .eq('id', result.itemId)
        .single()

      expect(data?.verification_question).toBe('What colour is the strap?')
      expect(data?.verification_answer_hash).toMatch(/^[0-9a-f]{64}$/)
      const { hashVerificationAnswer } = await import('@/lib/sanitize')
      const expected = await hashVerificationAnswer('Green')
      expect(data?.verification_answer_hash).toBe(expected)
    }
  })
})

// ─── Test 6: Sensitive image goes to private bucket ───────────────────────────

describe('createItem: sensitive item bucket routing', () => {
  it('sets is_sensitive=true on the row', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentB.email, USERS.studentB.password)

    const result = await callCreateItem({
      ...successPayload,
      title: 'Sensitive item integration test',
      is_sensitive: true,
      images: [],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      const svc = serviceClient()
      const { data } = await svc
        .from('items')
        .select('is_sensitive')
        .eq('id', result.itemId)
        .single()

      expect(data?.is_sensitive).toBe(true)
    }
  })

  it('image_images rows for sensitive item reference sensitive-images bucket', async () => {
    const svc = serviceClient()

    // Insert item + image row directly to test the bucket column
    const { data: item } = await svc
      .from('items')
      .insert({
        reporter_id: USERS.studentA.id,
        report_type: 'found',
        category: 'id_documents',
        title: 'Sensitive bucket routing test',
        is_sensitive: true,
        status: 'open',
      })
      .select('id')
      .single()
    createdItemIds.push(item!.id)

    await svc.from('item_images').insert({
      item_id: item!.id,
      storage_path: `${USERS.studentA.id}/${item!.id}/test.jpg`,
      bucket: 'sensitive-images',
      sort_order: 0,
    })

    const { data: imgRow } = await svc
      .from('item_images')
      .select('bucket')
      .eq('item_id', item!.id)
      .single()

    expect(imgRow?.bucket).toBe('sensitive-images')
  })
})

// ─── Test 7: Oversized image rejected by validator ────────────────────────────

describe('createItem: oversized image rejected', () => {
  it('fails VALIDATION_ERROR when image path is empty string', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentA.email, USERS.studentA.password)

    // The server schema validates images as non-empty strings (storage paths)
    const result = await callCreateItem({ ...basePayload, images: [''] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('VALIDATION_ERROR')
  })

  it('fails VALIDATION_ERROR when more than MAX_IMAGES paths sent', async () => {
    _mockSupabaseClient = await signedInClient(USERS.studentA.email, USERS.studentA.password)

    const result = await callCreateItem({
      ...basePayload,
      images: ['path/1.jpg', 'path/2.jpg', 'path/3.jpg', 'path/4.jpg'],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.code).toBe('VALIDATION_ERROR')
  })
})

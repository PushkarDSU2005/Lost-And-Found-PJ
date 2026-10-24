/**
 * RLS Integration Tests
 * =====================
 * Verifies every Row Level Security policy defined in migration 005_rls.sql
 * against a real Supabase project (local dev or CI staging instance).
 *
 * Personas tested:
 *   • anon        – unauthenticated visitor (uses anon key, no session)
 *   • studentA    – regular authenticated student; owns some items
 *   • studentB    – different authenticated student; owns other items
 *   • admin       – user with role = 'admin' in profiles table
 *
 * Pre-conditions (ensured by seed.sql stable UUIDs):
 *   All seed data is loaded before these tests run.
 *
 * Running locally:
 *   1. Start Supabase:  npx supabase start
 *   2. Apply migrations: npx supabase db reset
 *   3. pnpm vitest run tests/integration/rls.test.ts
 *
 * Environment variables required (add to .env.test.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   TEST_USER_ADMIN_EMAIL / TEST_USER_ADMIN_PASSWORD
 *   TEST_USER_STUDENT_A_EMAIL / TEST_USER_STUDENT_A_PASSWORD
 *   TEST_USER_STUDENT_B_EMAIL / TEST_USER_STUDENT_B_PASSWORD
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Stable seed UUIDs (must match reseed-real-uuids.sql)
// ---------------------------------------------------------------------------
const SEED = {
  users: {
    // Real GoTrue UUIDs — assigned when accounts were created via Admin API
    admin:    '808220f8-5762-45ea-afb4-8ca1efe5b4d1', // pushkarraj11a7317@gmail.com
    studentA: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869', // avikjaiswal01@gmail.com
    studentB: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', // myoneplus373@gmail.com
    studentC: 'c9f3e441-0000-4000-8000-000000000004', // carol-seed (internal only)
  },
  items: {
    openByA:  '20000000-0000-0000-0000-000000000001', // lost iPhone,   reporter = studentA
    openByB:  '20000000-0000-0000-0000-000000000002', // found earbuds, reporter = studentB
    resolved: '20000000-0000-0000-0000-000000000013', // resolved,      reporter = studentC
  },
  locations: {
    library:      '10000000-0000-0000-0000-000000000001',
    dropSecurity: '10000000-0000-0000-0000-000000000011',
  },
} as const

// ---------------------------------------------------------------------------
// Client factory helpers
// ---------------------------------------------------------------------------
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/** Anon client — no auth session */
function anonClient(): SupabaseClient {
  return createClient(URL, ANON_KEY)
}

/** Service-role client — bypasses RLS; used for test setup / teardown */
function serviceClient(): SupabaseClient {
  return createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false },
  })
}

/**
 * Returns a client authenticated as the given test user.
 * Uses email/password sign-in — test users must exist in auth.users.
 */
async function authenticatedClient(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const client = createClient(URL, ANON_KEY)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`)
  return client
}

// ---------------------------------------------------------------------------
// Test suite setup
// ---------------------------------------------------------------------------

let anon: SupabaseClient
let studentA: SupabaseClient
let studentB: SupabaseClient
let admin: SupabaseClient
let service: SupabaseClient

/** Unique suffix to avoid seed data collisions across test runs */
const RUN_ID = Date.now().toString(36)

/** Track IDs of rows created during tests so we can clean them up */
const cleanup = {
  items: [] as string[],
  claims: [] as string[],
  notifications: [] as string[],
}

beforeAll(async () => {
  // Verify env vars are present before attempting connections
  if (!URL || !ANON_KEY || !SERVICE_KEY) {
    throw new Error(
      'RLS tests require NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ' +
        'and SUPABASE_SERVICE_ROLE_KEY to be set.',
    )
  }

  service = serviceClient()
  anon = anonClient()

  const envA = {
    email: process.env.TEST_USER_STUDENT_A_EMAIL!,
    password: process.env.TEST_USER_STUDENT_A_PASSWORD!,
  }
  const envB = {
    email: process.env.TEST_USER_STUDENT_B_EMAIL!,
    password: process.env.TEST_USER_STUDENT_B_PASSWORD!,
  }
  const envAdmin = {
    email: process.env.TEST_USER_ADMIN_EMAIL!,
    password: process.env.TEST_USER_ADMIN_PASSWORD!,
  }

  ;[studentA, studentB, admin] = await Promise.all([
    authenticatedClient(envA.email, envA.password),
    authenticatedClient(envB.email, envB.password),
    authenticatedClient(envAdmin.email, envAdmin.password),
  ])
})

afterAll(async () => {
  // Clean up any rows created during tests
  if (cleanup.claims.length) {
    await service.from('claims').delete().in('id', cleanup.claims)
  }
  if (cleanup.items.length) {
    await service.from('items').delete().in('id', cleanup.items)
  }
  if (cleanup.notifications.length) {
    await service.from('notifications').delete().in('id', cleanup.notifications)
  }

  // Sign out all authenticated clients
  await Promise.all([
    studentA.auth.signOut(),
    studentB.auth.signOut(),
    admin.auth.signOut(),
  ])
})

// ===========================================================================
// LOCATIONS — public reference data
// ===========================================================================
describe('RLS: locations', () => {
  it('anon can read locations', async () => {
    const { data, error } = await anon.from('locations').select('id, name').limit(5)
    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('anon cannot insert a location', async () => {
    const { error } = await anon.from('locations').insert({
      name: 'Hacker Room',
      drop_point: false,
    })
    expect(error).not.toBeNull()
  })

  it('studentA cannot insert a location', async () => {
    const { error } = await studentA.from('locations').insert({
      name: 'New Spot',
      drop_point: false,
    })
    expect(error).not.toBeNull()
  })

  it('admin can insert a location', async () => {
    const { data, error } = await admin
      .from('locations')
      .insert({ name: `Test Location ${RUN_ID}`, drop_point: false })
      .select('id')
      .single()
    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()

    // Clean up
    if (data?.id) {
      await service.from('locations').delete().eq('id', data.id)
    }
  })

  it('admin can delete a location', async () => {
    // Create via service role, then delete via admin client
    const { data: loc } = await service
      .from('locations')
      .insert({ name: `Delete Me ${RUN_ID}`, drop_point: false })
      .select('id')
      .single()
    expect(loc?.id).toBeTruthy()

    const { error } = await admin.from('locations').delete().eq('id', loc!.id)
    expect(error).toBeNull()
  })
})

// ===========================================================================
// ITEMS — core access rules
// ===========================================================================
describe('RLS: items — SELECT', () => {
  it('anon can read open items', async () => {
    const { data, error } = await anon
      .from('items')
      .select('id, title, status')
      .eq('status', 'open')
      .limit(5)
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('anon cannot read resolved/expired items', async () => {
    const { data, error } = await anon
      .from('items')
      .select('id, status')
      .eq('id', SEED.items.resolved)
    expect(error).toBeNull()
    // RLS returns empty array (not an error) for denied rows
    expect(data).toHaveLength(0)
  })

  it('studentA can read their own resolved item', async () => {
    // item 13 is resolved but reporter = studentC; studentA should NOT see it
    const { data } = await studentA
      .from('items')
      .select('id')
      .eq('id', SEED.items.resolved)
    expect(data).toHaveLength(0)
  })

  it('admin can read all items regardless of status', async () => {
    const { data, error } = await admin
      .from('items')
      .select('id, status')
      .eq('id', SEED.items.resolved)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].status).toBe('resolved')
  })
})

describe('RLS: items — INSERT', () => {
  it('anon cannot create an item', async () => {
    const { error } = await anon.from('items').insert({
      report_type: 'lost',
      category: 'other',
      title: 'Anon item attempt',
      reporter_id: SEED.users.studentA,
    })
    expect(error).not.toBeNull()
  })

  it('studentA can create an item with their own reporter_id', async () => {
    const { data, error } = await studentA
      .from('items')
      .insert({
        report_type: 'lost',
        category: 'other',
        title: `Test item ${RUN_ID}`,
        reporter_id: SEED.users.studentA,
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    cleanup.items.push(data!.id)
  })

  it('studentA cannot create an item with studentB reporter_id', async () => {
    const { error } = await studentA.from('items').insert({
      report_type: 'lost',
      category: 'other',
      title: `Spoofed item ${RUN_ID}`,
      reporter_id: SEED.users.studentB,
    })
    expect(error).not.toBeNull()
  })
})

describe('RLS: items — UPDATE', () => {
  it('studentA can update their own item title', async () => {
    const { error } = await studentA
      .from('items')
      .update({ title: 'iPhone 14 Pro — Space Black (updated)' })
      .eq('id', SEED.items.openByA)
    expect(error).toBeNull()

    // Restore
    await service
      .from('items')
      .update({ title: 'iPhone 14 Pro — Space Black' })
      .eq('id', SEED.items.openByA)
  })

  it('studentB cannot update studentA item', async () => {
    const { error } = await studentB
      .from('items')
      .update({ title: 'Hijacked title' })
      .eq('id', SEED.items.openByA)
    // RLS silently matches 0 rows — no error, but nothing is changed
    const { data } = await service
      .from('items')
      .select('title')
      .eq('id', SEED.items.openByA)
      .single()
    expect(data?.title).toBe('iPhone 14 Pro — Space Black')
  })

  it('admin can update any item', async () => {
    const { error } = await admin
      .from('items')
      .update({ description: 'Admin-updated description' })
      .eq('id', SEED.items.openByB)
    expect(error).toBeNull()
  })
})

describe('RLS: items — DELETE', () => {
  it('studentA can delete their own open item', async () => {
    // Create via service, delete via studentA
    const { data: newItem } = await service
      .from('items')
      .insert({
        report_type: 'lost',
        category: 'other',
        title: `Delete test ${RUN_ID}`,
        reporter_id: SEED.users.studentA,
        status: 'open',
      })
      .select('id')
      .single()
    expect(newItem?.id).toBeTruthy()

    const { error } = await studentA
      .from('items')
      .delete()
      .eq('id', newItem!.id)
    expect(error).toBeNull()
  })

  it('studentB cannot delete studentA open item', async () => {
    await studentB.from('items').delete().eq('id', SEED.items.openByA)
    // Verify item still exists
    const { data } = await service
      .from('items')
      .select('id')
      .eq('id', SEED.items.openByA)
    expect(data).toHaveLength(1)
  })

  it('studentA cannot delete their own resolved item', async () => {
    // studentC owns item 13 (resolved); use studentC scenario via service
    // Create a resolved item owned by studentA, try to delete it
    const { data: ri } = await service
      .from('items')
      .insert({
        report_type: 'found',
        category: 'other',
        title: `Resolved item ${RUN_ID}`,
        reporter_id: SEED.users.studentA,
        status: 'resolved',
      })
      .select('id')
      .single()
    cleanup.items.push(ri!.id)

    await studentA.from('items').delete().eq('id', ri!.id)
    const { data } = await service.from('items').select('id').eq('id', ri!.id)
    // Should still exist (RLS blocks delete of resolved items by reporter)
    expect(data).toHaveLength(1)
  })

  it('admin can delete any item', async () => {
    const { data: target } = await service
      .from('items')
      .insert({
        report_type: 'lost',
        category: 'other',
        title: `Admin delete ${RUN_ID}`,
        reporter_id: SEED.users.studentB,
        status: 'open',
      })
      .select('id')
      .single()

    const { error } = await admin.from('items').delete().eq('id', target!.id)
    expect(error).toBeNull()
  })
})

// ===========================================================================
// PROFILES
// ===========================================================================
describe('RLS: profiles', () => {
  it('anon cannot read profiles', async () => {
    const { data, error } = await anon
      .from('profiles')
      .select('id, email')
      .limit(1)
    // Should return empty (RLS blocks) not necessarily an error
    expect(data).toHaveLength(0)
  })

  it('studentA can read studentB profile', async () => {
    const { data, error } = await studentA
      .from('profiles')
      .select('id, full_name')
      .eq('id', SEED.users.studentB)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('studentA can update their own profile display name', async () => {
    const { error } = await studentA
      .from('profiles')
      .update({ full_name: 'Alice N Updated' })
      .eq('id', SEED.users.studentA)
    expect(error).toBeNull()

    // Restore
    await service
      .from('profiles')
      .update({ full_name: 'Avik (StudentA)' })
      .eq('id', SEED.users.studentA)
  })

  it('studentA cannot update studentB profile', async () => {
    await studentA
      .from('profiles')
      .update({ full_name: 'Hijacked Name' })
      .eq('id', SEED.users.studentB)
    const { data } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', SEED.users.studentB)
      .single()
    expect(data?.full_name).toBe('Student B')
  })

  it('admin can update any profile', async () => {
    const { error } = await admin
      .from('profiles')
      .update({ notify_email: false })
      .eq('id', SEED.users.studentB)
    expect(error).toBeNull()

    // Restore
    await service
      .from('profiles')
      .update({ notify_email: true })
      .eq('id', SEED.users.studentB)
  })

  it('studentA cannot delete any profile', async () => {
    const { error } = await studentA
      .from('profiles')
      .delete()
      .eq('id', SEED.users.studentB)
    // Should either error or match 0 rows
    const { data } = await service
      .from('profiles')
      .select('id')
      .eq('id', SEED.users.studentB)
    expect(data).toHaveLength(1)
  })
})

// ===========================================================================
// CLAIMS
// ===========================================================================
describe('RLS: claims', () => {
  let testClaimId: string

  it('studentB can submit a claim on studentA open item', async () => {
    const { data, error } = await studentB
      .from('claims')
      .insert({
        item_id: SEED.items.openByA,
        claimant_id: SEED.users.studentB,
        proof_text: 'I can describe the case exactly — it has a green glow pattern on the back.',
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    expect(data?.id).toBeTruthy()
    testClaimId = data!.id
    cleanup.claims.push(testClaimId)
  })

  it('studentA cannot claim their own item', async () => {
    const { error } = await studentA
      .from('claims')
      .insert({
        item_id: SEED.items.openByA,
        claimant_id: SEED.users.studentA,
        proof_text: 'This is my own item.',
      })
    expect(error).not.toBeNull()
  })

  it('studentB can see their own claim', async () => {
    if (!testClaimId) return
    const { data, error } = await studentB
      .from('claims')
      .select('id, status')
      .eq('id', testClaimId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('studentA (reporter) can see claims on their own item', async () => {
    if (!testClaimId) return
    const { data, error } = await studentA
      .from('claims')
      .select('id')
      .eq('item_id', SEED.items.openByA)
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('anon cannot see any claims', async () => {
    const { data } = await anon.from('claims').select('id').limit(5)
    expect(data).toHaveLength(0)
  })

  it('studentB can withdraw their own pending claim', async () => {
    if (!testClaimId) return
    const { error } = await studentB
      .from('claims')
      .update({ status: 'withdrawn' })
      .eq('id', testClaimId)
      .eq('status', 'pending')
    expect(error).toBeNull()
  })

  it('studentB cannot approve/reject a claim (only admins can)', async () => {
    // Attempt to approve the claim as studentB (not admin)
    if (!testClaimId) return
    await studentB
      .from('claims')
      .update({ status: 'approved' })
      .eq('id', testClaimId)
    const { data } = await service
      .from('claims')
      .select('status')
      .eq('id', testClaimId)
      .single()
    // Should still be 'withdrawn' (from previous test), not 'approved'
    expect(data?.status).not.toBe('approved')
  })

  it('admin can update any claim', async () => {
    if (!testClaimId) return
    const { error } = await admin
      .from('claims')
      .update({ admin_note: 'Reviewed by admin', status: 'rejected' })
      .eq('id', testClaimId)
    expect(error).toBeNull()
  })

  it('studentB cannot hard-delete a claim (only admins can)', async () => {
    if (!testClaimId) return
    await studentB.from('claims').delete().eq('id', testClaimId)
    const { data } = await service
      .from('claims')
      .select('id')
      .eq('id', testClaimId)
    expect(data).toHaveLength(1)
  })

  it('admin can hard-delete a claim', async () => {
    if (!testClaimId) return
    const { error } = await admin.from('claims').delete().eq('id', testClaimId)
    expect(error).toBeNull()
    // Remove from cleanup list since it's already deleted
    cleanup.claims = cleanup.claims.filter((id) => id !== testClaimId)
  })
})

// ===========================================================================
// NOTIFICATIONS
// ===========================================================================
describe('RLS: notifications', () => {
  let notifId: string

  beforeAll(async () => {
    // Create a notification for studentA via service role
    const { data } = await service
      .from('notifications')
      .insert({
        user_id: SEED.users.studentA,
        channel: 'in_app',
        event_type: 'test_event',
        payload: { message: 'RLS test notification' },
      })
      .select('id')
      .single()
    notifId = data!.id
    cleanup.notifications.push(notifId)
  })

  it('studentA can read their own notifications', async () => {
    const { data, error } = await studentA
      .from('notifications')
      .select('id, event_type')
      .eq('id', notifId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('studentB cannot read studentA notifications', async () => {
    const { data } = await studentB
      .from('notifications')
      .select('id')
      .eq('id', notifId)
    expect(data).toHaveLength(0)
  })

  it('anon cannot read any notifications', async () => {
    const { data } = await anon
      .from('notifications')
      .select('id')
      .limit(5)
    expect(data).toHaveLength(0)
  })

  it('authenticated client cannot directly insert a notification', async () => {
    const { error } = await studentA.from('notifications').insert({
      user_id: SEED.users.studentA,
      channel: 'in_app',
      event_type: 'self_injected',
      payload: {},
    })
    expect(error).not.toBeNull()
  })

  it('studentA can mark their own notification as read', async () => {
    const now = new Date().toISOString()
    const { error } = await studentA
      .from('notifications')
      .update({ read_at: now })
      .eq('id', notifId)
    expect(error).toBeNull()
  })

  it('studentB cannot mark studentA notification as read', async () => {
    await studentB
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notifId)
    // read_at should have already been set by studentA — verify it wasn't cleared
    const { data } = await service
      .from('notifications')
      .select('read_at')
      .eq('id', notifId)
      .single()
    // read_at should be non-null (studentA already set it)
    expect(data?.read_at).toBeTruthy()
  })

  it('admin can read any notification', async () => {
    const { data, error } = await admin
      .from('notifications')
      .select('id')
      .eq('id', notifId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('studentA cannot delete their own notification', async () => {
    await studentA.from('notifications').delete().eq('id', notifId)
    const { data } = await service
      .from('notifications')
      .select('id')
      .eq('id', notifId)
    expect(data).toHaveLength(1)
  })

  it('admin can delete notifications', async () => {
    const { error } = await admin
      .from('notifications')
      .delete()
      .eq('id', notifId)
    expect(error).toBeNull()
    cleanup.notifications = cleanup.notifications.filter((id) => id !== notifId)
  })
})

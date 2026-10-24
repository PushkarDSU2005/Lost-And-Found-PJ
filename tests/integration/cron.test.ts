/**
 * Integration test: Daily cron endpoint.
 *
 * Tests:
 * 1. Rejects requests without CRON_SECRET
 * 2. Marks items past expires_at as 'expired'
 * 3. Keeps alive (count query succeeds)
 *
 * Run: pnpm test:integration -- cron
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SECRET = process.env.CRON_SECRET!

function svc() {
  return createClient(URL, SVC, { auth: { persistSession: false } })
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let testItemId: string

beforeAll(async () => {
  const service = svc()
  const { data } = await service.from('items').insert({
    reporter_id:  'b53e7d59-ab87-4014-8fe5-6dd11b55f869', // studentA
    report_type:  'found',
    category:     'other',
    title:        'Cron test item',
    status:       'open',
    expires_at:   new Date(Date.now() - 86400 * 1000).toISOString(), // expired 1 day ago
  }).select('id').single()
  testItemId = (data as { id: string }).id
})

afterAll(async () => {
  if (testItemId) await svc().from('items').delete().eq('id', testItemId)
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/cron/daily', () => {
  const ENDPOINT = 'http://localhost:3000/api/cron/daily'

  // Skip if dev server is not running (CI or when running integration tests without server)
  it.skipIf(!process.env.RUN_CRON_TESTS)('rejects requests without Authorization header', async () => {
    const res = await fetch(ENDPOINT)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBeTruthy()
  })

  it.skipIf(!process.env.RUN_CRON_TESTS)('rejects requests with wrong secret', async () => {
    const res = await fetch(ENDPOINT, {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    expect(res.status).toBe(401)
  })

  it.skipIf(!process.env.RUN_CRON_TESTS)('succeeds with correct secret and expires old items', async () => {
    const res = await fetch(ENDPOINT, {
      headers: { authorization: `Bearer ${SECRET}` },
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(typeof json.expired_count).toBe('number')
    expect(typeof json.total_items).toBe('number')

    // Verify the test item is now expired
    const { data } = await svc().from('items').select('status').eq('id', testItemId).single()
    expect((data as { status: string }).status).toBe('expired')
  })
})

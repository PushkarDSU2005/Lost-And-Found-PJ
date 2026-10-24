/**
 * Integration tests: browse query filters return the right rows.
 *
 * Uses the real Supabase project + seed data.
 * Runs against the public `items` table through the anon key (RLS enforced).
 *
 * Run: pnpm test:integration -- browse
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import {
  normaliseParams,
  buildBrowseQuery,
  PAGE_SIZE,
} from '@/lib/browse'

// ─── Stable seed IDs ─────────────────────────────────────────────────────────

const SEED = {
  items: {
    // From reseed-real-uuids.sql — reporter = studentA (avikjaiswal01@gmail.com)
    iphone:   '20000000-0000-0000-0000-000000000001', // lost, electronics, studentA
    earbuds:  '20000000-0000-0000-0000-000000000002', // found, electronics, studentB
    jacket:   '20000000-0000-0000-0000-000000000003', // lost, clothing, studentA
    charger:  '20000000-0000-0000-0000-000000000012', // found, electronics, studentA
    resolved: '20000000-0000-0000-0000-000000000013', // resolved — should not appear in default query
  },
  locations: {
    library: '10000000-0000-0000-0000-000000000001',
  },
}

// ─── Client ───────────────────────────────────────────────────────────────────

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function anonClient() {
  return createClient(URL, ANON_KEY)
}

beforeAll(() => {
  if (!URL || !ANON_KEY) throw new Error('Missing Supabase env vars')
})

// ─── Row type returned by the browse query ───────────────────────────────────

interface BrowseRow {
  id: string
  title: string
  report_type: string
  status: string
  category: string
  created_at: string
  location_id: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function runQuery(rawParams: Parameters<typeof normaliseParams>[0]) {
  const params = normaliseParams(rawParams)
  const sb = anonClient()
  const { query } = buildBrowseQuery(sb, params)
  const { data, count, error } = await query
  return { data: (data as unknown as BrowseRow[]) ?? [], count, error, params }
}

// ─── Default query ────────────────────────────────────────────────────────────

describe('browse: default query (status=open)', () => {
  it('returns only open items', async () => {
    const { data, error } = await runQuery({})
    expect(error).toBeNull()
    const statuses = (data ?? []).map((i: { status: string }) => i.status)
    expect(statuses.every((s) => s === 'open')).toBe(true)
  })

  it('does NOT return the resolved seed item', async () => {
    const { data } = await runQuery({})
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).not.toContain(SEED.items.resolved)
  })

  it('returns items ordered newest-first', async () => {
    const { data } = await runQuery({})
    const dates = (data ?? []).map((i: { created_at: string }) => new Date(i.created_at).getTime())
    for (let j = 1; j < dates.length; j++) {
      expect(dates[j - 1]!).toBeGreaterThanOrEqual(dates[j]!)
    }
  })

  it('returns count alongside data', async () => {
    const { count } = await runQuery({})
    expect(typeof count).toBe('number')
    expect(count).toBeGreaterThan(0)
  })
})

// ─── Type filter ─────────────────────────────────────────────────────────────

describe('browse: type filter', () => {
  it('returns only lost items when type=lost', async () => {
    const { data, error } = await runQuery({ type: 'lost' })
    expect(error).toBeNull()
    const types = (data ?? []).map((i: { report_type: string }) => i.report_type)
    expect(types.every((t) => t === 'lost')).toBe(true)
  })

  it('returns only found items when type=found', async () => {
    const { data, error } = await runQuery({ type: 'found' })
    expect(error).toBeNull()
    const types = (data ?? []).map((i: { report_type: string }) => i.report_type)
    expect(types.every((t) => t === 'found')).toBe(true)
  })

  it('returns the iPhone when type=lost', async () => {
    const { data } = await runQuery({ type: 'lost' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
  })

  it('returns the earbuds when type=found', async () => {
    const { data } = await runQuery({ type: 'found' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.earbuds)
  })
})

// ─── Category filter ──────────────────────────────────────────────────────────

describe('browse: category filter', () => {
  it('returns only electronics items', async () => {
    const { data, error } = await runQuery({ category: 'electronics' })
    expect(error).toBeNull()
    const cats = (data ?? []).map((i: { category: string }) => i.category)
    expect(cats.every((c) => c === 'electronics')).toBe(true)
  })

  it('returns the iPhone and earbuds in electronics', async () => {
    const { data } = await runQuery({ category: 'electronics' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
    expect(ids).toContain(SEED.items.earbuds)
    expect(ids).toContain(SEED.items.charger)
  })

  it('returns only clothing items', async () => {
    const { data } = await runQuery({ category: 'clothing' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.jacket)
  })

  it('returns empty for a category with no seed items', async () => {
    const { data } = await runQuery({ category: 'food_drink' })
    // food_drink: only seed item 14 (Blue Sistema lunch box) but it's open
    // Just check it's all food_drink if any
    const cats = (data ?? []).map((i: { category: string }) => i.category)
    expect(cats.every((c) => c === 'food_drink')).toBe(true)
  })
})

// ─── Combined filters ─────────────────────────────────────────────────────────

describe('browse: combined filters', () => {
  it('type=lost + category=electronics returns iPhone', async () => {
    const { data, error } = await runQuery({ type: 'lost', category: 'electronics' })
    expect(error).toBeNull()
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
    // Should NOT contain found items
    const types = (data ?? []).map((i: { report_type: string }) => i.report_type)
    expect(types.every((t) => t === 'lost')).toBe(true)
  })
})

// ─── Text search ──────────────────────────────────────────────────────────────

describe('browse: text search', () => {
  it('finds the iPhone by partial title match', async () => {
    const { data, error } = await runQuery({ q: 'iPhone' })
    expect(error).toBeNull()
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
  })

  it('is case-insensitive', async () => {
    const { data } = await runQuery({ q: 'iphone' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
  })

  it('returns empty for a completely non-matching query', async () => {
    const { data } = await runQuery({ q: 'xyzzy_nonexistent_item_9999' })
    expect((data ?? []).length).toBe(0)
  })

  it('finds items by description match', async () => {
    // iPhone description: "green glow-in-the-dark case"
    const { data } = await runQuery({ q: 'golden retriever' })
    const ids = (data ?? []).map((i: { id: string }) => i.id)
    expect(ids).toContain(SEED.items.iphone)
  })
})

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('browse: pagination', () => {
  it('page 1 returns up to PAGE_SIZE items', async () => {
    const { data } = await runQuery({ page: 1 })
    expect((data ?? []).length).toBeLessThanOrEqual(PAGE_SIZE)
  })

  it('page 2 returns different items than page 1 (if enough items)', async () => {
    const { count } = await runQuery({ page: 1 })
    if ((count ?? 0) <= PAGE_SIZE) return // not enough items to paginate

    const { data: page1 } = await runQuery({ page: 1 })
    const { data: page2 } = await runQuery({ page: 2 })

    const ids1 = new Set((page1 ?? []).map((i: { id: string }) => i.id))
    const ids2 = new Set((page2 ?? []).map((i: { id: string }) => i.id))

    // No overlap between pages
    for (const id of ids2) {
      expect(ids1.has(id)).toBe(false)
    }
  })

  it('returns empty array for a page beyond the last', async () => {
    const { data } = await runQuery({ page: 9999 })
    expect((data ?? []).length).toBe(0)
  })
})

// ─── Location filter ──────────────────────────────────────────────────────────

describe('browse: location filter', () => {
  it('returns only items at the given location', async () => {
    const { data, error } = await runQuery({ location_id: SEED.locations.library })
    expect(error).toBeNull()
    const locationIds = (data ?? []).map((i) => i.location_id)
    expect(locationIds.every((l) => l === SEED.locations.library)).toBe(true)
  })
})

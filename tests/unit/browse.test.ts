/**
 * Unit tests for lib/browse.ts — query builder and param normalisation.
 * Pure functions, no network calls required.
 */
import { describe, it, expect } from 'vitest'
import {
  normaliseParams,
  buildBrowseQuery,
  toSearchString,
  countActiveFilters,
  PAGE_SIZE,
  type BrowseParams,
  type NormalisedBrowseParams,
} from '@/lib/browse'

// ─── normaliseParams ──────────────────────────────────────────────────────────

describe('normaliseParams', () => {
  it('returns defaults for empty input', () => {
    const p = normaliseParams({})
    expect(p.q).toBe('')
    expect(p.type).toBeNull()
    expect(p.category).toBeNull()
    expect(p.status).toBe('open')
    expect(p.location_id).toBeNull()
    expect(p.date_from).toBeNull()
    expect(p.date_to).toBeNull()
    expect(p.page).toBe(1)
  })

  it('parses a valid type', () => {
    expect(normaliseParams({ type: 'lost' }).type).toBe('lost')
    expect(normaliseParams({ type: 'found' }).type).toBe('found')
  })

  it('ignores an invalid type', () => {
    expect(normaliseParams({ type: 'unknown' as never }).type).toBeNull()
  })

  it('parses all valid categories', () => {
    const cats = [
      'electronics','clothing','accessories','books_stationery',
      'keys','sports_fitness','id_documents','food_drink','other',
    ] as const
    for (const cat of cats) {
      expect(normaliseParams({ category: cat }).category).toBe(cat)
    }
  })

  it('ignores an invalid category', () => {
    expect(normaliseParams({ category: 'furniture' as never }).category).toBeNull()
  })

  it('parses all valid statuses', () => {
    for (const s of ['open', 'claimed', 'resolved', 'expired'] as const) {
      expect(normaliseParams({ status: s }).status).toBe(s)
    }
  })

  it('defaults status to open for invalid value', () => {
    expect(normaliseParams({ status: 'deleted' as never }).status).toBe('open')
  })

  it('accepts a valid UUID location_id', () => {
    const uuid = '10000000-0000-0000-0000-000000000001'
    expect(normaliseParams({ location_id: uuid }).location_id).toBe(uuid)
  })

  it('rejects a non-UUID location_id', () => {
    expect(normaliseParams({ location_id: 'main-library' }).location_id).toBeNull()
  })

  it('accepts valid ISO dates', () => {
    const p = normaliseParams({ date_from: '2026-01-15', date_to: '2026-06-30' })
    expect(p.date_from).toBe('2026-01-15')
    expect(p.date_to).toBe('2026-06-30')
  })

  it('rejects malformed dates', () => {
    expect(normaliseParams({ date_from: '15/01/2026' }).date_from).toBeNull()
    expect(normaliseParams({ date_to: 'yesterday' }).date_to).toBeNull()
  })

  it('clamps page to 1 for zero/negative/NaN', () => {
    expect(normaliseParams({ page: 0 }).page).toBe(1)
    expect(normaliseParams({ page: -5 }).page).toBe(1)
    expect(normaliseParams({ page: 'abc' }).page).toBe(1)
  })

  it('parses page correctly', () => {
    expect(normaliseParams({ page: '3' }).page).toBe(3)
    expect(normaliseParams({ page: 7 }).page).toBe(7)
  })

  it('trims whitespace from q', () => {
    expect(normaliseParams({ q: '  blue bottle  ' }).q).toBe('blue bottle')
  })
})

// ─── buildBrowseQuery ─────────────────────────────────────────────────────────

// Minimal mock of a Supabase client query chain
function makeChain(calls: string[] = []): Record<string, unknown> {
  const chain: Record<string, unknown> = {}
  const methods = [
    'select','eq','order','range','ilike','or','gte','lte','not'
  ]
  for (const m of methods) {
    chain[m] = (...args: unknown[]) => {
      calls.push(`${m}(${args.map((a) => JSON.stringify(a)).join(', ')})`)
      return chain
    }
  }
  chain.from = () => chain
  return chain
}

describe('buildBrowseQuery', () => {
  function base(overrides: Partial<NormalisedBrowseParams> = {}): NormalisedBrowseParams {
    return {
      q: '',
      type: null,
      category: null,
      status: 'open',
      location_id: null,
      date_from: null,
      date_to: null,
      page: 1,
      ...overrides,
    }
  }

  it('computes correct range for page 1', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ page: 1 }))
    expect(calls.some((c) => c.includes(`"range"`) || c.startsWith('range('))).toBe(true)
    const rangeCall = calls.find((c) => c.startsWith('range('))
    expect(rangeCall).toBe(`range(0, ${PAGE_SIZE - 1})`)
  })

  it('computes correct range for page 3', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ page: 3 }))
    const rangeCall = calls.find((c) => c.startsWith('range('))
    expect(rangeCall).toBe(`range(${2 * PAGE_SIZE}, ${3 * PAGE_SIZE - 1})`)
  })

  it('adds eq(report_type) when type is set', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ type: 'lost' }))
    expect(calls).toContain('eq("report_type", "lost")')
  })

  it('does not add report_type filter when type is null', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ type: null }))
    // eq("report_type", ...) should not appear — note BROWSE_SELECT contains the
    // string "report_type" as a column name, so we check for the eq call specifically
    expect(calls.some((c) => c.startsWith('eq("report_type"'))).toBe(false)
  })

  it('adds category filter when set', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ category: 'electronics' }))
    expect(calls).toContain('eq("category", "electronics")')
  })

  it('adds location_id filter when set', () => {
    const uuid = '10000000-0000-0000-0000-000000000001'
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ location_id: uuid }))
    expect(calls).toContain(`eq("location_id", "${uuid}")`)
  })

  it('adds date range filters when set', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ date_from: '2026-01-01', date_to: '2026-12-31' }))
    expect(calls).toContain('gte("date_occurred", "2026-01-01")')
    expect(calls).toContain('lte("date_occurred", "2026-12-31")')
  })

  it('adds OR text search when q is set', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ q: 'blue bottle' }))
    const orCall = calls.find((c) => c.startsWith('or('))
    expect(orCall).toContain('ilike')
    expect(orCall).toContain('blue bottle')
  })

  it('escapes ILIKE special characters in q', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ q: '50% off_item' }))
    const orCall = calls.find((c) => c.startsWith('or('))
    // % _ \ should be escaped
    expect(orCall).toContain('\\%')
    expect(orCall).toContain('\\_')
  })

  it('does not add OR filter when q is empty', () => {
    const calls: string[] = []
    const sb = { from: () => makeChain(calls) }
    buildBrowseQuery(sb as never, base({ q: '' }))
    expect(calls.some((c) => c.startsWith('or('))).toBe(false)
  })
})

// ─── countActiveFilters ───────────────────────────────────────────────────────

describe('countActiveFilters', () => {
  const base: NormalisedBrowseParams = {
    q: '', type: null, category: null, status: 'open',
    location_id: null, date_from: null, date_to: null, page: 1,
  }

  it('returns 0 for default params', () => {
    expect(countActiveFilters(base)).toBe(0)
  })

  it('counts each active filter separately', () => {
    expect(countActiveFilters({ ...base, q: 'phone' })).toBe(1)
    expect(countActiveFilters({ ...base, type: 'lost' })).toBe(1)
    expect(countActiveFilters({ ...base, category: 'electronics' })).toBe(1)
    expect(countActiveFilters({ ...base, status: 'claimed' })).toBe(1)
    expect(countActiveFilters({ ...base, date_from: '2026-01-01' })).toBe(1)
    expect(countActiveFilters({ ...base, date_to: '2026-12-31' })).toBe(1)
  })

  it('counts multiple filters correctly', () => {
    expect(countActiveFilters({
      ...base,
      q: 'wallet',
      type: 'found',
      category: 'accessories',
    })).toBe(3)
  })
})

// ─── toSearchString ───────────────────────────────────────────────────────────

describe('toSearchString', () => {
  it('returns empty string for default params', () => {
    expect(toSearchString({ status: 'open', page: 1 })).toBe('')
  })

  it('includes q when set', () => {
    const s = toSearchString({ q: 'blue bottle' })
    expect(new URLSearchParams(s).get('q')).toBe('blue bottle')
  })

  it('omits status=open (default)', () => {
    expect(toSearchString({ status: 'open' })).not.toContain('status')
  })

  it('includes non-default status', () => {
    expect(toSearchString({ status: 'claimed' })).toContain('status=claimed')
  })

  it('omits page=1 (default)', () => {
    expect(toSearchString({ page: 1 })).not.toContain('page')
  })

  it('includes page > 1', () => {
    expect(toSearchString({ page: 3 })).toContain('page=3')
  })

  it('round-trips through normaliseParams', () => {
    const original: NormalisedBrowseParams = {
      q: 'iPhone',
      type: 'lost',
      category: 'electronics',
      status: 'open',
      location_id: null,
      date_from: '2026-01-01',
      date_to: null,
      page: 2,
    }
    const str = toSearchString(original)
    const rt = normaliseParams(Object.fromEntries(new URLSearchParams(str)))
    expect(rt.q).toBe('iPhone')
    expect(rt.type).toBe('lost')
    expect(rt.category).toBe('electronics')
    expect(rt.date_from).toBe('2026-01-01')
    expect(rt.page).toBe(2)
  })
})

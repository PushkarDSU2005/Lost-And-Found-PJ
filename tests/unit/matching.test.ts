/**
 * Unit tests for lib/matching.ts — scoring logic.
 */
import { describe, it, expect } from 'vitest'
import { computeMatchScore, rankMatches, type ItemForMatching } from '@/lib/matching'

const baseItem: ItemForMatching = {
  id:            '1',
  report_type:   'lost',
  category:      'electronics',
  location_id:   'loc-1',
  date_occurred: '2024-03-15',
  title:         'Black iPhone 13 Pro',
}

describe('computeMatchScore', () => {
  it('returns 0 when nothing matches', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      category:      'clothing',
      location_id:   'loc-2',
      date_occurred: '2023-01-01',
      title:         'Red scarf',
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBe(0)
  })

  it('awards +3 for same category', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      location_id:   null,
      date_occurred: null,
      title:         'Green bag',
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBe(3)
  })

  it('awards +2 for same location_id', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      category:      'other',
      date_occurred: null,
      title:         'Red scarf',
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBe(2)
  })

  it('awards +2 for date within 7 days', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      category:      'other',
      location_id:   null,
      date_occurred: '2024-03-18', // 3 days apart
      title:         'Red scarf',
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBe(2)
  })

  it('does NOT award date points if > 7 days apart', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      category:      'other',
      location_id:   null,
      date_occurred: '2024-03-01', // 14 days apart
      title:         'Red scarf',
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBe(0)
  })

  it('awards up to +3 for title similarity', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      category:      'other',
      location_id:   null,
      date_occurred: null,
      title:         'Black iPhone 13 Pro', // exact title match
    }
    const score = computeMatchScore(baseItem, candidate)
    expect(score).toBeGreaterThanOrEqual(2) // word overlap
  })

  it('combines all factors', () => {
    const candidate: ItemForMatching = {
      ...baseItem,
      id:            '2',
      date_occurred: '2024-03-16', // +2 date
      title:         'iPhone 13', // partial title similarity
    }
    const score = computeMatchScore(baseItem, candidate)
    // category +3, location +2, date +2, title ~1 → ≥8
    expect(score).toBeGreaterThanOrEqual(7)
  })
})

describe('rankMatches', () => {
  const source: ItemForMatching = {
    id:            '1',
    report_type:   'lost',
    category:      'electronics',
    location_id:   'loc-1',
    date_occurred: '2024-03-15',
    title:         'Black iPhone',
  }

  const candidates: ItemForMatching[] = [
    { id: '2', report_type: 'found', category: 'electronics', location_id: 'loc-1', date_occurred: '2024-03-15', title: 'iPhone' },
    { id: '3', report_type: 'found', category: 'electronics', location_id: null, date_occurred: null, title: 'Other' },
    { id: '4', report_type: 'found', category: 'clothing', location_id: null, date_occurred: null, title: 'Scarf' },
    { id: '5', report_type: 'lost', category: 'electronics', location_id: 'loc-1', date_occurred: '2024-03-15', title: 'iPhone' }, // same type — excluded
  ]

  it('filters out same report_type', () => {
    const ranked = rankMatches(source, candidates, 0, 10)
    expect(ranked.every((m) => m.report_type !== source.report_type)).toBe(true)
  })

  it('filters by threshold (default 5)', () => {
    const ranked = rankMatches(source, candidates, 5, 10)
    expect(ranked.every((m) => m.score >= 5)).toBe(true)
  })

  it('sorts descending by score', () => {
    const ranked = rankMatches(source, candidates, 0, 10)
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1]!.score).toBeGreaterThanOrEqual(ranked[i]!.score)
    }
  })

  it('limits to top N', () => {
    const ranked = rankMatches(source, candidates, 0, 2)
    expect(ranked.length).toBeLessThanOrEqual(2)
  })

  it('returns the highest-scoring candidate first', () => {
    const ranked = rankMatches(source, candidates, 0, 10)
    expect(ranked[0]?.id).toBe('2') // perfect match
  })
})

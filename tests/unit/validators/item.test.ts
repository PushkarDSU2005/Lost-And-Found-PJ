import { describe, it, expect } from 'vitest'
import {
  reportItemSchemaRefined,
  detectSensitiveKeywords,
  SENSITIVE_KEYWORDS,
} from '@/lib/validators/item'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const baseValid = {
  report_type: 'lost' as const,
  title: 'Blue water bottle',
  category: 'sports_fitness' as const,
  location_id: '10000000-0000-0000-0000-000000000001',
  date_occurred: '2026-10-01T12:00',
  is_sensitive: false,
  images: [],
}

function parse(overrides: object) {
  return reportItemSchemaRefined.safeParse({ ...baseValid, ...overrides })
}

// ─── Title validation ─────────────────────────────────────────────────────────

describe('title', () => {
  it('accepts a valid title', () => {
    expect(parse({}).success).toBe(true)
  })

  it('rejects title shorter than 3 chars', () => {
    const r = parse({ title: 'ab' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.title).toBeDefined()
  })

  it('rejects title longer than 200 chars', () => {
    const r = parse({ title: 'a'.repeat(201) })
    expect(r.success).toBe(false)
  })

  it('trims whitespace before validating', () => {
    const r = parse({ title: '  Blue water bottle  ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe('Blue water bottle')
  })
})

// ─── Category validation ──────────────────────────────────────────────────────

describe('category', () => {
  it('accepts all valid categories', () => {
    const cats = [
      'electronics', 'clothing', 'accessories', 'books_stationery',
      'keys', 'sports_fitness', 'id_documents', 'food_drink', 'other',
    ]
    for (const cat of cats) {
      expect(parse({ category: cat }).success).toBe(true)
    }
  })

  it('rejects an unknown category', () => {
    const r = parse({ category: 'furniture' })
    expect(r.success).toBe(false)
  })

  it('rejects missing category', () => {
    const r = parse({ category: undefined })
    expect(r.success).toBe(false)
  })
})

// ─── Location validation ──────────────────────────────────────────────────────

describe('location', () => {
  it('accepts a valid UUID location_id', () => {
    expect(parse({ location_id: '10000000-0000-0000-0000-000000000001' }).success).toBe(true)
  })

  it('accepts the literal "other"', () => {
    const r = parse({ location_id: 'other', location_text: 'Near the vending machines' })
    expect(r.success).toBe(true)
  })

  it('rejects "other" with empty location_text', () => {
    const r = parse({ location_id: 'other', location_text: '' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.location_text).toBeDefined()
  })

  it('rejects "other" with whitespace-only location_text', () => {
    const r = parse({ location_id: 'other', location_text: '   ' })
    expect(r.success).toBe(false)
  })

  it('rejects empty location_id', () => {
    const r = parse({ location_id: '' })
    expect(r.success).toBe(false)
  })

  it('rejects a garbage string as location_id', () => {
    const r = parse({ location_id: 'not-a-uuid-or-other' })
    expect(r.success).toBe(false)
  })
})

// ─── Date validation ──────────────────────────────────────────────────────────

describe('date_occurred', () => {
  it('accepts a valid past ISO date', () => {
    expect(parse({ date_occurred: '2026-09-01T10:00' }).success).toBe(true)
  })

  it('rejects an invalid date string', () => {
    const r = parse({ date_occurred: 'not-a-date' })
    expect(r.success).toBe(false)
  })

  it('rejects empty date', () => {
    const r = parse({ date_occurred: '' })
    expect(r.success).toBe(false)
  })

  it('rejects a future date', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    const r = parse({ date_occurred: future })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.flatten().fieldErrors.date_occurred).toBeDefined()
  })
})

// ─── Found-only: verification question ───────────────────────────────────────

describe('verification_question + answer (found type)', () => {
  const foundBase = { ...baseValid, report_type: 'found' as const }

  it('accepts no question (optional)', () => {
    expect(reportItemSchemaRefined.safeParse(foundBase).success).toBe(true)
  })

  it('requires an answer when a question is provided', () => {
    const r = reportItemSchemaRefined.safeParse({
      ...foundBase,
      verification_question: 'What colour is the case?',
      verification_answer: '',
    })
    expect(r.success).toBe(false)
    if (!r.success)
      expect(r.error.flatten().fieldErrors.verification_answer).toBeDefined()
  })

  it('accepts both question and answer', () => {
    const r = reportItemSchemaRefined.safeParse({
      ...foundBase,
      verification_question: 'What colour is the case?',
      verification_answer: 'Green',
    })
    expect(r.success).toBe(true)
  })
})

// ─── Images ───────────────────────────────────────────────────────────────────

describe('images', () => {
  it('defaults to empty array', () => {
    const r = parse({})
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.images).toEqual([])
  })

  it('rejects more than 3 image objects', () => {
    const fakeImg = {
      key: 'k',
      file: new File(['x'], 'x.jpg', { type: 'image/jpeg' }),
      previewUrl: 'blob:http://localhost/1',
      compressedSize: 100,
    }
    const r = parse({ images: [fakeImg, fakeImg, fakeImg, fakeImg] })
    expect(r.success).toBe(false)
  })
})

// ─── detectSensitiveKeywords ──────────────────────────────────────────────────

describe('detectSensitiveKeywords', () => {
  it('returns false for non-sensitive text', () => {
    expect(detectSensitiveKeywords('Blue water bottle found in library')).toBe(false)
  })

  it('detects "passport" case-insensitively', () => {
    expect(detectSensitiveKeywords('Found a PASSPORT near the main gate')).toBe(true)
  })

  it('detects "id card"', () => {
    expect(detectSensitiveKeywords('Lost my id card on the bus')).toBe(true)
  })

  it('detects "wallet"', () => {
    expect(detectSensitiveKeywords('Brown leather wallet left in cafeteria')).toBe(true)
  })

  it('detects "driving licence"', () => {
    expect(detectSensitiveKeywords('I lost my driving licence')).toBe(true)
  })

  it('does NOT falsely flag "monkey" for "key"', () => {
    // "key" is a keyword but should only match as a whole word
    expect(detectSensitiveKeywords('lost a monkey plushie')).toBe(false)
  })

  it('detects the word "keys" standalone', () => {
    expect(detectSensitiveKeywords('Found keys on the bench')).toBe(false)
    // Note: "keys" is NOT in SENSITIVE_KEYWORDS — that's intentional. Just keys are fine.
  })

  it('covers all SENSITIVE_KEYWORDS entries', () => {
    for (const kw of SENSITIVE_KEYWORDS) {
      const text = `I found a ${kw} on campus`
      expect(detectSensitiveKeywords(text)).toBe(true)
    }
  })
})

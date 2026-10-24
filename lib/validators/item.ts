/**
 * Zod schema for the Report Lost/Found form.
 * Imported on the client (form validation) AND on the server (action validation).
 * Keep pure — no browser or Next.js imports.
 */
import { z } from 'zod'
import { CATEGORY_META } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const TITLE_MIN = 3
export const TITLE_MAX = 200
export const DESCRIPTION_MAX = 2000
export const VERIFICATION_Q_MAX = 300
export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB raw; compressed to ~1 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

/** Keywords that trigger the "sensitive item" prompt */
export const SENSITIVE_KEYWORDS = [
  'id', 'id card', 'student id', 'identity',
  'card', 'bank card', 'credit card', 'debit card',
  'wallet', 'purse',
  'passport',
  'licence', 'license', 'driving licence',
] as const

export const ITEM_CATEGORIES = Object.keys(CATEGORY_META) as [
  keyof typeof CATEGORY_META,
  ...Array<keyof typeof CATEGORY_META>,
]

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/**
 * Represents a single validated image file on the client.
 * On the server the file is received as a presigned storage path string.
 */
export const clientImageSchema = z.object({
  /** Stable key for React list rendering */
  key: z.string(),
  /** Original File object — present only on client */
  file: z.instanceof(File),
  /** Object URL for img src preview */
  previewUrl: z.string().url(),
  /** Size after compression in bytes */
  compressedSize: z.number().int().positive(),
})

export type ClientImage = z.infer<typeof clientImageSchema>

/**
 * Server-side image reference: just the storage path after upload.
 */
export const serverImageSchema = z.string().min(1)

// ─── Main form schema ─────────────────────────────────────────────────────────

export const reportItemSchema = z.object({
  /** Discriminator: 'lost' | 'found' — comes from the URL param, not a form field */
  report_type: z.enum(['lost', 'found']),

  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`),

  description: z
    .string()
    .trim()
    .max(DESCRIPTION_MAX, `Description must be at most ${DESCRIPTION_MAX} characters`)
    .optional(),

  category: z.enum(ITEM_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a category' }),
  }),

  /**
   * Location: either a UUID from the locations table, or the literal
   * string 'other' which signals the user will fill in location_text.
   */
  location_id: z
    .string()
    .min(1, 'Please select a location')
    .refine(
      (v) => v === 'other' || /^[0-9a-f-]{36}$/.test(v),
      'Invalid location',
    ),

  /** Free-text fallback — required when location_id === 'other' */
  location_text: z.string().trim().max(200).optional(),

  /** ISO date string (YYYY-MM-DD) or datetime */
  date_occurred: z
    .string()
    .min(1, 'Please enter the date')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date'),

  /** Found-only: UUID of the drop-point location where item is being held */
  held_at: z.string().optional(),

  /** Found-only: question that proves ownership */
  verification_question: z
    .string()
    .trim()
    .max(VERIFICATION_Q_MAX)
    .optional(),

  /** Found-only: the answer (stored hashed on the server; plain text here) */
  verification_answer: z.string().trim().max(500).optional(),

  /** Auto-detected or manually confirmed */
  is_sensitive: z.boolean().default(false),

  /**
   * Client-side: array of processed image objects.
   * Max 3, validated further in the image pipeline.
   * On server this becomes an array of storage paths.
   */
  images: z
    .array(clientImageSchema)
    .max(MAX_IMAGES, `You can upload at most ${MAX_IMAGES} images`)
    .default([]),
})

export type ReportItemInput = z.infer<typeof reportItemSchema>

// ─── Cross-field refinements ──────────────────────────────────────────────────

export const reportItemSchemaRefined = reportItemSchema
  .superRefine((val, ctx) => {
    // location_text required when location is 'other'
    if (val.location_id === 'other' && !val.location_text?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location_text'],
        message: 'Please describe the location',
      })
    }

    // verification_answer required if verification_question is provided
    if (val.verification_question?.trim() && !val.verification_answer?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['verification_answer'],
        message: 'Please provide the answer to your verification question',
      })
    }

    // date must not be in the future
    if (val.date_occurred && Date.parse(val.date_occurred) > Date.now() + 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date_occurred'],
        message: 'Date cannot be in the future',
      })
    }
  })

// ─── Server-side schema (images already uploaded → paths) ────────────────────

export const reportItemServerSchema = reportItemSchema
  .omit({ images: true })
  .extend({
    images: z.array(serverImageSchema).max(MAX_IMAGES).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.location_id === 'other' && !val.location_text?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location_text'],
        message: 'Please describe the location',
      })
    }
  })

export type ReportItemServerInput = z.infer<typeof reportItemServerSchema>

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the title or description contains sensitive keywords.
 * Used to auto-trigger the "is_sensitive" prompt.
 */
export function detectSensitiveKeywords(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_KEYWORDS.some((kw) => {
    // Match as a whole word to avoid false positives (e.g. "keys" ≠ "monkey")
    const pattern = new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`)
    return pattern.test(lower)
  })
}

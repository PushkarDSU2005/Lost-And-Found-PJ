/**
 * Text sanitization utilities for user-submitted content.
 * Pure functions — no browser or Next.js dependencies.
 * Called on the server before DB writes.
 */

/** Maximum lengths that match the DB / form schema */
const LIMITS = {
  title: 200,
  description: 2000,
  location_text: 200,
  verification_question: 300,
  default: 500,
} as const

/**
 * Strip control characters and null bytes, collapse excessive whitespace,
 * limit consecutive newlines, and hard-truncate to the given limit.
 * Enhanced to prevent rendering DoS and visual spoofing attacks.
 */
export function sanitizeText(
  text: string,
  field: keyof typeof LIMITS = 'default',
): string {
  const limit = LIMITS[field]
  return text
    .replace(/\0/g, '')                  // strip null bytes
    .replace(/[\x00-\x08\x0B\x0E-\x1F\x7F]/g, '')  // strip non-printable control chars (keep \t \n \r)
    // Limit consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Collapse runs of spaces/tabs
    .replace(/[ \t]{2,}/g, ' ')
    // Strip combining characters that could be used for visual spoofing
    .replace(/[\u0300-\u036F]/g, '')
    .trim()
    .slice(0, limit)
}

/** Sanitize all free-text fields in the item payload in one call. */
export function sanitizeItemFields(input: {
  title: string
  description?: string | null
  location_text?: string | null
  verification_question?: string | null
}) {
  return {
    title:                 sanitizeText(input.title, 'title'),
    description:           input.description
                             ? sanitizeText(input.description, 'description')
                             : null,
    location_text:         input.location_text
                             ? sanitizeText(input.location_text, 'location_text')
                             : null,
    verification_question: input.verification_question
                             ? sanitizeText(input.verification_question, 'verification_question')
                             : null,
  }
}

/**
 * Hash a verification answer with SHA-256.
 * Lowercased + trimmed before hashing so "Green" and "green" match.
 * Returns a hex string. Server-side only (uses crypto.subtle).
 */
export async function hashVerificationAnswer(answer: string): Promise<string> {
  const normalised = answer.toLowerCase().trim()
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalised),
  )
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

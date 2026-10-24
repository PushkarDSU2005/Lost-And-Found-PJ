/**
 * Security utilities for the Lost & Found platform.
 * Includes redirect validation, email validation, CSRF checks, and error sanitization.
 */

import { headers } from 'next/headers'

// ═════════════════════════════════════════════════════════════════════════════
// Open Redirect Protection
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Validate that a redirect path is safe (internal to the application).
 * Prevents open redirect vulnerabilities (CWE-601, OWASP A01:2021).
 * 
 * @param path - The path to validate
 * @returns true if the path is safe for internal redirect
 */
export function isValidInternalPath(path: string | null | undefined): boolean {
  if (!path) return false
  
  // Must start with / but not //
  if (!path.startsWith('/') || path.startsWith('//')) return false
  
  // Must not contain protocol (prevents http://evil.com)
  if (path.includes('://')) return false
  
  // Must not contain backslash (Windows path separator abuse)
  if (path.includes('\\')) return false
  
  // Must not contain null bytes
  if (path.includes('\0')) return false
  
  // Must not start with multiple slashes (protocol-relative URLs)
  if (/^\/\/+/.test(path)) return false
  
  return true
}

/**
 * Get a safe redirect path, falling back to a default if the requested path is invalid.
 * 
 * @param requestedPath - The path requested by the user (potentially untrusted)
 * @param defaultPath - Fallback path if requestedPath is invalid
 * @returns A safe path for redirect
 */
export function getSafeRedirectPath(
  requestedPath: string | null | undefined,
  defaultPath: string = '/'
): string {
  return isValidInternalPath(requestedPath) ? requestedPath! : defaultPath
}

// ═════════════════════════════════════════════════════════════════════════════
// CSRF Protection
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Validate CSRF headers for Server Actions.
 * Next.js has built-in CSRF protection, but this adds an extra layer for critical actions.
 * 
 * @returns true if the request passes CSRF checks
 */
export async function validateCSRFHeaders(): Promise<boolean> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')
  
  // Verify origin matches host (same-origin policy)
  if (origin && !origin.includes(host!)) {
    return false
  }
  
  // Verify Next.js action header is present
  const action = headersList.get('next-action')
  if (!action) {
    return false
  }
  
  return true
}

// ═════════════════════════════════════════════════════════════════════════════
// Email Validation
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Validate email format and check for common security issues.
 * Prevents homograph attacks and malformed emails.
 * 
 * @param email - Email address to validate
 * @returns Validation result with reason if invalid
 */
export function validateEmail(email: string): { 
  valid: boolean
  reason?: string 
} {
  // RFC 5322 simplified regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email format.' }
  }
  
  // Check for homograph characters (Cyrillic, Greek that look like Latin)
  const hasHomograph = /[\u0400-\u04FF\u0370-\u03FF]/.test(email)
  if (hasHomograph) {
    return { valid: false, reason: 'Email contains invalid characters.' }
  }
  
  // Max length check (RFC 5321)
  if (email.length > 254) {
    return { valid: false, reason: 'Email is too long.' }
  }
  
  // Check for consecutive dots
  if (email.includes('..')) {
    return { valid: false, reason: 'Email contains consecutive dots.' }
  }
  
  return { valid: true }
}

// ═════════════════════════════════════════════════════════════════════════════
// IP-Based Rate Limiting
// ═════════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis/Upstash for production)
const ipRateLimits = new Map<string, RateLimitEntry>()

/**
 * Check if an IP address has exceeded rate limits for a specific action.
 * This is defense-in-depth on top of per-user rate limits.
 * 
 * @param action - Action identifier (e.g., 'create-item')
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit check result
 */
export async function checkIPRateLimit(
  action: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; reason?: string }> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  
  // Get IP from headers (Vercel provides x-forwarded-for)
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  
  const key = `${ip}:${action}`
  const now = Date.now()
  const limit = ipRateLimits.get(key)
  
  // Clean up expired entries periodically
  if (ipRateLimits.size > 10000) {
    for (const [k, v] of ipRateLimits.entries()) {
      if (now > v.resetAt) ipRateLimits.delete(k)
    }
  }
  
  if (!limit || now > limit.resetAt) {
    ipRateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  
  if (limit.count >= maxRequests) {
    return { 
      allowed: false, 
      reason: 'Too many requests from your network. Please try again later.'
    }
  }
  
  limit.count++
  return { allowed: true }
}

// ═════════════════════════════════════════════════════════════════════════════
// Error Sanitization
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize error messages before sending to the client.
 * Prevents information disclosure of database structure, table names, etc.
 * 
 * @param error - Error object or message
 * @returns Safe error message for client
 */
export function sanitizeErrorForClient(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    // Show full errors in dev for debugging
    return error instanceof Error ? error.message : String(error)
  }
  
  // In production, return generic message and log details server-side
  console.error('[Server Error]', error)
  return 'An unexpected error occurred. Please try again.'
}

// ═════════════════════════════════════════════════════════════════════════════
// Input Structure Validation
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Validate text structure to prevent rendering DoS attacks.
 * Checks for extremely long words and excessive line breaks.
 * 
 * @param text - Text to validate
 * @returns Validation result
 */
export function validateTextStructure(text: string): { 
  valid: boolean
  reason?: string 
} {
  // No single word longer than 100 chars (prevents rendering issues)
  const words = text.split(/\s+/)
  const longestWord = Math.max(...words.map(w => w.length))
  if (longestWord > 100) {
    return { 
      valid: false, 
      reason: 'Text contains extremely long words. Please use normal language.' 
    }
  }
  
  // Max 50 line breaks
  const lineCount = text.split('\n').length
  if (lineCount > 50) {
    return { 
      valid: false, 
      reason: 'Too many line breaks. Please format your text normally.' 
    }
  }
  
  return { valid: true }
}

/**
 * Client-safe security utilities for the Lost & Found platform.
 * These functions do not depend on Next.js server-only APIs.
 */

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
// Email Validation
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Validate that an email matches the allowed domain (if ACCESS_MODE=restricted).
 * 
 * @param email - The email address to validate
 * @returns true if email is allowed
 */
export function isAllowedEmail(email: string): boolean {
  const accessMode = process.env.NEXT_PUBLIC_ACCESS_MODE
  if (accessMode !== 'restricted') return true

  const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN
  if (!allowedDomain) return true

  return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)
}

/**
 * Get the allowed email domain for display (if ACCESS_MODE=restricted).
 * 
 * @returns The allowed domain, or null if unrestricted
 */
export function getAllowedEmailDomain(): string | null {
  const accessMode = process.env.NEXT_PUBLIC_ACCESS_MODE
  if (accessMode !== 'restricted') return null

  return process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? null
}

// ═════════════════════════════════════════════════════════════════════════════
// Error Sanitization
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sanitize error messages for client display.
 * Prevents leaking sensitive information like database schemas, file paths, etc.
 * 
 * @param error - The error to sanitize
 * @returns A safe error message for client display
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (typeof error === 'string') return sanitizeString(error)
  if (error instanceof Error) return sanitizeString(error.message)
  return 'An unexpected error occurred. Please try again.'
}

function sanitizeString(message: string): string {
  // Remove database column names (e.g., "column 'user_id' does not exist")
  message = message.replace(/(column|table|constraint|index)\s+'[^']+'/gi, 'database field')
  
  // Remove file paths (e.g., "/var/www/app/..." or "C:\...")
  message = message.replace(/[A-Za-z]:[\\\/][^\s]+/g, '[path]')
  message = message.replace(/\/[a-z0-9_\-/.]+/gi, '[path]')
  
  // Remove SQL fragments
  message = message.replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/gi, '[query]')
  
  // Remove IP addresses
  message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]')
  
  // Remove environment variable names
  message = message.replace(/\b[A-Z_]{3,}=[^\s]+/g, '[config]')
  
  return message.trim() || 'An error occurred'
}

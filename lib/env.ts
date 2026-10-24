/**
 * Centralised environment variable validation.
 * Import this module early (e.g. in instrumentation.ts or a root layout) so
 * missing vars surface at startup rather than at runtime.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   console.log(env.NEXT_PUBLIC_SUPABASE_URL)
 */

import { z } from 'zod'

const envSchema = z.object({
  // ── Supabase ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  /**
   * Only available server-side. Not prefixed with NEXT_PUBLIC_.
   * Guards prevent accidental client-side access.
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // ── Auth / Access ─────────────────────────────────────────────────────────
  ACCESS_MODE: z.enum(['public', 'restricted']).default('restricted'),
  /** Required only when ACCESS_MODE === 'restricted' */
  ALLOWED_EMAIL_DOMAIN: z.string().optional(),

  // ── Email ─────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

  // ── Cron ──────────────────────────────────────────────────────────────────
  CRON_SECRET: z.string()
    .min(32, 'CRON_SECRET must be at least 32 characters for security')
    .refine(
      (val) => val !== 'dev-cron-secret-change-me-in-prod',
      'CRON_SECRET must be changed from the default value before production deployment'
    ),

  // ── Next.js built-ins (always present, validated for completeness) ─────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

/**
 * Superrefine: when ACCESS_MODE is 'restricted', ALLOWED_EMAIL_DOMAIN must be
 * provided and non-empty.
 */
const refinedSchema = envSchema.superRefine((val, ctx) => {
  if (val.ACCESS_MODE === 'restricted' && !val.ALLOWED_EMAIL_DOMAIN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ALLOWED_EMAIL_DOMAIN'],
      message: 'ALLOWED_EMAIL_DOMAIN is required when ACCESS_MODE is "restricted"',
    })
  }
})

function parseEnv() {
  const parsed = refinedSchema.safeParse(process.env)

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(`❌  Missing or invalid environment variables:\n${formatted}\n`)
  }

  return parsed.data
}

export type Env = z.infer<typeof envSchema>

/**
 * Validated, typed env object.
 * Throws at module-load time if any required variable is absent or malformed.
 */
export const env = parseEnv()

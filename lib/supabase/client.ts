/**
 * Supabase browser client.
 * Returns a singleton per page load — safe to call multiple times.
 * Uses the public anon key; RLS enforced.
 */
'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

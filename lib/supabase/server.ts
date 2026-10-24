// Supabase server-side client helpers for Next.js App Router
// Uses @supabase/ssr which handles cookie-based session management
//
// Two clients:
//  - createSupabaseServerClient()    acts as the authenticated user (anon key)
//  - createSupabaseServiceClient()   bypasses RLS (service role key)
//
// SECURITY WARNING: Service Role Key Bypasses ALL RLS Policies
// 
// NEVER import createSupabaseServiceClient() in Client Components
// NEVER expose the service-role key to the browser
// 
// The service-role key gives unrestricted database access
// 
// ONLY use createSupabaseServiceClient() in:
//  - Server Actions (app/actions/*.ts)
//  - API Routes (app/api/*/route.ts)
//  - Server Components - server-side only
//  - Cron jobs
//  - Integration tests
// 
// NEVER use in:
//  - Client Components
//  - Browser-side code
//  - Middleware (use anon key + session instead)
// 
// If unsure, use createSupabaseServerClient() instead

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Creates a Supabase client that uses the current user's session cookie
// RLS policies are enforced — the client acts as the logged-in user
// Use in Server Components, Server Actions, and Route Handlers
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll is called from Server Components where cookies are read-only
            // The middleware will refresh the session token as needed
          }
        },
      },
    },
  )
}

// Creates a Supabase client with the service-role key
// Bypasses ALL RLS policies — use ONLY for trusted server-side operations
// (e.g. cleanup, admin actions, writing to tables the user cannot access)
export function createSupabaseServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  )
}

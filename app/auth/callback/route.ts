import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'

/**
 * Auth callback route
 * Handles:
 * - OAuth redirects (Google)
 * - Email verification clicks
 * - Password reset clicks
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle OAuth/email verification errors
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription)
    
    // Redirect to login with error message
    const errorUrl = new URL('/login', requestUrl.origin)
    errorUrl.searchParams.set('error', errorDescription || 'Authentication failed')
    return NextResponse.redirect(errorUrl)
  }

  // Exchange code for session
  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      
      const errorUrl = new URL('/login', requestUrl.origin)
      errorUrl.searchParams.set('error', 'Failed to complete authentication')
      return NextResponse.redirect(errorUrl)
    }

    // Check domain restriction for OAuth sign-ups
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const ALLOWED_DOMAINS = ['gmail.com', 'dsu.edu.in']
      const emailDomain = user.email.split('@')[1]?.toLowerCase()
      
      if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
        // Sign out the user
        await supabase.auth.signOut()
        
        // Redirect to login with error
        const errorUrl = new URL('/login', requestUrl.origin)
        errorUrl.searchParams.set(
          'error',
          `Only ${ALLOWED_DOMAINS.join(' and ')} email addresses are allowed. Your account has been removed.`
        )
        return NextResponse.redirect(errorUrl)
      }
    }

    // Successful authentication - redirect to intended page
    const safePath = getSafeRedirectPath(next, '/')
    const redirectUrl = new URL(safePath, requestUrl.origin)
    
    // Add success message for email verification
    if (requestUrl.searchParams.get('type') === 'email') {
      redirectUrl.searchParams.set('verified', 'true')
    }
    
    return NextResponse.redirect(redirectUrl)
  }

  // No code provided - redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

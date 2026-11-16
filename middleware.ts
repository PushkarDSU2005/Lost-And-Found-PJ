import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware for authentication and route protection
 * 
 * Handles:
 * - Session token refresh
 * - Protected route guards
 * - Auth redirect loops prevention
 */

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/report', // Report lost/found items
  '/my-items', // User's posted items
  '/claims', // Claim management
  '/messages', // Direct messages
  '/dashboard', // User dashboard
  '/settings', // Account settings
  '/admin', // Admin panel
]

// Routes that should redirect to home if already authenticated
const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected route - redirect to login if not authenticated
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Auth route - redirect to home if already authenticated
  const isAuthRoute = AUTH_ROUTES.some(route => pathname === route)
  if (isAuthRoute && user) {
    // Check if there's a 'next' param from failed attempt
    const next = request.nextUrl.searchParams.get('next')
    if (next && next !== pathname) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Admin routes - check for admin role
  if (pathname.startsWith('/admin') && user) {
    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      // Not an admin - redirect to home
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

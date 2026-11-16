'use server'

/**
 * Authentication Server Actions
 * Handles login, signup, password reset, OAuth, and email verification
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { safeAction, ActionResult } from '@/lib/safe-action'
import { validateEmail, getSafeRedirectPath, checkIPRateLimit } from '@/lib/security'

// ═════════════════════════════════════════════════════════════════════════════
// Domain Restriction
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Check if email domain is allowed based on ACCESS_MODE setting
 */
function isEmailDomainAllowed(email: string): { 
  allowed: boolean
  reason?: string 
} {
  const accessMode = process.env.ACCESS_MODE || 'public'
  
  // Public mode: all emails allowed
  if (accessMode === 'public') {
    return { allowed: true }
  }
  
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN
  
  // Restricted mode: check domain
  if (accessMode === 'restricted') {
    if (!allowedDomain) {
      console.error('[Auth] ALLOWED_EMAIL_DOMAIN not set but ACCESS_MODE=restricted')
      throw new Error('Server misconfiguration. Please contact support.')
    }
    
    const emailDomain = email.split('@')[1]?.toLowerCase()
    if (emailDomain !== allowedDomain.toLowerCase()) {
      throw new Error(`Only ${allowedDomain} email addresses are allowed to register.`)
    }
  }
  
  // Private mode: no signups allowed
  if (accessMode === 'private') {
    throw new Error('Registration is currently closed. Please contact an administrator.')
  }
  
  return { allowed: true }
}

// ═════════════════════════════════════════════════════════════════════════════
// Email/Password Authentication
// ═════════════════════════════════════════════════════════════════════════════

interface LoginWithEmailInput {
  email: string
  password: string
}

/**
 * Authenticate user with email and password
 */
export const loginWithEmail = safeAction(
  async (input: LoginWithEmailInput) => {
    const { email, password } = input

    // Rate limit: 5 attempts per minute per IP
    const rateLimit = await checkIPRateLimit('login', 5, 60_000)
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.reason || 'Too many requests')
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      throw new Error(emailValidation.reason || 'Invalid email')
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Attempt login
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Generic message to prevent user enumeration
      throw new Error('Invalid email or password')
    }

    return null
  },
  { actionName: 'loginWithEmail' }
)

interface SignupWithEmailInput {
  email: string
  password: string
  fullName: string
}

/**
 * Create new user account with email and password
 */
export const signupWithEmail = safeAction(
  async (input: SignupWithEmailInput) => {
    const { email, password, fullName } = input

    // Rate limit: 3 signups per hour per IP
    const rateLimit = await checkIPRateLimit('signup', 3, 3600_000)
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.reason || 'Too many requests')
    }

    // Validate email format
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      throw new Error(emailValidation.reason || 'Invalid email')
    }

    // Check domain restriction
    isEmailDomainAllowed(email) // throws on failure

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    // Validate full name
    const trimmedName = fullName.trim()
    if (trimmedName.length < 2) {
      throw new Error('Please enter your full name')
    }

    if (trimmedName.length > 100) {
      throw new Error('Name is too long')
    }

    // Create account
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: trimmedName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      // Check for specific errors
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists')
      }
      throw new Error(error.message || 'Failed to create account')
    }

    // Return null (success)
    return null
  },
  { actionName: 'signupWithEmail' }
)

// ═════════════════════════════════════════════════════════════════════════════
// OAuth Authentication
// ═════════════════════════════════════════════════════════════════════════════

interface LoginWithGoogleInput {
  redirectTo?: string
}

/**
 * Initiate Google OAuth flow
 * This redirects the user - no need to return data
 */
export const loginWithGoogle = safeAction(
  async (input: LoginWithGoogleInput) => {
    const supabase = await createSupabaseServerClient()
    
    // Build redirect URL
    const safePath = getSafeRedirectPath(input.redirectTo, '/')
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=${encodeURIComponent(safePath)}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      throw new Error('Failed to start Google sign-in')
    }

    // Redirect to OAuth provider
    if (data.url) {
      redirect(data.url)
    }

    return null
  },
  { actionName: 'loginWithGoogle' }
)

// ═════════════════════════════════════════════════════════════════════════════
// Password Reset
// ═════════════════════════════════════════════════════════════════════════════

interface RequestPasswordResetInput {
  email: string
}

/**
 * Send password reset email
 */
export const requestPasswordReset = safeAction(
  async (input: RequestPasswordResetInput) => {
    const { email } = input

    // Rate limit: 3 resets per hour per IP
    const rateLimit = await checkIPRateLimit('password-reset', 3, 3600_000)
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.reason || 'Too many requests')
    }

    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      throw new Error(emailValidation.reason || 'Invalid email')
    }

    const supabase = await createSupabaseServerClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    // Always return success to prevent user enumeration
    // (don't reveal whether email exists in system)
    if (error) {
      console.error('[Auth] Password reset error:', error)
    }

    return null
  },
  { actionName: 'requestPasswordReset' }
)

interface UpdatePasswordInput {
  newPassword: string
}

/**
 * Update user's password (called from reset-password page)
 */
export const updatePassword = safeAction(
  async (input: UpdatePasswordInput) => {
    const { newPassword } = input

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    const supabase = await createSupabaseServerClient()
    
    // Check if user is authenticated (from reset token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Invalid or expired reset link')
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new Error('Failed to update password')
    }

    return null
  },
  { actionName: 'updatePassword' }
)

// ═════════════════════════════════════════════════════════════════════════════
// Email Verification
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Resend email verification
 */
export const resendVerificationEmail = safeAction(
  async () => {
    const supabase = await createSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be signed in to resend verification')
    }

    if (user.email_confirmed_at) {
      throw new Error('Your email is already verified')
    }

    // Rate limit: 3 resends per hour per IP
    const rateLimit = await checkIPRateLimit('resend-verification', 3, 3600_000)
    if (!rateLimit.allowed) {
      throw new Error(rateLimit.reason || 'Too many requests')
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })

    if (error) {
      throw new Error('Failed to resend verification email')
    }

    return null
  },
  { actionName: 'resendVerificationEmail' }
)

// ═════════════════════════════════════════════════════════════════════════════
// Sign Out
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Sign out the current user
 */
export const signOut = safeAction(
  async () => {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error('Failed to sign out')
    }

    return null
  },
  { actionName: 'signOut' }
)

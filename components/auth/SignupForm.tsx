'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { signupWithEmail, loginWithGoogle } from '@/app/actions/auth'
import { getSafeRedirectPath } from '@/lib/security-client'

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordRequirement {
  label: string
  met: boolean
}

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Password strength calculation
  const passwordAnalysis = useMemo(() => {
    const requirements: PasswordRequirement[] = [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
      { label: 'Contains number', met: /\d/.test(password) },
      { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]

    const metCount = requirements.filter((r) => r.met).length
    let strength: PasswordStrength
    if (metCount <= 2) strength = 'weak'
    else if (metCount === 3) strength = 'fair'
    else if (metCount === 4) strength = 'good'
    else strength = 'strong'

    return { requirements, strength, metCount }
  }, [password])

  // Get domain from email
  const emailDomain = useMemo(() => {
    const match = email.match(/@(.+)$/)
    return match ? match[1].toLowerCase() : null
  }, [email])

  // Check if domain is allowed
  const ALLOWED_DOMAINS = ['gmail.com', 'dsu.edu.in']
  const isDomainAllowed = useMemo(() => {
    if (!emailDomain) return true // No validation error until domain is entered
    return ALLOWED_DOMAINS.includes(emailDomain)
  }, [emailDomain])

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validate full name
    if (fullName.trim().length < 2) {
      setError('Please enter your full name')
      return
    }

    // Validate email domain
    if (!isDomainAllowed) {
      setError('Only @gmail.com and @dsu.edu.in email addresses are allowed')
      return
    }

    // Validate password strength
    if (passwordAnalysis.metCount < 3) {
      setError('Please choose a stronger password (at least 3 requirements met)')
      return
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      const result = await signupWithEmail({ 
        email, 
        password, 
        fullName: fullName.trim() 
      })

      if (!result.ok) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      // Show success message
      setSuccessMessage(
        'Account created! Please check your email to verify your account before signing in.'
      )
      setIsLoading(false)
      
      // Don't auto-redirect - let user read the verification message
      // They can click "Sign in" link after verifying
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    try {
      const result = await loginWithGoogle({ redirectTo: next })

      if (!result.ok) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      // Google OAuth will redirect, no need to do anything
    } catch (err) {
      setError('Failed to initiate Google sign-up. Please try again.')
      setIsLoading(false)
    }
  }

  // Get strength color
  const strengthColor = {
    weak: 'bg-destructive',
    fair: 'bg-orange-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  }[passwordAnalysis.strength]

  const strengthWidth = {
    weak: 'w-1/4',
    fair: 'w-2/4',
    good: 'w-3/4',
    strong: 'w-full',
  }[passwordAnalysis.strength]

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Email signup form */}
      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading || !!successMessage}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@gmail.com or you@dsu.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || !!successMessage}
            autoComplete="email"
            className={emailDomain && !isDomainAllowed ? 'border-destructive' : ''}
          />
          {emailDomain && !isDomainAllowed && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              Only @gmail.com and @dsu.edu.in are allowed
            </p>
          )}
          {emailDomain && isDomainAllowed && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Valid domain: {emailDomain}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || !!successMessage}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Password strength meter */}
          {password.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Password strength:
                </span>
                <span className="text-xs font-medium capitalize">
                  {passwordAnalysis.strength}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strengthColor} ${strengthWidth}`}
                />
              </div>

              {/* Password requirements */}
              <div className="space-y-1 pt-1">
                {passwordAnalysis.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {req.met ? (
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span
                      className={`text-xs ${
                        req.met
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Terms and conditions */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={isLoading || !!successMessage}
            className="mt-0.5"
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal leading-snug cursor-pointer"
          >
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline" target="_blank">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || !!successMessage}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : successMessage ? (
            'Account created ✓'
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      {/* Divider */}
      {!successMessage && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
            disabled={isLoading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </>
      )}

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

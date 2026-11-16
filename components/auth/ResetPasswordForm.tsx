'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, Check, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/app/actions/auth'

type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordRequirement {
  label: string
  met: boolean
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const passwordAnalysis = useMemo(() => {
    const requirements: PasswordRequirement[] = [
      { label: 'At least 8 characters', met: newPassword.length >= 8 },
      { label: 'Contains uppercase letter', met: /[A-Z]/.test(newPassword) },
      { label: 'Contains lowercase letter', met: /[a-z]/.test(newPassword) },
      { label: 'Contains number', met: /\d/.test(newPassword) },
      { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ]

    const metCount = requirements.filter((r) => r.met).length
    let strength: PasswordStrength
    if (metCount <= 2) strength = 'weak'
    else if (metCount === 3) strength = 'fair'
    else if (metCount === 4) strength = 'good'
    else strength = 'strong'

    return { requirements, strength, metCount }
  }, [newPassword])

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate password strength
    if (passwordAnalysis.metCount < 3) {
      setError('Please choose a stronger password (at least 3 requirements met)')
      return
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const result = await updatePassword({ newPassword })

      if (!result.ok) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?reset=success')
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
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

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Password updated!</h3>
          <p className="text-sm text-muted-foreground">
            Your password has been changed successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
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
          {newPassword.length > 0 && (
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && (
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <>
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    Passwords match
                  </span>
                </>
              ) : (
                <>
                  <X className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive">
                    Passwords do not match
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading || !passwordsMatch}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating password...
            </>
          ) : (
            'Update password'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

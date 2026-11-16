'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '@/app/actions/auth'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await requestPasswordReset({ email })

      if (!result.ok) {
        setError(result.message)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>
          <p className="text-xs text-muted-foreground">
            The link will expire in 1 hour. Check your spam folder if you don't see it.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@college.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" />
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FieldErrorMessage } from '@/components/forms/FieldError'
import { submitClaim } from '@/app/actions/claims'

const schema = z.object({
  proof_text:          z.string().trim().min(1, 'Please describe how you can prove ownership').max(2000),
  verification_answer: z.string().trim().max(500).optional(),
})
type FormData = z.infer<typeof schema>

interface ClaimFormProps {
  itemId: string
  itemTitle: string
  verificationQuestion?: string | null
}

export function ClaimForm({ itemId, itemTitle, verificationQuestion }: ClaimFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    setSubmitting(true)
    try {
      const result = await submitClaim({ item_id: itemId, ...data })
      if (result && !result.success) {
        setServerError(result.error)
      }
      // On success, server action redirects — execution stops here
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={`Claim: ${itemTitle}`}
      data-testid="claim-form"
      className="space-y-5"
    >
      {serverError && (
        <div
          role="alert"
          data-testid="claim-error"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      {/* Verification answer — only shown if item has a question */}
      {verificationQuestion && (
        <div className="space-y-1.5">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Verification question</p>
            <p className="mt-1 italic text-muted-foreground">
              &ldquo;{verificationQuestion}&rdquo;
            </p>
          </div>
          <Label htmlFor="verification_answer">
            Your answer{' '}
            <span aria-hidden="true" className="text-destructive">*</span>
          </Label>
          <Input
            id="verification_answer"
            data-testid="verification-answer"
            placeholder="Answer the finder's question…"
            aria-invalid={!!errors.verification_answer}
            {...register('verification_answer')}
          />
          <FieldErrorMessage error={errors.verification_answer} />
        </div>
      )}

      {/* Proof of ownership */}
      <div className="space-y-1.5">
        <Label htmlFor="proof_text">
          How can you prove this is yours?{' '}
          <span aria-hidden="true" className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Describe a distinctive detail, mark, or content that only the true
          owner would know. Do not include personal contact information.
        </p>
        <Textarea
          id="proof_text"
          data-testid="proof-text"
          placeholder="e.g. There is a blue sticker on the back with my initials…"
          rows={4}
          aria-invalid={!!errors.proof_text}
          {...register('proof_text')}
        />
        <FieldErrorMessage error={errors.proof_text} />
      </div>

      <button
        type="submit"
        data-testid="submit-claim"
        disabled={submitting}
        aria-busy={submitting}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {submitting ? 'Submitting…' : 'Submit Claim'}
      </button>
    </form>
  )
}

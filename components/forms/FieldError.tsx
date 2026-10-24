/**
 * Tiny helper that renders a react-hook-form field error message.
 * Keeps the error-display pattern consistent everywhere.
 */
import type { FieldError } from 'react-hook-form'

interface FieldErrorProps {
  error?: FieldError
  id?: string
}

export function FieldErrorMessage({ error, id }: FieldErrorProps) {
  if (!error?.message) return null
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-1 text-sm font-medium text-ink"
    >
      {error.message}
    </p>
  )
}

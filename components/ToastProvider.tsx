'use client'

/**
 * ToastProvider — wraps Sonner's <Toaster> with our design tokens.
 *
 * Usage:
 *   import { ToastProvider } from '@/components/ToastProvider'
 *   // Mount once in root layout
 *
 * Triggering toasts anywhere in the app:
 *   import { toast } from 'sonner'
 *   toast.success('Item reported!')
 *   toast.error('Something went wrong.')
 */
import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group font-sans text-sm rounded-2xl border border-border bg-card text-card-foreground shadow-raised',
          title: 'font-semibold',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          error: 'border-destructive/30 bg-destructive/5 text-destructive',
          success: 'border-found/40 bg-found text-found-foreground',
        },
      }}
      richColors
    />
  )
}

// Re-export toast for convenience so callers only need one import
export { toast } from 'sonner'

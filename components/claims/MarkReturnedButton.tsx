'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { markReturned } from '@/app/actions/claims'

interface MarkReturnedButtonProps {
  itemId: string
}

export function MarkReturnedButton({ itemId }: MarkReturnedButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await markReturned({ item_id: itemId })
      if (result && !result.success) setError(result.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1">
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <button
        type="button"
        data-testid="mark-returned"
        disabled={busy}
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <CheckCircle className="size-4" aria-hidden="true" />
        {busy ? 'Updating…' : 'Mark as Returned'}
      </button>
    </div>
  )
}

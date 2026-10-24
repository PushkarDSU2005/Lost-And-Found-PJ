'use client'

import { useState, useTransition } from 'react'
import { XCircle } from 'lucide-react'
import { withdrawClaim } from '@/app/actions/items'
import { Button } from '@/components/ui/button'

interface WithdrawClaimButtonProps {
  claimId: string
}

export function WithdrawClaimButton({ claimId }: WithdrawClaimButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleWithdraw = () => {
    setError(null)
    startTransition(async () => {
      const result = await withdrawClaim({ claim_id: claimId })
      if (!result.success) {
        setError(result.error)
        setConfirming(false)
      }
      // On success, redirect happens in the action
    })
  }

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        data-testid="withdraw-claim-button"
        onClick={() => setConfirming(true)}
      >
        Withdraw
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl"
        role="dialog"
        aria-labelledby="withdraw-dialog-title"
      >
        <h2 id="withdraw-dialog-title" className="text-lg font-semibold text-foreground">
          Withdraw Claim?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to withdraw your claim? You can submit a new claim later if needed.
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleWithdraw}
            disabled={isPending}
            data-testid="confirm-withdraw"
          >
            {isPending ? 'Withdrawing…' : 'Withdraw'}
          </Button>
        </div>
      </div>
    </div>
  )
}

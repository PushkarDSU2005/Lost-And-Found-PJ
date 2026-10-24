'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteItem } from '@/app/actions/items'
import { Button } from '@/components/ui/button'

interface DeleteItemButtonProps {
  itemId: string
  itemTitle: string
}

export function DeleteItemButton({ itemId, itemTitle }: DeleteItemButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteItem({ item_id: itemId })
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
        variant="ghost"
        size="icon-sm"
        aria-label="Delete item"
        data-testid="delete-item-button"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl"
        role="dialog"
        aria-labelledby="delete-dialog-title"
      >
        <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground">
          Delete Item?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{itemTitle}</strong>? This action cannot be undone.
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
            onClick={handleDelete}
            disabled={isPending}
            data-testid="confirm-delete"
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

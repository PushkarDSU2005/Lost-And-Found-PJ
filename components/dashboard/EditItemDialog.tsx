'use client'

import { useState, useTransition } from 'react'
import { Edit } from 'lucide-react'
import { editItem } from '@/app/actions/items'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface EditItemDialogProps {
  itemId: string
  initialTitle: string
}

export function EditItemDialog({ itemId, initialTitle }: EditItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await editItem({ item_id: itemId, title, description })
      if (!result.success) {
        setError(result.error)
      }
      // On success, redirect happens in the action
    })
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit item"
        data-testid="edit-item-button"
        onClick={() => setIsOpen(true)}
      >
        <Edit className="size-4" aria-hidden="true" />
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl"
        role="dialog"
        aria-labelledby="edit-dialog-title"
      >
        <h2 id="edit-dialog-title" className="text-lg font-semibold text-foreground">
          Edit Item
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              disabled={isPending}
              data-testid="edit-title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              disabled={isPending}
              data-testid="edit-description"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="save-edit">
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

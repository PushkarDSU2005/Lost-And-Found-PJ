'use client'

import { useRef, useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sendMessage } from '@/app/actions/messages'
import { MESSAGE_MAX } from '@/lib/messaging'

interface MessageInputProps {
  claimId: string
  disabled?: boolean
}

export function MessageInput({ claimId, disabled }: MessageInputProps) {
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const charsLeft = MESSAGE_MAX - body.length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || isPending) return
    setError(null)

    const toSend = body.trim()
    setBody('')

    startTransition(async () => {
      const result = await sendMessage({ claim_id: claimId, body: toSend })
      if (!result.success) {
        setError(result.error)
        setBody(toSend) // restore so user can fix
      }
      // On success, the polling in MessageThread will pick up the new message
      textareaRef.current?.focus()
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Send message"
      data-testid="message-input-form"
      className="border-t border-border bg-background px-4 py-3"
    >
      {error && (
        <p role="alert" className="mb-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <textarea
            ref={textareaRef}
            data-testid="message-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isPending}
            rows={2}
            maxLength={MESSAGE_MAX}
            placeholder="Type a message… (Enter to send)"
            aria-label="Message body"
            className={cn(
              'w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:opacity-50',
            )}
          />
          <p
            className={cn(
              'text-right text-[10px]',
              charsLeft < 50 ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {charsLeft} left
          </p>
        </div>
        <button
          type="submit"
          data-testid="send-message"
          disabled={!body.trim() || isPending || disabled}
          aria-label="Send message"
          className="mb-5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

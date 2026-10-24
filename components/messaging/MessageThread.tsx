'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

const POLL_MS = 3000

interface MessageThreadProps {
  claimId: string
  currentUserId: string
  initialMessages: Message[]
}

export function MessageThread({ claimId, currentUserId, initialMessages }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const latestIdRef = useRef<string | null>(
    initialMessages[initialMessages.length - 1]?.id ?? null,
  )

  const fetchNew = useCallback(async () => {
    const sb = createSupabaseBrowserClient()
    const query = sb
      .from('messages')
      .select('id, claim_id, sender_id, body, created_at, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url)')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: true })

    if (latestIdRef.current) {
      query.gt('created_at', messages.at(-1)?.created_at ?? '1970-01-01')
    }

    const { data } = await query
    if (data && data.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id))
        const fresh = (data as unknown as Message[]).filter((m) => !existingIds.has(m.id))
        if (fresh.length === 0) return prev
        latestIdRef.current = fresh[fresh.length - 1]!.id
        return [...prev, ...fresh]
      })
    }
  }, [claimId, messages])

  // Polling
  useEffect(() => {
    const timer = setInterval(fetchNew, POLL_MS)
    return () => clearInterval(timer)
  }, [fetchNew])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div
        data-testid="message-thread"
        className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground"
      >
        No messages yet. Start the conversation.
      </div>
    )
  }

  return (
    <div
      data-testid="message-thread"
      aria-live="polite"
      aria-label="Message thread"
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
    >
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId
        const senderName = msg.sender?.full_name?.split(' ')[0] ?? 'User'
        return (
          <div
            key={msg.id}
            data-testid="message-bubble"
            className={cn('flex max-w-[80%] flex-col gap-0.5', isMine ? 'self-end items-end' : 'self-start items-start')}
          >
            <span className="text-[10px] text-muted-foreground">
              {isMine ? 'You' : senderName} ·{' '}
              {format(new Date(msg.created_at), 'HH:mm')}
            </span>
            <div
              className={cn(
                'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                isMine
                  ? 'rounded-br-sm bg-primary text-primary-foreground'
                  : 'rounded-bl-sm bg-muted text-foreground',
              )}
            >
              {msg.body}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

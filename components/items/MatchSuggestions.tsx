import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

interface MatchSuggestionsProps {
  itemId: string
}

interface Match {
  match_id: string
  match_title: string
  score: number
}

/**
 * Server component — calls match_items() and renders top suggestions.
 */
export async function MatchSuggestions({ itemId }: MatchSuggestionsProps) {
  const service = createSupabaseServiceClient()

  const { data: matches } = await service.rpc('match_items', {
    p_item_id:   itemId,
    p_threshold: 5,
    p_limit:     5,
  })

  const results = (matches ?? []) as Match[]

  if (results.length === 0) return null

  return (
    <section
      className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4"
      aria-labelledby="match-suggestions-title"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-5 text-primary" aria-hidden="true" />
        <h2 id="match-suggestions-title" className="text-base font-semibold text-foreground">
          Potential Matches
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        These items match based on category, location, date, and description similarity.
      </p>
      <ul className="space-y-2" role="list">
        {results.map((m) => (
          <li key={m.match_id}>
            <Link
              href={`/items/${m.match_id}`}
              data-testid="match-suggestion"
              className={cn(
                'flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3',
                'transition-colors hover:border-primary/40 hover:bg-muted/40',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                {m.match_title}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  m.score >= 7
                    ? 'bg-[--color-found] text-[--color-found-foreground]'
                    : 'bg-muted text-muted-foreground',
                )}
                aria-label={`Match score: ${m.score} out of 10`}
              >
                {m.score}/10
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

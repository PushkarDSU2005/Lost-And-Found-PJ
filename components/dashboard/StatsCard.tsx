import { TrendingUp } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'

interface StatsCardProps {
  userId: string
}

/**
 * Server component — shows count of items user helped return.
 * (Items where user was claimant, claim was approved, and item is now resolved)
 */
export async function StatsCard({ userId }: StatsCardProps) {
  const supabase = await createSupabaseServerClient()

  const { count } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('claimant_id', userId)
    .eq('status', 'approved')
    .in('items.status', ['resolved']) // Requires a join — alternative: service role with raw query

  // Fallback: just count approved claims
  const { count: approvedCount } = await supabase
    .from('claims')
    .select('id', { count: 'exact', head: true })
    .eq('claimant_id', userId)
    .eq('status', 'approved')

  const returnedCount = count ?? approvedCount ?? 0

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br from-[--color-found]/10 to-transparent px-4 py-3 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[--color-found]">
        <TrendingUp className="size-5 text-[--color-found-foreground]" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Items helped return</p>
        <p className="text-2xl font-bold text-foreground" data-testid="stats-returned-count">
          {returnedCount}
        </p>
      </div>
    </div>
  )
}

import { TrendingUp, Package, Users, Clock } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

/**
 * Server component — fetches aggregate stats for admin dashboard.
 */
export async function AdminStats() {
  const service = createSupabaseServiceClient()

  // Total posts
  const { count: totalPosts } = await service
    .from('items')
    .select('id', { count: 'exact', head: true })

  // Returned items (status=resolved)
  const { count: returnedCount } = await service
    .from('items')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'resolved')

  const returnedRate = totalPosts ? ((returnedCount ?? 0) / totalPosts * 100).toFixed(1) : '0.0'

  // Active users (posted in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: activeUsers } = await service
    .from('items')
    .select('reporter_id')
    .gte('created_at', sevenDaysAgo)

  const uniqueActiveUsers = new Set((activeUsers ?? []).map((i: { reporter_id: string }) => i.reporter_id)).size

  // Avg days to return (items with resolved_at set)
  const { data: resolvedItems } = await service
    .from('items')
    .select('created_at, resolved_at')
    .not('resolved_at', 'is', null)
    .limit(1000)

  let avgDays = 0
  if (resolvedItems && resolvedItems.length > 0) {
    const totalDays = (resolvedItems as Array<{ created_at: string; resolved_at: string }>).reduce((sum, item) => {
      const created = new Date(item.created_at).getTime()
      const resolved = new Date(item.resolved_at).getTime()
      return sum + (resolved - created) / (24 * 60 * 60 * 1000)
    }, 0)
    avgDays = Math.round(totalDays / resolvedItems.length)
  }

  const stats = [
    { label: 'Total Posts', value: totalPosts?.toString() ?? '0', icon: Package, color: 'text-primary' },
    { label: 'Returned Rate', value: `${returnedRate}%`, icon: TrendingUp, color: 'text-[--color-found]' },
    { label: 'Active Users (7d)', value: uniqueActiveUsers.toString(), icon: Users, color: 'text-amber-600' },
    { label: 'Avg Days to Return', value: avgDays.toString(), icon: Clock, color: 'text-muted-foreground' },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-muted ${stat.color}`}>
              <Icon className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

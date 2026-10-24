import type { Metadata} from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Skeleton } from '@/components/Skeleton'

export const metadata: Metadata = {
  title: 'Dashboard',
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const safeNext = getSafeRedirectPath('/dashboard', '/dashboard')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  const params = await searchParams
  const activeTab = (params.tab ?? 'posts') as 'posts' | 'claims' | 'incoming'

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your posts and claims
          </p>
        </div>

        {/* Stats card */}
        <Suspense fallback={<Skeleton className="h-20 w-48" />}>
          <StatsCard userId={user.id} />
        </Suspense>
      </div>

      {/* Tabs */}
      <DashboardTabs userId={user.id} activeTab={activeTab} />
    </div>
  )
}

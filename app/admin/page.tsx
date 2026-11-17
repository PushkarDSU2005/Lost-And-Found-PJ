// TEMPORARY: Disabled (same issue as dashboard - see dashboard/page.tsx.disabled)
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { AdminStats } from '@/components/admin/AdminStats'
import { Skeleton } from '@/components/Skeleton'

// Dynamic import for AdminTabs to reduce initial bundle
const AdminTabs = dynamic(() => import('@/components/admin/AdminTabs').then(mod => ({ default: mod.AdminTabs })), {
  loading: () => <Skeleton className="h-96 w-full" />,
})

export const metadata: Metadata = {
  title: 'Admin Panel',
}

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const safeNext = getSafeRedirectPath('/admin', '/admin')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  // Admin role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/?error=unauthorized')
  }

  const params = await searchParams
  const activeTab = (params.tab ?? 'reports') as 'reports' | 'items' | 'users' | 'locations' | 'audit'

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Admin Panel
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, moderate content, and view analytics
        </p>
      </div>

      {/* Stats overview */}
      <Suspense fallback={<Skeleton className="mb-8 h-32 w-full" />}>
        <AdminStats />
      </Suspense>

      {/* Admin tabs */}
      <AdminTabs activeTab={activeTab} />
    </div>
  )
}

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
  ssr: false,
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

  // Admin check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to access the admin panel.
        </p>
      </div>
    )
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
          Manage reports, users, and locations
        </p>
      </div>

      {/* Stats cards */}
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <AdminStats />
      </Suspense>

      {/* Tabs */}
      <div className="mt-8">
        <AdminTabs activeTab={activeTab} />
      </div>
    </div>
  )
}

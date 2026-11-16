// TEMPORARY: Stub until admin is fixed (see page.tsx.disabled)
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Admin Panel - Under Construction',
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/admin')

  // Admin role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/?error=unauthorized')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Admin Panel Under Construction</h1>
      <p className="mt-4 text-muted-foreground">
        The admin panel is being refactored to fix a build issue.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Coming soon in Task 20!
      </p>
    </div>
  )
}

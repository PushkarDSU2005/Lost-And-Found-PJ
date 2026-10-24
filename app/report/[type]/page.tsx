import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@/components/PageHeader'
import { ReportForm } from '@/components/forms/ReportForm'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import type { ItemReportType, Location } from '@/lib/types'

// ─── Route params ─────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ type: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params
  if (type !== 'lost' && type !== 'found') return {}
  return {
    title: type === 'lost' ? 'Report a Lost Item' : 'Report a Found Item',
    description:
      type === 'lost'
        ? 'Tell us what you lost and where — we\'ll help reunite you with it.'
        : 'Found something on campus? Report it here so the owner can claim it.',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportPage({ params }: PageProps) {
  const { type } = await params

  if (type !== 'lost' && type !== 'found') notFound()

  // Auth check — redirect to login if not authenticated
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = getSafeRedirectPath(`/report/${type}`, '/report/lost')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  const reportType = type as ItemReportType

  // Fetch real locations from database
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, drop_point')
    .order('name')
  
  const locationsList: Pick<Location, 'id' | 'name' | 'drop_point'>[] = locations ?? []

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-28 sm:px-6 md:pb-10">
      <PageHeader
        title={reportType === 'lost' ? '🔴 Report a Lost Item' : '🟢 Report a Found Item'}
        description={
          reportType === 'lost'
            ? 'Fill in as much detail as possible to help others identify your item.'
            : 'Help return this item to its owner. All reports are moderated.'
        }
      />
      <ReportForm type={reportType} locations={locationsList} />
    </div>
  )
}

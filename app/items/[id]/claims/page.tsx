import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { ClaimCard, type ClaimCardData } from '@/components/claims/ClaimCard'
import { MarkReturnedButton } from '@/components/claims/MarkReturnedButton'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reviewed?: string; returned?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('items').select('title').eq('id', id).single()
  return { title: data ? `Claims — ${data.title}` : 'Manage Claims' }
}

export default async function ClaimsPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createSupabaseServerClient()

  // Auth gate
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = getSafeRedirectPath(`/items/${id}/claims`, '/items')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  // Load item
  const { data: item } = await supabase
    .from('items')
    .select('id, title, status, reporter_id')
    .eq('id', id)
    .single()
  if (!item) notFound()

  const itemRow = item as { id: string; title: string; status: string; reporter_id: string }

  // Is viewer admin?
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = (profile as { role?: string } | null)?.role === 'admin'

  // Only owner or admin can view claims
  if (itemRow.reporter_id !== user.id && !isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground">You don&apos;t have permission to view these claims.</p>
      </div>
    )
  }

  const canReview = itemRow.reporter_id === user.id || isAdmin

  // Load all claims with claimant name (first name only — privacy)
  const { data: claims } = await supabase
    .from('claims')
    .select(
      'id, claimant_id, status, proof_text, admin_note, reviewed_at, created_at,' +
      'claimant:profiles!claims_claimant_id_fkey(full_name)',
    )
    .eq('item_id', id)
    .order('created_at', { ascending: false })

  const claimList = (claims ?? []) as unknown as ClaimCardData[]
  const pendingCount = claimList.filter((c) => c.status === 'pending').length

  const isOwner = itemRow.reporter_id === user.id
  const showMarkReturned = isOwner && itemRow.status === 'claimed'

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6 md:pb-10">
      <Link
        href={`/items/${id}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4')}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to item
      </Link>

      {/* Success banners */}
      {sp.reviewed && (
        <div role="status" className="mb-4 rounded-lg border border-border bg-muted px-4 py-2 text-sm">
          Claim updated successfully.
        </div>
      )}
      {sp.returned && (
        <div role="status" className="mb-4 rounded-lg border border-[--color-resolved] bg-[--color-resolved] px-4 py-2 text-sm text-[--color-resolved-foreground]">
          Item marked as returned. 🎉
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Claims</h1>
          <p className="mt-0.5 text-sm font-medium text-muted-foreground">{itemRow.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {claimList.length} claim{claimList.length !== 1 ? 's' : ''}
            {pendingCount > 0 && ` · ${pendingCount} pending`}
          </p>
        </div>

        {showMarkReturned && (
          <div className="shrink-0">
            <MarkReturnedButton itemId={id} />
          </div>
        )}
      </div>

      {claimList.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No claims yet.</p>
      ) : (
        <ul
          data-testid="claims-list"
          className="mt-6 space-y-4"
          aria-label="Claims list"
        >
          {claimList.map((claim) => (
            <li key={claim.id}>
              <ClaimCard claim={claim} itemId={id} canReview={canReview} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

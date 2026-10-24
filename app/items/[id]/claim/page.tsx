import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Lock } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSafeRedirectPath } from '@/lib/security'
import { ClaimForm } from '@/components/claims/ClaimForm'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('items').select('title').eq('id', id).single()
  return { title: data ? `Claim: ${data.title}` : 'Claim Item' }
}

export default async function ClaimPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  // Auth gate
  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = getSafeRedirectPath(`/items/${id}/claim`, '/items')
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`)

  // Load item
  const { data: item } = await supabase
    .from('items')
    .select('id, title, report_type, status, reporter_id, is_sensitive, verification_question')
    .eq('id', id)
    .single()

  if (!item) notFound()

  // Guard: can't claim own item
  if (item.reporter_id === user.id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground">You cannot claim your own item.</p>
        <Link href={`/items/${id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
          Back to item
        </Link>
      </div>
    )
  }

  // Guard: item must be open
  if (item.status !== 'open') {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-muted-foreground capitalize">
          This item is <strong>{item.status}</strong> and can no longer be claimed.
        </p>
        <Link href={`/items/${id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4')}>
          Back to item
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-4 sm:px-6 md:pb-10">
      <Link href={`/items/${id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2 mb-4')}>
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to item
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Claim this item
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{item.title as string}</span>
      </p>

      {item.is_sensitive && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          This is a sensitive item. If your claim is approved, you will be able to
          view the full images via a secure link.
        </div>
      )}

      <div className="mt-6">
        <ClaimForm
          itemId={id}
          itemTitle={item.title as string}
          verificationQuestion={(item.verification_question as string | null) ?? undefined}
        />
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  MapPin, Calendar, Tag, Info, ChevronLeft,
  Building2, Clock, ShieldAlert,
} from 'lucide-react'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  fetchItemDetail,
  resolveViewerContext,
  getSignedImageUrls,
  resolveImageUrl,
} from '@/lib/items'
import { CATEGORY_META } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { ImageGallery, type GalleryImage } from '@/components/items/ImageGallery'
import { ActionButtons } from '@/components/items/ActionButtons'
import { MatchSuggestions } from '@/components/items/MatchSuggestions'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Page props ───────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('items')
    .select('title, description, report_type, category')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Item not found' }

  const meta = CATEGORY_META[data.category as keyof typeof CATEGORY_META]
  const typeLabel = data.report_type === 'lost' ? 'Lost' : 'Found'

  return {
    title: `${typeLabel}: ${data.title}`,
    description: data.description
      ? data.description.slice(0, 155)
      : `${typeLabel} ${meta?.label ?? data.category} reported on campus.`,
    openGraph: {
      title: `${typeLabel}: ${data.title}`,
      description: data.description?.slice(0, 200) ?? undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: `${typeLabel}: ${data.title}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { item, error: fetchError } = await fetchItemDetail(supabase, id)
  if (!item || fetchError) notFound()

  const viewerCtx = await resolveViewerContext(supabase, item)
  const categoryMeta = CATEGORY_META[item.category]
  const images = (item.images ?? []).sort((a, b) => a.sort_order - b.sort_order)

  // Pending claim count for the owner's "View Claims" badge
  let pendingClaimsCount = 0
  if (viewerCtx.isOwner) {
    const { count } = await supabase
      .from('claims')
      .select('id', { count: 'exact', head: true })
      .eq('item_id', id)
      .eq('status', 'pending')
    pendingClaimsCount = count ?? 0
  }

  // Generate signed URLs for sensitive images if viewer has access
  const signedUrls =
    item.is_sensitive && viewerCtx.imageAccess === 'full'
      ? await getSignedImageUrls(images)
      : new Map<string, string>()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  // Build gallery images
  const galleryImages: GalleryImage[] = images.map((img) => ({
    id: img.id,
    url: viewerCtx.imageAccess === 'full'
      ? resolveImageUrl(img, signedUrls, supabaseUrl)
      : '',
    alt: item.title,
    isSensitive: img.bucket === 'sensitive-images' && viewerCtx.imageAccess !== 'full',
  }))

  // Posted-by: first name only for privacy
  const reporterFirstName = item.reporter?.full_name?.split(' ')[0] ?? 'Someone'

  const heldAtLocation = (item as unknown as {
    held_at_location?: { name: string; drop_point: boolean; hours?: string | null; building?: string | null }
  }).held_at_location

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 sm:px-6 md:pb-12">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/browse"
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mb-4 -ml-2')}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Browse
      </Link>

      {/* ── Two-column layout on sm+ ───────────────────────────────── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">

        {/* ── Left: image gallery ────────────────────────────────── */}
        <div className="sm:w-[320px] sm:shrink-0 lg:w-[380px]">
          <ImageGallery
            images={galleryImages}
            isSensitive={item.is_sensitive && viewerCtx.imageAccess !== 'full'}
            fallbackEmoji={categoryMeta.emoji}
          />

          {/* Sensitive warning banner */}
          {item.is_sensitive && viewerCtx.imageAccess !== 'full' && (
            <div
              role="note"
              className="mt-2 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                This item may contain personal documents. Images are only shown to the
                reporter, an admin, or an approved claimant.
              </span>
            </div>
          )}
        </div>

        {/* ── Right: metadata + actions ──────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Type + status badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={item.report_type} />
            <StatusBadge variant={item.status} />
            {item.is_sensitive && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                aria-label="Sensitive item"
              >
                <ShieldAlert className="size-3" aria-hidden="true" />
                Sensitive
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            data-testid="item-title"
            className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {item.title}
          </h1>

          {/* Description */}
          {item.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {item.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="mt-5">
            <ActionButtons
              itemId={item.id}
              itemTitle={item.title}
              itemStatus={item.status}
              viewerCtx={viewerCtx}
              pendingClaimsCount={pendingClaimsCount}
            />
          </div>

          {/* ── Match Suggestions ──────────────────────────────── */}
          {item.status === 'open' && (
            <div className="mt-6">
              <MatchSuggestions itemId={item.id} />
            </div>
          )}

          {/* ── Metadata table ─────────────────────────────────── */}
          <dl className="mt-6 space-y-3 text-sm">

            {/* Category */}
            <div className="flex items-start gap-2">
              <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <Tag className="size-3.5" aria-hidden="true" />
                Category
              </dt>
              <dd className="text-foreground">
                {categoryMeta.emoji} {categoryMeta.label}
              </dd>
            </div>

            {/* Date occurred */}
            {item.date_occurred && (
              <div className="flex items-start gap-2">
                <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  Date {item.report_type === 'lost' ? 'lost' : 'found'}
                </dt>
                <dd data-testid="date-occurred" className="text-foreground">
                  {format(new Date(item.date_occurred), 'd MMM yyyy')}
                </dd>
              </div>
            )}

            {/* Location */}
            {(item.location || item.location_text) && (
              <div className="flex items-start gap-2">
                <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  Location
                </dt>
                <dd className="text-foreground">
                  {item.location
                    ? item.location.name
                    : item.location_text}
                </dd>
              </div>
            )}

            {/* Held at — found items with a drop-point */}
            {heldAtLocation && (
              <div
                data-testid="held-at"
                className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
              >
                <dt className="flex shrink-0 items-start gap-1.5 text-muted-foreground pt-0.5">
                  <Building2 className="size-3.5" aria-hidden="true" />
                  Held at
                </dt>
                <dd>
                  <p className="font-medium text-foreground">{heldAtLocation.name}</p>
                  {heldAtLocation.building && (
                    <p className="text-xs text-muted-foreground">{heldAtLocation.building}</p>
                  )}
                  {heldAtLocation.hours && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden="true" />
                      {heldAtLocation.hours}
                    </p>
                  )}
                  {heldAtLocation.drop_point && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Official drop-point
                    </span>
                  )}
                </dd>
              </div>
            )}

            {/* Verification question */}
            {item.verification_question && (
              <div className="flex items-start gap-2">
                <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <Info className="size-3.5" aria-hidden="true" />
                  To claim
                </dt>
                <dd className="italic text-muted-foreground">
                  &ldquo;{item.verification_question}&rdquo;
                </dd>
              </div>
            )}

            {/* Posted by */}
            <div className="flex items-start gap-2">
              <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <Info className="size-3.5" aria-hidden="true" />
                Posted by
              </dt>
              <dd
                data-testid="posted-by"
                className="text-foreground"
                aria-label={`Posted by ${reporterFirstName}`}
              >
                {reporterFirstName}
              </dd>
            </div>

            {/* Posted at */}
            <div className="flex items-start gap-2">
              <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                Posted
              </dt>
              <dd className="text-muted-foreground">
                {format(new Date(item.created_at), 'd MMM yyyy, HH:mm')}
              </dd>
            </div>

            {/* Expiry */}
            {item.expires_at && item.status === 'open' && (
              <div className="flex items-start gap-2">
                <dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  Expires
                </dt>
                <dd className="text-muted-foreground">
                  {format(new Date(item.expires_at), 'd MMM yyyy')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* ── Possible matches placeholder (Day 11) ─────────────────── */}
      <section
        aria-labelledby="matches-heading"
        className="mt-10 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8"
      >
        <h2
          id="matches-heading"
          className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Possible matches
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rule-based match suggestions coming soon — we&apos;ll surface items with
          similar category, location, and date automatically.
        </p>
      </section>
    </div>
  )
}

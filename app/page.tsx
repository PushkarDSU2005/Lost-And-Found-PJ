import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, PlusCircle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { ItemCard } from '@/components/ItemCard'
import { CategoryChip } from '@/components/CategoryChip'
import { EmptyState } from '@/components/EmptyState'
import { Tag, RubberStamp } from '@/components/Tag'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { BROWSE_SELECT } from '@/lib/browse'
import { CATEGORY_META, type ItemCategory, type ItemReportType, type Item } from '@/lib/types'

export const metadata: Metadata = {
  title: 'Lost & Found — Home',
  description: 'Browse lost and found items on campus or report your own.',
}

const FEATURED_CATEGORIES: ItemCategory[] = [
  'electronics',
  'keys',
  'accessories',
  'clothing',
  'id_documents',
  'books_stationery',
]

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>
}) {
  // Consume type from URL params, default to 'lost'
  const params = await searchParams
  const activeType: ItemReportType = (params?.type === 'found' ? 'found' : 'lost')

  const supabase = await createSupabaseServerClient()

  // ── Live data: most recently returned (resolved) items ───────────────────
  // "Just returned" — real resolved items, latest first.
  const { data: returnedData } = await supabase
    .from('items')
    .select(BROWSE_SELECT)
    .eq('status', 'resolved')
    .order('resolved_at', { ascending: false })
    .limit(3)
  const justReturned = (returnedData ?? []) as unknown as Item[]
  const latestReturned = justReturned[0] ?? null

  const latestLocation = latestReturned
    ? (latestReturned.location?.name ?? latestReturned.location_text ?? 'campus')
    : null

  const heroQuote = latestReturned
    ? `“${latestReturned.title}” is lost — found at ${latestLocation}!`
    : 'Your lost item was found!'

  const heroMeta = latestReturned
    ? `Found · ${latestLocation} — ${formatRelativeDate(latestReturned.resolved_at ?? latestReturned.created_at)}`
    : 'Latest returns will appear here once an item is resolved.'

  // ── Live data: open items near you ───────────────────────────────────────
  const { data } = await supabase
    .from('items')
    .select(BROWSE_SELECT)
    .eq('status', 'open')
    .eq('report_type', activeType)
    .order('created_at', { ascending: false })
    .limit(8)

  const recentItems = (data ?? []) as unknown as Item[]

  return (
    <>
      {/* ── Hero — "Just returned" ─────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-orange/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.06em] text-[--color-orange-deep]">
            Just returned
          </p>
          <h1
            id="hero-heading"
            className="font-display text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-ink"
          >
            {heroQuote}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">{heroMeta}</p>

          {/* Large stamped tag card — resolved items only */}
          <div className="relative mx-auto mt-8 w-full max-w-sm">
            <Tag
              reportType={latestReturned?.report_type ?? activeType}
              resolved={!!latestReturned}
              className="aspect-[4/3] w-full"
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="text-6xl" aria-hidden="true">
                  {latestReturned
                    ? CATEGORY_META[latestReturned.category]?.emoji ?? '🔍'
                    : '🔍'}
                </span>
                <p className="font-display text-lg font-semibold text-ink">
                  {latestReturned?.title ?? 'Nothing returned yet'}
                </p>
                {latestReturned && <RubberStamp />}
              </div>
            </Tag>
          </div>
        </div>
      </section>

      {/* ── Hero — search-first: "What did you lose?" ─────────────────── */}
      <section
        aria-labelledby="search-heading"
        className="mx-auto max-w-2xl px-4 pb-12 sm:px-6"
      >
        <h2
          id="search-heading"
          className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        >
          What did you lose?
        </h2>

        <form
          action="/browse"
          method="GET"
          role="search"
          aria-label="Search lost and found items"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="hero-search" className="sr-only">
            Search items
          </label>
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="hero-search"
              name="q"
              type="search"
              placeholder="Search your item…"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-base text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
            />
          </div>
          <Button type="submit" size="lg" className="w-full sm:w-auto" aria-label="Search">
            Search
          </Button>
        </form>

        {/* Quiet CTAs — specific copy, never "Submit" */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/report/lost" className="flex items-center gap-1">
              <PlusCircle className="size-4" aria-hidden="true" />
              Report lost item
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/report/found" className="flex items-center gap-1">
              <PlusCircle className="size-4" aria-hidden="true" />
              Report found item
            </Link>
          </Button>
        </div>

        {/* Lost / Found toggle — radiogroup on links, URL-driven */}
        <div
          role="radiogroup"
          aria-label="Filter by report type"
          className="mt-6 inline-flex rounded-full border border-border bg-muted p-1 shadow-inner"
        >
          {(['lost', 'found'] as ItemReportType[]).map((type) => (
            <Link
              key={type}
              href={`/?type=${type}`}
              role="radio"
              aria-checked={activeType === type}
              className={
                activeType === type
                  ? type === 'lost'
                    ? 'rounded-full bg-[--color-lost] px-5 py-1.5 text-sm font-semibold text-[--color-lost-foreground] shadow transition-all'
                    : 'rounded-full bg-[--color-found] px-5 py-1.5 text-sm font-semibold text-[--color-found-foreground] shadow transition-all'
                  : 'rounded-full px-5 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground'
              }
            >
              {type === 'lost' ? 'Lost' : 'Found'}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Browse by category ───────────────────────────────────────── */}
      <section
        aria-labelledby="categories-heading"
        className="mx-auto max-w-7xl px-4 pt-10 sm:px-6"
      >
        <h2
          id="categories-heading"
          className="mb-4 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
        >
          Browse by category
        </h2>
        <div className="flex flex-wrap gap-2" role="list">
          {FEATURED_CATEGORIES.map((cat) => (
            <div key={cat} role="listitem">
              <Link href={`/browse?category=${cat}`}>
                <CategoryChip category={cat} />
              </Link>
            </div>
          ))}
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground"
          >
            View all
          </Link>
        </div>
      </section>

      {/* ── Recently posted open items ────────────────────────────────── */}
      <section
        aria-labelledby="recent-heading"
        className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 md:pb-12"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="recent-heading"
            className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            {activeType === 'lost'
              ? 'Open lost items near you'
              : 'Open found items near you'}
          </h2>
          <Link href="/browse" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            View all
          </Link>
        </div>

        {recentItems.length > 0 ? (
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            aria-label="Recent lost and found items"
            role="list"
          >
            {recentItems.map((item, index) => (
              <li key={item.id}>
                <ItemCard item={item} priority={index < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="🔍"
            title="No open items found"
            description="Try a different search or category — or report the item yourself."
            action={{ label: 'Report lost item', href: '/report/lost' }}
          />
        )}
      </section>
    </>
  )
}

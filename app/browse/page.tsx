import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normaliseParams, buildBrowseQuery, PAGE_SIZE, getCachedBrowseResult, setCachedBrowseResult, makeBrowseCacheKey } from '@/lib/browse'
import type { BrowseParams } from '@/lib/browse'
import type { Item } from '@/lib/types'
import { ItemCard } from '@/components/ItemCard'
import { EmptyState } from '@/components/EmptyState'
import { ItemGridSkeleton } from '@/components/Skeleton'
import { FilterBar } from '@/components/browse/FilterBar'
import { SearchInput } from '@/components/browse/SearchInput'
import { ActiveFilters } from '@/components/browse/ActiveFilters'
import { Pagination } from '@/components/browse/Pagination'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>
}): Promise<Metadata> {
  const raw = await searchParams
  const parts: string[] = []
  if (raw.q) parts.push(`"${raw.q}"`)
  if (raw.type) parts.push(raw.type === 'lost' ? 'Lost items' : 'Found items')
  if (raw.category) parts.push(raw.category.replace('_', ' '))
  return {
    title: parts.length ? `${parts.join(' · ')} — Browse` : 'Browse Lost & Found',
    description: 'Browse all lost and found items reported on campus.',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<BrowseParams>
}) {
  const raw = await searchParams
  const params = normaliseParams(raw)

  // Check cache first
  const cacheKey = makeBrowseCacheKey(params)
  const cached = getCachedBrowseResult<{ items: Item[], totalCount: number }>(cacheKey)

  let items: Item[]
  let totalCount: number

  if (cached) {
    items = cached.items
    totalCount = cached.totalCount
  } else {
    // Fetch items + total count from Supabase (RLS enforced — open items only for anon)
    const supabase = await createSupabaseServerClient()
    const { query } = buildBrowseQuery(supabase, params)
    const { data, count } = await query

    items = (data ?? []) as unknown as Item[]
    totalCount = count ?? 0

    // Cache the result
    setCachedBrowseResult(cacheKey, { items, totalCount })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Browse items
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount} item{totalCount !== 1 ? 's' : ''} · newest first
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/report/lost"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <PlusCircle className="mr-1.5 size-3.5" aria-hidden="true" />
            Report lost
          </Link>
          <Link
            href="/report/found"
            className={buttonVariants({ size: 'sm' })}
          >
            <PlusCircle className="mr-1.5 size-3.5" aria-hidden="true" />
            Report found
          </Link>
        </div>
      </div>

      {/* ── Search bar ─────────────────────────────────────────── */}
      {/* SearchInput is a Client Component because it debounces and pushes to the URL */}
      <Suspense fallback={null}>
        <SearchInput defaultValue={params.q} className="mb-3" />
        <ActiveFilters />
      </Suspense>

      {/* ── Main layout: sidebar + grid ────────────────────────── */}
      <div className="mt-4 flex gap-6">
        {/* Filter sidebar (desktop sticky / mobile bottom sheet) */}
        <Suspense fallback={null}>
          <FilterBar params={params} totalCount={totalCount} />
        </Suspense>

        {/* Content column */}
        <div className="min-w-0 flex-1">
          {items.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No items found"
              description={
                params.q
                  ? `No results for "${params.q}". Try different keywords or remove some filters.`
                  : 'No items match the selected filters. Try broadening your search.'
              }
            />
          ) : (
            <>
              <ul
                data-testid="item-grid"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4"
                aria-label={`Browse items — page ${params.page}`}
                role="list"
              >
                {items.map((item) => (
                  <li key={item.id}>
                    <ItemCard item={item} />
                  </li>
                ))}
              </ul>

              <Pagination
                params={params}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { ItemGridSkeleton } from '@/components/Skeleton'

/**
 * Shown by Next.js while the Browse page RSC is streaming.
 * Matches the grid layout of the actual page.
 */
export default function BrowseLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12">
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" aria-hidden="true" />
      </div>
      {/* Search skeleton */}
      <div className="mb-3 h-11 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />
      {/* Grid */}
      <div className="mt-4 flex gap-6">
        {/* Sidebar skeleton */}
        <div
          className="hidden lg:block lg:h-96 lg:w-56 lg:shrink-0 lg:animate-pulse lg:rounded-xl lg:bg-muted"
          aria-hidden="true"
        />
        <ItemGridSkeleton count={12} className="flex-1 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
      </div>
    </div>
  )
}

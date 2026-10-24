import { cn } from '@/lib/utils'

/** Generic shimmer skeleton block */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  )
}

/** Skeleton that matches TagCard dimensions */
export function ItemCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-tag',
        className,
      )}
    >
      {/* Image placeholder */}
      <Skeleton className="aspect-[4/3] w-full rounded-t-2xl" />
      {/* Content */}
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="mt-2 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

/** Grid of N item card skeletons */
export function ItemGridSkeleton({
  count = 8,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading items…"
      className={cn(
        'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}

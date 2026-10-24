import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toSearchString } from '@/lib/browse'
import type { NormalisedBrowseParams } from '@/lib/browse'

interface PaginationProps {
  params: NormalisedBrowseParams
  totalCount: number
  pageSize: number
}

export function Pagination({ params, totalCount, pageSize }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const { page } = params

  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  function href(p: number) {
    return `/browse?${toSearchString({ ...params, page: p })}` as const
  }

  // Show at most 5 page numbers around current
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 py-6"
    >
      {/* Prev */}
      {hasPrev ? (
        <Link
          href={href(page - 1)}
          aria-label="Previous page"
          scroll={false}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground/40">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? 'page' : undefined}
          scroll={false}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
            p === page
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {p}
        </Link>
      ))}

      {/* Next */}
      {hasNext ? (
        <Link
          href={href(page + 1)}
          aria-label="Next page"
          scroll={false}
          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground/40">
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}

      <p className="ml-2 text-xs text-muted-foreground">
        Page {page} of {totalPages} · {totalCount} item{totalCount !== 1 ? 's' : ''}
      </p>
    </nav>
  )
}

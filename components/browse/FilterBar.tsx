'use client'

/**
 * FilterBar
 * ─────────
 * Desktop: sticky left-column sidebar (visible at lg+).
 * Mobile: hidden by default; toggled via a floating button → slides up as a
 * bottom sheet using a CSS-only checkbox trick (no portal/dialog dep needed).
 *
 * All filter changes push to the URL so the RSC page can re-render.
 */

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_META, type ItemCategory, type ItemReportType, type ItemStatus } from '@/lib/types'
import type { NormalisedBrowseParams } from '@/lib/browse'
import { toSearchString } from '@/lib/browse'

const TYPES: { value: ItemReportType; label: string; emoji: string }[] = [
  { value: 'lost',  label: 'Lost',  emoji: '🔴' },
  { value: 'found', label: 'Found', emoji: '🟢' },
]

const STATUSES: { value: ItemStatus; label: string }[] = [
  { value: 'open',     label: 'Open'     },
  { value: 'claimed',  label: 'Claimed'  },
  { value: 'resolved', label: 'Resolved' },
  { value: 'expired',  label: 'Expired'  },
]

const CATEGORIES = Object.entries(CATEGORY_META) as [
  ItemCategory,
  { label: string; emoji: string },
][]

interface FilterBarProps {
  params: NormalisedBrowseParams
  totalCount: number
}

export function FilterBar({ params, totalCount }: FilterBarProps) {
  const pathname = usePathname()
  const sp = useSearchParams()

  function filterHref(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString())
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.delete('page') // reset to page 1 on filter change
    return `${pathname}?${next.toString()}`
  }

  const activeFilterCount =
    (params.type ? 1 : 0) +
    (params.category ? 1 : 0) +
    (params.status !== 'open' ? 1 : 0) +
    (params.date_from || params.date_to ? 1 : 0)

  const panelContent = (
    <div className="space-y-6">
      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {totalCount} item{totalCount !== 1 ? 's' : ''} found
      </p>

      {/* ── Report type ─────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Type
        </legend>
        <div className="flex flex-col gap-1">
          <Link
            href={filterHref('type', null)}
            scroll={false}
            aria-pressed={!params.type}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              !params.type
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            All
          </Link>
          {TYPES.map(({ value, label, emoji }) => (
            <Link
              key={value}
              href={filterHref('type', params.type === value ? null : value)}
              scroll={false}
              aria-pressed={params.type === value}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                params.type === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {emoji} {label}
            </Link>
          ))}
        </div>
      </fieldset>

      {/* ── Category ────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </legend>
        <div className="flex flex-col gap-1">
          <Link
            href={filterHref('category', null)}
            scroll={false}
            aria-pressed={!params.category}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              !params.category
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            All categories
          </Link>
          {CATEGORIES.map(([value, { label, emoji }]) => (
            <Link
              key={value}
              href={filterHref('category', params.category === value ? null : value)}
              scroll={false}
              aria-pressed={params.category === value}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                params.category === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {emoji} {label}
            </Link>
          ))}
        </div>
      </fieldset>

      {/* ── Status ──────────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </legend>
        <div className="flex flex-col gap-1">
          {STATUSES.map(({ value, label }) => (
            <Link
              key={value}
              href={filterHref('status', value)}
              scroll={false}
              aria-pressed={params.status === value}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                params.status === value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </fieldset>

      {/* ── Date range ──────────────────────────────────────────── */}
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Date range
        </legend>
        <div className="flex flex-col gap-2">
          <label className="space-y-0.5">
            <span className="text-xs text-muted-foreground">From</span>
            <DateFilterInput
              name="date_from"
              value={params.date_from ?? ''}
              pathname={pathname}
              sp={sp}
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-xs text-muted-foreground">To</span>
            <DateFilterInput
              name="date_to"
              value={params.date_to ?? ''}
              pathname={pathname}
              sp={sp}
            />
          </label>
        </div>
      </fieldset>

      {/* ── Clear all ───────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <Link
          href={pathname}
          scroll={false}
          className="block w-full rounded-lg border border-border py-2 text-center text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Clear all filters
        </Link>
      )}
    </div>
  )

  return (
    <>
      {/* ── Desktop sticky sidebar ─────────────────────────────── */}
      <aside
        aria-label="Browse filters"
        className="hidden lg:sticky lg:top-20 lg:block lg:h-fit lg:w-56 lg:shrink-0 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-4"
      >
        {panelContent}
      </aside>

      {/* ── Mobile: floating filter button + bottom sheet ──────── */}
      <div className="lg:hidden">
        {/* CSS-only bottom sheet: hidden checkbox drives open/close state */}
        <input
          type="checkbox"
          id="filter-sheet-toggle"
          aria-label="Toggle filters"
          className="peer sr-only"
        />

        {/* Backdrop */}
        <label
          htmlFor="filter-sheet-toggle"
          className="peer-checked:fixed peer-checked:inset-0 peer-checked:z-40 peer-checked:bg-black/40 hidden peer-checked:block"
          aria-hidden="true"
        />

        {/* Bottom sheet panel */}
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 max-h-[85svh] overflow-y-auto',
            'rounded-t-2xl border-t border-border bg-background px-4 pb-safe-area-inset-bottom pt-4',
            'translate-y-full transition-transform duration-300',
            'peer-checked:translate-y-0',
          )}
          role="dialog"
          aria-label="Browse filters"
          aria-modal="true"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Filters</h2>
            <label
              htmlFor="filter-sheet-toggle"
              aria-label="Close filters"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </label>
          </div>
          {panelContent}
          <div className="h-8" aria-hidden="true" /> {/* bottom padding */}
        </div>

        {/* Floating filter button */}
        <label
          htmlFor="filter-sheet-toggle"
          aria-label={`Filter${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          className={cn(
            'fixed bottom-20 right-4 z-30 flex h-11 cursor-pointer items-center gap-2 rounded-full px-4 shadow-lg',
            'bg-primary text-primary-foreground text-sm font-medium',
            'transition-transform active:scale-95',
          )}
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground text-[10px] font-bold text-primary">
              {activeFilterCount}
            </span>
          )}
        </label>
      </div>
    </>
  )
}

// ─── Date input sub-component ────────────────────────────────────────────────

interface DateFilterInputProps {
  name: string
  value: string
  pathname: string
  sp: URLSearchParams
}

function DateFilterInput({ name, value, pathname, sp }: DateFilterInputProps) {
  // Date inputs must navigate immediately (no debounce needed — user picks from picker)
  // We use a form submit on change pattern via a hidden form approach:
  // Since we're in a client component, update the URL imperatively.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRouter } = require('next/navigation')
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = new URLSearchParams(sp.toString())
    if (e.target.value) {
      next.set(name, e.target.value)
    } else {
      next.delete(name)
    }
    next.delete('page')
    router.push(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <input
      type="date"
      name={name}
      defaultValue={value}
      onChange={handleChange}
      className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    />
  )
}

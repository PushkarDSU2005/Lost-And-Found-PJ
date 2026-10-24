'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
import { CATEGORY_META, type ItemCategory } from '@/lib/types'

interface Chip {
  label: string
  removeKey: string | string[]
}

function removeKeys(sp: URLSearchParams, keys: string | string[]): string {
  const next = new URLSearchParams(sp.toString())
  const arr = Array.isArray(keys) ? keys : [keys]
  arr.forEach((k) => next.delete(k))
  next.delete('page')
  return next.toString()
}

export function ActiveFilters() {
  const pathname = usePathname()
  const sp = useSearchParams()

  const chips: Chip[] = []

  const q = sp.get('q')
  if (q) chips.push({ label: `"${q}"`, removeKey: 'q' })

  const type = sp.get('type')
  if (type) chips.push({ label: type === 'lost' ? '🔴 Lost' : '🟢 Found', removeKey: 'type' })

  const category = sp.get('category') as ItemCategory | null
  if (category && CATEGORY_META[category]) {
    chips.push({ label: CATEGORY_META[category].label, removeKey: 'category' })
  }

  const status = sp.get('status')
  if (status && status !== 'open') {
    chips.push({ label: `Status: ${status}`, removeKey: 'status' })
  }

  const dateFrom = sp.get('date_from')
  const dateTo = sp.get('date_to')
  if (dateFrom || dateTo) {
    const label = dateFrom && dateTo
      ? `${dateFrom} – ${dateTo}`
      : dateFrom ? `From ${dateFrom}` : `Until ${dateTo}`
    chips.push({ label, removeKey: ['date_from', 'date_to'] })
  }

  if (chips.length === 0) return null

  return (
    <div
      aria-label="Active filters"
      className="flex flex-wrap items-center gap-1.5"
    >
      <span className="text-xs text-muted-foreground">Filters:</span>
      {chips.map((chip) => (
        <Link
          key={Array.isArray(chip.removeKey) ? chip.removeKey.join(',') : chip.removeKey}
          href={`${pathname}?${removeKeys(sp, chip.removeKey)}`}
          aria-label={`Remove filter: ${chip.label}`}
          scroll={false}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-foreground hover:bg-accent transition-colors"
        >
          {chip.label}
          <X className="size-2.5 text-muted-foreground" aria-hidden="true" />
        </Link>
      ))}
      <Link
        href={pathname}
        scroll={false}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        aria-label="Clear all filters"
      >
        Clear all
      </Link>
    </div>
  )
}

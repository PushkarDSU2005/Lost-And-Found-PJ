'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 350

interface SearchInputProps {
  /** Initial value from URL search params */
  defaultValue?: string
  className?: string
}

export function SearchInput({ defaultValue = '', className }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Push the new query to the URL, resetting to page 1
  const pushQuery = useCallback(
    (q: string) => {
      const sp = new URLSearchParams(searchParams.toString())
      if (q.trim()) {
        sp.set('q', q.trim())
      } else {
        sp.delete('q')
      }
      sp.delete('page') // reset pagination on new search
      router.push(`${pathname}?${sp.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => pushQuery(v), DEBOUNCE_MS)
  }

  const handleClear = () => {
    setValue('')
    pushQuery('')
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Handle browser back/forward — sync value from URL
  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div
      className={cn(
        'relative flex items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Search
        className="absolute left-3 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <label htmlFor="browse-search" className="sr-only">
        Search items
      </label>
      <input
        id="browse-search"
        type="search"
        autoComplete="off"
        placeholder="Search by item name or description…"
        value={value}
        onChange={handleChange}
        className="w-full bg-transparent py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        aria-label="Search items"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

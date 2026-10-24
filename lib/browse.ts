/**
 * Browse query builder.
 *
 * Pure function: takes URL search-params, returns a configured Supabase
 * query. Keeping the logic here (not inside the page component) means it
 * can be unit-tested without spinning up Next.js.
 *
 * Select shape must match what ItemCard needs:
 *   item.location?.name, item.location_text, item.images[0], item.date_occurred
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ItemCategory, ItemReportType, ItemStatus } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 12
export const CACHE_TTL_MS = 30 * 1000 // 30 seconds for browse results

export const BROWSE_SELECT = `
  id, title, report_type, status, category,
  description, location_id, location_text, date_occurred, created_at, is_sensitive,
  location:locations!items_location_id_fkey(id, name),
  images:item_images(storage_path, sort_order, bucket)
`.trim()

// ─── Simple in-memory cache ───────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const browseCache = new Map<string, CacheEntry<unknown>>()

export function getCachedBrowseResult<T>(key: string): T | null {
  const entry = browseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    browseCache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCachedBrowseResult<T>(key: string, data: T): void {
  browseCache.set(key, { data, timestamp: Date.now() })
}

export function makeBrowseCacheKey(params: NormalisedBrowseParams): string {
  return JSON.stringify({
    q: params.q,
    type: params.type,
    category: params.category,
    status: params.status,
    location_id: params.location_id,
    date_from: params.date_from,
    date_to: params.date_to,
    page: params.page,
  })
}

// ─── Param types ──────────────────────────────────────────────────────────────

export interface BrowseParams {
  q?: string                 // free-text search
  type?: ItemReportType      // 'lost' | 'found'
  category?: ItemCategory    // single category
  status?: ItemStatus        // defaults to 'open'
  location_id?: string       // filter by location UUID
  date_from?: string         // ISO date (YYYY-MM-DD)
  date_to?: string           // ISO date
  page?: string | number     // 1-indexed, default 1
}

export interface BrowseResult {
  params: NormalisedBrowseParams
  from: number
  to: number
}

export interface NormalisedBrowseParams {
  q: string
  type: ItemReportType | null
  category: ItemCategory | null
  status: ItemStatus
  location_id: string | null
  date_from: string | null
  date_to: string | null
  page: number
}

// ─── Normalise ────────────────────────────────────────────────────────────────

const VALID_TYPES = new Set<string>(['lost', 'found'])
const VALID_STATUSES = new Set<string>(['open', 'claimed', 'resolved', 'expired'])
const VALID_CATEGORIES = new Set<string>([
  'electronics', 'clothing', 'accessories', 'books_stationery',
  'keys', 'sports_fitness', 'id_documents', 'food_drink', 'other',
])
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function normaliseParams(raw: BrowseParams): NormalisedBrowseParams {
  const page = Math.max(1, Number(raw.page) || 1)
  const q = (raw.q ?? '').trim()

  return {
    q,
    type: VALID_TYPES.has(raw.type ?? '') ? (raw.type as ItemReportType) : null,
    category: VALID_CATEGORIES.has(raw.category ?? '') ? (raw.category as ItemCategory) : null,
    status: VALID_STATUSES.has(raw.status ?? '') ? (raw.status as ItemStatus) : 'open',
    location_id: raw.location_id?.match(/^[0-9a-f-]{36}$/) ? raw.location_id : null,
    date_from: raw.date_from?.match(ISO_DATE_RE) ? raw.date_from : null,
    date_to: raw.date_to?.match(ISO_DATE_RE) ? raw.date_to : null,
    page,
  }
}

// ─── Query builder ────────────────────────────────────────────────────────────

/**
 * Builds and returns a Supabase query for the browse page.
 * Call `.then()` or `await` on the returned query to execute.
 */
export function buildBrowseQuery(
  supabase: SupabaseClient,
  params: NormalisedBrowseParams,
) {
  const from = (params.page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('items')
    .select(BROWSE_SELECT, { count: 'exact' })
    .eq('status', params.status)
    .order('created_at', { ascending: false })
    .range(from, to)

  // Report type filter
  if (params.type) {
    query = query.eq('report_type', params.type)
  }

  // Category filter
  if (params.category) {
    query = query.eq('category', params.category)
  }

  // Location filter
  if (params.location_id) {
    query = query.eq('location_id', params.location_id)
  }

  // Date range filter (on date_occurred)
  if (params.date_from) {
    query = query.gte('date_occurred', params.date_from)
  }
  if (params.date_to) {
    query = query.lte('date_occurred', params.date_to)
  }

  // Text search — ILIKE on title; if short query also check description
  if (params.q) {
    const escaped = params.q.replace(/[%_\\]/g, '\\$&')
    // Use OR: title ILIKE OR description ILIKE
    query = query.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%`,
    )
  }

  return { query, from, to }
}

// ─── Count active filters ─────────────────────────────────────────────────────

/** Returns the number of non-default filters currently active (for the filter badge). */
export function countActiveFilters(params: NormalisedBrowseParams): number {
  let n = 0
  if (params.q) n++
  if (params.type) n++
  if (params.category) n++
  if (params.status !== 'open') n++
  if (params.location_id) n++
  if (params.date_from) n++
  if (params.date_to) n++
  return n
}

// ─── Build URL search string ──────────────────────────────────────────────────

/** Serialise params back to a URLSearchParams string (for links). */
export function toSearchString(params: Partial<NormalisedBrowseParams>): string {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.type) sp.set('type', params.type)
  if (params.category) sp.set('category', params.category)
  if (params.status && params.status !== 'open') sp.set('status', params.status)
  if (params.location_id) sp.set('location_id', params.location_id)
  if (params.date_from) sp.set('date_from', params.date_from)
  if (params.date_to) sp.set('date_to', params.date_to)
  if (params.page && params.page > 1) sp.set('page', String(params.page))
  return sp.toString()
}

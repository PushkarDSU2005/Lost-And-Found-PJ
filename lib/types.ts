/**
 * Shared application types derived from the database schema.
 * Keep in sync with supabase/migrations/001_extensions_enums.sql
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ItemReportType = 'lost' | 'found'

export type ItemStatus = 'open' | 'claimed' | 'resolved' | 'expired'

export type ItemCategory =
  | 'electronics'
  | 'clothing'
  | 'accessories'
  | 'books_stationery'
  | 'keys'
  | 'sports_fitness'
  | 'id_documents'
  | 'food_drink'
  | 'other'

export type UserRole = 'student' | 'staff' | 'admin'

export type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

export type NotificationChannel = 'in_app' | 'email'

// ─── Database row types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  notify_email: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  name: string
  building: string | null
  floor: string | null
  description: string | null
  drop_point: boolean
  hours: string | null
  geom: unknown | null
  created_at: string
  updated_at: string
}

export interface Item {
  id: string
  reporter_id: string
  report_type: ItemReportType
  status: ItemStatus
  category: ItemCategory
  title: string
  description: string | null
  location_id: string | null
  location_text: string | null
  date_occurred: string | null
  contact_override: string | null
  expires_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  // Added in migration 007
  is_sensitive: boolean
  held_at: string | null
  verification_question: string | null
  // Joined fields (optional, populated by queries)
  location?: Location | null
  reporter?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  images?: ItemImage[]
}

export interface ItemImage {
  id: string
  item_id: string
  storage_path: string
  bucket: 'item-images' | 'sensitive-images'
  sort_order: number
  uploaded_at: string
}

export interface Claim {
  id: string
  item_id: string
  claimant_id: string
  status: ClaimStatus
  proof_text: string | null
  proof_image_path: string | null
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  claim_id: string
  sender_id: string
  body: string
  created_at: string
  // Joined
  sender?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export interface Notification {
  id: string
  user_id: string
  channel: NotificationChannel
  event_type: string
  payload: Record<string, unknown>
  read_at: string | null
  sent_at: string | null
  created_at: string
}

// ─── UI helper types ──────────────────────────────────────────────────────────

/** Human-readable label and icon name for each category */
export const CATEGORY_META: Record<
  ItemCategory,
  { label: string; emoji: string }
> = {
  electronics:      { label: 'Electronics',       emoji: '📱' },
  clothing:         { label: 'Clothing',           emoji: '👕' },
  accessories:      { label: 'Accessories',        emoji: '👜' },
  books_stationery: { label: 'Books & Stationery', emoji: '📚' },
  keys:             { label: 'Keys',               emoji: '🔑' },
  sports_fitness:   { label: 'Sports & Fitness',   emoji: '⚽' },
  id_documents:     { label: 'ID & Documents',     emoji: '🪪' },
  food_drink:       { label: 'Food & Drink',       emoji: '🍱' },
  other:            { label: 'Other',              emoji: '📦' },
}

export const STATUS_META: Record<
  ItemStatus,
  { label: string; color: string }
> = {
  open:     { label: 'Open',     color: 'open'     },
  claimed:  { label: 'Claimed',  color: 'claimed'  },
  resolved: { label: 'Resolved', color: 'resolved' },
  expired:  { label: 'Expired',  color: 'expired'  },
}

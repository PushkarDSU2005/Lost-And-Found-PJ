/**
 * lib/items.ts
 * Server-side helpers for the item detail page.
 * Never import in Client Components.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { Item, ItemImage } from '@/lib/types'

// ─── Select string for the detail page ───────────────────────────────────────
// More complete than BROWSE_SELECT: includes reporter, held_at location,
// verification_question, contact_override, expires_at, resolved_at.
// verification_answer_hash is deliberately excluded.
export const DETAIL_SELECT = `
  id, title, report_type, status, category,
  description, location_id, location_text, date_occurred,
  contact_override, expires_at, resolved_at,
  is_sensitive, held_at, verification_question,
  created_at, updated_at,
  location:locations!items_location_id_fkey(id, name, building, floor, drop_point, hours),
  held_at_location:locations!items_held_at_fkey(id, name, building, floor, drop_point, hours),
  reporter:profiles!items_reporter_id_fkey(id, full_name, avatar_url),
  images:item_images(id, storage_path, sort_order, bucket)
`.trim()

// ─── Access levels ────────────────────────────────────────────────────────────

export type ImageAccessLevel =
  | 'full'       // owner, admin, approved claimant — real images
  | 'placeholder' // everyone else for sensitive items

export interface ViewerContext {
  userId: string | null
  isOwner: boolean
  isAdmin: boolean
  hasApprovedClaim: boolean
  imageAccess: ImageAccessLevel
}

// ─── Fetch item + compute viewer context ─────────────────────────────────────

export async function fetchItemDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<{ item: Item | null; error: string | null }> {
  const { data, error } = await supabase
    .from('items')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) {
    return { item: null, error: error?.message ?? 'Item not found' }
  }

  return { item: data as unknown as Item, error: null }
}

export async function resolveViewerContext(
  supabase: SupabaseClient,
  item: Item,
): Promise<ViewerContext> {
  // Get current user (null if anon)
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  const isOwner = !!userId && userId === item.reporter_id

  // Check admin role via profile
  let isAdmin = false
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    isAdmin = (profile as { role?: string } | null)?.role === 'admin'
  }

  // Check for approved claim
  let hasApprovedClaim = false
  if (userId && !isOwner && !isAdmin) {
    const { data: claim } = await supabase
      .from('claims')
      .select('id')
      .eq('item_id', item.id)
      .eq('claimant_id', userId)
      .eq('status', 'approved')
      .maybeSingle()
    hasApprovedClaim = !!claim
  }

  const imageAccess: ImageAccessLevel =
    !item.is_sensitive || isOwner || isAdmin || hasApprovedClaim
      ? 'full'
      : 'placeholder'

  return { userId, isOwner, isAdmin, hasApprovedClaim, imageAccess }
}

// ─── Signed URLs for sensitive images ────────────────────────────────────────

// Reduced to 5 minutes for security (CWE-613: Insufficient Session Expiration)
// Shorter TTL reduces window of exposure if URL is leaked
const SIGNED_URL_TTL = 300 // 5 minutes

/**
 * Generate signed URLs for all images on a sensitive item.
 * Uses service-role client so storage RLS doesn't block it.
 * Only call this when imageAccess === 'full'.
 */
export async function getSignedImageUrls(
  images: ItemImage[],
): Promise<Map<string, string>> {
  const sensitiveImages = images.filter((i) => i.bucket === 'sensitive-images')
  if (sensitiveImages.length === 0) return new Map()

  const service = createSupabaseServiceClient()
  const result = new Map<string, string>()

  await Promise.all(
    sensitiveImages.map(async (img) => {
      const { data, error } = await service.storage
        .from('sensitive-images')
        .createSignedUrl(img.storage_path, SIGNED_URL_TTL)
      if (!error && data?.signedUrl) {
        result.set(img.id, data.signedUrl)
      }
    }),
  )

  return result
}

/**
 * Build the display URL for an image, using signed URL if available.
 * Falls back to the public CDN URL for public bucket images.
 */
export function resolveImageUrl(
  img: ItemImage,
  signedUrls: Map<string, string>,
  supabaseUrl: string,
): string {
  if (img.bucket === 'sensitive-images') {
    return signedUrls.get(img.id) ?? '' // empty string → show placeholder
  }
  return `${supabaseUrl}/storage/v1/object/public/item-images/${img.storage_path}`
}

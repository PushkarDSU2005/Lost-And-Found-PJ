'use server'

/**
 * Admin-only server actions.
 * All actions:
 * 1. Check admin role (return 403 if not admin)
 * 2. Perform the operation
 * 3. Write to audit_log via service role
 */

import { redirect } from 'next/navigation'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ─── Shared result type ───────────────────────────────────────────────────────

export type AdminActionResult =
  | { success: true }
  | { success: false; error: string; code: string }

// ─── Helper: Check admin ──────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ userId: string } | AdminActionResult> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, code: 'UNAUTHENTICATED', error: 'You must be signed in.' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return { success: false, code: 'FORBIDDEN', error: 'Admin access required.' }
  }

  return { userId: user.id }
}

// ─── Helper: Write audit log ──────────────────────────────────────────────────

async function writeAuditLog(opts: {
  adminId: string
  action: string
  targetType: string
  targetId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const service = createSupabaseServiceClient()
    await service.from('audit_log').insert({
      admin_id:    opts.adminId,
      action:      opts.action,
      target_type: opts.targetType,
      target_id:   opts.targetId ?? null,
      metadata:    opts.metadata ?? {},
    })
  } catch (err) {
    console.error('[writeAuditLog] failed:', err)
    // Don't fail the main operation
  }
}

// ─── removeItem (soft delete → status='removed') ──────────────────────────────

const removeItemSchema = z.object({
  item_id: z.string().uuid(),
  reason:  z.string().max(500).optional(),
})

export async function removeItem(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = removeItemSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { item_id, reason } = parsed.data

  const service = createSupabaseServiceClient()

  // Load item
  const { data: item } = await service
    .from('items')
    .select('id, title, status, reporter_id')
    .eq('id', item_id)
    .single()

  if (!item) return { success: false, code: 'NOT_FOUND', error: 'Item not found.' }

  const itemRow = item as { id: string; title: string; status: string; reporter_id: string }

  // Update status to 'expired' (we'll add 'removed' to the enum in future, or use expired as proxy)
  await service.from('items').update({ status: 'expired' }).eq('id', item_id)

  // Notify reporter
  await service.from('notifications').insert({
    user_id:    itemRow.reporter_id,
    channel:    'in_app',
    event_type: 'item_removed_by_admin',
    payload:    { item_id, item_title: itemRow.title, reason: reason ?? 'Violates guidelines' },
  })

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'remove_item',
    targetType:  'item',
    targetId:    item_id,
    metadata:    { title: itemRow.title, reason, previous_status: itemRow.status },
  })

  return { success: true }
}

// ─── banUser ──────────────────────────────────────────────────────────────────

const banUserSchema = z.object({
  user_id: z.string().uuid(),
  reason:  z.string().max(500).optional(),
})

export async function banUser(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = banUserSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { user_id, reason } = parsed.data

  const service = createSupabaseServiceClient()

  // Load user
  const { data: user } = await service.from('profiles').select('id, full_name, is_banned').eq('id', user_id).single()
  if (!user) return { success: false, code: 'NOT_FOUND', error: 'User not found.' }

  const userRow = user as { id: string; full_name: string | null; is_banned: boolean }

  if (userRow.is_banned) {
    return { success: false, code: 'ALREADY_BANNED', error: 'User is already banned.' }
  }

  // Ban
  await service.from('profiles').update({ is_banned: true }).eq('id', user_id)

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'ban_user',
    targetType:  'user',
    targetId:    user_id,
    metadata:    { full_name: userRow.full_name, reason },
  })

  return { success: true }
}

// ─── unbanUser ────────────────────────────────────────────────────────────────

const unbanUserSchema = z.object({
  user_id: z.string().uuid(),
})

export async function unbanUser(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = unbanUserSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { user_id } = parsed.data

  const service = createSupabaseServiceClient()

  // Load user
  const { data: user } = await service.from('profiles').select('id, full_name, is_banned').eq('id', user_id).single()
  if (!user) return { success: false, code: 'NOT_FOUND', error: 'User not found.' }

  const userRow = user as { id: string; full_name: string | null; is_banned: boolean }

  if (!userRow.is_banned) {
    return { success: false, code: 'NOT_BANNED', error: 'User is not banned.' }
  }

  // Unban
  await service.from('profiles').update({ is_banned: false }).eq('id', user_id)

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'unban_user',
    targetType:  'user',
    targetId:    user_id,
    metadata:    { full_name: userRow.full_name },
  })

  return { success: true }
}

// ─── createLocation ───────────────────────────────────────────────────────────

const createLocationSchema = z.object({
  name:       z.string().min(1).max(200),
  building:   z.string().max(200).optional(),
  floor:      z.string().max(50).optional(),
  drop_point: z.boolean().default(false),
  hours:      z.string().max(200).optional(),
})

export async function createLocation(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = createLocationSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }
  const data = parsed.data

  const service = createSupabaseServiceClient()

  const { data: location, error } = await service.from('locations').insert(data).select('id').single()
  if (error) {
    return { success: false, code: 'DB_ERROR', error: `Failed to create location: ${error.message}` }
  }

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'create_location',
    targetType:  'location',
    targetId:    (location as { id: string }).id,
    metadata:    { name: data.name },
  })

  return { success: true }
}

// ─── updateLocation ───────────────────────────────────────────────────────────

const updateLocationSchema = z.object({
  location_id: z.string().uuid(),
  name:        z.string().min(1).max(200).optional(),
  building:    z.string().max(200).optional(),
  floor:       z.string().max(50).optional(),
  drop_point:  z.boolean().optional(),
  hours:       z.string().max(200).optional(),
})

export async function updateLocation(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = updateLocationSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { location_id, ...updates } = parsed.data

  const service = createSupabaseServiceClient()

  const { error } = await service.from('locations').update(updates).eq('id', location_id)
  if (error) {
    return { success: false, code: 'DB_ERROR', error: `Failed to update location: ${error.message}` }
  }

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'update_location',
    targetType:  'location',
    targetId:    location_id,
    metadata:    updates,
  })

  return { success: true }
}

// ─── deleteLocation ───────────────────────────────────────────────────────────

const deleteLocationSchema = z.object({
  location_id: z.string().uuid(),
})

export async function deleteLocation(rawInput: unknown): Promise<AdminActionResult> {
  const adminCheck = await requireAdmin()
  if ('success' in adminCheck) return adminCheck
  const { userId: adminId } = adminCheck

  const parsed = deleteLocationSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, code: 'VALIDATION_ERROR', error: 'Invalid input.' }
  }
  const { location_id } = parsed.data

  const service = createSupabaseServiceClient()

  const { error } = await service.from('locations').delete().eq('id', location_id)
  if (error) {
    return { success: false, code: 'DB_ERROR', error: `Failed to delete location: ${error.message}` }
  }

  // Audit log
  await writeAuditLog({
    adminId,
    action:      'delete_location',
    targetType:  'location',
    targetId:    location_id,
    metadata:    {},
  })

  return { success: true }
}

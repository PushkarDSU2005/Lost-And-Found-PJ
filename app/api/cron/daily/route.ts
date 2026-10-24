/**
 * app/api/cron/daily/route.ts
 * ============================
 * Vercel Cron endpoint triggered daily at 3 AM UTC.
 * 
 * Tasks:
 * 1. Mark items past expires_at as 'expired'
 * 2. Lightweight DB query (keep-alive for free Supabase projects)
 *
 * Security: CRON_SECRET header required (set in vercel.json)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(req: NextRequest) {
  // ── 1. Auth check ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`

  if (!authHeader || authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createSupabaseServiceClient()

  // ── 2. Expire old items ───────────────────────────────────────────────────
  const now = new Date().toISOString()
  const { data: expired, error: expireError } = await service
    .from('items')
    .update({ status: 'expired' })
    .eq('status', 'open')
    .lte('expires_at', now)
    .select('id')

  if (expireError) {
    console.error('[cron/daily] expire failed:', expireError)
    return NextResponse.json({ error: 'Expiry update failed', details: expireError.message }, { status: 500 })
  }

  const expiredCount = (expired ?? []).length

  // ── 3. Keep-alive query ───────────────────────────────────────────────────
  const { count: itemCount } = await service
    .from('items')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({
    success: true,
    expired_count: expiredCount,
    total_items:   itemCount ?? 0,
    timestamp:     now,
  })
}

/**
 * E2E: Dashboard flow — post → edit → mark returned.
 *
 * Flow:
 *   1. studentA creates a found item
 *   2. studentA edits the title via dashboard
 *   3. studentB claims it
 *   4. studentA approves
 *   5. studentA marks it as returned
 *   6. Verify status shows 'resolved'
 *
 * Requires: PLAYWRIGHT_AUTH_READY=true + dev server running.
 * Run: pnpm test:e2e -- --project=chromium tests/e2e/dashboard.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE      = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

const SEED = {
  studentA: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869',
  studentB: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4',
}

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function signInViaAPI(page: Page, email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const res = await page.request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    { headers: { apikey: anonKey, 'Content-Type': 'application/json' }, data: { email, password } },
  )
  const body = await res.json()
  if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  await page.context().addCookies([{
    name:     `sb-${projectRef}-auth-token`,
    value:    encodeURIComponent(JSON.stringify([body.access_token, body.refresh_token])),
    domain:   new URL(BASE).hostname,
    path:     '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }])
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let testItemId: string
let testClaimId: string

test.beforeAll(async () => {
  if (SKIP_AUTH) return
  const service = svc()

  const { data: item } = await service.from('items').insert({
    reporter_id: SEED.studentA,
    report_type: 'found', category: 'electronics',
    title: 'E2E dashboard test item', status: 'open',
  }).select('id').single()
  testItemId = (item as { id: string }).id
})

test.afterAll(async () => {
  if (!testItemId) return
  await svc().from('items').delete().eq('id', testItemId) // cascades to claims
})

// ─── Dashboard anon ───────────────────────────────────────────────────────────

test.describe('Dashboard — anon', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`)
    await expect(page).toHaveURL(/login|auth/, { timeout: 8000 })
  })
})

// ─── Dashboard flow ───────────────────────────────────────────────────────────

test.describe('Dashboard flow (post → edit → approve → mark returned)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('studentA can access dashboard and see their post', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/dashboard?tab=posts`)
    await expect(page.getByTestId('my-posts-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/E2E dashboard test item/i)).toBeVisible()
  })

  test('studentA edits the item title', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/dashboard?tab=posts`)
    await expect(page.getByTestId('edit-item-button').first()).toBeVisible({ timeout: 10000 })
    await page.getByTestId('edit-item-button').first().click()

    await expect(page.getByTestId('edit-title')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('edit-title').fill('E2E dashboard EDITED item')
    await page.getByTestId('save-edit').click()

    // Should redirect to item page
    await expect(page).toHaveURL(/\/items\/.*edited=1/, { timeout: 8000 })
    await expect(page.getByTestId('item-title')).toContainText(/EDITED/)
  })

  test('studentB claims the item', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${testItemId}`)
    await expect(page.getByTestId('claim-item-button')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('claim-item-button').click()

    await expect(page.getByTestId('proof-text')).toBeVisible({ timeout: 5000 })
    await page.getByTestId('proof-text').fill('This is mine, I can prove it.')
    await page.getByTestId('submit-claim').click()

    // Should redirect back to item
    await expect(page).toHaveURL(/claimed=1/, { timeout: 8000 })
  })

  test('studentA approves the claim', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${testItemId}/claims`)
    await expect(page.getByTestId('approve-claim').first()).toBeVisible({ timeout: 10000 })
    await page.getByTestId('approve-claim').first().click()

    // Should see approved status
    await expect(page.getByText(/approved/i)).toBeVisible({ timeout: 8000 })
  })

  test('studentA marks item as returned', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${testItemId}/claims`)
    await expect(page.getByTestId('mark-returned-button')).toBeVisible({ timeout: 10000 })
    await page.getByTestId('mark-returned-button').click()

    // Should redirect to item page with returned=1
    await expect(page).toHaveURL(/returned=1/, { timeout: 8000 })

    // Verify status is now 'resolved'
    await page.goto(`${BASE}/items/${testItemId}`)
    await expect(page.getByText(/resolved/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─── Dashboard tabs ───────────────────────────────────────────────────────────

test.describe('Dashboard tabs', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('can switch between tabs', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/dashboard`)

    // Default: posts tab
    await expect(page.getByTestId('tab-posts')).toHaveAttribute('aria-selected', 'true', { timeout: 10000 })
    await expect(page.getByTestId('panel-posts')).toBeVisible()

    // Switch to claims
    await page.getByTestId('tab-claims').click()
    await expect(page.getByTestId('panel-claims')).toBeVisible({ timeout: 5000 })

    // Switch to incoming
    await page.getByTestId('tab-incoming').click()
    await expect(page.getByTestId('panel-incoming')).toBeVisible({ timeout: 5000 })
  })
})

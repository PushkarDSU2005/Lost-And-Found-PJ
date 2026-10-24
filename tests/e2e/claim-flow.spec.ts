/**
 * E2E: Full claim flow with two users.
 *
 * studentA = item reporter (avikjaiswal01@gmail.com)
 * studentB = claimant      (myoneplus373@gmail.com)
 *
 * Flow: studentB submits claim → studentA approves → studentA marks returned.
 *
 * Requires: PLAYWRIGHT_AUTH_READY=true + dev server running.
 *
 * Run:
 *   pnpm test:e2e -- --project=chromium tests/e2e/claim-flow.spec.ts
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE      = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

// ─── Stable seed item ─────────────────────────────────────────────────────────
// We use a fresh item per run to avoid state pollution between test runs.
let claimTestItemId: string

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

// ─── Setup/teardown ───────────────────────────────────────────────────────────

test.beforeAll(async () => {
  if (SKIP_AUTH) return
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  const studentAId = 'b53e7d59-ab87-4014-8fe5-6dd11b55f869'
  const { data } = await service.from('items').insert({
    reporter_id: studentAId,
    report_type: 'found',
    category: 'other',
    title: 'E2E claim-flow test item',
    description: 'This item is created by the Playwright claim-flow test.',
    status: 'open',
    is_sensitive: false,
  }).select('id').single()
  claimTestItemId = (data as { id: string }).id
})

test.afterAll(async () => {
  if (!claimTestItemId) return
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  await service.from('items').delete().eq('id', claimTestItemId)
})

// ─── Anon: claim page redirects to login ─────────────────────────────────────

test.describe('Claim page — anon', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Use stable seed item for anon test (no auth needed for setup)
    await page.goto(`${BASE}/items/20000000-0000-0000-0000-000000000001/claim`)
    // Should redirect to login (exact URL depends on auth setup)
    await expect(page).toHaveURL(/login|auth/, { timeout: 8000 })
  })
})

// ─── Claim form — studentB ────────────────────────────────────────────────────

test.describe('Claim form (studentB)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('claim form renders for open item', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claim`)
    await expect(page.getByTestId('claim-form')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('proof-text')).toBeVisible()
    await expect(page.getByTestId('submit-claim')).toBeVisible()
  })

  test('shows error when proof text is empty', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claim`)
    await page.getByTestId('submit-claim').click()
    await expect(page.getByText(/prove ownership/i)).toBeVisible({ timeout: 5000 })
  })

  test('successful submission redirects to item page', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claim`)

    await page.getByTestId('proof-text').fill(
      'I can identify the item by the serial number on the back.',
    )
    await page.getByTestId('submit-claim').click()

    // Should redirect to item page with claimed=1 param
    await page.waitForURL(new RegExp(`/items/${claimTestItemId}`), { timeout: 10000 })
    expect(page.url()).toContain(`/items/${claimTestItemId}`)
  })

  test('duplicate claim shows error on re-submit', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claim`)

    await page.getByTestId('proof-text').fill('Trying again')
    await page.getByTestId('submit-claim').click()

    // Should see an error about duplicate
    await expect(page.getByTestId('claim-error')).toBeVisible({ timeout: 8000 })
  })
})

// ─── Owner (studentA) reviews claims ─────────────────────────────────────────

test.describe('Claims review (studentA)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('owner can see the claims list', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claims`)

    await expect(page.getByTestId('claims-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('claim-card')).toBeVisible()
  })

  test('owner sees approve and reject buttons on pending claim', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claims`)

    await expect(page.getByTestId('approve-claim')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('reject-claim')).toBeVisible()
  })

  test('owner approves claim → item becomes claimed → mark returned visible', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claims`)

    // Approve
    await page.getByTestId('approve-claim').first().click()

    // Page reloads with reviewed=1 param
    await page.waitForURL(/reviewed=1/, { timeout: 10000 })

    // Claim card should now show 'approved'
    const card = page.getByTestId('claim-card').first()
    await expect(card).toContainText(/approved/i)

    // Mark-returned button should appear (item is now 'claimed')
    await expect(page.getByTestId('mark-returned')).toBeVisible()
  })

  test('owner marks item as returned → resolves', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/items/${claimTestItemId}/claims?reviewed=1`)

    await expect(page.getByTestId('mark-returned')).toBeVisible({ timeout: 8000 })
    await page.getByTestId('mark-returned').click()

    // Redirects with returned=1
    await page.waitForURL(/returned=1/, { timeout: 10000 })
    await expect(page.getByRole('status', { name: /returned/i })).toBeVisible()
  })
})

// ─── Non-owner cannot access claims list ─────────────────────────────────────

test.describe('Claims list access control', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('studentB cannot see studentA claims list', async ({ page }) => {
    // testItemId reporter = studentA; studentB should be denied
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/20000000-0000-0000-0000-000000000001/claims`)

    await expect(
      page.getByText(/don't have permission/i).or(page.getByText(/not have permission/i)),
    ).toBeVisible({ timeout: 8000 })
  })
})

// ─── Mobile 390px ─────────────────────────────────────────────────────────────

test.describe('Claim flow — mobile (390px)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')
  test.use({ viewport: { width: 390, height: 844 } })

  test('claim form is usable at 390px', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    // Use the stable seed item for this read-only check
    await page.goto(`${BASE}/items/20000000-0000-0000-0000-000000000001/claim`)

    const body = await page.evaluate(() => document.body.scrollWidth)
    expect(body).toBeLessThanOrEqual(392)

    const submitBtn = page.getByTestId('submit-claim')
    await expect(submitBtn).toBeVisible()
    const box = await submitBtn.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
  })
})

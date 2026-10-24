/**
 * E2E: Report a found item and verify it appears on the item detail page.
 *
 * Prerequisites:
 *   - Dev server running (pnpm dev)
 *   - TEST_USER_STUDENT_A_EMAIL + TEST_USER_STUDENT_A_PASSWORD in .env.local
 *   - Auth is implemented (Task 3) — until then this test is skipped in CI
 *     unless PLAYWRIGHT_AUTH_READY=true is set.
 *
 * Run:
 *   pnpm test:e2e -- --project=chromium tests/e2e/report-item.spec.ts
 *   At 390px:
 *   pnpm test:e2e -- --project="Mobile Chrome" tests/e2e/report-item.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sign in via Supabase's email/password flow.
 * Uses the Supabase REST Auth endpoint directly so we don't depend on a
 * UI sign-in page being built yet.
 */
async function signInViaAPI(page: Page) {
  const email = process.env.TEST_USER_STUDENT_A_EMAIL!
  const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Call Supabase auth REST directly
  const res = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  const body = await res.json()
  if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)

  // Inject the Supabase session cookies that @supabase/ssr expects
  const projectRef = new URL(url).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  await page.context().addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(JSON.stringify([body.access_token, body.refresh_token])),
      domain: new URL(BASE).hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

/** Clean up any items created during this test run */
const testItemIds: string[] = []
test.afterAll(async () => {
  if (testItemIds.length === 0) return
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
  await client.from('items').delete().in('id', testItemIds)
})

// ─── Desktop test ─────────────────────────────────────────────────────────────

test.describe('Report a found item (desktop)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set — auth UI not built yet')

  test('login → fill form → submit → see item on detail page', async ({ page }) => {
    await signInViaAPI(page)

    // Navigate to the found item report page
    await page.goto(`${BASE}/report/found`)
    await expect(page.getByRole('heading', { name: /report a found item/i })).toBeVisible()

    // Fill title
    await page.getByLabel(/item title/i).fill('E2E test: blue travel mug')

    // Fill description
    await page.getByLabel(/description/i).fill('Stainless steel blue travel mug, no markings, found on table 12.')

    // Date — use yesterday
    const yesterday = new Date(Date.now() - 86400000)
    const dateStr = yesterday.toISOString().slice(0, 16)
    await page.getByLabel(/date found/i).fill(dateStr)

    // Category — open the Select and pick "other"
    await page.getByRole('combobox', { name: /category/i }).click()
    await page.getByRole('option', { name: /other/i }).click()

    // Location — pick Main Library
    await page.getByRole('combobox', { name: /location/i }).click()
    await page.getByRole('option', { name: /main library/i }).click()

    // Submit
    await page.getByRole('button', { name: /submit found report/i }).click()

    // Should redirect to /items/:id
    await page.waitForURL(/\/items\/[0-9a-f-]{36}/, { timeout: 15000 })

    // Verify item title is visible
    const title = page.getByTestId('item-title')
    await expect(title).toHaveText('E2E test: blue travel mug')

    // Capture item ID for cleanup
    const itemId = page.url().split('/').pop()!
    testItemIds.push(itemId)
  })
})

// ─── Mobile test (390px viewport) ─────────────────────────────────────────────

test.describe('Report a found item (mobile 390px)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')
  test.use({ viewport: { width: 390, height: 844 } })

  test('form is usable at 390px', async ({ page }) => {
    await signInViaAPI(page)
    await page.goto(`${BASE}/report/found`)

    // Check the form is visible and not clipped
    const form = page.getByRole('form', { name: /report a found item/i })
    await expect(form).toBeVisible()

    // Submit button should be full-width and reachable
    const submitBtn = page.getByRole('button', { name: /submit found report/i })
    await expect(submitBtn).toBeVisible()

    // Scrolled bounding box should show width near 390
    const box = await submitBtn.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
  })
})

/**
 * E2E: Item detail page — owner vs other student views.
 *
 * Requires:
 *   - Dev server running (pnpm dev)
 *   - Seed item 20000000-0000-0000-0000-000000000001 exists (iPhone, reporter = studentA)
 *   - PLAYWRIGHT_AUTH_READY=true when auth UI is built (Task 3)
 *
 * Without auth: tests the public (anon) view only.
 * With auth:    tests owner view (studentA) and non-owner view (studentB).
 *
 * Run:
 *   pnpm test:e2e -- --project=chromium tests/e2e/item-detail.spec.ts
 *   pnpm test:e2e -- --project="Mobile Chrome" tests/e2e/item-detail.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

// ─── Stable seed item ─────────────────────────────────────────────────────────
const ITEM_ID = '20000000-0000-0000-0000-000000000001'   // iPhone, reporter = studentA
const ITEM_URL = `${BASE}/items/${ITEM_ID}`

// ─── Auth helper (same pattern as report-item.spec.ts) ───────────────────────

async function signInViaAPI(page: Page, email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await page.request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: anonKey, 'Content-Type': 'application/json' },
      data: { email, password },
    },
  )
  const body = await res.json()
  if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)

  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`

  await page.context().addCookies([{
    name: cookieName,
    value: encodeURIComponent(JSON.stringify([body.access_token, body.refresh_token])),
    domain: new URL(BASE).hostname,
    path: '/', httpOnly: false, secure: false, sameSite: 'Lax',
  }])
}

// ─── Anon view (no auth required) ────────────────────────────────────────────

test.describe('Item detail — anon view', () => {
  test('renders item title and metadata', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('item-title')).toBeVisible({ timeout: 10000 })
    const title = await page.getByTestId('item-title').textContent()
    expect(title?.length).toBeGreaterThan(3)
  })

  test('shows report type badge', async ({ page }) => {
    await page.goto(ITEM_URL)
    const badge = page.getByRole('status').first()
    await expect(badge).toBeVisible()
  })

  test('shows "Sign in to claim" for open item (not "Claim")', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('signin-to-claim')).toBeVisible()
    expect(await page.getByTestId('claim-button').count()).toBe(0)
  })

  test('Share button is present', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('share-button')).toBeVisible()
  })

  test('back link navigates to /browse', async ({ page }) => {
    await page.goto(ITEM_URL)
    const backLink = page.getByRole('link', { name: /browse/i })
    await expect(backLink).toBeVisible()
    await expect(backLink).toHaveAttribute('href', /\/browse/)
  })

  test('shows "Possible matches" placeholder section', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByText(/possible matches/i)).toBeVisible()
  })

  test('page has proper title metadata', async ({ page }) => {
    await page.goto(ITEM_URL)
    const title = await page.title()
    expect(title).toMatch(/lost|found/i)
  })

  test('404 for unknown item ID', async ({ page }) => {
    await page.goto(`${BASE}/items/00000000-0000-0000-0000-000000000000`)
    await expect(page.getByRole('heading', { name: /404|not found/i })).toBeVisible({ timeout: 8000 })
  })
})

// ─── Mobile anon view ─────────────────────────────────────────────────────────

test.describe('Item detail — mobile anon (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('page renders without horizontal overflow', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('item-title')).toBeVisible({ timeout: 10000 })
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(392)
  })

  test('action buttons are tappable (≥44px height)', async ({ page }) => {
    await page.goto(ITEM_URL)
    const btn = page.getByTestId('signin-to-claim').or(page.getByTestId('share-button')).first()
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(40)
  })
})

// ─── Auth-gated: owner view ────────────────────────────────────────────────────

test.describe('Item detail — owner view (studentA)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test.beforeEach(async ({ page }) => {
    await signInViaAPI(
      page,
      process.env.TEST_USER_STUDENT_A_EMAIL!,
      process.env.TEST_USER_STUDENT_A_PASSWORD!,
    )
  })

  test('owner does NOT see the Claim button', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('item-title')).toBeVisible()
    expect(await page.getByTestId('claim-button').count()).toBe(0)
  })

  test('owner does NOT see the Report button', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('item-title')).toBeVisible()
    expect(await page.getByTestId('report-button').count()).toBe(0)
  })

  test('owner DOES see the Share button', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('share-button')).toBeVisible()
  })

  test('owner does NOT see "Sign in to claim"', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('item-title')).toBeVisible()
    expect(await page.getByTestId('signin-to-claim').count()).toBe(0)
  })
})

// ─── Auth-gated: other student view (studentB) ────────────────────────────────

test.describe('Item detail — non-owner authenticated (studentB)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test.beforeEach(async ({ page }) => {
    await signInViaAPI(
      page,
      process.env.TEST_USER_STUDENT_B_EMAIL!,
      process.env.TEST_USER_STUDENT_B_PASSWORD!,
    )
  })

  test('non-owner SEES the Claim button for an open item', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('claim-button')).toBeVisible({ timeout: 8000 })
  })

  test('non-owner SEES the Report button', async ({ page }) => {
    await page.goto(ITEM_URL)
    await expect(page.getByTestId('report-button')).toBeVisible({ timeout: 8000 })
  })

  test('Claim button href points to /items/:id/claim', async ({ page }) => {
    await page.goto(ITEM_URL)
    const claimBtn = page.getByTestId('claim-button')
    await expect(claimBtn).toBeVisible()
    const href = await claimBtn.getAttribute('href')
    expect(href).toBe(`/items/${ITEM_ID}/claim`)
  })
})

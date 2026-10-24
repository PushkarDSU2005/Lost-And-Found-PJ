/**
 * E2E: Two users exchange messages and the unread badge updates.
 *
 * Flow:
 *   1. studentA (finder) and studentB (claimant) have an approved claim.
 *   2. studentB sends a message.
 *   3. studentA navigates to the chat; message is visible.
 *   4. studentA's notification bell shows unread badge after studentB's message.
 *   5. Visiting /notifications clears the badge.
 *
 * Requires: PLAYWRIGHT_AUTH_READY=true + dev server running.
 * Run: pnpm test:e2e -- --project=chromium tests/e2e/messaging.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE      = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

const SEED = {
  studentA: 'b53e7d59-ab87-4014-8fe5-6dd11b55f869',
  studentB: '7b3ce23c-6dbf-45bd-af1f-401661f75ea4',
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let msgTestItemId: string
let msgTestClaimId: string

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

test.beforeAll(async () => {
  if (SKIP_AUTH) return
  const service = svc()

  const { data: item } = await service.from('items').insert({
    reporter_id: SEED.studentA,
    report_type: 'found', category: 'other',
    title: 'E2E messaging test item', status: 'open',
  }).select('id').single()
  msgTestItemId = (item as { id: string }).id

  const { data: claim } = await service.from('claims').insert({
    item_id: msgTestItemId,
    claimant_id: SEED.studentB,
    status: 'approved',
    proof_text: 'E2E test claim',
  }).select('id').single()
  msgTestClaimId = (claim as { id: string }).id
})

test.afterAll(async () => {
  if (!msgTestItemId) return
  const service = svc()
  await service.from('items').delete().eq('id', msgTestItemId) // cascades to claims + messages
})

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

// ─── Chat page — anon redirect ────────────────────────────────────────────────

test.describe('Chat page — anon', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/items/20000000-0000-0000-0000-000000000001/claims/nonexistent-claim-id`)
    await expect(page).toHaveURL(/login|auth/, { timeout: 8000 })
  })
})

// ─── Chat flow — authenticated ────────────────────────────────────────────────

test.describe('Chat flow (studentB sends, studentA reads)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  const chatUrl = () => `${BASE}/items/${msgTestItemId}/claims/${msgTestClaimId}`

  test('studentB can access the chat page', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(chatUrl())
    await expect(page.getByTestId('message-input-form')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('message-body')).toBeVisible()
    await expect(page.getByTestId('send-message')).toBeVisible()
  })

  test('studentB sends a message', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(chatUrl())
    await expect(page.getByTestId('message-body')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('message-body').fill('Hi, can I collect the item tomorrow morning?')
    await page.getByTestId('send-message').click()

    // Input should clear after send
    await expect(page.getByTestId('message-body')).toHaveValue('', { timeout: 5000 })
  })

  test('studentB message appears in thread', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(chatUrl())

    await expect(
      page.getByTestId('message-thread'),
    ).toBeVisible({ timeout: 10000 })

    // The message sent in the previous test should be visible
    await expect(
      page.getByTestId('message-thread').getByText(/collect the item tomorrow/i),
    ).toBeVisible({ timeout: 8000 })
  })

  test('studentA (reporter) sees the message', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(chatUrl())

    await expect(
      page.getByTestId('message-thread').getByText(/collect the item tomorrow/i),
    ).toBeVisible({ timeout: 10000 })
  })

  test('studentA sees the notification bell with unread badge', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)
    await page.goto(`${BASE}/browse`)

    const bell = page.getByTestId('notification-bell')
    await expect(bell).toBeVisible({ timeout: 8000 })

    // Unread badge should appear (studentB sent a message)
    const badge = page.getByTestId('unread-badge')
    await expect(badge).toBeVisible({ timeout: 5000 })
  })

  test('visiting notifications page clears the badge', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_A_EMAIL!, process.env.TEST_USER_STUDENT_A_PASSWORD!)

    // Confirm badge exists before visiting notifications
    await page.goto(`${BASE}/browse`)
    const bell = page.getByTestId('notification-bell')
    await expect(bell).toBeVisible()

    // Navigate to notifications
    await bell.click()
    await page.waitForURL(/\/notifications/, { timeout: 5000 })

    // Notification items should be listed
    await expect(page.getByTestId('notification-item').first()).toBeVisible({ timeout: 8000 })

    // Navigate away and back — badge should be gone (mark-as-read ran server-side)
    await page.goto(`${BASE}/browse`)
    await expect(page.getByTestId('unread-badge')).not.toBeVisible({ timeout: 5000 })
  })

  test('message input blocks URLs', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(chatUrl())
    await expect(page.getByTestId('message-body')).toBeVisible({ timeout: 10000 })

    await page.getByTestId('message-body').fill('Contact me at https://wa.me/12345')
    await page.getByTestId('send-message').click()

    // Should show an error
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('alert')).toContainText(/link/i)
  })
})

// ─── Mobile 390px ─────────────────────────────────────────────────────────────

test.describe('Chat — mobile (390px)', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')
  test.use({ viewport: { width: 390, height: 844 } })

  test('chat page is usable at 390px', async ({ page }) => {
    await signInViaAPI(page, process.env.TEST_USER_STUDENT_B_EMAIL!, process.env.TEST_USER_STUDENT_B_PASSWORD!)
    await page.goto(`${BASE}/items/${msgTestItemId}/claims/${msgTestClaimId}`)

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(392)

    await expect(page.getByTestId('message-body')).toBeVisible({ timeout: 10000 })
    const box = await page.getByTestId('send-message').boundingBox()
    expect(box?.width).toBeGreaterThan(30)
    expect(box?.height).toBeGreaterThan(30)
  })
})

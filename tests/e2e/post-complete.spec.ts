/**
 * E2E Tests: Complete POST Flow (POST-01 through POST-05)
 * 
 * Tests all item posting requirements:
 * - POST-01: Post lost item
 * - POST-02: Post found item with verification question
 * - POST-03: Validation errors
 * - POST-04: Rate limiting (6th post in 24h)
 * - POST-05: Banned/guest cannot post
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function signInViaAPI(page: Page, email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  
  const body = await res.json()
  if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)

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

// ─── POST-01: Post lost item ──────────────────────────────────────────────────

test.describe('POST-01: Post lost item', () => {
  test('can post a lost item with all fields', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/lost`)

    // Fill form
    await page.getByLabel(/item title/i).fill('POST-01: Lost black backpack')
    await page.getByLabel(/description/i).fill('Nike black backpack with laptop inside')
    
    // Date
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 16)
    await page.getByLabel(/date lost/i).fill(yesterday)

    // Category
    await page.getByRole('combobox', { name: /category/i }).click()
    await page.getByRole('option', { name: /accessories/i }).click()

    // Location
    await page.getByRole('combobox', { name: /location/i }).click()
    const firstOption = page.getByRole('option').first()
    await firstOption.click()

    // Submit
    await page.getByRole('button', { name: /submit lost report/i }).click()
    await page.waitForURL(/\/items\/[0-9a-f-]{36}/, { timeout: 15000 })

    // Verify item appears
    await expect(page.getByText('POST-01: Lost black backpack')).toBeVisible()
    
    const itemId = page.url().split('/').pop()!
    testItemIds.push(itemId)
  })
})

// ─── POST-02: Post found with verification question ───────────────────────────

test.describe('POST-02: Post found with verification question', () => {
  test('can post found item with verification Q&A', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/found`)

    // Fill basic fields
    await page.getByLabel(/item title/i).fill('POST-02: Found iPhone with case')
    await page.getByLabel(/description/i).fill('iPhone 14 Pro in blue silicone case')
    
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 16)
    await page.getByLabel(/date found/i).fill(yesterday)

    // Category
    await page.getByRole('combobox', { name: /category/i }).click()
    await page.getByRole('option', { name: /electronics/i }).click()

    // Location
    await page.getByRole('combobox', { name: /location/i }).click()
    const firstOption = page.getByRole('option').first()
    await firstOption.click()

    // Verification question
    await page.getByLabel(/verification question/i).fill('What color is the case?')
    
    // Verification answer should appear
    await expect(page.getByLabel(/^answer/i)).toBeVisible()
    await page.getByLabel(/^answer/i).fill('Blue')

    // Submit
    await page.getByRole('button', { name: /submit found report/i }).click()
    await page.waitForURL(/\/items\/[0-9a-f-]{36}/, { timeout: 15000 })

    await expect(page.getByText('POST-02: Found iPhone with case')).toBeVisible()
    
    const itemId = page.url().split('/').pop()!
    testItemIds.push(itemId)
  })
})

// ─── POST-03: Validation errors ───────────────────────────────────────────────

test.describe('POST-03: Validation errors', () => {
  test('shows error for missing required fields', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/lost`)

    // Try to submit empty form
    await page.getByRole('button', { name: /submit lost report/i }).click()

    // Should show validation errors (form should not submit)
    await expect(page).toHaveURL(`${BASE}/report/lost`)
    
    // Check for error messages (form validation)
    await expect(page.getByText(/title must be at least/i).or(page.getByText(/please select a category/i))).toBeVisible({ timeout: 2000 })
  })

  test('shows error for title too short', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/lost`)

    // Title too short (min 3 chars)
    await page.getByLabel(/item title/i).fill('AB')
    await page.getByLabel(/item title/i).blur()

    // Should show validation error
    await expect(page.getByText(/title must be at least 3 characters/i)).toBeVisible({ timeout: 2000 })
  })

  test('requires verification answer when question is provided', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/found`)

    await page.getByLabel(/item title/i).fill('POST-03: Test validation')
    
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 16)
    await page.getByLabel(/date found/i).fill(yesterday)

    await page.getByRole('combobox', { name: /category/i }).click()
    await page.getByRole('option', { name: /other/i }).click()

    await page.getByRole('combobox', { name: /location/i }).click()
    const firstOption = page.getByRole('option').first()
    await firstOption.click()

    // Add verification question but no answer
    await page.getByLabel(/verification question/i).fill('What brand is it?')
    
    // Answer field should be required now
    await expect(page.getByLabel(/^answer/i)).toBeVisible()
    
    // Try to submit without answer
    await page.getByRole('button', { name: /submit found report/i }).click()
    
    // Should show validation error
    await expect(page.getByText(/please provide the answer/i)).toBeVisible({ timeout: 2000 })
  })
})

// ─── POST-04: Rate limiting ───────────────────────────────────────────────────

test.describe('POST-04: Rate limiting (6 posts in 24h)', () => {
  test.skip('enforces 6 posts per 24h limit', async ({ page }) => {
    // This test requires creating 6 items rapidly
    // Skipped to avoid test data pollution
    // Rate limiting is tested via unit tests on checkIPRateLimit()
    
    // Implementation outline:
    // 1. Create 6 items in a loop
    // 2. 7th attempt should fail with rate limit error
    // 3. Clean up all 6 test items
  })
})

// ─── POST-05: Banned/guest cannot post ────────────────────────────────────────

test.describe('POST-05: Banned/guest cannot post', () => {
  test('guest redirected to login', async ({ page }) => {
    // Visit report page without auth
    await page.goto(`${BASE}/report/lost`)
    
    // Should redirect to login
    await page.waitForURL(/\/login\?next=/, { timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test.skip('banned user cannot post', async ({ page }) => {
    // This requires a banned user account
    // Skipped — ban functionality tested in admin tests
    
    // Implementation outline:
    // 1. Sign in with banned user
    // 2. Try to post item
    // 3. Should show "Your account has been suspended" error
  })
})

// ─── Additional: Sensitive item detection ─────────────────────────────────────

test.describe('Sensitive keyword detection', () => {
  test('detects "ID card" and shows sensitive prompt', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/found`)

    // Type title with sensitive keyword
    await page.getByLabel(/item title/i).fill('Found student ID card')
    await page.getByLabel(/item title/i).blur()

    // Should show sensitive item prompt
    await expect(page.getByText(/does this item contain personal documents/i)).toBeVisible({ timeout: 2000 })
    
    // Click "Yes, mark as sensitive"
    await page.getByRole('button', { name: /yes, mark as sensitive/i }).click()
    
    // Checkbox should be checked
    await expect(page.getByRole('checkbox', { name: /contains personal documents/i })).toBeChecked()
  })
})

// ─── Additional: Location "other" free-text ───────────────────────────────────

test.describe('Location other/free-text', () => {
  test('shows free-text field when "other" selected', async ({ page }) => {
    const email = process.env.TEST_USER_STUDENT_A_EMAIL!
    const password = process.env.TEST_USER_STUDENT_A_PASSWORD!
    
    await signInViaAPI(page, email, password)
    await page.goto(`${BASE}/report/lost`)

    // Select "other" location
    await page.getByRole('combobox', { name: /location/i }).click()
    await page.getByRole('option', { name: /other/i }).click()

    // Free-text field should appear
    await expect(page.getByLabel(/describe the location/i)).toBeVisible()
    
    // Fill it
    await page.getByLabel(/describe the location/i).fill('Near the water fountain, 2nd floor')
  })
})

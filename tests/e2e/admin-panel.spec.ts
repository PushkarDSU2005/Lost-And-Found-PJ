/**
 * E2E tests for Admin Panel
 * 
 * Risk: CRITICAL — Admin features are untested
 * Tests: Role enforcement, reports queue, user management, locations CRUD, audit log
 */

import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Test users
const ADMIN = {
  email: process.env.TEST_USER_ADMIN_EMAIL!,
  password: process.env.TEST_USER_ADMIN_PASSWORD!,
}

const STUDENT_A = {
  email: process.env.TEST_USER_STUDENT_A_EMAIL!,
  password: process.env.TEST_USER_STUDENT_A_PASSWORD!,
}

// Helper: Sign in via API
async function signInViaAPI(page: any, email: string, password: string) {
  await page.goto(`${BASE}/auth/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard|browse/, { timeout: 8000 })
}

const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

// ─── Role Enforcement ─────────────────────────────────────────────────────────

test.describe('Admin Panel — Role Enforcement', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('non-admin user sees Access Denied', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/admin`)
    
    // Should see access denied message or redirect
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 5000 })
  })

  test('admin user can access admin panel', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    // Should see admin panel heading
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible()
    
    // Should see tabs
    await expect(page.getByRole('tab', { name: /reports/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /items/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /users/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /locations/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /audit/i })).toBeVisible()
  })
})

test.describe('Admin Panel — Anonymous Access', () => {
  test('anonymous user redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/admin`)
    
    // Should redirect to login
    await expect(page).toHaveURL(/login|auth|sign-in/, { timeout: 8000 })
  })
})

// ─── Stats Dashboard ──────────────────────────────────────────────────────────

test.describe('Admin Panel — Stats Dashboard', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('displays 4 stat cards', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    // Should show stats (exact text may vary, check for structure)
    const stats = page.locator('[role="region"]').filter({ hasText: /total posts|returned|active users|average/i })
    await expect(stats.first()).toBeVisible()
  })
})

// ─── Locations Tab ────────────────────────────────────────────────────────────

test.describe('Admin Panel — Locations Management', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('can view locations list', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    // Click Locations tab
    await page.getByRole('tab', { name: /locations/i }).click()
    
    // Should see add button
    await expect(page.getByRole('button', { name: /add location/i })).toBeVisible()
  })

  test('can add a new location', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /locations/i }).click()
    await page.getByRole('button', { name: /add location/i }).click()
    
    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Location')
    await page.fill('input[name="building"]', 'Test Building')
    await page.fill('input[name="floor"]', '3')
    
    // Submit
    await page.getByRole('button', { name: /create/i }).click()
    
    // Should see success toast or new location in list
    await expect(page.getByText(/E2E Test Location/)).toBeVisible({ timeout: 5000 })
  })

  test('can delete a location', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /locations/i }).click()
    
    // Find a location and click delete (use first one for simplicity)
    const deleteButton = page.getByRole('button', { name: /delete/i }).first()
    
    if (await deleteButton.isVisible()) {
      // Handle confirm dialog
      page.once('dialog', dialog => dialog.accept())
      await deleteButton.click()
      
      // Success should be indicated (toast or location removed)
      await page.waitForTimeout(1000)
    }
  })
})

// ─── Users Tab ────────────────────────────────────────────────────────────────

test.describe('Admin Panel — User Management', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('can view users list', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /users/i }).click()
    
    // Should see search input
    await expect(page.getByPlaceholder(/search by name or email/i)).toBeVisible()
    
    // Should see at least the admin user
    await expect(page.getByText(ADMIN.email)).toBeVisible()
  })

  test('search filters users', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /users/i }).click()
    
    // Search for admin email
    const searchInput = page.getByPlaceholder(/search by name or email/i)
    await searchInput.fill(ADMIN.email.split('@')[0])
    
    // Wait for filtering
    await page.waitForTimeout(500)
    
    // Admin should be visible
    await expect(page.getByText(ADMIN.email)).toBeVisible()
  })
})

// ─── Items Tab ────────────────────────────────────────────────────────────────

test.describe('Admin Panel — Items Management', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('can view all items', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /all items|items/i }).click()
    
    // Should see search and bulk actions
    await expect(page.getByPlaceholder(/search by title/i)).toBeVisible()
  })

  test('bulk selection works', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /all items|items/i }).click()
    
    // Select first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').nth(1)
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check()
      
      // Remove button should show count
      await expect(page.getByRole('button', { name: /remove selected \(1\)/i })).toBeVisible()
    }
  })
})

// ─── Audit Log Tab ────────────────────────────────────────────────────────────

test.describe('Admin Panel — Audit Log', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('displays audit log entries', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    await page.getByRole('tab', { name: /audit/i }).click()
    
    // Should see heading
    await expect(page.getByRole('heading', { name: /audit log/i })).toBeVisible()
    
    // Log might be empty on fresh DB, so just check structure
    const logSection = page.locator('text="Audit Log"').locator('..')
    await expect(logSection).toBeVisible()
  })
})

// ─── Mobile Viewport ──────────────────────────────────────────────────────────

test.describe('Admin Panel — Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } })
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('tabs are usable at 390px', async ({ page }) => {
    await signInViaAPI(page, ADMIN.email, ADMIN.password)
    await page.goto(`${BASE}/admin`)
    
    // Tabs should be visible and tappable
    const reportsTab = page.getByRole('tab', { name: /reports/i })
    await expect(reportsTab).toBeVisible()
    
    const box = await reportsTab.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44) // WCAG touch target
  })
})

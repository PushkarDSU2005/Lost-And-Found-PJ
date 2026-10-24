/**
 * E2E: Browse page — search, filter, paginate at 390 px mobile viewport.
 *
 * Does NOT require auth — the browse page is public (open items only).
 *
 * Run (with dev server already up):
 *   pnpm test:e2e -- --project="Mobile Chrome" tests/e2e/browse.spec.ts
 *   pnpm test:e2e -- --project=chromium       tests/e2e/browse.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

// ─── Desktop ──────────────────────────────────────────────────────────────────

test.describe('Browse page — desktop', () => {
  test('renders the browse page with items', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    await expect(page.getByRole('heading', { name: /browse items/i })).toBeVisible()
    // Should show items or the empty state
    const grid = page.getByTestId('item-grid')
    const empty = page.getByRole('status', { name: /no items found/i })
    await expect(grid.or(empty)).toBeVisible({ timeout: 10000 })
  })

  test('search filters items by title', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    const searchInput = page.getByLabel('Search items')
    await searchInput.fill('iPhone')

    // Wait for URL to update (debounced)
    await page.waitForURL(/q=iphone/i, { timeout: 5000 })

    // Should show results containing iPhone or empty state
    await expect(
      page.getByTestId('item-grid').or(page.getByRole('status', { name: /no items found/i }))
    ).toBeVisible({ timeout: 8000 })
  })

  test('clear search button removes query from URL', async ({ page }) => {
    await page.goto(`${BASE}/browse?q=wallet`)

    // Input should be pre-filled
    const input = page.getByLabel('Search items')
    await expect(input).toHaveValue('wallet')

    // Click clear button
    await page.getByLabel('Clear search').click()
    await page.waitForURL(/\/browse(?!\?q=)/, { timeout: 5000 })
    await expect(input).toHaveValue('')
  })

  test('category filter via active filter chip', async ({ page }) => {
    await page.goto(`${BASE}/browse?category=electronics`)

    // Active filter chip should be visible
    await expect(page.getByLabel(/remove filter: electronics/i)).toBeVisible()

    // Clicking the chip removes the filter
    await page.getByLabel(/remove filter: electronics/i).click()
    await page.waitForURL((url) => !url.searchParams.has('category'), { timeout: 5000 })
  })

  test('desktop filter sidebar is visible', async ({ page }) => {
    await page.goto(`${BASE}/browse`)
    // The sidebar <aside> should be in the DOM (CSS hides it on mobile)
    const sidebar = page.getByRole('complementary', { name: 'Browse filters' })
    await expect(sidebar).toBeInViewport()
  })

  test('"Report lost" CTA is present', async ({ page }) => {
    await page.goto(`${BASE}/browse`)
    await expect(page.getByRole('link', { name: /report lost/i })).toBeVisible()
  })
})

// ─── Mobile 390px ─────────────────────────────────────────────────────────────

test.describe('Browse page — mobile (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('renders browse page at 390px without horizontal overflow', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    await expect(page.getByRole('heading', { name: /browse items/i })).toBeVisible()

    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(390 + 2) // 2px tolerance for borders
  })

  test('floating filter button is visible on mobile', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    // The floating filter label/button should be visible
    const filterBtn = page.getByLabel(/filter/i).first()
    await expect(filterBtn).toBeVisible()
  })

  test('filter bottom sheet opens and closes', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    // Open the sheet
    const filterBtn = page.locator('label[for="filter-sheet-toggle"]').first()
    await filterBtn.click()

    // Dialog should appear
    const sheet = page.getByRole('dialog', { name: 'Browse filters' })
    await expect(sheet).toBeVisible({ timeout: 3000 })

    // Close it
    const closeBtn = page.getByLabel('Close filters')
    await closeBtn.click()
    await expect(sheet).not.toBeVisible({ timeout: 3000 })
  })

  test('search input is full-width and usable at 390px', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    const input = page.getByLabel('Search items')
    await expect(input).toBeVisible()

    const box = await input.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
  })

  test('can type a search and see URL update', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    await page.getByLabel('Search items').fill('jacket')
    await page.waitForURL(/q=jacket/i, { timeout: 5000 })

    const url = new URL(page.url())
    expect(url.searchParams.get('q')).toBe('jacket')
  })

  test('pagination links are accessible', async ({ page }) => {
    // Navigate to a page that has enough items to show pagination
    await page.goto(`${BASE}/browse`)

    // If there are enough items, next-page link appears
    const nextBtn = page.getByLabel('Next page')
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForURL(/page=2/, { timeout: 5000 })
      expect(new URL(page.url()).searchParams.get('page')).toBe('2')
    }
  })

  test('item cards are large enough to tap (min 44px)', async ({ page }) => {
    await page.goto(`${BASE}/browse`)

    const cards = page.getByTestId('item-card')
    const count = await cards.count()
    if (count === 0) return // no items, skip

    const firstCard = cards.first()
    const box = await firstCard.boundingBox()
    // Each card is a grid cell at 390px = ~186px wide and tall enough
    expect(box?.width).toBeGreaterThan(44)
    expect(box?.height).toBeGreaterThan(44)
  })
})

// ─── URL param persistence ────────────────────────────────────────────────────

test.describe('Browse page — URL param persistence', () => {
  test('all filter params are reflected in the URL', async ({ page }) => {
    await page.goto(`${BASE}/browse?q=phone&type=lost&category=electronics&page=1`)

    const url = new URL(page.url())
    expect(url.searchParams.get('q')).toBe('phone')
    expect(url.searchParams.get('type')).toBe('lost')
    expect(url.searchParams.get('category')).toBe('electronics')
  })

  test('home page search bar navigates to /browse with q param', async ({ page }) => {
    await page.goto(`${BASE}`)

    // Hero search bar points to /browse
    const searchInput = page.getByLabel('Search items')
    await searchInput.fill('wallet')
    await page.getByRole('button', { name: 'Search' }).click()

    await page.waitForURL(/\/browse.*q=wallet/, { timeout: 5000 })
    expect(page.url()).toContain('q=wallet')
  })
})

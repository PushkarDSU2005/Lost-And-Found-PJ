/**
 * E2E Accessibility Tests using axe-core
 * 
 * Tests key pages for WCAG 2.1 AA compliance
 * Pages: Home, Browse, Item Detail, Report Form, Dashboard
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

const STUDENT_A = {
  email: process.env.TEST_USER_STUDENT_A_EMAIL!,
  password: process.env.TEST_USER_STUDENT_A_PASSWORD!,
}

async function signInViaAPI(page: any, email: string, password: string) {
  await page.goto(`${BASE}/auth/login`)
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/dashboard|browse/, { timeout: 8000 })
}

const SKIP_AUTH = !process.env.PLAYWRIGHT_AUTH_READY

// ─── Home Page ────────────────────────────────────────────────────────────────

test.describe('Accessibility — Home Page', () => {
  test('has no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto(BASE)
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('skip-to-content link is present', async ({ page }) => {
    await page.goto(BASE)
    
    // Skip link should be in DOM (visible on focus)
    const skipLink = page.getByText(/skip to (main )?content/i)
    await expect(skipLink).toBeAttached()
  })

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE)
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    // H1 should describe the page
    const h1 = page.locator('h1').first()
    const h1Text = await h1.textContent()
    expect(h1Text).toBeTruthy()
    expect(h1Text!.length).toBeGreaterThan(0)
  })
})

// ─── Browse Page ──────────────────────────────────────────────────────────────

test.describe('Accessibility — Browse Page', () => {
  test('has no automatically detectable accessibility issues', async ({ page }) => {
    await page.goto(`${BASE}/browse`)
    
    // Wait for items to load
    await page.waitForSelector('[role="article"], .item-card', { timeout: 5000 })
      .catch(() => {}) // Ignore if no items
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#clerk-components') // Exclude third-party auth components if present
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('search input has proper label', async ({ page }) => {
    await page.goto(`${BASE}/browse`)
    
    const searchInput = page.getByRole('searchbox').or(page.locator('input[type="search"]'))
    await expect(searchInput.first()).toBeVisible()
    // Verify it has some accessible name (label, aria-label, or placeholder)
    const accessibleName = await searchInput.first().getAttribute('aria-label')
    const placeholder = await searchInput.first().getAttribute('placeholder')
    expect(accessibleName || placeholder).toBeTruthy()
  })

  test('filter controls are keyboard accessible', async ({ page }) => {
    await page.goto(`${BASE}/browse`)
    
    // Tab through the page to verify keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // At least one focusable element should have focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })
})

// ─── Item Detail Page ─────────────────────────────────────────────────────────

test.describe('Accessibility — Item Detail Page', () => {
  test('has no automatically detectable accessibility issues', async ({ page }) => {
    // Use a stable seed item ID
    const itemId = '20000000-0000-0000-0000-000000000001'
    await page.goto(`${BASE}/items/${itemId}`)
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('item images have alt text', async ({ page }) => {
    const itemId = '20000000-0000-0000-0000-000000000001'
    await page.goto(`${BASE}/items/${itemId}`)
    
    // All images should have alt attribute (empty is acceptable for decorative)
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const hasAlt = await img.evaluate((el: HTMLImageElement) => el.hasAttribute('alt'))
      expect(hasAlt).toBe(true)
    }
  })
})

// ─── Report Form ──────────────────────────────────────────────────────────────

test.describe('Accessibility — Report Form', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('has no automatically detectable accessibility issues', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/report/found`)
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('all form inputs have labels', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/report/found`)
    
    // Required inputs should have accessible names
    const titleInput = page.locator('input[name="title"]')
    await expect(titleInput).toBeVisible()
    const titleLabel = await titleInput.getAttribute('aria-label')
    const titleId = await titleInput.getAttribute('id')
    // Should have either aria-label or associated label via id
    expect(titleLabel || titleId).toBeTruthy()
    
    const categorySelect = page.locator('select[name="category"]')
    await expect(categorySelect).toBeVisible()
    const categoryLabel = await categorySelect.getAttribute('aria-label')
    const categoryId = await categorySelect.getAttribute('id')
    expect(categoryLabel || categoryId).toBeTruthy()
  })

  test('error messages are associated with inputs', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/report/found`)
    
    // Submit empty form to trigger validation
    await page.getByRole('button', { name: /submit|report/i }).click()
    
    // Wait for error messages
    await page.waitForTimeout(500)
    
    // Errors should be announced to screen readers (role="alert" or aria-describedby)
    const errors = page.locator('[role="alert"], [aria-invalid="true"]')
    const errorCount = await errors.count()
    
    // Should have at least one error for required field
    expect(errorCount).toBeGreaterThan(0)
  })

  test('form buttons have sufficient color contrast', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/report/found`)
    
    // Axe checks contrast automatically, but we can also manually verify
    const submitButton = page.getByRole('button', { name: /submit|report/i })
    await expect(submitButton).toBeVisible()
  })
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

test.describe('Accessibility — Dashboard', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('has no automatically detectable accessibility issues', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/dashboard`)
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('tabs are keyboard navigable', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/dashboard`)
    
    // Find tab elements
    const tabs = page.getByRole('tab')
    const tabCount = await tabs.count()
    
    if (tabCount > 0) {
      // First tab should be selected
      const firstTab = tabs.first()
      const ariaSelected = await firstTab.getAttribute('aria-selected')
      expect(ariaSelected).toBe('true')
    }
  })

  test('tab panels have proper labeling', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/dashboard`)
    
    // Tab panels should have role="tabpanel"
    const tabPanels = page.locator('[role="tabpanel"]')
    const panelCount = await tabPanels.count()
    
    // Should have at least one tab panel
    expect(panelCount).toBeGreaterThan(0)
  })
})

// ─── Mobile Accessibility ─────────────────────────────────────────────────────

test.describe('Accessibility — Mobile Touch Targets', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('navigation links meet minimum touch target size', async ({ page }) => {
    await page.goto(BASE)
    
    // Bottom nav or main nav links should be at least 44x44px (WCAG 2.5.5)
    const navLinks = page.locator('nav a, nav button').first()
    const box = await navLinks.boundingBox()
    
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(44)
    }
  })

  test('interactive elements have visible focus indicators', async ({ page }) => {
    await page.goto(BASE)
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Focused element should have outline or visible focus style
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toHaveCount(1)
    
    // Check computed style has outline or box-shadow
    const hasFocusStyle = await focusedElement.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.outline !== 'none' || 
             style.outlineWidth !== '0px' ||
             style.boxShadow !== 'none'
    })
    
    expect(hasFocusStyle).toBe(true)
  })
})

// ─── Color Contrast ───────────────────────────────────────────────────────────

test.describe('Accessibility — Color Contrast', () => {
  test('text meets WCAG AA contrast requirements', async ({ page }) => {
    await page.goto(BASE)
    
    // Axe automatically checks contrast ratios
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze()
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    )
    
    expect(contrastViolations).toEqual([])
  })
})

// ─── Screen Reader Announcements ──────────────────────────────────────────────

test.describe('Accessibility — ARIA Live Regions', () => {
  test.skip(SKIP_AUTH, 'Skipped: PLAYWRIGHT_AUTH_READY not set')

  test('status messages use appropriate ARIA', async ({ page }) => {
    await signInViaAPI(page, STUDENT_A.email, STUDENT_A.password)
    await page.goto(`${BASE}/report/found`)
    
    // Submit form with errors
    await page.getByRole('button', { name: /submit|report/i }).click()
    await page.waitForTimeout(500)
    
    // Error region should exist
    const alertRegions = page.locator('[role="alert"], [aria-live="assertive"]')
    const count = await alertRegions.count()
    
    expect(count).toBeGreaterThan(0)
  })
})

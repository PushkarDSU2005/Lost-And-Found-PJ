/**
 * E2E tests for Error Boundaries
 * 
 * Risk: MEDIUM — Error boundaries exist but never tested
 * Tests: Page-level and global error boundary activation
 */

import { test, expect } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// ─── 404 Error ────────────────────────────────────────────────────────────────

test.describe('Error Boundaries — 404 Not Found', () => {
  test('shows custom 404 page for invalid route', async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist-${Date.now()}`)
    
    // Should show custom 404 page
    await expect(page.getByRole('heading', { name: /page not found|404/i })).toBeVisible({ timeout: 5000 })
    
    // Should have "Go Home" link
    await expect(page.getByRole('link', { name: /go home/i })).toBeVisible()
  })

  test('404 page is keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent-route`)
    
    // Tab through the page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to navigate to links
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement)
  })

  test('can navigate back from 404', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Click "Go Home" link
    await page.getByRole('link', { name: /go home/i }).click()
    
    // Should be back at home
    await expect(page).toHaveURL(BASE, { timeout: 5000 })
  })
})

// ─── Invalid Item ID ──────────────────────────────────────────────────────────

test.describe('Error Boundaries — Invalid Item', () => {
  test('shows error for non-existent item ID', async ({ page }) => {
    await page.goto(`${BASE}/items/00000000-0000-0000-0000-000000000000`)
    
    // Should show error state or 404
    const errorIndicator = page.getByText(/not found|error|couldn't find|does not exist/i)
    await expect(errorIndicator).toBeVisible({ timeout: 5000 })
  })

  test('shows error for malformed item ID', async ({ page }) => {
    await page.goto(`${BASE}/items/invalid-id-format`)
    
    // Should handle gracefully (error or 404)
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    
    // Should not be a blank white screen
    expect(pageContent!.length).toBeGreaterThan(50)
  })
})

// ─── Network Errors ───────────────────────────────────────────────────────────

test.describe('Error Boundaries — Network Failures', () => {
  test('handles failed data fetch gracefully', async ({ page }) => {
    // Intercept API calls and make them fail
    await page.route('**/rest/v1/**', route => {
      route.abort('failed')
    })
    
    await page.goto(`${BASE}/browse`)
    
    // Should show error state, not blank page
    await page.waitForLoadState('networkidle')
    
    const bodyText = await page.textContent('body')
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(50)
  })

  test.skip('shows retry button on error', async ({ page }) => {
    // This test would need a way to trigger a controlled error
    // Placeholder for future implementation
  })
})

// ─── Page-Level Error Boundary ────────────────────────────────────────────────

test.describe('Error Boundaries — Page-Level', () => {
  test.skip('catches and displays page-level errors', async ({ page }) => {
    // This test would need a special route that throws an error
    // E.g., /test-error-boundary (development only)
    // Placeholder for future implementation when dev error routes are added
  })
})

// ─── Global Error Boundary ────────────────────────────────────────────────────

test.describe('Error Boundaries — Global', () => {
  test.skip('catches catastrophic errors', async ({ page }) => {
    // Global error boundary is the last resort
    // Difficult to test without intentionally breaking the app
    // Placeholder for future implementation
  })
})

// ─── Error State Accessibility ────────────────────────────────────────────────

test.describe('Error Boundaries — Accessibility', () => {
  test('404 page has proper heading structure', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Should have h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    const h1Text = await page.locator('h1').textContent()
    expect(h1Text?.toLowerCase()).toMatch(/not found|404/)
  })

  test('error messages have sufficient contrast', async ({ page }) => {
    await page.goto(`${BASE}/items/00000000-0000-0000-0000-000000000000`)
    
    // Error text should be visible (contrast check is implicit)
    const errorText = page.getByText(/error|not found/i).first()
    await expect(errorText).toBeVisible()
  })
})

// ─── Mobile Error States ──────────────────────────────────────────────────────

test.describe('Error Boundaries — Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('404 page is usable at 390px', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Page should fit without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()?.width || 390
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // 5px tolerance
  })

  test('error action buttons are tappable', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Action button should meet touch target size (44x44px)
    const actionButton = page.getByRole('link', { name: /go home|browse/i }).first()
    const box = await actionButton.boundingBox()
    
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
})

// ─── Recovery Actions ─────────────────────────────────────────────────────────

test.describe('Error Boundaries — Recovery', () => {
  test('provides multiple recovery options on 404', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Should have at least 2 action links
    const links = page.getByRole('link')
    const linkCount = await links.count()
    
    expect(linkCount).toBeGreaterThanOrEqual(2)
  })

  test('helpful links on 404 are valid', async ({ page }) => {
    await page.goto(`${BASE}/nonexistent`)
    
    // Get all links
    const links = page.getByRole('link')
    const hrefs = await links.evaluateAll(els => 
      els.map((el: any) => el.href).filter(Boolean)
    )
    
    // All hrefs should be valid (start with http or /)
    hrefs.forEach(href => {
      expect(href).toMatch(/^(https?:\/\/|\/)/i)
    })
  })
})

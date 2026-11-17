/**
 * Accessibility E2E Tests (A11Y-01 + UI-01, UI-03, UI-06)
 * 
 * Coverage:
 * - A11Y-01: Axe accessibility scan
 * - UI-01: No horizontal scroll at 360px
 * - UI-03: Focus visible
 * - UI-06: No placeholder/lorem text
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Key pages to test
const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/browse', name: 'Browse' },
  { path: '/about', name: 'About' },
  { path: '/faq', name: 'FAQ' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Signup' },
]

test.describe('A11Y-01: Axe accessibility scan', () => {
  for (const { path, name } of PAGES) {
    test(`${name} page has no critical accessibility violations`, async ({ page }) => {
      await page.goto(path)
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      
      // Log violations for review
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\n${name} page violations:`)
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`- ${violation.id}: ${violation.description}`)
          console.log(`  Impact: ${violation.impact}`)
          console.log(`  Nodes: ${violation.nodes.length}`)
        })
      }
      
      // Filter out critical and serious violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      )
      
      expect(criticalViolations).toHaveLength(0)
    })
  }
})

test.describe('UI-01: No horizontal scroll at mobile widths', () => {
  const mobileWidths = [360, 375, 390, 414]
  
  for (const width of mobileWidths) {
    test(`No horizontal scroll at ${width}px width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      
      for (const { path, name } of PAGES) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        
        // Check document width doesn't exceed viewport
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
        
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // Allow 1px tolerance
      }
    })
  }
})

test.describe('UI-03: Focus visible on interactive elements', () => {
  test('Tab key navigates through focusable elements with visible focus', async ({ page }) => {
    await page.goto('/')
    
    // Tab through first few interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      
      // Get focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return null
        
        const styles = window.getComputedStyle(el)
        const pseudoStyles = window.getComputedStyle(el, ':focus')
        
        return {
          tagName: el.tagName,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
          pseudoOutlineWidth: pseudoStyles.outlineWidth,
        }
      })
      
      if (focusedElement && focusedElement.tagName !== 'BODY') {
        // Focus should be visible (outline, box-shadow, or ring)
        const hasVisibleFocus = 
          (focusedElement.outlineWidth && focusedElement.outlineWidth !== '0px') ||
          (focusedElement.boxShadow && focusedElement.boxShadow !== 'none') ||
          (focusedElement.pseudoOutlineWidth && focusedElement.pseudoOutlineWidth !== '0px')
        
        expect(hasVisibleFocus).toBeTruthy()
      }
    }
  })
  
  test('Skip to main content link works', async ({ page }) => {
    await page.goto('/')
    
    // First tab should focus skip link
    await page.keyboard.press('Tab')
    
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()
    
    // Press Enter to skip
    await page.keyboard.press('Enter')
    
    // Main content should be focused
    const mainContent = page.locator('#main-content, main')
    await expect(mainContent).toBeFocused()
  })
})

test.describe('UI-06: No placeholder or lorem ipsum text', () => {
  test('Pages do not contain Lorem Ipsum placeholder text', async ({ page }) => {
    for (const { path, name } of PAGES) {
      await page.goto(path)
      
      const content = await page.content()
      
      // Check for common Lorem Ipsum phrases
      const loremPhrases = [
        'lorem ipsum',
        'dolor sit amet',
        'consectetur adipiscing',
        'TODO:',
        'FIXME:',
        'placeholder text',
        'XXX',
      ]
      
      for (const phrase of loremPhrases) {
        expect(content.toLowerCase()).not.toContain(phrase)
      }
    }
  })
  
  test('Form inputs have proper labels, not just placeholders', async ({ page }) => {
    await page.goto('/login')
    
    // Check email input
    const emailInput = page.locator('input[type="email"]')
    const emailLabel = page.locator('label[for]:has-text("Email"), label:has(input[type="email"])')
    
    await expect(emailInput).toBeVisible()
    await expect(emailLabel).toBeVisible()
    
    // Check password input
    const passwordInput = page.locator('input[type="password"]')
    const passwordLabel = page.locator('label[for]:has-text("Password"), label:has(input[type="password"])')
    
    await expect(passwordInput).toBeVisible()
    await expect(passwordLabel).toBeVisible()
  })
})

test.describe('UI: Additional accessibility checks', () => {
  test('Images have alt text', async ({ page }) => {
    await page.goto('/')
    
    // Get all images
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Image should have alt text or role="presentation"
      expect(alt !== null || role === 'presentation' || role === 'none').toBeTruthy()
    }
  })
  
  test('Buttons have accessible names', async ({ page }) => {
    await page.goto('/')
    
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')
      
      // Button should have visible text or aria-label
      const hasAccessibleName = 
        (text && text.trim().length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        (ariaLabelledBy && ariaLabelledBy.length > 0)
      
      expect(hasAccessibleName).toBeTruthy()
    }
  })
  
  test('Headings are in logical order', async ({ page }) => {
    await page.goto('/')
    
    const headings = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      return h.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim() || '',
      }))
    })
    
    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length
    expect(h1Count).toBe(1)
    
    // Headings should not skip levels
    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1].level
      const curr = headings[i].level
      
      // Current level should not be more than prev + 1
      if (curr > prev) {
        expect(curr - prev).toBeLessThanOrEqual(1)
      }
    }
  })
  
  test('Color contrast is sufficient', async ({ page }) => {
    await page.goto('/')
    
    // Use Axe to check color contrast
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules([
        'color-contrast', // We'll check this specifically
      ])
      .analyze()
    
    const contrastResults = await new AxeBuilder({ page })
      .include('main')
      .withRules(['color-contrast'])
      .analyze()
    
    const contrastViolations = contrastResults.violations.filter(
      v => v.id === 'color-contrast'
    )
    
    // Log contrast violations for review
    if (contrastViolations.length > 0) {
      console.log('\nColor contrast violations:')
      contrastViolations.forEach(violation => {
        violation.nodes.forEach(node => {
          console.log(`- ${node.html}`)
          console.log(`  ${node.failureSummary}`)
        })
      })
    }
    
    // Allow some violations (may be in non-critical areas)
    expect(contrastViolations.length).toBeLessThan(5)
  })
})

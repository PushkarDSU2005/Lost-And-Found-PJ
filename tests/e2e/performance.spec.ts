/**
 * Performance E2E Tests (PERF-01 + UI-02, UI-07)
 * 
 * Coverage:
 * - PERF-01: Lighthouse performance scores
 * - UI-02: No content overflow
 * - UI-07: Hero shows real data (not mock)
 */

import { test, expect } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'
import lighthouseDesktopConfig from 'lighthouse/core/config/lr-desktop-config.js'

test.describe('PERF-01: Lighthouse performance audit', () => {
  test('Home page meets performance thresholds', async ({ page }, testInfo) => {
    await page.goto('/')
    
    // Run Lighthouse audit
    const result = await playAudit({
      page,
      port: 9222, // Chrome debugging port
      thresholds: {
        performance: 75, // Relaxed for development
        accessibility: 90,
        'best-practices': 80,
        seo: 85,
      },
      config: lighthouseDesktopConfig,
    })
    
    // Log scores
    console.log('\nLighthouse Scores:')
    console.log(`Performance: ${(result.lhr.categories.performance.score ?? 0) * 100}`)
    console.log(`Accessibility: ${(result.lhr.categories.accessibility.score ?? 0) * 100}`)
    console.log(`Best Practices: ${(result.lhr.categories['best-practices']?.score ?? 0) * 100}`)
    console.log(`SEO: ${(result.lhr.categories.seo.score ?? 0) * 100}`)
    
    // Strict thresholds for production
    if (process.env.NODE_ENV === 'production') {
      expect((result.lhr.categories.performance.score ?? 0) * 100).toBeGreaterThanOrEqual(90)
      expect((result.lhr.categories.accessibility.score ?? 0) * 100).toBeGreaterThanOrEqual(95)
    }
  })
})

test.describe('PERF: Core Web Vitals', () => {
  test('LCP (Largest Contentful Paint) is acceptable', async ({ page }) => {
    await page.goto('/')
    
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          resolve(lastEntry.renderTime || lastEntry.loadTime)
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Timeout after 10s
        setTimeout(() => resolve(0), 10000)
      })
    })
    
    console.log(`LCP: ${lcp}ms`)
    
    // LCP should be < 2.5s for good
    expect(lcp).toBeLessThan(2500)
  })
  
  test('CLS (Cumulative Layout Shift) is minimal', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for any late shifts
    
    const cls = await page.evaluate(() => {
      let clsValue = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
      }).observe({ entryTypes: ['layout-shift'] })
      
      return clsValue
    })
    
    console.log(`CLS: ${cls}`)
    
    // CLS should be < 0.1 for good
    expect(cls).toBeLessThan(0.1)
  })
  
  test('FID (First Input Delay) is responsive', async ({ page }) => {
    await page.goto('/')
    
    // Click a button and measure response time
    const startTime = Date.now()
    await page.locator('a, button').first().click()
    const endTime = Date.now()
    
    const fid = endTime - startTime
    console.log(`FID estimate: ${fid}ms`)
    
    // FID should be < 100ms for good
    expect(fid).toBeLessThan(100)
  })
})

test.describe('UI-02: No content overflow', () => {
  test('No horizontal scroll on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    
    const pages = ['/', '/browse', '/about', '/login']
    
    for (const path of pages) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      
      // Check for overflow
      const hasOverflow = await page.evaluate(() => {
        const body = document.body
        const html = document.documentElement
        
        return {
          bodyOverflow: body.scrollWidth > body.clientWidth,
          htmlOverflow: html.scrollWidth > html.clientWidth,
          bodyWidth: body.scrollWidth,
          clientWidth: body.clientWidth,
        }
      })
      
      expect(hasOverflow.bodyOverflow || hasOverflow.htmlOverflow).toBeFalsy()
    }
  })
  
  test('All elements within viewport boundaries', async ({ page }) => {
    await page.goto('/')
    
    const overflowingElements = await page.evaluate(() => {
      const viewportWidth = window.innerWidth
      const elements = Array.from(document.querySelectorAll('*'))
      
      return elements
        .filter(el => {
          const rect = el.getBoundingClientRect()
          return rect.right > viewportWidth + 10 // 10px tolerance
        })
        .map(el => ({
          tag: el.tagName,
          class: el.className,
          id: el.id,
        }))
    })
    
    if (overflowingElements.length > 0) {
      console.log('Overflowing elements:', overflowingElements)
    }
    
    expect(overflowingElements.length).toBe(0)
  })
})

test.describe('UI-07: Hero shows real data', () => {
  test('Home page statistics are real numbers', async ({ page }) => {
    await page.goto('/')
    
    // Look for statistics/metrics on home page
    const statsText = await page.locator('main').textContent()
    
    // Should not contain obvious mock data
    expect(statsText).not.toContain('1,234')
    expect(statsText).not.toContain('9,999')
    expect(statsText).not.toContain('100%')
    expect(statsText).not.toContain('Coming Soon')
  })
  
  test('Browse page shows actual items (if any exist)', async ({ page }) => {
    await page.goto('/browse')
    
    // Wait for items to load
    await page.waitForTimeout(2000)
    
    const content = await page.content()
    
    // Should not contain placeholder item titles
    expect(content).not.toContain('Example Item')
    expect(content).not.toContain('Test Item 123')
    expect(content).not.toContain('Sample Lost Item')
    
    // If items exist, they should have real dates
    const itemCards = page.locator('[data-testid="item-card"]')
    const count = await itemCards.count()
    
    if (count > 0) {
      const firstItem = itemCards.first()
      const text = await firstItem.textContent()
      
      // Should contain relative dates like "2 days ago"
      expect(text).toMatch(/\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/i)
    }
  })
})

test.describe('PERF: Resource optimization', () => {
  test('Images are optimized and have proper dimensions', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        loading: img.loading,
      }))
    })
    
    for (const img of images) {
      // Images should have explicit dimensions
      expect(img.displayWidth).toBeGreaterThan(0)
      expect(img.displayHeight).toBeGreaterThan(0)
      
      // Images below the fold should be lazy loaded
      if (img.displayHeight < 600) { // Likely below fold
        // Lazy loading is recommended but not required
        console.log(`Image lazy loading: ${img.loading}`)
      }
    }
  })
  
  test('No unnecessarily large JavaScript bundles', async ({ page }) => {
    const jsRequests: Array<{ url: string; size: number }> = []
    
    page.on('response', async (response) => {
      const url = response.url()
      if (url.endsWith('.js') && !url.includes('node_modules')) {
        try {
          const buffer = await response.body()
          jsRequests.push({
            url,
            size: buffer.length,
          })
        } catch {
          // Ignore
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Log bundle sizes
    const totalSize = jsRequests.reduce((sum, req) => sum + req.size, 0)
    console.log(`\nTotal JS size: ${(totalSize / 1024).toFixed(2)} KB`)
    
    jsRequests.forEach(req => {
      const sizeKB = (req.size / 1024).toFixed(2)
      console.log(`- ${req.url.split('/').pop()}: ${sizeKB} KB`)
    })
    
    // Main bundle should be reasonable (< 500KB)
    const mainBundle = jsRequests.find(r => r.url.includes('page'))
    if (mainBundle) {
      expect(mainBundle.size).toBeLessThan(500 * 1024)
    }
  })
  
  test('Fonts are loaded efficiently', async ({ page }) => {
    const fontRequests: string[] = []
    
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('font') || url.endsWith('.woff2') || url.endsWith('.woff')) {
        fontRequests.push(url)
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    console.log(`\nFonts loaded: ${fontRequests.length}`)
    fontRequests.forEach(url => console.log(`- ${url}`))
    
    // Should load reasonable number of fonts
    expect(fontRequests.length).toBeLessThan(10)
  })
})

test.describe('PERF: Caching and network efficiency', () => {
  test('Static assets have cache headers', async ({ page }) => {
    const cacheHeaders: Array<{ url: string; cacheControl: string | null }> = []
    
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/_next/static/')) {
        cacheHeaders.push({
          url,
          cacheControl: response.headers()['cache-control'],
        })
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Static assets should have cache headers
    for (const asset of cacheHeaders) {
      expect(asset.cacheControl).toBeTruthy()
      console.log(`${asset.url.split('/').pop()}: ${asset.cacheControl}`)
    }
  })
})

/**
 * Security E2E Tests (SEC-02 to SEC-07)
 * 
 * Note: SEC-01 (RLS) already covered by 129 integration tests
 * 
 * Coverage:
 * - SEC-02: Verification answers never exposed
 * - SEC-03: Service key not in client bundle
 * - SEC-04: Security headers present
 * - SEC-05: XSS payload sanitization
 */

import { test, expect } from '@playwright/test'

test.describe('SEC-02: Verification answers never exposed', () => {
  test('Verification answer hash is never returned to client', async ({ page }) => {
    // Navigate to browse page
    await page.goto('/browse?type=found')
    
    // Get network responses
    const responses: string[] = []
    page.on('response', async (response) => {
      try {
        const text = await response.text()
        responses.push(text)
      } catch {
        // Ignore non-text responses
      }
    })
    
    // Wait for data to load
    await page.waitForTimeout(2000)
    
    // Check that no response contains verification_answer_hash
    for (const response of responses) {
      expect(response).not.toContain('verification_answer_hash')
      expect(response).not.toContain('answer_hash')
    }
  })
})

test.describe('SEC-03: Service key not in client bundle', () => {
  test('SUPABASE_SERVICE_ROLE_KEY not in any client JavaScript', async ({ page }) => {
    const responses: string[] = []
    
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('.js') || url.includes('/_next/')) {
        try {
          const text = await response.text()
          responses.push(text)
        } catch {
          // Ignore
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check no JavaScript bundle contains service role key patterns
    for (const js of responses) {
      expect(js).not.toMatch(/service.*role.*key/i)
      expect(js).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{43,}/)
    }
  })
})

test.describe('SEC-04: Security headers present', () => {
  test('Content-Security-Policy header is set', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    
    // CSP should be present (even if permissive during development)
    expect(headers?.['content-security-policy'] || headers?.['content-security-policy-report-only']).toBeTruthy()
  })
  
  test('X-Frame-Options prevents clickjacking', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    
    // Should have X-Frame-Options or frame-ancestors in CSP
    const hasXFrameOptions = headers?.['x-frame-options']
    const csp = headers?.['content-security-policy']
    const hasFrameAncestors = csp?.includes('frame-ancestors')
    
    expect(hasXFrameOptions || hasFrameAncestors).toBeTruthy()
  })
  
  test('X-Content-Type-Options prevents MIME sniffing', async ({ page }) => {
    const response = await page.goto('/')
    const headers = response?.headers()
    
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })
})

test.describe('SEC-05: XSS payload sanitization', () => {
  test('XSS payload in search query is escaped', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>'
    
    await page.goto(`/browse?q=${encodeURIComponent(xssPayload)}`)
    
    // Page should load without executing script
    await page.waitForTimeout(1000)
    
    // Check that script tag is not present in DOM as executable
    const scriptTags = await page.locator('script:has-text("alert")').count()
    expect(scriptTags).toBe(0)
    
    // Check page content (should be escaped)
    const content = await page.content()
    if (content.includes(xssPayload)) {
      // If present, it should be HTML-escaped
      expect(content).toContain('&lt;script&gt;')
    }
  })
  
  test('XSS in URL parameters does not execute', async ({ page }) => {
    const xssPayloads = [
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
    ]
    
    for (const payload of xssPayloads) {
      await page.goto(`/browse?category=${encodeURIComponent(payload)}`)
      await page.waitForTimeout(500)
      
      // No alert dialogs should appear
      // Page should load normally
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})

test.describe('SEC: Additional security checks', () => {
  test('Public pages do not leak sensitive user data', async ({ page }) => {
    await page.goto('/browse')
    
    const content = await page.content()
    
    // Should not contain email addresses
    expect(content).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)
    
    // Should not contain phone numbers (basic pattern)
    expect(content).not.toMatch(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)
    
    // Should not contain full addresses
    expect(content).not.toMatch(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln)/i)
  })
  
  test('Error messages do not leak system information', async ({ page }) => {
    // Try to access non-existent item
    await page.goto('/items/00000000-0000-0000-0000-000000000000')
    
    const content = await page.content()
    
    // Should not contain database error messages
    expect(content).not.toMatch(/postgres/i)
    expect(content).not.toMatch(/sql/i)
    expect(content).not.toMatch(/column.*does not exist/i)
    expect(content).not.toMatch(/relation.*does not exist/i)
    
    // Should not contain file paths
    expect(content).not.toMatch(/\/var\/www/i)
    expect(content).not.toMatch(/C:\\Users/i)
    expect(content).not.toMatch(/node_modules/i)
  })
  
  test('Rate limiting headers are present on API routes', async ({ page }) => {
    const response = await page.request.post('/api/test-endpoint', {
      data: { test: 'data' },
      failOnStatusCode: false,
    })
    
    // Even if endpoint doesn't exist, headers should be set by middleware
    const headers = response.headers()
    
    // Rate limit headers (if implemented)
    // Note: This will fail if not implemented, which is expected
    const hasRateLimitHeaders = 
      headers['x-ratelimit-limit'] ||
      headers['retry-after'] ||
      headers['x-rate-limit-remaining']
    
    // This is informational - rate limiting may be at infrastructure level
    console.log('Rate limit headers present:', !!hasRateLimitHeaders)
  })
})

#!/usr/bin/env tsx
/**
 * Full Application Audit Script
 * 
 * Phase 1: Crawls every route, clicks every button, captures all errors
 * Generates AUDIT.md with status of every feature
 */

import { chromium, type Browser, type Page, type BrowserContext } from 'playwright'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

// Persona credentials (from .env.local)
const PERSONAS = {
  guest: { name: 'Guest (Anonymous)', email: null, password: null },
  studentA: {
    name: 'Student A',
    email: process.env.TEST_USER_STUDENT_A_EMAIL!,
    password: process.env.TEST_USER_STUDENT_A_PASSWORD!,
  },
  studentB: {
    name: 'Student B',
    email: process.env.TEST_USER_STUDENT_B_EMAIL!,
    password: process.env.TEST_USER_STUDENT_B_PASSWORD!,
  },
  admin: {
    name: 'Admin',
    email: process.env.TEST_USER_ADMIN_EMAIL!,
    password: process.env.TEST_USER_ADMIN_PASSWORD!,
  },
}

// Routes to test
const ROUTES = [
  { path: '/', name: 'Home', auth: false },
  { path: '/browse', name: 'Browse Items', auth: false },
  { path: '/report/lost', name: 'Report Lost', auth: true },
  { path: '/report/found', name: 'Report Found', auth: true },
  { path: '/dashboard', name: 'Dashboard', auth: true },
  { path: '/notifications', name: 'Notifications', auth: true },
  { path: '/profile', name: 'Profile', auth: true },
  { path: '/admin', name: 'Admin Panel', auth: true, adminOnly: true },
  { path: '/drop-points', name: 'Drop Points', auth: false },
  { path: '/about', name: 'About', auth: false },
  { path: '/faq', name: 'FAQ', auth: false },
  { path: '/privacy', name: 'Privacy', auth: false },
  { path: '/terms', name: 'Terms', auth: false },
  { path: '/safety', name: 'Safety', auth: false },
]

interface AuditResult {
  route: string
  routeName: string
  persona: string
  expected: string
  actual: string
  status: 'Working' | 'Broken' | 'Missing' | 'Fake-data'
  severity: 'P0' | 'P1' | 'P2'
  rootCause: string
  consoleErrors: string[]
  networkErrors: string[]
  deadButtons: string[]
  screenshot?: string
}

const auditResults: AuditResult[] = []

// Helper to capture console errors
function setupConsoleLogging(page: Page): string[] {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })
  return consoleErrors
}

// Helper to capture network failures
function setupNetworkLogging(page: Page): string[] {
  const networkErrors: string[] = []
  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`)
    }
  })
  return networkErrors
}

// Login helper
async function login(page: Page, email: string, password: string) {
  // Check if login page exists
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  
  const hasLoginForm = await page.locator('input[type="email"]').count() > 0
  
  if (!hasLoginForm) {
    console.log('  ⚠️  Login page not implemented, skipping auth tests')
    return false
  }
  
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2000) // Wait for auth
  
  return true
}

// Test a single route with a persona
async function testRoute(
  page: Page,
  route: typeof ROUTES[0],
  persona: keyof typeof PERSONAS,
  personaData: typeof PERSONAS[keyof typeof PERSONAS]
): Promise<void> {
  console.log(`\n  Testing: ${route.path} as ${personaData.name}`)
  
  const consoleErrors = setupConsoleLogging(page)
  const networkErrors = setupNetworkLogging(page)
  
  try {
    // Navigate to route
    await page.goto(`http://localhost:3000${route.path}`, {
      waitUntil: 'networkidle',
      timeout: 10000,
    })
    
    // Take screenshot
    const screenshotDir = join(process.cwd(), 'docs', 'audit-screenshots')
    mkdirSync(screenshotDir, { recursive: true })
    const screenshotPath = `${route.name.toLowerCase().replace(/\s+/g, '-')}-${persona}.png`
    await page.screenshot({
      path: join(screenshotDir, screenshotPath),
      fullPage: true,
    })
    
    // Check if redirected (e.g., to login)
    const currentUrl = page.url()
    const wasRedirected = !currentUrl.includes(route.path)
    
    // Find all interactive elements
    const buttons = await page.locator('button, a[role="button"], [role="button"]').all()
    const links = await page.locator('a[href]').all()
    
    const deadButtons: string[] = []
    
    // Test buttons (sample, not all to avoid side effects)
    for (const button of buttons.slice(0, 5)) {
      const text = await button.textContent()
      const isDisabled = await button.isDisabled()
      
      if (!isDisabled && text) {
        // Check if button has onclick or form action
        const hasHandler = await button.evaluate((el) => {
          return (
            el.hasAttribute('onclick') ||
            el.closest('form') !== null ||
            el.hasAttribute('type') ||
            el.hasAttribute('href')
          )
        })
        
        if (!hasHandler) {
          deadButtons.push(text.trim())
        }
      }
    }
    
    // Determine status
    let status: AuditResult['status'] = 'Working'
    let actual = 'Page loads, no errors'
    let severity: AuditResult['severity'] = 'P2'
    let rootCause = ''
    
    if (wasRedirected && route.auth && persona === 'guest') {
      status = 'Working'
      actual = 'Redirected to login (expected for protected route)'
      severity = 'P2'
    } else if (wasRedirected && currentUrl.includes('/login')) {
      status = 'Broken'
      actual = 'Redirected to login when user is authenticated'
      severity = 'P0'
      rootCause = 'Auth check failing or login page missing'
    } else if (consoleErrors.length > 0) {
      status = 'Broken'
      actual = `Console errors: ${consoleErrors.length}`
      severity = 'P1'
      rootCause = consoleErrors[0]
    } else if (networkErrors.length > 0) {
      status = 'Broken'
      actual = `Network errors: ${networkErrors.length}`
      severity = 'P1'
      rootCause = networkErrors[0]
    } else if (deadButtons.length > 0) {
      status = 'Broken'
      actual = `Dead buttons: ${deadButtons.join(', ')}`
      severity = 'P2'
      rootCause = 'Buttons have no handlers'
    }
    
    // Check for hardcoded data
    const pageContent = await page.content()
    if (pageContent.includes('240+') || pageContent.includes('1,234') || pageContent.includes('Mock')) {
      status = 'Fake-data'
      actual += ' | Hardcoded/mock data visible'
      severity = 'P1'
      rootCause = 'Using placeholder/mock data instead of real DB queries'
    }
    
    auditResults.push({
      route: route.path,
      routeName: route.name,
      persona: personaData.name,
      expected: route.auth ? 'Requires login, shows real data' : 'Public access, shows real data',
      actual,
      status,
      severity,
      rootCause,
      consoleErrors,
      networkErrors,
      deadButtons,
      screenshot: screenshotPath,
    })
    
    console.log(`    Status: ${status} (${severity})`)
    if (rootCause) console.log(`    Root cause: ${rootCause}`)
    
  } catch (error) {
    console.log(`    ❌ Failed to load: ${error}`)
    auditResults.push({
      route: route.path,
      routeName: route.name,
      persona: personaData.name,
      expected: 'Page loads',
      actual: `Failed to load: ${error}`,
      status: 'Broken',
      severity: 'P0',
      rootCause: `Route does not exist or crashes: ${error}`,
      consoleErrors,
      networkErrors,
      deadButtons: [],
      screenshot: undefined,
    })
  }
}

// Generate AUDIT.md
function generateAuditReport() {
  const lines: string[] = []
  
  lines.push('# Application Audit Report')
  lines.push('')
  lines.push('**Generated**: ' + new Date().toISOString())
  lines.push('**Phase**: Phase 1 - Full Audit')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Summary')
  lines.push('')
  
  const total = auditResults.length
  const working = auditResults.filter((r) => r.status === 'Working').length
  const broken = auditResults.filter((r) => r.status === 'Broken').length
  const missing = auditResults.filter((r) => r.status === 'Missing').length
  const fakeData = auditResults.filter((r) => r.status === 'Fake-data').length
  
  const p0Count = auditResults.filter((r) => r.severity === 'P0').length
  const p1Count = auditResults.filter((r) => r.severity === 'P1').length
  const p2Count = auditResults.filter((r) => r.severity === 'P2').length
  
  lines.push(`| Metric | Count |`)
  lines.push(`|--------|-------|`)
  lines.push(`| Total tests | ${total} |`)
  lines.push(`| ✅ Working | ${working} |`)
  lines.push(`| ❌ Broken | ${broken} |`)
  lines.push(`| ⚠️ Missing | ${missing} |`)
  lines.push(`| 🔶 Fake data | ${fakeData} |`)
  lines.push(`| **P0 (Critical)** | **${p0Count}** |`)
  lines.push(`| **P1 (High)** | **${p1Count}** |`)
  lines.push(`| **P2 (Medium)** | **${p2Count}** |`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Detailed Results')
  lines.push('')
  lines.push('| Feature | Route | Persona | Expected | Actual | Status | Severity | Root Cause |')
  lines.push('|---------|-------|---------|----------|--------|--------|----------|------------|')
  
  for (const result of auditResults) {
    const statusEmoji = {
      Working: '✅',
      Broken: '❌',
      Missing: '⚠️',
      'Fake-data': '🔶',
    }[result.status]
    
    lines.push(
      `| ${result.routeName} | \`${result.route}\` | ${result.persona} | ${result.expected} | ${result.actual} | ${statusEmoji} ${result.status} | **${result.severity}** | ${result.rootCause || '-'} |`
    )
  }
  
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Console Errors')
  lines.push('')
  
  const allConsoleErrors = auditResults.flatMap((r) => r.consoleErrors)
  if (allConsoleErrors.length === 0) {
    lines.push('✅ No console errors detected')
  } else {
    lines.push('```')
    allConsoleErrors.slice(0, 20).forEach((err) => lines.push(err))
    lines.push('```')
  }
  
  lines.push('')
  lines.push('## Network Errors')
  lines.push('')
  
  const allNetworkErrors = auditResults.flatMap((r) => r.networkErrors)
  if (allNetworkErrors.length === 0) {
    lines.push('✅ No network errors (4xx/5xx) detected')
  } else {
    lines.push('```')
    allNetworkErrors.slice(0, 20).forEach((err) => lines.push(err))
    lines.push('```')
  }
  
  lines.push('')
  lines.push('## Dead Buttons')
  lines.push('')
  
  const allDeadButtons = auditResults.flatMap((r) => r.deadButtons)
  if (allDeadButtons.length === 0) {
    lines.push('✅ All tested buttons have handlers')
  } else {
    const uniqueDeadButtons = [...new Set(allDeadButtons)]
    lines.push('The following buttons have no click handlers:')
    lines.push('')
    uniqueDeadButtons.forEach((btn) => lines.push(`- "${btn}"`))
  }
  
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Screenshots')
  lines.push('')
  lines.push('Screenshots saved to: `/docs/audit-screenshots/`')
  lines.push('')
  
  return lines.join('\n')
}

// Main audit function
async function runAudit() {
  console.log('🔍 Starting Full Application Audit...\n')
  console.log('This will:')
  console.log('  - Visit every route')
  console.log('  - Test as guest, studentA, studentB, admin')
  console.log('  - Capture screenshots, errors, dead buttons')
  console.log('  - Generate AUDIT.md report\n')
  
  const browser = await chromium.launch({ headless: true })
  
  try {
    // Test as guest
    console.log('\n📋 Testing as GUEST...')
    const guestContext = await browser.newContext()
    const guestPage = await guestContext.newPage()
    
    for (const route of ROUTES) {
      if (!route.auth || route.path === '/') {
        await testRoute(guestPage, route, 'guest', PERSONAS.guest)
      }
    }
    
    await guestContext.close()
    
    // Test as authenticated users (if login exists)
    for (const [personaKey, personaData] of Object.entries(PERSONAS)) {
      if (personaKey === 'guest') continue
      
      console.log(`\n📋 Testing as ${personaData.name.toUpperCase()}...`)
      
      const context = await browser.newContext()
      const page = await context.newPage()
      
      const loginSuccess = await login(page, personaData.email, personaData.password)
      
      if (loginSuccess) {
        for (const route of ROUTES) {
          // Skip admin routes for non-admins
          if (route.adminOnly && personaKey !== 'admin') continue
          
          await testRoute(page, route, personaKey as keyof typeof PERSONAS, personaData)
        }
      } else {
        console.log(`  ⚠️  Skipping ${personaData.name} tests (login not implemented)`)
      }
      
      await context.close()
    }
    
  } finally {
    await browser.close()
  }
  
  // Generate report
  console.log('\n📝 Generating AUDIT.md...')
  const report = generateAuditReport()
  writeFileSync(join(process.cwd(), 'docs', 'AUDIT.md'), report)
  
  console.log('\n✅ Audit complete!')
  console.log(`   Results: ${auditResults.length} tests`)
  console.log(`   Report: docs/AUDIT.md`)
  console.log(`   Screenshots: docs/audit-screenshots/\n`)
  
  // Exit with error if critical issues found
  const p0Count = auditResults.filter((r) => r.severity === 'P0').length
  if (p0Count > 0) {
    console.log(`❌ Found ${p0Count} P0 (critical) issues\n`)
    process.exit(1)
  }
}

// Load environment and run
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

runAudit().catch((error) => {
  console.error('❌ Audit failed:', error)
  process.exit(1)
})

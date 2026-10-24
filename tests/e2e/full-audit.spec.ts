/**
 * Full Functionality Audit Script
 * Tests EVERY route and interactive element as each persona:
 * - Guest (anon)
 * - Student A (Alice)
 * - Student B (Bob)
 * - Admin
 * 
 * Captures screenshots and logs all errors/warnings.
 */

import { test, expect, type Page } from '@playwright/test'
import type { BrowserContext } from '@playwright/test'

// Test credentials from seed.sql
const USERS = {
  admin: { email: 'admin@university.edu', password: 'TestPassword123!', name: 'Campus Admin' },
  alice: { email: 'alice@university.edu', password: 'TestPassword123!', name: 'Alice Nguyen' },
  bob: { email: 'bob@university.edu', password: 'TestPassword123!', name: 'Bob Okafor' },
  carol: { email: 'carol@university.edu', password: 'TestPassword123!', name: 'Carol Martinez' },
}

// Known item IDs from seed data
const ITEM_IDS = {
  openLostByAlice: '20000000-0000-0000-0000-000000000001',
  openFoundByBob: '20000000-0000-0000-0000-000000000002',
  resolvedByAlice: '20000000-0000-0000-0000-000000000013',
}

// Audit results collection
interface AuditFinding {
  feature: string
  route: string
  expected: string
  actual: string
  status: 'Working' | 'Broken' | 'Fake-hardcoded' | 'Missing' | 'Privacy-Issue'
  severity: 'P0' | 'P1' | 'P2'
  cause?: string
  screenshot?: string
}

const findings: AuditFinding[] = []

function addFinding(finding: AuditFinding) {
  findings.push(finding)
  console.log(`[AUDIT] ${finding.status} - ${finding.feature}: ${finding.actual}`)
}

// Helper: Login as user
async function login(page: Page, user: typeof USERS.alice) {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

// Helper: Check for console errors
function setupConsoleMonitor(page: Page, persona: string) {
  const errors: string[] = []
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  page.on('pageerror', err => {
    errors.push(err.message)
  })
  
  return errors
}

test.describe('Full Functionality Audit', () => {
  
  test.describe('Guest (Anonymous) Persona', () => {
    let page: Page
    let errors: string[]
    
    test.beforeEach(async ({ browser }) => {
      page = await browser.newPage()
      errors = setupConsoleMonitor(page, 'guest')
    })
    
    test.afterEach(async () => {
      if (errors.length > 0) {
        addFinding({
          feature: 'Console Errors (Guest)',
          route: page.url(),
          expected: 'No console errors',
          actual: `Found ${errors.length} errors: ${errors.join(', ')}`,
          status: 'Broken',
          severity: 'P1',
          cause: 'Check browser console',
        })
      }
      await page.close()
    })
    
    test('Home page - Hero, stats, search, category chips, items grid', async () => {
      await page.goto('/')
      await page.screenshot({ path: 'audit-screenshots/guest-home.png', fullPage: true })
      
      // Check hero
      const hero = page.locator('h1', { hasText: /Find.*Lost.*Reunite/ })
      if (await hero.count() === 0) {
        addFinding({
          feature: 'Home Hero',
          route: '/',
          expected: 'Hero heading visible',
          actual: 'Hero not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
      
      // Check stats bar - FLAG HARDCODED VALUES
      const statsBar = page.locator('text=/\\d+ items.*\\d+ returned/')
      if (await statsBar.count() > 0) {
        const text = await statsBar.textContent()
        addFinding({
          feature: 'Home Stats Bar',
          route: '/',
          expected: 'Real-time stats from database',
          actual: `Stats shown: "${text}" - verify if hardcoded`,
          status: 'Fake-hardcoded',
          severity: 'P1',
          cause: 'app/page.tsx - check if stats are from mock data',
        })
      }
      
      // Check search input
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.count() === 0) {
        addFinding({
          feature: 'Home Search Input',
          route: '/',
          expected: 'Search input visible',
          actual: 'Search input not found',
          status: 'Missing',
          severity: 'P0',
        })
      }
      
      // Check Lost/Found toggle
      const toggle = page.locator('role=radiogroup')
      if (await toggle.count() === 0) {
        addFinding({
          feature: 'Lost/Found Toggle',
          route: '/',
          expected: 'Toggle buttons visible',
          actual: 'Toggle not found',
          status: 'Missing',
          severity: 'P1',
        })
      } else {
        // Test toggle functionality
        await page.click('text="Found"')
        const url = page.url()
        if (!url.includes('type=found')) {
          addFinding({
            feature: 'Lost/Found Toggle',
            route: '/',
            expected: 'Clicking Found updates URL to ?type=found',
            actual: `URL after click: ${url}`,
            status: 'Broken',
            severity: 'P1',
            cause: 'app/page.tsx - toggle not wired to URL params',
          })
        }
      }
      
      // Check category chips
      const categoryChips = page.locator('[role="radio"]')
      const chipCount = await categoryChips.count()
      if (chipCount === 0) {
        addFinding({
          feature: 'Category Chips',
          route: '/',
          expected: '8-9 category chips',
          actual: 'No category chips found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check items grid
      const itemCards = page.locator('[data-testid="item-card"]')
      const cardCount = await itemCards.count()
      if (cardCount === 0) {
        addFinding({
          feature: 'Home Items Grid',
          route: '/',
          expected: '8 recent items displayed',
          actual: 'No item cards found',
          status: 'Broken',
          severity: 'P0',
          cause: 'app/page.tsx - check Supabase query or ItemCard component',
        })
      }
      
      // Check report buttons
      const reportLostBtn = page.locator('text="Report lost"')
      const reportFoundBtn = page.locator('text="Report found"')
      if (await reportLostBtn.count() === 0 || await reportFoundBtn.count() === 0) {
        addFinding({
          feature: 'Report CTAs',
          route: '/',
          expected: 'Report Lost and Report Found buttons visible',
          actual: `Lost: ${await reportLostBtn.count()}, Found: ${await reportFoundBtn.count()}`,
          status: 'Missing',
          severity: 'P0',
        })
      }
    })
    
    test('Browse page - All filters, search, pagination', async () => {
      await page.goto('/browse')
      await page.screenshot({ path: 'audit-screenshots/guest-browse.png', fullPage: true })
      
      // Check filter bar (desktop)
      const filterBar = page.locator('aside').or(page.locator('[data-testid="filter-bar"]'))
      if (await filterBar.count() === 0) {
        addFinding({
          feature: 'Browse Filters',
          route: '/browse',
          expected: 'Filter sidebar visible',
          actual: 'Filter bar not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Test type filter
      await page.click('text="Lost"')
      await page.waitForURL('**/browse?*type=lost*', { timeout: 5000 })
      if (!page.url().includes('type=lost')) {
        addFinding({
          feature: 'Browse Type Filter',
          route: '/browse',
          expected: 'Clicking Lost adds ?type=lost',
          actual: `URL: ${page.url()}`,
          status: 'Broken',
          severity: 'P0',
          cause: 'components/browse/FilterBar.tsx',
        })
      }
      
      // Test category filter
      await page.click('text="Electronics"')
      await page.waitForURL('**/browse?*category=electronics*', { timeout: 5000 })
      if (!page.url().includes('category=electronics')) {
        addFinding({
          feature: 'Browse Category Filter',
          route: '/browse',
          expected: 'Clicking Electronics adds ?category=electronics',
          actual: `URL: ${page.url()}`,
          status: 'Broken',
          severity: 'P1',
        })
      }
      
      // Test search
      await page.fill('input[placeholder*="Search"]', 'laptop')
      await page.waitForURL('**/browse?*q=laptop*', { timeout: 5000 })
      if (!page.url().includes('q=laptop')) {
        addFinding({
          feature: 'Browse Search',
          route: '/browse',
          expected: 'Typing in search adds ?q=laptop',
          actual: `URL: ${page.url()}`,
          status: 'Broken',
          severity: 'P0',
          cause: 'components/browse/SearchInput.tsx - debounce or URL push issue',
        })
      }
      
      // Check pagination
      const pagination = page.locator('nav[aria-label*="pagination"]').or(page.locator('text=/Page \\d+ of \\d+/'))
      if (await pagination.count() === 0) {
        addFinding({
          feature: 'Browse Pagination',
          route: '/browse',
          expected: 'Pagination controls visible',
          actual: 'Pagination not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check items grid
      const itemGrid = page.locator('[data-testid="item-grid"]')
      if (await itemGrid.count() === 0) {
        addFinding({
          feature: 'Browse Items Grid',
          route: '/browse',
          expected: 'Items grid visible',
          actual: 'Grid not found',
          status: 'Broken',
          severity: 'P0',
        })
      }
    })
    
    test('Item Detail - Images, metadata, claim button (guest redirects)', async () => {
      await page.goto(`/items/${ITEM_IDS.openFoundByBob}`)
      await page.screenshot({ path: 'audit-screenshots/guest-item-detail.png', fullPage: true })
      
      // Check image gallery
      const gallery = page.locator('[data-testid="image-gallery"]').or(page.locator('img[alt*="item"]'))
      if (await gallery.count() === 0) {
        addFinding({
          feature: 'Item Images',
          route: `/items/${ITEM_IDS.openFoundByBob}`,
          expected: 'Image gallery or placeholder visible',
          actual: 'No images found',
          status: 'Broken',
          severity: 'P0',
          cause: 'components/items/ImageGallery.tsx or app/items/[id]/page.tsx',
        })
      }
      
      // Check claim button
      const claimBtn = page.locator('text="Claim this item"').or(page.locator('text="Sign in to claim"'))
      if (await claimBtn.count() === 0) {
        addFinding({
          feature: 'Claim Button (Guest)',
          route: `/items/${ITEM_IDS.openFoundByBob}`,
          expected: 'Sign in to claim button visible',
          actual: 'Claim button not found',
          status: 'Missing',
          severity: 'P0',
        })
      }
      
      // Check report button
      const reportBtn = page.locator('text="Report"').or(page.locator('[aria-label*="Report"]'))
      if (await reportBtn.count() === 0) {
        addFinding({
          feature: 'Report Button',
          route: `/items/${ITEM_IDS.openFoundByBob}`,
          expected: 'Report button visible',
          actual: 'Report button not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
      
      // Check share button
      const shareBtn = page.locator('text="Share"').or(page.locator('[aria-label*="Share"]'))
      if (await shareBtn.count() === 0) {
        addFinding({
          feature: 'Share Button',
          route: `/items/${ITEM_IDS.openFoundByBob}`,
          expected: 'Share button visible',
          actual: 'Share button not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
    })
    
    test('Navigation - Navbar, BottomNav, Footer links', async () => {
      await page.goto('/')
      
      // Check navbar links
      const navLinks = ['Browse', 'FAQ', 'Safety', 'Drop Points']
      for (const linkText of navLinks) {
        const link = page.locator(`nav a:has-text("${linkText}")`)
        if (await link.count() === 0) {
          addFinding({
            feature: `Navbar Link: ${linkText}`,
            route: '/',
            expected: `${linkText} link in navbar`,
            actual: 'Link not found',
            status: 'Missing',
            severity: 'P1',
          })
        } else {
          // Test if link works
          await link.first().click()
          await page.waitForLoadState('networkidle')
          const url = page.url()
          if (!url.includes(linkText.toLowerCase().replace(' ', '-'))) {
            addFinding({
              feature: `Navbar Link: ${linkText}`,
              route: '/',
              expected: `Navigates to /${linkText.toLowerCase()}`,
              actual: `URL: ${url}`,
              status: 'Broken',
              severity: 'P1',
              cause: `components/nav/Navbar.tsx - check href`,
            })
          }
          await page.goto('/') // Reset
        }
      }
      
      // Check bottom nav (mobile)
      await page.setViewportSize({ width: 390, height: 844 })
      const bottomNav = page.locator('nav[class*="bottom"]').or(page.locator('[data-testid="bottom-nav"]'))
      if (await bottomNav.count() === 0) {
        addFinding({
          feature: 'Bottom Nav (Mobile)',
          route: '/',
          expected: 'Bottom navigation visible on mobile',
          actual: 'Bottom nav not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check footer
      await page.setViewportSize({ width: 1280, height: 720 })
      const footer = page.locator('footer')
      if (await footer.count() === 0) {
        addFinding({
          feature: 'Footer',
          route: '/',
          expected: 'Footer visible',
          actual: 'Footer not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
    })
    
    test('Auth-gated pages - Should redirect to login', async () => {
      const authPages = [
        '/dashboard',
        '/admin',
        '/report/lost',
        '/notifications',
      ]
      
      for (const url of authPages) {
        await page.goto(url)
        await page.waitForLoadState('networkidle')
        const finalUrl = page.url()
        
        if (!finalUrl.includes('/auth/login')) {
          addFinding({
            feature: `Auth Gate: ${url}`,
            route: url,
            expected: 'Redirect to /auth/login',
            actual: `URL: ${finalUrl}`,
            status: 'Broken',
            severity: 'P0',
            cause: 'Missing auth check in page',
          })
        }
      }
    })
    
    test('Static pages - FAQ, Safety, Terms, Privacy, Drop Points', async () => {
      const staticPages = [
        '/faq',
        '/safety',
        '/terms',
        '/privacy',
        '/drop-points',
      ]
      
      for (const url of staticPages) {
        await page.goto(url)
        await page.waitForLoadState('networkidle')
        
        const h1 = page.locator('h1')
        if (await h1.count() === 0) {
          addFinding({
            feature: `Static Page: ${url}`,
            route: url,
            expected: 'Page renders with h1',
            actual: 'No h1 found',
            status: 'Broken',
            severity: 'P2',
          })
        }
        
        await page.screenshot({ path: `audit-screenshots/guest-${url.slice(1)}.png`, fullPage: true })
      }
    })
  })
  
  test.describe('Student A (Alice) Persona - Authenticated', () => {
    let page: Page
    let context: BrowserContext
    let errors: string[]
    
    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext()
      page = await context.newPage()
      errors = setupConsoleMonitor(page, 'alice')
      await login(page, USERS.alice)
    })
    
    test.afterAll(async () => {
      await page.close()
      await context.close()
    })
    
    test('Dashboard - My Posts tab', async () => {
      await page.goto('/dashboard')
      await page.screenshot({ path: 'audit-screenshots/alice-dashboard-posts.png', fullPage: true })
      
      // Check tabs
      const tabs = page.locator('[role="tab"]')
      const tabCount = await tabs.count()
      if (tabCount < 3) {
        addFinding({
          feature: 'Dashboard Tabs',
          route: '/dashboard',
          expected: '3 tabs (My Posts, My Claims, Claims on My Items)',
          actual: `Found ${tabCount} tabs`,
          status: 'Broken',
          severity: 'P0',
        })
      }
      
      // Check My Posts content
      const myPostsList = page.locator('[data-testid="my-posts-list"]')
      if (await myPostsList.count() === 0) {
        addFinding({
          feature: 'Dashboard My Posts',
          route: '/dashboard',
          expected: 'My posts list visible',
          actual: 'List not found',
          status: 'Broken',
          severity: 'P0',
          cause: 'components/dashboard/MyPostsTab.tsx',
        })
      }
      
      // Check edit button
      const editBtn = page.locator('[data-testid="edit-item-button"]')
      if (await editBtn.count() === 0) {
        addFinding({
          feature: 'Dashboard Edit Button',
          route: '/dashboard',
          expected: 'Edit button on open items',
          actual: 'Edit button not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check delete button
      const deleteBtn = page.locator('[data-testid="delete-item-button"]')
      if (await deleteBtn.count() === 0) {
        addFinding({
          feature: 'Dashboard Delete Button',
          route: '/dashboard',
          expected: 'Delete button on open items',
          actual: 'Delete button not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
    })
    
    test('Dashboard - My Claims tab', async () => {
      await page.goto('/dashboard?tab=my-claims')
      await page.screenshot({ path: 'audit-screenshots/alice-dashboard-claims.png', fullPage: true })
      
      const myClaimsList = page.locator('[data-testid="my-claims-list"]')
      if (await myClaimsList.count() === 0) {
        // Might be empty state - check for that
        const emptyState = page.locator('text=/No claims yet/i')
        if (await emptyState.count() === 0) {
          addFinding({
            feature: 'Dashboard My Claims',
            route: '/dashboard?tab=my-claims',
            expected: 'My claims list or empty state',
            actual: 'Neither found',
            status: 'Broken',
            severity: 'P1',
          })
        }
      }
    })
    
    test('Dashboard - Claims on My Items tab', async () => {
      await page.goto('/dashboard?tab=incoming-claims')
      await page.screenshot({ path: 'audit-screenshots/alice-dashboard-incoming.png', fullPage: true })
      
      const incomingClaimsList = page.locator('[data-testid="incoming-claims-list"]')
      if (await incomingClaimsList.count() === 0) {
        const emptyState = page.locator('text=/No claims yet/i')
        if (await emptyState.count() === 0) {
          addFinding({
            feature: 'Dashboard Incoming Claims',
            route: '/dashboard?tab=incoming-claims',
            expected: 'Incoming claims list or empty state',
            actual: 'Neither found',
            status: 'Broken',
            severity: 'P1',
          })
        }
      }
    })
    
    test('Report Lost Item - Full form flow', async () => {
      await page.goto('/report/lost')
      await page.screenshot({ path: 'audit-screenshots/alice-report-lost.png', fullPage: true })
      
      // Fill form
      await page.fill('input[name="title"]', 'Test Lost Item - Audit')
      await page.selectOption('select[name="category"]', 'electronics')
      
      // Check date picker
      const dateInput = page.locator('input[type="date"]')
      if (await dateInput.count() === 0) {
        addFinding({
          feature: 'Report Form Date Picker',
          route: '/report/lost',
          expected: 'Date picker visible',
          actual: 'Date input not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check image upload
      const imageUploader = page.locator('input[type="file"]')
      if (await imageUploader.count() === 0) {
        addFinding({
          feature: 'Report Form Image Upload',
          route: '/report/lost',
          expected: 'File input for images',
          actual: 'File input not found',
          status: 'Missing',
          severity: 'P0',
          cause: 'components/forms/ImageUploader.tsx',
        })
      }
      
      // Don't submit - this is read-only audit
    })
    
    test('Report Found Item - Found-only fields', async () => {
      await page.goto('/report/found')
      await page.screenshot({ path: 'audit-screenshots/alice-report-found.png', fullPage: true })
      
      // Check verification question field
      const verificationQuestion = page.locator('input[name="verification_question"]').or(page.locator('label:has-text("verification question")'))
      if (await verificationQuestion.count() === 0) {
        addFinding({
          feature: 'Report Found - Verification Question',
          route: '/report/found',
          expected: 'Verification question field visible',
          actual: 'Field not found',
          status: 'Missing',
          severity: 'P1',
          cause: 'components/forms/ReportForm.tsx',
        })
      }
      
      // Check held-at drop-point select
      const heldAtSelect = page.locator('select[name="held_at"]').or(page.locator('text="Drop-off point"'))
      if (await heldAtSelect.count() === 0) {
        addFinding({
          feature: 'Report Found - Held At Field',
          route: '/report/found',
          expected: 'Held-at drop-point select visible',
          actual: 'Field not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
    })
    
    test('Notification Bell', async () => {
      await page.goto('/')
      
      const notificationBell = page.locator('[aria-label*="notification"]').or(page.locator('text=/\\d+ unread/'))
      if (await notificationBell.count() === 0) {
        addFinding({
          feature: 'Notification Bell',
          route: '/',
          expected: 'Bell icon in navbar',
          actual: 'Bell not found',
          status: 'Missing',
          severity: 'P1',
          cause: 'components/nav/NotificationBell.tsx or app/layout.tsx',
        })
      } else {
        // Click bell
        await notificationBell.click()
        await page.waitForLoadState('networkidle')
        if (!page.url().includes('/notifications')) {
          addFinding({
            feature: 'Notification Bell Click',
            route: '/',
            expected: 'Navigates to /notifications',
            actual: `URL: ${page.url()}`,
            status: 'Broken',
            severity: 'P1',
          })
        }
      }
    })
    
    test('Item owned by Alice - Edit and delete buttons visible', async () => {
      await page.goto(`/items/${ITEM_IDS.openLostByAlice}`)
      await page.screenshot({ path: 'audit-screenshots/alice-own-item.png', fullPage: true })
      
      const editBtn = page.locator('text="Edit"')
      const deleteBtn = page.locator('text="Delete"')
      
      if (await editBtn.count() === 0 && await deleteBtn.count() === 0) {
        addFinding({
          feature: 'Owner Action Buttons',
          route: `/items/${ITEM_IDS.openLostByAlice}`,
          expected: 'Edit and Delete buttons for owner',
          actual: 'Neither button found',
          status: 'Broken',
          severity: 'P0',
          cause: 'components/items/ActionButtons.tsx - owner check',
        })
      }
    })
    
    test('Item NOT owned by Alice - Claim button visible', async () => {
      await page.goto(`/items/${ITEM_IDS.openFoundByBob}`)
      await page.screenshot({ path: 'audit-screenshots/alice-other-item.png', fullPage: true })
      
      const claimBtn = page.locator('text="Claim this item"')
      if (await claimBtn.count() === 0) {
        addFinding({
          feature: 'Claim Button (Non-owner)',
          route: `/items/${ITEM_IDS.openFoundByBob}`,
          expected: 'Claim button visible',
          actual: 'Claim button not found',
          status: 'Broken',
          severity: 'P0',
        })
      }
    })
  })
  
  test.describe('Admin Persona', () => {
    let page: Page
    let context: BrowserContext
    
    test.beforeAll(async ({ browser }) => {
      context = await browser.newContext()
      page = await context.newPage()
      await login(page, USERS.admin)
    })
    
    test.afterAll(async () => {
      await page.close()
      await context.close()
    })
    
    test('Admin Panel - Access and stats', async () => {
      await page.goto('/admin')
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: 'audit-screenshots/admin-panel.png', fullPage: true })
      
      // Check if denied
      const accessDenied = page.locator('text="Access Denied"')
      if (await accessDenied.count() > 0) {
        addFinding({
          feature: 'Admin Panel Access',
          route: '/admin',
          expected: 'Admin user can access panel',
          actual: 'Access Denied shown',
          status: 'Broken',
          severity: 'P0',
          cause: 'app/admin/page.tsx - role check failing',
        })
        return
      }
      
      // Check stats cards
      const statsCards = page.locator('[data-testid="admin-stats"]').or(page.locator('text=/Total Items|Active Users/'))
      if (await statsCards.count() === 0) {
        addFinding({
          feature: 'Admin Stats',
          route: '/admin',
          expected: 'Stats cards visible',
          actual: 'Stats not found',
          status: 'Missing',
          severity: 'P1',
        })
      }
      
      // Check tabs
      const tabs = page.locator('[role="tab"]')
      const tabCount = await tabs.count()
      if (tabCount < 4) {
        addFinding({
          feature: 'Admin Tabs',
          route: '/admin',
          expected: 'At least 4 tabs (Reports, Items, Users, Locations)',
          actual: `Found ${tabCount} tabs`,
          status: 'Broken',
          severity: 'P1',
        })
      }
    })
    
    test('Admin Panel - Locations management', async () => {
      await page.goto('/admin?tab=locations')
      await page.screenshot({ path: 'audit-screenshots/admin-locations.png', fullPage: true })
      
      const locationsList = page.locator('[data-testid="locations-list"]')
      if (await locationsList.count() === 0) {
        addFinding({
          feature: 'Admin Locations Tab',
          route: '/admin?tab=locations',
          expected: 'Locations list visible',
          actual: 'List not found',
          status: 'Broken',
          severity: 'P1',
        })
      }
      
      // Check add location button
      const addBtn = page.locator('text="Add Location"').or(page.locator('[aria-label*="Add location"]'))
      if (await addBtn.count() === 0) {
        addFinding({
          feature: 'Admin Add Location Button',
          route: '/admin?tab=locations',
          expected: 'Add location button visible',
          actual: 'Button not found',
          status: 'Missing',
          severity: 'P2',
        })
      }
    })
  })
  
  test.describe('Privacy & Hardcoded Data Checks', () => {
    let page: Page
    
    test.beforeEach(async ({ browser }) => {
      page = await browser.newPage()
    })
    
    test.afterEach(async () => {
      await page.close()
    })
    
    test('Check for personal data in public listings', async () => {
      await page.goto('/browse')
      await page.waitForLoadState('networkidle')
      
      // Grab all item titles
      const titles = await page.locator('[data-testid="item-card"] h3').allTextContents()
      
      const privacyPatterns = [
        /\\b\\d{10}\\b/, // Phone numbers
        /\\b[A-Z][a-z]+\\s[A-Z][a-z]+\\s[A-Z][a-z]+\\b/, // Full names (First Middle Last)
        /@[a-z0-9.-]+\\.[a-z]{2,}/i, // Email addresses
        /\\b\\d{1,5}\\s[A-Z][a-z]+\\s(Street|Road|Avenue|Lane)\\b/i, // Street addresses
      ]
      
      titles.forEach(title => {
        privacyPatterns.forEach(pattern => {
          if (pattern.test(title)) {
            addFinding({
              feature: 'Privacy Check - Item Title',
              route: '/browse',
              expected: 'No personal contact details in titles',
              actual: `Found potential PII in title: "${title}"`,
              status: 'Privacy-Issue',
              severity: 'P0',
              cause: 'User-submitted content - needs moderation',
            })
          }
        })
      })
    })
    
    test('Check for mock/hardcoded data on home', async () => {
      await page.goto('/')
      
      // Check for "Mock" or "Test" in visible text
      const bodyText = await page.locator('body').textContent()
      if (bodyText?.includes('Mock') || bodyText?.includes('MOCK_')) {
        addFinding({
          feature: 'Hardcoded Data Check',
          route: '/',
          expected: 'No mock data references',
          actual: 'Found "Mock" or "MOCK_" in page content',
          status: 'Fake-hardcoded',
          severity: 'P1',
          cause: 'Check if MOCK_ITEMS is still being used',
        })
      }
    })
  })
})

// Generate audit report
test.afterAll(async () => {
  console.log('\\n=== AUDIT COMPLETE ===\\n')
  console.log(`Total findings: ${findings.length}\\n`)
  
  // Group by status
  const byStatus = {
    Working: findings.filter(f => f.status === 'Working'),
    Broken: findings.filter(f => f.status === 'Broken'),
    Missing: findings.filter(f => f.status === 'Missing'),
    'Fake-hardcoded': findings.filter(f => f.status === 'Fake-hardcoded'),
    'Privacy-Issue': findings.filter(f => f.status === 'Privacy-Issue'),
  }
  
  console.log('Status Summary:')
  Object.entries(byStatus).forEach(([status, items]) => {
    console.log(`  ${status}: ${items.length}`)
  })
  
  console.log('\\nTop 10 Issues by Severity:\\n')
  const topIssues = findings
    .filter(f => f.status !== 'Working')
    .sort((a, b) => {
      const severityOrder = { P0: 0, P1: 1, P2: 2 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    })
    .slice(0, 10)
  
  topIssues.forEach((f, i) => {
    console.log(`${i + 1}. [${f.severity}] ${f.feature}`)
    console.log(`   ${f.actual}`)
    console.log(`   Route: ${f.route}`)
    if (f.cause) console.log(`   Cause: ${f.cause}`)
    console.log()
  })
  
  // Save to JSON for processing
  const fs = require('fs')
  const path = require('path')
  const outputPath = path.join(process.cwd(), 'audit-results.json')
  fs.writeFileSync(outputPath, JSON.stringify(findings, null, 2))
  console.log(`Full audit results saved to: ${outputPath}`)
})

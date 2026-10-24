# Test info

- Name: Full Functionality Audit >> Guest (Anonymous) Persona >> Home page - Hero, stats, search, category chips, items grid
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:101:9

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | /**
   2 |  * Full Functionality Audit Script
   3 |  * Tests EVERY route and interactive element as each persona:
   4 |  * - Guest (anon)
   5 |  * - Student A (Alice)
   6 |  * - Student B (Bob)
   7 |  * - Admin
   8 |  * 
   9 |  * Captures screenshots and logs all errors/warnings.
   10 |  */
   11 |
   12 | import { test, expect, type Page } from '@playwright/test'
   13 | import type { BrowserContext } from '@playwright/test'
   14 |
   15 | // Test credentials from seed.sql
   16 | const USERS = {
   17 |   admin: { email: 'admin@university.edu', password: 'TestPassword123!', name: 'Campus Admin' },
   18 |   alice: { email: 'alice@university.edu', password: 'TestPassword123!', name: 'Alice Nguyen' },
   19 |   bob: { email: 'bob@university.edu', password: 'TestPassword123!', name: 'Bob Okafor' },
   20 |   carol: { email: 'carol@university.edu', password: 'TestPassword123!', name: 'Carol Martinez' },
   21 | }
   22 |
   23 | // Known item IDs from seed data
   24 | const ITEM_IDS = {
   25 |   openLostByAlice: '20000000-0000-0000-0000-000000000001',
   26 |   openFoundByBob: '20000000-0000-0000-0000-000000000002',
   27 |   resolvedByAlice: '20000000-0000-0000-0000-000000000013',
   28 | }
   29 |
   30 | // Audit results collection
   31 | interface AuditFinding {
   32 |   feature: string
   33 |   route: string
   34 |   expected: string
   35 |   actual: string
   36 |   status: 'Working' | 'Broken' | 'Fake-hardcoded' | 'Missing' | 'Privacy-Issue'
   37 |   severity: 'P0' | 'P1' | 'P2'
   38 |   cause?: string
   39 |   screenshot?: string
   40 | }
   41 |
   42 | const findings: AuditFinding[] = []
   43 |
   44 | function addFinding(finding: AuditFinding) {
   45 |   findings.push(finding)
   46 |   console.log(`[AUDIT] ${finding.status} - ${finding.feature}: ${finding.actual}`)
   47 | }
   48 |
   49 | // Helper: Login as user
   50 | async function login(page: Page, user: typeof USERS.alice) {
   51 |   await page.goto('/auth/login')
   52 |   await page.fill('input[type="email"]', user.email)
   53 |   await page.fill('input[type="password"]', user.password)
   54 |   await page.click('button[type="submit"]')
   55 |   await page.waitForURL('/', { timeout: 10000 })
   56 | }
   57 |
   58 | // Helper: Check for console errors
   59 | function setupConsoleMonitor(page: Page, persona: string) {
   60 |   const errors: string[] = []
   61 |   
   62 |   page.on('console', msg => {
   63 |     if (msg.type() === 'error') {
   64 |       errors.push(msg.text())
   65 |     }
   66 |   })
   67 |   
   68 |   page.on('pageerror', err => {
   69 |     errors.push(err.message)
   70 |   })
   71 |   
   72 |   return errors
   73 | }
   74 |
   75 | test.describe('Full Functionality Audit', () => {
   76 |   
   77 |   test.describe('Guest (Anonymous) Persona', () => {
   78 |     let page: Page
   79 |     let errors: string[]
   80 |     
   81 |     test.beforeEach(async ({ browser }) => {
   82 |       page = await browser.newPage()
   83 |       errors = setupConsoleMonitor(page, 'guest')
   84 |     })
   85 |     
   86 |     test.afterEach(async () => {
   87 |       if (errors.length > 0) {
   88 |         addFinding({
   89 |           feature: 'Console Errors (Guest)',
   90 |           route: page.url(),
   91 |           expected: 'No console errors',
   92 |           actual: `Found ${errors.length} errors: ${errors.join(', ')}`,
   93 |           status: 'Broken',
   94 |           severity: 'P1',
   95 |           cause: 'Check browser console',
   96 |         })
   97 |       }
   98 |       await page.close()
   99 |     })
  100 |     
> 101 |     test('Home page - Hero, stats, search, category chips, items grid', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  102 |       await page.goto('/')
  103 |       await page.screenshot({ path: 'audit-screenshots/guest-home.png', fullPage: true })
  104 |       
  105 |       // Check hero
  106 |       const hero = page.locator('h1', { hasText: /Find.*Lost.*Reunite/ })
  107 |       if (await hero.count() === 0) {
  108 |         addFinding({
  109 |           feature: 'Home Hero',
  110 |           route: '/',
  111 |           expected: 'Hero heading visible',
  112 |           actual: 'Hero not found',
  113 |           status: 'Missing',
  114 |           severity: 'P2',
  115 |         })
  116 |       }
  117 |       
  118 |       // Check stats bar - FLAG HARDCODED VALUES
  119 |       const statsBar = page.locator('text=/\\d+ items.*\\d+ returned/')
  120 |       if (await statsBar.count() > 0) {
  121 |         const text = await statsBar.textContent()
  122 |         addFinding({
  123 |           feature: 'Home Stats Bar',
  124 |           route: '/',
  125 |           expected: 'Real-time stats from database',
  126 |           actual: `Stats shown: "${text}" - verify if hardcoded`,
  127 |           status: 'Fake-hardcoded',
  128 |           severity: 'P1',
  129 |           cause: 'app/page.tsx - check if stats are from mock data',
  130 |         })
  131 |       }
  132 |       
  133 |       // Check search input
  134 |       const searchInput = page.locator('input[placeholder*="Search"]')
  135 |       if (await searchInput.count() === 0) {
  136 |         addFinding({
  137 |           feature: 'Home Search Input',
  138 |           route: '/',
  139 |           expected: 'Search input visible',
  140 |           actual: 'Search input not found',
  141 |           status: 'Missing',
  142 |           severity: 'P0',
  143 |         })
  144 |       }
  145 |       
  146 |       // Check Lost/Found toggle
  147 |       const toggle = page.locator('role=radiogroup')
  148 |       if (await toggle.count() === 0) {
  149 |         addFinding({
  150 |           feature: 'Lost/Found Toggle',
  151 |           route: '/',
  152 |           expected: 'Toggle buttons visible',
  153 |           actual: 'Toggle not found',
  154 |           status: 'Missing',
  155 |           severity: 'P1',
  156 |         })
  157 |       } else {
  158 |         // Test toggle functionality
  159 |         await page.click('text="Found"')
  160 |         const url = page.url()
  161 |         if (!url.includes('type=found')) {
  162 |           addFinding({
  163 |             feature: 'Lost/Found Toggle',
  164 |             route: '/',
  165 |             expected: 'Clicking Found updates URL to ?type=found',
  166 |             actual: `URL after click: ${url}`,
  167 |             status: 'Broken',
  168 |             severity: 'P1',
  169 |             cause: 'app/page.tsx - toggle not wired to URL params',
  170 |           })
  171 |         }
  172 |       }
  173 |       
  174 |       // Check category chips
  175 |       const categoryChips = page.locator('[role="radio"]')
  176 |       const chipCount = await categoryChips.count()
  177 |       if (chipCount === 0) {
  178 |         addFinding({
  179 |           feature: 'Category Chips',
  180 |           route: '/',
  181 |           expected: '8-9 category chips',
  182 |           actual: 'No category chips found',
  183 |           status: 'Missing',
  184 |           severity: 'P1',
  185 |         })
  186 |       }
  187 |       
  188 |       // Check items grid
  189 |       const itemCards = page.locator('[data-testid="item-card"]')
  190 |       const cardCount = await itemCards.count()
  191 |       if (cardCount === 0) {
  192 |         addFinding({
  193 |           feature: 'Home Items Grid',
  194 |           route: '/',
  195 |           expected: '8 recent items displayed',
  196 |           actual: 'No item cards found',
  197 |           status: 'Broken',
  198 |           severity: 'P0',
  199 |           cause: 'app/page.tsx - check Supabase query or ItemCard component',
  200 |         })
  201 |       }
```
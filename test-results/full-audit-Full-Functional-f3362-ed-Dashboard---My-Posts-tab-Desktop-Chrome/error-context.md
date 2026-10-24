# Test info

- Name: Full Functionality Audit >> Student A (Alice) Persona - Authenticated >> Dashboard - My Posts tab
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:503:9

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
  403 |       if (await bottomNav.count() === 0) {
  404 |         addFinding({
  405 |           feature: 'Bottom Nav (Mobile)',
  406 |           route: '/',
  407 |           expected: 'Bottom navigation visible on mobile',
  408 |           actual: 'Bottom nav not found',
  409 |           status: 'Missing',
  410 |           severity: 'P1',
  411 |         })
  412 |       }
  413 |       
  414 |       // Check footer
  415 |       await page.setViewportSize({ width: 1280, height: 720 })
  416 |       const footer = page.locator('footer')
  417 |       if (await footer.count() === 0) {
  418 |         addFinding({
  419 |           feature: 'Footer',
  420 |           route: '/',
  421 |           expected: 'Footer visible',
  422 |           actual: 'Footer not found',
  423 |           status: 'Missing',
  424 |           severity: 'P2',
  425 |         })
  426 |       }
  427 |     })
  428 |     
  429 |     test('Auth-gated pages - Should redirect to login', async () => {
  430 |       const authPages = [
  431 |         '/dashboard',
  432 |         '/admin',
  433 |         '/report/lost',
  434 |         '/notifications',
  435 |       ]
  436 |       
  437 |       for (const url of authPages) {
  438 |         await page.goto(url)
  439 |         await page.waitForLoadState('networkidle')
  440 |         const finalUrl = page.url()
  441 |         
  442 |         if (!finalUrl.includes('/auth/login')) {
  443 |           addFinding({
  444 |             feature: `Auth Gate: ${url}`,
  445 |             route: url,
  446 |             expected: 'Redirect to /auth/login',
  447 |             actual: `URL: ${finalUrl}`,
  448 |             status: 'Broken',
  449 |             severity: 'P0',
  450 |             cause: 'Missing auth check in page',
  451 |           })
  452 |         }
  453 |       }
  454 |     })
  455 |     
  456 |     test('Static pages - FAQ, Safety, Terms, Privacy, Drop Points', async () => {
  457 |       const staticPages = [
  458 |         '/faq',
  459 |         '/safety',
  460 |         '/terms',
  461 |         '/privacy',
  462 |         '/drop-points',
  463 |       ]
  464 |       
  465 |       for (const url of staticPages) {
  466 |         await page.goto(url)
  467 |         await page.waitForLoadState('networkidle')
  468 |         
  469 |         const h1 = page.locator('h1')
  470 |         if (await h1.count() === 0) {
  471 |           addFinding({
  472 |             feature: `Static Page: ${url}`,
  473 |             route: url,
  474 |             expected: 'Page renders with h1',
  475 |             actual: 'No h1 found',
  476 |             status: 'Broken',
  477 |             severity: 'P2',
  478 |           })
  479 |         }
  480 |         
  481 |         await page.screenshot({ path: `audit-screenshots/guest-${url.slice(1)}.png`, fullPage: true })
  482 |       }
  483 |     })
  484 |   })
  485 |   
  486 |   test.describe('Student A (Alice) Persona - Authenticated', () => {
  487 |     let page: Page
  488 |     let context: BrowserContext
  489 |     let errors: string[]
  490 |     
  491 |     test.beforeAll(async ({ browser }) => {
  492 |       context = await browser.newContext()
  493 |       page = await context.newPage()
  494 |       errors = setupConsoleMonitor(page, 'alice')
  495 |       await login(page, USERS.alice)
  496 |     })
  497 |     
  498 |     test.afterAll(async () => {
  499 |       await page.close()
  500 |       await context.close()
  501 |     })
  502 |     
> 503 |     test('Dashboard - My Posts tab', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  504 |       await page.goto('/dashboard')
  505 |       await page.screenshot({ path: 'audit-screenshots/alice-dashboard-posts.png', fullPage: true })
  506 |       
  507 |       // Check tabs
  508 |       const tabs = page.locator('[role="tab"]')
  509 |       const tabCount = await tabs.count()
  510 |       if (tabCount < 3) {
  511 |         addFinding({
  512 |           feature: 'Dashboard Tabs',
  513 |           route: '/dashboard',
  514 |           expected: '3 tabs (My Posts, My Claims, Claims on My Items)',
  515 |           actual: `Found ${tabCount} tabs`,
  516 |           status: 'Broken',
  517 |           severity: 'P0',
  518 |         })
  519 |       }
  520 |       
  521 |       // Check My Posts content
  522 |       const myPostsList = page.locator('[data-testid="my-posts-list"]')
  523 |       if (await myPostsList.count() === 0) {
  524 |         addFinding({
  525 |           feature: 'Dashboard My Posts',
  526 |           route: '/dashboard',
  527 |           expected: 'My posts list visible',
  528 |           actual: 'List not found',
  529 |           status: 'Broken',
  530 |           severity: 'P0',
  531 |           cause: 'components/dashboard/MyPostsTab.tsx',
  532 |         })
  533 |       }
  534 |       
  535 |       // Check edit button
  536 |       const editBtn = page.locator('[data-testid="edit-item-button"]')
  537 |       if (await editBtn.count() === 0) {
  538 |         addFinding({
  539 |           feature: 'Dashboard Edit Button',
  540 |           route: '/dashboard',
  541 |           expected: 'Edit button on open items',
  542 |           actual: 'Edit button not found',
  543 |           status: 'Missing',
  544 |           severity: 'P1',
  545 |         })
  546 |       }
  547 |       
  548 |       // Check delete button
  549 |       const deleteBtn = page.locator('[data-testid="delete-item-button"]')
  550 |       if (await deleteBtn.count() === 0) {
  551 |         addFinding({
  552 |           feature: 'Dashboard Delete Button',
  553 |           route: '/dashboard',
  554 |           expected: 'Delete button on open items',
  555 |           actual: 'Delete button not found',
  556 |           status: 'Missing',
  557 |           severity: 'P1',
  558 |         })
  559 |       }
  560 |     })
  561 |     
  562 |     test('Dashboard - My Claims tab', async () => {
  563 |       await page.goto('/dashboard?tab=my-claims')
  564 |       await page.screenshot({ path: 'audit-screenshots/alice-dashboard-claims.png', fullPage: true })
  565 |       
  566 |       const myClaimsList = page.locator('[data-testid="my-claims-list"]')
  567 |       if (await myClaimsList.count() === 0) {
  568 |         // Might be empty state - check for that
  569 |         const emptyState = page.locator('text=/No claims yet/i')
  570 |         if (await emptyState.count() === 0) {
  571 |           addFinding({
  572 |             feature: 'Dashboard My Claims',
  573 |             route: '/dashboard?tab=my-claims',
  574 |             expected: 'My claims list or empty state',
  575 |             actual: 'Neither found',
  576 |             status: 'Broken',
  577 |             severity: 'P1',
  578 |           })
  579 |         }
  580 |       }
  581 |     })
  582 |     
  583 |     test('Dashboard - Claims on My Items tab', async () => {
  584 |       await page.goto('/dashboard?tab=incoming-claims')
  585 |       await page.screenshot({ path: 'audit-screenshots/alice-dashboard-incoming.png', fullPage: true })
  586 |       
  587 |       const incomingClaimsList = page.locator('[data-testid="incoming-claims-list"]')
  588 |       if (await incomingClaimsList.count() === 0) {
  589 |         const emptyState = page.locator('text=/No claims yet/i')
  590 |         if (await emptyState.count() === 0) {
  591 |           addFinding({
  592 |             feature: 'Dashboard Incoming Claims',
  593 |             route: '/dashboard?tab=incoming-claims',
  594 |             expected: 'Incoming claims list or empty state',
  595 |             actual: 'Neither found',
  596 |             status: 'Broken',
  597 |             severity: 'P1',
  598 |           })
  599 |         }
  600 |       }
  601 |     })
  602 |     
  603 |     test('Report Lost Item - Full form flow', async () => {
```
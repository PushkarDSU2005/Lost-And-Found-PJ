# Test info

- Name: Full Functionality Audit >> Guest (Anonymous) Persona >> Static pages - FAQ, Safety, Terms, Privacy, Drop Points
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:456:9

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
  356 |           expected: 'Share button visible',
  357 |           actual: 'Share button not found',
  358 |           status: 'Missing',
  359 |           severity: 'P2',
  360 |         })
  361 |       }
  362 |     })
  363 |     
  364 |     test('Navigation - Navbar, BottomNav, Footer links', async () => {
  365 |       await page.goto('/')
  366 |       
  367 |       // Check navbar links
  368 |       const navLinks = ['Browse', 'FAQ', 'Safety', 'Drop Points']
  369 |       for (const linkText of navLinks) {
  370 |         const link = page.locator(`nav a:has-text("${linkText}")`)
  371 |         if (await link.count() === 0) {
  372 |           addFinding({
  373 |             feature: `Navbar Link: ${linkText}`,
  374 |             route: '/',
  375 |             expected: `${linkText} link in navbar`,
  376 |             actual: 'Link not found',
  377 |             status: 'Missing',
  378 |             severity: 'P1',
  379 |           })
  380 |         } else {
  381 |           // Test if link works
  382 |           await link.first().click()
  383 |           await page.waitForLoadState('networkidle')
  384 |           const url = page.url()
  385 |           if (!url.includes(linkText.toLowerCase().replace(' ', '-'))) {
  386 |             addFinding({
  387 |               feature: `Navbar Link: ${linkText}`,
  388 |               route: '/',
  389 |               expected: `Navigates to /${linkText.toLowerCase()}`,
  390 |               actual: `URL: ${url}`,
  391 |               status: 'Broken',
  392 |               severity: 'P1',
  393 |               cause: `components/nav/Navbar.tsx - check href`,
  394 |             })
  395 |           }
  396 |           await page.goto('/') // Reset
  397 |         }
  398 |       }
  399 |       
  400 |       // Check bottom nav (mobile)
  401 |       await page.setViewportSize({ width: 390, height: 844 })
  402 |       const bottomNav = page.locator('nav[class*="bottom"]').or(page.locator('[data-testid="bottom-nav"]'))
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
> 456 |     test('Static pages - FAQ, Safety, Terms, Privacy, Drop Points', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
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
  503 |     test('Dashboard - My Posts tab', async () => {
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
```
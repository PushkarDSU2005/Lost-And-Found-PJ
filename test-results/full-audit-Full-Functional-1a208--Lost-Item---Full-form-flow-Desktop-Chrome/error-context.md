# Test info

- Name: Full Functionality Audit >> Student A (Alice) Persona - Authenticated >> Report Lost Item - Full form flow
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:603:9

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
> 603 |     test('Report Lost Item - Full form flow', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  604 |       await page.goto('/report/lost')
  605 |       await page.screenshot({ path: 'audit-screenshots/alice-report-lost.png', fullPage: true })
  606 |       
  607 |       // Fill form
  608 |       await page.fill('input[name="title"]', 'Test Lost Item - Audit')
  609 |       await page.selectOption('select[name="category"]', 'electronics')
  610 |       
  611 |       // Check date picker
  612 |       const dateInput = page.locator('input[type="date"]')
  613 |       if (await dateInput.count() === 0) {
  614 |         addFinding({
  615 |           feature: 'Report Form Date Picker',
  616 |           route: '/report/lost',
  617 |           expected: 'Date picker visible',
  618 |           actual: 'Date input not found',
  619 |           status: 'Missing',
  620 |           severity: 'P1',
  621 |         })
  622 |       }
  623 |       
  624 |       // Check image upload
  625 |       const imageUploader = page.locator('input[type="file"]')
  626 |       if (await imageUploader.count() === 0) {
  627 |         addFinding({
  628 |           feature: 'Report Form Image Upload',
  629 |           route: '/report/lost',
  630 |           expected: 'File input for images',
  631 |           actual: 'File input not found',
  632 |           status: 'Missing',
  633 |           severity: 'P0',
  634 |           cause: 'components/forms/ImageUploader.tsx',
  635 |         })
  636 |       }
  637 |       
  638 |       // Don't submit - this is read-only audit
  639 |     })
  640 |     
  641 |     test('Report Found Item - Found-only fields', async () => {
  642 |       await page.goto('/report/found')
  643 |       await page.screenshot({ path: 'audit-screenshots/alice-report-found.png', fullPage: true })
  644 |       
  645 |       // Check verification question field
  646 |       const verificationQuestion = page.locator('input[name="verification_question"]').or(page.locator('label:has-text("verification question")'))
  647 |       if (await verificationQuestion.count() === 0) {
  648 |         addFinding({
  649 |           feature: 'Report Found - Verification Question',
  650 |           route: '/report/found',
  651 |           expected: 'Verification question field visible',
  652 |           actual: 'Field not found',
  653 |           status: 'Missing',
  654 |           severity: 'P1',
  655 |           cause: 'components/forms/ReportForm.tsx',
  656 |         })
  657 |       }
  658 |       
  659 |       // Check held-at drop-point select
  660 |       const heldAtSelect = page.locator('select[name="held_at"]').or(page.locator('text="Drop-off point"'))
  661 |       if (await heldAtSelect.count() === 0) {
  662 |         addFinding({
  663 |           feature: 'Report Found - Held At Field',
  664 |           route: '/report/found',
  665 |           expected: 'Held-at drop-point select visible',
  666 |           actual: 'Field not found',
  667 |           status: 'Missing',
  668 |           severity: 'P2',
  669 |         })
  670 |       }
  671 |     })
  672 |     
  673 |     test('Notification Bell', async () => {
  674 |       await page.goto('/')
  675 |       
  676 |       const notificationBell = page.locator('[aria-label*="notification"]').or(page.locator('text=/\\d+ unread/'))
  677 |       if (await notificationBell.count() === 0) {
  678 |         addFinding({
  679 |           feature: 'Notification Bell',
  680 |           route: '/',
  681 |           expected: 'Bell icon in navbar',
  682 |           actual: 'Bell not found',
  683 |           status: 'Missing',
  684 |           severity: 'P1',
  685 |           cause: 'components/nav/NotificationBell.tsx or app/layout.tsx',
  686 |         })
  687 |       } else {
  688 |         // Click bell
  689 |         await notificationBell.click()
  690 |         await page.waitForLoadState('networkidle')
  691 |         if (!page.url().includes('/notifications')) {
  692 |           addFinding({
  693 |             feature: 'Notification Bell Click',
  694 |             route: '/',
  695 |             expected: 'Navigates to /notifications',
  696 |             actual: `URL: ${page.url()}`,
  697 |             status: 'Broken',
  698 |             severity: 'P1',
  699 |           })
  700 |         }
  701 |       }
  702 |     })
  703 |     
```
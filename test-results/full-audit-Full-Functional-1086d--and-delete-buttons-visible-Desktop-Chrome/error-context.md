# Test info

- Name: Full Functionality Audit >> Student A (Alice) Persona - Authenticated >> Item owned by Alice - Edit and delete buttons visible
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:704:9

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
> 704 |     test('Item owned by Alice - Edit and delete buttons visible', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  705 |       await page.goto(`/items/${ITEM_IDS.openLostByAlice}`)
  706 |       await page.screenshot({ path: 'audit-screenshots/alice-own-item.png', fullPage: true })
  707 |       
  708 |       const editBtn = page.locator('text="Edit"')
  709 |       const deleteBtn = page.locator('text="Delete"')
  710 |       
  711 |       if (await editBtn.count() === 0 && await deleteBtn.count() === 0) {
  712 |         addFinding({
  713 |           feature: 'Owner Action Buttons',
  714 |           route: `/items/${ITEM_IDS.openLostByAlice}`,
  715 |           expected: 'Edit and Delete buttons for owner',
  716 |           actual: 'Neither button found',
  717 |           status: 'Broken',
  718 |           severity: 'P0',
  719 |           cause: 'components/items/ActionButtons.tsx - owner check',
  720 |         })
  721 |       }
  722 |     })
  723 |     
  724 |     test('Item NOT owned by Alice - Claim button visible', async () => {
  725 |       await page.goto(`/items/${ITEM_IDS.openFoundByBob}`)
  726 |       await page.screenshot({ path: 'audit-screenshots/alice-other-item.png', fullPage: true })
  727 |       
  728 |       const claimBtn = page.locator('text="Claim this item"')
  729 |       if (await claimBtn.count() === 0) {
  730 |         addFinding({
  731 |           feature: 'Claim Button (Non-owner)',
  732 |           route: `/items/${ITEM_IDS.openFoundByBob}`,
  733 |           expected: 'Claim button visible',
  734 |           actual: 'Claim button not found',
  735 |           status: 'Broken',
  736 |           severity: 'P0',
  737 |         })
  738 |       }
  739 |     })
  740 |   })
  741 |   
  742 |   test.describe('Admin Persona', () => {
  743 |     let page: Page
  744 |     let context: BrowserContext
  745 |     
  746 |     test.beforeAll(async ({ browser }) => {
  747 |       context = await browser.newContext()
  748 |       page = await context.newPage()
  749 |       await login(page, USERS.admin)
  750 |     })
  751 |     
  752 |     test.afterAll(async () => {
  753 |       await page.close()
  754 |       await context.close()
  755 |     })
  756 |     
  757 |     test('Admin Panel - Access and stats', async () => {
  758 |       await page.goto('/admin')
  759 |       await page.waitForLoadState('networkidle')
  760 |       await page.screenshot({ path: 'audit-screenshots/admin-panel.png', fullPage: true })
  761 |       
  762 |       // Check if denied
  763 |       const accessDenied = page.locator('text="Access Denied"')
  764 |       if (await accessDenied.count() > 0) {
  765 |         addFinding({
  766 |           feature: 'Admin Panel Access',
  767 |           route: '/admin',
  768 |           expected: 'Admin user can access panel',
  769 |           actual: 'Access Denied shown',
  770 |           status: 'Broken',
  771 |           severity: 'P0',
  772 |           cause: 'app/admin/page.tsx - role check failing',
  773 |         })
  774 |         return
  775 |       }
  776 |       
  777 |       // Check stats cards
  778 |       const statsCards = page.locator('[data-testid="admin-stats"]').or(page.locator('text=/Total Items|Active Users/'))
  779 |       if (await statsCards.count() === 0) {
  780 |         addFinding({
  781 |           feature: 'Admin Stats',
  782 |           route: '/admin',
  783 |           expected: 'Stats cards visible',
  784 |           actual: 'Stats not found',
  785 |           status: 'Missing',
  786 |           severity: 'P1',
  787 |         })
  788 |       }
  789 |       
  790 |       // Check tabs
  791 |       const tabs = page.locator('[role="tab"]')
  792 |       const tabCount = await tabs.count()
  793 |       if (tabCount < 4) {
  794 |         addFinding({
  795 |           feature: 'Admin Tabs',
  796 |           route: '/admin',
  797 |           expected: 'At least 4 tabs (Reports, Items, Users, Locations)',
  798 |           actual: `Found ${tabCount} tabs`,
  799 |           status: 'Broken',
  800 |           severity: 'P1',
  801 |         })
  802 |       }
  803 |     })
  804 |     
```
# Test info

- Name: Full Functionality Audit >> Privacy & Hardcoded Data Checks >> Check for personal data in public listings
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:847:9

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
  805 |     test('Admin Panel - Locations management', async () => {
  806 |       await page.goto('/admin?tab=locations')
  807 |       await page.screenshot({ path: 'audit-screenshots/admin-locations.png', fullPage: true })
  808 |       
  809 |       const locationsList = page.locator('[data-testid="locations-list"]')
  810 |       if (await locationsList.count() === 0) {
  811 |         addFinding({
  812 |           feature: 'Admin Locations Tab',
  813 |           route: '/admin?tab=locations',
  814 |           expected: 'Locations list visible',
  815 |           actual: 'List not found',
  816 |           status: 'Broken',
  817 |           severity: 'P1',
  818 |         })
  819 |       }
  820 |       
  821 |       // Check add location button
  822 |       const addBtn = page.locator('text="Add Location"').or(page.locator('[aria-label*="Add location"]'))
  823 |       if (await addBtn.count() === 0) {
  824 |         addFinding({
  825 |           feature: 'Admin Add Location Button',
  826 |           route: '/admin?tab=locations',
  827 |           expected: 'Add location button visible',
  828 |           actual: 'Button not found',
  829 |           status: 'Missing',
  830 |           severity: 'P2',
  831 |         })
  832 |       }
  833 |     })
  834 |   })
  835 |   
  836 |   test.describe('Privacy & Hardcoded Data Checks', () => {
  837 |     let page: Page
  838 |     
  839 |     test.beforeEach(async ({ browser }) => {
  840 |       page = await browser.newPage()
  841 |     })
  842 |     
  843 |     test.afterEach(async () => {
  844 |       await page.close()
  845 |     })
  846 |     
> 847 |     test('Check for personal data in public listings', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  848 |       await page.goto('/browse')
  849 |       await page.waitForLoadState('networkidle')
  850 |       
  851 |       // Grab all item titles
  852 |       const titles = await page.locator('[data-testid="item-card"] h3').allTextContents()
  853 |       
  854 |       const privacyPatterns = [
  855 |         /\\b\\d{10}\\b/, // Phone numbers
  856 |         /\\b[A-Z][a-z]+\\s[A-Z][a-z]+\\s[A-Z][a-z]+\\b/, // Full names (First Middle Last)
  857 |         /@[a-z0-9.-]+\\.[a-z]{2,}/i, // Email addresses
  858 |         /\\b\\d{1,5}\\s[A-Z][a-z]+\\s(Street|Road|Avenue|Lane)\\b/i, // Street addresses
  859 |       ]
  860 |       
  861 |       titles.forEach(title => {
  862 |         privacyPatterns.forEach(pattern => {
  863 |           if (pattern.test(title)) {
  864 |             addFinding({
  865 |               feature: 'Privacy Check - Item Title',
  866 |               route: '/browse',
  867 |               expected: 'No personal contact details in titles',
  868 |               actual: `Found potential PII in title: "${title}"`,
  869 |               status: 'Privacy-Issue',
  870 |               severity: 'P0',
  871 |               cause: 'User-submitted content - needs moderation',
  872 |             })
  873 |           }
  874 |         })
  875 |       })
  876 |     })
  877 |     
  878 |     test('Check for mock/hardcoded data on home', async () => {
  879 |       await page.goto('/')
  880 |       
  881 |       // Check for "Mock" or "Test" in visible text
  882 |       const bodyText = await page.locator('body').textContent()
  883 |       if (bodyText?.includes('Mock') || bodyText?.includes('MOCK_')) {
  884 |         addFinding({
  885 |           feature: 'Hardcoded Data Check',
  886 |           route: '/',
  887 |           expected: 'No mock data references',
  888 |           actual: 'Found "Mock" or "MOCK_" in page content',
  889 |           status: 'Fake-hardcoded',
  890 |           severity: 'P1',
  891 |           cause: 'Check if MOCK_ITEMS is still being used',
  892 |         })
  893 |       }
  894 |     })
  895 |   })
  896 | })
  897 |
  898 | // Generate audit report
  899 | test.afterAll(async () => {
  900 |   console.log('\\n=== AUDIT COMPLETE ===\\n')
  901 |   console.log(`Total findings: ${findings.length}\\n`)
  902 |   
  903 |   // Group by status
  904 |   const byStatus = {
  905 |     Working: findings.filter(f => f.status === 'Working'),
  906 |     Broken: findings.filter(f => f.status === 'Broken'),
  907 |     Missing: findings.filter(f => f.status === 'Missing'),
  908 |     'Fake-hardcoded': findings.filter(f => f.status === 'Fake-hardcoded'),
  909 |     'Privacy-Issue': findings.filter(f => f.status === 'Privacy-Issue'),
  910 |   }
  911 |   
  912 |   console.log('Status Summary:')
  913 |   Object.entries(byStatus).forEach(([status, items]) => {
  914 |     console.log(`  ${status}: ${items.length}`)
  915 |   })
  916 |   
  917 |   console.log('\\nTop 10 Issues by Severity:\\n')
  918 |   const topIssues = findings
  919 |     .filter(f => f.status !== 'Working')
  920 |     .sort((a, b) => {
  921 |       const severityOrder = { P0: 0, P1: 1, P2: 2 }
  922 |       return severityOrder[a.severity] - severityOrder[b.severity]
  923 |     })
  924 |     .slice(0, 10)
  925 |   
  926 |   topIssues.forEach((f, i) => {
  927 |     console.log(`${i + 1}. [${f.severity}] ${f.feature}`)
  928 |     console.log(`   ${f.actual}`)
  929 |     console.log(`   Route: ${f.route}`)
  930 |     if (f.cause) console.log(`   Cause: ${f.cause}`)
  931 |     console.log()
  932 |   })
  933 |   
  934 |   // Save to JSON for processing
  935 |   const fs = require('fs')
  936 |   const path = require('path')
  937 |   const outputPath = path.join(process.cwd(), 'audit-results.json')
  938 |   fs.writeFileSync(outputPath, JSON.stringify(findings, null, 2))
  939 |   console.log(`Full audit results saved to: ${outputPath}`)
  940 | })
  941 |
```
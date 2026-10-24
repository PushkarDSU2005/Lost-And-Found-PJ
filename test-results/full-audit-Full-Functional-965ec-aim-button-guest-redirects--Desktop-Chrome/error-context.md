# Test info

- Name: Full Functionality Audit >> Guest (Anonymous) Persona >> Item Detail - Images, metadata, claim button (guest redirects)
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:306:9

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
  206 |       if (await reportLostBtn.count() === 0 || await reportFoundBtn.count() === 0) {
  207 |         addFinding({
  208 |           feature: 'Report CTAs',
  209 |           route: '/',
  210 |           expected: 'Report Lost and Report Found buttons visible',
  211 |           actual: `Lost: ${await reportLostBtn.count()}, Found: ${await reportFoundBtn.count()}`,
  212 |           status: 'Missing',
  213 |           severity: 'P0',
  214 |         })
  215 |       }
  216 |     })
  217 |     
  218 |     test('Browse page - All filters, search, pagination', async () => {
  219 |       await page.goto('/browse')
  220 |       await page.screenshot({ path: 'audit-screenshots/guest-browse.png', fullPage: true })
  221 |       
  222 |       // Check filter bar (desktop)
  223 |       const filterBar = page.locator('aside').or(page.locator('[data-testid="filter-bar"]'))
  224 |       if (await filterBar.count() === 0) {
  225 |         addFinding({
  226 |           feature: 'Browse Filters',
  227 |           route: '/browse',
  228 |           expected: 'Filter sidebar visible',
  229 |           actual: 'Filter bar not found',
  230 |           status: 'Missing',
  231 |           severity: 'P1',
  232 |         })
  233 |       }
  234 |       
  235 |       // Test type filter
  236 |       await page.click('text="Lost"')
  237 |       await page.waitForURL('**/browse?*type=lost*', { timeout: 5000 })
  238 |       if (!page.url().includes('type=lost')) {
  239 |         addFinding({
  240 |           feature: 'Browse Type Filter',
  241 |           route: '/browse',
  242 |           expected: 'Clicking Lost adds ?type=lost',
  243 |           actual: `URL: ${page.url()}`,
  244 |           status: 'Broken',
  245 |           severity: 'P0',
  246 |           cause: 'components/browse/FilterBar.tsx',
  247 |         })
  248 |       }
  249 |       
  250 |       // Test category filter
  251 |       await page.click('text="Electronics"')
  252 |       await page.waitForURL('**/browse?*category=electronics*', { timeout: 5000 })
  253 |       if (!page.url().includes('category=electronics')) {
  254 |         addFinding({
  255 |           feature: 'Browse Category Filter',
  256 |           route: '/browse',
  257 |           expected: 'Clicking Electronics adds ?category=electronics',
  258 |           actual: `URL: ${page.url()}`,
  259 |           status: 'Broken',
  260 |           severity: 'P1',
  261 |         })
  262 |       }
  263 |       
  264 |       // Test search
  265 |       await page.fill('input[placeholder*="Search"]', 'laptop')
  266 |       await page.waitForURL('**/browse?*q=laptop*', { timeout: 5000 })
  267 |       if (!page.url().includes('q=laptop')) {
  268 |         addFinding({
  269 |           feature: 'Browse Search',
  270 |           route: '/browse',
  271 |           expected: 'Typing in search adds ?q=laptop',
  272 |           actual: `URL: ${page.url()}`,
  273 |           status: 'Broken',
  274 |           severity: 'P0',
  275 |           cause: 'components/browse/SearchInput.tsx - debounce or URL push issue',
  276 |         })
  277 |       }
  278 |       
  279 |       // Check pagination
  280 |       const pagination = page.locator('nav[aria-label*="pagination"]').or(page.locator('text=/Page \\d+ of \\d+/'))
  281 |       if (await pagination.count() === 0) {
  282 |         addFinding({
  283 |           feature: 'Browse Pagination',
  284 |           route: '/browse',
  285 |           expected: 'Pagination controls visible',
  286 |           actual: 'Pagination not found',
  287 |           status: 'Missing',
  288 |           severity: 'P1',
  289 |         })
  290 |       }
  291 |       
  292 |       // Check items grid
  293 |       const itemGrid = page.locator('[data-testid="item-grid"]')
  294 |       if (await itemGrid.count() === 0) {
  295 |         addFinding({
  296 |           feature: 'Browse Items Grid',
  297 |           route: '/browse',
  298 |           expected: 'Items grid visible',
  299 |           actual: 'Grid not found',
  300 |           status: 'Broken',
  301 |           severity: 'P0',
  302 |         })
  303 |       }
  304 |     })
  305 |     
> 306 |     test('Item Detail - Images, metadata, claim button (guest redirects)', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
  307 |       await page.goto(`/items/${ITEM_IDS.openFoundByBob}`)
  308 |       await page.screenshot({ path: 'audit-screenshots/guest-item-detail.png', fullPage: true })
  309 |       
  310 |       // Check image gallery
  311 |       const gallery = page.locator('[data-testid="image-gallery"]').or(page.locator('img[alt*="item"]'))
  312 |       if (await gallery.count() === 0) {
  313 |         addFinding({
  314 |           feature: 'Item Images',
  315 |           route: `/items/${ITEM_IDS.openFoundByBob}`,
  316 |           expected: 'Image gallery or placeholder visible',
  317 |           actual: 'No images found',
  318 |           status: 'Broken',
  319 |           severity: 'P0',
  320 |           cause: 'components/items/ImageGallery.tsx or app/items/[id]/page.tsx',
  321 |         })
  322 |       }
  323 |       
  324 |       // Check claim button
  325 |       const claimBtn = page.locator('text="Claim this item"').or(page.locator('text="Sign in to claim"'))
  326 |       if (await claimBtn.count() === 0) {
  327 |         addFinding({
  328 |           feature: 'Claim Button (Guest)',
  329 |           route: `/items/${ITEM_IDS.openFoundByBob}`,
  330 |           expected: 'Sign in to claim button visible',
  331 |           actual: 'Claim button not found',
  332 |           status: 'Missing',
  333 |           severity: 'P0',
  334 |         })
  335 |       }
  336 |       
  337 |       // Check report button
  338 |       const reportBtn = page.locator('text="Report"').or(page.locator('[aria-label*="Report"]'))
  339 |       if (await reportBtn.count() === 0) {
  340 |         addFinding({
  341 |           feature: 'Report Button',
  342 |           route: `/items/${ITEM_IDS.openFoundByBob}`,
  343 |           expected: 'Report button visible',
  344 |           actual: 'Report button not found',
  345 |           status: 'Missing',
  346 |           severity: 'P2',
  347 |         })
  348 |       }
  349 |       
  350 |       // Check share button
  351 |       const shareBtn = page.locator('text="Share"').or(page.locator('[aria-label*="Share"]'))
  352 |       if (await shareBtn.count() === 0) {
  353 |         addFinding({
  354 |           feature: 'Share Button',
  355 |           route: `/items/${ITEM_IDS.openFoundByBob}`,
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
```
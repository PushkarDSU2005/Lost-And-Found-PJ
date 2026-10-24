# Test info

- Name: Full Functionality Audit >> Guest (Anonymous) Persona >> Browse page - All filters, search, pagination
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\full-audit.spec.ts:218:9

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
  202 |       
  203 |       // Check report buttons
  204 |       const reportLostBtn = page.locator('text="Report lost"')
  205 |       const reportFoundBtn = page.locator('text="Report found"')
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
> 218 |     test('Browse page - All filters, search, pagination', async () => {
      |         ^ Error: browserType.launch: Executable doesn't exist at C:\Users\Pushkar\AppData\Local\ms-playwright\chromium-1169\chrome-win\chrome.exe
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
  306 |     test('Item Detail - Images, metadata, claim button (guest redirects)', async () => {
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
```
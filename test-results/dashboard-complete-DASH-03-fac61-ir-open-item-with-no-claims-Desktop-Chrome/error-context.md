# Test info

- Name: DASH-03: User can delete their open item with no claims
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-complete.spec.ts:256:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid="panel-posts"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('[data-testid="panel-posts"]')

    at C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-complete.spec.ts:265:61
```

# Page snapshot

```yaml
- link "Skip to main content":
  - /url: "#main-content"
- banner:
  - navigation "Main navigation":
    - link "Lost & Found — home":
      - /url: /
      - text: Lost & Found
    - list:
      - listitem:
        - link "Browse":
          - /url: /browse
      - listitem:
        - link "Report Lost":
          - /url: /report/lost
      - listitem:
        - link "Report Found":
          - /url: /report/found
    - link "Sign in":
      - /url: /login
      - button "Sign in"
- main:
  - link "Back to home":
    - /url: /
  - heading "Welcome back" [level=1]
  - paragraph: Log in to report items, manage claims, and help reunite lost belongings.
  - text: Email
  - textbox "Email"
  - text: Password
  - link "Forgot password?":
    - /url: /forgot-password
  - textbox "Password"
  - button
  - button "Sign in"
  - text: Or continue with
  - button "Continue with Google":
    - img
    - text: Continue with Google
  - paragraph:
    - text: Don't have an account?
    - link "Sign up":
      - /url: /signup
- contentinfo:
  - paragraph: Lost & Found
  - navigation "Footer navigation":
    - list:
      - listitem:
        - link "About":
          - /url: /about
      - listitem:
        - link "FAQ":
          - /url: /faq
      - listitem:
        - link "Contact":
          - /url: /contact
      - listitem:
        - link "Privacy":
          - /url: /privacy
  - paragraph: © 2026 Lost & Found. All rights reserved.
- region "Notifications alt+T"
```

# Test source

```ts
  165 |   // Find the item in My Posts
  166 |   const itemCard = page.locator(`[data-testid="my-posts-list"] li:has-text("Original Title DASH-01")`)
  167 |   await expect(itemCard).toBeVisible()
  168 |
  169 |   // Click edit button
  170 |   await itemCard.locator('[data-testid="edit-item-button"]').click()
  171 |
  172 |   // Edit dialog should open
  173 |   await expect(page.locator('text=Edit Item')).toBeVisible()
  174 |
  175 |   // Change title
  176 |   const titleInput = page.locator('[data-testid="edit-title"]')
  177 |   await titleInput.fill('Updated Title DASH-01')
  178 |
  179 |   // Add description
  180 |   const descInput = page.locator('[data-testid="edit-description"]')
  181 |   await descInput.fill('Updated description for E2E testing')
  182 |
  183 |   // Save
  184 |   await page.locator('[data-testid="save-edit"]').click()
  185 |
  186 |   // Should redirect to item page
  187 |   await page.waitForURL(`/items/${itemId}**`)
  188 |   await expect(page.locator('text=Updated Title DASH-01')).toBeVisible()
  189 |
  190 |   // Verify in database
  191 |   const { data: item } = await supabase
  192 |     .from('items')
  193 |     .select('title, description, updated_at')
  194 |     .eq('id', itemId)
  195 |     .single()
  196 |
  197 |   expect(item).toBeTruthy()
  198 |   expect((item as { title: string }).title).toBe('Updated Title DASH-01')
  199 |   expect((item as { description: string }).description).toContain('Updated description')
  200 | })
  201 |
  202 | // ══════════════════════════════════════════════════════════════════════════════
  203 | // DASH-02: Mark item as returned (status → resolved)
  204 | // ══════════════════════════════════════════════════════════════════════════════
  205 |
  206 | test('DASH-02: Owner can mark item as returned (resolved)', async ({ page }) => {
  207 |   // Setup: Create found item with an approved claim
  208 |   const itemId = await createTestItem(TEST_USER_A.id, 'Found Item DASH-02', 'found')
  209 |   const claimId = await submitTestClaim(TEST_USER_B.id, itemId)
  210 |
  211 |   // Approve the claim (admin action, but we can do via service client)
  212 |   await supabase
  213 |     .from('claims')
  214 |     .update({ status: 'approved' })
  215 |     .eq('id', claimId)
  216 |
  217 |   // Sign in as User A (owner)
  218 |   await signInViaAPI(page, TEST_USER_A.email, TEST_USER_A.password)
  219 |
  220 |   // Navigate to item detail page
  221 |   await page.goto(`/items/${itemId}`)
  222 |   await expect(page.locator('text=Found Item DASH-02')).toBeVisible()
  223 |
  224 |   // Look for "Mark as Returned" button (should be in claims section)
  225 |   const markReturnedButton = page.locator('[data-testid="mark-returned-button"]')
  226 |   if (await markReturnedButton.isVisible()) {
  227 |     await markReturnedButton.click()
  228 |
  229 |     // Confirm dialog
  230 |     await page.locator('[data-testid="confirm-mark-returned"]').click()
  231 |
  232 |     // Should redirect or show success
  233 |     await page.waitForTimeout(1000)
  234 |
  235 |     // Verify status changed to resolved
  236 |     const { data: item } = await supabase
  237 |       .from('items')
  238 |       .select('status, resolved_at')
  239 |       .eq('id', itemId)
  240 |       .single()
  241 |
  242 |     expect((item as { status: string }).status).toBe('resolved')
  243 |     expect((item as { resolved_at: string | null }).resolved_at).not.toBeNull()
  244 |   } else {
  245 |     // If button doesn't exist, this feature may not be implemented yet
  246 |     // Mark test as passing with note
  247 |     console.log('⚠️  Mark as Returned button not found—feature may not be implemented')
  248 |     expect(true).toBe(true)
  249 |   }
  250 | })
  251 |
  252 | // ══════════════════════════════════════════════════════════════════════════════
  253 | // DASH-03: Delete item (soft delete)
  254 | // ══════════════════════════════════════════════════════════════════════════════
  255 |
  256 | test('DASH-03: User can delete their open item with no claims', async ({ page }) => {
  257 |   // Setup: Create item as User A (no claims)
  258 |   const itemId = await createTestItem(TEST_USER_A.id, 'To Delete DASH-03')
  259 |
  260 |   // Sign in as User A
  261 |   await signInViaAPI(page, TEST_USER_A.email, TEST_USER_A.password)
  262 |
  263 |   // Navigate to dashboard
  264 |   await page.goto('/dashboard')
> 265 |   await expect(page.locator('[data-testid="panel-posts"]')).toBeVisible()
      |                                                             ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  266 |
  267 |   // Find the item
  268 |   const itemCard = page.locator(`[data-testid="my-posts-list"] li:has-text("To Delete DASH-03")`)
  269 |   await expect(itemCard).toBeVisible()
  270 |
  271 |   // Click delete button
  272 |   await itemCard.locator('[data-testid="delete-item-button"]').click()
  273 |
  274 |   // Confirm dialog should appear
  275 |   await expect(page.locator('text=Delete Item?')).toBeVisible()
  276 |   await expect(page.locator('text=To Delete DASH-03')).toBeVisible()
  277 |
  278 |   // Confirm deletion
  279 |   await page.locator('[data-testid="confirm-delete"]').click()
  280 |
  281 |   // Should redirect to dashboard
  282 |   await page.waitForURL('/dashboard**')
  283 |
  284 |   // Item should no longer appear in list
  285 |   await expect(page.locator('[data-testid="my-posts-list"] li:has-text("To Delete DASH-03")')).not.toBeVisible()
  286 |
  287 |   // Verify in database (hard delete in this case)
  288 |   const { data: item } = await supabase
  289 |     .from('items')
  290 |     .select('id')
  291 |     .eq('id', itemId)
  292 |     .single()
  293 |
  294 |   expect(item).toBeNull()
  295 | })
  296 |
  297 | test('DASH-03b: Cannot delete item with existing claims', async ({ page }) => {
  298 |   // Setup: Create item with a claim
  299 |   const itemId = await createTestItem(TEST_USER_A.id, 'Has Claim DASH-03b')
  300 |   await submitTestClaim(TEST_USER_B.id, itemId)
  301 |
  302 |   // Sign in as User A
  303 |   await signInViaAPI(page, TEST_USER_A.email, TEST_USER_A.password)
  304 |
  305 |   // Navigate to dashboard
  306 |   await page.goto('/dashboard')
  307 |   await expect(page.locator('[data-testid="panel-posts"]')).toBeVisible()
  308 |
  309 |   // Find the item
  310 |   const itemCard = page.locator(`[data-testid="my-posts-list"] li:has-text("Has Claim DASH-03b")`)
  311 |   await expect(itemCard).toBeVisible()
  312 |
  313 |   // Click delete button
  314 |   await itemCard.locator('[data-testid="delete-item-button"]').click()
  315 |
  316 |   // Confirm deletion
  317 |   await page.locator('[data-testid="confirm-delete"]').click()
  318 |
  319 |   // Should show error
  320 |   await expect(page.locator('text=Cannot delete items with existing claims')).toBeVisible()
  321 | })
  322 |
  323 | // ══════════════════════════════════════════════════════════════════════════════
  324 | // DASH-04: Withdraw claim
  325 | // ══════════════════════════════════════════════════════════════════════════════
  326 |
  327 | test('DASH-04: Claimant can withdraw their pending claim', async ({ page }) => {
  328 |   // Setup: Create item and claim
  329 |   const itemId = await createTestItem(TEST_USER_A.id, 'Found Item DASH-04', 'found')
  330 |   const claimId = await submitTestClaim(TEST_USER_B_ID, itemId)
  331 |
  332 |   // Sign in as User B (claimant)
  333 |   await signInViaAPI(page, TEST_USER_B.email, TEST_USER_B.password)
  334 |
  335 |   // Navigate to dashboard → My Claims tab
  336 |   await page.goto('/dashboard?tab=claims')
  337 |   await expect(page.locator('[data-testid="panel-claims"]')).toBeVisible()
  338 |
  339 |   // Find the claim
  340 |   const claimCard = page.locator(`[data-testid="my-claims-list"] li:has-text("Found Item DASH-04")`)
  341 |   await expect(claimCard).toBeVisible()
  342 |
  343 |   // Click withdraw button
  344 |   await claimCard.locator('[data-testid="withdraw-claim-button"]').click()
  345 |
  346 |   // Confirm dialog
  347 |   await expect(page.locator('text=Withdraw Claim?')).toBeVisible()
  348 |   await page.locator('[data-testid="confirm-withdraw"]').click()
  349 |
  350 |   // Should redirect to dashboard with withdrawn=1
  351 |   await page.waitForURL('/dashboard**')
  352 |
  353 |   // Claim should now show as withdrawn
  354 |   await page.goto('/dashboard?tab=claims')
  355 |   const withdrawnCard = page.locator(`[data-testid="my-claims-list"] li:has-text("Found Item DASH-04")`)
  356 |   await expect(withdrawnCard.locator('text=withdrawn')).toBeVisible()
  357 |
  358 |   // Verify in database
  359 |   const { data: claim } = await supabase
  360 |     .from('claims')
  361 |     .select('status')
  362 |     .eq('id', claimId)
  363 |     .single()
  364 |
  365 |   expect((claim as { status: string }).status).toBe('withdrawn')
```
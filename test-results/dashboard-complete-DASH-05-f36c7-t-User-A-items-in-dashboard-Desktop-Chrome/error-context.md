# Test info

- Name: DASH-05: User B cannot see or edit User A items in dashboard
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-complete.spec.ts:396:5

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-testid="panel-posts"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('[data-testid="panel-posts"]')

    at C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-complete.spec.ts:405:61
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
  366 | })
  367 |
  368 | test('DASH-04b: Cannot withdraw approved claim', async ({ page }) => {
  369 |   // Setup: Create approved claim
  370 |   const itemId = await createTestItem(TEST_USER_A.id, 'Found Item DASH-04b', 'found')
  371 |   const claimId = await submitTestClaim(TEST_USER_B_ID, itemId)
  372 |
  373 |   // Approve the claim
  374 |   await supabase
  375 |     .from('claims')
  376 |     .update({ status: 'approved' })
  377 |     .eq('id', claimId)
  378 |
  379 |   // Sign in as User B
  380 |   await signInViaAPI(page, TEST_USER_B.email, TEST_USER_B.password)
  381 |
  382 |   // Navigate to My Claims
  383 |   await page.goto('/dashboard?tab=claims')
  384 |   await expect(page.locator('[data-testid="panel-claims"]')).toBeVisible()
  385 |
  386 |   // Withdraw button should NOT be visible for approved claims
  387 |   const claimCard = page.locator(`[data-testid="my-claims-list"] li:has-text("Found Item DASH-04b")`)
  388 |   await expect(claimCard).toBeVisible()
  389 |   await expect(claimCard.locator('[data-testid="withdraw-claim-button"]')).not.toBeVisible()
  390 | })
  391 |
  392 | // ══════════════════════════════════════════════════════════════════════════════
  393 | // DASH-05: User cannot touch others' items (RLS boundary)
  394 | // ══════════════════════════════════════════════════════════════════════════════
  395 |
  396 | test('DASH-05: User B cannot see or edit User A items in dashboard', async ({ page }) => {
  397 |   // Setup: User A creates item
  398 |   const itemId = await createTestItem(TEST_USER_A.id, 'User A Item DASH-05')
  399 |
  400 |   // Sign in as User B
  401 |   await signInViaAPI(page, TEST_USER_B.email, TEST_USER_B.password)
  402 |
  403 |   // Navigate to dashboard
  404 |   await page.goto('/dashboard')
> 405 |   await expect(page.locator('[data-testid="panel-posts"]')).toBeVisible()
      |                                                             ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  406 |
  407 |   // User A's item should NOT appear in User B's dashboard
  408 |   await expect(page.locator('[data-testid="my-posts-list"] li:has-text("User A Item DASH-05")')).not.toBeVisible()
  409 |
  410 |   // Try direct navigation to item page—edit button should not be visible
  411 |   await page.goto(`/items/${itemId}`)
  412 |   await expect(page.locator('text=User A Item DASH-05')).toBeVisible()
  413 |
  414 |   // Edit and delete buttons should not be present (RLS + UI guard)
  415 |   await expect(page.locator('[data-testid="edit-item-button"]')).not.toBeVisible()
  416 |   await expect(page.locator('[data-testid="delete-item-button"]')).not.toBeVisible()
  417 | })
  418 |
  419 | test('DASH-05b: Direct API call to edit others item should fail (RLS)', async ({ page }) => {
  420 |   // Setup: User A creates item
  421 |   const itemId = await createTestItem(TEST_USER_A.id, 'Protected Item DASH-05b')
  422 |
  423 |   // Sign in as User B
  424 |   await signInViaAPI(page, TEST_USER_B.email, TEST_USER_B.password)
  425 |
  426 |   // Attempt to edit via server action (requires User B's session)
  427 |   await page.goto('/dashboard')
  428 |
  429 |   // Call editItem action directly via fetch
  430 |   const response = await page.evaluate(async (itemIdArg) => {
  431 |     const formData = new FormData()
  432 |     formData.append('item_id', itemIdArg)
  433 |     formData.append('title', 'Hacked Title')
  434 |
  435 |     return fetch('/dashboard', {
  436 |       method: 'POST',
  437 |       body: formData,
  438 |     })
  439 |   }, itemId)
  440 |
  441 |   // RLS should prevent the update—verify title unchanged
  442 |   const { data: item } = await supabase
  443 |     .from('items')
  444 |     .select('title')
  445 |     .eq('id', itemId)
  446 |     .single()
  447 |
  448 |   expect((item as { title: string }).title).toBe('Protected Item DASH-05b')
  449 | })
  450 |
```
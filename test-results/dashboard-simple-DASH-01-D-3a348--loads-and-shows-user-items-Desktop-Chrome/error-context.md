# Test info

- Name: DASH-01: Dashboard loads and shows user items
- Location: C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-simple.spec.ts:123:5

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: locator('h1:has-text("Dashboard")')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for locator('h1:has-text("Dashboard")')

    at C:\Users\Pushkar\OneDrive\Documents\Lost and Found\tests\e2e\dashboard-simple.spec.ts:128:58
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
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   28 |   const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
   29 |   supabase = createClient(supabaseUrl, supabaseServiceKey)
   30 |
   31 |   const { data: users } = await supabase
   32 |     .from('profiles')
   33 |     .select('id, email')
   34 |     .in('email', [TEST_USER_A.email, TEST_USER_B.email])
   35 |
   36 |   if (!users || users.length < 2) {
   37 |     throw new Error('Test users not found')
   38 |   }
   39 |
   40 |   const usersArray = users as Array<{ id: string; email: string }>
   41 |   TEST_USER_A.id = usersArray.find(u => u.email === TEST_USER_A.email)!.id
   42 |   TEST_USER_B.id = usersArray.find(u => u.email === TEST_USER_B.email)!.id
   43 | })
   44 |
   45 | async function signIn(page: Page, email: string, password: string) {
   46 |   const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
   47 |   const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   48 |
   49 |   const res = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
   50 |     headers: { apikey: key, 'Content-Type': 'application/json' },
   51 |     data: { email, password },
   52 |   })
   53 |   
   54 |   const body = await res.json()
   55 |   if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)
   56 |
   57 |   const projectRef = new URL(url).hostname.split('.')[0]
   58 |   const cookieName = `sb-${projectRef}-auth-token`
   59 |   const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
   60 |
   61 |   await page.context().addCookies([
   62 |     {
   63 |       name: cookieName,
   64 |       value: encodeURIComponent(JSON.stringify([body.access_token, body.refresh_token])),
   65 |       domain: new URL(baseURL).hostname,
   66 |       path: '/',
   67 |       httpOnly: false,
   68 |       secure: false,
   69 |       sameSite: 'Lax',
   70 |     },
   71 |   ])
   72 | }
   73 |
   74 | async function createItem(reporterId: string, title: string): Promise<string> {
   75 |   const { data, error } = await supabase
   76 |     .from('items')
   77 |     .insert({
   78 |       reporter_id: reporterId,
   79 |       report_type: 'found',
   80 |       status: 'open',
   81 |       category: 'electronics',
   82 |       title,
   83 |       description: 'Test item',
   84 |       location_text: 'Test Location',
   85 |       date_occurred: new Date().toISOString().split('T')[0],
   86 |     })
   87 |     .select('id')
   88 |     .single()
   89 |
   90 |   if (error || !data) throw new Error(`Failed to create item: ${error?.message}`)
   91 |   const itemId = (data as { id: string }).id
   92 |   testItemIds.push(itemId)
   93 |   return itemId
   94 | }
   95 |
   96 | async function createClaim(claimantId: string, itemId: string): Promise<string> {
   97 |   const { data, error } = await supabase
   98 |     .from('claims')
   99 |     .insert({
  100 |       claimant_id: claimantId,
  101 |       item_id: itemId,
  102 |       status: 'pending',
  103 |       proof_text: 'Test proof',
  104 |     })
  105 |     .select('id')
  106 |     .single()
  107 |
  108 |   if (error || !data) throw new Error(`Failed to create claim: ${error?.message}`)
  109 |   const claimId = (data as { id: string }).id
  110 |   testClaimIds.push(claimId)
  111 |   return claimId
  112 | }
  113 |
  114 | test.afterAll(async () => {
  115 |   if (testClaimIds.length > 0) {
  116 |     await supabase.from('claims').delete().in('id', testClaimIds)
  117 |   }
  118 |   if (testItemIds.length > 0) {
  119 |     await supabase.from('items').delete().in('id', testItemIds)
  120 |   }
  121 | })
  122 |
  123 | test('DASH-01: Dashboard loads and shows user items', async ({ page }) => {
  124 |   const itemId = await createItem(TEST_USER_A.id, 'Test Item DASH-01')
  125 |   await signIn(page, TEST_USER_A.email, TEST_USER_A.password)
  126 |   
  127 |   await page.goto('/dashboard')
> 128 |   await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 })
      |                                                          ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
  129 |   
  130 |   // Verify item appears (may be in any format)
  131 |   await expect(page.locator(`text=Test Item DASH-01`)).toBeVisible({ timeout: 5000 })
  132 | })
  133 |
  134 | test('DASH-03: Delete item from dashboard', async ({ page }) => {
  135 |   const itemId = await createItem(TEST_USER_A.id, 'To Delete DASH-03')
  136 |   await signIn(page, TEST_USER_A.email, TEST_USER_A.password)
  137 |   
  138 |   await page.goto('/dashboard')
  139 |   await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  140 |   await page.waitForTimeout(1000)
  141 |   
  142 |   // Try to find delete button
  143 |   const deleteButton = page.locator('[data-testid="delete-item-button"]').first()
  144 |   if (await deleteButton.isVisible({ timeout: 2000 })) {
  145 |     await deleteButton.click()
  146 |     
  147 |     // Confirm
  148 |     const confirmButton = page.locator('[data-testid="confirm-delete"]')
  149 |     if (await confirmButton.isVisible({ timeout: 2000 })) {
  150 |       await confirmButton.click()
  151 |       await page.waitForURL('/dashboard**', { timeout: 5000 })
  152 |     }
  153 |   }
  154 |   
  155 |   // Verify deleted in DB
  156 |   const { data: item } = await supabase
  157 |     .from('items')
  158 |     .select('id')
  159 |     .eq('id', itemId)
  160 |     .single()
  161 |   
  162 |   expect(item).toBeNull()
  163 | })
  164 |
  165 | test('DASH-04: Withdraw claim', async ({ page }) => {
  166 |   const itemId = await createItem(TEST_USER_A.id, 'Item DASH-04')
  167 |   const claimId = await createClaim(TEST_USER_B.id, itemId)
  168 |   
  169 |   await signIn(page, TEST_USER_B.email, TEST_USER_B.password)
  170 |   
  171 |   await page.goto('/dashboard?tab=claims')
  172 |   await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  173 |   await page.waitForTimeout(1000)
  174 |   
  175 |   // Try to find withdraw button
  176 |   const withdrawButton = page.locator('[data-testid="withdraw-claim-button"]').first()
  177 |   if (await withdrawButton.isVisible({ timeout: 2000 })) {
  178 |     await withdrawButton.click()
  179 |     
  180 |     const confirmButton = page.locator('[data-testid="confirm-withdraw"]')
  181 |     if (await confirmButton.isVisible({ timeout: 2000 })) {
  182 |       await confirmButton.click()
  183 |       await page.waitForURL('/dashboard**', { timeout: 5000 })
  184 |     }
  185 |   }
  186 |   
  187 |   // Verify withdrawn in DB
  188 |   const { data: claim } = await supabase
  189 |     .from('claims')
  190 |     .select('status')
  191 |     .eq('id', claimId)
  192 |     .single()
  193 |   
  194 |   expect((claim as { status: string }).status).toBe('withdrawn')
  195 | })
  196 |
  197 | test('DASH-05: Cannot see other users items', async ({ page }) => {
  198 |   const itemId = await createItem(TEST_USER_A.id, 'User A Item DASH-05')
  199 |   await signIn(page, TEST_USER_B.email, TEST_USER_B.password)
  200 |   
  201 |   await page.goto('/dashboard')
  202 |   await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  203 |   
  204 |   // User B should NOT see User A's item
  205 |   await expect(page.locator('text=User A Item DASH-05')).not.toBeVisible()
  206 | })
  207 |
```
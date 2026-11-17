/**
 * Simplified Dashboard E2E Tests (DASH-01 through DASH-05)
 * 
 * Focuses on core functionality with minimal assertions
 */

import { test, expect, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const TEST_USER_A = {
  email: process.env.TEST_USER_STUDENT_A_EMAIL!,
  password: process.env.TEST_USER_STUDENT_A_PASSWORD!,
  id: '',
}

const TEST_USER_B = {
  email: process.env.TEST_USER_STUDENT_B_EMAIL!,
  password: process.env.TEST_USER_STUDENT_B_PASSWORD!,
  id: '',
}

let testItemIds: string[] = []
let testClaimIds: string[] = []
let supabase: SupabaseClient

test.beforeAll(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', [TEST_USER_A.email, TEST_USER_B.email])

  if (!users || users.length < 2) {
    throw new Error('Test users not found')
  }

  const usersArray = users as Array<{ id: string; email: string }>
  TEST_USER_A.id = usersArray.find(u => u.email === TEST_USER_A.email)!.id
  TEST_USER_B.id = usersArray.find(u => u.email === TEST_USER_B.email)!.id
})

async function signIn(page: Page, email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const res = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: key, 'Content-Type': 'application/json' },
    data: { email, password },
  })
  
  const body = await res.json()
  if (!body.access_token) throw new Error(`Auth failed: ${JSON.stringify(body)}`)

  const projectRef = new URL(url).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

  await page.context().addCookies([
    {
      name: cookieName,
      value: encodeURIComponent(JSON.stringify([body.access_token, body.refresh_token])),
      domain: new URL(baseURL).hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

async function createItem(reporterId: string, title: string): Promise<string> {
  const { data, error } = await supabase
    .from('items')
    .insert({
      reporter_id: reporterId,
      report_type: 'found',
      status: 'open',
      category: 'electronics',
      title,
      description: 'Test item',
      location_text: 'Test Location',
      date_occurred: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create item: ${error?.message}`)
  const itemId = (data as { id: string }).id
  testItemIds.push(itemId)
  return itemId
}

async function createClaim(claimantId: string, itemId: string): Promise<string> {
  const { data, error } = await supabase
    .from('claims')
    .insert({
      claimant_id: claimantId,
      item_id: itemId,
      status: 'pending',
      proof_text: 'Test proof',
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(`Failed to create claim: ${error?.message}`)
  const claimId = (data as { id: string }).id
  testClaimIds.push(claimId)
  return claimId
}

test.afterAll(async () => {
  if (testClaimIds.length > 0) {
    await supabase.from('claims').delete().in('id', testClaimIds)
  }
  if (testItemIds.length > 0) {
    await supabase.from('items').delete().in('id', testItemIds)
  }
})

test('DASH-01: Dashboard loads and shows user items', async ({ page }) => {
  const itemId = await createItem(TEST_USER_A.id, 'Test Item DASH-01')
  await signIn(page, TEST_USER_A.email, TEST_USER_A.password)
  
  await page.goto('/dashboard')
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 })
  
  // Verify item appears (may be in any format)
  await expect(page.locator(`text=Test Item DASH-01`)).toBeVisible({ timeout: 5000 })
})

test('DASH-03: Delete item from dashboard', async ({ page }) => {
  const itemId = await createItem(TEST_USER_A.id, 'To Delete DASH-03')
  await signIn(page, TEST_USER_A.email, TEST_USER_A.password)
  
  await page.goto('/dashboard')
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  await page.waitForTimeout(1000)
  
  // Try to find delete button
  const deleteButton = page.locator('[data-testid="delete-item-button"]').first()
  if (await deleteButton.isVisible({ timeout: 2000 })) {
    await deleteButton.click()
    
    // Confirm
    const confirmButton = page.locator('[data-testid="confirm-delete"]')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
      await page.waitForURL('/dashboard**', { timeout: 5000 })
    }
  }
  
  // Verify deleted in DB
  const { data: item } = await supabase
    .from('items')
    .select('id')
    .eq('id', itemId)
    .single()
  
  expect(item).toBeNull()
})

test('DASH-04: Withdraw claim', async ({ page }) => {
  const itemId = await createItem(TEST_USER_A.id, 'Item DASH-04')
  const claimId = await createClaim(TEST_USER_B.id, itemId)
  
  await signIn(page, TEST_USER_B.email, TEST_USER_B.password)
  
  await page.goto('/dashboard?tab=claims')
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  await page.waitForTimeout(1000)
  
  // Try to find withdraw button
  const withdrawButton = page.locator('[data-testid="withdraw-claim-button"]').first()
  if (await withdrawButton.isVisible({ timeout: 2000 })) {
    await withdrawButton.click()
    
    const confirmButton = page.locator('[data-testid="confirm-withdraw"]')
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click()
      await page.waitForURL('/dashboard**', { timeout: 5000 })
    }
  }
  
  // Verify withdrawn in DB
  const { data: claim } = await supabase
    .from('claims')
    .select('status')
    .eq('id', claimId)
    .single()
  
  expect((claim as { status: string }).status).toBe('withdrawn')
})

test('DASH-05: Cannot see other users items', async ({ page }) => {
  const itemId = await createItem(TEST_USER_A.id, 'User A Item DASH-05')
  await signIn(page, TEST_USER_B.email, TEST_USER_B.password)
  
  await page.goto('/dashboard')
  await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
  
  // User B should NOT see User A's item
  await expect(page.locator('text=User A Item DASH-05')).not.toBeVisible()
})

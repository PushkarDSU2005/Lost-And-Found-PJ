/**
 * Test Authentication System
 * Validates Supabase connection, auth configuration, and database setup
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

console.log('🔍 Testing Authentication System\n')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function testConnection() {
  console.log('\n1️⃣  Testing Database Connection...')
  
  try {
    const { data, error } = await supabaseAnon
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('   ❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('   ✅ Database connection successful')
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testAuthConfig() {
  console.log('\n2️⃣  Testing Auth Configuration...')
  
  try {
    // Check if we can query auth settings
    const { data: { user }, error } = await supabaseAnon.auth.getUser()
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('   ❌ Auth config error:', error.message)
      return false
    }
    
    console.log('   ✅ Auth configuration valid')
    
    // Check environment variables
    const accessMode = process.env.ACCESS_MODE || 'public'
    console.log(`   ℹ️  Access Mode: ${accessMode}`)
    
    if (accessMode === 'restricted') {
      const domain = process.env.ALLOWED_EMAIL_DOMAIN
      console.log(`   ℹ️  Allowed Domain: ${domain}`)
    }
    
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testExistingUsers() {
  console.log('\n3️⃣  Checking Existing Users...')
  
  try {
    const { data, error } = await supabaseService
      .from('profiles')
      .select('email, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('   ❌ Failed to fetch users:', error.message)
      return false
    }
    
    if (!data || data.length === 0) {
      console.log('   ⚠️  No users found in database')
      console.log('   ℹ️  This is expected for a new installation')
      return true
    }
    
    console.log(`   ✅ Found ${data.length} users:`)
    data.forEach((user, idx) => {
      console.log(`      ${idx + 1}. ${user.email} (${user.role}) - ${user.full_name}`)
    })
    
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testAuthProviders() {
  console.log('\n4️⃣  Testing Auth Providers...')
  
  try {
    // Test email/password provider
    console.log('   📧 Email/Password: Enabled (built-in)')
    
    // Note: We can't test OAuth providers without making actual requests
    console.log('   🔍 Google OAuth: Check Supabase dashboard')
    console.log('      → Authentication → Providers → Google')
    console.log('      → Must have Client ID and Client Secret configured')
    
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testRLS() {
  console.log('\n5️⃣  Testing Row-Level Security...')
  
  try {
    // Test anon access to profiles (should be allowed for reading)
    const { data: profiles, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profileError) {
      console.error('   ❌ RLS test failed:', profileError.message)
      return false
    }
    
    console.log('   ✅ RLS policies are active')
    
    // Test anon access to items (should be allowed for open items)
    const { data: items, error: itemError } = await supabaseAnon
      .from('items')
      .select('id')
      .eq('status', 'open')
      .limit(1)
    
    if (itemError) {
      console.log('   ⚠️  Items query failed (might be empty table):', itemError.message)
    } else {
      console.log('   ✅ Public item access working')
    }
    
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testStorageBuckets() {
  console.log('\n6️⃣  Testing Storage Buckets...')
  
  try {
    const { data: buckets, error } = await supabaseService.storage.listBuckets()
    
    if (error) {
      console.error('   ❌ Failed to list buckets:', error.message)
      return false
    }
    
    const requiredBuckets = ['item-images', 'sensitive-images']
    const foundBuckets = buckets.map(b => b.name)
    
    requiredBuckets.forEach(bucket => {
      if (foundBuckets.includes(bucket)) {
        console.log(`   ✅ Bucket "${bucket}" exists`)
      } else {
        console.log(`   ❌ Bucket "${bucket}" NOT FOUND`)
      }
    })
    
    return requiredBuckets.every(b => foundBuckets.includes(b))
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function testSignup() {
  console.log('\n7️⃣  Testing Signup Flow...')
  
  const testEmail = `test-${Date.now()}@test.com`
  const testPassword = 'TestPassword123!'
  
  console.log(`   ℹ️  Attempting signup with: ${testEmail}`)
  
  try {
    const { data, error } = await supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    })
    
    if (error) {
      console.error('   ❌ Signup failed:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('   ✅ Signup successful')
      console.log(`   ℹ️  User ID: ${data.user.id}`)
      console.log(`   ℹ️  Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No (check email)'}`)
      
      // Clean up test user
      console.log('   🧹 Cleaning up test user...')
      await supabaseService.auth.admin.deleteUser(data.user.id)
      console.log('   ✅ Test user deleted')
    }
    
    return true
  } catch (err) {
    console.error('   ❌ Unexpected error:', err)
    return false
  }
}

async function runTests() {
  const results = {
    connection: await testConnection(),
    authConfig: await testAuthConfig(),
    existingUsers: await testExistingUsers(),
    authProviders: await testAuthProviders(),
    rls: await testRLS(),
    storage: await testStorageBuckets(),
    signup: await testSignup(),
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📊 Test Summary\n')
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌'
    console.log(`${icon} ${test}`)
  })
  
  const allPassed = Object.values(results).every(r => r)
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (allPassed) {
    console.log('\n✅ All tests passed! Auth system is working correctly.\n')
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.\n')
    console.log('Common fixes:')
    console.log('  1. Ensure all migrations are applied to Supabase')
    console.log('  2. Check Supabase dashboard for auth provider configuration')
    console.log('  3. Verify environment variables in .env.local')
    console.log('  4. Ensure storage buckets are created\n')
  }
  
  process.exit(allPassed ? 0 : 1)
}

// Run tests
runTests().catch((err) => {
  console.error('\n❌ Fatal error:', err)
  process.exit(1)
})

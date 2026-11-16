#!/usr/bin/env tsx
/**
 * Environment Doctor - Diagnoses backend errors by validating:
 * - Environment variables
 * - Database schema (tables, RLS, functions, triggers)
 * - Storage buckets and policies
 * - Auth configuration
 * - External services (Resend)
 */

import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function pass(check: string) {
  log(`✓ ${check}`, 'green')
}

function fail(check: string, reason: string) {
  log(`✗ ${check}`, 'red')
  log(`  ${reason}`, 'gray')
}

function warn(check: string, reason: string) {
  log(`⚠ ${check}`, 'yellow')
  log(`  ${reason}`, 'gray')
}

// Environment variable schema
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  ACCESS_MODE: z.enum(['public', 'private']).optional(),
  ALLOWED_EMAIL_DOMAIN: z.string().optional(),
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  CRON_SECRET: z.string().min(32).optional(),
})

async function checkEnvironmentVariables(): Promise<boolean> {
  log('\n🔍 Checking environment variables...', 'blue')
  
  try {
    const env = envSchema.parse(process.env)
    
    pass('NEXT_PUBLIC_SUPABASE_URL is set and valid')
    pass('NEXT_PUBLIC_SUPABASE_ANON_KEY is set')
    pass('SUPABASE_SERVICE_ROLE_KEY is set')
    
    if (env.ACCESS_MODE) {
      pass(`ACCESS_MODE is set to "${env.ACCESS_MODE}"`)
    } else {
      warn('ACCESS_MODE not set', 'Defaults to "public" - set explicitly in production')
    }
    
    if (env.ALLOWED_EMAIL_DOMAIN) {
      pass(`ALLOWED_EMAIL_DOMAIN is set to "${env.ALLOWED_EMAIL_DOMAIN}"`)
    } else {
      warn('ALLOWED_EMAIL_DOMAIN not set', 'Email domain restriction will not work')
    }
    
    if (env.RESEND_API_KEY) {
      pass('RESEND_API_KEY is set')
    } else {
      warn('RESEND_API_KEY not set', 'Email notifications will not work')
    }
    
    if (env.CRON_SECRET) {
      pass('CRON_SECRET is set')
    } else {
      warn('CRON_SECRET not set', 'Cron jobs will be unprotected')
    }
    
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        fail(issue.path.join('.'), issue.message)
      }
    }
    return false
  }
}

async function checkDatabaseSchema(): Promise<boolean> {
  log('\n🗄️  Checking database schema...', 'blue')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    fail('Cannot connect to database', 'Missing SUPABASE credentials')
    return false
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  // Check required tables
  const requiredTables = [
    'profiles',
    'locations',
    'items',
    'item_images',
    'claims',
    'notifications',
  ]
  
  let allTablesExist = true
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1)
      
      if (error) {
        fail(`Table "${table}" check failed`, error.message)
        allTablesExist = false
      } else {
        pass(`Table "${table}" exists`)
      }
    } catch (error) {
      fail(`Table "${table}" check failed`, String(error))
      allTablesExist = false
    }
  }
  
  // Check RLS is enabled (this requires checking pg_tables via RPC or direct query)
  // For now, we'll just note that RLS should be checked manually
  warn('RLS status check', 'Run: SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\';')
  
  // Check for key functions
  log('\n📦 Checking database functions...', 'blue')
  
  try {
    // Try to call match_items function
    const { error: matchError } = await supabase.rpc('match_items', {
      p_item_id: '00000000-0000-0000-0000-000000000000',
    })
    
    // 42883 = function does not exist
    if (matchError && matchError.code === '42883') {
      fail('Function "match_items"', 'Does not exist')
    } else {
      pass('Function "match_items" exists')
    }
  } catch (error) {
    warn('Function check', 'Could not verify match_items function')
  }
  
  return allTablesExist
}

async function checkStorageBuckets(): Promise<boolean> {
  log('\n📂 Checking storage buckets...', 'blue')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    fail('Cannot connect to storage', 'Missing SUPABASE credentials')
    return false
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  let allBucketsValid = true
  
  // Check item-images bucket (public)
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      fail('Cannot list storage buckets', error.message)
      return false
    }
    
    const itemImagesBucket = buckets?.find(b => b.name === 'item-images')
    const sensitiveImagesBucket = buckets?.find(b => b.name === 'sensitive-images')
    
    if (itemImagesBucket) {
      if (itemImagesBucket.public) {
        pass('Bucket "item-images" exists and is PUBLIC')
      } else {
        fail('Bucket "item-images"', 'Exists but is NOT public (should be public)')
        allBucketsValid = false
      }
    } else {
      fail('Bucket "item-images"', 'Does not exist')
      allBucketsValid = false
    }
    
    if (sensitiveImagesBucket) {
      if (!sensitiveImagesBucket.public) {
        pass('Bucket "sensitive-images" exists and is PRIVATE')
      } else {
        fail('Bucket "sensitive-images"', 'Exists but is PUBLIC (should be private)')
        allBucketsValid = false
      }
    } else {
      fail('Bucket "sensitive-images"', 'Does not exist')
      allBucketsValid = false
    }
  } catch (error) {
    fail('Storage bucket check failed', String(error))
    return false
  }
  
  return allBucketsValid
}

async function checkAuthConfiguration(): Promise<void> {
  log('\n🔐 Checking auth configuration...', 'blue')
  
  warn('Auth provider check', 'Cannot be verified via API - check manually in Supabase Dashboard')
  
  log('\n  Manual steps to verify:', 'gray')
  log('  1. Go to: Supabase Dashboard → Authentication → Providers', 'gray')
  log('  2. Ensure "Email" provider is enabled', 'gray')
  log('  3. If using Google OAuth, ensure it is configured with:', 'gray')
  log('     - Client ID and Client Secret from Google Cloud Console', 'gray')
  log('     - Authorized redirect URI: {your-supabase-url}/auth/v1/callback', 'gray')
  log('  4. Go to: Authentication → URL Configuration', 'gray')
  log('  5. Set Site URL to: http://localhost:3000 (dev) or your production URL', 'gray')
  log('  6. Add redirect URLs:', 'gray')
  log('     - http://localhost:3000/auth/callback', 'gray')
  log('     - {your-production-url}/auth/callback', 'gray')
}

async function checkResendKey(): Promise<boolean> {
  log('\n📧 Checking Resend API key...', 'blue')
  
  const resendKey = process.env.RESEND_API_KEY
  
  if (!resendKey) {
    warn('RESEND_API_KEY not set', 'Email sending will not work')
    return true // Not critical for dev
  }
  
  if (!resendKey.startsWith('re_')) {
    fail('RESEND_API_KEY format', 'Should start with "re_"')
    return false
  }
  
  // Try a dry-run validation (if Resend SDK allows it)
  // For now, just check format
  pass('RESEND_API_KEY format is valid')
  warn('Resend API validation', 'Cannot test without sending an email - will verify when used')
  
  return true
}

async function checkMigrations(): Promise<void> {
  log('\n🔄 Checking migrations...', 'blue')
  
  log('  To verify all migrations are applied:', 'gray')
  log('  1. Run: supabase db pull (if using Supabase CLI)', 'gray')
  log('  2. Or check in Supabase Dashboard → Database → Migrations', 'gray')
  log('  3. Ensure all files in /supabase/migrations are applied', 'gray')
  
  warn('Migration status', 'Cannot verify automatically - check manually')
}

async function main() {
  log('╔═══════════════════════════════════════════════╗', 'blue')
  log('║   CampusFind Environment Doctor               ║', 'blue')
  log('║   Diagnosing backend errors...                ║', 'blue')
  log('╚═══════════════════════════════════════════════╝', 'blue')
  
  const results = {
    env: await checkEnvironmentVariables(),
    db: await checkDatabaseSchema(),
    storage: await checkStorageBuckets(),
    resend: await checkResendKey(),
  }
  
  await checkAuthConfiguration()
  await checkMigrations()
  
  log('\n' + '═'.repeat(50), 'blue')
  log('Summary', 'blue')
  log('═'.repeat(50), 'blue')
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    log('\n✓ All automated checks PASSED', 'green')
    log('\n⚠️  Manual verification steps remain:', 'yellow')
    log('  - Auth providers configuration (see above)', 'gray')
    log('  - RLS policies enabled on all tables', 'gray')
    log('  - All migrations applied', 'gray')
  } else {
    log('\n✗ Some checks FAILED', 'red')
    log('\nFix the errors above and run again: pnpm doctor', 'gray')
    process.exit(1)
  }
}

main().catch((error) => {
  log('\n✗ Doctor script crashed', 'red')
  console.error(error)
  process.exit(1)
})

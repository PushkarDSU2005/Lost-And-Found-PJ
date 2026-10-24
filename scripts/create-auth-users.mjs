/**
 * scripts/create-auth-users.mjs
 * ==============================
 * Creates (or confirms existence of) the four seed test users via the
 * Supabase Auth Admin API, using real UUIDs assigned by GoTrue.
 * 
 * Outputs the real UUIDs so they can be patched into the DB and test constants.
 * Safe to re-run — uses createUser which errors if email already exists,
 * so we catch that and fetch the existing user instead.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

function loadEnvFile(p) {
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i === -1) continue
      const k = t.slice(0, i).trim(), v = t.slice(i + 1).trim()
      if (!process.env[k]) process.env[k] = v
    }
  } catch {}
}
loadEnvFile(envPath)

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SVC = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !SVC) { console.error('Missing env vars'); process.exit(1) }

const supabase = createClient(URL, SVC, { auth: { persistSession: false } })

const PASSWORD = 'TestPassword123!'

const DESIRED = [
  { label: 'admin',    email: 'admin@university.edu',  fullName: 'Campus Admin'   },
  { label: 'studentA', email: 'alice@university.edu',  fullName: 'Alice Nguyen'   },
  { label: 'studentB', email: 'bob@university.edu',    fullName: 'Bob Okafor'     },
  { label: 'studentC', email: 'carol@university.edu',  fullName: 'Carol Martinez' },
]

console.log('Creating / resolving Auth users…\n')

const results = []

for (const u of DESIRED) {
  // Try creating fresh
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.fullName },
  })

  if (!createErr) {
    console.log(`✓ Created  ${u.label}: ${created.user.id}  (${u.email})`)
    results.push({ ...u, id: created.user.id })
    continue
  }

  // If it already exists, list users and find by email
  if (createErr.message.toLowerCase().includes('already') ||
      createErr.message.toLowerCase().includes('duplicate') ||
      createErr.message.toLowerCase().includes('unique')) {
    // Use admin list with email filter
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 50 })
    if (listErr) {
      console.error(`✗ Cannot list users: ${listErr.message}`)
      process.exit(1)
    }
    const found = list.users.find(uu => uu.email === u.email)
    if (found) {
      // Set password to make sure it's correct
      await supabase.auth.admin.updateUserById(found.id, { password: PASSWORD, email_confirm: true })
      console.log(`↺ Exists   ${u.label}: ${found.id}  (${u.email})`)
      results.push({ ...u, id: found.id })
      continue
    }
  }

  console.error(`✗ Failed   ${u.label} (${u.email}): ${createErr.message}`)
  process.exit(1)
}

console.log('\n── Real UUIDs ──────────────────────────────────────────────')
for (const r of results) {
  console.log(`${r.label.padEnd(10)} ${r.id}  ${r.email}`)
}

// Write to a temp file so the patch script can read it without re-running
const outPath = resolve(__dirname, 'real-uuids.json')
writeFileSync(outPath, JSON.stringify(results, null, 2))
console.log(`\n✓ UUIDs written to ${outPath}`)
console.log('  (this file is gitignored — do not commit it)')

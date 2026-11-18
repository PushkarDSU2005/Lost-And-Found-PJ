# Integration Tests Setup

Integration tests require **seed data** in your Supabase database. Without it, tests will fail with missing item errors.

## Prerequisites

1. Supabase project created
2. All migrations applied (001-014)
3. Test users created in Supabase Auth

## Step 1: Create Test Users

Run this script to create the test users in Supabase Auth:

```bash
node scripts/create-real-users.mjs
```

This creates:
- `pushkarraj11a7317@gmail.com` (admin)
- `avikjaiswal01@gmail.com` (studentA)  
- `myoneplus373@gmail.com` (studentB)

## Step 2: Load Seed Data

Go to your Supabase Dashboard → SQL Editor, then run:

```sql
-- Copy and paste the contents of scripts/reseed-real-uuids.sql
```

This will:
1. Delete old zero-UUID seed rows
2. Create proper auth.users row for studentC (seed-only user)
3. Create profiles for all users
4. Insert seed items with stable UUIDs

The seed items include:
- iPhone (lost, electronics, studentA)
- Earbuds (found, electronics, studentB) ← **Required for tests**
- Jacket (lost, clothing, studentA)
- Charger (found, electronics, studentA)
- Keys, textbooks, etc.

## Step 3: Verify Seed Data

Run this query to check:

```sql
SELECT id, title, report_type, reporter_id 
FROM items 
WHERE id = '20000000-0000-0000-0000-000000000002';
```

Should return the earbuds item.

## Step 4: Enable Integration Tests in CI

After loading seed data, enable integration tests in GitHub:

1. Go to **Settings → Secrets and variables → Actions → Variables**
2. Click **New repository variable**
3. Name: `INTEGRATION_TESTS_ENABLED`
4. Value: `true`

## Running Integration Tests Locally

```bash
# With seed data loaded
pnpm test:integration

# Specific test file
pnpm test:integration tests/integration/browse.test.ts
```

## Common Errors

### "expected [] to include '20000000-0000-0000-0000-000000000002'"

**Cause**: Seed data not loaded  
**Fix**: Run `scripts/reseed-real-uuids.sql` in Supabase SQL Editor

### "headers() was called outside a request scope"

**Cause**: Fixed in lib/security.ts with try-catch  
**Status**: Should not occur anymore

### "expected false to be true"

**Cause**: Database operation failed, check Supabase logs  
**Fix**: Verify RLS policies are applied (migration 005_rls.sql)

## Maintenance

Re-run the seed script after:
- Deleting test data manually
- Resetting your database
- Switching Supabase projects

---

**Note**: Integration tests are **optional** for local development. Unit tests and E2E tests provide good coverage without needing seed data.

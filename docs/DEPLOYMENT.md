# Deployment Guide

Complete guide to deploy CampusFind Lost & Found to production.

## Pre-Deployment Checklist

- [ ] All tests passing (`pnpm verify`)
- [ ] Environment variables documented
- [ ] Supabase project created
- [ ] Database migrations ready
- [ ] Storage buckets configured
- [ ] RLS policies enabled
- [ ] Email service configured (Resend)
- [ ] Domain name ready (optional)

---

## 1. Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose organization, name, database password, region
4. Wait for project to provision (~2 minutes)

### 1.2 Run Migrations

**Option A: Supabase CLI** (recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

**Option B: SQL Editor**

1. Go to **SQL Editor** in Supabase dashboard
2. Run each migration file in order (001 → 014):
   - `supabase/migrations/001_extensions_enums.sql`
   - `supabase/migrations/002_tables.sql`
   - ... (all files in order)
   - `supabase/migrations/014_performance_indexes.sql`

### 1.3 Configure Storage

Storage buckets are created by migration `004_storage.sql`, but verify:

1. Go to **Storage** in Supabase dashboard
2. Confirm buckets exist:
   - `item-images` (public, 5MB limit)
   - `sensitive-images` (private, 10MB limit)

### 1.4 Get API Keys

1. Go to **Settings → API**
2. Copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) ⚠️ Keep secret!

---

## 2. Email Setup (Resend)

### 2.1 Create Account

1. Go to [resend.com](https://resend.com)
2. Sign up / log in
3. Verify your sending domain (or use onboarding@resend.dev for testing)

### 2.2 Get API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Copy the key (`RESEND_API_KEY`)

---

## 3. Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`

### 3.2 Environment Variables

Add all variables from `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb... # ⚠️ KEEP SECRET

# Access Control
ACCESS_MODE=restricted
ALLOWED_EMAIL_DOMAIN=youruniversity.edu

# Email
RESEND_API_KEY=re_xxxxx

# Cron Secret
CRON_SECRET=generate-a-random-string-here
```

**Generate CRON_SECRET**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployment URL

---

## 4. Post-Deployment Configuration

### 4.1 Configure Supabase Auth Redirect

1. Go to **Authentication → URL Configuration** in Supabase
2. Add **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### 4.2 Set up Cron Jobs (Vercel Cron)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-items",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/send-notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Redeploy after adding `vercel.json`.

### 4.3 Create Admin User

**Option A: Via Supabase Dashboard**

1. Go to **Authentication → Users**
2. Click **Add User**
3. Enter email, password
4. After user is created, go to **Table Editor → profiles**
5. Find the user, set `role = 'admin'`

**Option B: Via SQL**

```sql
-- Get the user's ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'admin@youruniversity.edu';

-- Update their role
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-uuid-from-above';
```

### 4.4 Verify RLS Policies

RLS policies are created by migration `005_rls.sql`. Verify they're enabled:

```sql
-- Should return true for all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 5. Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Go to project **Settings → Domains**
2. Add your custom domain (e.g., `lost.youruniversity.edu`)
3. Follow DNS instructions

### 5.2 Update Supabase Auth URLs

1. Go to **Authentication → URL Configuration**
2. Update **Site URL** to your custom domain
3. Update **Redirect URLs** to `https://your-custom-domain.com/auth/callback`

---

## 6. Monitoring & Maintenance

### 6.1 Supabase Dashboard

- **Database**: Monitor query performance, table sizes
- **Storage**: Track storage usage
- **Auth**: Monitor sign-ups, active users
- **Logs**: Check for errors

### 6.2 Vercel Dashboard

- **Analytics**: Page views, Web Vitals
- **Logs**: Function logs, build logs
- **Speed Insights**: Real user performance data

### 6.3 Regular Maintenance

- **Weekly**: Check cron job logs (`/api/cron/*`)
- **Monthly**: Review storage usage, expired items
- **Quarterly**: Audit admin users, review RLS policies

---

## 7. Rollback Plan

### 7.1 Vercel Rollback

1. Go to **Deployments** in Vercel dashboard
2. Find previous working deployment
3. Click **⋯ → Promote to Production**

### 7.2 Database Rollback

⚠️ **No automated rollback**. Always test migrations in staging first.

**Manual rollback steps**:
1. Identify which migration caused the issue
2. Write a reverse migration
3. Test in local environment
4. Apply to production via SQL Editor

---

## 8. Troubleshooting

### Build Fails

```bash
# Check locally first
pnpm verify

# Check Vercel logs
# Project → Deployments → [Failed Deployment] → Building
```

### Auth Not Working

- Verify redirect URLs in Supabase match your deployment URL
- Check `NEXT_PUBLIC_SUPABASE_*` variables are set correctly
- Clear browser cookies, try incognito mode

### Images Not Uploading

- Verify storage buckets exist in Supabase
- Check RLS policies on `storage.objects`
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

### Emails Not Sending

- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for delivery logs
- Ensure `FROM_EMAIL` in code matches verified domain

### Cron Jobs Not Running

- Verify `vercel.json` is committed and deployed
- Check `CRON_SECRET` environment variable
- View cron logs: Project → Settings → Cron Jobs

---

## 9. Environment Variables Reference

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | `https://xxx.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `eyJhb...` | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | `eyJhb...` | **SECRET** |
| `ACCESS_MODE` | ✅ | `restricted` or `public` | Controls signup access |
| `ALLOWED_EMAIL_DOMAIN` | ⚠️ | `university.edu` | Required if `ACCESS_MODE=restricted` |
| `RESEND_API_KEY` | ✅ | `re_xxx` | **SECRET** |
| `CRON_SECRET` | ✅ | `random-string` | **SECRET** - for cron auth |

---

## 10. Production Checklist

Before going live:

- [ ] All migrations applied successfully
- [ ] Storage buckets created and accessible
- [ ] RLS policies enabled and tested
- [ ] Admin user created and verified
- [ ] Auth redirect URLs configured
- [ ] Email sending tested (Resend)
- [ ] Cron jobs scheduled and tested
- [ ] Custom domain configured (if applicable)
- [ ] Analytics/monitoring enabled
- [ ] Error tracking set up (Sentry, optional)
- [ ] Backup strategy defined

---

## 11. Performance Optimization

### 11.1 Supabase

- **Connection pooling**: Enabled by default
- **Database indexes**: Created by migration `014_performance_indexes.sql`
- **Query optimization**: Use `.select('column1, column2')` instead of `.*`

### 11.2 Vercel

- **Edge Functions**: Consider for high-traffic endpoints
- **Image Optimization**: Next.js `<Image>` component auto-optimizes
- **Caching**: Set appropriate `Cache-Control` headers

### 11.3 Monitoring

```bash
# Run Lighthouse audit
pnpm test:e2e tests/e2e/performance.spec.ts

# Check Core Web Vitals in Vercel dashboard
# Project → Analytics → Web Vitals
```

---

## 12. Security Hardening

### 12.1 Supabase

- ✅ RLS policies enabled on all tables
- ✅ Service role key kept secret (never exposed to client)
- ✅ Storage RLS policies prevent unauthorized access

### 12.2 Next.js

- ✅ CSRF protection via SameSite cookies
- ✅ Input validation with Zod schemas
- ✅ Server Actions use `safeAction` wrapper
- ✅ No sensitive data in client components

### 12.3 Regular Updates

```bash
# Check for security vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Test after updates
pnpm verify
```

---

## Support

- **Documentation**: See `/docs` directory
- **Issues**: Check GitHub Issues
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Last Updated**: Phase 8 Complete (Production-Ready)

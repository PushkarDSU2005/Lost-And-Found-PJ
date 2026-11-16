# Authentication Setup Guide

Complete guide for setting up authentication in CampusFind Lost & Found.

## Table of Contents

1. [Overview](#overview)
2. [Supabase Auth Configuration](#supabase-auth-configuration)
3. [Google OAuth Setup](#google-oauth-setup)
4. [Email Configuration (Resend)](#email-configuration-resend)
5. [Domain Restriction](#domain-restriction)
6. [Testing Auth](#testing-auth)
7. [Troubleshooting](#troubleshooting)

---

## Overview

CampusFind uses **Supabase Auth** for authentication with the following features:

- **Email/password** authentication with password strength validation
- **Google OAuth** with domain restriction
- **Email verification** for new accounts
- **Password reset** flow
- **Protected routes** via middleware
- **Role-based access control** (student, staff, admin)
- **Rate limiting** on auth endpoints (IP-based)

### Access Modes

Set `ACCESS_MODE` in `.env.local`:

- **`public`** — Anyone can sign up with any email
- **`restricted`** — Only emails from `ALLOWED_EMAIL_DOMAIN` can sign up
- **`private`** — No signups allowed (admin creates accounts manually)

---

## Supabase Auth Configuration

### 1. Enable Email Provider

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email settings:
   - **Enable email confirmations** ✅ (recommended for production)
   - **Secure email change** ✅
   - **Enable single session per user** ❌ (allow multiple devices)

### 2. Configure Email Templates

Go to **Authentication** → **Email Templates** and customize:

#### Confirm Signup Template

**Subject:** `Verify your email for CampusFind`

**Body:**
```html
<h2>Welcome to CampusFind!</h2>
<p>Click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
<p>This link expires in 24 hours.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

#### Reset Password Template

**Subject:** `Reset your CampusFind password`

**Body:**
```html
<h2>Password Reset</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### 3. Configure Site URL and Redirect URLs

Go to **Authentication** → **URL Configuration**:

- **Site URL:** `https://your-domain.com` (production) or `http://localhost:3000` (dev)
- **Redirect URLs:** Add these:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://your-domain.com/reset-password`

### 4. Set Password Requirements

Go to **Authentication** → **Policies**:

- **Minimum password length:** 8 characters (enforced in app)
- **Password complexity:** Not enforced by Supabase (handled client-side)

---

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Name: `CampusFind Lost & Found`
7. **Authorized JavaScript origins:**
   - `http://localhost:3000`
   - `https://your-domain.com`
8. **Authorized redirect URIs:**
   - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
9. Save the **Client ID** and **Client Secret**

### 2. Configure Google Provider in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Enable **Google** provider
3. Enter your **Client ID** and **Client Secret**
4. **Enable**: ✅ Enabled
5. **Skip nonce check**: ❌ (keep disabled for security)
6. Click **Save**

### 3. Test Google OAuth

1. Start dev server: `pnpm dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google"
4. You should be redirected to Google sign-in
5. After authorization, you'll be redirected back to the app

**Note:** Google OAuth respects `ALLOWED_EMAIL_DOMAIN` setting. If a user signs in with a non-allowed domain, they will be signed out immediately with an error message.

---

## Email Configuration (Resend)

For production email delivery (verification emails, password reset):

### 1. Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain or use Resend's test domain
3. Create an API key in **Settings** → **API Keys**
4. Copy the API key

### 2. Configure Supabase to Use Resend

1. Go to **Supabase Dashboard** → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. **Enable Custom SMTP**: ✅
4. **SMTP Host:** `smtp.resend.com`
5. **SMTP Port:** `465`
6. **SMTP User:** `resend`
7. **SMTP Password:** Your Resend API key
8. **Sender email:** `noreply@your-domain.com`
9. **Sender name:** `CampusFind`
10. Click **Save**

### 3. Add API Key to Environment

```bash
RESEND_API_KEY=re_YourResendAPIKey
```

**Note:** Currently the app doesn't send custom emails via Resend. Supabase handles all auth emails through its built-in system. The `RESEND_API_KEY` is reserved for future features (notifications, claim updates, etc).

---

## Domain Restriction

### How It Works

When `ACCESS_MODE=restricted`:

1. **Email signups** are validated server-side in `app/actions/auth.ts`
2. **Google OAuth signups** are validated in `/auth/callback` route
3. If domain doesn't match `ALLOWED_EMAIL_DOMAIN`, signup is rejected
4. For OAuth, the user account is deleted if domain is invalid

### Configuration

In `.env.local`:

```bash
ACCESS_MODE=restricted
ALLOWED_EMAIL_DOMAIN=college.edu
```

### Testing Domain Restriction

**Test 1: Valid domain (should succeed)**
```bash
# Try signing up with valid email
Email: student@college.edu
Expected: Account created, verification email sent
```

**Test 2: Invalid domain (should fail)**
```bash
# Try signing up with invalid email
Email: user@gmail.com
Expected: Error: "Only college.edu email addresses are allowed to register."
```

**Test 3: Google OAuth with invalid domain**
```bash
# Sign in with Google using @gmail.com account
Expected: Account created then immediately deleted
         Redirect to login with error message
```

---

## Testing Auth

### Manual Test Accounts

Create test users in Supabase Dashboard:

1. Go to **Authentication** → **Users** → **Add user**
2. Create these accounts:

**Admin:**
- Email: `admin@college.edu`
- Password: (set manually)
- Metadata: `{"role": "admin"}`

**Student A:**
- Email: `student1@college.edu`
- Password: (set manually)
- Metadata: `{"role": "student"}`

**Student B:**
- Email: `student2@college.edu`
- Password: (set manually)
- Metadata: `{"role": "student"}`

### Test Flows

#### 1. Email Signup Flow

1. Go to `/signup`
2. Fill form with valid email/password
3. Check password strength meter (should turn green)
4. Submit form
5. Check for success message
6. Check email for verification link
7. Click verification link
8. Should redirect to home with success message

#### 2. Login Flow

1. Go to `/login`
2. Enter email/password
3. Submit form
4. Should redirect to home with user avatar in navbar
5. Click avatar → dropdown menu should appear
6. Should see Dashboard, My Items, Messages, Settings
7. Admin users should see "Admin Panel" option

#### 3. Password Reset Flow

1. Go to `/login`
2. Click "Forgot password?"
3. Enter email
4. Submit form
5. Check for success message
6. Check email for reset link
7. Click reset link
8. Enter new password (check strength meter)
9. Submit form
10. Should show success message then redirect to login

#### 4. Google OAuth Flow

1. Go to `/login`
2. Click "Continue with Google"
3. Choose Google account
4. Grant permissions
5. Should redirect to home with user logged in
6. Check navbar for avatar

#### 5. Protected Routes

**Test as guest:**
```bash
# Visit protected route
/report → should redirect to /login?next=/report
/my-items → should redirect to /login?next=/my-items
/admin → should redirect to /login?next=/admin
```

**Test as student:**
```bash
# Visit allowed routes
/report → should load
/my-items → should load
/dashboard → should load

# Visit admin route
/admin → should redirect to home (not authorized)
```

**Test as admin:**
```bash
# Visit admin route
/admin → should load (authorized)
```

---

## Troubleshooting

### Email verification not working

**Symptom:** Users don't receive verification emails

**Solutions:**
1. Check **Supabase Auth logs**: Dashboard → Authentication → Logs
2. Verify **Site URL** matches your domain
3. Check **Redirect URLs** include `/auth/callback`
4. If using custom SMTP, verify Resend credentials
5. Check spam folder
6. Enable **Email confirmations** in Supabase Auth settings

### Google OAuth redirect loop

**Symptom:** After Google sign-in, user gets stuck in redirect loop

**Solutions:**
1. Verify **Authorized redirect URIs** in Google Console includes your Supabase auth callback URL
2. Check **Site URL** in Supabase matches your domain
3. Clear cookies and try again
4. Check middleware is not interfering (inspect `/auth/callback` route)

### Domain restriction not working

**Symptom:** Users with invalid domains can still sign up

**Solutions:**
1. Verify `ACCESS_MODE=restricted` in `.env.local`
2. Verify `ALLOWED_EMAIL_DOMAIN` is set correctly
3. Check server logs for validation errors
4. Restart dev server after changing env vars

### Password reset email not received

**Symptom:** Reset password email not delivered

**Solutions:**
1. Check **Supabase Auth logs** for errors
2. Verify user email is confirmed (Dashboard → Authentication → Users)
3. Check redirect URL is set to `/reset-password`
4. Verify SMTP configuration if using custom email

### Rate limiting errors

**Symptom:** "Too many requests" errors on auth endpoints

**Solutions:**
1. Rate limits are IP-based, stored in-memory
2. Restart server to clear limits in dev
3. For production, consider using Redis (see `lib/security.ts`)
4. Current limits:
   - Login: 5 attempts/minute
   - Signup: 3 attempts/hour
   - Password reset: 3 attempts/hour
   - Resend verification: 3 attempts/hour

### Session not persisting

**Symptom:** User gets logged out on page refresh

**Solutions:**
1. Check cookies are enabled in browser
2. Verify middleware is refreshing session correctly
3. Check `createSupabaseServerClient()` in `lib/supabase/server.ts`
4. Clear all cookies and try again

### Admin routes accessible by non-admins

**Symptom:** Students can access `/admin` routes

**Solutions:**
1. Check middleware in `middleware.ts` is checking role
2. Verify user's `role` field in `profiles` table
3. Update profile role: `UPDATE profiles SET role = 'admin' WHERE email = 'admin@college.edu';`
4. Log out and back in after role change

---

## Environment Variables Reference

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ⚠️ Server-side only

# ─── Auth / Access ────────────────────────────────────────────────────────────
ACCESS_MODE=restricted                 # public | private | restricted
ALLOWED_EMAIL_DOMAIN=college.edu       # Required if ACCESS_MODE=restricted
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Update for production

# ─── Email (Resend) ───────────────────────────────────────────────────────────
RESEND_API_KEY=re_123...               # For future notification emails

# ─── Cron / Background Jobs ───────────────────────────────────────────────────
CRON_SECRET=your-secret-here           # For /api/cron routes
```

---

## Security Best Practices

1. **Never commit** `.env.local` to Git
2. **Rotate secrets** regularly (service role key, cron secret)
3. **Use HTTPS** in production (required for OAuth)
4. **Enable email verification** for production
5. **Set strong password requirements** (enforced in SignupForm)
6. **Monitor auth logs** for suspicious activity
7. **Use domain restriction** for campus-only access
8. **Enable RLS** on all tables (already configured)
9. **Rate limit** auth endpoints (already implemented)
10. **Validate redirects** to prevent open redirects (already implemented in `lib/security.ts`)

---

## Next Steps

After auth is working:

1. **Phase 3:** Implement photo upload (IMG-01 to IMG-10)
2. **Phase 4:** Build item report forms (POST-01 to POST-07)
3. **Phase 5:** Implement claims system (CLAIM-01 to CLAIM-08)
4. **Phase 6:** Add messaging (MSG-01 to MSG-04)
5. **Phase 7:** Build dashboards (DASH-01 to DASH-05)

See `TEST_PLAN.md` for complete testing checklist.

---

**Last updated:** January 2025  
**Maintainer:** CampusFind Team

# Troubleshooting Guide

Common issues and their solutions for CampusFind Lost & Found.

---

## 🔐 Authentication Issues

### "Continue with Google" Not Working

**Symptom**: Click "Continue with Google" button, nothing happens or shows error.

**Causes & Fixes**:

1. **Google OAuth not configured** ✅ MOST COMMON
   
   Google OAuth requires setup in both Google Cloud Console and Supabase.
   
   **Solution**: Follow the complete setup guide:
   ```bash
   # See detailed instructions
   docs/GOOGLE_OAUTH_SETUP.md
   ```
   
   **Quick fix if you don't need Google OAuth**:
   - Change `ACCESS_MODE=public` in `.env.local`
   - Users can sign up with email/password only
   - Optionally hide the Google button (see GOOGLE_OAUTH_SETUP.md)

2. **Redirect URI mismatch**
   
   **Error**: "redirect_uri_mismatch" from Google
   
   **Solution**:
   - Go to Google Cloud Console → Credentials
   - Add exact redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - Format must match exactly (check your Supabase project reference)

3. **Provider not enabled in Supabase**
   
   **Solution**:
   - Go to Supabase Dashboard → Authentication → Providers
   - Toggle **Google** to ON
   - Enter Client ID and Secret
   - Click **Save**

---

### Cannot Login with Email/Password

**Symptom**: Enter correct email and password, get "Invalid email or password" error.

**Causes & Fixes**:

1. **Email not verified** ✅ MOST COMMON
   
   Supabase requires email verification by default.
   
   **Solution**:
   - Check your email inbox for verification link
   - Click the link to verify
   - Try logging in again
   
   **To disable email verification (development only)**:
   - Go to Supabase Dashboard → Authentication → Providers → Email
   - Toggle **Confirm email** to OFF
   - Click **Save**

2. **Wrong password**
   
   **Solution**: Use the "Forgot password?" link on login page

3. **Account doesn't exist**
   
   **Solution**: Sign up first at `/signup`

---

### Cannot Signup with Email

**Symptom**: Fill signup form, click "Create account", get error message.

**Common Errors**:

1. **"Only example.com email addresses are allowed"** ✅ YOUR ISSUE
   
   **Cause**: `ACCESS_MODE=restricted` in `.env.local` but your email doesn't match `ALLOWED_EMAIL_DOMAIN`
   
   **Solution Option 1 - Allow all emails** (recommended for development):
   ```bash
   # In .env.local
   ACCESS_MODE=public
   # ALLOWED_EMAIL_DOMAIN=example.com  # Comment out or remove
   ```
   
   **Solution Option 2 - Change allowed domain**:
   ```bash
   # In .env.local
   ACCESS_MODE=restricted
   ALLOWED_EMAIL_DOMAIN=gmail.com  # Or your domain
   ```

2. **"An account with this email already exists"**
   
   **Cause**: You already signed up
   
   **Solution**: Use the "Sign in" link instead

3. **"Password must be at least 8 characters"**
   
   **Cause**: Weak password
   
   **Solution**: Choose stronger password (meet at least 3 requirements)

4. **"You must agree to the Terms of Service"**
   
   **Cause**: Checkbox not checked
   
   **Solution**: Check the Terms & Privacy checkbox

---

### Session/Cookie Issues

**Symptom**: Login works, but immediately logged out or redirected back to login.

**Causes & Fixes**:

1. **Middleware configuration**
   
   **Check**: `middleware.ts` file
   
   **Solution**: Ensure protected routes are correct:
   ```typescript
   export const config = {
     matcher: [
       '/dashboard/:path*',
       '/admin/:path*',
       '/report/:path*',
       '/items/:path*/claim',
       '/items/:path*/claims',
       '/messages/:path*',
     ],
   }
   ```

2. **Supabase URL mismatch**
   
   **Check**: `.env.local` has correct `NEXT_PUBLIC_SITE_URL`
   
   **Solution**:
   ```bash
   # For local development
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   
   # For production
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

3. **Auth callback not working**
   
   **Check**: `app/auth/callback/route.ts` exists
   
   **Test**: Visit `http://localhost:3000/auth/callback` (should redirect)

---

## 🖼️ Image Upload Issues

### Photos Not Uploading

**Symptom**: Select images in report form, click submit, images don't appear.

**Causes & Fixes**:

1. **Storage buckets not created** ✅ MOST COMMON
   
   **Solution**: Run migrations to create buckets:
   ```bash
   # Check if buckets exist
   pnpm test:auth
   
   # If missing, run migration 004_storage.sql in Supabase SQL Editor
   ```

2. **File too large**
   
   **Limit**: 5 MB for regular images, 10 MB for claim proof
   
   **Solution**: Compress images before upload (app does this automatically)

3. **Invalid file type**
   
   **Allowed**: JPEG, PNG, GIF, WebP only
   
   **Solution**: Convert to supported format

4. **RLS policy blocking upload**
   
   **Solution**: Run migration `005_rls.sql` to set up storage policies

---

## 🔍 Search & Browse Issues

### No Items Showing

**Symptom**: Go to `/browse`, page is empty.

**Causes & Fixes**:

1. **No items in database yet**
   
   **Solution**: Create a test item:
   - Sign up / login
   - Go to "Report Lost" or "Report Found"
   - Fill form and submit

2. **RLS policies blocking access**
   
   **Solution**: Run migration `005_rls.sql`

3. **Status filter hiding items**
   
   **Check**: Filter bar shows "Status: Open" by default
   
   **Solution**: Clear filters to see all items

---

## 🎨 UI Issues

### Page Layout Broken

**Symptom**: Styles not loading, page looks unstyled.

**Causes & Fixes**:

1. **Tailwind CSS not compiling**
   
   **Solution**: Restart dev server:
   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

2. **Build cache issue**
   
   **Solution**: Clean Next.js cache:
   ```bash
   rm -rf .next
   pnpm dev
   ```

### Dark Mode Not Working

**Symptom**: Toggle dark mode, nothing changes.

**Causes & Fixes**:

1. **Theme provider missing**
   
   **Check**: `app/layout.tsx` has `<ThemeProvider>`
   
   **Solution**: Should already be there, but verify:
   ```tsx
   <ThemeProvider attribute="class" defaultTheme="system">
     {children}
   </ThemeProvider>
   ```

---

## 🗄️ Database Issues

### "relation does not exist" Error

**Symptom**: Actions fail with database relation errors.

**Causes & Fixes**:

1. **Migrations not applied** ✅ MOST COMMON
   
   **Solution**: Apply all migrations in order:
   ```bash
   # Option 1: Supabase CLI
   supabase db push
   
   # Option 2: SQL Editor
   # Run each file in supabase/migrations/ (001 → 014)
   ```

2. **Wrong database**
   
   **Check**: `.env.local` `NEXT_PUBLIC_SUPABASE_URL` is correct

---

### RLS Policy Blocking Action

**Symptom**: "new row violates row-level security policy" error.

**Causes & Fixes**:

1. **User not authenticated**
   
   **Solution**: Ensure user is logged in

2. **Policy too restrictive**
   
   **Debug**:
   ```sql
   -- Check policies on table
   SELECT * FROM pg_policies WHERE tablename = 'items';
   
   -- Temporarily disable RLS (TESTING ONLY!)
   ALTER TABLE items DISABLE ROW LEVEL SECURITY;
   ```

3. **Re-apply RLS policies**
   
   **Solution**: Run migration `005_rls.sql` again

---

## ⚡ Performance Issues

### Slow Page Loads

**Symptom**: Pages take > 5 seconds to load.

**Causes & Fixes**:

1. **Large images not optimized**
   
   **Solution**: App compresses automatically, but check:
   ```typescript
   // In components/forms/ImageUploader.tsx
   maxSizeMB: 0.5  // Should be 0.5 or lower
   ```

2. **Database query slow**
   
   **Solution**: Check indexes exist:
   ```bash
   pnpm test:auth  # Will verify database setup
   ```

3. **Too many items in browse**
   
   **Solution**: Pagination is built-in, check it's working

---

## 🧪 Testing Issues

### E2E Tests Failing

**Symptom**: `pnpm test:e2e` shows failures.

**Causes & Fixes**:

1. **Dev server not running**
   
   **Solution**: Start server in separate terminal:
   ```bash
   pnpm dev
   ```

2. **Test users don't exist**
   
   **Solution**: Create test users in Supabase Auth:
   - Email: `pushkarraj11a7317@gmail.com`, Password: `pushkarraj2005`
   - Email: `avikjaiswal01@gmail.com`, Password: `avik@2005`
   - Email: `myoneplus373@gmail.com`, Password: `oneplus2005`

3. **Environment variables missing**
   
   **Check**: `.env.local` has all `TEST_USER_*` variables

---

## 🚀 Deployment Issues

### Build Fails on Vercel

**Symptom**: Vercel deployment fails during build.

**Causes & Fixes**:

1. **TypeScript errors**
   
   **Solution**: Fix locally first:
   ```bash
   pnpm typecheck
   pnpm build
   ```

2. **Environment variables missing**
   
   **Solution**: Add all variables from `.env.example` in Vercel dashboard

3. **Node version mismatch**
   
   **Solution**: Vercel uses Node 18+ automatically (correct)

---

### Production Site Shows Errors

**Symptom**: Site works locally, breaks in production.

**Causes & Fixes**:

1. **Supabase URL not set**
   
   **Check**: Vercel environment variables
   
   **Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Auth redirect URLs wrong**
   
   **Solution**: Update in Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

3. **CORS issues**
   
   **Solution**: Check Supabase project settings allow your domain

---

## 🔧 Development Environment

### Port Already in Use

**Symptom**: `pnpm dev` shows "Port 3000 is in use".

**Solution Option 1 - Use different port**:
```bash
pnpm dev  # Next.js will auto-choose available port (e.g. 3002)
```

**Solution Option 2 - Kill existing process**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

---

### Module Not Found Errors

**Symptom**: Import errors, "Cannot find module '@/...'"

**Causes & Fixes**:

1. **Dependencies not installed**
   
   **Solution**:
   ```bash
   pnpm install
   ```

2. **TypeScript path alias issue**
   
   **Check**: `tsconfig.json` has:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./*"]
       }
     }
   }
   ```

---

## 🆘 Emergency Fixes

### Reset Everything

If nothing works, nuclear option:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clean all caches
rm -rf .next
rm -rf node_modules
rm -rf pnpm-lock.yaml

# 3. Reinstall
pnpm install

# 4. Restart
pnpm dev
```

### Check System Health

Run diagnostic script:

```bash
pnpm test:auth
```

This will test:
- ✅ Database connection
- ✅ Auth configuration  
- ✅ Existing users
- ✅ RLS policies
- ✅ Storage buckets
- ✅ Signup flow

---

## 📞 Still Stuck?

1. **Check error message carefully** - it usually tells you exactly what's wrong
2. **Look in browser console** - press F12, check Console tab
3. **Check server logs** - look at terminal where `pnpm dev` is running
4. **Run diagnostics**: `pnpm test:auth`
5. **Check Supabase logs** - Supabase Dashboard → Logs

---

## 📚 Related Documentation

- `docs/DEPLOYMENT.md` - Full deployment guide
- `docs/GOOGLE_OAUTH_SETUP.md` - Google sign-in setup
- `docs/TEST_PLAN.md` - Testing strategy
- `.env.example` - Required environment variables

---

**Most Common Fix**: Change `ACCESS_MODE=public` in `.env.local` to allow any email domain for signup.

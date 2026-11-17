# Google OAuth Setup Guide

Complete guide to enable "Continue with Google" functionality.

---

## Why Google OAuth Might Not Be Working

Google OAuth requires configuration in **both** Google Cloud Console and Supabase. If not configured, the "Continue with Google" button will fail.

---

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `CampusFind` (or your app name)
4. Click **Create**

### 2. Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Google+ API**
4. Click **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Click **Create**

**Fill in required fields**:
- **App name**: CampusFind Lost & Found
- **User support email**: Your email
- **Developer contact**: Your email
- Click **Save and Continue**

**Scopes**: Click **Save and Continue** (default scopes are fine)

**Test users** (optional for development):
- Add your test email addresses
- Click **Save and Continue**

### 4. Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Application type**: Web application
4. **Name**: CampusFind Web App

**Authorized JavaScript origins**:
```
http://localhost:3000
https://yourdomain.vercel.app
```

**Authorized redirect URIs**:
```
https://hzszqqqscqsjudzoveeg.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
```

⚠️ **Important**: Replace `hzszqqqscqsjudzoveeg` with your actual Supabase project reference.

5. Click **Create**
6. **Copy Client ID and Client Secret** (you'll need these next)

---

### 5. Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list
5. Toggle **Enable Google provider**
6. Paste your Google credentials:
   - **Client ID**: (from step 4)
   - **Client Secret**: (from step 4)
7. Click **Save**

---

### 6. Update Supabase Site URL

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   ```
4. Click **Save**

---

### 7. Test Google OAuth

1. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   pnpm dev
   ```

2. Go to `http://localhost:3000/signup`
3. Click **Continue with Google**
4. You should see Google's sign-in page
5. Select your Google account
6. You should be redirected back to your app

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: Redirect URI not authorized in Google Console

**Fix**:
1. Check the error message for the exact redirect URI
2. Go to Google Cloud Console → Credentials
3. Click your OAuth client
4. Add the exact URI to **Authorized redirect URIs**
5. Format: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

### Error: "Failed to start Google sign-in"

**Problem**: Google provider not enabled in Supabase

**Fix**:
1. Go to Supabase Dashboard → Authentication → Providers
2. Ensure Google is **toggled on**
3. Verify Client ID and Secret are entered
4. Click **Save**

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured

**Fix**:
1. Go to Google Cloud Console → OAuth consent screen
2. Complete all required fields
3. Add test users (for development)
4. Save changes

### Google sign-in works but profile not created

**Problem**: Database trigger might be failing

**Fix**:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If missing, run migration 006_triggers.sql again
```

### Users get "Email not allowed" error

**Problem**: `ACCESS_MODE=restricted` in `.env.local`

**Fix**:
```bash
# Option 1: Allow all emails
ACCESS_MODE=public

# Option 2: Allow specific domain only
ACCESS_MODE=restricted
ALLOWED_EMAIL_DOMAIN=youruniversity.edu
```

---

## Production Deployment

### Update Google Console

1. Go to Google Cloud Console → Credentials
2. Click your OAuth client
3. Add production URIs:

**Authorized JavaScript origins**:
```
https://your-production-domain.com
```

**Authorized redirect URIs**:
```
https://YOUR-PROJECT.supabase.co/auth/v1/callback
https://your-production-domain.com/auth/callback
```

### Update Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL**: `https://your-production-domain.com`
3. Add **Redirect URLs**: `https://your-production-domain.com/auth/callback`

### Update Environment Variables

In Vercel or your hosting platform:
```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

---

## Optional: Email-Only Mode

If you don't want to set up Google OAuth, you can **hide the Google button**:

**Option 1: Remove from UI** (quick fix)

Edit `components/auth/SignupForm.tsx` and `components/auth/LoginForm.tsx`:

```tsx
// Comment out or remove this section:
{/* Google signup */}
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleGoogleSignup}
  disabled={isLoading}
>
  {/* Google icon */}
  Continue with Google
</Button>
```

**Option 2: Feature Flag** (proper solution)

Add to `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=false
```

Then wrap the Google button:
```tsx
{process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true' && (
  <Button onClick={handleGoogleSignup}>
    Continue with Google
  </Button>
)}
```

---

## Security Notes

1. **Never commit** Google Client Secret to Git
2. **Restrict** OAuth client to your domains only
3. **Use HTTPS** in production (Google requires it)
4. **Verify email domain** in your server actions if needed
5. **Rate limit** OAuth requests to prevent abuse

---

## Testing Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth credentials created
- [ ] Supabase provider enabled
- [ ] Site URL configured
- [ ] Redirect URIs match exactly
- [ ] Dev server restarted
- [ ] Google sign-in button appears
- [ ] Click redirects to Google
- [ ] After sign-in, user returns to app
- [ ] Profile created in database
- [ ] User can access protected routes

---

## References

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Need help?** Check the error message carefully — it usually tells you exactly what's missing (redirect URI, consent screen, etc.).

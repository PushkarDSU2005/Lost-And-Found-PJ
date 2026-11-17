# Test Your Fixes NOW! 🎯

**Follow these steps to verify everything works.**

---

## ✅ Step 1: Check Dev Server

Your server should be running at http://localhost:3002

**If not running**:
```bash
# In terminal
pnpm dev
```

Wait for:
```
✓ Ready in X.Xs
- Local: http://localhost:3002
```

---

## ✅ Step 2: Test Signup (Email/Password)

### 2.1 Open Signup Page
Go to: http://localhost:3002/signup

### 2.2 Fill the Form
- **Full name**: Your Name
- **Email**: `youremail@gmail.com` (or any email)
- **Password**: Create strong password
  - At least 8 characters
  - Must have: uppercase, lowercase, number
  - Example: `MyPassword123!`
- **Terms checkbox**: ✅ Check it

### 2.3 Click "Create account"

**Expected Result**:
```
✅ Account created! Please check your email to verify your account before signing in.
```

**If you see error**:
- "User already exists" → Use different email or login instead
- "Password too weak" → Add more characters/special chars
- "Must agree to terms" → Check the checkbox
- Other error → Check `docs/TROUBLESHOOTING.md`

### 2.4 Verify Email
1. Check your email inbox
2. Look for email from Supabase
3. Click the verification link
4. Should redirect to success page

---

## ✅ Step 3: Test Login

### 3.1 Go to Login Page
http://localhost:3002/login

### 3.2 Enter Credentials
- **Email**: Email you just signed up with
- **Password**: Password you created

### 3.3 Click "Sign in"

**Expected Result**:
- ✅ Redirected to homepage
- ✅ See "Dashboard" link in navigation
- ✅ See your name/avatar in top right

**If login fails**:
- "Invalid email or password" → Email not verified yet (check Step 2.4)
- Check password is correct
- Try "Forgot password?" link

---

## ✅ Step 4: Test Core Features

### 4.1 Browse Items
1. Click **"Browse"** in navigation
2. Should see items page (might be empty if no items yet)
3. **Expected**: Page loads, filter sidebar shows

### 4.2 Report Lost Item
1. Click **"Report Lost"** in navigation
2. Fill the form:
   - **Title**: "Lost Blue Backpack"
   - **Description**: "Left in library on Monday"
   - **Category**: Choose one
   - **Location**: Choose from dropdown
   - **Date**: Pick a date
   - **Photos**: (Optional) Upload 1-2 images
3. Click "Submit Report"

**Expected Result**:
- ✅ Success message
- ✅ Redirected to item detail page
- ✅ Photos appear (if uploaded)

### 4.3 Check Dashboard
1. Click **"Dashboard"** in navigation
2. Should see three tabs:
   - **My Posts**: Should show the item you just created
   - **My Claims**: Empty (no claims yet)
   - **Claims on My Items**: Empty (no one claimed your item)

**Expected**: ✅ Dashboard loads, your item appears in "My Posts"

### 4.4 Test Image Upload
1. Go to "Report Found"
2. Fill basic info
3. **Upload photos**:
   - Click "Choose files" or drag & drop
   - Select 1-3 images (< 5 MB each)
   - Should see preview thumbnails
4. Submit

**Expected**: ✅ Photos upload and display correctly

---

## ⚠️ Step 5: Test Google OAuth (Optional)

### 5.1 Check if Google Button Works

Go to: http://localhost:3002/signup

Look for: **"Continue with Google"** button

Click it.

### 5.2 Possible Results

**Result A: Google sign-in page appears** ✅
- Google OAuth is configured
- Select Google account
- Authorize the app
- Should redirect back and log you in

**Result B: Error message** ⚠️
- Google OAuth not configured
- This is **normal** and **OK**
- You have two options:

#### Option 1: Hide the Button (Quick)
Edit `components/auth/SignupForm.tsx` around line 175:

```tsx
// Comment out this entire section
{/* Google signup
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={handleGoogleSignup}
  disabled={isLoading}
>
  Continue with Google
</Button>
*/}
```

Do the same in `components/auth/LoginForm.tsx`.

**Restart dev server** after editing.

#### Option 2: Set Up Google OAuth (30 mins)
Follow the complete guide:
```
docs/GOOGLE_OAUTH_SETUP.md
```

---

## ✅ Step 6: Test Admin Features (If Admin)

### 6.1 Check Your Role
Run this in terminal:
```bash
pnpm test:auth
```

Look for your email in the user list. If it says `(admin)`, you have admin access.

**Your test accounts**:
- `pushkarraj11a7317@gmail.com` → **admin** ✅
- `avikjaiswal01@gmail.com` → student
- `myoneplus373@gmail.com` → student

### 6.2 Access Admin Panel
Go to: http://localhost:3002/admin

**If you're admin**: ✅ Admin panel loads with tabs:
- Reports
- Statistics
- Claims (for review)

**If not admin**: ❌ Access denied or redirected

---

## 🎯 Success Checklist

Mark each item as you test:

- [ ] Dev server running (http://localhost:3002)
- [ ] Signup page loads
- [ ] Can create account with Gmail
- [ ] Receive verification email
- [ ] Email verification link works
- [ ] Can login successfully
- [ ] See "Dashboard" in navigation
- [ ] Browse page loads
- [ ] Can create lost item report
- [ ] Can upload photos
- [ ] Photos display correctly
- [ ] Dashboard shows my items
- [ ] (Optional) Google OAuth works or hidden
- [ ] (If admin) Admin panel accessible

---

## 🐛 Troubleshooting

### "Cannot access http://localhost:3002"

**Fix**: 
```bash
# Check if server is running
# Terminal should show:
✓ Ready in X.Xs
```

If not, run:
```bash
pnpm dev
```

### "User already registered"

**Fix**: Email already used. Either:
- Login instead: http://localhost:3002/login
- Use different email
- Check email for verification link

### "Invalid email or password"

**Fix**: Email not verified yet
- Check email inbox
- Click verification link
- Try login again

### Photos won't upload

**Fix**: 
```bash
# Check storage buckets exist
pnpm test:auth

# Should show:
✅ Bucket "item-images" exists
✅ Bucket "sensitive-images" exists
```

If missing, run migrations in Supabase SQL Editor:
- `supabase/migrations/004_storage.sql`

### Google button fails

**This is normal!** Google OAuth needs setup.

**Quick fix**: Hide the button (see Step 5.2, Option 1)

---

## 📞 Need More Help?

### Documentation
- **Quick fixes**: `QUICK_FIXES.md`
- **Common issues**: `docs/TROUBLESHOOTING.md`
- **Google OAuth**: `docs/GOOGLE_OAUTH_SETUP.md`
- **Full summary**: `SESSION_SUMMARY.md`

### Commands
```bash
pnpm test:auth      # Diagnose auth system
pnpm typecheck      # Check for errors
pnpm build          # Test production build
```

### Check Logs
- **Browser console**: Press F12, check Console tab
- **Server logs**: Terminal where `pnpm dev` runs
- **Supabase**: Dashboard → Logs

---

## 🎉 You're Done!

If you completed the checklist above, your authentication system is **fully functional**.

**What works now**:
- ✅ Email/password authentication
- ✅ Email verification
- ✅ Password reset
- ✅ Item reporting with photos
- ✅ Claims system
- ✅ Messaging
- ✅ Dashboard
- ✅ Admin panel
- ⚠️ Google OAuth (optional, needs setup)

**Next steps**:
1. Keep testing features
2. Create more test items
3. Try the claims flow
4. Test messaging
5. (Optional) Set up Google OAuth

**Ready for production?** See `docs/DEPLOYMENT.md`

---

**Have fun testing!** 🚀

# Memory — AI Context & Progress Tracker

**Purpose**: This document keeps the AI assistant updated on project progress, key decisions, and current blockers. It serves as a session-independent memory for maintaining context across different coding sessions.

---

## Project Status (Last Updated: 2026-10-17)

**Current Phase**: Phase 3 (Authentication) — 🔄 In Progress  
**Overall Progress**: ~55% complete (MVP 90% in terms of infrastructure)  
**Blocking Issue**: Bug #1 (P0) — Missing login/signup pages  
**Last Major Milestone**: Successfully fixed 6 P0/P1 bugs (Task 18) and pushed to GitHub

---

## 1. What Has Been Built

### ✅ Completed Infrastructure (Phases 0-2)

#### Database & Schema (Phase 1)
- **14 migrations** fully implemented and tested
- **6 core tables**: profiles, locations, items, item_images, claims, notifications
- **5 enums**: item_report_type, item_status, item_category, user_role, claim_status, notification_channel
- **Row-Level Security (RLS)**: Complete policy coverage tested with 129 integration tests
- **Indexes**: Trigram search on item titles, compound indexes for performance
- **Storage buckets**: `item-images` (public), `sensitive-images` (private)
- **Database types**: Generated TypeScript types (`lib/database.types.ts`)

#### UI Components (Phase 2)
- **12 reusable components** in `/components/ui/`:
  - Button (4 variants, 3 sizes)
  - Card (item-card, stat-card, claim-card)
  - Input (text, email, textarea, select)
  - Modal, Badge, Tabs, Avatar, Spinner
- **Layout components**: NavBar, BottomNav, Sidebar
- **78 unit tests** passing for components
- **Design system**: Tailwind v4 configured, tokens defined in DESIGN.md

#### Project Setup (Phase 0)
- Next.js 15.3.3 with App Router
- React 19 (Server Components by default)
- TypeScript 5.x (strict mode)
- Testing: Vitest (234 unit tests), Playwright (228 E2E tests)
- CI/CD: GitHub Actions configured
- Repository: https://github.com/PushkarDSU2005/Lost-And-Found-PJ.git

---

## 2. What Is Partially Built

### ⏸️ Authentication (Phase 3) — BLOCKED

**What exists:**
- Supabase Auth configured (email + OAuth ready)
- Auth helper functions: `lib/supabase/server.ts`, `lib/supabase/client.ts`
- Auth context provider: `components/auth-provider.tsx`

**What is missing (BLOCKERS):**
- ❌ `/app/login/page.tsx` — login form (Bug #1, P0)
- ❌ `/app/signup/page.tsx` — registration form (Bug #1, P0)
- ❌ `/app/reset-password/page.tsx` — password reset flow
- ❌ `/app/profile/page.tsx` — user profile management
- ❌ Auth middleware (redirect logic for protected routes)
- ❌ OAuth provider buttons (Google, GitHub)
- ❌ Email verification flow

**Why it matters**: Without login/signup pages, users cannot authenticate, blocking all user-specific features (reporting, claims, dashboard).

### ⏸️ Item Reporting (Phase 4) — BLOCKED BY PHASE 3

**What exists:**
- ✅ Report form UI: `app/report/[type]/page.tsx` (lost/found variants)
- ✅ Server action: `lib/actions/items.ts` (createItem)
- ✅ Form validation: Zod schema
- ✅ Image upload: Supabase Storage integration
- ✅ Location picker: Dropdown fetching from DB
- ✅ Category selector: All 9 categories supported
- ✅ Auth gate: Redirects to login if not authenticated (fixed in Task 18)

**What is missing:**
- ❌ Cannot test end-to-end because `/login` page doesn't exist
- ❌ Image upload retry logic
- ❌ Upload progress indicator
- ❌ Success/error toast messages

**Current status**: Form is fully built but cannot be used without authentication.

---

## 3. Known Bugs & Issues

### Fixed Bugs (Task 18, 2026-10-17)
- ✅ Bug #1 (P0): Report form had no auth gate → **Fixed** (redirects to `/login`)
- ✅ Bug #2 (P0): Home page type toggle broken → **Fixed** (now works correctly)
- ✅ Bug #4 (P1): Category chips had no event handlers → **Fixed** (navigate to filtered browse)
- ✅ Bug #5 (P1): Stats bar used hardcoded values → **Fixed** (real DB queries via Server Action)
- ✅ Bug #7 (P1): Locations hardcoded → **Fixed** (dynamic fetch from `locations` table)
- ✅ Bug #8 (P1): Bottom nav links broken → **Fixed** (correct hrefs)

### Open Bugs (from `/docs/AUDIT.md`)
See full list in AUDIT.md. Key remaining issues:
- **Bug #3 (P0)**: Search not implemented → **Planned for Phase 5**
- **Bug #9 (P1)**: Report form validation incomplete
- **Bug #10 (P1)**: Report form doesn't show success/error states
- **Bug #11 (P1)**: Image upload has no retry or progress
- **Bug #12 (P1)**: Browse page filters not implemented
- Several P2 bugs (empty states, mobile responsiveness, etc.)

---

## 4. Key Architectural Decisions

### Data Fetching
- **Server Components first**: Fetch data in Server Components, pass as props
- **Server Actions for mutations**: No REST API, use Server Actions (`createItem`, `updateClaim`, etc.)
- **Client Components only when needed**: Interactivity (forms, modals, filters)

### Authentication Pattern
```typescript
// Server Component
export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // ... render page
}
```

### Error Handling
- **Server Actions return Result objects**: `{ success: boolean, data?: T, error?: string }`
- **No throwing in Server Actions**: Always return error objects
- **User-friendly messages**: Never expose stack traces or DB errors

### Database Queries
- **Use RLS everywhere**: Never bypass with service role key in user-facing code
- **Select specific columns**: Avoid `select('*')` when possible
- **Leverage indexes**: Queries follow index patterns (see Architecture.md)

---

## 5. File Structure (Key Paths)

```
Lost-And-Found-PJ/
├── app/
│   ├── (auth)/
│   │   ├── login/           ❌ MISSING
│   │   ├── signup/          ❌ MISSING
│   │   └── reset-password/  ❌ MISSING
│   ├── report/
│   │   └── [type]/page.tsx  ✅ EXISTS (lost/found forms)
│   ├── items/
│   │   ├── page.tsx         ⏸️ PARTIAL (browse, needs filters)
│   │   └── [id]/page.tsx    ❌ MISSING (item detail)
│   ├── dashboard/
│   │   └── page.tsx         ⏸️ PARTIAL (basic layout, needs content)
│   ├── profile/
│   │   └── page.tsx         ❌ MISSING
│   ├── admin/               ❌ NOT STARTED (Phase 8)
│   ├── page.tsx             ✅ EXISTS (home page, mostly complete)
│   ├── layout.tsx           ✅ EXISTS
│   └── globals.css          ✅ EXISTS (Tailwind imports)
├── components/
│   ├── ui/                  ✅ 12 components (Button, Card, Input, etc.)
│   ├── layout/              ✅ NavBar, BottomNav, Sidebar
│   ├── auth-provider.tsx    ✅ EXISTS
│   └── ...                  ✅ Various feature components
├── lib/
│   ├── supabase/
│   │   ├── server.ts        ✅ Server-side client
│   │   ├── client.ts        ✅ Client-side client
│   │   └── middleware.ts    ❌ MISSING (auth middleware)
│   ├── actions/
│   │   ├── items.ts         ✅ createItem, getItems, etc.
│   │   ├── stats.ts         ✅ getStats (home page)
│   │   └── ...              ⏸️ PARTIAL (some actions missing)
│   ├── database.types.ts    ✅ Generated from Supabase
│   └── utils/               ✅ Various utilities
├── supabase/
│   └── migrations/          ✅ 14 migrations (001-014)
├── tests/
│   ├── unit/                ✅ 234 tests passing
│   ├── integration/         ✅ 129 tests passing (RLS + actions)
│   └── e2e/                 ✅ 228 tests passing (Playwright)
├── docs/
│   ├── PRD.md               ✅ Product Requirements (created 2026-10-17)
│   ├── Architecture.md      ✅ System Architecture (created 2026-10-17)
│   ├── Rules.md             ✅ Development Rules (created 2026-10-17)
│   ├── Phases.md            ✅ Project Phases (created 2026-10-17)
│   ├── DESIGN.md            ✅ UI Design System (existing)
│   ├── Memory.md            ✅ This file
│   ├── data-model.md        ✅ Database schema (existing)
│   ├── AUDIT.md             ✅ Bug audit (42 features, 18 bugs)
│   └── PROGRESS.md          ✅ Task log (18 tasks)
├── package.json             ✅ Dependencies locked
├── tsconfig.json            ✅ TypeScript strict mode
├── tailwind.config.ts       ✅ Tailwind v4 configured
└── README.md                ⏸️ NEEDS UPDATE (basic info only)
```

---

## 6. Test Coverage

### Unit Tests (Vitest)
- **Total**: 234 tests
- **Status**: ✅ All passing
- **Coverage**: ~80% (components, utilities)
- **Location**: `/tests/unit/`

### Integration Tests (Vitest + Supabase)
- **Total**: 129 tests
- **Focus**: RLS policies, Server Actions, database operations
- **Personas**: anon, studentA, studentB, admin
- **Status**: ✅ All passing
- **Location**: `/tests/integration/`

### E2E Tests (Playwright)
- **Total**: 228 tests
- **Focus**: Critical user flows (home, browse, report)
- **Status**: ✅ All passing
- **Location**: `/tests/e2e/`

**Test Command Quick Reference:**
```bash
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e          # Playwright E2E tests
npm run test:coverage     # Coverage report
```

---

## 7. Dependencies (Key Packages)

### Production
```json
{
  "next": "15.3.3",
  "react": "19.0.0",
  "@supabase/supabase-js": "latest",
  "lucide-react": "latest",
  "@radix-ui/react-*": "latest",
  "zod": "latest",
  "clsx": "latest",
  "class-variance-authority": "latest"
}
```

### Development
```json
{
  "typescript": "5.x",
  "vitest": "latest",
  "@testing-library/react": "latest",
  "playwright": "latest",
  "@faker-js/faker": "latest",
  "msw": "latest",
  "eslint": "latest",
  "prettier": "latest"
}
```

---

## 8. Environment Variables

### Required for Development
```env
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # Server-side only
```

### Required for Production
Same as development, plus:
```env
NEXT_PUBLIC_APP_URL=<production-domain>
SUPABASE_DB_URL=<postgres-connection-string>  # For migrations
```

**Location**: `.env.local` (gitignored)

---

## 9. Git Workflow

### Commit History (Recent)
- **Commit 3971325** (2026-10-17): Fixed 6 P0/P1 bugs from Task 18
  - Added auth gates to report pages
  - Fixed home page toggle and category chips
  - Replaced hardcoded stats with real queries
  - Fixed locations fetching and bottom nav links
- **Previous commits**: Database migrations, UI components, tests, etc.

### Branch Strategy
- **Main branch**: `main` (protected, auto-deploys to production)
- **Feature branches**: `phase-X-feature-name` (e.g., `phase-3-authentication`)
- **Merge strategy**: Squash merge after review

### GitHub Repository
- URL: https://github.com/PushkarDSU2005/Lost-And-Found-PJ.git
- Last push: 2026-10-17 (281 objects, 788KB)
- CI/CD: GitHub Actions configured

---

## 10. Next Immediate Actions

### Critical Path (Unblock Phase 3)
1. **Create `/app/login/page.tsx`**
   - Email + password form
   - OAuth provider buttons (Google, GitHub)
   - Link to signup and password reset
   - Server Action: `signIn(email, password)`
   - Error handling (invalid credentials, rate limiting)

2. **Create `/app/signup/page.tsx`**
   - Email, password, confirm password, full name
   - Terms of service checkbox
   - Server Action: `signUp(email, password, fullName)`
   - Email verification notice
   - Auto-create profile via trigger (already exists in DB)

3. **Create `/app/reset-password/page.tsx`**
   - Email input → send reset link
   - Server Action: `resetPassword(email)`
   - Success message

4. **Create auth middleware** (`lib/supabase/middleware.ts`)
   - Redirect logic for protected routes
   - Refresh session on navigation

5. **Test end-to-end auth flow**
   - Sign up → verify email → log in → access protected route
   - Test OAuth (Google, GitHub)
   - Test password reset

### After Phase 3 Unblocked
6. Complete Phase 4 (Item Reporting)
   - Add success/error toasts
   - Add image upload progress
   - Add retry logic
   - Test end-to-end with real auth

7. Start Phase 5 (Search & Discovery)
   - Implement search (trigram)
   - Implement filters (category, status, date)
   - Implement item detail page
   - Test search performance

---

## 11. Common Patterns & Code Snippets

### Creating a Protected Server Component
```typescript
// app/protected/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Fetch user-specific data
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('reporter_id', user.id);
  
  return <div>Welcome {user.email}</div>;
}
```

### Creating a Server Action
```typescript
// lib/actions/items.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const itemSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.enum(['electronics', 'clothing', /* ... */]),
  // ... other fields
});

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  
  // 1. Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }
  
  // 2. Validate input
  const input = {
    title: formData.get('title'),
    category: formData.get('category'),
    // ...
  };
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input' };
  }
  
  // 3. Insert into DB
  const { data, error } = await supabase
    .from('items')
    .insert({
      ...parsed.data,
      reporter_id: user.id,
    })
    .select()
    .single();
  
  if (error) {
    console.error('createItem failed:', error);
    return { success: false, error: 'Failed to create item' };
  }
  
  // 4. Revalidate cache
  revalidatePath('/items');
  
  return { success: true, data };
}
```

### Using a Client Component with Auth
```typescript
'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function UserMenu() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);
  
  if (!user) return <a href="/login">Sign in</a>;
  
  return <div>Welcome {user.email}</div>;
}
```

---

## 12. Debugging Tips

### Common Issues & Solutions

#### 1. "RLS policy violation"
**Symptom**: Query fails with "new row violates row-level security policy"  
**Solution**: Check if user is authenticated and has correct role. Test with `psql` or Supabase Studio.

#### 2. "Module not found" in tests
**Symptom**: Vitest can't resolve `@/lib/...` imports  
**Solution**: Check `vitest.config.ts` has correct `resolve.alias` mapping.

#### 3. "Hydration mismatch"
**Symptom**: React error about server/client HTML mismatch  
**Solution**: Don't use `Date.now()` or `Math.random()` in Server Components. Use `use client` if dynamic.

#### 4. "Cannot read properties of undefined (reading 'id')"
**Symptom**: User object is undefined  
**Solution**: Add null check: `if (!user) redirect('/login')` before accessing `user.id`.

#### 5. Server Action not triggered
**Symptom**: Form submits but nothing happens  
**Solution**: Check form `action` prop points to Server Action. Check browser Network tab for errors.

---

## 13. Code Style Reminders

### TypeScript
- ✅ Use strict null checks (`if (!user) return`)
- ✅ Use Database types (`Database['public']['Tables']['items']['Row']`)
- ❌ No `any` types (use `unknown` + type guards)

### React
- ✅ Server Components by default (no `'use client'` unless needed)
- ✅ Async Server Components for data fetching
- ❌ No `useEffect` for data fetching (fetch in Server Component)

### Tailwind
- ✅ Use design tokens from DESIGN.md
- ✅ Mobile-first responsive classes
- ❌ No inline styles or custom CSS files

### Error Handling
- ✅ Return error objects from Server Actions
- ✅ Log errors with context (`console.error('createItem failed:', error)`)
- ❌ Never expose DB errors to users

---

## 14. Questions for Future Sessions

### If AI needs clarification on:

**Authentication:**
- Should OAuth be implemented in Phase 3 or deferred to later?
- Should email verification be required before login?
- What should happen if user closes browser during signup?

**Item Reporting:**
- Should users be able to edit items after submission?
- Should there be a draft system for incomplete reports?
- What happens if image upload fails partway through?

**Search & Discovery:**
- Should search results be cached? For how long?
- Should "similar items" use AI/embeddings or just category matching?
- How many items per page? (Current assumption: 20)

**Claims:**
- Can a user submit multiple claims on the same item?
- Should admin see claim proof images immediately or only after approval?
- What happens if item owner rejects a claim? Can user resubmit?

---

## 15. Performance Considerations

### Current Optimizations
- ✅ Server Components minimize client-side JS
- ✅ Images use `next/image` (WebP, lazy loading)
- ✅ Database indexes on high-traffic queries
- ✅ RLS policies don't do full table scans

### Future Optimizations (Phase 9)
- [ ] Lazy load heavy components (map, image gallery)
- [ ] Code splitting (route-based)
- [ ] Bundle size optimization (<500KB first-load JS)
- [ ] CDN for static assets (Vercel Edge)
- [ ] Database connection pooling (Supabase handles this)

---

## 16. Security Checklist

### Implemented
- ✅ RLS policies on all tables
- ✅ Auth checks in Server Components and Actions
- ✅ Input validation with Zod
- ✅ Secrets in environment variables (not committed)
- ✅ HTTPS enforced (Vercel default)
- ✅ Content Security Policy headers (Next.js default)

### To Implement (Phase 3+)
- [ ] Rate limiting on auth endpoints
- [ ] Email verification required
- [ ] Password strength requirements
- [ ] CSRF protection (Next.js Server Actions have built-in)
- [ ] Audit log for admin actions
- [ ] Image upload virus scanning (future, not MVP)

---

## 17. Deployment Status

### Development
- **URL**: `http://localhost:3000`
- **Database**: Supabase development project
- **Command**: `npm run dev`

### Staging
- **URL**: Not yet configured
- **Database**: Same as development (for now)

### Production
- **URL**: Not yet deployed
- **Platform**: Vercel (configured, not deployed)
- **Database**: Supabase production instance (will be separate)
- **Domain**: TBD

**Deployment plan**: See Phase 10 in Phases.md

---

## 18. Contact & Escalation

### When to Ask User for Clarification
- Breaking a rule in Rules.md
- Adding a new dependency not in allowed list
- Changing database schema (requires migration)
- Deploying to production
- Unsure about product requirements (check PRD.md first)

### When to Just Do It
- Fixing bugs in existing code
- Adding tests
- Refactoring following Rules.md patterns
- Updating documentation
- Implementing approved tasks from PROGRESS.md

---

## 19. Session Handoff Checklist

**When ending a coding session, update this file with:**
- [ ] Current phase status
- [ ] Last completed task (add to PROGRESS.md)
- [ ] New blockers or bugs discovered
- [ ] Files created or modified
- [ ] Tests passing/failing
- [ ] Next immediate action

**When starting a new session, read:**
1. This file (Memory.md) — overall context
2. PROGRESS.md — task history
3. AUDIT.md — known bugs
4. Phases.md — current phase deliverables

---

## 20. Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-10-17 | Created Memory.md | AI (Kiro) |
| 2026-10-17 | Documented Phase 0-2 completion | AI (Kiro) |
| 2026-10-17 | Documented Bug #1 blocker (login/signup pages) | AI (Kiro) |
| 2026-10-17 | Added test coverage summary (234+129+228 tests) | AI (Kiro) |
| 2026-10-17 | Added commit 3971325 (Task 18 bug fixes) | AI (Kiro) |

---

**End of Memory.md**

**For AI assistants**: This file is your primary context source. Read it at the start of every session. Update it whenever significant progress is made or blockers change. Treat it as a living document.

**For human developers**: Use this as a quick reference for project status, file locations, and common patterns. Update it when onboarding new team members or after major milestones.

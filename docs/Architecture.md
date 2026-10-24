# System Architecture
## Campus Lost & Found Platform

**Last Updated:** October 17, 2026

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Next.js 15 App Router (React 19)                   │   │
│  │  - Server Components (RSC)                          │   │
│  │  - Client Components (interactive)                   │   │
│  │  - Server Actions (mutations)                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Item Service │  │ Claim Service│     │
│  │  (Supabase)  │  │  (Actions)   │  │  (Actions)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Msg Service  │  │ Email Service│  │ Cron Service │     │
│  │  (Actions)   │  │  (Resend)    │  │  (Vercel)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕ PostgreSQL Wire Protocol
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase (PostgreSQL 15)                           │   │
│  │  - Row-Level Security (RLS)                         │   │
│  │  - 6 core tables (profiles, items, claims, etc.)    │   │
│  │  - 14 migrations                                     │   │
│  │  - Triggers & Functions                              │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase Storage (S3-compatible)                   │   │
│  │  - item-images (public bucket)                       │   │
│  │  - sensitive-images (private bucket)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 15.3.3 (App Router)
- **React:** 19.0.0 (Server Components + Client Components)
- **Styling:** Tailwind CSS v4 (CSS-first)
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** React hooks + URL search params (no Redux)
- **Forms:** react-hook-form + Zod validation
- **Image Handling:** next/image + browser-image-compression
- **Notifications:** Sonner (toast library)

### Backend
- **Runtime:** Node.js 20+ (Vercel serverless functions)
- **API Pattern:** Server Actions (no REST/GraphQL)
- **Authentication:** Supabase Auth (not yet implemented)
- **Database:** Supabase (PostgreSQL 15)
- **Storage:** Supabase Storage (S3-compatible)
- **Email:** Resend (transactional emails)
- **Cron:** Vercel Cron (daily expiry check)

### Database
- **Type:** PostgreSQL 15.1
- **ORM:** None (raw SQL via Supabase client)
- **Migrations:** Plain SQL files (numbered)
- **Security:** Row-Level Security (RLS) on all tables
- **Extensions:** pg_trgm (fuzzy search), uuid-ossp, moddatetime

### DevOps
- **Hosting:** Vercel (free tier)
- **CI/CD:** GitHub Actions
- **Package Manager:** pnpm 9.15.0
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Linting:** ESLint 9 + Prettier 3
- **Type Safety:** TypeScript 5 (strict mode)

---

## 3. Folder Structure

```
lost-and-found/
├── app/                          # Next.js App Router
│   ├── (pages)/
│   │   ├── page.tsx             # Home page (/)
│   │   ├── layout.tsx           # Root layout with navbar/footer
│   │   ├── about/               # Static pages
│   │   ├── faq/
│   │   ├── safety/
│   │   ├── terms/
│   │   ├── privacy/
│   │   └── drop-points/
│   ├── browse/                  # Browse items (/browse)
│   │   ├── page.tsx             # Server-rendered grid
│   │   └── loading.tsx          # Suspense fallback
│   ├── items/[id]/              # Item detail (/items/:id)
│   │   ├── page.tsx             # Item detail page
│   │   ├── claim/               # Claim submission
│   │   └── claims/              # Claim review (finder)
│   │       ├── page.tsx
│   │       └── [claimId]/       # Messaging thread
│   ├── report/[type]/           # Report lost/found
│   │   └── page.tsx             # Form page (type = lost|found)
│   ├── dashboard/               # User dashboard
│   │   └── page.tsx             # My Posts, My Claims, Incoming Claims
│   ├── admin/                   # Admin panel
│   │   └── page.tsx             # Stats, items, users, locations, audit
│   ├── notifications/           # Notifications list
│   ├── actions/                 # Server Actions
│   │   ├── items.ts             # createItem, editItem, deleteItem
│   │   ├── claims.ts            # submitClaim, reviewClaim, markReturned
│   │   ├── messages.ts          # sendMessage, markNotificationsRead
│   │   └── admin.ts             # Admin-only actions
│   ├── api/cron/daily/          # Cron endpoint (Vercel Cron)
│   ├── error.tsx                # Error boundary
│   ├── not-found.tsx            # 404 page
│   └── globals.css              # Tailwind entry point
│
├── components/                  # React Components
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ... (12 total)
│   ├── nav/                     # Navigation
│   │   ├── Navbar.tsx           # Top navbar
│   │   ├── BottomNav.tsx        # Mobile bottom nav
│   │   ├── Footer.tsx
│   │   └── NotificationBell.tsx
│   ├── forms/                   # Form components
│   │   ├── ReportForm.tsx       # Report lost/found form
│   │   ├── ImageUploader.tsx    # Drag-drop image upload
│   │   └── FieldError.tsx
│   ├── browse/                  # Browse page components
│   │   ├── SearchInput.tsx      # Debounced search
│   │   ├── FilterBar.tsx        # Sidebar filters
│   │   ├── ActiveFilters.tsx    # Dismissable pills
│   │   └── Pagination.tsx
│   ├── items/                   # Item detail components
│   │   ├── ImageGallery.tsx     # Swipeable gallery
│   │   ├── ActionButtons.tsx    # Claim/Report/Share
│   │   └── MatchSuggestions.tsx
│   ├── claims/                  # Claim components
│   │   ├── ClaimForm.tsx
│   │   ├── ClaimCard.tsx        # Review card with approve/reject
│   │   └── MarkReturnedButton.tsx
│   ├── messaging/               # Chat components
│   │   ├── MessageThread.tsx    # Polling-based chat
│   │   └── MessageInput.tsx
│   ├── dashboard/               # Dashboard components
│   │   ├── DashboardTabs.tsx
│   │   ├── MyPostsTab.tsx
│   │   ├── MyClaimsTab.tsx
│   │   ├── IncomingClaimsTab.tsx
│   │   ├── EditItemDialog.tsx
│   │   ├── DeleteItemButton.tsx
│   │   └── WithdrawClaimButton.tsx
│   ├── admin/                   # Admin components
│   │   ├── AdminTabs.tsx
│   │   ├── AdminStats.tsx
│   │   └── ... (5 tabs)
│   ├── ItemCard.tsx             # Reusable item card
│   ├── StatusBadge.tsx
│   ├── CategoryChip.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   └── Skeleton.tsx
│
├── lib/                         # Business Logic & Utilities
│   ├── supabase/
│   │   ├── server.ts            # Server-side Supabase client
│   │   └── client.ts            # Browser-side client
│   ├── validators/
│   │   └── item.ts              # Zod schemas
│   ├── email/
│   │   ├── resend.ts            # Resend client
│   │   ├── templates.ts         # HTML email templates
│   │   └── sender.ts            # Email sending logic
│   ├── browse.ts                # Browse query builder
│   ├── items.ts                 # Item detail logic
│   ├── claims.ts                # Claim state machine
│   ├── matching.ts              # Match scoring algorithm
│   ├── messaging.ts             # Messaging helpers
│   ├── sanitize.ts              # Input sanitization
│   ├── security.ts              # Open redirect protection, CSRF
│   ├── images.ts                # Image compression, EXIF stripping
│   ├── env.ts                   # Env validation (Zod)
│   ├── types.ts                 # TypeScript types
│   ├── utils.ts                 # cn() helper
│   └── mock-data.ts             # Test fixtures
│
├── supabase/                    # Database
│   ├── migrations/              # SQL migrations (numbered 001-014)
│   │   ├── 001_extensions_enums.sql
│   │   ├── 002_tables.sql
│   │   ├── 003_indexes.sql
│   │   ├── 004_storage.sql
│   │   ├── 005_rls.sql
│   │   ├── 006_triggers.sql
│   │   └── ... (14 total)
│   └── seed.sql                 # Test data (4 users, 12 locations, 15 items)
│
├── tests/                       # Testing
│   ├── unit/                    # Vitest unit tests (13 files, 234 tests)
│   ├── integration/             # Integration tests (9 files, 129 tests)
│   ├── e2e/                     # Playwright E2E (11 files, 228 tests)
│   └── setup.ts                 # Test configuration
│
├── docs/                        # Documentation
│   ├── PRD.md                   # This file
│   ├── Architecture.md          # System design
│   ├── AUDIT.md                 # Functionality audit
│   └── DESIGN.md                # Visual design system
│
├── scripts/                     # Utility scripts
│   ├── lighthouse-audit.ps1    # Performance testing
│   └── README-lighthouse.md
│
├── .github/workflows/           # CI/CD
│   └── ci.yml                   # GitHub Actions (lint, test, typecheck)
│
├── .kiro/steering/              # AI agent context
│   └── data-model.md            # Database schema reference
│
├── next.config.ts               # Next.js config (security headers, images)
├── tailwind.config.ts           # Tailwind config
├── tsconfig.json                # TypeScript config (strict mode)
├── vitest.config.ts             # Unit test config
├── vitest.integration.config.ts # Integration test config
├── playwright.config.ts         # E2E test config
├── vercel.json                  # Cron schedule
├── package.json                 # Dependencies
├── pnpm-lock.yaml               # Lock file
├── .env.example                 # Env template
├── .env.local                   # Local secrets (gitignored)
├── .gitignore
├── README.md                    # Project overview
└── PROGRESS.md                  # Development log
```

---

## 4. Data Flow

### 4.1 Report Item Flow

```
User (Browser)
  ↓
  1. Fill ReportForm component
  2. Select images → ImageUploader compresses + strips EXIF
  3. uploadItemImages() uploads to Supabase Storage (client-side)
  ↓
ReportForm.onSubmit()
  ↓
Server Action: createItem()
  ↓
  4. Validate session (getUser)
  5. Check if banned
  6. Rate limit check (10/hour)
  7. Zod schema validation
  8. Sanitize text inputs
  9. Hash verification answer (SHA-256)
  10. Insert into items table (RLS enforced)
  11. Create notification for admins (if needed)
  ↓
Supabase (PostgreSQL)
  ↓
  12. Trigger: set expires_at = now() + 60 days
  13. Return item ID
  ↓
redirect('/items/:id')
```

### 4.2 Browse & Search Flow

```
User visits /browse?type=lost&category=electronics&q=laptop
  ↓
BrowsePage (Server Component)
  ↓
  1. Parse searchParams
  2. Normalize params (validate types, defaults)
  3. Check cache (30s TTL)
  ↓
  Cache HIT → return cached results
  Cache MISS ↓
  4. buildBrowseQuery()
     - Start with base: FROM items WHERE status='open'
     - Apply type filter: AND report_type='lost'
     - Apply category filter: AND category='electronics'
     - Apply text search: AND (title ILIKE '%laptop%' OR description ILIKE '%laptop%')
     - Order by: created_at DESC
     - Pagination: LIMIT 12 OFFSET 0
  ↓
Supabase (PostgreSQL)
  ↓
  5. Execute query with RLS (anon users see open items only)
  6. Use indexes:
     - idx_items_browse_covering (status, report_type, created_at, category)
     - idx_items_title_trgm (pg_trgm for fuzzy search)
  7. Return {data, count}
  ↓
  8. Cache result
  9. Render ItemCard components (grid)
  10. Render Pagination component
```

### 4.3 Claim Flow

```
User clicks "Claim this item"
  ↓
/items/:id/claim page
  ↓
ClaimForm
  ↓
  1. User enters proof text
  2. User enters verification answer (if required)
  3. User uploads proof image (optional)
  ↓
Server Action: submitClaim()
  ↓
  4. Validate session
  5. Load item (via service role to check status)
  6. Check if user is owner (reject if yes)
  7. Check duplicate claim
  8. Hash answer, compare with item.verification_answer_hash
  9. Insert into claims table (status=pending)
  10. Create notification for finder
  11. Send email to finder (via Resend)
  ↓
Finder visits /items/:id/claims
  ↓
ClaimCard component
  ↓
  12. Finder reviews proof text + image
  13. Finder clicks Approve or Reject
  ↓
Server Action: reviewClaim(action='approve')
  ↓
  14. Validate session
  15. Load claim + item
  16. Check permissions (isOwner OR isAdmin)
  17. Check state machine: canReviewClaim()
  18. Update claim.status = 'approved' (via service role)
  19. Update item.status = 'claimed' (via service role)
  20. Create notification for claimant
  21. Send email to claimant
  ↓
Claimant + Finder coordinate via messaging
  ↓
/items/:id/claims/:claimId (messaging page)
  ↓
  22. MessageThread polls every 3s
  23. MessageInput sends messages
  24. Content filter blocks URLs
  ↓
Server Action: sendMessage()
  ↓
  25. Validate session
  26. Check participant (via is_claim_participant() SQL function)
  27. Rate limit (10/min)
  28. Insert into messages table
  29. Create notification for recipient
  30. Send email digest (max 1 per 10min)
  ↓
Item handed over in person
  ↓
Finder clicks "Mark as Returned"
  ↓
Server Action: markReturned()
  ↓
  31. Validate session
  32. Check if finder
  33. Update item.status = 'resolved'
  34. Set item.resolved_at = now()
  35. Notify claimant
```

### 4.4 Cron Job Flow (Daily Expiry)

```
Vercel Cron triggers /api/cron/daily at 3 AM UTC
  ↓
Check Authorization: Bearer ${CRON_SECRET}
  ↓
  1. Connect to Supabase (service role)
  2. Query: SELECT id FROM items WHERE status='open' AND expires_at <= now()
  3. Bulk update: UPDATE items SET status='expired' WHERE id IN (...)
  4. Count updated rows
  5. Run keep-alive query: SELECT COUNT(*) FROM items
  6. Return JSON: {success: true, expired_count, total_items, timestamp}
```

---

## 5. Database Schema (Simplified)

```sql
-- Core tables
profiles (id, email, full_name, role, avatar_url, notify_email, is_banned)
  ↓ reported items
items (id, reporter_id, report_type, status, category, title, description, 
       location_id, date_occurred, expires_at, is_sensitive, 
       verification_question, verification_answer_hash)
  ↓ images
item_images (id, item_id, storage_path, bucket, sort_order)
  ↓ claims
claims (id, item_id, claimant_id, status, proof_text, proof_image_path, 
        admin_note, reviewed_by, reviewed_at)
  ↓ messages
messages (id, claim_id, sender_id, body, created_at)

-- Supporting tables
locations (id, name, building, drop_point, hours)
notifications (id, user_id, channel, event_type, payload, read_at)
audit_log (id, user_id, action, table_name, record_id, old_values, new_values)
reports (id, reporter_id, target_type, target_id, reason, status)

-- Enums
item_report_type: lost | found
item_status: open | claimed | resolved | expired
item_category: electronics | keys | accessories | clothing | etc.
user_role: student | staff | admin
claim_status: pending | approved | rejected | withdrawn
notification_channel: in_app | email
```

**Key Relationships:**
- `profiles` ↔ `items` (1:N, reporter)
- `items` ↔ `claims` (1:N)
- `claims` ↔ `messages` (1:N)
- `profiles` ↔ `claims` (1:N, claimant)
- `profiles` ↔ `notifications` (1:N)
- `locations` ↔ `items` (1:N, optional)

---

## 6. Security Architecture

### 6.1 Row-Level Security (RLS)

**Profiles:**
- Authenticated users: SELECT own + UPDATE own
- Public: SELECT (limited fields: id, full_name, avatar_url)
- Admin: Full access

**Items:**
- Public: SELECT WHERE status='open' (except sensitive images)
- Authenticated: INSERT own, UPDATE own (open only), DELETE own (if no claims)
- Admin: Full access

**Item Images:**
- Public: SELECT WHERE item.status='open' AND bucket='item-images'
- Owner/Admin/Approved Claimant: SELECT WHERE bucket='sensitive-images'

**Claims:**
- Claimant: INSERT, SELECT own, UPDATE own (withdraw only)
- Item Owner: SELECT WHERE item_id IN (own items), UPDATE via service role (approve/reject)
- Admin: Full access

**Messages:**
- Participants only: SELECT WHERE is_claim_participant(claim_id, auth.uid())
- Sender: INSERT
- No UPDATE or DELETE (immutable)

**Notifications:**
- User: SELECT own, UPDATE own (mark as read)
- System: INSERT via service role

### 6.2 Application-Layer Security

**Authentication:**
- Supabase Auth (cookie-based session)
- Server-side only (no client-side auth checks)
- Every auth-gated page: `await supabase.auth.getUser()` → redirect if null

**Input Validation:**
- **Client-side:** Zod schema in forms (immediate feedback)
- **Server-side:** Zod schema in Server Actions (security boundary)
- **Sanitization:** Strip null bytes, control chars, excessive newlines

**Rate Limiting:**
- **Posting:** 10 items per hour per IP (in-memory Map, resets on server restart)
- **Messaging:** 10 messages per minute per user per claim (DB count query)
- **API:** Vercel's built-in rate limiting (anonymous: 100/min, authenticated: 300/min)

**CSRF Protection:**
- Next.js Server Actions: Built-in CSRF tokens
- Custom: `validateCSRFHeaders()` in lib/security.ts (optional)

**Open Redirect Protection:**
- `getSafeRedirectPath()` validates all redirect URLs
- Whitelist: Only paths starting with `/` (internal)
- Reject: `//evil.com`, `http://`, `javascript:`, `\` backslashes

**Content Security Policy (CSP):**
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' (Next.js requirement)
style-src 'self' 'unsafe-inline' (Tailwind requirement)
img-src 'self' data: https://*.supabase.co
connect-src 'self' https://*.supabase.co wss://*.supabase.co
```

**Other Headers:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 7. Performance Architecture

### 7.1 Rendering Strategy

**Server Components (RSC):**
- Home page
- Browse page
- Item detail page
- Dashboard tabs
- Admin panel tabs
- All static pages

**Client Components:**
- Interactive forms (ReportForm, ClaimForm, MessageInput)
- Search input (debounced)
- Filter bar (URL updates)
- Image uploader (file handling)
- Dialogs/modals (EditItemDialog, DeleteItemButton)
- Action buttons with state (Share, Withdraw)

**Benefits:**
- Less JavaScript shipped to browser
- Faster initial page load
- Better SEO
- Server-side data fetching (no loading spinners)

### 7.2 Caching Strategy

**Database Query Caching:**
- Browse results: 30s in-memory Map (LRU, max 100 entries)
- Stats queries: 5 min (future: Redis)
- Item detail: No cache (real-time accuracy)

**CDN Caching (Vercel):**
- Static assets: 1 year (`Cache-Control: public, max-age=31536000, immutable`)
- HTML pages: No cache (dynamic)
- Images: 30 days via next/image

**Image Optimization:**
- next/image: Auto WebP/AVIF conversion, responsive sizes
- Client-side: Compress to ~1MB before upload
- EXIF stripping: Privacy + smaller files
- Lazy loading: Below-fold images

### 7.3 Database Optimization

**Indexes (16 total):**
- `idx_items_browse_covering`: Covering index for main browse query
- `idx_items_title_trgm`: GIN trigram for fuzzy search
- `idx_items_status_open`: Partial index on open items
- `idx_notifications_user_unread`: Partial index for notification bell
- See `003_indexes.sql` for full list

**Query Patterns:**
- Always use indexed columns in WHERE clauses
- LIMIT results (pagination)
- SELECT only needed columns (no SELECT *)
- Use COUNT(id) instead of COUNT(*)

**Connection Pooling:**
- Supabase: Max 15 connections (free tier)
- Serverless: Connection per request (pooler-based)

### 7.4 Bundle Optimization

**Code Splitting:**
- Dynamic imports: EditItemDialog, AdminTabs
- Route-based: Automatic via Next.js App Router
- Component-level: Manual via `next/dynamic`

**Tree Shaking:**
- All imports are ES modules (no CommonJS)
- Unused exports removed by Vercel build

**Bundle Size:**
- Initial JS: ~165 KB (after Task 16b optimizations)
- Total JS: ~250 KB
- CSS: ~12 KB

---

## 8. Deployment Architecture

```
GitHub Repository
  ↓ push to main
GitHub Actions (CI)
  ↓ lint, typecheck, test
  ↓ (all pass)
Vercel (CD)
  ↓ build Next.js app
  ↓ deploy to edge network
Production (*.vercel.app)
  ↓
Vercel Edge Network (Global CDN)
  ├── San Francisco
  ├── New York
  ├── London
  ├── Tokyo
  └── ... (28 regions)
  ↓
Supabase (us-east-1)
  ├── PostgreSQL (primary)
  ├── Storage (S3-compatible)
  └── Auth (not yet configured)
```

**Environments:**
- **Production:** `main` branch → *.vercel.app
- **Preview:** Pull requests → unique preview URL
- **Local:** `pnpm dev` → localhost:3000

**Secrets Management:**
- Local: `.env.local` (gitignored)
- Production: Vercel Environment Variables
- Validation: `lib/env.ts` (Zod schema, fails fast)

**Monitoring:**
- Logs: Vercel logs (real-time stream)
- Errors: Console (future: Sentry)
- Performance: Vercel Analytics (Web Vitals)
- Uptime: Vercel built-in

---

## 9. Testing Architecture

### 9.1 Test Pyramid

```
      E2E Tests (228 tests, Playwright)
      - Full user flows
      - Auth-gated (50% skipped until Task 3)
      - Desktop + Mobile viewports
     /                                    \
    /  Integration Tests (129 tests)      \
   /   - RLS policies                      \
  /    - Server actions                     \
 /     - Database queries                    \
/_________________________________________ \
|                                           |
|     Unit Tests (234 tests, Vitest)       |
|     - Pure functions                      |
|     - React components (RTL)              |
|     - Business logic                      |
|___________________________________________|
```

### 9.2 Test Coverage

**Unit Tests (13 files):**
- `lib/utils.test.ts` - cn() helper
- `lib/validators/item.test.ts` - Zod schemas
- `lib/images.test.ts` - Image validation
- `lib/browse.test.ts` - Query builder (34 tests)
- `lib/claims.test.ts` - State machine (36 tests)
- `lib/matching.test.ts` - Match scoring
- `lib/messaging.test.ts` - Content filter
- `tests/unit/StatusBadge.test.tsx` - Component (10 tests)
- `tests/unit/ItemCard.test.tsx` - Component (14 tests)
- `tests/unit/ReportForm.test.tsx` - Form (19 tests)
- `tests/unit/ItemDetailButtons.test.tsx` - Logic (20 tests)
- `tests/unit/dashboard.test.tsx` - Tabs
- `tests/unit/HomePage.axe.test.tsx` - Accessibility (15 tests)

**Integration Tests (9 files):**
- `rls.test.ts` - Row-Level Security (36 tests)
- `createItem.test.ts` - Item creation (11 tests)
- `browse.test.ts` - Browse queries (21 tests)
- `claims.test.ts` - Claim flow (14 tests)
- `messaging.test.ts` - Messaging (15 tests)
- `itemDetail.test.ts` - Item detail (10 tests)
- `dashboard.test.ts` - Dashboard actions (10 tests)
- `email.test.ts` - Email sending (5 tests)
- `cron.test.ts` - Cron job (3 tests)
- `admin.test.ts` - Admin actions (5+ tests)

**E2E Tests (11 files, 228 tests across 2 viewports):**
- `browse.spec.ts` - Browse page (14 scenarios)
- `item-detail.spec.ts` - Item detail (14 scenarios)
- `report-item.spec.ts` - Report flow (2 scenarios, auth-gated)
- `claim-flow.spec.ts` - Claim flow (11 scenarios)
- `messaging.spec.ts` - Chat (9 scenarios)
- `dashboard.spec.ts` - Dashboard (10 scenarios)
- `admin-panel.spec.ts` - Admin (10 scenarios)
- `image-upload.spec.ts` - Image upload (6 scenarios)
- `error-boundaries.spec.ts` - Error handling (12 scenarios)
- `accessibility.spec.ts` - WCAG compliance (19 scenarios)
- `full-audit.spec.ts` - Comprehensive audit (18 scenarios)

**Run Commands:**
```bash
pnpm test           # Unit tests (watch mode)
pnpm test:ci        # Unit tests (CI mode)
pnpm test:integration  # Integration tests
pnpm test:e2e       # E2E tests (both viewports)
```

---

## 10. Scalability Considerations

### Current Limits (Free Tier)
- **Database:** 500 MB storage, 2 GB bandwidth/month
- **Storage:** 1 GB total, 50 MB file size
- **Vercel:** 100 GB bandwidth/month, 6,000 build minutes/month
- **Concurrent Users:** ~50-100 (limited by DB connections)

### Scaling Path (if needed)

**Phase 1: Optimize (Current)**
- ✅ Caching (30s browse, 5min stats)
- ✅ Indexes (covering indexes, partial indexes)
- ✅ Image compression (~1MB per image)
- ✅ Code splitting (dynamic imports)
- ✅ CDN (Vercel Edge, next/image)

**Phase 2: Upgrade Tiers ($20-50/month)**
- Supabase Pro: 8 GB storage, 50 GB bandwidth
- Vercel Pro: 1 TB bandwidth
- Resend: 50,000 emails/month

**Phase 3: Optimize Further ($0)**
- Redis caching (Upstash free tier)
- Image CDN (Cloudinary free tier)
- Database read replicas (if needed)

**Phase 4: Scale Infrastructure ($100+/month)**
- Dedicated database server
- S3 for storage
- Load balancer
- Monitoring (Sentry, LogRocket)

**Estimated Capacity:**
- Current: 1,000 users, 5,000 items, 50 concurrent
- Phase 2: 10,000 users, 50,000 items, 500 concurrent
- Phase 3: 50,000 users, 250,000 items, 2,000 concurrent

---

## 11. Disaster Recovery

### Backup Strategy
- **Database:** Supabase auto-backups (daily, 7-day retention)
- **Manual Backups:** `pg_dump` weekly (future)
- **Code:** Git (GitHub, remote backup)
- **Environment:** `.env.local.template` + documentation

### Recovery Procedures

**Database Failure:**
1. Contact Supabase support
2. Restore from latest backup (up to 24h data loss)
3. Verify data integrity (run integration tests)
4. Resume service

**Storage Failure:**
1. Images may be unrecoverable (no backup)
2. Users re-upload images
3. Consider cloud backup (future)

**Vercel Deployment Failure:**
1. Check GitHub Actions logs
2. Roll back to previous deployment (Vercel dashboard)
3. Fix issue in new commit
4. Redeploy

**Total Platform Failure:**
1. Check Supabase status page
2. Check Vercel status page
3. If both down: Wait for providers
4. If self-inflicted: Roll back code, restore DB

---

## 12. Future Architecture Improvements

### Short-Term (1-3 months)
- [ ] Implement authentication (Task 3) — **blocker**
- [ ] Add Redis caching (Upstash)
- [ ] Set up error monitoring (Sentry)
- [ ] Add web vitals tracking
- [ ] Implement request logging

### Medium-Term (3-6 months)
- [ ] PWA support (offline mode)
- [ ] WebSocket for real-time messaging (replace polling)
- [ ] Background jobs (queue for emails, notifications)
- [ ] Database read replicas
- [ ] Image CDN (Cloudinary/ImageKit)

### Long-Term (6-12 months)
- [ ] Multi-campus support (database sharding)
- [ ] AI-powered image matching (TensorFlow.js)
- [ ] Mobile native apps (React Native)
- [ ] Microservices architecture (if needed)
- [ ] GraphQL API (for mobile apps)

---

## Appendix: Key Architectural Decisions

### Why Next.js App Router?
- **Server Components:** Less JS, faster loads
- **Server Actions:** No REST API needed, type-safe
- **File-based routing:** Convention over configuration
- **Vercel deployment:** Zero-config, edge functions

### Why Supabase?
- **Free tier:** PostgreSQL + Storage + Auth
- **RLS:** Built-in row-level security
- **Real-time:** WebSocket support (future)
- **Developer experience:** Auto-generated types, SQL-first

### Why No Redux/Zustand?
- **Server Components:** State lives on server
- **URL as state:** Search params for filters
- **React hooks:** Sufficient for local state
- **Server Actions:** Mutations without client state

### Why pnpm?
- **Fast:** Hard links, efficient caching
- **Strict:** No phantom dependencies
- **Workspace support:** Monorepo-ready (future)

### Why Vitest over Jest?
- **Fast:** Vite-powered, ESM-native
- **Compatible:** Jest-compatible API
- **Modern:** Better TypeScript support

### Why Playwright over Cypress?
- **Multi-browser:** Chromium, Firefox, WebKit
- **True parallelism:** Faster test runs
- **Auto-wait:** Less flaky tests
- **Better debugging:** Time-travel, trace viewer

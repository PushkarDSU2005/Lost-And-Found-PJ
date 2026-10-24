# Project Phases — Lost & Found Platform

**Incremental Development Roadmap**

---

## Purpose

This document breaks down the Lost & Found platform development into **manageable phases**, each with clear deliverables and success criteria. Each phase builds on the previous, allowing for iterative development, testing, and feedback.

---

## Phase Overview

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **0** | Project Setup | 1 day | ✅ Complete |
| **1** | Database & Schema | 2 days | ✅ Complete |
| **2** | Core UI Components | 3 days | ✅ Complete |
| **3** | Authentication | 2 days | 🔄 In Progress |
| **4** | Item Reporting | 3 days | ⏸️ Blocked by Phase 3 |
| **5** | Search & Discovery | 3 days | 📋 Planned |
| **6** | Claims System | 4 days | 📋 Planned |
| **7** | Notifications | 2 days | 📋 Planned |
| **8** | Admin Dashboard | 3 days | 📋 Planned |
| **9** | Polish & Performance | 3 days | 📋 Planned |
| **10** | Production Launch | 2 days | 📋 Planned |

**Total Estimated Duration**: 28 days  
**Current Progress**: 55% complete (Phases 0–2 done, Phase 3 in progress)

---

## Phase 0: Project Setup ✅

**Goal**: Establish development environment and tooling.

### Deliverables
- [x] Next.js 15.3.3 project initialized
- [x] TypeScript configured (strict mode)
- [x] Tailwind CSS v4 installed
- [x] ESLint + Prettier configured
- [x] Vitest + Testing Library setup
- [x] Playwright installed
- [x] Git repository initialized
- [x] `.gitignore` configured
- [x] `package.json` scripts (dev, build, test, lint)

### Success Criteria
- ✅ `npm run dev` starts development server
- ✅ `npm run build` produces production build
- ✅ `npm run lint` passes
- ✅ `npm run test` runs (0 tests initially OK)

### Artifacts
- `/package.json` — dependencies locked
- `/tsconfig.json` — TypeScript configuration
- `/tailwind.config.ts` — Tailwind v4 setup
- `/vitest.config.ts` — test runner config

---

## Phase 1: Database & Schema ✅

**Goal**: Design and implement PostgreSQL schema with RLS policies.

### Deliverables
- [x] Supabase project created
- [x] Database types defined (enums, tables)
- [x] 14 migrations written:
  - [x] 001: Create enums
  - [x] 002: Create profiles table
  - [x] 003: Create locations table
  - [x] 004: Create items table
  - [x] 005: Create item_images table
  - [x] 006: Create claims table
  - [x] 007: Create notifications table
  - [x] 008: Create storage buckets
  - [x] 009: Add indexes (trigram, compound)
  - [x] 010: Add RLS policies (profiles)
  - [x] 011: Add RLS policies (items, claims)
  - [x] 012: Add triggers (auth, updated_at, status)
  - [x] 013: Seed locations
  - [x] 014: Add helper functions (search, stats)
- [x] TypeScript types generated (`database.types.ts`)
- [x] Integration tests for RLS (129 tests)

### Success Criteria
- ✅ All migrations apply cleanly (`supabase db push`)
- ✅ RLS policies tested (anon, student, admin personas)
- ✅ 129 integration tests pass
- ✅ Database types up-to-date

### Artifacts
- `/supabase/migrations/*.sql` — 14 migration files
- `/lib/database.types.ts` — generated types
- `/tests/integration/rls.test.ts` — RLS test suite
- `/docs/data-model.md` — schema documentation

---

## Phase 2: Core UI Components ✅

**Goal**: Build reusable UI primitives and layout structure.

### Deliverables
- [x] Design system defined (`/docs/DESIGN.md`)
- [x] Tailwind theme configured (colors, fonts, spacing)
- [x] Core components built:
  - [x] `<Button>` — 4 variants, 3 sizes
  - [x] `<Card>` — item-card, stat-card, claim-card
  - [x] `<Input>` — text, email, textarea, select
  - [x] `<Modal>` — dialog primitive
  - [x] `<Badge>` — status, category badges
  - [x] `<Tabs>` — navigation tabs
  - [x] `<Avatar>` — user profile image
  - [x] `<Spinner>` — loading states
- [x] Layout components:
  - [x] `<NavBar>` — top navigation
  - [x] `<BottomNav>` — mobile navigation
  - [x] `<Sidebar>` — desktop sidebar (admin)
- [x] Unit tests for components (78 tests)

### Success Criteria
- ✅ Storybook-style visual review (manual)
- ✅ All components pass a11y checks
- ✅ 78 unit tests pass
- ✅ No console warnings

### Artifacts
- `/components/ui/*.tsx` — 12 reusable components
- `/components/layout/*.tsx` — navigation components
- `/tests/unit/components/*.test.tsx` — component tests
- `/docs/DESIGN.md` — design tokens

---

## Phase 3: Authentication 🔄

**Goal**: Implement secure user authentication and authorization.

### Deliverables
- [x] Supabase Auth configured (email + OAuth)
- [x] Auth helper functions (`lib/supabase/server.ts`, `client.ts`)
- [x] Auth context provider (`components/auth-provider.tsx`)
- [ ] **Login page** (`app/login/page.tsx`)
- [ ] **Sign-up page** (`app/signup/page.tsx`)
- [ ] **Password reset flow** (`app/reset-password/page.tsx`)
- [ ] **Profile page** (`app/profile/page.tsx`)
- [ ] Auth middleware (redirect logic)
- [ ] Auth guards in protected routes
- [ ] OAuth providers (Google, GitHub)
- [ ] Email verification flow
- [ ] Integration tests (login, signup, reset)

### Success Criteria
- [ ] User can sign up with email
- [ ] User can log in with email + password
- [ ] User can log in with Google/GitHub
- [ ] User can reset password via email
- [ ] Protected routes redirect to `/login` if not authenticated
- [ ] Session persists across page reloads
- [ ] 15+ auth integration tests pass

### Current Blockers
- **Bug #1** (P0): Login/signup pages not implemented → **This phase is blocked**

### Artifacts
- `/app/login/page.tsx` — login form
- `/app/signup/page.tsx` — registration form
- `/lib/supabase/auth.ts` — auth utilities
- `/tests/integration/auth.test.ts` — auth tests

---

## Phase 4: Item Reporting ⏸️

**Goal**: Enable users to report lost and found items.

### Deliverables
- [x] Report form UI (`app/report/[type]/page.tsx`)
- [x] Server action (`lib/actions/items.ts`)
- [x] Form validation (Zod schema)
- [x] Image upload (Supabase Storage)
- [x] Location picker (dropdown)
- [x] Category selector
- [x] Date picker
- [ ] **Auth gate** (redirect if not logged in) — **Fixed in Task 18**
- [ ] Success/error states
- [ ] Form submission tests
- [ ] Image upload tests

### Success Criteria
- [ ] User can submit lost item report
- [ ] User can submit found item report
- [ ] Images upload to `item-images` bucket
- [ ] Validation errors shown inline
- [ ] Success message shown after submission
- [ ] Item appears in database with correct RLS
- [ ] 10+ tests pass (form, validation, upload)

### Dependencies
- **Blocked by**: Phase 3 (Authentication) — Auth gate requires login page

### Artifacts
- `/app/report/lost/page.tsx` — lost item form
- `/app/report/found/page.tsx` — found item form
- `/lib/actions/items.ts` — createItem server action
- `/tests/integration/items.test.ts` — item CRUD tests

---

## Phase 5: Search & Discovery 📋

**Goal**: Allow users to search and browse items.

### Deliverables
- [ ] Item list page (`app/items/page.tsx`)
- [ ] Search bar (trigram search)
- [ ] Filter panel (category, status, date range)
- [ ] Sort controls (newest, oldest, relevance)
- [ ] Pagination (20 items per page)
- [ ] Item detail page (`app/items/[id]/page.tsx`)
- [ ] Image gallery (lightbox)
- [ ] Contact reporter button
- [ ] "Similar items" suggestions
- [ ] Search tests (query, filters, pagination)

### Success Criteria
- [ ] User can search by keyword (fuzzy match)
- [ ] User can filter by category
- [ ] User can filter by status (open, claimed, resolved)
- [ ] User can filter by date range
- [ ] Search results are paginated
- [ ] Item detail page shows all info + images
- [ ] Search leverages `idx_items_title_trgm` index
- [ ] 20+ tests pass (search, filters, pagination)

### Dependencies
- **Requires**: Phase 3 (Authentication) — Auth context for user-specific results
- **Requires**: Phase 4 (Item Reporting) — Seed data for testing

### Artifacts
- `/app/items/page.tsx` — item list with search
- `/app/items/[id]/page.tsx` — item detail
- `/lib/actions/search.ts` — search logic
- `/tests/integration/search.test.ts` — search tests

---

## Phase 6: Claims System 📋

**Goal**: Enable users to claim found items and verify ownership.

### Deliverables
- [ ] Claim form (`app/items/[id]/claim/page.tsx`)
- [ ] Proof text + image upload (sensitive bucket)
- [ ] Claim submission (server action)
- [ ] Admin review page (`app/admin/claims/page.tsx`)
- [ ] Approve/reject actions
- [ ] Notification triggers (claim submitted, approved, rejected)
- [ ] Claim status tracking
- [ ] RLS tests (claimant, item owner, admin)

### Success Criteria
- [ ] User can submit claim on found item
- [ ] Proof image uploads to `sensitive-images` bucket
- [ ] Admin sees pending claims in dashboard
- [ ] Admin can approve/reject claim
- [ ] Item status updates to `claimed` on approval
- [ ] Claimant receives notification on approval
- [ ] Item owner receives notification on claim submission
- [ ] 15+ tests pass (claim CRUD, RLS, status updates)

### Dependencies
- **Requires**: Phase 3 (Authentication) — Auth guards
- **Requires**: Phase 5 (Search & Discovery) — Item detail page with "Claim" button
- **Requires**: Phase 8 (Admin Dashboard) — Admin claim review UI

### Artifacts
- `/app/items/[id]/claim/page.tsx` — claim form
- `/lib/actions/claims.ts` — claim CRUD actions
- `/app/admin/claims/page.tsx` — admin review
- `/tests/integration/claims.test.ts` — claim tests

---

## Phase 7: Notifications 📋

**Goal**: Notify users of important events (claims, matches, expirations).

### Deliverables
- [ ] Notification queue (background job)
- [ ] In-app notifications (`app/notifications/page.tsx`)
- [ ] Email notifications (Supabase Auth email templates)
- [ ] Notification bell icon (unread count badge)
- [ ] Mark as read functionality
- [ ] Notification preferences (`app/profile/notifications/page.tsx`)
- [ ] Notification types:
  - [ ] Claim submitted on your item
  - [ ] Claim approved/rejected
  - [ ] Item expiring soon (7 days before)
  - [ ] Potential match found (similar lost/found items)
- [ ] Tests (notification creation, email sending, preferences)

### Success Criteria
- [ ] User sees in-app notifications
- [ ] User receives email for important events (if enabled)
- [ ] Unread count badge updates in real-time
- [ ] User can mark notifications as read
- [ ] User can configure notification preferences
- [ ] Emails use branded templates (logo, colors)
- [ ] 10+ tests pass (notification CRUD, preferences)

### Dependencies
- **Requires**: Phase 3 (Authentication) — User context
- **Requires**: Phase 6 (Claims System) — Trigger events

### Artifacts
- `/app/notifications/page.tsx` — notification list
- `/lib/actions/notifications.ts` — notification logic
- `/supabase/functions/send-email/` — email sender (Edge Function)
- `/tests/integration/notifications.test.ts` — tests

---

## Phase 8: Admin Dashboard 📋

**Goal**: Provide moderation and analytics tools for admins.

### Deliverables
- [ ] Admin layout (`app/admin/layout.tsx`)
- [ ] Admin sidebar (navigation)
- [ ] Dashboard home (`app/admin/page.tsx`)
  - [ ] Stats: total items, open items, claims pending
  - [ ] Charts: items over time, category breakdown
- [ ] Item management (`app/admin/items/page.tsx`)
  - [ ] View all items (override RLS with admin role)
  - [ ] Edit item status (mark resolved, expired)
  - [ ] Delete inappropriate items
- [ ] Claim management (`app/admin/claims/page.tsx`)
  - [ ] Review pending claims
  - [ ] Approve/reject with notes
- [ ] User management (`app/admin/users/page.tsx`)
  - [ ] View all users
  - [ ] Change user roles (student ↔ staff ↔ admin)
  - [ ] Ban abusive users
- [ ] Location management (`app/admin/locations/page.tsx`)
  - [ ] Add/edit/delete locations
- [ ] Analytics (`app/admin/analytics/page.tsx`)
  - [ ] Resolution rate
  - [ ] Average claim time
  - [ ] Top categories
- [ ] Audit log (track admin actions)

### Success Criteria
- [ ] Admin can view all items (bypassing user RLS)
- [ ] Admin can approve/reject claims
- [ ] Admin can change user roles
- [ ] Admin can add/edit locations
- [ ] Dashboard shows real-time stats
- [ ] Analytics charts render correctly
- [ ] Non-admins cannot access `/admin/*` routes
- [ ] 20+ tests pass (admin actions, RLS, analytics)

### Dependencies
- **Requires**: Phase 3 (Authentication) — Role-based access control
- **Requires**: Phase 6 (Claims System) — Claim review UI

### Artifacts
- `/app/admin/**/*.tsx` — admin pages
- `/lib/actions/admin.ts` — admin-only actions
- `/tests/integration/admin.test.ts` — admin RLS tests

---

## Phase 9: Polish & Performance 📋

**Goal**: Optimize performance, accessibility, and user experience.

### Deliverables
- [ ] Performance audit (Lighthouse)
  - [ ] Achieve 90+ performance score
  - [ ] Achieve 100 accessibility score
  - [ ] Achieve 90+ best practices score
- [ ] Image optimization (WebP, lazy loading)
- [ ] Code splitting (lazy load heavy components)
- [ ] Bundle size optimization (<500KB first-load JS)
- [ ] Accessibility audit (WCAG 2.1 AA)
  - [ ] All interactive elements keyboard-navigable
  - [ ] ARIA labels for screen readers
  - [ ] Color contrast ≥4.5:1
- [ ] Mobile responsiveness (320px → 1920px)
- [ ] Loading states (skeletons, spinners)
- [ ] Error boundaries (catch React errors gracefully)
- [ ] 404 / 500 error pages
- [ ] Meta tags (SEO, Open Graph)
- [ ] Sitemap + robots.txt

### Success Criteria
- [ ] Lighthouse score 90+ on all metrics
- [ ] All pages keyboard-navigable
- [ ] No console errors/warnings
- [ ] Mobile menu works on iPhone SE (375px)
- [ ] All images use `next/image` with proper `alt`
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] Manual testing on Chrome, Firefox, Safari

### Dependencies
- **Requires**: All previous phases (full feature set implemented)

### Artifacts
- `/app/not-found.tsx` — custom 404 page
- `/app/error.tsx` — error boundary
- `/public/sitemap.xml` — SEO sitemap
- `/docs/ACCESSIBILITY.md` — a11y compliance report

---

## Phase 10: Production Launch 📋

**Goal**: Deploy to production and monitor initial usage.

### Deliverables
- [ ] Environment setup (Vercel production project)
- [ ] Production database (Supabase production instance)
- [ ] Environment variables configured (Vercel dashboard)
- [ ] Domain setup (custom domain or Vercel subdomain)
- [ ] SSL certificate (automatic via Vercel)
- [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Run tests on PR
  - [ ] Deploy to preview on PR
  - [ ] Deploy to production on merge to `main`
- [ ] Monitoring setup (Vercel Analytics, Sentry)
- [ ] Backup strategy (Supabase daily backups)
- [ ] Rollback plan (Vercel instant rollback)
- [ ] Launch checklist:
  - [ ] All tests passing (unit, integration, E2E)
  - [ ] No known P0/P1 bugs
  - [ ] Documentation up-to-date
  - [ ] Admin accounts created
  - [ ] Seed data loaded (locations)
  - [ ] Email templates tested
  - [ ] Performance metrics meet targets
- [ ] Soft launch (internal beta with 10–20 users)
- [ ] Public launch announcement

### Success Criteria
- [ ] Application accessible at production URL
- [ ] HTTPS enabled (A+ on SSL Labs)
- [ ] All environment variables set
- [ ] Database backups running daily
- [ ] Error tracking active (Sentry)
- [ ] Analytics tracking active (Vercel)
- [ ] No critical errors in first 24 hours
- [ ] <1s response time for 95% of requests

### Dependencies
- **Requires**: Phase 9 (Polish & Performance) — Production-ready code

### Artifacts
- `/docs/DEPLOYMENT.md` — deployment guide
- `/.github/workflows/ci.yml` — GitHub Actions config
- `/CHANGELOG.md` — release notes

---

## Cross-Phase Considerations

### Testing Strategy
Each phase includes:
- **Unit tests** — components, utilities (Vitest)
- **Integration tests** — Server Actions, RLS policies (Vitest + Supabase)
- **E2E tests** — critical user flows (Playwright)

**Test coverage target**: 80% by Phase 9

### Documentation Updates
After each phase, update:
- `README.md` — getting started guide
- `PROGRESS.md` — completed tasks
- `docs/Architecture.md` — if architecture changes
- `docs/PRD.md` — if requirements change
- `CHANGELOG.md` — user-facing changes

### Code Review
Each phase ends with:
- Self-review (AI or developer)
- Manual testing (happy path + edge cases)
- Test coverage check (`npm run test:coverage`)
- TypeScript check (`npm run build`)
- Lint check (`npm run lint`)

### Git Workflow
- **Branch naming**: `phase-X-feature-name` (e.g., `phase-4-item-reporting`)
- **Commits**: Atomic commits with descriptive messages
- **PRs**: One PR per phase (or sub-phase if large)
- **Merges**: Squash merge to `main` after approval

---

## Phase Transition Checklist

Before moving to the next phase:
- [ ] All deliverables completed
- [ ] All success criteria met
- [ ] Tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Merged to `main`
- [ ] Deployed to preview environment (tested manually)
- [ ] Retrospective notes added to `PROGRESS.md`

---

## Risk Mitigation

| Phase | Risk | Mitigation |
|-------|------|------------|
| 3 | OAuth provider setup complex | Use email auth first, add OAuth later |
| 4 | Image upload failures | Add retry logic, show upload progress |
| 5 | Search performance slow | Use trigram index, limit results to 100 |
| 6 | Claim fraud | Require proof image, admin review |
| 7 | Email deliverability | Use Supabase Auth SMTP, test with multiple providers |
| 8 | Admin abuse | Audit log, require confirmation for destructive actions |
| 9 | Performance regressions | Add Lighthouse CI, block PRs below 90 score |
| 10 | Production downtime | Blue-green deployment, instant rollback via Vercel |

---

## Timeline Visualization

```
Month 1                     Month 2
Week 1   Week 2   Week 3   Week 4   Week 1   Week 2
[0][1 ][2      ][3  ][4   ][5   ][6    ][7  ][8   ][9   ][10 ]
 ✅ ✅   ✅       🔄   ⏸️     📋     📋     📋    📋    📋    📋
```

**Legend**:
- ✅ Complete
- 🔄 In Progress
- ⏸️ Blocked
- 📋 Planned

---

## Current Status (2026-10-17)

**Phase 3 (Authentication)** is in progress but blocked by missing login/signup pages (Bug #1, P0).

**Next Immediate Actions**:
1. Create `/app/login/page.tsx` (login form)
2. Create `/app/signup/page.tsx` (registration form)
3. Test auth flow (signup → login → protected route)
4. Unblock Phase 4 (Item Reporting)

**Progress**: 55% complete (Phases 0–2 done)

---

**Last Updated**: 2026-10-17  
**Document Owner**: Project Lead  
**Review Cadence**: End of each phase

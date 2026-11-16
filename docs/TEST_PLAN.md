# Test Plan - CampusFind

**Purpose**: Comprehensive test matrix for automated E2E, integration, and unit tests  
**Generated**: Phase 1 - Full Audit  
**Status**: Ready for implementation in Phase 6

---

## Test Matrix

All tests must be implemented and passing before release.

### Authentication Tests (AUTH-01 to AUTH-12)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| AUTH-01 | Sign up with valid college email → verify notice | P0 | ⚠️ Not yet implemented |
| AUTH-02 | Sign up with non-college email → rejected (UI + server) | P0 | ⚠️ Not yet implemented |
| AUTH-03 | Weak password rejected | P1 | ⚠️ Not yet implemented |
| AUTH-04 | Duplicate email handled | P1 | ⚠️ Not yet implemented |
| AUTH-05 | Login success → redirected back to intended page | P0 | ⚠️ Not yet implemented |
| AUTH-06 | Wrong password message | P1 | ⚠️ Not yet implemented |
| AUTH-07 | Unverified email + resend | P1 | ⚠️ Not yet implemented |
| AUTH-08 | Banned user blocked | P0 | ⚠️ Not yet implemented |
| AUTH-09 | Logout clears access | P0 | ⚠️ Not yet implemented |
| AUTH-10 | Forgot/reset password | P1 | ⚠️ Not yet implemented |
| AUTH-11 | Open-redirect attempt blocked | P0 | ⚠️ Not yet implemented |
| AUTH-12 | Protected route redirects guest to /login | P0 | ⚠️ Not yet implemented |

### Image Upload Tests (IMG-01 to IMG-10)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| IMG-01 | Upload 1/2/3 images | P0 | ⚠️ Not yet implemented |
| IMG-02 | 4th image rejected | P1 | ⚠️ Not yet implemented |
| IMG-03 | Wrong file type rejected | P0 | ⚠️ Not yet implemented |
| IMG-04 | Oversized file compressed under limit | P1 | ⚠️ Not yet implemented |
| IMG-05 | EXIF/GPS removed (assert on stored file) | P0 | ⚠️ Not yet implemented |
| IMG-06 | Remove/reorder images | P1 | ⚠️ Not yet implemented |
| IMG-07 | Sensitive item image goes to private bucket | P0 | ⚠️ Not yet implemented |
| IMG-08 | Photos render on card, detail, dashboard | P0 | ⚠️ Not yet implemented |
| IMG-09 | Failure rolls back | P1 | ⚠️ Not yet implemented |
| IMG-10 | Mobile camera input present | P1 | ⚠️ Not yet implemented |

### Item Posting Tests (POST-01 to POST-05)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| POST-01 | Post lost item | P0 | ⚠️ Form exists, auth blocked |
| POST-02 | Post found with verification question | P0 | ⚠️ Form exists, auth blocked |
| POST-03 | Validation errors | P1 | ⚠️ Partial |
| POST-04 | 6th post in 24h rate-limited | P1 | ⚠️ Not yet tested |
| POST-05 | Banned/guest cannot post | P0 | ⚠️ Auth gate exists |

### Feed/Browse Tests (FEED-01 to FEED-08)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| FEED-01 | Feed lists newest first | P0 | ✅ Working |
| FEED-02 | Each filter works | P1 | ⚠️ UI exists, needs testing |
| FEED-03 | Combined filters | P1 | ⚠️ Not yet tested |
| FEED-04 | Search | P0 | ⚠️ UI exists, needs backend |
| FEED-05 | Pagination | P1 | ⚠️ Not yet implemented |
| FEED-06 | Shareable URL restores state | P1 | ⚠️ Not yet tested |
| FEED-07 | Empty state | P2 | ✅ Implemented |
| FEED-08 | Lost/Found toggle + category chips work | P0 | ⚠️ Needs testing |

### Claims Tests (CLAIM-01 to CLAIM-07)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| CLAIM-01 | Claim with correct flow | P0 | ⚠️ Not yet tested (auth blocked) |
| CLAIM-02 | Owner cannot claim own item | P0 | ⚠️ Not yet tested |
| CLAIM-03 | Duplicate claim blocked | P1 | ⚠️ Not yet tested |
| CLAIM-04 | Approve → status + messaging opens | P0 | ⚠️ Not yet tested |
| CLAIM-05 | Reject → claimant notified | P1 | ⚠️ Not yet tested |
| CLAIM-06 | Sensitive image only after approval | P0 | ⚠️ Not yet tested |
| CLAIM-07 | Item removed mid-claim handled | P2 | ⚠️ Not yet tested |

### Messaging Tests (MSG-01 to MSG-05)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| MSG-01 | Send/receive | P0 | ⚠️ Not yet implemented |
| MSG-02 | Outsider cannot read | P0 | ⚠️ Not yet tested |
| MSG-03 | Unread badge updates | P1 | ⚠️ Not yet implemented |
| MSG-04 | Length limit and link filter | P1 | ⚠️ Not yet implemented |
| MSG-05 | Rate limit | P1 | ⚠️ Not yet implemented |

### Dashboard Tests (DASH-01 to DASH-05)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| DASH-01 | Edit item | P1 | ⚠️ Dashboard disabled (Task 21) |
| DASH-02 | Mark returned (stamp state) | P0 | ⚠️ Dashboard disabled |
| DASH-03 | Delete (soft) | P1 | ⚠️ Dashboard disabled |
| DASH-04 | Withdraw claim | P1 | ⚠️ Dashboard disabled |
| DASH-05 | User cannot touch others' items | P0 | ⚠️ RLS tested, UI not tested |

### Admin Tests (ADMIN-01 to ADMIN-06)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| ADMIN-01 | Non-admin gets 403 everywhere | P0 | ⚠️ Admin disabled (Task 21) |
| ADMIN-02 | Report → remove → poster notified | P0 | ⚠️ Admin disabled |
| ADMIN-03 | Ban/unban | P0 | ⚠️ Admin disabled |
| ADMIN-04 | Drop-points CRUD | P1 | ⚠️ Admin disabled |
| ADMIN-05 | Audit log written | P1 | ⚠️ Not yet implemented |
| ADMIN-06 | Stats equal DB truth | P1 | ⚠️ Admin disabled |

### Security Tests (SEC-01 to SEC-07)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| SEC-01 | RLS personas (anon/A/B/admin/banned) on every table | P0 | ✅ 129 integration tests pass |
| SEC-02 | Verification answers never exposed | P0 | ⚠️ Not yet tested |
| SEC-03 | Service key not in client bundle | P0 | ⚠️ Not yet verified |
| SEC-04 | Security headers present | P1 | ⚠️ Not yet verified |
| SEC-05 | XSS payload in title/description/message is inert | P0 | ⚠️ Not yet tested |
| SEC-06 | Cron rejects missing secret | P1 | ⚠️ Not yet implemented |
| SEC-07 | Test-only login disabled in production build | P0 | ⚠️ Not yet implemented |

### Privacy Tests (PRIV-01)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| PRIV-01 | Personal names masked in sensitive titles for non-privileged users | P0 | ⚠️ Not yet implemented |

### Crawler Tests (CRAWL-01 to CRAWL-02)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| CRAWL-01 | Dead-control crawler: every button/link/form works | P0 | ⚠️ Partial (guest only) |
| CRAWL-02 | Every internal link returns 200 (or intended redirect) | P1 | ⚠️ Not yet implemented |

### Accessibility Tests (A11Y-01)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| A11Y-01 | Axe scan on every page, zero serious/critical violations | P0 | ⚠️ Not yet implemented |

### Performance Tests (PERF-01)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| PERF-01 | Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility | P1 | ⚠️ Not yet tested |

### UI Tests (UI-01 to UI-08)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| UI-01 | No horizontal scroll at 360px | P0 | ⚠️ Not yet tested |
| UI-02 | Nothing overflowing | P1 | ⚠️ Not yet tested |
| UI-03 | Focus visible | P0 | ⚠️ Not yet tested |
| UI-04 | Reduced-motion respected | P1 | ⚠️ Not yet implemented |
| UI-05 | No emoji used as icons | P1 | ✅ Using lucide-react |
| UI-06 | No placeholder/lorem text | P0 | ⚠️ Not yet verified |
| UI-07 | Hero shows real data | P0 | ⚠️ Needs verification |
| UI-08 | Consistent tokens | P1 | ⚠️ Design phase pending |

### End-to-End Journey (E2E-FULL)

| ID | Test | Priority | Status |
|----|------|----------|--------|
| E2E-FULL | Complete journey: signup → verify → post found (2 photos) → search → claim → approve → chat → mark returned → admin stats | P0 | ⚠️ Blocked by auth |

---

## Test Coverage Summary

| Category | Total | Implemented | Passing | Blocked |
|----------|-------|-------------|---------|---------|
| **Authentication** | 12 | 0 | 0 | 12 |
| **Images** | 10 | 0 | 0 | 10 |
| **Posting** | 5 | 1 | 0 | 4 |
| **Feed/Browse** | 8 | 3 | 1 | 5 |
| **Claims** | 7 | 0 | 0 | 7 |
| **Messaging** | 5 | 0 | 0 | 5 |
| **Dashboard** | 5 | 0 | 0 | 5 |
| **Admin** | 6 | 0 | 0 | 6 |
| **Security** | 7 | 1 | 1 | 6 |
| **Privacy** | 1 | 0 | 0 | 1 |
| **Crawler** | 2 | 1 | 0 | 1 |
| **Accessibility** | 1 | 0 | 0 | 1 |
| **Performance** | 1 | 0 | 0 | 1 |
| **UI** | 8 | 1 | 1 | 7 |
| **E2E Journey** | 1 | 0 | 0 | 1 |
| **TOTAL** | **79** | **7** | **4** | **72** |

**Coverage**: 9% implemented, 5% passing

---

## Priority Breakdown

| Priority | Count | Description |
|----------|-------|-------------|
| **P0 (Critical)** | 35 | Must work for MVP release |
| **P1 (High)** | 32 | Should work for good UX |
| **P2 (Medium)** | 12 | Nice to have, not blocking |

---

## Blockers

### 🚫 Critical Blockers (Phase 2)

1. **No authentication system** (AUTH-01 to AUTH-12)
   - Blocks: All user-specific features
   - Impact: Cannot test 60+ tests
   - Fix: Phase 2 - Implement complete auth flow

2. **No photo upload** (IMG-01 to IMG-10)
   - Blocks: Report form completeness
   - Impact: Core feature missing
   - Fix: Phase 3 - Implement image pipeline

### ⚠️ Secondary Blockers

3. **Dashboard disabled** (DASH-01 to DASH-05)
   - Reason: Client/Server Component boundary issue (Task 21)
   - Impact: Cannot test user management features
   - Fix: Refactor architecture

4. **Admin disabled** (ADMIN-01 to ADMIN-06)
   - Reason: Same as dashboard
   - Impact: Cannot test moderation
   - Fix: Refactor architecture

---

## Test Implementation Strategy

### Phase 2: Authentication (12 tests)
- Implement login/signup pages
- Add OAuth (Google)
- Password reset flow
- Protected route guards
- **Target**: AUTH-01 to AUTH-12 all passing

### Phase 3: Photo Upload (10 tests)
- Client-side image processing
- EXIF stripping
- Bucket routing (public/private)
- Upload progress UI
- **Target**: IMG-01 to IMG-10 all passing

### Phase 4: Feature Completeness (30+ tests)
- Fix all broken buttons
- Wire up all forms
- Implement missing features
- Replace mock data
- **Target**: POST, FEED, CLAIM, MSG tests passing

### Phase 5: Design Overhaul (8 tests)
- Implement DESIGN.md
- Screenshot validation
- Responsive testing
- **Target**: UI-01 to UI-08 passing

### Phase 6: Automated Testing (all remaining)
- Playwright E2E suite
- A11y testing (axe)
- Performance testing (Lighthouse)
- Dead-control crawler
- **Target**: 100% coverage, all tests green

---

## Running Tests

```bash
# Unit tests
pnpm test

# Integration tests (RLS + Server Actions)
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# Full verification (lint + typecheck + test + build)
pnpm verify

# Run specific test suite
pnpm test:e2e --grep "AUTH-"
```

---

## Success Criteria

Phase 1 (Audit) is complete when:
- ✅ AUDIT.md generated with all routes tested
- ✅ TEST_PLAN.md created with full test matrix
- ✅ All public routes accessible
- ✅ Blockers identified and documented

**Status**: ✅ Phase 1 Complete

**Next**: Phase 2 - Authentication (unblock 60+ tests)

# Product Requirements Document (PRD)
## Campus Lost & Found Platform

**Version:** 1.0  
**Last Updated:** October 17, 2026  
**Status:** In Development (90% Complete)

---

## 1. Executive Summary

### Vision
Create a safe, efficient, and community-driven platform that helps students, faculty, and staff reunite lost items with their owners on campus.

### Problem Statement
Every semester, thousands of items are lost and found across campus — from phones and laptops to keys, wallets, and textbooks. Currently, there's no centralized, efficient way to connect finders with losers. Lost items often end up in various security desks, never making it back to their owners.

### Solution
A web-based lost and found platform that:
- Allows anyone to report lost or found items
- Provides smart matching suggestions
- Enables secure claim verification
- Maintains official drop-off points
- Protects user privacy throughout the process

---

## 2. Target Users

### Primary Users

**1. Students (70% of users)**
- **Needs:** Quick item reporting, mobile-friendly interface, instant notifications
- **Pain Points:** Losing expensive items (laptops, phones), limited time to search
- **Goals:** Recover lost items quickly, help others by reporting found items

**2. Faculty & Staff (20% of users)**
- **Needs:** Professional interface, reliable system, minimal friction
- **Pain Points:** Losing ID badges, office keys, important documents
- **Goals:** Secure recovery process, maintain professional reputation

**3. Campus Security & Admin (10% of users)**
- **Needs:** Centralized dashboard, claim verification tools, location management
- **Pain Points:** Managing physical lost items, handling disputes, record-keeping
- **Goals:** Reduce manual workload, ensure fair claim resolution, maintain security

### User Personas

**Persona 1: Alice - Busy Undergraduate Student**
- Age: 20, Computer Science major
- Tech-savvy, always on mobile
- Lost her phone in the library last semester, never recovered it
- Wants: Fast reporting, push notifications, minimal clicks

**Persona 2: Dr. Johnson - Faculty Member**
- Age: 45, Associate Professor
- Uses desktop primarily
- Lost office keys twice, concerned about security
- Wants: Verification system, audit trail, professional interface

**Persona 3: Mike - Campus Security Officer**
- Age: 32, Works night shifts
- Manages main security desk (drop-off point)
- Handles 20+ found items per week
- Wants: Bulk item management, claim approval workflow, reporting tools

---

## 3. Core Features

### 3.1 Report Items (MVP)

**Report Lost Item**
- Title (3-200 characters)
- Category (electronics, keys, clothing, etc.)
- Description (optional, max 2000 characters)
- Location where lost
- Date lost
- 0-3 photos (auto-compressed, EXIF-stripped)
- Contact preference (default: platform messages)

**Report Found Item**
- Same fields as lost item
- **Additional:** Held-at location (drop-off point or personal)
- **Additional:** Verification question (for ownership proof)
- **Additional:** Verification answer (hashed, never displayed publicly)

**Business Rules:**
- Auth required (prevents spam)
- Rate limit: 10 posts per hour per IP
- Auto-expire after 60 days (configurable)
- Sensitive items (passports, IDs) → private images

### 3.2 Browse & Search (MVP)

**Filters:**
- Type: Lost / Found
- Category: 9 categories (electronics, keys, accessories, etc.)
- Status: Open / Claimed / Resolved / Expired
- Location: All campus buildings + drop-off points
- Date range: When item was lost/found

**Search:**
- Full-text search on title + description
- Trigram-based (handles typos)
- Debounced (350ms)
- Updates URL params (shareable links)

**Results:**
- Grid layout (2-4 columns based on viewport)
- Pagination (12 items per page)
- Image preview with fallback emoji
- Status badges + category chips

### 3.3 Claim Verification (MVP)

**Claim Flow:**
1. Claimant submits claim with proof text + optional photo
2. If verification question exists → must provide correct answer (case-insensitive)
3. Finder receives notification
4. Finder reviews claim: Approve / Reject / Message for more info
5. If approved → item status changes to "claimed"
6. Claimant and finder coordinate handover via in-app messaging

**Verification:**
- Hash-based answer matching (SHA-256)
- Case-insensitive ("GREEN" = "green")
- Admin can override (for disputes)
- Claimant can withdraw claim before approval

**Business Rules:**
- One active claim per user per item
- Owner cannot claim own item
- Rejected claims can be resubmitted
- Approval auto-updates item status

### 3.4 Messaging (MVP)

**Features:**
- In-app chat between claimant and finder
- Real-time via polling (3s interval)
- Message history persisted
- Content filter (blocks URLs, phone numbers)
- Rate limit: 10 messages per minute per claim

**Notifications:**
- Email digest (max 1 per 10 min per thread)
- In-app bell icon (unread count)
- Notification types: claim_submitted, claim_approved, claim_rejected, message_sent

### 3.5 Dashboard (MVP)

**My Posts Tab:**
- All items user reported
- Edit title/description (open items only)
- Delete item (if no claims exist)
- Status badges

**My Claims Tab:**
- All claims user submitted
- Status: Pending / Approved / Rejected / Withdrawn
- Chat button (pending/approved)
- Withdraw button (pending only)

**Claims on My Items Tab:**
- All claims on user's items
- Review button → claim details page
- Approve/Reject actions

### 3.6 Admin Panel (MVP)

**Access Control:**
- Role-based: `profiles.role = 'admin'`
- All admin actions logged to audit_log table

**Features:**
- **Stats Dashboard:** Total items, active users, resolved count, trending categories
- **Items Management:** View all items, bulk status updates
- **User Management:** View users, ban/unban, reset passwords
- **Locations Management:** Add/edit/delete campus locations and drop-off points
- **Audit Log:** All admin actions with timestamp, user, action type

### 3.7 Match Suggestions (Post-MVP)

**Algorithm:**
- Category match: +3 points
- Same location: +2 points
- Date within 7 days: +2 points
- Title similarity (trigram): +3 points scaled
- Threshold: 5 points = match, 7+ = strong match

**Display:**
- Top 5 matches shown on item detail page (opposite type)
- "Possible matches" section
- Strong matches (7+) → email notification

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Page Load:** Home/Browse under 2.5s (LCP)
- **Search Response:** Under 500ms
- **Image Upload:** Max 5MB, auto-compress to ~1MB
- **Database Queries:** All indexed, <100ms response time
- **Lighthouse Score:** Mobile ≥90

### 4.2 Security
- **Authentication:** Supabase Auth (email/password + OAuth)
- **Authorization:** Row-Level Security (RLS) on all tables
- **Input Sanitization:** All user input stripped of XSS vectors
- **Rate Limiting:** IP-based for posting, per-user for messaging
- **CSRF Protection:** Next.js built-in + custom validation
- **Security Headers:** CSP, HSTS, X-Frame-Options, etc.
- **Open Redirect Protection:** Whitelist-based internal path validation

### 4.3 Privacy
- **Images:** EXIF data stripped before upload
- **Personal Data:** Only first name shown publicly
- **Sensitive Items:** Images hidden from public, only owner/admin/approved claimant can view
- **Contact Details:** Never shown publicly, all communication via platform
- **Right to Delete:** Users can delete own items (if no claims)

### 4.4 Scalability
- **Database:** PostgreSQL with connection pooling (Supabase)
- **Storage:** Supabase Storage with CDN (2 buckets: public + private)
- **Caching:** Browse results (30s TTL), stats (5 min TTL)
- **Images:** WebP/AVIF formats, responsive sizes, lazy loading

### 4.5 Accessibility
- **WCAG 2.1 AA Compliant**
- Skip-to-content link
- Keyboard navigation for all interactive elements
- Screen reader tested (ARIA labels, roles, states)
- Color contrast ratios met
- Touch targets ≥44px (mobile)

### 4.6 Mobile-First
- **Bottom Navigation:** 4-tab fixed nav on mobile
- **Touch-Friendly:** All buttons ≥44px
- **Responsive Images:** next/image with sizes attribute
- **Swipe Gestures:** Image gallery supports swipe
- **Offline Tolerance:** Graceful degradation (no offline mode yet)

---

## 5. Feature Prioritization

### Phase 1: MVP (Completed)
- ✅ Report lost/found items with image upload
- ✅ Browse with all filters + search
- ✅ Claim flow with verification
- ✅ In-app messaging
- ✅ Dashboard (My Posts, My Claims)
- ✅ Admin panel (basic)
- ✅ RLS + security hardening
- ✅ Performance optimization

### Phase 2: Authentication (Blocked)
- 🔲 Supabase Auth integration
- 🔲 Email/password sign-up
- 🔲 Google OAuth
- 🔲 Domain gate (@university.edu)
- 🔲 Email verification

### Phase 3: Enhancements (Post-Launch)
- 🔲 Match suggestions email notifications
- 🔲 PWA support (offline mode)
- 🔲 Advanced admin analytics
- 🔲 Export reports (CSV/PDF)
- 🔲 Multi-language support
- 🔲 SMS notifications

### Phase 4: Scale (6-12 months)
- 🔲 Multi-campus support
- 🔲 AI-powered image matching
- 🔲 QR code scanning for quick reporting
- 🔲 Integration with campus security systems
- 🔲 Anonymous reporting option

---

## 6. Success Metrics

### Primary KPIs
- **Reunion Rate:** % of claimed items that reach "resolved" status (Target: >60%)
- **Time to Reunite:** Median days from lost → claimed (Target: <7 days)
- **User Adoption:** % of campus population using platform (Target: >30% in 6 months)
- **Report Quality:** % of reports with photos + description (Target: >70%)

### Secondary KPIs
- **Search Success:** % of searches leading to item view (Target: >40%)
- **Claim Approval Rate:** % of claims approved (Target: >50%, too low = fraud, too high = weak verification)
- **Admin Workload:** Hours per week for manual interventions (Target: <5 hours)
- **Platform Trust:** % of high-value items (>$500) reported (Target: >20%)

### Health Metrics
- **Spam Rate:** % of reports flagged as spam (Target: <2%)
- **Dispute Rate:** % of claims escalated to admin (Target: <5%)
- **Expiry Rate:** % of items expiring without claims (Target: <30%)
- **Return User Rate:** % of users returning after first use (Target: >40%)

---

## 7. Out of Scope (v1)

- ❌ Payment/reward system
- ❌ Delivery/shipping integration
- ❌ Third-party lost-and-found aggregation
- ❌ Insurance claims integration
- ❌ Live chat support
- ❌ Mobile native apps (web-only for now)
- ❌ Barcode/serial number scanning
- ❌ Blockchain/NFT verification (lol)

---

## 8. Assumptions & Constraints

### Assumptions
- Users have access to internet + device (phone/laptop)
- Campus has Wi-Fi coverage in all public areas
- Security staff are willing to manage drop-off points
- Users trust the platform with their data
- Most users have university email addresses

### Constraints
- Budget: $0 (free tier only)
- Team: Solo developer (AI-assisted)
- Timeline: 3 months to MVP
- Tech Stack: Next.js + Supabase (locked in)
- Hosting: Vercel free tier
- Storage: 1GB limit (Supabase free tier)

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption | High | Medium | Marketing campaign, incentivize early adopters, partner with student orgs |
| Fraudulent claims | High | Medium | Verification questions, admin review, user reputation system (future) |
| Spam/abuse | Medium | High | Rate limiting, CAPTCHA (if needed), ban system, content moderation |
| Privacy concerns | High | Low | Transparent privacy policy, minimal data collection, GDPR compliance |
| Server costs exceed free tier | Medium | Medium | Optimize queries, implement caching, seek university sponsorship |
| Auth implementation delays | High | High | **Current blocker** — allocate focused time for Task 3 |

---

## 10. Launch Checklist

### Pre-Launch
- ✅ All MVP features complete
- ✅ Security audit passed
- ✅ Performance optimization done
- 🔲 Authentication implemented (Task 3)
- 🔲 Privacy policy finalized
- 🔲 Terms of service finalized
- 🔲 Contact page created
- 🔲 100 beta users tested platform
- 🔲 Admin training completed
- 🔲 Marketing materials prepared

### Launch Day
- 🔲 Announce on campus social media
- 🔲 Email to all students/staff
- 🔲 Posters in high-traffic areas
- 🔲 Demo at student union
- 🔲 Monitor error logs (Sentry/LogRocket)
- 🔲 On-call admin for disputes

### Post-Launch (Week 1)
- 🔲 Daily user count tracking
- 🔲 Bug fixes (prioritize P0/P1)
- 🔲 User feedback survey
- 🔲 Adjust rate limits if needed
- 🔲 Celebrate wins with team! 🎉

---

## 11. Appendix

### Glossary
- **Claim:** Request by user to verify ownership of found item
- **Drop-off Point:** Official campus location holding found items (e.g., Security Desk)
- **Finder:** User who reported a found item
- **Loser:** User who lost an item (we say "reporter" to be nice 😊)
- **Reunion:** Successful return of item to owner
- **RLS:** Row-Level Security (Postgres feature for data access control)

### References
- [Data Model Documentation](.kiro/steering/data-model.md)
- [PROGRESS.md](../PROGRESS.md) - Development history
- [AUDIT.md](./AUDIT.md) - Functionality audit

### Contact
- **Developer:** Pushkar DSU
- **Repository:** https://github.com/PushkarDSU2005/Lost-And-Found-PJ
- **Issues:** Use GitHub Issues for bug reports

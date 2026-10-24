# CampusFind — Full UI Redesign Plan

**Status:** Draft for review — awaiting approval before any implementation begins
**Date:** 2026-10-23
**Scope:** Visual + interaction design system for the full CampusFind product (Home, Browse, Item detail, Report, Dashboard, Claims, Messages)
**Source context:** `docs/AUDIT.md`, `PROGRESS.md` (current UI foundation: shadcn/Tailwind v4, Indigo, Inter)

---

## 1. Design Direction — The One Idea

**Concept: the physical lost-property office.**

Students lose things on campus; the campus lost-property office is a real, physical place with a specific texture — tags, string, stamps, shelves of labeled trays. The redesign borrows that texture as its entire identity, and keeps it quiet.

**The memorable motif (one only):**
1. **Item cards = luggage tags.** Rounded rectangle with a **punched hole** near one end and a **string/notch** at the other. Card shape changes subtly by state: open items get the punched-hole tag; resolved/returned items get a **flattened tag with the string looped and tied** (or trimmed).
2. **RETURNED = rubber stamp.** When a claim resolves an item, the tag card's stamp area flips to a rotated, inked **"RETURNED"** mark (safety orange, slightly rotated −6°, offset ink shadow, perforated edge optional). This is the *only* animation state — it must feel like an actual rubber stamp.
3. **Drop points = shelf labels.** Official drop-off locations are rendered as small shelf-label plates (e.g. "SHELF B3 — Library, 9am–9pm") rather than generic map pins.

Everything else stays quiet. No extra motifs, no pattern libraries, no ornament outside these three.

**Mood:** warm, energetic, trustworthy. Friendly — not corporate, not childish. The energy should come from the stamp + tag motion, not from decoration.

---

## 2. Token System

### 2.1 Color — named hex values (light theme first)

Six named brand hex values. Semantic tokens (`--lf-paper`, `--lf-ink`, …) are exposed as CSS variables so a future dark theme can override them without renaming.

| Token | Hex | Role | Contrast (light bg) |
|---|---|---|---|
| `--lf-paper` | `#F6F2E9` | App background — warm paper (NOT cream/terracotta-adjacent) | — |
| `--lf-ink` | `#2A241B` | Primary text / ink | ~13.9:1 ✅ AA/AAA |
| `--lf-orange` | `#E4572E` | **Lost** identity + primary CTA | ~3.9:1 — large/bold OK; small text uses deep shade |
| `--lf-green` | `#2E6B4F` | **Found** identity + resolved/returned | ~5.9:1 ✅ AA |
| `--lf-gold` | `#C08A1E` | Claimed / verification answer / warnings | ~3.4:1 — large/bold OK; small text uses deep shade |
| `--lf-mist` | `#E4DCCB` | Tag/card neutral tint, chip background | — |

Derived shades (from the six above, for text-on-color use):
- `--lf-orange-deep` `#B23A17` — small text on orange / pressed states (white text on it ≈ 6.0:1 ✅ AA)
- `--lf-ink-soft` `#6E6557` — muted secondary text (≈ 5.6:1 on paper ✅ AA)

**Lost vs Found** must be distinguishable by **color AND shape/label**, never color alone:
- **Lost** = safety orange tag + punched-hole tag with **orange strap/notch**.
- **Found** = leaf green tag + punched-hole tag with **green string**.
- Status semantics: claimed = gold; resolved = green (with RETURNED stamp); expired = neutral gray.

**Explicitly avoided clichés:** no cream background + terracotta accent; no near-black + acid green; no purple-blue gradient on white; no red/green status-only coding.

### 2.2 Typography — two families via `next/font`

- **Display:** `Bricolage Grotesque` (variable weight, via `next/font/google`, exposed as `--font-display`). Warm grotesque with character; gives the "luggage tag / stamp" warmth without being cartoonish. Chosen over Inter because Inter is the generic default and this brand needs distinct character.
- **Body:** `DM Sans` (via `next/font/google`, `--font-body`). Humanist sans that reads friendly and fast — better for hurried students than Inter's neutrality.

**Real type scale** (mobile-first, fluid display):

| Step | Family | Size | Line height | Weight | Tracking | Usage |
|---|---|---|---|---|---|---|
| Overline | DM Sans | 0.75rem | 1.2 | 600 | +0.06em | Eyebrow-ish labels — **sentence case** (e.g. "Just returned") |
| Caption | DM Sans | 0.8125rem | 1.45 | 400–500 | 0 | Metadata, badges |
| Body | DM Sans | 1rem | 1.6 | 400 | 0 | Default text |
| Body LG | DM Sans | 1.125rem | 1.6 | 400–500 | 0 | Hero subcopy |
| H3 | Bricolage | 1.375rem | 1.35 | 600 | −0.01em | Card titles |
| H2 | Bricolage | 1.75rem | 1.25 | 600 | −0.015em | Section titles |
| H1 | Bricolage | 2rem (clamp 2–2.75rem) | 1.15 | 650 | −0.02em | Page titles |

Display (hero) uses Bricolage at `clamp(2.5rem, 6vw, 4rem)`, weight 600, lh 1.05, ls −0.02em.

### 2.3 Spacing, radii, shadows, motion

- **Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 (base 4px).
- **Radii vary by hierarchy (never one card radius):**
  - Controls (inputs, small buttons): **10px**
  - Content cards / tag cards: **16px** base (tag itself ~14px + punched hole)
  - Sheets, dialogs, claim panels: **20px**
  - Chips / status pills: **999px**
- **Shadows vary by hierarchy:**
  - Resting card: `0 1px 2px rgb(42 36 27 / 6%), 0 1px 3px rgb(42 36 27 / 4%)`
  - Raised (hover/focus): `0 12px 32px -12px rgb(42 36 27 / 18%)`
  - **Tag cards:** hard offset shadow like a hanging tag: `6px 8px 0 -2px rgb(42 36 27 / 8%)` (quiet, physical)
- **Motion durations:**
  - Tag settle-in (page load): **540ms**, `cubic-bezier(0.22, 1, 0.36, 1)`, stagger 70ms between cards
  - RETURNED stamp: **500ms**, `cubic-bezier(0.34, 1.56, 0.64, 1)` (snappy overshoot)
  - Micro/interaction: **150ms**, ease-out
  - Sheet/drawer: **320ms**
  - Toast: **380ms**
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → all motion becomes instant state changes; stamp still swaps instantly.

### 2.4 Dark theme readiness

Tokens are semantic (`--lf-*`) mapped to concrete hex in `:root` (light). A `.dark` layer later re-maps the same semantic names to dark equivalents — no renames needed.

---

## 3. ASCII Wireframes

### 3.1 Home — Mobile (360px first)

```
┌────────────────────────────────────────────┐
│ 🔍 Lost & Found            [🔔]              │  top bar
├────────────────────────────────────────────┤
│                                            │
│        JUST RETURNED                       │  overline, sentence case
│                                            │
│   “My blue AirTag is lost —                │
│    found at Library!”                     │
│                                            │
│   Found · Library   Today — 2:40 PM      │  em dash — never middle dot
│                                            │
│   ┌──────────────────────────────────┐  │
│   │  [🎧 tag visual]                 │  │
│   │   AirTag · Library              │  │
│   │       [RETURNED]                │◄─ rotated stamp
│   └──────────────────────────────────┘  │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│   What did you lose?                       │
│   [ Search your item…                    ]  │
│                                            │
├────────────────────────────────────────────┤
│   Browse by category                       │
│   [ 🎒 Bags ] [ 💳 IDs ] [ 🔑 Keys ] …   │
├────────────────────────────────────────────┤
│   Open lost items near you                │
│   [ tag card ]                            │
│   [ tag card ]                            │
├────────────────────────────────────────────┤
│  [ 🏠 ]  [ 🔍 ]  [  ＋  ]  [ 💬 ]          │  bottom nav, 4 tabs
└────────────────────────────────────────────┘
   (content padded above bottom nav)
```

### 3.2 Home — Desktop

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 Lost & Found        Browse  ·  Report Lost  ·  Report Found          [Sign in]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│        JUST RETURNED                                                    ← overline,      │
│                                                                                              │
│    “My blue AirTag just got found at Library.”                                          │
│                                                                                              │
│    Found · Library — Today — 2:40 PM                                                     │
│                                                    ┌──────────────┐  [RETURNED]     │
│                                                    │ 🎧 AirTag     │                 │
│                                                    │ Library       │                 │
│                                                    │  [stamp]      │                 │
│                                                    └──────────────┘                 │
│                                                                                              │
│   Open lost items near you — search above to find yours                               │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│   │ TAG    │ │ TAG    │ │ TAG    │ │ TAG    │ │ TAG    │ │ TAG    │                 │
│   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Home is search-first, with live data:** hero = one large search field ("I lost my…") + two quiet CTAs. Below the fold: "Just returned" activity feed (real items with `status = resolved`, latest first) rendered as stamped tag cards — **no stats-number strip**.

### 3.3 Browse — Mobile

```
┌────────────────────────────────────────────┐
│ ← Back to home                             │
│ 🔍 Search items…              [Filters ▾]  │
│                                            │
│  [ Lost ▾ ]      (type toggle → URL)      │
│  Chips: All · Bags · IDs · Electronics …  │
│                                            │
│  Results: 12 open items                   │
│                                            │
│  ┌──────────────────────────────────┐  │
│  │ 🎧 [TAG]  Lost — AirTag         │  │
│  │       Library · 2 days ago     │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ 🎒 [TAG]  Found — Backpack      │  │
│  └──────────────────────────────────┘  │
│                                            │
│            [ Load more → ]                 │
├────────────────────────────────────────────┤
│  [ 🏠 ]  [ 🔍 ]  [ ＋ ]  [ 💬 ]           │
└────────────────────────────────────────────┘
```

### 3.4 Browse — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to home      🔍 Search items…                    [Filters]        [Sort ▾]           │
├──────────────────┬───────────────────────────────────────────────────────────────────────┤
│                │                                                                               │
│ FILTERS         │    Results (12)                                                                  │
│ — Lost/Found    │    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                            │
│ — Category      │    │ TAG    │ │ TAG    │ │ TAG    │ │ TAG    │                            │
│ — Status        │    └────────┘ └────────┘ └────────┘ └────────┘                            │
│ — Date          │    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                            │
│                │    │ TAG    │ │ TAG    │ │ TAG    │ │ TAG    |                            │
│                │    └────────┘ └────────┘ └────────┘ └────────┘                            │
│                │                                                                               │
│                │                                    [ Load more / pagination ]                     │
└──────────────────┴───────────────────────────────────────────────────────────────────────┘
```

### 3.5 Item Detail — Mobile

```
← Back
[ gallery: tag visual / image ]
[ BADGE: Lost ]        [ BADGE: Open ]

 “My blue AirTag is lost — found at Library!”

 Found · Library — Today — 2:40 PM

 Description text…

 Verification (found items): “What colour is the case?”
   ← answer stays private

 Held at: Library — official drop point
   Shelf label card: Library · 9am–9pm · “Bring ID”

 [ ✓ Claim this item ]     ← primary orange
 [ Report this item ]      ← quiet
```

### 3.6 Item Detail — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to browse        [ gallery ]        │  “My blue AirTag is lost — found at Library!”           │
│                                                                                              │
│  [ BADGE: Lost ]   [ BADGE: Open ]                                                             │
│                                                                                              │
│  Found · Library — Today — 2:40 PM                                                             │
│  Description…                                                                                 │
│  Verification… · Held at Library…                                                              │
│                                                                                              │
│  ┌────────────────────────────────┐  ┌──────────────────────────────────────────────┐       │
│  │  ACTIONS:                     │  │  RELATED / POSSIBLE MATCHES                │       │
│  │  [ ✓ Claim this item ]       │  │  [ tag card ]                              │       │
│  │  [ Report ]                   │  │  [ tag card ]                              │       │
│  └────────────────────────────────┘  └──────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 Report Form — Mobile

```
  { Lost | Found }   ← segmented control (orange = Lost selected)
  1. Title              [ What did you lose? … ]
  2. Category           [ Select: Electronics … ]
  3. (Found only) Held at [ Select official drop point … ]
  4. When               [ Date … ]
  5. Details            [ textarea … ]
  6. Photos             [ + Add up to 3 photos ]
  7. (Found only) Verification — Q: [ … ]  A: [ … ]

 Safety note card: meet publicly, share live location, never hand over without…?

 [ Submit report ]
```

### 3.8 Report Form — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Report a { Lost | Found }                                                                     │
├───────────────────────────────────────┬──────────────────────────────────────────────────────┤
│  Form (2-col field grid)               │  Sidebar                                          │
│  Title            [ … ]               │  • Safety checklist                             │
│  Category         [ … ]               │  • Drop points near you                        │
│  Held at (found) [ … ]                │  • What makes a good verification Q?           │
│  When             [ … ]               │                                                  │
│  Details          [ … ]               │                                                  │
│  Photos           [ … ]               │                                                  │
│  (found) Verif. Q  [ … ] A: [ … ]    │                                                  │
│                                        │                                                  │
│                          [ Submit report ]                                                      │
└───────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

### 3.9 Dashboard — Mobile

```
┌────────────────────────────────────────────┐
│ Dashboard                                 │
│ [ My Posts ]  [ My Claims ]  [ ⋯ ]       │  segmented tabs
├────────────────────────────────────────────┤
│ My Posts:                                │
│  [ tag card w/ status ]                  │
│  [ tag card w/ status ]                  │
│  (empty state → Report a found item)   │
├────────────────────────────────────────────┤
│  [ 🏠 ]  [ 🔍 ]  [ ＋ ]  [ 💬 ]           │
└────────────────────────────────────────────┘
```

### 3.10 Dashboard — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Dashboard                                       [ + Report a found item ]       │
├──────────┬───────────────────────────────────────────────────────────────┤
│ My Posts│  [ tag card ]                                                   │
│ My Claims│  [ tag card ]                                                   │
│ On Mine │  [ claim card w/ Approve/Reject ]                              │
│          │                                                                   │
└──────────┴───────────────────────────────────────────────────────────────┘
```

### 3.11 Claim — Mobile

```
← Back to item
[ item summary: 🎧 AirTag — Library ]

 You are claiming a found item.

 Proof description      [ textarea ]
 (Found only) Verif. Q  [ … ]  A: [ … ]

 [ Submit claim ]

 Safety note…
```

### 3.12 Claim — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Claim: “My blue AirTag…”                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│  Claimant proof summary                                                          │
│  …                                                                                  │
│  Verification…                                                                    │
│  [ Submit claim ]                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.13 Messages — Mobile

```
← Chat: AirTag · Library
[ 🎧 AirTag — Library ]   ← item context strip

 Bubbles…
   You: …
   Finder: …
 [ input: Message…            ] [ Send ]
```

### 3.14 Messages — Desktop

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Back to claims                                                          │
│  Chat — “My blue AirTag…”                                                     │
│  [ bubbles… ]                                                              │
│  [ input: Message…            ] [ Send ]                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Inventory — Restyle vs Create

| Component | Current state | Action | Notes |
|---|---|---|---|
| **Tag** (luggage tag primitive) | Missing | **Create** | Rounded rect, punched hole (radial mask), string notch; strap color encodes Lost/Found; tied state for resolved |
| **TagCard** (replaces `ItemCard`) | Exists as generic rounded card | **Restyle → TagCard** | Tag shape + status-driven stamp area; offset tag shadow; varied radius; no hover lift (hover = strap emphasis / image zoom only) |
| **RubberStamp** | Missing | **Create** | RETURNED mark: DM Sans 700, rotated −6°, safety orange ink, offset shadow; appears only when item resolved |
| **DropPointCard / ShelfLabel** | Exists partially | **Create/Restyle** | Shelf-label plate: label text ("SHELF B3"), hours, drop-point badge; replaces generic highlight box |
| **StatusBadge** | Exists | **Restyle** | Sentence-case label ("Lost", "Found", "Claimed", "Returned"); color + icon/shape pairing; no ALL CAPS |
| **SearchInput** | Exists | **Restyle** | Large hero variant + compact browse variant; clear button; label via aria |
| **FilterBar** | Exists | **Restyle** | Collapsible on mobile, sticky sidebar on desktop; tag-friendly checkboxes |
| **ActionButtons** | Exists | **Restyle** | Claim = primary orange; Report = quiet; Mark Returned = stamp button; focus-visible rings |
| **BottomNav** | Exists | **Restyle** | 4 tabs: Home, Browse, Report, Alerts→Notifications; 44px targets; active = tag/notch indicator |
| **Navbar** | Exists | **Restyle** | Quiet; logo mark = magnifier-in-tag; no gradient |
| **EmptyState** | Exists | **Restyle** | Friendly copy + one CTA; tag-styled illustration slot |
| **Toast** | Exists (Sonner) | **Restyle** | Claim submitted / stamp applied → toast tone + optional inline state; not every action toasts |
| **Forms** (input/textarea/select/checkbox via shadcn) | Exists | **Restyle** | Radius 10, focus ring orange; error text ink-deep, `role="alert"` |
| **LiveActivityFeed** | Missing | **Create** | "Just returned" — resolved items, latest first, stamped tag cards; real data via existing queries/polling |

---

## 5. Critique Pass — Generic Defaults & Revisions

Self-critique of the plan itself. Where the plan could have drifted into generic default territory, what I changed, and why:

1. **"Use Inter + Indigo + shadcn defaults"** (the codebase's actual current state) → **Revised.** Bricolage Grotesque + DM Sans via `next/font`; warm paper/ink/safety-orange/leaf-green/gold palette. *Why:* Inter+indigo is the path of least resistance and reads corporate; the brief demanded a distinct, warm, energetic-but-trustworthy voice.

2. **"Big stats strip: 240+ items returned"** (already flagged in `AUDIT.md` as hardcoded/misleading) → **Replaced by design.** The hero uses a live "Just returned" feed instead of numbers. *Why:* numbers are fake/confusing and don't serve the 30-second job; live activity shows real returned items and builds trust.

3. **"ALL-CAPS eyebrow labels"** (e.g. `JUST RETURNED`, `LOST & FOUND`) → **Revised to sentence case** ("Just returned") with tracked small type. *Why:* ALL-CAPS reads as generic dashboard, not friendly lost-and-found.

4. **"Middle-dot meta strings"** (e.g. `Sep 12 · 2:30 PM`) → **Revised** to em-dash/plain phrasing ("Today — 2:40 PM"). *Why:* stylistic cliché, low signal.

5. **"Identical rounded cards, same soft shadow"** → **Revised** with per-hierarchy radii and varied shadows; tags get a hard offset shadow. *Why:* the brief called this out; the tag motif demands a different shadow anyway.

6. **"Fade-up animation on every section"** → **Revised:** exactly ONE orchestrated motion — tag cards settling in on load (staggered, 540ms, soft ease-out). Everything else is micro/interaction or the stamp. *Why:* restraint per brief.

7. **"Hover lift on every card"** → **Revised:** no lift. Hover = subtle strap/border emphasis or image zoom. *Why:* hover-lift-everywhere is the generic pattern the brief asked to avoid.

8. **"One word of the headline in a different color"** → **Revised:** headlines are single-ink; accent color appears only in supporting/meta contexts (badges, stamps, numbers, links). *Why:* accent-everywhere is the cheap trick to avoid.

9. **"Purple-blue gradient on white"** → **Not used.** Flat token colors only.

10. **"Cream background + terracotta accent"** → **Revised** to warm paper `#F6F2E9` + safety orange `#E4572E`. *Why:* terracotta reads "generic warm startup"; orange reads energetic + luggage-tag, and pairs with the stamp.

11. **Critique of the motif itself:** the RETURNED stamp is a strong idea, but risks becoming static decoration if applied unconditionally. **Revision:** stamp is state-driven (only on resolved items) and doubles as the claim-resolution feedback moment (claim submitted → stamp animates in). The tag shape must encode Lost vs Found via strap color + string color *and* label text — not color alone (accessibility).

12. **Critique of the plan:** risk that the tag motif gets over-applied (nav, buttons, empty states). **Revision:** motif reserved for item surfaces only; navigation/actions stay quiet. One memorable idea, quiet around it — as the brief demanded.

**Net revisions accepted:** fonts (2), palette (6 tokens), type scale, radii/shadow variance, motion reduction, stats-strip replacement, ALL-CAPS/middle-dot removal, hover/fade rules, headline accent rule, dark-theme token naming.

---

## 6. Quality Floor (design-level acceptance criteria)

- **Mobile first:** 360px viewport is the design baseline; breakpoints at 640 / 768 / 1024.
- **Focus:** 2px visible focus ring, offset 2, orange-based, everywhere including tag cards (use `focus-within`/link `:after` handling already sketched in `ItemCard`).
- **Contrast:** AA for body text (muted ink 5.6:1); large/bold for orange/gold text-on-color; deep shades for small-text-on-orange.
- **Touch targets:** ≥ 44px for all interactive elements (bottom nav, buttons, tag cards' whole-card link).
- **Motion:** single orchestrated settle-in + stamp; `prefers-reduced-motion` respected; no animation on load for reduced-motion users.
- **Distinguishability:** Lost ≠ Found by color + shape (strap vs string) + label text; status never color-only.

---

## 7. Approval

This document (`/docs/DESIGN.md`) is the full design plan. It covers:

1. ✅ Token system — colors (named hex), type scale, spacing, radii (varied by hierarchy), shadows, motion durations.
2. ✅ ASCII wireframes — mobile + desktop for Home, Browse, Item detail, Report form, Dashboard, Claim, Messages.
3. ✅ Component inventory — what to restyle vs create.
4. ✅ Critique pass — generic-default risks found and revised, with rationale.

**No code has been written. Implementation starts only after your approval.**

Standing by for your approval — or tell me what to revise.

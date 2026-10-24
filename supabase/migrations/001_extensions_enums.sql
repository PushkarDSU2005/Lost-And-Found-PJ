-- =============================================================================
-- Migration 001: Extensions & Enums
-- =============================================================================
-- Run order: first. Everything else depends on these types.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

-- pg_trgm: trigram-based full-text search on item titles
create extension if not exists pg_trgm with schema extensions;

-- uuid-ossp: uuid_generate_v4() (Supabase also has gen_random_uuid() built-in,
-- we expose both for flexibility)
create extension if not exists "uuid-ossp" with schema extensions;

-- moddatetime: automatically update updated_at columns via trigger
create extension if not exists moddatetime with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Whether a report is for a lost item or a found item
create type public.item_report_type as enum (
  'lost',
  'found'
);

-- Lifecycle state of an item report
create type public.item_status as enum (
  'open',       -- actively seeking / awaiting claim
  'claimed',    -- ownership verified, pending hand-off
  'resolved',   -- item returned / closed successfully
  'expired'     -- auto-closed after inactivity period
);

-- High-level categories for browsing / filtering
create type public.item_category as enum (
  'electronics',      -- phones, laptops, chargers, earbuds …
  'clothing',         -- jackets, caps, scarves …
  'accessories',      -- bags, wallets, jewellery, watches …
  'books_stationery', -- textbooks, notebooks, pens …
  'keys',             -- keys, keycards, lanyards …
  'sports_fitness',   -- water bottles, gym equipment …
  'id_documents',     -- student IDs, passports, licences …
  'food_drink',       -- lunch boxes, flasks …
  'other'             -- catch-all
);

-- Role assigned to each user profile
create type public.user_role as enum (
  'student',  -- regular user; can report & claim
  'staff',    -- same as student but can also manage drop-points
  'admin'     -- full access; can see all items & manage users
);

-- Status of a claim request
create type public.claim_status as enum (
  'pending',   -- submitted, awaiting admin/finder review
  'approved',  -- verified owner; item ready for collection
  'rejected',  -- claim denied
  'withdrawn'  -- claimant cancelled their own request
);

-- Channel used to deliver a notification
create type public.notification_channel as enum (
  'in_app',
  'email'
);

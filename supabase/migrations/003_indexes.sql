-- =============================================================================
-- Migration 003: Indexes
-- =============================================================================
-- Depends on: 002_tables.sql, 001_extensions_enums.sql (pg_trgm extension)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- items — selective / composite indexes for the main listing queries
-- ---------------------------------------------------------------------------

-- Filter by report type (lost / found) — most common top-level split
create index idx_items_report_type
  on public.items (report_type);

-- Filter by lifecycle status; partial index on 'open' rows only (the hot set)
create index idx_items_status
  on public.items (status);

create index idx_items_status_open
  on public.items (id)
  where status = 'open';

-- Filter / sort by category
create index idx_items_category
  on public.items (category);

-- Timeline browsing (most-recent-first is the default sort)
create index idx_items_created_at
  on public.items (created_at desc);

-- Compound index covering the most common listing query:
--   WHERE report_type = ? AND status = 'open' ORDER BY created_at DESC
create index idx_items_type_status_created
  on public.items (report_type, status, created_at desc);

-- Compound for category + status browsing
create index idx_items_category_status
  on public.items (category, status);

-- Reporter's own items (My Reports page)
create index idx_items_reporter_id
  on public.items (reporter_id);

-- Location drill-down
create index idx_items_location_id
  on public.items (location_id)
  where location_id is not null;

-- ---------------------------------------------------------------------------
-- items — pg_trgm full-text search on title
-- ---------------------------------------------------------------------------
-- GIN index on title using the trigram operator class.
-- Supports ILIKE '%keyword%' queries efficiently.
-- Also supports similarity() and % operator ranking.
create index idx_items_title_trgm
  on public.items
  using gin (title extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- item_images
-- ---------------------------------------------------------------------------

create index idx_item_images_item_id
  on public.item_images (item_id, sort_order);

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------

-- Look up all claims for a given item (admin review queue)
create index idx_claims_item_id
  on public.claims (item_id);

-- Look up all claims by a specific user (My Claims page)
create index idx_claims_claimant_id
  on public.claims (claimant_id);

-- Filter pending claims (admin dashboard)
create index idx_claims_status_pending
  on public.claims (status)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

-- Unread in-app notifications for a user (bell icon count)
create index idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where channel = 'in_app' and read_at is null;

-- Full notification history per user
create index idx_notifications_user_id
  on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------

-- Fast lookup of drop-points only
create index idx_locations_drop_point
  on public.locations (drop_point)
  where drop_point = true;

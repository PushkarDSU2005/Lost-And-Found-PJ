-- =============================================================================
-- Migration 002: Core Tables
-- =============================================================================
-- Depends on: 001_extensions_enums.sql
-- Tables: profiles, locations, items, item_images, claims, notifications
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- One row per auth.users entry.  Created automatically by the trigger in
-- migration 006.  Stores display name, role, and contact prefs.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  email         text        not null,
  full_name     text,
  avatar_url    text,
  role          public.user_role not null default 'student',
  -- Opt-in email notifications (default on)
  notify_email  boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.profiles              is 'Extended user profile synced from auth.users.';
comment on column public.profiles.role         is 'student | staff | admin — controls row-level access.';
comment on column public.profiles.notify_email is 'User preference: receive email notifications via Resend.';

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------
-- Physical campus locations where items were lost/found or can be dropped off.
-- drop_point=true locations are staffed collection points shown in the UI.
-- ---------------------------------------------------------------------------
create table public.locations (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  building      text,
  floor         text,
  description   text,
  -- When true this location appears in the "drop-off here" picker
  drop_point    boolean     not null default false,
  -- Opening hours text (nullable; only relevant for drop-points)
  hours         text,
  -- GeoJSON point for future map integration (nullable)
  geom          jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table  public.locations            is 'Campus buildings, rooms, and designated drop-off points.';
comment on column public.locations.drop_point is 'True if this is a staffed collection/drop-off point.';

-- ---------------------------------------------------------------------------
-- items
-- ---------------------------------------------------------------------------
-- Central fact table.  Each row is one lost OR found report submitted by a user.
-- ---------------------------------------------------------------------------
create table public.items (
  id              uuid                    primary key default gen_random_uuid(),
  reporter_id     uuid                    not null references public.profiles (id) on delete cascade,
  report_type     public.item_report_type not null,
  status          public.item_status      not null default 'open',
  category        public.item_category    not null default 'other',

  -- Human-readable title, used for search
  title           text                    not null check (char_length(title) between 3 and 200),
  description     text,

  -- Where the item was lost / found (FK nullable: user may not know exact location)
  location_id     uuid                    references public.locations (id) on delete set null,
  -- Free-text override when the location is not in the locations table
  location_text   text,

  -- When it was lost / found (may differ from created_at)
  date_occurred   date,

  -- Optional contact override (e.g. a phone number to text)
  contact_override text,

  -- Soft-delete / expiry
  expires_at      timestamptz,
  resolved_at     timestamptz,

  created_at      timestamptz             not null default now(),
  updated_at      timestamptz             not null default now()
);

comment on table  public.items              is 'Lost and found item reports submitted by users.';
comment on column public.items.report_type  is 'lost = someone lost it; found = someone found it and is reporting it.';
comment on column public.items.status       is 'Lifecycle: open → claimed → resolved | expired.';
comment on column public.items.expires_at   is 'Populated by cron job; triggers auto-close to expired status.';

-- ---------------------------------------------------------------------------
-- item_images
-- ---------------------------------------------------------------------------
-- Up to N images per item.  storage_path references the Supabase Storage
-- object key so the app can build a signed / public URL.
-- ---------------------------------------------------------------------------
create table public.item_images (
  id            uuid        primary key default gen_random_uuid(),
  item_id       uuid        not null references public.items (id) on delete cascade,
  storage_path  text        not null,
  -- Which bucket: 'item-images' (public) or 'sensitive-images' (private)
  bucket        text        not null default 'item-images'
                            check (bucket in ('item-images', 'sensitive-images')),
  -- Display order (lower = shown first)
  sort_order    smallint    not null default 0,
  uploaded_at   timestamptz not null default now()
);

comment on table  public.item_images              is 'Storage references for photos attached to item reports.';
comment on column public.item_images.storage_path is 'Supabase Storage object path within its bucket.';
comment on column public.item_images.bucket       is 'item-images = public CDN; sensitive-images = private signed URL.';

-- ---------------------------------------------------------------------------
-- claims
-- ---------------------------------------------------------------------------
-- A user asserts they own a "found" item (or found a "lost" item).
-- Admins review claims and approve / reject.
-- ---------------------------------------------------------------------------
create table public.claims (
  id            uuid                 primary key default gen_random_uuid(),
  item_id       uuid                 not null references public.items (id) on delete cascade,
  claimant_id   uuid                 not null references public.profiles (id) on delete cascade,
  status        public.claim_status  not null default 'pending',
  -- The claimant's proof-of-ownership description
  proof_text    text,
  -- Optional: path to an uploaded proof image in sensitive-images bucket
  proof_image_path text,
  -- Admin note (reason for approve/reject decision)
  admin_note    text,
  reviewed_by   uuid                 references public.profiles (id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz          not null default now(),
  updated_at    timestamptz          not null default now(),
  -- One active claim per user per item
  unique (item_id, claimant_id)
);

comment on table  public.claims             is 'Ownership claims submitted by users for found items.';
comment on column public.claims.proof_text  is 'Claimant describes identifying details only the owner would know.';
comment on column public.claims.admin_note  is 'Reason recorded by admin when approving or rejecting a claim.';

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
-- Fan-out table: one row per (user, event, channel) tuple.
-- The app reads unread in_app rows; Resend handles the email channel.
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid                          primary key default gen_random_uuid(),
  user_id     uuid                          not null references public.profiles (id) on delete cascade,
  channel     public.notification_channel   not null default 'in_app',
  -- Semantic event type (e.g. 'claim_approved', 'item_matched', 'item_expired')
  event_type  text                          not null,
  -- Arbitrary JSON payload (item_id, claim_id, message, etc.)
  payload     jsonb                         not null default '{}',
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz                   not null default now()
);

comment on table  public.notifications            is 'In-app and email notification queue.';
comment on column public.notifications.event_type is 'Machine-readable event name, e.g. claim_approved.';
comment on column public.notifications.payload    is 'JSON with context: item_id, message, etc.';
comment on column public.notifications.read_at    is 'NULL = unread in-app notification.';

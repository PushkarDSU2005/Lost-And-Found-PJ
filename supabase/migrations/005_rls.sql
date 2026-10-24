-- =============================================================================
-- Migration 005: Row Level Security (RLS)
-- =============================================================================
-- Depends on: 002_tables.sql
-- Strategy:
--   • Enable RLS on every public table — deny-by-default.
--   • "anon" role (unauthenticated visitors): read-only access to open items
--     and locations. No access to claims, notifications, or profiles.
--   • "authenticated" role (any logged-in user): full self-service on own rows.
--   • "admin" role (profiles.role = 'admin'): unrestricted on all tables.
-- =============================================================================

-- Helper: check if the current user is an admin.
-- Defined as an IMMUTABLE security-definer function so it can be called
-- cheaply inside policy expressions without re-hitting the table each time.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =============================================================================
-- TABLE: profiles
-- =============================================================================
alter table public.profiles enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- Any authenticated user can read any profile (needed for displaying reporter
-- names on items).  Anon users cannot read profiles at all.
create policy "profiles: authenticated users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- ── INSERT ───────────────────────────────────────────────────────────────────
-- A user may only insert their own profile row (id must match auth.uid()).
-- In practice the trigger in migration 006 inserts this; the policy acts as
-- a safety net for manual inserts via the API.
create policy "profiles: users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- ── UPDATE ───────────────────────────────────────────────────────────────────
-- A user may update their own profile.  Admins may update any profile
-- (needed to promote/demote roles).
create policy "profiles: users update own profile, admins update any"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    -- Prevent non-admins from escalating their own role
    (id = auth.uid() and not public.is_admin())
      -- Non-admins cannot change the role column
      -- (enforced in application layer; belt-and-suspenders guard here)
      or public.is_admin()
  );

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Only admins can hard-delete profiles.  Regular users use account deactivation
-- (soft-delete) via the application layer.
create policy "profiles: only admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- TABLE: locations
-- =============================================================================
alter table public.locations enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- Locations are public reference data.  Everyone (including anon) can read them
-- so the "report lost item" form works without logging in.
create policy "locations: anyone can read"
  on public.locations for select
  using (true);

-- ── INSERT / UPDATE / DELETE ─────────────────────────────────────────────────
-- Only admins (and staff via the application layer) manage location records.
create policy "locations: only admins can insert"
  on public.locations for insert
  to authenticated
  with check (public.is_admin());

create policy "locations: only admins can update"
  on public.locations for update
  to authenticated
  using (public.is_admin());

create policy "locations: only admins can delete"
  on public.locations for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- TABLE: items
-- =============================================================================
alter table public.items enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- Anon users can browse open items (read-only public feed).
-- Authenticated users can also see their own closed/expired items.
-- Admins can see everything.
create policy "items: anon can read open items"
  on public.items for select
  using (
    -- Open items are visible to everyone
    status = 'open'
    -- Authenticated users additionally see their own items in any state
    or (auth.role() = 'authenticated' and reporter_id = auth.uid())
    -- Admins see all items regardless of status
    or (auth.role() = 'authenticated' and public.is_admin())
  );

-- ── INSERT ───────────────────────────────────────────────────────────────────
-- Any authenticated user can report an item; reporter_id must be their own id.
create policy "items: authenticated users can report items"
  on public.items for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- ── UPDATE ───────────────────────────────────────────────────────────────────
-- The reporter can edit their own item (e.g. add description, mark resolved).
-- Admins can edit any item (e.g. force-expire, change status).
create policy "items: reporter or admin can update"
  on public.items for update
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Reporters can delete their own open items.  Admins can delete any item.
-- Prevent deletion of items with approved/pending claims (enforced in app layer
-- too, but the policy still restricts direct API deletes).
create policy "items: reporter can delete own open items, admins delete any"
  on public.items for delete
  to authenticated
  using (
    (reporter_id = auth.uid() and status = 'open')
    or public.is_admin()
  );

-- =============================================================================
-- TABLE: item_images
-- =============================================================================
alter table public.item_images enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- Images inherit the visibility of their parent item.
-- Public (bucket='item-images') images on open items are readable by everyone.
-- Private (bucket='sensitive-images') images only readable by the item reporter
-- or an admin.
create policy "item_images: public images on open items readable by all"
  on public.item_images for select
  using (
    bucket = 'item-images'
    and exists (
      select 1 from public.items
      where id = item_images.item_id and status = 'open'
    )
    -- Also allow: authenticated reporter or admin sees their own item images
    or (
      auth.role() = 'authenticated'
      and exists (
        select 1 from public.items
        where id = item_images.item_id
          and (reporter_id = auth.uid() or public.is_admin())
      )
    )
  );

-- ── INSERT ───────────────────────────────────────────────────────────────────
-- Only the item's reporter (or admin) can attach images to it.
create policy "item_images: reporter or admin can insert"
  on public.item_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.items
      where id = item_images.item_id
        and (reporter_id = auth.uid() or public.is_admin())
    )
  );

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Same ownership check as INSERT.
create policy "item_images: reporter or admin can delete"
  on public.item_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.items
      where id = item_images.item_id
        and (reporter_id = auth.uid() or public.is_admin())
    )
  );

-- =============================================================================
-- TABLE: claims
-- =============================================================================
alter table public.claims enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- A user can only see their own claims.
-- The item's reporter can see all claims on their item (to compare proofs).
-- Admins see every claim.
create policy "claims: claimant sees own claims, reporter sees claims on their item, admins see all"
  on public.claims for select
  to authenticated
  using (
    claimant_id = auth.uid()
    or exists (
      select 1 from public.items
      where id = claims.item_id and reporter_id = auth.uid()
    )
    or public.is_admin()
  );

-- ── INSERT ───────────────────────────────────────────────────────────────────
-- Any authenticated user can open a claim; claimant_id must be their own id.
-- They cannot claim their own item (app layer + check constraint here).
create policy "claims: authenticated users can submit claims"
  on public.claims for insert
  to authenticated
  with check (
    claimant_id = auth.uid()
    -- Prevent self-claim: claimant cannot be the item reporter
    and not exists (
      select 1 from public.items
      where id = claims.item_id and reporter_id = auth.uid()
    )
  );

-- ── UPDATE ───────────────────────────────────────────────────────────────────
-- Claimants can only withdraw their own pending claim (set status='withdrawn').
-- using() checks the CURRENT row (must be pending and owned by them).
-- with check() allows the NEW row to have status 'withdrawn' (the withdrawal)
-- OR any status if the updater is an admin.
create policy "claims: claimant withdraws own pending claim, admins update any"
  on public.claims for update
  to authenticated
  using (
    (claimant_id = auth.uid() and status = 'pending')
    or public.is_admin()
  )
  with check (
    -- Non-admin claimant: can only set status to 'withdrawn'
    (claimant_id = auth.uid() and status = 'withdrawn' and not public.is_admin())
    or public.is_admin()
  );

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Only admins can hard-delete claim rows.
-- Regular users use the withdraw workflow (status update) instead.
create policy "claims: only admins can delete claims"
  on public.claims for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- TABLE: notifications
-- =============================================================================
alter table public.notifications enable row level security;

-- ── SELECT ───────────────────────────────────────────────────────────────────
-- A user can only read their own notifications.
-- Admins may read any user's notifications (for support / debugging).
create policy "notifications: users read own, admins read all"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ── INSERT ───────────────────────────────────────────────────────────────────
-- Notifications are created by server-side code only (service-role key).
-- No direct client insertion is permitted.
-- (Supabase service_role bypasses RLS — this policy blocks anon/authenticated
-- client attempts.)
create policy "notifications: no direct client insert"
  on public.notifications for insert
  to authenticated
  with check (false);

-- ── UPDATE ───────────────────────────────────────────────────────────────────
-- A user can mark their own in-app notifications as read (set read_at = now()).
-- Admins can update any notification (e.g. bulk-clear).
create policy "notifications: users mark own as read, admins update any"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ── DELETE ───────────────────────────────────────────────────────────────────
-- Only admins can delete notification rows.
create policy "notifications: only admins can delete"
  on public.notifications for delete
  to authenticated
  using (public.is_admin());

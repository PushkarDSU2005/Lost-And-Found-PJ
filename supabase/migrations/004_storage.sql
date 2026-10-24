-- =============================================================================
-- Migration 004: Storage Buckets
-- =============================================================================
-- Depends on: 002_tables.sql (for RLS policies referencing auth.uid())
-- Creates two buckets and their storage-level RLS policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Bucket: item-images  (public-read)
-- ---------------------------------------------------------------------------
-- Used for general item photos that are safe to show publicly (no personal info).
-- Objects are readable by anyone; only authenticated users can upload.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,                    -- public CDN access — no signed URL needed
  5242880,                 -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Bucket: sensitive-images  (private)
-- ---------------------------------------------------------------------------
-- Used for proof-of-ownership images attached to claims.
-- Must never be publicly readable — always served via signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sensitive-images',
  'sensitive-images',
  false,                   -- private — all reads require a signed URL
  10485760,                -- 10 MB per file (allow higher-res proof photos)
  array['image/jpeg', 'image/png', 'image/webp', 'image/pdf']
)
on conflict (id) do nothing;

-- =============================================================================
-- Storage RLS policies
-- =============================================================================
-- Note: storage.objects RLS is separate from table RLS.
-- Supabase exposes auth.uid() and auth.role() inside storage policies.
-- =============================================================================

-- ── item-images: SELECT ──────────────────────────────────────────────────────
-- Anyone (including anonymous visitors) can view public item images.
create policy "item-images: public read"
  on storage.objects for select
  using (bucket_id = 'item-images');

-- ── item-images: INSERT ──────────────────────────────────────────────────────
-- Only authenticated users may upload; path must start with their own user ID
-- so a user cannot overwrite another user's images.
-- Expected path format: <user_id>/<item_id>/<filename>
create policy "item-images: authenticated upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── item-images: UPDATE ──────────────────────────────────────────────────────
-- Users can only update (replace) objects inside their own folder.
create policy "item-images: owner update"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── item-images: DELETE ──────────────────────────────────────────────────────
-- Users delete from their own folder; admins can delete anything.
create policy "item-images: owner or admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- ── sensitive-images: SELECT ─────────────────────────────────────────────────
-- Only the uploader (claimant) or an admin may retrieve proof images.
-- Expected path format: <user_id>/<claim_id>/<filename>
create policy "sensitive-images: owner or admin read"
  on storage.objects for select
  using (
    bucket_id = 'sensitive-images'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

-- ── sensitive-images: INSERT ─────────────────────────────────────────────────
-- Authenticated users upload only to their own folder.
create policy "sensitive-images: authenticated upload own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'sensitive-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── sensitive-images: DELETE ─────────────────────────────────────────────────
-- The uploader or an admin can delete proof images.
create policy "sensitive-images: owner or admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'sensitive-images'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'admin'
      )
    )
  );

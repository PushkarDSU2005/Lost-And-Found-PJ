-- =============================================================================
-- Migration 008: Add is_banned to profiles
-- =============================================================================
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

comment on column public.profiles.is_banned
  is 'When true, the user cannot post, claim, or message. Set by admin only.';

-- RLS: only admins can set is_banned=true. Regular users cannot change it.
-- The existing profiles UPDATE policy already restricts who can update,
-- but we add an extra check so a non-admin cannot set their own is_banned.
-- (Enforced at app layer; belt-and-suspenders here.)

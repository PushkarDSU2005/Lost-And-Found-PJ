-- =============================================================================
-- Migration 006: Triggers
-- =============================================================================
-- Depends on: 002_tables.sql, 001_extensions_enums.sql (moddatetime)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Trigger 1: Auto-create profile on auth.users INSERT
-- ---------------------------------------------------------------------------
-- When Supabase Auth creates a new user row in auth.users, this trigger fires
-- and inserts the corresponding row in public.profiles.
-- This means the app never has to call a separate "createProfile" RPC — it
-- happens atomically in the same transaction as sign-up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    -- Supabase stores display name in raw_user_meta_data->>'full_name'
    -- (populated by OAuth providers and the signUp({ data: {} }) option)
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;   -- idempotent: safe to re-run
  return new;
end;
$$;

-- Attach to auth.users (must run in the same migration so Supabase applies it)
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger 2: Auto-update updated_at on every table that has it
-- ---------------------------------------------------------------------------
-- Uses the moddatetime extension (loaded in migration 001).
-- Each create trigger call wires up one table; moddatetime handles the rest.
-- ---------------------------------------------------------------------------

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function extensions.moddatetime(updated_at);

create or replace trigger set_locations_updated_at
  before update on public.locations
  for each row
  execute function extensions.moddatetime(updated_at);

create or replace trigger set_items_updated_at
  before update on public.items
  for each row
  execute function extensions.moddatetime(updated_at);

create or replace trigger set_claims_updated_at
  before update on public.claims
  for each row
  execute function extensions.moddatetime(updated_at);

-- ---------------------------------------------------------------------------
-- Trigger 3: Auto-set items.resolved_at when status → 'resolved' or 'expired'
-- ---------------------------------------------------------------------------
create or replace function public.handle_item_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Set resolved_at timestamp the first time an item leaves 'open'/'claimed'
  if new.status in ('resolved', 'expired') and old.status not in ('resolved', 'expired') then
    new.resolved_at := now();
  end if;
  -- Clear resolved_at if an admin reopens an item (edge-case)
  if new.status = 'open' and old.status in ('resolved', 'expired') then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create or replace trigger on_item_status_change
  before update of status on public.items
  for each row
  execute function public.handle_item_status_change();

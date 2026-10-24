-- =============================================================================
-- Migration 007: Add extra columns to items needed by the report form
-- =============================================================================
-- held_at          — drop-point location where a found item is being stored
-- is_sensitive     — if true, images go to the private bucket
-- verification_question — question only the real owner can answer (found items)
-- verification_answer_hash — SHA-256 hex of the answer (never stored plain)
-- =============================================================================

alter table public.items
  add column if not exists held_at                   uuid
    references public.locations (id) on delete set null,

  add column if not exists is_sensitive              boolean
    not null default false,

  add column if not exists verification_question     text,

  -- SHA-256 hex digest; never expose to non-admin clients
  add column if not exists verification_answer_hash  text;

comment on column public.items.held_at
  is 'Drop-point location currently holding this found item (optional).';

comment on column public.items.is_sensitive
  is 'When true, images are stored in the private bucket and hidden from anon.';

comment on column public.items.verification_question
  is 'Question the reporter asks to verify ownership (visible to claimants).';

comment on column public.items.verification_answer_hash
  is 'SHA-256 hex of the answer — never returned to non-admin clients.';

-- RLS: never expose verification_answer_hash or is_sensitive details to
-- non-admin clients. The column-level security is enforced by only SELECTing
-- safe columns in all client queries; the row-level policies already exist.
-- (Column-level grants would be ideal but Supabase PostgREST works at the row
-- level; we rely on app-layer column selection and the existing RLS policies.)

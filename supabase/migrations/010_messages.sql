-- =============================================================================
-- Migration 010: Messages table + RLS
-- =============================================================================
-- Per-claim chat threads. Only the two parties (claimant + item reporter)
-- and admins can read or write to a thread.
-- Messages never expose either party's contact details.
-- =============================================================================

create table public.messages (
  id          uuid        primary key default gen_random_uuid(),
  claim_id    uuid        not null references public.claims (id) on delete cascade,
  sender_id   uuid        not null references public.profiles (id) on delete cascade,
  body        text        not null
                          check (char_length(body) between 1 and 1000),
  created_at  timestamptz not null default now()
);

comment on table  public.messages           is 'Per-claim in-app chat messages between claimant and item reporter.';
comment on column public.messages.body      is 'Message body — max 1000 chars. Content filtered server-side before insert.';
comment on column public.messages.claim_id  is 'The claim this message thread belongs to.';

-- Indexes
create index idx_messages_claim_id
  on public.messages (claim_id, created_at asc);

create index idx_messages_sender_id
  on public.messages (sender_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.messages enable row level security;

-- Helper: check if the current user is a participant (claimant or item reporter)
-- for a given claim. Used in multiple policies.
create or replace function public.is_claim_participant(p_claim_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.claims c
    join public.items i on i.id = c.item_id
    where c.id = p_claim_id
      and (c.claimant_id = auth.uid() or i.reporter_id = auth.uid())
  );
$$;

comment on function public.is_claim_participant
  is 'Returns true if the current user is the claimant or item reporter for the given claim.';

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Only the two parties on a claim and admins can read messages in that thread.
-- Anon users cannot read any messages.
create policy "messages: participants and admins can read"
  on public.messages for select
  to authenticated
  using (
    public.is_claim_participant(claim_id)
    or public.is_admin()
  );

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Only a participant of the claim can send messages; sender_id must be their own id.
-- Admins can also send (e.g. moderation notes).
create policy "messages: participants can send"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and (
      public.is_claim_participant(claim_id)
      or public.is_admin()
    )
  );

-- ── UPDATE ────────────────────────────────────────────────────────────────────
-- Messages are immutable — no edits allowed.
-- (No UPDATE policy = UPDATE always denied.)

-- ── DELETE ────────────────────────────────────────────────────────────────────
-- Only admins can delete messages (moderation).
create policy "messages: only admins can delete"
  on public.messages for delete
  to authenticated
  using (public.is_admin());

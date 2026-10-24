-- =============================================================================
-- Migration 012: audit_log table for admin actions
-- =============================================================================
-- Tracks every admin action for compliance and debugging.
-- Never updated or deleted — append-only log.
-- =============================================================================

create table public.audit_log (
  id          uuid        primary key default gen_random_uuid(),
  admin_id    uuid        not null references public.profiles (id) on delete restrict,
  action      text        not null,
  target_type text        not null, -- 'item', 'user', 'location', 'claim', etc.
  target_id   uuid        null,     -- ID of the affected resource
  metadata    jsonb       not null default '{}',
  created_at  timestamptz not null default now()
);

comment on table  public.audit_log           is 'Append-only log of all admin actions for compliance and audit trails.';
comment on column public.audit_log.action    is 'Action name, e.g. "ban_user", "remove_item", "resolve_report".';
comment on column public.audit_log.metadata  is 'Additional context (reason, before/after values, etc.).';

-- Indexes
create index idx_audit_log_admin_id
  on public.audit_log (admin_id, created_at desc);

create index idx_audit_log_target
  on public.audit_log (target_type, target_id);

create index idx_audit_log_created_at
  on public.audit_log (created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.audit_log enable row level security;

-- ── SELECT ────────────────────────────────────────────────────────────────────
-- Only admins can read audit logs.
create policy "audit_log: only admins can read"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

-- ── INSERT ────────────────────────────────────────────────────────────────────
-- Only admins can write audit logs (via service role in practice).
-- Client inserts blocked — WITH CHECK (false).
create policy "audit_log: insert blocked (service role only)"
  on public.audit_log for insert
  to authenticated
  with check (false);

-- ── UPDATE / DELETE ───────────────────────────────────────────────────────────
-- Audit logs are immutable — no UPDATE or DELETE policies.
-- (No policy = operation always denied.)

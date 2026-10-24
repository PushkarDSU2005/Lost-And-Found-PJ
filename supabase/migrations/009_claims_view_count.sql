-- =============================================================================
-- Migration 009: Helper function for pending claim count (used by item detail)
-- =============================================================================
-- Returns the number of pending claims for a given item.
-- Used to show a badge on the "View Claims" button without exposing claim data.

create or replace function public.pending_claim_count(item_uuid uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.claims
  where item_id = item_uuid
    and status = 'pending';
$$;

comment on function public.pending_claim_count
  is 'Returns the count of pending claims for an item. Security definer so the item reporter can call it without full claims SELECT access to other rows.';

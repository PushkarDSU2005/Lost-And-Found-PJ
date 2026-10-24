-- =============================================================================
-- Migration 011: match_items() function for rule-based match suggestions
-- =============================================================================
-- Scores potential matches based on category, location, date, and title similarity.
-- Scoring rubric:
--   Same category:                +3
--   Same location_id:             +2
--   date_occurred within 7 days:  +2
--   Title similarity (pg_trgm):   +3 max (scaled by similarity)
-- Returns top 5 matches above threshold (default 5) of opposite report_type.
-- =============================================================================

create or replace function public.match_items(
  p_item_id      uuid,
  p_threshold    int default 5,
  p_limit        int default 5
)
returns table (
  match_id    uuid,
  match_title text,
  score       int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_report_type  item_report_type;
  v_category     item_category;
  v_location_id  uuid;
  v_date         date;
  v_title        text;
begin
  -- Load the source item
  select report_type, category, location_id, date_occurred, title
    into v_report_type, v_category, v_location_id, v_date, v_title
    from public.items
   where id = p_item_id;

  if not found then
    return;
  end if;

  -- Find candidates: opposite type, status = 'open', not the same item
  return query
  select
    i.id as match_id,
    i.title as match_title,
    (
      -- Same category: +3
      case when i.category = v_category then 3 else 0 end
      +
      -- Same location: +2
      case when i.location_id is not null
                and i.location_id = v_location_id
           then 2 else 0 end
      +
      -- Date within 7 days: +2
      case when i.date_occurred is not null
                and v_date is not null
                and abs(extract(epoch from (i.date_occurred - v_date)) / 86400) <= 7
           then 2 else 0 end
      +
      -- Title similarity (pg_trgm): +3 scaled by similarity
      greatest(0, floor(similarity(i.title, v_title) * 3)::int)
    )::int as score
   from public.items i
  where i.id != p_item_id
    and i.status = 'open'
    and i.report_type != v_report_type
    and (
          -- Same category: +3
          case when i.category = v_category then 3 else 0 end
          +
          case when i.location_id is not null
                    and i.location_id = v_location_id
               then 2 else 0 end
          +
          case when i.date_occurred is not null
                    and v_date is not null
                    and abs(extract(epoch from (i.date_occurred - v_date)) / 86400) <= 7
               then 2 else 0 end
          +
          greatest(0, floor(similarity(i.title, v_title) * 3)::int)
        ) >= p_threshold
  order by score desc, i.created_at desc
  limit p_limit;
end;
$$;

comment on function public.match_items
  is 'Returns top matching items of opposite report_type based on category, location, date, and title similarity scoring.';

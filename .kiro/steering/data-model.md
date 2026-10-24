---
inclusion: always
---

# Data Model — Lost & Found

## Enums

| Enum | Values |
|------|--------|
| `item_report_type` | `lost`, `found` |
| `item_status` | `open`, `claimed`, `resolved`, `expired` |
| `item_category` | `electronics`, `clothing`, `accessories`, `books_stationery`, `keys`, `sports_fitness`, `id_documents`, `food_drink`, `other` |
| `user_role` | `student`, `staff`, `admin` |
| `claim_status` | `pending`, `approved`, `rejected`, `withdrawn` |
| `notification_channel` | `in_app`, `email` |

## Tables

### `profiles`
Extended user profile synced from `auth.users` via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | |
| `full_name` | `text` | |
| `avatar_url` | `text` | |
| `role` | `user_role` | default `student` |
| `notify_email` | `boolean` | default `true` |
| `created_at` / `updated_at` | `timestamptz` | auto-managed |

### `locations`
Campus buildings and designated drop-off points.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `name` | `text` | |
| `building` | `text` | |
| `floor` | `text` | |
| `description` | `text` | |
| `drop_point` | `boolean` | staffed collection desk |
| `hours` | `text` | opening hours (drop-points) |
| `geom` | `jsonb` | GeoJSON Point (future map) |

### `items`
Lost and found reports — the central fact table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `reporter_id` | `uuid` | FK → `profiles` |
| `report_type` | `item_report_type` | `lost` or `found` |
| `status` | `item_status` | default `open` |
| `category` | `item_category` | default `other` |
| `title` | `text` | 3–200 chars; trigram-indexed |
| `description` | `text` | |
| `location_id` | `uuid` | nullable FK → `locations` |
| `location_text` | `text` | free-text fallback |
| `date_occurred` | `date` | when lost/found |
| `contact_override` | `text` | |
| `expires_at` | `timestamptz` | set by cron job |
| `resolved_at` | `timestamptz` | auto-set by trigger |

### `item_images`
Storage references for item photos.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `item_id` | `uuid` | FK → `items` |
| `storage_path` | `text` | path within bucket |
| `bucket` | `text` | `item-images` or `sensitive-images` |
| `sort_order` | `smallint` | display order |

### `claims`
Ownership claims on found items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `item_id` | `uuid` | FK → `items` |
| `claimant_id` | `uuid` | FK → `profiles` |
| `status` | `claim_status` | default `pending` |
| `proof_text` | `text` | identifying description |
| `proof_image_path` | `text` | path in `sensitive-images` |
| `admin_note` | `text` | reason for approve/reject |
| `reviewed_by` | `uuid` | FK → `profiles` |
| `reviewed_at` | `timestamptz` | |
| unique | `(item_id, claimant_id)` | one active claim per user per item |

### `notifications`
In-app and email notification queue.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `user_id` | `uuid` | FK → `profiles` |
| `channel` | `notification_channel` | |
| `event_type` | `text` | e.g. `claim_approved` |
| `payload` | `jsonb` | arbitrary context |
| `read_at` | `timestamptz` | null = unread |
| `sent_at` | `timestamptz` | |

## Storage Buckets

| Bucket | Public | Max size | Use |
|--------|--------|----------|-----|
| `item-images` | ✅ yes | 5 MB | General item photos |
| `sensitive-images` | ❌ no | 10 MB | Claim proof images, sensitive docs |

### Path conventions
- `item-images`: `<user_id>/<item_id>/<filename>`
- `sensitive-images`: `<user_id>/<claim_id>/<filename>`

## RLS Summary

| Table | anon | student (own) | student (others) | admin |
|-------|------|--------------|-----------------|-------|
| `profiles` | ❌ | read/update own | read | full |
| `locations` | read | read | read | full |
| `items` | read open | CRUD own open | read open | full |
| `item_images` | read public on open | CRUD own | read public on open | full |
| `claims` | ❌ | CRUD own; read on own item | read claims on their item | full |
| `notifications` | ❌ | read/update own | ❌ | full |

## Triggers

| Trigger | Event | Effect |
|---------|-------|--------|
| `on_auth_user_created` | `AFTER INSERT ON auth.users` | Auto-creates `profiles` row |
| `set_*_updated_at` | `BEFORE UPDATE` on each table | Sets `updated_at = now()` via moddatetime |
| `on_item_status_change` | `BEFORE UPDATE OF status ON items` | Sets/clears `resolved_at` |

## Key Indexes

- `idx_items_title_trgm` — GIN trigram index for `ILIKE '%keyword%'` search
- `idx_items_type_status_created` — compound for the main listing query
- `idx_items_status_open` — partial index on open items only
- `idx_notifications_user_unread` — partial index for bell-icon count

## Testing Strategy

### Personas
- **anon** — unauthenticated visitor
- **studentA** — owner of items `openByA`
- **studentB** — owner of items `openByB`; attempts cross-user actions
- **admin** — `profiles.role = 'admin'`

### Coverage Matrix
Every policy in `005_rls.sql` has at least one positive test (action allowed) and one negative test (action denied).  See `/tests/integration/rls.test.ts`.

### Seed UUIDs (stable)
```
users.admin     = 00000000-0000-0000-0000-000000000001
users.studentA  = 00000000-0000-0000-0000-000000000002
users.studentB  = 00000000-0000-0000-0000-000000000003
items.openByA   = 20000000-0000-0000-0000-000000000001
items.openByB   = 20000000-0000-0000-0000-000000000002
items.resolved  = 20000000-0000-0000-0000-000000000013
```

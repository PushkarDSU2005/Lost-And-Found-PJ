-- =============================================================================
-- reseed-real-uuids.sql
-- =============================================================================
-- Removes the four broken zero-UUID seed rows from auth.users (which cascades
-- to public.profiles and public.items via FK ON DELETE CASCADE), then
-- re-inserts profiles and items using real GoTrue UUIDs.
--
-- Real UUIDs (assigned by GoTrue):
--   admin    (pushkarraj11a7317@gmail.com) = 808220f8-5762-45ea-afb4-8ca1efe5b4d1
--   studentA (avikjaiswal01@gmail.com)    = b53e7d59-ab87-4014-8fe5-6dd11b55f869
--   studentB (myoneplus373@gmail.com)     = 7b3ce23c-6dbf-45bd-af1f-401661f75ea4
--   studentC (carol — no real account)   = c9f3e441-0000-4000-8000-000000000004
--             ^ We create a minimal auth.users row for studentC so the FK is
--               satisfied; studentC is never signed into directly in tests.
-- =============================================================================

BEGIN;

-- ── Step 1: delete old zero-UUID auth rows (cascades to profiles + items) ───
DELETE FROM auth.users
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);

-- ── Step 2: insert a proper auth.users row for studentC (no real sign-in) ───
-- Uses a valid random-looking UUID and correct app metadata so GoTrue ignores
-- it gracefully. studentC only owns seed items; no test signs in as them.
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
) VALUES (
  'c9f3e441-0000-4000-8000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'carol-seed@internal.invalid',
  crypt('not-a-real-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Carol Martinez"}'::jsonb,
  'authenticated', 'authenticated', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- ── Step 3: upsert profiles for all four users ───────────────────────────────
-- admin/studentA/studentB already have profiles created by the trigger when
-- create-real-users.mjs called the Admin API. We upsert to ensure correct roles.
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('808220f8-5762-45ea-afb4-8ca1efe5b4d1', 'pushkarraj11a7317@gmail.com', 'Pushkar (Admin)',   'admin'),
  ('b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'avikjaiswal01@gmail.com',    'Avik (StudentA)',   'student'),
  ('7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'myoneplus373@gmail.com',      'Student B',         'student'),
  ('c9f3e441-0000-4000-8000-000000000004', 'carol-seed@internal.invalid', 'Carol Martinez',    'student')
ON CONFLICT (id) DO UPDATE SET
  role      = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  email     = EXCLUDED.email;

-- ── Step 4: re-insert items using real UUIDs ─────────────────────────────────
-- Stable item UUIDs are kept (prefixed 20000000-...) so test assertions don't
-- need to change. Only reporter_id values change.

INSERT INTO public.items
  (id, reporter_id, report_type, status, category, title, description,
   location_id, date_occurred)
VALUES

  -- studentA items (reporter = avikjaiswal01@gmail.com)
  ('20000000-0000-0000-0000-000000000001',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'lost', 'open', 'electronics',
   'iPhone 14 Pro — Space Black',
   'Black iPhone 14 Pro with a cracked bottom-right corner and a green glow-in-the-dark case. Lock screen has a photo of a golden retriever.',
   '10000000-0000-0000-0000-000000000001', current_date - 2),

  ('20000000-0000-0000-0000-000000000003',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'lost', 'open', 'clothing',
   'Navy blue puffer jacket — size M',
   'North Face style navy puffer, size M. Has a small yellow badge on the left sleeve and initials "AN" written inside the collar.',
   '10000000-0000-0000-0000-000000000002', current_date - 3),

  ('20000000-0000-0000-0000-000000000006',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'found', 'open', 'keys',
   'Set of 3 keys on a red carabiner keychain',
   'Three keys on a bright red carabiner clip; also has a small Eiffel Tower souvenir keyring attached. Found outside lecture theatre LT1.',
   '10000000-0000-0000-0000-000000000010', current_date - 4),

  ('20000000-0000-0000-0000-000000000009',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'lost', 'open', 'books_stationery',
   'Organic Chemistry textbook (Clayden, 2nd ed)',
   'Clayden Organic Chemistry 2nd edition paperback. Name "Alice N" written on the first page; lots of yellow highlighter throughout chapters 1–5.',
   '10000000-0000-0000-0000-000000000005', current_date - 5),

  ('20000000-0000-0000-0000-000000000012',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'found', 'open', 'electronics',
   'USB-C laptop charger — 65W white brick',
   '65W USB-C white charging brick with a 1.5m cable. No identifying marks. Found in parking lot near bay W22.',
   '10000000-0000-0000-0000-000000000008', current_date - 3),

  ('20000000-0000-0000-0000-000000000015',
   'b53e7d59-ab87-4014-8fe5-6dd11b55f869', 'found', 'open', 'id_documents',
   'International passport — found near security gate',
   'A passport was found near the main gate. Due to sensitivity, details are withheld. Please visit the Security Desk with proof of identity to collect.',
   '10000000-0000-0000-0000-000000000011', current_date),

  -- studentB items (reporter = myoneplus373@gmail.com)
  ('20000000-0000-0000-0000-000000000002',
   '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'found', 'open', 'electronics',
   'White wireless earbuds in charging case',
   'Found on a library desk near window seat W12. White AirPods-style earbuds; case has a small dent on the lid.',
   '10000000-0000-0000-0000-000000000001', current_date - 1),

  ('20000000-0000-0000-0000-000000000005',
   '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'lost', 'open', 'id_documents',
   'Student ID card — Bob Okafor',
   'University photo ID card. If found please drop at the Security Desk or Student Union reception.',
   '10000000-0000-0000-0000-000000000004', current_date),

  ('20000000-0000-0000-0000-000000000008',
   '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'found', 'open', 'accessories',
   'Brown leather bifold wallet',
   'Brown leather bifold wallet. Contains several bank cards and a student railcard but no cash. Handed in to the Library desk.',
   '10000000-0000-0000-0000-000000000012', current_date),

  ('20000000-0000-0000-0000-000000000011',
   '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'lost', 'open', 'accessories',
   'Prescription glasses — thin gold wire frame',
   'Thin gold wire-frame prescription glasses, -3.5 in both lenses. Stored in a hard burgundy case when not in use. Last seen in the student union lounge.',
   '10000000-0000-0000-0000-000000000009', current_date - 1),

  ('20000000-0000-0000-0000-000000000014',
   '7b3ce23c-6dbf-45bd-af1f-401661f75ea4', 'lost', 'open', 'food_drink',
   'Blue Sistema lunch box with strap',
   'Blue rectangular Sistema lunch box with a grey strap. Has a doodle of a sun on the lid in black marker. Last seen in the library.',
   '10000000-0000-0000-0000-000000000001', current_date - 1),

  -- studentC items (reporter = carol, internal-only account)
  ('20000000-0000-0000-0000-000000000004',
   'c9f3e441-0000-4000-8000-000000000004', 'found', 'open', 'sports_fitness',
   'Black Hydro Flask 32oz water bottle',
   'Black Hydro Flask with University sticker and the name "Josh" written in marker near the base. Found in the sports hall changing room.',
   '10000000-0000-0000-0000-000000000003', current_date - 1),

  ('20000000-0000-0000-0000-000000000007',
   'c9f3e441-0000-4000-8000-000000000004', 'lost', 'open', 'electronics',
   'MacBook Air 13" M2 — Silver',
   'Silver MacBook Air M2. Has a holographic sticker of a cassette tape on the lid and a small scratch near the charger port. Last seen in the Arts block seminar room A103.',
   '10000000-0000-0000-0000-000000000006', current_date - 1),

  ('20000000-0000-0000-0000-000000000010',
   'c9f3e441-0000-4000-8000-000000000004', 'found', 'open', 'accessories',
   'Compact automatic umbrella — dark green',
   'Dark green compact umbrella with a wooden-effect handle. Found in the student cafeteria near the salad bar.',
   '10000000-0000-0000-0000-000000000002', current_date - 2),

  ('20000000-0000-0000-0000-000000000013',
   'c9f3e441-0000-4000-8000-000000000004', 'found', 'resolved', 'keys',
   'Yale door key on university lanyard',
   'Single Yale key on a university-branded lanyard. Owner verified via admin office records.',
   '10000000-0000-0000-0000-000000000007', current_date - 10)

ON CONFLICT (id) DO NOTHING;

-- ── Verify ───────────────────────────────────────────────────────────────────
SELECT p.email, p.role, COUNT(i.id) AS items_owned
FROM public.profiles p
LEFT JOIN public.items i ON i.reporter_id = p.id
GROUP BY p.email, p.role
ORDER BY p.role, p.email;

COMMIT;

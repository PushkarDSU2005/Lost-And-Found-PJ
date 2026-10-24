-- =============================================================================
-- Seed Data
-- =============================================================================
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING).
-- Run AFTER all migrations have been applied.
-- Intended for: local dev, staging, and integration test setup.
--
-- NOTE: inserts directly into auth.users (requires service-role / direct DB
-- access) so the profiles FK constraint is satisfied without needing real
-- Supabase Auth sign-ups.
-- =============================================================================

do $$
declare
  uid_admin     uuid := '00000000-0000-0000-0000-000000000001';
  uid_student_a uuid := '00000000-0000-0000-0000-000000000002';
  uid_student_b uuid := '00000000-0000-0000-0000-000000000003';
  uid_student_c uuid := '00000000-0000-0000-0000-000000000004';

  -- location IDs (stable UUIDs for test references)
  loc_library       uuid := '10000000-0000-0000-0000-000000000001';
  loc_cafeteria     uuid := '10000000-0000-0000-0000-000000000002';
  loc_sports_hall   uuid := '10000000-0000-0000-0000-000000000003';
  loc_main_gate     uuid := '10000000-0000-0000-0000-000000000004';
  loc_science_block uuid := '10000000-0000-0000-0000-000000000005';
  loc_arts_block    uuid := '10000000-0000-0000-0000-000000000006';
  loc_admin_office  uuid := '10000000-0000-0000-0000-000000000007';
  loc_parking_lot   uuid := '10000000-0000-0000-0000-000000000008';
  loc_student_union uuid := '10000000-0000-0000-0000-000000000009';
  loc_lecture_hall  uuid := '10000000-0000-0000-0000-000000000010';
  loc_drop_security uuid := '10000000-0000-0000-0000-000000000011';
  loc_drop_library  uuid := '10000000-0000-0000-0000-000000000012';
  loc_drop_union    uuid := '10000000-0000-0000-0000-000000000013';

begin

  -- ── auth.users ─────────────────────────────────────────────────────────────
  -- Insert raw auth users so the profiles FK is satisfied.
  -- Passwords are bcrypt-hashed 'TestPassword123!' — change before real use.
  -- The on_auth_user_created trigger will auto-create profiles; the explicit
  -- profiles insert below uses ON CONFLICT DO NOTHING as a safety net.
  insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, role, aud, created_at, updated_at
  ) values
    (uid_admin, '00000000-0000-0000-0000-000000000000',
     'admin@university.edu',
     crypt('TestPassword123!', gen_salt('bf')),
     now(),
     '{"full_name":"Campus Admin"}'::jsonb,
     'authenticated', 'authenticated', now(), now()),

    (uid_student_a, '00000000-0000-0000-0000-000000000000',
     'alice@university.edu',
     crypt('TestPassword123!', gen_salt('bf')),
     now(),
     '{"full_name":"Alice Nguyen"}'::jsonb,
     'authenticated', 'authenticated', now(), now()),

    (uid_student_b, '00000000-0000-0000-0000-000000000000',
     'bob@university.edu',
     crypt('TestPassword123!', gen_salt('bf')),
     now(),
     '{"full_name":"Bob Okafor"}'::jsonb,
     'authenticated', 'authenticated', now(), now()),

    (uid_student_c, '00000000-0000-0000-0000-000000000000',
     'carol@university.edu',
     crypt('TestPassword123!', gen_salt('bf')),
     now(),
     '{"full_name":"Carol Martinez"}'::jsonb,
     'authenticated', 'authenticated', now(), now())
  on conflict (id) do nothing;

  -- ── profiles ───────────────────────────────────────────────────────────────
  -- The trigger auto-creates these; this insert handles cases where the trigger
  -- was not active (e.g. direct DB seeding) and upgrades the admin role.
  insert into public.profiles (id, email, full_name, role) values
    (uid_admin,     'admin@university.edu',  'Campus Admin',   'admin'),
    (uid_student_a, 'alice@university.edu',  'Alice Nguyen',   'student'),
    (uid_student_b, 'bob@university.edu',    'Bob Okafor',     'student'),
    (uid_student_c, 'carol@university.edu',  'Carol Martinez', 'student')
  on conflict (id) do update set
    role = excluded.role,       -- ensure admin role is applied
    full_name = excluded.full_name;

  -- ── locations (9 general + 3 drop-points = 12 total) ─────────────────────
  insert into public.locations (id, name, building, floor, description, drop_point) values
    (loc_library,
      'Main Library', 'Library Building', 'Ground Floor',
      'Large open-plan study area near the main entrance.', false),
    (loc_cafeteria,
      'Student Cafeteria', 'Student Services Building', 'Ground Floor',
      'Main dining hall; seating for 400 students.', false),
    (loc_sports_hall,
      'Sports Hall & Gym', 'Recreation Centre', 'Ground Floor',
      'Indoor courts, changing rooms, and equipment storage.', false),
    (loc_main_gate,
      'Main Campus Gate', 'Entrance Plaza', null,
      'Turnstile entrance from University Road.', false),
    (loc_science_block,
      'Science Block Foyer', 'Science Building', 'Ground Floor',
      'Common area outside labs B01–B12.', false),
    (loc_arts_block,
      'Arts & Humanities Block', 'Arts Building', '1st Floor',
      'Corridor outside seminar rooms A101–A115.', false),
    (loc_admin_office,
      'Student Affairs Office', 'Administration Building', '2nd Floor',
      'Registration and student support desk.', false),
    (loc_parking_lot,
      'West Parking Lot', 'External Grounds', null,
      'Car park between the gym and the Science block.', false),
    (loc_student_union,
      'Student Union Bar & Lounge', 'Student Union Building', 'Ground Floor',
      'Social hub; pool tables, sofas, vending machines.', false),
    (loc_lecture_hall,
      'Lecture Theatre LT1', 'Main Academic Building', 'Ground Floor',
      '500-seat tiered lecture hall.', false)
  on conflict (id) do nothing;

  insert into public.locations (id, name, building, floor, description, drop_point, hours) values
    (loc_drop_security,
      'Security Desk — Drop-off Point', 'Main Gate House', null,
      'Staffed 24/7. Hand in or collect items at the security window.',
      true, 'Open 24 hours, 7 days a week'),
    (loc_drop_library,
      'Library Information Desk — Drop-off Point', 'Library Building', 'Ground Floor',
      'Items handed to library staff are logged and stored in the back office.',
      true, 'Mon–Fri 08:00–20:00 · Sat 09:00–17:00 · Sun closed'),
    (loc_drop_union,
      'Student Union Reception — Drop-off Point', 'Student Union Building', 'Ground Floor',
      'Reception desk near the main entrance of the Student Union.',
      true, 'Mon–Fri 09:00–22:00 · Sat–Sun 10:00–18:00')
  on conflict (id) do nothing;

  -- ── items (15 sample reports) ─────────────────────────────────────────────
  insert into public.items
    (id, reporter_id, report_type, status, category, title, description,
     location_id, date_occurred)
  values
    ('20000000-0000-0000-0000-000000000001',
     uid_student_a, 'lost', 'open', 'electronics',
     'iPhone 14 Pro — Space Black',
     'Black iPhone 14 Pro with a cracked bottom-right corner and a green glow-in-the-dark case. Lock screen has a photo of a golden retriever.',
     loc_library, current_date - 2),

    ('20000000-0000-0000-0000-000000000002',
     uid_student_b, 'found', 'open', 'electronics',
     'White wireless earbuds in charging case',
     'Found on a library desk near window seat W12. White AirPods-style earbuds; case has a small dent on the lid.',
     loc_library, current_date - 1),

    ('20000000-0000-0000-0000-000000000003',
     uid_student_a, 'lost', 'open', 'clothing',
     'Navy blue puffer jacket — size M',
     'North Face style navy puffer, size M. Has a small yellow badge on the left sleeve and initials "AN" written inside the collar.',
     loc_cafeteria, current_date - 3),

    ('20000000-0000-0000-0000-000000000004',
     uid_student_c, 'found', 'open', 'sports_fitness',
     'Black Hydro Flask 32oz water bottle',
     'Black Hydro Flask with University sticker and the name "Josh" written in marker near the base. Found in the sports hall changing room.',
     loc_sports_hall, current_date - 1),

    ('20000000-0000-0000-0000-000000000005',
     uid_student_b, 'lost', 'open', 'id_documents',
     'Student ID card — Bob Okafor',
     'University photo ID card. If found please drop at the Security Desk or Student Union reception.',
     loc_main_gate, current_date),

    ('20000000-0000-0000-0000-000000000006',
     uid_student_a, 'found', 'open', 'keys',
     'Set of 3 keys on a red carabiner keychain',
     'Three keys on a bright red carabiner clip; also has a small Eiffel Tower souvenir keyring attached. Found outside lecture theatre LT1.',
     loc_lecture_hall, current_date - 4),

    ('20000000-0000-0000-0000-000000000007',
     uid_student_c, 'lost', 'open', 'electronics',
     'MacBook Air 13" M2 — Silver',
     'Silver MacBook Air M2. Has a holographic sticker of a cassette tape on the lid and a small scratch near the charger port. Last seen in the Arts block seminar room A103.',
     loc_arts_block, current_date - 1),

    ('20000000-0000-0000-0000-000000000008',
     uid_student_b, 'found', 'open', 'accessories',
     'Brown leather bifold wallet',
     'Brown leather bifold wallet. Contains several bank cards and a student railcard but no cash. Handed in to the Library desk.',
     loc_drop_library, current_date),

    ('20000000-0000-0000-0000-000000000009',
     uid_student_a, 'lost', 'open', 'books_stationery',
     'Organic Chemistry textbook (Clayden, 2nd ed)',
     'Clayden Organic Chemistry 2nd edition paperback. Name "Alice N" written on the first page; lots of yellow highlighter throughout chapters 1–5.',
     loc_science_block, current_date - 5),

    ('20000000-0000-0000-0000-000000000010',
     uid_student_c, 'found', 'open', 'accessories',
     'Compact automatic umbrella — dark green',
     'Dark green compact umbrella with a wooden-effect handle. Found in the student cafeteria near the salad bar.',
     loc_cafeteria, current_date - 2),

    ('20000000-0000-0000-0000-000000000011',
     uid_student_b, 'lost', 'open', 'accessories',
     'Prescription glasses — thin gold wire frame',
     'Thin gold wire-frame prescription glasses, -3.5 in both lenses. Stored in a hard burgundy case when not in use. Last seen in the student union lounge.',
     loc_student_union, current_date - 1),

    ('20000000-0000-0000-0000-000000000012',
     uid_student_a, 'found', 'open', 'electronics',
     'USB-C laptop charger — 65W white brick',
     '65W USB-C white charging brick with a 1.5m cable. No identifying marks. Found in parking lot near bay W22.',
     loc_parking_lot, current_date - 3),

    ('20000000-0000-0000-0000-000000000013',
     uid_student_c, 'found', 'resolved', 'keys',
     'Yale door key on university lanyard',
     'Single Yale key on a university-branded lanyard. Owner verified via admin office records.',
     loc_admin_office, current_date - 10),

    ('20000000-0000-0000-0000-000000000014',
     uid_student_b, 'lost', 'open', 'food_drink',
     'Blue Sistema lunch box with strap',
     'Blue rectangular Sistema lunch box with a grey strap. Has a doodle of a sun on the lid in black marker. Last seen in the library.',
     loc_library, current_date - 1),

    ('20000000-0000-0000-0000-000000000015',
     uid_student_a, 'found', 'open', 'id_documents',
     'International passport — found near security gate',
     'A passport was found near the main gate. Due to sensitivity, details are withheld. Please visit the Security Desk with proof of identity to collect.',
     loc_drop_security, current_date)

  on conflict (id) do nothing;

end $$;

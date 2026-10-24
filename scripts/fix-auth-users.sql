-- Fix seed users so GoTrue's Auth Admin API can load them.
-- Sets raw_app_meta_data (required for email provider recognition),
-- re-hashes the password via pgcrypto, and ensures email is confirmed.
UPDATE auth.users
SET
  raw_app_meta_data  = '{"provider":"email","providers":["email"]}'::jsonb,
  encrypted_password = crypt('TestPassword123!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at         = now()
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004'
);

-- Verify
SELECT id, email, raw_app_meta_data, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
ORDER BY email;

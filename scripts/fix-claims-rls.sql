-- Fix the claims UPDATE RLS policy to allow claimants to withdraw their own
-- pending claims. The original policy was missing a WITH CHECK clause, which
-- caused the update to fail when the new row's status became 'withdrawn'.

DROP POLICY IF EXISTS "claims: claimant withdraws own pending claim, admins update any" ON public.claims;

CREATE POLICY "claims: claimant withdraws own pending claim, admins update any"
  ON public.claims FOR UPDATE
  TO authenticated
  USING (
    (claimant_id = auth.uid() AND status = 'pending')
    OR public.is_admin()
  )
  WITH CHECK (
    -- Non-admin claimant: new row must have status = 'withdrawn'
    (claimant_id = auth.uid() AND status = 'withdrawn' AND NOT public.is_admin())
    OR public.is_admin()
  );

-- Verify policy exists
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'claims' AND policyname LIKE '%withdraw%';

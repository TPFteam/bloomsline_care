-- ─────────────────────────────────────────────────────────────────────
-- Allow practitioners to insert their own bookings unconditionally.
--
-- Background:
--   The 20251228 migration tightened the public-booking INSERT policy
--   to require booking_settings.booking_page_enabled = true. That's
--   correct for the public booking page, but it also blocks practitioners
--   from creating bookings *for themselves* from the in-app schedule
--   modal when their public page is disabled — manifesting as:
--     "new row violates row-level security policy for table 'bookings'"
--
--   This adds a parallel INSERT policy scoped to the practitioner's
--   own rows. RLS evaluates multiple INSERT policies as OR, so the
--   public-page policy is left untouched for patient bookings.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Practitioners can create own bookings" ON bookings;

CREATE POLICY "Practitioners can create own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = practitioner_id);

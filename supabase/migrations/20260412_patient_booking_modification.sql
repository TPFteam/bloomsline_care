-- Allow patients to cancel/reschedule their own bookings
-- Practitioner controls: enable/disable + minimum notice hours

ALTER TABLE booking_settings
  ADD COLUMN IF NOT EXISTS allow_patient_reschedule BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_patient_cancel BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS modification_notice_hours INTEGER DEFAULT 48;

-- Add rescheduled_from to bookings to link rescheduled bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES bookings(id),
  ADD COLUMN IF NOT EXISTS rescheduled_by TEXT CHECK (rescheduled_by IN ('member', 'practitioner'));

-- Allow members to update their own bookings (cancel/reschedule)
-- Only if the booking belongs to them (matched by member_id)
CREATE POLICY "Members can cancel own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- Allow members to read booking_settings for their practitioner (to check modification rules)
CREATE POLICY "Members can read practitioner booking settings"
  ON booking_settings
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT practitioner_id FROM members WHERE user_id = auth.uid()
    )
  );

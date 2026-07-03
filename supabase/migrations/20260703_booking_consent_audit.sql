-- Booking consent audit trail. `consent_accepted_at` already exists (platform
-- data/teleconsultation consent). Add the practitioner-policies acceptance time
-- and a frozen snapshot of the exact terms the patient saw + accepted, so the
-- record is reproducible (who accepted what, and when).

alter table bookings
  add column if not exists policies_accepted_at timestamptz,
  add column if not exists consent_snapshot jsonb;

comment on column bookings.consent_snapshot is 'Frozen record of the consent shown at booking time: ticked boxes, timestamps, locale, and the exact policy/consent text presented.';

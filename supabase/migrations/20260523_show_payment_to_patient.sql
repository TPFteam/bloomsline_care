-- Per-practitioner toggle for whether the patient sees the payment
-- status (Paid / Unpaid) on their mobile app session cards.
--
-- Default false — opt-in. Practitioners who want their patient to
-- see the billing status flip it on in /bookings settings. Avoids
-- exposing payment context by default to patients who may not
-- expect it.

alter table public.booking_settings
  add column if not exists show_payment_to_patient boolean not null default false;

comment on column public.booking_settings.show_payment_to_patient is
  'When true, the mobile app shows the Paid / Unpaid badge on session cards. Defaults false; practitioner opts in from /bookings settings.';

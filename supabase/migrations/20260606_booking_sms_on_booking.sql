-- Add the per-practitioner SMS toggle for booking notifications.
-- When true, the client is texted on booking confirm / reschedule / cancel
-- (only if a usable mobile number is on file). Gated on this toggle only.

alter table public.booking_settings
  add column if not exists sms_on_booking boolean not null default false;

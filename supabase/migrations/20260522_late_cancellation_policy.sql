-- Late-cancellation policy.
--
-- When a patient cancels their appointment within N hours of the
-- session start, the booking is flagged as a late cancellation and
-- payment_status defaults to 'unpaid' so the practitioner sees it's
-- still owed. The practitioner can still override the payment status
-- manually if they want to waive the fee.
--
-- late_cancellation_hours = 0 means "no policy" — patient cancellations
-- behave as today (no warning, no auto-unpaid).

alter table public.booking_settings
  add column if not exists late_cancellation_hours integer not null default 0;

-- Sanity bound: 0 (off) up to a week. Reject anything outside.
alter table public.booking_settings
  drop constraint if exists booking_settings_late_cancellation_hours_chk;
alter table public.booking_settings
  add constraint booking_settings_late_cancellation_hours_chk
  check (late_cancellation_hours >= 0 and late_cancellation_hours <= 168);

comment on column public.booking_settings.late_cancellation_hours is
  'Threshold (in hours before session start) below which a patient cancellation is treated as a late cancel: the booking row gets late_cancellation = true and payment_status = unpaid. 0 disables the policy.';

-- Per-booking flag — set when a patient cancels inside the practitioner's
-- late-cancellation window. The bookings list / Sessions tab read this to
-- show a "Late cancel" badge alongside the cancellation status.
alter table public.bookings
  add column if not exists late_cancellation boolean not null default false;

comment on column public.bookings.late_cancellation is
  'True if the patient cancelled within the practitioner''s late_cancellation_hours window. Used to flag the row for billing follow-up.';

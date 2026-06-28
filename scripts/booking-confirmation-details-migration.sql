-- Booking confirmation details: per-practitioner consent / payment / cancellation
-- text + a payment link, shown on the confirmation screen and inside the Google
-- Calendar event description (so they ride the Google invite email).
-- Run once in the Supabase SQL editor. Safe to re-run.

alter table public.booking_settings
  add column if not exists booking_confirmation_enabled boolean not null default false,
  add column if not exists consent_text       text,
  add column if not exists payment_text        text,
  add column if not exists payment_url         text,
  add column if not exists cancellation_text   text,
  add column if not exists practice_text       text,
  add column if not exists practice_url        text;

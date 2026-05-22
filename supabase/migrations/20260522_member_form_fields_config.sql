-- Configurable "Add a new person" form per practitioner.
--
-- Each practitioner can choose which optional fields show up in the
-- Add-member popup and whether they're required. Configuration lives
-- inside the popup itself (gear icon) — see /app/members/page.tsx and
-- /app/dashboard/page.tsx.
--
-- Stored as JSONB keyed by field name → 'optional' | 'required'. A
-- missing key (or 'hidden') means the field isn't shown. Empty object
-- {} is the default (only the hard-coded name/email/phone show).
--
-- Supported keys (the only ones the UI reads):
--   date_of_birth, referral_source, gender, address,
--   emergency_contact, background_notes

alter table public.booking_settings
  add column if not exists member_form_fields jsonb not null default '{}'::jsonb;

comment on column public.booking_settings.member_form_fields is
  'Practitioner-configurable optional fields for the Add-member popup. Keys: date_of_birth | referral_source | gender | address | emergency_contact | background_notes. Values: ''optional'' | ''required''. Missing key = hidden.';

-- ─── Member columns the form may write to ───────────────────────────
-- Everything except gender already has a home:
--   date_of_birth        — existing column
--   referral_source/name/email — existing columns (read by FilesTab
--                          Referred by card)
--   emergency_contact    — existing JSONB
--   background_notes     — maps to existing internal_notes column
--   address              — written to existing additional_contacts
--                          JSONB array (the FilesTab "Additional
--                          contacts" section already renders these)
-- Only gender needs a new column.

alter table public.members
  add column if not exists gender text;

comment on column public.members.gender is
  'Self-reported gender. Free text so practitioners can use whatever vocabulary fits their patient population.';

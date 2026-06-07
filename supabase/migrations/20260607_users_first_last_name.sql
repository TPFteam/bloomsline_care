-- Patient-chosen name on the user account.
--
-- A patient (user_type = 'member') can be added by a practitioner with a
-- partial/placeholder name (e.g. "John D."). That practitioner label lives on
-- `members.first_name/last_name` and is what the PRACTITIONER app shows.
--
-- These columns hold the patient's OWN name, set by them in the mobile app
-- (onboarding prompt + settings). The MEMBER (mobile) app shows these; the
-- practitioner app keeps showing the `members` name. Nullable — until the
-- patient sets their name, the mobile app falls back to the practitioner's
-- `members` name. `full_name` (used for practitioners) is left untouched.

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text;

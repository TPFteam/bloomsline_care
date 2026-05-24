-- Per-practitioner toggle for the 24h Google Calendar email reminder.
--
-- Why: when we insert a booking event into the practitioner's Google
-- Calendar we attach { method: 'email', minutes: 1440 } so they get a
-- 24h-before nudge in their inbox. That reminder fires from Google's
-- side, independent of Bloomsline's own notification system, so
-- "turning off Bloomsline notifications" had no effect on it. This
-- flag lets each practitioner opt out of the Google-side email
-- reminder while keeping the in-app popup (popup stays unconditional).
--
-- Defaults to true so existing practitioners see no behavioral change.

alter table booking_settings
  add column if not exists calendar_email_reminder_enabled boolean not null default true;

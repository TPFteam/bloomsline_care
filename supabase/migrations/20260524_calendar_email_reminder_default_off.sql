-- Follow-up to 20260524_calendar_email_reminder_toggle.sql.
--
-- Practitioner feedback after launch: the 24h Google Calendar email
-- reminder is noisy. Flip the column default so new practitioners get
-- the polite default (no email reminder), and one-shot OFF the
-- existing practitioners who already complained.

alter table booking_settings
  alter column calendar_email_reminder_enabled set default false;

update booking_settings
set calendar_email_reminder_enabled = false
where user_id in (
  select id from users
  where lower(email) in (
    'drmouniasami@gmail.com',
    'contact@alisee-eggermont-psy.fr',
    'psy.scgr@gmail.com',
    'contactcabinetkevinrecorbet@gmail.com'
  )
);

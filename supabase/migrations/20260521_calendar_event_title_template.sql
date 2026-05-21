-- Per-practitioner customizable Google Calendar event title.
-- When null, falls back to the default
-- "Rendez-vous {practitioner} <> {client}" / "Appointment ..."

alter table public.booking_settings
  add column if not exists calendar_event_title_template text;

comment on column public.booking_settings.calendar_event_title_template is
  'Optional template for Google Calendar event titles. Supports placeholders: {practitioner}, {client}, {session_type}. Empty/null = use default "Rendez-vous {practitioner} <> {client}".';

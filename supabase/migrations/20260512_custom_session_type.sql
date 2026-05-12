-- ─────────────────────────────────────────────────────────────────────
-- sessions.custom_session_type
--
-- Practitioners can define arbitrary session types in booking_settings
-- (e.g. "Bilan", "Therapy review"). Those custom names don't fit the
-- fixed session_type enum, so the type collapses to 'other' on the
-- sessions row and the UI shows "Other" — losing the name the
-- practitioner picked.
--
-- This column preserves the human-readable name alongside the enum so
-- the UI can render it back exactly as configured.
-- ─────────────────────────────────────────────────────────────────────

alter table public.sessions
  add column if not exists custom_session_type text;

-- Per-patient custom session price.
-- Null = use default rates (session-type pricing in booking_settings).
-- Set = override applied to all new sessions/bookings for this member.
-- Past sessions retain whatever price was captured at create time.

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS session_price NUMERIC;

COMMENT ON COLUMN public.members.session_price IS
  'Optional flat session price for this patient. Overrides session-type rate at booking/session creation. Null = fall back to defaults.';

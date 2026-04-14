-- Store session format on bookings so we know if it's video or in-person
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS session_format TEXT DEFAULT 'virtual'
  CHECK (session_format IN ('in_person', 'virtual', 'video', 'telehealth'));

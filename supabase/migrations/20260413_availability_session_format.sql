-- Add session format to availability schedules
-- Practitioners can configure each time block as in-person, video, or both

ALTER TABLE availability_schedules
  ADD COLUMN IF NOT EXISTS session_format TEXT DEFAULT 'both'
  CHECK (session_format IN ('in_person', 'video', 'both'));

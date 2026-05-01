-- Add meet_link column to store Google Meet URL from calendar event
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meet_link TEXT;

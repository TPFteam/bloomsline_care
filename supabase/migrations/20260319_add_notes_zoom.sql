-- Add notes_zoom preference (percentage: 90, 100, 110, 120, 130)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS notes_zoom INTEGER DEFAULT 100;

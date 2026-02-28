-- Add optional tag column to milestone_comments for categorizing comments
ALTER TABLE milestone_comments ADD COLUMN IF NOT EXISTS tag TEXT;

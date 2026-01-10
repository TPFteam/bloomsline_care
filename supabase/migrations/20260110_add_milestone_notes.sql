-- Add notes column to milestones table for journey card comments
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN milestones.notes IS 'Optional notes/comments for the journey milestone';

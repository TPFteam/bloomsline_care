-- Add shared_with_member column to milestones table
-- This allows practitioners to choose which goals to share with their members

ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS shared_with_member BOOLEAN DEFAULT false;

-- Add index for efficient querying of shared milestones
CREATE INDEX IF NOT EXISTS milestones_shared_idx ON public.milestones(shared_with_member) WHERE shared_with_member = true;

-- Comment
COMMENT ON COLUMN public.milestones.shared_with_member IS 'Whether this milestone/goal is visible to the member in their portal';

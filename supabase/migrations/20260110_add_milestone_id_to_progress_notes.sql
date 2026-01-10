-- Add milestone_id to progress_notes for bi-directional linking
ALTER TABLE public.progress_notes
ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS progress_notes_milestone_id_idx ON public.progress_notes(milestone_id);

-- Update note_type CHECK constraint to new clinical categories
-- Old types: general, assessment, treatment_plan, milestone, concern, observation
-- New types: general, symptome, recurrence, hypothese, transfert, contre_transfert, ajustement_envisage, milestone

-- Drop the old CHECK constraint
ALTER TABLE public.progress_notes DROP CONSTRAINT IF EXISTS progress_notes_note_type_check;

-- Migrate existing data to new types
UPDATE public.progress_notes SET note_type = 'general' WHERE note_type IN ('assessment', 'treatment_plan', 'concern', 'observation');

-- Add new CHECK constraint
ALTER TABLE public.progress_notes ADD CONSTRAINT progress_notes_note_type_check
  CHECK (note_type IN ('general', 'symptome', 'recurrence', 'hypothese', 'transfert', 'contre_transfert', 'ajustement_envisage', 'milestone'));

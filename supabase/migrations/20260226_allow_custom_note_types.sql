-- Allow custom note types by removing the CHECK constraint
-- Default types (general, symptome, recurrence, hypothese, transfert, contre_transfert, ajustement_envisage, milestone)
-- are still shown in the UI but practitioners can now create their own.

ALTER TABLE public.progress_notes DROP CONSTRAINT IF EXISTS progress_notes_note_type_check;

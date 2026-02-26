-- Allow custom note types by removing the CHECK constraint
-- Default types (general, symptome, recurrence, hypothese, transfert, contre_transfert, ajustement_envisage, milestone)
-- are still shown in the UI but practitioners can now create their own.

ALTER TABLE public.progress_notes DROP CONSTRAINT IF EXISTS progress_notes_note_type_check;

-- Store custom note types per practitioner
CREATE TABLE IF NOT EXISTS public.custom_note_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (practitioner_id, type_name)
);

-- RLS
ALTER TABLE public.custom_note_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage their own custom note types"
  ON public.custom_note_types FOR ALL
  USING (auth.uid() = practitioner_id)
  WITH CHECK (auth.uid() = practitioner_id);

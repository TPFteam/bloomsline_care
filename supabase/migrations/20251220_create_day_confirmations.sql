-- ============================================
-- DAY CONFIRMATIONS TABLE (Track daily check-ins)
-- ============================================
CREATE TYPE day_feeling AS ENUM ('great', 'good', 'okay', 'tired', 'rough');

CREATE TABLE IF NOT EXISTS public.day_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Date and feeling
  confirmation_date DATE NOT NULL,
  feeling day_feeling NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One confirmation per member per day
  UNIQUE(member_id, confirmation_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS day_confirmations_member_id_idx ON public.day_confirmations(member_id);
CREATE INDEX IF NOT EXISTS day_confirmations_date_idx ON public.day_confirmations(confirmation_date);
CREATE INDEX IF NOT EXISTS day_confirmations_member_date_idx ON public.day_confirmations(member_id, confirmation_date);

-- Enable RLS
ALTER TABLE public.day_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own confirmations
CREATE POLICY "Members can view own day confirmations"
  ON public.day_confirmations FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own day confirmations"
  ON public.day_confirmations FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own day confirmations"
  ON public.day_confirmations FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_day_confirmations_updated_at
  BEFORE UPDATE ON public.day_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE public.day_confirmations IS 'Daily check-in confirmations with mood/feeling tracking';

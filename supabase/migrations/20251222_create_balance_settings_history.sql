-- ============================================
-- BALANCE SETTINGS HISTORY TABLE (Track configuration changes over time)
-- ============================================
-- This table logs when target hours are changed so we can compare
-- past day performance against the targets that were active on that day

CREATE TABLE IF NOT EXISTS public.balance_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Target Hours (stored in minutes for precision)
  sleep_target INTEGER NOT NULL DEFAULT 480, -- 8 hours
  work_target INTEGER NOT NULL DEFAULT 480,  -- 8 hours
  life_target INTEGER NOT NULL DEFAULT 480,  -- 8 hours

  -- The date from which these settings became effective
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS balance_settings_history_member_id_idx
  ON public.balance_settings_history(member_id);
CREATE INDEX IF NOT EXISTS balance_settings_history_effective_from_idx
  ON public.balance_settings_history(effective_from);
CREATE INDEX IF NOT EXISTS balance_settings_history_member_date_idx
  ON public.balance_settings_history(member_id, effective_from DESC);

-- Enable RLS
ALTER TABLE public.balance_settings_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can view and insert their own settings history
CREATE POLICY "Members can view own balance settings history"
  ON public.balance_settings_history FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own balance settings history"
  ON public.balance_settings_history FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- No update or delete policies - history should be immutable

-- ============================================
-- COMMENT
-- ============================================
COMMENT ON TABLE public.balance_settings_history IS 'Tracks historical changes to balance target settings for accurate past day comparisons';

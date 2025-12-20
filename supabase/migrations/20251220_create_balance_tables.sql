-- ============================================
-- BALANCE SETTINGS TABLE (Target hours per member)
-- ============================================
CREATE TABLE IF NOT EXISTS public.balance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Target Hours (stored in minutes for precision)
  sleep_target INTEGER NOT NULL DEFAULT 480, -- 8 hours
  work_target INTEGER NOT NULL DEFAULT 480,  -- 8 hours
  life_target INTEGER NOT NULL DEFAULT 480,  -- 8 hours

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One settings record per member
  UNIQUE(member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS balance_settings_member_id_idx ON public.balance_settings(member_id);

-- Enable RLS
ALTER TABLE public.balance_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own balance settings
CREATE POLICY "Members can view own balance settings"
  ON public.balance_settings FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own balance settings"
  ON public.balance_settings FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own balance settings"
  ON public.balance_settings FOR UPDATE
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

-- ============================================
-- SOMEDAY ITEMS TABLE (Future tasks/goals)
-- ============================================
CREATE TYPE balance_category AS ENUM ('sleep', 'work', 'life');

CREATE TABLE IF NOT EXISTS public.someday_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Item Details
  name TEXT NOT NULL,
  description TEXT,
  category balance_category NOT NULL DEFAULT 'life',

  -- Planning
  planned_date DATE,
  estimated_minutes INTEGER DEFAULT 60, -- Default 1 hour

  -- Status
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Order
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS someday_items_member_id_idx ON public.someday_items(member_id);
CREATE INDEX IF NOT EXISTS someday_items_category_idx ON public.someday_items(category);
CREATE INDEX IF NOT EXISTS someday_items_completed_idx ON public.someday_items(completed);

-- Enable RLS
ALTER TABLE public.someday_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own someday items
CREATE POLICY "Members can view own someday items"
  ON public.someday_items FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own someday items"
  ON public.someday_items FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own someday items"
  ON public.someday_items FOR UPDATE
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

CREATE POLICY "Members can delete own someday items"
  ON public.someday_items FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- DAILY TIME ENTRIES TABLE (Track actual time spent)
-- ============================================
CREATE TABLE IF NOT EXISTS public.balance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Entry Details
  category balance_category NOT NULL,
  activity_name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,

  -- Date tracking
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS balance_entries_member_id_idx ON public.balance_entries(member_id);
CREATE INDEX IF NOT EXISTS balance_entries_category_idx ON public.balance_entries(category);
CREATE INDEX IF NOT EXISTS balance_entries_date_idx ON public.balance_entries(entry_date);
CREATE INDEX IF NOT EXISTS balance_entries_member_date_idx ON public.balance_entries(member_id, entry_date);

-- Enable RLS
ALTER TABLE public.balance_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own entries
CREATE POLICY "Members can view own balance entries"
  ON public.balance_entries FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own balance entries"
  ON public.balance_entries FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own balance entries"
  ON public.balance_entries FOR UPDATE
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

CREATE POLICY "Members can delete own balance entries"
  ON public.balance_entries FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_balance_settings_updated_at
  BEFORE UPDATE ON public.balance_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_someday_items_updated_at
  BEFORE UPDATE ON public.someday_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_entries_updated_at
  BEFORE UPDATE ON public.balance_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.balance_settings IS 'Target hours for sleep/work/life balance per member';
COMMENT ON TABLE public.someday_items IS 'Future tasks and goals organized by life category';
COMMENT ON TABLE public.balance_entries IS 'Daily time tracking entries for balance categories';

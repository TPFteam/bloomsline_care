-- Bloom User Insights Table
-- Stores detected patterns and long-term insights about user behavior

CREATE TABLE IF NOT EXISTS bloom_user_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Insight categorization
  insight_type TEXT NOT NULL, -- 'sleep_pattern', 'mood_correlation', 'ritual_impact', 'work_pattern', 'weekly_cycle'
  insight_key TEXT NOT NULL,  -- Unique key like 'weekend_sleep_better', 'exercise_improves_mood'

  -- The insight itself
  insight_text TEXT NOT NULL, -- Human-readable: "You sleep 1.5 hours more on weekends"
  insight_text_fr TEXT,       -- French version

  -- Metadata
  confidence FLOAT DEFAULT 0.5, -- 0-1, how confident we are in this pattern
  data_points INTEGER DEFAULT 0, -- How many data points support this

  -- Validity
  first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE, -- NULL = always valid, or expiry date

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_dismissed BOOLEAN DEFAULT false, -- User can dismiss insights they don't want

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique insights per user
  UNIQUE(user_id, insight_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bloom_insights_user_active
ON bloom_user_insights(user_id, is_active)
WHERE is_active = true AND is_dismissed = false;

-- RLS Policies
ALTER TABLE bloom_user_insights ENABLE ROW LEVEL SECURITY;

-- Users can read their own insights
CREATE POLICY "Users can read own insights" ON bloom_user_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (patterns detected server-side)
CREATE POLICY "Service role can manage insights" ON bloom_user_insights
  FOR ALL USING (auth.role() = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_bloom_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bloom_insights_updated_at
  BEFORE UPDATE ON bloom_user_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_bloom_insights_updated_at();

-- Comments
COMMENT ON TABLE bloom_user_insights IS 'Stores detected patterns and long-term insights about user behavior for Bloom AI';
COMMENT ON COLUMN bloom_user_insights.insight_type IS 'Category: sleep_pattern, mood_correlation, ritual_impact, work_pattern, weekly_cycle';
COMMENT ON COLUMN bloom_user_insights.confidence IS 'Confidence score 0-1 based on data consistency';

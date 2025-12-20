-- ============================================
-- Bloom AI Companion - Database Schema
-- ============================================

-- ============================================
-- 1. Bloom Conversations Table
-- ============================================
CREATE TABLE IF NOT EXISTS bloom_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Conversation metadata
    title TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),

    -- Context tracking
    mood_context TEXT[] DEFAULT '{}',
    moments_referenced UUID[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Bloom Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS bloom_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES bloom_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,

    -- Voice metadata
    is_voice_message BOOLEAN DEFAULT false,
    audio_url TEXT,
    audio_duration_seconds INTEGER,

    -- API metadata
    tokens_used INTEGER,
    model_version TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Bloom Daily Prompts Table
-- ============================================
CREATE TABLE IF NOT EXISTS bloom_daily_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Prompt content
    prompt_text TEXT NOT NULL,
    prompt_text_fr TEXT NOT NULL,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN (
        'reflection', 'gratitude', 'mood_check', 'activity', 'affirmation'
    )),

    -- Status
    shown_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    response_moment_id UUID REFERENCES moments(id) ON DELETE SET NULL,

    -- Scheduling
    scheduled_for DATE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Bloom Insights Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS bloom_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Insight content
    insight_type TEXT NOT NULL CHECK (insight_type IN (
        'mood_pattern', 'weekly_summary', 'streak', 'growth', 'recommendation'
    )),
    insight_data JSONB NOT NULL DEFAULT '{}',
    insight_text TEXT,
    insight_text_fr TEXT,

    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE,

    -- Status
    is_dismissed BOOLEAN DEFAULT false,
    shown_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Bloom User Settings
-- ============================================
CREATE TABLE IF NOT EXISTS bloom_user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Preferences
    voice_enabled BOOLEAN DEFAULT true,
    daily_prompts_enabled BOOLEAN DEFAULT true,
    preferred_prompt_time TIME DEFAULT '09:00:00',

    -- Personality
    bloom_personality TEXT DEFAULT 'gentle' CHECK (bloom_personality IN (
        'gentle', 'encouraging', 'playful', 'wise'
    )),

    -- Onboarding
    has_met_bloom BOOLEAN DEFAULT false,
    onboarding_completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bloom_conversations_user ON bloom_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_bloom_conversations_active ON bloom_conversations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bloom_messages_conversation ON bloom_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_bloom_messages_user ON bloom_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_bloom_daily_prompts_user_date ON bloom_daily_prompts(user_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_bloom_insights_user ON bloom_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_bloom_insights_type ON bloom_insights(user_id, insight_type);

-- ============================================
-- Updated At Triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_bloom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bloom_conversations_updated_at ON bloom_conversations;
CREATE TRIGGER trigger_bloom_conversations_updated_at
    BEFORE UPDATE ON bloom_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_bloom_updated_at();

DROP TRIGGER IF EXISTS trigger_bloom_user_settings_updated_at ON bloom_user_settings;
CREATE TRIGGER trigger_bloom_user_settings_updated_at
    BEFORE UPDATE ON bloom_user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_bloom_updated_at();

-- ============================================
-- Row Level Security Policies
-- ============================================
ALTER TABLE bloom_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloom_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloom_daily_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloom_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloom_user_settings ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view own conversations"
    ON bloom_conversations FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
    ON bloom_conversations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
    ON bloom_conversations FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
    ON bloom_conversations FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view own messages"
    ON bloom_messages FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
    ON bloom_messages FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Daily prompts policies
CREATE POLICY "Users can view own prompts"
    ON bloom_daily_prompts FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own prompts"
    ON bloom_daily_prompts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own prompts"
    ON bloom_daily_prompts FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Insights policies
CREATE POLICY "Users can view own insights"
    ON bloom_insights FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own insights"
    ON bloom_insights FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own insights"
    ON bloom_insights FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- User settings policies
CREATE POLICY "Users can view own settings"
    ON bloom_user_settings FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
    ON bloom_user_settings FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
    ON bloom_user_settings FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

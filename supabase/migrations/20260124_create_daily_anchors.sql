-- Daily Anchors tables for habit tracking
-- Anchors are habits users want to track (grow = cultivate, letgo = reduce)

-- User's anchors (habits they want to track)
CREATE TABLE IF NOT EXISTS member_anchors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    icon TEXT NOT NULL,
    label_en TEXT NOT NULL,
    label_fr TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('grow', 'letgo')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anchor logs (each tap/log of an anchor)
CREATE TABLE IF NOT EXISTS anchor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    anchor_id UUID NOT NULL REFERENCES member_anchors(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    log_date DATE DEFAULT CURRENT_DATE,
    notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_anchors_member ON member_anchors(member_id);
CREATE INDEX IF NOT EXISTS idx_member_anchors_type ON member_anchors(member_id, type);
CREATE INDEX IF NOT EXISTS idx_anchor_logs_member ON anchor_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_anchor_logs_anchor ON anchor_logs(anchor_id);
CREATE INDEX IF NOT EXISTS idx_anchor_logs_date ON anchor_logs(member_id, log_date);

-- Updated at trigger for member_anchors
CREATE OR REPLACE FUNCTION update_member_anchors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_member_anchors_updated_at ON member_anchors;
CREATE TRIGGER trigger_member_anchors_updated_at
    BEFORE UPDATE ON member_anchors
    FOR EACH ROW
    EXECUTE FUNCTION update_member_anchors_updated_at();

-- RLS Policies
ALTER TABLE member_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_logs ENABLE ROW LEVEL SECURITY;

-- Members can view their own anchors
CREATE POLICY "Members can view own anchors"
    ON member_anchors FOR SELECT
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can insert their own anchors
CREATE POLICY "Members can insert own anchors"
    ON member_anchors FOR INSERT
    TO authenticated
    WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can update their own anchors
CREATE POLICY "Members can update own anchors"
    ON member_anchors FOR UPDATE
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can delete their own anchors
CREATE POLICY "Members can delete own anchors"
    ON member_anchors FOR DELETE
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can view their own anchor logs
CREATE POLICY "Members can view own anchor logs"
    ON anchor_logs FOR SELECT
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can insert their own anchor logs
CREATE POLICY "Members can insert own anchor logs"
    ON anchor_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can delete their own anchor logs
CREATE POLICY "Members can delete own anchor logs"
    ON anchor_logs FOR DELETE
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

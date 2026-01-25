-- Anchor Activity Logs - Track lifecycle events (added, removed, reactivated)
-- This tracks WHEN anchors were added to grow/letgo and when they were removed

CREATE TABLE IF NOT EXISTS anchor_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    anchor_id UUID NOT NULL REFERENCES member_anchors(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'reactivated')),
    anchor_type TEXT NOT NULL CHECK (anchor_type IN ('grow', 'letgo')),
    anchor_icon TEXT NOT NULL,
    anchor_label_en TEXT NOT NULL,
    anchor_label_fr TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_anchor_activity_member ON anchor_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_anchor_activity_anchor ON anchor_activity_logs(anchor_id);
CREATE INDEX IF NOT EXISTS idx_anchor_activity_date ON anchor_activity_logs(member_id, created_at);
CREATE INDEX IF NOT EXISTS idx_anchor_activity_action ON anchor_activity_logs(member_id, action);

-- RLS Policies
ALTER TABLE anchor_activity_logs ENABLE ROW LEVEL SECURITY;

-- Members can view their own activity logs
CREATE POLICY "Members can view own anchor activity logs"
    ON anchor_activity_logs FOR SELECT
    TO authenticated
    USING (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

-- Members can insert their own activity logs
CREATE POLICY "Members can insert own anchor activity logs"
    ON anchor_activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        member_id IN (
            SELECT id FROM members WHERE user_id = auth.uid()
        )
    );

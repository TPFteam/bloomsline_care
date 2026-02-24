-- Milestone status history: tracks every status transition for the goal timeline
CREATE TABLE IF NOT EXISTS milestone_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  old_status TEXT,  -- null for initial creation
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON milestone_status_history(milestone_id, changed_at);

-- RLS: practitioners can read/insert history for their milestones
ALTER TABLE milestone_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can manage milestone history"
  ON milestone_status_history FOR ALL
  USING (milestone_id IN (SELECT id FROM milestones WHERE practitioner_id = auth.uid()));

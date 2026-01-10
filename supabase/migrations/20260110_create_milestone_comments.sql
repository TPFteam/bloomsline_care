-- Create milestone_comments table for multiple comments per journey
CREATE TABLE IF NOT EXISTS milestone_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_milestone_comments_milestone_id ON milestone_comments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_comments_practitioner_id ON milestone_comments(practitioner_id);

-- Enable RLS
ALTER TABLE milestone_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for practitioners
CREATE POLICY "Practitioners can view their own milestone comments"
  ON milestone_comments FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can insert their own milestone comments"
  ON milestone_comments FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update their own milestone comments"
  ON milestone_comments FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete their own milestone comments"
  ON milestone_comments FOR DELETE
  USING (auth.uid() = practitioner_id);

-- Create member_groups table
-- Groups allow practitioners to organize their members for bulk resource sharing

CREATE TABLE IF NOT EXISTS member_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Group info
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_group_name_per_practitioner UNIQUE (practitioner_id, name)
);

-- Create junction table for group-member relationships
CREATE TABLE IF NOT EXISTS member_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Metadata
  added_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints - a member can only be in a group once
  CONSTRAINT unique_member_per_group UNIQUE (group_id, member_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_member_groups_practitioner ON member_groups(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_member_group_members_group ON member_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_member_group_members_member ON member_group_members(member_id);

-- Enable RLS
ALTER TABLE member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for member_groups

CREATE POLICY "Users can view own groups"
  ON member_groups
  FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Users can create own groups"
  ON member_groups
  FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Users can update own groups"
  ON member_groups
  FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Users can delete own groups"
  ON member_groups
  FOR DELETE
  USING (auth.uid() = practitioner_id);

-- RLS Policies for member_group_members

CREATE POLICY "Users can view own group members"
  ON member_group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_groups
      WHERE member_groups.id = member_group_members.group_id
      AND member_groups.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Users can add to own groups"
  ON member_group_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM member_groups
      WHERE member_groups.id = member_group_members.group_id
      AND member_groups.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove from own groups"
  ON member_group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM member_groups
      WHERE member_groups.id = member_group_members.group_id
      AND member_groups.practitioner_id = auth.uid()
    )
  );

-- Create trigger to update updated_at on group changes
CREATE OR REPLACE FUNCTION update_member_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_member_groups_updated_at
  BEFORE UPDATE ON member_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_member_group_updated_at();

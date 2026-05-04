-- Story sharing: patient shares stories with practitioner
CREATE TABLE IF NOT EXISTS story_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  practitioner_id UUID NOT NULL,
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(story_id, practitioner_id)
);

ALTER TABLE story_shares ENABLE ROW LEVEL SECURITY;

-- Members can share their own stories
CREATE POLICY "Members can insert own shares" ON story_shares FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Members and practitioners can view shares they're part of
CREATE POLICY "Can view own shares" ON story_shares FOR SELECT
  USING (practitioner_id = auth.uid() OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

-- Comment thread on shared stories
CREATE TABLE IF NOT EXISTS story_share_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES story_shares(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('practitioner', 'member')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE story_share_comments ENABLE ROW LEVEL SECURITY;

-- Both sides can insert comments on shares they're part of
CREATE POLICY "Can comment on own shares" ON story_share_comments FOR INSERT
  WITH CHECK (share_id IN (SELECT id FROM story_shares WHERE practitioner_id = auth.uid() OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())));

-- Both sides can view comments on shares they're part of
CREATE POLICY "Can view comments on own shares" ON story_share_comments FOR SELECT
  USING (share_id IN (SELECT id FROM story_shares WHERE practitioner_id = auth.uid() OR member_id IN (SELECT id FROM members WHERE user_id = auth.uid())));

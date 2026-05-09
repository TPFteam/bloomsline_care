-- Tighten RLS on story_shares + story_share_comments.
--
-- Background: a user can be both a practitioner (auth.users row) AND a
-- member of a *different* practitioner (members.user_id row). The old
-- INSERT policy on story_shares only verified `member_id IN (member rows
-- where user_id = auth.uid())`. That allowed the user, while signed in
-- as themselves, to insert a row with `practitioner_id = auth.uid()`
-- (their own practitioner identity) and `member_id` pointing at one of
-- their member rows under a *different* practitioner. The SELECT policy
-- (`practitioner_id = auth.uid() OR member_id IN (...)`) would then
-- return that row, surfacing data that should have been scoped to the
-- other practitioner.
--
-- Same shape on story_share_comments — INSERT didn't pin `author_id` to
-- `auth.uid()`, so anyone with access to the share could forge comments
-- attributed to the other party.
--
-- Idempotent: DROP POLICY IF EXISTS before each CREATE.

-- =====================================================
-- story_shares — tighten INSERT
-- =====================================================

DROP POLICY IF EXISTS "Members can insert own shares" ON story_shares;

CREATE POLICY "Members can insert own shares"
  ON story_shares FOR INSERT
  WITH CHECK (
    -- The member row belongs to the authenticated user
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
    -- AND the declared practitioner_id matches that member's actual
    -- practitioner_id. Closes the cross-tenant fabrication vector.
    AND practitioner_id = (
      SELECT practitioner_id FROM members WHERE id = story_shares.member_id
    )
  );

-- =====================================================
-- story_share_comments — tighten INSERT
-- =====================================================

DROP POLICY IF EXISTS "Can comment on own shares" ON story_share_comments;

CREATE POLICY "Can comment on own shares"
  ON story_share_comments FOR INSERT
  WITH CHECK (
    -- The author must be the authenticated user, not whatever the
    -- client claims to be.
    author_id = auth.uid()
    -- And the author_type must match: practitioners use their auth uid
    -- as practitioner_id; members map auth uid → members.user_id.
    AND (
      (author_type = 'practitioner' AND share_id IN (
        SELECT id FROM story_shares WHERE practitioner_id = auth.uid()
      ))
      OR
      (author_type = 'member' AND share_id IN (
        SELECT id FROM story_shares
        WHERE member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
      ))
    )
  );

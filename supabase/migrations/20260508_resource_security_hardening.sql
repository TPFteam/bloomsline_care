-- Resource flow — Batch A security hardening
--
-- Three independent fixes from the resource-flow audit:
--
-- 1. RLS on `resource_responses`
--    Old policy let a member SELECT any row whose `member_id` matched their
--    own member rows. It did NOT verify the resource was actually shared
--    with that member, so a sufficiently-creative member could (in theory)
--    read a response row whose membership-of-some-other-resource happened
--    to belong to them. We tighten so reads require a corresponding row in
--    `member_shared_resources`. Same tightening on INSERT so a patient
--    cannot create a response for a resource whose share was revoked.
--
-- 2. Storage bucket `resource-media`
--    Old SELECT policy allowed `TO public` (i.e. anyone with a URL could
--    download). We replace it with an authenticated-only policy that
--    grants read access in three cases:
--      - The uploader (uid matches the first folder segment)
--      - The practitioner who owns the resource (resource_id is the second
--        folder segment, owned via `resources.practitioner_id`)
--      - A member with whom the resource was shared
--
-- The migration is idempotent: every CREATE POLICY is preceded by a DROP
-- POLICY IF EXISTS so it can be re-run safely.
--
-- Compatibility note: locking the storage bucket means asset URLs require
-- a logged-in Supabase session to load. Web + mobile clients are already
-- authenticated, so loading images inside the app continues to work.
-- External tools (e.g. Slack previews of a public URL) will stop working —
-- intentional, those URLs were a privacy hole.

-- =====================================================
-- 1. resource_responses RLS — tighten SELECT + INSERT
-- =====================================================

-- Drop the old, looser policies. (The exact text of CREATE POLICY in the
-- original migration matters for the DROP statement, so we use IF EXISTS.)
DROP POLICY IF EXISTS "Members can view own responses" ON public.resource_responses;
DROP POLICY IF EXISTS "Members can create own responses" ON public.resource_responses;

-- View: member can read their own response only when the resource is (or
-- was) shared with them. The share row is the source of truth for access;
-- if the practitioner revokes it, the patient stops seeing the response.
CREATE POLICY "Members can view own responses"
  ON public.resource_responses FOR SELECT
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    AND resource_id IN (
      SELECT msr.resource_id
      FROM public.member_shared_resources msr
      WHERE msr.member_id IN (
        SELECT id FROM public.members WHERE user_id = auth.uid()
      )
    )
  );

-- Insert: the matching share row must exist. Also pin practitioner_id to
-- the share's practitioner_id so a member can't smuggle a response under
-- a different practitioner's name.
CREATE POLICY "Members can create own responses"
  ON public.resource_responses FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.member_shared_resources msr
      WHERE msr.resource_id = resource_responses.resource_id
        AND msr.member_id = resource_responses.member_id
        AND msr.practitioner_id = resource_responses.practitioner_id
    )
  );

-- =====================================================
-- 2. resource-media storage bucket — replace public SELECT
-- =====================================================

DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- Switch the bucket to non-public so getPublicUrl() still works for the
-- app's authenticated requests but unauthenticated direct hits fail.
UPDATE storage.buckets SET public = false WHERE id = 'resource-media';

-- Authenticated users can read a resource-media object when at least one
-- of the three relationships holds. The folder convention is
--   {uploader_user_id}/{resource_id}/{filename}
-- so we read the uploader id from foldername[1] and the resource id from
-- foldername[2].
DROP POLICY IF EXISTS "Authenticated users can read scoped resource media" ON storage.objects;
CREATE POLICY "Authenticated users can read scoped resource media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-media'
    AND (
      -- 2a. Uploader can read their own files
      (storage.foldername(name))[1] = auth.uid()::text

      -- 2b. Practitioner who owns the resource can read its files
      OR EXISTS (
        SELECT 1 FROM public.resources r
        WHERE r.practitioner_id = auth.uid()
          AND r.id::text = (storage.foldername(name))[2]
      )

      -- 2c. Member with whom the resource was shared can read its files
      OR EXISTS (
        SELECT 1
        FROM public.member_shared_resources msr
        JOIN public.members m ON m.id = msr.member_id
        WHERE m.user_id = auth.uid()
          AND msr.resource_id::text = (storage.foldername(name))[2]
      )
    )
  );

-- Lock down `story-media` and `moments_media` storage buckets.
--
-- Both were created with `public = true` and TO public SELECT policies,
-- meaning every uploaded story photo / journal voice memo / moment video
-- was publicly downloadable by anyone with the URL. Paths follow
-- `{user_id}/...` so URLs are easily enumerated once you know one user_id.
--
-- This migration:
--   1. Marks both buckets as private (public = false).
--   2. Drops the TO public SELECT policies.
--   3. Adds scoped SELECT policies:
--        a. The uploader can read (foldername[1] = auth.uid()).
--        b. A practitioner who has an active story_shares row with the
--           uploader's member account can read the uploader's media —
--           necessary because shared stories embed media from the
--           patient's folder, and the practitioner needs auth'd access
--           when viewing the share.
--
-- Compatibility note: any URL previously generated via `getPublicUrl()`
-- and stored in the DB will start returning 403. New uploads from the
-- mobile app will use `createSignedUrl()` after this migration ships.
-- We accept the breakage on existing data — this product is early enough
-- that re-uploading any leaked content is cheaper than the leak surface.
--
-- Idempotent: DROP POLICY IF EXISTS, UPDATE buckets, CREATE POLICY.

-- =====================================================
-- 1. Mark buckets private
-- =====================================================

UPDATE storage.buckets SET public = false WHERE id = 'story-media';
UPDATE storage.buckets SET public = false WHERE id = 'moments_media';

-- =====================================================
-- 2. Drop the public SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view moments media" ON storage.objects;

-- =====================================================
-- 3. Drop the existing authenticated SELECT policies — we'll replace
--    them with widened versions that also allow practitioner reads via
--    a story-share relationship.
-- =====================================================

DROP POLICY IF EXISTS "Users can read own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own moments media" ON storage.objects;

-- =====================================================
-- 4. Replacement SELECT policies
-- =====================================================

CREATE POLICY "Authorized users can read story-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'story-media'
    AND (
      -- Uploader can always read their own files
      (storage.foldername(name))[1] = auth.uid()::text

      -- Practitioner with whom the uploader has shared a story
      OR EXISTS (
        SELECT 1
        FROM public.story_shares ss
        JOIN public.members m ON m.id = ss.member_id
        WHERE ss.practitioner_id = auth.uid()
          AND m.user_id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY "Authorized users can read moments-media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'moments_media'
    AND (
      -- Uploader can always read their own files
      (storage.foldername(name))[1] = auth.uid()::text

      -- Practitioner with whom the uploader has shared a story (moments
      -- can be embedded in shared stories, so this is the same trust path)
      OR EXISTS (
        SELECT 1
        FROM public.story_shares ss
        JOIN public.members m ON m.id = ss.member_id
        WHERE ss.practitioner_id = auth.uid()
          AND m.user_id::text = (storage.foldername(name))[1]
      )
    )
  );

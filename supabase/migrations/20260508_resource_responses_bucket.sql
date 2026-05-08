-- Separate `resource-responses` bucket for patient-uploaded answer files.
--
-- Until now, both practitioner-uploaded resource assets (worksheet images,
-- embedded PDFs) AND patient-uploaded response files (audio/video/file
-- response answers) lived in the same `resource-media` bucket. The RLS
-- we wrote for resource-media in 20260508_resource_security_hardening.sql
-- correctly scopes both, but a single shared bucket conflates two very
-- different access patterns and audit trails.
--
-- This migration creates a dedicated `resource-responses` bucket that
-- holds ONLY patient submissions. Folder convention:
--   {member_user_id}/{resource_id}/{timestamp}-{filename}
-- The path lets RLS authorize via foldername[1] (uploader) and
-- foldername[2] (resource id → owner practitioner).
--
-- Existing files in resource-media stay where they are — they're still
-- readable through that bucket's policies. New patient uploads from the
-- mobile app will go to resource-responses.
--
-- Idempotent: ON CONFLICT DO NOTHING on the bucket; DROP POLICY IF EXISTS
-- before each CREATE.

-- =====================================================
-- Bucket
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-responses',
  'resource-responses',
  false,
  104857600,  -- 100 MB — videos can be larger than the 50MB asset cap
  ARRAY[
    -- audio
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
    -- video
    'video/mp4', 'video/webm', 'video/quicktime',
    -- documents (a worksheet may ask the patient to upload a PDF, image, etc.)
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- Policies
-- =====================================================

-- INSERT — patient (or any authenticated user) can write only to their own
-- folder. Folder convention enforced: foldername[1] must equal auth.uid().
DROP POLICY IF EXISTS "Patients can upload responses to their own folder" ON storage.objects;
CREATE POLICY "Patients can upload responses to their own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resource-responses'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE — only the uploader can replace their own files (e.g. re-recording
-- an audio answer before submission).
DROP POLICY IF EXISTS "Patients can update their own response files" ON storage.objects;
CREATE POLICY "Patients can update their own response files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resource-responses'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE — same scope.
DROP POLICY IF EXISTS "Patients can delete their own response files" ON storage.objects;
CREATE POLICY "Patients can delete their own response files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resource-responses'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT — three legitimate readers:
--   1. The uploader (the patient).
--   2. The practitioner who owns the resource that this response belongs to
--      (foldername[2] is the resource id; the resources row carries the
--      practitioner_id).
-- Other patients of the same practitioner do NOT get access.
DROP POLICY IF EXISTS "Authorized users can read response files" ON storage.objects;
CREATE POLICY "Authorized users can read response files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resource-responses'
    AND (
      -- 1. Uploader
      (storage.foldername(name))[1] = auth.uid()::text

      -- 2. Practitioner who owns the resource
      OR EXISTS (
        SELECT 1 FROM public.resources r
        WHERE r.practitioner_id = auth.uid()
          AND r.id::text = (storage.foldername(name))[2]
      )
    )
  );

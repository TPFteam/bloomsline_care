-- ============================================
-- CREATE STORAGE BUCKET FOR RESOURCE MEDIA
-- ============================================

-- Create storage bucket for resource media files (images, videos, attachments)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resource-media', 'resource-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for resource-media bucket

-- Policy: Allow authenticated users to upload their own files
DROP POLICY IF EXISTS "Users can upload resource media" ON storage.objects;
CREATE POLICY "Users can upload resource media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resource-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to read their own files
DROP POLICY IF EXISTS "Users can read own resource media" ON storage.objects;
CREATE POLICY "Users can read own resource media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resource-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own files
DROP POLICY IF EXISTS "Users can update own resource media" ON storage.objects;
CREATE POLICY "Users can update own resource media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resource-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
DROP POLICY IF EXISTS "Users can delete own resource media" ON storage.objects;
CREATE POLICY "Users can delete own resource media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resource-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access (for published public resources in library)
DROP POLICY IF EXISTS "Public can read resource media" ON storage.objects;
CREATE POLICY "Public can read resource media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resource-media');

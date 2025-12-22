-- ============================================
-- Create Reflections Media Storage Bucket
-- ============================================

-- Create the reflections bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'reflections',
    'reflections',
    true,  -- Public bucket for easy access
    52428800,  -- 50MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies for reflections bucket
-- ============================================

-- Policy: Members can upload to their own folder (folder name = member_id)
CREATE POLICY "Members can upload own reflections media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'reflections'
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
);

-- Policy: Members can view their own files
CREATE POLICY "Members can view own reflections media"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'reflections'
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
);

-- Policy: Public can view files (since bucket is public)
CREATE POLICY "Public can view reflections media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reflections');

-- Policy: Members can update their own files
CREATE POLICY "Members can update own reflections media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'reflections'
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
);

-- Policy: Members can delete their own files
CREATE POLICY "Members can delete own reflections media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'reflections'
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id::text = (storage.foldername(name))[1]
        AND m.user_id = auth.uid()
    )
);

-- Policy: Practitioners can view their members' reflection files
CREATE POLICY "Practitioners can view member reflections media"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'reflections'
    AND EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id::text = (storage.foldername(name))[1]
        AND m.practitioner_id = auth.uid()
    )
);

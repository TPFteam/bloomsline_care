-- ============================================
-- Create Moments Table
-- ============================================

-- Create moment_type enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moment_type') THEN
        CREATE TYPE moment_type AS ENUM ('photo', 'video', 'voice', 'write');
    END IF;
END$$;

-- Create moments table (personal to the member/user)
CREATE TABLE IF NOT EXISTS moments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type moment_type NOT NULL,

    -- Media URLs (stored in Supabase storage)
    media_url TEXT,
    thumbnail_url TEXT,

    -- Content
    text_content TEXT,
    caption TEXT,

    -- Mood tags (array of mood identifiers)
    moods TEXT[] DEFAULT '{}',

    -- Media metadata
    duration_seconds INTEGER, -- For audio/video
    file_size_bytes BIGINT,
    mime_type TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_type ON moments(type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_moments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_moments_updated_at ON moments;
CREATE TRIGGER trigger_moments_updated_at
    BEFORE UPDATE ON moments
    FOR EACH ROW
    EXECUTE FUNCTION update_moments_updated_at();

-- ============================================
-- Row Level Security Policies
-- ============================================

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

-- Users can view their own moments
CREATE POLICY "Users can view own moments"
    ON moments FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own moments
CREATE POLICY "Users can insert own moments"
    ON moments FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own moments
CREATE POLICY "Users can update own moments"
    ON moments FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Users can delete their own moments
CREATE POLICY "Users can delete own moments"
    ON moments FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- Storage Bucket for Moments Media
-- ============================================

-- Note: Storage bucket creation is done via Supabase Dashboard or API
-- The bucket should be named 'moments_media' with the following policies:
--
-- INSERT: authenticated users can upload to their own folder
-- SELECT: authenticated users can view their own files
-- DELETE: authenticated users can delete their own files
--
-- Folder structure: moments_media/{user_id}/{moment_id}/{filename}

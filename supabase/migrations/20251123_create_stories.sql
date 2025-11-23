-- Create stories table for member content creation
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb, -- Changed to JSONB array of content blocks
  media_urls JSONB DEFAULT '[]'::jsonb,
  published BOOLEAN DEFAULT false,
  unique_slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for user_id for faster queries
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);

-- Add index for unique_slug for faster lookups
CREATE INDEX IF NOT EXISTS stories_unique_slug_idx ON public.stories(unique_slug);

-- Add index for published stories
CREATE INDEX IF NOT EXISTS stories_published_idx ON public.stories(published);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stories
CREATE POLICY "Users can view own stories"
  ON public.stories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own stories
CREATE POLICY "Users can create own stories"
  ON public.stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own stories
CREATE POLICY "Users can update own stories"
  ON public.stories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete own stories"
  ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Anyone can view published stories via unique slug (for sharing)
CREATE POLICY "Anyone can view published stories"
  ON public.stories
  FOR SELECT
  USING (published = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.stories IS 'Member-created stories with text and media content';
COMMENT ON COLUMN public.stories.media_urls IS 'Array of media file URLs (images, videos, etc.)';
COMMENT ON COLUMN public.stories.unique_slug IS 'Unique URL slug for shareable links';

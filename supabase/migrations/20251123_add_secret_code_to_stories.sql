-- Add secret_code column to stories table
ALTER TABLE public.stories
ADD COLUMN IF NOT EXISTS secret_code TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_stories_secret_code ON public.stories(secret_code);

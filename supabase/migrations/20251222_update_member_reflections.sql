-- Update member_reflections table for new open canvas design
-- Add new columns for intent-based reflections with media support

-- Add intent column (discovery, vent, reflect, gratitude)
ALTER TABLE public.member_reflections
ADD COLUMN IF NOT EXISTS intent TEXT DEFAULT 'reflect';

-- Add content column for main text (replacing gratitude/thoughts split)
ALTER TABLE public.member_reflections
ADD COLUMN IF NOT EXISTS content TEXT;

-- Add image_url for photo attachments
ALTER TABLE public.member_reflections
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add audio_url for voice recordings
ALTER TABLE public.member_reflections
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Make mood nullable (optional in new design)
ALTER TABLE public.member_reflections
ALTER COLUMN mood DROP NOT NULL;

-- Create index on intent for filtering
CREATE INDEX IF NOT EXISTS member_reflections_intent_idx ON public.member_reflections(intent);

-- Update existing records: set content from gratitude/thoughts if they exist
UPDATE public.member_reflections
SET content = COALESCE(gratitude, thoughts),
    intent = CASE
        WHEN gratitude IS NOT NULL AND gratitude != '' THEN 'gratitude'
        ELSE 'reflect'
    END
WHERE content IS NULL;

-- Add language column to resources table
-- This allows resources to be created in specific languages (English or French)

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en';

-- Add check constraint to ensure only valid languages
ALTER TABLE public.resources
DROP CONSTRAINT IF EXISTS resources_language_check;

ALTER TABLE public.resources
ADD CONSTRAINT resources_language_check
CHECK (language IN ('en', 'fr'));

-- Create index for language filtering
CREATE INDEX IF NOT EXISTS resources_language_idx ON public.resources(language);

-- Add comment to document the language options
COMMENT ON COLUMN public.resources.language IS 'Resource language: en (English) or fr (French)';

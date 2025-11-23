-- Add preferred_language column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

-- Add check constraint to ensure only valid languages
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_preferred_language_check;

ALTER TABLE public.users
ADD CONSTRAINT users_preferred_language_check
CHECK (preferred_language IN ('en', 'fr'));

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS users_preferred_language_idx ON public.users(preferred_language);

-- Add comment to document the language options
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language: en (English) or fr (French)';

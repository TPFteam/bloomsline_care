-- ============================================
-- ADD MOOD TO RITUAL COMPLETIONS
-- ============================================
-- Track how members feel after completing rituals
-- Values: great, good, okay, low, difficult

ALTER TABLE public.ritual_completions
ADD COLUMN IF NOT EXISTS mood TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.ritual_completions.mood IS 'Mood after completing ritual: great, good, okay, low, difficult';

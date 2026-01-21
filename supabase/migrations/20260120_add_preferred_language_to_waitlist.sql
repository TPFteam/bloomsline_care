-- Add preferred language to early access waitlist
-- This allows us to send personalized emails in the user's preferred language

ALTER TABLE early_access_waitlist
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr'));

-- Add index for filtering by language
CREATE INDEX IF NOT EXISTS idx_early_access_preferred_language ON early_access_waitlist(preferred_language);

-- Comment for documentation
COMMENT ON COLUMN early_access_waitlist.preferred_language IS 'User preferred language for communications: en (English) or fr (French)';

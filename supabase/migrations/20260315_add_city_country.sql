-- Add city and country to practitioner_profiles
ALTER TABLE practitioner_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE practitioner_profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Add city and country to public_practitioners
ALTER TABLE public_practitioners ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public_practitioners ADD COLUMN IF NOT EXISTS country TEXT;

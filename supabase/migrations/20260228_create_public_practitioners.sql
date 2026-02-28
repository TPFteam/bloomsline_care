-- Create public_practitioners table
-- Standalone table for public practitioner pages (no FK to users)
-- These are profiles created by admins for practitioners who haven't signed up yet

CREATE TABLE IF NOT EXISTS public_practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  full_name TEXT NOT NULL,
  avatar_url TEXT,

  -- Professional
  headline TEXT,
  bio TEXT,
  credentials TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',
  licenses JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  years_experience INTEGER,

  -- Practice
  specialties TEXT[] DEFAULT '{}',
  approaches TEXT[] DEFAULT '{}',
  age_groups TEXT[] DEFAULT '{}',
  session_types TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{English}',

  -- Location
  practice_location JSONB,
  offers_telehealth BOOLEAN DEFAULT true,
  offers_in_person BOOLEAN DEFAULT false,
  client_acceptance_status TEXT DEFAULT 'accepting',

  -- Fees
  show_fees BOOLEAN DEFAULT false,
  session_fee_min NUMERIC,
  session_fee_max NUMERIC,
  fee_currency TEXT DEFAULT 'USD',
  insurance_accepted TEXT[] DEFAULT '{}',
  offers_sliding_scale BOOLEAN DEFAULT false,

  -- Contact
  social_links JSONB,
  contact_email TEXT,
  contact_phone TEXT,

  -- Settings
  slug TEXT UNIQUE NOT NULL,
  is_published BOOLEAN DEFAULT false,

  -- Meta
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for slug lookups (public page)
CREATE INDEX IF NOT EXISTS idx_public_practitioners_slug ON public_practitioners (slug);
CREATE INDEX IF NOT EXISTS idx_public_practitioners_published ON public_practitioners (is_published);

-- RLS
ALTER TABLE public_practitioners ENABLE ROW LEVEL SECURITY;

-- Public can read published profiles
CREATE POLICY "Public can view published practitioners"
  ON public_practitioners FOR SELECT
  USING (is_published = true);

-- Authenticated users can read all profiles (for admin list)
CREATE POLICY "Authenticated can view all practitioners"
  ON public_practitioners FOR SELECT
  TO authenticated
  USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_public_practitioners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER public_practitioners_updated_at
  BEFORE UPDATE ON public_practitioners
  FOR EACH ROW
  EXECUTE FUNCTION update_public_practitioners_updated_at();

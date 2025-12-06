-- Create practitioner_profiles table
-- This table extends the users table with professional profile information

-- Create enum types
CREATE TYPE client_acceptance_status AS ENUM ('accepting', 'waitlist', 'not_accepting');

-- Create practitioner_profiles table
CREATE TABLE IF NOT EXISTS practitioner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Professional Identity
  headline TEXT,
  bio TEXT,
  intro_video_url TEXT,

  -- Credentials (stored as JSONB for flexibility)
  credentials TEXT[] DEFAULT '{}',
  education JSONB DEFAULT '[]',
  licenses JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  years_experience INTEGER,

  -- Practice (arrays for multi-select)
  specialties TEXT[] DEFAULT '{}',
  approaches TEXT[] DEFAULT '{}',
  age_groups TEXT[] DEFAULT '{}',
  session_types TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{"English"}',

  -- Location & Availability
  practice_location JSONB,
  offers_telehealth BOOLEAN DEFAULT true,
  offers_in_person BOOLEAN DEFAULT false,
  client_acceptance_status client_acceptance_status DEFAULT 'accepting',

  -- Fees & Insurance
  show_fees BOOLEAN DEFAULT false,
  session_fee_min INTEGER,
  session_fee_max INTEGER,
  fee_currency TEXT DEFAULT 'USD',
  insurance_accepted TEXT[] DEFAULT '{}',
  offers_sliding_scale BOOLEAN DEFAULT false,

  -- Social & Contact
  social_links JSONB,
  contact_email TEXT,
  contact_phone TEXT,

  -- Profile Settings
  slug TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  profile_completeness INTEGER DEFAULT 0,

  -- Stats (cached, updated by triggers)
  total_resources_published INTEGER DEFAULT 0,
  total_members_helped INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT unique_user_profile UNIQUE (user_id),
  CONSTRAINT valid_fee_range CHECK (
    session_fee_min IS NULL OR
    session_fee_max IS NULL OR
    session_fee_min <= session_fee_max
  ),
  CONSTRAINT valid_profile_completeness CHECK (
    profile_completeness >= 0 AND profile_completeness <= 100
  )
);

-- Create indexes
CREATE INDEX idx_practitioner_profiles_user_id ON practitioner_profiles(user_id);
CREATE INDEX idx_practitioner_profiles_slug ON practitioner_profiles(slug);
CREATE INDEX idx_practitioner_profiles_is_public ON practitioner_profiles(is_public);
CREATE INDEX idx_practitioner_profiles_specialties ON practitioner_profiles USING GIN(specialties);
CREATE INDEX idx_practitioner_profiles_approaches ON practitioner_profiles USING GIN(approaches);
CREATE INDEX idx_practitioner_profiles_client_status ON practitioner_profiles(client_acceptance_status);

-- Enable RLS
ALTER TABLE practitioner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON practitioner_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON practitioner_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON practitioner_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON practitioner_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Public profiles can be viewed by anyone (for discovery)
CREATE POLICY "Public profiles are viewable by everyone"
  ON practitioner_profiles
  FOR SELECT
  USING (is_public = true);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_practitioner_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_practitioner_profile_timestamp
  BEFORE UPDATE ON practitioner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_practitioner_profile_updated_at();

-- Create function to auto-generate slug from user's full name
CREATE OR REPLACE FUNCTION generate_profile_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  user_name TEXT;
BEGIN
  -- Only generate slug if it's null
  IF NEW.slug IS NULL THEN
    -- Get user's full name from users table
    SELECT full_name INTO user_name
    FROM public.users
    WHERE id = NEW.user_id;

    IF user_name IS NOT NULL AND user_name != '' THEN
      -- Generate base slug from name
      base_slug := lower(regexp_replace(user_name, '[^a-zA-Z0-9\s-]', '', 'g'));
      base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
      base_slug := regexp_replace(base_slug, '-+', '-', 'g');
      base_slug := trim(both '-' from base_slug);

      final_slug := base_slug;

      -- Check for uniqueness and add counter if needed
      WHILE EXISTS (SELECT 1 FROM practitioner_profiles WHERE slug = final_slug AND id != NEW.id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END LOOP;

      NEW.slug := final_slug;
    ELSE
      -- Fallback to user_id if no name
      NEW.slug := NEW.user_id::TEXT;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating slug
CREATE TRIGGER trigger_generate_profile_slug
  BEFORE INSERT ON practitioner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_profile_slug();

-- Create function to update resource stats
CREATE OR REPLACE FUNCTION update_practitioner_resource_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_resources_published count
  UPDATE practitioner_profiles
  SET total_resources_published = (
    SELECT COUNT(*)
    FROM resources
    WHERE practitioner_id = NEW.practitioner_id
    AND status = 'published'
    AND visibility = 'public'
  )
  WHERE user_id = NEW.practitioner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when resources change
-- Note: This assumes resources table exists with practitioner_id column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resources') THEN
    CREATE TRIGGER trigger_update_practitioner_resource_stats
      AFTER INSERT OR UPDATE OR DELETE ON resources
      FOR EACH ROW
      EXECUTE FUNCTION update_practitioner_resource_stats();
  END IF;
END $$;

-- Create function to update member stats
CREATE OR REPLACE FUNCTION update_practitioner_member_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_members_helped count
  UPDATE practitioner_profiles
  SET total_members_helped = (
    SELECT COUNT(DISTINCT member_id)
    FROM members
    WHERE practitioner_id = COALESCE(NEW.practitioner_id, OLD.practitioner_id)
  )
  WHERE user_id = COALESCE(NEW.practitioner_id, OLD.practitioner_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when members change
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
    CREATE TRIGGER trigger_update_practitioner_member_stats
      AFTER INSERT OR UPDATE OR DELETE ON members
      FOR EACH ROW
      EXECUTE FUNCTION update_practitioner_member_stats();
  END IF;
END $$;

-- Create endorsements table for colleague testimonials
CREATE TABLE IF NOT EXISTS practitioner_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES practitioner_profiles(id) ON DELETE CASCADE,

  author_name TEXT NOT NULL,
  author_title TEXT,
  author_organization TEXT,
  content TEXT NOT NULL,

  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on endorsements
ALTER TABLE practitioner_endorsements ENABLE ROW LEVEL SECURITY;

-- Endorsements policies
CREATE POLICY "Profile owners can manage endorsements"
  ON practitioner_endorsements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM practitioner_profiles
      WHERE id = practitioner_endorsements.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Approved endorsements on public profiles are viewable"
  ON practitioner_endorsements
  FOR SELECT
  USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM practitioner_profiles
      WHERE id = practitioner_endorsements.profile_id
      AND is_public = true
    )
  );

-- Add comment to table
COMMENT ON TABLE practitioner_profiles IS 'Extended profile information for practitioners/mentors, used for public profiles and discovery';
COMMENT ON TABLE practitioner_endorsements IS 'Colleague endorsements/testimonials for practitioners';

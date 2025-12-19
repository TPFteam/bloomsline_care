-- Migration: Add user_id column to members table
-- Purpose: Link authenticated member users to their member records

-- Add user_id column to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS members_user_id_idx ON public.members(user_id);

-- Unique constraint - one user can only be linked to one member record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_unique'
  ) THEN
    ALTER TABLE public.members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Function to auto-link member to user by email when user signs up
CREATE OR REPLACE FUNCTION public.link_member_by_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process for member user types
  IF NEW.raw_user_meta_data->>'user_type' = 'member' THEN
    -- Try to find a member with matching email that isn't already linked
    UPDATE public.members
    SET user_id = NEW.id
    WHERE email = NEW.email
      AND user_id IS NULL
      AND email IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_link_member ON auth.users;
CREATE TRIGGER on_auth_user_created_link_member
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.link_member_by_email();

-- Comment for documentation
COMMENT ON COLUMN public.members.user_id IS 'Links to auth.users for member login access';

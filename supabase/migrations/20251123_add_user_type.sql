-- Create user_type enum type
DO $$ BEGIN
  CREATE TYPE user_type_enum AS ENUM ('mentor', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop the column if it exists (to recreate with proper type)
ALTER TABLE public.users
DROP COLUMN IF EXISTS user_type;

-- Add user_type column with enum type
ALTER TABLE public.users
ADD COLUMN user_type user_type_enum NOT NULL DEFAULT 'mentor';

-- Add check constraint to ensure only valid user types
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_user_type_check;

ALTER TABLE public.users
ADD CONSTRAINT users_user_type_check
CHECK (user_type IN ('mentor', 'member'));

-- Update the handle_new_user function to NOT automatically create user profile
-- Profile will be created in onboarding after user selects their type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't automatically create profile - wait for onboarding
  -- This allows users to select their user_type during onboarding
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for user_type for faster filtering
CREATE INDEX IF NOT EXISTS users_user_type_idx ON public.users(user_type);

-- Add comment to document the user types
COMMENT ON COLUMN public.users.user_type IS 'User type: mentor (default) or member';

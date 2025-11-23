# Apply Database Migrations

## Automatic User Type Assignment

The migration `20251123_add_user_type.sql` adds automatic user type assignment.

### What it does:
- Creates a `user_type_enum` type with two values: 'mentor' and 'member'
- Adds a `user_type` column to the users table
- Sets default value to 'mentor' for all new users
- Adds constraints to ensure only valid user types ('mentor' or 'member')
- Updates the trigger function to automatically assign 'mentor' to new users

### How to apply:

#### Option 1: Supabase CLI
```bash
cd /Users/aditya/template/Bloomsline
supabase db push
```

#### Option 2: Supabase SQL Editor
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
2. Copy the contents from `supabase/migrations/20251123_add_user_type.sql`
3. Paste into the SQL editor
4. Click "Run"

#### Option 3: Manual SQL Execution
Run this SQL in your Supabase SQL editor:

```sql
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

-- Update the handle_new_user function to include user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'mentor'::user_type_enum
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for user_type for faster filtering
CREATE INDEX IF NOT EXISTS users_user_type_idx ON public.users(user_type);

-- Add comment to document the user types
COMMENT ON COLUMN public.users.user_type IS 'User type: mentor (default) or member';
```

### Verify:
After applying, create a new account and check that the user_type is set to 'mentor':
```sql
SELECT id, email, user_type FROM public.users;
```

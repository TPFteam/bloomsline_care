# Supabase Database Migrations

## Running Migrations

You can run these migrations in two ways:

### Option 1: Using Supabase SQL Editor (Recommended for now)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fogrmjmquyyjegfppwaj
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire content of `20251122_create_users_table.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the migration

### Option 2: Using Supabase CLI (For future migrations)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Link to your remote project:
   ```bash
   supabase link --project-ref fogrmjmquyyjegfppwaj
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

## What the Migration Does

The `20251122_create_users_table.sql` migration:

1. **Creates `public.users` table** with columns:
   - `id` (UUID, references auth.users)
   - `email` (TEXT)
   - `full_name` (TEXT, nullable)
   - `avatar_url` (TEXT, nullable)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

2. **Sets up Row Level Security (RLS)** policies:
   - Users can view their own profile
   - Users can update their own profile
   - Users can insert their own profile

3. **Creates automatic sync trigger**:
   - Automatically creates a user record in `public.users` when a new user signs up via auth
   - Syncs email, full_name, and avatar_url from Google OAuth

4. **Creates updated_at trigger**:
   - Automatically updates the `updated_at` timestamp when a user profile is modified

## Testing

After running the migration, sign up with a new Google account and verify:

1. A new record appears in the `public.users` table
2. The user data matches the auth.users data
3. The user can query their own profile but not others' profiles

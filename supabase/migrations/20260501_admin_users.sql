-- Admin users table (replaces hardcoded ADMIN_USER_IDS)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin_users (via service role in API routes)
CREATE POLICY "Service role only" ON admin_users FOR ALL USING (false);

-- Seed current admin
INSERT INTO admin_users (user_id, role) VALUES ('3548c40c-22d6-43e9-8835-0ef9db6abe76', 'super_admin') ON CONFLICT DO NOTHING;

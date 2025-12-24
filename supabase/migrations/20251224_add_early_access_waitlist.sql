-- Early Access Waitlist table
CREATE TABLE IF NOT EXISTS early_access_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  reason TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('member', 'practitioner', 'both')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'activated')),
  invited_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_early_access_email ON early_access_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_early_access_status ON early_access_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_early_access_user_type ON early_access_waitlist(user_type);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_early_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER early_access_updated_at
  BEFORE UPDATE ON early_access_waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_early_access_updated_at();

-- Enable RLS
ALTER TABLE early_access_waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for the form)
CREATE POLICY "Allow anonymous inserts" ON early_access_waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

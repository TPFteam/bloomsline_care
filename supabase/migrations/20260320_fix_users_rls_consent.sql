-- Allow authenticated users to update their own has_consented field
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
DROP POLICY IF EXISTS "Users can read own record" ON public.users;
CREATE POLICY "Users can read own record"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record (limited to consent and preferences)
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

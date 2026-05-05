-- Bloom Pulse: cache extracted content of member files
-- Files are processed once via Claude vision/text extraction, then reused
-- across all subsequent Pulse generations until the file changes.

CREATE TABLE IF NOT EXISTS public.file_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL UNIQUE REFERENCES public.member_files(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Cache invalidation: hash of source file (md5 of storage path + updated_at).
  -- If the underlying file changes, this hash changes and we re-extract.
  source_hash TEXT NOT NULL,

  -- Extracted content
  extracted_text TEXT,           -- Raw text content (long)
  extracted_summary TEXT,        -- 1-paragraph clinical summary (~200 words)

  -- Bookkeeping
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  model_used TEXT,
  tokens_used INTEGER,
  error_message TEXT,
  extracted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS file_extractions_member_id_idx ON public.file_extractions(member_id);
CREATE INDEX IF NOT EXISTS file_extractions_status_idx ON public.file_extractions(status);

ALTER TABLE public.file_extractions ENABLE ROW LEVEL SECURITY;

-- Practitioners can read extractions for their own members
CREATE POLICY "Practitioners read own member extractions"
  ON public.file_extractions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE practitioner_id = auth.uid()
    )
  );

-- Server-only writes (via service role from /api routes)
-- No INSERT/UPDATE/DELETE policies for authenticated users — all writes go through admin client.

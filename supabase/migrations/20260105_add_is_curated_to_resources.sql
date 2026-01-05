-- Add is_curated column to resources table
-- This column indicates whether a resource has been verified/curated by administrators

ALTER TABLE public.resources
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT FALSE;

-- Create an index for faster filtering of curated resources
CREATE INDEX IF NOT EXISTS idx_resources_is_curated ON public.resources(is_curated) WHERE is_curated = TRUE;

-- Comment on the column
COMMENT ON COLUMN public.resources.is_curated IS 'Indicates whether this resource has been verified/curated by administrators';

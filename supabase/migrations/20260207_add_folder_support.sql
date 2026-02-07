-- Add folder support to member_files (unified table approach)
ALTER TABLE public.member_files
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_folder_id UUID REFERENCES public.member_files(id) ON DELETE CASCADE;

-- Indexes for hierarchy queries
CREATE INDEX IF NOT EXISTS member_files_parent_folder_idx ON public.member_files(parent_folder_id);
CREATE INDEX IF NOT EXISTS member_files_is_folder_idx ON public.member_files(is_folder);

-- Constraint: folders have no storage path (storage_path can be empty string for folders)
-- Note: We allow storage_path to be empty string '' for folders since existing code uses '' as default
ALTER TABLE public.member_files
ADD CONSTRAINT folder_no_file_fields
CHECK (
  (is_folder = false) OR
  (is_folder = true AND (storage_path IS NULL OR storage_path = '') AND file_size IS NULL)
);

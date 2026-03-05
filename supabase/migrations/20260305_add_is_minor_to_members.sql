-- Add is_minor flag to members table
-- Allows practitioners to mark a member as a student/minor

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false;

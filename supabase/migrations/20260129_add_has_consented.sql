-- Add has_consented column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_consented boolean DEFAULT false;

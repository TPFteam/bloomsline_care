-- Add 'prospect' to member_status enum
ALTER TYPE member_status ADD VALUE IF NOT EXISTS 'prospect';

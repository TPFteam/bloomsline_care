-- Add show_all_features column to user_preferences table
-- When false (default), only core features are shown in member navigation
-- When true, all features including Balance, Care, and Reflection are shown

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS show_all_features BOOLEAN DEFAULT false;

-- Per-practitioner engagement scoring configuration.
-- Drives the "My People" / Mes personnes orbit on the analytics page.
-- The score is computed live (no background job); each enabled signal
-- contributes 0..weight to a max of 100. Color thresholds stay fixed
-- (>=70 emerald, >=40 amber, <40 orange).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS engagement_settings JSONB NOT NULL DEFAULT
  '{
    "preset": "all",
    "signals": {
      "sessions":     { "enabled": true, "weight": 25 },
      "notes":        { "enabled": true, "weight": 10 },
      "milestones":   { "enabled": true, "weight": 15 },
      "reflections":  { "enabled": true, "weight": 15 },
      "resources":    { "enabled": true, "weight": 10 },
      "stories":      { "enabled": true, "weight": 10 },
      "files":        { "enabled": true, "weight": 5 },
      "bookings":     { "enabled": true, "weight": 10 }
    },
    "pulseSentimentOverride": false
  }'::jsonb;

COMMENT ON COLUMN public.users.engagement_settings IS
  'Configuration for the My People engagement score: which signals to include, their weights, and whether to apply Bloom Pulse sentiment as a tier override.';

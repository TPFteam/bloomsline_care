-- Add overview card layout column to user_preferences table
-- This stores the arrangement of cards in the member Overview tab

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS overview_card_layout JSONB DEFAULT '[
  {"id": "about", "column": 0, "order": 0},
  {"id": "active_goals", "column": 0, "order": 1},
  {"id": "past_sessions", "column": 0, "order": 2},
  {"id": "preferences", "column": 1, "order": 0},
  {"id": "recent_notes", "column": 1, "order": 1},
  {"id": "shared_resources", "column": 1, "order": 2}
]'::jsonb;

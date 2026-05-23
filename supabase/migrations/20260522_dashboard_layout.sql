-- Per-practitioner dashboard layout.
--
-- The dashboard has 4 fixed slots (big-left, wide-bottom-left,
-- small-top-right, small-bottom-right). The practitioner can swap
-- which widget renders in which slot via drag-and-drop on the
-- dashboard. Null = use the hard-coded default arrangement.
--
-- Shape:
--   {
--     "bigLeft":          "up_next" | "this_week" | "recent_resources" | "quick_note",
--     "wideBottomLeft":   "...",
--     "smallTopRight":    "...",
--     "smallBottomRight": "..."
--   }
--
-- The four widget ids are exactly the four cards currently on the
-- dashboard. Every value must appear once and only once — no
-- duplicates, no missing slots. The app validates this before
-- writing; old / malformed values fall back to the default.

alter table public.users
  add column if not exists dashboard_layout jsonb;

comment on column public.users.dashboard_layout is
  'Per-practitioner dashboard slot → widget assignment. Null = default. Schema documented in migration 20260522_dashboard_layout.sql.';

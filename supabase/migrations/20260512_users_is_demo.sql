-- ─────────────────────────────────────────────────────────────────────
-- users.is_demo
--
-- Marks internal demo/test practitioners so the admin dashboard,
-- analytics, and reporting can exclude them from real metrics.
--
-- Partial index keeps the storage tiny — only the (small) set of
-- demo rows is indexed; the common case (real practitioners) is read
-- via the existing user_type='mentor' filter.
-- ─────────────────────────────────────────────────────────────────────

alter table public.users
  add column if not exists is_demo boolean not null default false;

create index if not exists users_is_demo_idx
  on public.users (is_demo)
  where is_demo = true;

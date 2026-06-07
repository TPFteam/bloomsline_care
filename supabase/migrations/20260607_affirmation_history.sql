-- History of affirmation sets shown to a patient in the "For You" tab.
-- Stored so we can (a) let them look back and (b) avoid repeating recent
-- wording. One row per generated session.

create table if not exists public.affirmation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text,
  topic text,
  state text,
  need text,
  locale text not null default 'en',
  affirmations jsonb not null default '[]'::jsonb,
  source text not null default 'ai',  -- 'ai' | 'curated' (fallback)
  created_at timestamptz not null default now()
);

create index if not exists idx_affirmation_history_user
  on public.affirmation_history (user_id, created_at desc);

alter table public.affirmation_history enable row level security;

drop policy if exists "Users read own affirmation history" on public.affirmation_history;

-- Read-only for the patient; rows are written server-side (service role).
create policy "Users read own affirmation history"
  on public.affirmation_history for select
  to authenticated
  using (user_id = auth.uid());

-- Saved/favorite affirmations from the mobile "For You" tab.
-- A patient can ❤️ an affirmation and revisit it under "Saved".

create table if not exists public.affirmation_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  theme text,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists idx_affirmation_favorites_user
  on public.affirmation_favorites (user_id, created_at desc);

alter table public.affirmation_favorites enable row level security;

drop policy if exists "Users read own affirmation favorites"   on public.affirmation_favorites;
drop policy if exists "Users insert own affirmation favorites" on public.affirmation_favorites;
drop policy if exists "Users delete own affirmation favorites" on public.affirmation_favorites;

create policy "Users read own affirmation favorites"
  on public.affirmation_favorites for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own affirmation favorites"
  on public.affirmation_favorites for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users delete own affirmation favorites"
  on public.affirmation_favorites for delete
  to authenticated
  using (user_id = auth.uid());

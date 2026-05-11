-- ─────────────────────────────────────────────────────────────────────
-- dismissed_google_events: per-practitioner list of Google Calendar
-- event IDs the practitioner has explicitly chosen not to claim into
-- Bloomsline. The orphan-events route subtracts this set from its
-- output so dismissed events don't reappear on every sync.
--
-- Why a dedicated table:
--   * Trivially queryable: "how often does the suggested-member match
--     get rejected?" becomes a simple SELECT.
--   * Unique constraint guarantees idempotent dismissals.
--   * Independent of the calendar_connections row lifecycle — if the
--     practitioner ever needs to disconnect + reconnect Google, we
--     don't lose what they intentionally dismissed.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.dismissed_google_events (
  id               uuid primary key default gen_random_uuid(),
  practitioner_id  uuid not null references auth.users(id) on delete cascade,
  google_event_id  text not null,
  dismissed_at     timestamptz not null default now(),
  unique (practitioner_id, google_event_id)
);

create index if not exists dismissed_google_events_practitioner_idx
  on public.dismissed_google_events (practitioner_id);

alter table public.dismissed_google_events enable row level security;

drop policy if exists "Practitioners select own dismissals" on public.dismissed_google_events;
create policy "Practitioners select own dismissals"
  on public.dismissed_google_events
  for select
  to authenticated
  using (auth.uid() = practitioner_id);

drop policy if exists "Practitioners insert own dismissals" on public.dismissed_google_events;
create policy "Practitioners insert own dismissals"
  on public.dismissed_google_events
  for insert
  to authenticated
  with check (auth.uid() = practitioner_id);

drop policy if exists "Practitioners delete own dismissals" on public.dismissed_google_events;
create policy "Practitioners delete own dismissals"
  on public.dismissed_google_events
  for delete
  to authenticated
  using (auth.uid() = practitioner_id);

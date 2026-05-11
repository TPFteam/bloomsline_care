-- ─────────────────────────────────────────────────────────────────────
-- client_errors: persistent sink for browser-side render errors.
--
-- Background:
--   error.tsx and global-error.tsx fire `posthog.capture('client_error')`,
--   but PostHog only initializes after the user accepts cookies — so
--   crashes from non-consenting users left no trace. The /api/client-error
--   route POSTs into this table regardless of consent.
--
--   Rows are written by the admin client (service role), so RLS is open
--   for service role; anon/authenticated users have no direct access.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.client_errors (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  error_name            text,
  error_message         text,
  error_stack           text,
  error_digest          text,
  url                   text,
  user_agent            text,
  scope                 text,
  translate_probe_value text
);

create index if not exists client_errors_created_at_idx
  on public.client_errors (created_at desc);

create index if not exists client_errors_digest_idx
  on public.client_errors (error_digest)
  where error_digest is not null;

alter table public.client_errors enable row level security;

-- Only the service role can read/write. The admin client used by the API
-- route bypasses RLS, so inserts work; nothing else can see these rows.
drop policy if exists "client_errors service role only" on public.client_errors;
create policy "client_errors service role only"
  on public.client_errors
  for all
  using (false)
  with check (false);

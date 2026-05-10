-- ─────────────────────────────────────────────────────────────────────
-- Trigger: send-review-received-email
--
-- Fires the `send-review-received-email` edge function when a row in
-- `resource_responses` transitions into `status = 'reviewed'`. Replaces
-- the dashboard webhook (which would fire on every UPDATE) with a
-- row-level filter so we only invoke the function on the actual
-- submitted→reviewed transition.
--
-- Run order:
--   1. Make sure `pg_net` is enabled (Supabase enables it by default):
--        select extname from pg_extension where extname = 'pg_net';
--      If empty: create extension if not exists pg_net;
--   2. Replace the two placeholders below before running:
--        <PROJECT_REF>      → first part of your Supabase URL,
--                             e.g. https://abcd1234.supabase.co → 'abcd1234'
--        <SERVICE_ROLE_KEY> → Settings → API → "service_role" secret
--                             (NOT the anon key)
--   3. If you already created a dashboard webhook for this same edge
--      function, DELETE it first (Database → Webhooks → trash icon)
--      so the patient doesn't receive two emails per review.
--
-- Safety:
--   * Non-destructive — additive only. No existing data, RLS, indexes,
--     or other triggers are touched.
--   * The HTTP call is wrapped in BEGIN/EXCEPTION so a transient
--     `pg_net` failure can never roll back the practitioner's UPDATE.
--     If the email-out fails it's logged via `raise notice` and the
--     row update still succeeds.
--
-- Rollback:
--   drop trigger if exists trg_notify_response_reviewed on public.resource_responses;
--   drop function if exists public.notify_response_reviewed;
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.notify_response_reviewed()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Safety net: never let a webhook hiccup block the UPDATE itself.
  -- The patient still gets their submission marked "Reviewed" either
  -- way; failed sends show up in `net._http_response` logs.
  begin
    perform net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-review-received-email',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
                 ),
      body := jsonb_build_object(
                'type',       'UPDATE',
                'table',      tg_table_name,
                'schema',     tg_table_schema,
                'record',     to_jsonb(new),
                'old_record', to_jsonb(old)
              )
    );
  exception when others then
    raise notice 'notify_response_reviewed: http_post failed: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists trg_notify_response_reviewed on public.resource_responses;

-- Two filters:
--   1. `update of status` — only fires when the status column changes,
--      not on every autosave / unrelated column edit.
--   2. WHEN clause — only fires on the actual submitted→reviewed
--      transition, not on a re-save of an already-reviewed row.
create trigger trg_notify_response_reviewed
after update of status on public.resource_responses
for each row
when (new.status = 'reviewed' and old.status is distinct from 'reviewed')
execute function public.notify_response_reviewed();

-- ─────────────────────────────────────────────────────────────────────
-- Sanity check after running:
--
--   select id, status_code, content::text
--   from net._http_response
--   order by created desc
--   limit 5;
--
-- After marking one test submission as Reviewed, you should see
-- exactly one row with status_code 200. No call on autosaves, no
-- call on re-saves of an already-reviewed row.
-- ─────────────────────────────────────────────────────────────────────

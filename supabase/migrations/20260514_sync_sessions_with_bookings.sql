-- ─────────────────────────────────────────────────────────────────────
-- Keep bookings ↔ sessions in lockstep.
--
-- Background: a booking is the calendar event (often created through
-- the public booking flow), a session is the practitioner-tracked
-- record (notes, payment, outcome). Historically these two tables only
-- stayed in sync along specific code paths (approve-pending in
-- SessionsTab, manual Add Session, etc). Bookings created by other
-- paths (public auto-confirm, schedule-modal calendar mode, etc) often
-- had no paired session, so the patient detail Sessions tab showed
-- nothing even though the booking was clearly there.
--
-- This migration:
--   1. Backfills the missing sessions for every booking with a member
--      in an outcome-bearing status (confirmed / completed / cancelled /
--      no_show).
--   2. Installs a trigger on bookings that upserts the paired session
--      on every meaningful insert/update, so no future booking can
--      slip through without its session.
-- ─────────────────────────────────────────────────────────────────────

-- ─── 1. Backfill ──────────────────────────────────────────────────────

insert into public.sessions (
  practitioner_id, member_id, session_type, session_format,
  scheduled_at, duration_minutes, status, payment_status,
  member_confirmed, cancellation_reason
)
select
  b.practitioner_id,
  b.member_id,
  (case
    when b.session_type::text in ('initial_consultation', 'follow_up', 'check_in', 'crisis', 'group', 'other')
      then b.session_type::text
    when b.session_type::text = 'initial' then 'initial_consultation'
    else 'follow_up'
  end)::session_type,
  (case
    when b.session_format::text = 'video' then 'virtual'
    when b.session_format::text in ('in_person', 'virtual', 'phone') then b.session_format::text
    else 'virtual'
  end)::session_format,
  b.start_time,
  greatest(1, round(extract(epoch from (b.end_time - b.start_time)) / 60)::int),
  case
    when b.status::text = 'confirmed' then 'scheduled'
    else b.status::text
  end,
  b.payment_status::text,
  true,
  b.cancellation_reason
from public.bookings b
where b.member_id is not null
  and b.status::text in ('confirmed', 'completed', 'cancelled', 'no_show')
  and not exists (
    select 1 from public.sessions s
    where s.practitioner_id = b.practitioner_id
      and s.member_id = b.member_id
      and s.scheduled_at = b.start_time
  );

-- ─── 2. Trigger function ──────────────────────────────────────────────

create or replace function public.sync_session_from_booking()
returns trigger
language plpgsql
security definer
as $$
declare
  v_status      text;
  v_format      text;
  v_type        text;
  v_duration    int;
  v_lookup_time timestamptz;
begin
  -- Guest bookings (no linkable member) and pending bookings (not yet
  -- approved) don't need a session row.
  if new.member_id is null then return new; end if;
  if new.status::text not in ('confirmed', 'completed', 'cancelled', 'no_show') then
    return new;
  end if;

  -- On UPDATE, no-op when nothing session-relevant changed. Keeps the
  -- trigger from re-firing on cosmetic edits like google_event_id or
  -- practitioner_notes.
  if tg_op = 'UPDATE' and not (
       old.status            is distinct from new.status
    or old.session_type      is distinct from new.session_type
    or old.session_format    is distinct from new.session_format
    or old.payment_status    is distinct from new.payment_status
    or old.start_time        is distinct from new.start_time
    or old.end_time          is distinct from new.end_time
    or coalesce(old.cancellation_reason,'') is distinct from coalesce(new.cancellation_reason,'')
  ) then
    return new;
  end if;

  v_status := case when new.status::text = 'confirmed' then 'scheduled' else new.status::text end;
  v_format := case
    when new.session_format::text = 'video' then 'virtual'
    when new.session_format::text in ('in_person', 'virtual', 'phone') then new.session_format::text
    else 'virtual'
  end;
  v_type := case
    when new.session_type::text in ('initial_consultation', 'follow_up', 'check_in', 'crisis', 'group', 'other')
      then new.session_type::text
    when new.session_type::text = 'initial' then 'initial_consultation'
    else 'follow_up'
  end;
  v_duration := greatest(1, round(extract(epoch from (new.end_time - new.start_time)) / 60)::int);

  -- For UPDATE, look up the session by OLD start_time so reschedules
  -- move the session in place rather than orphaning it.
  v_lookup_time := case when tg_op = 'UPDATE' then old.start_time else new.start_time end;

  if exists (
    select 1 from public.sessions s
    where s.practitioner_id = new.practitioner_id
      and s.member_id       = new.member_id
      and s.scheduled_at    = v_lookup_time
  ) then
    update public.sessions s set
      scheduled_at        = new.start_time,
      duration_minutes    = v_duration,
      status              = v_status,
      payment_status      = new.payment_status::text,
      session_format      = v_format::session_format,
      session_type        = v_type::session_type,
      cancellation_reason = new.cancellation_reason,
      updated_at          = now()
    where s.practitioner_id = new.practitioner_id
      and s.member_id       = new.member_id
      and s.scheduled_at    = v_lookup_time;
  else
    insert into public.sessions (
      practitioner_id, member_id, session_type, session_format,
      scheduled_at, duration_minutes, status, payment_status,
      member_confirmed, cancellation_reason
    ) values (
      new.practitioner_id, new.member_id,
      v_type::session_type,
      v_format::session_format,
      new.start_time,
      v_duration,
      v_status,
      new.payment_status::text,
      true,
      new.cancellation_reason
    );
  end if;

  return new;
end;
$$;

-- ─── 3. Trigger ───────────────────────────────────────────────────────

drop trigger if exists trg_bookings_sync_session on public.bookings;
create trigger trg_bookings_sync_session
  after insert or update on public.bookings
  for each row
  execute function public.sync_session_from_booking();

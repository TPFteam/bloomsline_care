-- Conversation thread on a shared moment. Mirrors
-- story_share_comments but keyed directly by moment_id since moments
-- don't have a separate "share" row (sharing is a column on moments
-- itself — see 20260523_moment_share_to_practitioner.sql).

create table if not exists moment_comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references moments(id) on delete cascade,
  author_id uuid not null,
  author_type text not null check (author_type in ('practitioner', 'member')),
  content text not null,
  created_at timestamptz default now()
);

create index if not exists idx_moment_comments_moment_created
  on moment_comments (moment_id, created_at);

alter table moment_comments enable row level security;

-- A user can read comments on a moment they own, OR on a moment that
-- has been shared with them as the practitioner.
drop policy if exists "Can view moment comments" on moment_comments;
create policy "Can view moment comments"
  on moment_comments for select
  to authenticated
  using (
    exists (
      select 1 from moments m
      where m.id = moment_comments.moment_id
        and (
          m.user_id = auth.uid()
          or (
            m.shared_with_practitioner_at is not null
            and exists (
              select 1 from members
              where members.user_id = m.user_id
                and members.practitioner_id = auth.uid()
            )
          )
        )
    )
  );

-- Same trust check on insert, plus author_id must be the caller so
-- nobody can spoof comments under another user's name.
drop policy if exists "Can post moment comments" on moment_comments;
create policy "Can post moment comments"
  on moment_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from moments m
      where m.id = moment_comments.moment_id
        and (
          m.user_id = auth.uid()
          or (
            m.shared_with_practitioner_at is not null
            and exists (
              select 1 from members
              where members.user_id = m.user_id
                and members.practitioner_id = auth.uid()
            )
          )
        )
    )
  );

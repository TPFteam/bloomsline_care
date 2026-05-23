-- Patient can share an individual moment with their practitioner.
-- Mirrors story_shares conceptually but kept on the moments row itself
-- since one moment can only be shared with the patient's single
-- practitioner (a separate join table would be over-engineering).

alter table moments
  add column if not exists shared_with_practitioner_at timestamptz;

-- Partial index — only the shared moments matter for the practitioner
-- side query (where shared_with_practitioner_at is not null order by it
-- desc). Patient-side queries don't filter on this column.
create index if not exists idx_moments_user_shared_at
  on moments (user_id, shared_with_practitioner_at desc)
  where shared_with_practitioner_at is not null;

-- Practitioner can read a shared moment when the moment's author is
-- a member assigned to them. The existing "Users can view own moments"
-- policy stays untouched so patients still see their own moments.
drop policy if exists "Practitioners can view shared moments" on moments;
create policy "Practitioners can view shared moments"
  on moments for select
  to authenticated
  using (
    shared_with_practitioner_at is not null
    and exists (
      select 1 from members
      where members.user_id = moments.user_id
        and members.practitioner_id = auth.uid()
    )
  );

-- Patient can also read moment_media for their own moments (already
-- covered); practitioners need to read moment_media rows belonging to
-- shared moments so the Moments tab can render multi-media items.
drop policy if exists "Practitioners can view media of shared moments" on moment_media;
create policy "Practitioners can view media of shared moments"
  on moment_media for select
  to authenticated
  using (
    exists (
      select 1 from moments m
      join members on members.user_id = m.user_id
      where m.id = moment_media.moment_id
        and m.shared_with_practitioner_at is not null
        and members.practitioner_id = auth.uid()
    )
  );

-- Storage: the existing "Authorized users can read moments-media"
-- policy already lets a practitioner read a patient's moment files when
-- that patient has shared ANY story (trust-path piggybacked on
-- story_shares). When the patient has only shared moments (no stories),
-- the practitioner still needs read access — this policy adds the
-- moment-specific trust path. Paths are `{user_id}/{moment_id}/file`.
drop policy if exists "Practitioners can read media for shared moments" on storage.objects;
create policy "Practitioners can read media for shared moments"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'moments_media'
    and exists (
      select 1 from public.moments m
      join public.members mem on mem.user_id = m.user_id
      where mem.practitioner_id = auth.uid()
        and m.shared_with_practitioner_at is not null
        and (storage.foldername(name))[1] = m.user_id::text
        and (storage.foldername(name))[2] = m.id::text
    )
  );

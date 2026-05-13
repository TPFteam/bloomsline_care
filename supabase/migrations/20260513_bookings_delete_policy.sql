-- Practitioner DELETE on bookings was implicitly denied by RLS because
-- the table had SELECT / INSERT / UPDATE policies but no DELETE policy.
-- Result: `.delete()` returned no error but matched 0 rows, so the UI
-- optimistically removed the booking and the row reappeared on refresh.
--
-- Mirrors the existing `Practitioners can update own bookings` policy
-- (same scope: rows where the practitioner owns the booking).

create policy "Practitioners can delete own bookings"
  on public.bookings
  for delete
  using (auth.uid() = practitioner_id);

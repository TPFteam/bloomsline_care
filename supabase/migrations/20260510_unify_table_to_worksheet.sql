-- ─────────────────────────────────────────────────────────────────────
-- Unify resource type: 'table' → 'worksheet'
--
-- We no longer surface a separate 'table' resource type — a table
-- with patient prompts is a worksheet in spirit, and clinicians
-- don't think in sub-types. The two storage-level types are now:
--   * 'psychoeducation' — purely reading content
--   * 'worksheet'       — anything interactive (includes tables)
--
-- The creator code paths (worksheet & table) now both write
-- type='worksheet', so this migration only retypes the historical
-- rows already saved as 'table' in production / staging.
--
-- Non-destructive: only the `type` column is touched, nothing else.
-- Idempotent: re-runs are no-ops because the WHERE clause no longer
-- matches anything after the first successful run.
-- ─────────────────────────────────────────────────────────────────────

-- 1. Preview what will change (paste this alone first to confirm scope).
--    Comment out the UPDATE below until you're happy with the count.
select count(*) as resources_to_retype
from public.resources
where type = 'table';

-- 2. Do the retype.
update public.resources
set    type = 'worksheet'
where  type = 'table';

-- 3. Verify nothing is still on the old type.
select count(*) as still_typed_table
from public.resources
where type = 'table';
-- Expect: 0

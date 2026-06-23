-- ============================================================================
-- Remove the affirmations feature: drop its tables.
-- ============================================================================
-- The standalone "A few words" affirmations flow (mobile screen + care
-- /api/affirmations) has been removed from both repos. These are the only two
-- tables it used. IRREVERSIBLE — run only when you're sure.
--
-- Not touched: `moments` (shared), and the `affirmation` resource block type
-- (lives in resource JSON, no table). The pull-to-refresh affirmation line
-- uses a local in-code bank, no table.
--
-- Row counts at removal time: affirmation_favorites = 2, affirmation_history = 7.
-- ============================================================================

drop table if exists affirmation_favorites cascade;
drop table if exists affirmation_history cascade;

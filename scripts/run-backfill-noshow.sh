#!/usr/bin/env bash
# Wrapper for backfill-noshow-status.ts — reclassify historical no-shows
# that were stored as `cancelled` back to `no_show`.
#
# Usage:
#   bash scripts/run-backfill-noshow.sh           # DRY RUN (read-only)
#   bash scripts/run-backfill-noshow.sh --apply   # actually update rows

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found in $(pwd)"
  exit 1
fi

get_var() {
  local key="$1"
  grep "^${key}=" .env.local 2>/dev/null | head -1 | cut -d= -f2- || true
}

SUPABASE_URL="$(get_var NEXT_PUBLIC_SUPABASE_URL)"
[ -z "${SUPABASE_URL:-}" ] && SUPABASE_URL="$(get_var SUPABASE_URL)"
SUPABASE_SERVICE_ROLE_KEY="$(get_var SUPABASE_SERVICE_ROLE_KEY)"

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  exit 1
fi

export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY

exec npx tsx scripts/backfill-noshow-status.ts "$@"

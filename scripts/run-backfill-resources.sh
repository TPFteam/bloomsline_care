#!/usr/bin/env bash
# Convenience wrapper for backfill-resource-urls.ts.
#
# Usage:
#   bash scripts/run-backfill-resources.sh           # dry-run
#   bash scripts/run-backfill-resources.sh --apply   # write changes

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found in $(pwd)"
  exit 1
fi

SUPABASE_URL="$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-)"
SUPABASE_SERVICE_ROLE_KEY="$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2-)"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  exit 1
fi

export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY

exec npx tsx scripts/backfill-resource-urls.ts "$@"

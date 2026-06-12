#!/usr/bin/env bash
# Read-only audit of legacy History-card data. Reads Supabase URL + service-role
# key from .env.local. Writes nothing.
#
#   bash scripts/run-audit-history.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then echo "Error: .env.local not found in $(pwd)"; exit 1; fi
get_var() { grep "^${1}=" .env.local 2>/dev/null | head -1 | cut -d= -f2- || true; }

SUPABASE_URL="$(get_var NEXT_PUBLIC_SUPABASE_URL)"
SUPABASE_SERVICE_ROLE_KEY="$(get_var SUPABASE_SERVICE_ROLE_KEY)"
if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local"; exit 1
fi
export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY
exec npx tsx scripts/audit-history-data.ts "$@"

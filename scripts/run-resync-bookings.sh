#!/usr/bin/env bash
# Convenience wrapper for resync-bookings.ts.
#
# Usage:
#   bash scripts/run-resync-bookings.sh <booking-id> [<booking-id> ...]
#
# Reads SUPABASE_URL, service-role key, encryption key, and Google OAuth
# credentials from .env.local so the script can talk to Supabase as
# service role, decrypt stored tokens, and refresh expired access tokens.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found in $(pwd)"
  exit 1
fi

get_var() {
  local key="$1"
  grep "^${key}=" .env.local | head -1 | cut -d= -f2-
}

SUPABASE_URL="$(get_var NEXT_PUBLIC_SUPABASE_URL)"
SUPABASE_SERVICE_ROLE_KEY="$(get_var SUPABASE_SERVICE_ROLE_KEY)"
TOKEN_ENCRYPTION_KEY="$(get_var TOKEN_ENCRYPTION_KEY)"
GOOGLE_CLIENT_ID="$(get_var GOOGLE_CALENDAR_CLIENT_ID)"
GOOGLE_CLIENT_SECRET="$(get_var GOOGLE_CALENDAR_CLIENT_SECRET)"
# Fallbacks for older naming.
[ -z "${GOOGLE_CLIENT_ID:-}" ] && GOOGLE_CLIENT_ID="$(get_var GOOGLE_CLIENT_ID)"
[ -z "${GOOGLE_CLIENT_SECRET:-}" ] && GOOGLE_CLIENT_SECRET="$(get_var GOOGLE_CLIENT_SECRET)"
NEXT_PUBLIC_APP_URL="$(get_var NEXT_PUBLIC_APP_URL)"

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env.local"
  exit 1
fi
if [ -z "${TOKEN_ENCRYPTION_KEY:-}" ]; then
  echo "Error: TOKEN_ENCRYPTION_KEY not set in .env.local (needed to decrypt stored Google tokens)"
  exit 1
fi
if [ -z "${GOOGLE_CLIENT_ID:-}" ] || [ -z "${GOOGLE_CLIENT_SECRET:-}" ]; then
  echo "Error: GOOGLE_CALENDAR_CLIENT_ID/_SECRET not set in .env.local"
  exit 1
fi

export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY TOKEN_ENCRYPTION_KEY
export GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_CALENDAR_CLIENT_ID="$GOOGLE_CLIENT_ID" GOOGLE_CALENDAR_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET"
export NEXT_PUBLIC_APP_URL

exec npx tsx scripts/resync-bookings.ts "$@"

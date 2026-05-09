# Security Hardening — Open Items

Punch list for the remaining security work. Picks up where the May 2026
audit left off. Items are listed in priority order; each entry has effort,
risk, and a note on why it matters for investor due diligence.

---

## Action items pending in production

These are *already in code/main* but not yet applied to the live system.
Run them before treating the prior items as "done in prod."

- [ ] **Apply `supabase/migrations/20260509_lock_story_moments_buckets.sql`
      again** — it was extended with an anon-SELECT policy for files
      referenced by published stories. The version live in prod predates
      that policy. Migration is now idempotent (DROP IF EXISTS before each
      CREATE), so a re-run is safe.
- [ ] **Apply `supabase/migrations/20260509_storage_validation.sql`** —
      single `UPDATE storage.buckets` that adds a 50MB cap and MIME
      allowlist to `story-media`. Idempotent.

---

## High priority

### 1. SSL certificate pinning (mobile native only)

Pins the Supabase TLS certificate inside the iOS / Android app builds. A
network attacker who managed to install a rogue CA on the device (corp
MDM, malicious profile, compromised public Wi-Fi with a captive portal)
can today still MITM Supabase traffic. Pinning blocks that — the app
refuses to talk to anyone presenting the wrong leaf/intermediate cert
even if it chains to a "trusted" CA.

**Why now-or-soon:** It's the single most-cited mobile-security control in
HIPAA/SOC-2 audits. "Yes, we pin our certs" is a one-line answer that
saves a multi-page back-and-forth during diligence.

**Why it's been deferred:** Highest blast radius of anything left.
Wrong pins → app refuses every request on next launch → bricked until
you ship a new build. Mitigations exist (multi-pin, expiration safety
valves) but the implementation needs careful staging.

**Effort:** ~2 hours.

**Implementation outline (already drafted in the plan file):**

- New files:
  - `plugins/ssl-pinning.js` — Expo config plugin
  - `assets/certs/supabase-pins.json` — SHA-256 SPKI hashes
- Modify:
  - `app.json` — add plugin reference
- iOS: plugin writes `NSPinnedDomains` into Info.plist (iOS 14+).
- Android: plugin generates `network_security_config.xml` with `<pin-set>`.
- Web/PWA: skipped — browsers do their own cert validation.

**Pin strategy:**
- Pin **3** certs: leaf, intermediate CA, *and* a backup from a different
  CA (so a single CA outage doesn't take the app offline).
- Android: `<pin-set expiration="...">` set 6 months out as the safety
  valve. After expiration, pinning is bypassed and TLS falls back to
  system CAs — preserves availability if a pin update gets missed.
- Before each app store release, verify pins with
  `openssl s_client -showcerts -connect <project>.supabase.co:443`.

**Test plan:**
1. Build with correct pins → all auth flows work on iOS + Android.
2. Build with one *deliberately wrong* pin (still 2 valid) → all flows
   still work (proves pin redundancy).
3. Build with all *wrong* pins → app fails to connect (proves pinning is
   actually active and not silently no-op'd).

---

## Medium priority

### 2. Magic-byte file-type validation (Edge Function)

The bucket-level `allowed_mime_types` check we shipped only validates the
*declared* `Content-Type` — a determined client can still upload a `.exe`
labelled `image/jpeg`. The complete fix is server-side magic-byte
sniffing: read the first ~16 bytes of every uploaded object, compare to
known-good signatures, and delete the file if the bytes don't match the
declared type.

**Implementation:** Supabase Storage triggers via Edge Function (TS
runtime). Subscribe to `storage.objects` insert events, fetch the head
of each new object, run a `file-type`-style check, delete on mismatch.

**Why it's medium-not-high:** the bucket allowlist already blocks the
trivial path (curl with `-H 'Content-Type: application/octet-stream'`).
Magic-byte sniffing closes the "lying client" gap, which requires a
sophisticated attacker to weaponize. Worth doing, not urgent.

**Effort:** ~3 hours (new Edge Function + deploy pipeline + RLS for
the function's deletes).

### 3. Tighten signed-URL TTLs

Today, upload code mints **1-year** signed URLs alongside path columns
(stored in the legacy `media_url` field for the migration window). Once
the render path is fully on `useSignedUrl` (signing on every view), those
1-year URLs are dead weight — and they're long-lived capability tokens
that can't be revoked.

**Action:** drop TTL on new uploads from `60 * 60 * 24 * 365` → e.g.
`60 * 60 * 24 * 7` (1 week) so any URL that leaks to logs or shoulder-
surfing has a tight lifetime. Eventually drop the URL column entirely.

**Effort:** ~30 min.

**Affected files:** `bloomsline_mobile/lib/services/moments.ts`,
`bloomsline_care/src/lib/services/moments.ts`,
`bloomsline_mobile/app/(main)/stories.tsx`,
`bloomsline_care/src/components/story/block-editor.tsx`.

### 4. Audio duration enforcement (server-side)

Voice-note moments have no server-side duration cap. A patient (or
attacker with a stolen token) could upload a 6-hour audio file and we'd
store + transcribe it. Add a hard cap (e.g. 5 minutes) checked at insert
time.

**Implementation:** Postgres CHECK constraint on
`moments.duration_seconds` and `moment_media.duration_seconds`.

**Effort:** ~15 min.

### 5. AsyncStorage member-ID rotation

The mobile app caches the active member ID in AsyncStorage so the home
screen renders instantly on cold start. AsyncStorage on Android is
plain-text accessible by other apps with root or via adb backup. Cached
member-ID by itself isn't a high-value secret — it's a UUID — but it
does identify a Bloomsline user to anyone reading the device.

**Action:** move the cached ID into Expo SecureStore (same hardware-
backed bucket the auth token already lives in). Trivial swap.

**Effort:** ~15 min.

### 6. PostHog autocapture text masking (care app)

Care app PostHog has `autocapture: true`, which captures the text of
elements clicked. The `sanitize_properties` hook we added redacts known
PII keys, but it doesn't strip free-text DOM content. Practitioners
reading a member's journal entry could have the journal text slip into
PostHog as the click target.

**Action:** add `data-ph-no-capture` to:
- Member-content rendering components (notes, journal entries, story
  text, moment captions).
- Free-text form inputs.

**Effort:** ~45 min — tedious but mechanical.

### 7. Dead-code cleanup: password auth in mobile

`bloomsline_mobile/lib/auth-context.tsx` still exposes `signIn` (email +
password) and `signUp` even though no UI calls them. Dead auth surfaces
are an audit smell. Either remove them or wire them up to a UI route.

**Effort:** ~10 min if removing.

---

## Already shipped (don't redo)

For reference — these are completed and live:

- ✅ Storage migration to path-based + render-time signed URLs (Option C)
- ✅ Bucket lockdown (story-media + moments_media → private)
- ✅ Backfill of existing rows into `media_path` / `media_paths`
- ✅ Anon SELECT policy carve-out for published stories (in code; needs
      re-apply per "Action items pending" above)
- ✅ DOCX XSS, resource description XSS, story_shares RLS hardening
- ✅ Webhook signature auth on Google Calendar callbacks
- ✅ OAuth CSRF state parameter
- ✅ Separate `resource-responses` bucket for patient submissions
- ✅ Error boundaries (mobile + care) with PostHog + Sentry capture
- ✅ Session inactivity timeout (1hr care, 2-day mobile)
- ✅ Secure web-token storage (sessionStorage + in-memory adapter)
- ✅ Strict CSP on PWA + non-inline PostHog bootstrap
- ✅ Bucket-level MIME allowlist + 50MB cap on `story-media`
- ✅ PII scrubbing on Sentry (mobile) and PostHog (both apps)

---

## Reference

- Original plan file: `~/.claude/plans/sparkling-squishing-wall.md`
- Backfill script: `scripts/backfill-storage-paths.ts`
  (run via `bash scripts/run-backfill.sh [--apply]`)
- Storage path hook: `src/hooks/use-signed-storage-url.ts` (care),
  `lib/hooks/useSignedUrl.ts` (mobile)

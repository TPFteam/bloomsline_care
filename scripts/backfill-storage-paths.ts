/**
 * One-time backfill: extract storage paths from existing URL columns and
 * write them into the new path columns on `moments`, `moment_media`, and
 * `stories`. Part of the expand-contract migration off public/long-lived
 * signed URLs and onto path-based + render-time signed URLs.
 *
 * What this populates:
 *   - moments.media_path        ← extracted from moments.media_url
 *   - moments.thumbnail_path    ← extracted from moments.thumbnail_url
 *   - moment_media.media_path   ← extracted from moment_media.media_url
 *   - stories.media_paths       ← extracted from stories.media_urls AND
 *                                 from any URLs embedded inside
 *                                 stories.content blocks
 *
 * Idempotent:
 *   - Skips rows whose path columns are already non-empty.
 *   - Re-runnable on partially-migrated data.
 *
 * Order of operations (overall migration):
 *   1. Apply 20260509_add_media_path_columns.sql                        (DONE)
 *   2. Deploy code that writes path on upload + reads path on render   (THIS PR)
 *   3. Run this script:
 *        SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=... \
 *          npx tsx scripts/backfill-storage-paths.ts        # dry-run
 *        SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=... \
 *          npx tsx scripts/backfill-storage-paths.ts --apply
 *   4. Apply 20260509_lock_story_moments_buckets.sql to flip the
 *      buckets private. Renderers re-sign via path on every load —
 *      no URLs need to be rewritten.
 *   5. (Later) drop media_url / thumbnail_url / media_urls columns
 *      once nothing reads them.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.argv.includes('--apply')

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Matches both /object/public/{bucket}/{path} and /object/sign/{bucket}/{path}
const URL_PATTERN = /\/storage\/v1\/object\/(?:public|sign)\/(moments_media|story-media)\/([^?#]+)/

function extractPath(input: unknown, expectedBucket: 'moments_media' | 'story-media'): string | null {
  if (typeof input !== 'string') return null
  const m = input.match(URL_PATTERN)
  if (!m) return null
  if (m[1] !== expectedBucket) return null
  try { return decodeURIComponent(m[2]) } catch { return m[2] }
}

/** Walk a JSON value and collect every storage path that lives in story-media URLs. */
function collectStoryPathsDeep(input: unknown): string[] {
  const out = new Set<string>()
  const walk = (val: unknown) => {
    if (typeof val === 'string') {
      const path = extractPath(val, 'story-media')
      if (path) out.add(path)
    } else if (Array.isArray(val)) {
      for (const v of val) walk(v)
    } else if (val && typeof val === 'object') {
      for (const v of Object.values(val as Record<string, unknown>)) walk(v)
    }
  }
  walk(input)
  return Array.from(out)
}

let scanned = 0
let updated = 0
let skipped = 0

async function backfillMoments() {
  console.log('\n=== moments ===')
  const PAGE = 500
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('moments')
      .select('id, media_url, media_path, thumbnail_url, thumbnail_path')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)
    if (error) {
      console.error(`  [error] ${error.message}`)
      return
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      scanned++
      const update: Record<string, unknown> = {}
      if (!row.media_path && row.media_url) {
        const p = extractPath(row.media_url, 'moments_media')
        if (p) update.media_path = p
      }
      if (!row.thumbnail_path && row.thumbnail_url) {
        const p = extractPath(row.thumbnail_url, 'moments_media')
        if (p) update.thumbnail_path = p
      }
      if (Object.keys(update).length === 0) { skipped++; continue }

      console.log(`  moments#${row.id} ← ${Object.keys(update).join(', ')} ${APPLY ? '' : '(dry-run)'}`)
      if (APPLY) {
        const { error: upErr } = await supabase.from('moments').update(update).eq('id', row.id)
        if (upErr) console.error(`  [error] update moments#${row.id}: ${upErr.message}`)
        else updated++
      }
    }
    if (data.length < PAGE) break
    offset += PAGE
  }
}

async function backfillMomentMedia() {
  console.log('\n=== moment_media ===')
  const PAGE = 500
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('moment_media')
      .select('id, media_url, media_path')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)
    if (error) {
      console.error(`  [error] ${error.message}`)
      return
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      scanned++
      if (row.media_path || !row.media_url) { skipped++; continue }
      const p = extractPath(row.media_url, 'moments_media')
      if (!p) { skipped++; continue }

      console.log(`  moment_media#${row.id} ← media_path ${APPLY ? '' : '(dry-run)'}`)
      if (APPLY) {
        const { error: upErr } = await supabase.from('moment_media').update({ media_path: p }).eq('id', row.id)
        if (upErr) console.error(`  [error] update moment_media#${row.id}: ${upErr.message}`)
        else updated++
      }
    }
    if (data.length < PAGE) break
    offset += PAGE
  }
}

async function backfillStories() {
  console.log('\n=== stories ===')
  const PAGE = 200
  let offset = 0
  while (true) {
    const { data, error } = await supabase
      .from('stories')
      .select('id, content, media_urls, media_paths')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)
    if (error) {
      console.error(`  [error] ${error.message}`)
      return
    }
    if (!data || data.length === 0) break

    for (const row of data as Array<{ id: string; content: unknown; media_urls: unknown; media_paths: unknown }>) {
      scanned++
      const existing: string[] = Array.isArray(row.media_paths) ? row.media_paths.filter(p => typeof p === 'string') : []
      if (existing.length > 0) { skipped++; continue }

      // Collect paths from BOTH the legacy media_urls column and any URLs
      // embedded inside the content blocks (block.content.items[].url).
      const fromMediaUrls = collectStoryPathsDeep(row.media_urls)
      const fromContent = collectStoryPathsDeep(row.content)
      const all = Array.from(new Set([...fromMediaUrls, ...fromContent]))
      if (all.length === 0) { skipped++; continue }

      console.log(`  stories#${row.id} ← media_paths (${all.length}) ${APPLY ? '' : '(dry-run)'}`)
      if (APPLY) {
        const { error: upErr } = await supabase.from('stories').update({ media_paths: all }).eq('id', row.id)
        if (upErr) console.error(`  [error] update stories#${row.id}: ${upErr.message}`)
        else updated++
      }
    }
    if (data.length < PAGE) break
    offset += PAGE
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY-RUN (no writes)'}`)
  await backfillMoments()
  await backfillMomentMedia()
  await backfillStories()
  console.log(`\n=== Summary ===`)
  console.log(`Rows scanned: ${scanned}`)
  console.log(`Rows updated: ${updated}`)
  console.log(`Rows skipped: ${skipped}`)
  if (!APPLY) {
    console.log(`\nDry-run complete. Re-run with --apply to write changes.`)
  } else {
    console.log(`\nNext: apply 20260509_lock_story_moments_buckets.sql to flip the buckets private.`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

/**
 * One-time migration: rewrite public URLs in `moments` and `stories` rows
 * into signed URLs, before the bucket-locking migration flips both buckets
 * to private.
 *
 * Why: `story-media` and `moments_media` buckets ship with `public = true`
 * and a TO public SELECT policy. Migration `20260509_lock_story_moments_buckets.sql`
 * flips both private. Once that runs, every URL previously generated via
 * getPublicUrl() returns 403. To preserve all existing patient data
 * (moment images, journal photos, story media), this script re-signs each
 * stored URL while the buckets are still public.
 *
 * Order of operations:
 *   1. Deploy code (uploads now use createSignedUrl) — already shipped.
 *   2. Run THIS script with --apply   ← migrates URLs in DB.
 *   3. Apply 20260509_lock_story_moments_buckets.sql in Supabase.
 *   4. Bucket is locked, every saved URL still works.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *     npx tsx scripts/migrate-storage-urls-to-signed.ts        # dry-run
 *
 *   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx scripts/migrate-storage-urls-to-signed.ts --apply
 *
 * Idempotent: skips URLs already in `/object/sign/` form. Safe to re-run.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.argv.includes('--apply')
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 // 1 year

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const PUBLIC_URL_PATTERN = /\/storage\/v1\/object\/public\/(moments_media|story-media)\/([^?#]+)/

interface UrlMatch {
  bucket: 'moments_media' | 'story-media'
  path: string
  match: string
}

function findPublicUrls(input: unknown): UrlMatch[] {
  const matches: UrlMatch[] = []
  const seen = new Set<string>()
  const walk = (val: unknown) => {
    if (typeof val === 'string') {
      const m = val.match(PUBLIC_URL_PATTERN)
      if (m && !seen.has(m[0])) {
        seen.add(m[0])
        matches.push({
          bucket: m[1] as 'moments_media' | 'story-media',
          path: decodeURIComponent(m[2]),
          match: m[0],
        })
      }
    } else if (Array.isArray(val)) {
      for (const v of val) walk(v)
    } else if (val && typeof val === 'object') {
      for (const v of Object.values(val as Record<string, unknown>)) walk(v)
    }
  }
  walk(input)
  return matches
}

async function signOne(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    console.warn(`  [warn] sign failed: ${bucket}/${path} :: ${error?.message || 'no url'}`)
    return null
  }
  return data.signedUrl
}

/** Replace every public URL in any string field with its signed equivalent. */
function rewriteValueDeep(val: unknown, replacements: Map<string, string>): unknown {
  if (typeof val === 'string') {
    let out = val
    for (const [pub, signed] of replacements) {
      // Replace the public-URL substring; preserve any surrounding text the
      // app appended (rare, but safe).
      if (out.includes(pub)) out = out.split(pub).join(signed)
    }
    return out
  }
  if (Array.isArray(val)) return val.map(v => rewriteValueDeep(v, replacements))
  if (val && typeof val === 'object') {
    const next: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) next[k] = rewriteValueDeep(v, replacements)
    return next
  }
  return val
}

interface TableSpec {
  table: string
  columns: string[]
}

const TABLES: TableSpec[] = [
  { table: 'moments', columns: ['media_url', 'thumbnail_url'] },
  { table: 'stories', columns: ['content', 'media_urls'] },
]

let totalRowsScanned = 0
let totalRowsUpdated = 0
let totalUrlsConverted = 0
let totalSignFailures = 0

async function processTable(spec: TableSpec) {
  console.log(`\n=== ${spec.table} ===`)
  const selectCols = ['id', ...spec.columns].join(',')
  // Pull in 500-row pages to keep memory bounded.
  const PAGE = 500
  let offset = 0
  while (true) {
    const { data: rows, error } = await supabase
      .from(spec.table)
      .select(selectCols)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)
    if (error) {
      console.error(`  [error] select on ${spec.table}: ${error.message}`)
      return
    }
    if (!rows || rows.length === 0) break

    for (const row of rows as unknown as Array<Record<string, unknown>>) {
      totalRowsScanned++
      // Find every public URL across all watched columns
      const allMatches: UrlMatch[] = []
      for (const col of spec.columns) {
        allMatches.push(...findPublicUrls(row[col]))
      }
      if (allMatches.length === 0) continue

      // Sign them
      const replacements = new Map<string, string>()
      for (const m of allMatches) {
        if (replacements.has(m.match)) continue
        if (!APPLY) {
          replacements.set(m.match, `<would-sign:${m.bucket}/${m.path}>`)
          continue
        }
        const signed = await signOne(m.bucket, m.path)
        if (signed) {
          replacements.set(m.match, signed)
          totalUrlsConverted++
        } else {
          totalSignFailures++
        }
      }
      if (replacements.size === 0) continue

      // Build the update payload by rewriting each watched column
      const update: Record<string, unknown> = {}
      for (const col of spec.columns) {
        const original = row[col]
        const rewritten = rewriteValueDeep(original, replacements)
        // Compare via JSON to avoid accidentally rewriting unchanged columns
        if (JSON.stringify(rewritten) !== JSON.stringify(original)) {
          update[col] = rewritten
        }
      }
      if (Object.keys(update).length === 0) continue

      console.log(`  ${spec.table}#${row.id} -> ${allMatches.length} url(s) ${APPLY ? 'updated' : '(dry-run)'}`)
      if (APPLY) {
        const { error: upErr } = await supabase
          .from(spec.table)
          .update(update)
          .eq('id', row.id as string)
        if (upErr) {
          console.error(`  [error] update ${spec.table}#${row.id}: ${upErr.message}`)
          continue
        }
        totalRowsUpdated++
      }
    }

    if (rows.length < PAGE) break
    offset += PAGE
  }
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY-RUN (no writes)'}`)
  console.log(`Signed URL TTL: ${SIGNED_URL_TTL_SECONDS}s (~1 year)`)

  for (const spec of TABLES) {
    await processTable(spec)
  }

  console.log(`\n=== Summary ===`)
  console.log(`Rows scanned:        ${totalRowsScanned}`)
  console.log(`Rows updated:        ${totalRowsUpdated}`)
  console.log(`URLs converted:      ${totalUrlsConverted}`)
  console.log(`Sign failures:       ${totalSignFailures}`)
  if (!APPLY) {
    console.log(`\nDry-run complete. Re-run with --apply to write changes.`)
  } else {
    console.log(`\nDone. Now apply 20260509_lock_story_moments_buckets.sql in Supabase to flip the buckets to private.`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

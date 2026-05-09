/**
 * One-time fix: re-sign existing public URLs in `resources.blocks` that point
 * to the resource-media bucket.
 *
 * Why: 20260508_resource_security_hardening.sql flipped `resource-media` to
 * private, but the upload helpers kept calling `getPublicUrl()`. Every URL
 * stored in resources before today is shaped `/storage/v1/object/public/
 * resource-media/...` and now returns 400 Bad Request.
 *
 * This script walks `resources.blocks` (JSONB), extracts every storage path
 * embedded in a public URL, mints a 1-year signed URL, and rewrites the
 * block. Same approach as `migrate-storage-urls-to-signed.ts` but scoped
 * to the resource-media bucket and the resources table.
 *
 * Usage:
 *   bash scripts/run-backfill-resources.sh           # dry-run
 *   bash scripts/run-backfill-resources.sh --apply   # write changes
 *
 * Idempotent — already-signed URLs are skipped.
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

// Walk the entire JSON tree as a single string. Avoids any structural
// assumption about where the URL lives (mediaFile.url, settings.cover, a
// data-URI inside an HTML rich-text block, etc.) — if the substring is
// anywhere in the stringified blob, we'll find it.
const PUBLIC_URL_PATTERN = /https?:\/\/[^"'\s]+\/storage\/v1\/object\/public\/resource-media\/[^"'\s]+/g
const PATH_EXTRACT_RE = /\/storage\/v1\/object\/public\/resource-media\/([^?#"\s]+)/

interface UrlMatch {
  match: string
  path: string
}

function findPublicUrls(input: unknown): UrlMatch[] {
  const text = typeof input === 'string' ? input : JSON.stringify(input ?? null)
  const matches: UrlMatch[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  PUBLIC_URL_PATTERN.lastIndex = 0
  while ((m = PUBLIC_URL_PATTERN.exec(text)) !== null) {
    if (seen.has(m[0])) continue
    seen.add(m[0])
    const pm = m[0].match(PATH_EXTRACT_RE)
    if (!pm) continue
    let path = pm[1]
    try { path = decodeURIComponent(path) } catch { /* keep raw */ }
    matches.push({ match: m[0], path })
  }
  return matches
}

async function signOne(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('resource-media')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    console.warn(`  [warn] sign failed: ${path} :: ${error?.message || 'no url'}`)
    return null
  }
  return data.signedUrl
}

// Rewrite by stringify → string-replace → parse. Same robustness story as
// the URL finder: doesn't matter where in the tree the URL is, as long as
// it appears in the JSON text we'll swap it.
function rewriteValueDeep(val: unknown, replacements: Map<string, string>): unknown {
  if (replacements.size === 0) return val
  let text = typeof val === 'string' ? val : JSON.stringify(val ?? null)
  for (const [pub, signed] of replacements) {
    if (text.includes(pub)) text = text.split(pub).join(signed)
  }
  if (typeof val === 'string') return text
  try { return JSON.parse(text) } catch { return val }
}

let scanned = 0
let updated = 0
let signFailures = 0
let urlsConverted = 0

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY-RUN (no writes)'}`)
  const PAGE = 200
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, blocks')
      .order('id', { ascending: true })
      .range(offset, offset + PAGE - 1)
    if (error) {
      console.error(`[error] ${error.message}`)
      return
    }
    if (!data || data.length === 0) break

    for (const row of data as Array<{ id: string; title: string; blocks: unknown }>) {
      scanned++
      const matches = findPublicUrls(row.blocks)
      if (matches.length === 0) {
        // Diagnostic: show a tiny sample so we can confirm what arrived from
        // the DB. If the URL is in the data but the regex misses, we'll see
        // it here. If `blocks` is null/empty, the issue is upstream.
        const text = typeof row.blocks === 'string' ? row.blocks : JSON.stringify(row.blocks ?? null)
        const hasMagic = text.includes('resource-media')
        const sample = text.length > 160 ? text.slice(0, 160) + '…' : text
        console.log(`  resources#${row.id} (${row.title}) :: no matches | hasMagic=${hasMagic} | sample=${sample}`)
        continue
      }

      const replacements = new Map<string, string>()
      for (const m of matches) {
        if (replacements.has(m.match)) continue
        if (!APPLY) {
          replacements.set(m.match, `<would-sign:${m.path}>`)
          continue
        }
        const signed = await signOne(m.path)
        if (signed) {
          replacements.set(m.match, signed)
          urlsConverted++
        } else {
          signFailures++
        }
      }
      if (replacements.size === 0) continue

      const newBlocks = rewriteValueDeep(row.blocks, replacements)
      console.log(`  resources#${row.id} (${row.title}) -> ${matches.length} url(s) ${APPLY ? 'updated' : '(dry-run)'}`)
      if (APPLY) {
        const { error: upErr } = await supabase
          .from('resources')
          .update({ blocks: newBlocks })
          .eq('id', row.id)
        if (upErr) {
          console.error(`  [error] update resources#${row.id}: ${upErr.message}`)
        } else {
          updated++
        }
      }
    }
    if (data.length < PAGE) break
    offset += PAGE
  }

  console.log(`\n=== Summary ===`)
  console.log(`Resources scanned: ${scanned}`)
  console.log(`Resources updated: ${updated}`)
  console.log(`URLs converted:    ${urlsConverted}`)
  console.log(`Sign failures:     ${signFailures}`)
  if (!APPLY) {
    console.log(`\nDry-run complete. Re-run with --apply to write changes.`)
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

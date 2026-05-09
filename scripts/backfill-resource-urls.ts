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

const PUBLIC_URL_PATTERN = /\/storage\/v1\/object\/public\/resource-media\/([^?#"\s]+)/g

interface UrlMatch {
  match: string
  path: string
}

function findPublicUrls(input: unknown): UrlMatch[] {
  const matches: UrlMatch[] = []
  const seen = new Set<string>()
  const walk = (val: unknown) => {
    if (typeof val === 'string') {
      let m: RegExpExecArray | null
      const re = new RegExp(PUBLIC_URL_PATTERN.source, 'g')
      while ((m = re.exec(val)) !== null) {
        if (seen.has(m[0])) continue
        seen.add(m[0])
        let path = m[1]
        try { path = decodeURIComponent(path) } catch { /* keep raw */ }
        matches.push({ match: m[0], path })
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

function rewriteValueDeep(val: unknown, replacements: Map<string, string>): unknown {
  if (typeof val === 'string') {
    let out = val
    for (const [pub, signed] of replacements) {
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
      if (matches.length === 0) continue

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

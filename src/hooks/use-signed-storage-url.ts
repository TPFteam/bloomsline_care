'use client'

/**
 * Render-time signed URL hook for private storage buckets.
 *
 * Why: after Phase 1 of the storage migration, the DB stores paths (not
 * URLs). Render sites pass the path here and get back a fresh signed URL
 * minted by the Supabase client. Each call passes through storage RLS, so
 * access control happens at view time — perfect for revocable sharing.
 *
 * Caching: an in-memory Map keyed by `${bucket}:${path}` so the same image
 * appearing in multiple cards doesn't sign N times. Each cache entry has
 * a soft expiry (90 % of the URL TTL) at which point the next render
 * triggers a re-sign in the background. The hook itself only re-signs
 * when the cached URL is expired or absent.
 *
 * Robustness:
 *  - Accepts either a path (e.g. "user/file.jpg") OR a full URL (we
 *    extract the path with regex). This lets renderers blindly pass
 *    `media_path ?? media_url` without caring which one is set.
 *  - Returns null while loading and on errors. Callers should treat null
 *    as "show placeholder."
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser-client'

const DEFAULT_TTL_SECONDS = 60 * 60 // 1 hour
const CACHE_REFRESH_THRESHOLD = 0.9 // re-sign when 90% of TTL has elapsed

interface CacheEntry {
  url: string
  signedAt: number
  ttlSeconds: number
}

const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<string | null>>()

/** Extract the storage path out of a Supabase public/signed URL. */
function extractPath(value: string, bucket: string): string | null {
  // Match both /object/public/{bucket}/{path} and /object/sign/{bucket}/{path}
  const re = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/([^?#]+)`)
  const m = value.match(re)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

/** Normalise an arbitrary string into a storage path. */
function normaliseToPath(value: string, bucket: string): string | null {
  if (!value) return null
  // If it looks like a URL, try to pull the path out
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return extractPath(value, bucket)
  }
  // Otherwise treat as already-a-path
  return value
}

async function signOne(
  bucket: string,
  path: string,
  ttlSeconds: number,
): Promise<string | null> {
  const key = `${bucket}:${path}`
  // De-dupe simultaneous requests for the same path
  const existing = inflight.get(key)
  if (existing) return existing

  const promise = (async () => {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds)
    if (error || !data?.signedUrl) {
      console.warn('[useSignedUrl] sign failed', { bucket, path, err: error?.message })
      return null
    }
    cache.set(key, { url: data.signedUrl, signedAt: Date.now(), ttlSeconds })
    return data.signedUrl
  })()
  inflight.set(key, promise)
  promise.finally(() => inflight.delete(key))
  return promise
}

export function useSignedUrl(
  bucket: string,
  pathOrUrl: string | null | undefined,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string | null {
  const [signed, setSigned] = useState<string | null>(null)

  useEffect(() => {
    if (!pathOrUrl) {
      setSigned(null)
      return
    }
    const path = normaliseToPath(pathOrUrl, bucket)
    if (!path) {
      setSigned(null)
      return
    }
    const key = `${bucket}:${path}`

    // Cache hit and not yet expired → use it
    const hit = cache.get(key)
    if (hit && (Date.now() - hit.signedAt) < hit.ttlSeconds * 1000 * CACHE_REFRESH_THRESHOLD) {
      setSigned(hit.url)
      return
    }

    let cancelled = false
    signOne(bucket, path, ttlSeconds).then(url => {
      if (!cancelled) setSigned(url)
    })
    return () => { cancelled = true }
  }, [bucket, pathOrUrl, ttlSeconds])

  return signed
}

/** Bulk variant — sign N paths in parallel. Useful for grid views. */
export function useSignedUrls(
  bucket: string,
  pathsOrUrls: Array<string | null | undefined>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Array<string | null> {
  const [signed, setSigned] = useState<Array<string | null>>(() => pathsOrUrls.map(() => null))

  // Stable join key so we re-run only when the set of inputs changes
  const joined = pathsOrUrls.map(p => p || '').join('|')

  useEffect(() => {
    let cancelled = false
    const tasks = pathsOrUrls.map(async (input) => {
      if (!input) return null
      const path = normaliseToPath(input, bucket)
      if (!path) return null
      const key = `${bucket}:${path}`
      const hit = cache.get(key)
      if (hit && (Date.now() - hit.signedAt) < hit.ttlSeconds * 1000 * CACHE_REFRESH_THRESHOLD) {
        return hit.url
      }
      return signOne(bucket, path, ttlSeconds)
    })
    Promise.all(tasks).then(results => {
      if (!cancelled) setSigned(results)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, joined, ttlSeconds])

  return signed
}

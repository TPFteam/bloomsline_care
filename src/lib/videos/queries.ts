// Browser-side helpers for practitioner videos. These call our own care API
// routes (which own the admin-project service-role connection); they never talk
// to Supabase directly.
import type { PractitionerVideo, VideoInput } from '@/types/video'

export async function listMyVideos(): Promise<PractitionerVideo[]> {
  const res = await fetch('/api/videos', { cache: 'no-store' })
  if (!res.ok) return []
  const { videos } = await res.json()
  return (videos as PractitionerVideo[]) || []
}

export async function getMyVideo(id: string): Promise<PractitionerVideo | null> {
  const res = await fetch(`/api/videos/${id}`, { cache: 'no-store' })
  if (!res.ok) return null
  const { video } = await res.json()
  return (video as PractitionerVideo) || null
}

export async function createVideo(input: Partial<VideoInput>): Promise<{ id: string } | { error: string }> {
  const res = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: json.error || 'could_not_create' }
  return { id: json.id }
}

export async function updateVideo(id: string, input: Partial<VideoInput>): Promise<{ error?: string }> {
  const res = await fetch(`/api/videos/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_update' }
  return {}
}

export async function submitVideo(id: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/videos/${id}/submit`, { method: 'POST' })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_submit' }
  return {}
}

export async function deleteVideo(id: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_delete' }
  return {}
}

// Upload the file directly to admin storage using a signed upload URL, reporting
// progress. Returns the object path to persist on the row.
export async function uploadVideoFile(
  videoId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ path: string } | { error: string }> {
  const signRes = await fetch(`/api/videos/${videoId}/upload-url`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ filename: file.name }),
  })
  const sign = await signRes.json().catch(() => ({}))
  if (!signRes.ok || !sign.signedUrl) return { error: sign.error || 'could_not_sign' }

  const ok = await new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', sign.signedUrl)
    if (file.type) xhr.setRequestHeader('content-type', file.type)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
    xhr.onerror = () => resolve(false)
    xhr.send(file)
  })
  if (!ok) return { error: 'upload_failed' }
  return { path: sign.path }
}

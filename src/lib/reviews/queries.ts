// Browser-side helpers for practitioner reviews. These call our own care API
// routes (which own the admin-project service-role connection).
import type { PractitionerReview, ReviewInput } from '@/types/review'

export async function listMyReviews(): Promise<PractitionerReview[]> {
  const res = await fetch('/api/reviews', { cache: 'no-store' })
  if (!res.ok) return []
  const { reviews } = await res.json()
  return (reviews as PractitionerReview[]) || []
}

export async function createReview(input: ReviewInput): Promise<{ id: string } | { error: string }> {
  const res = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) return { error: json.error || 'could_not_create' }
  return { id: json.id }
}

export async function updateReview(id: string, input: Partial<ReviewInput>): Promise<{ error?: string }> {
  const res = await fetch(`/api/reviews/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_update' }
  return {}
}

export async function submitReview(id: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/reviews/${id}/submit`, { method: 'POST' })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_submit' }
  return {}
}

export async function deleteReview(id: string): Promise<{ error?: string }> {
  const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error || 'could_not_delete' }
  return {}
}

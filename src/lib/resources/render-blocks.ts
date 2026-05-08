/**
 * Pick the right block list to render a submission against.
 *
 * Why: a practitioner can edit a resource (add/remove/reorder blocks) AFTER
 * a patient has already submitted. If we render against the *live* blocks,
 * answers keyed by removed block IDs disappear, and re-ordering can scramble
 * which question goes with which answer.
 *
 * `resource_responses.resource_snapshot.blocks` (added in migration
 * 20251219) captures the resource as it was at submission time. Prefer
 * that. Fall back to live resource blocks for older submissions that
 * pre-date the snapshot column, or when the snapshot turned out to be
 * empty (defensive — shouldn't happen for new submissions).
 */
import type { ResourceBlock } from '@/types/resource'

/**
 * Shapes are intentionally `unknown` so this helper accepts any submission
 * row variant the codebase has (the snapshot column was added late and
 * different consumer types either include or omit it). We runtime-check
 * the snapshot before using it.
 */
export function getSubmissionBlocks(
  submission: unknown,
  liveResource: unknown,
): ResourceBlock[] {
  const snapshot =
    submission &&
    typeof submission === 'object' &&
    'resource_snapshot' in submission
      ? (submission as { resource_snapshot?: { blocks?: unknown } | null }).resource_snapshot?.blocks
      : undefined
  if (Array.isArray(snapshot) && snapshot.length > 0) {
    return snapshot as ResourceBlock[]
  }
  if (
    liveResource &&
    typeof liveResource === 'object' &&
    'blocks' in liveResource &&
    Array.isArray((liveResource as { blocks?: unknown }).blocks)
  ) {
    return (liveResource as { blocks: ResourceBlock[] }).blocks
  }
  return []
}

/**
 * Same idea for the resource's title — useful when the resource has been
 * deleted (resource_id SET NULL) and we still want to label the submission.
 */
export function getSubmissionTitle(
  submission: unknown,
  liveResource: unknown,
  fallback = 'Resource',
): string {
  const snap =
    submission &&
    typeof submission === 'object' &&
    'resource_snapshot' in submission
      ? (submission as { resource_snapshot?: { title?: unknown } | null }).resource_snapshot?.title
      : undefined
  if (typeof snap === 'string' && snap.trim()) return snap
  if (
    liveResource &&
    typeof liveResource === 'object' &&
    'title' in liveResource &&
    typeof (liveResource as { title?: unknown }).title === 'string'
  ) {
    return (liveResource as { title: string }).title
  }
  return fallback
}

/**
 * Derive a resource's `type` field from its blocks.
 *
 * Practitioners create a resource via the psychoeducation editor and then add
 * interactive question blocks. The result is a worksheet-shaped resource that
 * still wears the "psychoeducation" label in the library because the type was
 * locked in at creation time.
 *
 * `deriveResourceType()` looks at the actual block content and returns the
 * type that matches. Any interactive block flips the resource to `worksheet`;
 * if all blocks are reading content, we keep `psychoeducation`. The type
 * `exercise` and `table` are user-driven and not auto-derived — the editor
 * for those isn't shared with psychoeducation.
 */

import type { ResourceBlock, ResourceType } from '@/types/resource'

/**
 * Block types that turn a resource into a worksheet (require a patient
 * response). Mirrors the QUESTION_TYPES list used by the PDF exporter.
 */
const INTERACTIVE_BLOCK_TYPES = new Set<string>([
  'prompt',
  'multiple_choice',
  'yes_no',
  'checklist',
  'scale',
  'likert',
  'numeric',
  'slider',
  'matrix_rating',
  'mood',
  'date_picker',
  'time_input',
  'list_input',
  'table_exercise',
  'video_response',
  'audio_response',
  'file_response',
])

export function blocksContainInteractive(blocks: ResourceBlock[] | null | undefined): boolean {
  if (!blocks) return false
  return blocks.some(b => INTERACTIVE_BLOCK_TYPES.has(b.type))
}

/**
 * Pick the resource type that best matches the blocks.
 *
 *   - any interactive block ⇒ 'worksheet'
 *   - else ⇒ keep the original type (or fall back to 'psychoeducation')
 *
 * Pass `currentType` when updating an existing resource so we don't downgrade
 * an explicit `exercise` or `table` to `psychoeducation` just because its
 * blocks happen to be all reading.
 */
export function deriveResourceType(
  blocks: ResourceBlock[] | null | undefined,
  currentType?: ResourceType,
): ResourceType {
  if (blocksContainInteractive(blocks)) return 'worksheet'
  if (currentType && currentType !== 'psychoeducation' && currentType !== 'worksheet') {
    return currentType
  }
  return 'psychoeducation'
}

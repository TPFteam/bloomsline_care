import posthog from 'posthog-js'

/**
 * Track custom events in PostHog.
 * Safe to call even if PostHog isn't initialized — silently no-ops.
 */
export function track(event: string, properties?: Record<string, unknown>) {
  try {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture(event, properties)
    }
  } catch {
    // Silent fail
  }
}

// ─── Practitioner Events ────────────────────────────

export const analytics = {
  memberAdded: (props?: { total_count?: number }) =>
    track('member_added', props),

  resourceCreated: (props: { type: string; category?: string; title?: string }) =>
    track('resource_created', props),

  resourceShared: (props: { type: string; member_count: number; resource_id?: string }) =>
    track('resource_shared', props),

  resourceReminded: (props: { type: string; resource_id?: string }) =>
    track('resource_reminded', props),

  sessionNoteSaved: (props?: { word_count?: number; tag_count?: number }) =>
    track('session_note_saved', props),

  sessionScheduled: (props?: { format?: string; duration?: number }) =>
    track('session_scheduled', props),

  bloomBriefViewed: (props?: { member_id?: string }) =>
    track('bloom_brief_viewed', props),

  profileUpdated: (props?: { section?: string }) =>
    track('profile_updated', props),

  resourceSubmitted: (props: { type: string; resource_id?: string }) =>
    track('resource_submitted', props),

  submissionReviewed: (props?: { resource_id?: string }) =>
    track('submission_reviewed', props),

  resourceReopened: (props?: { resource_id?: string }) =>
    track('resource_reopened', props),
}

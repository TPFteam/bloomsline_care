import type { BlogStatus } from './blog'

// Videos share the exact workflow states as blogs.
export type VideoStatus = BlogStatus

export interface PractitionerVideo {
  id: string
  practitioner_id: string
  title: string
  description: string
  language: string
  storage_path: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
  status: VideoStatus
  review_note: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  // Added by the API when listing — short-lived signed URL for playback/preview.
  playback_url?: string | null
}

export interface VideoInput {
  title: string
  description: string
  language: string
  storage_path?: string | null
  thumbnail_url?: string | null
  duration_seconds?: number | null
}

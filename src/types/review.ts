import type { BlogStatus } from './blog'

// Reviews share the exact workflow states as blogs.
export type ReviewStatus = BlogStatus

export interface PractitionerReview {
  id: string
  practitioner_id: string
  rating: number | null
  content: string
  consent_publish: boolean
  status: ReviewStatus
  review_note: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ReviewInput {
  rating: number | null
  content: string
  consent_publish: boolean
}

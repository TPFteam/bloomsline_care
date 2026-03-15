import type {
  Specialty,
  TherapeuticApproach,
  AgeGroup,
  SessionType,
  ClientAcceptanceStatus,
  Education,
  License,
  Certification,
  PracticeLocation,
  SocialLinks,
  Publication,
} from './practitioner-profile'

export interface PublicPractitioner {
  id: string

  // Identity
  full_name: string
  avatar_url: string | null

  // Location
  city: string | null
  country: string | null

  // Professional
  headline: string | null
  bio: string | null
  credentials: string[]
  education: Education[]
  licenses: License[]
  certifications: Certification[]
  years_experience: number | null

  // Practice
  specialties: Specialty[]
  approaches: TherapeuticApproach[]
  age_groups: AgeGroup[]
  session_types: SessionType[]
  languages: string[]

  // Location
  practice_location: PracticeLocation | null
  offers_telehealth: boolean
  offers_in_person: boolean
  client_acceptance_status: ClientAcceptanceStatus

  // Fees
  show_fees: boolean
  session_fee_min: number | null
  session_fee_max: number | null
  fee_currency: string
  insurance_accepted: string[]
  offers_sliding_scale: boolean

  // Contact
  social_links: SocialLinks | null
  contact_email: string | null
  contact_phone: string | null

  // Publications
  publications: Publication[]

  // Visibility
  show_availability: boolean
  show_languages: boolean

  // Settings
  slug: string
  is_published: boolean

  // Account linking
  user_id: string | null
  linked_at: string | null

  // Meta
  created_by: string | null
  created_at: string
  updated_at: string
}

// Practitioner Profile Types

// ============================================
// ENUMS
// ============================================

export type TherapeuticApproach =
  | 'cbt' // Cognitive Behavioral Therapy
  | 'dbt' // Dialectical Behavior Therapy
  | 'emdr' // Eye Movement Desensitization and Reprocessing
  | 'psychodynamic'
  | 'humanistic'
  | 'solution_focused'
  | 'narrative'
  | 'mindfulness'
  | 'art_therapy'
  | 'play_therapy'
  | 'family_systems'
  | 'gestalt'
  | 'acceptance_commitment' // ACT
  | 'motivational_interviewing'
  | 'trauma_informed'
  | 'somatic'
  | 'other'

export type Specialty =
  | 'anxiety'
  | 'depression'
  | 'trauma_ptsd'
  | 'grief_loss'
  | 'relationships'
  | 'family'
  | 'couples'
  | 'stress'
  | 'self_esteem'
  | 'life_transitions'
  | 'career'
  | 'addiction'
  | 'eating_disorders'
  | 'ocd'
  | 'adhd'
  | 'autism'
  | 'bipolar'
  | 'personality_disorders'
  | 'anger_management'
  | 'parenting'
  | 'lgbtq'
  | 'cultural_identity'
  | 'spirituality'
  | 'chronic_illness'
  | 'sleep'
  | 'other'

export type AgeGroup =
  | 'children' // 0-12
  | 'adolescents' // 13-17
  | 'young_adults' // 18-25
  | 'adults' // 26-64
  | 'seniors' // 65+

export type SessionType =
  | 'individual'
  | 'couples'
  | 'family'
  | 'group'

export type ClientAcceptanceStatus =
  | 'accepting'
  | 'waitlist'
  | 'not_accepting'

// ============================================
// INTERFACES
// ============================================

export interface Education {
  id: string
  degree: string // e.g., "Ph.D. in Clinical Psychology"
  institution: string
  year_completed: number | null
}

export interface License {
  id: string
  type: string // e.g., "LMFT", "LPC", "LCSW"
  number: string | null
  state_province: string | null
  expiration_date: string | null
  is_verified: boolean
}

export interface Certification {
  id: string
  name: string // e.g., "EMDR Certified Therapist"
  issuing_body: string | null
  year_obtained: number | null
}

export interface PracticeLocation {
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state_province: string | null
  postal_code: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface Endorsement {
  id: string
  author_name: string
  author_title: string | null
  author_organization: string | null
  content: string
  created_at: string
}

export interface SocialLinks {
  website: string | null
  linkedin: string | null
  twitter: string | null
  instagram: string | null
}

// ============================================
// MAIN PROFILE INTERFACE
// ============================================

export interface PractitionerProfile {
  id: string
  user_id: string

  // Professional Identity
  headline: string | null // "Helping families navigate trauma with compassion"
  bio: string | null // Client-centered bio
  intro_video_url: string | null

  // Credentials
  credentials: string[] // ["LMFT", "Ph.D."]
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

  // Location & Availability
  practice_location: PracticeLocation | null
  offers_telehealth: boolean
  offers_in_person: boolean
  client_acceptance_status: ClientAcceptanceStatus

  // Fees & Insurance (optional display)
  show_fees: boolean
  session_fee_min: number | null
  session_fee_max: number | null
  fee_currency: string // default 'USD'
  insurance_accepted: string[]
  offers_sliding_scale: boolean

  // Social & Contact
  social_links: SocialLinks | null
  contact_email: string | null // public contact email (can differ from account email)
  contact_phone: string | null

  // Profile Settings
  slug: string // URL-friendly identifier for public profile
  is_public: boolean // whether profile is visible to others
  is_verified: boolean
  profile_completeness: number // 0-100

  // Stats (computed/cached)
  total_resources_published: number
  total_members_helped: number

  // Metadata
  created_at: string
  updated_at: string
}

// Profile with user info
export interface PractitionerProfileWithUser extends PractitionerProfile {
  user: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

// ============================================
// FORM TYPES
// ============================================

export interface CreatePractitionerProfileInput {
  headline?: string
  bio?: string
  credentials?: string[]
  specialties?: Specialty[]
  approaches?: TherapeuticApproach[]
  age_groups?: AgeGroup[]
  session_types?: SessionType[]
  languages?: string[]
  years_experience?: number
  offers_telehealth?: boolean
  offers_in_person?: boolean
  client_acceptance_status?: ClientAcceptanceStatus
}

export interface UpdatePractitionerProfileInput {
  headline?: string | null
  bio?: string | null
  intro_video_url?: string | null
  credentials?: string[]
  education?: Education[]
  licenses?: License[]
  certifications?: Certification[]
  years_experience?: number | null
  specialties?: Specialty[]
  approaches?: TherapeuticApproach[]
  age_groups?: AgeGroup[]
  session_types?: SessionType[]
  languages?: string[]
  practice_location?: PracticeLocation | null
  offers_telehealth?: boolean
  offers_in_person?: boolean
  client_acceptance_status?: ClientAcceptanceStatus
  show_fees?: boolean
  session_fee_min?: number | null
  session_fee_max?: number | null
  fee_currency?: string
  insurance_accepted?: string[]
  offers_sliding_scale?: boolean
  social_links?: SocialLinks | null
  contact_email?: string | null
  contact_phone?: string | null
  slug?: string
  is_public?: boolean
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSpecialtyLabel(specialty: Specialty, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<Specialty, { en: string; fr: string }> = {
    anxiety: { en: 'Anxiety', fr: 'Anxiété' },
    depression: { en: 'Depression', fr: 'Dépression' },
    trauma_ptsd: { en: 'Trauma & PTSD', fr: 'Traumatisme & TSPT' },
    grief_loss: { en: 'Grief & Loss', fr: 'Deuil & Perte' },
    relationships: { en: 'Relationships', fr: 'Relations' },
    family: { en: 'Family Issues', fr: 'Problèmes familiaux' },
    couples: { en: 'Couples Therapy', fr: 'Thérapie de couple' },
    stress: { en: 'Stress Management', fr: 'Gestion du stress' },
    self_esteem: { en: 'Self-Esteem', fr: 'Estime de soi' },
    life_transitions: { en: 'Life Transitions', fr: 'Transitions de vie' },
    career: { en: 'Career Counseling', fr: 'Orientation professionnelle' },
    addiction: { en: 'Addiction', fr: 'Dépendance' },
    eating_disorders: { en: 'Eating Disorders', fr: 'Troubles alimentaires' },
    ocd: { en: 'OCD', fr: 'TOC' },
    adhd: { en: 'ADHD', fr: 'TDAH' },
    autism: { en: 'Autism Spectrum', fr: 'Spectre autistique' },
    bipolar: { en: 'Bipolar Disorder', fr: 'Trouble bipolaire' },
    personality_disorders: { en: 'Personality Disorders', fr: 'Troubles de la personnalité' },
    anger_management: { en: 'Anger Management', fr: 'Gestion de la colère' },
    parenting: { en: 'Parenting', fr: 'Parentalité' },
    lgbtq: { en: 'LGBTQ+', fr: 'LGBTQ+' },
    cultural_identity: { en: 'Cultural Identity', fr: 'Identité culturelle' },
    spirituality: { en: 'Spirituality', fr: 'Spiritualité' },
    chronic_illness: { en: 'Chronic Illness', fr: 'Maladie chronique' },
    sleep: { en: 'Sleep Issues', fr: 'Troubles du sommeil' },
    other: { en: 'Other', fr: 'Autre' },
  }
  return labels[specialty]?.[locale] || specialty
}

export function getApproachLabel(approach: TherapeuticApproach, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<TherapeuticApproach, { en: string; fr: string }> = {
    cbt: { en: 'Cognitive Behavioral (CBT)', fr: 'Thérapie cognitivo-comportementale (TCC)' },
    dbt: { en: 'Dialectical Behavior (DBT)', fr: 'Thérapie comportementale dialectique' },
    emdr: { en: 'EMDR', fr: 'EMDR' },
    psychodynamic: { en: 'Psychodynamic', fr: 'Psychodynamique' },
    humanistic: { en: 'Humanistic', fr: 'Humaniste' },
    solution_focused: { en: 'Solution-Focused', fr: 'Axée sur les solutions' },
    narrative: { en: 'Narrative Therapy', fr: 'Thérapie narrative' },
    mindfulness: { en: 'Mindfulness-Based', fr: 'Basée sur la pleine conscience' },
    art_therapy: { en: 'Art Therapy', fr: 'Art-thérapie' },
    play_therapy: { en: 'Play Therapy', fr: 'Thérapie par le jeu' },
    family_systems: { en: 'Family Systems', fr: 'Systèmes familiaux' },
    gestalt: { en: 'Gestalt', fr: 'Gestalt' },
    acceptance_commitment: { en: 'Acceptance & Commitment (ACT)', fr: 'Acceptation et engagement (ACT)' },
    motivational_interviewing: { en: 'Motivational Interviewing', fr: 'Entretien motivationnel' },
    trauma_informed: { en: 'Trauma-Informed', fr: 'Sensible au traumatisme' },
    somatic: { en: 'Somatic', fr: 'Somatique' },
    other: { en: 'Other', fr: 'Autre' },
  }
  return labels[approach]?.[locale] || approach
}

export function getAgeGroupLabel(ageGroup: AgeGroup, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<AgeGroup, { en: string; fr: string }> = {
    children: { en: 'Children (0-12)', fr: 'Enfants (0-12)' },
    adolescents: { en: 'Adolescents (13-17)', fr: 'Adolescents (13-17)' },
    young_adults: { en: 'Young Adults (18-25)', fr: 'Jeunes adultes (18-25)' },
    adults: { en: 'Adults (26-64)', fr: 'Adultes (26-64)' },
    seniors: { en: 'Seniors (65+)', fr: 'Aînés (65+)' },
  }
  return labels[ageGroup]?.[locale] || ageGroup
}

export function getSessionTypeLabel(sessionType: SessionType, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<SessionType, { en: string; fr: string }> = {
    individual: { en: 'Individual', fr: 'Individuelle' },
    couples: { en: 'Couples', fr: 'Couple' },
    family: { en: 'Family', fr: 'Familiale' },
    group: { en: 'Group', fr: 'Groupe' },
  }
  return labels[sessionType]?.[locale] || sessionType
}

export function getClientAcceptanceLabel(status: ClientAcceptanceStatus, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<ClientAcceptanceStatus, { en: string; fr: string }> = {
    accepting: { en: 'Accepting New Clients', fr: 'Accepte de nouveaux clients' },
    waitlist: { en: 'Waitlist Only', fr: 'Liste d\'attente uniquement' },
    not_accepting: { en: 'Not Accepting New Clients', fr: 'N\'accepte pas de nouveaux clients' },
  }
  return labels[status]?.[locale] || status
}

export function calculateProfileCompleteness(profile: Partial<PractitionerProfile>): number {
  const weights = {
    headline: 10,
    bio: 15,
    credentials: 10,
    education: 10,
    licenses: 10,
    specialties: 10,
    approaches: 10,
    age_groups: 5,
    session_types: 5,
    years_experience: 5,
    practice_location: 5,
    contact_email: 5,
  }

  let score = 0
  let totalWeight = 0

  for (const [key, weight] of Object.entries(weights)) {
    totalWeight += weight
    const value = profile[key as keyof PractitionerProfile]

    if (value !== null && value !== undefined) {
      if (Array.isArray(value) && value.length > 0) {
        score += weight
      } else if (typeof value === 'string' && value.trim().length > 0) {
        score += weight
      } else if (typeof value === 'number' && value > 0) {
        score += weight
      } else if (typeof value === 'object' && Object.keys(value).length > 0) {
        score += weight
      }
    }
  }

  return Math.round((score / totalWeight) * 100)
}

export function generateSlug(fullName: string): string {
  return fullName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

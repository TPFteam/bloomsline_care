// Practitioner Profile Types

// ============================================
// ENUMS
// ============================================

export type TherapeuticApproach =
  // Therapeutic
  | 'cbt'
  | 'psychodynamic'
  | 'psychoanalysis'
  | 'integrative'
  | 'acceptance_commitment'
  | 'emdr'
  | 'systemic'
  | 'humanistic'
  | 'dbt'
  | 'solution_focused'
  // Coaching
  | 'professional_coaching'
  | 'life_coaching'
  | 'nlp'
  | 'emotional_intelligence'
  | 'mindfulness'
  | 'goal_oriented'
  | 'narrative'
  | 'other'

export type Specialty =
  | 'stress_anxiety'
  | 'confidence_esteem'
  | 'emotional_regulation'
  | 'relationships'
  | 'work_career'
  | 'burnout'
  | 'decision_making'
  | 'life_transitions'
  | 'nutrition'
  | 'grief_loss'
  | 'trauma'
  | 'parenting'
  | 'addiction'
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
  facebook: string | null
}

export type PublicationType = 'book' | 'podcast' | 'blog' | 'article' | 'video' | 'other'

export interface Publication {
  id: string
  type: PublicationType
  title: string
  description: string | null
  url: string
  image_url: string | null
}

// ============================================
// MAIN PROFILE INTERFACE
// ============================================

export interface PractitionerProfile {
  id: string
  user_id: string

  // Location
  city: string | null
  country: string | null
  address: string | null
  google_maps_url: string | null

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

  // Publications
  publications: Publication[]

  // Section Visibility
  show_availability: boolean
  show_languages: boolean

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

export function getSpecialtyLabel(specialty: Specialty, locale: string = 'en'): string {
  const labels: Record<Specialty, Record<string, string>> = {
    stress_anxiety: { en: 'Stress / Anxiety', fr: 'Stress / Anxiété' },
    confidence_esteem: { en: 'Confidence / Self-esteem', fr: 'Confiance / Estime' },
    emotional_regulation: { en: 'Emotional Regulation', fr: 'Gestion des émotions' },
    relationships: { en: 'Relationships', fr: 'Relations' },
    work_career: { en: 'Work / Career', fr: 'Travail / Carrière' },
    burnout: { en: 'Burnout', fr: 'Burn-out' },
    decision_making: { en: 'Decision-making', fr: 'Prise de décision' },
    life_transitions: { en: 'Life Transitions', fr: 'Transition de vie' },
    nutrition: { en: 'Nutrition', fr: 'Nutrition' },
    grief_loss: { en: 'Grief / Loss', fr: 'Deuil / Perte' },
    trauma: { en: 'Trauma', fr: 'Trauma' },
    parenting: { en: 'Parenting', fr: 'Parentalité' },
    addiction: { en: 'Addiction', fr: 'Addiction' },
    sleep: { en: 'Sleep Issues', fr: 'Troubles du sommeil' },
    other: { en: 'Other', fr: 'Autre' },
  }
  return labels[specialty]?.[locale] || specialty
}

export function getApproachLabel(approach: TherapeuticApproach, locale: string = 'en'): string {
  const labels: Record<TherapeuticApproach, Record<string, string>> = {
    // Therapeutic
    cbt: { en: 'Cognitive Behavioral (CBT)', fr: 'Cognitivo-comportementale (TCC)' },
    psychodynamic: { en: 'Psychodynamic / Analytical', fr: 'Psychodynamique / Analytique' },
    psychoanalysis: { en: 'Psychoanalysis', fr: 'Psychanalyse' },
    integrative: { en: 'Integrative', fr: 'Intégrative' },
    acceptance_commitment: { en: 'ACT', fr: 'ACT (Acceptation et engagement)' },
    emdr: { en: 'EMDR', fr: 'EMDR' },
    systemic: { en: 'Systemic', fr: 'Systémique' },
    humanistic: { en: 'Humanistic', fr: 'Humaniste' },
    dbt: { en: 'Dialectical Behavior (DBT)', fr: 'Thérapie comportementale dialectique (TCD)' },
    solution_focused: { en: 'Solution-Focused / Brief', fr: 'Thérapie brève / Orientée solutions' },
    // Coaching
    professional_coaching: { en: 'Professional Coaching', fr: 'Coaching professionnel' },
    life_coaching: { en: 'Life Coaching', fr: 'Coaching de vie' },
    nlp: { en: 'NLP', fr: 'PNL' },
    emotional_intelligence: { en: 'Emotional Intelligence', fr: 'Intelligence émotionnelle' },
    mindfulness: { en: 'Mindfulness', fr: 'Mindfulness' },
    goal_oriented: { en: 'Goal-Oriented Coaching', fr: 'Coaching orienté objectifs' },
    narrative: { en: 'Narrative', fr: 'Approche narrative' },
    other: { en: 'Other', fr: 'Autre' },
  }
  return labels[approach]?.[locale] || approach
}

export function getAgeGroupLabel(ageGroup: AgeGroup, locale: string = 'en'): string {
  const labels: Record<AgeGroup, Record<string, string>> = {
    children: { en: 'Children (0-12)', fr: 'Enfants (0-12)' },
    adolescents: { en: 'Adolescents (13-17)', fr: 'Adolescents (13-17)' },
    young_adults: { en: 'Young Adults (18-25)', fr: 'Jeunes adultes (18-25)' },
    adults: { en: 'Adults (26-64)', fr: 'Adultes (26-64)' },
    seniors: { en: 'Seniors (65+)', fr: 'Aînés (65+)' },
  }
  return labels[ageGroup]?.[locale] || ageGroup
}

export function getSessionTypeLabel(sessionType: SessionType, locale: string = 'en'): string {
  const labels: Record<SessionType, Record<string, string>> = {
    individual: { en: 'Individual', fr: 'Individuelle' },
    couples: { en: 'Couples', fr: 'Couple' },
    family: { en: 'Family', fr: 'Familiale' },
    group: { en: 'Group', fr: 'Groupe' },
  }
  return labels[sessionType]?.[locale] || sessionType
}

export function getClientAcceptanceLabel(status: ClientAcceptanceStatus, locale: string = 'en'): string {
  const labels: Record<ClientAcceptanceStatus, Record<string, string>> = {
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

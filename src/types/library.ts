// Digital Library Types

// ============================================
// ENUMS / TYPE DEFINITIONS
// ============================================

export type ResourceType =
  | 'assessment'      // Evaluation tools, questionnaires
  | 'activity'        // Interactive exercises, worksheets
  | 'ritual'          // Daily practices, routines
  | 'educational'     // Information sheets, guides
  | 'template'        // Session templates, forms

export type ResourceCategory =
  // Current taxonomy (kept in sync with `allCategories` in the resource creators)
  | 'emotions'
  | 'thoughts_beliefs'
  | 'self_compassion'
  | 'acceptance'
  | 'mindfulness'
  | 'self_identity'
  | 'stress_anxiety'
  | 'depression'
  | 'sleep'
  | 'mental_health_conditions'
  | 'trauma_violence'
  | 'grief'
  | 'relationships'
  | 'family_couple'
  | 'communication'
  | 'sexuality'
  | 'body_food'
  | 'addictions'
  | 'habits_actions'
  | 'discrimination'
  | 'life_transitions'
  | 'work_finances'
  // Legacy keys — retained so historical resources still render their
  // category label even after the taxonomy was reshaped. Do NOT add to
  // the picker; only used for back-compat reads.
  | 'emotional_regulation'
  | 'self_confidence'
  | 'self_esteem'
  | 'stress'
  | 'anxiety'
  | 'burnout'
  | 'decision_making'
  | 'behavior'
  | 'habits'
  | 'psychoeducation'
  | 'reflection'
  | 'action'
  | 'general'
  | 'coping_skills'
  | 'trauma'
  | 'children'
  | 'teens'
  | 'adults'
  | 'couples'
  | 'family'

export type AgeGroup = 'children' | 'teens' | 'adults' | 'all'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

// ============================================
// INTERFACES
// ============================================

export interface LibraryResource {
  id: string

  // Basic Info
  title: string
  description: string
  type: ResourceType
  category: ResourceCategory

  // Content
  content: ResourceContent
  thumbnail_url: string | null

  // Organization
  tags: string[]
  age_group: AgeGroup
  difficulty: DifficultyLevel
  duration_minutes: number | null  // Estimated time to complete

  // Source
  is_curated: boolean              // True if from official library
  creator_id: string | null        // Null for curated content
  creator_name: string | null
  creator_profile?: CreatorProfile | null  // Extended creator info

  // Stats
  save_count: number
  use_count: number
  rating: number | null            // Average rating 1-5

  // Metadata
  created_at: string
  updated_at: string
  published: boolean
}

// Content structure for resources (similar to story blocks)
export interface ResourceContent {
  overview: string                 // Rich text overview
  instructions: string | null      // How to use
  materials_needed: string[]       // Required materials
  sections: ResourceSection[]      // Main content sections
  tips: string[]                   // Practitioner tips
  modifications: ResourceModification[]  // Adaptations
}

export interface ResourceSection {
  id: string
  title: string
  content: string                  // Rich text/markdown
  duration_minutes: number | null
  order: number
}

export interface ResourceModification {
  id: string
  for_group: string               // e.g., "younger children", "virtual sessions"
  description: string
}

// Creator profile information for display
export interface CreatorProfile {
  id: string
  slug: string | null             // URL slug for public profile
  avatar_url: string | null
  headline: string | null
  credentials: string[]
  specialties: string[]
  years_experience: number | null
  is_verified: boolean
}

// ============================================
// USER INTERACTIONS
// ============================================

export interface SavedResource {
  id: string
  user_id: string
  resource_id: string
  collection_id: string | null
  notes: string | null
  saved_at: string
}

export interface ResourceCollection {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  is_default: boolean             // "Favorites" collection
  created_at: string
  updated_at: string
}

export interface ResourceRating {
  id: string
  user_id: string
  resource_id: string
  rating: number                  // 1-5
  review: string | null
  created_at: string
}

// ============================================
// USER-CREATED RESOURCES
// ============================================

export interface UserResource {
  id: string
  user_id: string

  // Basic Info
  title: string
  description: string
  type: ResourceType
  category: ResourceCategory

  // Content (simplified for user-created)
  content: UserResourceContent
  thumbnail_url: string | null

  // Organization
  tags: string[]

  // Sharing
  is_shared: boolean              // Shared to practice library
  shared_at: string | null

  // Metadata
  created_at: string
  updated_at: string
}

export interface UserResourceContent {
  body: string                    // Main content (markdown/rich text)
  attachments: ResourceAttachment[]
}

export interface ResourceAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_at: string
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface LibraryFilters {
  search: string
  types: ResourceType[]
  categories: ResourceCategory[]
  tags: string[]
  age_group: AgeGroup | null
  difficulty: DifficultyLevel | null
  is_curated: boolean | null
  duration_max: number | null     // Max duration in minutes
}

export interface LibrarySearchParams {
  filters: LibraryFilters
  sortBy: 'relevance' | 'newest' | 'popular' | 'rating' | 'title'
  sortOrder: 'asc' | 'desc'
  page: number
  limit: number
}

export interface LibrarySearchResult {
  resources: LibraryResource[]
  total: number
  page: number
  total_pages: number
  has_more: boolean
}

// ============================================
// FORM INPUT TYPES
// ============================================

export interface CreateUserResourceInput {
  title: string
  description: string
  type: ResourceType
  category: ResourceCategory
  content: UserResourceContent
  tags?: string[]
  thumbnail_url?: string
}

export interface UpdateUserResourceInput extends Partial<CreateUserResourceInput> {
  is_shared?: boolean
}

export interface CreateCollectionInput {
  name: string
  description?: string
  color?: string
  icon?: string
}

// ============================================
// STATS TYPES
// ============================================

export interface LibraryStats {
  total_resources: number
  total_categories: number
  resources_by_type: Record<ResourceType, number>
  resources_by_category: Record<ResourceCategory, number>
  popular_tags: { tag: string; count: number }[]
}

export interface UserLibraryStats {
  saved_resources: number
  collections: number
  created_resources: number
  shared_resources: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getResourceTypeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    assessment: 'clipboard-check',
    activity: 'puzzle',
    ritual: 'sun',
    educational: 'book-open',
    template: 'file-text'
  }
  return icons[type] || 'file'
}

export function getResourceTypeColor(type: ResourceType): string {
  const colors: Record<ResourceType, string> = {
    assessment: 'blue',
    activity: 'emerald',
    ritual: 'amber',
    educational: 'purple',
    template: 'slate'
  }
  return colors[type] || 'gray'
}

export function getCategoryColor(category: ResourceCategory): string {
  const colors: Record<string, string> = {
    // Current taxonomy
    emotions: 'rose',
    thoughts_beliefs: 'violet',
    self_compassion: 'pink',
    acceptance: 'teal',
    mindfulness: 'teal',
    self_identity: 'amber',
    stress_anxiety: 'orange',
    depression: 'indigo',
    sleep: 'blue',
    mental_health_conditions: 'purple',
    trauma_violence: 'red',
    grief: 'slate',
    relationships: 'pink',
    family_couple: 'rose',
    communication: 'cyan',
    sexuality: 'fuchsia',
    body_food: 'lime',
    addictions: 'red',
    habits_actions: 'emerald',
    discrimination: 'amber',
    life_transitions: 'sky',
    work_finances: 'gray',
    // Legacy
    emotional_regulation: 'violet',
    self_confidence: 'amber',
    self_esteem: 'amber',
    stress: 'orange',
    anxiety: 'blue',
    burnout: 'red',
    decision_making: 'indigo',
    behavior: 'emerald',
    habits: 'lime',
    psychoeducation: 'purple',
    reflection: 'teal',
    action: 'green',
    general: 'neutral',
    coping_skills: 'emerald',
    trauma: 'purple',
    children: 'yellow',
    teens: 'lime',
    adults: 'gray',
    couples: 'rose',
    family: 'violet',
  }
  return colors[category] || 'gray'
}

export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }
  return labels[difficulty]
}

export function getAgeGroupLabel(ageGroup: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    children: 'Children (5-12)',
    teens: 'Teens (13-17)',
    adults: 'Adults (18+)',
    all: 'All Ages'
  }
  return labels[ageGroup]
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Default empty filters
export const defaultLibraryFilters: LibraryFilters = {
  search: '',
  types: [],
  categories: [],
  tags: [],
  age_group: null,
  difficulty: null,
  is_curated: null,
  duration_max: null
}

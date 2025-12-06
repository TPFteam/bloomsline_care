// Resource types
export type ResourceType = 'worksheet' | 'assessment' | 'exercise' | 'psychoeducation'

export type ResourceStatus = 'draft' | 'published' | 'archived'

export type ResourceVisibility = 'private' | 'public'

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired'

export type AssignmentPriority = 'low' | 'normal' | 'high'

export type ResponseStatus = 'draft' | 'submitted' | 'reviewed'

// Block types for content
export type BlockType = 'heading' | 'paragraph' | 'prompt' | 'checklist' | 'scale' | 'image' | 'video' | 'file' | 'key_points' | 'callout' | 'quote' | 'image_placeholder'

// Media file interface
export interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  storagePath?: string
}

// Base block interface
export interface BaseBlock {
  id: string
  type: BlockType
  content: string
}

// Specific block types
export interface HeadingBlock extends BaseBlock {
  type: 'heading'
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
}

export interface PromptBlock extends BaseBlock {
  type: 'prompt'
  placeholder?: string
  lines?: number
  required?: boolean
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist'
  items: string[]
  minRequired?: number
}

export interface ScaleBlock extends BaseBlock {
  type: 'scale'
  scaleMin: number
  scaleMax: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  // For assessments - scoring
  scoreWeight?: number
  reverseScore?: boolean
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  mediaFile?: MediaFile
  mediaCaption?: string
  mediaAlt?: string
}

export interface VideoBlock extends BaseBlock {
  type: 'video'
  mediaFile?: MediaFile
  videoUrl?: string
  videoType?: 'upload' | 'youtube' | 'vimeo'
}

export interface FileBlock extends BaseBlock {
  type: 'file'
  mediaFile?: MediaFile
  mediaCaption?: string
}

// Psychoeducation-specific block types
export interface KeyPointsBlock extends BaseBlock {
  type: 'key_points'
  points?: string[]
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout'
  calloutType?: 'info' | 'warning' | 'tip' | 'example'
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote'
  attribution?: string
}

export interface ImagePlaceholderBlock extends BaseBlock {
  type: 'image_placeholder'
  caption?: string
}

// Union type for all blocks
export type ResourceBlock =
  | HeadingBlock
  | ParagraphBlock
  | PromptBlock
  | ChecklistBlock
  | ScaleBlock
  | ImageBlock
  | VideoBlock
  | FileBlock
  | KeyPointsBlock
  | CalloutBlock
  | QuoteBlock
  | ImagePlaceholderBlock

// Type-specific settings
export interface WorksheetSettings {
  estimatedDuration?: number // minutes
}

export interface AssessmentSettings {
  estimatedDuration?: number
  scoringType: 'sum' | 'average' | 'custom'
  maxScore?: number
  interpretations?: {
    minScore: number
    maxScore: number
    label: string
    description: string
    severity?: 'minimal' | 'mild' | 'moderate' | 'severe'
  }[]
  subscales?: {
    id: string
    name: string
    blockIds: string[]
  }[]
}

export interface ExerciseSettings {
  estimatedDuration?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  instructions?: string
}

export interface PsychoeducationSettings {
  estimatedReadTime?: number
  estimatedReadingTime?: number
  learningObjectives?: string[]
}

export type ResourceSettings =
  | WorksheetSettings
  | AssessmentSettings
  | ExerciseSettings
  | PsychoeducationSettings

// Creator profile info for display on resources
export interface ResourceCreatorProfile {
  id: string
  slug: string | null
  full_name: string | null
  avatar_url: string | null
  headline: string | null
  credentials: string[]
  specialties: string[]
  years_experience: number | null
  is_verified: boolean
}

// Main Resource interface
export interface Resource {
  id: string
  practitioner_id: string
  type: ResourceType
  title: string
  description?: string
  category?: string
  tags: string[]
  blocks: ResourceBlock[]
  settings: ResourceSettings
  status: ResourceStatus
  visibility: ResourceVisibility
  published_to_library_at?: string
  times_assigned: number
  times_completed: number
  created_at: string
  updated_at: string
  // Extended creator info (populated when fetching)
  creator_profile?: ResourceCreatorProfile | null
}

// Resource Assignment interface
export interface ResourceAssignment {
  id: string
  resource_id: string
  member_id: string
  practitioner_id: string
  due_date?: string
  instructions?: string
  priority: AssignmentPriority
  status: AssignmentStatus
  assigned_at: string
  created_at: string
  updated_at: string
  // Joined data
  resource?: Resource
  member?: {
    id: string
    first_name: string
    last_name: string
    email?: string
  }
}

// Response data type (keyed by block ID)
export type ResponseData = Record<string, string | number | number[] | boolean>

// Assessment scores
export interface AssessmentScores {
  total?: number
  percentage?: number
  interpretation?: string
  subscales?: Record<string, number>
}

// Resource Response interface
export interface ResourceResponse {
  id: string
  assignment_id: string
  resource_id: string
  member_id: string
  practitioner_id: string
  responses: ResponseData
  scores?: AssessmentScores
  status: ResponseStatus
  submitted_at?: string
  practitioner_notes?: string
  reviewed_at?: string
  time_spent_seconds?: number
  started_at?: string
  created_at: string
  updated_at: string
  // Joined data
  resource?: Resource
  assignment?: ResourceAssignment
  member?: {
    id: string
    first_name: string
    last_name: string
  }
}

// Create/Update DTOs
export interface CreateResourceDTO {
  type: ResourceType
  title: string
  description?: string
  category?: string
  tags?: string[]
  blocks: ResourceBlock[]
  settings?: ResourceSettings
  status?: ResourceStatus
  visibility?: ResourceVisibility
}

export interface UpdateResourceDTO {
  title?: string
  description?: string
  category?: string
  tags?: string[]
  blocks?: ResourceBlock[]
  settings?: ResourceSettings
  status?: ResourceStatus
  visibility?: ResourceVisibility
}

export interface CreateAssignmentDTO {
  resource_id: string
  member_id: string
  due_date?: string
  instructions?: string
  priority?: AssignmentPriority
}

export interface CreateResponseDTO {
  assignment_id: string
  resource_id: string
  member_id: string
  responses: ResponseData
  scores?: AssessmentScores
  status?: ResponseStatus
  time_spent_seconds?: number
}

// Helper functions
export function getResourceTypeLabel(type: ResourceType, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<ResourceType, { en: string; fr: string }> = {
    worksheet: { en: 'Worksheet', fr: 'Feuille de travail' },
    assessment: { en: 'Assessment', fr: 'Évaluation' },
    exercise: { en: 'Exercise', fr: 'Exercice' },
    psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation' },
  }
  return labels[type][locale]
}

export function getStatusLabel(status: ResourceStatus, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<ResourceStatus, { en: string; fr: string }> = {
    draft: { en: 'Draft', fr: 'Brouillon' },
    published: { en: 'Published', fr: 'Publié' },
    archived: { en: 'Archived', fr: 'Archivé' },
  }
  return labels[status][locale]
}

export function getAssignmentStatusLabel(status: AssignmentStatus, locale: 'en' | 'fr' = 'en'): string {
  const labels: Record<AssignmentStatus, { en: string; fr: string }> = {
    pending: { en: 'Pending', fr: 'En attente' },
    in_progress: { en: 'In Progress', fr: 'En cours' },
    completed: { en: 'Completed', fr: 'Terminé' },
    expired: { en: 'Expired', fr: 'Expiré' },
  }
  return labels[status][locale]
}

// Resource types
export type ResourceType = 'worksheet' | 'exercise' | 'psychoeducation' | 'table'

export type ResourceStatus = 'draft' | 'published' | 'archived'

export type ResourceVisibility = 'private' | 'link_only' | 'public' | 'onboarding'

export type ResourceLanguage = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'nl'

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired'

export type AssignmentPriority = 'low' | 'normal' | 'high'

export type ResponseStatus = 'draft' | 'submitted' | 'reviewed'

// Block types for content
export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'prompt'
  | 'checklist'
  | 'scale'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'link'
  | 'key_points'
  | 'callout'
  | 'quote'
  | 'affirmation'
  // Worksheet-specific block types
  | 'tip'
  | 'divider'
  | 'spacer'
  | 'multiple_choice'
  | 'yes_no'
  | 'likert'
  | 'slider'
  | 'numeric'
  | 'matrix_rating'
  | 'mood'
  | 'date_picker'
  | 'time_input'
  | 'list_input'
  | 'table_exercise'
  // Response block types (member uploads as answer)
  | 'video_response'
  | 'audio_response'
  | 'file_response'
  // Exercise step types
  | 'instruction'
  | 'timed_action'
  | 'breathing'
  | 'visualization'
  | 'body_scan'
  | 'reflection'
  // Spatial-zone interactive exercise (Circle of Control, etc.)
  | 'zoned_canvas'

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
  /** h1 | h2 | h3 — defaults to h2 when missing for back-compat. */
  headingLevel?: 'h1' | 'h2' | 'h3'
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer'
  spacerSize?: 'sm' | 'md' | 'lg'
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

export interface AudioBlock extends BaseBlock {
  type: 'audio'
  mediaFile?: MediaFile
  caption?: string
}

export interface LinkBlock extends BaseBlock {
  type: 'link'
  linkUrl?: string
  linkPlatform?: 'youtube' | 'vimeo' | 'spotify' | 'soundcloud' | 'other'
  linkTitle?: string
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

// Worksheet-specific block types
export interface TipBlock extends BaseBlock {
  type: 'tip'
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
}

export interface MultipleChoiceBlock extends BaseBlock {
  type: 'multiple_choice'
  options?: string[]
  choices?: string[]
  allowMultiple?: boolean
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface YesNoBlock extends BaseBlock {
  type: 'yes_no'
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface LikertBlock extends BaseBlock {
  type: 'likert'
  scaleRange?: number
  scaleLabels?: string[]
  likertScale?: number
  likertLabels?: { start?: string; end?: string }
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface SliderBlock extends BaseBlock {
  type: 'slider'
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  sliderMinLabel?: string
  sliderMaxLabel?: string
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface NumericBlock extends BaseBlock {
  type: 'numeric'
  minValue?: number
  maxValue?: number
  numericMin?: number
  numericMax?: number
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface MatrixRatingBlock extends BaseBlock {
  type: 'matrix_rating'
  matrixItems?: string[]
  matrixScaleMax?: number
  matrixScaleLabels?: { min?: string; max?: string }
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface MoodBlock extends BaseBlock {
  type: 'mood'
  moodOptions?: { emoji: string; label: string; value?: number }[]
  required?: boolean
  scoring?: { [key: string]: number }
}

export interface DatePickerBlock extends BaseBlock {
  type: 'date_picker'
  required?: boolean
}

export interface TimeInputBlock extends BaseBlock {
  type: 'time_input'
  required?: boolean
}

export interface ListInputBlock extends BaseBlock {
  type: 'list_input'
  minItems?: number
  maxItems?: number
  listMinItems?: number
  listMaxItems?: number
  listItemPlaceholder?: string
  required?: boolean
}

// Table Exercise block for table-based exercises
export interface TableExerciseBlockColumn {
  id: string
  header: string
  description?: string
}

export interface TableExerciseBlock extends BaseBlock {
  type: 'table_exercise'
  columns: TableExerciseBlockColumn[]
  instructions?: string
}

// Response block types (member uploads as answer)
export interface VideoResponseBlock extends BaseBlock {
  type: 'video_response'
  required?: boolean
}

export interface AudioResponseBlock extends BaseBlock {
  type: 'audio_response'
  required?: boolean
}

export interface FileResponseBlock extends BaseBlock {
  type: 'file_response'
  required?: boolean
  acceptedFileTypes?: string[]
}

// Spatial-zone interactive exercise (Circle of Control, Eisenhower
// matrix, body map, etc.). Driven by the zoned-canvas template
// library at src/lib/resources/zoned-canvas.ts. Patients add entries
// to zones by tapping; the entry is attributed to the zone that owns
// the tap position (deepest match wins, via parentZoneId nesting).
export interface ZonedCanvasBlock extends BaseBlock {
  type: 'zoned_canvas'
  templateId?: string
  canvas: { width: number; height: number; backgroundImageUrl?: string }
  zones: Array<{
    id: string
    label: { en: string; fr: string; es?: string }
    description?: { en: string; fr: string; es?: string }
    shape:
      | { kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number }
      | { kind: 'circle'; cx: number; cy: number; r: number }
      | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
      | { kind: 'polygon'; points: [number, number][] }
    accent?: 'teal' | 'amber' | 'rose' | 'violet' | 'sky' | 'emerald' | 'orange' | 'slate'
    parentZoneId?: string | null
    maxItems?: number
  }>
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
  | AudioBlock
  | LinkBlock
  | FileBlock
  | KeyPointsBlock
  | CalloutBlock
  | QuoteBlock
  // Worksheet-specific blocks
  | TipBlock
  | DividerBlock
  | SpacerBlock
  | MultipleChoiceBlock
  | YesNoBlock
  | LikertBlock
  | SliderBlock
  | NumericBlock
  | MatrixRatingBlock
  | MoodBlock
  | DatePickerBlock
  | TimeInputBlock
  | ListInputBlock
  | TableExerciseBlock
  // Response blocks (member uploads as answer)
  | VideoResponseBlock
  | AudioResponseBlock
  | ZonedCanvasBlock
  | FileResponseBlock

// Scoring range for worksheet scoring
export interface ScoringRange {
  min: number
  max: number
  label: Record<string, string>
  description?: Record<string, string>
}

// Type-specific settings
export interface WorksheetSettings {
  estimatedDuration?: number // minutes
  // Scoring options (when enableScoring is true)
  enableScoring?: boolean
  showScoreToMember?: boolean
  scoringRanges?: ScoringRange[]
  maxScore?: number
  // Questions array for scored worksheets (stores assessment-style questions)
  questions?: WorksheetQuestion[]
  instructions?: string
}

// Question types for scored worksheets
export type WorksheetQuestionType = 'multiple_choice' | 'likert' | 'yes_no' | 'numeric' | 'scale' | 'checklist' | 'mood' | 'slider'

export interface WorksheetQuestion {
  id: string
  type: WorksheetQuestionType
  question: string // The question text
  required: boolean
  // Multiple choice options
  options?: string[]
  // Likert scale
  scaleLabels?: string[]
  scaleRange?: number
  // Scale/rating
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  // Checklist items
  items?: string[]
  // Mood options
  moodOptions?: { emoji: string; label: string; value: number }[]
  // Slider
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  // Numeric input
  minValue?: number
  maxValue?: number
  // Scoring (points for each option)
  scoring?: { [key: string]: number }
}

// Legacy assessment settings (kept for backwards compatibility during migration)
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
  language: ResourceLanguage
  published_to_library_at?: string
  times_assigned: number
  times_completed: number
  is_curated?: boolean
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
export type ResponseValue = string | number | number[] | boolean | string[] | Record<string, string>[] | Record<string, number>
export type ResponseData = Record<string, ResponseValue>

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
  language?: ResourceLanguage
  is_recurring?: boolean
}

export interface UpdateResourceDTO {
  /** Allowed on update so the editor can auto-promote a psychoeducation
   *  resource to a worksheet when interactive blocks are added. */
  type?: ResourceType
  title?: string
  description?: string
  category?: string
  tags?: string[]
  blocks?: ResourceBlock[]
  settings?: ResourceSettings
  status?: ResourceStatus
  visibility?: ResourceVisibility
  language?: ResourceLanguage
  is_recurring?: boolean
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
export function getResourceTypeLabel(type: ResourceType | 'assessment', locale: string = 'en'): string {
  const labels: Record<ResourceType | 'assessment', Record<string, string>> = {
    worksheet: { en: 'Worksheet', fr: 'Exercice' },
    assessment: { en: 'Worksheet', fr: 'Exercice' }, // Legacy - maps to worksheet
    exercise: { en: 'Exercise', fr: 'Exercice' },
    psychoeducation: { en: 'Education', fr: 'Éducation' },
    table: { en: 'Table Exercise', fr: 'Tableau' },
  }
  return labels[type]?.[locale] ?? labels[type]?.['en'] ?? ''
}

export function getStatusLabel(status: ResourceStatus, locale: string = 'en'): string {
  const labels: Record<ResourceStatus, Record<string, string>> = {
    draft: { en: 'Edit later', fr: 'À modifier plus tard' },
    published: { en: 'Ready to share', fr: 'Prêt à être envoyé' },
    archived: { en: 'Archived', fr: 'Archivé' },
  }
  return labels[status]?.[locale] ?? labels[status]?.['en'] ?? ''
}

export function getAssignmentStatusLabel(status: AssignmentStatus, locale: string = 'en'): string {
  const labels: Record<AssignmentStatus, Record<string, string>> = {
    pending: { en: 'Pending', fr: 'En attente' },
    in_progress: { en: 'In Progress', fr: 'En cours' },
    completed: { en: 'Completed', fr: 'Terminé' },
    expired: { en: 'Expired', fr: 'Expiré' },
  }
  return labels[status]?.[locale] ?? labels[status]?.['en'] ?? ''
}

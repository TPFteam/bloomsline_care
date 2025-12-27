// ============================================
// Bloom AI Companion Types
// ============================================

// Conversation types
export interface BloomConversation {
  id: string
  user_id: string
  title: string | null
  started_at: string
  last_message_at: string
  mood_context: string[]
  moments_referenced: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BloomMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  is_voice_message: boolean
  audio_url: string | null
  audio_duration_seconds: number | null
  tokens_used: number | null
  model_version: string | null
  created_at: string
}

// Daily prompts
export type PromptType = 'reflection' | 'gratitude' | 'mood_check' | 'activity' | 'affirmation'

export interface BloomDailyPrompt {
  id: string
  user_id: string
  prompt_text: string
  prompt_text_fr: string
  prompt_type: PromptType
  shown_at: string | null
  responded_at: string | null
  response_moment_id: string | null
  scheduled_for: string
  created_at: string
}

// Insights
export type InsightType = 'mood_pattern' | 'weekly_summary' | 'streak' | 'growth' | 'recommendation'

export interface BloomInsight {
  id: string
  user_id: string
  insight_type: InsightType
  insight_data: Record<string, unknown>
  insight_text: string | null
  insight_text_fr: string | null
  valid_from: string
  valid_until: string | null
  is_dismissed: boolean
  shown_at: string | null
  created_at: string
}

// User settings
export type BloomPersonality = 'gentle' | 'encouraging' | 'playful' | 'wise'

export interface BloomUserSettings {
  id: string
  user_id: string
  voice_enabled: boolean
  daily_prompts_enabled: boolean
  preferred_prompt_time: string
  bloom_personality: BloomPersonality
  has_met_bloom: boolean
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

// Entry point for context-aware interactions
export type BloomEntryPoint = 'home' | 'balance' | 'moments' | 'rituals' | 'progress' | 'reflect' | 'general'

// Chat API types
export interface ChatRequest {
  message: string
  conversationId?: string
  locale: 'en' | 'fr'
  entryPoint?: BloomEntryPoint
}

export interface ChatResponse {
  message: string
  conversationId: string
  suggestedActions?: string[]
  relatedMomentIds?: string[]
}

// Bloom character states
export type BloomState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'concerned'

// Garden/Plant types
export type MoodType = 'grateful' | 'peaceful' | 'joyful' | 'inspired' | 'loved' | 'calm' | 'hopeful' | 'proud'

export interface PlantConfig {
  flower: string // gradient classes
  stem: string
  emoji: string
  name: string
  nameFr: string
}

export const MOOD_PLANT_MAP: Record<MoodType, PlantConfig> = {
  grateful: {
    flower: 'from-amber-300 to-yellow-400',
    stem: 'from-emerald-600 to-green-500',
    emoji: '🌻',
    name: 'Sunflower',
    nameFr: 'Tournesol',
  },
  peaceful: {
    flower: 'from-emerald-300 to-teal-400',
    stem: 'from-emerald-700 to-green-600',
    emoji: '🌿',
    name: 'Fern',
    nameFr: 'Fougère',
  },
  joyful: {
    flower: 'from-yellow-300 to-amber-400',
    stem: 'from-lime-500 to-green-500',
    emoji: '🌼',
    name: 'Daisy',
    nameFr: 'Marguerite',
  },
  inspired: {
    flower: 'from-violet-400 to-purple-500',
    stem: 'from-emerald-600 to-teal-500',
    emoji: '🌸',
    name: 'Iris',
    nameFr: 'Iris',
  },
  loved: {
    flower: 'from-pink-400 to-rose-500',
    stem: 'from-emerald-500 to-green-400',
    emoji: '🌹',
    name: 'Rose',
    nameFr: 'Rose',
  },
  calm: {
    flower: 'from-sky-300 to-blue-400',
    stem: 'from-teal-500 to-emerald-500',
    emoji: '💠',
    name: 'Forget-me-not',
    nameFr: 'Myosotis',
  },
  hopeful: {
    flower: 'from-white to-yellow-100',
    stem: 'from-emerald-500 to-green-400',
    emoji: '🌷',
    name: 'Lily',
    nameFr: 'Lys',
  },
  proud: {
    flower: 'from-red-400 to-rose-500',
    stem: 'from-emerald-600 to-green-500',
    emoji: '🌺',
    name: 'Tulip',
    nameFr: 'Tulipe',
  },
}

// Garden weather based on overall mood
export type GardenWeather = 'sunny' | 'partly_cloudy' | 'gentle_rain' | 'starry_night'

// Voice states
export type VoiceState = 'idle' | 'recording' | 'processing' | 'playing'

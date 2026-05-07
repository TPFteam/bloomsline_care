import { createClient } from '@/lib/supabase/browser-client'

export interface CardLayoutItem {
  id: string
  column: 0 | 1
  order: number
}

export const DEFAULT_CARD_LAYOUT: CardLayoutItem[] = [
  { id: 'ai_summary', column: 0, order: 0 },
  { id: 'about', column: 0, order: 1 }, // also renders Key considerations as a sub-section
  { id: 'past_sessions', column: 0, order: 2 },
  { id: 'recent_notes', column: 1, order: 0 },
  { id: 'shared_resources', column: 1, order: 1 },
]

export interface UserPreferences {
  moments_theme: 'dark' | 'light'
  moments_view: 'grid' | 'list'
  overview_card_layout?: CardLayoutItem[]
  show_all_features: boolean
  notes_zoom: number
}

const DEFAULT_PREFERENCES: UserPreferences = {
  moments_theme: 'dark',
  moments_view: 'grid',
  overview_card_layout: DEFAULT_CARD_LAYOUT,
  show_all_features: false,
  notes_zoom: 100,
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PREFERENCES

  const { data, error } = await supabase
    .from('user_preferences')
    .select('moments_theme, moments_view, overview_card_layout, show_all_features, notes_zoom')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.log('No preferences found, using defaults')
    return DEFAULT_PREFERENCES
  }

  return {
    moments_theme: data.moments_theme || 'dark',
    moments_view: data.moments_view || 'grid',
    overview_card_layout: data.overview_card_layout || DEFAULT_CARD_LAYOUT,
    show_all_features: data.show_all_features ?? false,
    notes_zoom: data.notes_zoom ?? 100,
  }
}

export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No user logged in')
    return false
  }

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: user.id,
        ...preferences,
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('Failed to save preferences:', error.message)
    return false
  }

  return true
}

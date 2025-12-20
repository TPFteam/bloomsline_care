import { createClient } from '@/lib/supabase/browser-client'

export interface UserPreferences {
  moments_theme: 'dark' | 'light'
  moments_view: 'grid' | 'list'
}

const DEFAULT_PREFERENCES: UserPreferences = {
  moments_theme: 'dark',
  moments_view: 'grid',
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return DEFAULT_PREFERENCES

  const { data, error } = await supabase
    .from('user_preferences')
    .select('moments_theme, moments_view')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.log('No preferences found, using defaults')
    return DEFAULT_PREFERENCES
  }

  return {
    moments_theme: data.moments_theme || 'dark',
    moments_view: data.moments_view || 'grid',
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

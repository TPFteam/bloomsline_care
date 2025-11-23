import { createClient } from '@/lib/supabase/browser-client'
import type { User, UserUpdate } from '@/types/user'

/**
 * Get the current user's profile from the users table
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  const supabase = createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Get a user profile by ID
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(updates: UserUpdate): Promise<User | null> {
  const supabase = createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', authUser.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    return null
  }

  return data
}

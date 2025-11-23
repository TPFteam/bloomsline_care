'use server'

import { supabase } from '@/lib/supabase/client'

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    return { error: error.message }
  }

  return { user }
}

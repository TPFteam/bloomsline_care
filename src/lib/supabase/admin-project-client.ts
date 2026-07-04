import { createClient } from '@supabase/supabase-js'

// Service-role client for the *admin* Supabase project (lhxwtjnwmopqnghdbkde) —
// separate from the main/care project. Practitioner videos + reviews live here,
// deliberately off the normal Bloomsline database + storage.
//
// SERVER-ONLY. Practitioners have no session on this project, so every access
// goes through a care API route that (1) derives the practitioner from the main
// project session and (2) uses this service-role client to read/write the admin
// project. Never import this into client code — it would leak the service key.
export function createAdminProjectClient() {
  const url = process.env.ADMIN_SUPABASE_URL
  const key = process.env.ADMIN_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // Fail loud rather than silently falling back to the main project.
    throw new Error(
      'Admin Supabase project is not configured. Set ADMIN_SUPABASE_URL and ADMIN_SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const PRACTITIONER_VIDEOS_BUCKET = 'practitioner-videos'

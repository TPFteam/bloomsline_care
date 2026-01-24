import { createClient } from '@/lib/supabase/browser-client'

// ============================================
// TYPES
// ============================================

export type MomentType = 'photo' | 'video' | 'voice' | 'write'

export interface Moment {
  id: string
  user_id: string
  type: MomentType
  media_url: string | null
  thumbnail_url: string | null
  text_content: string | null
  caption: string | null
  moods: string[]
  duration_seconds: number | null
  file_size_bytes: number | null
  mime_type: string | null
  created_at: string
  updated_at: string
}

export interface CreateMomentInput {
  type: MomentType
  mediaFile?: File | Blob
  textContent?: string
  caption?: string
  moods: string[]
  durationSeconds?: number
}

// ============================================
// STORAGE HELPERS
// ============================================

/**
 * Upload a media file to Supabase storage
 */
async function uploadMomentMedia(
  userId: string,
  momentId: string,
  file: File | Blob,
  fileType: 'media' | 'thumbnail'
): Promise<string | null> {
  const supabase = createClient()

  // Determine file extension based on mime type
  const mimeType = file.type || 'application/octet-stream'
  let extension = 'bin'
  if (mimeType.startsWith('image/')) {
    extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  } else if (mimeType.startsWith('video/')) {
    extension = mimeType.split('/')[1] || 'mp4'
  } else if (mimeType.startsWith('audio/')) {
    extension = mimeType.split('/')[1] || 'webm'
  }

  const fileName = `${fileType}.${extension}`
  const filePath = `${userId}/${momentId}/${fileName}`

  const { error } = await supabase.storage
    .from('moments_media')
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    console.error('Error uploading moment media:', error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('moments_media')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}

// ============================================
// MOMENT OPERATIONS
// ============================================

/**
 * Create a new moment
 */
export async function createMoment(input: CreateMomentInput): Promise<Moment | null> {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user')
    return null
  }

  // Generate moment ID
  const momentId = crypto.randomUUID()

  // Upload media if present
  let mediaUrl: string | null = null
  let mimeType: string | null = null
  let fileSizeBytes: number | null = null

  if (input.mediaFile) {
    mediaUrl = await uploadMomentMedia(user.id, momentId, input.mediaFile, 'media')
    mimeType = input.mediaFile.type || null
    fileSizeBytes = input.mediaFile.size || null
  }

  // Insert moment record
  const { data, error } = await supabase
    .from('moments')
    .insert({
      id: momentId,
      user_id: user.id,
      type: input.type,
      media_url: mediaUrl,
      text_content: input.textContent || null,
      caption: input.caption || null,
      moods: input.moods,
      duration_seconds: input.durationSeconds || null,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating moment:', error)
    return null
  }

  return data as Moment
}

/**
 * Get all moments for the current user
 * @param limit - Max number of moments to return
 * @param offset - Offset for pagination
 * @param sinceDate - Optional date to filter moments from (inclusive)
 */
export async function getMemberMoments(limit = 50, offset = 0, sinceDate?: Date): Promise<Moment[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase
    .from('moments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Apply date filter if provided
  if (sinceDate) {
    const dateStr = sinceDate.toISOString()
    query = query.gte('created_at', dateStr)
  }

  const { data, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching moments:', error)
    return []
  }

  return data as Moment[]
}

/**
 * Get a single moment by ID
 */
export async function getMomentById(momentId: string): Promise<Moment | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('id', momentId)
    .single()

  if (error) {
    console.error('Error fetching moment:', error)
    return null
  }

  return data as Moment
}

/**
 * Delete a moment
 */
export async function deleteMoment(momentId: string): Promise<boolean> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Get moment to find media path
  const moment = await getMomentById(momentId)
  if (!moment) return false

  // Delete media from storage if exists
  if (moment.media_url) {
    const mediaPath = `${user.id}/${momentId}`
    // List and delete all files in the moment folder
    const { data: files } = await supabase.storage
      .from('moments_media')
      .list(mediaPath)

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${mediaPath}/${f.name}`)
      await supabase.storage
        .from('moments_media')
        .remove(filesToDelete)
    }
  }

  // Delete moment record
  const { error } = await supabase
    .from('moments')
    .delete()
    .eq('id', momentId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting moment:', error)
    return false
  }

  return true
}

/**
 * Get moment statistics for the current user
 */
export async function getMomentStats(): Promise<{
  total: number
  thisWeek: number
  byType: Record<MomentType, number>
}> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total: 0, thisWeek: 0, byType: { photo: 0, video: 0, voice: 0, write: 0 } }
  }

  // Get total count
  const { count: total } = await supabase
    .from('moments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get this week count
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count: thisWeek } = await supabase
    .from('moments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', weekAgo.toISOString())

  // Get count by type
  const { data: typeData } = await supabase
    .from('moments')
    .select('type')
    .eq('user_id', user.id)

  const byType: Record<MomentType, number> = { photo: 0, video: 0, voice: 0, write: 0 }
  if (typeData) {
    typeData.forEach(m => {
      if (m.type in byType) {
        byType[m.type as MomentType]++
      }
    })
  }

  return {
    total: total || 0,
    thisWeek: thisWeek || 0,
    byType,
  }
}

/**
 * Get moments by mood
 */
export async function getMomentsByMood(mood: string): Promise<Moment[]> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('moments')
    .select('*')
    .eq('user_id', user.id)
    .contains('moods', [mood])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching moments by mood:', error)
    return []
  }

  return data as Moment[]
}

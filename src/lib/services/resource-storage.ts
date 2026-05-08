import { createClient } from '@/lib/supabase/browser-client'

const BUCKET_NAME = 'resource-media'
const RESPONSES_BUCKET = 'resource-responses'

// Get browser supabase client for storage operations
const getSupabase = () => createClient()

export interface UploadResult {
  url: string
  path: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

/**
 * Upload a file to the resource-media storage bucket
 * Files are organized by user ID for security
 */
export async function uploadResourceFile(
  file: File,
  userId: string,
  resourceId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Generate unique filename with timestamp
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = resourceId
    ? `${userId}/${resourceId}/${timestamp}-${sanitizedName}`
    : `${userId}/temp/${timestamp}-${sanitizedName}`

  // Normalize MIME types that Supabase storage may not accept
  let contentType = file.type
  if (contentType === 'audio/ogg') contentType = 'audio/mpeg'
  if (contentType === 'video/quicktime') contentType = 'video/mp4'

  // Ensure valid session before upload
  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.refreshSession()
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}

/**
 * Upload a patient response file (audio / video / file answer block) to the
 * `resource-responses` bucket. Folder convention is
 *   {member_user_id}/{resource_id}/{timestamp}-{filename}
 * so the storage RLS can authorize practitioner reads via foldername[2].
 *
 * Does NOT use getPublicUrl — the bucket is private. Callers should request
 * a signed URL or rely on supabase-js to fetch via the SDK.
 */
export async function uploadResponseFile(
  file: File,
  userId: string,
  resourceId: string,
): Promise<UploadResult> {
  const timestamp = Date.now()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${userId}/${resourceId}/${timestamp}-${sanitizedName}`

  let contentType = file.type
  if (contentType === 'audio/ogg') contentType = 'audio/mpeg'
  if (contentType === 'video/quicktime') contentType = 'video/mp4'

  const supabase = getSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.refreshSession()
  }

  const { data, error } = await supabase.storage
    .from(RESPONSES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    })

  if (error) {
    console.error('Response upload error:', error)
    throw new Error(`Failed to upload response file: ${error.message}`)
  }

  // Bucket is private — return a 1-day signed URL. Callers that need a
  // longer-lived link should re-sign on demand.
  const { data: signed } = await supabase.storage
    .from(RESPONSES_BUCKET)
    .createSignedUrl(data.path, 60 * 60 * 24)

  return {
    url: signed?.signedUrl || '',
    path: data.path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  }
}

/**
 * Upload multiple files in parallel
 */
export async function uploadMultipleFiles(
  files: File[],
  userId: string,
  resourceId?: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) =>
    uploadResourceFile(file, userId, resourceId, (progress) => {
      onProgress?.(index, progress)
    })
  )

  return Promise.all(uploadPromises)
}

/**
 * Delete a file from storage
 */
export async function deleteResourceFile(filePath: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Delete multiple files from storage
 */
export async function deleteMultipleFiles(filePaths: string[]): Promise<void> {
  if (filePaths.length === 0) return

  const supabase = getSupabase()
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths)

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

/**
 * Move files from temp folder to resource folder after resource is created
 */
export async function moveFilesToResource(
  userId: string,
  resourceId: string,
  tempPaths: string[]
): Promise<string[]> {
  const supabase = getSupabase()
  const newPaths: string[] = []

  for (const tempPath of tempPaths) {
    const fileName = tempPath.split('/').pop()
    const newPath = `${userId}/${resourceId}/${fileName}`

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .move(tempPath, newPath)

    if (error) {
      console.error('Move error:', error)
      // Continue with other files even if one fails
    } else {
      newPaths.push(newPath)
    }
  }

  return newPaths
}

/**
 * Get file type category from MIME type
 */
export function getFileCategory(mimeType: string): 'image' | 'video' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number // in bytes
    allowedTypes?: string[]
  }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 50 * 1024 * 1024 // 50MB default
  const allowedTypes = options?.allowedTypes

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(maxSize)} limit`,
    }
  }

  if (allowedTypes && !allowedTypes.some((type) => file.type.match(type))) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    }
  }

  return { valid: true }
}

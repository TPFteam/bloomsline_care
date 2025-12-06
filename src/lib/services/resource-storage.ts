import { supabase } from '@/lib/supabase/client'

const BUCKET_NAME = 'resource-media'

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

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
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

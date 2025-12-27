/**
 * Token encryption utilities for storing OAuth tokens securely
 * Uses AES-256-GCM for authenticated encryption
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * Get the encryption key from environment variable
 * Key must be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY

  if (!key) {
    // In development, use a fallback (not secure for production)
    if (process.env.NODE_ENV === 'development') {
      console.warn('TOKEN_ENCRYPTION_KEY not set, using insecure fallback for development')
      return Buffer.from('01234567890123456789012345678901') // 32 bytes
    }
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
  }

  // Key should be base64 encoded 32 bytes
  const keyBuffer = Buffer.from(key, 'base64')
  if (keyBuffer.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (base64 encoded)')
  }

  return keyBuffer
}

/**
 * Encrypt a token string
 * Returns base64 encoded string: iv:authTag:encryptedData
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  // Combine: iv:authTag:encryptedData (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt a token string
 * Expects base64 encoded string: iv:authTag:encryptedData
 */
export function decryptToken(encryptedString: string): string {
  const key = getEncryptionKey()

  const parts = encryptedString.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }

  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encrypted = parts[2]

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length')
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid auth tag length')
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Check if a string appears to be encrypted (has our format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':')
  if (parts.length !== 3) return false

  try {
    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    return iv.length === IV_LENGTH && authTag.length === AUTH_TAG_LENGTH
  } catch {
    return false
  }
}

/**
 * Generate a new encryption key (for setup)
 * Run: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('base64')
}

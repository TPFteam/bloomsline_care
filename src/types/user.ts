// User type enum - matches database enum
export type UserType = 'mentor' | 'member'

// Language type - matches database constraint
export type Language = 'en' | 'fr' | 'es'

// Default user type constant
export const DEFAULT_USER_TYPE: UserType = 'mentor'

// Default language constant
export const DEFAULT_LANGUAGE: Language = 'en'

// User type labels for display
export const USER_TYPE_LABELS: Record<UserType, string> = {
  mentor: 'Mentor',
  member: 'Member',
}

// Language labels for display
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
}

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  user_type: UserType
  preferred_language: Language
  has_consented?: boolean
  created_at: string
  updated_at: string
}

export interface UserInsert {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  user_type?: UserType
  preferred_language?: Language
}

export interface UserUpdate {
  full_name?: string | null
  avatar_url?: string | null
  user_type?: UserType
  preferred_language?: Language
}

// Helper function to check if a string is a valid user type
export function isValidUserType(value: string): value is UserType {
  return value === 'mentor' || value === 'member'
}

// Helper function to check if a string is a valid language
export function isValidLanguage(value: string): value is Language {
  return value === 'en' || value === 'fr' || value === 'es'
}

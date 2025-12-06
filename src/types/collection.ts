// Collection types

export type CollectionColor = 'blue' | 'red' | 'emerald' | 'amber' | 'purple' | 'pink' | 'slate'

export type CollectionIcon = 'folder' | 'heart' | 'star' | 'bookmark' | 'briefcase' | 'lightbulb' | 'brain'

export interface Collection {
  id: string
  practitioner_id: string
  name: string
  description?: string
  color: CollectionColor
  icon: CollectionIcon
  created_at: string
  updated_at: string
  // Computed field - count of resources
  resource_count?: number
}

export interface CollectionResource {
  id: string
  collection_id: string
  resource_id?: string
  external_resource_id?: string
  added_at: string
}

export interface CollectionWithResources extends Collection {
  resources: CollectionResource[]
}

// DTOs
export interface CreateCollectionDTO {
  name: string
  description?: string
  color?: CollectionColor
  icon?: CollectionIcon
}

export interface UpdateCollectionDTO {
  name?: string
  description?: string
  color?: CollectionColor
  icon?: CollectionIcon
}

// Color config for UI
export const collectionColorConfig: Record<CollectionColor, {
  gradient: string
  bg: string
  text: string
  iconBg: string
}> = {
  blue: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-100/80',
    text: 'text-blue-700',
    iconBg: 'bg-blue-50',
  },
  red: {
    gradient: 'from-red-400 to-red-600',
    bg: 'bg-red-100/80',
    text: 'text-red-700',
    iconBg: 'bg-red-50',
  },
  emerald: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-100/80',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
  },
  amber: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-100/80',
    text: 'text-amber-700',
    iconBg: 'bg-amber-50',
  },
  purple: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-100/80',
    text: 'text-purple-700',
    iconBg: 'bg-purple-50',
  },
  pink: {
    gradient: 'from-pink-400 to-pink-600',
    bg: 'bg-pink-100/80',
    text: 'text-pink-700',
    iconBg: 'bg-pink-50',
  },
  slate: {
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-100/80',
    text: 'text-slate-700',
    iconBg: 'bg-slate-50',
  },
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  FileText,
  BookOpen,
  Table2,
  Puzzle,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Share2,
  Users,
  FolderPlus,
  Sparkles,
  Lock,
  Globe,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import type { Resource } from '@/types/resource'
import type { Collection } from '@/types/collection'

const resourceTypeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  assessment: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

const resourceTypeStyles: Record<string, {
  iconBg: string
  iconColor: string
  labelColor: string
}> = {
  worksheet: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    labelColor: 'text-blue-600',
  },
  assessment: {
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    labelColor: 'text-violet-600',
  },
  exercise: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    labelColor: 'text-emerald-600',
  },
  psychoeducation: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    labelColor: 'text-amber-600',
  },
  table: {
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    labelColor: 'text-rose-600',
  },
}

const typeLabels: Record<string, { en: string; fr: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Exercice' },
  assessment: { en: 'Assessment', fr: 'Évaluation' },
  exercise: { en: 'Exercise', fr: 'Exercice' },
  psychoeducation: { en: 'Education', fr: 'Éducation' },
  table: { en: 'Table', fr: 'Tableau' },
}

const statusLabels: Record<string, { en: string; fr: string }> = {
  draft: { en: 'Draft', fr: 'Brouillon' },
  published: { en: 'Published', fr: 'Publié' },
  archived: { en: 'Archived', fr: 'Archivé' },
}

interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

interface ResourceCardProps {
  resource: Resource
  locale: 'en' | 'fr'
  variant?: 'owned' | 'library' | 'saved'
  index?: number
  onPreview?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRemove?: () => void
  onShare?: () => void
  collections?: Collection[]
  members?: SimpleMember[]
  onAddToCollection?: (resourceId: string, collectionId: string) => void
  onShareWithMember?: (resourceId: string, memberId: string, memberName: string) => void
  isDeleting?: boolean
  isRemoving?: boolean
  isOwner?: boolean
  showCuratedBadge?: boolean
}

export function ResourceCard({
  resource,
  locale,
  variant = 'owned',
  index = 0,
  onPreview,
  onEdit,
  onDelete,
  onRemove,
  onShare,
  collections = [],
  members = [],
  onAddToCollection,
  onShareWithMember,
  isDeleting = false,
  isRemoving = false,
  isOwner = true,
  showCuratedBadge = false,
}: ResourceCardProps) {
  const router = useRouter()

  const TypeIcon = resourceTypeIcons[resource.type] || FileText
  const styles = resourceTypeStyles[resource.type] || resourceTypeStyles.worksheet
  const statusLabel = statusLabels[resource.status] || statusLabels.draft

  const handleClick = () => {
    if (onPreview) {
      onPreview()
    } else {
      router.push(`/resources/${resource.id}`)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={handleClick}
      className={`
        group bg-gray-50/80 rounded-2xl p-5
        cursor-pointer transition-all duration-200
        hover:bg-gray-100/80 hover:shadow-sm
        ${isDeleting || isRemoving ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Header: Icon + Type + Menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center`}>
            <TypeIcon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
          {/* Type & Category */}
          <div>
            <span className={`text-xs font-semibold ${styles.labelColor}`}>
              {typeLabels[resource.type]?.[locale]}
            </span>
            {resource.category && (
              <p className="text-xs text-gray-400 mt-0.5">{resource.category}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        <div onClick={handleMenuClick}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={handleClick}>
                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                {locale === 'fr' ? 'Aperçu' : 'Preview'}
              </DropdownMenuItem>
              {variant === 'owned' && isOwner && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Modifier' : 'Edit'}
                </DropdownMenuItem>
              )}
              {(variant === 'owned' || variant === 'saved') && onShare && (
                <DropdownMenuItem onClick={onShare} className="text-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Partager' : 'Share'}
                </DropdownMenuItem>
              )}
              {variant === 'library' && collections.length > 0 && onAddToCollection && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderPlus className="w-4 h-4 mr-2 text-gray-400" />
                    {locale === 'fr' ? 'Ajouter à' : 'Add to'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {collections.map((collection) => (
                      <DropdownMenuItem
                        key={collection.id}
                        onClick={() => onAddToCollection(resource.id, collection.id)}
                      >
                        {collection.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {variant === 'library' && members.length > 0 && onShareWithMember && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Share2 className="w-4 h-4 mr-2 text-gray-400" />
                    {locale === 'fr' ? 'Envoyer' : 'Send'}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48 max-h-48 overflow-y-auto">
                    {members.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => onShareWithMember(resource.id, member.id, `${member.first_name} ${member.last_name}`)}
                      >
                        {member.first_name} {member.last_name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {(onDelete || onRemove) && (
                <>
                  <DropdownMenuSeparator />
                  {isOwner && onDelete ? (
                    <DropdownMenuItem onClick={onDelete} className="text-red-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Supprimer' : 'Delete'}
                    </DropdownMenuItem>
                  ) : onRemove ? (
                    <DropdownMenuItem onClick={onRemove} className="text-amber-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Retirer' : 'Remove'}
                    </DropdownMenuItem>
                  ) : null}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1.5 line-clamp-2">
        {resource.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {resource.description || (locale === 'fr' ? 'Aucune description' : 'No description')}
      </p>

      {/* Footer: Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Language */}
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
          resource.language === 'fr'
            ? 'bg-blue-50 text-blue-600'
            : 'bg-orange-50 text-orange-600'
        }`}>
          {resource.language?.toUpperCase()}
        </span>

        {/* Visibility */}
        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-lg">
          {resource.visibility === 'public' ? (
            <>
              <Globe className="w-3 h-3" />
              {locale === 'fr' ? 'Public' : 'Public'}
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              {locale === 'fr' ? 'Privé' : 'Private'}
            </>
          )}
        </span>

        {/* Status */}
        {variant === 'owned' && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            resource.status === 'published'
              ? 'bg-emerald-50 text-emerald-600'
              : resource.status === 'draft'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {statusLabel[locale]}
          </span>
        )}

        {/* Curated badge */}
        {showCuratedBadge && (
          <span className="flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
            <Sparkles className="w-3 h-3" />
            {locale === 'fr' ? 'Vérifié' : 'Curated'}
          </span>
        )}

        {/* Block count - pushed to right */}
        <span className="text-xs text-gray-400 ml-auto">
          {resource.blocks?.length || 0} {locale === 'fr' ? 'blocs' : 'blocks'}
        </span>
      </div>
    </motion.div>
  )
}

export function ResourceCardList({
  resource,
  locale,
  variant = 'owned',
  index = 0,
  onPreview,
  onEdit,
  onDelete,
  onShare,
  collections = [],
  members = [],
  onAddToCollection,
  onShareWithMember,
  isDeleting = false,
  isOwner = true,
  showCuratedBadge = false,
}: ResourceCardProps) {
  const router = useRouter()

  const TypeIcon = resourceTypeIcons[resource.type] || FileText
  const styles = resourceTypeStyles[resource.type] || resourceTypeStyles.worksheet
  const statusLabel = statusLabels[resource.status] || statusLabels.draft

  const handleClick = () => {
    if (onPreview) {
      onPreview()
    } else {
      router.push(`/resources/${resource.id}`)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={handleClick}
      className={`
        group bg-gray-50/80 rounded-xl p-4
        cursor-pointer transition-all duration-200
        hover:bg-gray-100/80 hover:shadow-sm
        flex items-center gap-4
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      {/* Icon */}
      <div className={`w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <TypeIcon className={`w-5 h-5 ${styles.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-semibold ${styles.labelColor}`}>
            {typeLabels[resource.type]?.[locale]}
          </span>
          {resource.category && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{resource.category}</span>
            </>
          )}
        </div>
        <h3 className="font-medium text-gray-900 truncate">
          {resource.title}
        </h3>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={handleMenuClick}>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
          resource.language === 'fr'
            ? 'bg-blue-50 text-blue-600'
            : 'bg-orange-50 text-orange-600'
        }`}>
          {resource.language?.toUpperCase()}
        </span>

        {variant === 'owned' && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            resource.status === 'published'
              ? 'bg-emerald-50 text-emerald-600'
              : resource.status === 'draft'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-gray-100 text-gray-500'
          }`}>
            {statusLabel[locale]}
          </span>
        )}

        {showCuratedBadge && (
          <Sparkles className="w-4 h-4 text-emerald-500" />
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={handleClick}>
              <Eye className="w-4 h-4 mr-2 text-gray-400" />
              {locale === 'fr' ? 'Aperçu' : 'Preview'}
            </DropdownMenuItem>
            {variant === 'owned' && isOwner && onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                {locale === 'fr' ? 'Modifier' : 'Edit'}
              </DropdownMenuItem>
            )}
            {variant === 'owned' && onShare && (
              <DropdownMenuItem onClick={onShare} className="text-purple-600">
                <Users className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Partager' : 'Share'}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-500">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Supprimer' : 'Delete'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

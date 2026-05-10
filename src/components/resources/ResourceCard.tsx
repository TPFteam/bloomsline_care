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
  Users,
  Sparkles,
  Lock,
  Globe,
  Heart,
  Send,
  Copy,
  BookMarked,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Resource } from '@/types/resource'
import { ShareResourceModal } from './ShareResourceModal'

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
    // Picked up the emerald palette from the now-retired `table` type
    // so the card retains the warm green clinicians had associated
    // with it. Worksheets get the distinct emerald-700 row instead.
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    labelColor: 'text-emerald-600',
  },
  table: {
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    labelColor: 'text-emerald-600',
  },
}

const typeLabels: Record<string, { en: string; fr: string; es: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Exercice', es: 'Hoja de trabajo' },
  assessment: { en: 'Assessment', fr: 'Évaluation', es: 'Evaluación' },
  exercise: { en: 'Exercise', fr: 'Exercice', es: 'Ejercicio' },
  psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation', es: 'Psicoeducación' },
  table: { en: 'Table', fr: 'Tableau', es: 'Tabla' },
}

const statusLabels: Record<string, { en: string; fr: string; es: string }> = {
  draft: { en: 'Edit later', fr: 'À modifier plus tard', es: 'Editar más tarde' },
  published: { en: 'Ready to share', fr: 'Prêt à être envoyé', es: 'Listo para compartir' },
  archived: { en: 'Archived', fr: 'Archivé', es: 'Archivado' },
}

const categoryLabels: Record<string, { en: string; fr: string; es: string }> = {
  emotions: { en: 'Emotions', fr: 'Émotions', es: 'Emociones' },
  emotional_regulation: { en: 'Emotional Regulation', fr: 'Régulation émotionnelle', es: 'Regulación emocional' },
  self_confidence: { en: 'Self-Confidence', fr: 'Confiance en soi', es: 'Confianza en sí mismo' },
  self_esteem: { en: 'Self-Esteem', fr: 'Estime de soi', es: 'Autoestima' },
  relationships: { en: 'Relationships', fr: 'Relations', es: 'Relaciones' },
  communication: { en: 'Communication', fr: 'Communication', es: 'Comunicación' },
  stress: { en: 'Stress', fr: 'Stress', es: 'Estrés' },
  anxiety: { en: 'Anxiety', fr: 'Anxiété', es: 'Ansiedad' },
  burnout: { en: 'Burnout', fr: 'Burn-out', es: 'Burnout' },
  decision_making: { en: 'Decision-Making', fr: 'Prise de décision', es: 'Toma de decisiones' },
  behavior: { en: 'Behavior', fr: 'Comportements', es: 'Comportamiento' },
  habits: { en: 'Habits', fr: 'Habitudes', es: 'Hábitos' },
  psychoeducation: { en: 'Psychoeducation', fr: 'Psychoéducation', es: 'Psicoeducación' },
  reflection: { en: 'Reflection', fr: 'Réflexion', es: 'Reflexión' },
  action: { en: 'Action', fr: 'Passage à l\'action', es: 'Acción' },
  // Legacy categories for backward compatibility
  general: { en: 'General', fr: 'Général', es: 'General' },
  depression: { en: 'Depression', fr: 'Dépression', es: 'Depresión' },
  mindfulness: { en: 'Mindfulness', fr: 'Pleine conscience', es: 'Atención plena' },
  coping_skills: { en: 'Coping Skills', fr: "Stratégies d'adaptation", es: 'Habilidades de afrontamiento' },
  grief: { en: 'Grief & Loss', fr: 'Deuil & perte', es: 'Duelo y pérdida' },
  trauma: { en: 'Trauma', fr: 'Traumatisme', es: 'Trauma' },
}

function getCategoryLabel(category: string, locale: 'en' | 'fr' | 'es'): string {
  return categoryLabels[category]?.[locale] || category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url?: string | null
}

interface ResourceCardProps {
  resource: Resource
  locale: 'en' | 'fr' | 'es'
  variant?: 'owned' | 'library' | 'saved'
  index?: number
  viewMode?: 'grid' | 'list'
  onPreview?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRemove?: () => void
  onShare?: () => void
  onDuplicate?: () => void
  onBookmark?: (resourceId: string) => void
  members?: SimpleMember[]
  groups?: { id: string; name: string; color: string; member_ids: string[] }[]
  onShareWithMembers?: (resourceId: string, memberIds: string[], message?: string) => Promise<void>
  onAddMember?: () => void
  isDeleting?: boolean
  isRemoving?: boolean
  isDuplicating?: boolean
  isOwner?: boolean
  showCuratedBadge?: boolean
  isBookmarked?: boolean
}

export function ResourceCard({
  resource,
  locale,
  variant = 'owned',
  index = 0,
  viewMode = 'grid',
  onPreview,
  onEdit,
  onDelete,
  onRemove,
  onShare,
  onDuplicate,
  onBookmark,
  members = [],
  groups,
  onShareWithMembers,
  onAddMember,
  isDeleting = false,
  isRemoving = false,
  isDuplicating = false,
  isOwner = true,
  showCuratedBadge = false,
  isBookmarked = false,
}: ResourceCardProps) {
  const router = useRouter()
  const [showShareModal, setShowShareModal] = useState(false)

  const TypeIcon = resourceTypeIcons[resource.type] || FileText
  const styles = resourceTypeStyles[resource.type] || resourceTypeStyles.worksheet
  const statusLabel = statusLabels[resource.status] || statusLabels.draft
  const isOnboarding = resource.visibility === 'onboarding'

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

  // List View
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        onClick={handleClick}
        className={`
          group bg-white rounded-xl p-4
          cursor-pointer transition-all duration-200
          border border-gray-200 hover:border-gray-300 hover:shadow-sm
          flex items-center gap-4
          ${isDeleting || isRemoving || isDuplicating ? 'opacity-50 pointer-events-none' : ''}
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
                <span className="text-xs text-gray-400">{getCategoryLabel(resource.category, locale)}</span>
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

          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${resource.visibility === 'onboarding' ? 'text-teal-600 bg-teal-50' : 'text-gray-500 bg-white'}`}>
            {resource.visibility === 'onboarding' ? (
              <>
                <BookMarked className="w-3 h-3" />
                {locale === 'fr' ? 'Onboarding' : locale === 'es' ? 'Onboarding' : 'Onboarding'}
              </>
            ) : resource.visibility === 'public' ? (
              <>
                <Globe className="w-3 h-3" />
                {locale === 'fr' ? 'Public' : locale === 'es' ? 'Público' : 'Public'}
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                {locale === 'fr' ? 'Privé' : locale === 'es' ? 'Privado' : 'Private'}
              </>
            )}
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

          <span className="text-xs text-gray-400">
            {resource.blocks?.length || 0} {locale === 'fr' ? 'blocs' : locale === 'es' ? 'bloques' : 'blocks'}
          </span>

          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={handleClick}>
                <Eye className="w-4 h-4 mr-2 text-gray-400" />
                {locale === 'fr' ? 'Aperçu' : locale === 'es' ? 'Vista previa' : 'Preview'}
              </DropdownMenuItem>
              {variant === 'owned' && isOwner && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Modifier' : locale === 'es' ? 'Editar' : 'Edit'}
                </DropdownMenuItem>
              )}
              {onDuplicate && !(isOnboarding && !isOwner) && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Dupliquer' : locale === 'es' ? 'Duplicar' : 'Duplicate'}
                </DropdownMenuItem>
              )}
              {!isOnboarding && (variant === 'owned' || variant === 'saved') && onShare && (
                <DropdownMenuItem onClick={onShare} className="text-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Send'}
                </DropdownMenuItem>
              )}
              {(onDelete || onRemove) && !(isOnboarding && !isOwner) && (
                <>
                  <DropdownMenuSeparator />
                  {isOwner && onDelete ? (
                    <DropdownMenuItem onClick={onDelete} className="text-red-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
                    </DropdownMenuItem>
                  ) : onRemove ? (
                    <DropdownMenuItem onClick={onRemove} className="text-amber-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Retirer' : locale === 'es' ? 'Quitar' : 'Remove'}
                    </DropdownMenuItem>
                  ) : null}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    )
  }

  // Grid View (default)
  return (
  <>
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={handleClick}
      className={`
        group bg-white rounded-2xl p-5
        cursor-pointer transition-all duration-200
        border border-gray-200 hover:border-gray-300 hover:shadow-sm
        ${isDeleting || isRemoving || isDuplicating ? 'opacity-50 pointer-events-none' : ''}
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
              <p className="text-xs text-gray-400 mt-0.5">{getCategoryLabel(resource.category, locale)}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={handleMenuClick}>
          {/* Bookmark Button - for library variant */}
          {variant === 'library' && onBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBookmark(resource.id)
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 ${
                isBookmarked
                  ? 'bg-rose-50 text-rose-400'
                  : 'hover:bg-red-50 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100'
              }`}
              title={locale === 'fr' ? (isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris') : locale === 'es' ? (isBookmarked ? 'Quitar de favoritos' : 'Agregar a favoritos') : (isBookmarked ? 'Remove from favorites' : 'Add to favorites')}
            >
              <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-300' : ''}`} />
            </button>
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
                {locale === 'fr' ? 'Aperçu' : locale === 'es' ? 'Vista previa' : 'Preview'}
              </DropdownMenuItem>
              {variant === 'owned' && isOwner && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Modifier' : locale === 'es' ? 'Editar' : 'Edit'}
                </DropdownMenuItem>
              )}
              {onDuplicate && !(isOnboarding && !isOwner) && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Dupliquer' : locale === 'es' ? 'Duplicar' : 'Duplicate'}
                </DropdownMenuItem>
              )}
              {!isOnboarding && (variant === 'owned' || variant === 'saved') && onShare && (
                <DropdownMenuItem onClick={onShare} className="text-purple-600">
                  <Users className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Send'}
                </DropdownMenuItem>
              )}
              {!isOnboarding && variant === 'library' && members.length > 0 && onShareWithMembers && (
                <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                  <Send className="w-4 h-4 mr-2 text-gray-400" />
                  {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Send'}
                </DropdownMenuItem>
              )}
              {(onDelete || onRemove) && !(isOnboarding && !isOwner) && (
                <>
                  <DropdownMenuSeparator />
                  {isOwner && onDelete ? (
                    <DropdownMenuItem onClick={onDelete} className="text-red-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
                    </DropdownMenuItem>
                  ) : onRemove ? (
                    <DropdownMenuItem onClick={onRemove} className="text-amber-500">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Retirer' : locale === 'es' ? 'Quitar' : 'Remove'}
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
        {resource.description?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() || (locale === 'fr' ? 'Aucune description' : locale === 'es' ? 'Sin descripción' : 'No description')}
      </p>

      {/* Footer: Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Language */}
        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
          {resource.language?.toUpperCase()}
        </span>

        {/* Visibility */}
        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-lg">
          {resource.visibility === 'public' ? (
            <>
              <Globe className="w-3 h-3" />
              {locale === 'fr' ? 'Public' : locale === 'es' ? 'Público' : 'Public'}
            </>
          ) : (
            <>
              <Lock className="w-3 h-3" />
              {locale === 'fr' ? 'Privé' : locale === 'es' ? 'Privado' : 'Private'}
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
            {locale === 'fr' ? 'Recommandé' : locale === 'es' ? 'Seleccionado' : 'Curated'}
          </span>
        )}

        {/* Block count - pushed to right */}
        <span className="text-xs text-gray-400 ml-auto">
          {resource.blocks?.length || 0} {locale === 'fr' ? 'blocs' : locale === 'es' ? 'bloques' : 'blocks'}
        </span>
      </div>

    </motion.div>

    {/* Share Modal */}
    {onShareWithMembers && (
      <ShareResourceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resource={resource}
        members={members}
        locale={locale}
        onShare={onShareWithMembers}
        onAddMember={onAddMember}
        groups={groups}
      />
    )}
  </>
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
  onDuplicate,
  onBookmark,
  isDeleting = false,
  isDuplicating = false,
  isOwner = true,
  showCuratedBadge = false,
  isBookmarked = false,
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
        group bg-white rounded-xl p-4
        cursor-pointer transition-all duration-200
        border border-gray-200 hover:border-gray-300 hover:shadow-sm
        flex items-center gap-4
        ${isDeleting || isDuplicating ? 'opacity-50 pointer-events-none' : ''}
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
              <span className="text-xs text-gray-400">{getCategoryLabel(resource.category, locale)}</span>
            </>
          )}
        </div>
        <h3 className="font-medium text-gray-900 truncate">
          {resource.title}
        </h3>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={handleMenuClick}>
        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
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

        {/* Bookmark Button - for library variant */}
        {variant === 'library' && onBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onBookmark(resource.id)
            }}
            className={`p-1.5 rounded-lg transition-all duration-200 ${
              isBookmarked
                ? 'bg-rose-50 text-rose-400'
                : 'hover:bg-red-50 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100'
            }`}
            title={locale === 'fr' ? (isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris') : locale === 'es' ? (isBookmarked ? 'Quitar de favoritos' : 'Agregar a favoritos') : (isBookmarked ? 'Remove from favorites' : 'Add to favorites')}
          >
            <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-300' : ''}`} />
          </button>
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
              {locale === 'fr' ? 'Aperçu' : locale === 'es' ? 'Vista previa' : 'Preview'}
            </DropdownMenuItem>
            {variant === 'owned' && isOwner && onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2 text-gray-400" />
                {locale === 'fr' ? 'Modifier' : locale === 'es' ? 'Editar' : 'Edit'}
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2 text-gray-400" />
                {locale === 'fr' ? 'Dupliquer' : locale === 'es' ? 'Duplicar' : 'Duplicate'}
              </DropdownMenuItem>
            )}
            {variant === 'owned' && onShare && (
              <DropdownMenuItem onClick={onShare} className="text-purple-600">
                <Users className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Envoyer' : locale === 'es' ? 'Enviar' : 'Send'}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-500">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Supprimer' : locale === 'es' ? 'Eliminar' : 'Delete'}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  )
}

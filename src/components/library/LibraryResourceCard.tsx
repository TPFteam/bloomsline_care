'use client'

import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  Puzzle,
  Sun,
  BookOpen,
  FileText,
  Clock,
  Users,
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Star,
  Eye,
  Copy,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { LibraryResource, ResourceType } from '@/types/library'
import { formatDuration } from '@/types/library'

interface LibraryResourceCardProps {
  resource: LibraryResource
  isSaved?: boolean
  onSave?: (resource: LibraryResource) => void
  onUnsave?: (resource: LibraryResource) => void
  onView?: (resource: LibraryResource) => void
  onDuplicate?: (resource: LibraryResource) => void
  onShare?: (resource: LibraryResource) => void
  onUseWithClient?: (resource: LibraryResource) => void
  t: any
}

const typeIcons: Record<ResourceType, React.ElementType> = {
  assessment: ClipboardCheck,
  activity: Puzzle,
  ritual: Sun,
  educational: BookOpen,
  template: FileText,
}

const typeColors: Record<ResourceType, { bg: string; text: string; border: string }> = {
  assessment: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  activity: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  ritual: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  educational: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  template: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
}

export function LibraryResourceCard({
  resource,
  isSaved = false,
  onSave,
  onUnsave,
  onView,
  onDuplicate,
  onShare,
  onUseWithClient,
  t,
}: LibraryResourceCardProps) {
  const TypeIcon = typeIcons[resource.type] || FileText
  const colors = typeColors[resource.type] || typeColors.template

  const handleSaveToggle = () => {
    if (isSaved) {
      onUnsave?.(resource)
    } else {
      onSave?.(resource)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 hover:border-lavender-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Thumbnail / Type Header */}
      <div className={`h-32 ${colors.bg} relative flex items-center justify-center`}>
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <TypeIcon className={`w-12 h-12 ${colors.text} opacity-50`} />
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="outline"
            className={`${colors.bg} ${colors.text} ${colors.border} text-xs font-medium`}
          >
            <TypeIcon className="w-3 h-3 mr-1" />
            {t.library.types[resource.type]}
          </Badge>
        </div>

        {/* Curated Badge */}
        {resource.is_curated && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-mint-500 text-white text-xs">
              {t.library.resource.curated}
            </Badge>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 ${
            isSaved
              ? 'bg-lavender-500 text-white'
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-lavender-600'
          }`}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-lavender-700 transition-colors">
          {resource.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {resource.description?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
          {resource.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
              +{resource.tags.length - 3}
            </span>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {resource.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(resource.duration_minutes)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {t.library.ageGroups[resource.age_group]}
          </span>
          {resource.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {resource.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span>{resource.save_count} {t.library.resource.saves}</span>
          <span>{resource.use_count} {t.library.resource.uses}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1 bg-lavender-600 hover:bg-lavender-700 text-white"
            onClick={() => onView?.(resource)}
          >
            <Eye className="w-4 h-4 mr-1" />
            {t.library.resource.viewDetails}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="px-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onUseWithClient?.(resource)}>
                <Users className="w-4 h-4 mr-2" />
                {t.library.resource.useWithClient}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(resource)}>
                <Copy className="w-4 h-4 mr-2" />
                {t.library.resource.duplicate}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onShare?.(resource)}>
                <Share2 className="w-4 h-4 mr-2" />
                {t.library.resource.share}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  )
}

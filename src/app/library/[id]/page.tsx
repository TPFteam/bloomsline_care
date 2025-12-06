'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  Bookmark,
  BookmarkCheck,
  Copy,
  Share2,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  Package,
  Settings2,
  ClipboardCheck,
  Puzzle,
  Sun,
  BookOpen,
  FileText,
  UserPlus,
  Download,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { sampleLibraryResources } from '@/lib/data/sampleLibraryResources'
import { formatDuration } from '@/types/library'
import type { ResourceType } from '@/types/library'

const typeIcons: Record<ResourceType, React.ElementType> = {
  assessment: ClipboardCheck,
  activity: Puzzle,
  ritual: Sun,
  educational: BookOpen,
  template: FileText,
}

// Enhanced type config with gradients matching Member Hub style
const typeConfig: Record<ResourceType, {
  gradient: string
  bg: string
  text: string
  border: string
  iconBg: string
  glow: string
  lightBg: string
}> = {
  assessment: {
    gradient: 'from-blue-400 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
    lightBg: 'from-blue-50 to-blue-100/50',
  },
  activity: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
  ritual: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
    lightBg: 'from-amber-50 to-amber-100/50',
  },
  educational: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
    lightBg: 'from-purple-50 to-purple-100/50',
  },
  template: {
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    iconBg: 'bg-slate-100/80',
    glow: 'shadow-slate-200/50',
    lightBg: 'from-slate-50 to-slate-100/50',
  },
}

export default function ResourceDetailPage() {
  const params = useParams()
  const { t } = useLanguage()
  const [isSaved, setIsSaved] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  // Find the resource
  const resource = useMemo(() => {
    return sampleLibraryResources.find(r => r.id === params.id)
  }, [params.id])

  if (!resource) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-8 shadow-lg shadow-gray-200/40 border border-white/60"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Resource not found</h1>
          <Link href="/library">
            <Button className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl">
              Back to Library
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const TypeIcon = typeIcons[resource.type] || FileText
  const config = typeConfig[resource.type] || typeConfig.template

  // Related resources (same category, different id)
  const relatedResources = sampleLibraryResources
    .filter(r => r.category === resource.category && r.id !== resource.id)
    .slice(0, 3)

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-gray-500 mb-6"
        >
          <Link href="/library" className="hover:text-lavender-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            {t.library.title}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-xs">{resource.title}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] overflow-hidden shadow-lg shadow-gray-200/40 border border-white/60"
            >
              {/* Type Header */}
              <div className={`h-28 bg-gradient-to-br ${config.lightBg} relative flex items-center px-6`}>
                <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.glow}`}>
                    <TypeIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Badge className={`${config.bg} ${config.text} ${config.border} border`}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {t.library.types[resource.type]}
                  </Badge>
                  {resource.is_curated && (
                    <Badge className="bg-gradient-to-r from-mint-400 to-mint-600 text-white border-0 shadow-md">
                      <Star className="w-3 h-3 mr-1 fill-white" />
                      {t.library.resource.curated}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Title & Meta */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{resource.title}</h1>
                <p className="text-gray-600 mb-5 leading-relaxed">{resource.description}</p>

                {/* Meta Row - Enhanced */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {resource.duration_minutes && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {formatDuration(resource.duration_minutes)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    {t.library.ageGroups[resource.age_group]}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-sm ${config.bg} ${config.text}`}>
                    {t.library.difficulty[resource.difficulty]}
                  </span>
                  {resource.rating && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-sm text-amber-700">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {resource.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1.5 bg-lavender-50 text-lavender-700 rounded-full hover:bg-lavender-100 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats - Enhanced */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <Heart className="w-4 h-4 text-coral-400" />
                    {resource.save_count} {t.library.resource.saves}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <Download className="w-4 h-4 text-mint-500" />
                    {resource.use_count} {t.library.resource.uses}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Overview Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 hover-lift"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-lavender-100/80 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-md">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.overview}</h2>
              </div>
              <p className="text-gray-700 leading-relaxed">{resource.content.overview}</p>
            </motion.div>

            {/* Instructions */}
            {resource.content.instructions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 hover-lift"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.instructions}</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{resource.content.instructions}</p>
              </motion.div>
            )}

            {/* Materials Needed */}
            {resource.content.materials_needed.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 hover-lift"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.materials}</h2>
                </div>
                <ul className="space-y-3">
                  {resource.content.materials_needed.map((material, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-700">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
                      {material}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Content Sections */}
            {resource.content.sections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 hover-lift"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.sections}</h2>
                </div>
                <div className="space-y-3">
                  {resource.content.sections.map((section, index) => (
                    <motion.div
                      key={section.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        activeSection === index
                          ? 'bg-gradient-to-br from-lavender-50 to-lavender-100/50 border-lavender-300 shadow-md shadow-lavender-100'
                          : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                      }`}
                      onClick={() => setActiveSection(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold ${
                            activeSection === index
                              ? 'bg-gradient-to-br from-lavender-400 to-lavender-600 text-white shadow-md'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <h3 className="font-medium text-gray-900">{section.title}</h3>
                        </div>
                        {section.duration_minutes && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 px-2 py-1 bg-white/80 rounded-full">
                            <Clock className="w-3 h-3" />
                            {section.duration_minutes} {t.library.resource.minutes}
                          </span>
                        )}
                      </div>
                      {activeSection === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-sm text-gray-600 mt-3 pl-10 border-l-2 border-lavender-200"
                        >
                          <p className="pl-3">{section.content}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Practitioner Tips */}
            {resource.content.tips.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 rounded-[1.5rem] border-2 border-amber-200/60 p-6 shadow-lg shadow-amber-100/30 hover-lift"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                      <Lightbulb className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.tips}</h2>
                </div>
                <ul className="space-y-3">
                  {resource.content.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3 text-gray-700 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Modifications */}
            {resource.content.modifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 hover-lift"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                      <Settings2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{t.library.detail.modifications}</h2>
                </div>
                <div className="space-y-3">
                  {resource.content.modifications.map((mod) => (
                    <motion.div
                      key={mod.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/30 rounded-xl border border-purple-100 hover:border-purple-200 transition-all"
                    >
                      <span className="inline-block px-3 py-1 bg-gradient-to-r from-purple-400 to-purple-600 text-white text-xs font-semibold rounded-full shadow-sm mb-2">
                        {mod.for_group}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{mod.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 sticky top-8"
            >
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    className={`w-full h-12 rounded-xl shadow-lg transition-all duration-300 ${
                      isSaved
                        ? 'bg-gradient-to-r from-mint-500 to-mint-600 hover:from-mint-600 hover:to-mint-700 shadow-mint-200/50'
                        : 'bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lavender-200/50'
                    }`}
                    onClick={() => setIsSaved(!isSaved)}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-5 h-5 mr-2" />
                        {t.library.resource.saved}
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5 mr-2" />
                        {t.library.resource.saveToLibrary}
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" className="w-full h-11 rounded-xl border-2 border-lavender-200 hover:border-lavender-300 hover:bg-lavender-50 transition-all">
                    <UserPlus className="w-4 h-4 mr-2 text-lavender-600" />
                    <span className="text-lavender-700">{t.library.resource.useWithClient}</span>
                  </Button>
                </motion.div>

                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button variant="outline" className="w-full h-10 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                    <Button variant="outline" className="w-full h-10 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Category Info */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{t.library.filters.category}</p>
                <div className="inline-flex items-center px-3 py-2 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{t.library.categories[resource.category]}</span>
                </div>
              </div>

              {/* Creator Info - Enhanced */}
              {resource.creator_name && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{t.library.resource.by}</p>

                  {resource.creator_profile ? (
                    <Link href={resource.creator_profile.slug ? `/p/${resource.creator_profile.slug}` : '#'}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-gradient-to-br from-lavender-50/50 to-purple-50/30 rounded-xl border border-lavender-100 hover:border-lavender-300 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {resource.creator_profile.avatar_url ? (
                              <img
                                src={resource.creator_profile.avatar_url}
                                alt={resource.creator_name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-lg font-bold text-white">
                                  {resource.creator_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {resource.creator_profile.is_verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-mint-400 to-mint-600 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-lavender-700 transition-colors">
                                {resource.creator_name}
                              </p>
                            </div>

                            {/* Credentials */}
                            {resource.creator_profile.credentials.length > 0 && (
                              <p className="text-xs text-lavender-600 font-medium mt-0.5">
                                {resource.creator_profile.credentials.slice(0, 3).join(', ')}
                              </p>
                            )}

                            {/* Headline */}
                            {resource.creator_profile.headline && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {resource.creator_profile.headline}
                              </p>
                            )}

                            {/* Specialties Tags */}
                            {resource.creator_profile.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resource.creator_profile.specialties.slice(0, 3).map((specialty, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] px-2 py-0.5 bg-white/80 text-gray-600 rounded-full border border-gray-100"
                                  >
                                    {specialty}
                                  </span>
                                ))}
                                {resource.creator_profile.specialties.length > 3 && (
                                  <span className="text-[10px] px-2 py-0.5 text-gray-400">
                                    +{resource.creator_profile.specialties.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Years Experience */}
                            {resource.creator_profile.years_experience && (
                              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                {resource.creator_profile.years_experience}+ years experience
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-lavender-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </motion.div>
                    </Link>
                  ) : (
                    /* Fallback for resources without full profile */
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-100 to-lavender-200 flex items-center justify-center">
                        <span className="text-sm font-semibold text-lavender-700">
                          {resource.creator_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{resource.creator_name}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Related Resources */}
            {relatedResources.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-lavender-400 to-lavender-600" />
                  {t.library.detail.relatedResources}
                </h3>
                <div className="space-y-3">
                  {relatedResources.map((related) => {
                    const RelatedIcon = typeIcons[related.type] || FileText
                    const relatedConfig = typeConfig[related.type] || typeConfig.template
                    return (
                      <Link
                        key={related.id}
                        href={`/library/${related.id}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, x: 4 }}
                          className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/30 hover:from-lavender-50 hover:to-lavender-100/30 border border-gray-100 hover:border-lavender-200 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg ${relatedConfig.iconBg} flex items-center justify-center flex-shrink-0`}>
                              <RelatedIcon className={`w-4 h-4 ${relatedConfig.text}`} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                                {related.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {t.library.types[related.type]}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Link href="/library">
            <motion.div whileHover={{ x: -4 }} className="inline-block">
              <Button variant="ghost" className="rounded-xl hover:bg-white/80 transition-all">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.library.backToDashboard}
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

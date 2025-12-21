'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Share2,
  X,
  Plus,
  FileText,
  BookOpen,
  Lightbulb,
  Upload,
  Paperclip,
  Trash2,
  Sparkles,
  CheckCircle,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import type { ResourceCategory } from '@/types/library'

// Simplified resource types for practitioners based on research
type PractitionerResourceType = 'worksheet' | 'psychoeducation' | 'exercise' | 'table'

interface ResourceTypeOption {
  id: PractitionerResourceType
  icon: React.ElementType
  gradient: string
  iconBg: string
  glow: string
  examples: string[]
  comingSoon?: boolean
}

// 4 main resource types practitioners commonly create
const resourceTypes: ResourceTypeOption[] = [
  {
    id: 'worksheet',
    icon: FileText,
    gradient: 'from-blue-400 to-blue-600',
    iconBg: 'bg-blue-100/80',
    glow: 'shadow-blue-200/50',
    examples: ['Journal de pensées', 'Journal d\'humeur', 'Évaluations', 'Liste de symptômes'],
  },
  {
    id: 'table',
    icon: Table2,
    gradient: 'from-emerald-400 to-emerald-600',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    examples: ['TCC', 'Tableau des émotions', 'Journal de gratitude'],
  },
  {
    id: 'psychoeducation',
    icon: BookOpen,
    gradient: 'from-purple-400 to-purple-600',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
    examples: ['Fiches explicatives', 'Guides de traitement', 'Stratégies d\'adaptation'],
  },
  {
    id: 'exercise',
    icon: Lightbulb,
    gradient: 'from-amber-400 to-amber-600',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
    examples: ['Techniques d\'ancrage', 'Exercices de respiration', 'Pleine conscience'],
    comingSoon: true,
  },
]

const typeLabels: Record<PractitionerResourceType, { en: string; fr: string }> = {
  worksheet: { en: 'Worksheet', fr: 'Exercice' },
  table: { en: 'Table Exercise', fr: 'Tableau' },
  psychoeducation: { en: 'Education', fr: 'Éducation' },
  exercise: { en: 'Exercise / Activity', fr: 'Exercice / Activité' },
}

const typeDescriptions: Record<PractitionerResourceType, { en: string; fr: string }> = {
  worksheet: {
    en: 'Structured forms and questionnaires with optional scoring for assessments',
    fr: 'Créez, personnalisez et partagez vos propres exercices à vos patients',
  },
  table: {
    en: 'Table-based exercises where members can add multiple entries (thought records, logs)',
    fr: 'TCC - Tableau des émotions - Journal de gratitude',
  },
  psychoeducation: {
    en: 'Educational materials explaining conditions, treatments, or strategies',
    fr: 'Matériel éducatif expliquant les conditions, traitements ou stratégies',
  },
  exercise: {
    en: 'Guided activities and techniques to practice in or outside sessions',
    fr: 'Activités guidées et techniques à pratiquer en séance ou en dehors',
  },
}

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

interface Attachment {
  id: string
  name: string
  size: number
  type: string
}

export default function CreateResourcePage() {
  const { t, locale } = useLanguage()
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<'select-type' | 'create-form'>('select-type')
  const [selectedResourceType, setSelectedResourceType] = useState<PractitionerResourceType | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Handle type selection
  const handleTypeSelect = (type: PractitionerResourceType) => {
    setSelectedResourceType(type)
  }

  const handleContinue = () => {
    if (selectedResourceType) {
      // Navigate to the dedicated page for each resource type
      router.push(`/resources/create/${selectedResourceType}`)
    }
  }

  const handleBack = () => {
    setStep('select-type')
  }

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
      }))
      setAttachments([...attachments, ...newAttachments])
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Handle save
  const handleSave = async () => {
    if (!title || !selectedResourceType || !selectedCategory || !content) {
      alert('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      router.push('/resources')
    }, 1500)
  }

  // Check if form is valid
  const isValid = title && selectedResourceType && selectedCategory && content

  // Get current type config
  const currentTypeConfig = selectedResourceType
    ? resourceTypes.find(t => t.id === selectedResourceType)
    : null

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {step === 'select-type' ? (
            <motion.div
              key="select-type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
              >
                <Link href="/resources">
                  <motion.div whileHover={{ x: -4 }} className="inline-block">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t.library.myResources.title}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Title Section */}
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-lavender-100/80 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-lg shadow-lavender-200/50">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Créer un support' : 'Create a Resource'}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Quel type de support souhaitez-vous créer ?'
                    : 'What type of resource would you like to create?'}
                </p>
              </div>

              {/* Resource Type Selection */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {resourceTypes.map((type, index) => {
                    const Icon = type.icon
                    const isSelected = selectedResourceType === type.id
                    const isDisabled = type.comingSoon
                    return (
                      <motion.div
                        key={type.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={isDisabled ? {} : { scale: 1.02, y: -4 }}
                        whileTap={isDisabled ? {} : { scale: 0.98 }}
                        onClick={() => !isDisabled && handleTypeSelect(type.id)}
                        className={`relative bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-6 transition-all duration-300 border-2 ${
                          isDisabled
                            ? 'cursor-not-allowed opacity-70 border-white/60 shadow-lg shadow-gray-200/40'
                            : isSelected
                            ? `cursor-pointer border-transparent ring-2 ring-offset-2 ring-offset-white shadow-xl ${type.glow}`
                            : 'cursor-pointer border-white/60 shadow-lg shadow-gray-200/40 hover:shadow-xl'
                        }`}
                        style={{
                          boxShadow: isSelected && !isDisabled ? `0 0 0 2px var(--tw-ring-color)` : undefined,
                        }}
                      >
                        {/* Coming Soon badge */}
                        {isDisabled && (
                          <div className="absolute top-4 right-4">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                              {locale === 'fr' ? 'Bientôt' : 'Coming Soon'}
                            </span>
                          </div>
                        )}

                        {/* Selection indicator */}
                        {isSelected && !isDisabled && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-4 right-4"
                          >
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-md`}>
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-2xl ${type.iconBg} flex items-center justify-center flex-shrink-0 ${isDisabled ? 'grayscale-[30%]' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center shadow-lg ${isDisabled ? 'grayscale-[30%]' : ''}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-semibold mb-1 ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                              {typeLabels[type.id][locale]}
                            </h3>
                            <p className={`text-sm mb-3 leading-relaxed ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                              {typeDescriptions[type.id][locale]}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {type.examples.slice(0, 3).map((example, i) => (
                                <span
                                  key={i}
                                  className={`text-xs px-2 py-1 rounded-md ${isDisabled ? 'bg-gray-100/60 text-gray-400' : 'bg-gray-100/80 text-gray-600'}`}
                                >
                                  {example}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Continue Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedResourceType}
                      className={`px-8 py-3 h-auto rounded-xl text-base font-medium transition-all duration-300 ${
                        selectedResourceType
                          ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lg shadow-lavender-200/50'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {locale === 'fr' ? 'Continuer' : 'Continue'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
              >
                <motion.div whileHover={{ x: -4 }} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="rounded-xl hover:bg-white/80"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Changer le type' : 'Change type'}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!isValid} className="rounded-xl">
                    <Eye className="w-4 h-4 mr-2" />
                    {t.library.create.preview}
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lg shadow-lavender-200/50 rounded-xl"
                      onClick={handleSave}
                      disabled={!isValid || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t.library.create.saving}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t.library.create.save}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Title Section with Selected Type */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  {currentTypeConfig && (
                    <div className={`w-14 h-14 rounded-2xl ${currentTypeConfig.iconBg} flex items-center justify-center`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentTypeConfig.gradient} flex items-center justify-center shadow-lg`}>
                        <currentTypeConfig.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {locale === 'fr' ? 'Nouvelle ' : 'New '}
                      {selectedResourceType && typeLabels[selectedResourceType][locale]}
                    </h1>
                    <p className="text-gray-600">{t.library.create.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.library.create.basicInfo}
                    </h2>

                    {/* Title */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t.library.create.resourceTitle} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.library.create.resourceTitlePlaceholder}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {t.library.create.description}
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t.library.create.descriptionPlaceholder}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all resize-none"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.library.create.category} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map((category) => (
                          <motion.button
                            key={category}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                              selectedCategory === category
                                ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-md shadow-lavender-200/50'
                                : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                            }`}
                          >
                            {t.library.categories[category]}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.library.create.content} <span className="text-red-500">*</span>
                    </h2>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={t.library.create.contentPlaceholder}
                      rows={12}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent transition-all resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {locale === 'fr' ? 'Le formatage Markdown est pris en charge' : 'Markdown formatting is supported'}
                    </p>
                  </motion.div>

                  {/* Attachments */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.library.create.attachments}
                    </h2>

                    {/* Upload Area */}
                    <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-lavender-400 hover:bg-lavender-50/50 transition-all">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {locale === 'fr' ? 'Cliquez pour télécharger des fichiers' : 'Click to upload files'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, images, etc.</p>
                    </label>

                    {/* Attachment List */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-3 bg-gray-50/80 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-lavender-100 flex items-center justify-center">
                                <Paperclip className="w-4 h-4 text-lavender-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{attachment.name}</p>
                                <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAttachment(attachment.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Tags */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.library.create.tags}
                    </h2>

                    {/* Tag Input */}
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t.library.create.tagsPlaceholder}
                        className="flex-1 px-3 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent"
                      />
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                          className="rounded-xl h-10 w-10 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </div>

                    {/* Tag List */}
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="flex items-center gap-1 bg-lavender-50 text-lavender-700 border-0 px-3 py-1.5"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-lavender-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {tags.length === 0 && (
                        <p className="text-sm text-gray-400">
                          {locale === 'fr' ? 'Aucun tag ajouté' : 'No tags added yet'}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Sharing Options */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t.library.share.title}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {t.library.share.description}
                    </p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl border-2 border-lavender-200 hover:border-lavender-300 hover:bg-lavender-50"
                        disabled={!isValid}
                      >
                        <Share2 className="w-4 h-4 mr-2 text-lavender-600" />
                        <span className="text-lavender-700">{t.library.create.saveAndShare}</span>
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Tips */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 rounded-[1.5rem] border-2 border-amber-200/60 p-6 shadow-lg shadow-amber-100/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                          <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'fr' ? 'Conseils' : 'Tips'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Utilisez des titres clairs et descriptifs' : 'Use clear, descriptive titles'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Incluez des instructions étape par étape' : 'Include step-by-step instructions'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Ajoutez des tags pertinents' : 'Add relevant tags for discoverability'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Joignez des documents utiles' : 'Attach supporting documents when helpful'}
                      </li>
                    </ul>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

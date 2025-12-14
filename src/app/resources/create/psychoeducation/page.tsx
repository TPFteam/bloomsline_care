'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Eye,
  BookOpen,
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  List,
  AlertCircle,
  Quote,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Copy,
  Lightbulb,
  Brain,
  Target,
  BookMarked,
  Lock,
  Globe,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createResource, getResourceById, updateResource } from '@/lib/services/resources'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ResourceCategory } from '@/types/library'
import type { ResourceBlock, PsychoeducationSettings } from '@/types/resource'

// Content block types for psychoeducation
type ContentBlockType = 'heading' | 'paragraph' | 'key_points' | 'callout' | 'quote' | 'image_placeholder'

interface ContentBlock {
  id: string
  type: ContentBlockType
  content: string
  // For key points
  points?: string[]
  // For callout
  calloutType?: 'info' | 'warning' | 'tip' | 'example'
  // For quote
  attribution?: string
  // For image placeholder
  caption?: string
}

interface ContentBlockOption {
  type: ContentBlockType
  icon: React.ElementType
  label: { en: string; fr: string }
  description: { en: string; fr: string }
}

const contentBlockTypes: ContentBlockOption[] = [
  {
    type: 'heading',
    icon: Type,
    label: { en: 'Section Heading', fr: 'Titre de section' },
    description: { en: 'Add a title or section header', fr: 'Ajouter un titre ou en-tête' },
  },
  {
    type: 'paragraph',
    icon: AlignLeft,
    label: { en: 'Text Content', fr: 'Contenu texte' },
    description: { en: 'Educational text and explanations', fr: 'Texte éducatif et explications' },
  },
  {
    type: 'key_points',
    icon: List,
    label: { en: 'Key Points', fr: 'Points clés' },
    description: { en: 'Bulleted list of important points', fr: 'Liste à puces des points importants' },
  },
  {
    type: 'callout',
    icon: AlertCircle,
    label: { en: 'Callout Box', fr: 'Encadré' },
    description: { en: 'Highlighted info, tip, or warning', fr: 'Info, conseil ou avertissement mis en avant' },
  },
  {
    type: 'quote',
    icon: Quote,
    label: { en: 'Quote', fr: 'Citation' },
    description: { en: 'Inspirational or expert quote', fr: 'Citation inspirante ou d\'expert' },
  },
  {
    type: 'image_placeholder',
    icon: ImageIcon,
    label: { en: 'Image Placeholder', fr: 'Emplacement image' },
    description: { en: 'Space for diagram or illustration', fr: 'Espace pour diagramme ou illustration' },
  },
]

const calloutTypes = {
  info: { en: 'Information', fr: 'Information', icon: AlertCircle, color: 'blue' },
  warning: { en: 'Important', fr: 'Important', icon: AlertCircle, color: 'amber' },
  tip: { en: 'Tip', fr: 'Conseil', icon: Lightbulb, color: 'green' },
  example: { en: 'Example', fr: 'Exemple', icon: BookMarked, color: 'purple' },
}

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

function CreatePsychoeducationContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // Step state - start directly with build (skip template)
  const [step, setStep] = useState<'template' | 'build' | 'details'>('build')

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(!!editId)
  const [isLoading, setIsLoading] = useState(!!editId)

  // Document state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [learningObjectives, setLearningObjectives] = useState<string[]>([''])
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')

  // UI state
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)

  // View mode: 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 11)

  // Load existing resource for edit mode
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

      setIsLoading(true)
      try {
        // Get current user using browser client for proper auth
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error(locale === 'fr' ? 'Vous devez être connecté pour modifier' : 'You must be logged in to edit')
          router.push('/resources')
          return
        }

        const resource = await getResourceById(editId)
        if (resource) {
          // Check if user is the owner
          if (resource.practitioner_id !== user.id) {
            toast.error(locale === 'fr' ? 'Vous n\'êtes pas autorisé à modifier cette ressource' : 'You are not authorized to edit this resource')
            router.push('/resources')
            return
          }

          setIsEditMode(true)
          setTitle(typeof resource.title === 'string' ? resource.title : (resource.title as Record<string, string>)?.[locale] || '')
          setDescription(resource.description ? (typeof resource.description === 'string' ? resource.description : (resource.description as unknown as Record<string, string>)?.[locale] || '') : '')
          setSelectedCategory(resource.category as ResourceCategory)
          setVisibility(resource.visibility || 'private')
          setSaveAs(resource.status === 'published' ? 'published' : 'draft')

          // Load blocks
          if (resource.blocks && Array.isArray(resource.blocks)) {
            const loadedBlocks = resource.blocks.map((block: any) => ({
              id: block.id || generateId(),
              type: block.type,
              content: typeof block.content === 'string' ? block.content : (block.content as Record<string, string>)?.[locale] || '',
              points: block.points?.map((p: any) => typeof p === 'string' ? p : (p as Record<string, string>)?.[locale] || ''),
              calloutType: block.calloutType,
              attribution: block.attribution,
              caption: block.caption,
            }))
            setBlocks(loadedBlocks)
          }

          // Load learning objectives from settings
          const settings = resource.settings as any
          if (settings?.learningObjectives && Array.isArray(settings.learningObjectives)) {
            setLearningObjectives(settings.learningObjectives.length > 0 ? settings.learningObjectives : [''])
          }
        }
      } catch (error) {
        console.error('Error loading resource:', error)
        toast.error('Failed to load resource')
      } finally {
        setIsLoading(false)
      }
    }

    loadResource()
  }, [editId, locale, router])

  // Add new block
  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      ...(type === 'key_points' && { points: [''] }),
      ...(type === 'callout' && { calloutType: 'info' }),
      ...(type === 'quote' && { attribution: '' }),
      ...(type === 'image_placeholder' && { caption: '' }),
    }
    setBlocks([...blocks, newBlock])
    setExpandedBlock(newBlock.id)
    setShowBlockPicker(false)
  }

  // Update block
  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  // Delete block
  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  // Duplicate block
  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id)
    if (block) {
      const newBlock = { ...block, id: generateId() }
      const index = blocks.findIndex(b => b.id === id)
      const newBlocks = [...blocks]
      newBlocks.splice(index + 1, 0, newBlock)
      setBlocks(newBlocks)
    }
  }

  // Add key point
  const addKeyPoint = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.points) {
      updateBlock(blockId, { points: [...block.points, ''] })
    }
  }

  // Update key point
  const updateKeyPoint = (blockId: string, index: number, value: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.points) {
      const newPoints = [...block.points]
      newPoints[index] = value
      updateBlock(blockId, { points: newPoints })
    }
  }

  // Delete key point
  const deleteKeyPoint = (blockId: string, index: number) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.points && block.points.length > 1) {
      const newPoints = block.points.filter((_, i) => i !== index)
      updateBlock(blockId, { points: newPoints })
    }
  }

  // Learning objectives
  const addLearningObjective = () => {
    setLearningObjectives([...learningObjectives, ''])
  }

  const updateLearningObjective = (index: number, value: string) => {
    const newObjectives = [...learningObjectives]
    newObjectives[index] = value
    setLearningObjectives(newObjectives)
  }

  const deleteLearningObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!title || blocks.length === 0) {
      toast.error(locale === 'fr' ? 'Veuillez ajouter un titre et du contenu' : 'Please add a title and content')
      return
    }

    setIsSaving(true)

    try {
      // Convert blocks to resource format with proper typing
      const resourceBlocks: ResourceBlock[] = blocks.map(block => {
        const baseBlock = {
          id: block.id,
          type: block.type,
          content: block.content,
        }

        if (block.type === 'key_points') {
          return { ...baseBlock, type: 'key_points' as const, points: block.points }
        } else if (block.type === 'callout') {
          return { ...baseBlock, type: 'callout' as const, calloutType: block.calloutType }
        } else if (block.type === 'quote') {
          return { ...baseBlock, type: 'quote' as const, attribution: block.attribution }
        } else if (block.type === 'image_placeholder') {
          return { ...baseBlock, type: 'image_placeholder' as const, caption: block.caption }
        } else if (block.type === 'heading') {
          return { ...baseBlock, type: 'heading' as const }
        } else {
          return { ...baseBlock, type: 'paragraph' as const }
        }
      })

      // Build settings with proper typing
      const settings: PsychoeducationSettings = {
        learningObjectives: learningObjectives.filter(o => o.trim() !== ''),
        estimatedReadingTime: estimateReadingTime(),
      }

      if (isEditMode && editId) {
        // Update existing resource
        await updateResource(editId, {
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Ressource mise à jour avec succès!' : 'Resource updated successfully!')
      } else {
        // Create new resource
        await createResource({
          type: 'psychoeducation',
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Ressource créée avec succès!' : 'Resource created successfully!')
      }

      router.push('/resources')
    } catch (error) {
      console.error('Error saving resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving resource')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if can proceed to details
  const canProceedToDetails = title.trim() && blocks.length > 0

  // Estimate reading time
  const estimateReadingTime = () => {
    const wordCount = blocks.reduce((total, block) => {
      let words = block.content.split(/\s+/).length
      if (block.points) {
        words += block.points.join(' ').split(/\s+/).length
      }
      return total + words
    }, 0)
    return Math.max(1, Math.ceil(wordCount / 200)) // 200 words per minute
  }

  // Reset to edit mode
  const resetPreview = () => {
    setViewMode('edit')
  }

  // Render block preview
  const renderBlockPreview = (block: ContentBlock) => {
    return (
      <motion.div
        key={block.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        {/* Heading Block */}
        {block.type === 'heading' && (
          <h2 className="text-xl font-bold text-gray-900 mb-2">{block.content || 'Untitled Section'}</h2>
        )}

        {/* Paragraph Block */}
        {block.type === 'paragraph' && (
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{block.content}</p>
        )}

        {/* Key Points Block */}
        {block.type === 'key_points' && (
          <div>
            {block.content && <p className="font-medium text-gray-900 mb-2">{block.content}</p>}
            <ul className="space-y-2">
              {block.points?.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Callout Block */}
        {block.type === 'callout' && (
          <div className={`p-4 rounded-xl border-l-4 ${
            block.calloutType === 'info' ? 'bg-blue-50 border-blue-500' :
            block.calloutType === 'warning' ? 'bg-amber-50 border-amber-500' :
            block.calloutType === 'tip' ? 'bg-green-50 border-green-500' :
            'bg-purple-50 border-purple-500'
          }`}>
            <div className="flex items-start gap-3">
              {block.calloutType === 'tip' && <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />}
              {block.calloutType === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />}
              {block.calloutType === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />}
              {block.calloutType === 'example' && <BookMarked className="w-5 h-5 text-purple-600 mt-0.5" />}
              <p className={`${
                block.calloutType === 'info' ? 'text-blue-800' :
                block.calloutType === 'warning' ? 'text-amber-800' :
                block.calloutType === 'tip' ? 'text-green-800' :
                'text-purple-800'
              }`}>{block.content}</p>
            </div>
          </div>
        )}

        {/* Quote Block */}
        {block.type === 'quote' && (
          <blockquote className="border-l-4 border-purple-300 pl-4 py-2 italic">
            <p className="text-gray-700 text-lg">&ldquo;{block.content}&rdquo;</p>
            {block.attribution && (
              <footer className="text-gray-500 mt-2">— {block.attribution}</footer>
            )}
          </blockquote>
        )}

        {/* Image Placeholder Block */}
        {block.type === 'image_placeholder' && (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{block.content || 'Image placeholder'}</p>
            {block.caption && <p className="text-xs text-gray-400 mt-1">{block.caption}</p>}
          </div>
        )}
      </motion.div>
    )
  }

  // Render block editor
  const renderBlockEditor = (block: ContentBlock) => {
    const isExpanded = expandedBlock === block.id
    const blockType = contentBlockTypes.find(bt => bt.type === block.type)
    const Icon = blockType?.icon || BookOpen

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 shadow-md overflow-hidden"
      >
        {/* Block Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-purple-600" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {block.content || blockType?.label[locale] || 'Untitled'}
            </p>
            <p className="text-xs text-gray-500">{blockType?.label[locale]}</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Block Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100"
            >
              <div className="p-4 space-y-4">
                {/* Heading Block */}
                {block.type === 'heading' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Titre de la section' : 'Section Title'}
                    </label>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder={locale === 'fr' ? 'Entrez le titre...' : 'Enter heading...'}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Paragraph Block */}
                {block.type === 'paragraph' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Contenu' : 'Content'}
                    </label>
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder={locale === 'fr' ? 'Écrivez votre contenu éducatif...' : 'Write your educational content...'}
                      rows={5}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {/* Key Points Block */}
                {block.type === 'key_points' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre de la liste (optionnel)' : 'List Title (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Points clés à retenir' : 'e.g., Key takeaways'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Points' : 'Points'}
                      </label>
                      <div className="space-y-2">
                        {block.points?.map((point, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => updateKeyPoint(block.id, index, e.target.value)}
                              placeholder={`${locale === 'fr' ? 'Point' : 'Point'} ${index + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                            />
                            {(block.points?.length || 0) > 1 && (
                              <button
                                onClick={() => deleteKeyPoint(block.id, index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addKeyPoint(block.id)}
                        className="mt-2 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                      >
                        <Plus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter un point' : 'Add point'}
                      </button>
                    </div>
                  </>
                )}

                {/* Callout Block */}
                {block.type === 'callout' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Type d\'encadré' : 'Callout Type'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(calloutTypes).map(([key, value]) => {
                          const CalloutIcon = value.icon
                          const isSelected = block.calloutType === key
                          return (
                            <button
                              key={key}
                              onClick={() => updateBlock(block.id, { calloutType: key as 'info' | 'warning' | 'tip' | 'example' })}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                isSelected
                                  ? value.color === 'blue' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' :
                                    value.color === 'amber' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-400' :
                                    value.color === 'green' ? 'bg-green-100 text-green-700 ring-2 ring-green-400' :
                                    'bg-purple-100 text-purple-700 ring-2 ring-purple-400'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <CalloutIcon className="w-4 h-4" />
                              {value[locale]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Contenu' : 'Content'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Contenu de l\'encadré...' : 'Callout content...'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Quote Block */}
                {block.type === 'quote' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Citation' : 'Quote'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Entrez la citation...' : 'Enter the quote...'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Attribution (optionnel)' : 'Attribution (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.attribution || ''}
                        onChange={(e) => updateBlock(block.id, { attribution: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Carl Rogers' : 'e.g., Carl Rogers'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Image Placeholder Block */}
                {block.type === 'image_placeholder' && (
                  <>
                    <div className="p-8 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 text-center">
                      <ImageIcon className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <p className="text-sm text-purple-600 font-medium">
                        {locale === 'fr' ? 'Emplacement pour image' : 'Image Placeholder'}
                      </p>
                      <p className="text-xs text-purple-400 mt-1">
                        {locale === 'fr' ? 'Ajoutez une image après l\'enregistrement' : 'Add an image after saving'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description / Alt text' : 'Description / Alt text'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Décrivez l\'image...' : 'Describe the image...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Légende (optionnel)' : 'Caption (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder={locale === 'fr' ? 'Légende affichée sous l\'image' : 'Caption shown below the image'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Loading state when fetching resource for edit
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {locale === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Build Content (Main Step) */}
          {step === 'build' && (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
              >
                <Link href={isEditMode ? '/resources' : '/resources/create'}>
                  <motion.div whileHover={{ x: -4 }} className="inline-block">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Retour' : 'Back'}
                    </Button>
                  </motion.div>
                </Link>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-xl p-1 border border-white/60 shadow-sm">
                    <button
                      onClick={() => { setViewMode('edit'); resetPreview() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'edit'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {locale === 'fr' ? 'Éditer' : 'Edit'}
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        viewMode === 'preview'
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Aperçu' : 'Preview'}
                    </button>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={() => setStep('details')}
                      disabled={!canProceedToDetails}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-200/50 rounded-xl"
                    >
                      {locale === 'fr' ? 'Continuer' : 'Continue'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Edit Mode */}
                  {viewMode === 'edit' && (
                    <>
                      {/* Title Input */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                      >
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={locale === 'fr' ? 'Titre du document...' : 'Document title...'}
                          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400"
                        />
                      </motion.div>

                      {/* Content Blocks */}
                      <div className="space-y-3">
                        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks}>
                          {blocks.map((block) => (
                            <Reorder.Item key={block.id} value={block}>
                              {renderBlockEditor(block)}
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>

                      {/* Add Block Button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                      >
                        <button
                          onClick={() => setShowBlockPicker(!showBlockPicker)}
                          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {locale === 'fr' ? 'Ajouter une section' : 'Add a section'}
                        </button>

                        {/* Block Picker */}
                        <AnimatePresence>
                          {showBlockPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {contentBlockTypes.map((bt) => {
                                  const Icon = bt.icon
                                  return (
                                    <button
                                      key={bt.type}
                                      onClick={() => addBlock(bt.type)}
                                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors text-left"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-purple-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{bt.label[locale]}</p>
                                        <p className="text-xs text-gray-500">{bt.description[locale]}</p>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </>
                  )}

                  {/* Preview Mode */}
                  {viewMode === 'preview' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-8"
                    >
                      {/* Preview Header */}
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200/50">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title || 'Untitled Document'}</h1>
                            <p className="text-gray-500 text-sm">{estimateReadingTime()} min read</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewMode('edit')}
                          className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {locale === 'fr' ? 'Retour à l\'édition' : 'Back to Edit'}
                        </button>
                      </div>

                      {/* Preview Content */}
                      <div className="prose prose-purple max-w-none">
                        {blocks.length === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>{locale === 'fr' ? 'Aucun contenu à afficher' : 'No content to display'}</p>
                          </div>
                        ) : (
                          blocks.map(block => renderBlockPreview(block))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Tips */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-purple-50 via-violet-50/50 to-indigo-50/30 rounded-[1.5rem] border-2 border-purple-200/60 p-5 shadow-lg shadow-purple-100/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-100/80 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-md">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'fr' ? 'Conseils' : 'Tips'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Utilisez un langage simple et clair' : 'Use simple, clear language'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Incluez des exemples concrets' : 'Include concrete examples'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Aérez le contenu avec des listes' : 'Break up content with lists'}
                      </li>
                    </ul>
                  </motion.div>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5"
                  >
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{blocks.length}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'sections' : 'sections'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-purple-600">{estimateReadingTime()}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'min lecture' : 'min read'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-6"
              >
                <motion.div whileHover={{ x: -4 }} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('build')}
                    className="rounded-xl hover:bg-white/80"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Retour au contenu' : 'Back to content'}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-200/50 rounded-xl"
                    >
                      {isSaving ? (
                        <>
                          <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {isEditMode
                            ? (locale === 'fr' ? 'Mettre à jour' : 'Update Resource')
                            : (locale === 'fr' ? 'Enregistrer' : 'Save Resource')
                          }
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100/80 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600">
                      {blocks.length} {locale === 'fr' ? 'sections' : 'sections'} • {estimateReadingTime()} {locale === 'fr' ? 'min lecture' : 'min read'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description & Category */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {locale === 'fr' ? 'Description' : 'Description'}
                  </h2>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={locale === 'fr' ? 'Décrivez brièvement ce document...' : 'Briefly describe this resource...'}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none mb-4"
                  />

                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {locale === 'fr' ? 'Catégorie' : 'Category'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((category) => (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedCategory === category
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-200/50'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        {t.library.categories[category]}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Learning Objectives */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === 'fr' ? 'Objectifs d\'apprentissage' : 'Learning Objectives'}
                    </h2>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {locale === 'fr' ? 'Ce que le client apprendra de ce document' : 'What the client will learn from this resource'}
                  </p>
                  <div className="space-y-2">
                    {learningObjectives.map((objective, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={objective}
                          onChange={(e) => updateLearningObjective(index, e.target.value)}
                          placeholder={locale === 'fr' ? 'Ex: Comprendre les symptômes de l\'anxiété' : 'e.g., Understand anxiety symptoms'}
                          className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                        />
                        {learningObjectives.length > 1 && (
                          <button
                            onClick={() => deleteLearningObjective(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addLearningObjective}
                    className="mt-3 flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'fr' ? 'Ajouter un objectif' : 'Add objective'}
                  </button>
                </motion.div>

                {/* Visibility & Save Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 lg:col-span-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visibility */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        {visibility === 'private' ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        {locale === 'fr' ? 'Visibilité' : 'Visibility'}
                      </h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setVisibility('private')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                            visibility === 'private'
                              ? 'border-purple-400 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                          <span className="font-medium">{locale === 'fr' ? 'Privé' : 'Private'}</span>
                        </button>
                        <button
                          onClick={() => setVisibility('public')}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                            visibility === 'public'
                              ? 'border-purple-400 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                          <span className="font-medium">{locale === 'fr' ? 'Public' : 'Public'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {visibility === 'private'
                          ? (locale === 'fr' ? 'Visible uniquement pour vous' : 'Only visible to you')
                          : (locale === 'fr' ? 'Visible dans la bibliothèque publique' : 'Visible in the public library')
                        }
                      </p>
                    </div>

                    {/* Save As */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {locale === 'fr' ? 'Enregistrer comme' : 'Save as'}
                      </h3>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSaveAs('draft')}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            saveAs === 'draft'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <span className="font-medium">{locale === 'fr' ? 'Brouillon' : 'Draft'}</span>
                          <p className="text-xs mt-1 opacity-70">
                            {locale === 'fr' ? 'Enregistrer pour modifier plus tard' : 'Save to edit later'}
                          </p>
                        </button>
                        <button
                          onClick={() => setSaveAs('published')}
                          className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                            saveAs === 'published'
                              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <span className="font-medium">{locale === 'fr' ? 'Publié' : 'Published'}</span>
                          <p className="text-xs mt-1 opacity-70">
                            {locale === 'fr' ? 'Prêt à être assigné' : 'Ready to be assigned'}
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function CreatePsychoeducationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>}>
      <CreatePsychoeducationContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Plus,
  Trash2,
  GripVertical,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Lightbulb,
  Image as ImageIcon,
  Video,
  Paperclip,
  Upload,
  X,
  Play,
  ExternalLink,
  UserCheck,
  Send,
  RotateCcw,
  CheckCircle2,
  Lock,
  Globe,
  Loader2,
  Mic,
  FileUp,
  VideoIcon,
  // New block icons
  CircleDot,
  ToggleLeft,
  Smile,
  Calendar,
  Clock,
  Minus,
  Quote,
  Info,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createResource, getResourceById, updateResource } from '@/lib/services/resources'
import { uploadResourceFile, validateFile } from '@/lib/services/resource-storage'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/browser-client'
import type { ResourceBlock, WorksheetSettings } from '@/types/resource'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ResourceCategory } from '@/types/library'
import { toast } from 'sonner'

// Block types for worksheet
// Content blocks: heading, paragraph, image, divider, quote, tip (practitioner adds content)
// Response blocks: prompt, checklist, scale, multiple_choice, yes_no, mood, date, time, slider, video_response, audio_response, file_response (member responds)
// Legacy: video, file (kept for backward compatibility)
type BlockType =
  | 'heading' | 'paragraph' | 'image' | 'divider' | 'quote' | 'tip'
  | 'prompt' | 'checklist' | 'scale' | 'multiple_choice' | 'yes_no' | 'mood' | 'date_picker' | 'time_input' | 'slider'
  | 'video_response' | 'audio_response' | 'file_response'
  | 'video' | 'file' // Legacy types

interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url?: string // Supabase storage URL or preview URL
  path?: string // Supabase storage path
  isUploading?: boolean
  uploadError?: string
}

interface WorksheetBlock {
  id: string
  type: BlockType
  content: string
  // For checklist
  items?: string[]
  // For scale
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  // For prompt
  placeholder?: string
  lines?: number
  // For media blocks (image, video, file)
  mediaFile?: MediaFile
  mediaCaption?: string
  mediaAlt?: string
  // For video - support URL embed
  videoUrl?: string
  videoType?: 'upload' | 'youtube' | 'vimeo'
  // For response blocks (video_response, audio_response, file_response)
  responseRequired?: boolean
  responseMaxDuration?: number // in seconds for video/audio
  responseAcceptedTypes?: string[] // for file_response
  responseHint?: string // helper text for member
  // For multiple choice
  choices?: string[]
  allowMultiple?: boolean
  // For mood selector
  moodOptions?: { emoji: string; label: string }[]
  // For slider
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  // For quote/tip styling
  style?: 'default' | 'success' | 'warning' | 'info'
}

interface BlockTypeOption {
  type: BlockType
  icon: React.ElementType
  label: { en: string; fr: string }
  description: { en: string; fr: string }
}

const blockTypes: BlockTypeOption[] = [
  // === CONTENT BLOCKS (Practitioner adds content) ===
  {
    type: 'heading',
    icon: Type,
    label: { en: 'Section Heading', fr: 'Titre de section' },
    description: { en: 'Add a title or section header', fr: 'Ajouter un titre ou en-tête' },
  },
  {
    type: 'paragraph',
    icon: AlignLeft,
    label: { en: 'Instructions', fr: 'Instructions' },
    description: { en: 'Explanatory text for the client', fr: 'Texte explicatif pour le client' },
  },
  {
    type: 'image',
    icon: ImageIcon,
    label: { en: 'Image', fr: 'Image' },
    description: { en: 'Add a photo, diagram, or illustration', fr: 'Ajouter une photo, diagramme ou illustration' },
  },
  {
    type: 'divider',
    icon: Minus,
    label: { en: 'Divider', fr: 'Séparateur' },
    description: { en: 'Visual break between sections', fr: 'Séparation visuelle entre sections' },
  },
  {
    type: 'quote',
    icon: Quote,
    label: { en: 'Quote / Affirmation', fr: 'Citation / Affirmation' },
    description: { en: 'Highlighted inspirational text', fr: 'Texte inspirant mis en évidence' },
  },
  {
    type: 'tip',
    icon: Info,
    label: { en: 'Tip Box', fr: 'Conseil' },
    description: { en: 'Important tips or notes', fr: 'Conseils ou notes importantes' },
  },
  // === RESPONSE BLOCKS (Member provides answers) ===
  {
    type: 'prompt',
    icon: HelpCircle,
    label: { en: 'Writing Prompt', fr: 'Question ouverte' },
    description: { en: 'Open-ended question for reflection', fr: 'Question ouverte pour réflexion' },
  },
  {
    type: 'multiple_choice',
    icon: CircleDot,
    label: { en: 'Multiple Choice', fr: 'Choix multiple' },
    description: { en: 'Select one or more options', fr: 'Sélectionner une ou plusieurs options' },
  },
  {
    type: 'yes_no',
    icon: ToggleLeft,
    label: { en: 'Yes/No Question', fr: 'Question Oui/Non' },
    description: { en: 'Simple yes or no answer', fr: 'Réponse simple oui ou non' },
  },
  {
    type: 'checklist',
    icon: CheckSquare,
    label: { en: 'Checklist', fr: 'Liste à cocher' },
    description: { en: 'List of items to check off', fr: 'Liste d\'éléments à cocher' },
  },
  {
    type: 'scale',
    icon: List,
    label: { en: 'Rating Scale', fr: 'Échelle de notation' },
    description: { en: 'Numeric scale (e.g., 1-10)', fr: 'Échelle numérique (ex: 1-10)' },
  },
  {
    type: 'slider',
    icon: SlidersHorizontal,
    label: { en: 'Slider', fr: 'Curseur' },
    description: { en: 'Drag slider to select value', fr: 'Glisser pour sélectionner une valeur' },
  },
  {
    type: 'mood',
    icon: Smile,
    label: { en: 'Mood Selector', fr: 'Sélecteur d\'humeur' },
    description: { en: 'Pick mood using emojis', fr: 'Choisir l\'humeur avec des emojis' },
  },
  {
    type: 'date_picker',
    icon: Calendar,
    label: { en: 'Date', fr: 'Date' },
    description: { en: 'Select a date', fr: 'Sélectionner une date' },
  },
  {
    type: 'time_input',
    icon: Clock,
    label: { en: 'Time', fr: 'Heure' },
    description: { en: 'Enter a time', fr: 'Entrer une heure' },
  },
  // === MEDIA RESPONSE BLOCKS ===
  {
    type: 'video_response',
    icon: VideoIcon,
    label: { en: 'Video Response', fr: 'Réponse vidéo' },
    description: { en: 'Ask member to record/upload a video', fr: 'Demander au membre d\'enregistrer/télécharger une vidéo' },
  },
  {
    type: 'audio_response',
    icon: Mic,
    label: { en: 'Audio Response', fr: 'Réponse audio' },
    description: { en: 'Ask member to record/upload audio', fr: 'Demander au membre d\'enregistrer/télécharger un audio' },
  },
  {
    type: 'file_response',
    icon: FileUp,
    label: { en: 'File Upload Response', fr: 'Réponse par fichier' },
    description: { en: 'Ask member to upload a file', fr: 'Demander au membre de télécharger un fichier' },
  },
]

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

// Worksheet templates for quick start
const worksheetTemplates = [
  {
    id: 'thought-record',
    name: { en: 'Thought Record', fr: 'Journal de pensées' },
    description: { en: 'Classic CBT thought record template', fr: 'Modèle classique de journal de pensées TCC' },
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: 'Thought Record' },
      { id: '2', type: 'paragraph' as BlockType, content: 'Use this worksheet to identify and challenge negative thoughts. Fill it out when you notice a shift in your mood.' },
      { id: '3', type: 'prompt' as BlockType, content: 'Situation: What happened? Where were you? Who were you with?', placeholder: 'Describe the situation...', lines: 3 },
      { id: '4', type: 'prompt' as BlockType, content: 'Emotions: What emotions did you feel? (Rate intensity 0-100%)', placeholder: 'e.g., Anxious (70%), Sad (40%)', lines: 2 },
      { id: '5', type: 'prompt' as BlockType, content: 'Automatic Thought: What went through your mind?', placeholder: 'Write the thought exactly as it occurred...', lines: 3 },
      { id: '6', type: 'prompt' as BlockType, content: 'Evidence For: What supports this thought?', placeholder: 'List facts that support the thought...', lines: 3 },
      { id: '7', type: 'prompt' as BlockType, content: 'Evidence Against: What contradicts this thought?', placeholder: 'List facts that contradict the thought...', lines: 3 },
      { id: '8', type: 'prompt' as BlockType, content: 'Balanced Thought: What\'s a more balanced way to think about this?', placeholder: 'Write a more balanced perspective...', lines: 3 },
      { id: '9', type: 'scale' as BlockType, content: 'How much do you believe the balanced thought?', scaleMin: 0, scaleMax: 100, scaleMinLabel: 'Not at all', scaleMaxLabel: 'Completely' },
    ],
  },
  {
    id: 'gratitude',
    name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
    description: { en: 'Daily gratitude reflection', fr: 'Réflexion quotidienne de gratitude' },
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: 'Daily Gratitude' },
      { id: '2', type: 'paragraph' as BlockType, content: 'Take a moment to reflect on the positive aspects of your day. Research shows that practicing gratitude can improve well-being and mood.' },
      { id: '3', type: 'prompt' as BlockType, content: 'Three things I\'m grateful for today:', placeholder: '1.\n2.\n3.', lines: 4 },
      { id: '4', type: 'prompt' as BlockType, content: 'Something good that happened today:', placeholder: 'Describe a positive moment...', lines: 3 },
      { id: '5', type: 'prompt' as BlockType, content: 'Someone I appreciate and why:', placeholder: 'Think of someone who made a difference...', lines: 3 },
      { id: '6', type: 'scale' as BlockType, content: 'Overall mood today:', scaleMin: 1, scaleMax: 10, scaleMinLabel: 'Very low', scaleMaxLabel: 'Excellent' },
    ],
  },
  {
    id: 'blank',
    name: { en: 'Blank Worksheet', fr: 'Feuille vierge' },
    description: { en: 'Start from scratch', fr: 'Commencer de zéro' },
    blocks: [],
  },
]

function CreateWorksheetContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // User state for file uploads
  const [userId, setUserId] = useState<string | null>(null)

  // Step state
  const [step, setStep] = useState<'template' | 'build' | 'details'>('build')

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Worksheet state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [blocks, setBlocks] = useState<WorksheetBlock[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')

  // UI state
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // View mode: 'edit' | 'preview' | 'test'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'test'>('edit')

  // Test mode responses (simulated member answers)
  const [testResponses, setTestResponses] = useState<Record<string, any>>({})
  const [testSubmitted, setTestSubmitted] = useState(false)

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  // Load existing resource for edit mode
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

      setIsLoading(true)
      try {
        // Get current user using browser client for proper auth
        const browserSupabase = createClient()
        const { data: { user } } = await browserSupabase.auth.getUser()
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
          if (resource.tags) {
            const loadedTags = Array.isArray(resource.tags)
              ? resource.tags.map((t: any) => typeof t === 'string' ? t : (t as Record<string, string>)?.[locale] || '')
              : []
            setTags(loadedTags)
          }

          // Load worksheet blocks
          if (resource.blocks && Array.isArray(resource.blocks)) {
            const loadedBlocks = resource.blocks.map((block: any) => ({
              id: block.id || Math.random().toString(36).substr(2, 9),
              type: block.type,
              content: typeof block.content === 'string' ? block.content : (block.content as Record<string, string>)?.[locale] || '',
              items: block.items?.map((item: any) =>
                typeof item === 'string' ? item : (typeof item.text === 'string' ? item.text : (item.text as Record<string, string>)?.[locale] || '')
              ),
              scaleMin: block.scaleMin,
              scaleMax: block.scaleMax,
              scaleMinLabel: typeof block.scaleMinLabel === 'string' ? block.scaleMinLabel : (block.scaleMinLabel as Record<string, string>)?.[locale] || '',
              scaleMaxLabel: typeof block.scaleMaxLabel === 'string' ? block.scaleMaxLabel : (block.scaleMaxLabel as Record<string, string>)?.[locale] || '',
              placeholder: block.placeholder,
              lines: block.lines,
              mediaFile: block.mediaFile,
              mediaCaption: block.mediaCaption,
              mediaAlt: block.mediaAlt,
              videoUrl: block.videoUrl,
              videoType: block.videoType,
              choices: block.choices?.map((c: any) => typeof c === 'string' ? c : (c as Record<string, string>)?.[locale] || ''),
              allowMultiple: block.allowMultiple,
              moodOptions: block.moodOptions?.map((m: any) => ({
                emoji: m.emoji,
                label: typeof m.label === 'string' ? m.label : (m.label as Record<string, string>)?.[locale] || ''
              })),
              sliderMin: block.sliderMin,
              sliderMax: block.sliderMax,
              sliderStep: block.sliderStep,
              sliderUnit: block.sliderUnit,
              style: block.style,
              responseRequired: block.responseRequired,
              responseMaxDuration: block.responseMaxDuration,
              responseAcceptedTypes: block.responseAcceptedTypes,
              responseHint: block.responseHint,
            }))
            setBlocks(loadedBlocks)
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
  }, [editId, locale])

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = worksheetTemplates.find(t => t.id === templateId)
    if (template) {
      if (template.id === 'blank') {
        setBlocks([])
        setTitle('')
      } else {
        setBlocks(template.blocks.map(b => ({ ...b, id: generateId() })))
        setTitle(template.name[locale])
      }
      setStep('build')
    }
  }

  // Default mood options
  const defaultMoodOptions = [
    { emoji: '😢', label: locale === 'fr' ? 'Très mal' : 'Very bad' },
    { emoji: '😔', label: locale === 'fr' ? 'Mal' : 'Bad' },
    { emoji: '😐', label: locale === 'fr' ? 'Neutre' : 'Neutral' },
    { emoji: '🙂', label: locale === 'fr' ? 'Bien' : 'Good' },
    { emoji: '😄', label: locale === 'fr' ? 'Très bien' : 'Great' },
  ]

  // Add new block
  const addBlock = (type: BlockType) => {
    const newBlock: WorksheetBlock = {
      id: generateId(),
      type,
      content: '',
      // Content blocks
      ...(type === 'checklist' && { items: [''] }),
      ...(type === 'scale' && { scaleMin: 1, scaleMax: 10, scaleMinLabel: '', scaleMaxLabel: '' }),
      ...(type === 'prompt' && { placeholder: '', lines: 3 }),
      ...(type === 'image' && { mediaCaption: '', mediaAlt: '' }),
      ...(type === 'video' && { videoType: 'youtube' as const, videoUrl: '' }),
      ...(type === 'file' && { mediaCaption: '' }),
      ...(type === 'quote' && { style: 'default' as const }),
      ...(type === 'tip' && { style: 'info' as const }),
      // New response blocks
      ...(type === 'multiple_choice' && { choices: ['', ''], allowMultiple: false }),
      ...(type === 'yes_no' && { }),
      ...(type === 'mood' && { moodOptions: defaultMoodOptions }),
      ...(type === 'date_picker' && { }),
      ...(type === 'time_input' && { }),
      ...(type === 'slider' && { sliderMin: 0, sliderMax: 100, sliderStep: 1, sliderUnit: '%' }),
      // Media response blocks
      ...(type === 'video_response' && { responseRequired: true, responseMaxDuration: 300, responseHint: '' }),
      ...(type === 'audio_response' && { responseRequired: true, responseMaxDuration: 180, responseHint: '' }),
      ...(type === 'file_response' && { responseRequired: true, responseAcceptedTypes: [], responseHint: '' }),
    }
    setBlocks([...blocks, newBlock])
    setExpandedBlock(newBlock.id)
    setShowBlockPicker(false)
  }

  // Handle file upload for media blocks
  const handleMediaUpload = async (blockId: string, file: File) => {
    // Validate file
    const validation = validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
    })

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Create initial media file state with loading
    const tempMediaFile: MediaFile = {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file), // Local preview while uploading
      isUploading: true,
    }
    updateBlock(blockId, { mediaFile: tempMediaFile })

    // Upload to Supabase Storage
    if (!userId) {
      toast.error(locale === 'fr' ? 'Veuillez vous connecter pour télécharger des fichiers' : 'Please sign in to upload files')
      updateBlock(blockId, {
        mediaFile: { ...tempMediaFile, isUploading: false, uploadError: 'Not authenticated' }
      })
      return
    }

    try {
      const result = await uploadResourceFile(file, userId)

      // Revoke the temporary blob URL
      URL.revokeObjectURL(tempMediaFile.url!)

      // Update with the real Supabase URL
      const uploadedMediaFile: MediaFile = {
        id: tempMediaFile.id,
        name: result.fileName,
        size: result.fileSize,
        type: result.mimeType,
        url: result.url,
        path: result.path,
        isUploading: false,
      }
      updateBlock(blockId, { mediaFile: uploadedMediaFile })
      toast.success(locale === 'fr' ? 'Fichier téléchargé avec succès' : 'File uploaded successfully')
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(locale === 'fr' ? 'Échec du téléchargement du fichier' : 'Failed to upload file')
      updateBlock(blockId, {
        mediaFile: {
          ...tempMediaFile,
          isUploading: false,
          uploadError: error instanceof Error ? error.message : 'Upload failed'
        }
      })
    }
  }

  // Remove media from block
  const removeMedia = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block?.mediaFile?.url && !block.mediaFile.path) {
      // Only revoke if it's a local blob URL (no path means not uploaded to Supabase)
      URL.revokeObjectURL(block.mediaFile.url)
    }
    // Note: We don't delete from Supabase storage here - orphaned files can be cleaned up later
    updateBlock(blockId, { mediaFile: undefined, videoUrl: '' })
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Extract YouTube/Vimeo video ID
  const getVideoEmbedUrl = (url: string, type: 'youtube' | 'vimeo') => {
    if (type === 'youtube') {
      const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/)
      return match ? `https://www.youtube.com/embed/${match[1]}` : null
    }
    if (type === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/)
      return match ? `https://player.vimeo.com/video/${match[1]}` : null
    }
    return null
  }

  // Update block
  const updateBlock = (id: string, updates: Partial<WorksheetBlock>) => {
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

  // Add checklist item
  const addChecklistItem = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.items) {
      updateBlock(blockId, { items: [...block.items, ''] })
    }
  }

  // Update checklist item
  const updateChecklistItem = (blockId: string, index: number, value: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.items) {
      const newItems = [...block.items]
      newItems[index] = value
      updateBlock(blockId, { items: newItems })
    }
  }

  // Delete checklist item
  const deleteChecklistItem = (blockId: string, index: number) => {
    const block = blocks.find(b => b.id === blockId)
    if (block && block.items && block.items.length > 1) {
      const newItems = block.items.filter((_, i) => i !== index)
      updateBlock(blockId, { items: newItems })
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!title || blocks.length === 0) {
      toast.error(locale === 'fr' ? 'Veuillez ajouter un titre et au moins un bloc' : 'Please add a title and at least one block')
      return
    }

    setIsSaving(true)

    try {
      // Convert local blocks to ResourceBlock format
      const resourceBlocks: ResourceBlock[] = blocks.map(block => {
        const baseBlock = {
          id: block.id,
          type: block.type,
          content: block.content,
        }

        if (block.type === 'prompt') {
          return {
            ...baseBlock,
            type: 'prompt' as const,
            placeholder: block.placeholder,
            lines: block.lines,
          }
        }

        if (block.type === 'checklist') {
          return {
            ...baseBlock,
            type: 'checklist' as const,
            items: block.items || [],
          }
        }

        if (block.type === 'scale') {
          return {
            ...baseBlock,
            type: 'scale' as const,
            scaleMin: block.scaleMin || 1,
            scaleMax: block.scaleMax || 10,
            scaleMinLabel: block.scaleMinLabel,
            scaleMaxLabel: block.scaleMaxLabel,
          }
        }

        if (block.type === 'image') {
          return {
            ...baseBlock,
            type: 'image' as const,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
            } : undefined,
            mediaCaption: block.mediaCaption,
            mediaAlt: block.mediaAlt,
          }
        }

        if (block.type === 'video') {
          return {
            ...baseBlock,
            type: 'video' as const,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
            } : undefined,
            videoUrl: block.videoUrl,
            videoType: block.videoType,
          }
        }

        if (block.type === 'file') {
          return {
            ...baseBlock,
            type: 'file' as const,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
            } : undefined,
            mediaCaption: block.mediaCaption,
          }
        }

        // Default: heading or paragraph
        return baseBlock as ResourceBlock
      })

      // Build settings
      const settings: WorksheetSettings = {}

      if (isEditMode && editId) {
        // Update existing resource
        await updateResource(editId, {
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Feuille de travail mise à jour avec succès!' : 'Worksheet updated successfully!')
      } else {
        // Create new resource
        await createResource({
          type: 'worksheet',
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Feuille de travail créée avec succès!' : 'Worksheet created successfully!')
      }

      router.push('/resources')
    } catch (error) {
      console.error('Error saving worksheet:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving worksheet')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if can proceed to details
  const canProceedToDetails = title.trim() && blocks.length > 0

  // Reset test mode
  const resetTestMode = () => {
    setTestResponses({})
    setTestSubmitted(false)
  }

  // Handle test response update
  const updateTestResponse = (blockId: string, value: any) => {
    setTestResponses(prev => ({ ...prev, [blockId]: value }))
  }

  // Handle test checklist item toggle
  const toggleTestChecklistItem = (blockId: string, index: number) => {
    const current = testResponses[blockId] || []
    const newChecked = [...current]
    if (newChecked.includes(index)) {
      newChecked.splice(newChecked.indexOf(index), 1)
    } else {
      newChecked.push(index)
    }
    updateTestResponse(blockId, newChecked)
  }

  // Handle test submission
  const handleTestSubmit = () => {
    setTestSubmitted(true)
  }

  // Render block in preview/test mode (member view)
  const renderBlockPreview = (block: WorksheetBlock, isTestMode: boolean) => {
    return (
      <div key={block.id} className="mb-6">
        {/* Heading */}
        {block.type === 'heading' && (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{block.content}</h2>
        )}

        {/* Paragraph/Instructions */}
        {block.type === 'paragraph' && (
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>
        )}

        {/* Writing Prompt */}
        {block.type === 'prompt' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            {isTestMode ? (
              <textarea
                value={testResponses[block.id] || ''}
                onChange={(e) => updateTestResponse(block.id, e.target.value)}
                placeholder={block.placeholder}
                rows={block.lines || 3}
                disabled={testSubmitted}
                className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lavender-400 focus:border-transparent resize-none transition-all ${testSubmitted ? 'bg-gray-50' : ''}`}
              />
            ) : (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 italic">
                {block.placeholder || (locale === 'fr' ? 'Réponse du membre...' : 'Member\'s response...')}
              </div>
            )}
          </div>
        )}

        {/* Checklist */}
        {block.type === 'checklist' && (
          <div className="space-y-2">
            {block.content && <label className="block text-gray-900 font-medium mb-3">{block.content}</label>}
            <div className="space-y-2">
              {block.items?.map((item, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isTestMode && (testResponses[block.id] || []).includes(index)
                      ? 'border-lavender-300 bg-lavender-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isTestMode ? (testResponses[block.id] || []).includes(index) : false}
                    onChange={() => isTestMode && !testSubmitted && toggleTestChecklistItem(block.id, index)}
                    disabled={!isTestMode || testSubmitted}
                    className="w-5 h-5 rounded border-gray-300 text-lavender-600 focus:ring-lavender-500"
                  />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Rating Scale */}
        {block.type === 'scale' && (
          <div className="space-y-3">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-20 text-right">{block.scaleMinLabel}</span>
              <div className="flex-1 flex items-center justify-center gap-1">
                {Array.from({ length: (block.scaleMax || 10) - (block.scaleMin || 1) + 1 }, (_, i) => {
                  const value = (block.scaleMin || 1) + i
                  const isSelected = isTestMode && testResponses[block.id] === value
                  return (
                    <button
                      key={value}
                      onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, value)}
                      disabled={!isTestMode || testSubmitted}
                      className={`w-10 h-10 rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-gradient-to-br from-lavender-500 to-lavender-600 text-white shadow-lg shadow-lavender-200/50'
                          : isTestMode
                            ? 'bg-white border border-gray-200 text-gray-700 hover:border-lavender-300 hover:bg-lavender-50'
                            : 'bg-gray-100 text-gray-400'
                      } ${testSubmitted && isTestMode ? 'cursor-not-allowed' : ''}`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
              <span className="text-sm text-gray-500 w-20">{block.scaleMaxLabel}</span>
            </div>
          </div>
        )}

        {/* Image */}
        {block.type === 'image' && block.mediaFile && (
          <div className="space-y-2">
            <div className="rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.mediaFile.url}
                alt={block.mediaAlt || ''}
                className="w-full max-h-96 object-contain bg-gray-100"
              />
            </div>
            {block.mediaCaption && (
              <p className="text-sm text-gray-500 text-center italic">{block.mediaCaption}</p>
            )}
          </div>
        )}

        {/* Video */}
        {block.type === 'video' && (
          <div className="space-y-2">
            {block.content && <p className="text-gray-600 mb-2">{block.content}</p>}
            {(block.videoType === 'youtube' || block.videoType === 'vimeo') && block.videoUrl && getVideoEmbedUrl(block.videoUrl, block.videoType) && (
              <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
                <iframe
                  src={getVideoEmbedUrl(block.videoUrl, block.videoType)!}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {block.videoType === 'upload' && block.mediaFile && (
              <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
                <video src={block.mediaFile.url} controls className="w-full h-full object-contain" />
              </div>
            )}
          </div>
        )}

        {/* File Attachment */}
        {block.type === 'file' && block.mediaFile && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Paperclip className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{block.content || block.mediaFile.name}</p>
                {block.mediaCaption && <p className="text-sm text-gray-500">{block.mediaCaption}</p>}
              </div>
              <a
                href={block.mediaFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                {locale === 'fr' ? 'Télécharger' : 'Download'}
              </a>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render block editor
  // Get block color based on type
  const getBlockColors = (type: BlockType) => {
    const colors: Record<string, { bg: string; text: string; accent: string }> = {
      // Content blocks - gray
      heading: { bg: 'bg-slate-100', text: 'text-slate-600', accent: 'bg-slate-400' },
      paragraph: { bg: 'bg-slate-100', text: 'text-slate-600', accent: 'bg-slate-400' },
      divider: { bg: 'bg-slate-100', text: 'text-slate-500', accent: 'bg-slate-300' },
      quote: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-400' },
      tip: { bg: 'bg-sky-100', text: 'text-sky-600', accent: 'bg-sky-400' },
      image: { bg: 'bg-emerald-100', text: 'text-emerald-600', accent: 'bg-emerald-400' },
      // Question blocks - blue
      prompt: { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-400' },
      multiple_choice: { bg: 'bg-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-400' },
      yes_no: { bg: 'bg-teal-100', text: 'text-teal-600', accent: 'bg-teal-400' },
      checklist: { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-400' },
      scale: { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-400' },
      slider: { bg: 'bg-violet-100', text: 'text-violet-600', accent: 'bg-violet-400' },
      mood: { bg: 'bg-amber-100', text: 'text-amber-600', accent: 'bg-amber-400' },
      date_picker: { bg: 'bg-rose-100', text: 'text-rose-600', accent: 'bg-rose-400' },
      time_input: { bg: 'bg-cyan-100', text: 'text-cyan-600', accent: 'bg-cyan-400' },
      // Media response blocks
      video_response: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-400' },
      audio_response: { bg: 'bg-orange-100', text: 'text-orange-600', accent: 'bg-orange-400' },
      file_response: { bg: 'bg-green-100', text: 'text-green-600', accent: 'bg-green-400' },
      // Legacy
      video: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-400' },
      file: { bg: 'bg-amber-100', text: 'text-amber-600', accent: 'bg-amber-400' },
    }
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-600', accent: 'bg-gray-400' }
  }

  const renderBlockEditor = (block: WorksheetBlock) => {
    const isExpanded = expandedBlock === block.id
    const blockType = blockTypes.find(bt => bt.type === block.type)
    const Icon = blockType?.icon || FileText
    const colors = getBlockColors(block.type)

    return (
      <div
        className={`group transition-all ${isExpanded ? 'bg-white rounded-xl shadow-lg border border-gray-200' : ''}`}
      >
        {/* Block Header */}
        <div
          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg transition-colors ${isExpanded ? 'bg-gray-50/80' : 'hover:bg-gray-100/60'}`}
          onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className={`w-1.5 h-5 rounded-full flex-shrink-0 ${colors.accent}`} />

          <Icon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">
              {block.content || <span className="text-gray-400">{blockType?.label[locale]}</span>}
            </p>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`${isExpanded ? 'text-blue-500' : 'text-gray-400'}`}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
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
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Paragraph Block */}
                {block.type === 'paragraph' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Instructions / Texte' : 'Instructions / Text'}
                    </label>
                    <textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder={locale === 'fr' ? 'Écrivez les instructions pour le client...' : 'Write instructions for the client...'}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    />
                  </div>
                )}

                {/* Prompt Block */}
                {block.type === 'prompt' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question / Invite' : 'Question / Prompt'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Décrivez vos émotions...' : 'e.g., Describe your emotions...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Texte indicatif (optionnel)' : 'Placeholder text (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.placeholder || ''}
                        onChange={(e) => updateBlock(block.id, { placeholder: e.target.value })}
                        placeholder={locale === 'fr' ? 'Texte d\'aide...' : 'Helper text...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Nombre de lignes' : 'Number of lines'}
                      </label>
                      <select
                        value={block.lines || 3}
                        onChange={(e) => updateBlock(block.id, { lines: parseInt(e.target.value) })}
                        className="px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                          <option key={n} value={n}>{n} {locale === 'fr' ? 'lignes' : 'lines'}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Checklist Block */}
                {block.type === 'checklist' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre de la liste' : 'List Title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Mes objectifs pour cette semaine' : 'e.g., My goals for this week'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Éléments de la liste' : 'List Items'}
                      </label>
                      <div className="space-y-2">
                        {block.items?.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateChecklistItem(block.id, index, e.target.value)}
                              placeholder={`${locale === 'fr' ? 'Élément' : 'Item'} ${index + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                            {(block.items?.length || 0) > 1 && (
                              <button
                                onClick={() => deleteChecklistItem(block.id, index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => addChecklistItem(block.id)}
                        className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
                      </button>
                    </div>
                  </>
                )}

                {/* Scale Block */}
                {block.type === 'scale' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Comment évaluez-vous votre humeur?' : 'e.g., How would you rate your mood?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Minimum' : 'Min Value'}
                        </label>
                        <select
                          value={block.scaleMin || 0}
                          onChange={(e) => updateBlock(block.id, { scaleMin: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          {[0, 1].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Maximum' : 'Max Value'}
                        </label>
                        <select
                          value={block.scaleMax || 10}
                          onChange={(e) => updateBlock(block.id, { scaleMax: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        >
                          {[5, 7, 10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Label minimum' : 'Min Label'}
                        </label>
                        <input
                          type="text"
                          value={block.scaleMinLabel || ''}
                          onChange={(e) => updateBlock(block.id, { scaleMinLabel: e.target.value })}
                          placeholder={locale === 'fr' ? 'Ex: Pas du tout' : 'e.g., Not at all'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Label maximum' : 'Max Label'}
                        </label>
                        <input
                          type="text"
                          value={block.scaleMaxLabel || ''}
                          onChange={(e) => updateBlock(block.id, { scaleMaxLabel: e.target.value })}
                          placeholder={locale === 'fr' ? 'Ex: Énormément' : 'e.g., Extremely'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Image Block */}
                {block.type === 'image' && (
                  <>
                    {/* Image Upload/Preview */}
                    {block.mediaFile ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={block.mediaFile.url}
                            alt={block.mediaAlt || 'Uploaded image'}
                            className={`w-full h-48 object-cover ${block.mediaFile.isUploading ? 'opacity-50' : ''}`}
                          />
                          {block.mediaFile.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                <span className="text-sm font-medium">
                                  {locale === 'fr' ? 'Téléchargement...' : 'Uploading...'}
                                </span>
                              </div>
                            </div>
                          )}
                          {!block.mediaFile.isUploading && (
                            <button
                              onClick={() => removeMedia(block.id)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ImageIcon className="w-4 h-4" />
                          <span className="truncate">{block.mediaFile.name}</span>
                          <span className="text-gray-400">({formatFileSize(block.mediaFile.size)})</span>
                          {block.mediaFile.path && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                          {block.mediaFile.uploadError && (
                            <span className="text-red-500 text-xs">{block.mediaFile.uploadError}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleMediaUpload(block.id, file)
                          }}
                          className="hidden"
                        />
                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-7 h-7 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Cliquez pour télécharger une image' : 'Click to upload an image'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 50MB</p>
                      </label>
                    )}

                    {/* Alt Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Texte alternatif (accessibilité)' : 'Alt text (accessibility)'}
                      </label>
                      <input
                        type="text"
                        value={block.mediaAlt || ''}
                        onChange={(e) => updateBlock(block.id, { mediaAlt: e.target.value })}
                        placeholder={locale === 'fr' ? 'Décrivez l\'image...' : 'Describe the image...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Légende (optionnel)' : 'Caption (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.mediaCaption || ''}
                        onChange={(e) => updateBlock(block.id, { mediaCaption: e.target.value })}
                        placeholder={locale === 'fr' ? 'Légende affichée sous l\'image' : 'Caption shown below the image'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Video Block */}
                {block.type === 'video' && (
                  <>
                    {/* Video Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Source de la vidéo' : 'Video Source'}
                      </label>
                      <div className="flex gap-2">
                        {[
                          { type: 'youtube', label: 'YouTube' },
                          { type: 'vimeo', label: 'Vimeo' },
                          { type: 'upload', label: locale === 'fr' ? 'Télécharger' : 'Upload' },
                        ].map((option) => (
                          <button
                            key={option.type}
                            onClick={() => updateBlock(block.id, { videoType: option.type as 'youtube' | 'vimeo' | 'upload', videoUrl: '', mediaFile: undefined })}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              block.videoType === option.type
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* YouTube/Vimeo URL Input */}
                    {(block.videoType === 'youtube' || block.videoType === 'vimeo') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {block.videoType === 'youtube' ? 'YouTube URL' : 'Vimeo URL'}
                          </label>
                          <input
                            type="url"
                            value={block.videoUrl || ''}
                            onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                            placeholder={block.videoType === 'youtube'
                              ? 'https://www.youtube.com/watch?v=...'
                              : 'https://vimeo.com/...'}
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                          />
                        </div>

                        {/* Video Preview */}
                        {block.videoUrl && getVideoEmbedUrl(block.videoUrl, block.videoType) && (
                          <div className="rounded-xl overflow-hidden bg-gray-900 aspect-video">
                            <iframe
                              src={getVideoEmbedUrl(block.videoUrl, block.videoType)!}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Video Upload */}
                    {block.videoType === 'upload' && (
                      <>
                        {block.mediaFile ? (
                          <div className="space-y-3">
                            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center">
                              <video
                                src={block.mediaFile.url}
                                className={`w-full h-full object-contain ${block.mediaFile.isUploading ? 'opacity-50' : ''}`}
                                controls={!block.mediaFile.isUploading}
                              />
                              {block.mediaFile.isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-sm font-medium">
                                      {locale === 'fr' ? 'Téléchargement...' : 'Uploading...'}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {!block.mediaFile.isUploading && (
                                <button
                                  onClick={() => removeMedia(block.id)}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Video className="w-4 h-4" />
                              <span className="truncate">{block.mediaFile.name}</span>
                              <span className="text-gray-400">({formatFileSize(block.mediaFile.size)})</span>
                              {block.mediaFile.path && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {block.mediaFile.uploadError && (
                                <span className="text-red-500 text-xs">{block.mediaFile.uploadError}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <label className="block border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleMediaUpload(block.id, file)
                              }}
                              className="hidden"
                            />
                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                              <Play className="w-7 h-7 text-blue-500" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">
                              {locale === 'fr' ? 'Cliquez pour télécharger une vidéo' : 'Click to upload a video'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM up to 50MB</p>
                          </label>
                        )}
                      </>
                    )}

                    {/* Video Caption */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Décrivez la vidéo...' : 'Describe the video...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* File Attachment Block */}
                {block.type === 'file' && (
                  <>
                    {/* File Upload/Preview */}
                    {block.mediaFile ? (
                      <div className="p-4 bg-gray-50/80 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${block.mediaFile.isUploading ? 'bg-blue-50' : 'bg-blue-100'} flex items-center justify-center`}>
                              {block.mediaFile.isUploading ? (
                                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                              ) : (
                                <Paperclip className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-[200px] flex items-center gap-2">
                                {block.mediaFile.name}
                                {block.mediaFile.path && (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(block.mediaFile.size)}
                                {block.mediaFile.isUploading && (
                                  <span className="ml-2 text-blue-600">
                                    {locale === 'fr' ? 'Téléchargement...' : 'Uploading...'}
                                  </span>
                                )}
                                {block.mediaFile.uploadError && (
                                  <span className="ml-2 text-red-500">{block.mediaFile.uploadError}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {block.mediaFile.url && !block.mediaFile.isUploading && (
                              <a
                                href={block.mediaFile.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {!block.mediaFile.isUploading && (
                              <button
                                onClick={() => removeMedia(block.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label className="block border-2 border-dashed border-blue-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp3,.wav,.ogg"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleMediaUpload(block.id, file)
                          }}
                          className="hidden"
                        />
                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-7 h-7 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Cliquez pour joindre un fichier' : 'Click to attach a file'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, XLS, PPT, MP3 up to 50MB</p>
                      </label>
                    )}

                    {/* File Title/Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre du fichier' : 'File Title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Guide de relaxation (PDF)' : 'e.g., Relaxation Guide (PDF)'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* File Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <textarea
                        value={block.mediaCaption || ''}
                        onChange={(e) => updateBlock(block.id, { mediaCaption: e.target.value })}
                        placeholder={locale === 'fr' ? 'Expliquez ce que contient ce fichier...' : 'Explain what this file contains...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>
                  </>
                )}

                {/* Video Response Block - Member uploads video as answer */}
                {block.type === 'video_response' && (
                  <>
                    {/* Question/Prompt for the member */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question pour le membre' : 'Question for member'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Enregistrez une vidéo où vous décrivez votre journée...' : 'e.g., Record a video describing your day...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Preview of what member will see */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200/50">
                      <p className="text-xs font-medium text-purple-600 mb-3 flex items-center gap-1.5">
                        <VideoIcon className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="border-2 border-dashed border-purple-200 rounded-xl p-6 text-center bg-white/50">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
                          <VideoIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Enregistrer ou télécharger une vidéo' : 'Record or upload a video'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {locale === 'fr' ? `Max ${Math.floor((block.responseMaxDuration || 300) / 60)} minutes` : `Max ${Math.floor((block.responseMaxDuration || 300) / 60)} minutes`}
                        </p>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Durée max (minutes)' : 'Max duration (minutes)'}
                        </label>
                        <input
                          type="number"
                          value={Math.floor((block.responseMaxDuration || 300) / 60)}
                          onChange={(e) => updateBlock(block.id, { responseMaxDuration: parseInt(e.target.value) * 60 })}
                          min={1}
                          max={30}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={block.responseRequired !== false}
                            onChange={(e) => updateBlock(block.id, { responseRequired: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Réponse obligatoire' : 'Required'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Helper hint */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Conseil (optionnel)' : 'Hint (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.responseHint || ''}
                        onChange={(e) => updateBlock(block.id, { responseHint: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Trouvez un endroit calme et bien éclairé' : 'e.g., Find a quiet, well-lit place'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Audio Response Block - Member uploads audio as answer */}
                {block.type === 'audio_response' && (
                  <>
                    {/* Question/Prompt for the member */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question pour le membre' : 'Question for member'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Enregistrez vos pensées sur cette semaine...' : 'e.g., Record your thoughts about this week...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Preview of what member will see */}
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/50">
                      <p className="text-xs font-medium text-orange-600 mb-3 flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center bg-white/50">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-2">
                          <Mic className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Enregistrer ou télécharger un audio' : 'Record or upload audio'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {locale === 'fr' ? `Max ${Math.floor((block.responseMaxDuration || 180) / 60)} minutes` : `Max ${Math.floor((block.responseMaxDuration || 180) / 60)} minutes`}
                        </p>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Durée max (minutes)' : 'Max duration (minutes)'}
                        </label>
                        <input
                          type="number"
                          value={Math.floor((block.responseMaxDuration || 180) / 60)}
                          onChange={(e) => updateBlock(block.id, { responseMaxDuration: parseInt(e.target.value) * 60 })}
                          min={1}
                          max={30}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={block.responseRequired !== false}
                            onChange={(e) => updateBlock(block.id, { responseRequired: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {locale === 'fr' ? 'Réponse obligatoire' : 'Required'}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Helper hint */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Conseil (optionnel)' : 'Hint (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.responseHint || ''}
                        onChange={(e) => updateBlock(block.id, { responseHint: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Parlez naturellement, pas besoin d\'être parfait' : 'e.g., Speak naturally, no need to be perfect'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* File Upload Response Block - Member uploads file as answer */}
                {block.type === 'file_response' && (
                  <>
                    {/* Question/Prompt for the member */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question pour le membre' : 'Question for member'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Téléchargez une photo de votre espace de détente...' : 'e.g., Upload a photo of your relaxation space...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Preview of what member will see */}
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                      <p className="text-xs font-medium text-green-600 mb-3 flex items-center gap-1.5">
                        <FileUp className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="border-2 border-dashed border-green-200 rounded-xl p-6 text-center bg-white/50">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                          <FileUp className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Télécharger un fichier' : 'Upload a file'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {locale === 'fr' ? 'Images, PDF, documents' : 'Images, PDF, documents'}
                        </p>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={block.responseRequired !== false}
                          onChange={(e) => updateBlock(block.id, { responseRequired: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {locale === 'fr' ? 'Réponse obligatoire' : 'Required'}
                        </span>
                      </label>
                    </div>

                    {/* Helper hint */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Conseil (optionnel)' : 'Hint (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.responseHint || ''}
                        onChange={(e) => updateBlock(block.id, { responseHint: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Vous pouvez télécharger plusieurs fichiers' : 'e.g., You can upload multiple files'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Divider Block */}
                {block.type === 'divider' && (
                  <div className="py-4">
                    <div className="border-t-2 border-dashed border-gray-300 relative">
                      <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-xs text-gray-400">
                        {locale === 'fr' ? 'Séparateur visuel' : 'Visual divider'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-4">
                      {locale === 'fr' ? 'Ce séparateur apparaîtra entre les sections' : 'This divider will appear between sections'}
                    </p>
                  </div>
                )}

                {/* Quote/Affirmation Block */}
                {block.type === 'quote' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Citation ou affirmation' : 'Quote or affirmation'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: "Vous êtes plus fort que vous ne le pensez"' : 'e.g., "You are stronger than you think"'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-r from-lavender-50 to-blue-50 rounded-xl border-l-4 border-lavender-400">
                      <Quote className="w-5 h-5 text-lavender-400 mb-2" />
                      <p className="text-gray-700 italic">
                        {block.content || (locale === 'fr' ? 'Votre citation ici...' : 'Your quote here...')}
                      </p>
                    </div>
                  </>
                )}

                {/* Tip Box Block */}
                {block.type === 'tip' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Conseil ou note importante' : 'Tip or important note'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: N\'oubliez pas de respirer profondément...' : 'e.g., Remember to breathe deeply...'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex gap-3">
                      <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 text-sm">
                        {block.content || (locale === 'fr' ? 'Votre conseil ici...' : 'Your tip here...')}
                      </p>
                    </div>
                  </>
                )}

                {/* Multiple Choice Block */}
                {block.type === 'multiple_choice' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Comment vous sentez-vous aujourd\'hui?' : 'e.g., How are you feeling today?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* Choices */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Options de réponse' : 'Answer options'}
                      </label>
                      <div className="space-y-2">
                        {(block.choices || []).map((choice, index) => (
                          <div key={index} className="flex gap-2">
                            <div className="w-8 h-10 flex items-center justify-center text-sm font-medium text-gray-400">
                              {String.fromCharCode(65 + index)}.
                            </div>
                            <input
                              type="text"
                              value={choice}
                              onChange={(e) => {
                                const newChoices = [...(block.choices || [])]
                                newChoices[index] = e.target.value
                                updateBlock(block.id, { choices: newChoices })
                              }}
                              placeholder={locale === 'fr' ? `Option ${index + 1}` : `Option ${index + 1}`}
                              className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                            />
                            {(block.choices || []).length > 2 && (
                              <button
                                onClick={() => {
                                  const newChoices = (block.choices || []).filter((_, i) => i !== index)
                                  updateBlock(block.id, { choices: newChoices })
                                }}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {(block.choices || []).length < 6 && (
                          <button
                            onClick={() => {
                              const newChoices = [...(block.choices || []), '']
                              updateBlock(block.id, { choices: newChoices })
                            }}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 px-4 py-2"
                          >
                            <Plus className="w-4 h-4" />
                            {locale === 'fr' ? 'Ajouter une option' : 'Add option'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Allow multiple selection */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.allowMultiple || false}
                        onChange={(e) => updateBlock(block.id, { allowMultiple: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {locale === 'fr' ? 'Permettre plusieurs sélections' : 'Allow multiple selections'}
                      </span>
                    </label>
                  </>
                )}

                {/* Yes/No Question Block */}
                {block.type === 'yes_no' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question (Oui/Non)' : 'Question (Yes/No)'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Avez-vous bien dormi cette nuit?' : 'e.g., Did you sleep well last night?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex gap-3">
                        <button className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-green-400 hover:bg-green-50 transition-all">
                          {locale === 'fr' ? 'Oui' : 'Yes'}
                        </button>
                        <button className="flex-1 py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-red-400 hover:bg-red-50 transition-all">
                          {locale === 'fr' ? 'Non' : 'No'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Mood Selector Block */}
                {block.type === 'mood' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Comment vous sentez-vous en ce moment?' : 'e.g., How are you feeling right now?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    {/* Mood Preview */}
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                      <p className="text-xs font-medium text-amber-600 mb-3 flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex justify-center gap-2 sm:gap-4">
                        {(block.moodOptions || defaultMoodOptions).map((mood, index) => (
                          <button
                            key={index}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/50 transition-all"
                          >
                            <span className="text-2xl sm:text-3xl">{mood.emoji}</span>
                            <span className="text-xs text-gray-600 hidden sm:block">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Date Picker Block */}
                {block.type === 'date_picker' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question ou label' : 'Question or label'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Quand avez-vous commencé à ressentir cela?' : 'e.g., When did you start feeling this way?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500">{locale === 'fr' ? 'Sélectionner une date...' : 'Select a date...'}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Time Input Block */}
                {block.type === 'time_input' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question ou label' : 'Question or label'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: À quelle heure vous êtes-vous couché?' : 'e.g., What time did you go to bed?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500">--:-- --</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Slider Block */}
                {block.type === 'slider' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Quel est votre niveau d\'énergie?' : 'e.g., What is your energy level?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      />
                    </div>

                    {/* Slider Settings */}
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Min</label>
                        <input
                          type="number"
                          value={block.sliderMin ?? 0}
                          onChange={(e) => updateBlock(block.id, { sliderMin: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Max</label>
                        <input
                          type="number"
                          value={block.sliderMax ?? 100}
                          onChange={(e) => updateBlock(block.id, { sliderMax: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{locale === 'fr' ? 'Pas' : 'Step'}</label>
                        <input
                          type="number"
                          value={block.sliderStep ?? 1}
                          onChange={(e) => updateBlock(block.id, { sliderStep: parseInt(e.target.value) })}
                          min={1}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{locale === 'fr' ? 'Unité' : 'Unit'}</label>
                        <input
                          type="text"
                          value={block.sliderUnit || ''}
                          onChange={(e) => updateBlock(block.id, { sliderUnit: e.target.value })}
                          placeholder="%"
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>

                    {/* Slider Preview */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                      <p className="text-xs font-medium text-blue-600 mb-3 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={block.sliderMin ?? 0}
                          max={block.sliderMax ?? 100}
                          step={block.sliderStep ?? 1}
                          defaultValue={Math.floor(((block.sliderMax ?? 100) - (block.sliderMin ?? 0)) / 2)}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          disabled
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{block.sliderMin ?? 0}{block.sliderUnit}</span>
                          <span>{block.sliderMax ?? 100}{block.sliderUnit}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Loading state when fetching resource for edit
  if (isLoading) {
    return (
      <div className="min-h-screen gradient-mesh relative flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-mint-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <motion.div
              key="template"
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
                <Link href="/resources/create">
                  <motion.div whileHover={{ x: -4 }} className="inline-block">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {locale === 'fr' ? 'Retour' : 'Back'}
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>

              {/* Title */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100/80 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Créer une feuille de travail' : 'Create a Worksheet'}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Commencez avec un modèle ou créez de zéro'
                    : 'Start with a template or create from scratch'}
                </p>
              </div>

              {/* Templates Grid */}
              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {worksheetTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={`bg-white/90 backdrop-blur-xl rounded-[1.25rem] p-5 cursor-pointer transition-all duration-300 border-2 shadow-lg shadow-gray-200/40 hover:shadow-xl ${
                        template.id === 'blank'
                          ? 'border-dashed border-gray-300 hover:border-blue-400'
                          : 'border-white/60 hover:border-blue-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-gray-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {template.name[locale]}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {template.description[locale]}
                      </p>
                      {template.id !== 'blank' && (
                        <p className="text-xs text-blue-600 mt-2">
                          {template.blocks.length} {locale === 'fr' ? 'blocs' : 'blocks'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Build Worksheet */}
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
                <motion.div whileHover={{ x: -4 }} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('template')}
                    className="rounded-xl hover:bg-white/80"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Modèles' : 'Templates'}
                  </Button>
                </motion.div>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-xl p-1 border border-white/60 shadow-sm">
                    <button
                      onClick={() => { setViewMode('edit'); resetTestMode() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'edit'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {locale === 'fr' ? 'Éditer' : 'Edit'}
                    </button>
                    <button
                      onClick={() => { setViewMode('preview'); resetTestMode() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        viewMode === 'preview'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Aperçu' : 'Preview'}
                    </button>
                    <button
                      onClick={() => { setViewMode('test'); resetTestMode() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        viewMode === 'test'
                          ? 'bg-gradient-to-r from-lavender-500 to-lavender-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Tester' : 'Try it Out'}
                    </button>
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={() => setStep('details')}
                      disabled={!canProceedToDetails}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50 rounded-xl"
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
                          placeholder={locale === 'fr' ? 'Titre de la feuille de travail...' : 'Worksheet title...'}
                          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400"
                        />
                      </motion.div>

                      {/* Blocks */}
                      <div className="space-y-1">
                        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-1">
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
                          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {locale === 'fr' ? 'Ajouter un bloc' : 'Add a block'}
                        </button>

                        {/* Block Picker */}
                        <AnimatePresence>
                          {showBlockPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-10 max-h-[70vh] overflow-y-auto"
                            >
                              {/* Content Blocks Section */}
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                  {locale === 'fr' ? 'Contenu' : 'Content'}
                                </p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {blockTypes.filter(bt => ['heading', 'paragraph', 'image', 'divider', 'quote', 'tip'].includes(bt.type)).map((bt) => {
                                    const Icon = bt.icon
                                    return (
                                      <button
                                        key={bt.type}
                                        onClick={() => addBlock(bt.type)}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center group"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                          <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{bt.label[locale]}</p>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Questions Section */}
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                  {locale === 'fr' ? 'Questions' : 'Questions'}
                                </p>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                  {blockTypes.filter(bt => ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'slider', 'mood', 'date_picker', 'time_input'].includes(bt.type)).map((bt) => {
                                    const Icon = bt.icon
                                    return (
                                      <button
                                        key={bt.type}
                                        onClick={() => addBlock(bt.type)}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center group"
                                      >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                                          <Icon className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{bt.label[locale]}</p>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Media Responses Section */}
                              <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                  {locale === 'fr' ? 'Réponses média' : 'Media Responses'}
                                </p>
                                <div className="grid grid-cols-3 gap-2">
                                  {blockTypes.filter(bt => ['video_response', 'audio_response', 'file_response'].includes(bt.type)).map((bt) => {
                                    const Icon = bt.icon
                                    const colorMap: Record<string, string> = {
                                      video_response: 'bg-purple-50 group-hover:bg-purple-100 text-purple-500 group-hover:text-purple-600',
                                      audio_response: 'bg-orange-50 group-hover:bg-orange-100 text-orange-500 group-hover:text-orange-600',
                                      file_response: 'bg-green-50 group-hover:bg-green-100 text-green-500 group-hover:text-green-600',
                                    }
                                    return (
                                      <button
                                        key={bt.type}
                                        onClick={() => addBlock(bt.type)}
                                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center group"
                                      >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${colorMap[bt.type]?.split(' ').slice(0, 2).join(' ')}`}>
                                          <Icon className={`w-5 h-5 transition-colors ${colorMap[bt.type]?.split(' ').slice(2).join(' ')}`} />
                                        </div>
                                        <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">{bt.label[locale]}</p>
                                      </button>
                                    )
                                  })}
                                </div>
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
                      className="bg-white rounded-[1.5rem] shadow-lg border border-gray-200 p-8"
                    >
                      {/* Preview Header */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                        <Eye className="w-4 h-4" />
                        {locale === 'fr' ? 'Aperçu - C\'est ainsi que le membre verra la feuille' : 'Preview - This is how the member will see the worksheet'}
                      </div>

                      {/* Worksheet Title */}
                      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</h1>

                      {/* Worksheet Content */}
                      {blocks.length > 0 ? (
                        blocks.map(block => renderBlockPreview(block, false))
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>{locale === 'fr' ? 'Aucun bloc ajouté' : 'No blocks added yet'}</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Test Mode */}
                  {viewMode === 'test' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[1.5rem] shadow-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Test Mode Header */}
                      <div className={`px-6 py-4 border-b ${testSubmitted ? 'bg-emerald-50 border-emerald-100' : 'bg-lavender-50 border-lavender-100'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {testSubmitted ? (
                              <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-emerald-800">
                                  {locale === 'fr' ? 'Soumission réussie!' : 'Submitted Successfully!'}
                                </span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-5 h-5 text-lavender-600" />
                                <span className="font-medium text-lavender-800">
                                  {locale === 'fr' ? 'Mode test - Remplissez comme un membre' : 'Try it Out - Fill in as a member would'}
                                </span>
                              </>
                            )}
                          </div>
                          {testSubmitted && (
                            <button
                              onClick={resetTestMode}
                              className="flex items-center gap-1.5 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                            >
                              <RotateCcw className="w-4 h-4" />
                              {locale === 'fr' ? 'Réessayer' : 'Try Again'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Worksheet Content */}
                      <div className="p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</h1>

                        {blocks.length > 0 ? (
                          <>
                            {blocks.map(block => renderBlockPreview(block, true))}

                            {/* Submit Button */}
                            {!testSubmitted && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-8 pt-6 border-t border-gray-100"
                              >
                                <Button
                                  onClick={handleTestSubmit}
                                  className="w-full bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white shadow-lg shadow-lavender-200/50 rounded-xl py-6 text-lg"
                                >
                                  <Send className="w-5 h-5 mr-2" />
                                  {locale === 'fr' ? 'Soumettre' : 'Submit Worksheet'}
                                </Button>
                              </motion.div>
                            )}

                            {/* Submitted Response Summary */}
                            {testSubmitted && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 pt-6 border-t border-gray-100"
                              >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  {locale === 'fr' ? 'Résumé des réponses' : 'Response Summary'}
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                  {blocks.filter(b => ['prompt', 'checklist', 'scale'].includes(b.type)).map(block => (
                                    <div key={block.id} className="text-sm">
                                      <p className="text-gray-500 font-medium mb-1">{block.content}</p>
                                      <p className="text-gray-900">
                                        {block.type === 'prompt' && (testResponses[block.id] || <span className="text-gray-400 italic">{locale === 'fr' ? 'Pas de réponse' : 'No response'}</span>)}
                                        {block.type === 'scale' && (testResponses[block.id] ? `${testResponses[block.id]} / ${block.scaleMax}` : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non noté' : 'Not rated'}</span>)}
                                        {block.type === 'checklist' && (
                                          (testResponses[block.id] || []).length > 0
                                            ? `${(testResponses[block.id] || []).length} ${locale === 'fr' ? 'élément(s) coché(s)' : 'item(s) checked'}`
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Aucun élément coché' : 'No items checked'}</span>
                                        )}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{locale === 'fr' ? 'Aucun bloc ajouté' : 'No blocks added yet'}</p>
                          </div>
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
                    className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 rounded-[1.5rem] border-2 border-amber-200/60 p-5 shadow-lg shadow-amber-100/30"
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
                        {locale === 'fr' ? 'Glissez les blocs pour les réorganiser' : 'Drag blocks to reorder them'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Utilisez des instructions claires' : 'Use clear instructions'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Limitez à 5-7 questions par feuille' : 'Limit to 5-7 prompts per worksheet'}
                      </li>
                    </ul>
                  </motion.div>

                  {/* Block Count */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5"
                  >
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{blocks.length}</p>
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'blocs ajoutés' : 'blocks added'}
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Details */}
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
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Aperçu' : 'Preview'}
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50 rounded-xl"
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
                            ? (locale === 'fr' ? 'Mettre à jour' : 'Update Worksheet')
                            : (locale === 'fr' ? 'Enregistrer' : 'Save Worksheet')
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
                  <div className="w-14 h-14 rounded-2xl bg-blue-100/80 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600">
                      {blocks.length} {locale === 'fr' ? 'blocs' : 'blocks'} • {locale === 'fr' ? 'Dernière étape' : 'Final step'}
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
                    placeholder={locale === 'fr' ? 'Décrivez brièvement cette feuille de travail...' : 'Briefly describe this worksheet...'}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none mb-4"
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
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200/50'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        {t.library.categories[category]}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Publish Options */}
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Options de publication' : 'Publish Options'}
                    </h2>

                    {/* Save As */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {locale === 'fr' ? 'Enregistrer comme' : 'Save as'}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSaveAs('draft')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            saveAs === 'draft'
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              saveAs === 'draft' ? 'bg-amber-200' : 'bg-gray-100'
                            }`}>
                              <FileText className={`w-4 h-4 ${saveAs === 'draft' ? 'text-amber-700' : 'text-gray-500'}`} />
                            </div>
                            <span className={`font-medium ${saveAs === 'draft' ? 'text-amber-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Brouillon' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Enregistrer pour modifier plus tard' : 'Save to edit later'}
                          </p>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSaveAs('published')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            saveAs === 'published'
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              saveAs === 'published' ? 'bg-emerald-200' : 'bg-gray-100'
                            }`}>
                              <CheckCircle2 className={`w-4 h-4 ${saveAs === 'published' ? 'text-emerald-700' : 'text-gray-500'}`} />
                            </div>
                            <span className={`font-medium ${saveAs === 'published' ? 'text-emerald-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Publier' : 'Publish'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Prêt à être assigné aux membres' : 'Ready to assign to members'}
                          </p>
                        </motion.button>
                      </div>
                    </div>

                    {/* Visibility - only show when publishing */}
                    {saveAs === 'published' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {locale === 'fr' ? 'Visibilité' : 'Visibility'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setVisibility('private')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              visibility === 'private'
                                ? 'border-lavender-400 bg-lavender-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                visibility === 'private' ? 'bg-lavender-200' : 'bg-gray-100'
                              }`}>
                                <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-lavender-700' : 'text-gray-500'}`} />
                              </div>
                              <span className={`font-medium ${visibility === 'private' ? 'text-lavender-900' : 'text-gray-700'}`}>
                                {locale === 'fr' ? 'Privé' : 'Private'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {locale === 'fr' ? 'Visible uniquement dans Mes ressources' : 'Only visible in My Resources'}
                            </p>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setVisibility('public')}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                              visibility === 'public'
                                ? 'border-blue-400 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                visibility === 'public' ? 'bg-blue-200' : 'bg-gray-100'
                              }`}>
                                <Globe className={`w-4 h-4 ${visibility === 'public' ? 'text-blue-700' : 'text-gray-500'}`} />
                              </div>
                              <span className={`font-medium ${visibility === 'public' ? 'text-blue-900' : 'text-gray-700'}`}>
                                {locale === 'fr' ? 'Public' : 'Public'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {locale === 'fr' ? 'Partagé dans la Bibliothèque numérique' : 'Shared in the Digital Library'}
                            </p>
                          </motion.button>
                        </div>

                        {visibility === 'public' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200"
                          >
                            <p className="text-xs text-blue-700">
                              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
                              {locale === 'fr'
                                ? 'Les ressources publiques sont visibles par tous les praticiens dans la Bibliothèque numérique.'
                                : 'Public resources will be visible to all practitioners in the Digital Library.'}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Content Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Résumé du contenu' : 'Content Summary'}
                    </h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {blocks.map((block, index) => {
                        const blockType = blockTypes.find(bt => bt.type === block.type)
                        const Icon = blockType?.icon || FileText
                        return (
                          <div key={block.id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 truncate flex-1">
                              {block.content || blockType?.label[locale]}
                            </span>
                          </div>
                        )
                      })}
                    </div>
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

export default function CreateWorksheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>}>
      <CreateWorksheetContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
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
  Loader2,
  Cloud,
  CloudOff,
  Mic,
  Upload,
  X,
  CheckCircle2,
  Square,
  Circle,
  Video,
  Link2,
  Youtube,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { useLanguage, lt } from '@/lib/i18n/context'
import { createResource, getResourceById, updateResource } from '@/lib/services/resources'
import { uploadResourceFile, validateFile, formatFileSize } from '@/lib/services/resource-storage'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { ShareResourceModal } from '@/components/resources/ShareResourceModal'
import type { ResourceCategory } from '@/types/library'
import type { ResourceBlock, PsychoeducationSettings, Resource } from '@/types/resource'
import DescriptionEditor from '@/components/resources/DescriptionEditor'

interface SimpleMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  avatar_url?: string | null
}

// Content block types for psychoeducation
type ContentBlockType = 'heading' | 'paragraph' | 'key_points' | 'callout' | 'quote' | 'image' | 'audio' | 'video' | 'link'

// Media file interface for uploads
interface MediaFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  path?: string
  isUploading?: boolean
  uploadError?: string
}

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
  // For image/audio
  caption?: string
  mediaFile?: MediaFile
  // For links
  linkUrl?: string
  linkPlatform?: 'youtube' | 'vimeo' | 'spotify' | 'soundcloud' | 'other'
  linkTitle?: string
}

interface ContentBlockOption {
  type: ContentBlockType
  icon: React.ElementType
  label: Record<string, string>
  description: Record<string, string>
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
    type: 'image',
    icon: ImageIcon,
    label: { en: 'Image', fr: 'Image' },
    description: { en: 'Upload an image or diagram', fr: 'Télécharger une image ou diagramme' },
  },
  {
    type: 'audio',
    icon: Mic,
    label: { en: 'Audio', fr: 'Audio' },
    description: { en: 'Upload an audio file', fr: 'Télécharger un fichier audio' },
  },
  {
    type: 'video',
    icon: Video,
    label: { en: 'Video', fr: 'Vidéo' },
    description: { en: 'Upload or record a video', fr: 'Télécharger ou enregistrer une vidéo' },
  },
  {
    type: 'link',
    icon: Link2,
    label: { en: 'External Link', fr: 'Lien externe' },
    description: { en: 'Add YouTube, Vimeo, or other links', fr: 'Ajouter des liens YouTube, Vimeo ou autres' },
  },
]

const calloutTypes = {
  info: { en: 'Information', fr: 'Information', icon: AlertCircle, color: 'blue' },
  warning: { en: 'Important', fr: 'Important', icon: AlertCircle, color: 'amber' },
  tip: { en: 'Tip', fr: 'Conseil', icon: Lightbulb, color: 'green' },
  example: { en: 'Example', fr: 'Exemple', icon: BookMarked, color: 'purple' },
}

const allCategories: ResourceCategory[] = [
  'emotions', 'emotional_regulation', 'self_confidence', 'self_esteem',
  'relationships', 'communication', 'stress', 'anxiety', 'burnout',
  'decision_making', 'behavior', 'habits', 'psychoeducation', 'reflection', 'action'
]

const generateId = () => Math.random().toString(36).substring(2, 9)

// Psychoeducation templates for quick start
const educationTemplates = [
  {
    id: 'self-esteem',
    name: { en: 'Understanding Self-Esteem', fr: 'Comprendre l\'estime de soi' },
    description: { en: 'Guide to building healthy self-esteem', fr: 'Guide pour développer une estime de soi saine' },
    blocks: [
      { id: '1', type: 'heading' as ContentBlockType, content: 'Understanding Self-Esteem' },
      { id: '2', type: 'paragraph' as ContentBlockType, content: 'Self-esteem is how we value and perceive ourselves. It affects nearly every aspect of our lives—from our relationships to our career choices, and even our mental health. The good news is that self-esteem can be developed and strengthened over time.' },
      { id: '3', type: 'heading' as ContentBlockType, content: 'What is Healthy Self-Esteem?' },
      { id: '4', type: 'paragraph' as ContentBlockType, content: 'Healthy self-esteem means having a balanced, realistic view of yourself. It\'s not about being perfect or better than others—it\'s about accepting yourself, recognizing your worth, and treating yourself with kindness.' },
      { id: '5', type: 'callout' as ContentBlockType, content: 'Self-esteem isn\'t about thinking you\'re perfect. It\'s about knowing you\'re worthy of respect and kindness—including from yourself.', calloutType: 'tip' as const },
      { id: '6', type: 'heading' as ContentBlockType, content: 'Signs of Low Self-Esteem' },
      { id: '7', type: 'key_points' as ContentBlockType, content: 'You might notice:', points: ['Negative self-talk and harsh self-criticism', 'Difficulty accepting compliments', 'Fear of failure or trying new things', 'Comparing yourself unfavorably to others', 'Putting others\' needs before your own'] },
      { id: '8', type: 'heading' as ContentBlockType, content: 'Building Healthier Self-Esteem' },
      { id: '9', type: 'key_points' as ContentBlockType, content: 'Strategies that help:', points: ['Practice self-compassion—treat yourself as you would a friend', 'Challenge negative thoughts about yourself', 'Celebrate small wins and achievements', 'Set boundaries and honor your needs', 'Focus on growth, not perfection'] },
      { id: '10', type: 'heading' as ContentBlockType, content: 'Your Journey Forward' },
      { id: '11', type: 'paragraph' as ContentBlockType, content: 'Building self-esteem is a gradual process. It takes time and practice, but every small step matters. Together, we will work on understanding your unique patterns and developing strategies that help you see yourself more clearly and kindly.' },
      { id: '12', type: 'callout' as ContentBlockType, content: 'Remember: You are worthy of love and respect, exactly as you are. Growth is about becoming more of who you truly are, not becoming someone else.', calloutType: 'info' as const },
    ],
    learningObjectives: ['Understand what self-esteem is', 'Recognize signs of low self-esteem', 'Learn strategies for building healthier self-esteem'],
  },
  {
    id: 'cbt-introduction',
    name: { en: 'CBT Introduction', fr: 'Introduction à la TCC' },
    description: { en: 'Simple introduction to Cognitive Behavioral Therapy', fr: 'Introduction simple à la Thérapie Cognitivo-Comportementale' },
    blocks: [
      { id: '1', type: 'heading' as ContentBlockType, content: 'Understanding Cognitive Behavioral Therapy (CBT)' },
      { id: '2', type: 'paragraph' as ContentBlockType, content: 'Cognitive Behavioral Therapy, or CBT, is one of the most effective and widely-used forms of therapy. It helps you understand how your thoughts, feelings, and behaviors are connected—and gives you practical tools to create positive change in your life.' },
      { id: '3', type: 'heading' as ContentBlockType, content: 'The Core Idea' },
      { id: '4', type: 'paragraph' as ContentBlockType, content: 'CBT is based on a simple but powerful idea: the way we think affects how we feel, and how we feel affects what we do. By learning to recognize and change unhelpful thought patterns, we can improve our emotional well-being and behavior.' },
      { id: '5', type: 'callout' as ContentBlockType, content: 'Thoughts → Feelings → Behaviors: These three are always connected. Change one, and you can change the others.', calloutType: 'tip' as const },
      { id: '6', type: 'heading' as ContentBlockType, content: 'How CBT Works' },
      { id: '7', type: 'key_points' as ContentBlockType, content: 'In CBT, you will learn to:', points: ['Identify negative or unhelpful thought patterns', 'Challenge and reframe these thoughts', 'Develop healthier ways of thinking', 'Practice new behaviors that support your well-being'] },
      { id: '8', type: 'heading' as ContentBlockType, content: 'What CBT Can Help With' },
      { id: '9', type: 'key_points' as ContentBlockType, content: 'CBT is effective for:', points: ['Anxiety and worry', 'Depression and low mood', 'Stress management', 'Sleep difficulties', 'Building self-confidence'] },
      { id: '10', type: 'heading' as ContentBlockType, content: 'What to Expect' },
      { id: '11', type: 'paragraph' as ContentBlockType, content: 'CBT is a collaborative process. Together, we will work on understanding your unique patterns and developing personalized strategies that work for you. You will also practice skills between sessions—small steps that lead to meaningful change.' },
      { id: '12', type: 'callout' as ContentBlockType, content: 'Remember: CBT is a skill-building approach. Like any skill, it gets easier with practice. Be patient with yourself as you learn.', calloutType: 'info' as const },
    ],
    learningObjectives: ['Understand what CBT is and how it works', 'Learn the connection between thoughts, feelings, and behaviors', 'Know what to expect from CBT treatment'],
  },
  {
    id: 'blank',
    name: { en: 'Blank Document', fr: 'Document vierge' },
    description: { en: 'Start from scratch', fr: 'Créez sans modèle' },
    blocks: [],
    learningObjectives: [''],
  },
]

// Draggable block wrapper component for handle-only drag
function DraggableBlockWrapper({
  block,
  children
}: {
  block: ContentBlock
  children: (dragControls: ReturnType<typeof useDragControls>) => React.ReactNode
}) {
  const dragControls = useDragControls()

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={dragControls}
    >
      {children(dragControls)}
    </Reorder.Item>
  )
}

function CreatePsychoeducationContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const templateParam = searchParams.get('template')

  // Step state - start at 'build' if editing or template param provided, otherwise 'template'
  const [step, setStep] = useState<'template' | 'build' | 'details'>(editId || templateParam ? 'build' : 'template')
  const [detailsStep, setDetailsStep] = useState<1 | 2 | 3>(1)

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(!!editId)
  const [isLoading, setIsLoading] = useState(!!editId)

  // Document state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [resourceLanguage, setResourceLanguage] = useState<'en' | 'fr'>(locale as 'en' | 'fr')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [learningObjectives, setLearningObjectives] = useState<string[]>([''])
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'link_only' | 'public' | 'onboarding'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')

  // UI state
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)

  // View mode: 'edit' | 'preview'
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSavingRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const justAutoSavedRef = useRef(false)

  // User ID for file uploads
  const [userId, setUserId] = useState<string | null>(null)

  // Audio/Video recording state
  const [recordingBlockId, setRecordingBlockId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Share after save state
  const [showShareAfterSave, setShowShareAfterSave] = useState(false)
  const [savedResourceForShare, setSavedResourceForShare] = useState<Resource | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [members, setMembers] = useState<SimpleMember[]>([])
  const [memberGroups, setMemberGroups] = useState<{ id: string; name: string; color: string; member_ids: string[] }[]>([])

  // Template modification tracking using refs for reliable synchronous access
  // Using refs to avoid closure issues with state
  const selectedTemplateIdRef = useRef<string | null>(null)
  const hasModifiedContentRef = useRef(false)
  const [showTemplateWarningDialog, setShowTemplateWarningDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 11)

  // Load existing resource for edit mode
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

      // Skip reload if we just auto-saved and updated the URL
      if (justAutoSavedRef.current) {
        justAutoSavedRef.current = false
        return
      }

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
              // Load link properties
              linkUrl: block.linkUrl,
              linkPlatform: block.linkPlatform,
              linkTitle: block.linkTitle,
              // Load media file for image/audio blocks
              mediaFile: block.mediaFile ? {
                id: block.mediaFile.id,
                name: block.mediaFile.name,
                size: block.mediaFile.size,
                type: block.mediaFile.type,
                url: block.mediaFile.url,
                path: block.mediaFile.path,
              } : undefined,
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

  // Apply template from URL parameter (skip template selection step)
  useEffect(() => {
    if (templateParam && !editId) {
      const template = educationTemplates.find(t => t.id === templateParam)
      if (template) {
        if (template.id === 'blank') {
          setBlocks([])
          setLearningObjectives([''])
          setTitle('')
          selectedTemplateIdRef.current = null
          hasModifiedContentRef.current = true // Blank = can proceed
        } else {
          const blocksWithIds = template.blocks.map(block => ({
            ...block,
            id: generateId(),
          }))
          setBlocks(blocksWithIds as ContentBlock[])
          setLearningObjectives(template.learningObjectives)
          setTitle(lt(template.name, locale))
          // Track template for modification check
          selectedTemplateIdRef.current = templateParam
          hasModifiedContentRef.current = false // Using template = must modify before proceeding
        }
      }
    }
  }, [templateParam, editId, locale])

  // Reset form state when creating a new resource (not editing and no template)
  useEffect(() => {
    if (!editId && !templateParam) {
      setTitle('')
      setDescription('')
      setSelectedCategory(null)
      setBlocks([])
      setLearningObjectives([''])
      setVisibility('private')
      setResourceLanguage(locale as 'en' | 'fr')
      setSaveAs('draft')
      setStep('template')
      setDetailsStep(1)
      setIsEditMode(false)
      setIsLoading(false)
      setShowBlockPicker(false)
      setExpandedBlock(null)
      setViewMode('edit')
      setAutoSaveDraftId(null)
      setAutoSaveStatus('idle')
      setLastSavedAt(null)
      setHasUnsavedChanges(false)
    }
  }, [editId, templateParam, locale])

  // Connect video stream to preview element after state changes
  useEffect(() => {
    if (recordingType === 'video' && recordingBlockId && streamRef.current && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current
      videoPreviewRef.current.play().catch(console.error)
    }
  }, [recordingType, recordingBlockId])

  // Cleanup recording when component unmounts or when navigating away
  useEffect(() => {
    return () => {
      // Stop any active recording on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = educationTemplates.find(t => t.id === templateId)
    if (template) {
      // Assign unique IDs to blocks
      const blocksWithIds = template.blocks.map(block => ({
        ...block,
        id: generateId(),
      }))
      setBlocks(blocksWithIds as ContentBlock[])
      setLearningObjectives([...template.learningObjectives])
      setTitle(lt(template.name, locale)) // Set title from template
      setStep('build')

      // Track if using a template (not blank)
      if (templateId !== 'blank') {
        selectedTemplateIdRef.current = templateId
        hasModifiedContentRef.current = false // Reset modification flag
      } else {
        selectedTemplateIdRef.current = null
        hasModifiedContentRef.current = true // Blank template = user must create from scratch, allow proceed
      }
    }
  }

  // Handle continue to details with template modification check
  const handleContinueToDetails = () => {
    // If using a template and hasn't made any modifications, show warning dialog
    if (selectedTemplateIdRef.current && !hasModifiedContentRef.current) {
      setShowTemplateWarningDialog(true)
      return
    }
    setStep('details')
  }

  // Handle going back to resource creation page (discard current resource)
  const handleGoBackToTemplates = () => {
    setShowTemplateWarningDialog(false)
    // Navigate back to resource creation page
    router.push(templateParam ? '/dashboard' : '/resources/create')
  }

  // Helper to mark content as modified (call this in any edit handler)
  const markAsModified = () => {
    if (selectedTemplateIdRef.current && !hasModifiedContentRef.current) {
      hasModifiedContentRef.current = true
    }
  }

  // Add new block
  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      ...(type === 'key_points' && { points: [''] }),
      ...(type === 'callout' && { calloutType: 'info' }),
      ...(type === 'quote' && { attribution: '' }),
      ...(type === 'image' && { caption: '' }),
      ...(type === 'audio' && { caption: '' }),
      ...(type === 'video' && { caption: '' }),
    }
    setBlocks([...blocks, newBlock])
    setExpandedBlock(newBlock.id)
    setShowBlockPicker(false)
    markAsModified()
  }

  // Update block
  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
    markAsModified()
  }

  // Delete block
  const deleteBlock = (id: string) => {
    setDeleteConfirmId(id)
  }
  const confirmDeleteBlock = () => {
    if (deleteConfirmId) {
      setBlocks(blocks.filter(b => b.id !== deleteConfirmId))
      markAsModified()
    }
    setDeleteConfirmId(null)
  }

  // Handle file upload for media blocks
  const handleMediaUpload = async (blockId: string, file: File, acceptedTypes: string[]) => {
    // Validate file
    const validation = validateFile(file, {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: acceptedTypes,
    })

    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Create temporary media file with local preview
    const tempMediaFile: MediaFile = {
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
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
        name: file.name,
        size: file.size,
        type: file.type,
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
      // Only revoke if it's a local blob URL
      URL.revokeObjectURL(block.mediaFile.url)
    }
    updateBlock(blockId, { mediaFile: undefined })
  }

  // Start audio recording
  const startRecording = async (blockId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Try to find a supported MIME type (prefer mp4/ogg over webm for better compatibility)
      const mimeTypes = ['audio/mp4', 'audio/ogg', 'audio/mpeg', 'audio/webm']
      let selectedMimeType = 'audio/webm'
      let fileExtension = 'webm'

      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          fileExtension = mimeType.split('/')[1]
          break
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType })

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        try {
          // Convert to WAV format for better storage compatibility
          const wavBlob = await convertToWav(audioBlob)
          const file = new File([wavBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })

          // Upload the recorded audio
          await handleMediaUpload(blockId, file, ['audio/*'])
        } catch (conversionError) {
          console.error('Audio conversion failed:', conversionError)
          toast.error(locale === 'fr' ? 'Erreur de conversion audio' : 'Audio conversion failed')
        }

        // Reset recording state
        setRecordingBlockId(null)
        setIsRecording(false)
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setRecordingBlockId(blockId)
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error(locale === 'fr' ? 'Impossible d\'accéder au microphone' : 'Could not access microphone')
    }
  }

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  // Start video recording
  const startVideoRecording = async (blockId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream

      // Note: Video preview is connected via useEffect after state changes trigger re-render

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(audioChunksRef.current, { type: 'video/webm' })
        // Convert to mp4 naming for better compatibility (content is still webm but mp4 is allowed in bucket)
        const file = new File([videoBlob], `recording-${Date.now()}.mp4`, { type: 'video/mp4' })

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null

        // Upload the recorded video
        await handleMediaUpload(blockId, file, ['video/*'])

        // Reset recording state
        setRecordingBlockId(null)
        setIsRecording(false)
        setRecordingTime(0)
        setRecordingType('audio')
      }

      mediaRecorder.start()
      setRecordingBlockId(blockId)
      setIsRecording(true)
      setRecordingTime(0)
      setRecordingType('video')

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Failed to start video recording:', error)
      toast.error(locale === 'fr' ? 'Impossible d\'accéder à la caméra' : 'Could not access camera')
    }
  }

  // Stop video recording
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  // Cancel recording without saving (cleanup)
  const cancelRecording = useCallback(() => {
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    // Clear timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    // Stop all tracks to release camera/mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    // Reset state
    setRecordingBlockId(null)
    setIsRecording(false)
    setRecordingTime(0)
    setRecordingType('audio')
    audioChunksRef.current = []
  }, [])

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Convert audio blob to WAV format
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    const audioContext = new AudioContext()
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // WAV encoding
    const numChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample

    // Interleave channels
    const length = audioBuffer.length * numChannels
    const samples = new Int16Array(length)

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < audioBuffer.length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]))
        samples[i * numChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      }
    }

    // Create WAV file
    const dataSize = samples.length * bytesPerSample
    const buffer = new ArrayBuffer(44 + dataSize)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataSize, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataSize, true)

    // Write audio data
    const dataView = new Int16Array(buffer, 44)
    dataView.set(samples)

    await audioContext.close()
    return new Blob([buffer], { type: 'audio/wav' })
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
    markAsModified()
  }

  const updateLearningObjective = (index: number, value: string) => {
    const newObjectives = [...learningObjectives]
    newObjectives[index] = value
    setLearningObjectives(newObjectives)
    markAsModified()
  }

  const deleteLearningObjective = (index: number) => {
    if (learningObjectives.length > 1) {
      setLearningObjectives(learningObjectives.filter((_, i) => i !== index))
      markAsModified()
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
        } else if (block.type === 'image') {
          return {
            ...baseBlock,
            type: 'image' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'audio') {
          return {
            ...baseBlock,
            type: 'audio' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'video') {
          return {
            ...baseBlock,
            type: 'video' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'link') {
          return {
            ...baseBlock,
            type: 'link' as const,
            linkUrl: block.linkUrl,
            linkPlatform: block.linkPlatform,
            linkTitle: block.linkTitle,
          }
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

      // Check if we have an existing resource to update (either from edit mode or auto-saved draft)
      const existingResourceId = editId || autoSaveDraftId

      let savedResourceId: string | null = null

      if (existingResourceId) {
        // Update existing resource (either editing or updating auto-saved draft)
        await updateResource(existingResourceId, {
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          language: resourceLanguage,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        savedResourceId = existingResourceId
        toast.success(locale === 'fr' ? 'Ressource mise à jour avec succès!' : 'Resource updated successfully!')
      } else {
        // Create new resource
        const newResource = await createResource({
          type: 'psychoeducation',
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          language: resourceLanguage,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
        })
        savedResourceId = newResource?.id || null
        toast.success(locale === 'fr' ? 'Ressource créée avec succès!' : 'Resource created successfully!')
      }

      // If resource was saved successfully and published, show share option
      if (savedResourceId && saveAs === 'published') {
        // Fetch the resource data
        const resourceData = await getResourceById(savedResourceId)
        if (resourceData) {
          // Fetch members for sharing
          const supabaseClient = createClient()
          const { data: membersData } = await supabaseClient
            .from('members')
            .select('id, first_name, last_name, email, avatar_url')
            .eq('practitioner_id', userId)
            .eq('status', 'active')
            .order('first_name')

          if (membersData && membersData.length > 0) {
            setSavedResourceForShare(resourceData)
            setMembers(membersData)

            // Fetch member groups
            const { data: groups } = await supabaseClient
              .from('member_groups')
              .select('id, name, color')
              .eq('practitioner_id', userId)
              .order('name', { ascending: true })

            if (groups && groups.length > 0) {
              const groupIds = groups.map(g => g.id)
              const { data: groupMembers } = await supabaseClient
                .from('member_group_members')
                .select('group_id, member_id')
                .in('group_id', groupIds)

              const membersByGroup: Record<string, string[]> = {}
              groupMembers?.forEach((gm: { group_id: string; member_id: string }) => {
                if (!membersByGroup[gm.group_id]) membersByGroup[gm.group_id] = []
                membersByGroup[gm.group_id].push(gm.member_id)
              })

              setMemberGroups(groups.map(g => ({
                id: g.id,
                name: g.name,
                color: g.color,
                member_ids: membersByGroup[g.id] || [],
              })))
            }

            setShowShareAfterSave(true)
            setIsSaving(false)
            return // Don't redirect yet
          }
        }
      }

      router.push('/resources')
    } catch (error) {
      console.error('Error saving resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving resource')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle sharing with members
  const handleShareWithMembers = async (resourceId: string, memberIds: string[], message?: string) => {
    try {
      const supabaseClient = createClient()
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return

      let successCount = 0

      for (const memberId of memberIds) {
        const { error } = await supabaseClient
          .from('member_shared_resources')
          .insert({
            member_id: memberId,
            resource_id: resourceId,
            practitioner_id: user.id,
            shared_at: new Date().toISOString(),
            message: message || null,
          })

        if (!error) {
          successCount++
        }
      }

      if (successCount > 0) {
        toast.success(
          locale === 'fr'
            ? `Ressource partagée avec ${successCount} patient(s)`
            : `Resource shared with ${successCount} member(s)`
        )
      }

      setShowShareModal(false)
      setShowShareAfterSave(false)
      router.push('/resources')
    } catch (error) {
      console.error('Error sharing resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : 'Error sharing resource')
    }
  }

  // Check if can proceed to details
  const canProceedToDetails = title.trim() && blocks.length > 0

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isAutoSavingRef.current || isSaving) return
    if (!title.trim() || blocks.length === 0) return

    const saveToId = editId || autoSaveDraftId

    isAutoSavingRef.current = true
    setAutoSaveStatus('saving')

    try {
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
        } else if (block.type === 'image') {
          return {
            ...baseBlock,
            type: 'image' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'audio') {
          return {
            ...baseBlock,
            type: 'audio' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'video') {
          return {
            ...baseBlock,
            type: 'video' as const,
            caption: block.caption,
            mediaFile: block.mediaFile ? {
              id: block.mediaFile.id,
              name: block.mediaFile.name,
              size: block.mediaFile.size,
              type: block.mediaFile.type,
              url: block.mediaFile.url || '',
              path: block.mediaFile.path,
            } : undefined,
          }
        } else if (block.type === 'link') {
          return {
            ...baseBlock,
            type: 'link' as const,
            linkUrl: block.linkUrl,
            linkPlatform: block.linkPlatform,
            linkTitle: block.linkTitle,
          }
        } else if (block.type === 'heading') {
          return { ...baseBlock, type: 'heading' as const }
        } else {
          return { ...baseBlock, type: 'paragraph' as const }
        }
      })

      const settings: PsychoeducationSettings = {
        learningObjectives: learningObjectives.filter(o => o.trim() !== ''),
        estimatedReadingTime: Math.max(1, Math.ceil(blocks.reduce((total, block) => {
          let words = block.content.split(/\s+/).length
          if (block.points) words += block.points.join(' ').split(/\s+/).length
          return total + words
        }, 0) / 200)),
      }

      if (saveToId) {
        await updateResource(saveToId, {
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: resourceBlocks,
          settings,
          status: 'draft',
          visibility: 'private',
        })
      } else {
        const newResource = await createResource({
          type: 'psychoeducation',
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: resourceBlocks,
          settings,
          status: 'draft',
          visibility: 'private',
        })
        if (newResource?.id) {
          setAutoSaveDraftId(newResource.id)
          // Update URL with the new draft ID so refresh works
          justAutoSavedRef.current = true
          router.replace(`/resources/create/psychoeducation?edit=${newResource.id}`, { scroll: false })
        }
      }

      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)

      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setAutoSaveStatus('error')
      setTimeout(() => {
        setAutoSaveStatus('idle')
        setHasUnsavedChanges(true)
      }, 3000)
    } finally {
      isAutoSavingRef.current = false
    }
  }, [editId, autoSaveDraftId, isSaving, title, blocks, description, selectedCategory, learningObjectives])

  // Track changes and trigger auto-save
  const performAutoSaveRef = useRef(performAutoSave)
  performAutoSaveRef.current = performAutoSave

  useEffect(() => {
    if (isLoading) return
    if (isEditMode && isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }
    if (!title && blocks.length === 0) return

    setHasUnsavedChanges(true)
    setAutoSaveStatus('idle')

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSaveRef.current()
    }, 5000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [title, blocks, description, selectedCategory, learningObjectives, isEditMode, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

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
                  <span className="w-2 h-2 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
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
            'bg-gray-50 border-gray-400'
          }`}>
            <div className="flex items-start gap-3">
              {block.calloutType === 'tip' && <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />}
              {block.calloutType === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />}
              {block.calloutType === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />}
              {block.calloutType === 'example' && <BookMarked className="w-5 h-5 text-gray-700 mt-0.5" />}
              <p className={`${
                block.calloutType === 'info' ? 'text-blue-800' :
                block.calloutType === 'warning' ? 'text-amber-800' :
                block.calloutType === 'tip' ? 'text-green-800' :
                'text-gray-800'
              }`}>{block.content}</p>
            </div>
          </div>
        )}

        {/* Quote Block */}
        {block.type === 'quote' && (
          <blockquote className="border-l-4 border-gray-300 pl-4 py-2 italic">
            <p className="text-gray-700 text-lg">&ldquo;{block.content}&rdquo;</p>
            {block.attribution && (
              <footer className="text-gray-500 mt-2">— {block.attribution}</footer>
            )}
          </blockquote>
        )}

        {/* Image Block */}
        {block.type === 'image' && (
          <div className="space-y-2">
            {block.mediaFile?.url ? (
              <div className="rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.mediaFile.url}
                  alt={block.content || 'Image'}
                  className="w-full max-h-96 object-contain bg-gray-100"
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucune image' : 'No image uploaded'}</p>
              </div>
            )}
            {block.caption && <p className="text-sm text-gray-500 text-center">{block.caption}</p>}
          </div>
        )}

        {/* Audio Block */}
        {block.type === 'audio' && (
          <div className="space-y-2">
            {block.mediaFile?.url ? (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{block.content || block.mediaFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(block.mediaFile.size)}</p>
                  </div>
                </div>
                <audio src={block.mediaFile.url} controls className="w-full" />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <Mic className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucun audio' : 'No audio uploaded'}</p>
              </div>
            )}
            {block.caption && <p className="text-sm text-gray-500 text-center">{block.caption}</p>}
          </div>
        )}

        {/* Video Block */}
        {block.type === 'video' && (
          <div className="space-y-2">
            {block.mediaFile?.url ? (
              <div className="rounded-xl overflow-hidden bg-black">
                <video
                  src={block.mediaFile.url}
                  controls
                  className="w-full max-h-96"
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{locale === 'fr' ? 'Aucune vidéo' : 'No video uploaded'}</p>
              </div>
            )}
            {block.caption && <p className="text-sm text-gray-500 text-center">{block.caption}</p>}
          </div>
        )}
      </motion.div>
    )
  }

  // Get block colors based on type
  const getBlockColors = (type: ContentBlockType) => {
    const colors: Record<string, { text: string; accent: string }> = {
      heading: { text: 'text-slate-600', accent: 'bg-slate-400' },
      paragraph: { text: 'text-slate-600', accent: 'bg-slate-400' },
      key_points: { text: 'text-blue-600', accent: 'bg-blue-400' },
      callout: { text: 'text-amber-600', accent: 'bg-amber-400' },
      quote: { text: 'text-gray-700', accent: 'bg-gray-400' },
      image: { text: 'text-emerald-600', accent: 'bg-emerald-400' },
      audio: { text: 'text-orange-600', accent: 'bg-orange-400' },
      video: { text: 'text-gray-700', accent: 'bg-gray-400' },
      link: { text: 'text-cyan-600', accent: 'bg-cyan-400' },
    }
    return colors[type] || { text: 'text-gray-600', accent: 'bg-gray-400' }
  }

  // Render block editor
  const renderBlockEditor = (block: ContentBlock, dragControls?: ReturnType<typeof useDragControls>) => {
    const isExpanded = expandedBlock === block.id
    const blockType = contentBlockTypes.find(bt => bt.type === block.type)
    const Icon = blockType?.icon || BookOpen
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
          <div
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 touch-none select-none"
            onPointerDown={(e) => {
              e.stopPropagation()
              dragControls?.start(e)
            }}
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <div className={`w-1.5 h-5 rounded-full flex-shrink-0 ${colors.accent}`} />

          <Icon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">
              {block.content || <span className="text-gray-400">{blockType ? lt(blockType.label, locale) : ''}</span>}
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
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
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
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                      ref={(el) => {
                        // Auto-resize on mount when content exists
                        if (el && block.content) {
                          el.style.height = 'auto'
                          el.style.height = el.scrollHeight + 'px'
                        }
                      }}
                      value={block.content}
                      onChange={(e) => {
                        updateBlock(block.id, { content: e.target.value })
                        e.target.style.height = 'auto'
                        e.target.style.height = e.target.scrollHeight + 'px'
                      }}
                      placeholder={locale === 'fr' ? 'Écrivez votre contenu éducatif...' : 'Write your educational content...'}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y min-h-[120px] overflow-hidden"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Points' : 'Points'}
                      </label>
                      <div className="space-y-2">
                        {block.points?.map((point, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => updateKeyPoint(block.id, index, e.target.value)}
                              placeholder={`${locale === 'fr' ? 'Point' : 'Point'} ${index + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="mt-2 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-800"
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
                                    'bg-gray-100 text-gray-800 ring-2 ring-gray-400'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <CalloutIcon className="w-4 h-4" />
                              {lt(value as unknown as Record<string, string>, locale)}
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
                        ref={(el) => {
                          if (el && block.content) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        value={block.content}
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder={locale === 'fr' ? 'Contenu de l\'encadré...' : 'Callout content...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y min-h-[80px] overflow-hidden"
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
                        ref={(el) => {
                          if (el && block.content) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        value={block.content}
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder={locale === 'fr' ? 'Entrez la citation...' : 'Enter the quote...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl italic focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y min-h-[80px] overflow-hidden"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
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
                            alt={block.content || 'Uploaded image'}
                            className={`w-full h-48 object-cover ${block.mediaFile.isUploading ? 'opacity-50' : ''}`}
                          />
                          {block.mediaFile.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
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
                      <label className="block cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleMediaUpload(block.id, file, ['image/*'])
                          }}
                          className="hidden"
                        />
                        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center hover:bg-gray-100/50 transition-colors">
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-700 font-medium">
                            {locale === 'fr' ? 'Cliquez pour télécharger une image' : 'Click to upload an image'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (max 50MB)</p>
                        </div>
                      </label>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description / Alt text' : 'Description / Alt text'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Décrivez l\'image...' : 'Describe the image...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Audio Block */}
                {block.type === 'audio' && (
                  <>
                    {/* Audio Upload/Preview */}
                    {block.mediaFile ? (
                      <div className="space-y-3">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${block.mediaFile.isUploading ? 'bg-gray-50' : 'bg-gray-100'} flex items-center justify-center`}>
                                {block.mediaFile.isUploading ? (
                                  <Loader2 className="w-6 h-6 text-gray-700 animate-spin" />
                                ) : (
                                  <Mic className="w-6 h-6 text-gray-700" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  {block.mediaFile.name}
                                  {block.mediaFile.path && (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  )}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(block.mediaFile.size)}
                                  {block.mediaFile.isUploading && (
                                    <span className="ml-2 text-gray-700">
                                      {locale === 'fr' ? 'Téléchargement...' : 'Uploading...'}
                                    </span>
                                  )}
                                  {block.mediaFile.uploadError && (
                                    <span className="ml-2 text-red-500">{block.mediaFile.uploadError}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            {!block.mediaFile.isUploading && (
                              <button
                                onClick={() => removeMedia(block.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {!block.mediaFile.isUploading && block.mediaFile.url && (
                            <audio src={block.mediaFile.url} controls className="w-full" />
                          )}
                        </div>
                      </div>
                    ) : recordingBlockId === block.id ? (
                      /* Recording in progress */
                      <div className="p-6 border-2 border-red-200 rounded-xl bg-red-50/50 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                          <span className="text-2xl font-mono font-bold text-red-600">
                            {formatRecordingTime(recordingTime)}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 mb-4">
                          {locale === 'fr' ? 'Enregistrement en cours...' : 'Recording...'}
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={cancelRecording}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                          >
                            <X className="w-5 h-5" />
                            {locale === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                          <button
                            onClick={stopRecording}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                          >
                            <Square className="w-5 h-5 fill-current" />
                            {locale === 'fr' ? 'Arrêter et sauvegarder' : 'Stop & Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload or Record options */
                      <div className="grid grid-cols-2 gap-4">
                        {/* Upload option */}
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleMediaUpload(block.id, file, ['audio/*'])
                            }}
                            className="hidden"
                          />
                          <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center hover:bg-gray-100/50 transition-colors h-full flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-700 font-medium">
                              {locale === 'fr' ? 'Télécharger' : 'Upload'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">MP3, WAV, OGG</p>
                          </div>
                        </label>

                        {/* Record option */}
                        <button
                          onClick={() => startRecording(block.id)}
                          className="p-6 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50 text-center hover:bg-red-100/50 transition-colors h-full flex flex-col items-center justify-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                            <Circle className="w-6 h-6 text-red-500 fill-red-500" />
                          </div>
                          <p className="text-sm text-red-600 font-medium">
                            {locale === 'fr' ? 'Enregistrer' : 'Record'}
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {locale === 'fr' ? 'Utiliser le micro' : 'Use microphone'}
                          </p>
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre' : 'Title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Titre de l\'audio...' : 'Audio title...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder={locale === 'fr' ? 'Description de l\'audio' : 'Audio description'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Video Block */}
                {block.type === 'video' && (
                  <>
                    {/* Video Upload/Preview */}
                    {block.mediaFile ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden bg-black">
                          <video
                            src={block.mediaFile.url}
                            controls
                            className={`w-full max-h-64 ${block.mediaFile.isUploading ? 'opacity-50' : ''}`}
                          />
                          {block.mediaFile.isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
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
                        </div>
                      </div>
                    ) : recordingBlockId === block.id && recordingType === 'video' ? (
                      /* Video Recording in progress */
                      <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                          <video
                            ref={videoPreviewRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            <span className="text-sm font-medium">{formatRecordingTime(recordingTime)}</span>
                          </div>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={cancelRecording}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                          >
                            <X className="w-5 h-5" />
                            {locale === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                          <button
                            onClick={stopVideoRecording}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                          >
                            <Square className="w-5 h-5 fill-current" />
                            {locale === 'fr' ? 'Arrêter et sauvegarder' : 'Stop & Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload or Record options */
                      <div className="grid grid-cols-2 gap-4">
                        {/* Upload option */}
                        <label className="block cursor-pointer">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleMediaUpload(block.id, file, ['video/*'])
                            }}
                            className="hidden"
                          />
                          <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center hover:bg-gray-100/50 transition-colors h-full flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-700 font-medium">
                              {locale === 'fr' ? 'Télécharger' : 'Upload'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">MP4, WebM</p>
                          </div>
                        </label>

                        {/* Record option */}
                        <button
                          onClick={() => startVideoRecording(block.id)}
                          className="p-6 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50 text-center hover:bg-red-100/50 transition-colors h-full flex flex-col items-center justify-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                            <Video className="w-6 h-6 text-red-500" />
                          </div>
                          <p className="text-sm text-red-600 font-medium">
                            {locale === 'fr' ? 'Enregistrer' : 'Record'}
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {locale === 'fr' ? 'Utiliser la caméra' : 'Use camera'}
                          </p>
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre' : 'Title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Titre de la vidéo...' : 'Video title...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.caption || ''}
                        onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                        placeholder={locale === 'fr' ? 'Description de la vidéo' : 'Video description'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Link Block */}
                {block.type === 'link' && (
                  <>
                    {/* Platform Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Plateforme' : 'Platform'}
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {[
                          { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'red' },
                          { id: 'vimeo', label: 'Vimeo', icon: Video, color: 'blue' },
                          { id: 'spotify', label: 'Spotify', icon: Circle, color: 'green' },
                          { id: 'soundcloud', label: 'SoundCloud', icon: Cloud, color: 'orange' },
                          { id: 'other', label: locale === 'fr' ? 'Autre' : 'Other', icon: ExternalLink, color: 'gray' },
                        ].map((platform) => {
                          const isSelected = block.linkPlatform === platform.id
                          const PlatformIcon = platform.icon
                          return (
                            <button
                              key={platform.id}
                              onClick={() => updateBlock(block.id, { linkPlatform: platform.id as ContentBlock['linkPlatform'] })}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? platform.color === 'red' ? 'border-red-400 bg-red-50 text-red-600'
                                    : platform.color === 'blue' ? 'border-blue-400 bg-blue-50 text-blue-600'
                                    : platform.color === 'green' ? 'border-green-400 bg-green-50 text-green-600'
                                    : platform.color === 'orange' ? 'border-orange-400 bg-orange-50 text-orange-600'
                                    : 'border-gray-400 bg-gray-50 text-gray-600'
                                  : 'border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              <PlatformIcon className="w-5 h-5" />
                              <span className="text-xs font-medium">{platform.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* URL Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'URL du lien' : 'Link URL'}
                      </label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={block.linkUrl || ''}
                          onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })}
                          placeholder={
                            block.linkPlatform === 'youtube' ? 'https://www.youtube.com/watch?v=...'
                              : block.linkPlatform === 'vimeo' ? 'https://vimeo.com/...'
                              : block.linkPlatform === 'spotify' ? 'https://open.spotify.com/...'
                              : block.linkPlatform === 'soundcloud' ? 'https://soundcloud.com/...'
                              : 'https://...'
                          }
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Link Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre du lien' : 'Link Title'}
                      </label>
                      <input
                        type="text"
                        value={block.linkTitle || ''}
                        onChange={(e) => updateBlock(block.id, { linkTitle: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Vidéo explicative sur la méditation' : 'E.g., Explanatory video about meditation'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <textarea
                        ref={(el) => {
                          if (el && block.content) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        value={block.content || ''}
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        placeholder={locale === 'fr' ? 'Brève description du contenu...' : 'Brief description of the content...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-y min-h-[60px] overflow-hidden"
                      />
                    </div>

                    {/* Preview */}
                    {block.linkUrl && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            block.linkPlatform === 'youtube' ? 'bg-red-100 text-red-600'
                              : block.linkPlatform === 'vimeo' ? 'bg-blue-100 text-blue-600'
                              : block.linkPlatform === 'spotify' ? 'bg-green-100 text-green-600'
                              : block.linkPlatform === 'soundcloud' ? 'bg-orange-100 text-orange-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {block.linkPlatform === 'youtube' ? <Youtube className="w-5 h-5" />
                              : block.linkPlatform === 'vimeo' ? <Video className="w-5 h-5" />
                              : block.linkPlatform === 'spotify' ? <Circle className="w-5 h-5" />
                              : block.linkPlatform === 'soundcloud' ? <Cloud className="w-5 h-5" />
                              : <ExternalLink className="w-5 h-5" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {block.linkTitle || (locale === 'fr' ? 'Lien externe' : 'External Link')}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{block.linkUrl}</p>
                            {block.content && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{block.content}</p>
                            )}
                          </div>
                          <a
                            href={block.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
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
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {locale === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Background */}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* TEMPLATE SELECTION STEP */}
          {step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="text-center mb-10">
                <Link href="/resources/create">
                  <motion.div whileHover={{ x: -4 }} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">{locale === 'fr' ? 'Retour' : 'Back'}</span>
                  </motion.div>
                </Link>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Nouveau document' : 'New Psychoeducation'}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Créez sans modèle ou personnalisez un modèle existant'
                    : 'Start from scratch or customize an existing template'}
                </p>
              </div>

              {/* Templates Grid */}
              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {educationTemplates.map((template, index) => (
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
                          ? 'border-dashed border-gray-300 hover:border-gray-500 bg-gray-50/50'
                          : 'border-white/60 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-gray-100' : 'bg-gray-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-gray-600" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {lt(template.name, locale)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lt(template.description, locale)}
                      </p>
                      {template.id !== 'blank' && (
                        <p className="text-xs text-gray-600 mt-2">
                          {template.blocks.length} {locale === 'fr' ? 'sections' : 'sections'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

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
                {isEditMode ? (
                  <Link href="/resources">
                    <motion.div whileHover={{ x: -4 }} className="inline-block">
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Retour' : 'Back'}
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <Link href={templateParam ? '/dashboard' : '/resources/create'}>
                    <motion.div whileHover={{ x: -4 }} className="inline-block">
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Retour' : 'Back'}
                      </Button>
                    </motion.div>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  {/* Auto-save Status Indicator */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-sm">
                    {autoSaveStatus === 'saving' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                        <span className="text-xs text-blue-600 font-medium">
                          {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                        </span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">
                          {locale === 'fr' ? 'Enregistré' : 'Saved'}
                        </span>
                      </>
                    )}
                    {autoSaveStatus === 'error' && (
                      <>
                        <CloudOff className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs text-red-600 font-medium">
                          {locale === 'fr' ? 'Erreur' : 'Error'}
                        </span>
                      </>
                    )}
                    {autoSaveStatus === 'idle' && hasUnsavedChanges && (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Non enregistré' : 'Unsaved'}
                        </span>
                      </>
                    )}
                    {autoSaveStatus === 'idle' && !hasUnsavedChanges && lastSavedAt && (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Tout est enregistré' : 'All saved'}
                        </span>
                      </>
                    )}
                    {autoSaveStatus === 'idle' && !hasUnsavedChanges && !lastSavedAt && (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Brouillon' : 'Draft'}
                        </span>
                      </>
                    )}
                  </div>
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-xl p-1 border border-white/60 shadow-sm">
                    <button
                      onClick={() => { setViewMode('edit'); resetPreview() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'edit'
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {locale === 'fr' ? 'Éditer' : 'Edit'}
                    </button>
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        viewMode === 'preview'
                          ? 'bg-gray-900 text-white shadow-md'
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
                      onClick={handleContinueToDetails}
                      disabled={!canProceedToDetails}
                      className="bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl"
                    >
                      {locale === 'fr' ? 'Continuer' : 'Continue'}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Step Indicator for Build */}
              <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  {/* Step 1: Build */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-900 text-white">
                      1
                    </div>
                    <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                      {locale === 'fr' ? 'Contenu' : 'Build'}
                    </span>
                  </div>

                  <div className="w-6 h-0.5 bg-gray-200" />

                  {/* Step 2: Details */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-200 text-gray-500">
                      2
                    </div>
                    <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                      {locale === 'fr' ? 'Détails' : 'Details'}
                    </span>
                  </div>

                  <div className="w-6 h-0.5 bg-gray-200" />

                  {/* Step 3: Settings */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-200 text-gray-500">
                      3
                    </div>
                    <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                      {locale === 'fr' ? 'Paramètres' : 'Settings'}
                    </span>
                  </div>

                  <div className="w-6 h-0.5 bg-gray-200" />

                  {/* Step 4: Publish */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-200 text-gray-500">
                      4
                    </div>
                    <span className="text-sm font-medium text-gray-400 hidden sm:inline">
                      {locale === 'fr' ? 'Publier' : 'Publish'}
                    </span>
                  </div>
                </div>
              </div>

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
                          onChange={(e) => { setTitle(e.target.value); markAsModified(); }}
                          placeholder={locale === 'fr' ? 'Titre du document...' : 'Document title...'}
                          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400"
                        />
                      </motion.div>

                      {/* Content Blocks */}
                      <div className="space-y-3">
                        <Reorder.Group axis="y" values={blocks} onReorder={(newBlocks) => { setBlocks(newBlocks); markAsModified(); }}>
                          {blocks.map((block) => (
                            <DraggableBlockWrapper key={block.id} block={block}>
                              {(dragControls) => renderBlockEditor(block, dragControls)}
                            </DraggableBlockWrapper>
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
                          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50/50 transition-all flex items-center justify-center gap-2"
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
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {contentBlockTypes.map((bt) => {
                                  const Icon = bt.icon
                                  return (
                                    <button
                                      key={bt.type}
                                      onClick={() => addBlock(bt.type)}
                                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-gray-700" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{lt(bt.label, locale)}</p>
                                        <p className="text-xs text-gray-500">{lt(bt.description, locale)}</p>
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
                          <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900">{title || 'Untitled Document'}</h1>
                            <p className="text-gray-500 text-sm">{estimateReadingTime()} min read</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewMode('edit')}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                          {locale === 'fr' ? 'Retour à l\'édition' : 'Back to Edit'}
                        </button>
                      </div>

                      {/* Preview Content */}
                      <div className="prose prose-gray max-w-none">
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
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] border-2 border-gray-200/60 p-5 shadow-lg shadow-gray-200/40"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-md">
                          <Brain className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'fr' ? 'Conseils' : 'Tips'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Utilisez un langage simple et clair' : 'Use simple, clear language'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Incluez des exemples concrets' : 'Include concrete examples'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
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
                        <p className="text-3xl font-bold text-gray-700">{estimateReadingTime()}</p>
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
                    onClick={() => {
                      if (detailsStep === 1) {
                        setStep('build')
                      } else {
                        setDetailsStep((detailsStep - 1) as 1 | 2 | 3)
                      }
                    }}
                    className="rounded-xl hover:bg-white/80"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {detailsStep === 1
                      ? (locale === 'fr' ? 'Revenir au contenu' : 'Back to content')
                      : (locale === 'fr' ? 'Précédent' : 'Previous')
                    }
                  </Button>
                </motion.div>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Eye className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Aperçu' : 'Preview'}
                </Button>
              </motion.div>

              {/* Title Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">
                      {blocks.length} {locale === 'fr' ? 'sections' : 'sections'} • {estimateReadingTime()} {locale === 'fr' ? 'min lecture' : 'min read'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Indicator */}
              <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  {/* Step 1: Build (completed) */}
                  <button
                    onClick={() => setStep('build')}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gray-900 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                      {locale === 'fr' ? 'Contenu' : 'Build'}
                    </span>
                  </button>

                  <div className="w-6 h-0.5 bg-gray-900" />

                  {/* Step 2: Details */}
                  <button
                    onClick={() => setDetailsStep(1)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      detailsStep >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {detailsStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${detailsStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Détails' : 'Details'}
                    </span>
                  </button>

                  <div className={`w-6 h-0.5 ${detailsStep > 1 ? 'bg-gray-500' : 'bg-gray-200'}`} />

                  {/* Step 3: Settings */}
                  <button
                    onClick={() => {
                      if (description.trim() && selectedCategory) {
                        setDetailsStep(2)
                      }
                    }}
                    className={`flex items-center gap-2 ${!(description.trim() && selectedCategory) && detailsStep < 2 ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      detailsStep >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {detailsStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${detailsStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Paramètres' : 'Settings'}
                    </span>
                  </button>

                  <div className={`w-6 h-0.5 ${detailsStep > 2 ? 'bg-gray-500' : 'bg-gray-200'}`} />

                  {/* Step 4: Publish */}
                  <button
                    onClick={() => {
                      if (description.trim() && selectedCategory && detailsStep >= 2) {
                        setDetailsStep(3)
                      }
                    }}
                    className={`flex items-center gap-2 ${detailsStep < 2 ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      detailsStep >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      4
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${detailsStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Publier' : 'Publish'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 1: Details */}
              {detailsStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Description' : 'Description'}
                      <span className="text-red-500 ml-1">*</span>
                    </h2>
                    <DescriptionEditor
                      value={description}
                      onChange={setDescription}
                      placeholder={locale === 'fr' ? 'Décrivez brièvement ce document...' : 'Briefly describe this resource...'}
                      className="mb-4"
                    />

                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {locale === 'fr' ? 'Catégorie' : 'Category'}
                      <span className="text-red-500 ml-1">*</span>
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {allCategories.map((category) => (
                        <motion.button
                          key={category}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-gray-900 text-white shadow-md'
                              : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                          }`}
                        >
                          {t.library.categories[category]}
                        </motion.button>
                      ))}
                    </div>

                    {/* Language Section */}
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                      {locale === 'fr' ? 'Langue' : 'Language'}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResourceLanguage('en')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          resourceLanguage === 'en'
                            ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">EN</span>
                        English
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResourceLanguage('fr')}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          resourceLanguage === 'fr'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">FR</span>
                        Français
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Continue Button */}
                  <div className="flex items-center justify-between mt-6">
                    {(!description.trim() || !selectedCategory) && (
                      <p className="text-sm text-amber-600">
                        {locale === 'fr' ? '* Veuillez remplir tous les champs' : '* Please fill in all fields'}
                      </p>
                    )}
                    {description.trim() && selectedCategory && <div />}
                    <motion.div whileHover={description.trim() && selectedCategory ? { scale: 1.02 } : {}} whileTap={description.trim() && selectedCategory ? { scale: 0.98 } : {}}>
                      <Button
                        onClick={() => setDetailsStep(2)}
                        disabled={!description.trim() || !selectedCategory}
                        className={`rounded-xl px-8 ${
                          description.trim() && selectedCategory
                            ? 'bg-gray-900 hover:bg-gray-800 shadow-lg'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {locale === 'fr' ? 'Continuer' : 'Continue'}
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Settings (Learning Objectives) */}
              {detailsStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {locale === 'fr' ? 'Objectifs d\'apprentissage' : 'Learning Objectives'}
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      {locale === 'fr' ? 'Ce que le client apprendra de ce document (optionnel)' : 'What the client will learn from this resource (optional)'}
                    </p>
                    <div className="space-y-2">
                      {learningObjectives.map((objective, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={objective}
                            onChange={(e) => updateLearningObjective(index, e.target.value)}
                            placeholder={locale === 'fr' ? 'Ex: Comprendre les symptômes de l\'anxiété' : 'e.g., Understand anxiety symptoms'}
                            className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                      className="mt-3 flex items-center gap-2 text-sm text-gray-700 hover:text-gray-800"
                    >
                      <Plus className="w-4 h-4" />
                      {locale === 'fr' ? 'Ajouter un objectif' : 'Add objective'}
                    </button>
                  </motion.div>

                  {/* Continue Button */}
                  <div className="flex justify-end mt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setDetailsStep(3)}
                        className="rounded-xl px-8 bg-gray-900 hover:bg-gray-800 shadow-lg"
                      >
                        {locale === 'fr' ? 'Continuer' : 'Continue'}
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Publish */}
              {detailsStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {locale === 'fr' ? 'Publier votre document' : 'Publish Your Resource'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                      {locale === 'fr' ? 'Choisissez comment enregistrer et partager votre document' : 'Choose how to save and share your resource'}
                    </p>

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
                              <BookOpen className={`w-4 h-4 ${saveAs === 'draft' ? 'text-amber-700' : 'text-gray-500'}`} />
                            </div>
                            <span className={`font-medium ${saveAs === 'draft' ? 'text-amber-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Brouillon' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Enregistrer et modifier plus tard' : 'Save to edit later'}
                          </p>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSaveAs('published')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            saveAs === 'published'
                              ? 'border-gray-400 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              saveAs === 'published' ? 'bg-gray-200' : 'bg-gray-100'
                            }`}>
                              <CheckCircle2 className={`w-4 h-4 ${saveAs === 'published' ? 'text-gray-800' : 'text-gray-500'}`} />
                            </div>
                            <span className={`font-medium ${saveAs === 'published' ? 'text-gray-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Publier' : 'Publish'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Prêt à être attribué aux membres' : 'Ready to assign to members'}
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
                              visibility === 'private' || visibility === 'link_only'
                                ? 'border-gray-400 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                visibility === 'private' || visibility === 'link_only' ? 'bg-gray-200' : 'bg-gray-100'
                              }`}>
                                <Lock className={`w-4 h-4 ${visibility === 'private' || visibility === 'link_only' ? 'text-gray-800' : 'text-gray-500'}`} />
                              </div>
                              <span className={`font-medium ${visibility === 'private' || visibility === 'link_only' ? 'text-gray-900' : 'text-gray-700'}`}>
                                {locale === 'fr' ? 'Privé' : 'Private'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {locale === 'fr' ? 'Vous + membres partagés' : 'You + shared members'}
                            </p>
                          </motion.button>

                          <div
                            className="p-4 rounded-xl border-2 text-left border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                                <Globe className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-500">
                                {locale === 'fr' ? 'Public' : 'Public'}
                              </span>
                              <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {locale === 'fr' ? 'Bientôt' : 'Coming Soon'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {locale === 'fr' ? 'Bibliothèque numérique' : 'Digital Library'}
                            </p>
                          </div>
                        </div>

                        {/* External link toggle - only show for private */}
                        {(visibility === 'private' || visibility === 'link_only') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4"
                          >
                            <button
                              type="button"
                              onClick={() => setVisibility(visibility === 'link_only' ? 'private' : 'link_only')}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                                visibility === 'link_only'
                                  ? 'border-teal-400 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <ExternalLink className={`w-4 h-4 ${visibility === 'link_only' ? 'text-teal-600' : 'text-gray-400'}`} />
                                <div>
                                  <p className={`text-sm font-medium ${visibility === 'link_only' ? 'text-teal-900' : 'text-gray-700'}`}>
                                    {locale === 'fr' ? 'Partager via lien externe' : 'Share via external link'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {locale === 'fr' ? 'Tout le monde peut voir sans connexion' : 'Anyone can view without login'}
                                  </p>
                                </div>
                              </div>
                              <div className={`w-11 h-6 rounded-full transition-colors ${visibility === 'link_only' ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${visibility === 'link_only' ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
                              </div>
                            </button>
                          </motion.div>
                        )}

                        {visibility === 'public' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200"
                          >
                            <p className="text-xs text-blue-700">
                              <Globe className="w-3.5 h-3.5 inline mr-1.5" />
                              {locale === 'fr'
                                ? 'Votre ressource sera partagée avec la communauté des praticiens'
                                : 'Your resource will be shared with the practitioner community'}
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-xl px-8 bg-gray-900 hover:bg-gray-800 shadow-lg"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share After Save Confirmation Modal */}
      <AnimatePresence>
        {showShareAfterSave && savedResourceForShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => {
              setShowShareAfterSave(false)
              router.push('/resources')
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Success Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {locale === 'fr' ? 'Ressource publiée!' : 'Resource Published!'}
                </h2>
                <p className="text-emerald-100 text-sm">
                  {savedResourceForShare.title}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setShowShareAfterSave(false)
                      setShowShareModal(true)
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3"
                  >
                    {locale === 'fr' ? 'Partager cette ressource' : 'Share this resource'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowShareAfterSave(false)
                      router.push('/resources')
                    }}
                    className="w-full text-gray-500 rounded-xl py-3"
                  >
                    {locale === 'fr' ? 'Plus tard' : 'Maybe Later'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Resource Modal */}
      {savedResourceForShare && (
        <ShareResourceModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false)
            router.push('/resources')
          }}
          resource={savedResourceForShare}
          members={members}
          locale={locale}
          onShare={handleShareWithMembers}
          groups={memberGroups}
        />
      )}

      {/* Template Modification Warning Dialog */}
      <AlertDialog open={showTemplateWarningDialog} onOpenChange={setShowTemplateWarningDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'fr' ? 'Modèle non personnalisé' : 'Template Not Customized'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'fr'
                ? 'Vous n\'avez pas encore personnalisé ce modèle. Veuillez modifier le contenu avant de continuer ou retourner à la sélection de modèle.'
                : 'You haven\'t customized this template yet. Please modify the content before continuing or go back to template selection.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleGoBackToTemplates}
              className="flex-1 sm:flex-none"
            >
              {locale === 'fr' ? 'Retour' : 'Go Back'}
            </Button>
            <Button
              onClick={() => setShowTemplateWarningDialog(false)}
              className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-800"
            >
              {locale === 'fr' ? 'Modifier' : 'Modify'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Block Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'fr' ? 'Supprimer ce bloc ?' : 'Delete this block?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'fr'
                ? 'Cette action est irréversible. Le bloc et son contenu seront supprimés.'
                : 'This action cannot be undone. The block and its content will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 sm:flex-none">
              {locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={confirmDeleteBlock} className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white">
              {locale === 'fr' ? 'Supprimer' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function CreatePsychoeducationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <CreatePsychoeducationContent />
    </Suspense>
  )
}

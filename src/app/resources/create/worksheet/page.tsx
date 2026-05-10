'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
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
  Laugh,
  Meh,
  Frown,
  Angry,
  Calendar,
  Clock,
  Minus,
  Quote,
  Info,
  // Scoring/Assessment icons
  SlidersHorizontal,
  Calculator,
  Star,
  Gauge,
  // Auto-save icons
  Cloud,
  CloudOff,
  // Mode toggle
  BookOpen,
  PenLine,
  Scissors,
  Table2,
  Link as LinkIcon,
  MoveVertical,
  Heading1,
  Heading2,
  Heading3,
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
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useLanguage, lt } from '@/lib/i18n/context'
import { createResource, getResourceById, updateResource } from '@/lib/services/resources'
import { uploadResourceFile, validateFile } from '@/lib/services/resource-storage'
import { supabase } from '@/lib/supabase/client'
import { createClient } from '@/lib/supabase/browser-client'
import type { ResourceBlock, WorksheetSettings, ScoringRange, WorksheetQuestion, WorksheetQuestionType } from '@/types/resource'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ResourceCategory } from '@/types/library'
import { toast } from 'sonner'
import DescriptionEditor from '@/components/resources/DescriptionEditor'
import { ResourcePreview } from '@/components/resources/preview/ResourcePreview'

// Hide the visibility picker (Private / Public / Share-via-external-link)
// in the publish flow until the Digital Library + public-link sharing
// features ship. The underlying state, save logic, and shared-resource
// rendering all stay wired — every new resource just defaults to
// `visibility: 'private'` (set in the createResource call) which is the
// correct behaviour for the assign-to-members workflow we have today.
// Flip to true to expose the picker again.
const SHOW_VISIBILITY_PICKER = false

// Block types for worksheet
// Content blocks: heading, paragraph, image, divider, quote, tip (practitioner adds content)
// Response blocks: prompt, checklist, scale, multiple_choice, yes_no, mood, date, time, slider, video_response, audio_response, file_response (member responds)
// Scoring question types: likert, numeric, matrix_rating (for scored worksheets)
// Legacy: video, file (kept for backward compatibility)
type BlockType =
  | 'heading' | 'paragraph' | 'image' | 'divider' | 'quote' | 'tip' | 'spacer'
  | 'prompt' | 'checklist' | 'scale' | 'multiple_choice' | 'yes_no' | 'mood' | 'date_picker' | 'time_input' | 'list_input'
  | 'likert' | 'numeric' | 'slider' | 'matrix_rating'
  | 'video_response' | 'audio_response' | 'file_response'
  | 'pdf_document' | 'matching_pairs' | 'flashcard' | 'fill_blank' | 'ordering'
  | 'table_exercise' | 'breathing' | 'visualization' | 'body_scan' | 'timed_action'
  | 'key_points' | 'callout' | 'audio' | 'link'
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
  // For link blocks
  linkUrl?: string
  // For response blocks (video_response, audio_response, file_response)
  responseRequired?: boolean
  responseMaxDuration?: number // in seconds for video/audio
  responseAcceptedTypes?: string[] // for file_response
  responseHint?: string // helper text for member
  // For multiple choice
  choices?: string[]
  allowMultiple?: boolean
  // For mood selector
  moodOptions?: { emoji: string; label: string; value?: number }[]
  // For slider
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  sliderMinLabel?: string
  sliderMaxLabel?: string
  // For quote/tip styling
  style?: 'default' | 'success' | 'warning' | 'info'
  quoteAuthor?: string
  // For list input
  listMinItems?: number
  listMaxItems?: number
  listItemPlaceholder?: string
  // For likert scale
  scaleLabels?: string[]
  scaleRange?: number
  scaleType?: 'likert' | 'rating' | 'mood' // Scale variant type
  // For numeric input
  minValue?: number
  maxValue?: number
  // For scoring (when enableScoring is true)
  scoring?: { [key: string]: number }
  required?: boolean
  // For matrix rating (rate multiple items on a scale)
  matrixItems?: string[] // Items to rate (e.g., "Mother", "Father", "Sister")
  matrixScaleMax?: number // Maximum rating value (e.g., 5 or 10)
  matrixScaleLabels?: { min: string; max: string } // Labels for min/max (e.g., "Not at all", "Completely")
  // For key_points (bullet list)
  points?: string[]
  // For heading level (h1 | h2 | h3) — defaults to h2 if absent
  headingLevel?: 'h1' | 'h2' | 'h3'
  // For spacer block — vertical whitespace
  spacerSize?: 'sm' | 'md' | 'lg'
}

interface BlockTypeOption {
  type: BlockType
  icon: React.ElementType
  label: Record<string, string>
  description: Record<string, string>
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
    type: 'spacer',
    icon: MoveVertical,
    label: { en: 'Spacer', fr: 'Espace' },
    description: { en: 'Add vertical space between blocks', fr: 'Ajouter un espace vertical entre les blocs' },
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
    label: { en: 'Tip Box', fr: 'Encadré explicatif' },
    description: { en: 'Important tips or notes', fr: 'Conseils ou notes importantes' },
  },
  {
    type: 'key_points',
    icon: List,
    label: { en: 'Bullet List', fr: 'Liste à puces' },
    description: { en: 'A short bulleted list of key points', fr: 'Une courte liste de points clés' },
  },
  {
    type: 'video',
    icon: Video,
    label: { en: 'Video', fr: 'Vidéo' },
    description: { en: 'YouTube, Vimeo or video link', fr: 'Lien YouTube, Vimeo ou vidéo' },
  },
  {
    type: 'link',
    icon: ExternalLink,
    label: { en: 'Link', fr: 'Lien' },
    description: { en: 'External link or article', fr: 'Lien externe ou article' },
  },
  // === RESPONSE BLOCKS (Member provides answers) ===
  {
    type: 'prompt',
    icon: HelpCircle,
    label: { en: 'Long Text', fr: 'Texte' },
    description: { en: 'Paragraph or long text response', fr: 'Réponse en paragraphe ou texte long' },
  },
  {
    type: 'multiple_choice',
    icon: CircleDot,
    label: { en: 'Multiple Choice', fr: 'Choix multiple' },
    description: { en: 'Member picks an answer from options (e.g. "Which symptoms did you notice?")', fr: 'Le membre choisit une réponse parmi des options (ex : « Quels symptômes avez-vous remarqués ? »)' },
  },
  {
    type: 'yes_no',
    icon: ToggleLeft,
    label: { en: 'Yes/No Question', fr: 'Question fermée' },
    description: { en: 'Simple yes or no answer', fr: 'Réponse simple oui ou non' },
  },
  {
    type: 'checklist',
    icon: CheckSquare,
    label: { en: 'Action Checklist', fr: 'Liste d\'actions' },
    description: { en: 'Tasks for the member to tick off (e.g. daily self-care, between-session homework)', fr: 'Tâches que le membre coche au fur et à mesure (ex : auto-soin quotidien, devoirs entre séances)' },
  },
  {
    type: 'scale',
    icon: Star,
    label: { en: 'Rating Scale', fr: 'Échelle' },
    description: { en: 'Numeric scale (e.g., 1-10)', fr: 'Échelle numérique (ex: 1-10)' },
  },
  {
    type: 'likert',
    icon: SlidersHorizontal,
    label: { en: 'Scale Question', fr: 'Échelle de réponse' },
    description: { en: 'Likert, rating, or mood scale', fr: 'Échelle Likert, notation ou humeur' },
  },
  {
    type: 'numeric',
    icon: Calculator,
    label: { en: 'Numeric Input', fr: 'Entrée numérique' },
    description: { en: 'Enter a number within a range', fr: 'Entrer un nombre dans une plage' },
  },
  {
    type: 'slider',
    icon: Gauge,
    label: { en: 'Slider', fr: 'Curseur' },
    description: { en: 'Slide to select a value', fr: 'Glisser pour sélectionner une valeur' },
  },
  {
    type: 'matrix_rating',
    icon: List,
    label: { en: 'Matrix Rating', fr: 'Grille d\'évaluation' },
    description: { en: 'Rate multiple items on a scale', fr: 'Noter plusieurs éléments sur une échelle' },
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
  {
    type: 'list_input',
    icon: List,
    label: { en: 'List Input', fr: 'Liste à remplir' },
    description: { en: 'Member adds items to a list', fr: 'Le membre ajoute des éléments à une liste' },
  },
  // === MEDIA RESPONSE BLOCKS ===
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
  {
    type: 'video_response',
    icon: VideoIcon,
    label: { en: 'Video Response', fr: 'Réponse vidéo' },
    description: { en: 'Ask member to record/upload a video', fr: 'Demander au membre d\'enregistrer/télécharger une vidéo' },
  },
  // === TABLE EXERCISE ===
  {
    type: 'table_exercise',
    icon: Table2,
    label: { en: 'Table Exercise', fr: 'Exercice tableau' },
    description: { en: 'Interactive table with headers and fillable rows', fr: 'Tableau interactif avec en-têtes et lignes à remplir' },
  },
]

const allCategories: ResourceCategory[] = [
  'emotions', 'thoughts_beliefs', 'self_compassion', 'acceptance',
  'mindfulness', 'self_identity', 'stress_anxiety', 'depression',
  'sleep', 'mental_health_conditions', 'trauma_violence', 'grief',
  'relationships', 'family_couple', 'communication', 'sexuality',
  'body_food', 'addictions', 'habits_actions', 'discrimination',
  'life_transitions', 'work_finances'
]

// Default Likert scales for scored worksheets
const likertPresets: Record<string, Record<string, string[]>> = {
  agreement: {
    en: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    fr: ['Fortement en désaccord', 'En désaccord', 'Neutre', 'D\'accord', 'Fortement d\'accord'],
  },
  frequency: {
    en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    fr: ['Jamais', 'Rarement', 'Parfois', 'Souvent', 'Toujours'],
  },
  severity: {
    en: ['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'],
    fr: ['Pas du tout', 'Légèrement', 'Modérément', 'Très', 'Extrêmement'],
  },
}

// Mood icon mapping
const moodIcons: Record<string, React.ElementType> = {
  'Angry': Angry,
  'Frown': Frown,
  'Meh': Meh,
  'Smile': Smile,
  'Laugh': Laugh,
}

// Mood icon colors
const moodColors: Record<string, string> = {
  'Angry': 'text-red-500',
  'Frown': 'text-orange-500',
  'Meh': 'text-amber-500',
  'Smile': 'text-teal-500',
  'Laugh': 'text-emerald-500',
}

// Default mood options with scoring values (using icon names)
const defaultScoredMoodOptions = [
  { emoji: 'Angry', label: 'Struggling', value: 1 },
  { emoji: 'Frown', label: 'Low', value: 2 },
  { emoji: 'Meh', label: 'Okay', value: 3 },
  { emoji: 'Smile', label: 'Good', value: 4 },
  { emoji: 'Laugh', label: 'Thriving', value: 5 },
]

// Worksheet templates for quick start
const worksheetTemplates = [
  {
    id: 'gratitude',
    name: { en: 'Gratitude Journal', fr: 'Journal de gratitude' },
    description: { en: 'Daily gratitude reflection practice', fr: 'Pratique quotidienne de réflexion de gratitude' },
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: 'Gratitude Journal' },
      { id: '2', type: 'paragraph' as BlockType, content: 'Taking time to notice and appreciate the good in your life can boost happiness, reduce stress, and improve overall well-being. Use this journal to cultivate a grateful mindset.' },
      { id: '3', type: 'divider' as BlockType, content: '' },
      { id: '4', type: 'prompt' as BlockType, content: '🌅 Morning Intention: What are you looking forward to today?', placeholder: 'Set a positive intention for your day...', lines: 2 },
      { id: '5', type: 'prompt' as BlockType, content: '🙏 Three things I\'m grateful for:', placeholder: '1. \n2. \n3. ', lines: 4 },
      { id: '6', type: 'prompt' as BlockType, content: '✨ A small moment of joy today:', placeholder: 'Describe a simple pleasure or happy moment...', lines: 3 },
      { id: '7', type: 'prompt' as BlockType, content: '💪 Something I did well or a personal strength I used:', placeholder: 'Acknowledge your accomplishments, big or small...', lines: 3 },
      { id: '8', type: 'prompt' as BlockType, content: '❤️ Someone who made a positive impact on my day:', placeholder: 'Who helped, supported, or inspired you? How?', lines: 3 },
      { id: '9', type: 'prompt' as BlockType, content: '🌱 One thing I learned or a way I grew today:', placeholder: 'Reflect on any insights or personal growth...', lines: 3 },
      { id: '10', type: 'divider' as BlockType, content: '' },
      { id: '11', type: 'scale' as BlockType, content: 'How grateful do I feel right now?', scaleMin: 1, scaleMax: 10, scaleMinLabel: 'Not at all', scaleMaxLabel: 'Very grateful' },
      { id: '12', type: 'prompt' as BlockType, content: '🌙 Evening reflection: What made today meaningful?', placeholder: 'End your day by reflecting on what truly mattered...', lines: 3 },
    ],
  },
  {
    id: 'blank',
    name: { en: 'Blank Worksheet', fr: 'Fiche vierge' },
    description: { en: 'Start from scratch', fr: 'Créez sans modèle' },
    blocks: [],
  },
]

// Sortable Block Item Component - defined outside main component to prevent re-creation
interface SortableBlockItemProps {
  block: WorksheetBlock
  children: (dragControls: ReturnType<typeof useDragControls>) => React.ReactNode
}

function SortableBlockItem({ block, children }: SortableBlockItemProps) {
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

function CreateWorksheetContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const templateParam = searchParams.get('template')

  // User state for file uploads
  const [userId, setUserId] = useState<string | null>(null)

  // Step state - start at 'build' if editing or template param provided, otherwise 'template'
  const [step, setStep] = useState<'template' | 'build' | 'details'>(editId || templateParam ? 'build' : 'template')
  // Sub-steps for the details wizard: 1=Details, 2=Scoring, 3=Publish
  const [detailsStep, setDetailsStep] = useState<1 | 2 | 3>(1)

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(!!editId)
  const [isLoading, setIsLoading] = useState(!!editId)

  // Worksheet state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [blocks, setBlocks] = useState<WorksheetBlock[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'link_only' | 'public' | 'onboarding'>('private')
  const [resourceLanguage, setResourceLanguage] = useState<string>('en')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')
  const [isRecurring, setIsRecurring] = useState(false)

  // PDF import state
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [showPdfSetup, setShowPdfSetup] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfDetectedLang, setPdfDetectedLang] = useState<string>('fr')
  const [pdfLang, setPdfLang] = useState<string>('fr')
  const [pdfLength, setPdfLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [pdfPrompt, setPdfPrompt] = useState('')
  const pdfInputRef = useRef<HTMLInputElement>(null)

  // PDF split state
  const [showPdfSplit, setShowPdfSplit] = useState(false)
  const [splitBlockId, setSplitBlockId] = useState<string | null>(null)
  const [splitRanges, setSplitRanges] = useState<{ from: number; to: number }[]>([{ from: 1, to: 1 }])
  const [isSplitting, setIsSplitting] = useState(false)
  const [splitTotalPages, setSplitTotalPages] = useState(1)
  const [splitThumbnails, setSplitThumbnails] = useState<string[]>([])
  const [splitThumbsLoading, setSplitThumbsLoading] = useState(false)
  const splitThumbsRef = useRef<HTMLDivElement>(null)

  // Detect language from PDF text
  const detectLanguage = (text: string): string => {
    const frWords = ['le', 'la', 'les', 'des', 'une', 'est', 'dans', 'pour', 'qui', 'que', 'pas', 'sur', 'avec', 'son', 'ses', 'par', 'vous', 'nous', 'ce', 'cette']
    const enWords = ['the', 'is', 'are', 'with', 'for', 'and', 'that', 'this', 'have', 'from', 'was', 'were', 'been', 'your', 'they', 'will', 'can', 'not', 'but', 'what']
    const lower = text.toLowerCase()
    const frCount = frWords.filter(w => lower.includes(` ${w} `)).length
    const enCount = enWords.filter(w => lower.includes(` ${w} `)).length
    return frCount > enCount ? 'fr' : enCount > frCount ? 'en' : 'fr'
  }

  const handlePdfFileSelect = async (file: File) => {
    if (!file || !file.type.includes('pdf')) {
      toast.error(locale === 'fr' ? 'Veuillez sélectionner un fichier PDF' : 'Please select a PDF file')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error(locale === 'fr' ? 'Le fichier est trop volumineux (max 20 Mo)' : 'File is too large (max 20MB)')
      return
    }

    setPdfFile(file)
    setPdfLang('fr')
    setShowPdfSetup(true)

    // Detect language from first page text
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      const textContent = await page.getTextContent()
      const text = textContent.items.map((item: any) => item.str).join(' ')
      const detected = detectLanguage(text)
      setPdfDetectedLang(detected)
      setPdfLang(detected)
    } catch {
      // Detection failed — keep default
    }
  }

  const handlePdfImport = async () => {
    const file = pdfFile
    if (!file) return
    setShowPdfSetup(false)
    setIsImportingPdf(true)

    try {
      // Convert PDF pages to images using canvas (via pdf.js)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = Math.min(pdf.numPages, 40)
      const pageImages: string[] = []

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.0 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise
        const base64 = canvas.toDataURL('image/png').replace('data:image/png;base64,', '')
        pageImages.push(base64)
      }

      // Send to conversion API
      const res = await fetch('/api/resources/convert-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: pageImages,
          language: pdfLang,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Conversion failed')
      }

      const data = await res.json()

      // Upload the full original PDF to storage
      let originalPdfUrl = ''
      const { createClient: createBrowserClient } = await import('@/lib/supabase/browser-client')
      const sb = createBrowserClient()
      const { data: { user: authUser } } = await sb.auth.getUser()
      const sanitizedName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-')
      const timestamp = Date.now()

      if (authUser) {
        try {
          const path = `${authUser.id}/pdf-imports/${timestamp}-original-${sanitizedName}`
          const { error: uploadErr } = await sb.storage.from('resource-media').upload(path, file)
          if (!uploadErr) {
            // Bucket is private — getPublicUrl 400s. Mint a 1-year signed URL.
            const { data: signed } = await sb.storage.from('resource-media').createSignedUrl(path, 60 * 60 * 24 * 365)
            originalPdfUrl = signed?.signedUrl || ''
          }
        } catch (uploadErr) {
          console.warn('[pdf-import] Could not upload PDF to storage:', uploadErr)
        }
      }

      // Populate title/description
      if (data.title && !title) setTitle(data.title)
      if (data.description && !description) setDescription(data.description)

      // Helper: convert API blocks to worksheet blocks
      const toWorksheetBlocks = (apiBlocks: any[]): WorksheetBlock[] =>
        apiBlocks.map((b: any) => ({
          id: b.id || `imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: b.type,
          content: b.content || '',
          options: b.options,
          pairs: b.pairs,
          cards: b.cards,
          sentence: b.sentence,
          blanks: b.blanks,
          items: b.items,
          correctOrder: b.correctOrder,
          required: b.required,
          min: b.min,
          max: b.max,
          author: b.author,
          columns: b.columns,
          exampleRow: b.exampleRow,
        }))

      // Helper: split PDF pages and upload a chunk
      const splitAndUploadChunk = async (pageNums: number[]): Promise<string> => {
        if (!authUser || !originalPdfUrl) return originalPdfUrl
        try {
          const { PDFDocument } = await import('pdf-lib')
          const arrayBufferCopy = await file.arrayBuffer()
          const sourcePdf = await PDFDocument.load(arrayBufferCopy)
          const newPdf = await PDFDocument.create()
          const copiedPages = await newPdf.copyPages(sourcePdf, pageNums.map(p => p - 1))
          copiedPages.forEach(page => newPdf.addPage(page))
          const pdfBytes = await newPdf.save()
          const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })

          const rangeSuffix = pageNums.length === 1 ? `p${pageNums[0]}` : `p${pageNums[0]}-${pageNums[pageNums.length - 1]}`
          const path = `${authUser.id}/pdf-imports/${timestamp}-${rangeSuffix}-${sanitizedName}`
          const { error: uploadErr } = await sb.storage.from('resource-media').upload(path, blob)
          if (uploadErr) return originalPdfUrl
          // Bucket is private — sign instead of getPublicUrl().
          const { data: signed } = await sb.storage.from('resource-media').createSignedUrl(path, 60 * 60 * 24 * 365)
          return signed?.signedUrl || originalPdfUrl
        } catch {
          return originalPdfUrl
        }
      }

      const sections = data.sections || []
      const hasQuestions = sections.some((s: any) => s.type === 'questions' && s.blocks?.length > 0)

      if (!hasQuestions) {
        // No questions — add full PDF as reading material
        if (originalPdfUrl) {
          setBlocks(prev => [...prev, {
            id: `pdf-${timestamp}-full`,
            type: 'pdf_document' as any,
            content: locale === 'fr' ? 'Document complet' : 'Full document',
            mediaFile: originalPdfUrl,
            originalPdfUrl,
            fileName: file.name,
          } as any])
          // resourceMode is derived from blocks now; no setter needed.
        }
        toast.info(
          locale === 'fr'
            ? 'Aucune question trouvée — PDF ajouté en tant que document de lecture'
            : 'No fillable questions found — PDF added as a reading document'
        )
      } else {
        // Auto-split: reading chunks include up to the question page,
        // then questions, then next reading chunk starts after
        const interleavedBlocks: WorksheetBlock[] = []
        let totalQuestions = 0

        // Build page ranges: reading sections include their pages,
        // question sections include their startPage in the PRECEDING reading chunk
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i]

          if (section.type === 'reading' && section.pages?.length > 0 && originalPdfUrl) {
            // Check if next section is questions — if so, include that startPage in this reading chunk
            const nextSection = sections[i + 1]
            let pageNums = [...section.pages] as number[]
            if (nextSection?.type === 'questions' && nextSection.startPage) {
              const qPage = nextSection.startPage as number
              if (!pageNums.includes(qPage)) {
                pageNums.push(qPage)
              }
            }
            pageNums.sort((a, b) => a - b)

            const label = pageNums.length === 1
              ? `Page ${pageNums[0]}`
              : `Pages ${pageNums[0]}–${pageNums[pageNums.length - 1]}`

            const chunkUrl = await splitAndUploadChunk(pageNums)
            interleavedBlocks.push({
              id: `pdf-${timestamp}-${pageNums[0]}`,
              type: 'pdf_document' as any,
              content: label,
              mediaFile: chunkUrl,
              originalPdfUrl,
              fileName: file.name,
              pageRange: pageNums,
            } as any)
          } else if (section.type === 'questions' && section.blocks?.length > 0) {
            // If no preceding reading section, create a chunk up to this page
            const prevSection = sections[i - 1]
            if ((!prevSection || prevSection.type !== 'reading') && section.startPage && originalPdfUrl) {
              const qPage = section.startPage as number
              const chunkUrl = await splitAndUploadChunk([qPage])
              interleavedBlocks.push({
                id: `pdf-${timestamp}-q${qPage}`,
                type: 'pdf_document' as any,
                content: `Page ${qPage}`,
                mediaFile: chunkUrl,
                originalPdfUrl,
                fileName: file.name,
                pageRange: [qPage],
              } as any)
            }

            const questionBlocks = toWorksheetBlocks(section.blocks)
            totalQuestions += questionBlocks.length
            interleavedBlocks.push(...questionBlocks)
          }
        }

        // Add full original PDF at the end as reference
        if (originalPdfUrl) {
          interleavedBlocks.push({
            id: `pdf-${timestamp}-complete`,
            type: 'pdf_document' as any,
            content: locale === 'fr' ? 'Document complet' : 'Full document',
            mediaFile: originalPdfUrl,
            originalPdfUrl,
            fileName: file.name,
          } as any)
        }

        setBlocks(prev => [...prev, ...interleavedBlocks])
        // resourceMode is derived from blocks; no setter needed.
        toast.success(
          locale === 'fr'
            ? `${totalQuestions} questions extraites du PDF`
            : `${totalQuestions} questions extracted from PDF`
        )
      }
    } catch (err) {
      console.error('[pdf-import] Error:', err)
      toast.error(
        locale === 'fr'
          ? `Impossible de convertir le PDF : ${err instanceof Error ? err.message : 'erreur inconnue'}`
          : `Failed to convert PDF: ${err instanceof Error ? err.message : 'unknown error'}`
      )
    } finally {
      setIsImportingPdf(false)
      if (pdfInputRef.current) pdfInputRef.current.value = ''
    }
  }

  // Handle PDF split into sections
  const handlePdfSplit = async () => {
    if (!splitBlockId) return
    const block = blocks.find(b => b.id === splitBlockId) as any
    if (!block?.mediaFile) return

    const sourceUrl = block.originalPdfUrl || block.mediaFile
    setIsSplitting(true)
    try {
      // Fetch the PDF (always use original if available)
      const response = await fetch(sourceUrl)
      const arrayBuffer = await response.arrayBuffer()

      const { PDFDocument } = await import('pdf-lib')
      const sourcePdf = await PDFDocument.load(arrayBuffer)

      const { createClient: createBrowserClient } = await import('@/lib/supabase/browser-client')
      const sb = createBrowserClient()
      const { data: { user: authUser } } = await sb.auth.getUser()
      if (!authUser) throw new Error('Not authenticated')

      const timestamp = Date.now()
      const sanitizedName = (block.fileName || 'document.pdf').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-')

      // Create a PDF chunk for each range
      const newBlocks: WorksheetBlock[] = []
      for (let i = 0; i < splitRanges.length; i++) {
        const range = splitRanges[i]
        const pageIndices = Array.from(
          { length: range.to - range.from + 1 },
          (_, j) => range.from - 1 + j // 0-based
        )

        const newPdf = await PDFDocument.create()
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
        copiedPages.forEach(page => newPdf.addPage(page))
        const pdfBytes = await newPdf.save()
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })

        const rangeSuffix = range.from === range.to ? `p${range.from}` : `p${range.from}-${range.to}`
        const path = `${authUser.id}/pdf-imports/${timestamp}-${rangeSuffix}-${sanitizedName}`
        const { error: uploadErr } = await sb.storage.from('resource-media').upload(path, blob)
        if (uploadErr) {
          console.warn('[pdf-split] Upload failed:', uploadErr)
          continue
        }
        // Bucket is private — sign instead of getPublicUrl().
        const { data: signed } = await sb.storage.from('resource-media').createSignedUrl(path, 60 * 60 * 24 * 365)
        const signedUrl = signed?.signedUrl || ''

        const label = range.from === range.to
          ? `Page ${range.from}`
          : `Pages ${range.from}–${range.to}`

        newBlocks.push({
          id: `pdf-${timestamp}-${range.from}`,
          type: 'pdf_document' as any,
          content: label,
          mediaFile: signedUrl,
          originalPdfUrl: sourceUrl,
          fileName: block.fileName || 'document.pdf',
          pageRange: Array.from({ length: range.to - range.from + 1 }, (_, j) => range.from + j),
        } as any)
      }

      // Replace the original PDF block with the split chunks at the same position
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === splitBlockId)
        if (idx === -1) return prev
        const updated = [...prev]
        updated.splice(idx, 1, ...newBlocks)
        return updated
      })

      setShowPdfSplit(false)
      setSplitBlockId(null)
      toast.success(
        locale === 'fr'
          ? `PDF découpé en ${newBlocks.length} sections`
          : `PDF split into ${newBlocks.length} sections`
      )
    } catch (err) {
      console.error('[pdf-split] Error:', err)
      toast.error(locale === 'fr' ? 'Erreur lors du découpage' : 'Failed to split PDF')
    } finally {
      setIsSplitting(false)
    }
  }

  // Scoring state (for assessments/scored worksheets)
  const [enableScoring, setEnableScoring] = useState(false)
  const [showScoreToMember, setShowScoreToMember] = useState(true)
  const [scoringRanges, setScoringRanges] = useState<ScoringRange[]>([
    { min: 0, max: 4, label: { en: 'Minimal', fr: 'Minimal' } },
    { min: 5, max: 9, label: { en: 'Mild', fr: 'Léger' } },
    { min: 10, max: 14, label: { en: 'Moderate', fr: 'Modéré' } },
    { min: 15, max: 100, label: { en: 'Severe', fr: 'Sévère' } },
  ])
  const [selectedLikertPreset, setSelectedLikertPreset] = useState<string>('frequency')

  // UI state
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  // Reading vs Interactive is no longer a user-toggled mode — it's
  // derived from the blocks themselves. Adding any interactive block
  // (prompt, multiple_choice, etc.) flips the resource into Interactive;
  // removing them all flips it back to Reading. The two pills below the
  // header are presentational only, with reciprocal tooltips that
  // explain how to move between modes.
  const INTERACTIVE_TYPES_REF = new Set(['prompt','multiple_choice','yes_no','checklist','scale','likert','mood','matching_pairs','flashcard','fill_blank','ordering','list_input','numeric','slider','matrix_rating','date_picker','time_input','file_response','audio_response','video_response','table_exercise'])
  const resourceMode: 'reading' | 'interactive' = blocks.some(b => INTERACTIVE_TYPES_REF.has(b.type)) ? 'interactive' : 'reading'

  // Reading-only block types (content that patients read, not fill)
  const READING_BLOCKS = new Set(['heading', 'paragraph', 'image', 'divider', 'quote', 'tip', 'pdf_document', 'video', 'link', 'key_points', 'spacer'])
  const isBlockAllowed = (blockType: string) => {
    if (resourceMode === 'interactive') return true
    return READING_BLOCKS.has(blockType)
  }

  // Auto-detect resource type from blocks
  const INTERACTIVE_TYPES = new Set(['prompt','multiple_choice','yes_no','checklist','scale','likert','mood','matching_pairs','flashcard','fill_blank','ordering','list_input','numeric','slider','matrix_rating','date_picker','time_input','file_response','audio_response','video_response','table_exercise'])
  const detectedResourceType = (() => {
    if (blocks.some(b => b.type === 'table_exercise')) return 'table'
    if (blocks.some(b => INTERACTIVE_TYPES.has(b.type))) return 'worksheet'
    return 'psychoeducation'
  })()
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)
  const [showMoreContentBlocks, setShowMoreContentBlocks] = useState(false)
  const [showMoreMediaBlocks, setShowMoreMediaBlocks] = useState(false)
  const [showMoreQuestionBlocks, setShowMoreQuestionBlocks] = useState(false)
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // View mode: 'edit' | 'preview' | 'test'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'test'>('edit')

  // Test mode responses (simulated member answers)
  const [testResponses, setTestResponses] = useState<Record<string, any>>({})
  const [testSubmitted, setTestSubmitted] = useState(false)

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSavingRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const justAutoSavedRef = useRef(false)

  // Template modification tracking using refs for reliable synchronous access
  const selectedTemplateIdRef = useRef<string | null>(null)
  const hasModifiedContentRef = useRef(false)
  const [showTemplateWarningDialog, setShowTemplateWarningDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const browserSupabase = createClient()
      const { data: { user } } = await browserSupabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  // Apply template from URL parameter (skip template selection step)
  useEffect(() => {
    if (templateParam && !editId) {
      const generateId = () => Math.random().toString(36).substr(2, 9)
      if (templateParam === 'blank') {
        setBlocks([])
        setTitle('')
        selectedTemplateIdRef.current = null
        hasModifiedContentRef.current = true // Blank = can proceed
      } else {
        const template = worksheetTemplates.find(t => t.id === templateParam)
        if (template && template.id !== 'blank') {
          setBlocks(template.blocks.map(b => ({ ...b, id: generateId() })))
          setTitle(lt(template.name, locale))
          selectedTemplateIdRef.current = templateParam
          hasModifiedContentRef.current = false // Using template = must modify before proceeding
        }
      }
      setSelectedTemplate(templateParam)
    }
  }, [templateParam, editId, locale])

  // Reset form when creating new resource (no editId and no templateParam)
  useEffect(() => {
    if (!editId && !templateParam) {
      // Reset all form state for new resource
      setTitle('')
      setDescription('')
      setSelectedCategory(null)
      setBlocks([])
      setTags([])
      setVisibility('private')
      setResourceLanguage('en')
      setSaveAs('draft')
      setStep('template')
      setDetailsStep(1)
      setIsEditMode(false)
      setIsLoading(false)
      setEnableScoring(false)
      setScoringRanges([])
      setAutoSaveDraftId(null)
    }
  }, [editId, templateParam])

  // Auto-trigger PDF import if import=pdf param (once only)
  const pdfImportTriggered = useRef(false)
  useEffect(() => {
    if (searchParams.get('import') === 'pdf' && pdfInputRef.current && !pdfImportTriggered.current) {
      pdfImportTriggered.current = true
      setTimeout(() => pdfInputRef.current?.click(), 300)
    }
  }, [searchParams])

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
          setResourceLanguage(resource.language || 'en')
          setSaveAs(resource.status === 'published' ? 'published' : 'draft')
          setIsRecurring(!!(resource as any).is_recurring)
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
              scaleMin: block.scaleMin ?? (block.scaleType === 'rating' || block.type === 'scale' ? 1 : undefined),
              scaleMax: block.scaleMax ?? (block.scaleType === 'rating' || block.type === 'scale' ? 10 : undefined),
              scaleMinLabel: typeof block.scaleMinLabel === 'string' ? block.scaleMinLabel : (block.scaleMinLabel as Record<string, string>)?.[locale] || '',
              scaleMaxLabel: typeof block.scaleMaxLabel === 'string' ? block.scaleMaxLabel : (block.scaleMaxLabel as Record<string, string>)?.[locale] || '',
              placeholder: block.placeholder,
              lines: block.lines,
              mediaFile: block.mediaFile,
              mediaCaption: block.mediaCaption,
              mediaAlt: block.mediaAlt,
              videoUrl: block.videoUrl,
              videoType: block.videoType,
              linkUrl: block.linkUrl,
              choices: block.choices?.map((c: any) => typeof c === 'string' ? c : (c as Record<string, string>)?.[locale] || ''),
              allowMultiple: block.allowMultiple,
              moodOptions: block.moodOptions?.map((m: any) => ({
                emoji: m.emoji,
                label: typeof m.label === 'string' ? m.label : (m.label as Record<string, string>)?.[locale] || '',
                value: m.value,
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
              // PDF document fields
              fileName: block.fileName,
              pageRange: block.pageRange,
              originalPdfUrl: block.originalPdfUrl,
              // Table exercise fields
              columns: block.columns,
              exampleRow: block.exampleRow,
              // Interactive block fields
              pairs: block.pairs,
              cards: block.cards,
              sentence: block.sentence,
              blanks: block.blanks,
              // Scoring fields
              scaleLabels: block.scaleLabels,
              scaleRange: block.scaleRange,
              scaleType: block.scaleType,
              minValue: block.minValue,
              maxValue: block.maxValue,
              scoring: block.scoring,
              required: block.required,
              // Bullet list (key_points)
              points: Array.isArray(block.points)
                ? block.points.map((p: any) => typeof p === 'string' ? p : (p as Record<string, string>)?.[locale] || '')
                : undefined,
              // Heading level + spacer size
              headingLevel: block.headingLevel,
              spacerSize: block.spacerSize,
            }))
            setBlocks(loadedBlocks)
          }

          // Load scoring settings
          const settings = resource.settings as WorksheetSettings
          if (settings) {
            if (settings.enableScoring !== undefined) {
              setEnableScoring(settings.enableScoring)
            }
            if (settings.showScoreToMember !== undefined) {
              setShowScoreToMember(settings.showScoreToMember)
            }
            if (settings.scoringRanges) {
              setScoringRanges(settings.scoringRanges)
            }
          }
        }
        // Set lastSavedAt to indicate the resource was loaded (already saved)
        setLastSavedAt(new Date())
        setHasUnsavedChanges(false)
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
        selectedTemplateIdRef.current = null
        hasModifiedContentRef.current = true // Blank = can proceed
      } else {
        setBlocks(template.blocks.map(b => ({ ...b, id: generateId() })))
        setTitle(lt(template.name, locale))
        selectedTemplateIdRef.current = templateId
        hasModifiedContentRef.current = false // Using template = must modify before proceeding
      }
      setStep('build')
    }
  }

  // Helper to mark content as modified
  const markAsModified = () => {
    if (selectedTemplateIdRef.current && !hasModifiedContentRef.current) {
      hasModifiedContentRef.current = true
    }
  }

  // Handle continue to details with template modification check
  const handleContinueToDetails = () => {
    if (selectedTemplateIdRef.current && !hasModifiedContentRef.current) {
      setShowTemplateWarningDialog(true)
      return
    }
    setDetailsStep(1)
    setStep('details')
  }

  // Handle going back. When editing an existing resource we should
  // return to its preview page, not the template chooser. Only fresh
  // (no editId) flows go back to /resources/create.
  const handleGoBackToTemplates = () => {
    setShowTemplateWarningDialog(false)
    router.push(editId ? `/resources/${editId}` : '/resources/create')
  }

  // Default mood options - nature/wellness themed
  const defaultMoodOptions = [
    { emoji: 'Angry', label: locale === 'fr' ? 'Difficile' : 'Struggling' },
    { emoji: 'Frown', label: locale === 'fr' ? 'Fragile' : 'Low' },
    { emoji: 'Meh', label: locale === 'fr' ? 'Neutre' : 'Okay' },
    { emoji: 'Smile', label: locale === 'fr' ? 'Bien' : 'Good' },
    { emoji: 'Laugh', label: locale === 'fr' ? 'Épanoui' : 'Thriving' },
  ]

  // Add new block
  const addBlock = (type: BlockType) => {
    const preset = likertPresets[selectedLikertPreset]
    const newBlock: WorksheetBlock = {
      id: generateId(),
      type,
      content: '',
      required: true,
      // Content blocks
      ...(type === 'checklist' && { items: [''] }),
      ...(type === 'scale' && { scaleMin: 1, scaleMax: 10, scaleMinLabel: '', scaleMaxLabel: '' }),
      ...(type === 'prompt' && { placeholder: '', lines: 3 }),
      ...(type === 'image' && { mediaCaption: '', mediaAlt: '' }),
      ...(type === 'video' && { videoType: 'youtube' as const, videoUrl: '' }),
      ...(type === 'file' && { mediaCaption: '' }),
      ...(type === 'quote' && { style: 'default' as const }),
      ...(type === 'tip' && { style: 'info' as const }),
      ...(type === 'key_points' && { points: [''] }),
      ...(type === 'heading' && { headingLevel: 'h2' as const }),
      ...(type === 'spacer' && { spacerSize: 'md' as const }),
      // New response blocks
      ...(type === 'multiple_choice' && {
        choices: ['', ''],
        allowMultiple: false,
        scoring: enableScoring ? { '0': 0, '1': 1 } : undefined,
      }),
      ...(type === 'yes_no' && {
        scoring: enableScoring ? { 'yes': 1, 'no': 0 } : undefined,
      }),
      ...(type === 'mood' && { moodOptions: enableScoring ? defaultScoredMoodOptions : defaultMoodOptions }),
      ...(type === 'date_picker' && { }),
      ...(type === 'time_input' && { }),
      ...(type === 'list_input' && { listMinItems: 1, listMaxItems: 10, listItemPlaceholder: '' }),
      // Scoring question types (likert, numeric, slider)
      ...(type === 'likert' && {
        // Default new Likert blocks to the 0-10 rating variant — the
        // pure-Likert option was removed from the picker, so we land
        // practitioners on one of the two remaining variants instead
        // of an invisible "default" mode they can't see selected.
        scaleType: 'rating' as const,
        scaleMin: 0,
        scaleMax: 10,
        scaleLabels: preset[locale] ?? preset['en'],
        scaleRange: (preset[locale] ?? preset['en']).length,
        scoring: (preset[locale] ?? preset['en']).reduce((acc, _, i) => ({ ...acc, [i.toString()]: i }), {}),
      }),
      ...(type === 'numeric' && {
        minValue: 0,
        maxValue: 10,
      }),
      ...(type === 'slider' && {
        sliderMin: 0,
        sliderMax: 100,
        sliderStep: 1,
        sliderUnit: '%',
      }),
      ...(type === 'matrix_rating' && {
        matrixItems: ['', ''],
        matrixScaleMax: 5,
        matrixScaleLabels: {
          min: locale === 'fr' ? 'Pas du tout' : 'Not at all',
          max: locale === 'fr' ? 'Complètement' : 'Completely',
        },
      }),
      // Media response blocks
      ...(type === 'video_response' && { responseRequired: true, responseMaxDuration: 300, responseHint: '' }),
      ...(type === 'audio_response' && { responseRequired: true, responseMaxDuration: 180, responseHint: '' }),
      ...(type === 'file_response' && { responseRequired: true, responseAcceptedTypes: [], responseHint: '' }),
      ...(type === 'table_exercise' && {
        columns: [
          { id: 'col1', header: locale === 'fr' ? 'Colonne 1' : 'Column 1' },
          { id: 'col2', header: locale === 'fr' ? 'Colonne 2' : 'Column 2' },
          { id: 'col3', header: locale === 'fr' ? 'Colonne 3' : 'Column 3' },
        ],
        exampleRow: {},
      }),
    }
    setBlocks([...blocks, newBlock])
    setExpandedBlock(newBlock.id)
    setShowBlockPicker(false)
    markAsModified()
    // The first time an interactive block is added, the derived
    // resourceMode flips Reading → Interactive on the next render — show
    // a small toast so the practitioner sees it happen rather than
    // wondering why the pill changed.
    if (resourceMode === 'reading' && INTERACTIVE_TYPES.has(type)) {
      toast.message(
        locale === 'fr'
          ? 'Mode interactif activé — ce support recueille désormais les réponses du patient.'
          : locale === 'es'
            ? 'Modo interactivo activado — este recurso ahora recopila respuestas del paciente.'
            : 'Switched to Interactive — this resource now collects patient input.'
      )
    }
  }

  // Apply likert preset to a block
  const applyLikertPreset = (blockId: string, presetKey: string) => {
    const preset = likertPresets[presetKey]
    if (preset) {
      updateBlock(blockId, {
        scaleLabels: preset[locale] ?? preset['en'],
        scaleRange: (preset[locale] ?? preset['en']).length,
        scoring: (preset[locale] ?? preset['en']).reduce((acc, _, i) => ({ ...acc, [i.toString()]: i }), {}),
      })
    }
  }

  // Calculate max possible score
  const calculateMaxScore = () => {
    return blocks.reduce((total, block) => {
      if (!enableScoring) return 0
      if (block.type === 'likert' && block.scoring) {
        return total + Math.max(...Object.values(block.scoring))
      }
      if (block.type === 'yes_no') return total + 1
      if (block.type === 'numeric') return total + (block.maxValue || 10)
      if (block.type === 'scale') return total + (block.scaleMax || 10)
      if (block.type === 'slider') return total + (block.sliderMax || 100)
      if (block.type === 'multiple_choice' && block.scoring) {
        return total + Math.max(...Object.values(block.scoring))
      }
      if (block.type === 'mood' && block.moodOptions) {
        const values = block.moodOptions.map(m => m.value || 0)
        return total + Math.max(...values)
      }
      if (block.type === 'matrix_rating') {
        // Each item can score up to matrixScaleMax
        const itemCount = block.matrixItems?.length || 0
        const maxPerItem = block.matrixScaleMax || 5
        return total + (itemCount * maxPerItem)
      }
      return total
    }, 0)
  }

  // Calculate test score
  const calculateTestScore = () => {
    if (!enableScoring) return 0
    let score = 0
    blocks.forEach(block => {
      const response = testResponses[block.id]
      if (response !== undefined) {
        if ((block.type === 'likert' || block.type === 'multiple_choice') && block.scoring) {
          score += block.scoring[response.toString()] || 0
        } else if (block.type === 'yes_no') {
          if (block.scoring) {
            score += block.scoring[response] || 0
          } else {
            score += response === 'yes' ? 1 : 0
          }
        } else if (block.type === 'numeric' || block.type === 'scale' || block.type === 'slider') {
          const numValue = typeof response === 'number' ? response : parseInt(response)
          score += numValue || 0
        } else if (block.type === 'mood') {
          score += response || 0
        } else if (block.type === 'matrix_rating' && typeof response === 'object') {
          // Sum all item ratings
          const ratings = response as Record<string, number>
          score += Object.values(ratings).reduce((sum, val) => sum + (val || 0), 0)
        }
      }
    })
    return score
  }

  // Get score interpretation
  const getScoreInterpretation = (score: number) => {
    for (const range of scoringRanges) {
      if (score >= range.min && score <= range.max) {
        return lt(range.label, locale)
      }
    }
    return ''
  }

  // Get scorable blocks count
  const getScorableBlocksCount = () => {
    return blocks.filter(b =>
      ['likert', 'numeric', 'scale', 'slider', 'multiple_choice', 'yes_no', 'mood', 'matrix_rating'].includes(b.type)
    ).length
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

  // Duplicate block
  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id)
    if (block) {
      const newBlockId = generateId()
      const newBlock = { ...block, id: newBlockId }
      const index = blocks.findIndex(b => b.id === id)
      const newBlocks = [...blocks]
      markAsModified()
      newBlocks.splice(index + 1, 0, newBlock)
      setBlocks(newBlocks)

      // Expand the duplicated block and scroll to it
      setExpandedBlock(newBlockId)
      setTimeout(() => {
        const element = document.getElementById(`block-${newBlockId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
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

        if (block.type === 'link') {
          return { ...baseBlock, type: 'link' as const, linkUrl: (block as any).linkUrl }
        }

        if (block.type === 'table_exercise') {
          return { ...baseBlock, type: 'table_exercise' as const, columns: (block as any).columns, exampleRow: (block as any).exampleRow }
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

        if (block.type === 'multiple_choice') {
          return {
            ...baseBlock,
            type: 'multiple_choice' as const,
            choices: block.choices || [],
            allowMultiple: block.allowMultiple,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'yes_no') {
          return {
            ...baseBlock,
            type: 'yes_no' as const,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'likert') {
          return {
            ...baseBlock,
            type: 'likert' as const,
            scaleLabels: block.scaleLabels,
            scaleRange: block.scaleType === 'rating' ? (block.scaleMax ?? block.scaleRange ?? 5) : (block.scaleRange || 5),
            scaleType: block.scaleType,
            scaleMin: block.scaleMin,
            scaleMax: block.scaleMax,
            likertScale: block.scaleRange || 5,
            likertLabels: block.scaleLabels ? { start: block.scaleLabels[0], end: block.scaleLabels[block.scaleLabels.length - 1] } : undefined,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'mood') {
          return {
            ...baseBlock,
            type: 'mood' as const,
            moodOptions: block.moodOptions,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'slider') {
          return {
            ...baseBlock,
            type: 'slider' as const,
            sliderMin: block.sliderMin ?? 0,
            sliderMax: block.sliderMax ?? 100,
            sliderStep: block.sliderStep ?? 1,
            sliderUnit: block.sliderUnit,
            sliderMinLabel: block.sliderMinLabel,
            sliderMaxLabel: block.sliderMaxLabel,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'numeric') {
          return {
            ...baseBlock,
            type: 'numeric' as const,
            numericMin: block.minValue,
            numericMax: block.maxValue,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'matrix_rating') {
          return {
            ...baseBlock,
            type: 'matrix_rating' as const,
            matrixItems: block.matrixItems || [],
            matrixScaleMax: block.matrixScaleMax ?? 5,
            matrixScaleLabels: block.matrixScaleLabels,
            required: block.required,
            scoring: block.scoring,
          }
        }

        if (block.type === 'list_input') {
          return {
            ...baseBlock,
            type: 'list_input' as const,
            listMinItems: block.listMinItems,
            listMaxItems: block.listMaxItems,
            listItemPlaceholder: block.listItemPlaceholder,
            required: block.required,
          }
        }

        if (block.type === 'date_picker') {
          return {
            ...baseBlock,
            type: 'date_picker' as const,
            required: block.required,
          }
        }

        if (block.type === 'time_input') {
          return {
            ...baseBlock,
            type: 'time_input' as const,
            required: block.required,
          }
        }

        // PDF document
        if (block.type === 'pdf_document') {
          return { ...baseBlock, mediaFile: (block as any).mediaFile, fileName: (block as any).fileName, pageRange: (block as any).pageRange, originalPdfUrl: (block as any).originalPdfUrl } as ResourceBlock
        }

        // Interactive blocks — preserve all custom properties
        if (block.type === 'matching_pairs') {
          return { ...baseBlock, pairs: (block as any).pairs, required: block.required } as ResourceBlock
        }
        if (block.type === 'flashcard') {
          return { ...baseBlock, cards: (block as any).cards } as ResourceBlock
        }
        if (block.type === 'fill_blank') {
          return { ...baseBlock, sentence: (block as any).sentence, blanks: (block as any).blanks, required: block.required } as ResourceBlock
        }
        if (block.type === 'ordering') {
          return { ...baseBlock, items: (block as any).items, correctOrder: (block as any).correctOrder, required: block.required } as ResourceBlock
        }

        if (block.type === 'key_points') {
          return { ...baseBlock, type: 'key_points' as const, points: block.points ?? [] } as ResourceBlock
        }

        if (block.type === 'heading') {
          return { ...baseBlock, type: 'heading' as const, headingLevel: block.headingLevel ?? 'h2' } as ResourceBlock
        }

        if (block.type === 'spacer') {
          return { ...baseBlock, type: 'spacer' as const, spacerSize: block.spacerSize ?? 'md' } as ResourceBlock
        }

        // Default: paragraph, quote, tip, divider
        return baseBlock as ResourceBlock
      })

      // Build settings with scoring if enabled
      const settings: WorksheetSettings = {
        enableScoring,
        showScoreToMember: enableScoring ? showScoreToMember : undefined,
        scoringRanges: enableScoring ? scoringRanges : undefined,
        maxScore: enableScoring ? calculateMaxScore() : undefined,
      }

      // If scoring is enabled, also store questions data for assessment-style worksheets
      if (enableScoring) {
        settings.questions = blocks
          .filter(b => ['likert', 'numeric', 'scale', 'slider', 'multiple_choice', 'yes_no', 'mood', 'checklist'].includes(b.type))
          .map(block => ({
            id: block.id,
            type: block.type as WorksheetQuestionType,
            question: block.content,
            required: block.required ?? true,
            options: block.choices,
            scaleLabels: block.scaleLabels,
            scaleRange: block.scaleRange,
            scaleMin: block.scaleMin,
            scaleMax: block.scaleMax,
            scaleMinLabel: block.scaleMinLabel,
            scaleMaxLabel: block.scaleMaxLabel,
            items: block.items,
            moodOptions: block.moodOptions?.map(m => ({ emoji: m.emoji, label: m.label, value: m.value || 0 })),
            sliderMin: block.sliderMin,
            sliderMax: block.sliderMax,
            sliderStep: block.sliderStep,
            sliderUnit: block.sliderUnit,
            minValue: block.minValue,
            maxValue: block.maxValue,
            scoring: block.scoring,
          }))
      }

      // Check if we have an existing resource to update (either from edit mode or auto-saved draft)
      const existingResourceId = editId || autoSaveDraftId

      if (existingResourceId) {
        // Update existing resource (either editing or updating auto-saved draft).
        // We include `type` here so a resource that was originally saved as
        // psychoeducation but now contains interactive blocks gets promoted
        // to worksheet on the next save (and vice versa).
        await updateResource(existingResourceId, {
          type: detectedResourceType as any,
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
          language: resourceLanguage as any,
          is_recurring: isRecurring,
        })
        toast.success(locale === 'fr' ? 'Exercice mis à jour avec succès!' : 'Worksheet updated successfully!')
      } else {
        // Create new resource
        await createResource({
          type: detectedResourceType as any,
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          status: saveAs,
          visibility,
          language: resourceLanguage as any,
          is_recurring: isRecurring,
        })
        toast.success(locale === 'fr' ? 'Exercice créé avec succès!' : 'Worksheet created successfully!')
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

  // State to track auto-created draft ID for new worksheets
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<string | null>(null)

  // Auto-save function (saves as draft without redirecting)
  const performAutoSave = useCallback(async () => {
    // Don't auto-save if already saving or no content
    if (isAutoSavingRef.current || isSaving) return
    if (!title || blocks.length === 0) return

    // Get the ID to save to (either editId for existing, or autoSaveDraftId for auto-created draft)
    const saveToId = editId || autoSaveDraftId

    isAutoSavingRef.current = true
    setAutoSaveStatus('saving')

    try {
      // Convert local blocks to ResourceBlock format (same as handleSave)
      const resourceBlocks: ResourceBlock[] = blocks.map(block => {
        const baseBlock = {
          id: block.id,
          type: block.type,
          content: block.content,
        }

        if (block.type === 'prompt') {
          return { ...baseBlock, type: 'prompt' as const, placeholder: block.placeholder, lines: block.lines }
        }
        if (block.type === 'checklist') {
          return { ...baseBlock, type: 'checklist' as const, items: block.items || [] }
        }
        if (block.type === 'scale') {
          return { ...baseBlock, type: 'scale' as const, scaleMin: block.scaleMin || 1, scaleMax: block.scaleMax || 10, scaleMinLabel: block.scaleMinLabel, scaleMaxLabel: block.scaleMaxLabel }
        }
        if (block.type === 'image') {
          return { ...baseBlock, type: 'image' as const, mediaFile: block.mediaFile ? { id: block.mediaFile.id, name: block.mediaFile.name, size: block.mediaFile.size, type: block.mediaFile.type, url: block.mediaFile.url || '' } : undefined, mediaCaption: block.mediaCaption, mediaAlt: block.mediaAlt }
        }
        if (block.type === 'video') {
          return { ...baseBlock, type: 'video' as const, mediaFile: block.mediaFile ? { id: block.mediaFile.id, name: block.mediaFile.name, size: block.mediaFile.size, type: block.mediaFile.type, url: block.mediaFile.url || '' } : undefined, videoUrl: block.videoUrl, videoType: block.videoType }
        }
        if (block.type === 'file') {
          return { ...baseBlock, type: 'file' as const, mediaFile: block.mediaFile ? { id: block.mediaFile.id, name: block.mediaFile.name, size: block.mediaFile.size, type: block.mediaFile.type, url: block.mediaFile.url || '' } : undefined, mediaCaption: block.mediaCaption }
        }
        if (block.type === 'multiple_choice') {
          return { ...baseBlock, type: 'multiple_choice' as const, choices: block.choices || [], allowMultiple: block.allowMultiple, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'yes_no') {
          return { ...baseBlock, type: 'yes_no' as const, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'likert') {
          return { ...baseBlock, type: 'likert' as const, scaleLabels: block.scaleLabels, scaleRange: block.scaleType === 'rating' ? (block.scaleMax ?? block.scaleRange ?? 5) : (block.scaleRange || 5), scaleType: block.scaleType, scaleMin: block.scaleMin, scaleMax: block.scaleMax, likertScale: block.scaleRange || 5, likertLabels: block.scaleLabels ? { start: block.scaleLabels[0], end: block.scaleLabels[block.scaleLabels.length - 1] } : undefined, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'mood') {
          return { ...baseBlock, type: 'mood' as const, moodOptions: block.moodOptions, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'slider') {
          return { ...baseBlock, type: 'slider' as const, sliderMin: block.sliderMin ?? 0, sliderMax: block.sliderMax ?? 100, sliderStep: block.sliderStep ?? 1, sliderUnit: block.sliderUnit, sliderMinLabel: block.sliderMinLabel, sliderMaxLabel: block.sliderMaxLabel, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'numeric') {
          return { ...baseBlock, type: 'numeric' as const, numericMin: block.minValue, numericMax: block.maxValue, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'matrix_rating') {
          return { ...baseBlock, type: 'matrix_rating' as const, matrixItems: block.matrixItems || [], matrixScaleMax: block.matrixScaleMax ?? 5, matrixScaleLabels: block.matrixScaleLabels, required: block.required, scoring: block.scoring }
        }
        if (block.type === 'list_input') {
          return { ...baseBlock, type: 'list_input' as const, listMinItems: block.listMinItems, listMaxItems: block.listMaxItems, listItemPlaceholder: block.listItemPlaceholder, required: block.required }
        }
        if (block.type === 'date_picker') {
          return { ...baseBlock, type: 'date_picker' as const, required: block.required }
        }
        if (block.type === 'time_input') {
          return { ...baseBlock, type: 'time_input' as const, required: block.required }
        }
        if (block.type === 'pdf_document') {
          return { ...baseBlock, mediaFile: (block as any).mediaFile, fileName: (block as any).fileName, pageRange: (block as any).pageRange, originalPdfUrl: (block as any).originalPdfUrl } as ResourceBlock
        }
        if (block.type === 'matching_pairs') {
          return { ...baseBlock, pairs: (block as any).pairs, required: block.required } as ResourceBlock
        }
        if (block.type === 'flashcard') {
          return { ...baseBlock, cards: (block as any).cards } as ResourceBlock
        }
        if (block.type === 'fill_blank') {
          return { ...baseBlock, sentence: (block as any).sentence, blanks: (block as any).blanks, required: block.required } as ResourceBlock
        }
        if (block.type === 'ordering') {
          return { ...baseBlock, items: (block as any).items, correctOrder: (block as any).correctOrder, required: block.required } as ResourceBlock
        }
        // Mirrors the corresponding case in handleSave. Missing entries
        // here cause autosave to silently strip type-specific fields off
        // the block (e.g. table_exercise without these two lines drops
        // its columns + exampleRow on the next idle save).
        if (block.type === 'table_exercise') {
          return { ...baseBlock, type: 'table_exercise' as const, columns: (block as any).columns, exampleRow: (block as any).exampleRow } as ResourceBlock
        }
        if (block.type === 'link') {
          return { ...baseBlock, type: 'link' as const, linkUrl: (block as any).linkUrl } as ResourceBlock
        }
        if (block.type === 'key_points') {
          return { ...baseBlock, type: 'key_points' as const, points: block.points ?? [] } as ResourceBlock
        }
        if (block.type === 'heading') {
          return { ...baseBlock, type: 'heading' as const, headingLevel: block.headingLevel ?? 'h2' } as ResourceBlock
        }
        if (block.type === 'spacer') {
          return { ...baseBlock, type: 'spacer' as const, spacerSize: block.spacerSize ?? 'md' } as ResourceBlock
        }
        return baseBlock as ResourceBlock
      })

      const settings: WorksheetSettings = {
        enableScoring,
        showScoreToMember: enableScoring ? showScoreToMember : undefined,
        scoringRanges: enableScoring ? scoringRanges : undefined,
        maxScore: enableScoring ? calculateMaxScore() : undefined,
      }

      if (enableScoring) {
        settings.questions = blocks
          .filter(b => ['likert', 'numeric', 'scale', 'slider', 'multiple_choice', 'yes_no', 'mood', 'checklist', 'matrix_rating'].includes(b.type))
          .map(block => ({
            id: block.id,
            type: block.type as WorksheetQuestionType,
            question: block.content,
            required: block.required ?? true,
            options: block.choices,
            scaleLabels: block.scaleLabels,
            scaleRange: block.scaleRange,
            scaleMin: block.scaleMin,
            scaleMax: block.scaleMax,
            scaleMinLabel: block.scaleMinLabel,
            scaleMaxLabel: block.scaleMaxLabel,
            items: block.items,
            moodOptions: block.moodOptions?.map(m => ({ emoji: m.emoji, label: m.label, value: m.value || 0 })),
            sliderMin: block.sliderMin,
            sliderMax: block.sliderMax,
            sliderStep: block.sliderStep,
            sliderUnit: block.sliderUnit,
            minValue: block.minValue,
            maxValue: block.maxValue,
            scoring: block.scoring,
            matrixItems: block.matrixItems,
            matrixScaleMax: block.matrixScaleMax,
            matrixScaleLabels: block.matrixScaleLabels,
          }))
      }

      if (saveToId) {
        // Update existing resource — include `type` so the auto-save also
        // promotes/demotes the resource as the practitioner adds or removes
        // interactive blocks.
        await updateResource(saveToId, {
          type: detectedResourceType as any,
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          language: resourceLanguage as any,
        })
      } else {
        // Create new draft for auto-save
        const newResource = await createResource({
          type: detectedResourceType as any,
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          tags: tags.length > 0 ? tags : undefined,
          blocks: resourceBlocks,
          settings,
          status: 'draft',
          visibility: 'private',
          language: resourceLanguage as any,
        })
        // Store the new draft ID for future auto-saves
        if (newResource?.id) {
          setAutoSaveDraftId(newResource.id)
          // Update URL to include the draft ID so refresh loads the saved draft
          justAutoSavedRef.current = true
          router.replace(`/resources/create/worksheet?edit=${newResource.id}`, { scroll: false })
        }
      }

      setAutoSaveStatus('saved')
      setLastSavedAt(new Date())
      setHasUnsavedChanges(false)

      // Reset status to idle after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('Auto-save error:', error)
      setAutoSaveStatus('error')
      // Reset to idle after 3 seconds so user can try again
      setTimeout(() => {
        setAutoSaveStatus('idle')
        setHasUnsavedChanges(true)
      }, 3000)
    } finally {
      isAutoSavingRef.current = false
    }
  }, [editId, autoSaveDraftId, isSaving, title, blocks, description, selectedCategory, tags, enableScoring, showScoreToMember, scoringRanges])

  // Track changes and trigger auto-save
  const performAutoSaveRef = useRef(performAutoSave)
  performAutoSaveRef.current = performAutoSave

  useEffect(() => {
    // Skip if we're still loading
    if (isLoading) return

    // Skip the initial load for edit mode - don't mark as unsaved when data is first loaded
    if (isEditMode && isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }

    // Only track changes if we have content
    if (!title && blocks.length === 0) return

    // Mark as having unsaved changes
    setHasUnsavedChanges(true)
    setAutoSaveStatus('idle')

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new auto-save timeout (5 seconds after last change)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSaveRef.current()
    }, 5000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, blocks, description, selectedCategory, tags, enableScoring, showScoreToMember, scoringRanges, isEditMode, isLoading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

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
        {block.type === 'heading' && (() => {
          const lvl = block.headingLevel ?? 'h2'
          const cls = lvl === 'h1'
            ? 'text-3xl font-bold text-gray-900 mb-2'
            : lvl === 'h3'
              ? 'text-lg font-semibold text-gray-900 mb-2'
              : 'text-2xl font-bold text-gray-900 mb-2'
          if (lvl === 'h1') return <h1 className={cls}>{block.content}</h1>
          if (lvl === 'h3') return <h3 className={cls}>{block.content}</h3>
          return <h2 className={cls}>{block.content}</h2>
        })()}

        {/* Spacer */}
        {block.type === 'spacer' && (() => {
          const heightClass =
            (block.spacerSize ?? 'md') === 'sm' ? 'h-3'
              : (block.spacerSize ?? 'md') === 'lg' ? 'h-12'
              : 'h-6'
          return <div className={`${heightClass} w-full`} aria-hidden />
        })()}

        {/* Paragraph/Instructions */}
        {block.type === 'paragraph' && (
          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{block.content}</p>
        )}

        {/* Bullet List */}
        {block.type === 'key_points' && (
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            {(block.points ?? []).filter(p => p.trim() !== '').map((pt, i) => (
              <li key={i} className="leading-relaxed">{pt}</li>
            ))}
          </ul>
        )}

        {/* Long Text */}
        {block.type === 'prompt' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            {isTestMode ? (
              <textarea
                value={testResponses[block.id] || ''}
                onChange={(e) => updateTestResponse(block.id, e.target.value)}
                placeholder={block.placeholder}
                rows={4}
                disabled={testSubmitted}
                className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-y transition-all ${testSubmitted ? 'bg-gray-50' : ''}`}
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
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isTestMode ? (testResponses[block.id] || []).includes(index) : false}
                    onChange={() => isTestMode && !testSubmitted && toggleTestChecklistItem(block.id, index)}
                    disabled={!isTestMode || testSubmitted}
                    className="w-5 h-5 rounded border-gray-300 text-gray-700 focus:ring-gray-400"
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
            <div>
              <div className="flex items-center justify-center gap-1">
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
                          ? 'bg-gray-900 text-white shadow-lg'
                          : isTestMode
                            ? 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400'
                      } ${testSubmitted && isTestMode ? 'cursor-not-allowed' : ''}`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
              {(block.scaleMinLabel || block.scaleMaxLabel) && (
                <div className="flex justify-between mt-2 px-1">
                  <span className="text-xs text-gray-400">{block.scaleMinLabel}</span>
                  <span className="text-xs text-gray-400">{block.scaleMaxLabel}</span>
                </div>
              )}
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
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                {locale === 'fr' ? 'Télécharger' : 'Download'}
              </a>
            </div>
          </div>
        )}

        {/* Multiple Choice */}
        {block.type === 'multiple_choice' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium mb-3">{block.content}</label>
            <div className="space-y-2">
              {block.choices?.map((choice: string, index: number) => {
                // When allowMultiple is set the response is an array of
                // indices; otherwise it's a single index. Same pattern as
                // checklist, just reuses the existing toggle helper.
                const allowMultiple = !!block.allowMultiple
                const response = testResponses[block.id]
                const isSelected = isTestMode && (
                  allowMultiple
                    ? Array.isArray(response) && response.includes(index)
                    : response === index
                )
                const onPick = () => {
                  if (!isTestMode || testSubmitted) return
                  if (allowMultiple) toggleTestChecklistItem(block.id, index)
                  else updateTestResponse(block.id, index)
                }
                return (
                  <button
                    key={index}
                    onClick={onPick}
                    disabled={!isTestMode || testSubmitted}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {allowMultiple ? (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    )}
                    <span className="text-gray-700">{choice}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Yes/No Question */}
        {block.type === 'yes_no' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium mb-3">{block.content}</label>
            <div className="flex gap-3">
              {['yes', 'no'].map((value) => {
                const isSelected = isTestMode && testResponses[block.id] === value
                return (
                  <button
                    key={value}
                    onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, value)}
                    disabled={!isTestMode || testSubmitted}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      isSelected
                        ? value === 'yes'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {value === 'yes' ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No')}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mood Selector */}
        {block.type === 'mood' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium mb-3">{block.content}</label>
            <div className="flex justify-center gap-4 sm:gap-6">
              {(block.moodOptions || [
                { emoji: '🌧️', label: locale === 'fr' ? 'Difficile' : 'Struggling', value: 1 },
                { emoji: '🍂', label: locale === 'fr' ? 'Fragile' : 'Low', value: 2 },
                { emoji: '🌱', label: locale === 'fr' ? 'Neutre' : 'Okay', value: 3 },
                { emoji: '🌿', label: locale === 'fr' ? 'Bien' : 'Good', value: 4 },
                { emoji: '🌸', label: locale === 'fr' ? 'Épanoui' : 'Thriving', value: 5 },
              ]).map((mood, index) => {
                const moodValue = mood.value ?? index
                const isSelected = isTestMode && testResponses[block.id] === moodValue
                return (
                  <button
                    key={index}
                    onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, moodValue)}
                    disabled={!isTestMode || testSubmitted}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-amber-100 ring-2 ring-amber-400'
                        : 'hover:bg-gray-50'
                    } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                  >
                    {moodIcons[mood.emoji] ? (
                      (() => {
                        const Icon = moodIcons[mood.emoji]
                        return <Icon className={`w-8 h-8 ${moodColors[mood.emoji] || 'text-gray-500'}`} />
                      })()
                    ) : (
                      <span className="text-3xl">{mood.emoji}</span>
                    )}
                    <span className="text-xs text-gray-600">{mood.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Likert Scale */}
        {block.type === 'likert' && (
          <div className="space-y-3">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            {/* Mood variant */}
            {block.scaleType === 'mood' && (
              <div className="flex items-center gap-6 py-2">
                {[
                  { icon: Laugh, label: locale === 'fr' ? 'Épanoui' : 'Thriving', color: 'text-emerald-500' },
                  { icon: Smile, label: locale === 'fr' ? 'Bien' : 'Good', color: 'text-teal-500' },
                  { icon: Meh, label: locale === 'fr' ? 'Neutre' : 'Okay', color: 'text-amber-500' },
                  { icon: Frown, label: locale === 'fr' ? 'Fragile' : 'Low', color: 'text-orange-500' },
                  { icon: Angry, label: locale === 'fr' ? 'Difficile' : 'Struggling', color: 'text-red-500' },
                ].map((mood, i) => {
                  const MoodIcon = mood.icon
                  const isSelected = isTestMode && testResponses[block.id] === i
                  return (
                    <button
                      key={i}
                      onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, i)}
                      disabled={!isTestMode || testSubmitted}
                      className={`flex flex-col items-center gap-1.5 transition-transform ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
                    >
                      <MoodIcon className={`w-8 h-8 ${isSelected ? mood.color : 'text-gray-300'} ${!isTestMode ? mood.color : ''}`} />
                      <p className={`text-xs ${isSelected ? mood.color : 'text-gray-400'} ${!isTestMode ? mood.color : ''}`}>{mood.label}</p>
                    </button>
                  )
                })}
              </div>
            )}
            {/* Rating variant */}
            {block.scaleType === 'rating' && (
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: (block.scaleMax || 10) - (block.scaleMin || 1) + 1 }, (_, i) => {
                  const value = (block.scaleMin || 1) + i
                  const isSelected = isTestMode && testResponses[block.id] === value
                  return (
                    <button
                      key={value}
                      onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, value)}
                      disabled={!isTestMode || testSubmitted}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-amber-400 text-white shadow-md'
                          : isTestMode
                            ? 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {value}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Likert variant (default) */}
            {(!block.scaleType || block.scaleType === 'likert') && (
              <div className="flex flex-wrap gap-2 justify-start">
                {block.scaleLabels?.map((label, index) => {
                  const isSelected = isTestMode && testResponses[block.id] === index
                  return (
                    <button
                      key={index}
                      onClick={() => isTestMode && !testSubmitted && updateTestResponse(block.id, index)}
                      disabled={!isTestMode || testSubmitted}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : isTestMode
                            ? 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                            : 'border-gray-200 text-gray-400 bg-gray-50'
                      } ${testSubmitted && isTestMode ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Numeric Input */}
        {block.type === 'numeric' && (
          <div className="space-y-3">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{block.minValue ?? 0}</span>
              <input
                type="range"
                min={block.minValue ?? 0}
                max={block.maxValue ?? 10}
                value={testResponses[block.id] ?? block.minValue ?? 0}
                onChange={(e) => isTestMode && updateTestResponse(block.id, parseInt(e.target.value))}
                disabled={!isTestMode || testSubmitted}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-gray-500">{block.maxValue ?? 10}</span>
              <span className="w-12 text-center font-semibold text-emerald-600">
                {testResponses[block.id] !== undefined ? testResponses[block.id] : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Slider */}
        {block.type === 'slider' && (
          <div className="space-y-3">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{block.sliderMin ?? 0}</span>
              <input
                type="range"
                min={block.sliderMin ?? 0}
                max={block.sliderMax ?? 100}
                step={block.sliderStep ?? 1}
                value={testResponses[block.id] ?? block.sliderMin ?? 0}
                onChange={(e) => isTestMode && updateTestResponse(block.id, parseInt(e.target.value))}
                disabled={!isTestMode || testSubmitted}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-sm text-gray-500">{block.sliderMax ?? 100}</span>
              <span className="w-20 text-center font-semibold text-violet-600">
                {testResponses[block.id] !== undefined ? `${testResponses[block.id]}${block.sliderUnit || ''}` : '-'}
              </span>
            </div>
          </div>
        )}

        {/* Matrix Rating */}
        {block.type === 'matrix_rating' && (
          <div className="space-y-4">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-gray-500 pb-3 pr-4"></th>
                    {Array.from({ length: block.matrixScaleMax || 5 }, (_, i) => (
                      <th key={i} className="text-center text-xs text-gray-400 pb-3 px-2">{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(block.matrixItems || []).map((item, itemIndex) => {
                    const currentResponse = (testResponses[block.id] as Record<string, number>) || {}
                    return (
                      <tr key={itemIndex} className="border-t border-gray-100">
                        <td className="py-3 pr-4 text-sm text-gray-700">{item}</td>
                        {Array.from({ length: block.matrixScaleMax || 5 }, (_, scaleIndex) => {
                          const value = scaleIndex + 1
                          const isSelected = currentResponse[itemIndex.toString()] === value
                          return (
                            <td key={scaleIndex} className="py-3 px-2 text-center">
                              <button
                                onClick={() => {
                                  if (isTestMode && !testSubmitted) {
                                    const newResponse = { ...currentResponse, [itemIndex.toString()]: value }
                                    updateTestResponse(block.id, newResponse)
                                  }
                                }}
                                disabled={!isTestMode || testSubmitted}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-500 text-white'
                                    : isTestMode
                                      ? 'border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                                      : 'border-gray-200 bg-gray-50'
                                } ${testSubmitted ? 'cursor-not-allowed' : ''}`}
                              >
                                {isSelected && <span className="text-xs font-medium">{value}</span>}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  <tr>
                    <td></td>
                    <td className="text-center text-xs text-gray-400 pt-1 px-2">{block.matrixScaleLabels?.min || (locale === 'fr' ? 'Pas du tout' : 'Not at all')}</td>
                    {Array.from({ length: Math.max(0, (block.matrixScaleMax || 5) - 2) }, (_, i) => (
                      <td key={i}></td>
                    ))}
                    <td className="text-center text-xs text-gray-400 pt-1 px-2">{block.matrixScaleLabels?.max || (locale === 'fr' ? 'Complètement' : 'Completely')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Date Picker */}
        {block.type === 'date_picker' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            {isTestMode ? (
              <input
                type="date"
                value={testResponses[block.id] || ''}
                onChange={(e) => updateTestResponse(block.id, e.target.value)}
                disabled={testSubmitted}
                className={`w-full sm:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${testSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-fit">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">{locale === 'fr' ? 'Sélectionner une date...' : 'Select a date...'}</span>
              </div>
            )}
          </div>
        )}

        {/* Time Input */}
        {block.type === 'time_input' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">{block.content}</label>
            {isTestMode ? (
              <input
                type="time"
                value={testResponses[block.id] || ''}
                onChange={(e) => updateTestResponse(block.id, e.target.value)}
                disabled={testSubmitted}
                className={`w-full sm:w-auto px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${testSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
              />
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 w-fit">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">--:-- --</span>
              </div>
            )}
          </div>
        )}

        {/* List Input */}
        {block.type === 'list_input' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">
              {block.content || (locale === 'fr' ? 'Liste à remplir' : 'List Input')}
            </label>
            {isTestMode ? (
              <div className="space-y-2">
                {(testResponses[block.id] || ['']).map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newList = [...(testResponses[block.id] || [''])]
                        newList[index] = e.target.value
                        updateTestResponse(block.id, newList)
                      }}
                      placeholder={block.listItemPlaceholder || (locale === 'fr' ? 'Entrez un élément...' : 'Enter an item...')}
                      disabled={testSubmitted}
                      className={`flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${testSubmitted ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {!testSubmitted && (testResponses[block.id] || ['']).length > (block.listMinItems || 1) && (
                      <button
                        onClick={() => {
                          const newList = [...(testResponses[block.id] || [''])]
                          newList.splice(index, 1)
                          updateTestResponse(block.id, newList)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!testSubmitted && (testResponses[block.id] || ['']).length < (block.listMaxItems || 10) && (
                  <button
                    onClick={() => {
                      const newList = [...(testResponses[block.id] || ['']), '']
                      updateTestResponse(block.id, newList)
                    }}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-800 font-medium mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-6">{num}.</span>
                    <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 italic">
                      {block.listItemPlaceholder || (locale === 'fr' ? 'Élément de la liste...' : 'List item...')}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'fr' ? `${block.listMinItems || 1} à ${block.listMaxItems || 10} éléments` : `${block.listMinItems || 1} to ${block.listMaxItems || 10} items`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quote/Affirmation */}
        {block.type === 'quote' && (
          <blockquote className="pl-4 border-l-4 border-purple-300 py-2">
            <p className="text-lg text-gray-700 italic">{block.content}</p>
            {block.quoteAuthor && (
              <footer className="mt-2 text-sm text-gray-500">— {block.quoteAuthor}</footer>
            )}
          </blockquote>
        )}

        {/* Tip Box */}
        {block.type === 'tip' && (
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-sky-800">{block.content}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        {block.type === 'divider' && (
          <hr className="border-t border-gray-200 my-4" />
        )}

        {/* Link */}
        {block.type === 'link' && block.linkUrl && (
          <a
            href={block.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 flex-shrink-0">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                {block.content && (
                  <p className="font-medium text-gray-900 truncate">{block.content}</p>
                )}
                <p className="text-xs text-gray-500 truncate">{block.linkUrl}</p>
              </div>
            </div>
          </a>
        )}

        {/* Video Response */}
        {block.type === 'video_response' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">
              {block.content || (locale === 'fr' ? 'Réponse vidéo' : 'Video Response')}
            </label>
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
              <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{locale === 'fr' ? 'Enregistrer une vidéo' : 'Record a video response'}</p>
            </div>
          </div>
        )}

        {/* Audio Response */}
        {block.type === 'audio_response' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">
              {block.content || (locale === 'fr' ? 'Réponse audio' : 'Audio Response')}
            </label>
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
              <Mic className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{locale === 'fr' ? 'Enregistrer un audio' : 'Record an audio response'}</p>
            </div>
          </div>
        )}

        {/* File Upload Response */}
        {block.type === 'file_response' && (
          <div className="space-y-2">
            <label className="block text-gray-900 font-medium">
              {block.content || (locale === 'fr' ? 'Télécharger un fichier' : 'File Upload')}
            </label>
            <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{locale === 'fr' ? 'Télécharger un fichier' : 'Upload a file'}</p>
            </div>
          </div>
        )}

        {/* PDF Document */}
        {/* Table Exercise */}
        {block.type === 'table_exercise' && (() => {
          const columns = (block as any).columns || []
          const exampleRow = (block as any).exampleRow || {}
          return (
            <div className="space-y-2">
              {block.content && <label className="block text-gray-900 font-medium">{block.content}</label>}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      {columns.map((col: any) => (
                        <th key={col.id} className="px-4 py-2.5 text-left text-xs font-semibold">{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(exampleRow).some((v: any) => v) && (
                      <tr className="bg-gray-50">
                        {columns.map((col: any) => (
                          <td key={col.id} className="px-4 py-2.5 text-xs text-gray-500 italic border-t border-gray-100 align-top whitespace-pre-wrap">{exampleRow[col.id] || ''}</td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      {columns.map((col: any) => (
                        <td key={col.id} className="px-4 py-3 border-t border-gray-100 align-top">
                          <div className="min-h-[60px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 italic">
                            {locale === 'fr' ? 'Réponse du membre...' : 'Member\'s response...'}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {block.type === 'pdf_document' && (
          <div className="space-y-3">
            <label className="block text-gray-900 font-medium">
              {block.content || (locale === 'fr' ? 'Document original' : 'Original document')}
            </label>
            {(block as any).mediaFile ? (
              <button
                onClick={() => setPdfViewerUrl((block as any).mediaFile)}
                className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{(block as any).fileName || 'document.pdf'}</p>
                  <p className="text-xs text-gray-500">{locale === 'fr' ? 'Cliquer pour ouvrir le PDF' : 'Click to open PDF'}</p>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </button>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <p className="text-sm text-gray-400">{locale === 'fr' ? 'PDF non disponible' : 'PDF not available'}</p>
              </div>
            )}
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
      video: { bg: 'bg-rose-100', text: 'text-rose-600', accent: 'bg-rose-400' },
      table_exercise: { bg: 'bg-cyan-100', text: 'text-cyan-600', accent: 'bg-cyan-400' },
      link: { bg: 'bg-cyan-100', text: 'text-cyan-600', accent: 'bg-cyan-400' },
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
      list_input: { bg: 'bg-lime-100', text: 'text-lime-600', accent: 'bg-lime-400' },
      // Media response blocks
      video_response: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-400' },
      audio_response: { bg: 'bg-orange-100', text: 'text-orange-600', accent: 'bg-orange-400' },
      file_response: { bg: 'bg-green-100', text: 'text-green-600', accent: 'bg-green-400' },
      // Legacy
      file: { bg: 'bg-amber-100', text: 'text-amber-600', accent: 'bg-amber-400' },
    }
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-600', accent: 'bg-gray-400' }
  }

  const renderBlockEditor = (block: WorksheetBlock, dragControls: ReturnType<typeof useDragControls>) => {
    const isExpanded = expandedBlock === block.id
    const blockType = blockTypes.find(bt => bt.type === block.type)
    // Use sub-type icon for likert/scale blocks
    const scaleIcons: Record<string, any> = { likert: SlidersHorizontal, rating: Star, mood: Smile }
    const Icon = ((block.type === 'scale' || block.type === 'likert') && block.scaleType && scaleIcons[block.scaleType]) ? scaleIcons[block.scaleType] : (blockType?.icon || FileText)
    const colors = getBlockColors(block.type)

    return (
      <div
        id={`block-${block.id}`}
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
              dragControls.start(e)
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
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`${isExpanded ? 'text-gray-900' : 'text-gray-400'}`}>
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Titre de la section' : 'Section Title'}
                      </label>
                      {/* H1 / H2 / H3 size picker — defaults to H2 */}
                      <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        {([
                          { lvl: 'h1' as const, Icon: Heading1 },
                          { lvl: 'h2' as const, Icon: Heading2 },
                          { lvl: 'h3' as const, Icon: Heading3 },
                        ]).map(({ lvl, Icon }) => {
                          const active = (block.headingLevel ?? 'h2') === lvl
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => updateBlock(block.id, { headingLevel: lvl })}
                              className={`p-1.5 rounded-md transition-all ${
                                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                              }`}
                              aria-label={lvl.toUpperCase()}
                              title={lvl.toUpperCase()}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder={locale === 'fr' ? 'Entrez le titre...' : 'Enter heading...'}
                      className={`w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${
                        (block.headingLevel ?? 'h2') === 'h1' ? 'text-2xl font-bold'
                          : (block.headingLevel ?? 'h2') === 'h3' ? 'text-base font-semibold'
                          : 'text-lg font-semibold'
                      }`}
                    />
                  </div>
                )}

                {/* Spacer Block — vertical-space picker */}
                {block.type === 'spacer' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {locale === 'fr' ? 'Hauteur de l\'espace' : 'Space height'}
                    </label>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
                      {([
                        { size: 'sm' as const, label: locale === 'fr' ? 'Petit' : 'Small' },
                        { size: 'md' as const, label: locale === 'fr' ? 'Moyen' : 'Medium' },
                        { size: 'lg' as const, label: locale === 'fr' ? 'Grand' : 'Large' },
                      ]).map(({ size, label }) => {
                        const active = (block.spacerSize ?? 'md') === size
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => updateBlock(block.id, { spacerSize: size })}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
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
                      onChange={(e) => {
                        updateBlock(block.id, { content: e.target.value })
                        // Auto-resize textarea
                        e.target.style.height = 'auto'
                        e.target.style.height = `${e.target.scrollHeight}px`
                      }}
                      onFocus={(e) => {
                        // Adjust height on focus in case content was loaded
                        e.target.style.height = 'auto'
                        e.target.style.height = `${e.target.scrollHeight}px`
                      }}
                      placeholder={locale === 'fr' ? 'Écrivez les instructions pour le client...' : 'Write instructions for the client...'}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
                    />
                  </div>
                )}

                {/* Bullet List (key_points) */}
                {block.type === 'key_points' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {locale === 'fr' ? 'Liste à puces' : 'Bullet list'}
                    </label>
                    <div className="space-y-1.5">
                      {(block.points ?? ['']).map((pt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={pt}
                            onChange={(e) => {
                              const next = [...(block.points ?? [])]
                              next[i] = e.target.value
                              updateBlock(block.id, { points: next })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                const next = [...(block.points ?? [])]
                                next.splice(i + 1, 0, '')
                                updateBlock(block.id, { points: next })
                              }
                              if (e.key === 'Backspace' && pt === '' && (block.points?.length ?? 0) > 1) {
                                e.preventDefault()
                                const next = [...(block.points ?? [])]
                                next.splice(i, 1)
                                updateBlock(block.id, { points: next })
                              }
                            }}
                            placeholder={locale === 'fr' ? `Point ${i + 1}` : `Point ${i + 1}`}
                            className="flex-1 px-3 py-1.5 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
                          />
                          {(block.points?.length ?? 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...(block.points ?? [])]
                                next.splice(i, 1)
                                updateBlock(block.id, { points: next })
                              }}
                              className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              aria-label={locale === 'fr' ? 'Supprimer ce point' : 'Remove this point'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateBlock(block.id, { points: [...(block.points ?? []), ''] })}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {locale === 'fr' ? 'Ajouter un point' : 'Add a point'}
                    </button>
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
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: Décrivez vos émotions...' : 'e.g., Describe your emotions...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-gray-800"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-blue-50/50 transition-all">
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                                ? 'bg-gray-900 text-white shadow-md'
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
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                          <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-blue-50/50 transition-all">
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-blue-50/50 transition-all">
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>

                    {/* File Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                      </label>
                      <textarea
                        value={block.mediaCaption || ''}
                        onChange={(e) => {
                          updateBlock(block.id, { mediaCaption: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Expliquez ce que contient ce fichier...' : 'Explain what this file contains...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
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
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: Enregistrez une vidéo où vous décrivez votre journée...' : 'e.g., Record a video describing your day...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: Enregistrez vos pensées sur cette semaine...' : 'e.g., Record your thoughts about this week...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
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
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: Téléchargez une photo de votre espace de détente...' : 'e.g., Upload a photo of your relaxation space...'}
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[60px]"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* PDF Document Block */}
                {block.type === 'pdf_document' && (() => {
                  const pageRange = (block as any).pageRange as number[] | undefined
                  const pageLabel = pageRange && pageRange.length > 0
                    ? (pageRange.length === 1
                        ? `Page ${pageRange[0]}`
                        : `Pages ${pageRange[0]}–${pageRange[pageRange.length - 1]}`)
                    : null
                  return (
                    <div className="space-y-3">
                      {(block as any).mediaFile ? (
                        <button
                          onClick={() => setPdfViewerUrl((block as any).mediaFile)}
                          className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{(block as any).fileName || 'document.pdf'}</p>
                            <p className="text-xs text-gray-500">
                              {pageLabel && <span className="font-medium">{pageLabel} · </span>}
                              {locale === 'fr' ? 'Cliquer pour ouvrir' : 'Click to open'}
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                          <p className="text-sm text-gray-400">{locale === 'fr' ? 'PDF non disponible' : 'PDF not available'}</p>
                        </div>
                      )}
                      {/* Split button */}
                      {(block as any).mediaFile && (
                        <button
                          onClick={async () => {
                            const pdfSrc = (block as any).originalPdfUrl || (block as any).mediaFile
                            const existingRange = (block as any).pageRange as number[] | undefined
                            setSplitBlockId(block.id)
                            setShowPdfSplit(true)
                            setSplitThumbnails([])
                            setSplitThumbsLoading(true)

                            try {
                              // Get page count
                              const res = await fetch(pdfSrc)
                              const buf = await res.arrayBuffer()
                              const { PDFDocument } = await import('pdf-lib')
                              const pdf = await PDFDocument.load(buf)
                              const pageCount = pdf.getPageCount()
                              setSplitTotalPages(pageCount)
                              // Pre-select the block's current page range
                              const initFrom = existingRange?.[0] || 1
                              const initTo = existingRange?.[existingRange.length - 1] || Math.min(3, pageCount)
                              setSplitRanges([{ from: initFrom, to: initTo }])

                              // Render thumbnails via pdfjs
                              const pdfjsLib = await import('pdfjs-dist')
                              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
                              const pdfDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise
                              const thumbs: string[] = []
                              for (let i = 1; i <= pageCount; i++) {
                                const page = await pdfDoc.getPage(i)
                                const vp = page.getViewport({ scale: 0.3 })
                                const canvas = document.createElement('canvas')
                                canvas.width = vp.width
                                canvas.height = vp.height
                                await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp } as any).promise
                                thumbs.push(canvas.toDataURL('image/jpeg', 0.6))
                              }
                              setSplitThumbnails(thumbs)
                              // Scroll to the selected page range
                              setTimeout(() => {
                                const fromPage = existingRange?.[0] || 1
                                const row = Math.floor((fromPage - 1) / 4) // 4 columns
                                if (splitThumbsRef.current && row > 0) {
                                  const thumbHeight = splitThumbsRef.current.scrollHeight / Math.ceil(thumbs.length / 4)
                                  splitThumbsRef.current.scrollTo({ top: Math.max(0, row * thumbHeight - 20), behavior: 'smooth' })
                                }
                              }, 50)
                            } catch {
                              setSplitTotalPages(40)
                              setSplitRanges([{ from: 1, to: 3 }])
                            } finally {
                              setSplitThumbsLoading(false)
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          {locale === 'fr' ? 'Découper en sections' : 'Split into sections'}
                        </button>
                      )}
                    </div>
                  )
                })()}

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

                {/* Table Exercise Block */}
                {block.type === 'table_exercise' && (() => {
                  const columns = (block as any).columns || []
                  const exampleRow = (block as any).exampleRow || {}
                  return (
                    <div className="space-y-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Titre du tableau' : 'Table title'}
                        </label>
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          placeholder={locale === 'fr' ? 'Ex: Tableau de restructuration cognitive' : 'e.g., Cognitive Restructuring Table'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>

                      {/* Columns */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'fr' ? 'Colonnes' : 'Columns'}
                        </label>
                        <div className="space-y-2">
                          {columns.map((col: any, i: number) => (
                            <div key={col.id} className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-3 w-5">{i + 1}.</span>
                              <div className="flex-1 space-y-1.5">
                                <input
                                  type="text"
                                  value={col.header}
                                  onChange={(e) => {
                                    const updated = columns.map((c: any, j: number) => j === i ? { ...c, header: e.target.value } : c)
                                    updateBlock(block.id, { columns: updated } as any)
                                  }}
                                  placeholder={locale === 'fr' ? 'En-tête de colonne' : 'Column header'}
                                  className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-medium"
                                />
                                <textarea
                                  value={exampleRow[col.id] || ''}
                                  onChange={(e) => {
                                    const updated = { ...exampleRow, [col.id]: e.target.value }
                                    updateBlock(block.id, { exampleRow: updated } as any)
                                  }}
                                  placeholder={locale === 'fr' ? 'Instructions / exemple (optionnel)' : 'Instructions / example (optional)'}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-xs text-gray-500 resize-none"
                                />
                              </div>
                              {columns.length > 2 && (
                                <button
                                  onClick={() => {
                                    const updated = columns.filter((_: any, j: number) => j !== i)
                                    const updatedExample = { ...exampleRow }
                                    delete updatedExample[col.id]
                                    updateBlock(block.id, { columns: updated, exampleRow: updatedExample } as any)
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-400 mt-2 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {columns.length < 6 && (
                          <button
                            onClick={() => {
                              const newId = `col${Date.now()}`
                              const updated = [...columns, { id: newId, header: '' }]
                              updateBlock(block.id, { columns: updated } as any)
                            }}
                            className="mt-2 w-full py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          >
                            + {locale === 'fr' ? 'Ajouter une colonne' : 'Add column'}
                          </button>
                        )}
                        {columns.length >= 6 && (
                          <p className="text-xs text-gray-400 mt-2">{locale === 'fr' ? 'Maximum 6 colonnes' : 'Maximum 6 columns'}</p>
                        )}
                      </div>

                      {/* Preview */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">{locale === 'fr' ? 'Aperçu' : 'Preview'}</p>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-gray-800 text-white">
                                {columns.map((col: any) => (
                                  <th key={col.id} className="px-3 py-2 text-left font-semibold">
                                    {col.header || '...'}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.values(exampleRow).some((v: any) => v) && (
                                <tr className="bg-gray-50">
                                  {columns.map((col: any) => (
                                    <td key={col.id} className="px-3 py-2 text-gray-500 italic border-t border-gray-100">
                                      {exampleRow[col.id] || ''}
                                    </td>
                                  ))}
                                </tr>
                              )}
                              <tr>
                                {columns.map((col: any) => (
                                  <td key={col.id} className="px-3 py-2 text-gray-300 border-t border-gray-100">
                                    {locale === 'fr' ? 'Réponse...' : 'Answer...'}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Quote/Affirmation Block */}
                {block.type === 'quote' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Citation ou affirmation' : 'Quote or affirmation'}
                      </label>
                      <textarea
                        value={block.content}
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: "Vous êtes plus fort que vous ne le pensez"' : 'e.g., "You are stronger than you think"'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[80px]"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-l-4 border-gray-400">
                      <Quote className="w-5 h-5 text-gray-400 mb-2" />
                      <p className="text-gray-700 italic">
                        {block.content || (locale === 'fr' ? 'Votre citation ici...' : 'Your quote here...')}
                      </p>
                    </div>
                  </>
                )}

                {/* Video Block */}
                {block.type === 'video' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre de la vidéo' : 'Video title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Introduction à la pleine conscience' : 'e.g., Introduction to mindfulness'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'URL de la vidéo' : 'Video URL'}
                      </label>
                      <input
                        type="url"
                        value={(block as any).videoUrl || ''}
                        onChange={(e) => updateBlock(block.id, { videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Link Block */}
                {block.type === 'link' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Titre du lien' : 'Link title'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Article sur la gestion du stress' : 'e.g., Article on stress management'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        URL
                      </label>
                      <input
                        type="url"
                        value={(block as any).linkUrl || ''}
                        onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value } as any)}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
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
                        onChange={(e) => {
                          updateBlock(block.id, { content: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        placeholder={locale === 'fr' ? 'Ex: N\'oubliez pas de respirer profondément...' : 'e.g., Remember to breathe deeply...'}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none overflow-hidden min-h-[80px]"
                      />
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-blue-50 rounded-xl border border-gray-200 flex gap-3">
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                              className="flex-1 px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-gray-800 px-4 py-2"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    {/* Mood Preview */}
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                      <p className="text-xs font-medium text-amber-600 mb-3 flex items-center gap-1.5">
                        <Smile className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex justify-center gap-4 sm:gap-6">
                        {(block.moodOptions || defaultMoodOptions).map((mood, index) => (
                          <button
                            key={index}
                            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/50 transition-all"
                          >
                            {moodIcons[mood.emoji] ? (
                              (() => {
                                const Icon = moodIcons[mood.emoji]
                                return <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${moodColors[mood.emoji] || 'text-gray-500'}`} />
                              })()
                            ) : (
                              <span className="text-2xl sm:text-3xl">{mood.emoji}</span>
                            )}
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
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

                {/* List Input Block */}
                {block.type === 'list_input' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question ou instruction' : 'Question or instruction'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Listez 3 choses pour lesquelles vous êtes reconnaissant' : 'e.g., List 3 things you are grateful for'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Texte indicatif (optionnel)' : 'Placeholder text (optional)'}
                      </label>
                      <input
                        type="text"
                        value={block.listItemPlaceholder || ''}
                        onChange={(e) => updateBlock(block.id, { listItemPlaceholder: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Entrez un élément...' : 'e.g., Enter an item...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Minimum d\'éléments' : 'Minimum items'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={block.listMaxItems || 10}
                          value={block.listMinItems ?? ''}
                          onChange={(e) => updateBlock(block.id, { listMinItems: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value) < 1) {
                              updateBlock(block.id, { listMinItems: 1 })
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Maximum d\'éléments' : 'Maximum items'}
                        </label>
                        <input
                          type="number"
                          min={block.listMinItems || 1}
                          max={20}
                          value={block.listMaxItems ?? ''}
                          onChange={(e) => updateBlock(block.id, { listMaxItems: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                          onBlur={(e) => {
                            if (!e.target.value || parseInt(e.target.value) < 1) {
                              updateBlock(block.id, { listMaxItems: 10 })
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-br from-lime-50 to-emerald-50 rounded-xl border border-lime-200/50">
                      <p className="text-xs font-medium text-lime-600 mb-3 flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="space-y-2">
                        {[1, 2, 3].slice(0, block.listMinItems || 1).map((num) => (
                          <div key={num} className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm w-6">{num}.</span>
                            <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-400">
                              {block.listItemPlaceholder || (locale === 'fr' ? 'Entrez un élément...' : 'Enter an item...')}
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-lime-600 mt-2">
                          + {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Likert Scale Block */}
                {block.type === 'likert' && (
                  <>
                    {/* Scale Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Type de question' : 'Question Type'}
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateBlock(block.id, { scaleType: 'rating' })}
                          className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                            block.scaleType === 'rating'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                          {locale === 'fr' ? 'Échelle de 0 à 10' : 'Rating'}
                        </button>
                        <button
                          onClick={() => updateBlock(block.id, { scaleType: 'mood' })}
                          className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                            block.scaleType === 'mood'
                              ? 'border-amber-400 bg-amber-50 text-amber-700'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <Smile className="w-4 h-4" />
                          {locale === 'fr' ? 'Sélecteur d\'humeur' : 'Mood'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={
                          block.scaleType === 'mood'
                            ? (locale === 'fr' ? 'Ex: Comment vous sentez-vous aujourd\'hui?' : 'e.g., How are you feeling today?')
                            : block.scaleType === 'rating'
                            ? (locale === 'fr' ? 'Ex: Évaluez votre niveau de stress' : 'e.g., Rate your stress level')
                            : (locale === 'fr' ? 'Ex: Je me sens anxieux(se) la plupart du temps' : 'e.g., I feel anxious most of the time')
                        }
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>

                    {/* Mood Scale Options */}
                    {block.scaleType === 'mood' && (
                      <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200/50">
                        <p className="text-xs font-medium text-pink-600 mb-3 flex items-center gap-1.5">
                          <Smile className="w-3.5 h-3.5" />
                          {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                          {[
                            { icon: Laugh, label: locale === 'fr' ? 'Épanoui' : 'Thriving', color: 'text-emerald-500' },
                            { icon: Smile, label: locale === 'fr' ? 'Bien' : 'Good', color: 'text-teal-500' },
                            { icon: Meh, label: locale === 'fr' ? 'Neutre' : 'Okay', color: 'text-amber-500' },
                            { icon: Frown, label: locale === 'fr' ? 'Fragile' : 'Low', color: 'text-orange-500' },
                            { icon: Angry, label: locale === 'fr' ? 'Difficile' : 'Struggling', color: 'text-red-500' },
                          ].map((mood, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                              <mood.icon className={`w-6 h-6 ${mood.color}`} />
                              <span className={`text-[10px] font-medium ${mood.color}`}>{mood.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rating Scale Options */}
                    {block.scaleType === 'rating' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {locale === 'fr' ? 'Valeur min' : 'Min value'}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={block.scaleMin ?? ''}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/g, '')
                                updateBlock(block.id, { scaleMin: v === '' ? undefined : parseInt(v) })
                              }}
                              onBlur={() => { if (block.scaleMin === undefined) updateBlock(block.id, { scaleMin: 0 }) }}
                              placeholder="1"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              {locale === 'fr' ? 'Valeur max' : 'Max value'}
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={block.scaleMax ?? ''}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/g, '')
                                updateBlock(block.id, { scaleMax: v === '' ? undefined : parseInt(v) })
                              }}
                              onBlur={() => { if (block.scaleMax === undefined) updateBlock(block.id, { scaleMax: 10 }) }}
                              placeholder="10"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900"
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200/50">
                          <p className="text-xs font-medium text-amber-600 mb-3 flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5" />
                            {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {Array.from({ length: (block.scaleMax ?? 10) - (block.scaleMin ?? 1) + 1 }, (_, i) => (block.scaleMin ?? 1) + i).map((num) => (
                              <button
                                key={num}
                                className="w-9 h-9 text-sm bg-white border border-gray-200 rounded-lg text-gray-600 font-medium"
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Likert Scale Options */}
                    {(!block.scaleType || block.scaleType === 'likert') && (
                      <>
                        {/* Likert Preset Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            {locale === 'fr' ? 'Préréglage' : 'Preset'}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(likertPresets).map(([key, preset]) => (
                              <button
                                key={key}
                                onClick={() => applyLikertPreset(block.id, key)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                  block.scaleLabels?.join(',') === (preset[locale] ?? preset['en']).join(',')
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {key === 'agreement' ? (locale === 'fr' ? 'Accord' : 'Agreement') :
                                 key === 'frequency' ? (locale === 'fr' ? 'Fréquence' : 'Frequency') :
                                 locale === 'fr' ? 'Intensité' : 'Severity'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Scale Labels Preview */}
                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200/50">
                          <p className="text-xs font-medium text-emerald-600 mb-3 flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center">
                            {(block.scaleLabels || (likertPresets.frequency[locale] ?? likertPresets.frequency['en'])).map((label, i) => (
                              <button
                                key={i}
                                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-600"
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Scoring Config for Likert */}
                    {enableScoring && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Calculator className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">
                            {locale === 'fr' ? 'Points par réponse' : 'Points per answer'}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {(block.scaleLabels || (likertPresets.frequency[locale] ?? likertPresets.frequency['en'])).map((label, i) => (
                            <div key={i} className="text-center">
                              <p className="text-xs text-gray-500 mb-1 truncate" title={label}>{label.substring(0, 8)}...</p>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={block.scoring?.[i.toString()] ?? i}
                                onChange={(e) => {
                                  const newScoring = { ...(block.scoring || {}) }
                                  newScoring[i.toString()] = parseInt(e.target.value) || 0
                                  updateBlock(block.id, { scoring: newScoring })
                                }}
                                className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          {locale === 'fr' ? `Score max: ${Math.max(...Object.values(block.scoring || {}).map(Number))} pts` : `Max score: ${Math.max(...Object.values(block.scoring || {}).map(Number))} pts`}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Numeric Input Block */}
                {block.type === 'numeric' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Combien d\'heures avez-vous dormi?' : 'e.g., How many hours did you sleep?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur minimum' : 'Minimum Value'}
                        </label>
                        <input
                          type="number"
                          value={block.minValue ?? 0}
                          onChange={(e) => updateBlock(block.id, { minValue: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur maximum' : 'Maximum Value'}
                        </label>
                        <input
                          type="number"
                          value={block.maxValue ?? 10}
                          onChange={(e) => updateBlock(block.id, { maxValue: parseInt(e.target.value) || 10 })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-gray-200/50">
                      <p className="text-xs font-medium text-blue-600 mb-3 flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{block.minValue ?? 0}</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-blue-500 rounded-full"></div>
                        </div>
                        <span className="text-sm text-gray-500">{block.maxValue ?? 10}</span>
                        <span className="w-12 text-center font-semibold text-blue-600">
                          {Math.floor(((block.maxValue ?? 10) - (block.minValue ?? 0)) / 2 + (block.minValue ?? 0))}
                        </span>
                      </div>
                    </div>

                    {/* Scoring Info for Numeric */}
                    {enableScoring && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">
                          {locale === 'fr'
                            ? `La valeur sélectionnée sera ajoutée au score (max: ${block.maxValue ?? 10} pts)`
                            : `Selected value will be added to score (max: ${block.maxValue ?? 10} pts)`}
                        </span>
                      </div>
                    )}
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
                        placeholder={locale === 'fr' ? 'Ex: Quel est votre niveau de stress?' : 'e.g., What is your stress level?'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Minimum' : 'Min'}
                        </label>
                        <input
                          type="number"
                          value={block.sliderMin ?? 0}
                          onChange={(e) => updateBlock(block.id, { sliderMin: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Maximum' : 'Max'}
                        </label>
                        <input
                          type="number"
                          value={block.sliderMax ?? 100}
                          onChange={(e) => updateBlock(block.id, { sliderMax: parseInt(e.target.value) || 100 })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Unité' : 'Unit'}
                        </label>
                        <input
                          type="text"
                          value={block.sliderUnit ?? '%'}
                          onChange={(e) => updateBlock(block.id, { sliderUnit: e.target.value })}
                          placeholder="%"
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200/50">
                      <p className="text-xs font-medium text-violet-600 mb-3 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{block.sliderMin ?? 0}</span>
                        <input
                          type="range"
                          min={block.sliderMin ?? 0}
                          max={block.sliderMax ?? 100}
                          value={(block.sliderMax ?? 100) / 2}
                          readOnly
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                        />
                        <span className="text-sm text-gray-500">{block.sliderMax ?? 100}</span>
                        <span className="w-16 text-center font-semibold text-violet-600">
                          {(block.sliderMax ?? 100) / 2}{block.sliderUnit ?? '%'}
                        </span>
                      </div>
                    </div>

                    {/* Scoring Info for Slider */}
                    {enableScoring && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">
                          {locale === 'fr'
                            ? `La valeur du curseur sera ajoutée au score (max: ${block.sliderMax ?? 100} pts)`
                            : `Slider value will be added to score (max: ${block.sliderMax ?? 100} pts)`}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* Scoring Section for Multiple Choice - Add after choice list */}
                {block.type === 'multiple_choice' && enableScoring && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">
                        {locale === 'fr' ? 'Points par réponse' : 'Points per answer'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(block.choices || []).map((choice, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 flex-1 truncate">{choice || `Option ${index + 1}`}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={block.scoring?.[index.toString()] ?? index}
                            onChange={(e) => {
                              const newScoring = { ...(block.scoring || {}) }
                              newScoring[index.toString()] = parseInt(e.target.value) || 0
                              updateBlock(block.id, { scoring: newScoring })
                            }}
                            className="w-16 px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                          <span className="text-xs text-amber-600">pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scoring Section for Yes/No */}
                {block.type === 'yes_no' && enableScoring && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">
                        {locale === 'fr' ? 'Points par réponse' : 'Points per answer'}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-emerald-600 font-medium">{locale === 'fr' ? 'Oui' : 'Yes'}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={block.scoring?.yes ?? 1}
                          onChange={(e) => {
                            const newScoring = { ...(block.scoring || { yes: 1, no: 0 }) }
                            newScoring.yes = parseInt(e.target.value) || 0
                            updateBlock(block.id, { scoring: newScoring })
                          }}
                          className="w-16 px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-xs text-amber-600">pts</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-gray-600 font-medium">{locale === 'fr' ? 'Non' : 'No'}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={block.scoring?.no ?? 0}
                          onChange={(e) => {
                            const newScoring = { ...(block.scoring || { yes: 1, no: 0 }) }
                            newScoring.no = parseInt(e.target.value) || 0
                            updateBlock(block.id, { scoring: newScoring })
                          }}
                          className="w-16 px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-xs text-amber-600">pts</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scoring Section for Mood */}
                {block.type === 'mood' && enableScoring && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">
                        {locale === 'fr' ? 'Points par humeur' : 'Points per mood'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {(block.moodOptions || defaultScoredMoodOptions).map((mood, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          {moodIcons[mood.emoji] ? (
                            (() => {
                              const Icon = moodIcons[mood.emoji]
                              return <Icon className={`w-6 h-6 ${moodColors[mood.emoji] || 'text-gray-500'}`} />
                            })()
                          ) : (
                            <span className="text-xl">{mood.emoji}</span>
                          )}
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={mood.value ?? index + 1}
                            onChange={(e) => {
                              const newOptions = [...(block.moodOptions || defaultScoredMoodOptions)]
                              newOptions[index] = { ...newOptions[index], value: parseInt(e.target.value) || 0 }
                              updateBlock(block.id, { moodOptions: newOptions })
                            }}
                            className="w-12 px-1 py-1 bg-white border border-amber-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scoring Section for Scale */}
                {block.type === 'scale' && enableScoring && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      {locale === 'fr'
                        ? `La valeur sélectionnée sera ajoutée au score (${block.scaleMin ?? 1} - ${block.scaleMax ?? 10} pts)`
                        : `Selected value will be added to score (${block.scaleMin ?? 1} - ${block.scaleMax ?? 10} pts)`}
                    </span>
                  </div>
                )}

                {/* Matrix Rating Block */}
                {block.type === 'matrix_rating' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Question' : 'Question'}
                      </label>
                      <input
                        type="text"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        placeholder={locale === 'fr' ? 'Ex: Comment évaluez-vous votre relation avec...' : 'e.g., How would you rate your relationship with...'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>

                    {/* Items to Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Éléments à évaluer' : 'Items to Rate'}
                      </label>
                      <div className="space-y-2">
                        {(block.matrixItems || []).map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newItems = [...(block.matrixItems || [])]
                                newItems[index] = e.target.value
                                updateBlock(block.id, { matrixItems: newItems })
                              }}
                              placeholder={locale === 'fr' ? `Élément ${index + 1}` : `Item ${index + 1}`}
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                            />
                            {(block.matrixItems?.length || 0) > 1 && (
                              <button
                                onClick={() => {
                                  const newItems = (block.matrixItems || []).filter((_, i) => i !== index)
                                  updateBlock(block.id, { matrixItems: newItems })
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const newItems = [...(block.matrixItems || []), '']
                          updateBlock(block.id, { matrixItems: newItems })
                        }}
                        className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-gray-800"
                      >
                        <Plus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
                      </button>
                    </div>

                    {/* Scale Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Échelle maximum' : 'Scale Maximum'}
                        </label>
                        <select
                          value={block.matrixScaleMax || 5}
                          onChange={(e) => updateBlock(block.id, { matrixScaleMax: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        >
                          {[3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>1 - {n}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Scale Labels */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Étiquette minimum (1)' : 'Min Label (1)'}
                        </label>
                        <input
                          type="text"
                          value={block.matrixScaleLabels?.min || ''}
                          onChange={(e) => updateBlock(block.id, {
                            matrixScaleLabels: {
                              ...(block.matrixScaleLabels || { min: '', max: '' }),
                              min: e.target.value
                            }
                          })}
                          placeholder={locale === 'fr' ? 'Pas du tout' : 'Not at all'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? `Étiquette maximum (${block.matrixScaleMax || 5})` : `Max Label (${block.matrixScaleMax || 5})`}
                        </label>
                        <input
                          type="text"
                          value={block.matrixScaleLabels?.max || ''}
                          onChange={(e) => updateBlock(block.id, {
                            matrixScaleLabels: {
                              ...(block.matrixScaleLabels || { min: '', max: '' }),
                              max: e.target.value
                            }
                          })}
                          placeholder={locale === 'fr' ? 'Complètement' : 'Completely'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200/50">
                      <p className="text-xs font-medium text-indigo-600 mb-3 flex items-center gap-1.5">
                        <List className="w-3.5 h-3.5" />
                        {locale === 'fr' ? 'Aperçu pour le membre' : 'Member will see'}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left py-2 pr-4 text-gray-600 font-medium"></th>
                              {Array.from({ length: block.matrixScaleMax || 5 }, (_, i) => (
                                <th key={i} className="text-center px-2 py-2 text-gray-500 font-medium">
                                  {i === 0 && block.matrixScaleLabels?.min ? (
                                    <span className="text-xs">{block.matrixScaleLabels.min}</span>
                                  ) : i === (block.matrixScaleMax || 5) - 1 && block.matrixScaleLabels?.max ? (
                                    <span className="text-xs">{block.matrixScaleLabels.max}</span>
                                  ) : (
                                    i + 1
                                  )}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(block.matrixItems || []).map((item, rowIndex) => (
                              <tr key={rowIndex} className="border-t border-indigo-100">
                                <td className="py-2 pr-4 text-gray-700">{item}</td>
                                {Array.from({ length: block.matrixScaleMax || 5 }, (_, colIndex) => (
                                  <td key={colIndex} className="text-center px-2 py-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 mx-auto"></div>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Scoring Info for Matrix Rating */}
                    {enableScoring && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="w-4 h-4 text-amber-600" />
                          <span className="text-sm font-medium text-amber-700">
                            {locale === 'fr' ? 'Scoring' : 'Scoring'}
                          </span>
                        </div>
                        <p className="text-sm text-amber-700">
                          {locale === 'fr'
                            ? `Chaque élément peut être noté de 1 à ${block.matrixScaleMax || 5}. Score max: ${(block.matrixItems?.length || 0) * (block.matrixScaleMax || 5)} pts (${block.matrixItems?.length || 0} éléments × ${block.matrixScaleMax || 5} pts)`
                            : `Each item can be rated 1-${block.matrixScaleMax || 5}. Max score: ${(block.matrixItems?.length || 0) * (block.matrixScaleMax || 5)} pts (${block.matrixItems?.length || 0} items × ${block.matrixScaleMax || 5} pts)`}
                        </p>
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
          {/* Step 1: Template Selection */}
          {step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Breadcrumb Navigation */}
              <div className="mb-8">
                <Breadcrumb
                  items={[
                    { label: 'Resources', labelFr: 'Ressources', href: '/resources', icon: <FileText className="w-4 h-4" /> },
                    { label: 'Create', labelFr: 'Créer', href: '/resources/create' },
                    { label: isEditMode ? 'Edit Worksheet' : 'Worksheet', labelFr: isEditMode ? 'Modifier' : 'Exercice' },
                  ]}
                />
              </div>

              {/* Title */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100/80 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg ">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {isEditMode ? (locale === 'fr' ? 'Modifier la fiche' : 'Edit Worksheet') : (locale === 'fr' ? 'Nouvelle fiche' : 'New Worksheet')}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Créez sans modèle ou personnalisez un modèle existant'
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
                          ? 'border-dashed border-gray-300 hover:border-gray-500 bg-gray-50/50'
                          : 'border-white/60 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-gray-100' : 'bg-blue-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-gray-700" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {lt(template.name, locale)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lt(template.description, locale)}
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
          {(step === 'build' || step === 'details') && (
            <motion.div
              key="build"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* PDF Converting — minimal loading */}
              {isImportingPdf && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-40"
                >
                  <p className="text-sm font-medium text-gray-400 mb-6 tracking-wide">
                    {locale === 'fr' ? 'Analyse en cours' : 'Analyzing'}
                  </p>

                  {/* Simple flowing bar */}
                  <div className="w-56 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
                      className="w-1/3 h-full bg-gradient-to-r from-transparent via-teal-400 to-transparent rounded-full"
                    />
                  </div>
                </motion.div>
              )}

              {/* Regular builder content — hidden during import */}
              {!isImportingPdf && <>
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
                    className="rounded-xl hover:bg-white/80"
                    onClick={() => router.push(editId ? `/resources/${editId}` : '/resources/create')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Retour' : 'Back'}
                  </Button>
                </motion.div>
                {/* Autosave + Continue moved to the sidebar (above the
                    preview phone) so the editor header stays minimal. */}
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Edit Mode */}
                  {viewMode === 'edit' && (
                    <>
                      {/* Title Input */}
                      {/* Resource type pills — read-only indicators of
                          a derived state. The active mode is computed
                          from the blocks; the inactive pill carries a
                          tooltip explaining how to reach the other mode. */}
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          {
                            mode: 'reading' as const,
                            Icon: BookOpen,
                            title: locale === 'fr' ? 'Lecture' : locale === 'es' ? 'Lectura' : 'Reading',
                            sub: locale === 'fr' ? 'Guides, fiches, théorie' : locale === 'es' ? 'Guías, fichas, teoría' : 'Guides, sheets, theory',
                            inactiveTip: locale === 'fr'
                              ? 'Ce document contient des éléments qui nécessitent une réponse du patient. Supprimez-les pour revenir au mode Lecture.'
                              : locale === 'es'
                                ? 'Este documento tiene elementos que requieren respuesta del paciente. Elimínalos para volver al modo Lectura.'
                                : 'This document has elements that need patient submission. Delete them to switch back to Reading mode.',
                          },
                          {
                            mode: 'interactive' as const,
                            Icon: PenLine,
                            title: locale === 'fr' ? 'Interactif' : locale === 'es' ? 'Interactivo' : 'Interactive',
                            sub: locale === 'fr' ? 'Questions, exercices' : locale === 'es' ? 'Preguntas, ejercicios' : 'Questions, exercises',
                            inactiveTip: locale === 'fr'
                              ? 'Ajoutez un élément interactif (question, choix multiple, échelle…) pour passer en mode Interactif.'
                              : locale === 'es'
                                ? 'Añade un elemento interactivo (pregunta, opción múltiple, escala…) para pasar al modo Interactivo.'
                                : 'Add an interactive element (a question, multiple choice, scale…) to switch to Interactive mode.',
                          },
                        ]).map(({ mode, Icon, title, sub, inactiveTip }) => {
                          const isActive = resourceMode === mode
                          return (
                            <div key={mode} className="relative group">
                              <div
                                aria-disabled={!isActive}
                                className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 transition-all ${
                                  isActive
                                    ? 'border-teal-500 bg-teal-50 cursor-default'
                                    : 'border-gray-150 bg-white opacity-70 cursor-not-allowed'
                                }`}
                              >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                                <div className="text-left">
                                  <div className={`text-sm font-semibold leading-tight ${isActive ? 'text-teal-700' : 'text-gray-700'}`}>
                                    {title}
                                  </div>
                                  <div className={`text-[11px] leading-tight ${isActive ? 'text-teal-500' : 'text-gray-400'}`}>
                                    {sub}
                                  </div>
                                </div>
                              </div>
                              {!isActive && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-64 px-3 py-2 bg-gray-900 text-white text-[11px] leading-snug rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50">
                                  {inactiveTip}
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Title */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                      >
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => { setTitle(e.target.value); markAsModified(); }}
                          placeholder={locale === 'fr' ? 'Titre du support...' : 'Resource title...'}
                          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400"
                        />
                      </motion.div>

                      {/* Blocks */}
                      <div className="space-y-1">
                        <Reorder.Group axis="y" values={blocks} onReorder={(newBlocks) => { setBlocks(newBlocks); markAsModified(); }} className="space-y-1">
                          {blocks.map((block) => (
                            <SortableBlockItem key={block.id} block={block}>
                              {(dragControls) => renderBlockEditor(block, dragControls)}
                            </SortableBlockItem>
                          ))}
                        </Reorder.Group>
                      </div>

                      {/* Add Block Button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                      >
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowBlockPicker(!showBlockPicker)}
                            className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-5 h-5" />
                            {locale === 'fr' ? 'Ajouter une étape' : 'Add a block'}
                          </button>
                          {searchParams.get('import') === 'pdf' && !blocks.some(b => b.type === 'pdf_document') && (
                            <button
                              onClick={() => pdfInputRef.current?.click()}
                              disabled={isImportingPdf}
                              className="py-4 px-6 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 hover:border-teal-400 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isImportingPdf ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />{locale === 'fr' ? 'Conversion...' : 'Converting...'}</>
                              ) : (
                                <><FileUp className="w-4 h-4" />{locale === 'fr' ? 'Importer PDF' : 'Import PDF'}</>
                              )}
                            </button>
                          )}
                          <input
                            ref={pdfInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePdfFileSelect(file)
                            }}
                          />
                        </div>

                        {/* Block Picker */}
                        <AnimatePresence>
                          {showBlockPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-10"
                            >
                              {/* Content Row */}
                              <div className="flex items-start gap-6 pb-3 border-b border-gray-100">
                                <div className="flex-1">
                                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                                    {locale === 'fr' ? 'Contenu' : 'Content'}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {blockTypes.filter(bt => ['heading', 'paragraph', 'key_points', 'image', 'divider', 'spacer', 'tip', 'video', 'link'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                                          <span className="text-xs text-gray-600 group-hover:text-gray-800">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    {showMoreContentBlocks && blockTypes.filter(bt => ['quote'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
                                          <span className="text-xs text-gray-600 group-hover:text-gray-800">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    <button
                                      onClick={() => setShowMoreContentBlocks(!showMoreContentBlocks)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                                    >
                                      {showMoreContentBlocks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      {showMoreContentBlocks ? (locale === 'fr' ? 'Moins' : 'Less') : (locale === 'fr' ? 'Plus' : 'More')}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Questions / Scales / Media — always
                                  available in the picker. Adding any of
                                  these auto-promotes the document into
                                  Interactive mode (resourceMode is
                                  derived from the blocks). */}
                              <>
                              {/* Questions Row */}
                              <div className="flex items-start gap-6 py-3 border-b border-gray-100">
                                <div className="flex-1">
                                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                                    {locale === 'fr' ? 'Questions avec score' : 'Questions'}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {blockTypes.filter(bt => ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'list_input', 'table_exercise'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
                                          <span className="text-xs text-blue-600 group-hover:text-gray-800">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    {showMoreQuestionBlocks && blockTypes.filter(bt => ['date_picker', 'time_input'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-600" />
                                          <span className="text-xs text-blue-600 group-hover:text-gray-800">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    <button
                                      onClick={() => setShowMoreQuestionBlocks(!showMoreQuestionBlocks)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                                    >
                                      {showMoreQuestionBlocks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      {showMoreQuestionBlocks ? (locale === 'fr' ? 'Moins' : 'Less') : (locale === 'fr' ? 'Plus' : 'More')}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Scales Row */}
                              <div className="flex items-start gap-6 py-3 border-b border-gray-100">
                                <div className="flex-1">
                                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                                    {locale === 'fr' ? 'Échelles' : 'Scales'}
                                  </p>
                                  <div className="flex gap-1">
                                    {blockTypes.filter(bt => ['likert'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-600" />
                                          <span className="text-xs text-amber-600 group-hover:text-amber-700">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Media Row */}
                              <div className="flex items-start gap-6 pt-3">
                                <div className="flex-1">
                                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">
                                    {locale === 'fr' ? 'Format de réponse' : 'Media'}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {blockTypes.filter(bt => ['file_response', 'audio_response'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-green-500 group-hover:text-green-600" />
                                          <span className="text-xs text-green-600 group-hover:text-green-700">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    {showMoreMediaBlocks && blockTypes.filter(bt => ['video_response'].includes(bt.type)).map((bt) => {
                                      const Icon = bt.icon
                                      return (
                                        <button
                                          key={bt.type}
                                          onClick={() => addBlock(bt.type)}
                                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors group"
                                        >
                                          <Icon className="w-3.5 h-3.5 text-green-500 group-hover:text-green-600" />
                                          <span className="text-xs text-green-600 group-hover:text-green-700">{lt(bt.label, locale)}</span>
                                        </button>
                                      )
                                    })}
                                    <button
                                      onClick={() => setShowMoreMediaBlocks(!showMoreMediaBlocks)}
                                      className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                                    >
                                      {showMoreMediaBlocks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                      {showMoreMediaBlocks ? (locale === 'fr' ? 'Moins' : 'Less') : (locale === 'fr' ? 'Plus' : 'More')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              </>
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
                          <p>{locale === 'fr' ? 'Aucune étape ajoutée' : 'No blocks added yet'}</p>
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
                      <div className={`px-6 py-4 border-b ${testSubmitted ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
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
                                <UserCheck className="w-5 h-5 text-gray-700" />
                                <span className="font-medium text-gray-800">
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
                                  className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg rounded-xl py-6 text-lg"
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
                                {/* Score Display - Show when scoring is enabled */}
                                {enableScoring && (
                                  <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-700">
                                        {locale === 'fr' ? 'Score total' : 'Total Score'}
                                      </span>
                                      <span className="text-2xl font-bold text-emerald-600">
                                        {calculateTestScore()} / {calculateMaxScore()}
                                      </span>
                                    </div>
                                    <div className="text-sm text-emerald-700 font-medium">
                                      {locale === 'fr' ? 'Interprétation: ' : 'Interpretation: '}
                                      <span className="font-bold">{getScoreInterpretation(calculateTestScore())}</span>
                                    </div>
                                  </div>
                                )}

                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  {locale === 'fr' ? 'Résumé des réponses' : 'Response Summary'}
                                </h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                  {blocks.filter(b => ['prompt', 'checklist', 'scale', 'likert', 'numeric', 'slider', 'multiple_choice', 'yes_no', 'mood', 'matrix_rating'].includes(b.type)).map(block => (
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
                                        {block.type === 'likert' && (
                                          testResponses[block.id] !== undefined
                                            ? block.scaleLabels?.[testResponses[block.id]] || testResponses[block.id]
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'numeric' && (
                                          testResponses[block.id] !== undefined
                                            ? testResponses[block.id]
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'slider' && (
                                          testResponses[block.id] !== undefined
                                            ? `${testResponses[block.id]}${block.sliderUnit || ''}`
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'multiple_choice' && (
                                          testResponses[block.id] !== undefined
                                            ? block.choices?.[testResponses[block.id]] || testResponses[block.id]
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'yes_no' && (
                                          testResponses[block.id]
                                            ? (testResponses[block.id] === 'yes' ? (locale === 'fr' ? 'Oui' : 'Yes') : (locale === 'fr' ? 'Non' : 'No'))
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'mood' && (
                                          testResponses[block.id] !== undefined
                                            ? block.moodOptions?.find(m => m.value === testResponses[block.id])?.emoji || testResponses[block.id]
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
                                        )}
                                        {block.type === 'matrix_rating' && (
                                          testResponses[block.id] && Object.keys(testResponses[block.id]).length > 0
                                            ? (() => {
                                                const ratings = testResponses[block.id] as Record<string, number>
                                                const total = Object.values(ratings).reduce((sum, val) => sum + (val || 0), 0)
                                                const maxPossible = (block.matrixItems?.length || 0) * (block.matrixScaleMax || 5)
                                                return `${total} / ${maxPossible} (${Object.entries(ratings).map(([item, val]) => `${item}: ${val}`).join(', ')})`
                                              })()
                                            : <span className="text-gray-400 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>
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
                            <p>{locale === 'fr' ? 'Aucune étape ajoutée' : 'No blocks added yet'}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar — autosave status + Continue + live preview.
                    The autosave pill and Continue button sit above the
                    preview phone (moved here from the editor header so
                    the header stays minimal). The preview itself auto-
                    detects interactive vs reading mode and lets the
                    practitioner walk through their own worksheet. */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-between">
                    {/* Auto-save status indicator */}
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
                            {locale === 'fr' ? 'À modifier plus tard' : 'Edit later'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Quick save when editing an already-published
                          resource so practitioners can make a content
                          tweak without walking through the 3-step flow. */}
                      {isEditMode && saveAs === 'published' && (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!canProceedToDetails || isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg rounded-xl"
                          >
                            {isSaving ? (
                              <>
                                <span className="w-3.5 h-3.5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                                {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                              </>
                            ) : (
                              <>
                                <Save className="w-3.5 h-3.5 mr-1.5" />
                                {locale === 'fr' ? 'Enregistrer' : 'Save'}
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          size="sm"
                          variant={isEditMode && saveAs === 'published' ? 'outline' : 'default'}
                          onClick={handleContinueToDetails}
                          disabled={!canProceedToDetails}
                          className={
                            isEditMode && saveAs === 'published'
                              ? 'rounded-xl'
                              : 'bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl'
                          }
                        >
                          {isEditMode && saveAs === 'published'
                            ? (locale === 'fr' ? 'Détails' : 'Details')
                            : (locale === 'fr' ? 'Continuer' : 'Continue')
                          }
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <ResourcePreview blocks={blocks} title={title} />
                </div>
              </div>
              </>}
            </motion.div>
          )}

          {/* Step 3: Details — rendered as a modal over the builder so
              the editor + preview stay visible behind. Click the
              backdrop to dismiss. */}
          {step === 'details' && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
              onClick={(e) => { if (e.target === e.currentTarget) setStep('build') }}
            >
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6"
            >
              {/* Floating back button — outer modal chrome removed so
                  the inner section cards are the only visible "popup". */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-start mb-4"
              >
                <motion.div whileHover={{ x: -4 }} className="inline-block">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (detailsStep === 1) {
                        setStep('build')
                      } else {
                        setDetailsStep(1)
                      }
                    }}
                    className="rounded-xl bg-white/90 hover:bg-white shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {detailsStep === 1
                      ? (locale === 'fr' ? 'Revenir au contenu' : 'Back to content')
                      : (locale === 'fr' ? 'Précédent' : 'Previous')
                    }
                  </Button>
                </motion.div>
              </motion.div>

              <div>

              {/* Step 1: Details */}
              {detailsStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto"
                >
                {/* Description & Category */}
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
                    placeholder={locale === 'fr' ? 'Décrivez brièvement cet exercice...' : 'Briefly describe this worksheet...'}
                    className="mb-4"
                  />

                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    {locale === 'fr' ? 'Catégorie' : 'Category'}
                    <span className="text-red-500 ml-1">*</span>
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
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        {t.library.categories[category]}
                      </motion.button>
                    ))}
                  </div>

                  {/* Language Section */}
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6">
                    {locale === 'fr' ? 'Langue' : 'Language'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'fr', label: 'Français' },
                      { code: 'es', label: 'Español' },
                      { code: 'de', label: 'Deutsch' },
                      { code: 'it', label: 'Italiano' },
                      { code: 'pt', label: 'Português' },
                      { code: 'nl', label: 'Nederlands' },
                    ].map((lang) => (
                      <motion.button
                        key={lang.code}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setResourceLanguage(lang.code)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          resourceLanguage === lang.code
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${resourceLanguage === lang.code ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{lang.code.toUpperCase()}</span>
                        {lang.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Continue Button for Step 1 */}
                <div className="flex items-center justify-between mt-6">
                  {/* Validation message */}
                  {(!description.trim() || !selectedCategory) && (
                    <p className="text-sm text-amber-600">
                      {locale === 'fr' ? '* Veuillez remplir tous les champs' : '* Please fill in all fields'}
                    </p>
                  )}
                  {description.trim() && selectedCategory && <div />}

                  <motion.div whileHover={description.trim() && selectedCategory ? { scale: 1.02 } : {}} whileTap={description.trim() && selectedCategory ? { scale: 0.98 } : {}}>
                    <Button
                      onClick={() => setDetailsStep(3)}
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

              {/* Step 2: Scoring */}
              {detailsStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-2xl mx-auto"
                >
                  <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6 mb-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {locale === 'fr' ? 'Configuration de la notation' : 'Scoring Configuration'}
                      </h2>
                      <p className="text-gray-500">
                        {getScorableBlocksCount() > 0
                          ? (locale === 'fr' ? 'Configurez le calcul automatique des scores pour vos questions' : 'Configure automatic score calculation for your questions')
                          : (locale === 'fr' ? 'Aucune question notable dans cet exercice' : 'No scorable questions in this worksheet')
                        }
                      </p>
                    </div>

                {/* Scoring Section - Only show if there are scorable blocks */}
                {getScorableBlocksCount() > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          {locale === 'fr' ? 'Calcul des scores' : 'Scoring & Assessment'}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'Activer le calcul automatique des scores' : 'Enable automatic score calculation'}
                        </p>
                      </div>
                      <button
                        onClick={() => setEnableScoring(!enableScoring)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          enableScoring ? 'bg-emerald-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            enableScoring ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {enableScoring && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          {/* Score breakdown */}
                          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                {locale === 'fr' ? 'Score maximum possible' : 'Maximum possible score'}
                              </span>
                              <span className="text-2xl font-bold text-emerald-600">{calculateMaxScore()} pts</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {locale === 'fr'
                                ? `${getScorableBlocksCount()} question(s) seront notées`
                                : `${getScorableBlocksCount()} question(s) will be scored`}
                            </p>
                          </div>

                          {/* Interpretation Ranges */}
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">
                              {locale === 'fr' ? 'Plages d\'interprétation' : 'Interpretation Ranges'}
                            </h3>
                            <div className="space-y-2">
                              {scoringRanges.map((range, index) => {
                                const colors = [
                                  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
                                  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
                                  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                                  { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
                                ]
                                const color = colors[index] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }

                                return (
                                  <div key={index} className={`flex items-center gap-3 p-3 rounded-xl ${color.bg} border ${color.border}`}>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={range.min}
                                        onChange={(e) => {
                                          const newRanges = [...scoringRanges]
                                          newRanges[index].min = parseInt(e.target.value) || 0
                                          setScoringRanges(newRanges)
                                        }}
                                        className="w-14 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                      />
                                      <span className="text-gray-400">-</span>
                                      <input
                                        type="number"
                                        value={range.max}
                                        onChange={(e) => {
                                          const newRanges = [...scoringRanges]
                                          newRanges[index].max = parseInt(e.target.value) || 0
                                          setScoringRanges(newRanges)
                                        }}
                                        className="w-14 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                      />
                                      <span className="text-xs text-gray-400">pts</span>
                                    </div>
                                    <span className="text-gray-400">=</span>
                                    <input
                                      type="text"
                                      value={lt(range.label, locale)}
                                      onChange={(e) => {
                                        const newRanges = [...scoringRanges]
                                        newRanges[index].label = { ...newRanges[index].label, [locale]: e.target.value }
                                        setScoringRanges(newRanges)
                                      }}
                                      className={`flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium ${color.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Show Score to Member */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {locale === 'fr' ? 'Afficher le score au patient' : 'Show Score to Member'}
                              </label>
                              <p className="text-xs text-gray-500">
                                {locale === 'fr'
                                  ? 'Le patient verra son score après avoir complété l\'exercice'
                                  : 'Member will see their score after submission'}
                              </p>
                            </div>
                            <button
                              onClick={() => setShowScoreToMember(!showScoreToMember)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                showScoreToMember ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                                  showScoreToMember ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
                  </div>

                  {/* Continue Button for Step 2 */}
                  <div className="flex justify-end mt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setDetailsStep(3)}
                        className="bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl px-8"
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
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {locale === 'fr' ? 'Publier votre exercice' : 'Publish Your Worksheet'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                      {locale === 'fr' ? 'Choisissez comment enregistrer et partager votre exercice' : 'Choose how to save and share your worksheet'}
                    </p>

                    {/* Save As */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {locale === 'fr' ? 'Enregistré comme' : 'Save as'}
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
                              {locale === 'fr' ? 'À modifier plus tard' : 'Edit later'}
                            </span>
                          </div>
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
                              {locale === 'fr' ? 'Prêt à être partagé' : 'Ready to share'}
                            </span>
                          </div>
                        </motion.button>
                      </div>

                      {/* Reassurance once "Ready to share" is picked.
                          Replaces the visibility picker (hidden under
                          SHOW_VISIBILITY_PICKER) so the practitioner
                          still gets a clear answer to "wait, who sees
                          this when I publish?" */}
                      {saveAs === 'published' && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100"
                        >
                          <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            {locale === 'fr'
                              ? 'Une fois publiée, cette ressource ne sera visible que par les patients avec qui vous la partagerez.'
                              : 'Once published, this resource will only be visible to the members you share it with.'}
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Visibility - only show when publishing AND the
                        SHOW_VISIBILITY_PICKER flag is on. Hidden today
                        because Public + external-link sharing aren't
                        live yet. */}
                    {saveAs === 'published' && SHOW_VISIBILITY_PICKER && (
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
                            className="mt-4 p-3 bg-blue-50 rounded-xl border border-gray-200"
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
                      {locale === 'fr' ? 'Récapitulatif des étapes' : 'Content Summary'}
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
                              {block.content || (blockType ? lt(blockType.label, locale) : '')}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Recurring toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Récurrent' : 'Recurring'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {locale === 'fr' ? 'Le patient pourra remplir cet exercice plusieurs fois' : 'Patient can fill this worksheet multiple times'}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isRecurring ? 'bg-teal-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isRecurring ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl px-10"
                      >
                        {isSaving ? (
                          <>
                            <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {saveAs === 'published'
                              ? (locale === 'fr' ? 'Créer l\'exercice' : 'Create the exercise')
                              : (locale === 'fr' ? 'Enregistrer le brouillon' : 'Save Draft')
                            }
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
                </motion.div>
              )}
              </div>
            </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

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
              className="flex-1 sm:flex-none bg-blue-500 hover:bg-gray-800"
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

      {/* PDF Viewer Popup */}
      {pdfViewerUrl && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center" onClick={() => setPdfViewerUrl(null)}>
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <a href={pdfViewerUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <ExternalLink className="w-5 h-5" />
            </a>
            <button onClick={() => setPdfViewerUrl(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe
            src={pdfViewerUrl}
            className="w-[90%] h-[85vh] rounded-xl bg-white shadow-2xl"
            title="PDF Document"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* PDF Import Setup Dialog — simplified */}
      {showPdfSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowPdfSetup(false); setPdfFile(null) }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with PDF icon */}
            <div className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Importer un PDF' : 'Import PDF'}
                  </h3>
                  <p className="text-sm text-gray-500 truncate mt-0.5" title={pdfFile?.name}>
                    {pdfFile?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Language detected */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-600">
                  {locale === 'fr' ? 'Langue détectée' : 'Language detected'}
                </span>
                <span className="text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100">
                  {pdfDetectedLang === 'fr' ? 'Français' : 'English'}
                </span>
              </div>

              {/* Info text */}
              <p className="text-xs text-gray-400 leading-relaxed">
                {locale === 'fr'
                  ? 'Bloom va analyser votre document et extraire les questions telles qu\'elles apparaissent. Si aucune question n\'est trouvée, le PDF sera ajouté en tant que document de lecture.'
                  : 'Bloom will analyze your document and extract questions exactly as they appear. If no questions are found, the PDF will be added as a reading document.'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowPdfSetup(false); setPdfFile(null) }}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handlePdfImport}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                {locale === 'fr' ? 'Convertir' : 'Convert'} &rarr;
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* PDF Split Modal */}
      {showPdfSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowPdfSplit(false); setSplitBlockId(null) }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 pb-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {locale === 'fr' ? 'Découper le PDF' : 'Split PDF'}
                  </h3>
                  <p className="text-xs text-gray-400">{splitTotalPages} pages</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Page range selector */}
              <div className="flex items-center justify-center gap-2">
                <select
                  value={splitRanges[0]?.from || 1}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    setSplitRanges([{ from: val, to: Math.max(val, splitRanges[0]?.to || val) }])
                  }}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  {Array.from({ length: splitTotalPages }, (_, p) => p + 1).map(p => (
                    <option key={p} value={p}>Page {p}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400">{locale === 'fr' ? 'à' : 'to'}</span>
                <select
                  value={splitRanges[0]?.to || 1}
                  onChange={e => {
                    const val = parseInt(e.target.value)
                    setSplitRanges([{ from: splitRanges[0]?.from || 1, to: val }])
                  }}
                  className="h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  {Array.from({ length: splitTotalPages - (splitRanges[0]?.from || 1) + 1 }, (_, p) => (splitRanges[0]?.from || 1) + p).map(p => (
                    <option key={p} value={p}>Page {p}</option>
                  ))}
                </select>
              </div>

              {/* Page thumbnails */}
              <div ref={splitThumbsRef} className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2">
                {splitThumbsLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">{locale === 'fr' ? 'Chargement des pages...' : 'Loading pages...'}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {splitThumbnails.map((thumb, i) => {
                      const pageNum = i + 1
                      const isSelected = pageNum >= (splitRanges[0]?.from || 1) && pageNum <= (splitRanges[0]?.to || 1)
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            const current = splitRanges[0] || { from: 1, to: 1 }
                            // Click to set from or expand to
                            if (pageNum < current.from || pageNum > current.to) {
                              if (pageNum < current.from) {
                                setSplitRanges([{ from: pageNum, to: current.to }])
                              } else {
                                setSplitRanges([{ from: current.from, to: pageNum }])
                              }
                            }
                          }}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-gray-900 shadow-sm'
                              : 'border-transparent opacity-40 hover:opacity-70'
                          }`}
                        >
                          <img src={thumb} alt={`Page ${pageNum}`} className="w-full h-auto" />
                          <span className={`absolute bottom-0 left-0 right-0 text-center text-[10px] py-0.5 ${
                            isSelected ? 'bg-gray-900 text-white' : 'bg-black/40 text-white'
                          }`}>
                            {pageNum}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowPdfSplit(false); setSplitBlockId(null) }}
                disabled={isSplitting}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handlePdfSplit}
                disabled={isSplitting}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSplitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {locale === 'fr' ? 'Découpage...' : 'Splitting...'}</>
                ) : (
                  <><Scissors className="w-3.5 h-3.5" /> {locale === 'fr' ? 'Découper' : 'Split'}</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
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

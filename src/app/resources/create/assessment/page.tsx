'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Eye,
  ClipboardCheck,
  Plus,
  Trash2,
  GripVertical,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Copy,
  Lightbulb,
  Calculator,
  Info,
  UserCheck,
  Send,
  CheckCircle2,
  RotateCcw,
  Star,
  Smile,
  ListChecks,
  Gauge,
  Lock,
  Globe,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createResource, getResourceById, updateResource } from '@/lib/services/resources'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ResourceCategory } from '@/types/library'

// Question types for assessment
type QuestionType = 'multiple_choice' | 'likert' | 'yes_no' | 'numeric' | 'checklist' | 'scale' | 'mood' | 'slider'

interface AssessmentQuestion {
  id: string
  type: QuestionType
  question: string
  required: boolean
  // For multiple choice
  options?: string[]
  // For likert scale
  scaleLabels?: string[]
  scaleRange?: number
  // For numeric
  minValue?: number
  maxValue?: number
  // For scale (rating)
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  // For checklist
  items?: string[]
  // For mood
  moodOptions?: { emoji: string; label: string; value: number }[]
  // For slider
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  sliderUnit?: string
  // Scoring
  scoring?: { [key: string]: number }
}

interface QuestionTypeOption {
  type: QuestionType
  icon: React.ElementType
  label: { en: string; fr: string }
  description: { en: string; fr: string }
}

const questionTypes: QuestionTypeOption[] = [
  {
    type: 'multiple_choice',
    icon: CircleDot,
    label: { en: 'Multiple Choice', fr: 'Choix multiple' },
    description: { en: 'Single selection from options', fr: 'Sélection unique parmi des options' },
  },
  {
    type: 'likert',
    icon: SlidersHorizontal,
    label: { en: 'Likert Scale', fr: 'Échelle de Likert' },
    description: { en: 'Agreement or frequency scale', fr: 'Échelle d\'accord ou de fréquence' },
  },
  {
    type: 'yes_no',
    icon: ToggleLeft,
    label: { en: 'Yes/No', fr: 'Oui/Non' },
    description: { en: 'Binary choice question', fr: 'Question à choix binaire' },
  },
  {
    type: 'scale',
    icon: Star,
    label: { en: 'Rating Scale', fr: 'Échelle de notation' },
    description: { en: 'Rate on a numeric scale', fr: 'Évaluer sur une échelle numérique' },
  },
  {
    type: 'checklist',
    icon: ListChecks,
    label: { en: 'Checklist', fr: 'Liste à cocher' },
    description: { en: 'Multiple items to check', fr: 'Plusieurs éléments à cocher' },
  },
  {
    type: 'mood',
    icon: Smile,
    label: { en: 'Mood Selector', fr: 'Sélecteur d\'humeur' },
    description: { en: 'Select mood with emoji', fr: 'Sélectionner l\'humeur avec emoji' },
  },
  {
    type: 'slider',
    icon: Gauge,
    label: { en: 'Slider', fr: 'Curseur' },
    description: { en: 'Slide to select value', fr: 'Glisser pour sélectionner' },
  },
  {
    type: 'numeric',
    icon: Calculator,
    label: { en: 'Numeric Input', fr: 'Entrée numérique' },
    description: { en: 'Enter a number', fr: 'Entrer un nombre' },
  },
]

// Default mood options
const defaultMoodOptions = [
  { emoji: '😢', label: 'Very Bad', value: 1 },
  { emoji: '😔', label: 'Bad', value: 2 },
  { emoji: '😐', label: 'Neutral', value: 3 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😊', label: 'Very Good', value: 5 },
]

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

// Default Likert scales
const likertPresets = {
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

// Assessment templates
const assessmentTemplates = [
  {
    id: 'phq-style',
    name: { en: 'Depression Screening', fr: 'Dépistage dépression' },
    description: { en: 'PHQ-style symptom checklist', fr: 'Liste de symptômes type PHQ' },
    questions: [
      {
        id: '1',
        type: 'likert' as QuestionType,
        question: 'Little interest or pleasure in doing things',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
      {
        id: '2',
        type: 'likert' as QuestionType,
        question: 'Feeling down, depressed, or hopeless',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
      {
        id: '3',
        type: 'likert' as QuestionType,
        question: 'Trouble falling or staying asleep, or sleeping too much',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
    ],
  },
  {
    id: 'gad-style',
    name: { en: 'Anxiety Screening', fr: 'Dépistage anxiété' },
    description: { en: 'GAD-style anxiety assessment', fr: 'Évaluation d\'anxiété type GAD' },
    questions: [
      {
        id: '1',
        type: 'likert' as QuestionType,
        question: 'Feeling nervous, anxious, or on edge',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
      {
        id: '2',
        type: 'likert' as QuestionType,
        question: 'Not being able to stop or control worrying',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
      {
        id: '3',
        type: 'likert' as QuestionType,
        question: 'Worrying too much about different things',
        required: true,
        scaleLabels: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
        scaleRange: 4,
        scoring: { '0': 0, '1': 1, '2': 2, '3': 3 },
      },
    ],
  },
  {
    id: 'blank',
    name: { en: 'Blank Assessment', fr: 'Évaluation vierge' },
    description: { en: 'Start from scratch', fr: 'Commencer de zéro' },
    questions: [],
  },
]

function CreateAssessmentContent() {
  const { t, locale } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // Step state - start at 'build' if editing, otherwise 'template'
  const [step, setStep] = useState<'template' | 'build' | 'scoring' | 'details'>(editId ? 'build' : 'template')

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(!!editId)
  const [isLoading, setIsLoading] = useState(!!editId)

  // Assessment state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')
  const [showScoreToMember, setShowScoreToMember] = useState(true)

  // Scoring state
  const [enableScoring, setEnableScoring] = useState(true)
  const [scoringRanges, setScoringRanges] = useState([
    { min: 0, max: 4, label: { en: 'Minimal', fr: 'Minimal' } },
    { min: 5, max: 9, label: { en: 'Mild', fr: 'Léger' } },
    { min: 10, max: 14, label: { en: 'Moderate', fr: 'Modéré' } },
    { min: 15, max: 100, label: { en: 'Severe', fr: 'Sévère' } },
  ])

  // UI state
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedLikertPreset, setSelectedLikertPreset] = useState<string>('frequency')

  // View mode: 'edit' | 'preview' | 'test'
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'test'>('edit')

  // Test mode responses
  const [testResponses, setTestResponses] = useState<Record<string, any>>({})
  const [testSubmitted, setTestSubmitted] = useState(false)

  // Load existing resource for edit mode
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

      setIsLoading(true)
      try {
        // Get current user
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

          // Load assessment-specific settings
          const settings = resource.settings as any
          if (settings) {
            if (settings.instructions) {
              setInstructions(typeof settings.instructions === 'string' ? settings.instructions : (settings.instructions as Record<string, string>)?.[locale] || '')
            }
            if (settings.questions) {
              // Map stored questions to component format
              const loadedQuestions = settings.questions.map((q: any) => ({
                id: q.id || Math.random().toString(36).substr(2, 9),
                type: q.type,
                // Support both 'text' and 'question' field names for backwards compatibility
                question: typeof q.text === 'string' ? q.text : (typeof q.question === 'string' ? q.question : (q.text as Record<string, string>)?.[locale] || (q.question as Record<string, string>)?.[locale] || ''),
                required: q.required ?? true,
                // Multiple choice options
                options: q.options?.map((opt: any) =>
                  typeof opt === 'string' ? opt : (typeof opt.label === 'string' ? opt.label : (opt.label as Record<string, string>)?.[locale] || '')
                ),
                // Likert scale
                scaleLabels: q.likertLabels ? [
                  typeof q.likertLabels.start === 'string' ? q.likertLabels.start : (q.likertLabels.start as Record<string, string>)?.[locale] || '',
                  ...(q.likertLabels.middle || []).map((m: any) => typeof m === 'string' ? m : (m as Record<string, string>)?.[locale] || ''),
                  typeof q.likertLabels.end === 'string' ? q.likertLabels.end : (q.likertLabels.end as Record<string, string>)?.[locale] || ''
                ] : q.scaleLabels,
                scaleRange: q.scaleRange,
                // Scale (rating)
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                scaleMinLabel: typeof q.scaleMinLabel === 'string' ? q.scaleMinLabel : (q.scaleMinLabel as Record<string, string>)?.[locale] || '',
                scaleMaxLabel: typeof q.scaleMaxLabel === 'string' ? q.scaleMaxLabel : (q.scaleMaxLabel as Record<string, string>)?.[locale] || '',
                // Checklist items
                items: q.items?.map((item: any) =>
                  typeof item === 'string' ? item : (typeof item.text === 'string' ? item.text : (item.text as Record<string, string>)?.[locale] || '')
                ),
                // Mood options
                moodOptions: q.moodOptions?.map((mood: any) => ({
                  emoji: mood.emoji,
                  label: typeof mood.label === 'string' ? mood.label : (mood.label as Record<string, string>)?.[locale] || '',
                  value: mood.value
                })),
                // Slider
                sliderMin: q.sliderMin,
                sliderMax: q.sliderMax,
                sliderStep: q.sliderStep,
                sliderUnit: q.sliderUnit,
                // Numeric
                minValue: q.minValue,
                maxValue: q.maxValue,
                // Scoring
                scoring: q.scoring,
              }))
              setQuestions(loadedQuestions)
            }
            if (settings.enableScoring !== undefined) {
              setEnableScoring(settings.enableScoring)
            }
            if (settings.showScoreToMember !== undefined) {
              setShowScoreToMember(settings.showScoreToMember)
            }
            if (settings.scoringRanges) {
              // Map scoring ranges - extract locale-specific labels if needed
              const loadedRanges = settings.scoringRanges.map((range: any) => ({
                min: range.min,
                max: range.max,
                label: typeof range.label === 'string'
                  ? { en: range.label, fr: range.label }
                  : range.label,
                description: range.description ? (
                  typeof range.description === 'string'
                    ? { en: range.description, fr: range.description }
                    : range.description
                ) : undefined
              }))
              setScoringRanges(loadedRanges)
            }
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
    const template = assessmentTemplates.find(t => t.id === templateId)
    if (template) {
      if (template.id === 'blank') {
        setQuestions([])
        setTitle('')
      } else {
        setQuestions(template.questions.map(q => ({ ...q, id: generateId() })))
        setTitle(template.name[locale])
      }
      setStep('build')
    }
  }

  // Add new question
  const addQuestion = (type: QuestionType) => {
    const preset = likertPresets[selectedLikertPreset as keyof typeof likertPresets]
    const newQuestion: AssessmentQuestion = {
      id: generateId(),
      type,
      question: '',
      required: true,
      ...(type === 'multiple_choice' && { options: ['', ''] }),
      ...(type === 'likert' && {
        scaleLabels: preset[locale],
        scaleRange: preset[locale].length,
        scoring: preset[locale].reduce((acc, _, i) => ({ ...acc, [i.toString()]: i }), {}),
      }),
      ...(type === 'yes_no' && {
        scoring: { 'yes': 1, 'no': 0 },
      }),
      ...(type === 'numeric' && {
        minValue: 0,
        maxValue: 10,
      }),
      ...(type === 'scale' && {
        scaleMin: 1,
        scaleMax: 10,
        scaleMinLabel: '',
        scaleMaxLabel: '',
      }),
      ...(type === 'checklist' && {
        items: ['', ''],
      }),
      ...(type === 'mood' && {
        moodOptions: defaultMoodOptions,
      }),
      ...(type === 'slider' && {
        sliderMin: 0,
        sliderMax: 100,
        sliderStep: 1,
        sliderUnit: '%',
      }),
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
    setShowQuestionPicker(false)
  }

  // Update question
  const updateQuestion = (id: string, updates: Partial<AssessmentQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  // Delete question
  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  // Duplicate question
  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id)
    if (question) {
      const newQuestion = { ...question, id: generateId() }
      const index = questions.findIndex(q => q.id === id)
      const newQuestions = [...questions]
      newQuestions.splice(index + 1, 0, newQuestion)
      setQuestions(newQuestions)
    }
  }

  // Add option to multiple choice
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      updateQuestion(questionId, { options: [...question.options, ''] })
    }
  }

  // Update option
  const updateOption = (questionId: string, index: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = [...question.options]
      newOptions[index] = value
      updateQuestion(questionId, { options: newOptions })
    }
  }

  // Delete option
  const deleteOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== index)
      updateQuestion(questionId, { options: newOptions })
    }
  }

  // Add checklist item
  const addChecklistItem = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.items) {
      updateQuestion(questionId, { items: [...question.items, ''] })
    }
  }

  // Update checklist item
  const updateChecklistItem = (questionId: string, index: number, value: string) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.items) {
      const newItems = [...question.items]
      newItems[index] = value
      updateQuestion(questionId, { items: newItems })
    }
  }

  // Delete checklist item
  const deleteChecklistItem = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId)
    if (question && question.items && question.items.length > 1) {
      const newItems = question.items.filter((_, i) => i !== index)
      updateQuestion(questionId, { items: newItems })
    }
  }

  // Apply likert preset
  const applyLikertPreset = (questionId: string, presetKey: string) => {
    const preset = likertPresets[presetKey as keyof typeof likertPresets]
    if (preset) {
      updateQuestion(questionId, {
        scaleLabels: preset[locale],
        scaleRange: preset[locale].length,
        scoring: preset[locale].reduce((acc, _, i) => ({ ...acc, [i.toString()]: i }), {}),
      })
    }
  }

  // Calculate max possible score
  const calculateMaxScore = () => {
    return questions.reduce((total, q) => {
      if (q.type === 'likert' && q.scoring) {
        return total + Math.max(...Object.values(q.scoring))
      }
      if (q.type === 'yes_no') return total + 1
      if (q.type === 'numeric') return total + (q.maxValue || 10)
      if (q.type === 'scale') return total + (q.scaleMax || 10)
      if (q.type === 'slider') return total + (q.sliderMax || 100)
      if (q.type === 'multiple_choice' && q.scoring) {
        return total + Math.max(...Object.values(q.scoring))
      }
      return total
    }, 0)
  }

  // Handle save
  const handleSave = async () => {
    if (!title || questions.length === 0) {
      toast.error(locale === 'fr' ? 'Veuillez ajouter un titre et au moins une question' : 'Please add a title and at least one question')
      return
    }

    setIsSaving(true)

    try {
      // Build assessment settings
      const assessmentSettings = {
        questions: questions.map(q => ({
          id: q.id,
          type: q.type,
          text: q.question, // Store as 'text' for consistency with loading
          required: q.required,
          options: q.options,
          scoring: q.scoring,
          scaleLabels: q.scaleLabels,
          likertLabels: q.scaleLabels ? { start: q.scaleLabels[0], end: q.scaleLabels[q.scaleLabels.length - 1] } : undefined,
          minValue: q.minValue,
          maxValue: q.maxValue,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          scaleMinLabel: q.scaleMinLabel,
          scaleMaxLabel: q.scaleMaxLabel,
          items: q.items,
          moodOptions: q.moodOptions,
          sliderMin: q.sliderMin,
          sliderMax: q.sliderMax,
          sliderStep: q.sliderStep,
          sliderUnit: q.sliderUnit,
        })),
        enableScoring,
        showScoreToMember,
        scoringRanges,
        instructions,
      }

      if (isEditMode && editId) {
        // Update existing resource
        await updateResource(editId, {
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: [],
          settings: assessmentSettings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Évaluation mise à jour avec succès!' : 'Assessment updated successfully!')
      } else {
        // Create new resource
        await createResource({
          type: 'assessment',
          title,
          description: description || undefined,
          category: selectedCategory || undefined,
          blocks: [], // Assessments use settings.questions instead of blocks
          settings: assessmentSettings,
          status: saveAs,
          visibility,
        })
        toast.success(locale === 'fr' ? 'Évaluation créée avec succès!' : 'Assessment created successfully!')
      }

      router.push('/resources')
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving assessment')
    } finally {
      setIsSaving(false)
    }
  }

  // Check if can proceed to scoring
  const canProceedToScoring = title.trim() && questions.length > 0

  // Reset test mode
  const resetTestMode = () => {
    setTestResponses({})
    setTestSubmitted(false)
  }

  // Handle test submit
  const handleTestSubmit = () => {
    setTestSubmitted(true)
  }

  // Calculate test score
  const calculateTestScore = () => {
    let score = 0
    questions.forEach(q => {
      const response = testResponses[q.id]
      if (response !== undefined) {
        if ((q.type === 'likert' || q.type === 'multiple_choice') && q.scoring) {
          score += q.scoring[response.toString()] || 0
        } else if (q.type === 'yes_no') {
          // yes_no: if scoring exists use it, otherwise yes=1, no=0
          if (q.scoring) {
            score += q.scoring[response] || 0
          } else {
            score += response === 'yes' ? 1 : 0
          }
        } else if (q.type === 'numeric' || q.type === 'scale' || q.type === 'slider') {
          // numeric/scale/slider: the entered value IS the score
          const numValue = typeof response === 'number' ? response : parseInt(response)
          score += numValue || 0
        }
      }
    })
    return score
  }

  // Get score interpretation
  const getScoreInterpretation = (score: number) => {
    for (const range of scoringRanges) {
      if (score >= range.min && score <= range.max) {
        return range.label[locale]
      }
    }
    return ''
  }

  // Render question preview
  const renderQuestionPreview = (question: AssessmentQuestion, isInteractive: boolean) => {
    const questionType = questionTypes.find(qt => qt.type === question.type)
    const colors = getQuestionColors(question.type)

    return (
      <div key={question.id} className="mb-6">
        <div className="flex items-start gap-2 mb-3">
          <div className={`w-1.5 h-5 rounded-full flex-shrink-0 mt-0.5 ${colors.accent}`} />
          <p className="text-gray-900 font-medium">
            {question.question || questionType?.label[locale]}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </p>
        </div>

        {/* Multiple Choice */}
        {question.type === 'multiple_choice' && (
          <div className="ml-4 space-y-2">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isInteractive
                    ? testResponses[question.id] === index
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={testResponses[question.id] === index}
                  onChange={() => isInteractive && setTestResponses({ ...testResponses, [question.id]: index })}
                  disabled={!isInteractive || testSubmitted}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700">{option || `Option ${index + 1}`}</span>
              </label>
            ))}
          </div>
        )}

        {/* Likert Scale */}
        {question.type === 'likert' && (
          <div className="ml-4">
            <div className="flex flex-wrap gap-2">
              {question.scaleLabels?.map((label, index) => (
                <button
                  key={index}
                  onClick={() => isInteractive && !testSubmitted && setTestResponses({ ...testResponses, [question.id]: index })}
                  disabled={!isInteractive || testSubmitted}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    testResponses[question.id] === index
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  } ${!isInteractive || testSubmitted ? '' : 'cursor-pointer'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Yes/No */}
        {question.type === 'yes_no' && (
          <div className="ml-4 flex gap-3">
            <button
              onClick={() => isInteractive && !testSubmitted && setTestResponses({ ...testResponses, [question.id]: 'yes' })}
              disabled={!isInteractive || testSubmitted}
              className={`px-6 py-2.5 rounded-lg border font-medium transition-colors ${
                testResponses[question.id] === 'yes'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {locale === 'fr' ? 'Oui' : 'Yes'}
            </button>
            <button
              onClick={() => isInteractive && !testSubmitted && setTestResponses({ ...testResponses, [question.id]: 'no' })}
              disabled={!isInteractive || testSubmitted}
              className={`px-6 py-2.5 rounded-lg border font-medium transition-colors ${
                testResponses[question.id] === 'no'
                  ? 'border-gray-400 bg-gray-50 text-gray-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {locale === 'fr' ? 'Non' : 'No'}
            </button>
          </div>
        )}

        {/* Numeric */}
        {question.type === 'numeric' && (
          <div className="ml-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{question.minValue || 0}</span>
              <input
                type="range"
                min={question.minValue || 0}
                max={question.maxValue || 10}
                value={testResponses[question.id] ?? question.minValue ?? 0}
                onChange={(e) => isInteractive && setTestResponses({ ...testResponses, [question.id]: parseInt(e.target.value) })}
                disabled={!isInteractive || testSubmitted}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-sm text-gray-500">{question.maxValue || 10}</span>
              <span className="w-12 text-center font-semibold text-emerald-600">
                {testResponses[question.id] ?? '-'}
              </span>
            </div>
          </div>
        )}

        {/* Rating Scale */}
        {question.type === 'scale' && (
          <div className="ml-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{question.scaleMinLabel || (locale === 'fr' ? 'Minimum' : 'Low')}</span>
              <span className="text-xs text-gray-500">{question.scaleMaxLabel || (locale === 'fr' ? 'Maximum' : 'High')}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: (question.scaleMax || 10) - (question.scaleMin || 1) + 1 }, (_, i) => {
                const value = (question.scaleMin || 1) + i
                const isSelected = testResponses[question.id] === value
                return (
                  <button
                    key={value}
                    onClick={() => isInteractive && !testSubmitted && setTestResponses({ ...testResponses, [question.id]: value })}
                    disabled={!isInteractive || testSubmitted}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-blue-50/50'
                    } ${!isInteractive || testSubmitted ? '' : 'cursor-pointer'}`}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Checklist */}
        {question.type === 'checklist' && (
          <div className="ml-4 space-y-2">
            {question.items?.map((item, index) => {
              const isChecked = (testResponses[question.id] || []).includes(index)
              return (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isInteractive
                      ? isChecked
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      if (!isInteractive || testSubmitted) return
                      const currentChecked = testResponses[question.id] || []
                      const newChecked = isChecked
                        ? currentChecked.filter((i: number) => i !== index)
                        : [...currentChecked, index]
                      setTestResponses({ ...testResponses, [question.id]: newChecked })
                    }}
                    disabled={!isInteractive || testSubmitted}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <span className="text-gray-700">{item || `Item ${index + 1}`}</span>
                </label>
              )
            })}
          </div>
        )}

        {/* Mood Selector */}
        {question.type === 'mood' && (
          <div className="ml-4">
            <div className="flex items-center justify-center gap-3">
              {question.moodOptions?.map((mood, index) => {
                const isSelected = testResponses[question.id] === mood.value
                return (
                  <button
                    key={index}
                    onClick={() => isInteractive && !testSubmitted && setTestResponses({ ...testResponses, [question.id]: mood.value })}
                    disabled={!isInteractive || testSubmitted}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-pink-400 bg-pink-50 scale-110'
                        : 'border-transparent hover:border-pink-200 hover:bg-pink-50/50'
                    } ${!isInteractive || testSubmitted ? '' : 'cursor-pointer'}`}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs text-gray-500">{mood.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Slider */}
        {question.type === 'slider' && (
          <div className="ml-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{question.sliderMin || 0}</span>
              <input
                type="range"
                min={question.sliderMin || 0}
                max={question.sliderMax || 100}
                step={question.sliderStep || 1}
                value={testResponses[question.id] ?? (question.sliderMin || 0)}
                onChange={(e) => isInteractive && setTestResponses({ ...testResponses, [question.id]: parseInt(e.target.value) })}
                disabled={!isInteractive || testSubmitted}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-sm text-gray-500">{question.sliderMax || 100}</span>
              <span className="w-20 text-center font-semibold text-violet-600">
                {testResponses[question.id] !== undefined ? `${testResponses[question.id]}${question.sliderUnit || ''}` : '-'}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Get question type colors
  const getQuestionColors = (type: QuestionType) => {
    const colors: Record<QuestionType, { bg: string; text: string; accent: string }> = {
      multiple_choice: { bg: 'bg-indigo-100', text: 'text-indigo-600', accent: 'bg-indigo-400' },
      likert: { bg: 'bg-emerald-100', text: 'text-emerald-600', accent: 'bg-emerald-400' },
      yes_no: { bg: 'bg-teal-100', text: 'text-teal-600', accent: 'bg-teal-400' },
      numeric: { bg: 'bg-amber-100', text: 'text-amber-600', accent: 'bg-amber-400' },
      scale: { bg: 'bg-blue-100', text: 'text-blue-600', accent: 'bg-blue-400' },
      checklist: { bg: 'bg-purple-100', text: 'text-purple-600', accent: 'bg-purple-400' },
      mood: { bg: 'bg-pink-100', text: 'text-pink-600', accent: 'bg-pink-400' },
      slider: { bg: 'bg-violet-100', text: 'text-violet-600', accent: 'bg-violet-400' },
    }
    return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-600', accent: 'bg-gray-400' }
  }

  // Render question editor
  const renderQuestionEditor = (question: AssessmentQuestion) => {
    const isExpanded = expandedQuestion === question.id
    const questionType = questionTypes.find(qt => qt.type === question.type)
    const Icon = questionType?.icon || ClipboardCheck
    const colors = getQuestionColors(question.type)

    return (
      <div
        className={`group transition-all ${isExpanded ? 'bg-white rounded-xl shadow-lg border border-gray-200' : ''}`}
      >
        {/* Question Header */}
        <div
          className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer rounded-lg transition-colors ${isExpanded ? 'bg-gray-50/80' : 'hover:bg-gray-100/60'}`}
          onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className={`w-1.5 h-5 rounded-full flex-shrink-0 ${colors.accent}`} />

          <Icon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">
              {question.question || <span className="text-gray-400">{questionType?.label[locale]}</span>}
            </p>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {question.required && (
              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded mr-1">
                {locale === 'fr' ? 'Requis' : 'Required'}
              </span>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); duplicateQuestion(question.id) }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id) }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`${isExpanded ? 'text-emerald-500' : 'text-gray-400'}`}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Question Content */}
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
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Question' : 'Question'}
                  </label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    placeholder={locale === 'fr' ? 'Entrez votre question...' : 'Enter your question...'}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Required Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {locale === 'fr' ? 'Réponse obligatoire' : 'Required answer'}
                  </span>
                  <button
                    onClick={() => updateQuestion(question.id, { required: !question.required })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      question.required ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        question.required ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Multiple Choice Options */}
                {question.type === 'multiple_choice' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Options de réponse' : 'Answer Options'}
                      </label>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {locale === 'fr' ? 'Points' : 'Points'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {question.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CircleDot className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(question.id, index, e.target.value)}
                            placeholder={`${locale === 'fr' ? 'Option' : 'Option'} ${index + 1}`}
                            className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={question.scoring?.[index.toString()] ?? 0}
                              min={0}
                              className="w-16 px-2 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-center text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                              onChange={(e) => {
                                const newScoring = { ...question.scoring, [index.toString()]: parseInt(e.target.value) || 0 }
                                updateQuestion(question.id, { scoring: newScoring })
                              }}
                            />
                            <span className="text-xs text-gray-400">{locale === 'fr' ? 'pts' : 'pts'}</span>
                          </div>
                          {(question.options?.length || 0) > 2 && (
                            <button
                              onClick={() => deleteOption(question.id, index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => addOption(question.id)}
                        className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
                      >
                        <Plus className="w-4 h-4" />
                        {locale === 'fr' ? 'Ajouter une option' : 'Add option'}
                      </button>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {locale === 'fr'
                          ? `Score max: ${Math.max(...Object.values(question.scoring || { '0': 0 }))} pts`
                          : `Max score: ${Math.max(...Object.values(question.scoring || { '0': 0 }))} pts`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Likert Scale */}
                {question.type === 'likert' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Type d\'échelle' : 'Scale Type'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(likertPresets).map((presetKey) => (
                          <button
                            key={presetKey}
                            onClick={() => applyLikertPreset(question.id, presetKey)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:text-emerald-700 transition-colors capitalize"
                          >
                            {presetKey === 'agreement' && (locale === 'fr' ? 'Accord' : 'Agreement')}
                            {presetKey === 'frequency' && (locale === 'fr' ? 'Fréquence' : 'Frequency')}
                            {presetKey === 'severity' && (locale === 'fr' ? 'Sévérité' : 'Severity')}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {locale === 'fr' ? 'Options de l\'échelle' : 'Scale Options'}
                        </label>
                        <span className="text-xs text-gray-500">
                          {locale === 'fr' ? 'Points attribués automatiquement' : 'Points assigned automatically'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {question.scaleLabels?.map((label, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
                                {index}
                              </span>
                              <span className="text-xs text-gray-400">{locale === 'fr' ? 'pts' : 'pts'}</span>
                            </div>
                            <input
                              type="text"
                              value={label}
                              onChange={(e) => {
                                const newLabels = [...(question.scaleLabels || [])]
                                newLabels[index] = e.target.value
                                updateQuestion(question.id, { scaleLabels: newLabels })
                              }}
                              className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {locale === 'fr'
                          ? `Score max pour cette question: ${(question.scaleLabels?.length || 1) - 1} pts`
                          : `Max score for this question: ${(question.scaleLabels?.length || 1) - 1} pts`}
                      </p>
                    </div>
                  </>
                )}

                {/* Yes/No */}
                {question.type === 'yes_no' && (
                  <div className="p-4 bg-teal-50/80 rounded-xl border border-teal-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Attribution des points' : 'Point Assignment'}
                      </span>
                      <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded">
                        {locale === 'fr' ? 'Score max: 1 pt' : 'Max score: 1 pt'}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium text-gray-700">{locale === 'fr' ? 'Oui' : 'Yes'}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">1 pt</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                        <span className="text-sm font-medium text-gray-700">{locale === 'fr' ? 'Non' : 'No'}</span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">0 pt</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Numeric */}
                {question.type === 'numeric' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur minimum' : 'Min Value'}
                        </label>
                        <select
                          value={question.minValue || 0}
                          onChange={(e) => updateQuestion(question.id, { minValue: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        >
                          {[0, 1].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur maximum' : 'Max Value'}
                        </label>
                        <select
                          value={question.maxValue || 10}
                          onChange={(e) => updateQuestion(question.id, { maxValue: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        >
                          {[5, 7, 10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-xs text-amber-700 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {locale === 'fr'
                          ? `Le nombre saisi par le membre sera son score (0-${question.maxValue || 10} pts)`
                          : `The number entered by the member will be their score (0-${question.maxValue || 10} pts)`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating Scale */}
                {question.type === 'scale' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur minimum' : 'Min Value'}
                        </label>
                        <select
                          value={question.scaleMin || 1}
                          onChange={(e) => updateQuestion(question.id, { scaleMin: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        >
                          {[0, 1].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Valeur maximum' : 'Max Value'}
                        </label>
                        <select
                          value={question.scaleMax || 10}
                          onChange={(e) => updateQuestion(question.id, { scaleMax: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
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
                          {locale === 'fr' ? 'Étiquette min' : 'Min Label'}
                        </label>
                        <input
                          type="text"
                          value={question.scaleMinLabel || ''}
                          onChange={(e) => updateQuestion(question.id, { scaleMinLabel: e.target.value })}
                          placeholder={locale === 'fr' ? 'ex: Pas du tout' : 'e.g., Not at all'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Étiquette max' : 'Max Label'}
                        </label>
                        <input
                          type="text"
                          value={question.scaleMaxLabel || ''}
                          onChange={(e) => updateQuestion(question.id, { scaleMaxLabel: e.target.value })}
                          placeholder={locale === 'fr' ? 'ex: Extrêmement' : 'e.g., Extremely'}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                    {/* Preview stars */}
                    <div className="flex items-center gap-1 p-3 bg-gray-50/80 rounded-xl">
                      {Array.from({ length: question.scaleMax || 10 }, (_, i) => (
                        <Star key={i} className="w-5 h-5 text-blue-300" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                {question.type === 'checklist' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Éléments de la liste' : 'Checklist Items'}
                    </label>
                    <div className="space-y-2">
                      {question.items?.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateChecklistItem(question.id, index, e.target.value)}
                            placeholder={`${locale === 'fr' ? 'Élément' : 'Item'} ${index + 1}`}
                            className="flex-1 px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                          />
                          {(question.items?.length || 0) > 1 && (
                            <button
                              onClick={() => deleteChecklistItem(question.id, index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addChecklistItem(question.id)}
                      className="mt-2 flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="w-4 h-4" />
                      {locale === 'fr' ? 'Ajouter un élément' : 'Add item'}
                    </button>
                  </div>
                )}

                {/* Mood Selector */}
                {question.type === 'mood' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Options d\'humeur' : 'Mood Options'}
                    </label>
                    <div className="flex items-center justify-center gap-3 p-4 bg-gray-50/80 rounded-xl">
                      {question.moodOptions?.map((mood, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <span className="text-3xl">{mood.emoji}</span>
                          <span className="text-xs text-gray-500">{mood.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      {locale === 'fr' ? 'Les options d\'humeur par défaut sont utilisées' : 'Default mood options are used'}
                    </p>
                  </div>
                )}

                {/* Slider */}
                {question.type === 'slider' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Minimum' : 'Min'}
                        </label>
                        <input
                          type="number"
                          value={question.sliderMin || 0}
                          onChange={(e) => updateQuestion(question.id, { sliderMin: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Maximum' : 'Max'}
                        </label>
                        <input
                          type="number"
                          value={question.sliderMax || 100}
                          onChange={(e) => updateQuestion(question.id, { sliderMax: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {locale === 'fr' ? 'Pas' : 'Step'}
                        </label>
                        <select
                          value={question.sliderStep || 1}
                          onChange={(e) => updateQuestion(question.id, { sliderStep: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                        >
                          {[1, 5, 10, 25].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Unité (optionnel)' : 'Unit (optional)'}
                      </label>
                      <input
                        type="text"
                        value={question.sliderUnit || ''}
                        onChange={(e) => updateQuestion(question.id, { sliderUnit: e.target.value })}
                        placeholder={locale === 'fr' ? 'ex: %, heures, jours' : 'e.g., %, hours, days'}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                      />
                    </div>
                    {/* Preview slider */}
                    <div className="p-4 bg-gray-50/80 rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{question.sliderMin || 0}</span>
                        <input
                          type="range"
                          min={question.sliderMin || 0}
                          max={question.sliderMax || 100}
                          step={question.sliderStep || 1}
                          defaultValue={(question.sliderMin || 0) + ((question.sliderMax || 100) - (question.sliderMin || 0)) / 2}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
                          disabled
                        />
                        <span className="text-sm text-gray-500">{question.sliderMax || 100}{question.sliderUnit}</span>
                      </div>
                    </div>
                  </div>
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
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-green-200/20 rounded-full blur-3xl" />
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
                <Link href={isEditMode ? '/resources' : '/resources/create'}>
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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100/80 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                    <ClipboardCheck className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {isEditMode ? (locale === 'fr' ? 'Modifier l\'évaluation' : 'Edit Assessment') : (locale === 'fr' ? 'Créer une évaluation' : 'Create an Assessment')}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Créez des questionnaires avec notation automatique'
                    : 'Build questionnaires with automatic scoring'}
                </p>
              </div>

              {/* Templates Grid */}
              <div className="max-w-3xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessmentTemplates.map((template, index) => (
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
                          ? 'border-dashed border-gray-300 hover:border-emerald-400'
                          : 'border-white/60 hover:border-emerald-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-gray-100' : 'bg-emerald-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {template.name[locale]}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {template.description[locale]}
                      </p>
                      {template.id !== 'blank' && (
                        <p className="text-xs text-emerald-600 mt-2">
                          {template.questions.length} {locale === 'fr' ? 'questions' : 'questions'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Build Assessment */}
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
                      onClick={() => { setViewMode('edit'); resetTestMode() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'edit'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {locale === 'fr' ? 'Éditer' : 'Edit'}
                    </button>
                    <button
                      onClick={() => { setViewMode('preview'); resetTestMode() }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        viewMode === 'preview'
                          ? 'bg-emerald-500 text-white shadow-md'
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
                          ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
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
                      onClick={() => setStep('scoring')}
                      disabled={!canProceedToScoring}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
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
                          placeholder={locale === 'fr' ? 'Titre de l\'évaluation...' : 'Assessment title...'}
                          className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400 mb-4"
                        />
                        <textarea
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder={locale === 'fr' ? 'Instructions pour le client (ex: "Au cours des 2 dernières semaines...")' : 'Instructions for the client (e.g., "Over the last 2 weeks...")'}
                          rows={2}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                        />
                      </motion.div>

                      {/* Questions */}
                      <div className="space-y-1">
                        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-1">
                          {questions.map((question) => (
                            <Reorder.Item key={question.id} value={question}>
                              {renderQuestionEditor(question)}
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>

                      {/* Add Question Button */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative"
                      >
                        <button
                          onClick={() => setShowQuestionPicker(!showQuestionPicker)}
                          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          {locale === 'fr' ? 'Ajouter une question' : 'Add a question'}
                        </button>

                        {/* Question Picker */}
                        <AnimatePresence>
                          {showQuestionPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {questionTypes.map((qt) => {
                                  const Icon = qt.icon
                                  return (
                                    <button
                                      key={qt.type}
                                      onClick={() => addQuestion(qt.type)}
                                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors text-left"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-emerald-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{qt.label[locale]}</p>
                                        <p className="text-xs text-gray-500">{qt.description[locale]}</p>
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
                      className="bg-white rounded-[1.5rem] shadow-lg border border-gray-200 p-8"
                    >
                      {/* Preview Header */}
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
                        <Eye className="w-4 h-4" />
                        {locale === 'fr' ? 'Aperçu - C\'est ainsi que le membre verra l\'évaluation' : 'Preview - This is how the member will see the assessment'}
                      </div>

                      {/* Assessment Title */}
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</h1>

                      {/* Instructions */}
                      {instructions && (
                        <p className="text-gray-600 mb-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                          {instructions}
                        </p>
                      )}

                      {/* Questions */}
                      {questions.length > 0 ? (
                        questions.map(question => renderQuestionPreview(question, false))
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>{locale === 'fr' ? 'Aucune question ajoutée' : 'No questions added yet'}</p>
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
                      <div className={`px-6 py-4 border-b ${testSubmitted ? 'bg-emerald-50 border-emerald-100' : 'bg-teal-50 border-teal-100'}`}>
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
                                <UserCheck className="w-5 h-5 text-teal-600" />
                                <span className="font-medium text-teal-800">
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

                      {/* Assessment Content */}
                      <div className="p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || (locale === 'fr' ? 'Sans titre' : 'Untitled')}</h1>

                        {/* Instructions */}
                        {instructions && (
                          <p className="text-gray-600 mb-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                            {instructions}
                          </p>
                        )}

                        {questions.length > 0 ? (
                          <>
                            {questions.map(question => renderQuestionPreview(question, true))}

                            {/* Submit Button */}
                            {!testSubmitted && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-8 pt-6 border-t border-gray-100"
                              >
                                <Button
                                  onClick={handleTestSubmit}
                                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg shadow-teal-200/50 rounded-xl py-6 text-lg"
                                >
                                  <Send className="w-5 h-5 mr-2" />
                                  {locale === 'fr' ? 'Soumettre' : 'Submit Assessment'}
                                </Button>
                              </motion.div>
                            )}

                            {/* Score Summary */}
                            {testSubmitted && enableScoring && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-8 pt-6 border-t border-gray-100"
                              >
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  {locale === 'fr' ? 'Résultat' : 'Result'}
                                </h3>
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                                  <div className="text-center">
                                    <p className="text-4xl font-bold text-emerald-600 mb-2">
                                      {calculateTestScore()} / {calculateMaxScore()}
                                    </p>
                                    <p className="text-lg font-medium text-gray-700">
                                      {getScoreInterpretation(calculateTestScore())}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>{locale === 'fr' ? 'Aucune question ajoutée' : 'No questions added yet'}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Info */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-green-50/30 rounded-[1.5rem] border-2 border-emerald-200/60 p-5 shadow-lg shadow-emerald-100/30"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                          <Info className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'fr' ? 'Types de questions' : 'Question Types'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Likert: échelles de fréquence/accord' : 'Likert: frequency/agreement scales'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Choix multiple: options personnalisées' : 'Multiple choice: custom options'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Oui/Non: questions binaires simples' : 'Yes/No: simple binary questions'}
                      </li>
                    </ul>
                  </motion.div>

                  {/* Question Count & Score */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5"
                  >
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{questions.length}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'questions' : 'questions'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-emerald-600">{calculateMaxScore()}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'score max' : 'max score'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Scoring Configuration */}
          {step === 'scoring' && (
            <motion.div
              key="scoring"
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
                    {locale === 'fr' ? 'Questions' : 'Questions'}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    onClick={() => setStep('details')}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
                  >
                    {locale === 'fr' ? 'Continuer' : 'Continue'}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Title */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {locale === 'fr' ? 'Interprétation des scores' : 'Score Interpretation'}
                    </h1>
                    <p className="text-gray-600">
                      {locale === 'fr' ? 'Définissez comment interpréter le score total' : 'Define how to interpret the total score'}
                    </p>
                  </div>
                </div>
              </div>

              {/* How scoring works explanation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[1.5rem] border border-blue-200 p-5 mb-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {locale === 'fr' ? 'Comment fonctionne la notation?' : 'How does scoring work?'}
                    </h3>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        {locale === 'fr'
                          ? 'Chaque question a des points assignés (configurés dans l\'éditeur de questions)'
                          : 'Each question has points assigned (configured in the question editor)'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        {locale === 'fr'
                          ? 'Le score total = somme des points de toutes les réponses'
                          : 'Total score = sum of points from all answers'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        {locale === 'fr'
                          ? 'Les plages ci-dessous déterminent l\'interprétation du score total'
                          : 'The ranges below determine how to interpret the total score'}
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enable Scoring & Score Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {locale === 'fr' ? 'Activer la notation' : 'Enable Scoring'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'Calcul et affichage du score' : 'Calculate and display score'}
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

                  {enableScoring && (
                    <div className="space-y-5">
                      {/* Score breakdown by question */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                          {locale === 'fr' ? 'Points par question' : 'Points per question'}
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {questions.map((q, index) => {
                            const qType = questionTypes.find(qt => qt.type === q.type)
                            let maxPts = 0
                            if (q.type === 'likert') maxPts = (q.scaleLabels?.length || 1) - 1
                            else if (q.type === 'yes_no') maxPts = 1
                            else if (q.type === 'numeric') maxPts = q.maxValue || 10
                            else if (q.type === 'multiple_choice' && q.scoring) maxPts = Math.max(...Object.values(q.scoring))

                            return (
                              <div key={q.id} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-xs text-gray-400">Q{index + 1}</span>
                                  <span className="text-sm text-gray-700 truncate">
                                    {q.question || qType?.label[locale]}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-emerald-600 ml-2">
                                  {maxPts} pts
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Total max score */}
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {locale === 'fr' ? 'Score total maximum' : 'Maximum total score'}
                          </span>
                          <span className="text-2xl font-bold text-emerald-600">{calculateMaxScore()} pts</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Interpretation Ranges */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {locale === 'fr' ? 'Plages d\'interprétation' : 'Interpretation Ranges'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {locale === 'fr'
                      ? 'Quand le score total est entre X et Y, afficher ce résultat'
                      : 'When total score is between X and Y, show this result'}
                  </p>

                  {enableScoring ? (
                    <div className="space-y-3">
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
                                  newRanges[index].min = parseInt(e.target.value)
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
                                  newRanges[index].max = parseInt(e.target.value)
                                  setScoringRanges(newRanges)
                                }}
                                className="w-14 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              />
                              <span className="text-xs text-gray-400">pts</span>
                            </div>
                            <span className="text-gray-400">=</span>
                            <input
                              type="text"
                              value={range.label[locale]}
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

                      {/* Example */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-xs text-gray-500">
                          <strong>{locale === 'fr' ? 'Exemple:' : 'Example:'}</strong>{' '}
                          {locale === 'fr'
                            ? `Si un membre obtient 7 pts sur ${calculateMaxScore()}, le résultat affiché sera "${scoringRanges.find(r => 7 >= r.min && 7 <= r.max)?.label[locale] || '...'}"`
                            : `If a member scores 7 pts out of ${calculateMaxScore()}, the result shown will be "${scoringRanges.find(r => 7 >= r.min && 7 <= r.max)?.label[locale] || '...'}"` }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50/80 rounded-xl text-center">
                      <p className="text-sm text-gray-500">
                        {locale === 'fr' ? 'La notation est désactivée. Les réponses seront collectées sans calcul de score.' : 'Scoring is disabled. Responses will be collected without score calculation.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Details */}
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
                    onClick={() => setStep('scoring')}
                    className="rounded-xl hover:bg-white/80"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Notation' : 'Scoring'}
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
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
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
                            ? (locale === 'fr' ? 'Mettre à jour' : 'Update Assessment')
                            : (locale === 'fr' ? 'Enregistrer' : 'Save Assessment')
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
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                      <ClipboardCheck className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600">
                      {questions.length} {locale === 'fr' ? 'questions' : 'questions'} • {locale === 'fr' ? 'Dernière étape' : 'Final step'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Description & Category */}
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
                    placeholder={locale === 'fr' ? 'Décrivez brièvement cette évaluation...' : 'Briefly describe this assessment...'}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none mb-6"
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
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        {t.library.categories[category]}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Right Column: Publish Options + Summary */}
                <div className="space-y-6">
                  {/* Publish Options */}
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
                    <AnimatePresence>
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
                                  ? 'border-emerald-400 bg-emerald-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  visibility === 'private' ? 'bg-emerald-200' : 'bg-gray-100'
                                }`}>
                                  <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-emerald-700' : 'text-gray-500'}`} />
                                </div>
                                <span className={`font-medium ${visibility === 'private' ? 'text-emerald-900' : 'text-gray-700'}`}>
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
                    </AnimatePresence>

                    {/* Show Score to Member Toggle */}
                    {enableScoring && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">
                              {locale === 'fr' ? 'Afficher le score au membre' : 'Show Score to Member'}
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              {locale === 'fr'
                                ? 'Le membre pourra voir son score et son interprétation après avoir soumis l\'évaluation'
                                : 'Member will see their score and interpretation after submitting the assessment'}
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
                        {!showScoreToMember && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200"
                          >
                            <p className="text-xs text-amber-700">
                              <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                              {locale === 'fr'
                                ? 'Le score sera visible uniquement par vous dans la section des soumissions.'
                                : 'Score will only be visible to you in the submissions section.'}
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
                      {questions.map((q, index) => {
                        const qType = questionTypes.find(qt => qt.type === q.type)
                        const Icon = qType?.icon || ClipboardCheck
                        return (
                          <div key={q.id} className="flex items-center gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 truncate flex-1">
                              {q.question || qType?.label[locale]}
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

export default function CreateAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50/30 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>}>
      <CreateAssessmentContent />
    </Suspense>
  )
}

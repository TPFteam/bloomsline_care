'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Eye,
  Lightbulb,
  Plus,
  Trash2,
  GripVertical,
  PlayCircle,
  Timer,
  Wind,
  Heart,
  Focus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Clock,
  Volume2,
  Repeat,
  Target,
  Loader2,
  Cloud,
  CloudOff,
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
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ResourceCategory } from '@/types/library'
import DescriptionEditor from '@/components/resources/DescriptionEditor'

// Step types for exercises
type StepType = 'instruction' | 'timed_action' | 'breathing' | 'visualization' | 'body_scan' | 'reflection'

interface ExerciseStep {
  id: string
  type: StepType
  title: string
  content: string
  // For timed actions
  duration?: number // in seconds
  // For breathing
  inhale?: number
  hold?: number
  exhale?: number
  cycles?: number
  // For visualization
  imagePrompt?: string
  // For body scan
  bodyPart?: string
}

interface StepTypeOption {
  type: StepType
  icon: React.ElementType
  label: Record<string, string>
  description: Record<string, string>
}

const stepTypes: StepTypeOption[] = [
  {
    type: 'instruction',
    icon: PlayCircle,
    label: { en: 'Instruction', fr: 'Instruction' },
    description: { en: 'Simple guidance or direction', fr: 'Orientation ou direction simple' },
  },
  {
    type: 'timed_action',
    icon: Timer,
    label: { en: 'Timed Action', fr: 'Action chronométrée' },
    description: { en: 'Action with a specific duration', fr: 'Action avec une durée spécifique' },
  },
  {
    type: 'breathing',
    icon: Wind,
    label: { en: 'Breathing Pattern', fr: 'Exercice respiratoire' },
    description: { en: 'Guided breathing with timing', fr: 'Respiration guidée avec minutage' },
  },
  {
    type: 'visualization',
    icon: Sparkles,
    label: { en: 'Visualization', fr: 'Visualisation' },
    description: { en: 'Mental imagery exercise', fr: 'Exercice d\'imagerie mentale' },
  },
  {
    type: 'body_scan',
    icon: Heart,
    label: { en: 'Body Scan', fr: 'Scan corporel' },
    description: { en: 'Focus on specific body part', fr: 'Focus sur une partie du corps' },
  },
  {
    type: 'reflection',
    icon: Focus,
    label: { en: 'Reflection', fr: 'Réflexion' },
    description: { en: 'Pause for self-reflection', fr: 'Pause pour auto-réflexion' },
  },
]

const allCategories: ResourceCategory[] = [
  'emotions', 'emotional_regulation', 'self_confidence', 'self_esteem',
  'relationships', 'communication', 'stress', 'anxiety', 'burnout',
  'decision_making', 'behavior', 'habits', 'psychoeducation', 'reflection', 'action'
]

// Breathing presets
const breathingPresets = [
  { name: { en: '4-7-8 Relaxation', fr: '4-7-8 Relaxation' }, inhale: 4, hold: 7, exhale: 8, cycles: 4 },
  { name: { en: 'Box Breathing', fr: 'Respiration carrée' }, inhale: 4, hold: 4, exhale: 4, cycles: 4 },
  { name: { en: 'Simple Deep Breath', fr: 'Respiration profonde' }, inhale: 4, hold: 2, exhale: 6, cycles: 5 },
  { name: { en: 'Energizing Breath', fr: 'Respiration énergisante' }, inhale: 2, hold: 0, exhale: 2, cycles: 10 },
]

// Body parts for body scan
const bodyParts = [
  { en: 'Feet', fr: 'Pieds' },
  { en: 'Legs', fr: 'Jambes' },
  { en: 'Hips', fr: 'Hanches' },
  { en: 'Stomach', fr: 'Ventre' },
  { en: 'Chest', fr: 'Poitrine' },
  { en: 'Hands', fr: 'Mains' },
  { en: 'Arms', fr: 'Bras' },
  { en: 'Shoulders', fr: 'Épaules' },
  { en: 'Neck', fr: 'Cou' },
  { en: 'Face', fr: 'Visage' },
  { en: 'Head', fr: 'Tête' },
]

// Exercise templates
const exerciseTemplates = [
  {
    id: 'grounding-5-4-3-2-1',
    name: { en: '5-4-3-2-1 Grounding', fr: 'Ancrage 5-4-3-2-1' },
    description: { en: 'Classic grounding technique using senses', fr: 'Technique d\'ancrage classique avec les sens' },
    steps: [
      { id: '1', type: 'instruction' as StepType, title: 'Get Comfortable', content: 'Find a comfortable position. You can sit or stand. Take a deep breath to center yourself.' },
      { id: '2', type: 'timed_action' as StepType, title: '5 Things You Can See', content: 'Look around and notice 5 things you can see. Name them out loud or in your mind.', duration: 30 },
      { id: '3', type: 'timed_action' as StepType, title: '4 Things You Can Touch', content: 'Notice 4 things you can physically touch. Feel their texture.', duration: 25 },
      { id: '4', type: 'timed_action' as StepType, title: '3 Things You Can Hear', content: 'Listen carefully for 3 sounds around you.', duration: 20 },
      { id: '5', type: 'timed_action' as StepType, title: '2 Things You Can Smell', content: 'Identify 2 scents. You might need to move around.', duration: 15 },
      { id: '6', type: 'timed_action' as StepType, title: '1 Thing You Can Taste', content: 'Notice one taste in your mouth, or take a sip of water.', duration: 10 },
      { id: '7', type: 'reflection' as StepType, title: 'Return to the Present', content: 'Notice how you feel. You are here, in this moment, grounded and safe.' },
    ],
  },
  {
    id: 'box-breathing',
    name: { en: 'Box Breathing', fr: 'Respiration carrée' },
    description: { en: 'Calming breathing technique', fr: 'Technique de respiration apaisante' },
    steps: [
      { id: '1', type: 'instruction' as StepType, title: 'Prepare', content: 'Sit comfortably with your feet flat on the floor. Rest your hands on your lap.' },
      { id: '2', type: 'breathing' as StepType, title: 'Box Breathing Cycle', content: 'Follow the breathing pattern. Imagine drawing a box with your breath.', inhale: 4, hold: 4, exhale: 4, cycles: 4 },
      { id: '3', type: 'reflection' as StepType, title: 'Notice the Effect', content: 'Take a moment to notice how your body feels. Observe any changes in your stress level.' },
    ],
  },
  {
    id: 'body-scan',
    name: { en: 'Quick Body Scan', fr: 'Scan corporel rapide' },
    description: { en: 'Progressive muscle relaxation', fr: 'Relaxation musculaire progressive' },
    steps: [
      { id: '1', type: 'instruction' as StepType, title: 'Get Comfortable', content: 'Lie down or sit comfortably. Close your eyes if you wish.' },
      { id: '2', type: 'body_scan' as StepType, title: 'Feet', content: 'Bring your attention to your feet. Notice any sensations, tension, or warmth.', bodyPart: 'Feet', duration: 20 },
      { id: '3', type: 'body_scan' as StepType, title: 'Legs', content: 'Move your attention up to your legs. Allow any tension to release.', bodyPart: 'Legs', duration: 20 },
      { id: '4', type: 'body_scan' as StepType, title: 'Core', content: 'Notice your stomach and lower back. Let them soften with each breath.', bodyPart: 'Stomach', duration: 20 },
      { id: '5', type: 'body_scan' as StepType, title: 'Chest & Shoulders', content: 'Feel your chest rise and fall. Let your shoulders drop away from your ears.', bodyPart: 'Shoulders', duration: 20 },
      { id: '6', type: 'body_scan' as StepType, title: 'Face', content: 'Relax your jaw, soften your eyes, smooth your forehead.', bodyPart: 'Face', duration: 20 },
      { id: '7', type: 'reflection' as StepType, title: 'Whole Body', content: 'Take a moment to feel your whole body at once, relaxed and at ease.' },
    ],
  },
  {
    id: 'blank',
    name: { en: 'Blank Exercise', fr: 'Exercice vierge' },
    description: { en: 'Start from scratch', fr: 'Commencer de zéro' },
    steps: [],
  },
]

export default function CreateExercisePage() {
  const { t, locale } = useLanguage()
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<'template' | 'build' | 'details'>('template')

  // Exercise state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [steps, setSteps] = useState<ExerciseStep[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Settings
  const [enableAudio, setEnableAudio] = useState(true)
  const [repeatCount, setRepeatCount] = useState(1)

  // UI state
  const [showStepPicker, setShowStepPicker] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSavingRef = useRef(false)

  // Template modification tracking using ref for reliable synchronous access
  const originalTemplateContentRef = useRef<{
    title: string
    steps: ExerciseStep[]
  } | null>(null)
  const [showTemplateWarningDialog, setShowTemplateWarningDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9)

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = exerciseTemplates.find(t => t.id === templateId)
    if (template) {
      if (template.id === 'blank') {
        setSteps([])
        setTitle('')
        originalTemplateContentRef.current = null
      } else {
        const stepsWithIds = template.steps.map(s => ({ ...s, id: generateId() }))
        setSteps(stepsWithIds)
        setTitle(lt(template.name, locale))
        // Track template for modification check - deep copy to compare against original values
        originalTemplateContentRef.current = {
          title: lt(template.name, locale),
          steps: stepsWithIds.map(s => ({ ...s }))
        }
      }
      setStep('build')
    }
  }

  // Check if template content has been modified
  const hasModifiedTemplate = (): boolean => {
    if (!selectedTemplate || selectedTemplate === 'blank' || !originalTemplateContentRef.current) return true // No template = can proceed

    // Check if title changed
    if (title !== originalTemplateContentRef.current.title) return true

    // Check if steps count changed
    if (steps.length !== originalTemplateContentRef.current.steps.length) return true

    // Check if any step content was modified
    for (let i = 0; i < steps.length; i++) {
      const currentStep = steps[i]
      const originalStep = originalTemplateContentRef.current.steps[i]
      if (!originalStep) return true
      if (currentStep.title !== originalStep.title) return true
      if (currentStep.content !== originalStep.content) return true
      if (currentStep.type !== originalStep.type) return true
    }

    return false
  }

  // Handle continue to details with template modification check
  const handleContinueToDetails = () => {
    if (!hasModifiedTemplate()) {
      setShowTemplateWarningDialog(true)
      return
    }
    setStep('details')
  }

  // Handle going back to resource creation page (discard current resource)
  const handleGoBackToTemplates = () => {
    setShowTemplateWarningDialog(false)
    // Navigate back to resource creation page
    router.push('/resources/create')
  }

  // Add new step
  const addStep = (type: StepType) => {
    const newStep: ExerciseStep = {
      id: generateId(),
      type,
      title: '',
      content: '',
      ...(type === 'timed_action' && { duration: 30 }),
      ...(type === 'breathing' && { inhale: 4, hold: 4, exhale: 4, cycles: 4 }),
      ...(type === 'body_scan' && { bodyPart: 'Feet', duration: 20 }),
    }
    setSteps([...steps, newStep])
    setExpandedStep(newStep.id)
    setShowStepPicker(false)
  }

  // Update step
  const updateStep = (id: string, updates: Partial<ExerciseStep>) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  // Delete step
  const deleteStep = (id: string) => {
    setDeleteConfirmId(id)
  }
  const confirmDeleteStep = () => {
    if (deleteConfirmId) {
      setSteps(steps.filter(s => s.id !== deleteConfirmId))
    }
    setDeleteConfirmId(null)
  }

  // Duplicate step
  const duplicateStep = (id: string) => {
    const stepToDuplicate = steps.find(s => s.id === id)
    if (stepToDuplicate) {
      const newStep = { ...stepToDuplicate, id: generateId() }
      const index = steps.findIndex(s => s.id === id)
      const newSteps = [...steps]
      newSteps.splice(index + 1, 0, newStep)
      setSteps(newSteps)
    }
  }

  // Apply breathing preset
  const applyBreathingPreset = (stepId: string, preset: typeof breathingPresets[0]) => {
    updateStep(stepId, {
      inhale: preset.inhale,
      hold: preset.hold,
      exhale: preset.exhale,
      cycles: preset.cycles,
    })
  }

  // Calculate total duration
  const calculateTotalDuration = () => {
    let total = 0
    steps.forEach(s => {
      if (s.duration) {
        total += s.duration
      }
      if (s.type === 'breathing' && s.inhale && s.exhale && s.cycles) {
        const breathCycle = (s.inhale + (s.hold || 0) + s.exhale) * s.cycles
        total += breathCycle
      }
    })
    return total * repeatCount
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  // Handle save
  const handleSave = async () => {
    if (!title || steps.length === 0) {
      toast.error(locale === 'fr' ? 'Veuillez ajouter un titre et au moins une étape' : 'Please add a title and at least one step')
      return
    }
    if (!selectedCategory) {
      toast.error(locale === 'fr' ? 'La catégorie est requise' : 'Category is required')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error(locale === 'fr' ? 'Non authentifié' : 'Not authenticated')
        router.push('/sign-in')
        return
      }

      const resourceData = {
        title,
        description: description || null,
        category: selectedCategory,
        status: 'published',
        visibility: 'private',
        type: 'exercise',
        blocks: steps.map(s => ({
          id: s.id,
          type: s.type,
          content: s.content,
          title: s.title,
          duration: s.duration,
          inhale: s.inhale,
          hold: s.hold,
          exhale: s.exhale,
          cycles: s.cycles,
          imagePrompt: s.imagePrompt,
          bodyPart: s.bodyPart,
        })),
        settings: {
          enableAudio,
          repeatCount,
          totalDuration: calculateTotalDuration(),
        },
      }

      const saveToId = autoSaveDraftId

      if (saveToId) {
        const { error } = await supabase
          .from('resources')
          .update({ ...resourceData, status: 'published' })
          .eq('id', saveToId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('resources')
          .insert({
            ...resourceData,
            practitioner_id: user.id,
          })

        if (error) throw error
      }

      toast.success(locale === 'fr' ? 'Exercice créé!' : 'Exercise created!')
      router.push('/resources')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving')
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isAutoSavingRef.current || isSaving) return
    if (!title.trim() || steps.length === 0) return

    const saveToId = autoSaveDraftId

    isAutoSavingRef.current = true
    setAutoSaveStatus('saving')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAutoSaveStatus('error')
        return
      }

      const resourceData = {
        title,
        description: description || null,
        category: selectedCategory,
        status: 'draft' as const,
        visibility: 'private' as const,
        blocks: steps.map(s => ({
          id: s.id,
          type: s.type,
          content: s.content,
          title: s.title,
          duration: s.duration,
          inhale: s.inhale,
          hold: s.hold,
          exhale: s.exhale,
          cycles: s.cycles,
          imagePrompt: s.imagePrompt,
          bodyPart: s.bodyPart,
        })),
        settings: {
          enableAudio,
          repeatCount,
          totalDuration: calculateTotalDuration(),
        },
      }

      if (saveToId) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', saveToId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('resources')
          .insert({
            ...resourceData,
            practitioner_id: user.id,
            type: 'exercise',
          })
          .select('id')
          .single()

        if (error) throw error
        if (data?.id) {
          setAutoSaveDraftId(data.id)
          // Update URL with the new draft ID so refresh works
          router.replace(`/resources/create/exercise?edit=${data.id}`, { scroll: false })
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
  }, [autoSaveDraftId, isSaving, title, steps, description, selectedCategory, enableAudio, repeatCount])

  // Track changes and trigger auto-save
  const performAutoSaveRef = useRef(performAutoSave)
  performAutoSaveRef.current = performAutoSave

  useEffect(() => {
    if (!title && steps.length === 0) return

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
  }, [title, steps, description, selectedCategory, enableAudio, repeatCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Check if can proceed to details
  const canProceedToDetails = title.trim() && steps.length > 0

  // Render step editor
  const renderStepEditor = (exerciseStep: ExerciseStep) => {
    const isExpanded = expandedStep === exerciseStep.id
    const stepType = stepTypes.find(st => st.type === exerciseStep.type)
    const Icon = stepType?.icon || PlayCircle

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white/90 backdrop-blur-xl rounded-xl border border-white/60 shadow-md overflow-hidden"
      >
        {/* Step Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setExpandedStep(isExpanded ? null : exerciseStep.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-gray-700" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {exerciseStep.title || (stepType ? lt(stepType.label, locale) : 'Untitled')}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{stepType ? lt(stepType.label, locale) : ''}</span>
              {exerciseStep.duration && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(exerciseStep.duration)}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); duplicateStep(exerciseStep.id) }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteStep(exerciseStep.id) }}
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

        {/* Step Content */}
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
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Titre de l\'étape' : 'Step Title'}
                  </label>
                  <input
                    type="text"
                    value={exerciseStep.title}
                    onChange={(e) => updateStep(exerciseStep.id, { title: e.target.value })}
                    placeholder={locale === 'fr' ? 'Ex: Inspirez profondément' : 'e.g., Take a deep breath'}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {locale === 'fr' ? 'Instructions' : 'Instructions'}
                  </label>
                  <textarea
                    value={exerciseStep.content}
                    onChange={(e) => updateStep(exerciseStep.id, { content: e.target.value })}
                    placeholder={locale === 'fr' ? 'Instructions détaillées pour cette étape...' : 'Detailed instructions for this step...'}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Timed Action */}
                {exerciseStep.type === 'timed_action' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Durée (secondes)' : 'Duration (seconds)'}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        value={exerciseStep.duration || 30}
                        onChange={(e) => updateStep(exerciseStep.id, { duration: parseInt(e.target.value) })}
                        className="flex-1 accent-gray-900"
                      />
                      <span className="w-16 text-center text-lg font-semibold text-gray-700">
                        {formatDuration(exerciseStep.duration || 30)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Breathing */}
                {exerciseStep.type === 'breathing' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Modèles prédéfinis' : 'Presets'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {breathingPresets.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => applyBreathingPreset(exerciseStep.id, preset)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-gray-50 text-gray-800 hover:bg-gray-100 transition-colors"
                          >
                            {lt(preset.name, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {locale === 'fr' ? 'Inspiration' : 'Inhale'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exerciseStep.inhale || 4}
                          onChange={(e) => updateStep(exerciseStep.id, { inhale: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {locale === 'fr' ? 'Pause' : 'Hold'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={exerciseStep.hold || 0}
                          onChange={(e) => updateStep(exerciseStep.id, { hold: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {locale === 'fr' ? 'Expiration' : 'Exhale'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={exerciseStep.exhale || 4}
                          onChange={(e) => updateStep(exerciseStep.id, { exhale: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {locale === 'fr' ? 'Cycles' : 'Cycles'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={exerciseStep.cycles || 4}
                          onChange={(e) => updateStep(exerciseStep.id, { cycles: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/60 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-gray-400"
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50/80 rounded-xl">
                      <p className="text-sm text-gray-800 text-center">
                        {locale === 'fr' ? 'Durée totale' : 'Total duration'}: <span className="font-semibold">{formatDuration(((exerciseStep.inhale || 4) + (exerciseStep.hold || 0) + (exerciseStep.exhale || 4)) * (exerciseStep.cycles || 4))}</span>
                      </p>
                    </div>
                  </>
                )}

                {/* Body Scan */}
                {exerciseStep.type === 'body_scan' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'fr' ? 'Partie du corps' : 'Body Part'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {bodyParts.map((part) => (
                          <button
                            key={part.en}
                            onClick={() => updateStep(exerciseStep.id, { bodyPart: part.en })}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                              exerciseStep.bodyPart === part.en
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {lt(part, locale)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {locale === 'fr' ? 'Durée (secondes)' : 'Duration (seconds)'}
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="10"
                          max="60"
                          value={exerciseStep.duration || 20}
                          onChange={(e) => updateStep(exerciseStep.id, { duration: parseInt(e.target.value) })}
                          className="flex-1 accent-gray-900"
                        />
                        <span className="w-16 text-center text-lg font-semibold text-gray-700">
                          {formatDuration(exerciseStep.duration || 20)}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Visualization */}
                {exerciseStep.type === 'visualization' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {locale === 'fr' ? 'Description de l\'image mentale' : 'Mental Image Description'}
                    </label>
                    <textarea
                      value={exerciseStep.imagePrompt || ''}
                      onChange={(e) => updateStep(exerciseStep.id, { imagePrompt: e.target.value })}
                      placeholder={locale === 'fr' ? 'Décrivez ce que le client doit visualiser...' : 'Describe what the client should visualize...'}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-transparent" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-transparent" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-transparent" />
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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg ">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Créer un exercice guidé' : 'Create a Guided Exercise'}
                </h1>
                <p className="text-gray-600 max-w-md mx-auto">
                  {locale === 'fr'
                    ? 'Créez des exercices de respiration, méditation et plus'
                    : 'Build breathing, meditation, and grounding exercises'}
                </p>
              </div>

              {/* Templates Grid */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exerciseTemplates.map((template, index) => (
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
                          ? 'border-dashed border-gray-300 hover:border-gray-400'
                          : 'border-white/60 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-gray-100' : 'bg-gray-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Lightbulb className="w-5 h-5 text-gray-700" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {lt(template.name, locale)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lt(template.description, locale)}
                      </p>
                      {template.id !== 'blank' && (
                        <p className="text-xs text-gray-700 mt-2">
                          {template.steps.length} {locale === 'fr' ? 'étapes' : 'steps'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Build Exercise */}
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
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
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
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Aperçu' : 'Preview'}
                  </Button>
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4">
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
                      placeholder={locale === 'fr' ? 'Nom de l\'exercice...' : 'Exercise name...'}
                      className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:outline-none placeholder-gray-400"
                    />
                  </motion.div>

                  {/* Steps */}
                  <div className="space-y-3">
                    <Reorder.Group axis="y" values={steps} onReorder={setSteps}>
                      {steps.map((exerciseStep) => (
                        <Reorder.Item key={exerciseStep.id} value={exerciseStep}>
                          {renderStepEditor(exerciseStep)}
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>

                  {/* Add Step Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative"
                  >
                    <button
                      onClick={() => setShowStepPicker(!showStepPicker)}
                      className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      {locale === 'fr' ? 'Ajouter une étape' : 'Add a step'}
                    </button>

                    {/* Step Picker */}
                    <AnimatePresence>
                      {showStepPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {stepTypes.map((st) => {
                              const Icon = st.icon
                              return (
                                <button
                                  key={st.type}
                                  onClick={() => addStep(st.type)}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-gray-700" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{lt(st.label, locale)}</p>
                                    <p className="text-xs text-gray-500">{lt(st.description, locale)}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5"
                  >
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{steps.length}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'étapes' : 'steps'}
                        </p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-700">{formatDuration(calculateTotalDuration())}</p>
                        <p className="text-sm text-gray-500">
                          {locale === 'fr' ? 'durée totale' : 'total time'}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Settings */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.25rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Paramètres' : 'Settings'}
                    </h3>

                    {/* Audio Cues */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {locale === 'fr' ? 'Signaux audio' : 'Audio cues'}
                        </span>
                      </div>
                      <button
                        onClick={() => setEnableAudio(!enableAudio)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          enableAudio ? 'bg-gray-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            enableAudio ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Repeat */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">
                          {locale === 'fr' ? 'Répétitions' : 'Repetitions'}
                        </span>
                      </div>
                      <select
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                        className="px-3 py-1.5 bg-gray-50/80 border border-gray-200/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        {[1, 2, 3, 4, 5].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>

                  {/* Tips */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] border-2 border-gray-200 p-5 shadow-lg shadow-gray-200/40"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center shadow-md">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'fr' ? 'Conseils' : 'Tips'}
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Commencez par des instructions claires' : 'Start with clear instructions'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Gardez les durées réalistes' : 'Keep durations realistic'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                        {locale === 'fr' ? 'Terminez par une réflexion' : 'End with a reflection'}
                      </li>
                    </ul>
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
                    {locale === 'fr' ? 'Retour aux étapes' : 'Back to steps'}
                  </Button>
                </motion.div>
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
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
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
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Aperçu' : 'Preview'}
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gray-900 hover:bg-gray-800 shadow-lg rounded-xl"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {locale === 'fr' ? 'Enregistrer' : 'Save Exercise'}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <div className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-lg">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-600">
                      {steps.length} {locale === 'fr' ? 'étapes' : 'steps'} • {formatDuration(calculateTotalDuration())}
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
                  <DescriptionEditor
                    value={description}
                    onChange={setDescription}
                    placeholder={locale === 'fr' ? 'Décrivez brièvement cet exercice...' : 'Briefly describe this exercise...'}
                    className="mb-4"
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
                            ? 'bg-gray-900 text-white shadow-md '
                            : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                        }`}
                      >
                        {t.library.categories[category]}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {locale === 'fr' ? 'Aperçu des étapes' : 'Steps Overview'}
                  </h2>
                  <div className="space-y-3">
                    {steps.map((s, index) => {
                      const sType = stepTypes.find(st => st.type === s.type)
                      const Icon = sType?.icon || PlayCircle
                      return (
                        <div key={s.id} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700 truncate flex-1">
                            {s.title || (sType ? lt(sType.label, locale) : '')}
                          </span>
                          {s.duration && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(s.duration)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{locale === 'fr' ? 'Durée totale' : 'Total Duration'}</span>
                      <span className="font-semibold text-gray-700">{formatDuration(calculateTotalDuration())}</span>
                    </div>
                    {repeatCount > 1 && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">{locale === 'fr' ? 'Répétitions' : 'Repetitions'}</span>
                        <span className="font-semibold text-gray-900">{repeatCount}x</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
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
              className="flex-1 sm:flex-none bg-gray-500 hover:bg-gray-800"
            >
              {locale === 'fr' ? 'Modifier' : 'Modify'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Step Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'fr' ? 'Supprimer cette étape ?' : 'Delete this step?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'fr'
                ? 'Cette action est irréversible. L\'étape et son contenu seront supprimés.'
                : 'This action cannot be undone. The step and its content will be removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="flex-1 sm:flex-none">
              {locale === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={confirmDeleteStep} className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white">
              {locale === 'fr' ? 'Supprimer' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

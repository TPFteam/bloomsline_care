'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Table2,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Lock,
  Globe,
  FileText,
  Send,
  Cloud,
  CloudOff,
  CheckCircle2,
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
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { ResourceCategory } from '@/types/library'

interface TableColumn {
  id: string
  header: string
  description: string
}

const allCategories: ResourceCategory[] = [
  'anxiety', 'depression', 'stress', 'relationships', 'self_esteem',
  'mindfulness', 'coping_skills', 'communication', 'grief', 'trauma',
  'children', 'teens', 'adults', 'couples', 'family', 'general'
]

const generateId = () => Math.random().toString(36).substring(2, 9)

// Table exercise templates for quick start
const tableTemplates = [
  {
    id: 'emotion-tracker',
    name: { en: 'Emotion Tracker', fr: 'Suivi des émotions' },
    description: { en: 'Monitor emotions and coping strategies', fr: 'Surveiller les émotions et stratégies d\'adaptation' },
    columns: [
      { id: '1', header: 'Time', description: 'What time was it?' },
      { id: '2', header: 'Emotion', description: 'What emotion did you feel?' },
      { id: '3', header: 'Intensity (1-10)', description: 'How strong was it?' },
      { id: '4', header: 'Trigger', description: 'What triggered this feeling?' },
      { id: '5', header: 'Coping Strategy', description: 'What helped?' },
    ],
    instructions: 'Track your emotions throughout the day to identify patterns and effective coping strategies.',
  },
  {
    id: 'gratitude-log',
    name: { en: 'Gratitude Log', fr: 'Journal de gratitude' },
    description: { en: 'Daily gratitude tracking table', fr: 'Tableau de suivi de gratitude quotidien' },
    columns: [
      { id: '1', header: 'Date', description: 'Today\'s date' },
      { id: '2', header: 'I\'m grateful for...', description: 'Something you appreciate' },
      { id: '3', header: 'Why it matters', description: 'Why is this meaningful?' },
    ],
    instructions: 'Each day, add at least one thing you\'re grateful for. Reflect on why it matters to you.',
  },
  {
    id: 'cognitive-restructuring',
    name: { en: 'Cognitive Restructuring Chart', fr: 'Tableau de restructuration cognitive' },
    description: { en: 'Challenge and reframe negative thoughts', fr: 'Remettre en question et reformuler les pensées négatives' },
    columns: [
      { id: '1', header: 'Situation', description: 'What happened? Where were you?' },
      { id: '2', header: 'Automatic Thought', description: 'What went through your mind?' },
      { id: '3', header: 'Emotion (0-100%)', description: 'How did you feel? Rate intensity' },
      { id: '4', header: 'Evidence For', description: 'Facts that support the thought' },
      { id: '5', header: 'Evidence Against', description: 'Facts that contradict it' },
      { id: '6', header: 'Balanced Thought', description: 'A more realistic perspective' },
      { id: '7', header: 'New Emotion (0-100%)', description: 'How do you feel now?' },
    ],
    instructions: 'Use this chart to identify negative automatic thoughts and develop more balanced perspectives. Start by describing the situation, then work through each column to challenge unhelpful thinking patterns.',
  },
  {
    id: 'blank',
    name: { en: 'Blank Table', fr: 'Tableau vierge' },
    description: { en: 'Start from scratch', fr: 'Créez sans modèle' },
    columns: [
      { id: '1', header: '', description: '' },
      { id: '2', header: '', description: '' },
      { id: '3', header: '', description: '' },
    ],
    instructions: '',
  },
]

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        </div>
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    </div>
  )
}

// Main page wrapper with Suspense
export default function CreateTableExercisePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateTableExerciseContent />
    </Suspense>
  )
}

function CreateTableExerciseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const templateParam = searchParams.get('template')
  const { t, locale } = useLanguage()

  // Step state for guided wizard - start at 'build' if editing or template param provided, otherwise 'template'
  const [step, setStep] = useState<'template' | 'build' | 'details'>(editId || templateParam ? 'build' : 'template')
  const [detailsStep, setDetailsStep] = useState<1 | 2 | 3>(1)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [resourceLanguage, setResourceLanguage] = useState<'en' | 'fr'>(locale as 'en' | 'fr')
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: generateId(), header: '', description: '' },
    { id: generateId(), header: '', description: '' },
    { id: generateId(), header: '', description: '' },
  ])
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [visibility, setVisibility] = useState<'private' | 'link_only' | 'public'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')

  // Row settings
  const [rowMode, setRowMode] = useState<'unlimited' | 'limited'>('unlimited')
  const [minRows, setMinRows] = useState<number>(1)
  const [maxRows, setMaxRows] = useState<number>(10)

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSavingRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const justAutoSavedRef = useRef(false)

  // Template modification tracking using refs for reliable synchronous access
  const selectedTemplateIdRef = useRef<string | null>(null)
  const originalTemplateContentRef = useRef<{
    columns: typeof columns
    instructions: string
  } | null>(null)
  const [showTemplateWarningDialog, setShowTemplateWarningDialog] = useState(false)

  // Load existing resource when editing
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

      // Skip reload if we just auto-saved and updated the URL
      if (justAutoSavedRef.current) {
        justAutoSavedRef.current = false
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .eq('id', editId)
          .single()

        if (error) throw error

        if (data) {
          setTitle(typeof data.title === 'string' ? data.title : '')
          setDescription(typeof data.description === 'string' ? data.description : '')
          setSelectedCategory(data.category as ResourceCategory || null)
          setVisibility(data.visibility || 'private')
          setSaveAs(data.status === 'published' ? 'published' : 'draft')

          // Load columns from blocks
          if (data.blocks && Array.isArray(data.blocks) && data.blocks.length > 0) {
            const tableBlock = data.blocks.find((b: { type: string }) => b.type === 'table_exercise')
            if (tableBlock && 'columns' in tableBlock && Array.isArray(tableBlock.columns)) {
              setColumns(tableBlock.columns.map((col: { id?: string; header?: string; description?: string }) => ({
                id: col.id || generateId(),
                header: col.header || '',
                description: col.description || '',
              })))
            }
            if (tableBlock && 'instructions' in tableBlock && typeof tableBlock.instructions === 'string') {
              setInstructions(tableBlock.instructions)
            }
          }

          // Load row settings
          if (data.settings) {
            const settings = data.settings as { rowMode?: string; minRows?: number; maxRows?: number }
            if (settings.rowMode === 'limited') {
              setRowMode('limited')
              setMinRows(settings.minRows || 1)
              setMaxRows(settings.maxRows || 10)
            } else {
              setRowMode('unlimited')
            }
          }
        }
      } catch (error) {
        console.error('Error loading resource:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading resource')
      } finally {
        setLoading(false)
      }
    }

    loadResource()
  }, [editId, locale])

  // Apply template from URL parameter (skip template selection step)
  useEffect(() => {
    if (templateParam && !editId) {
      const template = tableTemplates.find(t => t.id === templateParam)
      if (template) {
        if (template.id === 'blank') {
          setColumns([
            { id: generateId(), header: '', description: '' },
            { id: generateId(), header: '', description: '' },
            { id: generateId(), header: '', description: '' },
          ])
          setTitle('')
          setInstructions('')
          selectedTemplateIdRef.current = null
          originalTemplateContentRef.current = null
        } else {
          const columnsWithIds = template.columns.map(c => ({ ...c, id: generateId() }))
          setColumns(columnsWithIds)
          setTitle(lt(template.name, locale))
          setInstructions(template.instructions || '')
          selectedTemplateIdRef.current = templateParam
          originalTemplateContentRef.current = {
            columns: columnsWithIds.map(c => ({ ...c })),
            instructions: template.instructions || ''
          }
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
      setColumns([
        { id: generateId(), header: '', description: '' },
        { id: generateId(), header: '', description: '' },
        { id: generateId(), header: '', description: '' },
      ])
      setInstructions('')
      setVisibility('private')
      setResourceLanguage(locale as 'en' | 'fr')
      setSaveAs('draft')
      setStep('template')
      setDetailsStep(1)
      setLoading(false)
      setSaving(false)
      setShowPreview(false)
      setRowMode('unlimited')
      setMinRows(1)
      setMaxRows(10)
      setAutoSaveDraftId(null)
      setAutoSaveStatus('idle')
      setLastSavedAt(null)
      setHasUnsavedChanges(false)
    }
  }, [editId, templateParam, locale])

  // Add column
  const addColumn = () => {
    if (columns.length >= 10) {
      toast.error(locale === 'fr' ? 'Maximum 10 colonnes' : 'Maximum 10 columns')
      return
    }
    setColumns([...columns, { id: generateId(), header: '', description: '' }])
  }

  // Remove column
  const removeColumn = (id: string) => {
    if (columns.length <= 2) {
      toast.error(locale === 'fr' ? 'Minimum 2 colonnes requises' : 'Minimum 2 columns required')
      return
    }
    setColumns(columns.filter(col => col.id !== id))
  }

  // Update column
  const updateColumn = (id: string, field: 'header' | 'description', value: string) => {
    setColumns(columns.map(col =>
      col.id === id ? { ...col, [field]: value } : col
    ))
  }

  // Move column
  const moveColumn = (id: string, direction: 'up' | 'down') => {
    const index = columns.findIndex(col => col.id === id)
    if (direction === 'up' && index > 0) {
      const newColumns = [...columns]
      ;[newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]]
      setColumns(newColumns)
    } else if (direction === 'down' && index < columns.length - 1) {
      const newColumns = [...columns]
      ;[newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]]
      setColumns(newColumns)
    }
  }

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    const template = tableTemplates.find(t => t.id === templateId)
    if (template) {
      // Assign unique IDs to columns
      const columnsWithIds = template.columns.map(col => ({
        ...col,
        id: generateId(),
      }))
      setColumns(columnsWithIds)
      setInstructions(template.instructions)
      setTitle(lt(template.name, locale)) // Set title from template
      setStep('build')

      // Track template for modification check (skip for blank template)
      if (templateId !== 'blank') {
        selectedTemplateIdRef.current = templateId
        // Deep copy to ensure we're comparing against the original values
        originalTemplateContentRef.current = {
          columns: columnsWithIds.map(c => ({ ...c })),
          instructions: template.instructions
        }
      } else {
        selectedTemplateIdRef.current = null
        originalTemplateContentRef.current = null
      }
    }
  }

  // Check if template content has been modified
  const hasModifiedTemplate = (): boolean => {
    if (!selectedTemplateIdRef.current || !originalTemplateContentRef.current) return true // No template = can proceed

    // Check if instructions changed
    if (instructions !== originalTemplateContentRef.current.instructions) return true

    // Check if columns count changed
    if (columns.length !== originalTemplateContentRef.current.columns.length) return true

    // Check if any column content was modified
    for (let i = 0; i < columns.length; i++) {
      const currentCol = columns[i]
      const originalCol = originalTemplateContentRef.current.columns[i]
      if (!originalCol) return true
      if (currentCol.header !== originalCol.header) return true
      if (currentCol.description !== originalCol.description) return true
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

  // Save resource
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error(locale === 'fr' ? 'Le titre est requis' : 'Title is required')
      return
    }
    if (!selectedCategory) {
      toast.error(locale === 'fr' ? 'La catégorie est requise' : 'Category is required')
      return
    }
    if (columns.some(col => !col.header.trim())) {
      toast.error(locale === 'fr' ? 'Tous les en-têtes de colonnes sont requis' : 'All column headers are required')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error(locale === 'fr' ? 'Non authentifié' : 'Not authenticated')
        router.push('/sign-in')
        return
      }

      // Resource data
      const resourceData = {
        title: title,
        description: description || null,
        category: selectedCategory,
        status: saveAs,
        visibility: visibility,
        language: resourceLanguage,
        blocks: [
          {
            id: editId ? columns[0]?.id || generateId() : generateId(),
            type: 'table_exercise',
            content: title, // Required by BaseBlock
            columns: columns.map(col => ({
              id: col.id,
              header: col.header,
              description: col.description,
            })),
            instructions: instructions || null,
          }
        ],
        settings: {
          rowMode: rowMode,
          minRows: rowMode === 'limited' ? minRows : 1,
          maxRows: rowMode === 'limited' ? maxRows : 999,
        },
      }

      // Check if we have an existing resource to update (either from edit mode or auto-saved draft)
      const existingResourceId = editId || autoSaveDraftId

      if (existingResourceId) {
        // Update existing resource (either editing or updating auto-saved draft)
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', existingResourceId)

        if (error) throw error

        toast.success(locale === 'fr' ? 'Exercice tableau mis à jour!' : 'Table exercise updated!')
        router.push(`/resources/${existingResourceId}`)
      } else {
        // Create new resource
        const { error } = await supabase
          .from('resources')
          .insert({
            ...resourceData,
            practitioner_id: user.id,
            type: 'table',
          })

        if (error) throw error

        toast.success(locale === 'fr' ? 'Exercice tableau créé!' : 'Table exercise created!')
        router.push('/resources')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const isValid = title.trim() && selectedCategory && columns.every(col => col.header.trim())
  const canProceedToDetails = title.trim() && columns.every(col => col.header.trim())

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (isAutoSavingRef.current || saving) return
    if (!title.trim() || columns.length === 0) return

    const saveToId = editId || autoSaveDraftId

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
        title: title,
        description: description || null,
        category: selectedCategory,
        status: 'draft' as const,
        visibility: 'private' as const,
        language: resourceLanguage,
        blocks: [
          {
            id: saveToId ? columns[0]?.id || generateId() : generateId(),
            type: 'table_exercise',
            content: title,
            columns: columns.map(col => ({
              id: col.id,
              header: col.header,
              description: col.description,
            })),
            instructions: instructions || null,
          }
        ],
        settings: {
          rowMode: rowMode,
          minRows: rowMode === 'limited' ? minRows : 1,
          maxRows: rowMode === 'limited' ? maxRows : 999,
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
            type: 'table',
          })
          .select('id')
          .single()

        if (error) throw error
        if (data?.id) {
          setAutoSaveDraftId(data.id)
          // Update URL with the new draft ID so refresh works
          justAutoSavedRef.current = true
          router.replace(`/resources/create/table?edit=${data.id}`, { scroll: false })
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
  }, [editId, autoSaveDraftId, saving, title, columns, description, selectedCategory, instructions, rowMode, minRows, maxRows])

  // Track changes and trigger auto-save
  const performAutoSaveRef = useRef(performAutoSave)
  performAutoSaveRef.current = performAutoSave

  useEffect(() => {
    if (loading) return
    if (editId && isInitialLoadRef.current) {
      isInitialLoadRef.current = false
      return
    }
    if (!title && columns.length === 0) return

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
  }, [title, columns, description, selectedCategory, instructions, rowMode, minRows, maxRows, editId, loading])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-gray-600"
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{locale === 'fr' ? 'Chargement...' : 'Loading...'}</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

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
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100/80 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                    <Table2 className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {locale === 'fr' ? 'Nouveau tableau' : 'New Table'}
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
                  {tableTemplates.map((template, index) => (
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
                          ? 'border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50'
                          : 'border-white/60 hover:border-emerald-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${
                        template.id === 'blank' ? 'bg-emerald-100' : 'bg-emerald-100'
                      }`}>
                        {template.id === 'blank' ? (
                          <Plus className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Table2 className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {lt(template.name, locale)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {lt(template.description, locale)}
                      </p>
                      {template.id !== 'blank' && (
                        <p className="text-xs text-emerald-600 mt-2">
                          {template.columns.length} {locale === 'fr' ? 'colonnes' : 'columns'}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* BUILD STEP */}
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
                {editId ? (
                  <Link href={`/resources/${editId}`}>
                    <motion.div whileHover={{ x: -4 }} className="inline-block">
                      <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {locale === 'fr' ? 'Retour' : 'Back'}
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <Link href="/resources/create">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="rounded-xl"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Aperçu' : 'Preview'}
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      onClick={handleContinueToDetails}
                      disabled={!canProceedToDetails}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-emerald-500 text-white">
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

              {/* Title Section */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Table2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {editId
                        ? (locale === 'fr' ? 'Modifier le tableau' : 'Edit Table')
                        : (locale === 'fr' ? 'Nouveau tableau' : 'New Table')
                      }
                    </h1>
                    <p className="text-gray-600 text-sm">
                      {locale === 'fr' ? 'Créez un tableau avec des colonnes que les membres peuvent remplir' : 'Create a table with columns that members can fill in'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Titre' : 'Title'} <span className="text-red-500">*</span>
                    </h2>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={locale === 'fr' ? 'ex: Registre de pensées' : 'e.g., Thought Record'}
                      className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all text-lg"
                    />
                  </motion.div>

            {/* Columns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {locale === 'fr' ? 'Colonnes du tableau' : 'Table Columns'}
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                {locale === 'fr'
                  ? 'Définissez les colonnes de votre tableau. Les membres pourront ajouter autant de lignes qu\'ils le souhaitent.'
                  : 'Define the columns of your table. Members will be able to add as many rows as they want.'}
              </p>

              <div className="space-y-4">
                {columns.map((column, index) => (
                  <motion.div
                    key={column.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/60"
                  >
                    <div className="flex items-start gap-3">
                      {/* Move buttons */}
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          onClick={() => moveColumn(column.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveColumn(column.id, 'down')}
                          disabled={index === columns.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {locale === 'fr' ? `En-tête colonne ${index + 1}` : `Column ${index + 1} Header`} *
                          </label>
                          <input
                            type="text"
                            value={column.header}
                            onChange={(e) => updateColumn(column.id, 'header', e.target.value)}
                            placeholder={locale === 'fr' ? 'ex: Situation' : 'e.g., Situation'}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {locale === 'fr' ? 'Description (aide)' : 'Description (helper text)'}
                          </label>
                          <input
                            type="text"
                            value={column.description}
                            onChange={(e) => updateColumn(column.id, 'description', e.target.value)}
                            placeholder={locale === 'fr' ? 'ex: Décrivez ce qui s\'est passé' : 'e.g., Describe what happened'}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => removeColumn(column.id)}
                        disabled={columns.length <= 2}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Add Column Button - at the bottom */}
                <motion.button
                  onClick={addColumn}
                  disabled={columns.length >= 10}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-500"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">
                    {locale === 'fr' ? 'Ajouter une colonne' : 'Add Column'}
                  </span>
                  <span className="text-sm text-gray-400">({columns.length}/10)</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Instructions (optionnel)' : 'Instructions (optional)'}
              </h2>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder={locale === 'fr'
                  ? 'ex: Remplissez ce tableau chaque fois que vous ressentez une émotion forte...'
                  : 'e.g., Fill out this table whenever you experience a strong emotion...'}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
              />
            </motion.div>
                  </div>

                  {/* Sidebar - Preview (Sticky) */}
                  <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Aperçu du tableau' : 'Table Preview'}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-50">
                      {columns.map((col, i) => (
                        <th
                          key={col.id}
                          className="px-3 py-2 text-left font-semibold text-emerald-800 border border-emerald-200"
                        >
                          {col.header || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-emerald-50/50">
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className="px-3 py-2 text-xs text-emerald-600 italic border border-emerald-100"
                        >
                          {col.description || '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className="px-3 py-3 text-gray-400 border border-gray-200"
                        >
                          {locale === 'fr' ? 'Entrée...' : 'Entry...'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">
                {locale === 'fr'
                  ? 'Les membres pourront ajouter plusieurs lignes'
                  : 'Members will be able to add multiple rows'}
              </p>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50/30 rounded-[1.5rem] border-2 border-emerald-200/60 p-6 shadow-lg shadow-emerald-100/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900">
                  {locale === 'fr' ? 'Conseils' : 'Tips'}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  {locale === 'fr'
                    ? 'Utilisez des en-têtes courts et clairs'
                    : 'Use short, clear headers'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  {locale === 'fr'
                    ? 'Les descriptions aident les membres à comprendre quoi écrire'
                    : 'Descriptions help members understand what to write'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                  {locale === 'fr'
                    ? '3-4 colonnes sont généralement idéales'
                    : '3-4 columns are usually ideal'}
                </li>
              </ul>
            </motion.div>
                  </div>
                </div>
            </motion.div>
          )}

          {/* DETAILS STEP */}
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
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="rounded-xl">
                  <Eye className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Aperçu' : 'Preview'}
                </Button>
              </motion.div>

              {/* Title Card */}
              <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                    <Table2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500">
                      {columns.length} {locale === 'fr' ? 'colonnes' : 'columns'}
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
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-emerald-500 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                      {locale === 'fr' ? 'Contenu' : 'Build'}
                    </span>
                  </button>

                  <div className="w-6 h-0.5 bg-emerald-500" />

                  {/* Step 2: Details */}
                  <button
                    onClick={() => setDetailsStep(1)}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      detailsStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {detailsStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${detailsStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Détails' : 'Details'}
                    </span>
                  </button>

                  <div className={`w-6 h-0.5 ${detailsStep > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

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
                      detailsStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {detailsStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '3'}
                    </div>
                    <span className={`text-sm font-medium hidden sm:inline ${detailsStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {locale === 'fr' ? 'Paramètres' : 'Settings'}
                    </span>
                  </button>

                  <div className={`w-6 h-0.5 ${detailsStep > 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

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
                      detailsStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
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
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={locale === 'fr' ? 'Décrivez brièvement cet exercice...' : 'Briefly describe this exercise...'}
                      rows={4}
                      className={`w-full px-4 py-3 bg-gray-50/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none mb-4 ${
                        !description.trim() ? 'border-gray-200/60' : 'border-emerald-300'
                      }`}
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
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
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
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50'
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

              {/* Step 2: Settings */}
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'fr' ? 'Nombre d\'entrées' : 'Number of Entries'}
                    </h2>

                    <div className="space-y-4">
                      {/* Unlimited option */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setRowMode('unlimited')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          rowMode === 'unlimited'
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            rowMode === 'unlimited' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {rowMode === 'unlimited' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <span className={`font-medium ${rowMode === 'unlimited' ? 'text-emerald-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Illimité' : 'Unlimited'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {locale === 'fr'
                                ? 'Les membres peuvent ajouter autant d\'entrées qu\'ils veulent'
                                : 'Members can add as many entries as they want'}
                            </p>
                          </div>
                        </div>
                      </motion.button>

                      {/* Limited option */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setRowMode('limited')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          rowMode === 'limited'
                            ? 'border-emerald-400 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            rowMode === 'limited' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {rowMode === 'limited' && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <span className={`font-medium ${rowMode === 'limited' ? 'text-emerald-900' : 'text-gray-700'}`}>
                              {locale === 'fr' ? 'Limité' : 'Limited'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {locale === 'fr'
                                ? 'Définir un minimum et/ou maximum d\'entrées'
                                : 'Set a minimum and/or maximum number of entries'}
                            </p>
                          </div>
                        </div>
                      </motion.button>

                      {/* Min/Max inputs when limited */}
                      {rowMode === 'limited' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="grid grid-cols-2 gap-4 pt-2"
                        >
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              {locale === 'fr' ? 'Minimum' : 'Minimum'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={maxRows}
                              value={minRows}
                              onChange={(e) => setMinRows(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                              {locale === 'fr' ? 'Maximum' : 'Maximum'}
                            </label>
                            <input
                              type="number"
                              min={minRows}
                              max={100}
                              value={maxRows}
                              onChange={(e) => setMaxRows(Math.max(minRows, parseInt(e.target.value) || minRows))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-center"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>

                  {/* Continue Button */}
                  <div className="flex justify-end mt-6">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setDetailsStep(3)}
                        className="rounded-xl px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50"
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
                      {locale === 'fr' ? 'Publier votre exercice' : 'Publish Your Table'}
                    </h2>
                    <p className="text-gray-500 mb-6">
                      {locale === 'fr' ? 'Choisissez comment enregistrer et partager votre exercice' : 'Choose how to save and share your exercise'}
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
                              <FileText className={`w-4 h-4 ${saveAs === 'draft' ? 'text-amber-700' : 'text-gray-500'}`} />
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
                                ? 'border-emerald-400 bg-emerald-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                visibility === 'private' || visibility === 'link_only' ? 'bg-emerald-200' : 'bg-gray-100'
                              }`}>
                                <Lock className={`w-4 h-4 ${visibility === 'private' || visibility === 'link_only' ? 'text-emerald-700' : 'text-gray-500'}`} />
                              </div>
                              <span className={`font-medium ${visibility === 'private' || visibility === 'link_only' ? 'text-emerald-900' : 'text-gray-700'}`}>
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
                        disabled={!isValid || saving}
                        className="rounded-xl px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {locale === 'fr' ? 'Enregistrement...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {locale === 'fr' ? 'Enregistrer' : 'Save'}
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

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {locale === 'fr' ? 'Aperçu' : 'Preview'}
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title || 'Untitled'}</h3>
                {description && <p className="text-gray-600 mb-4">{description}</p>}
                {instructions && (
                  <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-emerald-800">{instructions}</p>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-emerald-100">
                        {columns.map((col) => (
                          <th
                            key={col.id}
                            className="px-4 py-3 text-left font-semibold text-emerald-900 border border-emerald-200"
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-emerald-50/50">
                        {columns.map((col) => (
                          <td
                            key={col.id}
                            className="px-4 py-2 text-sm text-emerald-700 italic border border-emerald-100"
                          >
                            {col.description || '-'}
                          </td>
                        ))}
                      </tr>
                      {[1, 2, 3].map((row) => (
                        <tr key={row}>
                          {columns.map((col) => (
                            <td
                              key={col.id}
                              className="px-4 py-3 border border-gray-200"
                            >
                              <input
                                type="text"
                                placeholder={locale === 'fr' ? 'Tapez ici...' : 'Type here...'}
                                className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                disabled
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" size="sm" disabled className="rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    {locale === 'fr' ? 'Ajouter une ligne' : 'Add Row'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600"
            >
              {locale === 'fr' ? 'Modifier' : 'Modify'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

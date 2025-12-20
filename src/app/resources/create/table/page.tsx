'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
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

export default function CreateTableExercisePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { t, locale } = useLanguage()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | null>(null)
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: generateId(), header: '', description: '' },
    { id: generateId(), header: '', description: '' },
    { id: generateId(), header: '', description: '' },
  ])
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(!!editId)
  const [visibility, setVisibility] = useState<'private' | 'public'>('private')
  const [saveAs, setSaveAs] = useState<'draft' | 'published'>('draft')

  // Row settings
  const [rowMode, setRowMode] = useState<'unlimited' | 'limited'>('unlimited')
  const [minRows, setMinRows] = useState<number>(1)
  const [maxRows, setMaxRows] = useState<number>(10)

  // Load existing resource when editing
  useEffect(() => {
    async function loadResource() {
      if (!editId) return

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

  // Add column
  const addColumn = () => {
    if (columns.length >= 6) {
      toast.error(locale === 'fr' ? 'Maximum 6 colonnes' : 'Maximum 6 columns')
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

      if (editId) {
        // Update existing resource
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editId)

        if (error) throw error

        toast.success(locale === 'fr' ? 'Exercice tableau mis à jour!' : 'Table exercise updated!')
        router.push(`/resources/${editId}`)
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href={editId ? `/resources/${editId}` : "/resources/create"}>
            <motion.div whileHover={{ x: -4 }} className="inline-block">
              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-white/80">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {locale === 'fr' ? 'Retour' : 'Back'}
              </Button>
            </motion.div>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
              disabled={!isValid}
              className="rounded-xl"
            >
              <Eye className="w-4 h-4 mr-2" />
              {locale === 'fr' ? 'Aperçu' : 'Preview'}
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isValid || saving}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 rounded-xl"
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

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <Table2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {editId
                  ? (locale === 'fr' ? 'Modifier l\'exercice tableau' : 'Edit Table Exercise')
                  : (locale === 'fr' ? 'Nouvel exercice tableau' : 'New Table Exercise')
                }
              </h1>
              <p className="text-gray-600">
                {editId
                  ? (locale === 'fr' ? 'Modifiez les colonnes et paramètres du tableau' : 'Edit the table columns and settings')
                  : (locale === 'fr' ? 'Créez un tableau avec des colonnes que les membres peuvent remplir' : 'Create a table with columns that members can fill in')
                }
              </p>
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
                {locale === 'fr' ? 'Informations de base' : 'Basic Information'}
              </h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {locale === 'fr' ? 'Titre' : 'Title'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={locale === 'fr' ? 'ex: Registre de pensées' : 'e.g., Thought Record'}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {locale === 'fr' ? 'Description' : 'Description'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={locale === 'fr' ? 'Décrivez cet exercice...' : 'Describe this exercise...'}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'fr' ? 'Catégorie' : 'Category'} <span className="text-red-500">*</span>
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
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50'
                          : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100/80'
                      }`}
                    >
                      {t.library.categories[category]}
                    </motion.button>
                  ))}
                </div>
              </div>
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
                  disabled={columns.length >= 6}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 border-2 border-dashed border-gray-300 hover:border-emerald-400 rounded-xl text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-500"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">
                    {locale === 'fr' ? 'Ajouter une colonne' : 'Add Column'}
                  </span>
                  <span className="text-sm text-gray-400">({columns.length}/6)</span>
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

            {/* Row Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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

            {/* Visibility & Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'fr' ? 'Visibilité' : 'Visibility'}
              </h3>
              <div className="space-y-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setVisibility('private')}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    visibility === 'private'
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      visibility === 'private' ? 'bg-emerald-200' : 'bg-gray-100'
                    }`}>
                      <Lock className={`w-4 h-4 ${visibility === 'private' ? 'text-emerald-700' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <span className={`font-medium ${visibility === 'private' ? 'text-emerald-900' : 'text-gray-700'}`}>
                        {locale === 'fr' ? 'Privé' : 'Private'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {locale === 'fr' ? 'Uniquement pour vos membres' : 'Only for your members'}
                      </p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setVisibility('public')}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    visibility === 'public'
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      visibility === 'public' ? 'bg-blue-200' : 'bg-gray-100'
                    }`}>
                      <Globe className={`w-4 h-4 ${visibility === 'public' ? 'text-blue-700' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <span className={`font-medium ${visibility === 'public' ? 'text-blue-900' : 'text-gray-700'}`}>
                        {locale === 'fr' ? 'Public' : 'Public'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {locale === 'fr' ? 'Visible dans la bibliothèque' : 'Visible in the library'}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4 mt-6">
                {locale === 'fr' ? 'Statut' : 'Status'}
              </h3>
              <div className="space-y-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSaveAs('draft')}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    saveAs === 'draft'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      saveAs === 'draft' ? 'bg-amber-200' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-4 h-4 ${saveAs === 'draft' ? 'text-amber-700' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <span className={`font-medium ${saveAs === 'draft' ? 'text-amber-900' : 'text-gray-700'}`}>
                        {locale === 'fr' ? 'Brouillon' : 'Draft'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {locale === 'fr' ? 'Continuer à travailler dessus' : 'Continue working on it'}
                      </p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSaveAs('published')}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    saveAs === 'published'
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      saveAs === 'published' ? 'bg-emerald-200' : 'bg-gray-100'
                    }`}>
                      <Send className={`w-4 h-4 ${saveAs === 'published' ? 'text-emerald-700' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <span className={`font-medium ${saveAs === 'published' ? 'text-emerald-900' : 'text-gray-700'}`}>
                        {locale === 'fr' ? 'Publié' : 'Published'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {locale === 'fr' ? 'Prêt à être assigné' : 'Ready to be assigned'}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
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
    </div>
  )
}

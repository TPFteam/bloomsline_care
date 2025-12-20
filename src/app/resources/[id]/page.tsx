'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  FileText,
  ClipboardCheck,
  Puzzle,
  BookOpen,
  Edit,
  Trash2,
  Users,
  Lock,
  Globe,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  BarChart2,
  Star,
  Eye,
  MessageSquare,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Table2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { useLanguage } from '@/lib/i18n/context'
import { getResourceById, deleteResource, getResourceSubmissions, updateSubmission, type ResourceSubmission } from '@/lib/services/resources'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Resource, ResourceType, ResourceBlock } from '@/types/resource'

// Include 'assessment' as legacy type for backwards compatibility
const typeIcons: Record<ResourceType | 'assessment', React.ElementType> = {
  worksheet: FileText,
  assessment: FileText, // Legacy - displays same as worksheet
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

const typeConfig: Record<ResourceType | 'assessment', {
  gradient: string
  bg: string
  text: string
  border: string
  iconBg: string
  glow: string
  lightBg: string
}> = {
  worksheet: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
  assessment: {
    // Legacy - displays same as worksheet
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
  exercise: {
    gradient: 'from-amber-400 to-amber-600',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100/80',
    glow: 'shadow-amber-200/50',
    lightBg: 'from-amber-50 to-amber-100/50',
  },
  psychoeducation: {
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    iconBg: 'bg-purple-100/80',
    glow: 'shadow-purple-200/50',
    lightBg: 'from-purple-50 to-purple-100/50',
  },
  table: {
    gradient: 'from-emerald-400 to-emerald-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100/80',
    glow: 'shadow-emerald-200/50',
    lightBg: 'from-emerald-50 to-emerald-100/50',
  },
}

// Question type labels
const questionTypeLabels: Record<string, { en: string; fr: string }> = {
  multiple_choice: { en: 'Multiple Choice', fr: 'Choix multiple' },
  likert: { en: 'Likert Scale', fr: 'Échelle de Likert' },
  yes_no: { en: 'Yes/No', fr: 'Oui/Non' },
  numeric: { en: 'Numeric', fr: 'Numérique' },
  text: { en: 'Text', fr: 'Texte' },
  checklist: { en: 'Checklist', fr: 'Liste de contrôle' },
  scale: { en: 'Scale', fr: 'Échelle' },
  mood: { en: 'Mood', fr: 'Humeur' },
  slider: { en: 'Slider', fr: 'Curseur' },
  matrix_rating: { en: 'Matrix Rating', fr: 'Évaluation matricielle' },
}

// Helper to render response values based on block type
function renderResponseValue(block: ResourceBlock, value: unknown, locale: string): string {
  if (value === undefined || value === null) return '-'

  switch (block.type) {
    case 'prompt':
      return String(value)

    case 'multiple_choice': {
      const options: (string | { label?: string })[] =
        ('options' in block && Array.isArray(block.options)) ? block.options :
        ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
      const index = Number(value)
      const option = options[index]
      return typeof option === 'string' ? option : option?.label || `Option ${index + 1}`
    }

    case 'yes_no':
      return value === 'yes'
        ? (locale === 'fr' ? 'Oui' : 'Yes')
        : (locale === 'fr' ? 'Non' : 'No')

    case 'checklist': {
      const items: (string | { text: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
      const indices = Array.isArray(value) ? value : []
      return indices
        .map((i: number) => {
          const item = items[i]
          return typeof item === 'string' ? item : item?.text || String(i)
        })
        .join(', ') || '-'
    }

    case 'scale':
    case 'likert':
    case 'numeric':
    case 'slider':
    case 'mood':
      return String(value)

    case 'matrix_rating': {
      const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
      const ratings = value as Record<string, number>
      return Object.entries(ratings)
        .map(([idx, rating]) => `${matrixItems[Number(idx)] || idx}: ${rating}`)
        .join(', ')
    }

    case 'date_picker':
      return value ? new Date(String(value)).toLocaleDateString() : '-'

    case 'time_input':
      return String(value)

    case 'list_input':
      return Array.isArray(value) ? value.filter(Boolean).join(', ') : '-'

    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
}

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLanguage()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<ResourceSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    async function fetchResource() {
      try {
        // Get current user
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Current user:', user?.id)

        const data = await getResourceById(params.id as string)
        console.log('Resource practitioner_id:', data?.practitioner_id)
        console.log('Match:', user?.id === data?.practitioner_id)
        setResource(data)

        // Check if current user is the owner
        if (user && data && data.practitioner_id === user.id) {
          console.log('Setting isOwner to true')
          setIsOwner(true)
          // Fetch submissions if owner
          fetchSubmissions(params.id as string)
        }
      } catch (error) {
        console.error('Error fetching resource:', error)
        toast.error(locale === 'fr' ? 'Erreur lors du chargement' : 'Error loading resource')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchResource()
    }
  }, [params.id, locale])

  const fetchSubmissions = async (resourceId: string) => {
    setLoadingSubmissions(true)
    try {
      const data = await getResourceSubmissions(resourceId)
      setSubmissions(data)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleSaveReviewNotes = async () => {
    if (!selectedSubmission) return

    setSavingNotes(true)
    try {
      await updateSubmission(selectedSubmission.id, {
        status: 'reviewed',
        practitioner_notes: reviewNotes
      })
      toast.success(locale === 'fr' ? 'Notes enregistrées' : 'Notes saved')
      // Refresh submissions
      fetchSubmissions(params.id as string)
      setSelectedSubmission(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Error saving notes:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleDelete = async () => {
    if (!resource) return

    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Êtes-vous sûr de vouloir supprimer cette ressource?'
        : 'Are you sure you want to delete this resource?'
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      await deleteResource(resource.id)
      toast.success(locale === 'fr' ? 'Ressource supprimée' : 'Resource deleted')
      router.push('/resources')
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting resource')
    } finally {
      setDeleting(false)
    }
  }

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

  if (!resource) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/90 backdrop-blur-xl rounded-[1.5rem] p-8 shadow-lg shadow-gray-200/40 border border-white/60"
        >
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'fr' ? 'Ressource non trouvée' : 'Resource not found'}
          </h1>
          <Link href="/resources">
            <Button className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl">
              {locale === 'fr' ? 'Retour aux ressources' : 'Back to Resources'}
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  // Handle legacy 'assessment' type as 'worksheet' for display
  const displayType = (resource.type as string) === 'assessment' ? 'worksheet' : resource.type
  const TypeIcon = typeIcons[resource.type as ResourceType | 'assessment'] || FileText
  const config = typeConfig[resource.type as ResourceType | 'assessment'] || typeConfig.worksheet

  // Get scoring settings - works for legacy assessments AND scored worksheets
  const isLegacyAssessment = (resource.type as string) === 'assessment'
  const worksheetSettings = resource.settings as {
    questions?: Array<{
      id: string
      type: string
      text?: string
      question?: string
      required?: boolean
      options?: Array<{ label: string; score: number } | string>
      scaleLabels?: string[]
      scaleRange?: number
      likertScale?: number
      likertLabels?: { start: string; end: string }
      yesScore?: number
      noScore?: number
      minValue?: number
      maxValue?: number
      moodOptions?: Array<{ emoji: string; label: string; value?: number; score?: number }>
      items?: Array<{ text: string; checked: boolean } | string>
      scaleMin?: number
      scaleMax?: number
      scaleMinLabel?: string
      scaleMaxLabel?: string
      scoring?: { [key: string]: number }
    }>
    enableScoring?: boolean
    showScoreToMember?: boolean
    scoringRanges?: Array<{ min: number; max: number; label: { en: string; fr: string } } | { minScore: number; maxScore: number; label: string; description: string }>
    maxScore?: number
    instructions?: string
  } | null

  const hasScoring = isLegacyAssessment || worksheetSettings?.enableScoring

  const typeLabels: Record<string, string> = {
    worksheet: locale === 'fr' ? 'Feuille de travail' : 'Worksheet',
    assessment: locale === 'fr' ? 'Feuille de travail' : 'Worksheet', // Legacy - shows as worksheet
    exercise: locale === 'fr' ? 'Exercice' : 'Exercise',
    psychoeducation: locale === 'fr' ? 'Psychoéducation' : 'Psychoeducation',
  }
  const typeLabel = typeLabels[resource.type as string] || typeLabels.worksheet

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-lavender-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Resources', labelFr: 'Ressources', href: '/resources', icon: <FileText className="w-4 h-4" /> },
              { label: typeof resource.title === 'string' ? resource.title : 'Resource' },
            ]}
          />
        </div>

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
                    {typeLabel}
                  </Badge>
                  <Badge className={resource.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-amber-50 text-amber-700 border-amber-200 border'}>
                    {resource.status === 'published'
                      ? (locale === 'fr' ? 'Publié' : 'Published')
                      : (locale === 'fr' ? 'Brouillon' : 'Draft')
                    }
                  </Badge>
                </div>
              </div>

              {/* Title & Meta */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{typeof resource.title === 'string' ? resource.title : ''}</h1>
                {resource.description && (
                  <p className="text-gray-600 mb-5 leading-relaxed">{typeof resource.description === 'string' ? resource.description : ''}</p>
                )}

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {resource.category && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                      {typeof resource.category === 'string' ? resource.category : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                    {resource.visibility === 'public' ? (
                      <>
                        <Globe className="w-4 h-4 text-gray-400" />
                        {locale === 'fr' ? 'Public' : 'Public'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-gray-400" />
                        {locale === 'fr' ? 'Privé' : 'Private'}
                      </>
                    )}
                  </span>
                  {resource.times_assigned > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      {resource.times_assigned} {locale === 'fr' ? 'assigné(s)' : 'assigned'}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {resource.tags.map((tag, idx) => (
                      <span
                        key={typeof tag === 'string' ? tag : idx}
                        className="text-xs px-3 py-1.5 bg-lavender-50 text-lavender-700 rounded-full"
                      >
                        {typeof tag === 'string' ? tag : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {locale === 'fr' ? 'Créé le' : 'Created'} {new Date(resource.created_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                  {resource.times_completed > 0 && (
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      {resource.times_completed} {locale === 'fr' ? 'complété(s)' : 'completed'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Table Exercise Preview */}
            {resource.type === 'table' && resource.blocks && resource.blocks.length > 0 && (() => {
              const tableBlock = resource.blocks.find((b: ResourceBlock) => b.type === 'table_exercise')
              if (!tableBlock) return null
              const columns = ('columns' in tableBlock && Array.isArray(tableBlock.columns)) ? tableBlock.columns : []
              const tableInstructions = ('instructions' in tableBlock && typeof tableBlock.instructions === 'string') ? tableBlock.instructions : null

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                        <Table2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {locale === 'fr' ? 'Structure du tableau' : 'Table Structure'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {columns.length} {locale === 'fr' ? 'colonne(s)' : 'column(s)'}
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  {tableInstructions && (
                    <div className="mb-5 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <p className="text-sm text-emerald-700">{tableInstructions}</p>
                    </div>
                  )}

                  {/* Table Preview */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-emerald-100">
                          {columns.map((col: { id: string; header: string; description?: string }) => (
                            <th
                              key={col.id}
                              className="px-4 py-3 text-left font-semibold text-emerald-900 border-b border-emerald-200"
                            >
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Description row */}
                        {columns.some((col: { description?: string }) => col.description) && (
                          <tr className="bg-emerald-50/50">
                            {columns.map((col: { id: string; description?: string }) => (
                              <td
                                key={col.id}
                                className="px-4 py-2 text-xs text-emerald-700 italic border-b border-emerald-100"
                              >
                                {col.description || '-'}
                              </td>
                            ))}
                          </tr>
                        )}
                        {/* Sample entry row */}
                        <tr>
                          {columns.map((col: { id: string }) => (
                            <td
                              key={col.id}
                              className="px-4 py-3 text-gray-400 border-b border-gray-100"
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
              )
            })()}

            {/* Assessment/Scored Worksheet Questions Preview */}
            {hasScoring && worksheetSettings?.questions && worksheetSettings.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                      <ClipboardCheck className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === 'fr' ? 'Questions' : 'Questions'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {worksheetSettings.questions.length} {locale === 'fr' ? 'question(s)' : 'question(s)'}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                {worksheetSettings.instructions && (
                  <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-700">{typeof worksheetSettings.instructions === 'string' ? worksheetSettings.instructions : (worksheetSettings.instructions as Record<string, string>)?.[locale] || ''}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {worksheetSettings.questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-4 bg-gray-50/80 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium text-gray-900">{question.question || question.text || ''}</p>
                            {question.required && (
                              <span className="text-xs text-red-500">*</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {questionTypeLabels[question.type]?.[locale] || question.type}
                            </Badge>
                            {hasScoring && question.type === 'multiple_choice' && question.options && (
                              <span className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Score max:' : 'Max score:'} {Math.max(...question.options.map(o => typeof o === 'object' && 'score' in o ? (o.score || 0) : 0))} pts
                              </span>
                            )}
                            {hasScoring && question.type === 'likert' && (
                              <span className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Score max:' : 'Max score:'} {(question.scaleRange || question.likertScale || 5) - 1} pts
                              </span>
                            )}
                          </div>

                          {/* Show options preview */}
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <Circle className="w-3 h-3" />
                                  <span>{typeof opt === 'string' ? opt : (typeof opt === 'object' && 'label' in opt ? opt.label : JSON.stringify(opt))}</span>
                                  {hasScoring && typeof opt === 'object' && 'score' in opt && (
                                    <span className="text-xs text-gray-400">({opt.score} pts)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'likert' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{question.scaleLabels?.[0] || question.likertLabels?.start || '1'}</span>
                              <div className="flex gap-1">
                                {Array.from({ length: question.scaleRange || question.likertScale || 5 }).map((_, i) => (
                                  <div key={i} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">
                                    {i + 1}
                                  </div>
                                ))}
                              </div>
                              <span>{question.scaleLabels?.[question.scaleLabels.length - 1] || question.likertLabels?.end || (question.scaleRange || question.likertScale || 5).toString()}</span>
                            </div>
                          )}

                          {question.type === 'yes_no' && (
                            <div className="mt-3 flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                {locale === 'fr' ? 'Oui' : 'Yes'}
                                {hasScoring && <span className="text-xs">({question.yesScore || question.scoring?.yes || 1} pt)</span>}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Circle className="w-4 h-4" />
                                {locale === 'fr' ? 'Non' : 'No'}
                                {hasScoring && <span className="text-xs">({question.noScore || question.scoring?.no || 0} pt)</span>}
                              </span>
                            </div>
                          )}

                          {question.type === 'mood' && question.moodOptions && (
                            <div className="mt-3 flex items-center gap-2">
                              {question.moodOptions.map((mood, i) => (
                                <div key={i} className="text-center">
                                  <span className="text-xl">{mood.emoji}</span>
                                  <p className="text-xs text-gray-500">{typeof mood.label === 'string' ? mood.label : ''}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'checklist' && question.items && (
                            <div className="mt-3 space-y-1">
                              {question.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <div className="w-4 h-4 rounded border border-gray-300" />
                                  <span>{typeof item === 'string' ? item : (typeof item === 'object' && 'text' in item ? item.text : '')}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {question.type === 'scale' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{typeof question.scaleMinLabel === 'string' ? question.scaleMinLabel : (question.scaleMin || 0)}</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                              <span>{typeof question.scaleMaxLabel === 'string' ? question.scaleMaxLabel : (question.scaleMax || 10)}</span>
                            </div>
                          )}

                          {question.type === 'slider' && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                              <span>{question.minValue || 0}</span>
                              <div className="flex-1 h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full" />
                              <span>{question.maxValue || 100}</span>
                            </div>
                          )}

                          {question.type === 'matrix_rating' && (
                            <div className="mt-3">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr>
                                      <th className="text-left py-2 pr-4 text-gray-500 font-normal"></th>
                                      {Array.from({ length: (question as any).matrixScaleMax || 5 }).map((_, i) => (
                                        <th key={i} className="px-2 py-2 text-center text-gray-500 font-normal">
                                          {i + 1}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {((question as any).matrixItems || []).map((item: string, i: number) => (
                                      <tr key={i} className="border-t border-gray-100">
                                        <td className="py-2 pr-4 text-gray-700">{item}</td>
                                        {Array.from({ length: (question as any).matrixScaleMax || 5 }).map((_, j) => (
                                          <td key={j} className="px-2 py-2 text-center">
                                            <Circle className="w-4 h-4 text-gray-300 mx-auto" />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              {(question as any).matrixScaleLabels && (
                                <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                                  <span>{(question as any).matrixScaleLabels.min}</span>
                                  <span>{(question as any).matrixScaleLabels.max}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Scoring Interpretation */}
            {hasScoring && worksheetSettings?.scoringRanges && worksheetSettings.scoringRanges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-md">
                      <BarChart2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Interprétation des scores' : 'Score Interpretation'}
                  </h2>
                </div>

                <div className="space-y-3">
                  {worksheetSettings.scoringRanges.map((range, index) => {
                    const colors = ['bg-emerald-100 text-emerald-700 border-emerald-200', 'bg-yellow-100 text-yellow-700 border-yellow-200', 'bg-orange-100 text-orange-700 border-orange-200', 'bg-red-100 text-red-700 border-red-200']
                    const color = colors[Math.min(index, colors.length - 1)]
                    // Handle both legacy (minScore/maxScore) and new (min/max) formats
                    const minVal = 'min' in range ? range.min : (range as any).minScore
                    const maxVal = 'max' in range ? range.max : (range as any).maxScore
                    const labelVal = typeof range.label === 'object' && 'en' in range.label ? range.label[locale] : (typeof range.label === 'string' ? range.label : '')
                    const descVal = 'description' in range && range.description ? (typeof range.description === 'object' && 'en' in range.description ? range.description[locale] : (typeof range.description === 'string' ? range.description : '')) : ''

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border ${color}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{labelVal}</span>
                          <span className="text-sm">
                            {minVal} - {maxVal} pts
                          </span>
                        </div>
                        {descVal && (
                          <p className="text-sm opacity-80">{descVal}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Worksheet Blocks Preview */}
            {resource.type === 'worksheet' && resource.blocks && resource.blocks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/80 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === 'fr' ? 'Contenu' : 'Content'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {resource.blocks.length} {locale === 'fr' ? 'bloc(s)' : 'block(s)'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {resource.blocks.map((block, index) => (
                    <div
                      key={block.id || index}
                      className="p-4 bg-gray-50/80 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {block.type}
                        </Badge>
                      </div>
                      {block.type === 'heading' && (
                        <h3 className="text-lg font-semibold text-gray-900">{typeof block.content === 'string' ? block.content : ''}</h3>
                      )}
                      {block.type === 'paragraph' && (
                        <p className="text-gray-700">{typeof block.content === 'string' ? block.content : ''}</p>
                      )}
                      {block.type === 'prompt' && (
                        <div className="p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-gray-700 mb-2">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="h-20 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-400">
                            {locale === 'fr' ? 'Zone de réponse' : 'Response area'}
                          </div>
                        </div>
                      )}
                      {block.type === 'checklist' && 'items' in block && (
                        <div className="space-y-2">
                          <p className="text-gray-700 mb-2">{typeof block.content === 'string' ? block.content : ''}</p>
                          {block.items?.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-4 h-4 rounded border border-gray-300" />
                              <span>{typeof item === 'string' ? item : ''}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {block.type === 'scale' && 'scaleMin' in block && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{typeof block.scaleMinLabel === 'string' ? block.scaleMinLabel : block.scaleMin}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                            <span className="text-sm text-gray-500">{typeof block.scaleMaxLabel === 'string' ? block.scaleMaxLabel : block.scaleMax}</span>
                          </div>
                        </div>
                      )}
                      {block.type === 'matrix_rating' && 'matrixItems' in block && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="text-left py-2 pr-4 text-gray-500 font-normal"></th>
                                  {Array.from({ length: (block as any).matrixScaleMax || 5 }).map((_, i) => (
                                    <th key={i} className="px-2 py-2 text-center text-gray-500 font-normal">
                                      {i + 1}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {((block as any).matrixItems || []).map((item: string, i: number) => (
                                  <tr key={i} className="border-t border-gray-100">
                                    <td className="py-2 pr-4 text-gray-700">{item}</td>
                                    {Array.from({ length: (block as any).matrixScaleMax || 5 }).map((_, j) => (
                                      <td key={j} className="px-2 py-2 text-center">
                                        <Circle className="w-4 h-4 text-gray-300 mx-auto" />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {(block as any).matrixScaleLabels && (
                            <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                              <span>{(block as any).matrixScaleLabels.min}</span>
                              <span>{(block as any).matrixScaleLabels.max}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === 'likert' && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{(block as any).likertLabels?.start || '1'}</span>
                            <div className="flex gap-1">
                              {Array.from({ length: (block as any).likertScale || 5 }).map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-xs">
                                  {i + 1}
                                </div>
                              ))}
                            </div>
                            <span>{(block as any).likertLabels?.end || ((block as any).likertScale || 5).toString()}</span>
                          </div>
                        </div>
                      )}
                      {block.type === 'multiple_choice' && ('options' in block || 'choices' in block) && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="space-y-1">
                            {((block as any).options || (block as any).choices || []).map((opt: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <Circle className="w-3 h-3" />
                                <span>{typeof opt === 'string' ? opt : opt.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {block.type === 'yes_no' && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="w-4 h-4" />
                              {locale === 'fr' ? 'Oui' : 'Yes'}
                            </span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <Circle className="w-4 h-4" />
                              {locale === 'fr' ? 'Non' : 'No'}
                            </span>
                          </div>
                        </div>
                      )}
                      {block.type === 'mood' && 'moodOptions' in block && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="flex items-center gap-2">
                            {((block as any).moodOptions || []).map((mood: any, i: number) => (
                              <div key={i} className="text-center">
                                <span className="text-xl">{mood.emoji}</span>
                                <p className="text-xs text-gray-500">{mood.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {block.type === 'numeric' && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="w-24 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                            {locale === 'fr' ? 'Nombre' : 'Number'}
                          </div>
                        </div>
                      )}
                      {block.type === 'slider' && (
                        <div>
                          <p className="text-gray-700 mb-3">{typeof block.content === 'string' ? block.content : ''}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{(block as any).sliderMin || 0}</span>
                            <div className="flex-1 h-2 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full" />
                            <span>{(block as any).sliderMax || 100}</span>
                          </div>
                        </div>
                      )}
                    </div>
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
              {/* Only show edit/delete buttons if the user is the owner */}
              {isOwner && (
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 shadow-lg shadow-lavender-200/50"
                      onClick={() => router.push(`/resources/create/${resource.type}?edit=${resource.id}`)}
                    >
                      <Edit className="w-5 h-5 mr-2" />
                      {locale === 'fr' ? 'Modifier' : 'Edit'}
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 transition-all"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      {locale === 'fr' ? 'Supprimer' : 'Delete'}
                    </Button>
                  </motion.div>
                </div>
              )}

              {/* Resource Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {locale === 'fr' ? 'Type' : 'Type'}
                  </p>
                  <div className={`inline-flex items-center px-3 py-2 ${config.bg} rounded-xl border ${config.border}`}>
                    <TypeIcon className={`w-4 h-4 mr-2 ${config.text}`} />
                    <span className={`text-sm font-medium ${config.text}`}>{typeLabel}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {locale === 'fr' ? 'Statut' : 'Status'}
                  </p>
                  <Badge className={resource.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border' : 'bg-amber-50 text-amber-700 border-amber-200 border'}>
                    {resource.status === 'published'
                      ? (locale === 'fr' ? 'Publié' : 'Published')
                      : resource.status === 'draft'
                      ? (locale === 'fr' ? 'Brouillon' : 'Draft')
                      : (locale === 'fr' ? 'Archivé' : 'Archived')
                    }
                  </Badge>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {locale === 'fr' ? 'Visibilité' : 'Visibility'}
                  </p>
                  <Badge className={resource.visibility === 'public' ? 'bg-blue-50 text-blue-700 border-blue-200 border' : 'bg-gray-50 text-gray-700 border-gray-200 border'}>
                    {resource.visibility === 'public' ? (
                      <>
                        <Globe className="w-3 h-3 mr-1" />
                        {locale === 'fr' ? 'Public' : 'Public'}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        {locale === 'fr' ? 'Privé' : 'Private'}
                      </>
                    )}
                  </Badge>
                </div>

                {resource.category && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                      {locale === 'fr' ? 'Catégorie' : 'Category'}
                    </p>
                    <span className="text-sm text-gray-700">{typeof resource.category === 'string' ? resource.category : ''}</span>
                  </div>
                )}

                {/* Creator Profile Section */}
                {resource.creator_profile && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                      {locale === 'fr' ? 'Créé par' : 'Created by'}
                    </p>
                    <Link href={resource.creator_profile.slug ? `/p/${resource.creator_profile.slug}` : `/p/${resource.creator_profile.id}`}>
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
                                alt={resource.creator_profile.full_name || ''}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center shadow-md">
                                <span className="text-lg font-bold text-white">
                                  {(resource.creator_profile.full_name || 'P').charAt(0).toUpperCase()}
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
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-lavender-700 transition-colors">
                              {resource.creator_profile.full_name || (locale === 'fr' ? 'Praticien' : 'Practitioner')}
                            </p>

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
                                {resource.creator_profile.years_experience}+ {locale === 'fr' ? 'ans d\'expérience' : 'years experience'}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-lavender-500 transition-colors flex-shrink-0 mt-1" />
                        </div>
                      </motion.div>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Submissions Section - Only show for owner */}
        {isOwner && (resource.type === 'worksheet' || (resource.type as string) === 'assessment') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-[1.5rem] shadow-lg shadow-gray-200/40 border border-white/60 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-lavender-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-lavender-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {locale === 'fr' ? 'Soumissions des membres' : 'Member Submissions'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {submissions.length} {locale === 'fr' ? 'soumission(s)' : 'submission(s)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions List */}
              <div className="divide-y divide-gray-100">
                {loadingSubmissions ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-lavender-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">{locale === 'fr' ? 'Chargement...' : 'Loading...'}</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      {locale === 'fr' ? 'Aucune soumission pour le moment' : 'No submissions yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {locale === 'fr'
                        ? 'Les soumissions des membres apparaîtront ici'
                        : 'Member submissions will appear here'}
                    </p>
                  </div>
                ) : (
                  submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="p-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Member Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {submission.member?.first_name?.charAt(0) || 'M'}{submission.member?.last_name?.charAt(0) || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {submission.member?.first_name} {submission.member?.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Score & Status */}
                        <div className="flex items-center gap-3">
                          {/* Score for scored worksheets/assessments */}
                          {hasScoring && submission.scores?.total !== undefined && (
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600">
                                {submission.scores.total}/{submission.scores.maxScore}
                              </p>
                              {submission.scores.percentage !== undefined && (
                                <p className="text-xs text-gray-500">{submission.scores.percentage}%</p>
                              )}
                            </div>
                          )}

                          {/* Status Badge */}
                          <Badge className={
                            submission.status === 'reviewed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 border'
                              : 'bg-amber-50 text-amber-700 border-amber-200 border'
                          }>
                            {submission.status === 'reviewed' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                {locale === 'fr' ? 'Révisé' : 'Reviewed'}
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                {locale === 'fr' ? 'En attente' : 'Pending'}
                              </>
                            )}
                          </Badge>

                          {/* View Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setReviewNotes(submission.practitioner_notes || '')
                            }}
                            className="rounded-lg"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {locale === 'fr' ? 'Voir' : 'View'}
                          </Button>
                        </div>
                      </div>

                      {/* Reviewer Notes Preview */}
                      {submission.practitioner_notes && (
                        <div className="mt-3 ml-13 pl-3 border-l-2 border-lavender-200">
                          <p className="text-sm text-gray-600 line-clamp-2">{submission.practitioner_notes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSubmission(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lavender-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {selectedSubmission.member?.first_name?.charAt(0) || 'M'}{selectedSubmission.member?.last_name?.charAt(0) || ''}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedSubmission.member?.first_name} {selectedSubmission.member?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Score Section for Scored Worksheets/Assessments */}
                {hasScoring && selectedSubmission.scores?.total !== undefined && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-mint-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-800">
                          {locale === 'fr' ? 'Score total' : 'Total Score'}
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1">
                          {selectedSubmission.scores.total} / {selectedSubmission.scores.maxScore}
                        </p>
                      </div>
                      {selectedSubmission.scores.percentage !== undefined && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-base px-4 py-2">
                          {selectedSubmission.scores.percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Responses Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    {locale === 'fr' ? 'Réponses' : 'Responses'}
                  </h4>
                  <div className="space-y-3">
                    {(() => {
                      // Get question blocks from resource
                      const blocks = (resource?.blocks || []) as ResourceBlock[]
                      const questionBlocks = blocks.filter(b =>
                        ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
                         'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input'].includes(b.type)
                      )
                      const responses = (selectedSubmission.responses || {}) as Record<string, unknown>

                      if (questionBlocks.length === 0) {
                        return (
                          <p className="text-gray-500 text-sm italic">
                            {locale === 'fr' ? 'Aucune question dans cette ressource' : 'No questions in this resource'}
                          </p>
                        )
                      }

                      return questionBlocks.map((block, index) => {
                        const response = responses[block.id]
                        const hasResponse = response !== undefined && response !== null && response !== ''

                        return (
                          <div
                            key={block.id}
                            className={`p-4 rounded-xl ${hasResponse ? 'bg-gray-50' : 'bg-red-50/50'}`}
                          >
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Q{index + 1}: {typeof block.content === 'string' ? block.content : ''}
                            </p>
                            <p className={`text-sm ${hasResponse ? 'text-gray-900' : 'text-red-500 italic'}`}>
                              {hasResponse
                                ? renderResponseValue(block, response, locale)
                                : (locale === 'fr' ? 'Non répondu' : 'Not answered')}
                            </p>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Review Notes Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {locale === 'fr' ? 'Notes du praticien' : 'Practitioner Notes'}
                  </h4>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={locale === 'fr' ? 'Ajoutez vos notes ici...' : 'Add your notes here...'}
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-lavender-400 focus:ring-4 focus:ring-lavender-100 outline-none resize-none h-32"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-xl"
                >
                  {locale === 'fr' ? 'Fermer' : 'Close'}
                </Button>
                <Button
                  onClick={handleSaveReviewNotes}
                  disabled={savingNotes}
                  className="bg-gradient-to-r from-lavender-500 to-lavender-600 hover:from-lavender-600 hover:to-lavender-700 text-white rounded-xl shadow-lg shadow-lavender-300/50"
                >
                  {savingNotes ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {locale === 'fr' ? 'Marquer comme révisé' : 'Mark as Reviewed'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <motion.div whileHover={{ x: -4 }} className="inline-block">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="rounded-xl hover:bg-white/80 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {locale === 'fr' ? 'Retour' : 'Go Back'}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

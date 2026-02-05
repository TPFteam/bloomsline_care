'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Loader2,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Save,
  Cloud,
  CloudOff,
  Table2,
  X,
  Eye,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  getMemberRecord,
  getMemberAssignmentById,
  getOrCreateDraftResponse,
  submitResponse,
  calculateWorksheetScore,
  type MemberAssignment,
  type WorksheetSettings,
  type ScoreResult,
} from '@/lib/services/member-resources'
import { useAutoSaveDraft, type AutoSaveStatus } from '@/lib/hooks/useAutoSaveDraft'
import { BlockRenderer } from '@/components/resources/BlockRenderer'
import { toast } from 'sonner'
import type { Member } from '@/types/member'
import type { ResourceBlock, ResourceResponse } from '@/types/resource'

// Auto-save status indicator component
function AutoSaveIndicator({ status, lastSavedAt }: { status: AutoSaveStatus; lastSavedAt: Date | null }) {
  const { locale } = useLanguage()

  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: locale === 'fr' ? 'Modifications non enregistrées' : locale === 'es' ? 'Cambios sin guardar' : 'Unsaved changes',
          color: 'text-amber-600',
        }
      case 'saving':
        return {
          icon: Loader2,
          text: locale === 'fr' ? 'Enregistrement...' : locale === 'es' ? 'Guardando...' : 'Saving...',
          color: 'text-blue-600',
          animate: true,
        }
      case 'saved':
        return {
          icon: Cloud,
          text: locale === 'fr' ? 'Enregistré' : locale === 'es' ? 'Guardado' : 'Saved',
          color: 'text-emerald-600',
        }
      case 'error':
        return {
          icon: CloudOff,
          text: locale === 'fr' ? 'Erreur de sauvegarde' : locale === 'es' ? 'Error al guardar' : 'Save error',
          color: 'text-red-600',
        }
      default:
        if (lastSavedAt) {
          return {
            icon: CheckCircle,
            text: locale === 'fr' ? 'Brouillon enregistré' : locale === 'es' ? 'Borrador guardado' : 'Draft saved',
            color: 'text-gray-500',
          }
        }
        return null
    }
  }

  const statusInfo = getStatusInfo()
  if (!statusInfo) return null

  const Icon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-sm ${statusInfo.color}`}
    >
      <Icon className={`w-4 h-4 ${statusInfo.animate ? 'animate-spin' : ''}`} />
      <span>{statusInfo.text}</span>
    </motion.div>
  )
}

// Submission confirmation modal
function SubmissionConfirmation({
  isOpen,
  onClose,
  scores,
  resourceTitle,
}: {
  isOpen: boolean
  onClose: () => void
  scores: ScoreResult | null
  resourceTitle: string
}) {
  const { locale } = useLanguage()
  const router = useRouter()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
        >
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {locale === 'fr' ? 'Soumis avec succès!' : locale === 'es' ? '¡Enviado con éxito!' : 'Successfully Submitted!'}
          </h2>

          <p className="text-center text-gray-600 mb-6">
            {locale === 'fr'
              ? `Vos réponses pour "${resourceTitle}" ont été soumises.`
              : locale === 'es'
                ? `Sus respuestas para "${resourceTitle}" han sido enviadas.`
                : `Your responses for "${resourceTitle}" have been submitted.`}
          </p>

          {/* Score Display */}
          {scores && (
            <div className="bg-gradient-to-br from-teal-50 to-lavender-50 rounded-2xl p-6 mb-6 border border-teal-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3 text-center">
                {locale === 'fr' ? 'Votre Score' : locale === 'es' ? 'Su Puntuación' : 'Your Score'}
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-teal-600 mb-1">
                  {scores.total}
                  <span className="text-lg text-gray-400">/{scores.maxScore}</span>
                </div>
                <div className="text-sm text-gray-500 mb-3">
                  {scores.percentage}%
                </div>
                {scores.interpretation && (
                  <div className="inline-block px-4 py-2 bg-white rounded-full text-sm font-medium text-teal-700 border border-teal-200">
                    {scores.interpretation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/home')}
              className="flex-1 rounded-full"
            >
              {locale === 'fr' ? 'Voir mes ressources' : locale === 'es' ? 'Ver mis recursos' : 'View My Resources'}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
            >
              {locale === 'fr' ? 'Fermer' : locale === 'es' ? 'Cerrar' : 'Close'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function FillResourcePage() {
  const router = useRouter()
  const params = useParams()
  const assignmentId = params.id as string
  const { locale } = useLanguage()

  const [member, setMember] = useState<Member | null>(null)
  const [assignment, setAssignment] = useState<MemberAssignment | null>(null)
  const [response, setResponse] = useState<ResourceResponse | null>(null)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submissionScores, setSubmissionScores] = useState<ScoreResult | null>(null)
  const [showTableView, setShowTableView] = useState(false)

  // Check if this is a table exercise
  const isTableExercise = assignment?.resource?.type === 'table'

  // Check if this is psychoeducation (read-only content)
  const isPsychoeducation = assignment?.resource?.type === 'psychoeducation'

  // Get blocks from resource
  const blocks: ResourceBlock[] = useMemo(() => {
    if (!assignment?.resource?.blocks) return []
    return assignment.resource.blocks as ResourceBlock[]
  }, [assignment])

  // Get question blocks only
  const questionBlocks = useMemo(() => {
    return blocks.filter(block =>
      ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
       'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input', 'table_exercise'].includes(block.type)
    )
  }, [blocks])

  // Calculate progress
  const progress = useMemo(() => {
    if (questionBlocks.length === 0) return 100
    const answered = questionBlocks.filter(block => {
      const value = responses[block.id]
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'object' && Object.keys(value).length === 0) return false
      return true
    }).length
    return Math.round((answered / questionBlocks.length) * 100)
  }, [questionBlocks, responses])

  // Auto-save hook
  const {
    status: autoSaveStatus,
    lastSavedAt,
    saveNow,
  } = useAutoSaveDraft({
    responseId: response?.id || null,
    responses,
    enabled: !!response && response.status === 'draft',
    debounceMs: 3000,
  })

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/sign-in')
          return
        }

        // Get member record
        const memberData = await getMemberRecord()
        if (!memberData) {
          toast.error(
            locale === 'fr'
              ? 'Aucun profil membre trouvé'
              : locale === 'es'
                ? 'No se encontró perfil de miembro'
                : 'No member profile found'
          )
          router.push('/dashboard')
          return
        }
        setMember(memberData)

        // Get assignment
        const assignmentData = await getMemberAssignmentById(assignmentId, memberData.id)
        if (!assignmentData) {
          toast.error(
            locale === 'fr'
              ? 'Ressource non trouvée'
              : locale === 'es'
                ? 'Recurso no encontrado'
                : 'Resource not found'
          )
          router.push('/home')
          return
        }
        setAssignment(assignmentData)

        // Get or create draft response
        const responseData = await getOrCreateDraftResponse(
          assignmentId,
          assignmentData.resource.id,
          memberData.id,
          assignmentData.practitioner_id
        )
        setResponse(responseData)

        // Load existing responses
        if (responseData.responses && typeof responseData.responses === 'object') {
          setResponses(responseData.responses as Record<string, unknown>)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error(
          locale === 'fr'
            ? 'Erreur lors du chargement'
            : locale === 'es'
              ? 'Error al cargar el recurso'
              : 'Error loading resource'
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [assignmentId, locale, router])

  // Handle response change
  const handleResponseChange = (blockId: string, value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [blockId]: value,
    }))
  }

  // Handle save for table exercises (saves without submitting)
  const handleSaveTableExercise = async () => {
    if (!response) return

    setSubmitting(true)
    try {
      await saveNow()
      toast.success(
        locale === 'fr'
          ? 'Entrées enregistrées'
          : locale === 'es'
            ? 'Entradas guardadas'
            : 'Entries saved'
      )
    } catch (error) {
      console.error('Error saving:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors de l\'enregistrement'
          : locale === 'es'
            ? 'Error al guardar las entradas'
            : 'Error saving entries'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Handle mark as read for psychoeducation
  const handleMarkAsRead = async () => {
    if (!response || !assignment) return

    setSubmitting(true)
    try {
      // Create resource snapshot
      const resourceSnapshot = {
        title: assignment.resource.title,
        blocks: assignment.resource.blocks,
        settings: assignment.resource.settings,
        type: assignment.resource.type,
      }

      // Submit with empty responses (no questions to answer)
      await submitResponse(response.id, {}, undefined, undefined, resourceSnapshot)

      setShowConfirmation(true)
      toast.success(
        locale === 'fr'
          ? 'Marqué comme lu'
          : locale === 'es'
            ? 'Marcado como leído'
            : 'Marked as read'
      )
    } catch (error) {
      console.error('Error marking as read:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors du marquage'
          : locale === 'es'
            ? 'Error al marcar como leído'
            : 'Error marking as read'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!response || !assignment) return

    // Check for required questions
    const unansweredRequired = questionBlocks.filter(block => {
      if (!('required' in block) || !block.required) return false
      const value = responses[block.id]
      if (value === undefined || value === null || value === '') return true
      if (Array.isArray(value) && value.length === 0) return true
      return false
    })

    if (unansweredRequired.length > 0) {
      toast.error(
        locale === 'fr'
          ? `Veuillez répondre à toutes les questions requises (${unansweredRequired.length} manquantes)`
          : locale === 'es'
            ? `Por favor responda todas las preguntas requeridas (${unansweredRequired.length} pendientes)`
            : `Please answer all required questions (${unansweredRequired.length} missing)`
      )
      return
    }

    setSubmitting(true)

    try {
      // Save any pending changes first
      await saveNow()

      // Calculate scores if enabled
      const settings = assignment.resource.settings as WorksheetSettings | undefined
      let scores: ScoreResult | null = null

      if (settings?.enableScoring) {
        scores = calculateWorksheetScore(responses, settings, blocks)
      }

      // Create resource snapshot for data preservation (in case resource is deleted later)
      const resourceSnapshot = {
        title: assignment.resource.title,
        blocks: assignment.resource.blocks,
        settings: assignment.resource.settings,
        type: assignment.resource.type,
      }

      // Submit response
      await submitResponse(response.id, responses, scores || undefined, undefined, resourceSnapshot)

      setSubmissionScores(scores)
      setShowConfirmation(true)

      toast.success(
        locale === 'fr'
          ? 'Réponses soumises avec succès'
          : locale === 'es'
            ? 'Respuestas enviadas con éxito'
            : 'Responses submitted successfully'
      )
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors de la soumission'
          : locale === 'es'
            ? 'Error al enviar las respuestas'
            : 'Error submitting responses'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
          <span className="text-gray-500 text-sm">
            {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
          </span>
        </motion.div>
      </div>
    )
  }

  // Already submitted state - but allow psychoeducation to still show content
  if (response?.status === 'submitted' && !isPsychoeducation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm"
        >
          <div className="w-14 h-14 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {locale === 'fr' ? 'Déjà soumis' : locale === 'es' ? 'Ya enviado' : 'Already Submitted'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {locale === 'fr'
              ? 'Vous avez déjà soumis vos réponses.'
              : locale === 'es'
                ? 'Ya ha enviado sus respuestas.'
                : 'You have already submitted your responses.'}
          </p>
          <Button
            onClick={() => router.push('/home')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}
          </Button>
        </motion.div>
      </div>
    )
  }

  // Track if psychoeducation is already completed
  const isPsychoeducationCompleted = isPsychoeducation && response?.status === 'submitted'

  const resourceTitle = typeof assignment?.resource.title === 'string'
    ? assignment.resource.title
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50/80 relative pb-24">
      {/* Sticky Header - Mobile Optimized */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-100 safe-area-pt">
        <div className="px-4 py-3">
          {/* Top Row: Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-gray-900 truncate text-lg">
                {resourceTitle}
              </h1>
            </div>
            {/* Auto-save indicator - compact */}
            <div className="flex-shrink-0">
              {autoSaveStatus === 'saving' && (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              {autoSaveStatus === 'saved' && (
                <Cloud className="w-5 h-5 text-emerald-500" />
              )}
              {autoSaveStatus === 'error' && (
                <CloudOff className="w-5 h-5 text-red-500" />
              )}
            </div>
          </div>

          {/* Progress Bar - Hide for psychoeducation */}
          {!isPsychoeducation && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">
                  {locale === 'fr' ? 'Progression' : locale === 'es' ? 'Progreso' : 'Progress'}
                </span>
                <span className="font-semibold text-teal-600">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Mobile Optimized */}
      <div className="px-4 py-4 relative z-10">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Instructions */}
          {assignment?.instructions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-teal-50 rounded-2xl p-4 border border-teal-100"
            >
              <p className="text-sm text-teal-700">{assignment.instructions}</p>
            </motion.div>
          )}

          {/* Blocks - Mobile Cards with question numbering */}
          {(() => {
            // Track question numbers only
            let questionNumber = 0
            const questionTypes = ['prompt', 'checklist', 'scale', 'matrix_rating', 'likert', 'multiple_choice', 'yes_no', 'mood', 'numeric', 'slider', 'date_picker', 'time_input', 'list_input', 'table_exercise', 'audio_response', 'file_response', 'video_response']

            return blocks.map((block, index) => {
              const isQuestion = questionTypes.includes(block.type)
              if (isQuestion) questionNumber++

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {/* Block content */}
                  <div className={`transition-all duration-300 ${isQuestion ? 'bg-white/80 backdrop-blur-sm rounded-3xl p-5 shadow-sm border-2 border-gray-100/80 hover:shadow-md hover:border-gray-200/80' : ''}`}>
                    {/* Question number badge - inline for mobile */}
                    {isQuestion && (
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                          {questionNumber}
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                      </div>
                    )}
                    <BlockRenderer
                      block={block}
                      value={responses[block.id]}
                      onChange={(value) => handleResponseChange(block.id, value)}
                      locale={locale}
                      disabled={submitting}
                      settings={assignment?.resource?.settings as {
                        rowMode?: 'unlimited' | 'limited'
                        minRows?: number
                        maxRows?: number
                      }}
                    />
                  </div>
                </motion.div>
              )
            })
          })()}

          {/* Spacer for fixed button */}
          <div className="h-4" />
        </div>
      </div>

      {/* Fixed Bottom Button - Different for table exercises and psychoeducation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto">
          {isPsychoeducation ? (
            // Psychoeducation: Mark as Read or Completed button
            isPsychoeducationCompleted ? (
              <Button
                onClick={() => router.push('/home')}
                size="lg"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg text-base font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {locale === 'fr' ? 'Terminé - Retour' : locale === 'es' ? 'Completado - Volver' : 'Completed - Back'}
              </Button>
            ) : (
              <Button
                onClick={handleMarkAsRead}
                disabled={submitting}
                size="lg"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg text-base font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {locale === 'fr' ? 'Marquage...' : locale === 'es' ? 'Marcando...' : 'Marking...'}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 mr-2" />
                    {locale === 'fr' ? 'Marquer comme lu' : locale === 'es' ? 'Marcar como leído' : 'Mark as Read'}
                  </>
                )}
              </Button>
            )
          ) : isTableExercise ? (
            // Table Exercise: Save & View buttons
            <div className="flex gap-3">
              <Button
                onClick={() => setShowTableView(true)}
                variant="outline"
                size="lg"
                className="flex-1 h-12 rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Eye className="w-5 h-5 mr-2" />
                {locale === 'fr' ? 'Voir tout' : locale === 'es' ? 'Ver todo' : 'View All'}
              </Button>
              <Button
                onClick={handleSaveTableExercise}
                disabled={submitting}
                size="lg"
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg text-base font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {locale === 'fr' ? 'Enregistrement...' : locale === 'es' ? 'Guardando...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {locale === 'fr' ? 'Enregistrer' : locale === 'es' ? 'Guardar' : 'Save'}
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Regular worksheet: Submit button
            <Button
              onClick={handleSubmit}
              disabled={submitting || progress < 100}
              size="lg"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg text-base font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {locale === 'fr' ? 'Soumission...' : locale === 'es' ? 'Enviando...' : 'Submitting...'}
                </>
              ) : progress < 100 ? (
                <>
                  <span>{progress}%</span>
                  <span className="mx-2">•</span>
                  <span>{locale === 'fr' ? 'Incomplet' : locale === 'es' ? 'Incompleto' : 'Incomplete'}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {locale === 'fr' ? 'Soumettre' : locale === 'es' ? 'Enviar' : 'Submit'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Table View Modal for table exercises */}
      <AnimatePresence>
        {showTableView && isTableExercise && (() => {
          // Get table block and entries
          const tableBlock = blocks.find(b => b.type === 'table_exercise')
          const columns: { id: string; header: string; description?: string }[] =
            (tableBlock && 'columns' in tableBlock && Array.isArray(tableBlock.columns))
              ? tableBlock.columns
              : []
          const entries = (tableBlock && responses[tableBlock.id])
            ? (responses[tableBlock.id] as Record<string, string>[])
            : []

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
              onClick={() => setShowTableView(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-4xl max-h-[85vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-emerald-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-200 flex items-center justify-center">
                      <Table2 className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-emerald-900">
                        {locale === 'fr' ? 'Toutes les entrées' : locale === 'es' ? 'Todas las entradas' : 'All Entries'}
                      </h2>
                      <p className="text-sm text-emerald-700">
                        {entries.length} {locale === 'fr'
                          ? (entries.length === 1 ? 'entrée' : 'entrées')
                          : locale === 'es'
                            ? (entries.length === 1 ? 'entrada' : 'entradas')
                            : (entries.length === 1 ? 'entry' : 'entries')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTableView(false)}
                    className="p-2 hover:bg-emerald-200 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-emerald-700" />
                  </button>
                </div>

                {/* Table Content */}
                <div className="p-4 overflow-auto max-h-[calc(85vh-80px)]">
                  {entries.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Table2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>{locale === 'fr' ? 'Aucune entrée pour le moment' : locale === 'es' ? 'Aún no hay entradas' : 'No entries yet'}</p>
                      <p className="text-sm mt-1">
                        {locale === 'fr'
                          ? 'Ajoutez des entrées ci-dessous'
                          : locale === 'es'
                            ? 'Agregue entradas a continuación'
                            : 'Add entries below'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-4 py-3 text-left font-semibold text-gray-600 border-b border-gray-200 w-12">
                              #
                            </th>
                            {columns.map((col) => (
                              <th
                                key={col.id}
                                className="px-4 py-3 text-left font-semibold text-gray-900 border-b border-gray-200"
                              >
                                {col.header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((entry, index) => (
                            <tr key={index} className="hover:bg-gray-50 border-b border-gray-100">
                              <td className="px-4 py-3 text-gray-400 font-medium">
                                {index + 1}
                              </td>
                              {columns.map((col) => (
                                <td key={col.id} className="px-4 py-3 text-gray-700">
                                  {entry[col.id] || (
                                    <span className="text-gray-300 italic">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Submission Confirmation Modal */}
      <SubmissionConfirmation
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false)
          router.push('/home')
        }}
        scores={submissionScores}
        resourceTitle={resourceTitle}
      />
    </div>
  )
}

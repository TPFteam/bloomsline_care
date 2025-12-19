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
          text: locale === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes',
          color: 'text-amber-600',
        }
      case 'saving':
        return {
          icon: Loader2,
          text: locale === 'fr' ? 'Enregistrement...' : 'Saving...',
          color: 'text-blue-600',
          animate: true,
        }
      case 'saved':
        return {
          icon: Cloud,
          text: locale === 'fr' ? 'Enregistré' : 'Saved',
          color: 'text-emerald-600',
        }
      case 'error':
        return {
          icon: CloudOff,
          text: locale === 'fr' ? 'Erreur de sauvegarde' : 'Save error',
          color: 'text-red-600',
        }
      default:
        if (lastSavedAt) {
          return {
            icon: CheckCircle,
            text: locale === 'fr' ? 'Brouillon enregistré' : 'Draft saved',
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
            {locale === 'fr' ? 'Soumis avec succès!' : 'Successfully Submitted!'}
          </h2>

          <p className="text-center text-gray-600 mb-6">
            {locale === 'fr'
              ? `Vos réponses pour "${resourceTitle}" ont été soumises.`
              : `Your responses for "${resourceTitle}" have been submitted.`}
          </p>

          {/* Score Display */}
          {scores && (
            <div className="bg-gradient-to-br from-teal-50 to-lavender-50 rounded-2xl p-6 mb-6 border border-teal-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3 text-center">
                {locale === 'fr' ? 'Votre Score' : 'Your Score'}
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
              {locale === 'fr' ? 'Voir mes ressources' : 'View My Resources'}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
            >
              {locale === 'fr' ? 'Fermer' : 'Close'}
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

  // Get blocks from resource
  const blocks: ResourceBlock[] = useMemo(() => {
    if (!assignment?.resource?.blocks) return []
    return assignment.resource.blocks as ResourceBlock[]
  }, [assignment])

  // Get question blocks only
  const questionBlocks = useMemo(() => {
    return blocks.filter(block =>
      ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
       'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input'].includes(block.type)
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
          : 'Responses submitted successfully'
      )
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error(
        locale === 'fr'
          ? 'Erreur lors de la soumission'
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
            {locale === 'fr' ? 'Chargement...' : 'Loading...'}
          </span>
        </motion.div>
      </div>
    )
  }

  // Already submitted state
  if (response?.status === 'submitted') {
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
            {locale === 'fr' ? 'Déjà soumis' : 'Already Submitted'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {locale === 'fr'
              ? 'Vous avez déjà soumis vos réponses.'
              : 'You have already submitted your responses.'}
          </p>
          <Button
            onClick={() => router.push('/home')}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === 'fr' ? 'Retour' : 'Back'}
          </Button>
        </motion.div>
      </div>
    )
  }

  const resourceTitle = typeof assignment?.resource.title === 'string'
    ? assignment.resource.title
    : ''

  return (
    <div className="min-h-screen bg-gray-50 relative pb-24">
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

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500">
                {locale === 'fr' ? 'Progression' : 'Progress'}
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

          {/* Blocks - Mobile Cards */}
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <BlockRenderer
                block={block}
                value={responses[block.id]}
                onChange={(value) => handleResponseChange(block.id, value)}
                locale={locale}
                disabled={submitting}
              />
            </motion.div>
          ))}

          {/* Spacer for fixed button */}
          <div className="h-4" />
        </div>
      </div>

      {/* Fixed Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting || progress < 100}
            size="lg"
            className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg text-base font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {locale === 'fr' ? 'Soumission...' : 'Submitting...'}
              </>
            ) : progress < 100 ? (
              <>
                <span>{progress}%</span>
                <span className="mx-2">•</span>
                <span>{locale === 'fr' ? 'Incomplet' : 'Incomplete'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                {locale === 'fr' ? 'Soumettre' : 'Submit'}
              </>
            )}
          </Button>
        </div>
      </div>

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

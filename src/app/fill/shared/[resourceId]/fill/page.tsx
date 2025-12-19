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
  FileText,
  Cloud,
  CloudOff,
  Edit2,
  Trash2,
  Calendar,
  Star,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  getMemberRecord,
  type WorksheetSettings,
  type ScoreResult,
} from '@/lib/services/member-resources'
import { useAutoSaveDraft, type AutoSaveStatus } from '@/lib/hooks/useAutoSaveDraft'
import { BlockRenderer } from '@/components/resources/BlockRenderer'
import { toast } from 'sonner'
import type { Member } from '@/types/member'
import type { Resource, ResourceBlock, ResourceResponse } from '@/types/resource'

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
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {locale === 'fr' ? 'Soumis avec succès!' : 'Successfully Submitted!'}
          </h2>

          <p className="text-center text-gray-600 mb-6">
            {locale === 'fr'
              ? `Vos réponses pour "${resourceTitle}" ont été soumises.`
              : `Your responses for "${resourceTitle}" have been submitted.`}
          </p>

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

export default function FillSharedResourcePage() {
  const router = useRouter()
  const params = useParams()
  const resourceId = params.resourceId as string
  const { locale } = useLanguage()
  const supabase = createClient()

  const [member, setMember] = useState<Member | null>(null)
  const [resource, setResource] = useState<Resource | null>(null)
  const [response, setResponse] = useState<ResourceResponse | null>(null)
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [submissionScores, setSubmissionScores] = useState<ScoreResult | null>(null)
  const [highlightedUnanswered, setHighlightedUnanswered] = useState<Set<string>>(new Set())

  // Get blocks from resource
  const blocks: ResourceBlock[] = useMemo(() => {
    if (!resource?.blocks) return []
    return resource.blocks as ResourceBlock[]
  }, [resource])

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

  // Get unanswered questions with their index
  const unansweredQuestions = useMemo(() => {
    return questionBlocks
      .map((block, index) => ({ block, index: index + 1 }))
      .filter(({ block }) => {
        const value = responses[block.id]
        if (value === undefined || value === null || value === '') return true
        if (Array.isArray(value) && value.length === 0) return true
        if (typeof value === 'object' && Object.keys(value).length === 0) return true
        return false
      })
  }, [questionBlocks, responses])

  // Scroll to and highlight unanswered question
  const scrollToUnanswered = (blockId: string) => {
    const element = document.getElementById(`block-${blockId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedUnanswered(new Set([blockId]))
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedUnanswered(new Set()), 3000)
    }
  }

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
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/sign-in')
          return
        }

        // First, get the share record to find which practitioner shared this resource
        // We need to get all share records for this resource to any of the user's member records
        const { data: allMemberRecords } = await supabase
          .from('members')
          .select('id, practitioner_id')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (!allMemberRecords || allMemberRecords.length === 0) {
          toast.error(
            locale === 'fr'
              ? 'Aucun profil membre trouvé'
              : 'No member profile found'
          )
          router.push('/dashboard')
          return
        }

        const memberIds = allMemberRecords.map(m => m.id)

        // Find the share record that matches this resource and one of the user's member records
        const { data: shareRecords } = await supabase
          .from('member_shared_resources')
          .select('member_id, practitioner_id')
          .eq('resource_id', resourceId)
          .in('member_id', memberIds)
          .limit(1)

        const shareData = shareRecords?.[0] || null

        if (!shareData) {
          toast.error(
            locale === 'fr'
              ? 'Ressource non trouvée'
              : 'Resource not found'
          )
          router.push('/home')
          return
        }

        // Use the member record that the resource was shared with
        const memberData = allMemberRecords.find(m => m.id === shareData.member_id) ||
          allMemberRecords.find(m => m.practitioner_id === shareData.practitioner_id) ||
          allMemberRecords[0]

        // Fetch full member data
        const { data: fullMemberData } = await supabase
          .from('members')
          .select('*')
          .eq('id', memberData.id)
          .single()

        if (!fullMemberData) {
          toast.error(
            locale === 'fr'
              ? 'Aucun profil membre trouvé'
              : 'No member profile found'
          )
          router.push('/dashboard')
          return
        }
        setMember(fullMemberData as Member)

        // Get resource
        const { data: resourceData, error: resourceError } = await supabase
          .from('resources')
          .select('*')
          .eq('id', resourceId)
          .single()

        if (resourceError || !resourceData) {
          console.error('Resource error:', resourceError)
          toast.error(
            locale === 'fr'
              ? 'Ressource non trouvée'
              : 'Resource not found'
          )
          router.push('/home')
          return
        }
        setResource(resourceData as Resource)

        // Use the sharing practitioner's ID
        const sharingPractitionerId = shareData.practitioner_id

        // Debug logging
        console.log('Member ID:', fullMemberData.id)
        console.log('Resource ID:', resourceId)
        console.log('Sharing Practitioner ID:', sharingPractitionerId)

        // Check for existing response or create new one
        const { data: existingResponses, error: fetchError } = await supabase
          .from('resource_responses')
          .select('*')
          .eq('resource_id', resourceId)
          .eq('member_id', fullMemberData.id)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (fetchError) {
          console.error('Error fetching existing response:', fetchError)
        }

        const existingResponse = existingResponses?.[0] || null
        console.log('Existing response:', existingResponse)

        if (existingResponse) {
          setResponse(existingResponse as ResourceResponse)
          if (existingResponse.responses && typeof existingResponse.responses === 'object') {
            setResponses(existingResponse.responses as Record<string, unknown>)
          }
        } else {
          // Create new response for shared resource - use the practitioner who shared it
          console.log('Creating new response with:', {
            resource_id: resourceId,
            member_id: fullMemberData.id,
            practitioner_id: sharingPractitionerId,
          })

          const { data: newResponse, error: createError } = await supabase
            .from('resource_responses')
            .insert({
              resource_id: resourceId,
              member_id: fullMemberData.id,
              practitioner_id: sharingPractitionerId,
              assignment_id: null,
              status: 'draft',
              responses: {},
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating response:', createError)
            console.error('Error details:', JSON.stringify(createError, null, 2))
            toast.error(
              locale === 'fr'
                ? `Erreur: ${createError.message || 'Impossible de créer la réponse'}`
                : `Error: ${createError.message || 'Unable to create response'}`
            )
            return
          }

          console.log('Created new response:', newResponse)
          setResponse(newResponse as ResourceResponse)
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
  }, [resourceId, locale, router, supabase])

  // Handle response change
  const handleResponseChange = (blockId: string, value: unknown) => {
    setResponses(prev => ({
      ...prev,
      [blockId]: value,
    }))
  }

  // Calculate scores
  const calculateWorksheetScore = (
    responses: Record<string, unknown>,
    settings: WorksheetSettings,
    blocks: ResourceBlock[]
  ): ScoreResult => {
    let total = 0
    let maxScore = 0
    const blockScores: Record<string, number> = {}

    blocks.forEach(block => {
      if (!['multiple_choice', 'scale', 'likert', 'yes_no', 'checklist', 'numeric', 'slider', 'mood', 'matrix_rating'].includes(block.type)) {
        return
      }

      const response = responses[block.id]
      if (response === undefined || response === null) return

      const scoreValue = ('scoreValue' in block ? block.scoreValue : 1) as number

      switch (block.type) {
        case 'scale':
        case 'likert':
        case 'numeric':
        case 'slider':
        case 'mood':
          const numValue = Number(response)
          total += numValue * scoreValue
          maxScore += (('scaleMax' in block ? block.scaleMax : 10) as number) * scoreValue
          blockScores[block.id] = numValue * scoreValue
          break

        case 'multiple_choice':
          const options: (string | { label?: string; score?: number })[] =
            ('options' in block && Array.isArray(block.options)) ? block.options :
            ('choices' in block && Array.isArray(block.choices)) ? block.choices : []
          const selectedIndex = Number(response)
          const option = options[selectedIndex]
          if (option && typeof option === 'object' && 'score' in option) {
            total += (option.score as number) * scoreValue
            blockScores[block.id] = (option.score as number) * scoreValue
          }
          const maxOptionScore = Math.max(...options.map((o) =>
            typeof o === 'object' && o && 'score' in o ? (o.score as number) : 0
          ))
          maxScore += maxOptionScore * scoreValue
          break

        case 'yes_no':
          total += (response === 'yes' ? 1 : 0) * scoreValue
          maxScore += scoreValue
          blockScores[block.id] = (response === 'yes' ? 1 : 0) * scoreValue
          break

        case 'checklist':
          const checkedIndices = Array.isArray(response) ? response : []
          total += checkedIndices.length * scoreValue
          const items = ('items' in block && Array.isArray(block.items)) ? block.items : []
          maxScore += items.length * scoreValue
          blockScores[block.id] = checkedIndices.length * scoreValue
          break

        case 'matrix_rating':
          const matrixItems = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
          const matrixMax = ('matrixScaleMax' in block ? block.matrixScaleMax : 5) as number
          const ratings = response as Record<string, number>
          const matrixTotal = Object.values(ratings).reduce((sum, r) => sum + r, 0)
          total += matrixTotal * scoreValue
          maxScore += matrixItems.length * matrixMax * scoreValue
          blockScores[block.id] = matrixTotal * scoreValue
          break
      }
    })

    const percentage = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0

    let interpretation: string | undefined
    if (settings.scoringRanges && settings.scoringRanges.length > 0) {
      const range = settings.scoringRanges.find(r => percentage >= r.min && percentage <= r.max)
      if (range?.label) {
        interpretation = typeof range.label === 'string' ? range.label : range.label[locale] || range.label.en
      }
    }

    return { total, maxScore, percentage, blockScores, interpretation }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!response || !resource) return

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
      const settings = resource.settings as WorksheetSettings | undefined
      let scores: ScoreResult | null = null

      if (settings?.enableScoring) {
        scores = calculateWorksheetScore(responses, settings, blocks)
      }

      // Create resource snapshot for data preservation (in case resource is deleted later)
      const resourceSnapshot = {
        title: resource.title,
        blocks: resource.blocks,
        settings: resource.settings,
        type: resource.type,
      }

      // Submit response
      const { error } = await supabase
        .from('resource_responses')
        .update({
          responses,
          scores: scores || {},
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          resource_snapshot: resourceSnapshot,
        })
        .eq('id', response.id)

      if (error) throw error

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

  // Handle edit - put response back to draft
  const handleEdit = async () => {
    if (!response) return

    try {
      const { error } = await supabase
        .from('resource_responses')
        .update({ status: 'draft', submitted_at: null })
        .eq('id', response.id)

      if (error) throw error

      // Reload to show editable form
      window.location.reload()
    } catch (error) {
      console.error('Error updating response:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la modification' : 'Error editing response')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!response) return

    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Êtes-vous sûr de vouloir supprimer cette soumission? Cette action est irréversible.'
        : 'Are you sure you want to delete this submission? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('resource_responses')
        .delete()
        .eq('id', response.id)

      if (error) throw error

      toast.success(locale === 'fr' ? 'Soumission supprimée' : 'Submission deleted')
      // Force full page reload to clear cache
      window.location.href = '/home'
    } catch (error) {
      console.error('Error deleting response:', error)
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting submission')
    }
  }

  // Render response value for display
  const renderResponseDisplay = (block: ResourceBlock, value: unknown): string => {
    if (value === undefined || value === null || value === '') {
      return locale === 'fr' ? 'Non répondu' : 'Not answered'
    }

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
        const items: (string | { text?: string })[] = ('items' in block && Array.isArray(block.items)) ? block.items : []
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
        const matrixItems: string[] = ('matrixItems' in block && Array.isArray(block.matrixItems)) ? block.matrixItems : []
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
        return JSON.stringify(value)
    }
  }

  // Already submitted state - show detailed submission view
  if (response?.status === 'submitted') {
    const resourceTitle = typeof resource?.title === 'string' ? resource.title : ''
    const blocks = (resource?.blocks || []) as ResourceBlock[]
    const questionBlocks = blocks.filter(b =>
      ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
       'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input'].includes(b.type)
    )
    const submittedResponses = (response.responses || {}) as Record<string, unknown>
    const scores = response.scores as { total?: number; maxScore?: number; percentage?: number } | null
    const settings = (resource?.settings || {}) as WorksheetSettings

    return (
      <div className="min-h-screen bg-gray-50 relative pb-24">
        {/* Sticky Header - Mobile */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-gray-100 safe-area-pt">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/home')}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-gray-900 truncate text-lg">{resourceTitle}</h1>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="font-medium">{locale === 'fr' ? 'Soumis' : 'Submitted'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Mobile */}
        <div className="px-4 py-4 relative z-10">
          <div className="max-w-lg mx-auto space-y-4">

            {/* Success Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold">
                    {locale === 'fr' ? 'Soumission réussie' : 'Submission Complete'}
                  </h2>
                  {response.submitted_at && (
                    <p className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(response.submitted_at).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Score Display */}
              {scores && scores.total !== undefined && settings.showScoreToMember && (
                <div className="mt-3 p-3 bg-white/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      {locale === 'fr' ? 'Score' : 'Score'}
                    </span>
                    <span className="text-xl font-bold">
                      {scores.percentage}%
                    </span>
                  </div>
                  <div className="text-xs text-emerald-100 mt-1">
                    {scores.total} / {scores.maxScore} {locale === 'fr' ? 'points' : 'points'}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Responses List */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 mb-3">
                {locale === 'fr' ? 'Vos réponses' : 'Your Responses'}
              </h3>

              <div className="space-y-3">
                {questionBlocks.map((block, index) => {
                  const responseValue = submittedResponses[block.id]
                  const hasResponse = responseValue !== undefined && responseValue !== null && responseValue !== ''

                  return (
                    <div
                      key={block.id}
                      className={`p-3 rounded-xl ${hasResponse ? 'bg-gray-50' : 'bg-red-50'}`}
                    >
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Q{index + 1}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        {typeof block.content === 'string' ? block.content : ''}
                      </p>
                      <p className={`text-sm font-medium ${hasResponse ? 'text-gray-900' : 'text-red-500 italic'}`}>
                        {renderResponseDisplay(block, responseValue)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Fixed Bottom Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1 h-12 rounded-xl"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {locale === 'fr' ? 'Modifier' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const resourceTitle = typeof resource?.title === 'string' ? resource.title : ''

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
            {/* Auto-save indicator - compact on mobile */}
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
          {/* Resource Description */}
          {resource?.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-teal-50 rounded-2xl p-4 border border-teal-100"
            >
              <p className="text-sm text-teal-700">
                {typeof resource.description === 'string' ? resource.description : ''}
              </p>
            </motion.div>
          )}

          {/* Blocks - Mobile Cards */}
          {blocks.map((block, index) => {
            const isUnanswered = unansweredQuestions.some(q => q.block.id === block.id)
            const isHighlighted = highlightedUnanswered.has(block.id)

            return (
              <motion.div
                key={block.id}
                id={`block-${block.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-white rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                  isHighlighted
                    ? 'ring-2 ring-amber-400 bg-amber-50'
                    : isUnanswered
                      ? 'border-l-4 border-l-amber-400'
                      : ''
                }`}
              >
                <BlockRenderer
                  block={block}
                  value={responses[block.id]}
                  onChange={(value) => handleResponseChange(block.id, value)}
                  locale={locale}
                  disabled={submitting}
                />
              </motion.div>
            )
          })}

          {/* Spacer for fixed button */}
          <div className="h-4" />
        </div>
      </div>

      {/* Fixed Bottom Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 px-4 py-3 safe-area-pb">
        <div className="max-w-lg mx-auto">
          {progress < 100 && unansweredQuestions.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs text-amber-700 font-medium mb-2">
                {locale === 'fr'
                  ? `${unansweredQuestions.length} question(s) restante(s)`
                  : `${unansweredQuestions.length} question(s) remaining`}
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {unansweredQuestions.slice(0, 8).map(({ block, index }) => (
                  <button
                    key={block.id}
                    onClick={() => scrollToUnanswered(block.id)}
                    className="flex-shrink-0 w-8 h-8 text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full font-medium transition-colors"
                  >
                    {index}
                  </button>
                ))}
                {unansweredQuestions.length > 8 && (
                  <span className="flex-shrink-0 w-8 h-8 text-xs text-amber-600 flex items-center justify-center">
                    +{unansweredQuestions.length - 8}
                  </span>
                )}
              </div>
            </div>
          ) : null}
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

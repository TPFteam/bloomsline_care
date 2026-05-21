'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  CheckCircle,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageSquare,
  Star,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { MemberFeedbackIcon, feedbackLabel } from '@/components/resources/MemberFeedbackIcon'
import type { Member } from '@/types/member'
import type { Resource, ResourceBlock, ResourceResponse } from '@/types/resource'
import { ResponseValueDisplay } from '@/lib/resources/render-response'

interface SubmissionWithResource extends ResourceResponse {
  resource: Resource
}

interface SubmissionsTabProps {
  member: Member
}

export default function SubmissionsTab({ member }: SubmissionsTabProps) {
  const { t, locale } = useLanguage()
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<SubmissionWithResource[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'reviewed'>('all')

  useEffect(() => {
    fetchSubmissions()
  }, [member.id])

  const fetchSubmissions = async () => {
    try {
      // Debug: Get current user
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current practitioner ID:', user?.id)
      console.log('Fetching submissions for member ID:', member.id)

      const { data, error } = await supabase
        .from('resource_responses')
        .select(`
          *,
          resource:resources(*)
        `)
        .eq('member_id', member.id)
        .in('status', ['submitted', 'reviewed']) // Only show submitted responses, not drafts
        .order('submitted_at', { ascending: false })

      console.log('Submissions query result:', { data, error })

      if (error) {
        if (error.code === '42P01') {
          console.log('Table not yet created')
          setSubmissions([])
          return
        }
        console.error('Submissions query error:', error)
        throw error
      }

      console.log('Found submissions:', data?.length || 0)
      setSubmissions((data || []) as SubmissionWithResource[])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true
    return sub.status === filter
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'submitted':
        return {
          icon: CheckCircle,
          label: locale === 'fr' ? 'Soumis' : 'Submitted',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200',
        }
      case 'reviewed':
        return {
          icon: Eye,
          label: locale === 'fr' ? 'Examiné' : 'Reviewed',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        }
      case 'draft':
      default:
        return {
          icon: Clock,
          label: locale === 'fr' ? 'Brouillon' : 'Draft',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-200',
        }
    }
  }

  // Response rendering lives in @/lib/resources/render-response so every
  // surface (this tab, SharedTab, resource detail, PDF) shows the same
  // answer the same way.

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {locale === 'fr' ? 'Soumissions' : 'Submissions'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={`rounded-full ${filter === 'all' ? 'bg-teal-500' : ''}`}
          >
            {locale === 'fr' ? 'Tous' : 'All'}
            <Badge variant="secondary" className="ml-1.5 bg-white/20">
              {submissions.length}
            </Badge>
          </Button>
          <Button
            variant={filter === 'submitted' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('submitted')}
            className={`rounded-full ${filter === 'submitted' ? 'bg-emerald-500' : ''}`}
          >
            {locale === 'fr' ? 'Soumis' : 'Submitted'}
            <Badge variant="secondary" className="ml-1.5 bg-white/20">
              {submissions.filter(s => s.status === 'submitted').length}
            </Badge>
          </Button>
          <Button
            variant={filter === 'reviewed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('reviewed')}
            className={`rounded-full ${filter === 'reviewed' ? 'bg-blue-500' : ''}`}
          >
            {locale === 'fr' ? 'Examiné' : 'Reviewed'}
            <Badge variant="secondary" className="ml-1.5 bg-white/20">
              {submissions.filter(s => s.status === 'reviewed').length}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {locale === 'fr' ? 'Aucune soumission' : 'No submissions'}
          </h3>
          <p className="text-gray-500">
            {locale === 'fr'
              ? 'Ce membre n\'a pas encore soumis de réponses.'
              : 'This member hasn\'t submitted any responses yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => {
            const statusConfig = getStatusConfig(submission.status || 'draft')
            const StatusIcon = statusConfig.icon
            const isExpanded = expandedId === submission.id
            const resourceTitle = typeof submission.resource?.title === 'string'
              ? submission.resource.title
              : 'Untitled Resource'
            const blocks = (submission.resource?.blocks || []) as ResourceBlock[]
            const questionBlocks = blocks.filter(b =>
              ['prompt', 'multiple_choice', 'yes_no', 'checklist', 'scale', 'likert',
               'numeric', 'slider', 'matrix_rating', 'mood', 'date_picker', 'time_input', 'list_input'].includes(b.type)
            )
            const responses = (submission.responses || {}) as Record<string, unknown>
            const scores = submission.scores as { total?: number; maxScore?: number; percentage?: number } | null

            return (
              <motion.div
                key={submission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(submission.id)}
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {resourceTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {(submission as any).member_feedback && (
                            <MemberFeedbackIcon
                              feedback={(submission as any).member_feedback}
                              pill
                              title={feedbackLabel((submission as any).member_feedback, locale)}
                            />
                          )}
                          {submission.submitted_at && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(submission.submitted_at)}
                            </span>
                          )}
                          {scores && scores.total !== undefined && (
                            <Badge variant="outline" className="text-teal-700 border-teal-200 bg-teal-50">
                              <Star className="w-3 h-3 mr-1" />
                              {scores.total}/{scores.maxScore} ({scores.percentage}%)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 space-y-4">
                        {/* Responses */}
                        {questionBlocks.length > 0 ? (
                          <div className="space-y-3">
                            {questionBlocks.map((block, index) => {
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
                                  <div className="text-sm">
                                    {hasResponse
                                      ? <ResponseValueDisplay block={block} value={response} locale={locale} />
                                      : <span className="text-red-500 italic">{locale === 'fr' ? 'Non répondu' : 'Not answered'}</span>}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            {locale === 'fr' ? 'Aucune question dans cette ressource' : 'No questions in this resource'}
                          </div>
                        )}

                        {/* Practitioner Notes Section */}
                        {submission.practitioner_notes && (
                          <div className="p-4 bg-lavender-50 rounded-xl border border-lavender-100">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-lavender-700">
                                {locale === 'fr' ? 'Vos notes' : 'Your Notes'}
                              </span>
                            </div>
                            <p className="text-sm text-lavender-800">{submission.practitioner_notes}</p>
                          </div>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100">
                          <span>{locale === 'fr' ? 'Créé' : 'Created'}: {formatDate(submission.created_at)}</span>
                          <span>{locale === 'fr' ? 'Mis à jour' : 'Updated'}: {formatDate(submission.updated_at)}</span>
                          {submission.time_spent_seconds && (
                            <span>
                              {locale === 'fr' ? 'Temps passé' : 'Time spent'}: {Math.round(submission.time_spent_seconds / 60)} min
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

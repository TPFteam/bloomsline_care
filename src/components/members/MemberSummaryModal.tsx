'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  History,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { MemberSummary, SummaryContent } from '@/types/member'
import { formatRelativeTime } from '@/types/member'

interface MemberSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
}

type SectionId = 'status' | 'highlights' | 'themes' | 'attention' | 'recommendations' | 'nextSteps'

export function MemberSummaryModal({ isOpen, onClose, memberId, memberName }: MemberSummaryModalProps) {
  const { locale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<MemberSummary | null>(null)
  const [summaryHistory, setSummaryHistory] = useState<MemberSummary[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['status', 'highlights', 'themes']))
  const [error, setError] = useState<string | null>(null)

  // Section labels
  const sectionLabels: Record<SectionId, { en: string; fr: string; es: string }> = {
    status: { en: 'Current Status', fr: 'Statut actuel', es: 'Estado actual' },
    highlights: { en: 'Progress Highlights', fr: 'Points forts', es: 'Logros destacados' },
    themes: { en: 'Key Themes', fr: 'Thèmes clés', es: 'Temas clave' },
    attention: { en: 'Areas of Attention', fr: 'Points d\'attention', es: 'Áreas de atención' },
    recommendations: { en: 'Recommendations', fr: 'Recommandations', es: 'Recomendaciones' },
    nextSteps: { en: 'Next Steps', fr: 'Prochaines étapes', es: 'Próximos pasos' },
  }

  // Section icons and colors - using brand palette
  const sectionConfig: Record<SectionId, { icon: typeof TrendingUp; bgColor: string; textColor: string }> = {
    status: { icon: Sparkles, bgColor: 'bg-[#D4856A]/10', textColor: 'text-[#D4856A]' },
    highlights: { icon: TrendingUp, bgColor: 'bg-mint-50', textColor: 'text-mint-700' },
    themes: { icon: Lightbulb, bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
    attention: { icon: AlertTriangle, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    recommendations: { icon: CheckCircle2, bgColor: 'bg-[#D4856A]/10', textColor: 'text-[#D4856A]' },
    nextSteps: { icon: ArrowRight, bgColor: 'bg-mint-50', textColor: 'text-mint-700' },
  }

  const getLabel = (key: SectionId) => sectionLabels[key][locale] || sectionLabels[key].en

  // Fetch latest summary on open
  useEffect(() => {
    if (isOpen && memberId) {
      fetchLatestSummary()
    }
  }, [isOpen, memberId])

  const fetchLatestSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to view summaries')
        return
      }

      const response = await fetch(`/api/members/${memberId}/summary`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.summary)
      } else if (response.status !== 404) {
        const data = await response.json()
        setError(data.error || 'Failed to fetch summary')
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
      setError('Failed to load summary')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaryHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/members/${memberId}/summary?history=true&limit=10`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSummaryHistory(data.summaries || [])
      }
    } catch (err) {
      console.error('Error fetching summary history:', err)
    }
  }

  const generateSummary = async () => {
    setGenerating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Please sign in to generate summaries')
        return
      }

      const response = await fetch(`/api/members/${memberId}/summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
      })

      const data = await response.json()

      if (response.ok) {
        setSummary(data.summary)
        if (data.warning) {
          toast.warning(data.warning)
        } else {
          toast.success(locale === 'fr' ? 'Bloom Pulse généré avec succès' : locale === 'es' ? 'Bloom Pulse generado con éxito' : 'Bloom Pulse generated successfully')
        }
      } else if (response.status === 429) {
        setError(locale === 'fr' ? 'Trop de requêtes. Veuillez réessayer plus tard.' : locale === 'es' ? 'Demasiadas solicitudes. Inténtelo más tarde.' : 'Too many requests. Please try again later.')
      } else if (data.code === 'INSUFFICIENT_DATA') {
        setError(locale === 'fr' ? 'Pas assez de données pour générer un résumé. Ajoutez d\'abord des séances ou des notes.' : locale === 'es' ? 'No hay suficientes datos para generar un resumen. Primero añada sesiones o notas.' : 'Not enough data to generate a summary. Add sessions or notes first.')
      } else {
        setError(data.error || 'Failed to generate summary')
      }
    } catch (err) {
      console.error('Error generating summary:', err)
      setError('An error occurred while generating the summary')
    } finally {
      setGenerating(false)
    }
  }

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const toggleHistory = () => {
    if (!showHistory && summaryHistory.length === 0) {
      fetchSummaryHistory()
    }
    setShowHistory(!showHistory)
  }

  const selectHistorySummary = (historySummary: MemberSummary) => {
    setSummary(historySummary)
    setShowHistory(false)
  }

  const renderSection = (
    sectionId: SectionId,
    content: string | string[],
    delay: number = 0
  ) => {
    const config = sectionConfig[sectionId]
    const Icon = config.icon
    const isExpanded = expandedSections.has(sectionId)
    const isEmpty = Array.isArray(content) ? content.length === 0 : !content

    if (isEmpty) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.05 }}
        className="border border-gray-100 rounded-xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection(sectionId)}
          className={`w-full flex items-center justify-between p-4 ${config.bgColor} hover:opacity-90 transition-opacity`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center ${config.textColor}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`font-medium ${config.textColor}`}>
              {getLabel(sectionId)}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${config.textColor}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${config.textColor}`} />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-white">
                {typeof content === 'string' ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
                ) : (
                  <ul className="space-y-2">
                    {content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${config.bgColor} flex-shrink-0`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4856A]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#D4856A]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Bloom Pulse</h2>
                <p className="text-sm text-gray-500">{memberName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {summary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleHistory}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <History className="w-4 h-4 mr-1" />
                  {locale === 'fr' ? 'Historique' : locale === 'es' ? 'Historial' : 'History'}
                </Button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#D4856A] animate-spin mb-3" />
                <p className="text-gray-500 text-sm">
                  {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
                </p>
              </div>
            ) : generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#D4856A] animate-spin mb-3" />
                <p className="text-gray-700 font-medium">
                  {locale === 'fr' ? 'Génération en cours...' : locale === 'es' ? 'Generando...' : 'Generating...'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {locale === 'fr' ? 'Quelques secondes' : locale === 'es' ? 'Unos segundos' : 'A few seconds'}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-gray-700 font-medium text-center text-sm mb-4 max-w-xs">{error}</p>
                <Button
                  onClick={generateSummary}
                  variant="outline"
                  size="sm"
                  className="border-gray-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {locale === 'fr' ? 'Réessayer' : locale === 'es' ? 'Reintentar' : 'Try Again'}
                </Button>
              </div>
            ) : showHistory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    {locale === 'fr' ? 'Résumés précédents' : locale === 'es' ? 'Resúmenes anteriores' : 'Previous Summaries'}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                    {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}
                  </Button>
                </div>
                {summaryHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    {locale === 'fr' ? 'Aucun résumé précédent' : locale === 'es' ? 'No hay resúmenes anteriores' : 'No previous summaries'}
                  </p>
                ) : (
                  summaryHistory.map((historySummary) => (
                    <button
                      key={historySummary.id}
                      onClick={() => selectHistorySummary(historySummary)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        summary?.id === historySummary.id
                          ? 'border-[#D4856A]/30 bg-[#D4856A]/10'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatRelativeTime(historySummary.generated_at)}
                          </span>
                        </div>
                        {summary?.id === historySummary.id && (
                          <span className="text-xs text-[#D4856A] font-medium">
                            {locale === 'fr' ? 'Affiché' : locale === 'es' ? 'Mostrado' : 'Viewing'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {(historySummary.summary_content as SummaryContent).current_status}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : summary ? (
              <div className="space-y-3">
                {/* Timestamp */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {locale === 'fr' ? 'Généré' : locale === 'es' ? 'Generado' : 'Generated'} {formatRelativeTime(summary.generated_at)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateSummary}
                    disabled={generating}
                    className="text-[#D4856A] hover:text-[#D4856A] hover:bg-[#D4856A]/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                    {locale === 'fr' ? 'Régénérer' : locale === 'es' ? 'Regenerar' : 'Regenerate'}
                  </Button>
                </div>

                {/* Summary Sections */}
                {renderSection('status', (summary.summary_content as SummaryContent).current_status, 0)}
                {renderSection('highlights', (summary.summary_content as SummaryContent).progress_highlights, 1)}
                {renderSection('themes', (summary.summary_content as SummaryContent).key_themes, 2)}
                {renderSection('attention', (summary.summary_content as SummaryContent).areas_of_attention, 3)}
                {renderSection('recommendations', (summary.summary_content as SummaryContent).recommendations, 4)}
                {renderSection('nextSteps', (summary.summary_content as SummaryContent).next_steps, 5)}

                {/* Disclaimer */}
                <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    {locale === 'fr'
                      ? 'Ce résumé est généré par IA et doit être utilisé comme aide à la documentation clinique, pas comme un substitut au jugement professionnel.'
                      : locale === 'es'
                      ? 'Este resumen es generado por IA y debe usarse como ayuda para la documentación clínica, no como sustituto del juicio profesional.'
                      : 'This summary is AI-generated and should be used as an aid to clinical documentation, not as a substitute for professional judgment.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-14 h-14 rounded-xl bg-[#D4856A]/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-[#D4856A]" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {locale === 'fr' ? 'Générer Bloom Pulse' : locale === 'es' ? 'Generar Bloom Pulse' : 'Generate Bloom Pulse'}
                </h3>
                <p className="text-gray-500 text-sm text-center max-w-xs mb-5">
                  {locale === 'fr'
                    ? `Créez un aperçu pour ${memberName} basé sur les séances et notes.`
                    : locale === 'es'
                    ? `Crea una vista para ${memberName} basada en sesiones y notas.`
                    : `Create an overview for ${memberName} based on sessions and notes.`}
                </p>
                <Button
                  onClick={generateSummary}
                  className="bg-[#D4856A] hover:bg-[#C07661] text-white"
                >
                  {locale === 'fr' ? 'Générer' : locale === 'es' ? 'Generar' : 'Generate'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

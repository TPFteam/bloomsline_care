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
  Award,
  Heart,
  Eye,
  Zap,
  CalendarClock,
  CalendarDays,
  Repeat,
  Minus,
  Activity,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type {
  MemberSummary,
  SummaryContent,
  PulseSentiment,
  PulseTheme,
  PulseHighlight,
  PulseAttention,
  PulseRecommendation,
  PulseSourceType,
  ThemeTone,
  HighlightType,
  AttentionSeverity,
  RecommendationTimeframe,
} from '@/types/member'
import { formatRelativeTime } from '@/types/member'

interface MemberSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  /** Called when user clicks a citation. Modal closes; parent should switch tab + highlight. */
  onNavigateToSource?: (sourceType: PulseSourceType, sourceId: string) => void
  /** When true, render the panel inline (no fixed-position backdrop,
   *  no scrim, no close button). Used by the Overview tab to embed
   *  the full Pulse directly in the card instead of opening a popup. */
  embedded?: boolean
}

type SectionId = 'status' | 'highlights' | 'themes' | 'attention' | 'recommendations' | 'nextSteps'

export function MemberSummaryModal({ isOpen, onClose, memberId, memberName, onNavigateToSource, embedded }: MemberSummaryModalProps) {
  const { locale } = useLanguage()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [summary, setSummary] = useState<MemberSummary | null>(null)
  const [summaryHistory, setSummaryHistory] = useState<MemberSummary[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['status', 'highlights', 'themes']))
  const [error, setError] = useState<string | null>(null)
  const [delta, setDelta] = useState<{ total: number; breakdown: Record<string, number>; sinceDate: string | null } | null>(null)
  const [showDataSources, setShowDataSources] = useState(false)
  const [moodTimeline, setMoodTimeline] = useState<Array<{ date: string; mood: number }>>([])
  const [sinceLastSession, setSinceLastSession] = useState<{
    lastSessionDate: string | null
    lastSessionId: string | null
    breakdown: Record<string, number>
    total: number
  } | null>(null)
  const [upcomingSession, setUpcomingSession] = useState<{
    id: string
    scheduled_at: string
    session_type: string
    session_format: string | null
    minutesUntil: number
  } | null>(null)
  const [viewMode, setViewMode] = useState<'brief' | 'full'>('full')

  type FileSource = { id: string; name: string; status: 'done' | 'cached' | 'skipped' | 'failed'; error?: string }
  type DataSources = {
    sessions: number
    notes: number
    milestones: number
    reflections: number
    sharedResources: number
    milestoneComments: number
    files: FileSource[]
    filesIndexed: number
    filesFailed: number
    filesSkipped: number
  }

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
    status: { icon: Sparkles, bgColor: 'bg-teal-500/10', textColor: 'text-teal-600' },
    highlights: { icon: TrendingUp, bgColor: 'bg-mint-50', textColor: 'text-mint-700' },
    themes: { icon: Lightbulb, bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
    attention: { icon: AlertTriangle, bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    recommendations: { icon: CheckCircle2, bgColor: 'bg-teal-500/10', textColor: 'text-teal-600' },
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
        setError(locale === 'fr' ? 'Veuillez vous connecter pour voir les résumés' : 'Please sign in to view summaries')
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
        setDelta(data.delta || null)
        setMoodTimeline(data.moodTimeline || [])
        setSinceLastSession(data.sinceLastSession || null)
        setUpcomingSession(data.upcomingSession || null)
        // Default to brief mode if there's a session coming up soon
        if (data.upcomingSession) {
          setViewMode('brief')
        }
      } else if (response.status !== 404) {
        const data = await response.json()
        setError(data.error || (locale === 'fr' ? 'Impossible de charger le résumé' : 'Failed to fetch summary'))
      }
    } catch (err) {
      console.error('Error fetching summary:', err)
      setError(locale === 'fr' ? 'Impossible de charger le résumé' : 'Failed to load summary')
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
        setError(locale === 'fr' ? 'Veuillez vous connecter pour générer des résumés' : 'Please sign in to generate summaries')
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
        setDelta(null) // Reset delta after successful generation
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
        setError(data.error || (locale === 'fr' ? 'Impossible de générer le résumé' : 'Failed to generate summary'))
      }
    } catch (err) {
      console.error('Error generating summary:', err)
      setError(locale === 'fr' ? 'Une erreur est survenue lors de la génération du résumé' : 'An error occurred while generating the summary')
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

  // ─── Visual v2 renderers ───────────────────────────────────

  // Citation pills — clickable, jumps to source
  const sourceIcons: Record<PulseSourceType, typeof Clock> = {
    session: Clock,
    note: Lightbulb,
    milestone: CheckCircle2,
    file: AlertCircle,
    reflection: Heart,
  }

  const renderSources = (sources: import('@/types/member').PulseSource[] | undefined) => {
    if (!sources || sources.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1 mt-1.5">
        {sources.map((s, i) => {
          const Icon = sourceIcons[s.type] || Clock
          const clickable = !!onNavigateToSource && s.type !== 'reflection'
          const baseCls = 'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-gray-600'
          const interactiveCls = clickable ? ' hover:bg-gray-100 hover:border-gray-300 cursor-pointer transition-colors' : ' opacity-70'
          return (
            <button
              key={`${s.type}-${s.id}-${i}`}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (!clickable) return
                onNavigateToSource?.(s.type, s.id)
                onClose()
              }}
              className={baseCls + interactiveCls}
              title={s.label || `${s.type} ${s.id.slice(0, 8)}`}
            >
              <Icon className="w-2.5 h-2.5" />
              <span className="truncate max-w-[120px]">{s.label || s.type}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const sentimentConfig: Record<PulseSentiment, { icon: typeof TrendingUp; bg: string; text: string; border: string; iconBg: string; label: { en: string; fr: string; es: string } }> = {
    progressing: {
      icon: TrendingUp,
      bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', iconBg: 'bg-emerald-100',
      label: { en: 'Progressing', fr: 'En progression', es: 'Progresando' },
    },
    stable: {
      icon: Activity,
      bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', iconBg: 'bg-teal-100',
      label: { en: 'Stable', fr: 'Stable', es: 'Estable' },
    },
    plateau: {
      icon: Minus,
      bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', iconBg: 'bg-amber-100',
      label: { en: 'Plateau', fr: 'Plateau', es: 'Estancado' },
    },
    attention: {
      icon: TrendingDown,
      bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', iconBg: 'bg-rose-100',
      label: { en: 'Needs attention', fr: 'À surveiller', es: 'Requiere atención' },
    },
  }

  const renderStatusCard = (sentiment: PulseSentiment, headline: string, detail: string) => {
    const cfg = sentimentConfig[sentiment] || sentimentConfig.stable
    const Icon = cfg.icon
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl ${cfg.iconBg} ${cfg.text} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text} bg-white/60 px-2 py-0.5 rounded-full`}>
                {cfg.label[locale] || cfg.label.en}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${cfg.text} leading-snug mb-1.5`}>{headline}</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{detail}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const themeToneClasses: Record<ThemeTone, string> = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    concerning: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  const renderThemes = (themes: PulseTheme[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          {locale === 'fr' ? 'Thèmes clés' : locale === 'es' ? 'Temas clave' : 'Key themes'}
        </h4>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {themes.map((t, i) => (
          <div key={`${t.label}-${i}`} className="inline-flex flex-col items-start">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${themeToneClasses[t.tone] || themeToneClasses.neutral}`}
            >
              {t.label}
            </span>
            {t.sources && t.sources.length > 0 && (
              <div className="ml-1">{renderSources(t.sources)}</div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )

  const highlightConfig: Record<HighlightType, { icon: typeof TrendingUp; tint: string; iconColor: string; label: { en: string; fr: string; es: string } }> = {
    progress: { icon: TrendingUp, tint: 'bg-emerald-50', iconColor: 'text-emerald-600', label: { en: 'Progress', fr: 'Progrès', es: 'Progreso' } },
    strength: { icon: Heart, tint: 'bg-rose-50', iconColor: 'text-rose-500', label: { en: 'Strength', fr: 'Force', es: 'Fortaleza' } },
    milestone: { icon: Award, tint: 'bg-violet-50', iconColor: 'text-violet-600', label: { en: 'Milestone', fr: 'Jalon', es: 'Hito' } },
    insight: { icon: Eye, tint: 'bg-blue-50', iconColor: 'text-blue-600', label: { en: 'Insight', fr: 'Aperçu', es: 'Idea' } },
  }

  const renderHighlights = (highlights: PulseHighlight[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          {locale === 'fr' ? 'Points forts' : locale === 'es' ? 'Logros destacados' : 'Highlights'}
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {highlights.map((h, i) => {
          const cfg = highlightConfig[h.type] || highlightConfig.insight
          const Icon = cfg.icon
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${cfg.tint} ${cfg.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.iconColor}`}>{cfg.label[locale] || cfg.label.en}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{h.title}</p>
                {h.detail && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{h.detail}</p>}
                {renderSources(h.sources)}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )

  const severityConfig: Record<AttentionSeverity, { dot: string; ring: string; bg: string; text: string; label: { en: string; fr: string; es: string } }> = {
    high: { dot: 'bg-red-500', ring: 'border-red-200', bg: 'bg-red-50', text: 'text-red-700', label: { en: 'High', fr: 'Élevée', es: 'Alta' } },
    medium: { dot: 'bg-amber-500', ring: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', label: { en: 'Medium', fr: 'Moyenne', es: 'Media' } },
    low: { dot: 'bg-gray-400', ring: 'border-gray-200', bg: 'bg-gray-50', text: 'text-gray-600', label: { en: 'Low', fr: 'Faible', es: 'Baja' } },
  }

  const renderAttention = (attention: PulseAttention[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          {locale === 'fr' ? 'Points d\'attention' : locale === 'es' ? 'Áreas de atención' : 'Areas of attention'}
        </h4>
      </div>
      <div className="space-y-2">
        {attention.map((a, i) => {
          const cfg = severityConfig[a.severity] || severityConfig.low
          return (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.ring} ${cfg.bg}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{a.title}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.text} shrink-0`}>{cfg.label[locale] || cfg.label.en}</span>
                </div>
                {a.detail && <p className="text-xs text-gray-600 leading-relaxed">{a.detail}</p>}
                {renderSources(a.sources)}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )

  const timeframeConfig: Record<RecommendationTimeframe, { icon: typeof CalendarClock; tint: string; iconColor: string; label: { en: string; fr: string; es: string } }> = {
    this_week: { icon: Zap, tint: 'bg-amber-50', iconColor: 'text-amber-600', label: { en: 'This week', fr: 'Cette semaine', es: 'Esta semana' } },
    next_session: { icon: CalendarDays, tint: 'bg-teal-50', iconColor: 'text-teal-600', label: { en: 'Next session', fr: 'Prochaine séance', es: 'Próxima sesión' } },
    ongoing: { icon: Repeat, tint: 'bg-gray-100', iconColor: 'text-gray-600', label: { en: 'Ongoing', fr: 'Continu', es: 'En curso' } },
  }

  const renderRecommendations = (recommendations: PulseRecommendation[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-teal-600" />
        <h4 className="text-sm font-semibold text-gray-900">
          {locale === 'fr' ? 'Recommandations' : locale === 'es' ? 'Recomendaciones' : 'Recommendations'}
        </h4>
      </div>
      <div className="space-y-2">
        {recommendations.map((r, i) => {
          const cfg = timeframeConfig[r.timeframe] || timeframeConfig.ongoing
          const Icon = cfg.icon
          return (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
              <div className={`w-8 h-8 rounded-lg ${cfg.tint} ${cfg.iconColor} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${cfg.iconColor}`}>{cfg.label[locale] || cfg.label.en}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{r.title}</p>
                {r.detail && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.detail}</p>}
                {renderSources(r.sources)}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )

  const renderNextSteps = (steps: string[]) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-gray-100 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="w-4 h-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          {locale === 'fr' ? 'Prochaines étapes' : locale === 'es' ? 'Próximos pasos' : 'Next steps'}
        </h4>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <span className="leading-relaxed">{s}</span>
          </li>
        ))}
      </ol>
    </motion.div>
  )

  // ─── Pre-session brief header (shows when there's a session within 24h) ────
  const renderBriefHeader = () => {
    if (!upcomingSession) return null
    const { scheduled_at, session_type, session_format, minutesUntil, id } = upcomingSession
    const hours = Math.floor(minutesUntil / 60)
    const mins = minutesUntil % 60
    const isUrgent = minutesUntil <= 240 // within 4 hours
    const timeUntil = hours > 0
      ? `${hours}${locale === 'fr' ? 'h' : 'h'} ${mins}${locale === 'fr' ? 'min' : 'm'}`
      : `${mins} ${locale === 'fr' ? 'min' : 'min'}`
    const sessionDate = new Date(scheduled_at).toLocaleString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    const formatLabel = session_format === 'in_person'
      ? (locale === 'fr' ? 'En personne' : locale === 'es' ? 'En persona' : 'In person')
      : (locale === 'fr' ? 'Vidéo' : 'Video')
    const typeLabel = (session_type || '').replace(/_/g, ' ')

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-5 ${isUrgent ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800'}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className={`flex items-center gap-1.5 mb-1 ${isUrgent ? 'text-teal-100' : 'text-slate-500'}`}>
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {locale === 'fr' ? 'Prochaine séance' : locale === 'es' ? 'Próxima sesión' : 'Next session'}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 leading-tight">
              {locale === 'fr' ? 'Dans' : locale === 'es' ? 'En' : 'In'} {timeUntil}
            </h3>
            <p className={`text-xs ${isUrgent ? 'text-teal-100' : 'text-slate-600'}`}>
              {sessionDate} · {typeLabel} · {formatLabel}
            </p>
          </div>
          {onNavigateToSource && (
            <button
              type="button"
              onClick={() => { onNavigateToSource('session', id); onClose() }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                isUrgent
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
              }`}
            >
              {locale === 'fr' ? 'Voir' : locale === 'es' ? 'Ver' : 'View'}
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // ─── View mode toggle (Brief vs Full Pulse) ──────────────────────
  const renderViewToggle = () => {
    if (!upcomingSession) return null
    return (
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setViewMode('brief')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'brief' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {locale === 'fr' ? 'Brief de séance' : locale === 'es' ? 'Resumen de sesión' : 'Session brief'}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('full')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            viewMode === 'full' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {locale === 'fr' ? 'Pulse complet' : locale === 'es' ? 'Pulse completo' : 'Full Pulse'}
        </button>
      </div>
    )
  }

  // ─── Mood sparkline (inline SVG, no chart lib) ──────────────────
  const renderMoodSparkline = () => {
    if (!moodTimeline || moodTimeline.length < 2) return null
    const W = 280
    const H = 50
    const PAD = 4
    const values = moodTimeline.map(p => p.mood)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = Math.max(1, max - min)
    const xStep = (W - PAD * 2) / (values.length - 1)
    const yScale = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2)
    const points = values.map((v, i) => `${PAD + i * xStep},${yScale(v)}`).join(' ')

    // Trend: compare first vs last
    const first = values[0]
    const last = values[values.length - 1]
    const diff = last - first
    const trendLabel =
      diff > 0.5
        ? (locale === 'fr' ? 'En hausse' : locale === 'es' ? 'Subiendo' : 'Trending up')
        : diff < -0.5
        ? (locale === 'fr' ? 'En baisse' : locale === 'es' ? 'Bajando' : 'Trending down')
        : (locale === 'fr' ? 'Stable' : 'Stable')
    const trendColor = diff > 0.5 ? 'text-emerald-600' : diff < -0.5 ? 'text-rose-600' : 'text-gray-500'
    const lineColor = diff > 0.5 ? 'stroke-emerald-500' : diff < -0.5 ? 'stroke-rose-500' : 'stroke-teal-500'
    const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-5"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-900">
              {locale === 'fr' ? 'Humeur — 12 dernières semaines' : locale === 'es' ? 'Estado de ánimo — 12 semanas' : 'Mood — last 12 weeks'}
            </h4>
          </div>
          <span className={`text-[10px] font-medium ${trendColor}`}>
            {trendLabel}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <svg width={W} height={H} className="overflow-visible">
            <polyline
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={lineColor}
              points={points}
            />
            {values.map((v, i) => (
              <circle
                key={i}
                cx={PAD + i * xStep}
                cy={yScale(v)}
                r={1.5}
                className={lineColor}
                fill="currentColor"
              />
            ))}
          </svg>
          <div className="text-right shrink-0">
            <div className="text-xl font-bold text-gray-900 tabular-nums">{avg}<span className="text-xs text-gray-400 font-normal">/10</span></div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">
              {values.length} {locale === 'fr' ? 'entrées' : locale === 'es' ? 'entradas' : 'entries'}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Since last session digest ──────────────────────────────────
  const renderSinceLastSession = () => {
    if (!sinceLastSession || sinceLastSession.total === 0) return null
    const { lastSessionDate, lastSessionId, breakdown } = sinceLastSession
    const items: Array<{ key: keyof typeof breakdown; label: string; tab: 'notes' | 'files' | 'shared' | 'progress' | null }> = [
      { key: 'notes', label: locale === 'fr' ? 'nouvelles notes' : locale === 'es' ? 'nuevas notas' : 'new notes', tab: 'notes' },
      { key: 'reflections', label: locale === 'fr' ? 'nouvelles réflexions du patient' : locale === 'es' ? 'nuevas reflexiones del paciente' : 'new patient reflections', tab: null },
      { key: 'files', label: locale === 'fr' ? 'nouveaux fichiers' : locale === 'es' ? 'nuevos archivos' : 'new files', tab: 'files' },
      { key: 'comments', label: locale === 'fr' ? 'commentaires du patient' : locale === 'es' ? 'comentarios del paciente' : 'patient comments', tab: 'shared' },
      { key: 'responses', label: locale === 'fr' ? 'réponses aux ressources' : locale === 'es' ? 'respuestas a recursos' : 'resource submissions', tab: 'shared' },
      { key: 'milestones', label: locale === 'fr' ? 'mises à jour des objectifs' : locale === 'es' ? 'actualizaciones de objetivos' : 'goal updates', tab: 'progress' },
    ]
    const lastDate = lastSessionDate
      ? new Date(lastSessionDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : ''
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5"
      >
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">
            {locale === 'fr' ? 'Depuis la dernière séance' : locale === 'es' ? 'Desde la última sesión' : 'Since last session'}
          </h4>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {lastSessionId && onNavigateToSource ? (
            <button
              type="button"
              onClick={() => { onNavigateToSource('session', lastSessionId); onClose() }}
              className="underline hover:text-blue-700"
            >
              {lastDate}
            </button>
          ) : lastDate}
        </p>
        <ul className="space-y-1.5">
          {items.filter(it => (breakdown[it.key] || 0) > 0).map(it => (
            <li key={it.key} className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-md bg-white text-blue-700 text-xs font-semibold flex items-center justify-center tabular-nums">
                {breakdown[it.key]}
              </span>
              <span className="text-gray-700">{it.label}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    )
  }

  if (!embedded && !isOpen) return null

  // Inner panel — same for both popup and embed; only the outer
  // wrapping (fixed backdrop vs. plain div) changes.
  const Panel = (
    <div
      className={
        embedded
          ? 'bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col w-full'
          : 'bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'
      }
      onClick={embedded ? undefined : (e) => e.stopPropagation()}
    >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-600" />
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
              {!embedded && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
                <p className="text-gray-500 text-sm">
                  {locale === 'fr' ? 'Chargement...' : locale === 'es' ? 'Cargando...' : 'Loading...'}
                </p>
              </div>
            ) : generating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
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
                          ? 'border-teal-500/30 bg-teal-500/10'
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
                          <span className="text-xs text-teal-600 font-medium">
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
                {/* Delta banner — newer data available */}
                {delta && delta.total >= 10 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        {locale === 'fr'
                          ? `${delta.total} nouvelles données disponibles`
                          : locale === 'es'
                            ? `${delta.total} nuevos datos disponibles`
                            : `${delta.total} new updates available`}
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        {[
                          delta.breakdown.sessions && `${delta.breakdown.sessions} ${locale === 'fr' ? 'séances' : locale === 'es' ? 'sesiones' : 'sessions'}`,
                          delta.breakdown.notes && `${delta.breakdown.notes} ${locale === 'fr' ? 'notes' : 'notes'}`,
                          delta.breakdown.reflections && `${delta.breakdown.reflections} ${locale === 'fr' ? 'réflexions' : locale === 'es' ? 'reflexiones' : 'reflections'}`,
                          delta.breakdown.files && `${delta.breakdown.files} ${locale === 'fr' ? 'fichiers' : locale === 'es' ? 'archivos' : 'files'}`,
                          delta.breakdown.stories && `${delta.breakdown.stories} ${locale === 'fr' ? 'histoires' : locale === 'es' ? 'historias' : 'stories'}`,
                          delta.breakdown.responses && `${delta.breakdown.responses} ${locale === 'fr' ? 'réponses' : locale === 'es' ? 'respuestas' : 'responses'}`,
                          delta.breakdown.bookings && `${delta.breakdown.bookings} ${locale === 'fr' ? 'réservations' : locale === 'es' ? 'reservas' : 'bookings'}`,
                          delta.breakdown.comments && `${delta.breakdown.comments} ${locale === 'fr' ? 'commentaires' : locale === 'es' ? 'comentarios' : 'comments'}`,
                          delta.breakdown.milestones && `${delta.breakdown.milestones} ${locale === 'fr' ? 'jalons' : locale === 'es' ? 'hitos' : 'milestones'}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={generateSummary}
                      disabled={generating}
                      className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      {locale === 'fr' ? 'Actualiser' : locale === 'es' ? 'Actualizar' : 'Refresh'}
                    </Button>
                  </div>
                )}

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
                    className="text-teal-600 hover:text-teal-600 hover:bg-teal-500/10"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
                    {locale === 'fr' ? 'Régénérer' : locale === 'es' ? 'Regenerar' : 'Regenerate'}
                  </Button>
                </div>

                {/* Summary — visual v2 if present, otherwise legacy text sections */}
                {(() => {
                  const content = summary.summary_content as SummaryContent
                  const v2 = content.v2
                  if (v2) {
                    // ─── Brief mode (pre-session prep, condensed) ───────────
                    if (viewMode === 'brief' && upcomingSession) {
                      const topAttention = (v2.attention || [])
                        .slice()
                        .sort((a, b) => {
                          const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
                          return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
                        })
                        .slice(0, 3)
                      const topHighlights = (v2.highlights || []).slice(0, 3)
                      const urgentRecs = (v2.recommendations || []).filter(r => r.timeframe === 'this_week' || r.timeframe === 'next_session')
                      return (
                        <div className="space-y-4">
                          {renderBriefHeader()}
                          {renderViewToggle()}
                          {renderStatusCard(v2.sentiment, v2.status_headline, v2.status_detail)}
                          {renderMoodSparkline()}
                          {renderSinceLastSession()}
                          {topAttention.length > 0 && renderAttention(topAttention)}
                          {topHighlights.length > 0 && renderHighlights(topHighlights)}
                          {urgentRecs.length > 0 && renderRecommendations(urgentRecs)}
                        </div>
                      )
                    }
                    // ─── Full mode (everything) ──────────────────────────────
                    return (
                      <div className="space-y-4">
                        {renderViewToggle()}
                        {renderStatusCard(v2.sentiment, v2.status_headline, v2.status_detail)}
                        {renderMoodSparkline()}
                        {renderSinceLastSession()}
                        {v2.themes && v2.themes.length > 0 && renderThemes(v2.themes)}
                        {v2.highlights && v2.highlights.length > 0 && renderHighlights(v2.highlights)}
                        {v2.attention && v2.attention.length > 0 && renderAttention(v2.attention)}
                        {v2.recommendations && v2.recommendations.length > 0 && renderRecommendations(v2.recommendations)}
                        {v2.next_steps && v2.next_steps.length > 0 && renderNextSteps(v2.next_steps)}
                      </div>
                    )
                  }
                  // Fallback for legacy summaries
                  return (
                    <div className="space-y-3">
                      {renderSection('status', content.current_status, 0)}
                      {renderSection('highlights', content.progress_highlights, 1)}
                      {renderSection('themes', content.key_themes, 2)}
                      {renderSection('attention', content.areas_of_attention, 3)}
                      {renderSection('recommendations', content.recommendations, 4)}
                      {renderSection('nextSteps', content.next_steps, 5)}
                    </div>
                  )
                })()}

                {/* Data Sources — transparency on what fed into this Pulse */}
                {(() => {
                  const sources = (summary.summary_content as SummaryContent & { _data_sources?: DataSources })._data_sources
                  if (!sources) return null
                  const totalCounts = sources.sessions + sources.notes + sources.milestones + sources.reflections + sources.sharedResources + sources.milestoneComments
                  return (
                    <div className="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowDataSources(!showDataSources)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900">
                              {locale === 'fr' ? 'Sources de données' : locale === 'es' ? 'Fuentes de datos' : 'Data sources'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {totalCounts} {locale === 'fr' ? 'éléments' : locale === 'es' ? 'elementos' : 'records'} · {sources.filesIndexed} / {sources.files.length} {locale === 'fr' ? 'fichiers indexés' : locale === 'es' ? 'archivos indexados' : 'files indexed'}
                            </p>
                          </div>
                        </div>
                        {showDataSources ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </button>
                      {showDataSources && (
                        <div className="p-4 pt-0 space-y-4">
                          {/* Plain-language intro */}
                          <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">
                            {locale === 'fr'
                              ? 'Pulse a lu tout ce que vous avez consigné sur ce patient. Voici exactement ce qui a été pris en compte :'
                              : locale === 'es'
                              ? 'Pulse leyó todo lo que tienes registrado sobre este paciente. Esto es exactamente lo que se incluyó:'
                              : 'Pulse read everything you have on this patient. Here\'s exactly what was used:'}
                          </p>

                          {/* Counts with plain-language subtitles */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {[
                              {
                                label: locale === 'fr' ? 'Séances' : 'Sessions',
                                value: sources.sessions,
                                hint: locale === 'fr' ? 'séances passées' : locale === 'es' ? 'sesiones pasadas' : 'past appointments',
                              },
                              {
                                label: locale === 'fr' ? 'Notes' : 'Notes',
                                value: sources.notes,
                                hint: locale === 'fr' ? 'onglet Notes' : locale === 'es' ? 'pestaña Notas' : 'from Notes tab',
                              },
                              {
                                label: locale === 'fr' ? 'Objectifs' : 'Goals',
                                value: sources.milestones,
                                hint: locale === 'fr' ? 'jalons & progrès' : locale === 'es' ? 'hitos y progreso' : 'goals & progress',
                              },
                              {
                                label: locale === 'fr' ? 'Réflexions' : 'Reflections',
                                value: sources.reflections,
                                hint: locale === 'fr' ? 'humeur du patient' : locale === 'es' ? 'estado de ánimo' : 'patient mood entries',
                              },
                              {
                                label: locale === 'fr' ? 'Ressources' : 'Resources',
                                value: sources.sharedResources,
                                hint: locale === 'fr' ? 'partagées avec le patient' : locale === 'es' ? 'compartidas con paciente' : 'shared with patient',
                              },
                              {
                                label: locale === 'fr' ? 'Commentaires' : 'Comments',
                                value: sources.milestoneComments,
                                hint: locale === 'fr' ? 'sur les objectifs' : locale === 'es' ? 'sobre objetivos' : 'on goals',
                              },
                            ].map((item) => (
                              <div key={item.label} className="bg-gray-50 rounded-lg p-2 text-center">
                                <div className="text-base font-bold text-gray-900">{item.value}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wide">{item.label}</div>
                                <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{item.hint}</div>
                              </div>
                            ))}
                          </div>

                          {/* File list */}
                          {sources.files.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-0.5 uppercase tracking-wide">
                                {locale === 'fr' ? 'Fichiers' : locale === 'es' ? 'Archivos' : 'Files'} ({sources.files.length})
                              </p>
                              <p className="text-[11px] text-gray-500 mb-2">
                                {locale === 'fr'
                                  ? 'depuis l\'onglet Informations'
                                  : locale === 'es'
                                  ? 'desde la pestaña Información'
                                  : 'from the Information tab'}
                              </p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {sources.files.map((f) => {
                                  const isOk = f.status === 'done' || f.status === 'cached'
                                  const Icon = isOk ? CheckCircle2 : f.status === 'failed' ? AlertCircle : AlertTriangle
                                  const colorCls = isOk ? 'text-emerald-600' : f.status === 'failed' ? 'text-red-500' : 'text-gray-400'
                                  return (
                                    <div key={f.id}>
                                      <div className="flex items-center gap-2 text-xs">
                                        <Icon className={`w-3.5 h-3.5 shrink-0 ${colorCls}`} />
                                        <span className="text-gray-700 truncate flex-1">{f.name}</span>
                                        <span className="text-gray-400 text-[10px] uppercase">
                                          {f.status === 'done' && (locale === 'fr' ? 'extrait' : locale === 'es' ? 'extraído' : 'extracted')}
                                          {f.status === 'cached' && (locale === 'fr' ? 'en cache' : locale === 'es' ? 'cacheado' : 'cached')}
                                          {f.status === 'skipped' && (locale === 'fr' ? 'ignoré' : locale === 'es' ? 'omitido' : 'skipped')}
                                          {f.status === 'failed' && (locale === 'fr' ? 'échec' : locale === 'es' ? 'fallo' : 'failed')}
                                        </span>
                                      </div>
                                      {f.status === 'failed' && f.error && (
                                        <p className="text-[10px] text-red-500 ml-5 mt-0.5 break-words">{f.error}</p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                              {sources.filesFailed > 0 && (
                                <p className="text-[11px] text-red-500 mt-2">
                                  {locale === 'fr'
                                    ? `${sources.filesFailed} fichier(s) ont échoué — réessayez en régénérant`
                                    : `${sources.filesFailed} file(s) failed — retry by regenerating`}
                                </p>
                              )}
                              {sources.filesSkipped > 0 && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                  {locale === 'fr'
                                    ? `${sources.filesSkipped} fichier(s) ignoré(s) (format non pris en charge)`
                                    : `${sources.filesSkipped} file(s) skipped (format not yet supported)`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

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
                <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center mb-4">
                  {generating ? (
                    <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-teal-600" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {generating
                    ? (locale === 'fr' ? 'Génération en cours…' : locale === 'es' ? 'Generando…' : 'Generating…')
                    : (locale === 'fr' ? 'Générer Bloom Pulse' : locale === 'es' ? 'Generar Bloom Pulse' : 'Generate Bloom Pulse')}
                </h3>
                <p className="text-gray-500 text-sm text-center max-w-sm mb-2">
                  {locale === 'fr'
                    ? `Créez un aperçu pour ${memberName} basé sur les séances, notes et fichiers.`
                    : locale === 'es'
                    ? `Crea una vista para ${memberName} basada en sesiones, notas y archivos.`
                    : `Create an overview for ${memberName} based on sessions, notes, and files.`}
                </p>
                <p className="text-xs text-gray-400 text-center max-w-sm mb-5">
                  {locale === 'fr'
                    ? "La première génération peut prendre jusqu'à 30 secondes pour les patients avec beaucoup de fichiers. Les générations suivantes sont rapides."
                    : locale === 'es'
                    ? 'La primera generación puede tardar hasta 30 segundos para pacientes con muchos archivos. Las siguientes son rápidas.'
                    : 'First generation may take up to 30 seconds for patients with many files. Subsequent generations are fast.'}
                </p>
                {!generating && (
                  <Button
                    onClick={generateSummary}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    {locale === 'fr' ? 'Générer' : locale === 'es' ? 'Generar' : 'Generate'}
                  </Button>
                )}
              </div>
            )}
          </div>
    </div>
  )

  if (embedded) {
    return Panel
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        {Panel}
      </motion.div>
    </AnimatePresence>
  )
}

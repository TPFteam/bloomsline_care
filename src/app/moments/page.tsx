'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  Plus,
  Camera,
  Video,
  Mic,
  PenLine,
  Loader2,
  Trash2,
  Play,
  X,
  Sun,
  Moon,
  Grid3X3,
  List,
  SlidersHorizontal,
  Check,
  ChevronLeft,
  MessageCircle,
  Sparkles,
  Heart,
  TrendingUp,
  TrendingDown,
  BarChart2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'
import { getMemberMoments, getMomentStats, deleteMoment, type Moment, type MomentType } from '@/lib/services/moments'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getUserPreferences, updateUserPreferences } from '@/lib/services/preferences'
import { toast } from 'sonner'
import BloomChatInterface from '@/components/bloom/BloomChatInterface'

const typeIcons: Record<MomentType, typeof Camera> = {
  photo: Camera,
  video: Video,
  voice: Mic,
  write: PenLine,
}

const MOOD_OPTIONS = [
  'grateful', 'peaceful', 'joyful', 'inspired', 'loved',
  'calm', 'hopeful', 'proud', 'anxious', 'sad', 'frustrated'
]

type DateFilter = 'all' | 'today' | 'week' | 'month'

const BLOOM_PROMPTS_EN = [
  'How are you feeling?',
  'What\'s on your mind?',
  'Tell me about your day',
  'Need someone to talk to?',
  'What made you smile today?',
  'How can I help you?',
  'Share your thoughts...',
]

const BLOOM_PROMPTS_FR = [
  'Comment te sens-tu ?',
  'À quoi penses-tu ?',
  'Raconte-moi ta journée',
  'Besoin de parler ?',
  'Qu\'est-ce qui t\'a fait sourire ?',
  'Comment puis-je t\'aider ?',
  'Partage tes pensées...',
]

function BloomPill({ isDark, locale, onClick }: { isDark: boolean; locale: string; onClick: () => void }) {
  const [promptIndex, setPromptIndex] = useState(0)
  const prompts = locale === 'fr' ? BLOOM_PROMPTS_FR : BLOOM_PROMPTS_EN

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [prompts.length])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 safe-area-mb"
    >
      {/* Ambient glow behind pill */}
      <motion.div
        animate={{
          opacity: isDark ? [0.4, 0.6, 0.4] : [0.6, 0.8, 0.6],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full ${
          isDark
            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 blur-2xl'
            : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 blur-3xl'
        }`}
        style={{ transform: 'scale(2.2)' }}
      />

      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={`relative flex items-center gap-3 pl-4 pr-6 py-3 rounded-full backdrop-blur-2xl overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-white/[0.1] to-white/[0.05] border border-white/[0.15]'
            : 'bg-gradient-to-r from-white/90 to-white/70 border border-white/50'
        }`}
        style={{
          boxShadow: isDark
            ? '0 10px 40px -10px rgba(16, 185, 129, 0.3), 0 4px 20px -5px rgba(0,0,0,0.3)'
            : '0 10px 40px -10px rgba(16, 185, 129, 0.2), 0 4px 20px -5px rgba(0,0,0,0.05)'
        }}
      >
        {/* Shimmer effect */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
        />

        {/* Animated orb */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {/* Outer ring pulse */}
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
          />
          {/* Middle glow */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            className="absolute w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 blur-sm"
          />
          {/* Core */}
          <motion.div
            animate={{
              scale: [1, 0.9, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 shadow-lg"
          />
        </div>

        {/* Rotating prompt with simple crossfade */}
        <div className="relative w-[180px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={promptIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className={`block text-sm font-medium truncate ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}
            >
              {prompts[promptIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.button>
    </motion.div>
  )
}

export default function MomentsPage() {
  const router = useRouter()
  const { locale } = useLanguage()

  const [moments, setMoments] = useState<Moment[]>([])
  const [stats, setStats] = useState<{ total: number; thisWeek: number; byType: Record<MomentType, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isBloomOpen, setIsBloomOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMoods, setSelectedMoods] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [reflectMoment, setReflectMoment] = useState<Moment | null>(null)
  const [showMoodTrends, setShowMoodTrends] = useState(false)
  const [trendsTimeRange, setTrendsTimeRange] = useState<'weekly' | 'monthly'>('weekly')

  // Pick a random moment for reflection
  const openReflection = () => {
    if (moments.length === 0) return
    const randomIndex = Math.floor(Math.random() * moments.length)
    setReflectMoment(moments[randomIndex])
  }

  // Load preferences from database
  useEffect(() => {
    async function loadPreferences() {
      const prefs = await getUserPreferences()
      setIsDark(prefs.moments_theme === 'dark')
      setViewMode(prefs.moments_view)
      setPrefsLoaded(true)
    }
    loadPreferences()
  }, [])

  // Save theme preference to database
  const handleThemeChange = async () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    await updateUserPreferences({ moments_theme: newTheme })
  }

  // Save view preference to database
  const handleViewChange = async (newView: 'grid' | 'list') => {
    setViewMode(newView)
    await updateUserPreferences({ moments_view: newView })
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [momentsData, statsData] = await Promise.all([
          getMemberMoments(),
          getMomentStats(),
        ])
        setMoments(momentsData)
        setStats(statsData)
      } catch (error) {
        console.error('Error loading moments:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleDelete = async (momentId: string) => {
    const confirmed = window.confirm(
      locale === 'fr'
        ? 'Êtes-vous sûr de vouloir supprimer ce moment ?'
        : 'Are you sure you want to delete this moment?'
    )
    if (!confirmed) return

    setDeleting(momentId)
    const success = await deleteMoment(momentId)
    if (success) {
      setMoments(prev => prev.filter(m => m.id !== momentId))
      setSelectedMoment(null)
      toast.success(locale === 'fr' ? 'Moment supprimé' : 'Moment deleted')
    } else {
      toast.error(locale === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting moment')
    }
    setDeleting(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return locale === 'fr' ? "À l'instant" : 'Just now'
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays === 1) return locale === 'fr' ? 'Hier' : 'Yesterday'
    if (diffDays < 7) return `${diffDays}d`
    return formatDate(dateStr)
  }

  // Filter moments
  const filteredMoments = moments.filter(moment => {
    // Mood filter
    if (selectedMoods.length > 0) {
      const hasMood = selectedMoods.some(mood => moment.moods?.includes(mood))
      if (!hasMood) return false
    }

    // Date filter
    if (dateFilter !== 'all') {
      const momentDate = new Date(moment.created_at)
      const now = new Date()

      if (dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        if (momentDate < today) return false
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (momentDate < weekAgo) return false
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (momentDate < monthAgo) return false
      }
    }

    return true
  })

  const toggleMood = (mood: string) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    )
  }

  const clearFilters = () => {
    setSelectedMoods([])
    setDateFilter('all')
  }

  const hasActiveFilters = selectedMoods.length > 0 || dateFilter !== 'all'

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-[#0c0c0e]' : 'bg-[#f8f7f4]',
    cardBg: isDark ? 'bg-white/[0.04]' : 'bg-white',
    cardBorder: isDark ? 'border-white/[0.08]' : 'border-black/[0.06]',
    cardHover: isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.02]',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-white/50' : 'text-gray-500',
    textFaint: isDark ? 'text-white/30' : 'text-gray-400',
    accent: isDark ? 'bg-white text-black' : 'bg-gray-900 text-white',
    toggleBg: isDark ? 'bg-white/10' : 'bg-black/5',
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="relative w-10 h-10">
          <div className={`absolute inset-0 rounded-full border-[3px] ${isDark ? 'border-gray-700' : 'border-emerald-100'}`} />
          <motion.div
            className={`absolute inset-0 rounded-full border-[3px] border-transparent ${isDark ? 'border-t-emerald-400 border-r-emerald-400' : 'border-t-emerald-500 border-r-emerald-500'}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme.bg} pb-32 transition-colors duration-500`}>
      {/* Ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 -right-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px]" />
          </>
        ) : (
          <>
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-amber-200/40 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 -right-20 w-60 h-60 bg-rose-200/30 rounded-full blur-[80px]" />
          </>
        )}
      </div>

      {/* Header */}
      <div className="relative z-10 safe-area-pt">
        <div className="px-5 pt-6 pb-4">
          {/* Top row - Title and controls */}
          <div className="flex items-start justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={() => router.back()}
                className={`w-9 h-9 flex items-center justify-center rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.textMuted}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-semibold ${theme.text} tracking-tight`}>
                  {locale === 'fr' ? 'Moments' : 'Moments'}
                </h1>
                {stats && stats.total > 0 && (
                  <p className={`text-sm ${theme.textFaint} mt-0.5`}>
                    {stats.total} {locale === 'fr' ? 'capturés' : 'captured'}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              {/* View toggle */}
              <div className={`flex p-1 rounded-xl ${theme.toggleBg}`}>
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? theme.accent
                      : theme.textMuted
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewChange('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? theme.accent
                      : theme.textMuted
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Theme toggle */}
              <button
                onClick={handleThemeChange}
                className={`p-2.5 rounded-xl ${theme.toggleBg} ${theme.textMuted} hover:scale-105 transition-all`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </motion.div>
          </div>

          {/* Filter and Add row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                hasActiveFilters
                  ? isDark ? 'bg-white/10 text-white' : 'bg-gray-900 text-white'
                  : `${theme.cardBg} border ${theme.cardBorder} ${theme.textMuted}`
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">
                {locale === 'fr' ? 'Filtres' : 'Filters'}
                {hasActiveFilters && ` (${selectedMoods.length + (dateFilter !== 'all' ? 1 : 0)})`}
              </span>
            </button>

            {/* Add button */}
            <Link href="/moments/capture">
              <button
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${theme.accent}`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">
                  {locale === 'fr' ? 'Ajouter' : 'Add'}
                </span>
              </button>
            </Link>

            {/* Reflect button */}
            {moments.length > 0 && (
              <button
                onClick={openReflection}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${theme.cardBg} border ${theme.cardBorder} ${theme.textMuted} hover:${isDark ? 'bg-white/10' : 'bg-black/5'} transition-colors`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">
                  {locale === 'fr' ? 'Revivre' : 'Revisit'}
                </span>
              </button>
            )}
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className={`mt-4 p-4 rounded-2xl ${theme.cardBg} border ${theme.cardBorder}`}>
                  {/* Date Filter */}
                  <div className="mb-4">
                    <p className={`text-xs ${theme.textMuted} mb-2 uppercase tracking-wide`}>
                      {locale === 'fr' ? 'Période' : 'Time Period'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'all', label: locale === 'fr' ? 'Tout' : 'All' },
                        { value: 'today', label: locale === 'fr' ? "Aujourd'hui" : 'Today' },
                        { value: 'week', label: locale === 'fr' ? 'Cette semaine' : 'This week' },
                        { value: 'month', label: locale === 'fr' ? 'Ce mois' : 'This month' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setDateFilter(option.value as DateFilter)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            dateFilter === option.value
                              ? isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                              : `${isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-gray-600'}`
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Filter */}
                  <div>
                    <p className={`text-xs ${theme.textMuted} mb-2 uppercase tracking-wide`}>
                      {locale === 'fr' ? 'Émotions' : 'Emotions'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {MOOD_OPTIONS.map(mood => (
                        <button
                          key={mood}
                          onClick={() => toggleMood(mood)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                            selectedMoods.includes(mood)
                              ? isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                              : `${isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-gray-600'}`
                          }`}
                        >
                          {selectedMoods.includes(mood) && <Check className="w-3 h-3" />}
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className={`mt-4 text-sm ${theme.textMuted} hover:${theme.text} transition-colors`}
                    >
                      {locale === 'fr' ? 'Effacer les filtres' : 'Clear filters'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mood Insights Section */}
      {moments.length > 0 && (
        <div className="relative z-10 px-5 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl p-5 ${theme.cardBg} border ${theme.cardBorder} overflow-hidden relative`}
          >
            {/* Decorative gradient blob */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-200/40'}`} />
            <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl ${isDark ? 'bg-violet-500/15' : 'bg-violet-200/30'}`} />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className={`text-sm font-semibold ${theme.text}`}>
                    {locale === 'fr' ? 'Comment tu vas' : 'How you\'re doing'}
                  </span>
                  <p className={`text-xs ${theme.textFaint}`}>
                    {locale === 'fr' ? 'Cette semaine' : 'This week'}
                  </p>
                </div>
              </div>

              {/* Mood analysis */}
              {(() => {
                // Get moments from last 7 days
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                const recentMoments = moments.filter(m => new Date(m.created_at) >= weekAgo)

                // Count all moods
                const moodCounts: Record<string, number> = {}
                recentMoments.forEach(m => {
                  m.moods?.forEach(mood => {
                    moodCounts[mood] = (moodCounts[mood] || 0) + 1
                  })
                })

                // Find top mood
                const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])
                const topMood = sortedMoods[0]?.[0]
                const totalMoods = Object.values(moodCounts).reduce((a, b) => a + b, 0)

                // Positive moods
                const positiveMoods = ['grateful', 'peaceful', 'joyful', 'inspired', 'loved', 'calm', 'hopeful', 'proud']
                const positiveCount = Object.entries(moodCounts)
                  .filter(([mood]) => positiveMoods.includes(mood))
                  .reduce((sum, [, count]) => sum + count, 0)
                const positiveRatio = totalMoods > 0 ? positiveCount / totalMoods : 0

                // Generate insight
                let insight = ''
                if (recentMoments.length === 0) {
                  insight = locale === 'fr'
                    ? "Pas encore de moments cette semaine. Prends un instant pour capturer ce qui compte."
                    : "No moments captured this week yet. Take a moment to capture what matters."
                } else if (positiveRatio >= 0.7) {
                  insight = locale === 'fr'
                    ? `Tu traverses une belle période. ${topMood ? `Tu te sens souvent ${topMood}.` : ''} Continue comme ça.`
                    : `You're going through a beautiful time. ${topMood ? `You've been feeling ${topMood} a lot.` : ''} Keep it up.`
                } else if (positiveRatio >= 0.4) {
                  insight = locale === 'fr'
                    ? "Des hauts et des bas, c'est normal. Chaque moment compte dans ton parcours."
                    : "Ups and downs are normal. Every moment matters in your journey."
                } else if (totalMoods > 0) {
                  insight = locale === 'fr'
                    ? "Cette semaine semble difficile. N'hésite pas à prendre soin de toi."
                    : "This week seems tough. Remember to take care of yourself."
                } else {
                  insight = locale === 'fr'
                    ? "Commence à capturer tes émotions pour mieux te comprendre."
                    : "Start capturing your emotions to better understand yourself."
                }

                return (
                  <>
                    <p className={`${theme.textMuted} leading-relaxed text-[15px] mb-4`}>
                      {insight}
                    </p>

                    {/* Mood pills */}
                    {sortedMoods.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {sortedMoods.slice(0, 4).map(([mood, count]) => (
                          <span
                            key={mood}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                              positiveMoods.includes(mood)
                                ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                                : isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-700'
                            }`}
                          >
                            {mood} × {count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShowMoodTrends(true)}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                          isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
                        }`}
                      >
                        <BarChart2 className="w-4 h-4" />
                        {locale === 'fr' ? 'Voir les tendances' : 'See trends'}
                      </button>
                      <button
                        onClick={() => setIsBloomOpen(true)}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                          isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {locale === 'fr' ? 'En parler' : 'Talk about it'}
                      </button>
                    </div>
                  </>
                )
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-5">
        {filteredMoments.length === 0 && moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className={`w-24 h-24 rounded-3xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mb-6`}>
              <Camera className={`w-10 h-10 ${theme.textFaint}`} />
            </div>
            <h2 className={`text-lg font-medium ${theme.text} mb-2`}>
              {locale === 'fr' ? 'Votre espace vous attend' : 'Your space awaits'}
            </h2>
            <p className={`${theme.textFaint} text-sm max-w-[260px] leading-relaxed mb-8`}>
              {locale === 'fr'
                ? 'Capturez ce qui compte. Photos, pensées, voix.'
                : 'Capture what matters. Photos, thoughts, voice.'}
            </p>
            <Link href="/moments/capture">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 rounded-2xl ${theme.accent} font-medium text-sm`}
              >
                {locale === 'fr' ? 'Commencer' : 'Get started'}
              </motion.button>
            </Link>
          </motion.div>
        ) : filteredMoments.length === 0 ? (
          /* No filter results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className={`w-16 h-16 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} flex items-center justify-center mb-4`}>
              <SlidersHorizontal className={`w-7 h-7 ${theme.textFaint}`} />
            </div>
            <p className={`${theme.textMuted} text-sm mb-4`}>
              {locale === 'fr' ? 'Aucun moment trouvé' : 'No moments found'}
            </p>
            <button
              onClick={clearFilters}
              className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'} underline`}
            >
              {locale === 'fr' ? 'Effacer les filtres' : 'Clear filters'}
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 gap-3">
            {filteredMoments.map((moment, index) => {
              const Icon = typeIcons[moment.type]
              const hasPhotoMedia = moment.media_url && moment.type === 'photo'
              const hasVideoMedia = moment.media_url && moment.type === 'video'
              const hasVoiceMedia = moment.media_url && moment.type === 'voice'
              const isTextOnly = moment.type === 'write' || (!moment.media_url && !hasPhotoMedia && !hasVideoMedia && !hasVoiceMedia)

              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedMoment(moment)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group ${theme.cardBg} border ${theme.cardBorder} p-3 flex flex-col min-h-[140px]`}
                >
                  {/* Photo thumbnail */}
                  {hasPhotoMedia && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
                      <img
                        src={moment.media_url!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Video thumbnail */}
                  {hasVideoMedia && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-gray-900">
                      <video
                        src={moment.media_url!}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Voice recording fallback */}
                  {hasVoiceMedia && (
                    <div className={`relative w-full aspect-video rounded-xl overflow-hidden mb-3 ${isDark ? 'bg-gradient-to-br from-violet-500/20 to-purple-600/20' : 'bg-gradient-to-br from-violet-100 to-purple-100'} flex items-center justify-center`}>
                      {/* Waveform visualization */}
                      <div className="flex items-center gap-1">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [8, 20 + Math.random() * 16, 8],
                            }}
                            transition={{
                              duration: 0.8 + Math.random() * 0.4,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: 'easeInOut'
                            }}
                            className={`w-1 rounded-full ${isDark ? 'bg-violet-400/60' : 'bg-violet-500/50'}`}
                            style={{ height: 12 + Math.random() * 12 }}
                          />
                        ))}
                      </div>
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-white/10' : 'bg-white/60'} backdrop-blur-sm flex items-center justify-center`}>
                          <Play className={`w-5 h-5 ${isDark ? 'text-white' : 'text-violet-600'} ml-0.5`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text-only fallback */}
                  {isTextOnly && !moment.text_content && !moment.caption && (
                    <div className={`relative w-full aspect-video rounded-xl overflow-hidden mb-3 ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'} flex items-center justify-center`}>
                      <PenLine className={`w-8 h-8 ${isDark ? 'text-amber-400/60' : 'text-amber-600/50'}`} />
                    </div>
                  )}

                  {/* Text content */}
                  {(moment.text_content || moment.caption) && (
                    <p className={`${theme.text} text-sm leading-relaxed line-clamp-3 flex-1`}>
                      {moment.text_content || moment.caption}
                    </p>
                  )}

                  {/* Bottom row: Moods and Time */}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    {moment.moods && moment.moods.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {moment.moods.slice(0, 2).map(mood => (
                          <span key={mood} className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500'}`}>
                            {mood}
                          </span>
                        ))}
                        {moment.moods.length > 2 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500'}`}>
                            +{moment.moods.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}
                    <p className={`${theme.textFaint} text-xs`}>{getTimeAgo(moment.created_at)}</p>
                  </div>

                  {/* Hover overlay */}
                  <div className={`absolute inset-0 ${isDark ? 'bg-white/5' : 'bg-black/5'} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredMoments.map((moment, index) => {
              const Icon = typeIcons[moment.type]

              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedMoment(moment)}
                  className={`flex items-center gap-4 p-3 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} ${theme.cardHover} cursor-pointer transition-all`}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                    {moment.media_url && moment.type === 'photo' ? (
                      <img src={moment.media_url} alt="" className="w-full h-full object-cover" />
                    ) : moment.media_url && moment.type === 'video' ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <video src={moment.media_url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-4 h-4 text-white ml-0.5" />
                        </div>
                      </div>
                    ) : moment.media_url && moment.type === 'voice' ? (
                      <div className={`w-full h-full ${isDark ? 'bg-gradient-to-br from-violet-500/30 to-purple-600/30' : 'bg-gradient-to-br from-violet-100 to-purple-100'} flex items-center justify-center relative`}>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-0.5 rounded-full ${isDark ? 'bg-violet-400/70' : 'bg-violet-500/60'}`}
                              style={{ height: 6 + Math.random() * 10 }}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-violet-600/70'} ml-0.5`} />
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full h-full ${isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${isDark ? 'text-amber-400/70' : 'text-amber-600/60'}`} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`${theme.text} text-sm line-clamp-1 leading-relaxed`}>
                      {moment.text_content || moment.caption || (
                        <span className={theme.textFaint}>
                          {moment.type === 'photo' && 'Photo'}
                          {moment.type === 'video' && 'Video'}
                          {moment.type === 'voice' && (locale === 'fr' ? 'Note vocale' : 'Voice note')}
                          {moment.type === 'write' && 'Note'}
                        </span>
                      )}
                    </p>
                    {moment.moods && moment.moods.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {moment.moods.slice(0, 3).map(mood => (
                          <span key={mood} className={`px-2 py-0.5 rounded-full text-[10px] capitalize ${isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500'}`}>
                            {mood}
                          </span>
                        ))}
                        {moment.moods.length > 3 && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-white/10 text-white/50' : 'bg-black/5 text-gray-500'}`}>
                            +{moment.moods.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <p className={`${theme.textFaint} text-xs mt-1`}>{getTimeAgo(moment.created_at)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bloom AI Pill */}
      <BloomPill isDark={isDark} locale={locale} onClick={() => setIsBloomOpen(true)} />

      
      {/* Bloom Chat Interface */}
      <BloomChatInterface
        isOpen={isBloomOpen}
        onClose={() => setIsBloomOpen(false)}
        isDark={isDark}
      />

      {/* Mood Trends Modal */}
      <AnimatePresence>
        {showMoodTrends && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoodTrends(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl ${isDark ? 'bg-[#1a1a1c]' : 'bg-white'} max-h-[85vh] overflow-hidden`}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className={`w-10 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <div>
                  <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {locale === 'fr' ? 'Tendances d\'humeur' : 'Mood Trends'}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    {locale === 'fr' ? 'Score de positivité quotidien' : 'Daily positivity score'}
                  </p>
                </div>
                <button
                  onClick={() => setShowMoodTrends(false)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Time Range Selector */}
              <div className="flex gap-2 px-5 mb-4">
                {(['weekly', 'monthly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTrendsTimeRange(range)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      trendsTimeRange === range
                        ? isDark ? 'bg-violet-500 text-white' : 'bg-violet-500 text-white'
                        : isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {range === 'weekly'
                      ? (locale === 'fr' ? '7 jours' : '7 days')
                      : (locale === 'fr' ? '30 jours' : '30 days')
                    }
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="px-5 pb-8">
                {(() => {
                  // Calculate mood scores per day
                  const days = trendsTimeRange === 'weekly' ? 7 : 30
                  const startDate = new Date()
                  startDate.setDate(startDate.getDate() - days + 1)
                  startDate.setHours(0, 0, 0, 0)

                  const positiveMoods = ['grateful', 'peaceful', 'joyful', 'inspired', 'loved', 'calm', 'hopeful', 'proud']

                  // Group moments by day and calculate average positivity
                  const chartData = []
                  for (let i = 0; i < days; i++) {
                    const date = new Date(startDate)
                    date.setDate(date.getDate() + i)
                    const dateStr = date.toISOString().split('T')[0]

                    const dayMoments = moments.filter(m => {
                      const mDate = new Date(m.created_at).toISOString().split('T')[0]
                      return mDate === dateStr
                    })

                    let positivityScore = 0
                    if (dayMoments.length > 0) {
                      let totalMoods = 0
                      let positiveMoodCount = 0
                      dayMoments.forEach(m => {
                        m.moods?.forEach(mood => {
                          totalMoods++
                          if (positiveMoods.includes(mood)) positiveMoodCount++
                        })
                      })
                      positivityScore = totalMoods > 0 ? Math.round((positiveMoodCount / totalMoods) * 100) : 0
                    }

                    const label = trendsTimeRange === 'weekly'
                      ? date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' })
                      : date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric' })

                    chartData.push({
                      date: dateStr,
                      label,
                      score: positivityScore,
                      moments: dayMoments.length
                    })
                  }

                  return (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 11 }}
                            interval={trendsTimeRange === 'monthly' ? 4 : 0}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontSize: 11 }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#2a2a2c' : '#fff',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            }}
                            labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 600 }}
                            formatter={(value: number, name: string) => [
                              `${value}%`,
                              locale === 'fr' ? 'Positivité' : 'Positivity'
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#8b5cf6"
                            strokeWidth={2.5}
                            dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                            activeDot={{ r: 6, fill: '#8b5cf6' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Legend */}
                <div className={`mt-4 text-center text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  {locale === 'fr'
                    ? '% d\'émotions positives par jour'
                    : '% of positive emotions per day'
                  }
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Reflection Modal - Peaceful full-screen experience */}
      <AnimatePresence>
        {reflectMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
            onClick={() => setReflectMoment(null)}
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" />

            {/* Ambient orbs */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-32 right-10 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative z-10 w-full max-w-md px-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/40 text-sm mb-8 tracking-wide"
              >
                {locale === 'fr' ? 'Un moment pour vous' : 'A moment for you'}
              </motion.p>

              {/* Media */}
              {reflectMoment.media_url && reflectMoment.type === 'photo' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img src={reflectMoment.media_url} alt="" className="w-full" />
                </motion.div>
              )}

              {reflectMoment.media_url && reflectMoment.type === 'video' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
                >
                  <video src={reflectMoment.media_url} controls playsInline className="w-full" />
                </motion.div>
              )}

              {reflectMoment.media_url && reflectMoment.type === 'voice' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <audio src={reflectMoment.media_url} controls className="w-full" />
                </motion.div>
              )}

              {/* Text content */}
              {(reflectMoment.text_content || reflectMoment.caption) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-white/90 text-lg leading-relaxed mb-6 italic"
                >
                  "{reflectMoment.text_content || reflectMoment.caption}"
                </motion.p>
              )}

              {/* Date */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-white/30 text-sm mb-8"
              >
                {formatDate(reflectMoment.created_at)}
              </motion.p>

              {/* Moods */}
              {reflectMoment.moods && reflectMoment.moods.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex flex-wrap justify-center gap-2 mb-10"
                >
                  {reflectMoment.moods.map(mood => (
                    <span
                      key={mood}
                      className="px-3 py-1.5 bg-white/10 rounded-full text-white/60 text-sm capitalize"
                    >
                      {mood}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex justify-center gap-4"
              >
                <button
                  onClick={() => setReflectMoment(null)}
                  className="px-6 py-2.5 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
                >
                  {locale === 'fr' ? 'Fermer' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    setReflectMoment(null)
                    openReflection()
                  }}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm hover:opacity-90 transition-opacity"
                >
                  {locale === 'fr' ? 'Un autre' : 'Another'}
                </button>
              </motion.div>
            </motion.div>

            {/* Close hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 text-white/20 text-xs"
            >
              {locale === 'fr' ? 'Tapez n\'importe où pour fermer' : 'Tap anywhere to close'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moment Detail Modal */}
      <AnimatePresence>
        {selectedMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-end justify-center"
            onClick={() => setSelectedMoment(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111113] rounded-t-3xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    {(() => {
                      const Icon = typeIcons[selectedMoment.type]
                      return <Icon className="w-4 h-4 text-white/70" />
                    })()}
                  </div>
                  <p className="text-white/70 text-sm">
                    {formatDate(selectedMoment.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(selectedMoment.id)}
                    disabled={deleting === selectedMoment.id}
                    className="p-2.5 text-white/30 hover:text-red-400 transition-colors rounded-xl hover:bg-white/5"
                  >
                    {deleting === selectedMoment.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedMoment(null)}
                    className="p-2.5 text-white/30 hover:text-white/60 transition-colors rounded-xl hover:bg-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                {selectedMoment.type === 'photo' && selectedMoment.media_url && (
                  <img src={selectedMoment.media_url} alt="" className="w-full" />
                )}
                {selectedMoment.type === 'video' && selectedMoment.media_url && (
                  <video src={selectedMoment.media_url} controls playsInline className="w-full" />
                )}
                {selectedMoment.type === 'voice' && selectedMoment.media_url && (
                  <div className="p-6">
                    <audio src={selectedMoment.media_url} controls className="w-full" />
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {selectedMoment.text_content && (
                    <p className="text-white/80 text-base leading-relaxed whitespace-pre-wrap">
                      {selectedMoment.text_content}
                    </p>
                  )}

                  {selectedMoment.caption && selectedMoment.type !== 'write' && (
                    <p className="text-white/50 text-sm leading-relaxed">
                      {selectedMoment.caption}
                    </p>
                  )}

                  {selectedMoment.moods && selectedMoment.moods.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-white/40 text-xs uppercase tracking-wide mb-2">
                        {locale === 'fr' ? 'Émotions' : 'Emotions'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedMoment.moods.map(mood => (
                          <span
                            key={mood}
                            className="px-3 py-1.5 bg-white/10 rounded-full text-white/80 text-sm capitalize"
                          >
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

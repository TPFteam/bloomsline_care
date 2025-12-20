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
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/context'
import { getMemberMoments, getMomentStats, deleteMoment, type Moment, type MomentType } from '@/lib/services/moments'
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
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`absolute inset-0 -z-10 rounded-full blur-2xl ${
          isDark
            ? 'bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30'
            : 'bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20'
        }`}
        style={{ transform: 'scale(1.5)' }}
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className={`w-6 h-6 ${theme.textMuted} animate-spin`} />
        </motion.div>
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
              const hasMedia = moment.media_url && (moment.type === 'photo' || moment.type === 'video')

              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedMoment(moment)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer group ${theme.cardBg} border ${theme.cardBorder} p-3 flex flex-col min-h-[140px]`}
                >
                  {/* Media thumbnail */}
                  {hasMedia && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3">
                      <img
                        src={moment.media_url!}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {moment.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </div>
                      )}
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
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className={`w-full h-full ${isDark ? 'bg-white/10' : 'bg-black/5'} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${theme.textMuted}`} />
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

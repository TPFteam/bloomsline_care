'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Circle,
  Sun,
  Moon,
  Coffee,
  Heart,
  Check,
  Eye,
  Sprout,
  StretchHorizontal,
  MapPin,
  Music,
  Cloud,
  RefreshCw,
  List,
  Gift,
  Hand,
  Stars,
  CalendarHeart,
  Sofa,
  Mail,
  Smile,
  Shield,
  Clock,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Laugh,
  SmilePlus,
  Meh,
  Frown,
  Angry,
  Plus,
  Minus,
  History,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'eye': Eye,
  'coffee': Coffee,
  'sprout': Sprout,
  'stretch-horizontal': StretchHorizontal,
  'sun': Sun,
  'map-pin': MapPin,
  'music': Music,
  'cloud': Cloud,
  'refresh-cw': RefreshCw,
  'heart': Heart,
  'list': List,
  'gift': Gift,
  'moon': Moon,
  'hand': Hand,
  'stars': Stars,
  'calendar-heart': CalendarHeart,
  'sofa': Sofa,
  'mail': Mail,
  'smile': Smile,
  'shield': Shield,
}

type RitualCategory = 'morning' | 'midday' | 'evening' | 'selfcare'
type FilterType = 'day' | 'category' | 'all' | 'changes'

interface Ritual {
  id: string
  name: string
  name_fr: string
  description: string | null
  description_fr: string | null
  category: RitualCategory
  icon: string | null
  duration_suggestion: number | null
}

interface RitualCompletion {
  id: string
  ritual_id: string
  completion_date: string
  completed: boolean
  duration_minutes: number | null
  notes: string | null
  mood: string | null
  created_at: string
  ritual: Ritual
}

interface MemberRitualHistory {
  id: string
  ritual_id: string
  added_at: string | null
  removed_at: string | null
  is_active: boolean
  ritual: Ritual | null
}

// Mood options for display
const moodOptions = [
  { value: 'great', icon: Laugh, label: 'Great', labelFr: 'Super', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  { value: 'good', icon: SmilePlus, label: 'Good', labelFr: 'Bien', color: 'text-green-500', bg: 'bg-green-100' },
  { value: 'okay', icon: Meh, label: 'Okay', labelFr: 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { value: 'low', icon: Frown, label: 'Low', labelFr: 'Bas', color: 'text-orange-500', bg: 'bg-orange-100' },
  { value: 'difficult', icon: Angry, label: 'Difficult', labelFr: 'Difficile', color: 'text-red-500', bg: 'bg-red-100' },
]

const ritualCategories = [
  { id: 'morning' as RitualCategory, titleEn: 'Morning', titleFr: 'Matin', color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'midday' as RitualCategory, titleEn: 'Midday', titleFr: 'Midi', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'evening' as RitualCategory, titleEn: 'Evening', titleFr: 'Soir', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'selfcare' as RitualCategory, titleEn: 'Self-Care', titleFr: 'Bien-être', color: 'text-rose-600', bg: 'bg-rose-50' },
]

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function RitualHistoryPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<RitualCompletion[]>([])
  const [ritualHistory, setRitualHistory] = useState<MemberRitualHistory[]>([])
  const [historyFilter, setHistoryFilter] = useState<FilterType>('day')
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [selectedCategory, setSelectedCategory] = useState<RitualCategory | 'all'>('all')

  const todayStr = getTodayStr()

  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      // Fetch completions and member ritual history in parallel
      const [completionsResult, memberRitualsResult] = await Promise.all([
        supabase
          .from('ritual_completions')
          .select(`
            *,
            ritual:rituals(*)
          `)
          .eq('member_id', member.id)
          .order('completion_date', { ascending: false })
          .limit(200),
        supabase
          .from('member_rituals')
          .select('id, ritual_id, added_at, removed_at, is_active, ritual:rituals(*)')
          .eq('member_id', member.id)
      ])

      if (completionsResult.data) {
        setHistory(completionsResult.data as RitualCompletion[])
      }
      if (memberRitualsResult.data) {
        // Transform data - Supabase returns ritual as array, we need single object
        const transformed = memberRitualsResult.data.map((mr: { id: string; ritual_id: string; added_at: string | null; removed_at: string | null; is_active: boolean; ritual: Ritual[] | Ritual | null }) => ({
          ...mr,
          ritual: Array.isArray(mr.ritual) ? mr.ritual[0] || null : mr.ritual
        }))
        setRitualHistory(transformed as MemberRitualHistory[])
      }
      setLoading(false)
    }

    fetchHistory()
  }, [router])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === todayStr) {
      return locale === 'fr' ? "Aujourd'hui" : 'Today'
    }
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
    if (dateStr === yesterdayStr) {
      return locale === 'fr' ? 'Hier' : 'Yesterday'
    }

    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    if (dateStr === todayStr) {
      return locale === 'fr' ? "Auj." : 'Today'
    }
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getFilteredHistory = () => {
    let filtered = history

    if (historyFilter === 'day') {
      filtered = filtered.filter(h => h.completion_date === selectedDate)
    } else if (historyFilter === 'category' && selectedCategory !== 'all') {
      filtered = filtered.filter(h => h.ritual?.category === selectedCategory)
    }

    return filtered
  }

  const getUniqueDates = () => {
    const dates = [...new Set(history.map(h => h.completion_date))]
    return dates.sort((a, b) => b.localeCompare(a))
  }

  const getGroupedHistory = () => {
    const grouped: Record<string, RitualCompletion[]> = {}
    history.forEach(h => {
      if (!grouped[h.completion_date]) {
        grouped[h.completion_date] = []
      }
      grouped[h.completion_date].push(h)
    })
    return grouped
  }

  // Get all rituals that were active on a specific date
  const getActiveRitualsForDate = (dateStr: string) => {
    const targetDate = new Date(dateStr + 'T23:59:59') // End of day for comparison

    return ritualHistory.filter(mr => {
      // If no added_at, assume it was always there
      const addedAt = mr.added_at ? new Date(mr.added_at) : new Date(0)
      const addedDate = new Date(addedAt.toISOString().split('T')[0] + 'T00:00:00')

      // Was it added before or on this date?
      if (addedDate > targetDate) return false

      // If not removed, it's still active
      if (!mr.removed_at) return true

      // Was it removed after this date?
      const removedAt = new Date(mr.removed_at)
      const removedDate = new Date(removedAt.toISOString().split('T')[0] + 'T00:00:00')
      return removedDate > targetDate
    })
  }

  // Calculate how many rituals the user had on a specific date
  const getRitualCountForDate = (dateStr: string) => {
    return getActiveRitualsForDate(dateStr).length
  }

  // Get rituals with completion status for a date
  const getRitualsWithStatusForDate = (dateStr: string) => {
    const activeRituals = getActiveRitualsForDate(dateStr)
    const completionsForDate = history.filter(h => h.completion_date === dateStr)
    const completedRitualIds = new Set(completionsForDate.map(c => c.ritual_id))

    return activeRituals.map(mr => ({
      memberRitual: mr,
      completed: completedRitualIds.has(mr.ritual_id),
      completion: completionsForDate.find(c => c.ritual_id === mr.ritual_id) || null
    }))
  }

  // Get changes timeline (additions and removals)
  const getChangesTimeline = () => {
    const changes: { type: 'added' | 'removed', date: string, ritual: MemberRitualHistory }[] = []

    ritualHistory.forEach(mr => {
      if (mr.added_at) {
        changes.push({
          type: 'added',
          date: new Date(mr.added_at).toISOString().split('T')[0],
          ritual: mr
        })
      }
      if (mr.removed_at) {
        changes.push({
          type: 'removed',
          date: new Date(mr.removed_at).toISOString().split('T')[0],
          ritual: mr
        })
      }
    })

    // Sort by date descending (most recent first)
    return changes.sort((a, b) => b.date.localeCompare(a.date))
  }

  // Group changes by date
  const getGroupedChanges = () => {
    const changes = getChangesTimeline()
    const grouped: Record<string, typeof changes> = {}

    changes.forEach(change => {
      if (!grouped[change.date]) {
        grouped[change.date] = []
      }
      grouped[change.date].push(change)
    })

    return grouped
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const dates = getUniqueDates()
    const currentIndex = dates.indexOf(selectedDate)
    if (direction === 'prev' && currentIndex < dates.length - 1) {
      setSelectedDate(dates[currentIndex + 1])
    } else if (direction === 'next' && currentIndex > 0) {
      setSelectedDate(dates[currentIndex - 1])
    }
  }

  const getCategoryIcon = (category: RitualCategory) => {
    switch (category) {
      case 'morning': return Sun
      case 'midday': return Coffee
      case 'evening': return Moon
      case 'selfcare': return Heart
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/rituals')}
            className="flex items-center gap-1 text-gray-400 mb-4 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">{locale === 'fr' ? 'Rituels' : 'Rituals'}</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {historyFilter === 'changes'
                  ? (locale === 'fr' ? 'Changements' : 'Changes')
                  : (locale === 'fr' ? 'Historique' : 'History')
                }
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {historyFilter === 'changes'
                  ? `${getChangesTimeline().length} ${locale === 'fr' ? 'changements' : 'changes'}`
                  : `${history.length} ${locale === 'fr' ? 'rituels complétés' : 'rituals completed'}`
                }
              </p>
            </div>
            <button
              onClick={() => setHistoryFilter(historyFilter === 'changes' ? 'day' : 'changes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                historyFilter === 'changes'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
              {historyFilter === 'changes'
                ? (locale === 'fr' ? 'Retour' : 'Back')
                : (locale === 'fr' ? 'Changements' : 'Changes')
              }
            </button>
          </div>
        </motion.div>

        {/* Filter Tabs - hide when viewing changes */}
        {historyFilter !== 'changes' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              {[
                { id: 'day' as FilterType, labelEn: 'By Day', labelFr: 'Par jour' },
                { id: 'category' as FilterType, labelEn: 'By Theme', labelFr: 'Par thème' },
                { id: 'all' as FilterType, labelEn: 'All', labelFr: 'Tout' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryFilter(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    historyFilter === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {locale === 'fr' ? tab.labelFr : tab.labelEn}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Date Navigator (for day filter) */}
        {historyFilter === 'day' && getUniqueDates().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-3">
              <button
                onClick={() => navigateDate('prev')}
                disabled={getUniqueDates().indexOf(selectedDate) === getUniqueDates().length - 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-center">
                <p className="font-medium text-gray-900">{formatDate(selectedDate)}</p>
                <p className="text-xs text-gray-400">
                  {getFilteredHistory().length} / {getRitualCountForDate(selectedDate)} {locale === 'fr' ? 'complétés' : 'completed'}
                </p>
              </div>
              <button
                onClick={() => navigateDate('next')}
                disabled={getUniqueDates().indexOf(selectedDate) === 0}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Category Filter (for category filter) */}
        {historyFilter === 'category' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {locale === 'fr' ? 'Tous' : 'All'}
              </button>
              {ritualCategories.map((cat) => {
                const Icon = getCategoryIcon(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? `${cat.bg} ${cat.color}`
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {locale === 'fr' ? cat.titleFr : cat.titleEn}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">
                {locale === 'fr' ? 'Pas encore d\'historique' : 'No history yet'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {locale === 'fr'
                  ? 'Complétez des rituels pour voir votre parcours'
                  : 'Complete rituals to see your journey'}
              </p>
              <button
                onClick={() => router.push('/rituals')}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {locale === 'fr' ? 'Commencer' : 'Get started'}
              </button>
            </div>
          ) : historyFilter === 'changes' ? (
            // Changes timeline view
            <div className="space-y-6">
              {Object.keys(getGroupedChanges()).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <History className="w-7 h-7 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    {locale === 'fr' ? 'Aucun changement' : 'No changes yet'}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {locale === 'fr' ? 'Les ajouts et retraits apparaîtront ici' : 'Additions and removals will appear here'}
                  </p>
                </div>
              ) : (
                Object.entries(getGroupedChanges()).map(([date, changes], groupIndex) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(date)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {changes.length} {locale === 'fr' ? 'changement(s)' : 'change(s)'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {changes.map((change, index) => {
                        const category = ritualCategories.find(c => c.id === change.ritual.ritual?.category)
                        const RitualIcon = change.ritual.ritual?.icon ? iconMap[change.ritual.ritual.icon] || Circle : Circle
                        const ritualName = locale === 'fr'
                          ? change.ritual.ritual?.name_fr || 'Rituel inconnu'
                          : change.ritual.ritual?.name || 'Unknown ritual'

                        return (
                          <motion.div
                            key={`${change.type}-${change.ritual.id}-${index}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.03 + index * 0.02 }}
                            className="bg-white rounded-xl p-4 border border-gray-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                change.type === 'added' ? 'bg-emerald-100' : 'bg-red-100'
                              }`}>
                                {change.type === 'added' ? (
                                  <Plus className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Minus className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900">{ritualName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    change.type === 'added'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : 'bg-red-50 text-red-600'
                                  }`}>
                                    {change.type === 'added'
                                      ? (locale === 'fr' ? 'Ajouté' : 'Added')
                                      : (locale === 'fr' ? 'Retiré' : 'Removed')
                                    }
                                  </span>
                                  {category && (
                                    <span className={`text-xs ${category.color}`}>
                                      {locale === 'fr' ? category.titleFr : category.titleEn}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${category?.bg || 'bg-gray-100'}`}>
                                <RitualIcon className={`w-4 h-4 ${category?.color || 'text-gray-500'}`} />
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : historyFilter === 'all' ? (
            // Grouped by date view
            <div className="space-y-6">
              {Object.entries(getGroupedHistory()).map(([date, completions], groupIndex) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(date)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {completions.length} / {getRitualCountForDate(date)} {locale === 'fr' ? 'complétés' : 'completed'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completions.map((completion, index) => (
                      <CompletionCard
                        key={completion.id}
                        completion={completion}
                        locale={locale}
                        delay={groupIndex * 0.03 + index * 0.02}
                        showDate={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : historyFilter === 'day' ? (
            // Day view - show all rituals with completion status
            (() => {
              const ritualsWithStatus = getRitualsWithStatusForDate(selectedDate)
              if (ritualsWithStatus.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      {locale === 'fr' ? 'Aucun rituel ce jour' : 'No rituals this day'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {locale === 'fr' ? 'Naviguez vers une autre date' : 'Navigate to another date'}
                    </p>
                  </div>
                )
              }
              return (
                <div className="space-y-2">
                  {ritualsWithStatus.map((item, index) => {
                    const ritual = item.memberRitual.ritual
                    const category = ritualCategories.find(c => c.id === ritual?.category)
                    const RitualIcon = ritual?.icon ? iconMap[ritual.icon] || Circle : Circle
                    const moodConfig = item.completion?.mood ? moodOptions.find(m => m.value === item.completion?.mood) : null

                    return (
                      <motion.div
                        key={item.memberRitual.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`bg-white rounded-xl p-4 border ${item.completed ? 'border-gray-100' : 'border-gray-200 border-dashed'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.completed ? (category?.bg || 'bg-gray-100') : 'bg-gray-50'
                          }`}>
                            <RitualIcon className={`w-5 h-5 ${item.completed ? (category?.color || 'text-gray-500') : 'text-gray-300'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                              {locale === 'fr'
                                ? ritual?.name_fr || 'Rituel inconnu'
                                : ritual?.name || 'Unknown ritual'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {item.completed ? (
                                <>
                                  {moodConfig && (() => {
                                    const MoodIcon = moodConfig.icon
                                    return (
                                      <span className={`text-xs ${moodConfig.bg} ${moodConfig.color} px-2 py-0.5 rounded-full flex items-center gap-1`}>
                                        <MoodIcon className="w-3 h-3" />
                                        {locale === 'fr' ? moodConfig.labelFr : moodConfig.label}
                                      </span>
                                    )
                                  })()}
                                  {item.completion?.duration_minutes && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {item.completion.duration_minutes}m
                                    </span>
                                  )}
                                  {item.completion?.created_at && (
                                    <span className="text-xs text-gray-400">
                                      {new Date(item.completion.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: locale !== 'fr'
                                      })}
                                    </span>
                                  )}
                                  {category && (
                                    <span className={`text-xs ${category.color}`}>
                                      {locale === 'fr' ? category.titleFr : category.titleEn}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  {locale === 'fr' ? 'Non complété' : 'Not completed'}
                                </span>
                              )}
                            </div>
                            {item.completion?.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5 italic">
                                "{item.completion.notes}"
                              </p>
                            )}
                          </div>
                          {item.completed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-emerald-600" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Circle className="w-3 h-3 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )
            })()
          ) : getFilteredHistory().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">
                {locale === 'fr' ? 'Aucun rituel' : 'No rituals'}
              </p>
              <p className="text-gray-400 text-sm">
                {locale === 'fr' ? 'Essayez un autre thème' : 'Try another theme'}
              </p>
            </div>
          ) : (
            // Category filtered view
            <div className="space-y-2">
              {getFilteredHistory().map((completion, index) => (
                <CompletionCard
                  key={completion.id}
                  completion={completion}
                  locale={locale}
                  delay={index * 0.02}
                  showDate={true}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </MemberLayout>
  )
}

// Completion Card Component
function CompletionCard({
  completion,
  locale,
  delay,
  showDate
}: {
  completion: RitualCompletion
  locale: string
  delay: number
  showDate: boolean
}) {
  const category = ritualCategories.find(c => c.id === completion.ritual?.category)
  const RitualIcon = completion.ritual?.icon ? iconMap[completion.ritual.icon] || Circle : Circle

  const formatCardDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-xl p-4 border border-gray-100"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${category?.bg || 'bg-gray-100'}`}>
          <RitualIcon className={`w-5 h-5 ${category?.color || 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">
            {locale === 'fr'
              ? completion.ritual?.name_fr || 'Rituel supprimé'
              : completion.ritual?.name || 'Deleted ritual'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Mood badge */}
            {completion.mood && (() => {
              const moodConfig = moodOptions.find(m => m.value === completion.mood)
              if (!moodConfig) return null
              const MoodIcon = moodConfig.icon
              return (
                <span className={`text-xs ${moodConfig.bg} ${moodConfig.color} px-2 py-0.5 rounded-full flex items-center gap-1`}>
                  <MoodIcon className="w-3 h-3" />
                  {locale === 'fr' ? moodConfig.labelFr : moodConfig.label}
                </span>
              )
            })()}
            {showDate && (
              <span className="text-xs text-gray-400">
                {formatCardDate(completion.completion_date)}
              </span>
            )}
            {completion.duration_minutes && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {completion.duration_minutes}m
              </span>
            )}
            {completion.created_at && (
              <span className="text-xs text-gray-400">
                {new Date(completion.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: locale !== 'fr'
                })}
              </span>
            )}
            {category && !showDate && (
              <span className={`text-xs ${category.color}`}>
                {locale === 'fr' ? category.titleFr : category.titleEn}
              </span>
            )}
          </div>
          {completion.notes && (
            <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2.5 italic">
              "{completion.notes}"
            </p>
          )}
        </div>
        {completion.completed && (
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-emerald-600" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

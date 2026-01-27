'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Plus,
  X,
  Sparkles,
  Sprout,
  Leaf,
  Circle,
  Droplet,
  Dumbbell,
  BookOpen,
  Brain,
  Cigarette,
  Wine,
  Coffee,
  Cookie,
  Bed,
  Apple,
  Smartphone,
  Tv,
  Footprints,
  Candy,
  Users,
  Heart,
  Trash2,
  PenLine,
  TreePine,
  Palette,
  Wind,
  Salad,
  Music,
  Pizza,
  Gamepad2,
  CreditCard,
  MessageSquare,
  Timer,
  ShoppingBag,
  BedDouble,
  StretchHorizontal,
  TrendingUp,
  History,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Info,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import { FeatureGuide } from '@/components/feature-guide/FeatureGuide'
import { seedsGuideSteps } from '@/components/feature-guide/guides/seeds-guide'
import { useFeatureGuide } from '@/lib/hooks/useFeatureGuide'

// Anchor types
interface Anchor {
  id: string
  icon: string
  labelEn: string
  labelFr: string
  type: 'grow' | 'letgo'
}

// Activity log types
interface ActivityLog {
  id: string
  anchorId: string
  action: 'added' | 'removed' | 'reactivated'
  anchorType: 'grow' | 'letgo'
  anchorIcon: string
  anchorLabelEn: string
  anchorLabelFr: string
  createdAt: string
}

// All anchor icons (used for custom anchors and icon lookup)
const ANCHOR_ICONS: Record<string, { icon: React.ElementType; labelEn: string; labelFr: string }> = {
  // GROW icons - positive habits to cultivate
  droplet: { icon: Droplet, labelEn: 'Water', labelFr: 'Eau' },
  dumbbell: { icon: Dumbbell, labelEn: 'Exercise', labelFr: 'Exercice' },
  book: { icon: BookOpen, labelEn: 'Reading', labelFr: 'Lecture' },
  brain: { icon: Brain, labelEn: 'Learning', labelFr: 'Apprentissage' },
  bed: { icon: Bed, labelEn: 'Sleep', labelFr: 'Sommeil' },
  apple: { icon: Apple, labelEn: 'Healthy Eating', labelFr: 'Manger sainement' },
  meditation: { icon: Circle, labelEn: 'Meditation', labelFr: 'Méditation' },
  walk: { icon: Footprints, labelEn: 'Walking', labelFr: 'Marche' },
  social: { icon: Users, labelEn: 'Social', labelFr: 'Social' },
  heart: { icon: Heart, labelEn: 'Self-care', labelFr: 'Bien-être' },
  sprout: { icon: Sprout, labelEn: 'Growth', labelFr: 'Croissance' },
  journal: { icon: PenLine, labelEn: 'Journaling', labelFr: 'Journal' },
  gratitude: { icon: Sparkles, labelEn: 'Gratitude', labelFr: 'Gratitude' },
  nature: { icon: TreePine, labelEn: 'Nature', labelFr: 'Nature' },
  creativity: { icon: Palette, labelEn: 'Creativity', labelFr: 'Créativité' },
  breathing: { icon: Wind, labelEn: 'Breathing', labelFr: 'Respiration' },
  stretch: { icon: StretchHorizontal, labelEn: 'Stretching', labelFr: 'Étirements' },
  vegetables: { icon: Salad, labelEn: 'Vegetables', labelFr: 'Légumes' },
  music: { icon: Music, labelEn: 'Music', labelFr: 'Musique' },

  // LETGO icons - habits to reduce/stop
  cigarette: { icon: Cigarette, labelEn: 'Smoking', labelFr: 'Tabac' },
  wine: { icon: Wine, labelEn: 'Alcohol', labelFr: 'Alcool' },
  coffee: { icon: Coffee, labelEn: 'Caffeine', labelFr: 'Caféine' },
  cookie: { icon: Cookie, labelEn: 'Snacking', labelFr: 'Grignotage' },
  smartphone: { icon: Smartphone, labelEn: 'Screen Time', labelFr: 'Écrans' },
  tv: { icon: Tv, labelEn: 'TV', labelFr: 'Télé' },
  candy: { icon: Candy, labelEn: 'Sugar', labelFr: 'Sucre' },
  junkfood: { icon: Pizza, labelEn: 'Junk Food', labelFr: 'Malbouffe' },
  gaming: { icon: Gamepad2, labelEn: 'Gaming', labelFr: 'Jeux vidéo' },
  spending: { icon: CreditCard, labelEn: 'Spending', labelFr: 'Dépenses' },
  socialmedia: { icon: MessageSquare, labelEn: 'Social Media', labelFr: 'Réseaux sociaux' },
  procrastination: { icon: Timer, labelEn: 'Procrastination', labelFr: 'Procrastination' },
  shopping: { icon: ShoppingBag, labelEn: 'Shopping', labelFr: 'Achats' },
  latenights: { icon: BedDouble, labelEn: 'Late Nights', labelFr: 'Coucher tard' },
}

// Grow options - habits to cultivate/increase
const GROW_ANCHOR_OPTIONS = [
  'droplet',      // Water/Hydration
  'dumbbell',     // Exercise
  'book',         // Reading
  'brain',        // Learning
  'bed',          // Better Sleep
  'apple',        // Healthy Eating
  'meditation',   // Meditation
  'walk',         // Walking
  'social',       // Social connections
  'heart',        // Self-care
  'sprout',       // Personal Growth
  'journal',      // Journaling
  'gratitude',    // Gratitude practice
  'nature',       // Time in nature
  'creativity',   // Creative activities
  'breathing',    // Breathing exercises
  'stretch',      // Stretching/Yoga
  'vegetables',   // Eating vegetables
  'music',        // Playing/listening music
]

// Let Go options - habits to reduce/stop
const LETGO_ANCHOR_OPTIONS = [
  'cigarette',      // Smoking
  'wine',           // Alcohol
  'coffee',         // Caffeine
  'cookie',         // Snacking
  'smartphone',     // Screen time
  'tv',             // TV watching
  'candy',          // Sugar
  'junkfood',       // Junk/Fast food
  'gaming',         // Gaming
  'spending',       // Impulse spending
  'socialmedia',    // Social media
  'procrastination', // Procrastination
  'shopping',       // Impulse shopping
  'latenights',     // Late nights
]

export default function SeedsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const supabase = createClient()

  // Feature guide
  const { showGuide, completeGuide, skipGuide, setShowGuide } = useFeatureGuide('seeds')

  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [userAnchors, setUserAnchors] = useState<Anchor[]>([])
  const [anchorLogs, setAnchorLogs] = useState<Record<string, number[]>>({})
  const [anchorHistory, setAnchorHistory] = useState<Record<string, Record<string, number>>>({})
  const [showAddAnchor, setShowAddAnchor] = useState(false)
  const [addAnchorType, setAddAnchorType] = useState<'grow' | 'letgo'>('grow')
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'trends' | 'history'>('day')
  const [selectedTrendAnchor, setSelectedTrendAnchor] = useState<string | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]) // Current selected day for Day view
  const [editMode, setEditMode] = useState(false) // Toggle to show/hide delete buttons
  const [trendsRange, setTrendsRange] = useState<7 | 30 | 90 | 180>(7) // Trends time range filter

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      // Get member ID
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) {
        setLoading(false)
        return
      }

      setMemberId(member.id)
      await loadAnchorsData(member.id)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnchorsData = async (memId: string) => {
    const today = new Date().toISOString().split('T')[0]

    // Load anchors
    const { data: anchorsData } = await supabase
      .from('member_anchors')
      .select('*')
      .eq('member_id', memId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (anchorsData) {
      setUserAnchors(anchorsData.map(a => ({
        id: a.id,
        icon: a.icon,
        labelEn: a.label_en,
        labelFr: a.label_fr,
        type: a.type as 'grow' | 'letgo',
      })))
    }

    // Load today's logs
    const { data: logsData } = await supabase
      .from('anchor_logs')
      .select('anchor_id, logged_at')
      .eq('member_id', memId)
      .eq('log_date', today)

    if (logsData) {
      const logsMap: Record<string, number[]> = {}
      logsData.forEach(log => {
        if (!logsMap[log.anchor_id]) {
          logsMap[log.anchor_id] = []
        }
        logsMap[log.anchor_id].push(new Date(log.logged_at).getTime())
      })
      setAnchorLogs(logsMap)
    }

    // Load last 180 days of history (max range for trends)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)
    const startDate = sixMonthsAgo.toISOString().split('T')[0]

    const { data: historyData } = await supabase
      .from('anchor_logs')
      .select('anchor_id, log_date')
      .eq('member_id', memId)
      .gte('log_date', startDate)

    if (historyData) {
      const historyMap: Record<string, Record<string, number>> = {}
      historyData.forEach(log => {
        if (!historyMap[log.anchor_id]) {
          historyMap[log.anchor_id] = {}
        }
        if (!historyMap[log.anchor_id][log.log_date]) {
          historyMap[log.anchor_id][log.log_date] = 0
        }
        historyMap[log.anchor_id][log.log_date]++
      })
      setAnchorHistory(historyMap)
    }

    // Load activity logs (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activityData } = await supabase
      .from('anchor_activity_logs')
      .select('*')
      .eq('member_id', memId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (activityData) {
      setActivityLogs(activityData.map(log => ({
        id: log.id,
        anchorId: log.anchor_id,
        action: log.action as 'added' | 'removed' | 'reactivated',
        anchorType: log.anchor_type as 'grow' | 'letgo',
        anchorIcon: log.anchor_icon,
        anchorLabelEn: log.anchor_label_en,
        anchorLabelFr: log.anchor_label_fr,
        createdAt: log.created_at,
      })))
    }
  }

  const logAnchor = async (anchorId: string) => {
    if (!memberId) return

    const { error } = await supabase
      .from('anchor_logs')
      .insert({
        member_id: memberId,
        anchor_id: anchorId,
      })

    if (error) {
      console.error('Error logging anchor:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
      return
    }

    const now = Date.now()
    setAnchorLogs(prev => ({
      ...prev,
      [anchorId]: [...(prev[anchorId] || []), now]
    }))

    // Update history for today
    const today = new Date().toISOString().split('T')[0]
    setAnchorHistory(prev => ({
      ...prev,
      [anchorId]: {
        ...(prev[anchorId] || {}),
        [today]: (prev[anchorId]?.[today] || 0) + 1
      }
    }))

    toast.success(locale === 'fr' ? 'Enregistré!' : 'Logged!', { duration: 1500 })
  }

  const addAnchor = async (iconKey: string) => {
    if (!memberId) return

    const iconData = ANCHOR_ICONS[iconKey]
    if (!iconData) return

    const { data, error } = await supabase
      .from('member_anchors')
      .insert({
        member_id: memberId,
        icon: iconKey,
        label_en: iconData.labelEn,
        label_fr: iconData.labelFr,
        type: addAnchorType,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding anchor:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
      return
    }

    if (data) {
      setUserAnchors(prev => [...prev, {
        id: data.id,
        icon: data.icon,
        labelEn: data.label_en,
        labelFr: data.label_fr,
        type: data.type as 'grow' | 'letgo',
      }])

      // Log the activity
      const { data: activityLog } = await supabase
        .from('anchor_activity_logs')
        .insert({
          member_id: memberId,
          anchor_id: data.id,
          action: 'added',
          anchor_type: data.type,
          anchor_icon: data.icon,
          anchor_label_en: data.label_en,
          anchor_label_fr: data.label_fr,
        })
        .select()
        .single()

      if (activityLog) {
        setActivityLogs(prev => [{
          id: activityLog.id,
          anchorId: activityLog.anchor_id,
          action: 'added',
          anchorType: data.type as 'grow' | 'letgo',
          anchorIcon: data.icon,
          anchorLabelEn: data.label_en,
          anchorLabelFr: data.label_fr,
          createdAt: activityLog.created_at,
        }, ...prev])
      }
    }

    setShowAddAnchor(false)
    toast.success(locale === 'fr' ? 'Ajouté!' : 'Added!', { duration: 1500 })
  }

  const removeAnchor = async (anchorId: string) => {
    // Find the anchor before removing
    const anchor = userAnchors.find(a => a.id === anchorId)
    if (!anchor || !memberId) return

    const { error } = await supabase
      .from('member_anchors')
      .update({ is_active: false })
      .eq('id', anchorId)

    if (error) {
      console.error('Error removing anchor:', error)
      toast.error(locale === 'fr' ? 'Erreur' : 'Error')
      return
    }

    // Log the activity
    const { data: activityLog } = await supabase
      .from('anchor_activity_logs')
      .insert({
        member_id: memberId,
        anchor_id: anchorId,
        action: 'removed',
        anchor_type: anchor.type,
        anchor_icon: anchor.icon,
        anchor_label_en: anchor.labelEn,
        anchor_label_fr: anchor.labelFr,
      })
      .select()
      .single()

    if (activityLog) {
      setActivityLogs(prev => [{
        id: activityLog.id,
        anchorId: anchorId,
        action: 'removed',
        anchorType: anchor.type,
        anchorIcon: anchor.icon,
        anchorLabelEn: anchor.labelEn,
        anchorLabelFr: anchor.labelFr,
        createdAt: activityLog.created_at,
      }, ...prev])
    }

    setUserAnchors(prev => prev.filter(a => a.id !== anchorId))
    toast.success(locale === 'fr' ? 'Supprimé' : 'Removed', { duration: 1500 })
  }

  const getTodayCount = (anchorId: string) => {
    return anchorLogs[anchorId]?.length || 0
  }

  const getCountForDate = (anchorId: string, date: string) => {
    return anchorHistory[anchorId]?.[date] || 0
  }

  const getLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: i === 0,
      })
    }
    return days
  }

  const getAnchorCountForDate = (anchorId: string, date: string) => {
    return anchorHistory[anchorId]?.[date] || 0
  }

  const getAnchorStreak = (anchorId: string) => {
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      if (getAnchorCountForDate(anchorId, dateStr) > 0) {
        streak++
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  // Get days for a given range
  const getDaysForRange = (range: number) => {
    const days = []
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        monthName: date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' }),
        isToday: i === 0,
      })
    }
    return days
  }

  // Compute chart data for trends
  const getTrendsData = () => {
    const days = getDaysForRange(trendsRange)

    // For longer ranges, we might want to aggregate by week or show fewer points
    const shouldAggregate = trendsRange > 30

    if (shouldAggregate) {
      // Group by week for 3 months and 6 months
      const weeks: { name: string; date: string; grow: number; letgo: number; value?: number }[] = []
      let weekGrow = 0
      let weekLetgo = 0
      let weekValue = 0
      let weekStart = ''

      days.forEach((day, index) => {
        if (index % 7 === 0) {
          if (weekStart) {
            weeks.push({
              name: weekStart,
              date: weekStart,
              grow: weekGrow,
              letgo: weekLetgo,
              value: weekValue,
            })
          }
          weekStart = `${day.monthName} ${day.dayNum}`
          weekGrow = 0
          weekLetgo = 0
          weekValue = 0
        }

        if (selectedTrendAnchor) {
          weekValue += getAnchorCountForDate(selectedTrendAnchor, day.date)
        } else {
          userAnchors.forEach(anchor => {
            const count = getAnchorCountForDate(anchor.id, day.date)
            if (anchor.type === 'grow') {
              weekGrow += count
            } else {
              weekLetgo += count
            }
          })
        }
      })

      // Add last partial week
      if (weekStart) {
        weeks.push({
          name: weekStart,
          date: weekStart,
          grow: weekGrow,
          letgo: weekLetgo,
          value: weekValue,
        })
      }

      return weeks
    }

    if (selectedTrendAnchor) {
      // Single anchor view
      const anchor = userAnchors.find(a => a.id === selectedTrendAnchor)
      if (!anchor) return []

      return days.map(day => ({
        name: trendsRange <= 7 ? day.dayName : `${day.monthName} ${day.dayNum}`,
        date: day.date,
        value: getAnchorCountForDate(selectedTrendAnchor, day.date),
      }))
    }

    // Collective view - Grow vs Let Go totals
    return days.map(day => {
      let growTotal = 0
      let letgoTotal = 0

      userAnchors.forEach(anchor => {
        const count = getAnchorCountForDate(anchor.id, day.date)
        if (anchor.type === 'grow') {
          growTotal += count
        } else {
          letgoTotal += count
        }
      })

      return {
        name: trendsRange <= 7 ? day.dayName : `${day.monthName} ${day.dayNum}`,
        date: day.date,
        grow: growTotal,
        letgo: letgoTotal,
      }
    })
  }

  const growAnchors = userAnchors.filter(a => a.type === 'grow')
  const letgoAnchors = userAnchors.filter(a => a.type === 'letgo')

  if (loading) {
    return (
      <MemberLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      {/* Feature Guide - shows on first visit */}
      {showGuide && (
        <FeatureGuide
          featureName="seeds"
          steps={seedsGuideSteps}
          onComplete={completeGuide}
          onSkip={skipGuide}
        />
      )}

      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {locale === 'fr' ? 'Graines du Jour' : 'Daily Seeds'}
              </h1>
              <p className="text-sm text-gray-500">
                {locale === 'fr' ? 'Plantez et cultivez vos habitudes' : 'Plant and nurture your habits'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Help/Guide button */}
            <button
              onClick={() => setShowGuide(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              title={locale === 'fr' ? 'Comment ça marche' : 'How it works'}
            >
              <Info className="w-5 h-5" />
            </button>
            {/* History button */}
            <button
              onClick={() => setActiveTab(activeTab === 'history' ? 'day' : 'history')}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('day')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'day'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {locale === 'fr' ? 'Jour' : 'Day'}
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'week'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {locale === 'fr' ? '7 jours' : '7 Days'}
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trends'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            {locale === 'fr' ? 'Tendances' : 'Trends'}
          </button>
        </div>

        {activeTab === 'history' ? (
          /* History View */
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {locale === 'fr' ? 'Activité récente (30 jours)' : 'Recent Activity (30 days)'}
            </h3>

            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map(log => {
                  const iconData = ANCHOR_ICONS[log.anchorIcon]
                  const IconComponent = iconData?.icon || Circle
                  const isGrow = log.anchorType === 'grow'
                  const date = new Date(log.createdAt)
                  const formattedDate = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                  const formattedTime = date.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <div
                      key={log.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl ${
                        isGrow ? 'bg-emerald-50' : 'bg-rose-50'
                      }`}
                    >
                      {/* Action Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.action === 'added'
                          ? 'bg-green-100 text-green-600'
                          : log.action === 'removed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-100 text-blue-600'
                      }`}>
                        {log.action === 'added' && <PlusCircle className="w-5 h-5" />}
                        {log.action === 'removed' && <MinusCircle className="w-5 h-5" />}
                        {log.action === 'reactivated' && <RefreshCw className="w-5 h-5" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${isGrow ? 'text-emerald-600' : 'text-rose-600'}`} />
                          <span className="font-medium text-gray-900">
                            {locale === 'fr' ? log.anchorLabelFr : log.anchorLabelEn}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isGrow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {isGrow
                              ? (locale === 'fr' ? 'Garder' : 'Grow')
                              : (locale === 'fr' ? 'Alléger' : 'Let Go')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {log.action === 'added' && (locale === 'fr' ? 'Ajouté' : 'Added')}
                          {log.action === 'removed' && (locale === 'fr' ? 'Supprimé' : 'Removed')}
                          {log.action === 'reactivated' && (locale === 'fr' ? 'Réactivé' : 'Reactivated')}
                        </p>
                      </div>

                      {/* Date/Time */}
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{formattedDate}</p>
                        <p className="text-xs text-gray-400">{formattedTime}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {locale === 'fr'
                    ? 'Aucune activité récente'
                    : 'No recent activity'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {locale === 'fr'
                    ? 'Ajoutez ou supprimez des graines pour voir l\'historique'
                    : 'Add or remove seeds to see history'}
                </p>
              </div>
            )}

            {/* Activity Summary */}
            {activityLogs.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {activityLogs.filter(l => l.action === 'added').length}
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    {locale === 'fr' ? 'Graines ajoutées' : 'Seeds added'}
                  </p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {activityLogs.filter(l => l.action === 'removed').length}
                  </div>
                  <p className="text-xs text-red-700 mt-1">
                    {locale === 'fr' ? 'Graines supprimées' : 'Seeds removed'}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'trends' ? (
          /* Trends View */
          <div>
            {/* Time Range Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {([
                { value: 7, label: locale === 'fr' ? '7 jours' : '7 days' },
                { value: 30, label: locale === 'fr' ? '30 jours' : '30 days' },
                { value: 90, label: locale === 'fr' ? '3 mois' : '3 months' },
                { value: 180, label: locale === 'fr' ? '6 mois' : '6 months' },
              ] as const).map(option => (
                <button
                  key={option.value}
                  onClick={() => setTrendsRange(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    trendsRange === option.value
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Anchor Filter */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                {locale === 'fr' ? 'Filtrer par graine:' : 'Filter by seed:'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTrendAnchor(null)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTrendAnchor === null
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {locale === 'fr' ? 'Tout' : 'All'}
                </button>
                {userAnchors.map(anchor => {
                  const iconData = ANCHOR_ICONS[anchor.icon]
                  const IconComponent = iconData?.icon || Circle
                  const isSelected = selectedTrendAnchor === anchor.id
                  const isGrow = anchor.type === 'grow'

                  return (
                    <button
                      key={anchor.id}
                      onClick={() => setSelectedTrendAnchor(anchor.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? isGrow
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                          : isGrow
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {locale === 'fr' ? anchor.labelFr : anchor.labelEn}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Chart */}
            {userAnchors.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  {selectedTrendAnchor
                    ? `${locale === 'fr' ? 'Progression:' : 'Progress:'} ${
                        locale === 'fr'
                          ? userAnchors.find(a => a.id === selectedTrendAnchor)?.labelFr
                          : userAnchors.find(a => a.id === selectedTrendAnchor)?.labelEn
                      }`
                    : locale === 'fr'
                      ? `Garder vs Alléger (${trendsRange === 7 ? '7 jours' : trendsRange === 30 ? '30 jours' : trendsRange === 90 ? '3 mois' : '6 mois'})`
                      : `Grow vs Let Go (${trendsRange === 7 ? '7 days' : trendsRange === 30 ? '30 days' : trendsRange === 90 ? '3 months' : '6 months'})`}
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedTrendAnchor ? (
                      <AreaChart data={getTrendsData()}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor={
                                userAnchors.find(a => a.id === selectedTrendAnchor)?.type === 'grow'
                                  ? '#10b981'
                                  : '#f43f5e'
                              }
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={
                                userAnchors.find(a => a.id === selectedTrendAnchor)?.type === 'grow'
                                  ? '#10b981'
                                  : '#f43f5e'
                              }
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={
                            userAnchors.find(a => a.id === selectedTrendAnchor)?.type === 'grow'
                              ? '#10b981'
                              : '#f43f5e'
                          }
                          strokeWidth={2}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    ) : (
                      <AreaChart data={getTrendsData()}>
                        <defs>
                          <linearGradient id="colorGrow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorLetgo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="grow"
                          name={locale === 'fr' ? 'Garder' : 'Grow'}
                          stroke="#10b981"
                          strokeWidth={2}
                          fill="url(#colorGrow)"
                        />
                        <Area
                          type="monotone"
                          dataKey="letgo"
                          name={locale === 'fr' ? 'Alléger' : 'Let Go'}
                          stroke="#f43f5e"
                          strokeWidth={2}
                          fill="url(#colorLetgo)"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                {!selectedTrendAnchor && (
                  <div className="flex justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-600">
                        {locale === 'fr' ? 'Garder' : 'Grow'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-xs text-gray-600">
                        {locale === 'fr' ? 'Alléger' : 'Let Go'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {locale === 'fr'
                    ? 'Ajoutez des graines pour voir les tendances'
                    : 'Add seeds to see trends'}
                </p>
              </div>
            )}

            {/* Summary stats */}
            {userAnchors.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {getDaysForRange(trendsRange).reduce((total, day) => {
                      return total + growAnchors.reduce((sum, a) => sum + getAnchorCountForDate(a.id, day.date), 0)
                    }, 0)}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    {locale === 'fr' ? 'Habitudes cultivées' : 'Habits grown'}
                    <br />
                    <span className="text-emerald-500">
                      ({trendsRange === 7
                        ? (locale === 'fr' ? '7 jours' : '7 days')
                        : trendsRange === 30
                          ? (locale === 'fr' ? '30 jours' : '30 days')
                          : trendsRange === 90
                            ? (locale === 'fr' ? '3 mois' : '3 months')
                            : (locale === 'fr' ? '6 mois' : '6 months')
                      })
                    </span>
                  </p>
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-rose-600">
                    {getDaysForRange(trendsRange).reduce((total, day) => {
                      return total + letgoAnchors.reduce((sum, a) => sum + getAnchorCountForDate(a.id, day.date), 0)
                    }, 0)}
                  </div>
                  <p className="text-xs text-rose-700 mt-1">
                    {locale === 'fr' ? 'Habitudes notées' : 'Habits logged'}
                    <br />
                    <span className="text-rose-500">{locale === 'fr' ? '(à réduire)' : '(to reduce)'}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'day' ? (
          <>
            {/* Day selector */}
            <div className="flex justify-between mb-5 px-1">
              {getLast7Days().map(day => {
                const isSelected = selectedDay === day.date
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDay(day.date)}
                    className={`text-center px-2.5 py-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs uppercase font-medium">{day.dayName}</div>
                    <div className="text-sm font-semibold">{day.dayNum}</div>
                  </button>
                )
              })}
            </div>

            {/* Selected day label */}
            <p className="text-sm text-gray-500 mb-4 text-center">
              {selectedDay === new Date().toISOString().split('T')[0]
                ? (locale === 'fr' ? "Aujourd'hui" : 'Today')
                : new Date(selectedDay + 'T12:00:00').toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
              }
            </p>

            {/* Edit mode toggle - only show if there are seeds and it's today */}
            {userAnchors.length > 0 && selectedDay === new Date().toISOString().split('T')[0] && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    editMode
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {editMode
                    ? (locale === 'fr' ? 'Terminé' : 'Done')
                    : (locale === 'fr' ? 'Modifier' : 'Edit')
                  }
                </button>
              </div>
            )}

            {/* Grow Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Sprout className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Garder' : 'Grow'}
                  </h2>
                </div>
                <button
                  onClick={() => { setAddAnchorType('grow'); setShowAddAnchor(true) }}
                  className="text-emerald-600 hover:text-emerald-700 p-1"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {growAnchors.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {growAnchors.map(anchor => {
                    const iconData = ANCHOR_ICONS[anchor.icon]
                    const IconComponent = iconData?.icon || Circle
                    const isToday = selectedDay === new Date().toISOString().split('T')[0]
                    const dayCount = isToday ? getTodayCount(anchor.id) : getCountForDate(anchor.id, selectedDay)

                    return (
                      <motion.div
                        key={anchor.id}
                        whileTap={isToday && !editMode ? { scale: 0.95 } : undefined}
                        onClick={() => isToday && !editMode && logAnchor(anchor.id)}
                        className={`relative bg-emerald-50 border-2 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors ${
                          editMode
                            ? 'border-red-200 bg-red-50/30'
                            : isToday
                              ? 'border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                              : 'border-emerald-200 opacity-80'
                        }`}
                      >
                        <IconComponent className="w-8 h-8 text-emerald-600 mb-2" />
                        <span className="text-xs text-gray-600 font-medium text-center">
                          {locale === 'fr' ? anchor.labelFr : anchor.labelEn}
                        </span>
                        {dayCount > 0 && !editMode && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {dayCount}
                          </div>
                        )}
                        {isToday && editMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAnchor(anchor.id) }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-emerald-50 rounded-2xl p-6 text-center border-2 border-dashed border-emerald-200">
                  <Sprout className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Ajoutez des habitudes à cultiver' : 'Add habits to grow'}
                  </p>
                  <button
                    onClick={() => { setAddAnchorType('grow'); setShowAddAnchor(true) }}
                    className="mt-3 text-emerald-600 text-sm font-medium hover:text-emerald-700"
                  >
                    + {locale === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Let Go Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-gray-900">
                    {locale === 'fr' ? 'Alléger' : 'Let Go'}
                  </h2>
                </div>
                <button
                  onClick={() => { setAddAnchorType('letgo'); setShowAddAnchor(true) }}
                  className="text-rose-600 hover:text-rose-700 p-1"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {letgoAnchors.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {letgoAnchors.map(anchor => {
                    const iconData = ANCHOR_ICONS[anchor.icon]
                    const IconComponent = iconData?.icon || Circle
                    const isToday = selectedDay === new Date().toISOString().split('T')[0]
                    const dayCount = isToday ? getTodayCount(anchor.id) : getCountForDate(anchor.id, selectedDay)

                    return (
                      <motion.div
                        key={anchor.id}
                        whileTap={isToday && !editMode ? { scale: 0.95 } : undefined}
                        onClick={() => isToday && !editMode && logAnchor(anchor.id)}
                        className={`relative bg-rose-50 border-2 rounded-2xl p-4 flex flex-col items-center justify-center transition-colors ${
                          editMode
                            ? 'border-red-200 bg-red-50/30'
                            : isToday
                              ? 'border-rose-200 hover:bg-rose-100 cursor-pointer'
                              : 'border-rose-200 opacity-80'
                        }`}
                      >
                        <IconComponent className="w-8 h-8 text-rose-600 mb-2" />
                        <span className="text-xs text-gray-600 font-medium text-center">
                          {locale === 'fr' ? anchor.labelFr : anchor.labelEn}
                        </span>
                        {dayCount > 0 && !editMode && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                            {dayCount}
                          </div>
                        )}
                        {isToday && editMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeAnchor(anchor.id) }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-rose-50 rounded-2xl p-6 text-center border-2 border-dashed border-rose-200">
                  <Leaf className="w-8 h-8 text-rose-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'Ajoutez des habitudes à réduire' : 'Add habits to let go'}
                  </p>
                  <button
                    onClick={() => { setAddAnchorType('letgo'); setShowAddAnchor(true) }}
                    className="mt-3 text-rose-600 text-sm font-medium hover:text-rose-700"
                  >
                    + {locale === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Week View */
          <div>
            {/* Week overview header */}
            <div className="bg-gray-50 rounded-2xl p-3 mb-4">
              <div className="flex justify-between">
                {getLast7Days().map(day => (
                  <div
                    key={day.date}
                    className={`text-center w-10 ${
                      day.isToday
                        ? 'text-amber-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-medium tracking-wide">{day.dayName}</div>
                    <div className={`text-xs mt-0.5 ${day.isToday ? 'font-bold' : ''}`}>{day.dayNum}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip */}
            <p className="text-[11px] text-gray-400 text-center mb-4">
              {locale === 'fr' ? 'Utilisez l\'onglet Jour pour voir les détails' : 'Use Day tab to view details'}
            </p>

            {/* Grow anchors */}
            {growAnchors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sprout className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-gray-700">
                    {locale === 'fr' ? 'Garder' : 'Grow'}
                  </span>
                </div>
                <div className="space-y-3">
                  {growAnchors.map(anchor => {
                    const iconData = ANCHOR_ICONS[anchor.icon]
                    const IconComponent = iconData?.icon || Circle
                    const streak = getAnchorStreak(anchor.id)

                    return (
                      <div key={anchor.id} className="bg-emerald-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-gray-700">
                              {locale === 'fr' ? anchor.labelFr : anchor.labelEn}
                            </span>
                          </div>
                          {streak > 1 && (
                            <span className="text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full font-medium">
                              🔥 {streak} {locale === 'fr' ? 'jours' : 'days'}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          {getLast7Days().map(day => {
                            const count = getAnchorCountForDate(anchor.id, day.date)
                            return (
                              <div
                                key={day.date}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium ${
                                  count > 0
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-emerald-100 text-emerald-300'
                                }`}
                              >
                                {count > 0 ? count : '-'}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Let Go anchors */}
            {letgoAnchors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-rose-500" />
                  <span className="font-medium text-gray-700">
                    {locale === 'fr' ? 'Alléger' : 'Let Go'}
                  </span>
                </div>
                <div className="space-y-3">
                  {letgoAnchors.map(anchor => {
                    const iconData = ANCHOR_ICONS[anchor.icon]
                    const IconComponent = iconData?.icon || Circle

                    return (
                      <div key={anchor.id} className="bg-rose-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <IconComponent className="w-5 h-5 text-rose-600" />
                          <span className="font-medium text-gray-700">
                            {locale === 'fr' ? anchor.labelFr : anchor.labelEn}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          {getLast7Days().map(day => {
                            const count = getAnchorCountForDate(anchor.id, day.date)
                            return (
                              <div
                                key={day.date}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium ${
                                  count > 0
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-rose-100 text-rose-300'
                                }`}
                              >
                                {count > 0 ? count : '-'}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {userAnchors.length === 0 && (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  {locale === 'fr' ? 'Ajoutez des graines pour voir vos progrès' : 'Add seeds to see your progress'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {locale === 'fr'
            ? 'Tapez sur une graine pour enregistrer'
            : 'Tap a seed to log it'}
        </p>
      </div>

      {/* Add Anchor Modal */}
      <AnimatePresence>
        {showAddAnchor && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAnchor(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-50 max-w-sm mx-auto shadow-2xl max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {locale === 'fr' ? 'Ajouter une graine' : 'Add Seed'}
                </h3>
                <button
                  onClick={() => setShowAddAnchor(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Type indicator */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
                addAnchorType === 'grow'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}>
                {addAnchorType === 'grow' ? <Sprout className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                {addAnchorType === 'grow'
                  ? (locale === 'fr' ? 'Garder' : 'Grow')
                  : (locale === 'fr' ? 'Alléger' : 'Let Go')}
              </div>

              {/* Icon grid - filtered by type */}
              <p className="text-sm text-gray-500 mb-3">
                {locale === 'fr' ? 'Choisissez:' : 'Choose:'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {(addAnchorType === 'grow' ? GROW_ANCHOR_OPTIONS : LETGO_ANCHOR_OPTIONS).map((key) => {
                  const data = ANCHOR_ICONS[key]
                  if (!data) return null
                  const IconComp = data.icon
                  const alreadyAdded = userAnchors.some(a => a.icon === key)

                  return (
                    <button
                      key={key}
                      onClick={() => !alreadyAdded && addAnchor(key)}
                      disabled={alreadyAdded}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                        alreadyAdded
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : addAnchorType === 'grow'
                            ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:scale-105 active:scale-95'
                            : 'bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${
                        alreadyAdded
                          ? 'text-gray-300'
                          : addAnchorType === 'grow' ? 'text-emerald-600' : 'text-rose-600'
                      }`} />
                      <span className={`text-[9px] font-medium text-center leading-tight ${
                        alreadyAdded ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {locale === 'fr' ? data.labelFr : data.labelEn}
                      </span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}

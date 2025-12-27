'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Briefcase,
  Heart,
  Plus,
  Minus,
  Calendar,
  Clock,
  Settings,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Check,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  Meh,
  Battery,
  CloudRain,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type TabType = 'today' | 'reflect' | 'trends'
type TimeRange = 'weekly' | 'monthly' | 'custom'

export default function BalancePage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const [showConfig, setShowConfig] = useState(false)
  const [settingsHistory, setSettingsHistory] = useState<{
    id: string
    sleep_target: number
    work_target: number
    life_target: number
    effective_from: string
    created_at: string
  }[]>([])
  // Temporary state for config modal (only saved on confirm)
  const [tempTargetHours, setTempTargetHours] = useState({
    sleep: 8,
    work: 8,
    life: 8,
  })
  const [showSomeday, setShowSomeday] = useState(false)
  const [somedayItems, setSomedayItems] = useState<{
    id: string
    name: string
    description?: string
    tag: 'sleep' | 'work' | 'life'
    plannedDate?: string
    estimatedMinutes?: number
  }[]>([])
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    tag: 'life' as 'sleep' | 'work' | 'life',
    plannedDate: '',
    estimatedMinutes: 60, // Default 1 hour
  })
  // Target hours = default template for every day (from settings)
  const [targetHours, setTargetHours] = useState({
    sleep: 8,
    work: 8,
    life: 8,
  })
  // Historical targets for the selected date (may differ from current targets)
  const [historicalTargets, setHistoricalTargets] = useState<{
    sleep: number
    work: number
    life: number
  } | null>(null)
  // Daily minutes = actual time for today in MINUTES (can be edited)
  const [dailyMinutes, setDailyMinutes] = useState({
    sleep: 480, // 8 hours in minutes
    work: 480,
    life: 480,
  })
  // Activities within each category
  const [activities, setActivities] = useState<{
    id: string
    category: 'sleep' | 'work' | 'life'
    name: string
    minutes: number
  }[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [newActivityName, setNewActivityName] = useState('')

  // Day confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [dayConfirmation, setDayConfirmation] = useState<{
    confirmed: boolean
    feeling?: 'great' | 'good' | 'okay' | 'tired' | 'rough'
  }>({ confirmed: false })

  // Editing mode - allows editing hours after day is confirmed
  const [isEditing, setIsEditing] = useState(false)

  // Weekly trends data
  const [weeklyData, setWeeklyData] = useState<{
    date: string
    dayName: string
    sleep: number
    work: number
    life: number
    sleepTarget: number
    workTarget: number
    lifeTarget: number
    confirmed: boolean
  }[]>([])
  const [loadingWeekly, setLoadingWeekly] = useState(false)

  // Trends chart state
  const [trendsTimeRange, setTrendsTimeRange] = useState<TimeRange>('weekly')
  const [customDateRange, setCustomDateRange] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [chartData, setChartData] = useState<{ date: string; dateLabel: string; sleep: number; work: number; life: number }[]>([])
  const [visibleLines, setVisibleLines] = useState<{ sleep: boolean; work: boolean; life: boolean }>({ sleep: true, work: true, life: true })

  // Date navigation - initialize with timezone-safe today
  const getInitialDate = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }
  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate())
  const [oldestDate, setOldestDate] = useState<string | null>(null)
  const [loadingDate, setLoadingDate] = useState(false)

  // Helper to get today's date string (timezone-safe)
  const getTodayStr = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  // Calculate min date (30 days ago or oldest data)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`
  const minDate = oldestDate && oldestDate < thirtyDaysAgoStr
    ? oldestDate
    : thirtyDaysAgoStr

  // Fetch data on mount
  useEffect(() => {
    fetchData(selectedDate)
    fetchOldestDate()
  }, [])

  // Fetch weekly data when trends or reflect tab is selected - always refresh
  useEffect(() => {
    if ((activeTab === 'trends' || activeTab === 'reflect') && memberId) {
      // Clear existing data to show loading state
      setWeeklyData([])
      fetchWeeklyData()

      // Also fetch chart data for the selected time range (only for trends)
      if (activeTab === 'trends') {
        const today = new Date()
        const todayStr = getTodayStr()
        if (trendsTimeRange === 'weekly') {
          const startDate = new Date()
          startDate.setDate(today.getDate() - 5)
          const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
          fetchTrendsData(startStr, todayStr)
        } else if (trendsTimeRange === 'monthly') {
          const startDate = new Date()
          startDate.setDate(today.getDate() - 29)
          const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
          fetchTrendsData(startStr, todayStr)
        }
      }
    }
  }, [activeTab, memberId])

  // Fetch the oldest date with entries
  const fetchOldestDate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!member) return

      // Get the oldest entry date
      const { data: oldest } = await supabase
        .from('balance_entries')
        .select('entry_date')
        .eq('member_id', member.id)
        .order('entry_date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (oldest) {
        setOldestDate(oldest.entry_date)
      }
    } catch (error) {
      console.error('Error fetching oldest date:', error)
    }
  }

  // Fetch weekly trends data (last 7 days)
  const fetchWeeklyData = async () => {
    if (!memberId) return
    setLoadingWeekly(true)

    try {
      const days: typeof weeklyData = []
      const dayNames = locale === 'fr'
        ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      // Default targets in minutes (8h each) as fallback
      const defaultSleepTarget = (targetHours.sleep || 8) * 60
      const defaultWorkTarget = (targetHours.work || 8) * 60
      const defaultLifeTarget = (targetHours.life || 8) * 60

      // Get last 6 days
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        const dayName = dayNames[date.getDay()]

        days.push({
          date: dateStr,
          dayName,
          sleep: 0,
          work: 0,
          life: 0,
          sleepTarget: defaultSleepTarget,
          workTarget: defaultWorkTarget,
          lifeTarget: defaultLifeTarget,
          confirmed: false,
        })
      }

      // Fetch all entries for the week
      const startDate = days[0].date
      const endDate = days[days.length - 1].date

      const { data: entries } = await supabase
        .from('balance_entries')
        .select('*')
        .eq('member_id', memberId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)

      // Fetch confirmations for the week
      const { data: confirmations } = await supabase
        .from('day_confirmations')
        .select('confirmation_date')
        .eq('member_id', memberId)
        .gte('confirmation_date', startDate)
        .lte('confirmation_date', endDate)

      // Fetch historical settings for target calculation
      const { data: historicalSettings } = await supabase
        .from('balance_settings_history')
        .select('*')
        .eq('member_id', memberId)
        .lte('effective_from', endDate)
        .order('effective_from', { ascending: false })

      // Process entries - check for _total first, then sum activities
      if (entries) {
        // Group entries by date
        const entriesByDate: Record<string, typeof entries> = {}
        entries.forEach(entry => {
          if (!entriesByDate[entry.entry_date]) {
            entriesByDate[entry.entry_date] = []
          }
          entriesByDate[entry.entry_date].push(entry)
        })

        // Process each day's entries
        days.forEach(day => {
          const dayEntries = entriesByDate[day.date] || []

          // Check for _total entries first
          const sleepTotal = dayEntries.find(e => e.category === 'sleep' && e.activity_name === '_total')
          const workTotal = dayEntries.find(e => e.category === 'work' && e.activity_name === '_total')
          const lifeTotal = dayEntries.find(e => e.category === 'life' && e.activity_name === '_total')

          // Use _total if exists, otherwise sum activities
          if (sleepTotal) {
            day.sleep = sleepTotal.duration_minutes
          } else {
            day.sleep = dayEntries
              .filter(e => e.category === 'sleep' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0)
          }

          if (workTotal) {
            day.work = workTotal.duration_minutes
          } else {
            day.work = dayEntries
              .filter(e => e.category === 'work' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0)
          }

          if (lifeTotal) {
            day.life = lifeTotal.duration_minutes
          } else {
            day.life = dayEntries
              .filter(e => e.category === 'life' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0)
          }
        })
      }

      // Process confirmations
      if (confirmations) {
        confirmations.forEach(conf => {
          const day = days.find(d => d.date === conf.confirmation_date)
          if (day) day.confirmed = true
        })
      }

      // Apply historical targets for each day
      if (historicalSettings && historicalSettings.length > 0) {
        days.forEach(day => {
          // Find the most recent settings effective on or before this day
          const applicableSettings = historicalSettings.find(s => s.effective_from <= day.date)
          if (applicableSettings) {
            // Only use if values are valid (> 0), otherwise keep defaults
            if (applicableSettings.sleep_target > 0) day.sleepTarget = applicableSettings.sleep_target
            if (applicableSettings.work_target > 0) day.workTarget = applicableSettings.work_target
            if (applicableSettings.life_target > 0) day.lifeTarget = applicableSettings.life_target
          }
        })
      }

      setWeeklyData(days)
    } catch (error) {
      console.error('Error fetching weekly data:', error)
    } finally {
      setLoadingWeekly(false)
    }
  }

  // Fetch trends chart data for variable date ranges
  const fetchTrendsData = async (startDate: string, endDate: string) => {
    if (!memberId) return
    setLoadingWeekly(true)

    try {
      // Calculate number of days
      const start = new Date(startDate)
      const end = new Date(endDate)
      const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const days: typeof chartData = []

      // Generate date range
      for (let i = 0; i < dayCount; i++) {
        const date = new Date(start)
        date.setDate(date.getDate() + i)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

        // Format label based on range size
        let dateLabel: string
        if (dayCount <= 7) {
          dateLabel = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' })
        } else {
          dateLabel = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })
        }

        days.push({
          date: dateStr,
          dateLabel,
          sleep: 0,
          work: 0,
          life: 0,
        })
      }

      // Fetch all entries for the date range
      const { data: entries } = await supabase
        .from('balance_entries')
        .select('*')
        .eq('member_id', memberId)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)

      // Process entries
      if (entries) {
        const entriesByDate: Record<string, typeof entries> = {}
        entries.forEach(entry => {
          if (!entriesByDate[entry.entry_date]) {
            entriesByDate[entry.entry_date] = []
          }
          entriesByDate[entry.entry_date].push(entry)
        })

        days.forEach(day => {
          const dayEntries = entriesByDate[day.date] || []

          // Check for _total entries first
          const sleepTotal = dayEntries.find(e => e.category === 'sleep' && e.activity_name === '_total')
          const workTotal = dayEntries.find(e => e.category === 'work' && e.activity_name === '_total')
          const lifeTotal = dayEntries.find(e => e.category === 'life' && e.activity_name === '_total')

          // Convert minutes to hours for display
          if (sleepTotal) {
            day.sleep = Math.round((sleepTotal.duration_minutes / 60) * 10) / 10
          } else {
            day.sleep = Math.round((dayEntries
              .filter(e => e.category === 'sleep' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0) / 60) * 10) / 10
          }

          if (workTotal) {
            day.work = Math.round((workTotal.duration_minutes / 60) * 10) / 10
          } else {
            day.work = Math.round((dayEntries
              .filter(e => e.category === 'work' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0) / 60) * 10) / 10
          }

          if (lifeTotal) {
            day.life = Math.round((lifeTotal.duration_minutes / 60) * 10) / 10
          } else {
            day.life = Math.round((dayEntries
              .filter(e => e.category === 'life' && e.activity_name !== '_total')
              .reduce((sum, e) => sum + e.duration_minutes, 0) / 60) * 10) / 10
          }
        })
      }

      setChartData(days)
    } catch (error) {
      console.error('Error fetching trends data:', error)
    } finally {
      setLoadingWeekly(false)
    }
  }

  // Handle time range change for trends chart
  const handleTimeRangeChange = async (range: TimeRange) => {
    setTrendsTimeRange(range)

    const today = new Date()
    const todayStr = getTodayStr()

    if (range === 'weekly') {
      const startDate = new Date()
      startDate.setDate(today.getDate() - 5)
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
      await fetchTrendsData(startStr, todayStr)
    } else if (range === 'monthly') {
      const startDate = new Date()
      startDate.setDate(today.getDate() - 29)
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
      await fetchTrendsData(startStr, todayStr)
    } else if (range === 'custom') {
      setShowDatePicker(true)
    }
  }

  // Apply custom date range
  const applyCustomDateRange = async () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowDatePicker(false)
      await fetchTrendsData(customDateRange.startDate, customDateRange.endDate)
    }
  }

  const fetchData = async (date?: string) => {
    const targetDate = date || selectedDate
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get member record
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

      // Fetch balance settings (use maybeSingle to handle no rows)
      const { data: settings } = await supabase
        .from('balance_settings')
        .select('*')
        .eq('member_id', member.id)
        .maybeSingle()

      if (settings) {
        setTargetHours({
          sleep: Math.round(settings.sleep_target / 60),
          work: Math.round(settings.work_target / 60),
          life: Math.round(settings.life_target / 60),
        })
      }

      // Fetch historical settings for the selected date
      // This finds the most recent settings that were effective on or before the target date
      const { data: historicalSettings } = await supabase
        .from('balance_settings_history')
        .select('*')
        .eq('member_id', member.id)
        .lte('effective_from', targetDate)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (historicalSettings) {
        // Use historical settings for this date
        setHistoricalTargets({
          sleep: Math.round(historicalSettings.sleep_target / 60),
          work: Math.round(historicalSettings.work_target / 60),
          life: Math.round(historicalSettings.life_target / 60),
        })
      } else {
        // No history found - use current settings or defaults
        setHistoricalTargets(settings ? {
          sleep: Math.round(settings.sleep_target / 60),
          work: Math.round(settings.work_target / 60),
          life: Math.round(settings.life_target / 60),
        } : {
          sleep: 8,
          work: 8,
          life: 8,
        })
      }

      // Fetch someday items
      const { data: items } = await supabase
        .from('someday_items')
        .select('*')
        .eq('member_id', member.id)
        .eq('completed', false)
        .order('created_at', { ascending: false })

      if (items) {
        setSomedayItems(items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          tag: item.category as 'sleep' | 'work' | 'life',
          plannedDate: item.planned_date || undefined,
          estimatedMinutes: item.estimated_minutes || undefined,
        })))
      }

      // Fetch day confirmation status
      const { data: confirmation } = await supabase
        .from('day_confirmations')
        .select('feeling')
        .eq('member_id', member.id)
        .eq('confirmation_date', targetDate)
        .maybeSingle()

      if (confirmation) {
        setDayConfirmation({ confirmed: true, feeling: confirmation.feeling })
      } else {
        setDayConfirmation({ confirmed: false })
      }

      // Fetch balance entries for selected date
      const { data: entries } = await supabase
        .from('balance_entries')
        .select('*')
        .eq('member_id', member.id)
        .eq('entry_date', targetDate)

      // Start with default/target values for all categories
      const defaultMinutes = settings ? {
        sleep: settings.sleep_target,
        work: settings.work_target,
        life: settings.life_target,
      } : { sleep: 480, work: 480, life: 480 }

      if (entries && entries.length > 0) {
        // Load activities (exclude _total entries from display)
        setActivities(entries
          .filter(entry => entry.activity_name !== '_total')
          .map(entry => ({
            id: entry.id,
            category: entry.category as 'sleep' | 'work' | 'life',
            name: entry.activity_name,
            minutes: entry.duration_minutes,
          })))

        // Calculate daily minutes:
        // 1. If _total exists for a category, use it (user's intended total)
        // 2. Otherwise, sum named activities
        // 3. Otherwise, use defaults
        const dailyTotals = { ...defaultMinutes }

        // First, check for _total entries (these override everything)
        const totalEntries: Record<string, number> = {}
        entries.forEach(entry => {
          if (entry.activity_name === '_total') {
            totalEntries[entry.category] = entry.duration_minutes
          }
        })

        // Apply _total values or sum activities
        const categories = ['sleep', 'work', 'life'] as const
        categories.forEach(cat => {
          if (totalEntries[cat] !== undefined) {
            // Use the _total value
            dailyTotals[cat] = totalEntries[cat]
          } else {
            // Sum named activities for this category
            const categoryEntries = entries.filter(
              e => e.category === cat && e.activity_name !== '_total'
            )
            if (categoryEntries.length > 0) {
              dailyTotals[cat] = categoryEntries.reduce((sum, e) => sum + e.duration_minutes, 0)
            }
            // else keep default
          }
        })

        setDailyMinutes(dailyTotals)
      } else {
        // No entries for today - use target minutes as default
        setDailyMinutes(defaultMinutes)
        setActivities([])
      }
    } catch (error) {
      console.error('Error fetching balance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save target hours to database (from temp state)
  const saveTargetHours = async () => {
    if (!memberId) {
      alert('No member ID found. Please try again.')
      return
    }
    setSaving(true)

    console.log('Saving target hours for member:', memberId)
    console.log('Values:', tempTargetHours)

    try {
      // First check if settings exist (use maybeSingle to avoid 406 error when no rows)
      const { data: existing, error: fetchError } = await supabase
        .from('balance_settings')
        .select('id')
        .eq('member_id', memberId)
        .maybeSingle()

      console.log('Existing settings:', existing, 'Fetch error:', fetchError)

      let saveError
      if (existing && existing.id) {
        // Update existing
        const { error } = await supabase
          .from('balance_settings')
          .update({
            sleep_target: tempTargetHours.sleep * 60,
            work_target: tempTargetHours.work * 60,
            life_target: tempTargetHours.life * 60,
          })
          .eq('id', existing.id)
        saveError = error
      } else {
        // Insert new
        const { error } = await supabase
          .from('balance_settings')
          .insert({
            member_id: memberId,
            sleep_target: tempTargetHours.sleep * 60,
            work_target: tempTargetHours.work * 60,
            life_target: tempTargetHours.life * 60,
          })
        saveError = error
      }

      if (saveError) {
        console.error('Error saving target hours:', saveError)
        alert(`Failed to save: ${saveError.message}`)
        return
      }

      // Log to settings history for historical tracking
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const { error: historyError } = await supabase
        .from('balance_settings_history')
        .insert({
          member_id: memberId,
          sleep_target: tempTargetHours.sleep * 60,
          work_target: tempTargetHours.work * 60,
          life_target: tempTargetHours.life * 60,
          effective_from: todayStr,
        })

      if (historyError) {
        console.error('Error logging settings history:', historyError)
        // Don't fail the whole operation, just log the error
      } else {
        // Refresh the history list to show the new entry
        await fetchSettingsHistory()
      }

      console.log('Settings saved successfully!')

      // Success - update actual state
      setTargetHours({ ...tempTargetHours })

      // Also update daily minutes to match new targets (convert hours to minutes)
      setDailyMinutes({
        sleep: tempTargetHours.sleep * 60,
        work: tempTargetHours.work * 60,
        life: tempTargetHours.life * 60,
      })

      setShowConfig(false)
    } catch (error: any) {
      console.error('Error saving target hours:', error)
      alert(`Failed to save: ${error?.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  // Add a new activity to a category
  const addActivity = async (category: 'sleep' | 'work' | 'life', name: string) => {
    if (!name.trim() || !memberId) return

    try {
      const { data, error } = await supabase
        .from('balance_entries')
        .insert({
          member_id: memberId,
          category,
          activity_name: name,
          duration_minutes: 60, // Default 1 hour
          entry_date: selectedDate,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newActivity = {
          id: data.id,
          category: data.category as 'sleep' | 'work' | 'life',
          name: data.activity_name,
          minutes: data.duration_minutes,
        }
        setActivities(prev => [...prev, newActivity])
        // Update daily minutes (add 60 minutes for new activity)
        setDailyMinutes(prev => ({
          ...prev,
          [category]: prev[category] + 60,
        }))
      }
      setNewActivityName('')
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  // Adjust time for a specific activity
  const adjustActivityTime = async (activityId: string, delta: number) => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    const newMinutes = Math.max(0, activity.minutes + delta)

    // Update local state immediately
    setActivities(prev => prev.map(a =>
      a.id === activityId ? { ...a, minutes: newMinutes } : a
    ))

    // Recalculate daily minutes
    const updatedActivities = activities.map(a =>
      a.id === activityId ? { ...a, minutes: newMinutes } : a
    )
    const totals = { sleep: 0, work: 0, life: 0 }
    updatedActivities.forEach(a => {
      totals[a.category] += a.minutes
    })
    setDailyMinutes(totals)

    // Save to database
    try {
      await supabase
        .from('balance_entries')
        .update({ duration_minutes: newMinutes })
        .eq('id', activityId)
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  // Remove an activity
  const removeActivity = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    // Update local state
    const updatedActivities = activities.filter(a => a.id !== activityId)
    setActivities(updatedActivities)

    // Recalculate daily minutes
    const totals = { sleep: 0, work: 0, life: 0 }
    updatedActivities.forEach(a => {
      totals[a.category] += a.minutes
    })
    setDailyMinutes(totals)

    // Delete from database
    try {
      await supabase
        .from('balance_entries')
        .delete()
        .eq('id', activityId)
    } catch (error) {
      console.error('Error removing activity:', error)
    }
  }

  // Adjust global category time by delta minutes (e.g., +30 or -30)
  const adjustCategoryTime = async (category: 'sleep' | 'work' | 'life', delta: number) => {
    const newMinutes = Math.max(0, dailyMinutes[category] + delta)
    setDailyMinutes(prev => ({ ...prev, [category]: newMinutes }))

    if (!memberId) return

    try {
      // Find existing _total entries (there might be duplicates due to a bug)
      const { data: existingTotals, error: findError } = await supabase
        .from('balance_entries')
        .select('id')
        .eq('member_id', memberId)
        .eq('entry_date', selectedDate)
        .eq('category', category)
        .eq('activity_name', '_total')
        .order('created_at', { ascending: false })

      if (findError) return

      if (existingTotals && existingTotals.length > 0) {
        // Update the most recent _total entry
        const { error: updateError } = await supabase
          .from('balance_entries')
          .update({ duration_minutes: newMinutes })
          .eq('id', existingTotals[0].id)

        if (updateError) console.error('Error updating entry:', updateError)

        // Clean up duplicates if any exist
        if (existingTotals.length > 1) {
          const duplicateIds = existingTotals.slice(1).map(e => e.id)
          await supabase
            .from('balance_entries')
            .delete()
            .in('id', duplicateIds)
        }
      } else {
        // Create new _total entry
        const { error: insertError } = await supabase
          .from('balance_entries')
          .insert({
            member_id: memberId,
            category,
            activity_name: '_total',
            duration_minutes: newMinutes,
            entry_date: selectedDate,
          })

        if (insertError) console.error('Error inserting entry:', insertError)
      }
    } catch (error) {
      console.error('Error adjusting category time:', error)
    }
  }

  // Get activities for a category (excluding hidden entries)
  const getCategoryActivities = (category: 'sleep' | 'work' | 'life') => {
    return activities.filter(a => a.category === category && a.name !== '_general' && a.name !== '_total')
  }

  // Format minutes to hours and minutes display
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Format daily minutes for category card display
  const formatDailyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Helper to add/subtract days from a date string (timezone-safe)
  const addDays = (dateStr: string, days: number): string => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day + days)
    const newYear = date.getFullYear()
    const newMonth = String(date.getMonth() + 1).padStart(2, '0')
    const newDay = String(date.getDate()).padStart(2, '0')
    return `${newYear}-${newMonth}-${newDay}`
  }

  // Check if a date can still be confirmed (today or yesterday only)
  const canConfirmDate = (dateStr: string): boolean => {
    const todayStr = getTodayStr()
    const yesterdayStr = addDays(todayStr, -1)
    return dateStr === todayStr || dateStr === yesterdayStr
  }

  // Check if this is an unconfirmed old day (should show as not tracked)
  const isUntrackedDay = !dayConfirmation.confirmed && !canConfirmDate(selectedDate)

  // Get display values - show 0 for untracked days
  const displayMinutes = isUntrackedDay
    ? { sleep: 0, work: 0, life: 0 }
    : dailyMinutes

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const todayStr = getTodayStr()
    const yesterdayStr = addDays(todayStr, -1)

    if (dateStr === todayStr) {
      return locale === 'fr' ? "Aujourd'hui" : 'Today'
    }
    if (dateStr === yesterdayStr) {
      return locale === 'fr' ? 'Hier' : 'Yesterday'
    }

    // Parse date for display
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Navigate to previous day
  const goToPreviousDay = async () => {
    const prevDate = addDays(selectedDate, -1)

    // Don't go before min date
    if (prevDate < minDate) return

    setSelectedDate(prevDate)
    setIsEditing(false) // Reset editing mode
    setHistoricalTargets(null) // Reset to prevent stale data
    setDailyMinutes({ sleep: 0, work: 0, life: 0 }) // Reset while loading
    setLoadingDate(true)
    await fetchData(prevDate)
    setLoadingDate(false)
  }

  // Navigate to next day
  const goToNextDay = async () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Don't go past today
    if (selectedDate >= todayStr) return

    const nextDate = addDays(selectedDate, 1)

    // Don't go past today
    if (nextDate > todayStr) return

    setSelectedDate(nextDate)
    setIsEditing(false) // Reset editing mode
    setHistoricalTargets(null) // Reset to prevent stale data
    setDailyMinutes({ sleep: 0, work: 0, life: 0 }) // Reset while loading
    setLoadingDate(true)
    await fetchData(nextDate)
    setLoadingDate(false)
  }

  const addSomedayItem = async () => {
    if (!newItem.name.trim() || !memberId) return

    try {
      const { data, error } = await supabase
        .from('someday_items')
        .insert({
          member_id: memberId,
          name: newItem.name,
          description: newItem.description || null,
          category: newItem.tag,
          planned_date: newItem.plannedDate || null,
          estimated_minutes: newItem.estimatedMinutes || 60,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setSomedayItems(prev => [{
          id: data.id,
          name: data.name,
          description: data.description || undefined,
          tag: data.category as 'sleep' | 'work' | 'life',
          plannedDate: data.planned_date || undefined,
          estimatedMinutes: data.estimated_minutes || undefined,
        }, ...prev])
      }

      setNewItem({ name: '', description: '', tag: 'life', plannedDate: '', estimatedMinutes: 60 })
    } catch (error) {
      console.error('Error adding someday item:', error)
    }
  }

  const removeSomedayItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('someday_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSomedayItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error removing someday item:', error)
    }
  }

  // Move someday item to today's activities
  const moveToToday = async (item: typeof somedayItems[0]) => {
    if (!memberId) return

    try {
      const today = new Date().toISOString().split('T')[0]

      // Add as today's activity
      const { data, error } = await supabase
        .from('balance_entries')
        .insert({
          member_id: memberId,
          category: item.tag,
          activity_name: item.name,
          duration_minutes: item.estimatedMinutes || 60,
          entry_date: today,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        // Add to activities state
        setActivities(prev => [...prev, {
          id: data.id,
          category: data.category as 'sleep' | 'work' | 'life',
          name: data.activity_name,
          minutes: data.duration_minutes,
        }])

        // Update daily minutes
        setDailyMinutes(prev => ({
          ...prev,
          [item.tag]: prev[item.tag] + (item.estimatedMinutes || 60),
        }))

        // Remove from someday list
        await removeSomedayItem(item.id)

        // Close modal
        setShowSomeday(false)
      }
    } catch (error) {
      console.error('Error moving item to today:', error)
    }
  }

  const tagColors = {
    sleep: { bg: 'bg-violet-100', text: 'text-violet-600', label: locale === 'fr' ? 'Sommeil' : 'Sleep' },
    work: { bg: 'bg-amber-100', text: 'text-amber-600', label: locale === 'fr' ? 'Travail' : 'Work' },
    life: { bg: 'bg-emerald-100', text: 'text-emerald-600', label: locale === 'fr' ? 'Vie' : 'Life' },
  }

  // Feeling options for day confirmation
  const feelingOptions = [
    { id: 'great' as const, icon: Sparkles, labelEn: 'Great', labelFr: 'Super', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', iconColor: 'text-emerald-500' },
    { id: 'good' as const, icon: ThumbsUp, labelEn: 'Good', labelFr: 'Bien', color: 'bg-teal-100 text-teal-600 border-teal-200', iconColor: 'text-teal-500' },
    { id: 'okay' as const, icon: Meh, labelEn: 'Okay', labelFr: 'Correct', color: 'bg-amber-100 text-amber-600 border-amber-200', iconColor: 'text-amber-500' },
    { id: 'tired' as const, icon: Battery, labelEn: 'Tired', labelFr: 'Fatigué', color: 'bg-orange-100 text-orange-600 border-orange-200', iconColor: 'text-orange-500' },
    { id: 'rough' as const, icon: CloudRain, labelEn: 'Rough', labelFr: 'Difficile', color: 'bg-rose-100 text-rose-600 border-rose-200', iconColor: 'text-rose-500' },
  ]

  // Save day confirmation with feeling
  const confirmDay = async (feeling: 'great' | 'good' | 'okay' | 'tired' | 'rough') => {
    if (!memberId) return

    try {
      // Check if confirmation already exists
      const { data: existing } = await supabase
        .from('day_confirmations')
        .select('id')
        .eq('member_id', memberId)
        .eq('confirmation_date', selectedDate)
        .maybeSingle()

      if (existing) {
        // Update existing
        await supabase
          .from('day_confirmations')
          .update({ feeling })
          .eq('id', existing.id)
      } else {
        // Insert new
        await supabase
          .from('day_confirmations')
          .insert({
            member_id: memberId,
            confirmation_date: selectedDate,
            feeling,
          })
      }

      setDayConfirmation({ confirmed: true, feeling })
      setShowConfirmModal(false)
    } catch (error) {
      console.error('Error confirming day:', error)
    }
  }

  const totalTempTargetHours = tempTargetHours.sleep + tempTargetHours.work + tempTargetHours.life

  // Fetch settings history
  const fetchSettingsHistory = async () => {
    if (!memberId) return

    const { data, error } = await supabase
      .from('balance_settings_history')
      .select('*')
      .eq('member_id', memberId)
      .order('effective_from', { ascending: false })
      .limit(10)

    if (!error && data) {
      setSettingsHistory(data)
    }
  }

  // Open config modal and initialize temp state
  const openConfig = async () => {
    setTempTargetHours({ ...targetHours })
    setShowConfig(true)
    await fetchSettingsHistory()
  }

  // Adjust temp target hours (only in modal, not saved yet)
  const adjustTempTargetHours = (category: 'sleep' | 'work' | 'life', delta: number) => {
    setTempTargetHours(prev => {
      const newValue = Math.max(0, Math.min(24, prev[category] + delta))
      const otherCategories = Object.keys(prev).filter(k => k !== category) as ('sleep' | 'work' | 'life')[]
      const newTotal = newValue + otherCategories.reduce((sum, k) => sum + prev[k], 0)

      // If total exceeds 24, don't allow the change
      if (newTotal > 24) return prev

      return { ...prev, [category]: newValue }
    })
  }

  const tabs = [
    { id: 'today' as TabType, labelEn: 'Today', labelFr: 'Aujourd\'hui', icon: Calendar },
    { id: 'reflect' as TabType, labelEn: 'Reflect', labelFr: 'Réfléchir', icon: Settings },
    { id: 'trends' as TabType, labelEn: 'Trends', labelFr: 'Tendances', icon: TrendingUp },
  ]

  // Arc positions based on target hours
  const radius = 80
  const strokeWidth = 14
  const cx = 100
  const cy = 100
  const gapAngle = 15 // gap between arcs in degrees

  // Calculate arc angles based on display minutes (0 for untracked days)
  const totalDisplayMinutes = displayMinutes.sleep + displayMinutes.work + displayMinutes.life
  const availableAngle = 360 - (gapAngle * 3) // 3 gaps

  const sleepAngle = totalDisplayMinutes > 0 ? (displayMinutes.sleep / totalDisplayMinutes) * availableAngle : 120
  const workAngle = totalDisplayMinutes > 0 ? (displayMinutes.work / totalDisplayMinutes) * availableAngle : 120
  const lifeAngle = totalDisplayMinutes > 0 ? (displayMinutes.life / totalDisplayMinutes) * availableAngle : 120

  // Start from top (-90°), go clockwise: Work -> Life -> Sleep
  const workStart = -90 + (gapAngle / 2)
  const workEnd = workStart + workAngle
  const lifeStart = workEnd + gapAngle
  const lifeEnd = lifeStart + lifeAngle
  const sleepStart = lifeEnd + gapAngle
  const sleepEnd = sleepStart + sleepAngle

  // Use historical targets for the selected date, or fall back to current targets
  const effectiveTargets = historicalTargets || targetHours

  // Check if any category exceeds its target (using effective targets for the date)
  const isWorkExceeded = displayMinutes.work > effectiveTargets.work * 60
  const isLifeExceeded = displayMinutes.life > effectiveTargets.life * 60
  const isSleepExceeded = displayMinutes.sleep > effectiveTargets.sleep * 60

  // Grey colors for untracked days
  const greyColor = '#e5e7eb'

  const arcSegments = [
    {
      id: 'work',
      startAngle: workStart,
      endAngle: workEnd,
      color: isUntrackedDay ? greyColor : (isWorkExceeded ? '#f87171' : '#fcd9a8'),
      normalColor: '#fcd9a8',
      minutes: displayMinutes.work,
      exceeded: isWorkExceeded,
    },
    {
      id: 'life',
      startAngle: lifeStart,
      endAngle: lifeEnd,
      color: isUntrackedDay ? greyColor : (isLifeExceeded ? '#f87171' : '#a7f3d0'),
      normalColor: '#a7f3d0',
      minutes: displayMinutes.life,
      exceeded: isLifeExceeded,
    },
    {
      id: 'sleep',
      startAngle: sleepStart,
      endAngle: sleepEnd,
      color: isUntrackedDay ? greyColor : (isSleepExceeded ? '#f87171' : '#ddd6fe'),
      normalColor: '#ddd6fe',
      minutes: displayMinutes.sleep,
      exceeded: isSleepExceeded,
    },
  ]

  const createArcPath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = Math.round((cx + radius * Math.cos(startRad)) * 100) / 100
    const y1 = Math.round((cy + radius * Math.sin(startRad)) * 100) / 100
    const x2 = Math.round((cx + radius * Math.cos(endRad)) * 100) / 100
    const y2 = Math.round((cy + radius * Math.sin(endRad)) * 100) / 100

    const sweepAngle = endAngle - startAngle
    const largeArcFlag = sweepAngle > 180 ? 1 : 0

    return {
      path: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      endX: x2,
      endY: y2,
    }
  }

  const arcs = arcSegments.map(seg => ({
    ...seg,
    ...createArcPath(seg.startAngle, seg.endAngle),
  }))

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </MemberLayout>
    )
  }

  return (
    <MemberLayout>
      <div className="px-5 pt-6 pb-8 min-h-screen bg-[#f8f7f4]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {locale === 'fr' ? 'Sommeil, travail et vie' : 'Sleep, work and life overview'}
          </h1>
        </motion.div>

        {/* Tab Navigation - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {locale === 'fr' ? tab.labelFr : tab.labelEn}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={openConfig}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={() => setShowSomeday(true)}
              className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </motion.div>

        {/* Date Navigation - only show on today tab */}
        {activeTab === 'today' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <button
              onClick={goToPreviousDay}
              disabled={selectedDate <= minDate || loadingDate}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                selectedDate > minDate && !loadingDate
                  ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 min-w-[140px] justify-center">
              {loadingDate ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <>
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={goToNextDay}
              disabled={selectedDate >= getTodayStr() || loadingDate}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                selectedDate < getTodayStr() && !loadingDate
                  ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Configuration Modal */}
        <AnimatePresence>
          {showConfig && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfig(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10 max-h-[85vh] overflow-y-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Configurer mes 24 heures' : 'Configure my 24 hours'}
                  </h3>
                  <button
                    onClick={() => setShowConfig(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Hours remaining indicator */}
                <div className="mb-6 p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {locale === 'fr' ? 'Heures restantes' : 'Hours remaining'}
                  </span>
                  <span className={`text-lg font-bold ${24 - totalTempTargetHours > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {24 - totalTempTargetHours}h
                  </span>
                </div>

                {/* Sleep */}
                <div className="mb-4 p-4 bg-violet-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                        <Moon className="w-5 h-5 text-violet-500" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {locale === 'fr' ? 'Sommeil' : 'Sleep'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{tempTargetHours.sleep}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustTempTargetHours('sleep', -1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-100 transition-colors"
                    >
                      -1h
                    </button>
                    <button
                      onClick={() => adjustTempTargetHours('sleep', 1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-violet-100 transition-colors"
                    >
                      +1h
                    </button>
                  </div>
                </div>

                {/* Work */}
                <div className="mb-4 p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {locale === 'fr' ? 'Travail' : 'Work'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{tempTargetHours.work}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustTempTargetHours('work', -1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-amber-100 transition-colors"
                    >
                      -1h
                    </button>
                    <button
                      onClick={() => adjustTempTargetHours('work', 1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-amber-100 transition-colors"
                    >
                      +1h
                    </button>
                  </div>
                </div>

                {/* Life */}
                <div className="mb-4 p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="font-medium text-gray-800">
                        {locale === 'fr' ? 'Vie' : 'Life'}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{tempTargetHours.life}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustTempTargetHours('life', -1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-emerald-100 transition-colors"
                    >
                      -1h
                    </button>
                    <button
                      onClick={() => adjustTempTargetHours('life', 1)}
                      className="flex-1 py-2 bg-white rounded-lg text-sm font-medium text-gray-600 hover:bg-emerald-100 transition-colors"
                    >
                      +1h
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={saveTargetHours}
                    disabled={saving}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {locale === 'fr' ? 'Enregistrer' : 'Save'}
                  </button>
                </div>

                {/* Settings History Log */}
                {settingsHistory.length > 0 && (
                  <div className="mt-6 pb-24">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">
                      {locale === 'fr' ? 'Historique des modifications' : 'Change History'}
                    </h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {settingsHistory.map((entry) => {
                        const date = new Date(entry.effective_from)
                        const dateStr = date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <span className="text-gray-600">{dateStr}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded">
                                {Math.round(entry.sleep_target / 60)}h
                              </span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                                {Math.round(entry.work_target / 60)}h
                              </span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                                {Math.round(entry.life_target / 60)}h
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Someday Modal */}
        <AnimatePresence>
          {showSomeday && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSomeday(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-28 max-h-[85vh] overflow-y-auto scrollbar-hide"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Liste Someday' : 'Someday List'}
                  </h3>
                  <button
                    onClick={() => setShowSomeday(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Someday items list */}
                {somedayItems.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm mb-6">
                    {locale === 'fr' ? 'Aucun élément pour le moment' : 'No items yet'}
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    {somedayItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-3 bg-white rounded-xl border border-gray-100"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${tagColors[item.tag].bg} ${tagColors[item.tag].text}`}>
                              {tagColors[item.tag].label}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 mb-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {item.plannedDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.plannedDate).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {item.estimatedMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatMinutes(item.estimatedMinutes)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveToToday(item)}
                            className="px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            {locale === 'fr' ? 'Faire' : 'Do'}
                          </button>
                          <button
                            onClick={() => removeSomedayItem(item.id)}
                            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new item form */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <input
                    type="text"
                    placeholder={locale === 'fr' ? 'Nom de la tâche...' : 'Task name...'}
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                  <input
                    type="text"
                    placeholder={locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />

                  {/* Date and Estimated Time */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        {locale === 'fr' ? 'Date prévue' : 'Planned date'}
                      </label>
                      <input
                        type="date"
                        value={newItem.plannedDate}
                        onChange={(e) => setNewItem(prev => ({ ...prev, plannedDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        {locale === 'fr' ? 'Durée estimée' : 'Estimated time'}
                      </label>
                      <select
                        value={newItem.estimatedMinutes}
                        onChange={(e) => setNewItem(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        <option value={15}>15m</option>
                        <option value={30}>30m</option>
                        <option value={45}>45m</option>
                        <option value={60}>1h</option>
                        <option value={90}>1h 30m</option>
                        <option value={120}>2h</option>
                        <option value={180}>3h</option>
                        <option value={240}>4h</option>
                        <option value={480}>8h</option>
                      </select>
                    </div>
                  </div>

                  {/* Category Tags */}
                  <div className="flex items-center gap-2">
                    {(['sleep', 'work', 'life'] as const).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setNewItem(prev => ({ ...prev, tag }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          newItem.tag === tag
                            ? `${tagColors[tag].bg} ${tagColors[tag].text}`
                            : 'bg-white border border-gray-200 text-gray-500'
                        }`}
                      >
                        {tagColors[tag].label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={addSomedayItem}
                    disabled={!newItem.name.trim()}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locale === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Day Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl z-50 p-6 max-w-sm mx-auto shadow-xl"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {locale === 'fr' ? 'Comment te sens-tu ?' : 'How do you feel?'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr' ? 'À propos de ta journée' : 'About your day'}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-6">
                  {feelingOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => confirmDay(option.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-colors ${option.color}`}
                      >
                        <Icon className={`w-6 h-6 ${option.iconColor}`} />
                        <span className="text-[10px] font-medium">
                          {locale === 'fr' ? option.labelFr : option.labelEn}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Custom Date Range Picker Modal */}
        <AnimatePresence>
          {showDatePicker && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDatePicker(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {locale === 'fr' ? 'Période personnalisée' : 'Custom Date Range'}
                  </h3>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Date de début' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      max={getTodayStr()}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Date de fin' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      min={customDateRange.startDate}
                      max={getTodayStr()}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>

                  <button
                    onClick={applyCustomDateRange}
                    disabled={!customDateRange.startDate || !customDateRange.endDate}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {locale === 'fr' ? 'Appliquer' : 'Apply'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {activeTab === 'today' && (
          <>
            {/* Circular Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="relative w-52 h-52">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {/* Background circle - very light */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                  />
                  {/* Arcs */}
                  {arcs.map((arc, idx) => (
                    <motion.path
                      key={`${arc.id}-${selectedDate}`}
                      d={arc.path}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={arc.exceeded ? strokeWidth + 2 : strokeWidth}
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.2 + idx * 0.15, duration: 0.8, ease: 'easeOut' }}
                      style={arc.exceeded ? { filter: 'drop-shadow(0 0 6px #f87171)' } : {}}
                    />
                  ))}
                  {/* End dot for Life (mint) arc - changes color if exceeded or grey if untracked */}
                  <motion.circle
                    key={`dot-${selectedDate}`}
                    cx={arcs[1].endX}
                    cy={arcs[1].endY}
                    r="12"
                    fill={isUntrackedDay ? '#d1d5db' : (arcs[1].exceeded ? '#f87171' : '#86efac')}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isUntrackedDay ? (
                    <>
                      <span className="text-sm text-gray-400">
                        {locale === 'fr' ? 'Non' : 'Not'}
                      </span>
                      <span className="text-xl font-semibold text-gray-400">
                        {locale === 'fr' ? 'suivi' : 'tracked'}
                      </span>
                    </>
                  ) : (isWorkExceeded || isLifeExceeded || isSleepExceeded) ? (
                    <>
                      <span className="text-xs text-red-400 font-medium">
                        {locale === 'fr' ? 'Dépassé' : 'Over'}
                      </span>
                      <span className="text-lg font-semibold text-red-500">
                        {isWorkExceeded && (locale === 'fr' ? 'Travail' : 'Work')}
                        {isLifeExceeded && (locale === 'fr' ? 'Vie' : 'Life')}
                        {isSleepExceeded && (locale === 'fr' ? 'Sommeil' : 'Sleep')}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-400">
                        {formatDateDisplay(selectedDate)}
                      </span>
                      <span className="text-xl font-semibold text-gray-800">
                        {locale === 'fr' ? 'Équilibre' : 'Balance'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Day Confirmation Status / Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center mb-8"
            >
              {dayConfirmation.confirmed ? (
                // Day is confirmed - show confirmed badge
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">
                          {locale === 'fr' ? 'Modification en cours' : 'Making changes'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                        >
                          {dayConfirmation.feeling ? (
                            <span className="flex items-center gap-1">
                              {(() => {
                                const feeling = feelingOptions.find(f => f.id === dayConfirmation.feeling)
                                if (feeling) {
                                  const FeelingIcon = feeling.icon
                                  return <FeelingIcon className={`w-3 h-3 ${feeling.iconColor}`} />
                                }
                                return null
                              })()}
                              {locale === 'fr' ? 'Humeur' : 'Mood'}
                            </span>
                          ) : (locale === 'fr' ? 'Humeur' : 'Mood')}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1 text-xs font-medium text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors shadow-sm"
                        >
                          {locale === 'fr' ? 'Terminé' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium text-emerald-700">
                        {locale === 'fr' ? 'Confirmé' : 'Confirmed'}
                      </span>
                      {dayConfirmation.feeling && (() => {
                        const feeling = feelingOptions.find(f => f.id === dayConfirmation.feeling)
                        if (feeling) {
                          const FeelingIcon = feeling.icon
                          return <FeelingIcon className={`w-4 h-4 ${feeling.iconColor}`} />
                        }
                        return null
                      })()}
                      {canConfirmDate(selectedDate) && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="ml-1 text-xs text-emerald-600 underline hover:text-emerald-700"
                        >
                          {locale === 'fr' ? 'Modifier' : 'Edit'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : canConfirmDate(selectedDate) ? (
                // Not confirmed but can still confirm (today or yesterday)
                <motion.button
                  onClick={() => setShowConfirmModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium text-sm shadow-lg hover:bg-gray-800 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {locale === 'fr' ? 'Confirmer la journée' : 'Confirm Day'}
                </motion.button>
              ) : (
                // Older day not confirmed - show not tracked indicator
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
                  <X className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500">
                    {locale === 'fr' ? 'Journée non confirmée' : 'Day not confirmed'}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Category Cards - Show daily hours with activities */}
            <div className="space-y-4">
              {/* Sleep Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-2xl shadow-sm border overflow-hidden ${
                  isUntrackedDay ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUntrackedDay ? 'bg-gray-200' : 'bg-violet-100'
                      }`}>
                        <Moon className={`w-5 h-5 ${isUntrackedDay ? 'text-gray-400' : 'text-violet-500'}`} />
                      </div>
                      <div>
                        <span className={`font-medium ${isUntrackedDay ? 'text-gray-400' : 'text-gray-800'}`}>
                          {locale === 'fr' ? 'Sommeil' : 'Sleep'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {locale === 'fr' ? `Cible: ${effectiveTargets.sleep}h` : `Target: ${effectiveTargets.sleep}h`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustCategoryTime('sleep', -30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-violet-50 hover:bg-violet-100'
                        }`}
                      >
                        <Minus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-violet-500'}`} />
                      </button>
                      <span className={`text-2xl font-bold min-w-[80px] text-center ${isUntrackedDay ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatDailyTime(displayMinutes.sleep)}
                      </span>
                      <button
                        onClick={() => adjustCategoryTime('sleep', 30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-violet-50 hover:bg-violet-100'
                        }`}
                      >
                        <Plus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-violet-500'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expand/Collapse - hide for untracked days */}
                  {!isUntrackedDay && (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'sleep' ? null : 'sleep')}
                      className="w-full flex items-center justify-between py-2 text-sm text-gray-500"
                    >
                      <span>{getCategoryActivities('sleep').length} {locale === 'fr' ? 'activités' : 'activities'}</span>
                      {expandedCategory === 'sleep' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {expandedCategory === 'sleep' && !isUntrackedDay && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {/* Activities list */}
                        {getCategoryActivities('sleep').map(activity => (
                          <div key={activity.id} className="flex items-center justify-between bg-violet-50/50 rounded-xl p-3">
                            <span className="text-sm text-gray-700">{activity.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => adjustActivityTime(activity.id, -15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Minus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              <span className="text-sm font-medium text-gray-700 w-14 text-center">
                                {formatMinutes(activity.minutes)}
                              </span>
                              <button
                                onClick={() => adjustActivityTime(activity.id, 15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Plus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                                <button
                                  onClick={() => removeActivity(activity.id)}
                                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center ml-1"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add new activity - only show if not confirmed and can still confirm */}
                        {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={locale === 'fr' ? 'Nouvelle activité...' : 'New activity...'}
                              value={newActivityName}
                              onChange={(e) => setNewActivityName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addActivity('sleep', newActivityName)
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-violet-200"
                            />
                            <button
                              onClick={() => addActivity('sleep', newActivityName)}
                              className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Work Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`rounded-2xl shadow-sm border overflow-hidden ${
                  isUntrackedDay ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUntrackedDay ? 'bg-gray-200' : 'bg-amber-100'
                      }`}>
                        <Briefcase className={`w-5 h-5 ${isUntrackedDay ? 'text-gray-400' : 'text-amber-500'}`} />
                      </div>
                      <div>
                        <span className={`font-medium ${isUntrackedDay ? 'text-gray-400' : 'text-gray-800'}`}>
                          {locale === 'fr' ? 'Travail' : 'Work'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {locale === 'fr' ? `Cible: ${effectiveTargets.work}h` : `Target: ${effectiveTargets.work}h`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustCategoryTime('work', -30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <Minus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-amber-500'}`} />
                      </button>
                      <span className={`text-2xl font-bold min-w-[80px] text-center ${isUntrackedDay ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatDailyTime(displayMinutes.work)}
                      </span>
                      <button
                        onClick={() => adjustCategoryTime('work', 30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <Plus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-amber-500'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expand/Collapse - hide for untracked days */}
                  {!isUntrackedDay && (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'work' ? null : 'work')}
                      className="w-full flex items-center justify-between py-2 text-sm text-gray-500"
                    >
                      <span>{getCategoryActivities('work').length} {locale === 'fr' ? 'activités' : 'activities'}</span>
                      {expandedCategory === 'work' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {expandedCategory === 'work' && !isUntrackedDay && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {/* Activities list */}
                        {getCategoryActivities('work').map(activity => (
                          <div key={activity.id} className="flex items-center justify-between bg-amber-50/50 rounded-xl p-3">
                            <span className="text-sm text-gray-700">{activity.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => adjustActivityTime(activity.id, -15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Minus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              <span className="text-sm font-medium text-gray-700 w-14 text-center">
                                {formatMinutes(activity.minutes)}
                              </span>
                              <button
                                onClick={() => adjustActivityTime(activity.id, 15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Plus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                                <button
                                  onClick={() => removeActivity(activity.id)}
                                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center ml-1"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add new activity - only show if not confirmed and can still confirm */}
                        {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={locale === 'fr' ? 'Nouvelle activité...' : 'New activity...'}
                              value={newActivityName}
                              onChange={(e) => setNewActivityName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addActivity('work', newActivityName)
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-amber-200"
                            />
                            <button
                              onClick={() => addActivity('work', newActivityName)}
                              className="px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Life Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`rounded-2xl shadow-sm border overflow-hidden ${
                  isUntrackedDay ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isUntrackedDay ? 'bg-gray-200' : 'bg-emerald-100'
                      }`}>
                        <Heart className={`w-5 h-5 ${isUntrackedDay ? 'text-gray-400' : 'text-emerald-500'}`} />
                      </div>
                      <div>
                        <span className={`font-medium ${isUntrackedDay ? 'text-gray-400' : 'text-gray-800'}`}>
                          {locale === 'fr' ? 'Vie' : 'Life'}
                        </span>
                        <p className="text-xs text-gray-400">
                          {locale === 'fr' ? `Cible: ${effectiveTargets.life}h` : `Target: ${effectiveTargets.life}h`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustCategoryTime('life', -30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <Minus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-emerald-500'}`} />
                      </button>
                      <span className={`text-2xl font-bold min-w-[80px] text-center ${isUntrackedDay ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatDailyTime(displayMinutes.life)}
                      </span>
                      <button
                        onClick={() => adjustCategoryTime('life', 30)}
                        disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        <Plus className={`w-4 h-4 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-emerald-500'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expand/Collapse - hide for untracked days */}
                  {!isUntrackedDay && (
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'life' ? null : 'life')}
                      className="w-full flex items-center justify-between py-2 text-sm text-gray-500"
                    >
                      <span>{getCategoryActivities('life').length} {locale === 'fr' ? 'activités' : 'activities'}</span>
                      {expandedCategory === 'life' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {expandedCategory === 'life' && !isUntrackedDay && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-4 space-y-3">
                        {/* Activities list */}
                        {getCategoryActivities('life').map(activity => (
                          <div key={activity.id} className="flex items-center justify-between bg-emerald-50/50 rounded-xl p-3">
                            <span className="text-sm text-gray-700">{activity.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => adjustActivityTime(activity.id, -15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Minus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              <span className="text-sm font-medium text-gray-700 w-14 text-center">
                                {formatMinutes(activity.minutes)}
                              </span>
                              <button
                                onClick={() => adjustActivityTime(activity.id, 15)}
                                disabled={(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)}
                                className={`w-7 h-7 rounded-full border flex items-center justify-center ${
                                  (dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate)
                                    ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <Plus className={`w-3 h-3 ${(dayConfirmation.confirmed && !isEditing) || !canConfirmDate(selectedDate) ? 'text-gray-300' : 'text-gray-500'}`} />
                              </button>
                              {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                                <button
                                  onClick={() => removeActivity(activity.id)}
                                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center ml-1"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Add new activity - only show if not confirmed and can still confirm */}
                        {!dayConfirmation.confirmed && canConfirmDate(selectedDate) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={locale === 'fr' ? 'Nouvelle activité...' : 'New activity...'}
                              value={newActivityName}
                              onChange={(e) => setNewActivityName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addActivity('life', newActivityName)
                                }
                              }}
                              className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-lg border-0 focus:ring-2 focus:ring-emerald-200"
                            />
                            <button
                              onClick={() => addActivity('life', newActivityName)}
                              className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </>
        )}

        {activeTab === 'reflect' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Bloom Insights - Warm AI observation card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden bg-white rounded-3xl p-5 border border-gray-100"
            >
              {/* Decorative gradient blob */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-violet-200/30 to-purple-200/30 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      {locale === 'fr' ? 'Aperçu Bloom' : 'Bloom Insight'}
                    </span>
                    <p className="text-xs text-gray-400">
                      {locale === 'fr' ? 'Cette semaine' : 'This week'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-[15px]">
                  {(() => {
                    const totalSleep = weeklyData.reduce((sum, d) => sum + d.sleep, 0)
                    const totalWork = weeklyData.reduce((sum, d) => sum + d.work, 0)
                    const totalLife = weeklyData.reduce((sum, d) => sum + d.life, 0)
                    const avgSleep = totalSleep / Math.max(weeklyData.length, 1) / 60
                    const avgWork = totalWork / Math.max(weeklyData.length, 1) / 60
                    const avgLife = totalLife / Math.max(weeklyData.length, 1) / 60

                    if (avgSleep >= 7 && avgWork <= 9 && avgLife >= 2) {
                      return locale === 'fr'
                        ? "Vous avez trouvé un bel équilibre cette semaine. Votre rythme de sommeil est régulier et vous prenez du temps pour vous."
                        : "You've found a lovely balance this week. Your sleep rhythm is steady and you're making time for yourself."
                    } else if (avgWork > 10) {
                      return locale === 'fr'
                        ? "Cette semaine a été intense côté travail. N'oubliez pas de prendre soin de vous aussi."
                        : "This week has been work-heavy. Remember to take care of yourself too."
                    } else if (avgSleep < 6) {
                      return locale === 'fr'
                        ? "Votre sommeil mérite un peu plus d'attention. Le repos est la base de tout."
                        : "Your sleep could use some love. Rest is the foundation of everything."
                    } else if (avgLife < 1) {
                      return locale === 'fr'
                        ? "Vous avez été très occupé. Essayez de vous accorder quelques moments de détente."
                        : "You've been quite busy. Try to give yourself some moments of joy."
                    } else {
                      return locale === 'fr'
                        ? "Vous faites de votre mieux pour équilibrer les différentes facettes de votre vie."
                        : "You're doing your best to balance the different parts of your life."
                    }
                  })()}
                </p>
              </div>
            </motion.div>

            {/* Weekly Summary Cards */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-gray-800">
                  {locale === 'fr' ? 'Résumé de la semaine' : 'Weekly Summary'}
                </h3>
                <span className="text-xs text-gray-400">
                  {weeklyData.length > 0 && (() => {
                    const firstDate = new Date(weeklyData[0]?.date)
                    const lastDate = new Date(weeklyData[weeklyData.length - 1]?.date)
                    const formatDate = (d: Date) => d.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
                    return `${formatDate(firstDate)} - ${formatDate(lastDate)}`
                  })()}
                </span>
              </div>

              <div className="space-y-3">
                {/* Sleep Card */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-violet-50 rounded-3xl p-4 border border-violet-100/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Moon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">{locale === 'fr' ? 'Sommeil' : 'Sleep'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          (() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.sleep, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.sleep || 8
                            const ratio = avg / target
                            if (ratio >= 0.9) return 'bg-emerald-100 text-emerald-700'
                            if (ratio >= 0.7) return 'bg-amber-100 text-amber-700'
                            return 'bg-rose-100 text-rose-700'
                          })()
                        }`}>
                          {(() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.sleep, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.sleep || 8
                            const ratio = avg / target
                            if (ratio >= 0.9) return locale === 'fr' ? 'Bien reposé' : 'Well rested'
                            if (ratio >= 0.7) return locale === 'fr' ? 'À améliorer' : 'Room to grow'
                            return locale === 'fr' ? 'Besoin de repos' : 'Needs attention'
                          })()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const avg = weeklyData.reduce((sum, d) => sum + d.sleep, 0) / Math.max(weeklyData.length, 1) / 60
                          const target = targetHours.sleep || 8
                          return locale === 'fr'
                            ? `${avg.toFixed(1)}h en moyenne • Objectif: ${target}h`
                            : `${avg.toFixed(1)}h average • Goal: ${target}h`
                        })()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Work Card */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-amber-50 rounded-3xl p-4 border border-amber-100/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">{locale === 'fr' ? 'Travail' : 'Work'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          (() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.work, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.work || 8
                            const ratio = avg / target
                            if (ratio >= 0.9 && ratio <= 1.1) return 'bg-emerald-100 text-emerald-700'
                            if (ratio > 1.1) return 'bg-rose-100 text-rose-700'
                            return 'bg-amber-100 text-amber-700'
                          })()
                        }`}>
                          {(() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.work, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.work || 8
                            const ratio = avg / target
                            if (ratio >= 0.9 && ratio <= 1.1) return locale === 'fr' ? 'Équilibré' : 'Balanced'
                            if (ratio > 1.1) return locale === 'fr' ? 'Surcharge' : 'Overworking'
                            return locale === 'fr' ? 'Sous objectif' : 'Under target'
                          })()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const avg = weeklyData.reduce((sum, d) => sum + d.work, 0) / Math.max(weeklyData.length, 1) / 60
                          const target = targetHours.work || 8
                          return locale === 'fr'
                            ? `${avg.toFixed(1)}h en moyenne • Objectif: ${target}h`
                            : `${avg.toFixed(1)}h average • Goal: ${target}h`
                        })()}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Life Card */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800">{locale === 'fr' ? 'Vie perso' : 'Life'}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          (() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.life, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.life || 8
                            const ratio = avg / target
                            if (ratio >= 0.8) return 'bg-emerald-100 text-emerald-700'
                            if (ratio >= 0.5) return 'bg-amber-100 text-amber-700'
                            return 'bg-rose-100 text-rose-700'
                          })()
                        }`}>
                          {(() => {
                            const avg = weeklyData.reduce((sum, d) => sum + d.life, 0) / Math.max(weeklyData.length, 1) / 60
                            const target = targetHours.life || 8
                            const ratio = avg / target
                            if (ratio >= 0.8) return locale === 'fr' ? 'Épanoui' : 'Thriving'
                            if (ratio >= 0.5) return locale === 'fr' ? 'En progrès' : 'Growing'
                            return locale === 'fr' ? 'À cultiver' : 'Needs love'
                          })()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const avg = weeklyData.reduce((sum, d) => sum + d.life, 0) / Math.max(weeklyData.length, 1) / 60
                          const target = targetHours.life || 8
                          return locale === 'fr'
                            ? `${avg.toFixed(1)}h en moyenne • Objectif: ${target}h`
                            : `${avg.toFixed(1)}h average • Goal: ${target}h`
                        })()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Gentle encouragement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-5 border border-gray-100 text-center"
            >
              <p className="text-sm text-gray-500 italic leading-relaxed">
                {locale === 'fr'
                  ? '"Chaque jour est une nouvelle chance de trouver ton équilibre."'
                  : '"Every day is a new chance to find your balance."'}
              </p>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'trends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {loadingWeekly ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Daily Performance - Activity Rings */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {locale === 'fr' ? 'Performance quotidienne' : 'Daily Performance'}
                    </h3>
                    {/* Legend */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span className="text-[9px] text-gray-500">{locale === 'fr' ? 'Som.' : 'Sleep'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-[9px] text-gray-500">{locale === 'fr' ? 'Trav.' : 'Work'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-gray-500">{locale === 'fr' ? 'Vie' : 'Life'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Rings Grid */}
                  <div className="flex items-center justify-between py-2">
                    {weeklyData.map((day, dayIndex) => {
                      const isToday = day.date === getTodayStr()
                      const sleepPercent = day.sleepTarget > 0 ? (day.sleep / day.sleepTarget) * 100 : 0
                      const workPercent = day.workTarget > 0 ? (day.work / day.workTarget) * 100 : 0
                      const lifePercent = day.lifeTarget > 0 ? (day.life / day.lifeTarget) * 100 : 0

                      // Check if overworked - only work being over is a problem
                      // Sleep and life being over target is generally okay
                      const workOver = workPercent > 105
                      const hasOverwork = workOver
                      const allComplete = sleepPercent >= 95 && workPercent >= 95 && workPercent <= 105 && lifePercent >= 95

                      // Ring properties - compact for mobile fit
                      const size = 36
                      const strokeWidth = 3
                      const radius1 = 14 // Sleep (outer)
                      const radius2 = 10 // Work (middle)
                      const radius3 = 5.5  // Life (inner)
                      const circumference1 = 2 * Math.PI * radius1
                      const circumference2 = 2 * Math.PI * radius2
                      const circumference3 = 2 * Math.PI * radius3

                      return (
                        <div key={day.date} className="flex flex-col items-center">
                          {/* Ring Chart */}
                          <div className={`relative p-1 rounded-full ${isToday ? 'bg-emerald-50' : ''}`}>
                            <svg width={size} height={size} className="transform -rotate-90">
                              {/* Background rings */}
                              <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius1}
                                fill="none"
                                stroke="#f3f4f6"
                                strokeWidth={strokeWidth}
                              />
                              <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius2}
                                fill="none"
                                stroke="#f3f4f6"
                                strokeWidth={strokeWidth}
                              />
                              <circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius3}
                                fill="none"
                                stroke="#f3f4f6"
                                strokeWidth={strokeWidth}
                              />

                              {/* Sleep ring (outer) - stays violet even if over (more sleep is good) */}
                              <motion.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius1}
                                fill="none"
                                stroke="#8b5cf6"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference1}
                                initial={{ strokeDashoffset: circumference1 }}
                                animate={{
                                  strokeDashoffset: circumference1 - (circumference1 * Math.min(sleepPercent, 100)) / 100
                                }}
                                transition={{ duration: 0.8, delay: dayIndex * 0.05, ease: "easeOut" }}
                              />

                              {/* Work ring (middle) - turns red if overworked */}
                              <motion.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius2}
                                fill="none"
                                stroke={workOver ? '#f43f5e' : '#f59e0b'}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference2}
                                initial={{ strokeDashoffset: circumference2 }}
                                animate={{
                                  strokeDashoffset: circumference2 - (circumference2 * Math.min(workPercent, 100)) / 100
                                }}
                                transition={{ duration: 0.8, delay: dayIndex * 0.05 + 0.1, ease: "easeOut" }}
                              />

                              {/* Life ring (inner) - stays green even if over (more life is good) */}
                              <motion.circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius3}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference3}
                                initial={{ strokeDashoffset: circumference3 }}
                                animate={{
                                  strokeDashoffset: circumference3 - (circumference3 * Math.min(lifePercent, 100)) / 100
                                }}
                                transition={{ duration: 0.8, delay: dayIndex * 0.05 + 0.2, ease: "easeOut" }}
                              />
                            </svg>

                            {/* Overwork indicator - only for work exceeding target */}
                            {hasOverwork && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-rose-500 rounded-full flex items-center justify-center"
                              >
                                <span className="text-[8px] text-white font-bold">!</span>
                              </motion.div>
                            )}

                            {/* Complete checkmark */}
                            {allComplete && !hasOverwork && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center"
                              >
                                <CheckCircle2 className="w-2 h-2 text-white" />
                              </motion.div>
                            )}
                          </div>

                          {/* Day label */}
                          <span className={`text-[11px] mt-1.5 font-medium ${
                            hasOverwork
                              ? 'text-rose-600'
                              : isToday
                                ? 'text-emerald-600'
                                : day.confirmed
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                          }`}>
                            {day.dayName.slice(0, 2)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary text */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{locale === 'fr' ? 'Complet' : 'Complete'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>{locale === 'fr' ? 'Dépassé' : 'Over'}</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Insights - This Week */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800 px-1">
                    {locale === 'fr' ? 'Cette semaine' : 'This Week'}
                  </h3>

                  {/* Sleep Insight */}
                  <div className="bg-violet-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                        <Moon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-violet-700">
                            {Math.round(weeklyData.reduce((sum, d) => sum + d.sleep, 0) / 60)}h
                          </span>
                          <span className="text-sm text-violet-500">
                            / {Math.round(weeklyData.reduce((sum, d) => sum + d.sleepTarget, 0) / 60)}h
                          </span>
                        </div>
                        <p className="text-xs text-violet-600 mt-0.5">
                          {(() => {
                            const actual = weeklyData.reduce((sum, d) => sum + d.sleep, 0)
                            const target = weeklyData.reduce((sum, d) => sum + d.sleepTarget, 0)
                            const diff = Math.round((actual - target) / 60)
                            if (diff >= 0) return locale === 'fr' ? `+${diff}h de sommeil` : `+${diff}h sleep`
                            return locale === 'fr' ? `${diff}h de sommeil` : `${diff}h sleep`
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Work Insight */}
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-amber-700">
                            {Math.round(weeklyData.reduce((sum, d) => sum + d.work, 0) / 60)}h
                          </span>
                          <span className="text-sm text-amber-500">
                            / {Math.round(weeklyData.reduce((sum, d) => sum + d.workTarget, 0) / 60)}h
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {(() => {
                            const actual = weeklyData.reduce((sum, d) => sum + d.work, 0)
                            const target = weeklyData.reduce((sum, d) => sum + d.workTarget, 0)
                            const diff = Math.round((actual - target) / 60)
                            if (diff > 0) return locale === 'fr' ? `+${diff}h de travail` : `+${diff}h work`
                            if (diff < 0) return locale === 'fr' ? `${diff}h de travail` : `${diff}h work`
                            return locale === 'fr' ? 'Objectif atteint' : 'On target'
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Life Insight */}
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-emerald-700">
                            {Math.round(weeklyData.reduce((sum, d) => sum + d.life, 0) / 60)}h
                          </span>
                          <span className="text-sm text-emerald-500">
                            / {Math.round(weeklyData.reduce((sum, d) => sum + d.lifeTarget, 0) / 60)}h
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          {(() => {
                            const actual = weeklyData.reduce((sum, d) => sum + d.life, 0)
                            const target = weeklyData.reduce((sum, d) => sum + d.lifeTarget, 0)
                            const diff = Math.round((actual - target) / 60)
                            if (diff >= 0) return locale === 'fr' ? `+${diff}h de vie` : `+${diff}h life`
                            return locale === 'fr' ? `${diff}h de vie` : `${diff}h life`
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Historical Trends Line Chart */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">
                      {locale === 'fr' ? 'Tendances' : 'Trends'}
                    </h3>

                    {/* Time Range Selector */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                      {[
                        { id: 'weekly' as TimeRange, labelEn: '6D', labelFr: '6J' },
                        { id: 'monthly' as TimeRange, labelEn: '30D', labelFr: '30J' },
                        { id: 'custom' as TimeRange, labelEn: 'Custom', labelFr: 'Perso.' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleTimeRangeChange(option.id)}
                          className={`py-1 px-2.5 rounded-md text-xs font-medium transition-all ${
                            trendsTimeRange === option.id
                              ? 'bg-white shadow-sm text-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {locale === 'fr' ? option.labelFr : option.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Toggle Buttons */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setVisibleLines(prev => ({ ...prev, sleep: !prev.sleep }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        visibleLines.sleep
                          ? 'bg-violet-100 text-violet-700 border-2 border-violet-300'
                          : 'bg-gray-100 text-gray-400 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${visibleLines.sleep ? 'bg-violet-500' : 'bg-gray-300'}`} />
                      {locale === 'fr' ? 'Sommeil' : 'Sleep'}
                    </button>
                    <button
                      onClick={() => setVisibleLines(prev => ({ ...prev, work: !prev.work }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        visibleLines.work
                          ? 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                          : 'bg-gray-100 text-gray-400 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${visibleLines.work ? 'bg-amber-500' : 'bg-gray-300'}`} />
                      {locale === 'fr' ? 'Travail' : 'Work'}
                    </button>
                    <button
                      onClick={() => setVisibleLines(prev => ({ ...prev, life: !prev.life }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        visibleLines.life
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                          : 'bg-gray-100 text-gray-400 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${visibleLines.life ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      {locale === 'fr' ? 'Vie' : 'Life'}
                    </button>
                  </div>

                  {/* Chart */}
                  {chartData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="dateLabel"
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                            interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickFormatter={(value) => `${value}h`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              fontSize: '12px',
                            }}
                            formatter={(value, name) => [
                              `${(value as number)?.toFixed(1) ?? 0}h`,
                              name === 'sleep' ? (locale === 'fr' ? 'Sommeil' : 'Sleep') :
                              name === 'work' ? (locale === 'fr' ? 'Travail' : 'Work') :
                              (locale === 'fr' ? 'Vie' : 'Life')
                            ]}
                          />
                          {visibleLines.sleep && (
                            <Line
                              type="monotone"
                              dataKey="sleep"
                              name="sleep"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 5, fill: '#8b5cf6' }}
                            />
                          )}
                          {visibleLines.work && (
                            <Line
                              type="monotone"
                              dataKey="work"
                              name="work"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              dot={{ fill: '#f59e0b', strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 5, fill: '#f59e0b' }}
                            />
                          )}
                          {visibleLines.life && (
                            <Line
                              type="monotone"
                              dataKey="life"
                              name="life"
                              stroke="#10b981"
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                              activeDot={{ r: 5, fill: '#10b981' }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                      {loadingWeekly ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        locale === 'fr' ? 'Aucune donnée disponible' : 'No data available'
                      )}
                    </div>
                  )}
                </div>

              </>
            )}
          </motion.div>
        )}
      </div>
    </MemberLayout>
  )
}

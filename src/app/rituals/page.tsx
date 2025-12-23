'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Circle,
  Sun,
  Moon,
  Coffee,
  Heart,
  ChevronDown,
  Check,
  Plus,
  X,
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
  Flame,
  Clock,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  History,
  Calendar,
  MessageSquare,
  Pencil,
  Trash2,
  MoreVertical,
  Laugh,
  SmilePlus,
  Meh,
  Frown,
  Angry,
} from 'lucide-react'
import MemberLayout from '@/components/member/MemberLayout'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'

// Icon mapping for rituals
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
type TrackingType = 'checkbox' | 'duration' | 'streak'

interface Ritual {
  id: string
  name: string
  name_fr: string
  description: string | null
  description_fr: string | null
  benefit: string | null
  benefit_fr: string | null
  category: RitualCategory
  icon: string | null
  duration_suggestion: number | null
  is_predefined: boolean
}

interface MemberRitual {
  id: string
  ritual_id: string
  tracking_type: TrackingType
  is_active: boolean
  planned_time: string | null  // HH:MM format
  ritual: Ritual
}

interface RitualCompletion {
  id: string
  ritual_id: string
  completion_date: string
  completed: boolean
  duration_minutes: number | null
  notes: string | null
  mood: string | null
}

const ritualCategories = [
  {
    id: 'morning' as RitualCategory,
    icon: Sun,
    titleEn: 'Morning',
    titleFr: 'Matin',
    descEn: 'Start your day mindfully',
    descFr: 'Commencez votre journée en pleine conscience',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    border: 'border-gray-100',
    activeBg: 'bg-amber-50',
  },
  {
    id: 'midday' as RitualCategory,
    icon: Coffee,
    titleEn: 'Midday',
    titleFr: 'Midi',
    descEn: 'Reset and recharge',
    descFr: 'Rechargez vos batteries',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    border: 'border-gray-100',
    activeBg: 'bg-emerald-50',
  },
  {
    id: 'evening' as RitualCategory,
    icon: Moon,
    titleEn: 'Evening',
    titleFr: 'Soir',
    descEn: 'Wind down peacefully',
    descFr: 'Détendez-vous paisiblement',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    border: 'border-gray-100',
    activeBg: 'bg-indigo-50',
  },
  {
    id: 'selfcare' as RitualCategory,
    icon: Heart,
    titleEn: 'Self-Care',
    titleFr: 'Bien-être',
    descEn: 'Nurture yourself',
    descFr: 'Prenez soin de vous',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    iconBg: 'bg-rose-100',
    border: 'border-gray-100',
    activeBg: 'bg-rose-50',
  },
]

// Get today's date string in YYYY-MM-DD format
function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function RitualsPage() {
  const { locale } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<RitualCategory | null>(null)
  const [allRituals, setAllRituals] = useState<Ritual[]>([])
  const [memberRituals, setMemberRituals] = useState<MemberRitual[]>([])
  const [completions, setCompletions] = useState<RitualCompletion[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingToCategory, setAddingToCategory] = useState<RitualCategory | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customRitual, setCustomRitual] = useState({ name: '', description: '', time: '08:00', hasDuration: false, duration: 5, icon: 'heart' })

  // Available icons for custom rituals
  const availableIcons = [
    { id: 'heart', icon: Heart },
    { id: 'sun', icon: Sun },
    { id: 'moon', icon: Moon },
    { id: 'coffee', icon: Coffee },
    { id: 'eye', icon: Eye },
    { id: 'sprout', icon: Sprout },
    { id: 'music', icon: Music },
    { id: 'cloud', icon: Cloud },
    { id: 'stars', icon: Stars },
    { id: 'smile', icon: Smile },
    { id: 'shield', icon: Shield },
    { id: 'gift', icon: Gift },
    { id: 'hand', icon: Hand },
    { id: 'mail', icon: Mail },
    { id: 'sofa', icon: Sofa },
  ]
  const [editingRitual, setEditingRitual] = useState<{ id: string, memberRitualId: string, name: string, description: string, time: string, hasDuration: boolean, duration: number, icon: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ ritualId: string, memberRitualId: string, name: string } | null>(null)
  const [menuRitual, setMenuRitual] = useState<MemberRitual | null>(null)

  // Time selection for adding rituals
  const [selectedRitualToAdd, setSelectedRitualToAdd] = useState<Ritual | null>(null)
  const [selectedTime, setSelectedTime] = useState('08:00')

  // Do Ritual Modal state
  const [activeRitual, setActiveRitual] = useState<MemberRitual | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [ritualNotes, setRitualNotes] = useState('')
  const [ritualMood, setRitualMood] = useState<string | null>(null)
  const [showCompletionFlow, setShowCompletionFlow] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Mood options with Lucide icons
  const moodOptions = [
    { value: 'great', icon: Laugh, label: locale === 'fr' ? 'Super' : 'Great', color: 'text-emerald-500', bg: 'bg-emerald-100' },
    { value: 'good', icon: SmilePlus, label: locale === 'fr' ? 'Bien' : 'Good', color: 'text-green-500', bg: 'bg-green-100' },
    { value: 'okay', icon: Meh, label: locale === 'fr' ? 'Okay' : 'Okay', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { value: 'low', icon: Frown, label: locale === 'fr' ? 'Bas' : 'Low', color: 'text-orange-500', bg: 'bg-orange-100' },
    { value: 'difficult', icon: Angry, label: locale === 'fr' ? 'Difficile' : 'Difficult', color: 'text-red-500', bg: 'bg-red-100' },
  ]

  // Personalized reflection prompts for each mood (5 options each)
  const moodPrompts: Record<string, { en: string[], fr: string[] }> = {
    great: {
      en: [
        "✨ Amazing! What made this moment special?",
        "🌟 You're glowing! What sparked this joy?",
        "💫 Wonderful! What are you grateful for right now?",
        "🎉 Love this energy! What would you like to remember?",
        "☀️ Beautiful! How can you carry this feeling forward?",
      ],
      fr: [
        "✨ Magnifique! Qu'est-ce qui a rendu ce moment spécial?",
        "🌟 Vous rayonnez! Qu'est-ce qui a déclenché cette joie?",
        "💫 Merveilleux! De quoi êtes-vous reconnaissant(e)?",
        "🎉 J'adore cette énergie! Que voulez-vous retenir?",
        "☀️ Beau moment! Comment garder ce sentiment?",
      ],
    },
    good: {
      en: [
        "🌿 What felt good about this?",
        "🌱 Nice work! What's one thing you noticed?",
        "💚 Lovely! What helped you get here?",
        "🍃 Well done! Any insights to capture?",
        "🌻 Great effort! What are you proud of?",
      ],
      fr: [
        "🌿 Qu'est-ce qui vous a fait du bien?",
        "🌱 Bien joué! Qu'avez-vous remarqué?",
        "💚 Super! Qu'est-ce qui vous a aidé?",
        "🍃 Bravo! Des réflexions à noter?",
        "🌻 Bel effort! De quoi êtes-vous fier(e)?",
      ],
    },
    okay: {
      en: [
        "💭 Anything you'd like to capture?",
        "🌤️ You showed up - that matters. Any thoughts?",
        "💬 Sometimes okay is enough. What's on your mind?",
        "🤔 What would make tomorrow even better?",
        "📝 Any reflections from this moment?",
      ],
      fr: [
        "💭 Y a-t-il quelque chose à noter?",
        "🌤️ Vous avez fait l'effort - c'est important. Des pensées?",
        "💬 Parfois 'okay' suffit. Qu'avez-vous en tête?",
        "🤔 Qu'est-ce qui rendrait demain meilleur?",
        "📝 Des réflexions sur ce moment?",
      ],
    },
    low: {
      en: [
        "🤗 What would help you right now?",
        "💙 It's okay to feel this way. What do you need?",
        "🫂 You're not alone. What's weighing on you?",
        "🌧️ Tough moments pass. What would feel supportive?",
        "💜 Be gentle with yourself. What's one small comfort?",
      ],
      fr: [
        "🤗 Qu'est-ce qui vous aiderait maintenant?",
        "💙 C'est normal de se sentir ainsi. De quoi avez-vous besoin?",
        "🫂 Vous n'êtes pas seul(e). Qu'est-ce qui pèse sur vous?",
        "🌧️ Les moments difficiles passent. Qu'est-ce qui vous soutiendrait?",
        "💜 Soyez doux avec vous-même. Un petit réconfort?",
      ],
    },
    difficult: {
      en: [
        "💙 It takes courage to show up. What's on your heart?",
        "🌊 Let it out - this is your safe space. How are you really?",
        "💪 You're stronger than you know. What do you need to release?",
        "🕊️ Hard days happen. What would feel healing right now?",
        "❤️‍🩹 Your feelings are valid. What would you tell a friend?",
      ],
      fr: [
        "💙 Il faut du courage pour continuer. Que ressentez-vous?",
        "🌊 Laissez sortir - c'est votre espace sûr. Comment allez-vous vraiment?",
        "💪 Vous êtes plus fort(e) que vous pensez. Que devez-vous libérer?",
        "🕊️ Les jours difficiles arrivent. Qu'est-ce qui vous guérirait?",
        "❤️‍🩹 Vos sentiments sont valides. Que diriez-vous à un ami?",
      ],
    },
  }

  // Get random prompt for current mood
  const getRandomPrompt = (mood: string) => {
    const prompts = moodPrompts[mood]?.[locale === 'fr' ? 'fr' : 'en'] || []
    return prompts[Math.floor(Math.random() * prompts.length)] || ''
  }

  // Store the random prompt when mood changes
  const [currentPrompt, setCurrentPrompt] = useState('')

  // History Modal state (single ritual)
  const [historyRitual, setHistoryRitual] = useState<MemberRitual | null>(null)
  const [ritualHistory, setRitualHistory] = useState<RitualCompletion[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const todayStr = getTodayStr()

  // Timer effect - counts down to 0, then counts up (negative = overtime)
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerRunning, timerSeconds])

  // Open ritual modal
  const openRitualModal = (mr: MemberRitual) => {
    setActiveRitual(mr)
    setTimerSeconds((mr.ritual.duration_suggestion || 1) * 60)
    setTimerRunning(false)
    setRitualNotes('')
    setRitualMood(null)
    setCurrentPrompt('')
    setShowCompletionFlow(false)
  }

  // Close ritual modal
  const closeRitualModal = () => {
    setActiveRitual(null)
    setTimerRunning(false)
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  // Format timer display - handles overtime (negative seconds)
  const formatTime = (seconds: number) => {
    if (seconds < 0) {
      // Overtime - show as +M:SS
      const absSeconds = Math.abs(seconds)
      const mins = Math.floor(absSeconds / 60)
      const secs = absSeconds % 60
      return `+${mins}:${secs.toString().padStart(2, '0')}`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Open history modal for a ritual
  const openHistoryModal = async (mr: MemberRitual) => {
    if (!memberId) return
    setHistoryRitual(mr)
    setLoadingHistory(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('ritual_completions')
      .select('*')
      .eq('member_id', memberId)
      .eq('ritual_id', mr.ritual_id)
      .order('completion_date', { ascending: false })
      .limit(30)

    if (data) {
      setRitualHistory(data)
    }
    setLoadingHistory(false)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === todayStr) {
      return locale === 'fr' ? "Aujourd'hui" : 'Today'
    }
    if (dateStr === `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`) {
      return locale === 'fr' ? 'Hier' : 'Yesterday'
    }

    return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Complete ritual with notes and mood
  const completeRitualWithNotes = async () => {
    if (!activeRitual || !memberId) return
    setSaving(true)

    const supabase = createClient()
    const existing = completions.find(c => c.ritual_id === activeRitual.ritual_id)
    const durationUsed = activeRitual.ritual.duration_suggestion
      ? (activeRitual.ritual.duration_suggestion * 60 - timerSeconds) / 60
      : null

    try {
      if (existing) {
        const { error } = await supabase
          .from('ritual_completions')
          .update({
            completed: true,
            notes: ritualNotes || null,
            mood: ritualMood,
            duration_minutes: durationUsed ? Math.round(durationUsed) : null
          })
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating ritual completion:', error)
        } else {
          setCompletions(prev =>
            prev.map(c => c.id === existing.id
              ? { ...c, completed: true, notes: ritualNotes || null, mood: ritualMood, duration_minutes: durationUsed ? Math.round(durationUsed) : null }
              : c
            )
          )
        }
      } else {
        const { data, error } = await supabase
          .from('ritual_completions')
          .insert({
            member_id: memberId,
            ritual_id: activeRitual.ritual_id,
            completion_date: todayStr,
            completed: true,
            notes: ritualNotes || null,
            mood: ritualMood,
            duration_minutes: durationUsed ? Math.round(durationUsed) : null
          })
          .select()
          .single()

        if (error) {
          console.error('Error inserting ritual completion:', error)
        } else if (data) {
          setCompletions(prev => [...prev, data])
        }
      }
    } catch (err) {
      console.error('Exception in completeRitualWithNotes:', err)
    }

    setSaving(false)
    closeRitualModal()
  }

  // Fetch data on mount
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get member
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

      // Fetch all available rituals (predefined + user's custom)
      const { data: rituals } = await supabase
        .from('rituals')
        .select('*')
        .or(`is_predefined.eq.true,created_by.eq.${member.id}`)
        .order('category')

      if (rituals) {
        setAllRituals(rituals)
      }

      // Fetch member's enabled rituals
      const { data: memberRitualsData } = await supabase
        .from('member_rituals')
        .select(`
          id,
          ritual_id,
          tracking_type,
          is_active,
          planned_time,
          ritual:rituals(*)
        `)
        .eq('member_id', member.id)
        .eq('is_active', true)
        .order('planned_time', { ascending: true, nullsFirst: false })

      if (memberRitualsData) {
        // Sort by planned_time for display
        const sorted = [...memberRitualsData].sort((a, b) => {
          if (!a.planned_time) return 1
          if (!b.planned_time) return -1
          return a.planned_time.localeCompare(b.planned_time)
        })
        setMemberRituals(sorted as unknown as MemberRitual[])
      }

      // Fetch today's completions
      const { data: completionsData } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('member_id', member.id)
        .eq('completion_date', todayStr)

      if (completionsData) {
        setCompletions(completionsData)
      }

      setLoading(false)
    }

    fetchData()
  }, [todayStr])

  // Get rituals for a category
  const getRitualsForCategory = (category: RitualCategory) => {
    return memberRituals.filter(mr => mr.ritual.category === category)
  }

  // Get available rituals to add (not yet enabled)
  const getAvailableRituals = (category: RitualCategory) => {
    const enabledIds = memberRituals.map(mr => mr.ritual_id)
    return allRituals.filter(r => r.category === category && !enabledIds.includes(r.id))
  }

  // Check if ritual is completed today
  const isCompletedToday = (ritualId: string) => {
    return completions.some(c => c.ritual_id === ritualId && c.completed)
  }

  // Get completion count for category
  const getCategoryProgress = (category: RitualCategory) => {
    const categoryRituals = getRitualsForCategory(category)
    const completed = categoryRituals.filter(mr => isCompletedToday(mr.ritual_id)).length
    return { completed, total: categoryRituals.length }
  }

  // Toggle ritual completion
  const toggleCompletion = async (ritualId: string) => {
    if (!memberId || saving) return
    setSaving(true)

    const supabase = createClient()
    const existing = completions.find(c => c.ritual_id === ritualId)

    if (existing) {
      // Toggle existing completion
      const newCompleted = !existing.completed
      const { error } = await supabase
        .from('ritual_completions')
        .update({ completed: newCompleted })
        .eq('id', existing.id)

      if (!error) {
        setCompletions(prev =>
          prev.map(c => c.id === existing.id ? { ...c, completed: newCompleted } : c)
        )
      }
    } else {
      // Create new completion
      const { data, error } = await supabase
        .from('ritual_completions')
        .insert({
          member_id: memberId,
          ritual_id: ritualId,
          completion_date: todayStr,
          completed: true,
        })
        .select()
        .single()

      if (!error && data) {
        setCompletions(prev => [...prev, data])
      }
    }

    setSaving(false)
  }

  // Add ritual to member's list with planned time
  const addRitual = async (ritualId: string, plannedTime: string) => {
    if (!memberId || saving) return
    setSaving(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('member_rituals')
      .insert({
        member_id: memberId,
        ritual_id: ritualId,
        tracking_type: 'checkbox',
        is_active: true,
        planned_time: plannedTime,
      })
      .select(`
        id,
        ritual_id,
        tracking_type,
        is_active,
        planned_time,
        ritual:rituals(*)
      `)
      .single()

    if (!error && data) {
      setMemberRituals(prev => [...prev, data as unknown as MemberRitual].sort((a, b) => {
        if (!a.planned_time) return 1
        if (!b.planned_time) return -1
        return a.planned_time.localeCompare(b.planned_time)
      }))
    }

    setSaving(false)
    setShowAddModal(false)
    setSelectedRitualToAdd(null)
    setSelectedTime('08:00')
  }

  // Remove ritual from member's list (soft delete for historical tracking)
  const removeRitual = async (memberRitualId: string) => {
    if (!memberId || saving) return
    setSaving(true)

    const supabase = createClient()

    // Soft delete - mark as inactive with removal timestamp
    const { error } = await supabase
      .from('member_rituals')
      .update({
        is_active: false,
        removed_at: new Date().toISOString()
      })
      .eq('id', memberRitualId)

    if (!error) {
      setMemberRituals(prev => prev.filter(mr => mr.id !== memberRitualId))
    }

    setSaving(false)
  }

  // Delete custom ritual permanently
  const deleteCustomRitual = async () => {
    if (!memberId || !showDeleteConfirm || saving) return
    setSaving(true)

    const supabase = createClient()
    const { ritualId, memberRitualId } = showDeleteConfirm

    // Soft delete from member_rituals for history tracking
    await supabase
      .from('member_rituals')
      .update({
        is_active: false,
        removed_at: new Date().toISOString()
      })
      .eq('id', memberRitualId)

    // Then delete the ritual itself (permanent since it's custom)
    const { error } = await supabase
      .from('rituals')
      .delete()
      .eq('id', ritualId)
      .eq('is_predefined', false)
      .eq('created_by', memberId)

    if (!error) {
      setMemberRituals(prev => prev.filter(mr => mr.id !== memberRitualId))
      setAllRituals(prev => prev.filter(r => r.id !== ritualId))
    }

    setShowDeleteConfirm(null)
    setSaving(false)
  }

  // Update custom ritual
  const updateCustomRitual = async () => {
    if (!memberId || !editingRitual || !editingRitual.name.trim() || saving) return
    setSaving(true)

    const supabase = createClient()

    // Update the ritual
    const { error: ritualError } = await supabase
      .from('rituals')
      .update({
        name: editingRitual.name,
        name_fr: editingRitual.name,
        description: editingRitual.description || null,
        description_fr: editingRitual.description || null,
        icon: editingRitual.icon,
        duration_suggestion: editingRitual.hasDuration ? editingRitual.duration : null,
      })
      .eq('id', editingRitual.id)
      .eq('is_predefined', false)
      .eq('created_by', memberId)

    if (!ritualError) {
      // Update time in member_rituals
      await supabase
        .from('member_rituals')
        .update({ planned_time: editingRitual.time })
        .eq('id', editingRitual.memberRitualId)

      // Refresh data
      const { data: updatedRituals } = await supabase
        .from('rituals')
        .select('*')
        .or(`is_predefined.eq.true,created_by.eq.${memberId}`)

      if (updatedRituals) setAllRituals(updatedRituals)

      const { data: updatedMemberRituals } = await supabase
        .from('member_rituals')
        .select('*, ritual:rituals(*)')
        .eq('member_id', memberId)
        .eq('is_active', true)

      if (updatedMemberRituals) setMemberRituals(updatedMemberRituals as MemberRitual[])
    }

    setEditingRitual(null)
    setSaving(false)
  }

  // Create custom ritual
  const createCustomRitual = async () => {
    if (!memberId || !addingToCategory || !customRitual.name.trim() || saving) return
    setSaving(true)

    const supabase = createClient()

    // Create the ritual
    const { data: newRitual, error: ritualError } = await supabase
      .from('rituals')
      .insert({
        name: customRitual.name,
        name_fr: customRitual.name, // User can edit later
        description: customRitual.description || null,
        description_fr: customRitual.description || null,
        category: addingToCategory,
        icon: customRitual.icon,
        is_predefined: false,
        created_by: memberId,
        duration_suggestion: customRitual.hasDuration ? customRitual.duration : null,
      })
      .select()
      .single()

    if (ritualError || !newRitual) {
      setSaving(false)
      return
    }

    // Add to allRituals
    setAllRituals(prev => [...prev, newRitual])

    // Enable it for the member with planned time
    const { data: memberRitual, error: mrError } = await supabase
      .from('member_rituals')
      .insert({
        member_id: memberId,
        ritual_id: newRitual.id,
        tracking_type: 'checkbox',
        is_active: true,
        planned_time: customRitual.time,
      })
      .select(`
        id,
        ritual_id,
        tracking_type,
        is_active,
        planned_time,
        ritual:rituals(*)
      `)
      .single()

    if (!mrError && memberRitual) {
      setMemberRituals(prev => [...prev, memberRitual as unknown as MemberRitual].sort((a, b) => {
        if (!a.planned_time) return 1
        if (!b.planned_time) return -1
        return a.planned_time.localeCompare(b.planned_time)
      }))
    }

    setCustomRitual({ name: '', description: '', time: '08:00', hasDuration: false, duration: 5, icon: 'heart' })
    setShowCustomModal(false)
    setSaving(false)
  }

  // Calculate total progress
  const totalProgress = ritualCategories.reduce(
    (acc, cat) => {
      const progress = getCategoryProgress(cat.id)
      return {
        completed: acc.completed + progress.completed,
        total: acc.total + progress.total,
      }
    },
    { completed: 0, total: 0 }
  )

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-[3px] border-emerald-100" />
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
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
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === 'fr' ? 'Rituels' : 'Rituals'}
            </h1>
            {/* History Button */}
            <button
              onClick={() => router.push('/rituals/journal')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                {locale === 'fr' ? 'Historique' : 'History'}
              </span>
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            {totalProgress.total > 0 ? (
              <>
                {totalProgress.completed}/{totalProgress.total} {locale === 'fr' ? 'complétés aujourd\'hui' : 'completed today'}
              </>
            ) : (
              locale === 'fr'
                ? 'Créez des habitudes positives pour votre bien-être'
                : 'Build positive habits for your wellbeing'
            )}
          </p>
        </motion.div>

        {/* Daily Rhythm - Today's checklist */}
        {memberRituals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {locale === 'fr' ? 'Rythme Quotidien' : 'Daily Rhythm'}
              </h3>
              <span className="text-sm text-gray-400">
                {totalProgress.completed}/{totalProgress.total}
              </span>
            </div>

            {/* Ritual List */}
            <div className="divide-y divide-gray-50">
              {memberRituals.map((mr) => {
                const completed = isCompletedToday(mr.ritual_id)
                const category = ritualCategories.find(c => c.id === mr.ritual.category)!
                const RitualIcon = mr.ritual.icon ? iconMap[mr.ritual.icon] || Circle : Circle

                return (
                  <motion.div
                    key={mr.id}
                    className="flex items-center gap-3 px-4 py-3"
                    whileTap={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCompletion(mr.ritual_id)}
                      disabled={saving}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {completed && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    {/* Ritual Info - Clickable */}
                    <button
                      onClick={() => !completed && openRitualModal(mr)}
                      disabled={completed}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        completed ? 'bg-gray-100' : category.iconBg
                      }`}>
                        <RitualIcon className={`w-4 h-4 ${completed ? 'text-gray-400' : category.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {locale === 'fr' ? mr.ritual.name_fr : mr.ritual.name}
                        </p>
                        <p className={`text-xs ${completed ? 'text-gray-300' : 'text-gray-400'}`}>
                          {mr.planned_time && (
                            <span className="font-medium">
                              {mr.planned_time.slice(0, 5)} •{' '}
                            </span>
                          )}
                          {locale === 'fr' ? category.titleFr : category.titleEn}
                          {mr.ritual.duration_suggestion && ` • ${mr.ritual.duration_suggestion}m`}
                        </p>
                      </div>
                    </button>

                    {/* Start button for uncompleted */}
                    {!completed && (
                      <button
                        onClick={() => openRitualModal(mr)}
                        className={`px-3 py-1.5 ${category.iconBg} ${category.color} text-xs font-medium rounded-full`}
                      >
                        {locale === 'fr' ? 'Go' : 'Go'}
                      </button>
                    )}

                    {/* History button */}
                    <button
                      onClick={() => openHistoryModal(mr)}
                      className="p-2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <History className="w-4 h-4" />
                    </button>
                  </motion.div>
                )
              })}
            </div>

            {/* All done message */}
            {totalProgress.completed === totalProgress.total && totalProgress.total > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-3 bg-emerald-50 text-center"
              >
                <p className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {locale === 'fr' ? 'Tous les rituels complétés!' : 'All rituals complete!'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Category Cards - Grid View */}
        <div className="grid grid-cols-2 gap-3">
          {ritualCategories.map((category, idx) => {
            const Icon = category.icon
            const isExpanded = expandedCategory === category.id
            const categoryRituals = getRitualsForCategory(category.id)
            const progress = getCategoryProgress(category.id)

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className={`relative ${category.bg} rounded-2xl p-4 border ${isExpanded ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-100'} text-left transition-all`}
                whileTap={{ scale: 0.97 }}
              >
                <div className={`w-10 h-10 ${category.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${category.color}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {locale === 'fr' ? category.titleFr : category.titleEn}
                </h4>
                <p className="text-xs text-gray-500">
                  {categoryRituals.length > 0 ? (
                    <span className={progress.completed === progress.total && progress.total > 0 ? 'text-emerald-600 font-medium' : ''}>
                      {progress.completed}/{progress.total} {locale === 'fr' ? 'fait' : 'done'}
                    </span>
                  ) : (
                    locale === 'fr' ? category.descFr : category.descEn
                  )}
                </p>
                {progress.completed === progress.total && progress.total > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Expanded Category Content */}
        <AnimatePresence>
          {expandedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 overflow-hidden"
            >
              {(() => {
                const category = ritualCategories.find(c => c.id === expandedCategory)!
                const categoryRituals = getRitualsForCategory(expandedCategory)

                return (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 ${category.iconBg} rounded-lg flex items-center justify-center`}>
                          <category.icon className={`w-4 h-4 ${category.color}`} />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {locale === 'fr' ? category.titleFr : category.titleEn}
                        </h3>
                      </div>
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* Ritual Items */}
                      {categoryRituals.map((mr) => {
                        const RitualIcon = mr.ritual.icon ? iconMap[mr.ritual.icon] || Circle : Circle
                        const completed = isCompletedToday(mr.ritual_id)

                        return (
                          <motion.div
                            key={mr.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`bg-gray-50 rounded-xl p-3 border ${completed ? 'border-emerald-100' : 'border-gray-100'} flex items-center gap-3`}
                          >
                            {/* Completion Toggle - Quick checkbox */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleCompletion(mr.ritual_id)
                              }}
                              disabled={saving}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                completed
                                  ? 'bg-emerald-100'
                                  : `${category.iconBg} hover:opacity-80`
                              }`}
                            >
                              {completed ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <RitualIcon className={`w-4 h-4 ${category.color}`} />
                              )}
                            </button>

                            {/* Ritual Info - Clickable to open modal */}
                            <button
                              onClick={() => !completed && openRitualModal(mr)}
                              className="flex-1 min-w-0 text-left"
                              disabled={completed}
                            >
                              <p className={`font-medium text-sm ${completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                {locale === 'fr' ? mr.ritual.name_fr : mr.ritual.name}
                              </p>
                              {mr.ritual.description && (
                                <p className="text-xs text-gray-400 truncate">
                                  {locale === 'fr' ? mr.ritual.description_fr : mr.ritual.description}
                                </p>
                              )}
                            </button>

                            {/* Start button for uncompleted rituals */}
                            {!completed && (
                              <button
                                onClick={() => openRitualModal(mr)}
                                className={`px-3 py-1.5 ${category.iconBg} ${category.color} text-xs font-medium rounded-lg`}
                              >
                                {locale === 'fr' ? 'Faire' : 'Start'}
                              </button>
                            )}

                            {/* Duration hint for completed */}
                            {completed && mr.ritual.duration_suggestion && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {mr.ritual.duration_suggestion}m
                              </div>
                            )}

                            {/* More options button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setMenuRitual(mr)
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )
                      })}

                      {/* Empty State */}
                      {categoryRituals.length === 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 text-center">
                          <p className="text-sm text-gray-400">
                            {locale === 'fr' ? 'Aucun rituel ajouté' : 'No rituals added'}
                          </p>
                        </div>
                      )}

                      {/* Add Ritual Button */}
                      <button
                        onClick={() => {
                          setAddingToCategory(expandedCategory)
                          setShowAddModal(true)
                        }}
                        className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-3 border border-dashed border-gray-200 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-500">
                          {locale === 'fr' ? 'Ajouter un rituel' : 'Add ritual'}
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Ritual Modal */}
        <AnimatePresence>
          {showAddModal && addingToCategory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedRitualToAdd(null)
                }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 z-[100] max-h-[80vh] overflow-y-auto"
              >
                {/* Step 1: Select Ritual OR Step 2: Select Time */}
                {!selectedRitualToAdd ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {locale === 'fr' ? 'Ajouter un rituel' : 'Add Ritual'}
                      </h3>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Available Rituals */}
                    <div className="space-y-2 mb-4">
                      {getAvailableRituals(addingToCategory).map((ritual) => {
                        const RitualIcon = ritual.icon ? iconMap[ritual.icon] || Circle : Circle
                        const categoryConfig = ritualCategories.find(c => c.id === addingToCategory)!

                        return (
                          <button
                            key={ritual.id}
                            onClick={() => {
                              setSelectedRitualToAdd(ritual)
                              // Set default time based on category
                              if (ritual.category === 'morning') setSelectedTime('07:00')
                              else if (ritual.category === 'midday') setSelectedTime('12:00')
                              else if (ritual.category === 'evening') setSelectedTime('19:00')
                              else setSelectedTime('10:00')
                            }}
                            disabled={saving}
                            className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-3 flex items-center gap-3 text-left transition-colors"
                          >
                            <div className={`w-10 h-10 ${categoryConfig.iconBg} rounded-xl flex items-center justify-center`}>
                              <RitualIcon className={`w-5 h-5 ${categoryConfig.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {locale === 'fr' ? ritual.name_fr : ritual.name}
                              </p>
                              {ritual.description && (
                                <p className="text-xs text-gray-500">
                                  {locale === 'fr' ? ritual.description_fr : ritual.description}
                                </p>
                              )}
                            </div>
                            <Plus className="w-5 h-5 text-gray-400" />
                          </button>
                        )
                      })}
                    </div>

                    {/* Create Custom */}
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setShowCustomModal(true)
                      }}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 rounded-xl p-4 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-600">
                        {locale === 'fr' ? 'Créer un rituel personnalisé' : 'Create custom ritual'}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Step 2: Time Selection */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setSelectedRitualToAdd(null)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown className="w-5 h-5 rotate-90" />
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">
                        {locale === 'fr' ? 'Planifier le rituel' : 'Schedule Ritual'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowAddModal(false)
                          setSelectedRitualToAdd(null)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Selected Ritual Info */}
                    {(() => {
                      const RitualIcon = selectedRitualToAdd.icon ? iconMap[selectedRitualToAdd.icon] || Circle : Circle
                      const categoryConfig = ritualCategories.find(c => c.id === selectedRitualToAdd.category)!

                      // Fallback tips if no benefit in database
                      const fallbackTips: Record<string, { en: string; fr: string }> = {
                        morning: { en: 'Starting your day with intention sets a positive tone', fr: 'Commencer la journée avec intention donne un ton positif' },
                        midday: { en: 'A mindful pause helps reset your energy', fr: 'Une pause consciente aide à recharger votre énergie' },
                        evening: { en: 'Winding down mindfully improves rest quality', fr: 'Se détendre en pleine conscience améliore la qualité du repos' },
                        selfcare: { en: 'Small acts of self-care build lasting wellbeing', fr: 'Les petits gestes de bien-être construisent un bonheur durable' }
                      }

                      const benefitText = locale === 'fr'
                        ? (selectedRitualToAdd.benefit_fr || fallbackTips[selectedRitualToAdd.category]?.fr)
                        : (selectedRitualToAdd.benefit || fallbackTips[selectedRitualToAdd.category]?.en)

                      return (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 ${categoryConfig.iconBg} rounded-xl flex items-center justify-center`}>
                              <RitualIcon className={`w-6 h-6 ${categoryConfig.color}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {locale === 'fr' ? selectedRitualToAdd.name_fr : selectedRitualToAdd.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {locale === 'fr' ? categoryConfig.titleFr : categoryConfig.titleEn}
                                {selectedRitualToAdd.duration_suggestion && ` • ${selectedRitualToAdd.duration_suggestion} min`}
                              </p>
                            </div>
                          </div>

                          {/* Description - What to do */}
                          {selectedRitualToAdd.description && (
                            <div className="bg-white rounded-xl p-3 mb-3 border border-gray-100">
                              <p className="text-xs font-medium text-gray-500 mb-1">
                                {locale === 'fr' ? '📝 Comment faire' : '📝 What to do'}
                              </p>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {locale === 'fr' ? selectedRitualToAdd.description_fr : selectedRitualToAdd.description}
                              </p>
                            </div>
                          )}

                          {/* Benefit - Why it helps */}
                          {benefitText && (
                            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50">
                              <p className="text-xs font-medium text-emerald-700 mb-1">
                                {locale === 'fr' ? '✨ Pourquoi ça aide' : '✨ Why it helps'}
                              </p>
                              <p className="text-sm text-emerald-600/90 leading-relaxed">
                                {benefitText}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Time Picker */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {locale === 'fr' ? 'Heure prévue' : 'Planned Time'}
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-4 text-2xl text-center font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-2 text-center">
                        {locale === 'fr'
                          ? 'Choisissez l\'heure à laquelle vous prévoyez de faire ce rituel'
                          : 'Choose when you plan to do this ritual'}
                      </p>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => addRitual(selectedRitualToAdd.id, selectedTime)}
                      disabled={saving}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          {locale === 'fr' ? 'Ajouter à mon rythme' : 'Add to my rhythm'}
                        </>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Custom Ritual Modal */}
        <AnimatePresence>
          {showCustomModal && addingToCategory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCustomModal(false)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 z-[100]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'fr' ? 'Nouveau rituel' : 'New Ritual'}
                  </h3>
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'fr' ? 'Nom' : 'Name'}
                    </label>
                    <input
                      type="text"
                      value={customRitual.name}
                      onChange={(e) => setCustomRitual(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={locale === 'fr' ? 'Mon rituel...' : 'My ritual...'}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Icône' : 'Icon'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableIcons.map((iconOption) => {
                        const IconComponent = iconOption.icon
                        const isSelected = customRitual.icon === iconOption.id
                        return (
                          <button
                            key={iconOption.id}
                            type="button"
                            onClick={() => setCustomRitual(prev => ({ ...prev, icon: iconOption.id }))}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-emerald-100 ring-2 ring-emerald-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-gray-500'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                    </label>
                    <textarea
                      value={customRitual.description}
                      onChange={(e) => setCustomRitual(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={locale === 'fr' ? 'Décrivez votre rituel...' : 'Describe your ritual...'}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {locale === 'fr' ? 'Heure prévue' : 'Planned Time'}
                    </label>
                    <input
                      type="time"
                      value={customRitual.time}
                      onChange={(e) => setCustomRitual(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-center text-lg font-medium"
                    />
                  </div>

                  {/* Duration toggle and input */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Durée prévue' : 'Set duration'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomRitual(prev => ({ ...prev, hasDuration: !prev.hasDuration }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          customRitual.hasDuration ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            customRitual.hasDuration ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>

                    {customRitual.hasDuration && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={customRitual.duration}
                          onChange={(e) => setCustomRitual(prev => ({
                            ...prev,
                            duration: Math.max(1, Math.min(120, parseInt(e.target.value) || 1))
                          }))}
                          className="w-24 px-3 py-2 bg-white rounded-lg border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-center font-medium"
                        />
                        <span className="text-sm text-gray-500">
                          {locale === 'fr' ? 'minutes' : 'minutes'}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={createCustomRitual}
                    disabled={!customRitual.name.trim() || saving}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      locale === 'fr' ? 'Créer' : 'Create'
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Edit Custom Ritual Modal */}
        <AnimatePresence>
          {editingRitual && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingRitual(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 z-[100]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'fr' ? 'Modifier le rituel' : 'Edit Ritual'}
                  </h3>
                  <button
                    onClick={() => setEditingRitual(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'fr' ? 'Nom' : 'Name'}
                    </label>
                    <input
                      type="text"
                      value={editingRitual.name}
                      onChange={(e) => setEditingRitual(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      placeholder={locale === 'fr' ? 'Mon rituel...' : 'My ritual...'}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'fr' ? 'Icône' : 'Icon'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableIcons.map((iconOption) => {
                        const IconComponent = iconOption.icon
                        const isSelected = editingRitual.icon === iconOption.id
                        return (
                          <button
                            key={iconOption.id}
                            type="button"
                            onClick={() => setEditingRitual(prev => prev ? ({ ...prev, icon: iconOption.id }) : null)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-blue-100 ring-2 ring-blue-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'fr' ? 'Description (optionnel)' : 'Description (optional)'}
                    </label>
                    <textarea
                      value={editingRitual.description}
                      onChange={(e) => setEditingRitual(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                      placeholder={locale === 'fr' ? 'Décrivez votre rituel...' : 'Describe your ritual...'}
                      rows={2}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {locale === 'fr' ? 'Heure prévue' : 'Planned Time'}
                    </label>
                    <input
                      type="time"
                      value={editingRitual.time}
                      onChange={(e) => setEditingRitual(prev => prev ? ({ ...prev, time: e.target.value }) : null)}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-center text-lg font-medium"
                    />
                  </div>

                  {/* Duration toggle and input */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">
                        {locale === 'fr' ? 'Durée prévue' : 'Set duration'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingRitual(prev => prev ? ({ ...prev, hasDuration: !prev.hasDuration }) : null)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          editingRitual.hasDuration ? 'bg-blue-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            editingRitual.hasDuration ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>

                    {editingRitual.hasDuration && (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={editingRitual.duration}
                          onChange={(e) => setEditingRitual(prev => prev ? ({
                            ...prev,
                            duration: Math.max(1, Math.min(120, parseInt(e.target.value) || 1))
                          }) : null)}
                          className="w-24 px-3 py-2 bg-white rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-center font-medium"
                        />
                        <span className="text-sm text-gray-500">
                          {locale === 'fr' ? 'minutes' : 'minutes'}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={updateCustomRitual}
                    disabled={!editingRitual.name.trim() || saving}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      locale === 'fr' ? 'Enregistrer' : 'Save Changes'
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Options Bottom Sheet */}
        <AnimatePresence>
          {menuRitual && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuRitual(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 pb-8 z-[100]"
              >
                {/* Handle bar */}
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

                {/* Ritual name */}
                <p className="text-center font-medium text-gray-900 mb-4">
                  {locale === 'fr' ? menuRitual.ritual.name_fr : menuRitual.ritual.name}
                </p>

                <div className="space-y-2">
                  {/* Edit - only for custom rituals */}
                  {!menuRitual.ritual.is_predefined && (
                    <button
                      onClick={() => {
                        setMenuRitual(null)
                        setEditingRitual({
                          id: menuRitual.ritual.id,
                          memberRitualId: menuRitual.id,
                          name: menuRitual.ritual.name,
                          description: menuRitual.ritual.description || '',
                          time: menuRitual.planned_time || '08:00',
                          hasDuration: !!menuRitual.ritual.duration_suggestion,
                          duration: menuRitual.ritual.duration_suggestion || 5,
                          icon: menuRitual.ritual.icon || 'heart'
                        })
                      }}
                      className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left text-gray-700 flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Pencil className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Modifier' : 'Edit'}</p>
                        <p className="text-xs text-gray-500">{locale === 'fr' ? 'Changer le nom, durée...' : 'Change name, duration...'}</p>
                      </div>
                    </button>
                  )}

                  {/* Remove from list */}
                  <button
                    onClick={() => {
                      setMenuRitual(null)
                      removeRitual(menuRitual.id)
                    }}
                    className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left text-gray-700 flex items-center gap-4 transition-colors"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <X className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{locale === 'fr' ? 'Retirer' : 'Remove'}</p>
                      <p className="text-xs text-gray-500">{locale === 'fr' ? 'Retirer de votre liste' : 'Remove from your list'}</p>
                    </div>
                  </button>

                  {/* Delete permanently - only for custom rituals */}
                  {!menuRitual.ritual.is_predefined && (
                    <button
                      onClick={() => {
                        const ritualName = locale === 'fr' ? menuRitual.ritual.name_fr : menuRitual.ritual.name
                        setMenuRitual(null)
                        setShowDeleteConfirm({
                          ritualId: menuRitual.ritual.id,
                          memberRitualId: menuRitual.id,
                          name: ritualName
                        })
                      }}
                      className="w-full px-4 py-4 bg-red-50 hover:bg-red-100 rounded-xl text-left text-red-600 flex items-center gap-4 transition-colors"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{locale === 'fr' ? 'Supprimer' : 'Delete'}</p>
                        <p className="text-xs text-red-500">{locale === 'fr' ? 'Supprimer définitivement' : 'Delete permanently'}</p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Cancel button */}
                <button
                  onClick={() => setMenuRitual(null)}
                  className="w-full mt-4 py-3 text-gray-500 font-medium"
                >
                  {locale === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl p-5 z-[100]"
              >
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {locale === 'fr' ? 'Supprimer définitivement ?' : 'Delete permanently?'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {locale === 'fr'
                      ? `"${showDeleteConfirm.name}" sera supprimé définitivement. Cette action est irréversible.`
                      : `"${showDeleteConfirm.name}" will be permanently deleted. This action cannot be undone.`
                    }
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={deleteCustomRitual}
                    disabled={saving}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      locale === 'fr' ? 'Supprimer' : 'Delete'
                    )}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full-Screen Focus Mode */}
        <AnimatePresence>
          {activeRitual && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] overflow-hidden"
            >
              {(() => {
                const category = ritualCategories.find(c => c.id === activeRitual.ritual.category)!
                const RitualIcon = activeRitual.ritual.icon ? iconMap[activeRitual.ritual.icon] || Circle : Circle
                const totalSeconds = (activeRitual.ritual.duration_suggestion || 1) * 60
                const progress = Math.min(100, ((totalSeconds - timerSeconds) / totalSeconds) * 100)
                const isOvertime = timerSeconds <= 0 && activeRitual.ritual.duration_suggestion
                const hasMinTime = timerSeconds <= 0

                // Category-specific background colors (fully opaque)
                const bgColors: Record<RitualCategory, string> = {
                  morning: 'from-amber-50 via-orange-50 to-yellow-50',
                  midday: 'from-emerald-50 via-teal-50 to-cyan-50',
                  evening: 'from-indigo-50 via-purple-50 to-violet-50',
                  selfcare: 'from-rose-50 via-pink-50 to-fuchsia-50',
                }

                return (
                  <div className={`relative w-full h-full bg-gradient-to-br ${bgColors[activeRitual.ritual.category]}`}>
                    {/* Subtle background decoration */}
                    <div className="absolute inset-0 overflow-hidden">
                      <motion.div
                        animate={{
                          x: [0, 30, 0],
                          y: [0, -20, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute -top-20 -left-20 w-64 h-64 ${category.iconBg} rounded-full opacity-60 blur-3xl`}
                      />
                      <motion.div
                        animate={{
                          x: [0, -20, 0],
                          y: [0, 30, 0],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className={`absolute -bottom-32 -right-32 w-96 h-96 ${category.iconBg} rounded-full opacity-60 blur-3xl`}
                      />
                      <motion.div
                        animate={{
                          x: [0, 15, 0],
                          y: [0, 15, 0],
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/3 right-10 w-32 h-32 bg-white rounded-full opacity-70 blur-2xl"
                      />
                    </div>

                    {/* Close button */}
                    <button
                      onClick={closeRitualModal}
                      className="absolute top-6 right-6 p-3 bg-white/50 backdrop-blur-sm rounded-full text-gray-600 hover:bg-white/70 transition-colors z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Main content */}
                    <div className="relative h-full flex flex-col items-center px-8 py-8 overflow-y-auto">
                      {/* Spacer for centering */}
                      <div className="flex-1 min-h-4" />
                      {/* Completion celebration - triggers once when reaching 0 */}
                      {timerSeconds === 0 && activeRitual.ritual.duration_suggestion && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          {[...Array(12)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, x: 0, y: 0 }}
                              animate={{
                                scale: [0, 1, 0],
                                x: Math.cos(i * 30 * Math.PI / 180) * 150,
                                y: Math.sin(i * 30 * Math.PI / 180) * 150,
                              }}
                              transition={{ duration: 1, delay: i * 0.05 }}
                              className={`absolute w-3 h-3 ${category.iconBg} rounded-full`}
                            />
                          ))}
                        </motion.div>
                      )}

                      {/* Icon */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`w-20 h-20 ${category.iconBg} rounded-2xl flex items-center justify-center mb-6`}
                      >
                        <RitualIcon className={`w-10 h-10 ${category.color}`} />
                      </motion.div>

                      {/* Title */}
                      <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold text-gray-900 text-center mb-2"
                      >
                        {locale === 'fr' ? activeRitual.ritual.name_fr : activeRitual.ritual.name}
                      </motion.h1>

                      {/* Description */}
                      <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-600 text-center mb-8 max-w-xs"
                      >
                        {locale === 'fr' ? activeRitual.ritual.description_fr : activeRitual.ritual.description}
                      </motion.p>

                      {/* Timer */}
                      {activeRitual.ritual.duration_suggestion && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mb-8"
                        >
                          {/* Large Timer Circle */}
                          <div className="relative w-56 h-56 mx-auto mb-6">
                            <svg className="w-full h-full -rotate-90">
                              <circle
                                cx="112"
                                cy="112"
                                r="100"
                                fill="none"
                                stroke="rgba(255,255,255,0.5)"
                                strokeWidth="12"
                              />
                              <circle
                                cx="112"
                                cy="112"
                                r="100"
                                fill="none"
                                stroke="url(#focusTimerGradient)"
                                strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 100}
                                strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                                className="transition-all duration-1000"
                              />
                              <defs>
                                <linearGradient id="focusTimerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#10b981" />
                                  <stop offset="100%" stopColor="#14b8a6" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <motion.span
                                key={timerSeconds}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className={`text-5xl font-bold ${isOvertime ? 'text-emerald-600' : 'text-gray-900'}`}
                              >
                                {formatTime(timerSeconds)}
                              </motion.span>
                              <span className="text-sm text-gray-500 mt-1">
                                {isOvertime
                                  ? (locale === 'fr' ? 'temps bonus!' : 'bonus time!')
                                  : (locale === 'fr' ? 'restant' : 'remaining')}
                              </span>
                            </div>
                          </div>

                          {/* Timer Controls */}
                          <div className="flex items-center justify-center gap-6">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setTimerSeconds(activeRitual.ritual.duration_suggestion! * 60)}
                              className="p-4 bg-white/60 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/80 transition-colors"
                            >
                              <RotateCcw className="w-6 h-6 text-gray-600" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setTimerRunning(!timerRunning)}
                              className={`p-6 rounded-full shadow-lg transition-all ${
                                timerRunning
                                  ? 'bg-white text-amber-500'
                                  : 'bg-emerald-500 text-white'
                              }`}
                            >
                              {timerRunning ? (
                                <Pause className="w-8 h-8" />
                              ) : (
                                <Play className="w-8 h-8 ml-1" />
                              )}
                            </motion.button>
                            <div className="w-14" />
                          </div>
                        </motion.div>
                      )}

                      {/* Motivational text when timer running */}
                      {timerRunning && !isOvertime && !showCompletionFlow && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-gray-500 text-sm text-center mb-4"
                        >
                          {locale === 'fr' ? 'Respirez profondément...' : 'Breathe deeply...'}
                        </motion.p>
                      )}

                      {/* Overtime message - only when not in completion flow */}
                      {isOvertime && !showCompletionFlow && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-emerald-600 text-sm text-center mb-4 font-medium"
                        >
                          {locale === 'fr' ? 'Continuez ou terminez quand vous êtes prêt!' : 'Keep going or finish when ready!'}
                        </motion.p>
                      )}

                      {/* Finish button - shows after overtime, starts completion flow */}
                      {(isOvertime || !activeRitual.ritual.duration_suggestion) && !showCompletionFlow && (
                        <motion.button
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setTimerRunning(false)
                            setShowCompletionFlow(true)
                          }}
                          className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                        >
                          <Sparkles className="w-5 h-5" />
                          {locale === 'fr' ? 'Terminer' : 'Finish'}
                        </motion.button>
                      )}

                      {/* COMPLETION FLOW - Step by step */}
                      {showCompletionFlow && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full max-w-sm space-y-4"
                        >
                          {/* Step 1: Mood Selection */}
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
                            <p className="text-sm text-gray-600 text-center mb-3 font-medium">
                              {locale === 'fr' ? 'Comment vous sentez-vous?' : 'How do you feel?'}
                            </p>
                            <div className="flex justify-center gap-2">
                              {moodOptions.map((mood) => {
                                const MoodIcon = mood.icon
                                const isSelected = ritualMood === mood.value
                                return (
                                  <button
                                    key={mood.value}
                                    onClick={() => {
                                      if (isSelected) {
                                        setRitualMood(null)
                                        setCurrentPrompt('')
                                      } else {
                                        setRitualMood(mood.value)
                                        setCurrentPrompt(getRandomPrompt(mood.value))
                                      }
                                    }}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                      isSelected
                                        ? `${mood.bg} scale-110 shadow-md`
                                        : 'bg-white/70 hover:bg-white'
                                    }`}
                                  >
                                    <MoodIcon className={`w-7 h-7 ${isSelected ? mood.color : 'text-gray-400'}`} />
                                    <span className={`text-xs ${isSelected ? mood.color : 'text-gray-400'}`}>
                                      {mood.label}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Step 2: Question & Notes (appears after mood selected) */}
                          {ritualMood && currentPrompt && (
                            <motion.div
                              key={currentPrompt}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-3"
                            >
                              {/* Prompt card */}
                              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex items-center gap-2">
                                <span className="text-lg">{currentPrompt.match(/^[^\s]+/)?.[0]}</span>
                                <p className="text-sm text-gray-700 font-medium">
                                  {currentPrompt.replace(/^[^\s]+\s*/, '')}
                                </p>
                              </div>

                              <textarea
                                value={ritualNotes}
                                onChange={(e) => {
                                  setRitualNotes(e.target.value)
                                  e.target.style.height = 'auto'
                                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'
                                }}
                                placeholder={locale === 'fr' ? 'Partagez vos pensées...' : 'Share your thoughts...'}
                                rows={2}
                                className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm rounded-xl border-0 focus:ring-2 focus:ring-white/50 outline-none transition-all resize-none text-gray-700 placeholder-gray-400 text-sm shadow-sm min-h-[52px]"
                              />

                              {/* Step 3: Complete button */}
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={completeRitualWithNotes}
                                disabled={saving}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-50"
                              >
                                {saving ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="w-5 h-5" />
                                    {locale === 'fr' ? 'Terminer le rituel' : 'Complete Ritual'}
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          )}

                          {/* Back button if they want to continue */}
                          <button
                            onClick={() => setShowCompletionFlow(false)}
                            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
                          >
                            {locale === 'fr' ? '← Continuer le rituel' : '← Continue ritual'}
                          </button>
                        </motion.div>
                      )}

                      {/* Skip option - only show before timer complete and not in completion flow */}
                      {!isOvertime && activeRitual.ritual.duration_suggestion && !showCompletionFlow && (
                        <button
                          onClick={closeRitualModal}
                          className="mt-4 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                        >
                          {locale === 'fr' ? 'Faire plus tard' : 'Do later'}
                        </button>
                      )}
                      {/* Bottom spacer for centering */}
                      <div className="flex-1 min-h-4" />
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Modal */}
        <AnimatePresence>
          {historyRitual && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHistoryRitual(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[100] max-h-[80vh] overflow-hidden flex flex-col"
              >
                {(() => {
                  const category = ritualCategories.find(c => c.id === historyRitual.ritual.category)!
                  const RitualIcon = historyRitual.ritual.icon ? iconMap[historyRitual.ritual.icon] || Circle : Circle

                  return (
                    <>
                      {/* Header */}
                      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                        <div className={`w-10 h-10 ${category.iconBg} rounded-xl flex items-center justify-center`}>
                          <RitualIcon className={`w-5 h-5 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {locale === 'fr' ? historyRitual.ritual.name_fr : historyRitual.ritual.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {locale === 'fr' ? 'Historique' : 'History'}
                          </p>
                        </div>
                        <button
                          onClick={() => setHistoryRitual(null)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* History List */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {loadingHistory ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                          </div>
                        ) : ritualHistory.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Calendar className="w-6 h-6 text-gray-300" />
                            </div>
                            <p className="text-gray-400 text-sm">
                              {locale === 'fr' ? 'Pas encore de données' : 'No history yet'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {ritualHistory.map((completion) => (
                              <motion.div
                                key={completion.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-gray-50 rounded-xl p-4 ${completion.completed ? '' : 'opacity-50'}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-900">
                                      {formatDate(completion.completion_date)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Mood indicator */}
                                    {completion.mood && (() => {
                                      const moodConfig = moodOptions.find(m => m.value === completion.mood)
                                      if (!moodConfig) return null
                                      const MoodIcon = moodConfig.icon
                                      return (
                                        <span className={`text-xs ${moodConfig.bg} ${moodConfig.color} px-2 py-1 rounded-full flex items-center gap-1`}>
                                          <MoodIcon className="w-3 h-3" />
                                          {moodConfig.label}
                                        </span>
                                      )
                                    })()}
                                    {completion.duration_minutes && (
                                      <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {completion.duration_minutes}m
                                      </span>
                                    )}
                                    {completion.completed ? (
                                      <span className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      </span>
                                    ) : (
                                      <span className="w-5 h-5 bg-gray-200 rounded-full" />
                                    )}
                                  </div>
                                </div>

                                {/* Notes */}
                                {completion.notes && (
                                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                                    <MessageSquare className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-600 italic">
                                      "{completion.notes}"
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Stats Summary */}
                      {ritualHistory.length > 0 && (
                        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                          <div className="flex items-center justify-around">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {ritualHistory.filter(h => h.completed).length}
                              </p>
                              <p className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Complétés' : 'Completed'}
                              </p>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {ritualHistory.filter(h => h.duration_minutes).length > 0
                                  ? Math.round(
                                      ritualHistory
                                        .filter(h => h.duration_minutes)
                                        .reduce((acc, h) => acc + (h.duration_minutes || 0), 0) /
                                      ritualHistory.filter(h => h.duration_minutes).length
                                    )
                                  : '-'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Moy. min' : 'Avg mins'}
                              </p>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-900">
                                {ritualHistory.filter(h => h.notes).length}
                              </p>
                              <p className="text-xs text-gray-500">
                                {locale === 'fr' ? 'Notes' : 'Notes'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </MemberLayout>
  )
}

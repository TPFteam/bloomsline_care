'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Clock,
  Loader2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Puzzle,
  Check,
  X,
  UserPlus,
  Heart,
  Leaf,
  Sparkles,
  Smile,
  Sun,
  Moon,
  Circle,
  Eye,
  Coffee,
  Sprout,
  StretchHorizontal,
  MapPin,
  Music,
  Cloud,
  RefreshCw,
  List,
  Gift,
  Hand,
  Star,
  Stars,
  CalendarHeart,
  Sofa,
  Mail,
  Shield,
  Play,
  ZoomIn,
  ZoomOut,
  Table2,
  Plus,
  Droplet,
  Dumbbell,
  Brain,
  Cigarette,
  Wine,
  Cookie,
  Bed,
  Apple,
  Smartphone,
  Tv,
  Footprints,
  Candy,
  Users,
  PenLine,
  TreePine,
  Palette,
  Wind,
  Salad,
  Pizza,
  Gamepad2,
  CreditCard,
  MessageSquare,
  Timer,
  ShoppingBag,
  BedDouble,
  Info,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingDots } from '@/components/ui/loading-dots'
import { useLanguage } from '@/lib/i18n/context'
import { createClient } from '@/lib/supabase/browser-client'
import {
  getAllMemberRecords,
  getAllMemberResources,
  getMemberPractitioner,
  getPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  type MemberResourceItem,
  type PractitionerProfile,
  type PendingInvitation
} from '@/lib/services/member-resources'
import { toast } from 'sonner'
import BloomChatInterface from '@/components/bloom/BloomChatInterface'
import MemberLayout from '@/components/member/MemberLayout'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { FeatureGuide } from '@/components/feature-guide/FeatureGuide'
import { FlowSpotlight } from '@/components/feature-guide/FlowSpotlight'
import { seedsGuideSteps } from '@/components/feature-guide/guides/seeds-guide'
import { onboardingGuideSteps } from '@/components/feature-guide/guides/onboarding-guide'
import { useFeatureGuide } from '@/lib/hooks/useFeatureGuide'
import { useBottomNav } from '@/lib/contexts/bottom-nav-context'
import { ConsentModal } from '@/components/consent-modal'
import type { Member } from '@/types/member'
import { getMemberMoments, type Moment } from '@/lib/services/moments'
import { DailyStory } from '@/components/daily-story/DailyStory'
import { DailyStoryCard } from '@/components/daily-story/DailyStoryCard'
import { captureFlowAsImage, shareFlow } from '@/lib/utils/share-flow'
// Ritual types
interface Ritual {
  id: string
  name: string
  name_fr: string
  description: string | null
  description_fr: string | null
  benefit: string | null
  benefit_fr: string | null
  category: 'morning' | 'midday' | 'evening' | 'selfcare'
  icon: string | null
  duration_suggestion: number | null
  is_predefined: boolean
}

interface MemberRitual {
  id: string
  member_id: string
  ritual_id: string
  tracking_type: 'checkbox' | 'duration' | 'streak'
  is_active: boolean
  sort_order: number
  planned_time: string | null
  added_at: string | null
  removed_at: string | null
  ritual: Ritual
}

interface RitualCompletion {
  id: string
  member_id: string
  ritual_id: string
  completion_date: string
  completed: boolean
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

// Daily Seeds types
interface Anchor {
  id: string
  icon: string
  labelEn: string
  labelFr: string
  labelEs?: string
  type: 'grow' | 'letgo'
}

// Ritual icon mapping (Lucide - fallback)
const RITUAL_ICONS: Record<string, React.ElementType> = {
  eye: Eye,
  coffee: Coffee,
  sprout: Sprout,
  'stretch-horizontal': StretchHorizontal,
  sun: Sun,
  'map-pin': MapPin,
  music: Music,
  cloud: Cloud,
  'refresh-cw': RefreshCw,
  heart: Heart,
  list: List,
  gift: Gift,
  moon: Moon,
  hand: Hand,
  stars: Stars,
  'calendar-heart': CalendarHeart,
  sofa: Sofa,
  mail: Mail,
  smile: Smile,
  shield: Shield,
}


// All anchor icons (used for custom anchors and icon lookup)
const ANCHOR_ICONS: Record<string, { icon: React.ElementType; labelEn: string; labelFr: string; labelEs?: string }> = {
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

// Category gradients
const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  morning: { from: '#fbbf24', to: '#f59e0b' },
  midday: { from: '#22d3ee', to: '#06b6d4' },
  evening: { from: '#a78bfa', to: '#8b5cf6' },
  selfcare: { from: '#fb7185', to: '#f43f5e' },
}

// Emotion scores: positive = higher, negative = lower
const EMOTION_SCORES: Record<string, number> = {
  // Positive (high scores)
  grateful: 90,
  joyful: 95,
  inspired: 85,
  loved: 92,
  peaceful: 80,
  calm: 75,
  hopeful: 78,
  proud: 88,
  // Softer/processing (mid-low scores)
  overwhelmed: 35,
  tired: 40,
  uncertain: 45,
  tender: 50,
  restless: 42,
  heavy: 32,
  // Legacy (for old data)
  anxious: 35,
  sad: 25,
  frustrated: 30,
}

// Emotion colors - vibrant gradients
const EMOTION_COLORS: Record<string, { from: string; to: string; glow: string }> = {
  // Positive emotions - warm/bright colors
  grateful: { from: '#34d399', to: '#10b981', glow: 'rgba(52, 211, 153, 0.5)' },
  joyful: { from: '#fbbf24', to: '#f59e0b', glow: 'rgba(251, 191, 36, 0.5)' },
  inspired: { from: '#a78bfa', to: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },
  loved: { from: '#fb7185', to: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
  peaceful: { from: '#22d3ee', to: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)' },
  calm: { from: '#60a5fa', to: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },
  hopeful: { from: '#facc15', to: '#eab308', glow: 'rgba(234, 179, 8, 0.5)' },
  proud: { from: '#fb923c', to: '#f97316', glow: 'rgba(249, 115, 22, 0.5)' },
  // Softer/processing emotions - muted/soft colors
  overwhelmed: { from: '#94a3b8', to: '#64748b', glow: 'rgba(100, 116, 139, 0.5)' },
  tired: { from: '#a5b4fc', to: '#818cf8', glow: 'rgba(165, 180, 252, 0.5)' },
  uncertain: { from: '#cbd5e1', to: '#94a3b8', glow: 'rgba(148, 163, 184, 0.5)' },
  tender: { from: '#fda4af', to: '#fb7185', glow: 'rgba(253, 164, 175, 0.5)' },
  restless: { from: '#c4b5fd', to: '#a78bfa', glow: 'rgba(196, 181, 253, 0.5)' },
  heavy: { from: '#9ca3af', to: '#6b7280', glow: 'rgba(107, 114, 128, 0.5)' },
  // Legacy
  anxious: { from: '#fbbf24', to: '#d97706', glow: 'rgba(217, 119, 6, 0.5)' },
  sad: { from: '#818cf8', to: '#6366f1', glow: 'rgba(99, 102, 241, 0.5)' },
  frustrated: { from: '#f87171', to: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
}

// Emotion icons (Lucide)
const EMOTION_ICONS: Record<string, React.ElementType> = {
  // Positive
  grateful: Heart,
  joyful: Sun,
  inspired: Stars,
  loved: Heart,
  peaceful: Moon,
  calm: Leaf,
  hopeful: Stars,
  proud: Shield,
  // Softer/processing
  overwhelmed: Cloud,
  tired: Moon,
  uncertain: Cloud,
  tender: Heart,
  restless: RefreshCw,
  heavy: Cloud,
  // Legacy
  anxious: Cloud,
  sad: Cloud,
  frustrated: RefreshCw,
}

// Get color for moment's primary emotion
function getMomentColor(moment: Moment): { from: string; to: string; glow: string } {
  if (!moment.moods || moment.moods.length === 0) {
    return { from: '#e5e7eb', to: '#d1d5db', glow: 'rgba(209, 213, 219, 0.4)' }
  }
  return EMOTION_COLORS[moment.moods[0]] || { from: '#e5e7eb', to: '#d1d5db', glow: 'rgba(209, 213, 219, 0.4)' }
}

// Get icon for moment's primary emotion
function getMomentIcon(moment: Moment): React.ElementType {
  if (!moment.moods || moment.moods.length === 0) return Sun
  return EMOTION_ICONS[moment.moods[0]] || Sun
}

// Get average emotion score for a moment
function getMomentScore(moment: Moment): number {
  if (!moment.moods || moment.moods.length === 0) return 60 // neutral
  const scores = moment.moods.map(m => EMOTION_SCORES[m] || 60)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Get current ritual category based on time of day
function getCurrentRitualCategory(): 'morning' | 'midday' | 'evening' {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'midday'
  return 'evening'
}

// Get category label for display
function getCategoryLabel(category: string, locale: string): string {
  const labels: Record<string, { en: string; fr: string; es: string }> = {
    morning: { en: 'Morning', fr: 'Matin', es: 'Mañana' },
    midday: { en: 'Midday', fr: 'Midi', es: 'Mediodía' },
    evening: { en: 'Evening', fr: 'Soir', es: 'Noche' },
    selfcare: { en: 'Self-Care', fr: 'Bien-être', es: 'Autocuidado' },
  }
  return locale === 'fr' ? labels[category]?.fr : locale === 'es' ? labels[category]?.es : labels[category]?.en
}

// Resource type icons
const typeIcons: Record<string, React.ElementType> = {
  worksheet: FileText,
  exercise: Puzzle,
  psychoeducation: BookOpen,
  table: Table2,
}

// Get greeting based on time
function getGreeting(locale: string) {
  const hour = new Date().getHours()
  if (locale === 'fr') {
    // French: Bonjour (day), Bonsoir (evening), Bonne nuit (late night)
    if (hour < 18) return 'Bonjour'
    if (hour < 22) return 'Bonsoir'
    return 'Bonne nuit'
  }
  if (locale === 'es') {
    // Spanish: Buenos días (morning), Buenas tardes (afternoon), Buenas noches (evening)
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }
  // English
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

// Get motivational message
function getMotivationalMessage(locale: string) {
  const messages = locale === 'fr'
    ? ['Ce moment est le vôtre', 'Vous avancez bien', 'Chaque pas compte', 'Prenez soin de vous']
    : locale === 'es'
      ? ['Este momento es tuyo', 'Lo estás haciendo muy bien', 'Cada paso cuenta', 'Cuídate mucho']
      : ['This moment is yours', 'You\'re doing great', 'Every step counts', 'Take care of yourself']
  return messages[Math.floor(Math.random() * messages.length)]
}

export default function MyResourcesPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const [members, setMembers] = useState<Member[]>([])
  const [_practitioners, setPractitioners] = useState<PractitionerProfile[]>([])
  const [resources, setResources] = useState<MemberResourceItem[]>([])
  const [invitations, setInvitations] = useState<PendingInvitation[]>([])
  const [todaysMoments, setTodaysMoments] = useState<Moment[]>([])
  const [memberRituals, setMemberRituals] = useState<MemberRitual[]>([])
  const [todayCompletions, setTodayCompletions] = useState<RitualCompletion[]>([])
  const [selectedDateCompletions, setSelectedDateCompletions] = useState<RitualCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [hasConsented, setHasConsented] = useState(true)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [previewMoment, setPreviewMoment] = useState<Moment | null>(null)
  const [previewRitual, setPreviewRitual] = useState<{ ritual: MemberRitual; completion: RitualCompletion | null } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [allMoments, setAllMoments] = useState<Moment[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  // Zoom state: visibleHours is how many hours are shown, centerHour is the center of the view
  const [zoomLevel, setZoomLevel] = useState(1) // 1 = 24h, 2 = 12h, 3 = 8h, 4 = 6h
  const [centerHour, setCenterHour] = useState(12) // Center of visible range
  const [showBloomChat, setShowBloomChat] = useState(false)
  const [showDailyStory, setShowDailyStory] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const flowContainerRef = useRef<HTMLDivElement>(null)
  const [anchorsTab, setAnchorsTab] = useState<'grow' | 'letgo'>('grow')
  const [anchorLogs, setAnchorLogs] = useState<Record<string, number[]>>({}) // habitId -> array of timestamps for today
  const [selectedDateAnchorLogs, setSelectedDateAnchorLogs] = useState<{ anchorId: string; timestamp: number }[]>([]) // For timeline

  // Global onboarding guide (shows automatically for first-time users)
  const { showGuide: showOnboarding, completeGuide: completeOnboarding, loading: onboardingLoading } = useFeatureGuide('onboarding', { autoShow: true })

  // Feature guide for Today's Flow (only show on info button click)
  const { showGuide: showFlowGuide, completeGuide: completeFlowGuide, skipGuide: skipFlowGuide, setShowGuide: setShowFlowGuide } = useFeatureGuide('flow', { autoShow: true })

  // Feature guide for Seeds (only show on info button click or + button)
  const { showGuide: showSeedsGuide, completeGuide: completeSeedsGuide, skipGuide: skipSeedsGuide, setShowGuide: setShowSeedsGuide, guideStatus: seedsGuideStatus } = useFeatureGuide('seeds', { autoShow: false })

  // Bottom nav visibility control
  const { setBlurBottomNav } = useBottomNav()

  useEffect(() => {
    loadData()
  }, [locale, router])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Filter moments and fetch completions when selectedDate changes
  useEffect(() => {
    const targetDate = new Date(selectedDate)
    targetDate.setHours(0, 0, 0, 0)
    const filteredMoments = allMoments.filter(m => {
      const momentDate = new Date(m.created_at)
      momentDate.setHours(0, 0, 0, 0)
      return momentDate.getTime() === targetDate.getTime()
    })
    setTodaysMoments(filteredMoments.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ))

    // Fetch completions for the selected date
    async function fetchCompletionsForDate() {
      if (members.length === 0) return

      const supabase = createClient()
      const memberId = members[0].id
      const dateStr = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD format

      const { data: completionsData } = await supabase
        .from('ritual_completions')
        .select('*')
        .eq('member_id', memberId)
        .eq('completion_date', dateStr)
        .eq('completed', true)

      if (completionsData) {
        setSelectedDateCompletions(completionsData as RitualCompletion[])
      } else {
        setSelectedDateCompletions([])
      }

      // Fetch anchor logs for the selected date
      const { data: anchorLogsData } = await supabase
        .from('anchor_logs')
        .select('anchor_id, logged_at')
        .eq('member_id', memberId)
        .eq('log_date', dateStr)

      if (anchorLogsData) {
        setSelectedDateAnchorLogs(
          anchorLogsData.map(log => ({
            anchorId: log.anchor_id,
            timestamp: new Date(log.logged_at).getTime(),
          }))
        )
      } else {
        setSelectedDateAnchorLogs([])
      }
    }

    fetchCompletionsForDate()
  }, [selectedDate, allMoments, members])

  // Date navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }

  const goToNextDay = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentSelected = new Date(selectedDate)
    currentSelected.setHours(0, 0, 0, 0)

    // Don't allow going past today
    if (currentSelected.getTime() >= today.getTime()) return

    setSelectedDate(prev => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }

  // Check if selected date is today
  const isToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    return today.getTime() === selected.getTime()
  }

  // Format date for display
  const formatSelectedDate = () => {
    if (isToday()) {
      return locale === 'fr' ? "Aujourd'hui" : locale === 'es' ? 'Hoy' : 'Today'
    }
    return selectedDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Zoom helper functions
  const getVisibleHours = () => {
    const hoursMap: Record<number, number> = { 1: 24, 2: 12, 3: 8, 4: 6 }
    return hoursMap[zoomLevel] || 24
  }

  const getVisibleRange = () => {
    const visibleHours = getVisibleHours()
    const halfRange = visibleHours / 2
    let startHour = centerHour - halfRange
    let endHour = centerHour + halfRange

    // Clamp to 0-24
    if (startHour < 0) {
      startHour = 0
      endHour = visibleHours
    }
    if (endHour > 24) {
      endHour = 24
      startHour = 24 - visibleHours
    }

    return { startHour, endHour }
  }

  const handleZoomIn = () => {
    if (zoomLevel < 4) {
      setZoomLevel(prev => prev + 1)
      // Center on current time if viewing today
      if (isToday()) {
        setCenterHour(currentTime.getHours() + currentTime.getMinutes() / 60)
      }
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prev => prev - 1)
    }
  }

  const handlePanLeft = () => {
    const visibleHours = getVisibleHours()
    setCenterHour(prev => Math.max(visibleHours / 2, prev - visibleHours / 4))
  }

  const handlePanRight = () => {
    const visibleHours = getVisibleHours()
    setCenterHour(prev => Math.min(24 - visibleHours / 2, prev + visibleHours / 4))
  }

  // Convert hour to percentage position based on zoom
  const hourToPosition = (hour: number) => {
    const { startHour, endHour } = getVisibleRange()
    return ((hour - startHour) / (endHour - startHour)) * 100
  }

  // Format hour for time labels
  const formatHour = (hour: number) => {
    const h = Math.floor(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}${period}`
  }

  // User's custom anchors state
  const [userAnchors, setUserAnchors] = useState<Anchor[]>([])
  const [showAddAnchor, setShowAddAnchor] = useState(false)
  const [customAnchorMode, setCustomAnchorMode] = useState(false)
  const [customAnchorLabel, setCustomAnchorLabel] = useState('')
  const [customAnchorIcon, setCustomAnchorIcon] = useState<string | null>(null)

  // Blur bottom nav when Add Something dialog is open
  useEffect(() => {
    setBlurBottomNav(showAddAnchor)
  }, [showAddAnchor, setBlurBottomNav])

  // Load anchors and logs from Supabase
  const loadAnchorsData = async (memberId: string) => {
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Load anchors
    const { data: anchorsData } = await supabase
      .from('member_anchors')
      .select('*')
      .eq('member_id', memberId)
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
      .eq('member_id', memberId)
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
  }

  // Log an anchor tap
  const logAnchor = async (anchorId: string) => {
    if (members.length === 0) return

    const supabase = createClient()
    const memberId = members[0].id

    const { error } = await supabase
      .from('anchor_logs')
      .insert({
        member_id: memberId,
        anchor_id: anchorId,
      })

    if (error) {
      console.error('Error logging anchor:', error)
      toast.error(locale === 'fr' ? 'Erreur' : locale === 'es' ? 'Error' : 'Error')
      return
    }

    // Update local state
    const now = Date.now()
    setAnchorLogs(prev => ({
      ...prev,
      [anchorId]: [...(prev[anchorId] || []), now]
    }))

    toast.success(locale === 'fr' ? 'Enregistré!' : locale === 'es' ? '¡Registrado!' : 'Logged!', { duration: 1500 })
  }

  // Get today's count for an anchor
  const getTodayCount = (anchorId: string) => {
    const logs = anchorLogs[anchorId] || []
    return logs.length
  }

  // Add a new anchor
  const addAnchor = async (anchor: Omit<Anchor, 'id'>) => {
    if (members.length === 0) return

    const supabase = createClient()
    const memberId = members[0].id

    const { data, error } = await supabase
      .from('member_anchors')
      .insert({
        member_id: memberId,
        icon: anchor.icon,
        label_en: anchor.labelEn,
        label_fr: anchor.labelFr,
        type: anchor.type,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding anchor:', error)
      toast.error(locale === 'fr' ? 'Erreur' : locale === 'es' ? 'Error' : 'Error')
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
    }

    setShowAddAnchor(false)
    resetCustomAnchorForm()
    toast.success(locale === 'fr' ? 'Ajouté!' : locale === 'es' ? '¡Agregado!' : 'Added!', { duration: 1500 })
  }

  // Reset custom anchor form
  const resetCustomAnchorForm = () => {
    setCustomAnchorMode(false)
    setCustomAnchorLabel('')
    setCustomAnchorIcon(null)
  }

  // Add custom anchor with user-defined label
  const addCustomAnchor = async () => {
    if (!customAnchorLabel.trim() || !customAnchorIcon) return

    await addAnchor({
      icon: customAnchorIcon,
      labelEn: customAnchorLabel.trim(),
      labelFr: customAnchorLabel.trim(),
      type: anchorsTab,
    })
  }

  // Filter anchors by type
  const growAnchors = userAnchors.filter(a => a.type === 'grow')
  const letgoAnchors = userAnchors.filter(a => a.type === 'letgo')

  async function loadData() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      // Check consent status
      const { data: userProfile } = await supabase
        .from('users')
        .select('has_consented')
        .eq('id', user.id)
        .single()
      if (userProfile) {
        setHasConsented(!!userProfile.has_consented)
      }

      const pendingInvitations = await getPendingInvitations()
      setInvitations(pendingInvitations)

      // Load all moments
      const fetchedMoments = await getMemberMoments()
      setAllMoments(fetchedMoments)

      // Filter for selected date (initially today)
      const targetDate = new Date()
      targetDate.setHours(0, 0, 0, 0)
      const filteredMoments = fetchedMoments.filter(m => {
        const momentDate = new Date(m.created_at)
        momentDate.setHours(0, 0, 0, 0)
        return momentDate.getTime() === targetDate.getTime()
      })
      setTodaysMoments(filteredMoments.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ))

      const memberRecords = await getAllMemberRecords()
      setMembers(memberRecords)

      if (memberRecords.length > 0) {
        const practitionerPromises = memberRecords.map(m =>
          getMemberPractitioner(m.practitioner_id)
        )
        const practitionerResults = await Promise.all(practitionerPromises)
        setPractitioners(practitionerResults.filter((p): p is PractitionerProfile => p !== null))

        const resourcePromises = memberRecords.map(m =>
          getAllMemberResources(m.id, m.practitioner_id)
        )
        const resourceResults = await Promise.all(resourcePromises)
        setResources(resourceResults.flat())

        // Load member rituals, anchors, and today's completions
        const memberId = memberRecords[0].id
        const today = new Date().toISOString().split('T')[0]

        // Load daily anchors data
        await loadAnchorsData(memberId)

        // Fetch member's active rituals sorted by planned time
        const { data: ritualsData } = await supabase
          .from('member_rituals')
          .select(`
            *,
            ritual:rituals(*)
          `)
          .eq('member_id', memberId)
          .eq('is_active', true)
          .order('planned_time', { ascending: true, nullsFirst: false })

        if (ritualsData) {
          // Sort by planned_time
          const sorted = [...ritualsData].sort((a, b) => {
            if (!a.planned_time) return 1
            if (!b.planned_time) return -1
            return a.planned_time.localeCompare(b.planned_time)
          })
          setMemberRituals(sorted as MemberRitual[])
        }

        // Fetch today's completions (only completed ones)
        const { data: completionsData } = await supabase
          .from('ritual_completions')
          .select('*')
          .eq('member_id', memberId)
          .eq('completion_date', today)
          .eq('completed', true)

        if (completionsData) {
          setTodayCompletions(completionsData as RitualCompletion[])
          setSelectedDateCompletions(completionsData as RitualCompletion[]) // Also set for selected date (initially today)
        }
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du chargement' : locale === 'es' ? 'Error al cargar los recursos' : 'Error loading resources')
    } finally {
      setLoading(false)
    }
  }

  // Get pending resources (to do)
  const pendingResources = resources.filter(r =>
    r.status === 'pending' || r.status === 'in_progress' || r.status === 'unviewed'
  )

  // Get completed resources
  const completedResources = resources.filter(r =>
    r.status === 'completed' || r.status === 'viewed'
  )

  const handleResourceClick = (item: MemberResourceItem) => {
    if (item.type === 'assignment') {
      router.push(`/fill/${item.assignmentId}`)
    } else {
      router.push(`/fill/shared/${item.resource.id}`)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)
    try {
      await acceptInvitation(invitationId)
      toast.success(locale === 'fr' ? 'Invitation acceptée!' : locale === 'es' ? '¡Invitación aceptada!' : 'Invitation accepted!')
      window.location.reload()
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Error accepting invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId)
    try {
      await rejectInvitation(invitationId)
      toast.success(locale === 'fr' ? 'Invitation refusée' : locale === 'es' ? 'Invitación rechazada' : 'Invitation declined')
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du refus' : locale === 'es' ? 'Error al rechazar la invitación' : 'Error declining invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleShareFlow = async () => {
    if (!flowContainerRef.current || isSharing) return

    setIsSharing(true)
    try {
      const blob = await captureFlowAsImage({
        element: flowContainerRef.current,
        locale,
        date: formatSelectedDate(),
      })

      if (blob) {
        const shared = await shareFlow(blob, locale)
        if (shared) {
          toast.success(locale === 'fr' ? 'Image prête!' : locale === 'es' ? '¡Imagen lista!' : 'Image ready!')
        }
      } else {
        toast.error(locale === 'fr' ? 'Erreur lors de la capture' : locale === 'es' ? 'Error al capturar la imagen' : 'Error capturing image')
      }
    } catch (error) {
      console.error('Error sharing flow:', error)
      toast.error(locale === 'fr' ? 'Erreur lors du partage' : locale === 'es' ? 'Error al compartir' : 'Error sharing')
    } finally {
      setIsSharing(false)
    }
  }

  const handleConsent = async () => {
    setHasConsented(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ has_consented: true }).eq('id', user.id)
    }
  }

  if (loading) {
    return (
      <MemberLayout>
        <LoadingDots fullScreen />
      </MemberLayout>
    )
  }

  const firstName = members[0]?.first_name || ''

  return (
    <MemberLayout>
      <ConsentModal isOpen={!hasConsented} onAccept={handleConsent} locale={locale} />
      {/* Global Onboarding Guide (shown for first-time users - mandatory, takes priority) */}
      {showOnboarding && !onboardingLoading && (
        <FeatureGuide
          featureName="onboarding"
          steps={onboardingGuideSteps}
          onComplete={completeOnboarding}
        />
      )}

      {/* Spotlight walkthrough for Today's Flow (only after onboarding is done) */}
      <FlowSpotlight
        isOpen={showFlowGuide && !showOnboarding}
        onComplete={completeFlowGuide}
        onSkip={skipFlowGuide}
        flowContainerRef={flowContainerRef}
      />

      {/* Feature Guide for Seeds (shown when clicking + if not completed) */}
      {showSeedsGuide && (
        <FeatureGuide
          featureName="seeds"
          steps={seedsGuideSteps}
          onComplete={() => {
            completeSeedsGuide()
            setShowAddAnchor(true)
          }}
          onSkip={() => {
            skipSeedsGuide()
            setShowAddAnchor(true)
          }}
        />
      )}

      {/* Header */}
      <div className="px-5 pt-6 pb-2 safe-area-pt relative z-[100]">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
              {getGreeting(locale)},
            </h1>
            <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
              {firstName || (locale === 'fr' ? 'Ami' : locale === 'es' ? 'Amigo' : 'Friend')}!
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-1.5">
              {getMotivationalMessage(locale)}
              <Clock className="w-4 h-4 text-emerald-500" />
            </p>
          </div>

          {/* Header Icons */}
          <div className="w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-md shadow-emerald-100/30 border border-white/60">
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4 space-y-5">
        {/* Pending Invitations */}
        <AnimatePresence>
          {invitations.map((invitation) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 border border-emerald-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-emerald-600 font-medium">
                    {locale === 'fr' ? 'Nouvelle invitation' : locale === 'es' ? 'Nueva invitación' : 'New invitation'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {invitation.practitioner_name || invitation.practitioner_email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRejectInvitation(invitation.id)}
                  disabled={processingInvitation === invitation.id}
                  className="flex-1 rounded-full border-gray-200"
                >
                  <X className="w-4 h-4 mr-1" />
                  {locale === 'fr' ? 'Refuser' : locale === 'es' ? 'Rechazar' : 'Decline'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={processingInvitation === invitation.id}
                  className="flex-1 rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                  {processingInvitation === invitation.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      {locale === 'fr' ? 'Accepter' : locale === 'es' ? 'Aceptar' : 'Accept'}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Daily Story Card - Shows after 6 PM for today, always for past days */}
        {(todaysMoments.length > 0 || selectedDateAnchorLogs.length > 0 || selectedDateCompletions.length > 0) &&
         (!isToday() || currentTime.getHours() >= 18) && (
          <DailyStoryCard
            momentsCount={todaysMoments.length}
            seedsCount={selectedDateAnchorLogs.length}
            ritualsCount={selectedDateCompletions.length}
            locale={locale}
            onClick={() => setShowDailyStory(true)}
          />
        )}

        {/* Today's Journey - Emotional Flow Visualization */}
        <motion.div
          ref={flowContainerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-lg shadow-emerald-100/30 overflow-hidden"
        >
          {/* Header with date navigation and zoom controls */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 whitespace-nowrap">
                {locale === 'fr' ? 'Fil du jour' : locale === 'es' ? 'Flujo del día' : "Today's Flow"}
              </h3>
              {/* Info button - hidden from capture */}
              <button
                onClick={() => setShowFlowGuide(true)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors ignore-capture"
                title={locale === 'fr' ? "Qu'est-ce que c'est?" : locale === 'es' ? '¿Qué es esto?' : "What's this?"}
              >
                <Info className="w-4 h-4 text-gray-400" />
              </button>
              {/* Share button - hidden from capture, only after 6 PM for today */}
              {(!isToday() || currentTime.getHours() >= 18) && (
                <button
                  onClick={handleShareFlow}
                  disabled={isSharing}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 ignore-capture"
                  title={locale === 'fr' ? 'Partager' : locale === 'es' ? 'Compartir' : 'Share'}
                >
                  {isSharing ? (
                    <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                  ) : (
                    <Share2 className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousDay}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <span className="text-xs font-medium text-gray-600 min-w-[70px] text-center">
                {formatSelectedDate()}
              </span>
              <button
                onClick={goToNextDay}
                disabled={isToday()}
                className={`p-1 rounded-full transition-colors ${
                  isToday()
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Journey Visualization */}
          <div className="relative h-40 bg-emerald-50/50 rounded-2xl overflow-hidden">
            {/* Background grid lines */}
            <div className="absolute inset-0">
              <div className="absolute inset-x-0 top-1/4 border-t border-emerald-100/50" />
              <div className="absolute inset-x-0 top-1/2 border-t border-emerald-200/50" />
              <div className="absolute inset-x-0 top-3/4 border-t border-emerald-100/50" />
            </div>

            {/* Future time fade overlay - only show when viewing today */}
            {isToday() && (() => {
              const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
              const currentPosition = hourToPosition(currentHour)
              // Only show if current time is within visible range
              if (currentPosition < 0 || currentPosition > 100) return null
              return (
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-10"
                  style={{
                    left: `${Math.max(0, Math.min(100, currentPosition))}%`,
                    right: 0,
                    background: 'linear-gradient(to right, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.95) 100%)',
                  }}
                />
              )
            })()}

            {/* Demo overlay for spotlight walkthrough — always shows all example elements so the guide is consistent */}
            {showFlowGuide && (
              <div className="absolute inset-0 z-30 pointer-events-none bg-emerald-50/80">
                {/* Demo current time indicator at 75% */}
                <div
                  data-spotlight="time-indicator"
                  className="absolute top-0 bottom-0 w-px bg-emerald-400/60"
                  style={{ left: '75%' }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </div>
                {/* Demo flow line */}
                <svg data-spotlight="flow-line" className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="demoFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 15 60 C 28 60, 28 30, 40 30 C 52 30, 52 45, 65 45 C 78 45, 78 25, 85 25"
                    fill="none"
                    stroke="url(#demoFlowGradient)"
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    opacity="0.6"
                  />
                </svg>
                {/* Demo moment dots */}
                <div
                  data-spotlight="moment-dot"
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '40%', top: '30%' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '65%', top: '45%' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <Stars className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '85%', top: '25%' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                  >
                    <Sun className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                {/* Demo ritual dot with checkmark */}
                <div
                  data-spotlight="ritual-dot"
                  className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2"
                  style={{ left: '15%' }}
                >
                  <div className="relative">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                      style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                    >
                      <Coffee className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  </div>
                </div>
                {/* Demo seed dots at bottom */}
                <div data-spotlight="seed-dot" className="absolute bottom-2 left-0 right-0 flex justify-center gap-6">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm bg-gradient-to-br from-emerald-400 to-teal-500">
                    <Droplet className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm bg-gradient-to-br from-emerald-400 to-teal-500">
                    <Dumbbell className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm bg-gradient-to-br from-amber-400 to-amber-500">
                    <Smartphone className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            )}

            {/* Empty state - show when no moments and guide not active */}
            {todaysMoments.length === 0 && !showFlowGuide && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <Sun className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 text-center">
                  {isToday()
                    ? (locale === 'fr' ? 'Aucun moment capturé' : locale === 'es' ? 'Aún no hay momentos' : 'No moments yet')
                    : (locale === 'fr' ? 'Aucun moment ce jour' : locale === 'es' ? 'Sin momentos este día' : 'No moments on this day')}
                </p>
                {isToday() && (
                  <p className="text-xs text-gray-300 mt-1">
                    {locale === 'fr' ? 'Capturez votre premier moment' : locale === 'es' ? 'Captura tu primer momento' : 'Capture your first moment'}
                  </p>
                )}
              </div>
            )}

            {/* Connecting flowing curve between moments */}
            {todaysMoments.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                {(() => {
                  const sortedMoments = [...todaysMoments].sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )

                  // Calculate all points (with zoom-aware positioning)
                  // Keep points slightly outside range so curve extends to edge
                  const allPoints = sortedMoments.map(moment => {
                    const momentTime = new Date(moment.created_at)
                    const hours = momentTime.getHours() + momentTime.getMinutes() / 60
                    const score = getMomentScore(moment)
                    const x = hourToPosition(hours)
                    return {
                      x,
                      y: 100 - ((score / 100) * 70 + 15),
                    }
                  })

                  // Filter to points that are in or near visible range
                  const points = allPoints.filter(p => p.x >= -50 && p.x <= 150)

                  // Build smooth curve path using cubic bezier
                  if (points.length < 2) return null

                  // Clamp first and last point x to visible bounds for clean edges
                  const clampedPoints = points.map((p, i) => ({
                    x: Math.max(0, Math.min(100, p.x)),
                    y: p.y
                  }))

                  let pathD = `M ${clampedPoints[0].x} ${clampedPoints[0].y}`

                  for (let i = 1; i < clampedPoints.length; i++) {
                    const prev = clampedPoints[i - 1]
                    const curr = clampedPoints[i]

                    // Control points for smooth curve
                    const midX = (prev.x + curr.x) / 2
                    const cp1x = midX
                    const cp1y = prev.y
                    const cp2x = midX
                    const cp2y = curr.y

                    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
                  }

                  return (
                    <motion.path
                      key={`flow-curve-${zoomLevel}-${centerHour}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
                      d={pathD}
                      fill="none"
                      stroke="url(#flowGradient)"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.5"
                    />
                  )
                })()}
              </svg>
            )}

            {/* Moment orbs - positioned by time and emotion score */}
            {todaysMoments.length > 0 && (
              <div className="absolute inset-0">
                {(() => {
                  const sortedMoments = [...todaysMoments].sort(
                    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                  )

                  // Calculate positions with collision avoidance
                  const positions: { id: string; x: number; y: number }[] = []

                  return sortedMoments.map((moment, i) => {
                    const score = getMomentScore(moment)
                    const momentTime = new Date(moment.created_at)
                    const hours = momentTime.getHours() + momentTime.getMinutes() / 60

                    // X: Time position with zoom-aware calculation
                    let timePosition = hourToPosition(hours)

                    // Skip if outside visible range
                    if (timePosition < -10 || timePosition > 110) return null

                    // Y: Score position (high score = top, low score = bottom)
                    let topPosition = 100 - ((score / 100) * 70 + 15)

                    // Check for overlaps with previous moments and adjust
                    // Collision detection is more sensitive when zoomed in
                    const orbSize = zoomLevel > 1 ? 12 : 8
                    for (const pos of positions) {
                      const dx = Math.abs(timePosition - pos.x)
                      const dy = Math.abs(topPosition - pos.y)

                      // If too close, spread vertically
                      if (dx < orbSize && dy < orbSize * 1.5) {
                        // Alternate up/down offset based on index
                        const offset = (i % 2 === 0 ? -1 : 1) * (orbSize * 1.2)
                        topPosition = Math.max(10, Math.min(90, topPosition + offset))
                      }
                    }

                    positions.push({ id: moment.id, x: timePosition, y: topPosition })

                    const colors = getMomentColor(moment)
                    const Icon = getMomentIcon(moment)

                    return (
                      <motion.div
                        key={moment.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                        style={{ left: `${timePosition}%`, top: `${topPosition}%` }}
                        onClick={() => setPreviewMoment(moment)}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex items-center justify-center border-2 border-white overflow-hidden ${
                            moment.type === 'photo' && moment.media_url
                              ? 'w-8 h-10 rounded-lg'
                              : 'w-8 h-8 rounded-full'
                          }`}
                          style={{
                            background: moment.type === 'photo' && moment.media_url
                              ? 'transparent'
                              : `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                            boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                          }}
                        >
                          {moment.type === 'photo' && moment.media_url ? (
                            <img
                              src={moment.media_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                          )}
                        </motion.div>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Planned rituals on timeline */}
            {memberRituals.length > 0 && (
              <div className="absolute inset-0">
                {(() => {
                  // Filter rituals that were active on the selected date
                  const selectedDateStart = new Date(selectedDate)
                  selectedDateStart.setHours(0, 0, 0, 0)
                  const selectedDateEnd = new Date(selectedDate)
                  selectedDateEnd.setHours(23, 59, 59, 999)

                  const ritualsForDate = memberRituals.filter(mr => {
                    // Check if ritual was added before or on the selected date
                    if (mr.added_at) {
                      const addedDate = new Date(mr.added_at)
                      if (addedDate > selectedDateEnd) return false // Added after this date
                    }

                    // Check if ritual was removed before the selected date
                    if (mr.removed_at) {
                      const removedDate = new Date(mr.removed_at)
                      if (removedDate < selectedDateStart) return false // Removed before this date
                    }

                    return true
                  })

                  return ritualsForDate.map((mr, i) => {
                    if (!mr.planned_time) return null

                    // Use completions for the selected date
                    const completion = selectedDateCompletions.find(
                      c => c.ritual_id === mr.ritual_id && c.completed
                    ) || null
                    const isCompleted = !!completion

                    // Use actual completion time if completed, otherwise use planned time
                    let displayHour: number
                    let displayTimeLabel: string | null = null

                    if (isCompleted && completion?.created_at) {
                      // Use actual completion time
                      const completionTime = new Date(completion.created_at)
                      displayHour = completionTime.getHours() + completionTime.getMinutes() / 60
                      displayTimeLabel = completionTime.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: locale !== 'fr'
                      })
                    } else {
                      // Use planned time (format: "HH:MM:SS")
                      const [hours, minutes] = mr.planned_time.split(':').map(Number)
                      displayHour = hours + minutes / 60
                    }

                    const position = hourToPosition(displayHour)

                    // Skip if outside visible range
                    if (position < -5 || position > 105) return null

                    // Check if viewing today vs past date
                    const viewingToday = isToday()
                    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
                    const isPastTime = displayHour < currentHour
                    const isFutureTime = displayHour > currentHour

                    // For past dates: incomplete rituals are shown in grey (they were missed)
                    // For today: future rituals are blurred, past incomplete are grey
                    const showAsGrey = !isCompleted && (!viewingToday || (viewingToday && isPastTime))
                    const showAsBlurred = viewingToday && isFutureTime && !isCompleted

                    // Get ritual icon and colors
                    const RitualIcon = RITUAL_ICONS[mr.ritual.icon || ''] || Circle
                    const gradient = CATEGORY_GRADIENTS[mr.ritual.category]

                    return (
                      <motion.div
                        key={mr.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2 z-5 cursor-pointer"
                        style={{ left: `${position}%` }}
                        onClick={() => setPreviewRitual({ ritual: mr, completion })}
                      >
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${
                            showAsBlurred ? 'blur-[1px] opacity-50' : ''
                          }`}
                          style={{
                            background: isCompleted
                              ? `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                              : showAsGrey
                                ? '#d1d5db'
                                : `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          <RitualIcon className={`w-3 h-3 ${isCompleted || showAsBlurred ? 'text-white' : showAsGrey ? 'text-gray-500' : 'text-white'}`} />
                        </motion.div>
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {/* Show completion time label */}
                        {isCompleted && displayTimeLabel && (
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 px-1 rounded">
                              {displayTimeLabel}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Anchor logs on timeline */}
            {selectedDateAnchorLogs.length > 0 && userAnchors.length > 0 && (
              <div className="absolute inset-0">
                {(() => {
                  return selectedDateAnchorLogs.map((log, i) => {
                    const anchor = userAnchors.find(a => a.id === log.anchorId)
                    if (!anchor) return null

                    const logTime = new Date(log.timestamp)
                    const hours = logTime.getHours() + logTime.getMinutes() / 60
                    const position = hourToPosition(hours)

                    // Skip if outside visible range
                    if (position < -5 || position > 105) return null

                    const iconData = ANCHOR_ICONS[anchor.icon]
                    const AnchorIcon = iconData?.icon || Circle
                    const isGrow = anchor.type === 'grow'

                    return (
                      <motion.div
                        key={`anchor-${log.anchorId}-${log.timestamp}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                        className="absolute -translate-x-1/2 z-15"
                        style={{ left: `${position}%`, bottom: '8px' }}
                        title={`${locale === 'fr' ? anchor.labelFr : locale === 'es' ? (anchor.labelEs || anchor.labelEn) : anchor.labelEn} - ${logTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center border border-white shadow-sm ${
                            isGrow
                              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                              : 'bg-gradient-to-br from-amber-400 to-amber-500'
                          }`}
                        >
                          <AnchorIcon className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                        </motion.div>
                      </motion.div>
                    )
                  })
                })()}
              </div>
            )}

            {/* Current time indicator - only show when viewing today and time is visible */}
            {isToday() && (() => {
              const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
              const position = hourToPosition(currentHour)
              // Only show if within visible range
              if (position < 0 || position > 100) return null
              return (
                <motion.div
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-0 bottom-0 w-px bg-emerald-400/60 z-10"
                  style={{
                    left: `${position}%`,
                    originY: 0,
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                </motion.div>
              )
            })()}
          </div>

          {/* Time labels - dynamic based on zoom */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            {(() => {
              const { startHour, endHour } = getVisibleRange()
              const range = endHour - startHour

              if (zoomLevel === 1) {
                // Full day view - show Morning, Afternoon, Evening
                return (
                  <>
                    <span>{locale === 'fr' ? 'Matin' : locale === 'es' ? 'Mañana' : 'Morning'}</span>
                    <span>{locale === 'fr' ? 'Après-midi' : locale === 'es' ? 'Tarde' : 'Afternoon'}</span>
                    <span>{locale === 'fr' ? 'Soir' : locale === 'es' ? 'Noche' : 'Evening'}</span>
                  </>
                )
              }

              // Zoomed view - show specific hours
              const numLabels = Math.min(5, Math.ceil(range / 2))
              const step = range / (numLabels - 1)
              return Array.from({ length: numLabels }).map((_, i) => (
                <span key={i}>{formatHour(startHour + i * step)}</span>
              ))
            })()}
          </div>

          {/* Summary and controls row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            {/* Talk to Bloom prompt */}
            <button
              data-spotlight="wanna-talk"
              onClick={() => setShowBloomChat(true)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-500 transition-colors"
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span>{locale === 'fr' ? 'On parle ?' : locale === 'es' ? '¿Hablamos?' : 'Wanna talk?'}</span>
            </button>

            {/* Zoom and pan controls */}
            <div className="flex items-center gap-2">
              {/* Pan controls - only show when zoomed in */}
              {zoomLevel > 1 && (
                <div className="flex items-center gap-0.5 mr-1">
                  <button
                    onClick={handlePanLeft}
                    className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  <span className="text-[10px] text-gray-400">
                    {formatHour(getVisibleRange().startHour)}-{formatHour(getVisibleRange().endHour)}
                  </span>
                  <button
                    onClick={handlePanRight}
                    className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              )}

              {/* Zoom controls */}
              <div className="flex items-center gap-0.5 bg-emerald-50/50 rounded-full px-1.5 py-0.5">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className={`p-0.5 rounded-full transition-colors ${
                    zoomLevel <= 1
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-gray-500 min-w-[24px] text-center font-medium">
                  {getVisibleHours()}h
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className={`p-0.5 rounded-full transition-colors ${
                    zoomLevel >= 4
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'hover:bg-gray-200 text-gray-500'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Daily Seeds Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-lg shadow-emerald-100/30"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {locale === 'fr' ? 'Mes petits pas' : locale === 'es' ? 'Mis pequeños pasos' : 'My Little Steps'}
              </h3>
            </div>
            <button
              onClick={() => router.push('/seeds')}
              className="text-xs text-amber-600 font-medium hover:text-amber-700 flex items-center gap-1"
            >
              {locale === 'fr' ? 'Voir tout' : locale === 'es' ? 'Ver todo' : 'View all'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* All Anchors Grid - Grow and Let Go together */}
          <div className="grid grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {userAnchors.map((anchor, index) => {
                const todayCount = getTodayCount(anchor.id)
                const iconData = ANCHOR_ICONS[anchor.icon]
                const IconComponent = iconData?.icon || Circle
                const isGrow = anchor.type === 'grow'

                return (
                  <motion.button
                    key={anchor.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => logAnchor(anchor.id)}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${
                      isGrow
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200'
                        : 'bg-amber-50 hover:bg-amber-100 border-2 border-amber-100'
                    }`}
                  >
                    <IconComponent className={`w-6 h-6 mb-1 ${
                      isGrow ? 'text-emerald-600' : 'text-amber-400'
                    }`} />
                    <span className="text-[10px] text-gray-500 font-medium text-center leading-tight px-1">
                      {locale === 'fr' ? anchor.labelFr : locale === 'es' ? (anchor.labelEs || anchor.labelEn) : anchor.labelEn}
                    </span>
                    {/* Count badge */}
                    {todayCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                          isGrow ? 'bg-emerald-500' : 'bg-amber-300'
                        }`}
                      >
                        {todayCount}
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>

            {/* Add custom anchor button - opens modal or guide */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => {
                // Show guide if not completed yet
                if (!seedsGuideStatus?.completed && !seedsGuideStatus?.skipped) {
                  setShowSeedsGuide(true)
                } else {
                  setShowAddAnchor(true)
                }
              }}
              className="aspect-square rounded-2xl flex items-center justify-center border-2 border-dashed border-amber-300 text-amber-400 hover:border-amber-400 hover:text-amber-500 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Empty state hint */}
          {userAnchors.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {locale === 'fr'
                ? 'Ajoutez des ancres à suivre'
                : locale === 'es'
                  ? 'Agrega anclas para seguir'
                  : 'Add anchors to track'}
            </p>
          )}

          {/* Hint text when has anchors */}
          {userAnchors.length > 0 && (
            <p className="text-center text-xs text-gray-400 mt-3">
              {locale === 'fr'
                ? 'Tapez pour enregistrer'
                : locale === 'es'
                  ? 'Toca para registrar'
                  : 'Tap to log'}
            </p>
          )}
        </motion.div>

        {/* Add Anchor Modal */}
        <AnimatePresence>
          {showAddAnchor && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowAddAnchor(false); resetCustomAnchorForm() }}
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
                    {customAnchorMode
                      ? (locale === 'fr' ? 'Créer une ancre' : locale === 'es' ? 'Crear un ancla' : 'Create Anchor')
                      : (locale === 'fr' ? 'Ajouter quelque chose' : locale === 'es' ? 'Agregar algo' : 'Add Something')}
                  </h3>
                  <button
                    onClick={() => { setShowAddAnchor(false); resetCustomAnchorForm() }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setAnchorsTab('grow')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      anchorsTab === 'grow'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Sprout className="w-4 h-4" />
                    {locale === 'fr' ? 'Garder' : locale === 'es' ? 'Cultivar' : 'Grow'}
                  </button>
                  <button
                    onClick={() => setAnchorsTab('letgo')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      anchorsTab === 'letgo'
                        ? 'bg-amber-300 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Leaf className="w-4 h-4" />
                    {locale === 'fr' ? 'Alléger' : locale === 'es' ? 'Soltar' : 'Let Go'}
                  </button>
                </div>

                {customAnchorMode ? (
                  /* Custom anchor creation mode */
                  <div className="space-y-4">
                    {/* Custom label input */}
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">
                        {locale === 'fr' ? 'Nom de l\'ancre:' : locale === 'es' ? 'Nombre del ancla:' : 'Anchor name:'}
                      </label>
                      <input
                        type="text"
                        value={customAnchorLabel}
                        onChange={(e) => setCustomAnchorLabel(e.target.value)}
                        placeholder={anchorsTab === 'grow'
                          ? (locale === 'fr' ? 'Ex: Journaling' : locale === 'es' ? 'Ej: Diario personal' : 'Ex: Journaling')
                          : (locale === 'fr' ? 'Ex: Junk food' : locale === 'es' ? 'Ej: Comida chatarra' : 'Ex: Junk food')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm"
                        maxLength={30}
                        autoFocus
                      />
                    </div>

                    {/* Icon picker for custom */}
                    <div>
                      <label className="text-sm text-gray-500 mb-2 block">
                        {locale === 'fr' ? 'Choisir une icône:' : locale === 'es' ? 'Elige un ícono:' : 'Choose an icon:'}
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(ANCHOR_ICONS).map(([key, data]) => {
                          const IconComp = data.icon
                          const isSelected = customAnchorIcon === key
                          return (
                            <button
                              key={key}
                              onClick={() => setCustomAnchorIcon(key)}
                              className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                                isSelected
                                  ? anchorsTab === 'grow'
                                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                                    : 'bg-amber-300 text-white ring-2 ring-amber-100'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <IconComp className="w-5 h-5" />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => resetCustomAnchorForm()}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        {locale === 'fr' ? 'Retour' : locale === 'es' ? 'Volver' : 'Back'}
                      </button>
                      <button
                        onClick={addCustomAnchor}
                        disabled={!customAnchorLabel.trim() || !customAnchorIcon}
                        className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                          customAnchorLabel.trim() && customAnchorIcon
                            ? anchorsTab === 'grow'
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : 'bg-amber-300 hover:bg-amber-400'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {locale === 'fr' ? 'Ajouter' : locale === 'es' ? 'Agregar' : 'Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Default mode - predefined options */
                  <>
                    {/* Icon selection grid - filtered by type */}
                    <p className="text-sm text-gray-500 mb-3">
                      {locale === 'fr' ? 'Que souhaitez-vous faire ?' : locale === 'es' ? '¿Qué te gustaría hacer?' : 'What would you like to do?'}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {(anchorsTab === 'grow' ? GROW_ANCHOR_OPTIONS : LETGO_ANCHOR_OPTIONS).map((key) => {
                        const data = ANCHOR_ICONS[key]
                        if (!data) return null
                        const IconComp = data.icon
                        const alreadyAdded = userAnchors.some(a => a.icon === key)
                        return (
                          <button
                            key={key}
                            onClick={() => !alreadyAdded && addAnchor({
                              icon: key,
                              labelEn: data.labelEn,
                              labelFr: data.labelFr,
                              type: anchorsTab,
                            })}
                            disabled={alreadyAdded}
                            className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                              alreadyAdded
                                ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                : anchorsTab === 'grow'
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:scale-105 active:scale-95'
                                  : 'bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <IconComp className={`w-5 h-5 ${
                              alreadyAdded
                                ? 'text-gray-300'
                                : anchorsTab === 'grow' ? 'text-emerald-600' : 'text-amber-400'
                            }`} />
                            <span className={`text-[9px] font-medium text-center leading-tight ${
                              alreadyAdded ? 'text-gray-300' : 'text-gray-500'
                            }`}>
                              {locale === 'fr' ? data.labelFr : locale === 'es' ? data.labelEn : data.labelEn}
                            </span>
                          </button>
                        )
                      })}
                      {/* Create custom option - last in grid */}
                      <button
                        onClick={() => setCustomAnchorMode(true)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 border-dashed hover:scale-105 active:scale-95 ${
                          anchorsTab === 'grow'
                            ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                            : 'border-amber-100 text-amber-400 hover:bg-amber-50'
                        }`}
                      >
                        <Plus className={`w-5 h-5 ${anchorsTab === 'grow' ? 'text-emerald-600' : 'text-amber-400'}`} />
                        <span className="text-[9px] font-medium text-center leading-tight text-gray-500">
                          {locale === 'fr' ? 'Créer' : locale === 'es' ? 'Crear' : 'Create'}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Upcoming Rituals Section */}
        {(() => {
          const currentCategory = getCurrentRitualCategory()
          const incompleteRituals = memberRituals.filter(mr => {
            // Only show rituals for current time of day
            if (mr.ritual.category !== currentCategory) return false
            // Check if not completed today
            const isCompleted = todayCompletions.some(
              c => c.ritual_id === mr.ritual_id && c.completed
            )
            return !isCompleted
          })

          if (incompleteRituals.length === 0 && memberRituals.length === 0) return null

          const gradient = CATEGORY_GRADIENTS[currentCategory]

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-5 border border-white/60 shadow-lg shadow-emerald-100/30"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`
                    }}
                  >
                    <Circle className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {locale === 'fr' ? 'Rituels à venir' : locale === 'es' ? 'Próximos rituales' : 'Upcoming Rituals'}
                  </h3>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  {getCategoryLabel(currentCategory, locale)}
                </span>
              </div>

              {/* Rituals List */}
              {incompleteRituals.length > 0 ? (
                <div className="space-y-2">
                  {incompleteRituals.slice(0, 3).map((mr, index) => {
                    const RitualIcon = RITUAL_ICONS[mr.ritual.icon || ''] || Circle
                    const catGradient = CATEGORY_GRADIENTS[mr.ritual.category]

                    return (
                      <motion.div
                        key={mr.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        onClick={() => router.push('/rituals')}
                        className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors active:scale-[0.98]"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${catGradient.from}, ${catGradient.to})`,
                          }}
                        >
                          <RitualIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {locale === 'fr' ? mr.ritual.name_fr : locale === 'es' ? mr.ritual.name : mr.ritual.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {mr.planned_time && (
                              <span className="font-medium">{mr.planned_time.slice(0, 5)} • </span>
                            )}
                            {mr.ritual.duration_suggestion && `${mr.ritual.duration_suggestion} min`}
                          </p>
                        </div>
                        <Play className="w-4 h-4 text-gray-300" />
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2"
                  >
                    <Check className="w-6 h-6 text-emerald-600" />
                  </motion.div>
                  <p className="text-sm text-gray-600 font-medium">
                    {locale === 'fr' ? 'Tous les rituels complétés!' : locale === 'es' ? '¡Todos los rituales completados!' : 'All rituals completed!'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {locale === 'fr'
                      ? `${getCategoryLabel(currentCategory, locale)} est fait`
                      : locale === 'es'
                        ? `${getCategoryLabel(currentCategory, locale)} está listo`
                        : `${getCategoryLabel(currentCategory, locale)} is done`}
                  </p>
                </div>
              )}

              {/* View All Link */}
              {memberRituals.length > 0 && (
                <motion.button
                  onClick={() => router.push('/rituals')}
                  className="w-full mt-3 py-2.5 text-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {locale === 'fr' ? 'Voir tous les rituels' : locale === 'es' ? 'Ver todos los rituales' : 'View all rituals'} →
                </motion.button>
              )}
            </motion.div>
          )
        })()}

        {/* Empty State */}
        {resources.length === 0 && invitations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/60 shadow-lg shadow-emerald-100/30"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'fr' ? 'Bienvenue!' : locale === 'es' ? '¡Bienvenido!' : 'Welcome!'}
            </h3>
            <p className="text-gray-500 text-sm">
              {locale === 'fr'
                ? 'Vos ressources apparaîtront ici une fois partagées par votre praticien.'
                : locale === 'es'
                  ? 'Tus recursos aparecerán aquí una vez que tu profesional los comparta.'
                  : 'Your resources will appear here once shared by your practitioner.'}
            </p>
          </motion.div>
        )}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>

      {/* Preview Modal - Moments */}
      <AnimatePresence>
        {previewMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setPreviewMoment(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl"
            >
              {/* Preview Media */}
              {previewMoment.media_url && previewMoment.type === 'photo' && (
                <div className="w-full aspect-square">
                  <img
                    src={previewMoment.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {previewMoment.media_url && previewMoment.type === 'video' && (
                <div className="w-full aspect-square bg-gray-900 flex items-center justify-center">
                  <video
                    src={previewMoment.media_url}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Mood tags */}
                {previewMoment.moods && previewMoment.moods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {previewMoment.moods.map(mood => {
                      const moodColors = getMomentColor({ ...previewMoment, moods: [mood] })
                      return (
                        <span
                          key={mood}
                          className="px-2.5 py-1 rounded-full text-xs font-medium text-white capitalize"
                          style={{ background: `linear-gradient(135deg, ${moodColors.from}, ${moodColors.to})` }}
                        >
                          {mood}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Text */}
                {(previewMoment.text_content || previewMoment.caption) && (
                  <p className="text-gray-700 text-sm line-clamp-3 mb-3">
                    {previewMoment.text_content || previewMoment.caption}
                  </p>
                )}

                {/* Time */}
                <p className="text-gray-400 text-xs mb-4">
                  {new Date(previewMoment.created_at).toLocaleTimeString(locale, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Close button */}
                <button
                  onClick={() => setPreviewMoment(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium"
                >
                  {locale === 'fr' ? 'Fermer' : locale === 'es' ? 'Cerrar' : 'Close'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal - Rituals */}
      <AnimatePresence>
        {previewRitual && (() => {
          const { ritual: mr, completion } = previewRitual
          const RitualIcon = RITUAL_ICONS[mr.ritual.icon || ''] || Circle
          const gradient = CATEGORY_GRADIENTS[mr.ritual.category]
          const isCompleted = !!completion

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setPreviewRitual(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl w-full max-w-xs overflow-hidden shadow-2xl"
              >
                {/* Ritual Header with gradient */}
                <div
                  className="p-6 flex flex-col items-center"
                  style={{
                    background: `linear-gradient(135deg, ${gradient.from}20, ${gradient.to}20)`,
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                    }}
                  >
                    <RitualIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center">
                    {locale === 'fr' ? mr.ritual.name_fr : locale === 'es' ? mr.ritual.name : mr.ritual.name}
                  </h3>
                  <span
                    className="mt-2 px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                  >
                    {getCategoryLabel(mr.ritual.category, locale)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Description */}
                  {(mr.ritual.description || mr.ritual.description_fr) && (
                    <p className="text-gray-600 text-sm mb-4">
                      {locale === 'fr' ? mr.ritual.description_fr : locale === 'es' ? mr.ritual.description : mr.ritual.description}
                    </p>
                  )}

                  {/* Benefit */}
                  {(mr.ritual.benefit || mr.ritual.benefit_fr) && (
                    <div className="bg-emerald-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-emerald-600 font-medium mb-1">
                        {locale === 'fr' ? 'Bienfait' : locale === 'es' ? 'Beneficio' : 'Benefit'}
                      </p>
                      <p className="text-sm text-emerald-700">
                        {locale === 'fr' ? mr.ritual.benefit_fr : locale === 'es' ? mr.ritual.benefit : mr.ritual.benefit}
                      </p>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {mr.planned_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{locale === 'fr' ? 'Prévu' : locale === 'es' ? 'Planificado' : 'Planned'}: {mr.planned_time.slice(0, 5)}</span>
                      </div>
                    )}
                    {mr.ritual.duration_suggestion && (
                      <span>{mr.ritual.duration_suggestion} min</span>
                    )}
                  </div>

                  {/* Completion Status */}
                  {isCompleted && completion?.created_at && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl mb-4">
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-700">
                          {locale === 'fr' ? 'Complété' : locale === 'es' ? 'Completado' : 'Completed'}
                        </p>
                        <p className="text-xs text-emerald-600">
                          {new Date(completion.created_at).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : locale === 'es' ? 'es-ES' : 'en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: locale !== 'fr'
                          })}
                          {completion.duration_minutes && ` • ${completion.duration_minutes} min`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Notes if any */}
                  {completion?.notes && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-gray-500 font-medium mb-1">
                        {locale === 'fr' ? 'Notes' : locale === 'es' ? 'Notas' : 'Notes'}
                      </p>
                      <p className="text-sm text-gray-700">{completion.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewRitual(null)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium"
                    >
                      {locale === 'fr' ? 'Fermer' : locale === 'es' ? 'Cerrar' : 'Close'}
                    </button>
                    {!isCompleted && (
                      <button
                        onClick={() => {
                          setPreviewRitual(null)
                          router.push('/rituals')
                        }}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
                      >
                        {locale === 'fr' ? 'Commencer' : locale === 'es' ? 'Comenzar' : 'Start'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Bloom Chat */}
      <BloomChatInterface
        isOpen={showBloomChat}
        onClose={() => setShowBloomChat(false)}
        isDark={false}
        entryPoint="home"
      />

      {/* Daily Story */}
      <AnimatePresence>
        {showDailyStory && (
          <DailyStory
            moments={todaysMoments.map(m => ({
              id: m.id,
              type: m.type,
              media_url: m.media_url,
              text_content: m.text_content,
              caption: m.caption || undefined,
              created_at: m.created_at,
            }))}
            seedLogs={selectedDateAnchorLogs.map(log => {
              const anchor = userAnchors.find(a => a.id === log.anchorId)
              return {
                id: `${log.anchorId}-${log.timestamp}`,
                anchor: {
                  icon: anchor?.icon || 'leaf',
                  labelEn: anchor?.labelEn || '',
                  labelFr: anchor?.labelFr || '',
                  type: anchor?.type || 'grow',
                },
                logged_at: new Date(log.timestamp).toISOString(),
              }
            })}
            rituals={selectedDateCompletions.filter(c => c.completed).map(completion => {
              const memberRitual = memberRituals.find(mr => mr.ritual_id === completion.ritual_id)
              return {
                id: completion.id,
                name: memberRitual?.ritual.name || '',
                nameFr: memberRitual?.ritual.name_fr || memberRitual?.ritual.name || '',
                icon: memberRitual?.ritual.icon || 'circle',
                duration_minutes: completion.duration_minutes,
                completed_at: completion.created_at,
              }
            })}
            locale={locale}
            onClose={() => setShowDailyStory(false)}
          />
        )}
      </AnimatePresence>
    </MemberLayout>
  )
}

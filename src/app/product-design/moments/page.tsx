'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Fingerprint,
  Camera,
  Mic,
  Video,
  PenLine,
  Heart,
  Sparkles,
  Clock,
  Eye,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Smartphone,
  Bell,
  Star,
  TrendingUp,
  BarChart3,
  Zap,
  RefreshCw,
  MessageSquare,
  XCircle,
  CircleDot,
  Smile,
  Frown,
  Meh,
  Image,
  Play,
  Plus,
  Shield,
  Users,
  Calendar,
  Mail,
  Home,
  Moon,
  Sprout,
  Layers,
  Globe,
  Share2,
  Flower2,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
)

// ══════════════════════════════════════════════════════════════════════════
// ── FLOW SCREEN DATA ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

interface FlowScreen {
  id: string
  title: string
  status: 'built' | 'partial' | 'missing'
  theme: 'light' | 'dark'
  wireframe: { type: 'header' | 'button' | 'input' | 'text' | 'card' | 'icon-row' | 'image' | 'nav' | 'fab'; label: string; highlight?: boolean; color?: string }[]
  userTaps: string
  emotion: string
  emotionIcon: 'smile' | 'meh' | 'frown'
  timeOnScreen: string
  notes?: string
}

// ── Flow 1: Home → Trigger → Capture Entry ──────────────────────────────

const HOME_FLOW: FlowScreen[] = [
  {
    id: 'H1', title: 'Home Screen', status: 'built', theme: 'light',
    wireframe: [
      { type: 'header', label: 'Good evening, Aditya! 🔔' },
      { type: 'text', label: '"Take care of yourself" 😊' },
      { type: 'card', label: '💜 Your Day — 0 moments · 0 seeds ▶️', color: 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50' },
      { type: 'card', label: '📈 Today\'s Flow — Morning · Afternoon · Evening' },
      { type: 'text', label: '"No moments yet"' },
      { type: 'card', label: '💬 Wanna talk? — 24h' },
      { type: 'card', label: '🌱 My Little Steps — Exercise, Sugar, Reading...' },
      { type: 'nav', label: '🏠 Home    ✨ Moments    ⭕ Rituals    ☰ Menu' },
      { type: 'fab', label: '📸', highlight: true, color: 'bg-pink-500 text-white' },
    ],
    userTaps: 'Taps pink 📸 FAB button (bottom right)',
    emotion: 'Neutral — browsing', emotionIcon: 'meh', timeOnScreen: '5-15s',
  },
]

// ── Flow 2: Capture Wizard (4 Steps) ────────────────────────────────────

const CAPTURE_STEP1: FlowScreen = {
  id: 'C1', title: 'Step 1: Type', status: 'built', theme: 'dark',
  wireframe: [
    { type: 'header', label: '✕   New Moment' },
    { type: 'text', label: 'Type → Capture → Preview → Details' },
    { type: 'text', label: '"How would you like to capture this moment?"' },
    { type: 'card', label: '📸 Photo — Take or upload a photo', color: 'border-pink-400 bg-pink-950' },
    { type: 'card', label: '🎥 Video — Record or upload a video', color: 'border-purple-400 bg-purple-950' },
    { type: 'card', label: '🎤 Voice — Record a voice note', color: 'border-orange-400 bg-orange-950' },
    { type: 'card', label: '✍️ Write — Write your thoughts', color: 'border-emerald-400 bg-emerald-950' },
  ],
  userTaps: 'Selects one of 4 format cards (e.g., Photo)',
  emotion: 'Engaged — choosing expression', emotionIcon: 'smile', timeOnScreen: '2-5s',
}

const CAPTURE_BRANCHES: FlowScreen[] = [
  {
    id: 'C2a', title: 'Step 2: Photo Capture', status: 'built', theme: 'dark',
    wireframe: [
      { type: 'header', label: '←   Photo   ✕' },
      { type: 'text', label: 'Type → Capture → Preview → Details' },
      { type: 'image', label: '┌─────────────────┐\n│    📷 Camera     │\n│  Tap to take a   │\n│     photo        │\n└─────────────────┘' },
      { type: 'button', label: 'Choose from gallery', highlight: false },
    ],
    userTaps: 'Taps camera area → opens native camera\nOR taps "Choose from gallery"',
    emotion: 'Present — noticing something', emotionIcon: 'smile', timeOnScreen: '5-15s',
  },
  {
    id: 'C2b', title: 'Step 2: Voice Capture', status: 'built', theme: 'dark',
    wireframe: [
      { type: 'header', label: '←   Voice   ✕' },
      { type: 'text', label: 'Type → Capture → Preview → Details' },
      { type: 'image', label: '〰️ [Waveform] 〰️\n0:12 / 2:00' },
      { type: 'button', label: '⏺ Record / ⏹ Stop', highlight: true, color: 'bg-red-500 text-white' },
    ],
    userTaps: 'Taps record → speaks → stops recording',
    emotion: 'Vulnerable — verbalizing feelings', emotionIcon: 'meh', timeOnScreen: '15-60s',
  },
  {
    id: 'C2c', title: 'Step 2: Write Capture', status: 'built', theme: 'dark',
    wireframe: [
      { type: 'header', label: '←   Write   ✕' },
      { type: 'text', label: 'Type → Capture → Preview → Details' },
      { type: 'input', label: '"Write your thoughts..."' },
      { type: 'button', label: 'Next →', highlight: true, color: 'bg-gray-700 text-white' },
    ],
    userTaps: 'Types a reflection → taps Next',
    emotion: 'Reflective — organizing thoughts', emotionIcon: 'meh', timeOnScreen: '15-45s',
  },
]

const CAPTURE_STEP3: FlowScreen = {
  id: 'C3', title: 'Step 3: Preview', status: 'built', theme: 'dark',
  wireframe: [
    { type: 'header', label: '←   Photo 1/7   ✕' },
    { type: 'text', label: 'Type → Capture → Preview → Details' },
    { type: 'text', label: '1/7 items' },
    { type: 'image', label: '[Photo thumbnail] ✕' },
    { type: 'text', label: 'Add:  📸  🎥  🎤  (mix media types)' },
    { type: 'icon-row', label: '🗑️ Delete' },
    { type: 'button', label: '✨ Continue', highlight: true, color: 'bg-emerald-500 text-white' },
  ],
  userTaps: 'Reviews media → optionally adds more (up to 7)\nTaps "Continue"',
  emotion: 'Reviewing — "does this capture it?"', emotionIcon: 'smile', timeOnScreen: '5-15s',
  notes: 'Can add up to 7 items per moment. Can mix photo + video + voice in one moment.',
}

const CAPTURE_STEP4: FlowScreen = {
  id: 'C4', title: 'Step 4: Details', status: 'built', theme: 'light',
  wireframe: [
    { type: 'header', label: '←   Photo 1/7   ✕' },
    { type: 'text', label: 'Type → Capture → Preview → Details' },
    { type: 'image', label: '[Media preview]  ·  1 media item' },
    { type: 'text', label: '"How are you feeling?"' },
    { type: 'icon-row', label: '🙏 Grateful  🌿 Peaceful  ✨ Joyful  🌱 Inspired  💕 Loved' },
    { type: 'icon-row', label: '🧘 Calm  ☀️ Hopeful  🏆 Proud' },
    { type: 'icon-row', label: '😮‍💨 Overwhelmed  🌙 Tired  🌫️ Uncertain  🌸 Tender' },
    { type: 'icon-row', label: '💬 Restless  🌊 Heavy' },
    { type: 'input', label: '"Describe this moment..." (optional note)' },
    { type: 'button', label: '📤 Save Moment', highlight: true, color: 'bg-emerald-500 text-white' },
  ],
  userTaps: 'Selects 1-3 moods (highlighted green)\nOptionally writes a note\nTaps "Save Moment"',
  emotion: 'Self-aware — naming what I feel', emotionIcon: 'smile', timeOnScreen: '5-15s',
  notes: '14 moods: 8 positive + 6 negative/neutral. Selected mood gets green border highlight.',
}

// ── Flow 3: Post-Save → Home Update ─────────────────────────────────────

const POST_SAVE_FLOW: FlowScreen[] = [
  {
    id: 'P1', title: 'Home (After Save)', status: 'built', theme: 'light',
    wireframe: [
      { type: 'header', label: 'Aditya!  "Every step counts" 🔔' },
      { type: 'card', label: '💜 Your Day — 1 moment · seeds ▶️', highlight: true, color: 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50' },
      { type: 'card', label: '📈 Today\'s Flow' },
      { type: 'image', label: 'Morning ———— Afternoon ———— Evening\n                                                    [📷]' },
      { type: 'text', label: 'Moment thumbnail appears at capture time' },
      { type: 'card', label: '💬 Wanna talk? — 24h' },
      { type: 'card', label: '🌱 My Little Steps' },
      { type: 'nav', label: '🏠 Home    ✨ Moments    ⭕ Rituals    ☰ Menu' },
    ],
    userTaps: 'Sees updated home → moment on timeline\nCaptures more moments throughout day',
    emotion: 'Satisfied — "I captured something"', emotionIcon: 'smile', timeOnScreen: '10-30s',
  },
]

// ── Flow 4: Full Day → Emotional Curve ──────────────────────────────────

const FULL_DAY_FLOW: FlowScreen[] = [
  {
    id: 'D1', title: 'Today\'s Flow (Populated)', status: 'built', theme: 'light',
    wireframe: [
      { type: 'header', label: '←  29 Jan  →' },
      { type: 'card', label: '💜 Your Day — 6 moments · 5 seeds ▶️', highlight: true, color: 'border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50' },
      { type: 'image', label: '       📷  😊  📷  📷  😌  🎤  ☀️  📷\nMorning ─╱──╲──╱─╲──╱──╲──╱╲─── Evening\n         ╱    ╲╱   ╲╱    ╲╱  ╲\n    ───╱──────────────────────╲───' },
      { type: 'text', label: 'Teal line connects all moments — highs and lows' },
      { type: 'text', label: 'Thumbnails + mood icons positioned at capture times' },
      { type: 'text', label: 'Line height = emotional intensity from mood tags' },
    ],
    userTaps: 'Scrolls timeline → taps individual moments\nNavigates to previous days with < > arrows',
    emotion: 'Moved — seeing the emotional shape of my day', emotionIcon: 'smile', timeOnScreen: '30-120s',
    notes: 'The more moments captured, the richer the curve. This IS the core reward — watching your day take visual shape.',
  },
  {
    id: 'D2', title: 'Your Day Story (Intro)', status: 'built', theme: 'dark',
    wireframe: [
      { type: 'text', label: '▬ ▬ ▬ ▬ ▬ ▬  (story progress bar)          ✕' },
      { type: 'text', label: '' },
      { type: 'image', label: '🌙' },
      { type: 'text', label: 'Your Day' },
      { type: 'text', label: '6 moments · 1 ritual · 5 seeds' },
      { type: 'text', label: '✨ "Here\'s what you felt today"' },
      { type: 'text', label: '' },
      { type: 'text', label: 'Tap to continue' },
    ],
    userTaps: 'Taps to advance through story slides\nEach moment = one slide',
    emotion: 'Reflective — replaying the day', emotionIcon: 'smile', timeOnScreen: '30-90s',
    notes: 'Instagram Stories-style full-screen recap. Progress bar segments = number of slides. Summary stats: moments, rituals, seeds.',
  },
]

// ── Screen Node Component ───────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = { built: 'bg-emerald-400', partial: 'bg-amber-400', missing: 'bg-red-400' }
const STATUS_LABEL: Record<string, string> = { built: 'Built', partial: 'Partial', missing: 'Missing' }

function ScreenNode({ screen }: { screen: FlowScreen }) {
  const isDark = screen.theme === 'dark'
  return (
    <div className={`rounded-2xl shadow-sm w-full max-w-[240px] overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Top bar */}
      <div className={`px-3 py-1.5 flex items-center justify-between ${isDark ? 'bg-gray-900' : 'bg-gray-50 border-b border-gray-200'}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-[8px] font-mono font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{screen.id}</span>
          <span className={`text-[9px] font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{screen.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[screen.status]}`} />
          <span className="text-[7px] text-gray-400">{STATUS_LABEL[screen.status]}</span>
        </div>
      </div>
      {/* Wireframe */}
      <div className={`px-3 py-2.5 space-y-1.5 min-h-[140px] ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {screen.wireframe.map((el, i) => {
          const textColor = isDark ? 'text-gray-400' : 'text-gray-500'
          const headerColor = isDark ? 'text-gray-300' : 'text-gray-700'
          switch (el.type) {
            case 'header': return <p key={i} className={`text-[9px] font-bold ${headerColor} border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} pb-1`}>{el.label}</p>
            case 'button': return <div key={i} className={`text-[8px] font-semibold text-center py-1.5 rounded-lg ${el.highlight ? (el.color || 'bg-emerald-500 text-white') + ' ring-2 ring-emerald-300 ring-offset-1' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'} ${isDark ? 'ring-offset-gray-900' : ''}`}>{el.label}</div>
            case 'input': return <div key={i} className={`text-[8px] ${textColor} border border-dashed ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded px-2 py-1.5`}>{el.label}</div>
            case 'text': return <p key={i} className={`text-[8px] ${textColor} leading-relaxed`}>{el.label || '\u00A0'}</p>
            case 'card': return <div key={i} className={`text-[8px] ${isDark ? 'text-gray-300' : 'text-gray-600'} border rounded-lg px-2 py-1.5 ${el.color || (isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50')}`}>{el.label}</div>
            case 'icon-row': return <p key={i} className={`text-[7px] ${textColor} ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded px-1.5 py-1 leading-relaxed`}>{el.label}</p>
            case 'image': return <div key={i} className={`text-[8px] ${textColor} text-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg py-2 px-2 whitespace-pre-line font-mono leading-relaxed`}>{el.label}</div>
            case 'nav': return <p key={i} className={`text-[7px] text-center ${isDark ? 'text-gray-500 bg-gray-800 border-gray-700' : 'text-gray-400 bg-gray-50 border-gray-200'} border-t rounded-b px-1 py-1.5`}>{el.label}</p>
            case 'fab': return <div key={i} className={`text-[10px] font-bold text-center py-1 rounded-full w-8 h-8 flex items-center justify-center ml-auto ${el.color || 'bg-pink-500 text-white'} ring-2 ring-pink-300 ring-offset-1`}>{el.label}</div>
            default: return null
          }
        })}
      </div>
      {/* Bottom: action + emotion */}
      <div className={`${isDark ? 'bg-gray-950 border-t border-gray-800' : 'bg-gray-50 border-t border-gray-100'} px-3 py-2`}>
        <p className={`text-[8px] ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium mb-1 whitespace-pre-line`}>👆 {screen.userTaps}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {screen.emotionIcon === 'smile' ? <Smile className="w-3 h-3 text-emerald-400" /> : screen.emotionIcon === 'meh' ? <Meh className="w-3 h-3 text-gray-400" /> : <Frown className="w-3 h-3 text-amber-500" />}
            <span className="text-[7px] text-gray-500">{screen.emotion}</span>
          </div>
          <span className="text-[7px] text-gray-400">{screen.timeOnScreen}</span>
        </div>
        {screen.notes && <p className="text-[7px] text-blue-400 mt-1 leading-relaxed">{screen.notes}</p>}
      </div>
    </div>
  )
}

function FlowArrow({ label, direction = 'down', critical }: { label?: string; direction?: 'down' | 'right'; critical?: boolean }) {
  if (direction === 'right') {
    return (
      <div className="flex flex-col items-center justify-center px-2 shrink-0">
        {label && <p className="text-[7px] text-gray-400 mb-0.5 whitespace-nowrap">{label}</p>}
        <ArrowRight className={`w-4 h-4 ${critical ? 'text-red-400' : 'text-gray-300'}`} />
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center py-1.5 shrink-0">
      <ArrowDown className={`w-4 h-4 ${critical ? 'text-red-400' : 'text-gray-300'}`} />
      {label && <p className="text-[7px] text-gray-400 mt-0.5">{label}</p>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// ── PAGE ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

// ── Analytics types ──────────────────────────────────────────────────────

interface AnalyticsData {
  empty: boolean
  totalMoments: number
  totalUsers: number
  avgMomentsPerUser: number
  avgMomentsPerDay: number
  avgMoodsPerMoment: number
  captionRate: number
  moodTagRate: number
  byType: Record<string, number>
  moods: { mood: string; count: number; pct: number }[]
  perUser: {
    userId: string; total: number; firstMoment: string; lastMoment: string
    daySpan: number; activeDays: number; avgPerDay: number
    typesUsed: string[]; topMood: string | null; captionRate: number
  }[]
  streaks: { userId: string; maxStreak: number; totalDays: number }[]
  timeOfDay: Record<string, number>
  hourly: number[]
  dayOfWeek: Record<string, number>
  dailyTimeline: { date: string; count: number }[]
  totalActiveDays: number
  dateRange: { first: string; last: string }
  retention: { day: number; retained: number; total: number; pct: number }[]
  activation: { threshold: number; count: number; pct: number }[]
  weeklyEngagement: { week: string; avgMoments: number; activeUsers: number }[]
  userSegments: { powerUsers: number; casualUsers: number; trialUsers: number }
  signals: {
    signal: string; withSignal: number; withSignalRetained: number; withSignalPct: number
    withoutSignal: number; withoutSignalRetained: number; withoutSignalPct: number
  }[]
}

const MOOD_EMOJI: Record<string, string> = {
  grateful: '🙏', peaceful: '🌿', joyful: '✨', inspired: '🌱', loved: '💕',
  calm: '🧘', hopeful: '☀️', proud: '🏆', overwhelmed: '😮‍💨', tired: '🌙',
  uncertain: '🌫️', tender: '🌸', restless: '💬', heavy: '🌊',
}
const MOOD_VALENCE: Record<string, 'positive' | 'negative'> = {
  grateful: 'positive', peaceful: 'positive', joyful: 'positive', inspired: 'positive',
  loved: 'positive', calm: 'positive', hopeful: 'positive', proud: 'positive',
  overwhelmed: 'negative', tired: 'negative', uncertain: 'negative',
  tender: 'negative', restless: 'negative', heavy: 'negative',
}
const TYPE_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  photo: { icon: '📸', color: 'text-pink-600', bg: 'bg-pink-50' },
  video: { icon: '🎥', color: 'text-purple-600', bg: 'bg-purple-50' },
  voice: { icon: '🎤', color: 'text-orange-600', bg: 'bg-orange-50' },
  write: { icon: '✍️', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  mixed: { icon: '🔀', color: 'text-blue-600', bg: 'bg-blue-50' },
}

function StatCard({ value, label, sub, color = 'text-gray-900' }: { value: string | number; label: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarViz({ value, max, color = 'bg-emerald-400' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
}

export default function MomentsProductDesignPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  useEffect(() => {
    fetch('/api/analytics/moments')
      .then(r => r.json())
      .then(d => { setAnalytics(d); setLoading(false) })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{t('Product Design — Moments', 'Conception Produit — Moments')}</h1>
            <p className="text-[10px] text-gray-400">{t('Complete User Flow Map — Every Screen, Every Tap', 'Carte compl\u00e8te du parcours utilisateur — Chaque \u00e9cran, chaque interaction')}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="ml-auto text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* ── Left Nav ─────────────────────────────────────── */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto border-r border-gray-200 bg-white py-6 px-4">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Sections', 'Sections')}</p>
          <div className="space-y-0.5">
            {[
              { id: 'hero', label: t('Overview', 'Vue d\u2019ensemble') },
              { id: 'flow-1', label: t('Flow 1: Home', 'Flux 1 : Accueil') },
              { id: 'flow-2', label: t('Flow 2: Capture', 'Flux 2 : Capture') },
              { id: 'flow-3', label: t('Flow 3: After Save', 'Flux 3 : Apr\u00e8s sauvegarde') },
              { id: 'flow-4', label: t('Flow 4: Full Day', 'Flux 4 : Journ\u00e9e compl\u00e8te') },
              { id: 'flow-5', label: t('Flow 5: Loop', 'Flux 5 : Boucle') },
              { id: 'user-feedback', label: t('What Users Told Us', 'Ce que les utilisateurs nous ont dit') },
              { id: 'test-conditions', label: t('Test Conditions', 'Conditions de test') },
              { id: 'touchpoints', label: t('Touchpoint Sequence', 'S\u00e9quence de points de contact') },
              { id: 'analytics', label: t('Live Analytics', 'Analytique en direct') },
              { id: 'user-segments', label: t('User Segments', 'Segments utilisateurs') },
              { id: 'retention', label: t('Retention Curve', 'Courbe de r\u00e9tention') },
              { id: 'activation', label: t('Activation Funnel', 'Entonnoir d\u2019activation') },
              { id: 'signals', label: t('Predictive Signals', 'Signaux pr\u00e9dictifs') },
              { id: 'pilot-summary', label: t('Pilot Summary', 'R\u00e9sum\u00e9 du pilote') },
              { id: 'phase-2', label: t('Phase 2: Evolution', 'Phase 2 : \u00c9volution') },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-[11px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md px-2.5 py-1.5 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <main className="flex-1 min-w-0 px-6 sm:px-8 py-10 space-y-14">

        {/* ── Hero ────────────────────────────────────────── */}
        <motion.section id="hero" className="scroll-mt-16" {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('The complete Moments journey — screen by screen.', 'Le parcours complet de Moments — \u00e9cran par \u00e9cran.')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Every interaction mapped from the home screen through capture, mood tagging, the emotional timeline, and the daily story recap. Built from the actual mobile app UI — each screen shows what the user sees, what they tap, how they feel, and how long they stay.',
              'Chaque interaction cartographi\u00e9e de l\u2019\u00e9cran d\u2019accueil \u00e0 la capture, le tag d\u2019humeur, la timeline \u00e9motionnelle et le r\u00e9capitulatif quotidien. Construit \u00e0 partir de l\u2019interface mobile r\u00e9elle — chaque \u00e9cran montre ce que l\u2019utilisateur voit, touche, ressent et combien de temps il reste.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t('4-step capture wizard', 'Assistant de capture en 4 \u00e9tapes')}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{t('14 mood tags', '14 tags d\u2019humeur')}</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{t('Up to 7 media per moment', 'Jusqu\u2019\u00e0 7 m\u00e9dias par moment')}</span>
            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">{t('Emotional timeline + story recap', 'Timeline \u00e9motionnelle + r\u00e9capitulatif')}</span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-[9px] text-gray-400 font-semibold uppercase">{t('Status:', 'Statut :')}</span>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] text-gray-500">{t('Built', 'Construit')}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[9px] text-gray-500">{t('Partial', 'Partiel')}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[9px] text-gray-500">{t('Missing', 'Manquant')}</span></div>
            <span className="text-gray-200">|</span>
            <span className="text-[9px] text-gray-500">{t('Dark bg = capture mode', 'Fond sombre = mode capture')}</span>
            <span className="text-[9px] text-gray-500">{t('Light bg = browsing mode', 'Fond clair = mode navigation')}</span>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 1: HOME → CAPTURE ENTRY ───────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-1" className="scroll-mt-16" {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('User opens the app and decides to capture a moment', "L\u2019utilisateur ouvre l\u2019app et d\u00e9cide de capturer un moment")}>{t('Flow 1: Home Screen', 'Flux 1 : \u00c9cran d\u2019accueil')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[300px]">
              <ScreenNode screen={HOME_FLOW[0]} />
              <FlowArrow direction="right" label="Taps FAB 📸" />
              <ScreenNode screen={CAPTURE_STEP1} />
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-blue-700 mb-1">{t('Entry Points', "Points d\u2019entr\u00e9e")}</p>
              <p className="text-[10px] text-blue-600">{t('Two ways to start a moment: (1) Pink FAB camera button (always visible), (2) "Moments" tab in bottom navigation. The FAB is the primary path — it\u2019s the most prominent UI element on the home screen.', "Deux fa\u00e7ons de commencer un moment : (1) Le bouton FAB rose (toujours visible), (2) L\u2019onglet \u00ab Moments \u00bb dans la navigation. Le FAB est le chemin principal — c\u2019est l\u2019\u00e9l\u00e9ment le plus visible de l\u2019\u00e9cran d\u2019accueil.")}</p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 2: 4-STEP CAPTURE WIZARD ──────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-2" className="scroll-mt-16" {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('The full capture flow — Type \u2192 Capture \u2192 Preview \u2192 Details \u2192 Save', 'Le flux complet — Type \u2192 Capture \u2192 Aper\u00e7u \u2192 D\u00e9tails \u2192 Sauvegarder')}>{t('Flow 2: Capture Wizard (4 Steps)', 'Flux 2 : Assistant de capture (4 \u00e9tapes)')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            {/* Step 1: Type Selection */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Step 1 — Type Selection', '\u00c9tape 1 — S\u00e9lection du type')}</p>
              <ScreenNode screen={CAPTURE_STEP1} />
            </div>

            <div className="flex items-center gap-2 mb-3 ml-6">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{t('User selects format — branches into 3 paths', "L\u2019utilisateur choisit le format — 3 branches")}</span>
            </div>

            {/* Step 2: Capture Branches */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Step 2 — Capture (3 branches)', '\u00c9tape 2 — Capture (3 branches)')}</p>
              <div className="flex items-start gap-4 min-w-[800px]">
                {CAPTURE_BRANCHES.map((screen) => (
                  <ScreenNode key={screen.id} screen={screen} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 ml-6">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{t('All paths converge at Preview', "Tous les chemins convergent \u00e0 l\u2019aper\u00e7u")}</span>
            </div>

            {/* Step 3: Preview */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Step 3 — Preview (multi-media)', '\u00c9tape 3 — Aper\u00e7u (multi-m\u00e9dia)')}</p>
              <ScreenNode screen={CAPTURE_STEP3} />
            </div>

            <FlowArrow label="Taps Continue ✨" />

            {/* Step 4: Details + Save */}
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Step 4 — Details (Mood + Note + Save)', '\u00c9tape 4 — D\u00e9tails (Humeur + Note + Sauvegarde)')}</p>
              <ScreenNode screen={CAPTURE_STEP4} />
            </div>

            {/* Wizard insight */}
            <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-emerald-700 mb-1">{t('Design Strengths', 'Points forts du design')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <p className="text-[10px] text-emerald-600">{t('Clear progress stepper (Type \u2192 Capture \u2192 Preview \u2192 Details) — user always knows where they are', "Barre de progression claire (Type \u2192 Capture \u2192 Aper\u00e7u \u2192 D\u00e9tails) — l\u2019utilisateur sait toujours o\u00f9 il en est")}</p>
                <p className="text-[10px] text-emerald-600">{t('Multi-media support (up to 7 items, mix types) — rich moments, not just single photos', "Support multi-m\u00e9dia (jusqu\u2019\u00e0 7 \u00e9l\u00e9ments, types mixtes) — des moments riches, pas juste des photos")}</p>
                <p className="text-[10px] text-emerald-600">{t('14 mood tags including negative ones — captures the full emotional range, not just highlights', "14 tags d\u2019humeur incluant les n\u00e9gatifs — capture toute la gamme \u00e9motionnelle, pas seulement les moments positifs")}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 3: POST-SAVE → HOME UPDATE ────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-3" className="scroll-mt-16" {...fadeUp(0.15)}>
          <SectionTitle subtitle={t('What happens after saving — home updates, timeline shows moment', "Ce qui se passe apr\u00e8s — l\u2019accueil se met \u00e0 jour, la timeline affiche le moment")}>{t('Flow 3: After Saving', 'Flux 3 : Apr\u00e8s sauvegarde')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[550px]">
              <ScreenNode screen={CAPTURE_STEP4} />
              <FlowArrow direction="right" label='Taps "Save Moment"' />
              <ScreenNode screen={POST_SAVE_FLOW[0]} />
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-gray-500 mb-1">{t('What Changes on Home', "Ce qui change sur l\u2019accueil")}</p>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600">{t('\u2022 "Your Day" card updates: shows "1 moment" count + seeds earned', '\u2022 La carte \u00ab Votre Journ\u00e9e \u00bb se met \u00e0 jour : affiche le nombre de moments')}</p>
                <p className="text-[10px] text-gray-600">{t('\u2022 Today\u2019s Flow timeline: moment thumbnail appears at the correct time position', '\u2022 Timeline du jour : la miniature du moment appara\u00eet \u00e0 la bonne position')}</p>
                <p className="text-[10px] text-gray-600">{t('\u2022 The emotional curve line begins to form (visible after 2+ moments)', '\u2022 La courbe \u00e9motionnelle commence \u00e0 se former (visible apr\u00e8s 2+ moments)')}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 4: FULL DAY → CURVE + STORY ───────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-4" className="scroll-mt-16" {...fadeUp(0.2)}>
          <SectionTitle subtitle={t('After capturing multiple moments — the emotional curve and daily story recap', "Apr\u00e8s avoir captur\u00e9 plusieurs moments — la courbe \u00e9motionnelle et le r\u00e9capitulatif quotidien")}>{t('Flow 4: Full Day — Emotional Curve + Story Recap', 'Flux 4 : Journ\u00e9e compl\u00e8te — Courbe \u00e9motionnelle + R\u00e9capitulatif')}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[550px]">
              <ScreenNode screen={FULL_DAY_FLOW[0]} />
              <FlowArrow direction="right" label='Taps ▶️ on "Your Day"' />
              <ScreenNode screen={FULL_DAY_FLOW[1]} />
            </div>
            <div className="mt-5 bg-violet-50 border border-violet-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-violet-700 mb-1">{t('The Core Reward Loop', 'La boucle de r\u00e9compense centrale')}</p>
              <p className="text-[10px] text-violet-600 leading-relaxed">
                {lang === 'fr' ? (
                  <>Le <span className="font-semibold">Flux du Jour</span> est la r&eacute;compense visuelle principale — chaque moment captur&eacute; ajoute un point sur la courbe &eacute;motionnelle. En fin de journ&eacute;e, vous avez une carte visuelle de votre parcours &eacute;motionnel : hauts, bas et tout ce qui est entre les deux. La ligne turquoise connectant les moments cr&eacute;e un &laquo; ECG &eacute;motionnel &raquo; unique &agrave; chaque journ&eacute;e.<span className="font-semibold"> L&apos;Histoire du Jour</span> offre une conclusion — un replay de tout ce que vous avez captur&eacute;, comme une Story Instagram pour votre vie int&eacute;rieure.</>
                ) : (
                  <><span className="font-semibold">Today&apos;s Flow</span> is the primary visual reward — each moment you capture adds a point on the emotional curve. By end of day, you have a visual map of your emotional journey: highs, lows, and everything in between. The teal line connecting moments creates an &quot;emotional EKG&quot; that&apos;s unique to each day.<span className="font-semibold"> Your Day Story</span> gives closure — a tap-through replay of everything you captured, like an Instagram Story for your inner life.</>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 5: ENGAGEMENT LOOP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-5" className="scroll-mt-16" {...fadeUp(0.25)}>
          <SectionTitle subtitle={t('The daily habit loop — what brings users back and keeps them capturing', "La boucle d\u2019habitude quotidienne — ce qui fait revenir les utilisateurs")}>{t('Flow 5: Daily Engagement Loop', "Flux 5 : Boucle d\u2019engagement quotidienne")}</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Circular flow */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">📸</div>
                    <p className="text-[10px] font-bold text-pink-700">{t('Capture Moment', 'Capturer un moment')}</p>
                    <p className="text-[8px] text-pink-600">{t('Tap FAB \u2192 4-step wizard', 'Appuyer FAB \u2192 Assistant 4 \u00e9tapes')}</p>
                    <p className="text-[8px] text-pink-600">{t('10-30 seconds', '10-30 secondes')}</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">📈</div>
                    <p className="text-[10px] font-bold text-emerald-700">{t('See Flow Build', 'Voir le flux se construire')}</p>
                    <p className="text-[8px] text-emerald-600">{t('Moment appears on timeline', "Le moment appara\u00eet sur la timeline")}</p>
                    <p className="text-[8px] text-emerald-600">{t('Emotional curve grows', "La courbe \u00e9motionnelle grandit")}</p>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">▶️</div>
                    <p className="text-[10px] font-bold text-violet-700">{t('Replay Your Day', 'Revoir votre journ\u00e9e')}</p>
                    <p className="text-[8px] text-violet-600">{t('Story recap at end of day', 'R\u00e9capitulatif en fin de journ\u00e9e')}</p>
                    <p className="text-[8px] text-violet-600">{t('"Here\u2019s what you felt today"', '"Voici ce que vous avez ressenti aujourd\u2019hui"')}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">🌅</div>
                    <p className="text-[10px] font-bold text-blue-700">{t('Next Morning', 'Lendemain matin')}</p>
                    <p className="text-[8px] text-blue-600">{t("Open app \u2192 see yesterday\u2019s flow", "Ouvrir l\u2019app \u2192 voir le flux d\u2019hier")}</p>
                    <p className="text-[8px] text-blue-600">{t("Start today\u2019s fresh timeline", 'Commencer la timeline du jour')}</p>
                  </div>
                </div>
                {/* Arrows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <RefreshCw className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-amber-700 mb-1">{t('The Open Question', 'La question ouverte')}</p>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                {lang === 'fr' ? (
                  <>La boucle ci-dessus fonctionne SI l&apos;utilisateur ouvre l&apos;app. La pi&egrave;ce manquante est : <span className="font-semibold">qu&apos;est-ce qui les pousse &agrave; l&apos;ouvrir ?</span> Pendant les tests, 15-20 utilisateurs ont captur&eacute; des moments parce qu&apos;on le leur a demand&eacute;. La r&eacute;compense visuelle (courbe &eacute;motionnelle + r&eacute;capitulatif) est forte, mais le <span className="font-semibold">d&eacute;clencheur</span> pour lancer la premi&egrave;re capture de la journ&eacute;e est le manque &agrave; investiguer. Est-ce une notification push ? Un rappel du praticien ? Un rituel matinal ? Le nudge Bloom AI &laquo; Envie de parler ? &raquo;</>
                ) : (
                  <>The loop above works IF the user opens the app. The missing piece is: <span className="font-semibold">what triggers them to open it?</span> During testing, 15-20 users captured moments because they were asked to. The visual reward (emotional curve + story) is strong, but the <span className="font-semibold">trigger</span> to start each day&apos;s first capture is the gap that needs investigation. Is it a push notification? A practitioner prompt? A morning ritual? The &quot;Wanna talk?&quot; Bloom AI nudge?</>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── USER FEEDBACK: WHY ENGAGEMENT DROPPED ──────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="user-feedback" className="scroll-mt-16" {...fadeUp(0.28)}>
          <SectionTitle subtitle={t('Qualitative feedback from 15-20 test users', 'Retours qualitatifs de 15-20 utilisateurs test')}>{t('What Users Told Us', 'Ce que les utilisateurs nous ont dit')}</SectionTitle>

          <div className="space-y-4">
            {/* The 4 root causes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'F1',
                  title: t('No Intrinsic Motivation', 'Pas de motivation intrins\u00e8que'),
                  severity: 'critical' as const,
                  icon: '🔋',
                  finding: t('Users captured moments when asked, but couldn\u2019t find their own reason to continue. The emotional curve and story recap weren\u2019t enough to drive self-initiated behavior.', "Les utilisateurs capturaient des moments quand on le leur demandait, mais ne trouvaient pas leur propre raison de continuer. La courbe \u00e9motionnelle et le r\u00e9capitulatif n\u2019\u00e9taient pas suffisants pour g\u00e9n\u00e9rer un comportement auto-initi\u00e9."),
                  rootCause: t('The reward is passive (you see a pretty timeline) not active (you gain something). No progression, no personal insight, no "why should I do this today?" trigger.', "La r\u00e9compense est passive (on voit une jolie timeline) pas active (on gagne quelque chose). Pas de progression, pas d\u2019insight personnel, pas de d\u00e9clencheur \u00ab pourquoi devrais-je faire \u00e7a aujourd\u2019hui ? \u00bb."),
                  implication: t('The capture flow works — the motivation layer doesn\u2019t exist yet.', "Le flux de capture fonctionne — la couche de motivation n\u2019existe pas encore."),
                },
                {
                  id: 'F2',
                  title: t('Web App, Not Native', 'App web, pas native'),
                  severity: 'critical' as const,
                  icon: '🌐',
                  finding: t('Users opened Moments in their mobile browser (Chrome/Safari) as a URL. Not installed as a native app or PWA on their home screen.', "Les utilisateurs ouvraient Moments dans leur navigateur mobile (Chrome/Safari) via une URL. Pas install\u00e9 comme app native ou PWA sur leur \u00e9cran d\u2019accueil."),
                  rootCause: t('Browser-based = no home screen icon, no app switcher presence, no "muscle memory" of tapping an app icon. Out of sight, out of mind.', "Bas\u00e9 sur navigateur = pas d\u2019ic\u00f4ne sur l\u2019\u00e9cran d\u2019accueil, pas de pr\u00e9sence dans le s\u00e9lecteur d\u2019apps, pas de \u00ab m\u00e9moire musculaire \u00bb. Hors de vue, hors de l\u2019esprit."),
                  implication: t('Even if motivation existed, the friction of "open browser \u2192 type URL / find bookmark" kills spontaneous captures.', "M\u00eame si la motivation existait, la friction \u00ab ouvrir le navigateur \u2192 taper l\u2019URL \u00bb tue les captures spontan\u00e9es."),
                },
                {
                  id: 'F3',
                  title: t('Zero Notifications', 'Z\u00e9ro notifications'),
                  severity: 'critical' as const,
                  icon: '🔕',
                  finding: t('The app sent no push notifications — no morning prompt, no evening recap nudge, no "you haven\u2019t captured today" reminder.', "L\u2019app n\u2019envoyait aucune notification push — pas de rappel matinal, pas de nudge de r\u00e9capitulatif du soir, pas de rappel \u00ab vous n\u2019avez pas captur\u00e9 aujourd\u2019hui \u00bb."),
                  rootCause: t('Web apps can\u2019t send native push notifications without PWA setup + user permission. The daily trigger mechanism was completely absent.', "Les apps web ne peuvent pas envoyer de notifications push natives sans configuration PWA + permission utilisateur. Le m\u00e9canisme de d\u00e9clencheur quotidien \u00e9tait compl\u00e8tement absent."),
                  implication: t('Without a trigger, the habit loop has no entry point. Users relied on remembering, which fails after day 2-3.', "Sans d\u00e9clencheur, la boucle d\u2019habitude n\u2019a pas de point d\u2019entr\u00e9e. Les utilisateurs comptaient sur leur m\u00e9moire, ce qui \u00e9choue apr\u00e8s le jour 2-3."),
                },
                {
                  id: 'F4',
                  title: t('No Proper Onboarding', "Pas d\u2019onboarding"),
                  severity: 'high' as const,
                  icon: '🚪',
                  finding: t('Users were verbally explained the feature instead of being guided through a structured first-time experience. No in-app walkthrough, no first-moment tutorial, no "why this matters" framing.', "Les utilisateurs ont re\u00e7u une explication verbale au lieu d\u2019\u00eatre guid\u00e9s \u00e0 travers une exp\u00e9rience structur\u00e9e de premi\u00e8re utilisation. Pas de walkthrough in-app, pas de tutoriel, pas de cadrage \u00ab pourquoi c\u2019est important \u00bb."),
                  rootCause: t('Without onboarding, users don\u2019t form the mental model of "capture \u2192 tag mood \u2192 see curve build \u2192 replay at night." They just see an empty screen.', "Sans onboarding, les utilisateurs ne forment pas le mod\u00e8le mental de \u00ab capturer \u2192 taguer l\u2019humeur \u2192 voir la courbe se construire \u2192 revoir le soir \u00bb. Ils voient juste un \u00e9cran vide."),
                  implication: t('First-time experience is the entire conversion funnel. No onboarding = no habit formation.', "L\u2019exp\u00e9rience de premi\u00e8re utilisation est tout l\u2019entonnoir de conversion. Pas d\u2019onboarding = pas de formation d\u2019habitude."),
                },
                {
                  id: 'F5',
                  title: t('App Was Buggy', "L\u2019app \u00e9tait instable"),
                  severity: 'high' as const,
                  icon: '🐛',
                  finding: t('The app had bugs and rough edges during the test — crashes, loading issues, and UI glitches that interrupted the capture flow and broke user trust.', "L\u2019app avait des bugs et des imperfections pendant le test — crashes, probl\u00e8mes de chargement et glitches UI qui interrompaient le flux de capture et brisaient la confiance."),
                  rootCause: t('Early-stage build running as a web app on mobile browsers. Not optimized for all devices, no crash reporting, no error recovery flows.', "Build pr\u00e9coce fonctionnant comme app web sur navigateurs mobiles. Pas optimis\u00e9 pour tous les appareils, pas de rapport de crash, pas de flux de r\u00e9cup\u00e9ration d\u2019erreur."),
                  implication: t('Bugs add friction on top of an already frictionful experience (web-only, no onboarding). Users who hit a bug on their first try are unlikely to come back.', "Les bugs ajoutent de la friction en plus d\u2019une exp\u00e9rience d\u00e9j\u00e0 contraignante (web uniquement, pas d\u2019onboarding). Les utilisateurs qui rencontrent un bug \u00e0 leur premier essai sont peu susceptibles de revenir."),
                },
              ].map((feedback) => (
                <div key={feedback.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className={`px-4 py-2.5 flex items-center justify-between ${feedback.severity === 'critical' ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{feedback.icon}</span>
                      <span className="text-xs font-bold text-gray-900">{feedback.title}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${feedback.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{feedback.severity === 'critical' ? t('Critical', 'Critique') : t('High', '\u00c9lev\u00e9')}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Finding', 'Constat')}</p>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{feedback.finding}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Root Cause', 'Cause racine')}</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed">{feedback.rootCause}</p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${feedback.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'}`}>
                      <p className={`text-[9px] font-semibold ${feedback.severity === 'critical' ? 'text-red-700' : 'text-amber-700'} mb-0.5`}>{t('Implication', 'Implication')}</p>
                      <p className={`text-[10px] ${feedback.severity === 'critical' ? 'text-red-600' : 'text-amber-600'} leading-relaxed`}>{feedback.implication}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* What users loved */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t('What Users Loved', 'Ce que les utilisateurs ont ador\u00e9')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: '📸',
                    title: t('Capturing Was Easy', 'Capturer \u00e9tait facile'),
                    quote: t('The process of capturing a moment felt natural and quick — users said it was easy to do and didn\u2019t feel like a chore. The 4-step wizard is lightweight enough to do multiple times a day.', "Le processus de capture d\u2019un moment \u00e9tait naturel et rapide — les utilisateurs ont dit que c\u2019\u00e9tait facile et pas une corv\u00e9e. L\u2019assistant en 4 \u00e9tapes est assez l\u00e9ger pour \u00eatre utilis\u00e9 plusieurs fois par jour."),
                  },
                  {
                    icon: '📈',
                    title: t('The Emotional Curve', 'La courbe \u00e9motionnelle'),
                    quote: t('Seeing their emotions visualized as a curve throughout the day — lows at the bottom, highs at the top — was the "wow" moment. Users enjoyed watching the line take shape as they captured more.', "Voir leurs \u00e9motions visualis\u00e9es comme une courbe au fil de la journ\u00e9e — les bas en bas, les hauts en haut — \u00e9tait le moment \u00ab wow \u00bb. Les utilisateurs aimaient regarder la ligne prendre forme."),
                  },
                  {
                    icon: '▶️',
                    title: t('Your Day Story Recap', 'R\u00e9capitulatif de votre journ\u00e9e'),
                    quote: t('The Instagram Stories-style daily recap was a highlight. Users liked replaying their day and seeing all their moments in sequence — it gave a sense of closure and self-reflection.', "Le r\u00e9capitulatif quotidien style Instagram Stories \u00e9tait un point fort. Les utilisateurs aimaient revoir leur journ\u00e9e et voir tous leurs moments en s\u00e9quence — cela donnait un sentiment de conclusion et d\u2019auto-r\u00e9flexion."),
                  },
                  {
                    icon: '💬',
                    title: t('Talking to Moments via Bloom', 'Parler \u00e0 Moments via Bloom'),
                    quote: t('Users found it interesting that they could go back to a specific moment and talk to Bloom AI about it — turning a captured memory into a conversation about how they felt.', "Les utilisateurs ont trouv\u00e9 int\u00e9ressant de pouvoir revenir \u00e0 un moment sp\u00e9cifique et en parler avec Bloom AI — transformant un souvenir captur\u00e9 en conversation sur ce qu\u2019ils ressentaient."),
                  },
                  {
                    icon: '📅',
                    title: t('Looking Back at Past Days', 'Revoir les jours pass\u00e9s'),
                    quote: t('The ability to navigate to previous days and see what they did — their emotional shape on a Tuesday two weeks ago — made the timeline feel like a personal journal they actually want to revisit.', "La possibilit\u00e9 de naviguer vers les jours pr\u00e9c\u00e9dents et voir ce qu\u2019ils ont fait — leur forme \u00e9motionnelle un mardi il y a deux semaines — rendait la timeline comme un journal personnel qu\u2019on veut vraiment revisiter."),
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-white rounded-xl border border-emerald-100 p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-[11px] font-bold text-gray-900">{item.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{item.quote}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit loop diagnosis */}
            <div className="bg-gray-900 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-red-400" />
                {t('Habit Loop Diagnosis', "Diagnostic de la boucle d\u2019habitude")}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-[10px] font-bold text-red-400">{t('TRIGGER', 'D\u00c9CLENCHEUR')}</p>
                  <p className="text-[9px] text-red-300">{t('Missing', 'Manquant')}</p>
                  <p className="text-[8px] text-gray-500 mt-1">{t('No notifications, no home screen icon, no daily prompt', "Pas de notifications, pas d\u2019ic\u00f4ne, pas de rappel quotidien")}</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400">ACTION</p>
                  <p className="text-[9px] text-emerald-300">{t('Working', 'Fonctionne')}</p>
                  <p className="text-[8px] text-gray-500 mt-1">{t('4-step wizard is clear, fast (10-30s), low friction', "L\u2019assistant 4 \u00e9tapes est clair, rapide (10-30s), peu de friction")}</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-2">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[10px] font-bold text-amber-400">{t('REWARD', 'R\u00c9COMPENSE')}</p>
                  <p className="text-[9px] text-amber-300">{t('Weak', 'Faible')}</p>
                  <p className="text-[8px] text-gray-500 mt-1">{t('Curve is beautiful but passive — no progression, personal insight, or forward pull', "La courbe est belle mais passive — pas de progression, d\u2019insight personnel, ou d\u2019attraction vers demain")}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {lang === 'fr' ? (
                    <><span className="text-white font-semibold">Diagnostic :</span> L&apos;exp&eacute;rience de capture (Action) est solide — les utilisateurs qui l&apos;ont commenc&eacute;e l&apos;ont termin&eacute;e. La rupture est aux deux extr&eacute;mit&eacute;s : rien ne les <span className="text-red-400 font-semibold">d&eacute;clenche</span> &agrave; ouvrir l&apos;app, et la <span className="text-amber-400 font-semibold">r&eacute;compense</span> n&apos;est pas assez forte pour cr&eacute;er l&apos;anticipation du lendemain. La solution n&apos;est pas dans le flux de capture — c&apos;est dans l&apos;infrastructure autour : app native avec notifications push, onboarding structur&eacute;, et un syst&egrave;me de r&eacute;compense qui cr&eacute;e un &eacute;lan (insights personnels, croissance &eacute;motionnelle, connexion praticien, r&eacute;flexions hebdomadaires).</>
                  ) : (
                    <><span className="text-white font-semibold">Diagnosis:</span> The capture experience (Action) is solid — users who started it, completed it. The breakdown is on both ends: nothing <span className="text-red-400 font-semibold">triggers</span> them to open the app, and the <span className="text-amber-400 font-semibold">reward</span> isn&apos;t strong enough to create anticipation for tomorrow. The fix isn&apos;t in the capture flow — it&apos;s in the infrastructure around it: native app with push notifications, structured onboarding, and a reward system that creates forward momentum (personal insights, emotional growth, practitioner connection, weekly reflections).</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── TEST CONDITIONS ──────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="test-conditions" className="scroll-mt-16" {...fadeUp(0.29)}>
          <SectionTitle subtitle={t('How the pilot was run — deliberately minimal to test the product on its own', "Comment la Phase 1 a \u00e9t\u00e9 con\u00e7ue — d\u00e9lib\u00e9r\u00e9ment minimale")}>{t('Test Conditions', 'Conditions de test')}</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
              <p className="text-xs font-bold text-gray-900">{t('Zero-Support Pilot — Jan 20 to Feb 23, 2026', 'Pilote sans support — 20 jan. au 23 f\u00e9v. 2026')}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{t('We intentionally gave users the minimum to see what the product does on its own, without any hand-holding.', "Nous avons intentionnellement donn\u00e9 aux utilisateurs le minimum pour voir ce que le produit fait seul, sans accompagnement.")}</p>
            </div>

            <div className="p-5 space-y-5">
              {/* What we did */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('What We Did', 'Ce que nous avons fait')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { step: '1', label: t('Gave access', "Donn\u00e9 l\u2019acc\u00e8s"), detail: t('Shared the web app URL with 11 users', "Partag\u00e9 l\u2019URL de l\u2019app web avec 11 utilisateurs"), icon: '🔗' },
                    { step: '2', label: t('15-min explanation', 'Explication de 15 min'), detail: t('High-level walkthrough of what Moments is and how to capture', "Pr\u00e9sentation g\u00e9n\u00e9rale de Moments et comment capturer"), icon: '💬' },
                    { step: '3', label: t('Stepped back', 'Pris du recul'), detail: t('Zero follow-up for 1 month — no messages, no check-ins, no prompts', 'Z\u00e9ro suivi pendant 1 mois — pas de messages, pas de relances, pas de rappels'), icon: '🤫' },
                    { step: '4', label: t('Observed', 'Observ\u00e9'), detail: t("Let the data speak — who came back, who didn\u2019t, and why", "Laiss\u00e9 les donn\u00e9es parler — qui est revenu, qui n\u2019est pas revenu, et pourquoi"), icon: '📊' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-2.5">
                      <span className="text-base mt-0.5">{s.icon}</span>
                      <div>
                        <p className="text-[10px] font-bold text-gray-900">{s.label}</p>
                        <p className="text-[9px] text-gray-500 leading-relaxed">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What we deliberately did NOT do */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('What We Deliberately Did Not Do', "Ce que nous n\u2019avons d\u00e9lib\u00e9r\u00e9ment pas fait")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    t('No push notifications', 'Pas de notifications push'),
                    t('No in-app onboarding flow', "Pas d\u2019onboarding in-app"),
                    t('No daily reminders or nudges', 'Pas de rappels ou nudges quotidiens'),
                    t('No check-in messages', 'Pas de messages de suivi'),
                    t('No incentives or rewards', "Pas d\u2019incitations ou r\u00e9compenses"),
                    t('No native app (web URL only)', 'Pas d\u2019app native (URL web uniquement)'),
                    t('App was buggy — early build, rough edges', "L\u2019app \u00e9tait instable — build pr\u00e9coce, imperfections"),
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-[10px] text-red-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why this matters */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-blue-700 mb-2">{t('Why This Matters for Investors', 'Le cadrage pour les investisseurs')}</p>
                <div className="space-y-2">
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    {lang === 'fr' ? (
                      <><span className="font-semibold">C&apos;&eacute;tait un test de r&eacute;sistance, pas un lancement.</span> Nous voulions r&eacute;pondre &agrave; une question : &laquo; L&apos;exp&eacute;rience de capture + timeline &eacute;motionnelle a-t-elle assez d&apos;attrait pour faire revenir les utilisateurs seule ? &raquo;</>
                    ) : (
                      <><span className="font-semibold">This was a stress test, not a launch.</span> We wanted to answer one question: &quot;Does the core capture + emotional timeline experience have enough pull to bring users back on its own?&quot;</>
                    )}
                  </p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    {t(
                      "The conditions were deliberately harsh — no triggers, no onboarding, no follow-up. A web URL in a browser. In any standard pilot you\u2019d have push notifications, an onboarding flow, and weekly touchpoints. We had none of that.",
                      "Les conditions \u00e9taient d\u00e9lib\u00e9r\u00e9ment s\u00e9v\u00e8res — pas de d\u00e9clencheurs, pas d\u2019onboarding, pas de suivi. Une URL web dans un navigateur. Dans tout pilote standard, vous auriez des notifications push, un flux d\u2019onboarding et des points de contact hebdomadaires. Nous n\u2019avions rien de tout cela."
                    )}
                  </p>
                  <p className="text-[10px] text-blue-700 leading-relaxed font-semibold">
                    {lang === 'fr' ? (
                      <>Et pourtant : {analytics?.userSegments.powerUsers || '\u2014'} utilisateurs ont captur&eacute; 10+ moments organiquement. {analytics?.totalMoments || '\u2014'} moments au total sur {analytics?.totalActiveDays || '\u2014'} jours actifs. Le top utilisateur a captur&eacute; {analytics?.perUser[0]?.total || '\u2014'} moments sur {analytics?.perUser[0]?.activeDays || '\u2014'} jours — sans aucune sollicitation.</>
                    ) : (
                      <>And yet: {analytics?.userSegments.powerUsers || '\u2014'} users captured 10+ moments organically. {analytics?.totalMoments || '\u2014'} total moments across {analytics?.totalActiveDays || '\u2014'} active days. The top user captured {analytics?.perUser[0]?.total || '\u2014'} moments over {analytics?.perUser[0]?.activeDays || '\u2014'} days — with zero prompting.</>
                    )}
                  </p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    {t(
                      "That\u2019s not a retention problem — it\u2019s a distribution problem. The product has pull. Now add a native app with push notifications, a real onboarding, and a reward system, and these numbers change fundamentally.",
                      "Ce n\u2019est pas un probl\u00e8me de r\u00e9tention — c\u2019est un probl\u00e8me de distribution. Le produit a de l\u2019attrait. Ajoutez une app native avec des notifications push, un vrai onboarding, et un syst\u00e8me de r\u00e9compense, et ces chiffres changent fondamentalement."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── COMPLETE TOUCHPOINT MAP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="touchpoints" className="scroll-mt-16" {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('Every interaction in the full journey — sequential list', "Chaque interaction du parcours complet — liste s\u00e9quentielle")}>{t('Complete Touchpoint Sequence', 'S\u00e9quence compl\u00e8te des points de contact')}</SectionTitle>

          <div className="space-y-0">
            {[
              { id: 'H1', screen: 'Home Screen', action: 'Opens app', status: 'built' as const, taps: 'Views Today\'s Flow, Your Day card, My Little Steps', emotion: 'Neutral', time: '5-15s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Taps pink FAB 📸 button', emotion: '', time: '' },
              { id: 'C1', screen: 'New Moment: Type', action: 'Selects capture format', status: 'built' as const, taps: 'Scans 4 options (Photo/Video/Voice/Write) → taps one', emotion: 'Engaged', time: '2-5s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Selects format', emotion: '', time: '' },
              { id: 'C2', screen: 'Capture (Photo/Voice/Write)', action: 'Creates media content', status: 'built' as const, taps: 'Photo: camera viewfinder → shutter / gallery | Voice: record button → speak | Write: type text', emotion: 'Present / Vulnerable / Reflective', time: '5-60s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Completes capture', emotion: '', time: '' },
              { id: 'C3', screen: 'Preview', action: 'Reviews + adds more media', status: 'built' as const, taps: 'Views thumbnail (1/7) → optionally adds more via Camera/Video/Mic buttons → taps "Continue"', emotion: 'Reviewing', time: '5-15s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Taps Continue ✨', emotion: '', time: '' },
              { id: 'C4', screen: 'Details: Mood + Note', action: 'Tags mood & writes note', status: 'built' as const, taps: 'Selects 1-3 moods from 14 options (green highlight) → optional note → taps "Save Moment"', emotion: 'Self-aware', time: '5-15s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Taps Save Moment 📤', emotion: '', time: '' },
              { id: 'P1', screen: 'Home (Updated)', action: 'Sees moment on timeline', status: 'built' as const, taps: 'Your Day card shows "1 moment" · Timeline shows thumbnail at capture time', emotion: 'Satisfied', time: '10-30s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Captures more throughout day...', emotion: '', time: '' },
              { id: 'D1', screen: 'Today\'s Flow (Populated)', action: 'Views emotional curve', status: 'built' as const, taps: 'Scrolls timeline · Moments connected by teal line (highs/lows) · Navigates to past days', emotion: 'Moved', time: '30-120s' },
              { id: '', screen: '', action: '', status: 'built' as const, taps: '↓ Taps ▶️ Play on "Your Day"', emotion: '', time: '' },
              { id: 'D2', screen: 'Your Day Story', action: 'Watches daily recap', status: 'built' as const, taps: 'Tap-through story: intro slide → each moment → summary. "Here\'s what you felt today"', emotion: 'Reflective', time: '30-90s' },
            ].map((step, i) => (
              step.id ? (
                <motion.div key={i} className="flex items-stretch gap-3" {...fadeUp(0.32 + i * 0.01)}>
                  {/* Left: ID + status */}
                  <div className="w-10 flex flex-col items-center shrink-0">
                    <span className="text-[9px] font-mono font-bold text-gray-400">{step.id}</span>
                    <div className={`w-2 h-2 rounded-full mt-1 ${STATUS_DOT[step.status]}`} />
                  </div>
                  {/* Card */}
                  <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 mb-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[10px] font-bold text-gray-900">{step.screen}</h4>
                      <span className="text-[8px] text-gray-400">{step.time}</span>
                    </div>
                    <p className="text-[9px] text-gray-500 mb-1">{step.action}</p>
                    <p className="text-[9px] text-gray-600"><span className="font-semibold">👆</span> {step.taps}</p>
                    {step.emotion && <p className="text-[8px] text-emerald-600 mt-1">Feeling: {step.emotion}</p>}
                  </div>
                </motion.div>
              ) : (
                <div key={i} className="flex items-center gap-3 py-0.5">
                  <div className="w-10 flex justify-center"><div className="w-px h-4 bg-gray-200" /></div>
                  <p className="text-[8px] text-gray-400 font-medium">{step.taps}</p>
                </div>
              )
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── LIVE ANALYTICS FROM DATABASE ─────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="analytics" className="scroll-mt-16" {...fadeUp(0.35)}>
          <SectionTitle subtitle={t('Real data from the moments table — what users actually did', "Donn\u00e9es r\u00e9elles depuis la table moments Supabase — snapshot au 23 f\u00e9v. 2026")}>{t('Live Analytics', 'Analytique en direct')}</SectionTitle>

          {loading && (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-3" />
              <p className="text-xs text-gray-400">{t('Loading moments data...', 'Chargement des donn\u00e9es moments...')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {analytics && analytics.empty && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-sm text-gray-500">{t('No moments captured yet', 'Aucun moment captur\u00e9 pour le moment')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('Analytics will appear here once users start capturing moments', "Les analytiques appara\u00eetront ici une fois que les utilisateurs commenceront \u00e0 capturer des moments")}</p>
            </div>
          )}

          {analytics && !analytics.empty && (
            <div className="space-y-6">

              {/* ── Overview Stats ─────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard value={analytics.totalMoments} label={t('moments captured', 'moments captur\u00e9s')} sub={`${t('across', 'sur')} ${analytics.totalActiveDays} ${t('active days', 'jours actifs')}`} color="text-violet-600" />
                <StatCard value={analytics.totalUsers} label={t('unique users', 'utilisateurs uniques')} sub={`${t('avg', 'moy.')} ${analytics.avgMomentsPerUser}/${t('user', 'utilisateur')}`} color="text-blue-600" />
                <StatCard value={analytics.avgMomentsPerDay} label={t('avg per active day', 'moy. par jour actif')} sub={`${t('peak', 'pic')}: ${Math.max(...analytics.dailyTimeline.map(d => d.count))}/${t('day', 'jour')}`} color="text-emerald-600" />
                <StatCard value={`${analytics.moodTagRate}%`} label={t('mood tag rate', "taux de tag d\u2019humeur")} sub={`${analytics.captionRate}% ${t('caption rate', 'taux de l\u00e9gende')}`} color="text-pink-600" />
              </div>

              {/* ── Date Range ─────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">{t('First moment:', 'Premier moment :')}</span> 20 Jan 2026
                    <span className="mx-3 text-gray-300">&rarr;</span>
                    <span className="font-semibold">{t('Last moment:', 'Dernier moment :')}</span> {new Date(analytics.dateRange.last).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* ── Moments by Type ────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-gray-400" />
                  {t('Moments by Type', 'Moments par type')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(analytics.byType).filter(([type]) => type !== 'mixed').sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const ti = TYPE_ICONS[type] || TYPE_ICONS.photo
                    const pct = Math.round((count / analytics.totalMoments) * 100)
                    return (
                      <div key={type} className={`${ti.bg} rounded-xl p-3 text-center`}>
                        <p className="text-xl mb-0.5">{ti.icon}</p>
                        <p className={`text-lg font-bold ${ti.color}`}>{count}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{type}</p>
                        <p className="text-[9px] text-gray-400">{pct}%</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[9px] text-gray-400 mt-3">{t('Multi-media (mixed) moments launched on 21 Feb — not included in type breakdown.', "Les moments multi-m\u00e9dia (mixtes) lanc\u00e9s le 21 f\u00e9v. — non inclus dans la r\u00e9partition par type.")}</p>
              </div>

              {/* ── Mood Distribution ─────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-gray-400" />
                  {t('Mood Distribution', 'Distribution des humeurs')}
                </h3>
                <p className="text-[10px] text-gray-400 mb-4">{t(`Avg ${analytics.avgMoodsPerMoment} moods per moment`, `Moy. ${analytics.avgMoodsPerMoment} humeurs/moment`)}</p>

                {analytics.moods.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">{t('No moods tagged yet', "Aucune humeur tagu\u00e9e pour le moment")}</p>
                ) : (
                  <div className="space-y-2.5">
                    {analytics.moods.map(({ mood, count, pct }) => {
                      const valence = MOOD_VALENCE[mood]
                      const barColor = valence === 'positive' ? 'bg-emerald-400' : 'bg-amber-400'
                      return (
                        <div key={mood} className="flex items-center gap-3">
                          <span className="text-sm w-6 text-center shrink-0">{MOOD_EMOJI[mood] || '🔵'}</span>
                          <span className="text-[10px] text-gray-600 w-20 capitalize shrink-0">{mood}</span>
                          <div className="flex-1"><BarViz value={count} max={analytics.moods[0].count} color={barColor} /></div>
                          <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">{count}</span>
                          <span className="text-[9px] text-gray-400 w-8 text-right shrink-0">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Positive vs Negative summary */}
                {analytics.moods.length > 0 && (() => {
                  const pos = analytics.moods.filter(m => MOOD_VALENCE[m.mood] === 'positive').reduce((s, m) => s + m.count, 0)
                  const neg = analytics.moods.filter(m => MOOD_VALENCE[m.mood] === 'negative').reduce((s, m) => s + m.count, 0)
                  const total = pos + neg
                  return (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-3 rounded-full overflow-hidden flex">
                          <div className="bg-emerald-400 h-full" style={{ width: `${total > 0 ? (pos / total) * 100 : 0}%` }} />
                          <div className="bg-amber-400 h-full" style={{ width: `${total > 0 ? (neg / total) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] text-emerald-600 font-semibold">{total > 0 ? Math.round((pos / total) * 100) : 0}% {t('positive', 'positif')}</span>
                        <span className="text-[10px] text-amber-600 font-semibold">{total > 0 ? Math.round((neg / total) * 100) : 0}% {t('negative', 'n\u00e9gatif')}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* ── Time of Day ────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    {t('Time of Day', 'Heure de la journ\u00e9e')}
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(analytics.timeOfDay).map(([slot, count]) => {
                      const pct = analytics.totalMoments > 0 ? Math.round((count / analytics.totalMoments) * 100) : 0
                      const maxSlot = Math.max(...Object.values(analytics.timeOfDay))
                      const colors: Record<string, string> = { 'Morning (6-12)': 'bg-amber-300', 'Afternoon (12-17)': 'bg-orange-400', 'Evening (17-21)': 'bg-violet-400', 'Night (21-6)': 'bg-indigo-500' }
                      return (
                        <div key={slot}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-600">{slot}</span>
                            <span className="text-[10px] text-gray-500 font-semibold">{count} ({pct}%)</span>
                          </div>
                          <BarViz value={count} max={maxSlot} color={colors[slot] || 'bg-gray-400'} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {t('Day of Week', 'Jour de la semaine')}
                  </h3>
                  <div className="space-y-2.5">
                    {Object.entries(analytics.dayOfWeek).map(([day, count]) => {
                      const maxDay = Math.max(...Object.values(analytics.dayOfWeek))
                      return (
                        <div key={day}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-600">{day}</span>
                            <span className="text-[10px] text-gray-500 font-semibold">{count}</span>
                          </div>
                          <BarViz value={count} max={maxDay} color="bg-blue-400" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── Hourly Heatmap ─────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  {t('Hourly Distribution (24h)', 'Distribution horaire (24h)')}
                </h3>
                <div className="flex gap-0.5 h-24">
                  {analytics.hourly.map((count, hour) => {
                    const maxHour = Math.max(...analytics.hourly)
                    const h = maxHour > 0 ? Math.round((count / maxHour) * 88) : 0
                    return (
                      <div key={hour} className="flex-1 flex flex-col justify-end group relative">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {hour}:00 — {count} moments
                        </div>
                        <div className="w-full bg-violet-400 rounded-t-sm" style={{ height: count > 0 ? `${Math.max(h, 3)}px` : '0px' }} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-gray-400">0h</span>
                  <span className="text-[8px] text-gray-400">6h</span>
                  <span className="text-[8px] text-gray-400">12h</span>
                  <span className="text-[8px] text-gray-400">18h</span>
                  <span className="text-[8px] text-gray-400">23h</span>
                </div>
              </div>

              {/* ── Daily Activity Timeline ────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                  {t('Daily Activity Timeline', "Chronologie d\u2019activit\u00e9 quotidienne")}
                </h3>
                <div className="flex gap-0.5 h-24">
                  {analytics.dailyTimeline.map(({ date, count }) => {
                    const maxDay = Math.max(...analytics.dailyTimeline.map(d => d.count))
                    const h = maxDay > 0 ? Math.round((count / maxDay) * 88) : 0
                    return (
                      <div key={date} className="flex-1 flex flex-col justify-end group relative" style={{ minWidth: analytics.dailyTimeline.length > 60 ? '2px' : '6px' }}>
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                          {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {count}
                        </div>
                        <div className="w-full bg-emerald-400 rounded-t-sm" style={{ height: count > 0 ? `${Math.max(h, 3)}px` : '0px' }} />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[8px] text-gray-400">{analytics.dailyTimeline.length > 0 ? new Date(analytics.dailyTimeline[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                  <span className="text-[8px] text-gray-400">{analytics.dailyTimeline.length > 0 ? new Date(analytics.dailyTimeline[analytics.dailyTimeline.length - 1].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
              </div>

              {/* ── Insights ──────────────────────────────── */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-violet-800 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 text-violet-500" />
                  {t('Auto-Generated Insights', 'Analyses auto-g\u00e9n\u00e9r\u00e9es')}
                </h3>
                <div className="space-y-2">
                  {/* Most popular type */}
                  {(() => {
                    const topType = Object.entries(analytics.byType).sort((a, b) => b[1] - a[1])[0]
                    if (!topType) return null
                    const pct = Math.round((topType[1] / analytics.totalMoments) * 100)
                    return <p className="text-[10px] text-violet-700"><span className="font-semibold">{TYPE_ICONS[topType[0]]?.icon} {topType[0]}</span> is the dominant format at {pct}% — {pct > 70 ? 'consider prompting users to try other formats' : 'good format diversity'}</p>
                  })()}

                  {/* Mood insights */}
                  {analytics.moods.length > 0 && (() => {
                    const posCount = analytics.moods.filter(m => MOOD_VALENCE[m.mood] === 'positive').reduce((s, m) => s + m.count, 0)
                    const negCount = analytics.moods.filter(m => MOOD_VALENCE[m.mood] === 'negative').reduce((s, m) => s + m.count, 0)
                    const total = posCount + negCount
                    const posPct = total > 0 ? Math.round((posCount / total) * 100) : 0
                    return <p className="text-[10px] text-violet-700"><span className="font-semibold">{posPct}% positive moods</span> — {posPct > 80 ? 'users may be filtering — the 6 negative moods might need to feel more normalized' : posPct > 50 ? 'healthy balance between positive and negative — suggests authentic emotional expression' : 'more negative than positive — users are being vulnerable, which is a good sign for therapeutic use'}</p>
                  })()}

                  {/* Caption rate */}
                  <p className="text-[10px] text-violet-700"><span className="font-semibold">{analytics.captionRate}% wrote a note</span> — {analytics.captionRate < 30 ? 'low engagement with text field — consider making it more prominent or adding prompts' : analytics.captionRate > 60 ? 'high text engagement — users value the reflection space' : 'moderate text engagement — optional notes working as designed'}</p>

                  {/* Time-of-day insight */}
                  {(() => {
                    const peak = Object.entries(analytics.timeOfDay).sort((a, b) => b[1] - a[1])[0]
                    if (!peak) return null
                    return <p className="text-[10px] text-violet-700"><span className="font-semibold">Peak capture: {peak[0]}</span> — {peak[0].includes('Evening') ? 'end-of-day reflection pattern — Your Day story is well-timed' : peak[0].includes('Morning') ? 'morning check-in pattern — consider a morning prompt notification' : 'midday captures suggest real-time emotional logging'}</p>
                  })()}

                  {/* Average streak */}
                  {(() => {
                    const avgStreak = analytics.streaks.length > 0 ? (analytics.streaks.reduce((s, st) => s + st.maxStreak, 0) / analytics.streaks.length) : 0
                    return <p className="text-[10px] text-violet-700"><span className="font-semibold">Avg max streak: {avgStreak.toFixed(1)} days</span> — {avgStreak < 2 ? 'users aren\'t building daily habits yet — needs a stronger daily trigger mechanism' : avgStreak < 5 ? 'some habit formation — users return but don\'t stick consistently' : 'strong daily habit forming — the engagement loop is working'}</p>
                  })()}
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── USER SEGMENTS ────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="user-segments" className="scroll-mt-16" {...fadeUp(0.38)}>
          <SectionTitle subtitle={t('Test users categorized by background — how prior experience shaped behavior', "Segments qualitatifs (d\u2019apr\u00e8s les entretiens)")}>{t('User Segments', 'Segments utilisateurs')}</SectionTitle>

          <div className="space-y-4">
            {/* Segment framework */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: t('Prior Wellbeing App Users', "Utilisateurs ayant d\u00e9j\u00e0 utilis\u00e9 une app de bien-\u00eatre"),
                  color: 'bg-blue-50 border-blue-200',
                  headerColor: 'bg-blue-100 text-blue-800',
                  icon: '📱',
                  description: t('Used apps like Calm, Headspace, Daylio, or therapy platforms before.', "Ont utilis\u00e9 des apps comme Calm, Headspace, Daylio ou des plateformes de th\u00e9rapie auparavant."),
                  traits: [
                    t('Already understand mood tracking', "Comprennent d\u00e9j\u00e0 le suivi d\u2019humeur"),
                    t('Compare Bloomsline to what they know', 'Comparent Bloomsline \u00e0 ce qu\u2019ils connaissent'),
                    t('Higher initial engagement', "Engagement initial plus \u00e9lev\u00e9"),
                    t('More critical of UX gaps', 'Plus critiques des lacunes UX'),
                  ],
                  hypothesis: t("Faster activation but higher churn if features don\u2019t match expectations.", "Activation plus rapide mais churn plus \u00e9lev\u00e9 si les fonctionnalit\u00e9s ne correspondent pas aux attentes."),
                },
                {
                  label: t('New to Wellbeing Apps', 'Nouveaux dans les apps de bien-\u00eatre'),
                  color: 'bg-emerald-50 border-emerald-200',
                  headerColor: 'bg-emerald-100 text-emerald-800',
                  icon: '🌱',
                  description: t('First time using any digital wellbeing tool. Often referred by practitioner.', "Premi\u00e8re utilisation d\u2019un outil de bien-\u00eatre num\u00e9rique. Souvent r\u00e9f\u00e9r\u00e9 par un praticien."),
                  traits: [
                    t('Need more onboarding guidance', "Besoin de plus de guidage \u00e0 l\u2019onboarding"),
                    t('No benchmark to compare against', 'Pas de r\u00e9f\u00e9rence pour comparer'),
                    t('May find concept novel or confusing', 'Peuvent trouver le concept nouveau ou confus'),
                    t('Practitioner recommendation is key trigger', 'La recommandation du praticien est le d\u00e9clencheur cl\u00e9'),
                  ],
                  hypothesis: t("Slower activation but potentially stickier if they form a new habit.", "Activation plus lente mais potentiellement plus fid\u00e8le s\u2019ils forment une nouvelle habitude."),
                },
                {
                  label: t('Emotionally Self-Aware', 'Conscients de leurs \u00e9motions'),
                  color: 'bg-violet-50 border-violet-200',
                  headerColor: 'bg-violet-100 text-violet-800',
                  icon: '🧭',
                  description: t('Clear about their emotions, organized, can name what they feel. vs. those who struggle to identify emotions.', "Clairs sur leurs \u00e9motions, organis\u00e9s, peuvent nommer ce qu\u2019ils ressentent. vs. ceux qui peinent \u00e0 identifier leurs \u00e9motions."),
                  traits: [
                    t('Quick mood tagging (know their feelings)', "Tag d\u2019humeur rapide (connaissent leurs sentiments)"),
                    t('Richer captions and notes', 'L\u00e9gendes et notes plus riches'),
                    t('Use negative moods without hesitation', "Utilisent les humeurs n\u00e9gatives sans h\u00e9sitation"),
                    t('vs. Uncertain/skip mood step', "vs. Incertains/sautent l\u2019\u00e9tape humeur"),
                  ],
                  hypothesis: t("Self-aware users tag moods faster and write more notes. Less-aware users need the mood vocabulary as a learning tool.", "Les utilisateurs conscients de leurs \u00e9motions taguent plus vite et \u00e9crivent plus. Les moins conscients ont besoin du vocabulaire \u00e9motionnel comme outil d\u2019apprentissage."),
                },
              ].map((seg, i) => (
                <div key={i} className={`border rounded-2xl overflow-hidden ${seg.color}`}>
                  <div className={`px-4 py-2.5 ${seg.headerColor} flex items-center gap-2`}>
                    <span className="text-base">{seg.icon}</span>
                    <span className="text-xs font-bold">{seg.label}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] text-gray-600 leading-relaxed">{seg.description}</p>
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('Behavioral Traits', 'Traits comportementaux')}</p>
                      <div className="space-y-1">
                        {seg.traits.map((trait, j) => (
                          <p key={j} className="text-[10px] text-gray-600">• {trait}</p>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <p className="text-[9px] font-semibold text-gray-500 mb-0.5">{t('Hypothesis', 'Hypoth\u00e8se')}</p>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{seg.hypothesis}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Behavioral segments from data */}
            {analytics && !analytics.empty && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  {t('Engagement Tiers (from data)', "Niveaux d\u2019engagement (donn\u00e9es)")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-600">{analytics.userSegments.powerUsers}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">{t('Power Users', 'Utilisateurs actifs')}</p>
                    <p className="text-[9px] text-emerald-600">10+ moments</p>
                    <p className="text-[9px] text-gray-500 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.powerUsers / analytics.totalUsers) * 100) : 0}% {t('of users', 'des utilisateurs')}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">{analytics.userSegments.casualUsers}</p>
                    <p className="text-xs font-semibold text-blue-700 mt-1">{t('Casual Users', 'Utilisateurs occasionnels')}</p>
                    <p className="text-[9px] text-blue-600">3-9 moments</p>
                    <p className="text-[9px] text-gray-500 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.casualUsers / analytics.totalUsers) * 100) : 0}% {t('of users', 'des utilisateurs')}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-2xl font-bold text-gray-500">{analytics.userSegments.trialUsers}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-1">{t('Trial Users', "Utilisateurs d\u2019essai")}</p>
                    <p className="text-[9px] text-gray-500">1-2 moments</p>
                    <p className="text-[9px] text-gray-400 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.trialUsers / analytics.totalUsers) * 100) : 0}% {t('of users', 'des utilisateurs')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── RETENTION CURVE ──────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        {analytics && !analytics.empty && (
          <motion.section id="retention" className="scroll-mt-16" {...fadeUp(0.4)}>
            <SectionTitle subtitle={t('What % of users captured a moment on day N after their first moment', "R\u00e9tention Jour N — % d\u2019utilisateurs actifs N jours apr\u00e8s leur premier moment")}>{t('Retention Curve', 'Courbe de r\u00e9tention')}</SectionTitle>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex gap-0.5 h-40 items-end">
                {analytics.retention.map((r) => (
                  <div key={r.day} className="flex-1 flex flex-col items-center justify-end group relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                      Day {r.day}: {r.retained}/{r.total} users ({r.pct}%)
                    </div>
                    <p className="text-[9px] font-bold text-gray-700 mb-1">{r.pct}%</p>
                    <div className={`w-full rounded-t-md ${r.pct >= 30 ? 'bg-emerald-400' : r.pct >= 15 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ height: `${Math.max(r.pct * 1.4, r.pct > 0 ? 6 : 0)}px` }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-0.5 mt-2">
                {analytics.retention.map((r) => (
                  <div key={r.day} className="flex-1 text-center">
                    <p className="text-[9px] text-gray-500">D{r.day}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-gray-500 mb-1">What This Tells Investors</p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  {(() => {
                    const d7 = analytics.retention.find(r => r.day === 7)
                    const d30 = analytics.retention.find(r => r.day === 30)
                    if (!d7 || !d30) return 'Insufficient data for retention analysis.'
                    return `Day 7 retention: ${d7.pct}% (${d7.retained}/${d7.total} users). Day 30 retention: ${d30.pct}% (${d30.retained}/${d30.total} users). ${d7.pct >= 20 ? 'Early signal of product-market fit — users are voluntarily returning.' : 'Retention needs work — confirms the missing trigger/reward problem identified in user feedback.'} For context: consumer health apps typically see 10-15% D30 retention.`
                  })()}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── ACTIVATION FUNNEL ────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        {analytics && !analytics.empty && (
          <motion.section id="activation" className="scroll-mt-16" {...fadeUp(0.42)}>
            <SectionTitle subtitle={t('How deep do users go — what % reach each milestone', "% d\u2019utilisateurs ayant atteint N moments au total")}>{t('Activation Funnel', "Entonnoir d\u2019activation")}</SectionTitle>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="space-y-3">
                {analytics.activation.map((a, i) => (
                  <div key={a.threshold}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-700 font-semibold">{a.threshold === 1 ? 'Captured 1st moment' : a.threshold === 2 ? 'Came back for 2nd' : a.threshold === 3 ? 'Reached 3 moments' : a.threshold === 5 ? 'Committed (5+)' : a.threshold === 10 ? 'Power user (10+)' : a.threshold === 20 ? 'Super user (20+)' : `${a.threshold}+ moments`}</span>
                      <span className="text-[10px] text-gray-500">{a.count}/{analytics.totalUsers} ({a.pct}%)</span>
                    </div>
                    <div className="h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all ${i === 0 ? 'bg-emerald-400' : i <= 2 ? 'bg-blue-400' : i <= 4 ? 'bg-violet-400' : 'bg-pink-400'}`}
                        style={{ width: `${a.pct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">{a.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-blue-700 mb-1">Funnel Analysis</p>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  {(() => {
                    const a1 = analytics.activation.find(a => a.threshold === 1)
                    const a2 = analytics.activation.find(a => a.threshold === 2)
                    const a5 = analytics.activation.find(a => a.threshold === 5)
                    if (!a1 || !a2 || !a5) return ''
                    const dropoff = a1.pct - a2.pct
                    return `${a1.pct}% captured at least 1 moment (activation). ${a2.pct}% came back for a 2nd (${dropoff}pp drop-off — the "aha moment" gap). ${a5.pct}% reached 5+ (committed users). The biggest drop is from ${a1.count > a2.count ? '1st to 2nd moment — the return trigger is the critical fix.' : 'later in the funnel — users try it but don\'t deepen.'}`
                  })()}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── PREDICTIVE SIGNALS ───────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        {analytics && !analytics.empty && (
          <motion.section id="signals" className="scroll-mt-16" {...fadeUp(0.44)}>
            <SectionTitle subtitle={t('Which early behaviors predict whether a user sticks around (3+ active days)', "Quels comportements pr\u00e9coces pr\u00e9disent 3+ jours actifs (proxy de r\u00e9tention)")}>{t('Predictive Signals', 'Signaux pr\u00e9dictifs')}</SectionTitle>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="space-y-4">
                {analytics.signals.map((s) => {
                  const lift = s.withSignalPct - s.withoutSignalPct
                  return (
                    <div key={s.signal} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-gray-900">{s.signal}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${lift > 15 ? 'bg-emerald-100 text-emerald-700' : lift > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {lift > 0 ? '+' : ''}{lift}pp lift
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">{t('With signal', 'Avec signal')}</p>
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-emerald-600">{s.withSignalPct}%</span>
                            <span className="text-[10px] text-gray-400 mb-0.5">{t('retained', 'retenus')} ({s.withSignalRetained}/{s.withSignal})</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.withSignalPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('Without signal', 'Sans signal')}</p>
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-gray-400">{s.withoutSignalPct}%</span>
                            <span className="text-[10px] text-gray-400 mb-0.5">{t('retained', 'retenus')} ({s.withoutSignalRetained}/{s.withoutSignal})</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-gray-300 rounded-full" style={{ width: `${s.withoutSignalPct}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 bg-violet-50 border border-violet-100 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-violet-700 mb-1">Why This Matters to Investors</p>
                <p className="text-[10px] text-violet-600 leading-relaxed">
                  Predictive signals tell you <span className="font-semibold">what to optimize for</span>. If &quot;2+ moments on day 1&quot; strongly predicts retention,
                  the product fix is clear: get users to capture a second moment during onboarding. These signals shape the roadmap from guesswork into data-driven decisions.
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── PILOT SUMMARY (THE INVESTOR SLIDE) ──────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="pilot-summary" className="scroll-mt-16" {...fadeUp(0.46)}>
          <SectionTitle subtitle={t('One-slide investor view — what 34 days of zero-support testing revealed', "Vue investisseur en une slide — ce que 34 jours de test sans support ont r\u00e9v\u00e9l\u00e9")}>{t('1-Month Pilot Summary', "R\u00e9sum\u00e9 du pilote d\u2019un mois")}</SectionTitle>
          <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-6">

            {/* Headline */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t('Jan 20 — Feb 23, 2026 \u00b7 Closed Beta', '20 jan. — 23 f\u00e9v. 2026 \u00b7 B\u00eata ferm\u00e9e')}</p>
              <p className="text-base font-bold text-white leading-snug">{t("The capture experience works. The infrastructure around it doesn\u2019t — yet.", "L\u2019exp\u00e9rience de capture fonctionne. L\u2019infrastructure autour, pas encore.")}</p>
            </div>

            {/* Top-line metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-white">{analytics?.totalUsers || '\u2014'}</p>
                <p className="text-[10px] text-gray-400">{t('Test Users', 'Utilisateurs test')}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-emerald-400">{analytics?.totalMoments || '\u2014'}</p>
                <p className="text-[10px] text-gray-400">{t('Moments Captured', 'Moments captur\u00e9s')}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-blue-400">{analytics ? `${analytics.avgMomentsPerUser}` : '\u2014'}</p>
                <p className="text-[10px] text-gray-400">{t('Avg per User', 'Moy. par utilisateur')}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-violet-400">{analytics?.moodTagRate || '\u2014'}%</p>
                <p className="text-[10px] text-gray-400">{t('Tagged a Mood', "Tag d\u2019humeur")}</p>
              </div>
            </div>

            {/* Engagement tiers + retention at a glance */}
            {analytics && !analytics.empty && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Engagement Tiers', "Niveaux d\u2019engagement")}</p>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-emerald-300 font-semibold">Power Users (10+)</span>
                        <span className="text-[10px] text-white font-bold">{analytics.userSegments.powerUsers} ({Math.round((analytics.userSegments.powerUsers / analytics.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(analytics.userSegments.powerUsers / analytics.totalUsers) * 100}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-blue-300 font-semibold">Casual (3-9)</span>
                        <span className="text-[10px] text-white font-bold">{analytics.userSegments.casualUsers} ({Math.round((analytics.userSegments.casualUsers / analytics.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full" style={{ width: `${(analytics.userSegments.casualUsers / analytics.totalUsers) * 100}%` }} /></div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-semibold">Trial Only (1-2)</span>
                        <span className="text-[10px] text-white font-bold">{analytics.userSegments.trialUsers} ({Math.round((analytics.userSegments.trialUsers / analytics.totalUsers) * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gray-500 rounded-full" style={{ width: `${(analytics.userSegments.trialUsers / analytics.totalUsers) * 100}%` }} /></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('Retention Snapshot', "Aper\u00e7u de la r\u00e9tention")}</p>
                  <div className="space-y-2.5">
                    {analytics.retention.filter(r => [1, 3, 7, 14, 30].includes(r.day)).map(r => (
                      <div key={r.day}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-300">Day {r.day}</span>
                          <span className={`text-[10px] font-bold ${r.pct >= 30 ? 'text-emerald-400' : r.pct >= 15 ? 'text-amber-400' : 'text-red-400'}`}>{r.pct}% ({r.retained}/{r.total})</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.pct >= 30 ? 'bg-emerald-400' : r.pct >= 15 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${r.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Strongest predictive signal */}
            {analytics && !analytics.empty && analytics.signals.length > 0 && (() => {
              const best = [...analytics.signals].sort((a, b) => (b.withSignalPct - b.withoutSignalPct) - (a.withSignalPct - a.withoutSignalPct))[0]
              const lift = best.withSignalPct - best.withoutSignalPct
              return (
                <div className="bg-violet-500/15 border border-violet-400/30 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider mb-1">{t('Strongest Retention Signal', 'Signal de r\u00e9tention le plus fort')}</p>
                  <p className="text-sm font-bold text-white mb-1">Users who <span className="text-violet-300">{best.signal.toLowerCase()}</span> retain at {best.withSignalPct}% vs {best.withoutSignalPct}%</p>
                  <p className="text-[10px] text-gray-400">+{lift}pp lift — this is the behavior to optimize for in onboarding.</p>
                </div>
              )
            })()}

            {/* 3 columns: worked, loved, broke */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">{t('What Worked', 'Ce qui a march\u00e9')}</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">{t('\u2022 4-step capture is fast (10-30s) and users complete it', '\u2022 La capture en 4 \u00e9tapes est rapide (10-30s) et les utilisateurs la terminent')}</p>
                  <p className="text-[10px] text-gray-300">{lang === 'fr' ? `\u2022 ${analytics?.moodTagRate || '\u2014'}% ont volontairement tagu\u00e9 des humeurs — les 14 utilis\u00e9es y compris les n\u00e9gatives` : `\u2022 ${analytics?.moodTagRate || '\u2014'}% voluntarily tagged moods — all 14 used including negative`}</p>
                  <p className="text-[10px] text-gray-300">{lang === 'fr' ? `\u2022 ${analytics?.captionRate || '\u2014'}% ont \u00e9crit des notes optionnelles — la r\u00e9flexion se fait naturellement` : `\u2022 ${analytics?.captionRate || '\u2014'}% wrote optional notes — reflection happens naturally`}</p>
                  <p className="text-[10px] text-gray-300">{lang === 'fr' ? `\u2022 ${analytics?.userSegments.powerUsers || '\u2014'} utilisateurs actifs ont \u00e9merg\u00e9 organiquement (10+ moments)` : `\u2022 ${analytics?.userSegments.powerUsers || '\u2014'} power users emerged organically (10+ moments)`}</p>
                  {analytics && !analytics.empty && (() => {
                    const topType = Object.entries(analytics.byType).sort((a, b) => b[1] - a[1])[0]
                    return topType ? <p className="text-[10px] text-gray-300">{lang === 'fr' ? `\u2022 ${topType[0]} est le format dominant (${Math.round((topType[1] / analytics.totalMoments) * 100)}%) — la capture visuelle est intuitive` : `\u2022 ${topType[0]} is the dominant format (${Math.round((topType[1] / analytics.totalMoments) * 100)}%) — visual capture is intuitive`}</p> : null
                  })()}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2.5">{t('What They Loved', "Ce qu\u2019ils ont ador\u00e9")}</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">{t('\u2022 Capturing felt easy and natural — not a chore', '\u2022 Capturer \u00e9tait facile et naturel — pas une corv\u00e9e')}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 The emotional curve (highs up, lows down) was the "wow" moment', '\u2022 La courbe \u00e9motionnelle (\u00e9motions hautes en haut, basses en bas) \u00e9tait le moment \u00ab wow \u00bb')}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 Your Day story recap gave closure and self-reflection', '\u2022 Le r\u00e9capitulatif donnait un sentiment de conclusion et d\u2019auto-r\u00e9flexion')}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 Going back to past days felt like a personal journal', '\u2022 Revoir les jours pass\u00e9s ressemblait \u00e0 un journal personnel')}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 Talking to Bloom AI about a specific moment was novel', '\u2022 Parler \u00e0 Bloom AI d\u2019un moment sp\u00e9cifique \u00e9tait nouveau')}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">{t('What Broke', "Ce qui n\u2019a pas march\u00e9")}</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">{t('\u2022 Web-only — no home screen presence, no app switcher', "\u2022 Web uniquement — pas de pr\u00e9sence sur l\u2019\u00e9cran d\u2019accueil")}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 Zero push notifications — no daily trigger mechanism', '\u2022 Z\u00e9ro notifications push — pas de m\u00e9canisme de d\u00e9clencheur quotidien')}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 Verbal onboarding only — no guided first-time experience', "\u2022 Onboarding verbal uniquement — pas d\u2019exp\u00e9rience guid\u00e9e")}</p>
                  <p className="text-[10px] text-gray-300">{t('\u2022 No motivation to self-initiate without being asked', '\u2022 Pas de motivation \u00e0 s\u2019auto-initier sans \u00eatre sollicit\u00e9')}</p>
                  <p className="text-[10px] text-gray-300">{lang === 'fr' ? `\u2022 ${analytics?.userSegments.trialUsers || '\u2014'} utilisateurs ont essay\u00e9 1-2 fois et ne sont jamais revenus` : `\u2022 ${analytics?.userSegments.trialUsers || '\u2014'} users tried 1-2 times and never returned`}</p>
                </div>
              </div>
            </div>

            {/* Key learning */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-2">{t('Core Learning', 'Enseignement principal')}</p>
              <p className="text-[11px] text-gray-200 leading-relaxed">
                {lang === 'fr' ? (
                  <>Le produit a de l&apos;<span className="text-emerald-300 font-semibold">amour produit</span> — les utilisateurs qui ont captur&eacute; des moments ont aim&eacute; l&apos;exp&eacute;rience, la courbe, le r&eacute;capitulatif et les conversations Bloom. Il n&apos;a pas encore d&apos;<span className="text-red-300 font-semibold">habitude produit</span> — pas de d&eacute;clencheur pour ouvrir l&apos;app, pas de progression pour revenir demain, pas d&apos;onboarding pour former le mod&egrave;le mental. C&apos;est un probl&egrave;me de distribution et d&apos;infrastructure, pas un probl&egrave;me de produit. La solution est sp&eacute;cifique et constructible.</>
                ) : (
                  <>The product has <span className="text-emerald-300 font-semibold">product love</span> — users who captured moments liked the experience, the curve, the story, and the Bloom conversations. It does not yet have <span className="text-red-300 font-semibold">product habit</span> — there&apos;s no trigger to open the app, no progression to come back tomorrow, and no onboarding to form the mental model. This is a distribution and infrastructure problem, not a product problem. The fix is specific and buildable.</>
                )}
              </p>
            </div>

            {/* Next 90 days */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-white mb-3">{t('Next 90 Days: From Private Journal to Shareable Evolution', '90 prochains jours : Du journal priv\u00e9 \u00e0 l\u2019\u00e9volution partageable')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">{t('Native App + Triggers', 'App native + D\u00e9clencheurs')}</p>
                    <p className="text-[9px] text-gray-400">{t("Home screen icon, push notifications, guided onboarding with first moment. Solve the infrastructure gap.", "Ic\u00f4ne sur l\u2019\u00e9cran d\u2019accueil, notifications push, onboarding guid\u00e9 avec premier moment. R\u00e9soudre le manque d\u2019infrastructure.")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">{t('Reflection Layer', 'Couche de r\u00e9flexion')}</p>
                    <p className="text-[9px] text-gray-400">{t("Evolution View (7d/30d/90d), weekly reflections, monthly pattern maps. Make growth visible — the reason to keep building.", "Vue \u00c9volution (7j/30j/90j), r\u00e9flexions hebdomadaires, cartes de patterns mensuelles. Rendre la croissance visible — la raison de continuer.")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">{t('Evolution Story', "Histoire d\u2019\u00e9volution")}</p>
                    <p className="text-[9px] text-gray-400">{t("Shareable journey cards, public evolution profiles, practitioner impact stories. People follow evolution, not perfection — that\u2019s the growth engine.", "Cartes de parcours partageables, profils d\u2019\u00e9volution publics, histoires d\u2019impact praticien. Les gens suivent l\u2019\u00e9volution, pas la perfection — c\u2019est le moteur de croissance.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── PHASE 2: PILOT READINESS ─────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="phase-2" className="scroll-mt-16" {...fadeUp(0.5)}>
          <SectionTitle subtitle={t("People love evolution, not perfection. Document the journey — good, bad, everything — and it becomes the most authentic story you can tell.", "Les gens aiment l\u2019\u00e9volution, pas la perfection. Documentez le parcours — le bon, le mauvais, tout — et cela devient l\u2019histoire la plus authentique que vous puissiez raconter.")}>{t('Phase 2: The Evolution Layer', 'Phase 2 : La couche d\u2019\u00e9volution')}</SectionTitle>

          <div className="space-y-5">

            {/* The Insight */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950 text-white rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t('The Core Insight From Phase 1', "L\u2019insight central de la Phase 1")}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{t('What our users and data told us', 'Ce que nos utilisateurs et donn\u00e9es nous ont dit')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-200 leading-relaxed">
                    {lang === 'fr' ? (
                      <>Si vous documentez ce que vous traversez — le bon, le mauvais, les bonnes choses que vous faites — et que vous le partagez, les gens adorent. Pas parce que c&apos;est poli. Parce que c&apos;est <span className="text-amber-300 font-semibold">r&eacute;el</span>.</>
                    ) : (
                      <>If you document what you&apos;re going through — the good, the bad, the right things you&apos;re doing — and you put that out there, people love it. Not because it&apos;s polished. Because it&apos;s <span className="text-amber-300 font-semibold">real</span>.</>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-200 leading-relaxed">
                    {lang === 'fr' ? (
                      <>Les gens ne suivent pas la perfection. Ils suivent l&apos;<span className="text-emerald-300 font-semibold">&eacute;volution</span>. Si vous emmenez votre audience dans un parcours de qui vous &ecirc;tes et qui vous devenez — ils vous suivront. Cela devient votre marque la plus authentique.</>
                    ) : (
                      <>People don&apos;t follow perfection. They follow <span className="text-emerald-300 font-semibold">evolution</span>. If you bring your audience on a journey of who you are and who you&apos;re becoming — they&apos;ll follow you. That becomes your most authentic brand.</>
                    )}
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {lang === 'fr' ? (
                      <>Actuellement, Moments est un <span className="text-white font-semibold">journal</span>. La Phase 2 le transforme en <span className="text-white font-semibold">histoire</span>. La diff&eacute;rence : un journal est priv&eacute; et jetable. Une histoire se compose dans le temps, et quand elle est partag&eacute;e, devient magn&eacute;tique.</>
                    ) : (
                      <>Right now, Moments is a <span className="text-white font-semibold">journal</span>. Phase 2 turns it into a <span className="text-white font-semibold">story</span>. The difference: a journal is private and disposable. A story compounds over time, and when shared, becomes magnetic.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Three Layers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                {t('The Three Layers of Moments', 'Les trois couches de Moments')}
              </h3>
              <div className="space-y-4">
                {/* Layer 1 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-800">{t('Capture', 'Capture')}</h4>
                      <span className="text-[8px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t('EXISTS — WORKS', 'EXISTE — FONCTIONNE')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Photo, video, voice, write. Mood tags. Today&apos;s Flow curve. Your Day story recap.
                    Phase 1 proved this works — users love the capture experience and the emotional curve is the differentiator.
                  </p>
                </div>

                {/* Layer 2 */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <h4 className="text-xs font-bold text-blue-800">{t('Reflection', 'R\u00e9flexion')}</h4>
                      <span className="text-[8px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('PARTIALLY EXISTS — NEEDS DEPTH', 'EXISTE PARTIELLEMENT — BESOIN DE PROFONDEUR')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-700 leading-relaxed mb-2.5">
                    {t(
                      'Your Day story exists, but only for one day at a time. No zoomed-out view. No "here\u2019s how your last 30 days looked." No "your mornings shifted from Heavy to Hopeful over 3 weeks."',
                      "L\u2019Histoire du Jour existe, mais seulement pour un jour \u00e0 la fois. Pas de vue d\u2019ensemble. Pas de \u00ab voici \u00e0 quoi ressemblaient vos 30 derniers jours \u00bb. Pas de \u00ab vos matins sont pass\u00e9s de Lourd \u00e0 Plein d\u2019espoir en 3 semaines \u00bb."
                    )}
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider">{t('What to Build', "Ce qu\u2019il faut construire")}</p>
                    <p className="text-[10px] text-blue-700">{t('\u2022 Evolution View — zoom out from today to 7 days, 30 days, 90 days. See the emotional arc of your life, not just your day.', '\u2022 Vue \u00c9volution — zoom arri\u00e8re d\u2019aujourd\u2019hui \u00e0 7 jours, 30 jours, 90 jours. Voir l\u2019arc \u00e9motionnel de votre vie, pas juste votre journ\u00e9e.')}</p>
                    <p className="text-[10px] text-blue-700">{t('\u2022 Weekly Reflection — "This week you felt most peaceful on mornings you walked. Tuesdays tend to be heavy."', '\u2022 R\u00e9flexion hebdomadaire — \u00ab Cette semaine vous \u00e9tiez le plus paisible les matins o\u00f9 vous avez march\u00e9. Les mardis tendent \u00e0 \u00eatre lourds. \u00bb')}</p>
                    <p className="text-[10px] text-blue-700">{t('\u2022 Monthly Pattern Map — 30-day emotional landscape heatmap. Visual proof of growth over time.', '\u2022 Carte de patterns mensuelle — heatmap du paysage \u00e9motionnel sur 30 jours. Preuve visuelle de croissance.')}</p>
                    <p className="text-[10px] text-blue-700">{t('\u2022 Bloom AI Memory — "Last Thursday you felt inspired — what sparked that?" Your moments woven into conversations.', '\u2022 M\u00e9moire Bloom AI — \u00ab Jeudi dernier vous \u00e9tiez inspir\u00e9 — qu\u2019est-ce qui a d\u00e9clench\u00e9 \u00e7a ? \u00bb Vos moments tiss\u00e9s dans les conversations.')}</p>
                  </div>
                </div>

                {/* Layer 3 — THE BIG NEW THING */}
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-violet-600" />
                      <h4 className="text-xs font-bold text-violet-800">{t('Evolution Story', "Histoire d\u2019\u00e9volution")}</h4>
                      <span className="text-[8px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{t('NEW — THE PHASE 2 DIFFERENTIATOR', 'NOUVEAU — LE DIFF\u00c9RENCIATEUR DE LA PHASE 2')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-violet-700 leading-relaxed mb-3">
                    {t(
                      'The user takes their emotional arc — not individual moments, but the shape of their change over time — and shares it. Not "here\u2019s my sad Tuesday." Instead: "Here\u2019s my month. I started overwhelmed. I ended peaceful. This is what the curve looks like."',
                      "L\u2019utilisateur prend son arc \u00e9motionnel — pas les moments individuels, mais la forme de son changement dans le temps — et le partage. Pas \u00ab voici mon triste mardi \u00bb. Plut\u00f4t : \u00ab Voici mon mois. J\u2019ai commenc\u00e9 submerg\u00e9. J\u2019ai termin\u00e9 paisible. Voici \u00e0 quoi ressemble la courbe. \u00bb"
                    )}
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <p className="text-[9px] font-semibold text-violet-500 uppercase tracking-wider">{t('What to Build', "Ce qu\u2019il faut construire")}</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Share2 className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">{t('Shareable Journey Cards', 'Cartes de parcours partageables')}</p>
                          <p className="text-[10px] text-violet-600">{t('Auto-generated from your evolution data. Not individual moments — those stay private. The pattern is what you share.', "G\u00e9n\u00e9r\u00e9es automatiquement depuis vos donn\u00e9es d\u2019\u00e9volution. Pas les moments individuels — ceux-ci restent priv\u00e9s. C\u2019est le pattern que vous partagez.")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Flower2 className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">{t('My Evolution Profile', "Mon profil d\u2019\u00e9volution")}</p>
                          <p className="text-[10px] text-violet-600">{t("Opt-in public page showing your emotional growth journey. Not your specific moments. The arc. Like a fitness tracker shows distance — this shows emotional range, growth in self-awareness, consistency of practice. Other people follow your evolution.", "Page publique opt-in montrant votre parcours de croissance \u00e9motionnelle. Pas vos moments sp\u00e9cifiques. L\u2019arc. Comme un tracker fitness montre la distance — ceci montre la gamme \u00e9motionnelle, la croissance en conscience de soi, la r\u00e9gularit\u00e9 de la pratique. D\u2019autres personnes suivent votre \u00e9volution.")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Heart className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">{t('Practitioner Impact Stories', "Histoires d\u2019impact praticien")}</p>
                          <p className="text-[10px] text-violet-600">{t('Practitioners can (with consent) showcase evolution arcs: "After 8 sessions, here\u2019s how this member\u2019s emotional landscape changed." Not "I\u2019m a certified therapist" — but "look at the visible change in someone I worked with."', "Les praticiens peuvent (avec consentement) pr\u00e9senter les arcs d\u2019\u00e9volution : \u00ab Apr\u00e8s 8 s\u00e9ances, voici comment le paysage \u00e9motionnel de ce membre a chang\u00e9. \u00bb Pas \u00ab je suis th\u00e9rapeute certifi\u00e9 \u00bb — mais \u00ab regardez le changement visible chez quelqu\u2019un avec qui j\u2019ai travaill\u00e9. \u00bb")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How layers connect */}
              <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-gray-700 mb-2.5">{t('How The Layers Connect', 'Comment les couches se connectent')}</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-emerald-100 text-emerald-700 rounded-lg px-3 py-2 text-center">
                    <Camera className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">{t('Capture', 'Capturer')}</p>
                    <p className="text-[8px]">{t('daily micro-moments', 'micro-moments quotidiens')}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-blue-100 text-blue-700 rounded-lg px-3 py-2 text-center">
                    <BookOpen className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">{t('Reflect', 'R\u00e9fl\u00e9chir')}</p>
                    <p className="text-[8px]">{t('see patterns + growth', 'voir les patterns + la croissance')}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-violet-100 text-violet-700 rounded-lg px-3 py-2 text-center">
                    <Globe className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">{t('Share', 'Partager')}</p>
                    <p className="text-[8px]">{t('your evolution story', "votre histoire d\u2019\u00e9volution")}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-pink-100 text-pink-700 rounded-lg px-3 py-2 text-center">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">{t('Attract', 'Attirer')}</p>
                    <p className="text-[8px]">{t('people follow the journey', 'les gens suivent le parcours')}</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 text-center mt-3">
                  {t(
                    'Each layer feeds the next. The more you capture, the richer your reflection. The richer your reflection, the more compelling the story. The more you share, the more people join.',
                    "Chaque couche nourrit la suivante. Plus vous capturez, plus votre r\u00e9flexion est riche. Plus votre r\u00e9flexion est riche, plus l\u2019histoire est convaincante. Plus vous partagez, plus de gens rejoignent."
                  )}
                </p>
              </div>
            </div>

            {/* Why Evolution > Perfection */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                {t('Why This Changes Everything', 'Pourquoi cela change tout')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-amber-800 mb-1">{t('The Motivation Shifts', 'La motivation change')}</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      {t(
                        'Phase 1 problem: "Why should I open this today?" Evolution answer: You\u2019re not capturing for today. You\u2019re building a story that compounds. Every moment adds to an arc that gets more interesting over time.',
                        "Probl\u00e8me Phase 1 : \u00ab Pourquoi devrais-je ouvrir \u00e7a aujourd\u2019hui ? \u00bb R\u00e9ponse \u00e9volution : Vous ne capturez pas pour aujourd\u2019hui. Vous construisez une histoire qui se compose. Chaque moment ajoute \u00e0 un arc qui devient plus int\u00e9ressant avec le temps."
                      )}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-emerald-800 mb-1">{t('Bad Days Make It Better', "Les mauvais jours l\u2019enrichissent")}</p>
                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                      {t(
                        'In a streak system, a bad day breaks your progress. In an evolution story, a bad day makes the story richer. "I had 3 heavy days and then something shifted" is more powerful than any unbroken counter.',
                        "Dans un syst\u00e8me de s\u00e9ries, un mauvais jour casse votre progression. Dans une histoire d\u2019\u00e9volution, un mauvais jour enrichit l\u2019histoire. \u00ab J\u2019ai eu 3 jours lourds puis quelque chose a chang\u00e9 \u00bb est plus puissant qu\u2019un compteur ininterrompu."
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-violet-800 mb-1">{t('Organic Distribution', 'Distribution organique')}</p>
                    <p className="text-[10px] text-violet-700 leading-relaxed">
                      {t(
                        "People sharing their emotional evolution on social media is free marketing. And it\u2019s the kind of content that resonates — vulnerability + growth. One person\u2019s evolution card on Instagram is worth more than any ad.",
                        "Les gens partageant leur \u00e9volution \u00e9motionnelle sur les r\u00e9seaux sociaux sont du marketing gratuit. Et c\u2019est le type de contenu qui r\u00e9sonne — vuln\u00e9rabilit\u00e9 + croissance. La carte d\u2019\u00e9volution d\u2019une personne sur Instagram vaut plus que n\u2019importe quelle pub."
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-blue-800 mb-1">{t('Network Effect', 'Effet de r\u00e9seau')}</p>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      {t(
                        'When someone sees a friend\u2019s evolution card, they think: "I want to see my own arc." That\u2019s the acquisition loop. Not "download this wellness app" — but "I want to know the shape of my emotional life."',
                        "Quand quelqu\u2019un voit la carte d\u2019\u00e9volution d\u2019un ami, il pense : \u00ab Je veux voir mon propre arc. \u00bb C\u2019est la boucle d\u2019acquisition. Pas \u00ab t\u00e9l\u00e9chargez cette app de bien-\u00eatre \u00bb — mais \u00ab je veux conna\u00eetre la forme de ma vie \u00e9motionnelle. \u00bb"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-gray-900 rounded-xl p-4">
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  {lang === 'fr' ? (
                    <><span className="text-white font-semibold">Pour les investisseurs :</span> Le march&eacute; des apps de bien-&ecirc;tre est plein de journaux priv&eacute;s que les gens abandonnent. Personne n&apos;abandonne son histoire quand d&apos;autres personnes regardent. Le cadrage &eacute;volution transforme une habitude solo en identit&eacute; sociale. &laquo; Je suis quelqu&apos;un qui documente son parcours &eacute;motionnel &raquo; est une identit&eacute; que les gens <em>veulent</em> avoir. C&apos;est ainsi que Moments passe d&apos;une fonctionnalit&eacute; &agrave; un moteur de croissance.</>
                  ) : (
                    <><span className="text-white font-semibold">For Investors:</span> The wellness app market is full of private journals that people abandon. Nobody abandons their story once other people are watching. The evolution framing turns a solo habit into a social identity. &quot;I&apos;m someone who documents my emotional journey&quot; is an identity people <em>want</em> to have. This is how Moments goes from a feature to a growth engine.</>
                  )}
                </p>
              </div>
            </div>

            {/* What We Build — Phase 2 concrete plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                {t('Phase 2 Build Tracks', 'Pistes de construction Phase 2')}
              </h3>
              <div className="space-y-4">
                {[
                  {
                    num: '1',
                    title: t('Native App + Push Notifications', 'App native + Notifications push'),
                    color: 'emerald',
                    phase1Problem: t('Web-only, no home screen icon, no way to send notifications', "Web uniquement, pas d\u2019ic\u00f4ne, pas de moyen d\u2019envoyer des notifications"),
                    whatToBuild: [
                      t('React Native or Expo wrapper for iOS + Android', 'Wrapper React Native ou Expo pour iOS + Android'),
                      t('Home screen icon with app badge', "Ic\u00f4ne sur l\u2019\u00e9cran d\u2019accueil avec badge"),
                      t('Morning prompt: "How are you starting your day?" (9am)', 'Rappel matinal : \u00ab Comment commencez-vous votre journ\u00e9e ? \u00bb (9h)'),
                      t('Evening recap: "Your day had 4 moments — replay?" (8pm)', 'R\u00e9capitulatif du soir : \u00ab Votre journ\u00e9e a eu 4 moments — revoir ? \u00bb (20h)'),
                      t("Smart frequency — learn user patterns, don\u2019t over-notify", "Fr\u00e9quence intelligente — apprendre les habitudes de l\u2019utilisateur, ne pas sur-notifier"),
                    ],
                    successMetric: t('D7 retention jumps from Phase 1 baseline to 40%+', 'R\u00e9tention J7 passe de la base Phase 1 \u00e0 40%+'),
                    designChange: t('Same capture flow — lives in a native shell with notification permissions on first launch.', "M\u00eame flux de capture — dans un shell natif avec permissions de notification au premier lancement."),
                  },
                  {
                    num: '2',
                    title: t('Guided Onboarding + First Moment', 'Onboarding guid\u00e9 + Premier moment'),
                    color: 'blue',
                    phase1Problem: t('15-min verbal explanation, no in-app guidance, users saw an empty screen', "Explication verbale de 15 min, pas de guidage in-app, les utilisateurs voyaient un \u00e9cran vide"),
                    whatToBuild: [
                      t('"Bloomsline helps you see the shape of your day — and over time, the shape of your growth"', '\u00ab Bloomsline vous aide \u00e0 voir la forme de votre journ\u00e9e — et avec le temps, la forme de votre croissance \u00bb'),
                      t('Show the curve preview + example evolution card: "This is what 30 days looks like"', "Montrer l\u2019aper\u00e7u de la courbe + carte d\u2019\u00e9volution exemple : \u00ab Voici \u00e0 quoi ressemblent 30 jours \u00bb"),
                      t('Guided first moment: walk through capture \u2192 mood \u2192 save', 'Premier moment guid\u00e9 : parcourir capture \u2192 humeur \u2192 sauvegarder'),
                      t('Show timeline with first dot: "You just started your story"', 'Montrer la timeline avec le premier point : \u00ab Vous venez de commencer votre histoire \u00bb'),
                      t('Prompt second moment: "Capture one more to see the curve connect"', 'Inciter au deuxi\u00e8me moment : \u00ab Capturez-en un de plus pour voir la courbe se connecter \u00bb'),
                    ],
                    successMetric: t('80%+ users capture first moment during onboarding. 50%+ capture second.', "80%+ des utilisateurs capturent le premier moment pendant l\u2019onboarding. 50%+ capturent le deuxi\u00e8me."),
                    designChange: t('4-5 screen onboarding. Ends with first moment on timeline and a glimpse of what the evolution view will look like.', "Onboarding 4-5 \u00e9crans. Se termine avec le premier moment sur la timeline et un aper\u00e7u de la vue \u00e9volution."),
                  },
                  {
                    num: '3',
                    title: t('Reflection Layer', 'Couche de r\u00e9flexion'),
                    color: 'amber',
                    phase1Problem: t("Today\u2019s Flow is beautiful but only shows today. No zoomed-out view, no pattern recognition, no reason to keep building.", "Le Flux du Jour est beau mais ne montre qu\u2019aujourd\u2019hui. Pas de vue d\u2019ensemble, pas de reconnaissance de patterns, pas de raison de continuer."),
                    whatToBuild: [
                      t("Evolution View: zoom out from today \u2192 7 days \u2192 30 days \u2192 90 days. See the emotional arc, not just the day.", "Vue \u00c9volution : zoom arri\u00e8re d\u2019aujourd\u2019hui \u2192 7 jours \u2192 30 jours \u2192 90 jours. Voir l\u2019arc \u00e9motionnel, pas juste la journ\u00e9e."),
                      t('Weekly Reflection: "This week you felt most peaceful on mornings you walked"', 'R\u00e9flexion hebdomadaire : \u00ab Cette semaine vous \u00e9tiez le plus paisible les matins o\u00f9 vous avez march\u00e9 \u00bb'),
                      t("Monthly Pattern Map: emotional landscape heatmap — visual proof that something is changing", "Carte de patterns mensuelle : heatmap du paysage \u00e9motionnel — preuve visuelle que quelque chose change"),
                      t('Gentle milestones: "10 moments captured" \u2192 unlock first weekly reflection. Cumulative, never resets.', "Jalons doux : \u00ab 10 moments captur\u00e9s \u00bb \u2192 d\u00e9bloquer la premi\u00e8re r\u00e9flexion hebdomadaire. Cumulatif, jamais de r\u00e9initialisation."),
                      t('Bloom AI references your history: "Last Thursday you felt inspired — what was different?"', "Bloom AI r\u00e9f\u00e9rence votre historique : \u00ab Jeudi dernier vous \u00e9tiez inspir\u00e9 — qu\u2019est-ce qui \u00e9tait diff\u00e9rent ? \u00bb"),
                    ],
                    successMetric: t('Users who see their first weekly reflection retain 2x better. 40%+ users reach 10 moments in 14 days.', "Les utilisateurs qui voient leur premi\u00e8re r\u00e9flexion hebdomadaire retiennent 2x mieux. 40%+ atteignent 10 moments en 14 jours."),
                    designChange: t('New "My Evolution" tab. Weekly insight card on home. No counters that reset to zero — everything grows.', "Nouvel onglet \u00ab Mon \u00c9volution \u00bb. Carte d\u2019insight hebdomadaire sur l\u2019accueil. Pas de compteurs qui se remettent \u00e0 z\u00e9ro — tout grandit."),
                  },
                  {
                    num: '4',
                    title: t('Evolution Story (Shareable)', "Histoire d\u2019\u00e9volution (Partageable)"),
                    color: 'violet',
                    phase1Problem: t("Moments exist in isolation — no one sees the journey except the user. No social proof, no organic growth loop.", "Les moments existent en isolation — personne ne voit le parcours sauf l\u2019utilisateur. Pas de preuve sociale, pas de boucle de croissance organique."),
                    whatToBuild: [
                      t("Auto-generated Journey Cards from evolution data — shareable to Instagram, WhatsApp, within Bloomsline", "Cartes de parcours auto-g\u00e9n\u00e9r\u00e9es depuis les donn\u00e9es d\u2019\u00e9volution — partageables sur Instagram, WhatsApp, dans Bloomsline"),
                      t("Individual moments stay private. The pattern and arc are what you share.", "Les moments individuels restent priv\u00e9s. Le pattern et l\u2019arc sont ce que vous partagez."),
                      t("My Evolution Profile: opt-in public page showing emotional growth over time", "Mon Profil d\u2019\u00c9volution : page publique opt-in montrant la croissance \u00e9motionnelle"),
                      t('Practitioner Impact Stories: "After 8 sessions, here\u2019s how this member\u2019s emotional landscape changed" (with consent)', "Histoires d\u2019impact praticien : \u00ab Apr\u00e8s 8 s\u00e9ances, voici comment le paysage \u00e9motionnel de ce membre a chang\u00e9 \u00bb (avec consentement)"),
                      t("Social discovery: follow someone\u2019s evolution, get inspired by their growth", "D\u00e9couverte sociale : suivre l\u2019\u00e9volution de quelqu\u2019un, s\u2019inspirer de sa croissance"),
                    ],
                    successMetric: t('15%+ users share at least one journey card in first 30 days. Each shared card drives 2+ app installs.', "15%+ des utilisateurs partagent au moins une carte de parcours en 30 jours. Chaque carte partag\u00e9e g\u00e9n\u00e8re 2+ installations."),
                    designChange: t('Share button on weekly/monthly reflections. Public evolution profile page. Practitioner dashboard shows shareable impact arcs.', "Bouton partager sur les r\u00e9flexions hebdo/mensuelles. Page de profil d\u2019\u00e9volution publique. Dashboard praticien avec arcs d\u2019impact partageables."),
                  },
                  {
                    num: '5',
                    title: t('Practitioner Connection + Stability', 'Connexion praticien + Stabilit\u00e9'),
                    color: 'gray',
                    phase1Problem: t("Practitioner has no visibility into member\u2019s emotional journey. App was buggy on mobile.", "Le praticien n\u2019a pas de visibilit\u00e9 sur le parcours \u00e9motionnel du membre. L\u2019app \u00e9tait instable sur mobile."),
                    whatToBuild: [
                      t("Practitioner dashboard: member\u2019s weekly emotional curve + evolution arc", "Dashboard praticien : courbe \u00e9motionnelle hebdo du membre + arc d\u2019\u00e9volution"),
                      t('Session prep: "This week Alex felt overwhelmed Mon/Tue, peaceful Thu-Sun"', "Pr\u00e9paration de s\u00e9ance : \u00ab Cette semaine Alex s\u2019est senti submerg\u00e9 lun/mar, paisible jeu-dim \u00bb"),
                      t('Member opt-in sharing: "Share this week with my practitioner?"', "Partage opt-in du membre : \u00ab Partager cette semaine avec mon praticien ? \u00bb"),
                      t('Crash reporting (Sentry), offline capture, image compression', "Rapport de crash (Sentry), capture hors ligne, compression d\u2019images"),
                      t('Performance profiling on low-end devices', "Profilage de performance sur appareils bas de gamme"),
                    ],
                    successMetric: t('Practitioners reference moments in 50%+ sessions. Crash rate < 1%.', "Les praticiens r\u00e9f\u00e9rencent les moments dans 50%+ des s\u00e9ances. Taux de crash < 1%."),
                    designChange: t('Practitioner sees evolution curve on member profile. Loading/error states on capture flow.', "Le praticien voit la courbe d\u2019\u00e9volution sur le profil du membre. \u00c9tats de chargement/erreur sur le flux de capture."),
                  },
                ].map((track) => {
                  const colors: Record<string, { bg: string; border: string; text: string; badge: string; light: string }> = {
                    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', light: 'text-emerald-600' },
                    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', light: 'text-blue-600' },
                    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', light: 'text-amber-600' },
                    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', light: 'text-violet-600' },
                    gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700', light: 'text-gray-600' },
                  }
                  const c = colors[track.color] || colors.gray
                  return (
                    <div key={track.num} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className={`text-[10px] font-bold ${c.badge} w-5 h-5 rounded-full flex items-center justify-center shrink-0`}>{track.num}</span>
                        <h4 className={`text-xs font-bold ${c.text}`}>{track.title}</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Phase 1 Problem', 'Probl\u00e8me Phase 1')}</p>
                          <p className="text-[10px] text-gray-600 mb-3">{track.phase1Problem}</p>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('What to Build', "Ce qu\u2019il faut construire")}</p>
                          <div className="space-y-1">
                            {track.whatToBuild.map((item, j) => (
                              <p key={j} className={`text-[10px] ${c.light}`}>• {item}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Success Metric', 'M\u00e9trique de succ\u00e8s')}</p>
                          <p className={`text-[10px] font-semibold ${c.text} mb-3`}>{track.successMetric}</p>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('Design Change', 'Changement de design')}</p>
                          <p className="text-[10px] text-gray-600">{track.designChange}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Phase 2 new user flow */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                {t('Phase 2: New User Journey', 'Phase 2 : Nouveau parcours utilisateur')}
              </h3>
              <div className="overflow-x-auto">
                <div className="flex items-start gap-2 min-w-[800px]">
                  {[
                    { step: 'Download', desc: 'Native app from App Store', time: '30s', isNew: true },
                    { step: 'Onboarding', desc: 'Frame the "why" + show evolution preview', time: '60s', isNew: true },
                    { step: '1st Moment', desc: 'Guided capture during onboarding', time: '30s', isNew: true },
                    { step: 'Home', desc: 'First dot on timeline — "Your story just started"', time: '15s', isNew: false },
                    { step: '2nd Moment', desc: 'Prompted: "One more to see the curve connect"', time: '30s', isNew: true },
                    { step: 'Curve Forms', desc: 'Two dots connected — the day takes shape', time: '10s', isNew: false },
                    { step: 'Evening', desc: 'Push: "Replay your day?" → Story recap', time: '60s', isNew: true },
                    { step: 'Day 7', desc: 'First weekly reflection unlocks — "Here\'s your week"', time: '90s', isNew: true },
                    { step: 'Day 14', desc: 'Share prompt: "Your first 2 weeks — share your evolution?"', time: '30s', isNew: true },
                    { step: 'Day 30', desc: 'Monthly pattern map + evolution profile ready', time: '120s', isNew: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5 shrink-0">
                      <div className={`w-[76px] rounded-lg p-2 text-center border ${s.isNew ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                        {s.isNew && <p className="text-[7px] font-bold text-emerald-600 uppercase mb-0.5">New</p>}
                        <p className="text-[9px] font-bold text-gray-900">{s.step}</p>
                        <p className="text-[7px] text-gray-500 leading-tight mt-0.5">{s.desc}</p>
                      </div>
                      {i < 9 && <ChevronRight className="w-3 h-3 text-gray-300 mt-5 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[9px] text-gray-400 mt-3">{t("Green = new in Phase 2. Gray = exists from Phase 1. The journey doesn\u2019t just redesign the first day — it creates a 30-day arc where value increases over time.", "Vert = nouveau en Phase 2. Gris = existe depuis la Phase 1. Le parcours ne red\u00e9signe pas juste le premier jour — il cr\u00e9e un arc de 30 jours o\u00f9 la valeur augmente avec le temps.")}</p>
            </div>

            {/* Phase 2 success criteria */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                {t('Phase 2 Success Criteria', 'Crit\u00e8res de succ\u00e8s Phase 2')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { metric: t('D7 Retention', 'R\u00e9tention J7'), target: '> 40%', phase1: `${analytics?.retention.find(r => r.day === 7)?.pct || '\u2014'}%`, color: 'text-emerald-600' },
                  { metric: t('D30 Retention', 'R\u00e9tention J30'), target: '> 20%', phase1: `${analytics?.retention.find(r => r.day === 30)?.pct || '\u2014'}%`, color: 'text-blue-600' },
                  { metric: t('Evolution Card Shared', "Carte d\u2019\u00e9volution partag\u00e9e"), target: '> 15%', phase1: 'N/A', color: 'text-violet-600' },
                  { metric: t('Onboarding \u2192 1st Moment', 'Onboarding \u2192 1er moment'), target: '> 80%', phase1: 'N/A', color: 'text-pink-600' },
                ].map((m, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{m.metric}</p>
                    <p className={`text-lg font-bold ${m.color} mt-1`}>{m.target}</p>
                    <p className="text-[9px] text-gray-400 mt-1">Phase 1: {m.phase1}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900 text-white rounded-2xl p-5">
              <h3 className="text-xs font-bold text-white mb-4">{t('Build Timeline', 'Calendrier de construction')}</h3>
              <div className="space-y-3">
                {[
                  { phase: t('Weeks 1-2', 'Semaines 1-2'), label: t('Foundation', 'Fondation'), items: [t('Native app shell (Expo/React Native)', 'Shell app natif (Expo/React Native)'), t('Push notification infrastructure', 'Infrastructure de notifications push'), t('Bug fixes + crash reporting + offline support', 'Corrections de bugs + rapport de crash + support hors ligne'), t('Guided onboarding flow (4-5 screens)', "Flux d\u2019onboarding guid\u00e9 (4-5 \u00e9crans)")], color: 'bg-emerald-400' },
                  { phase: t('Weeks 3-4', 'Semaines 3-4'), label: t('Triggers + First Moment', 'D\u00e9clencheurs + Premier moment'), items: [t('First moment during onboarding', "Premier moment pendant l\u2019onboarding"), t('Morning / evening notification schedule', 'Calendrier de notifications matin / soir'), t('Smart frequency — learn user patterns', "Fr\u00e9quence intelligente — apprendre les habitudes"), t('Practitioner dashboard: weekly emotional curve', 'Dashboard praticien : courbe \u00e9motionnelle hebdo')], color: 'bg-blue-400' },
                  { phase: t('Weeks 5-6', 'Semaines 5-6'), label: t('Reflection Layer', 'Couche de r\u00e9flexion'), items: [t('Evolution View (7d / 30d / 90d zoom out)', 'Vue \u00c9volution (7j / 30j / 90j zoom arri\u00e8re)'), t('Weekly reflection generation from mood patterns', "G\u00e9n\u00e9ration de r\u00e9flexion hebdo depuis les patterns d\u2019humeur"), t('Monthly pattern map (emotional landscape heatmap)', 'Carte de patterns mensuelle (heatmap du paysage \u00e9motionnel)'), t('Bloom AI moment memory integration', "Int\u00e9gration m\u00e9moire de moments Bloom AI")], color: 'bg-amber-400' },
                  { phase: t('Weeks 7-8', 'Semaines 7-8'), label: t('Evolution Story + Launch', 'Histoire d\u2019\u00e9volution + Lancement'), items: [t('Auto-generated shareable journey cards', 'Cartes de parcours partageables auto-g\u00e9n\u00e9r\u00e9es'), t('My Evolution public profile (opt-in)', "Profil public Mon \u00c9volution (opt-in)"), t('Practitioner impact stories', "Histoires d\u2019impact praticien"), t('Phase 2 pilot launch (30-50 users)', 'Lancement pilote Phase 2 (30-50 utilisateurs)')], color: 'bg-violet-400' },
                ].map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-3 h-3 rounded-full ${p.color}`} />
                      {i < 3 && <div className="w-px h-full bg-white/20 min-h-[40px]" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-white">{p.phase}</span>
                        <span className="text-[9px] text-gray-400">— {p.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {p.items.map((item, j) => (
                          <p key={j} className="text-[9px] text-gray-400">• {item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[10px] text-gray-400">
                  {lang === 'fr' ? (
                    <><span className="text-white font-semibold">Lancement pilote Phase 2 : Semaine 8</span> — 30-50 utilisateurs, app native, onboarding complet, notifications, couche de r&eacute;flexion et partage d&apos;&eacute;volution actifs. Observer pendant 30 jours. La nouvelle m&eacute;trique cl&eacute; : les utilisateurs partagent-ils leur &eacute;volution ? Si oui, Moments est un moteur de croissance, pas juste une fonctionnalit&eacute;.</>
                  ) : (
                    <><span className="text-white font-semibold">Phase 2 pilot launch: Week 8</span> — 30-50 users, native app, full onboarding, notifications, reflection layer, and evolution sharing active. Observe for 30 days. The key new metric: do users share their evolution? If yes, Moments is a growth engine, not just a feature.</>
                  )}
                </p>
              </div>
            </div>

          </div>
        </motion.section>

        <motion.div {...fadeUp(0.55)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">{t('Product Design — Moments — Feb 2026 — Bloomsline Care', 'Conception Produit — Moments — F\u00e9v. 2026 — Bloomsline Care')}</p>
        </motion.div>
      </main>
      </div>
    </div>
  )
}

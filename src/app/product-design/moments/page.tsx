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
            <h1 className="text-sm font-semibold text-gray-900">Product Design — Moments</h1>
            <p className="text-[10px] text-gray-400">Complete User Flow Map — Every Screen, Every Tap</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* ── Left Nav ─────────────────────────────────────── */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto border-r border-gray-200 bg-white py-6 px-4">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</p>
          <div className="space-y-0.5">
            {[
              { id: 'hero', label: 'Overview' },
              { id: 'flow-1', label: 'Flow 1: Home' },
              { id: 'flow-2', label: 'Flow 2: Capture' },
              { id: 'flow-3', label: 'Flow 3: After Save' },
              { id: 'flow-4', label: 'Flow 4: Full Day' },
              { id: 'flow-5', label: 'Flow 5: Loop' },
              { id: 'user-feedback', label: 'What Users Told Us' },
              { id: 'touchpoints', label: 'Touchpoint Sequence' },
              { id: 'analytics', label: 'Live Analytics' },
              { id: 'built-vs-next', label: 'Built vs. Next' },
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">The complete Moments journey — screen by screen.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Every interaction mapped from the home screen through capture, mood tagging, the emotional timeline,
            and the daily story recap. Built from the actual mobile app UI — each screen shows what the user sees,
            what they tap, how they feel, and how long they stay.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">4-step capture wizard</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">14 mood tags</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">Up to 7 media per moment</span>
            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">Emotional timeline + story recap</span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Status:</span>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] text-gray-500">Built</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[9px] text-gray-500">Partial</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[9px] text-gray-500">Missing</span></div>
            <span className="text-gray-200">|</span>
            <span className="text-[9px] text-gray-500">Dark bg = capture mode</span>
            <span className="text-[9px] text-gray-500">Light bg = browsing mode</span>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 1: HOME → CAPTURE ENTRY ───────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-1" className="scroll-mt-16" {...fadeUp(0.05)}>
          <SectionTitle subtitle="User opens the app and decides to capture a moment">Flow 1: Home Screen</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[300px]">
              <ScreenNode screen={HOME_FLOW[0]} />
              <FlowArrow direction="right" label="Taps FAB 📸" />
              <ScreenNode screen={CAPTURE_STEP1} />
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-blue-700 mb-1">Entry Points</p>
              <p className="text-[10px] text-blue-600">Two ways to start a moment: (1) Pink FAB camera button (always visible), (2) &quot;Moments&quot; tab in bottom navigation. The FAB is the primary path — it&apos;s the most prominent UI element on the home screen.</p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 2: 4-STEP CAPTURE WIZARD ──────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-2" className="scroll-mt-16" {...fadeUp(0.1)}>
          <SectionTitle subtitle="The full capture flow — Type → Capture → Preview → Details → Save">Flow 2: Capture Wizard (4 Steps)</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            {/* Step 1: Type Selection */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 1 — Type Selection</p>
              <ScreenNode screen={CAPTURE_STEP1} />
            </div>

            <div className="flex items-center gap-2 mb-3 ml-6">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">User selects format — branches into 3 paths</span>
            </div>

            {/* Step 2: Capture Branches */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 2 — Capture (3 branches)</p>
              <div className="flex items-start gap-4 min-w-[800px]">
                {CAPTURE_BRANCHES.map((screen) => (
                  <ScreenNode key={screen.id} screen={screen} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 ml-6">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">All paths converge at Preview</span>
            </div>

            {/* Step 3: Preview */}
            <div className="mb-4">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 3 — Preview (multi-media)</p>
              <ScreenNode screen={CAPTURE_STEP3} />
            </div>

            <FlowArrow label="Taps Continue ✨" />

            {/* Step 4: Details + Save */}
            <div>
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 4 — Details (Mood + Note + Save)</p>
              <ScreenNode screen={CAPTURE_STEP4} />
            </div>

            {/* Wizard insight */}
            <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-emerald-700 mb-1">Design Strengths</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <p className="text-[10px] text-emerald-600">Clear progress stepper (Type → Capture → Preview → Details) — user always knows where they are</p>
                <p className="text-[10px] text-emerald-600">Multi-media support (up to 7 items, mix types) — rich moments, not just single photos</p>
                <p className="text-[10px] text-emerald-600">14 mood tags including negative ones — captures the full emotional range, not just highlights</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 3: POST-SAVE → HOME UPDATE ────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-3" className="scroll-mt-16" {...fadeUp(0.15)}>
          <SectionTitle subtitle="What happens after saving — home updates, timeline shows moment">Flow 3: After Saving</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[550px]">
              <ScreenNode screen={CAPTURE_STEP4} />
              <FlowArrow direction="right" label='Taps "Save Moment"' />
              <ScreenNode screen={POST_SAVE_FLOW[0]} />
            </div>
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-gray-500 mb-1">What Changes on Home</p>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-600">• &quot;Your Day&quot; card updates: shows &quot;1 moment&quot; count + seeds earned</p>
                <p className="text-[10px] text-gray-600">• Today&apos;s Flow timeline: moment thumbnail appears at the correct time position</p>
                <p className="text-[10px] text-gray-600">• The emotional curve line begins to form (visible after 2+ moments)</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 4: FULL DAY → CURVE + STORY ───────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-4" className="scroll-mt-16" {...fadeUp(0.2)}>
          <SectionTitle subtitle="After capturing multiple moments — the emotional curve and daily story recap">Flow 4: Full Day — Emotional Curve + Story Recap</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[550px]">
              <ScreenNode screen={FULL_DAY_FLOW[0]} />
              <FlowArrow direction="right" label='Taps ▶️ on "Your Day"' />
              <ScreenNode screen={FULL_DAY_FLOW[1]} />
            </div>
            <div className="mt-5 bg-violet-50 border border-violet-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-violet-700 mb-1">The Core Reward Loop</p>
              <p className="text-[10px] text-violet-600 leading-relaxed">
                <span className="font-semibold">Today&apos;s Flow</span> is the primary visual reward — each moment you capture adds a point on the emotional curve.
                By end of day, you have a visual map of your emotional journey: highs, lows, and everything in between.
                The teal line connecting moments creates an &quot;emotional EKG&quot; that&apos;s unique to each day.
                <span className="font-semibold"> Your Day Story</span> gives closure — a tap-through replay of everything you captured, like an Instagram Story for your inner life.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 5: ENGAGEMENT LOOP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="flow-5" className="scroll-mt-16" {...fadeUp(0.25)}>
          <SectionTitle subtitle="The daily habit loop — what brings users back and keeps them capturing">Flow 5: Daily Engagement Loop</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                {/* Circular flow */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">📸</div>
                    <p className="text-[10px] font-bold text-pink-700">Capture Moment</p>
                    <p className="text-[8px] text-pink-600">Tap FAB → 4-step wizard</p>
                    <p className="text-[8px] text-pink-600">10-30 seconds</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">📈</div>
                    <p className="text-[10px] font-bold text-emerald-700">See Flow Build</p>
                    <p className="text-[8px] text-emerald-600">Moment appears on timeline</p>
                    <p className="text-[8px] text-emerald-600">Emotional curve grows</p>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">▶️</div>
                    <p className="text-[10px] font-bold text-violet-700">Replay Your Day</p>
                    <p className="text-[8px] text-violet-600">Story recap at end of day</p>
                    <p className="text-[8px] text-violet-600">&quot;Here&apos;s what you felt today&quot;</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-lg mb-1">🌅</div>
                    <p className="text-[10px] font-bold text-blue-700">Next Morning</p>
                    <p className="text-[8px] text-blue-600">Open app → see yesterday&apos;s flow</p>
                    <p className="text-[8px] text-blue-600">Start today&apos;s fresh timeline</p>
                  </div>
                </div>
                {/* Arrows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <RefreshCw className="w-6 h-6 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-amber-700 mb-1">The Open Question</p>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                The loop above works IF the user opens the app. The missing piece is: <span className="font-semibold">what triggers them to open it?</span>
                During testing, 15-20 users captured moments because they were asked to. The visual reward (emotional curve + story) is strong,
                but the <span className="font-semibold">trigger</span> to start each day&apos;s first capture is the gap that needs investigation.
                Is it a push notification? A practitioner prompt? A morning ritual? The &quot;Wanna talk?&quot; Bloom AI nudge?
              </p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── USER FEEDBACK: WHY ENGAGEMENT DROPPED ──────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="user-feedback" className="scroll-mt-16" {...fadeUp(0.28)}>
          <SectionTitle subtitle="Qualitative feedback from 15-20 test users">What Users Told Us</SectionTitle>

          <div className="space-y-4">
            {/* The 4 root causes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'F1',
                  title: 'No Intrinsic Motivation',
                  severity: 'critical' as const,
                  icon: '🔋',
                  finding: 'Users captured moments when asked, but couldn\'t find their own reason to continue. The emotional curve and story recap weren\'t enough to drive self-initiated behavior.',
                  rootCause: 'The reward is passive (you see a pretty timeline) not active (you gain something). No progression, no streak incentive, no "why should I do this today?" trigger.',
                  implication: 'The capture flow works — the motivation layer doesn\'t exist yet.',
                },
                {
                  id: 'F2',
                  title: 'Web App, Not Native',
                  severity: 'critical' as const,
                  icon: '🌐',
                  finding: 'Users opened Moments in their mobile browser (Chrome/Safari) as a URL. Not installed as a native app or PWA on their home screen.',
                  rootCause: 'Browser-based = no home screen icon, no app switcher presence, no "muscle memory" of tapping an app icon. Out of sight, out of mind.',
                  implication: 'Even if motivation existed, the friction of "open browser → type URL / find bookmark" kills spontaneous captures.',
                },
                {
                  id: 'F3',
                  title: 'Zero Notifications',
                  severity: 'critical' as const,
                  icon: '🔕',
                  finding: 'The app sent no push notifications — no morning prompt, no evening recap nudge, no "you haven\'t captured today" reminder.',
                  rootCause: 'Web apps can\'t send native push notifications without PWA setup + user permission. The daily trigger mechanism was completely absent.',
                  implication: 'Without a trigger, the habit loop has no entry point. Users relied on remembering, which fails after day 2-3.',
                },
                {
                  id: 'F4',
                  title: 'No Proper Onboarding',
                  severity: 'high' as const,
                  icon: '🚪',
                  finding: 'Users were verbally explained the feature instead of being guided through a structured first-time experience. No in-app walkthrough, no first-moment tutorial, no "why this matters" framing.',
                  rootCause: 'Without onboarding, users don\'t form the mental model of "capture → tag mood → see curve build → replay at night." They just see an empty screen.',
                  implication: 'First-time experience is the entire conversion funnel. No onboarding = no habit formation.',
                },
              ].map((feedback) => (
                <div key={feedback.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className={`px-4 py-2.5 flex items-center justify-between ${feedback.severity === 'critical' ? 'bg-red-50 border-b border-red-100' : 'bg-amber-50 border-b border-amber-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{feedback.icon}</span>
                      <span className="text-xs font-bold text-gray-900">{feedback.title}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${feedback.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{feedback.severity}</span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">What Users Said</p>
                      <p className="text-[10px] text-gray-700 leading-relaxed">{feedback.finding}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Root Cause</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed">{feedback.rootCause}</p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${feedback.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'}`}>
                      <p className={`text-[9px] font-semibold ${feedback.severity === 'critical' ? 'text-red-700' : 'text-amber-700'} mb-0.5`}>Implication</p>
                      <p className={`text-[10px] ${feedback.severity === 'critical' ? 'text-red-600' : 'text-amber-600'} leading-relaxed`}>{feedback.implication}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Habit loop diagnosis */}
            <div className="bg-gray-900 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-red-400" />
                Habit Loop Diagnosis
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-[10px] font-bold text-red-400">TRIGGER</p>
                  <p className="text-[9px] text-red-300">Missing</p>
                  <p className="text-[8px] text-gray-500 mt-1">No notifications, no home screen icon, no daily prompt</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400">ACTION</p>
                  <p className="text-[9px] text-emerald-300">Working</p>
                  <p className="text-[8px] text-gray-500 mt-1">4-step wizard is clear, fast (10-30s), low friction</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center mx-auto mb-2">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[10px] font-bold text-amber-400">REWARD</p>
                  <p className="text-[9px] text-amber-300">Weak</p>
                  <p className="text-[8px] text-gray-500 mt-1">Curve is beautiful but passive — no progression, streak, or social proof</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  <span className="text-white font-semibold">Diagnosis:</span> The capture experience (Action) is solid — users who started it, completed it.
                  The breakdown is on both ends: nothing <span className="text-red-400 font-semibold">triggers</span> them to open the app,
                  and the <span className="text-amber-400 font-semibold">reward</span> isn&apos;t strong enough to create anticipation for tomorrow.
                  The fix isn&apos;t in the capture flow — it&apos;s in the infrastructure around it: native app with push notifications, structured onboarding,
                  and a reward system that creates forward momentum (streaks, seeds, practitioner connection, weekly insights).
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── COMPLETE TOUCHPOINT MAP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="touchpoints" className="scroll-mt-16" {...fadeUp(0.3)}>
          <SectionTitle subtitle="Every interaction in the full journey — sequential list">Complete Touchpoint Sequence</SectionTitle>

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
          <SectionTitle subtitle="Real data from the moments table — what users actually did">Live Analytics</SectionTitle>

          {loading && (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-3" />
              <p className="text-xs text-gray-400">Loading moments data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {analytics && analytics.empty && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-sm text-gray-500">No moments captured yet</p>
              <p className="text-xs text-gray-400 mt-1">Analytics will appear here once users start capturing moments</p>
            </div>
          )}

          {analytics && !analytics.empty && (
            <div className="space-y-6">

              {/* ── Overview Stats ─────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard value={analytics.totalMoments} label="Total Moments" sub={`across ${analytics.totalActiveDays} active days`} color="text-violet-600" />
                <StatCard value={analytics.totalUsers} label="Unique Users" sub={`avg ${analytics.avgMomentsPerUser}/user`} color="text-blue-600" />
                <StatCard value={analytics.avgMomentsPerDay} label="Avg per Active Day" sub={`peak possible: ${Math.max(...analytics.dailyTimeline.map(d => d.count))}/day`} color="text-emerald-600" />
                <StatCard value={`${analytics.moodTagRate}%`} label="Tagged a Mood" sub={`${analytics.captionRate}% wrote a note`} color="text-pink-600" />
              </div>

              {/* ── Date Range ─────────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">First moment:</span> {new Date(analytics.dateRange.first).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-3 text-gray-300">→</span>
                    <span className="font-semibold">Last moment:</span> {new Date(analytics.dateRange.last).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* ── Moments by Type ────────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-gray-400" />
                  Moments by Type
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {Object.entries(analytics.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const t = TYPE_ICONS[type] || TYPE_ICONS.photo
                    const pct = Math.round((count / analytics.totalMoments) * 100)
                    return (
                      <div key={type} className={`${t.bg} rounded-xl p-3 text-center`}>
                        <p className="text-xl mb-0.5">{t.icon}</p>
                        <p className={`text-lg font-bold ${t.color}`}>{count}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{type}</p>
                        <p className="text-[9px] text-gray-400">{pct}%</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Mood Distribution ─────────────────────── */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-gray-400" />
                  Mood Distribution
                </h3>
                <p className="text-[10px] text-gray-400 mb-4">Avg {analytics.avgMoodsPerMoment} moods per moment</p>

                {analytics.moods.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No moods tagged yet</p>
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
                        <span className="text-[10px] text-emerald-600 font-semibold">{total > 0 ? Math.round((pos / total) * 100) : 0}% positive</span>
                        <span className="text-[10px] text-amber-600 font-semibold">{total > 0 ? Math.round((neg / total) * 100) : 0}% negative</span>
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
                    Time of Day
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
                    Day of Week
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
                  Hourly Distribution (24h)
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
                  Daily Activity Timeline
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
                  Auto-Generated Insights
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

        {/* ── Key Stats ──────────────────────────────────── */}
        <motion.section id="built-vs-next" className="scroll-mt-16" {...fadeUp(0.5)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">What&apos;s Built vs. What&apos;s Next</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">Fully Built</p>
                <div className="space-y-2">
                  {[
                    'Complete 4-step capture wizard (Type → Capture → Preview → Details)',
                    'Multi-media support: up to 7 items, mix photo + video + voice',
                    '14 mood tags including 6 negative/neutral emotions',
                    'Today\'s Flow emotional timeline with teal connecting line',
                    'Your Day story recap (Instagram Stories-style)',
                    'Seeds reward metric + My Little Steps habits',
                    'Previous day navigation in timeline',
                    'Bloom AI "Wanna talk?" chat entry on home',
                  ].map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-2.5">To Investigate / Build</p>
                <div className="space-y-2">
                  {[
                    'What triggers the first capture each day? (notification, routine, self-initiated?)',
                    'What do "seeds" represent and how are they earned?',
                    'What happens when user taps a moment on the timeline?',
                    'Does Bloom AI reference captured moments in conversations?',
                    'How does the practitioner see the member\'s moments?',
                    'Weekly/monthly summaries or pattern insights?',
                    'The reload issue mentioned when advancing through the flow',
                    'What\'s in the "Moments" and "Rituals" bottom nav tabs?',
                  ].map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-2">Starting Point</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                This is the base flow map. The capture experience is well-built — 4 clear steps, rich media support, full emotional vocabulary.
                The visual reward (emotional curve + story recap) is the differentiator. The open question is: <span className="text-white font-semibold">what makes
                users start their first capture each day without being asked?</span> Share more context and we&apos;ll layer in the trigger
                analysis, practitioner connection, and retention mechanics.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.div {...fadeUp(0.55)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">Product Design — Moments — Feb 2026 — Bloomsline Care</p>
        </motion.div>
      </main>
      </div>
    </div>
  )
}

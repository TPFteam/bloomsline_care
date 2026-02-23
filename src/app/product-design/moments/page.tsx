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
              { id: 'test-conditions', label: 'Test Conditions' },
              { id: 'touchpoints', label: 'Touchpoint Sequence' },
              { id: 'analytics', label: 'Live Analytics' },
              { id: 'user-segments', label: 'User Segments' },
              { id: 'retention', label: 'Retention Curve' },
              { id: 'activation', label: 'Activation Funnel' },
              { id: 'signals', label: 'Predictive Signals' },
              { id: 'pilot-summary', label: 'Pilot Summary' },
              { id: 'phase-2', label: 'Phase 2: Evolution' },
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
                  rootCause: 'The reward is passive (you see a pretty timeline) not active (you gain something). No progression, no personal insight, no "why should I do this today?" trigger.',
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
                {
                  id: 'F5',
                  title: 'App Was Buggy',
                  severity: 'high' as const,
                  icon: '🐛',
                  finding: 'The app had bugs and rough edges during the test — crashes, loading issues, and UI glitches that interrupted the capture flow and broke user trust.',
                  rootCause: 'Early-stage build running as a web app on mobile browsers. Not optimized for all devices, no crash reporting, no error recovery flows.',
                  implication: 'Bugs add friction on top of an already frictionful experience (web-only, no onboarding). Users who hit a bug on their first try are unlikely to come back.',
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

            {/* What users loved */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                What Users Loved
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: '📸',
                    title: 'Capturing Was Easy',
                    quote: 'The process of capturing a moment felt natural and quick — users said it was easy to do and didn\'t feel like a chore. The 4-step wizard is lightweight enough to do multiple times a day.',
                  },
                  {
                    icon: '📈',
                    title: 'The Emotional Curve',
                    quote: 'Seeing their emotions visualized as a curve throughout the day — lows at the bottom, highs at the top — was the "wow" moment. Users enjoyed watching the line take shape as they captured more.',
                  },
                  {
                    icon: '▶️',
                    title: 'Your Day Story Recap',
                    quote: 'The Instagram Stories-style daily recap was a highlight. Users liked replaying their day and seeing all their moments in sequence — it gave a sense of closure and self-reflection.',
                  },
                  {
                    icon: '💬',
                    title: 'Talking to Moments via Bloom',
                    quote: 'Users found it interesting that they could go back to a specific moment and talk to Bloom AI about it — turning a captured memory into a conversation about how they felt.',
                  },
                  {
                    icon: '📅',
                    title: 'Looking Back at Past Days',
                    quote: 'The ability to navigate to previous days and see what they did — their emotional shape on a Tuesday two weeks ago — made the timeline feel like a personal journal they actually want to revisit.',
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
                  <p className="text-[8px] text-gray-500 mt-1">Curve is beautiful but passive — no progression, personal insight, or forward pull</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  <span className="text-white font-semibold">Diagnosis:</span> The capture experience (Action) is solid — users who started it, completed it.
                  The breakdown is on both ends: nothing <span className="text-red-400 font-semibold">triggers</span> them to open the app,
                  and the <span className="text-amber-400 font-semibold">reward</span> isn&apos;t strong enough to create anticipation for tomorrow.
                  The fix isn&apos;t in the capture flow — it&apos;s in the infrastructure around it: native app with push notifications, structured onboarding,
                  and a reward system that creates forward momentum (personal insights, emotional growth, practitioner connection, weekly reflections).
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── TEST CONDITIONS ──────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="test-conditions" className="scroll-mt-16" {...fadeUp(0.29)}>
          <SectionTitle subtitle="How the pilot was run — deliberately minimal to test the product on its own">Test Conditions</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
              <p className="text-xs font-bold text-gray-900">Zero-Support Pilot — Jan 20 to Feb 23, 2026</p>
              <p className="text-[10px] text-gray-500 mt-0.5">We intentionally gave users the minimum to see what the product does on its own, without any hand-holding.</p>
            </div>

            <div className="p-5 space-y-5">
              {/* What we did */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">What We Did</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { step: '1', label: 'Gave access', detail: 'Shared the web app URL with 11 users', icon: '🔗' },
                    { step: '2', label: '15-min explanation', detail: 'High-level walkthrough of what Moments is and how to capture', icon: '💬' },
                    { step: '3', label: 'Stepped back', detail: 'Zero follow-up for 1 month — no messages, no check-ins, no prompts', icon: '🤫' },
                    { step: '4', label: 'Observed', detail: 'Let the data speak — who came back, who didn\'t, and why', icon: '📊' },
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
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">What We Deliberately Did Not Do</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'No push notifications',
                    'No in-app onboarding flow',
                    'No daily reminders or nudges',
                    'No check-in messages',
                    'No incentives or rewards',
                    'No native app (web URL only)',
                    'App was buggy — early build, rough edges',
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
                <p className="text-[10px] font-semibold text-blue-700 mb-2">Why This Matters for Investors</p>
                <div className="space-y-2">
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    <span className="font-semibold">This was a stress test, not a launch.</span> We wanted to answer one question:
                    &quot;Does the core capture + emotional timeline experience have enough pull to bring users back on its own?&quot;
                  </p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    The conditions were deliberately harsh — no triggers, no onboarding, no follow-up. A web URL in a browser.
                    In any standard pilot you&apos;d have push notifications, an onboarding flow, and weekly touchpoints.
                    We had none of that.
                  </p>
                  <p className="text-[10px] text-blue-700 leading-relaxed font-semibold">
                    And yet: {analytics?.userSegments.powerUsers || '—'} users captured 10+ moments organically. {analytics?.totalMoments || '—'} total moments across {analytics?.totalActiveDays || '—'} active days.
                    The top user captured {analytics?.perUser[0]?.total || '—'} moments over {analytics?.perUser[0]?.activeDays || '—'} days — with zero prompting.
                  </p>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    That&apos;s not a retention problem — it&apos;s a distribution problem. The product has pull.
                    Now add a native app with push notifications, a real onboarding, and a reward system,
                    and these numbers change fundamentally.
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
                    <span className="font-semibold">First moment:</span> 20 Jan 2026
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(analytics.byType).filter(([type]) => type !== 'mixed').sort((a, b) => b[1] - a[1]).map(([type, count]) => {
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
                <p className="text-[9px] text-gray-400 mt-3">Multi-media (mixed) moments launched on 21 Feb — not included in type breakdown.</p>
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

        {/* ══════════════════════════════════════════════════ */}
        {/* ── USER SEGMENTS ────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section id="user-segments" className="scroll-mt-16" {...fadeUp(0.38)}>
          <SectionTitle subtitle="Test users categorized by background — how prior experience shaped behavior">User Segments</SectionTitle>

          <div className="space-y-4">
            {/* Segment framework */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Prior Wellbeing App Users',
                  color: 'bg-blue-50 border-blue-200',
                  headerColor: 'bg-blue-100 text-blue-800',
                  icon: '📱',
                  description: 'Used apps like Calm, Headspace, Daylio, or therapy platforms before.',
                  traits: ['Already understand mood tracking', 'Compare Bloomsline to what they know', 'Higher initial engagement', 'More critical of UX gaps'],
                  hypothesis: 'Faster activation but higher churn if features don\'t match expectations.',
                },
                {
                  label: 'No Prior Wellbeing App',
                  color: 'bg-emerald-50 border-emerald-200',
                  headerColor: 'bg-emerald-100 text-emerald-800',
                  icon: '🌱',
                  description: 'First time using any digital wellbeing tool. Often referred by practitioner.',
                  traits: ['Need more onboarding guidance', 'No benchmark to compare against', 'May find concept novel or confusing', 'Practitioner recommendation is key trigger'],
                  hypothesis: 'Slower activation but potentially stickier if they form a new habit.',
                },
                {
                  label: 'Emotionally Self-Aware',
                  color: 'bg-violet-50 border-violet-200',
                  headerColor: 'bg-violet-100 text-violet-800',
                  icon: '🧭',
                  description: 'Clear about their emotions, organized, can name what they feel. vs. those who struggle to identify emotions.',
                  traits: ['Quick mood tagging (know their feelings)', 'Richer captions and notes', 'Use negative moods without hesitation', 'vs. Uncertain/skip mood step'],
                  hypothesis: 'Self-aware users tag moods faster and write more notes. Less-aware users need the mood vocabulary as a learning tool.',
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
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Behavioral Traits</p>
                      <div className="space-y-1">
                        {seg.traits.map((t, j) => (
                          <p key={j} className="text-[10px] text-gray-600">• {t}</p>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <p className="text-[9px] font-semibold text-gray-500 mb-0.5">Hypothesis</p>
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
                  Engagement Tiers (from data)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-2xl font-bold text-emerald-600">{analytics.userSegments.powerUsers}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">Power Users</p>
                    <p className="text-[9px] text-emerald-600">10+ moments</p>
                    <p className="text-[9px] text-gray-500 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.powerUsers / analytics.totalUsers) * 100) : 0}% of users</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-2xl font-bold text-blue-600">{analytics.userSegments.casualUsers}</p>
                    <p className="text-xs font-semibold text-blue-700 mt-1">Casual Users</p>
                    <p className="text-[9px] text-blue-600">3-9 moments</p>
                    <p className="text-[9px] text-gray-500 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.casualUsers / analytics.totalUsers) * 100) : 0}% of users</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-2xl font-bold text-gray-500">{analytics.userSegments.trialUsers}</p>
                    <p className="text-xs font-semibold text-gray-700 mt-1">Trial Only</p>
                    <p className="text-[9px] text-gray-500">1-2 moments</p>
                    <p className="text-[9px] text-gray-400 mt-1">{analytics.totalUsers > 0 ? Math.round((analytics.userSegments.trialUsers / analytics.totalUsers) * 100) : 0}% of users</p>
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
            <SectionTitle subtitle="What % of users captured a moment on day N after their first moment">Retention Curve</SectionTitle>
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
            <SectionTitle subtitle="How deep do users go — what % reach each milestone">Activation Funnel</SectionTitle>
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
            <SectionTitle subtitle="Which early behaviors predict whether a user sticks around (3+ active days)">What Predicts Retention</SectionTitle>
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
                          <p className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5">With signal</p>
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-emerald-600">{s.withSignalPct}%</span>
                            <span className="text-[10px] text-gray-400 mb-0.5">retained ({s.withSignalRetained}/{s.withSignal})</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.withSignalPct}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Without signal</p>
                          <div className="flex items-end gap-2">
                            <span className="text-xl font-bold text-gray-400">{s.withoutSignalPct}%</span>
                            <span className="text-[10px] text-gray-400 mb-0.5">retained ({s.withoutSignalRetained}/{s.withoutSignal})</span>
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
          <SectionTitle subtitle="The one-slide summary an investor skims first">1-Month Pilot Summary</SectionTitle>
          <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-6">

            {/* Headline */}
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Jan 20 — Feb 23, 2026 · Closed Beta</p>
              <p className="text-base font-bold text-white leading-snug">The capture experience works. The infrastructure around it doesn&apos;t — yet.</p>
            </div>

            {/* Top-line metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-white">{analytics?.totalUsers || '—'}</p>
                <p className="text-[10px] text-gray-400">Test Users</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-emerald-400">{analytics?.totalMoments || '—'}</p>
                <p className="text-[10px] text-gray-400">Moments Captured</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-blue-400">{analytics ? `${analytics.avgMomentsPerUser}` : '—'}</p>
                <p className="text-[10px] text-gray-400">Avg per User</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3.5 text-center">
                <p className="text-2xl font-bold text-violet-400">{analytics?.moodTagRate || '—'}%</p>
                <p className="text-[10px] text-gray-400">Tagged a Mood</p>
              </div>
            </div>

            {/* Engagement tiers + retention at a glance */}
            {analytics && !analytics.empty && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">User Engagement Tiers</p>
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
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Retention Snapshot</p>
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
                  <p className="text-[10px] font-semibold text-violet-300 uppercase tracking-wider mb-1">Strongest Retention Signal</p>
                  <p className="text-sm font-bold text-white mb-1">Users who <span className="text-violet-300">{best.signal.toLowerCase()}</span> retain at {best.withSignalPct}% vs {best.withoutSignalPct}%</p>
                  <p className="text-[10px] text-gray-400">+{lift}pp lift — this is the behavior to optimize for in onboarding.</p>
                </div>
              )
            })()}

            {/* 3 columns: worked, loved, broke */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">What Worked</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">• 4-step capture is fast (10-30s) and users complete it</p>
                  <p className="text-[10px] text-gray-300">• {analytics?.moodTagRate || '—'}% voluntarily tagged moods — all 14 used including negative</p>
                  <p className="text-[10px] text-gray-300">• {analytics?.captionRate || '—'}% wrote optional notes — reflection happens naturally</p>
                  <p className="text-[10px] text-gray-300">• {analytics?.userSegments.powerUsers || '—'} power users emerged organically (10+ moments)</p>
                  {analytics && !analytics.empty && (() => {
                    const topType = Object.entries(analytics.byType).sort((a, b) => b[1] - a[1])[0]
                    return topType ? <p className="text-[10px] text-gray-300">• {topType[0]} is the dominant format ({Math.round((topType[1] / analytics.totalMoments) * 100)}%) — visual capture is intuitive</p> : null
                  })()}
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider mb-2.5">What Users Loved</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">• Capturing felt easy and natural — not a chore</p>
                  <p className="text-[10px] text-gray-300">• The emotional curve (highs up, lows down) was the &quot;wow&quot; moment</p>
                  <p className="text-[10px] text-gray-300">• Your Day story recap gave closure and self-reflection</p>
                  <p className="text-[10px] text-gray-300">• Going back to past days felt like a personal journal</p>
                  <p className="text-[10px] text-gray-300">• Talking to Bloom AI about a specific moment was novel</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">What Broke</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-gray-300">• Web-only — no home screen presence, no app switcher</p>
                  <p className="text-[10px] text-gray-300">• Zero push notifications — no daily trigger mechanism</p>
                  <p className="text-[10px] text-gray-300">• Verbal onboarding only — no guided first-time experience</p>
                  <p className="text-[10px] text-gray-300">• No motivation to self-initiate without being asked</p>
                  <p className="text-[10px] text-gray-300">• {analytics?.userSegments.trialUsers || '—'} users tried 1-2 times and never returned</p>
                </div>
              </div>
            </div>

            {/* Key learning */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-2">Core Learning</p>
              <p className="text-[11px] text-gray-200 leading-relaxed">
                The product has <span className="text-emerald-300 font-semibold">product love</span> — users who captured moments liked the experience, the curve, the story, and the Bloom conversations.
                It does not yet have <span className="text-red-300 font-semibold">product habit</span> — there&apos;s no trigger to open the app, no progression to come back tomorrow, and no onboarding to form the mental model.
                This is a distribution and infrastructure problem, not a product problem. The fix is specific and buildable.
              </p>
            </div>

            {/* Next 90 days */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-white mb-3">Next 90 Days: From Private Journal to Shareable Evolution</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">Native App + Triggers</p>
                    <p className="text-[9px] text-gray-400">Home screen icon, push notifications, guided onboarding with first moment. Solve the infrastructure gap.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">Reflection Layer</p>
                    <p className="text-[9px] text-gray-400">Evolution View (7d/30d/90d), weekly reflections, monthly pattern maps. Make growth visible — the reason to keep building.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-bold text-violet-400 bg-violet-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-[10px] font-semibold text-white">Evolution Story</p>
                    <p className="text-[9px] text-gray-400">Shareable journey cards, public evolution profiles, practitioner impact stories. People follow evolution, not perfection — that&apos;s the growth engine.</p>
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
          <SectionTitle subtitle="People love evolution, not perfection. Document the journey — good, bad, everything — and it becomes the most authentic story you can tell.">Phase 2: The Evolution Layer</SectionTitle>

          <div className="space-y-5">

            {/* The Insight */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950 text-white rounded-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">The Core Insight From Phase 1</p>
                    <p className="text-[11px] text-gray-400 mt-1">What our users and data told us</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-200 leading-relaxed">
                    If you document what you&apos;re going through — the good, the bad, the right things you&apos;re doing — and you put that out there,
                    people love it. Not because it&apos;s polished. Because it&apos;s <span className="text-amber-300 font-semibold">real</span>.
                  </p>
                  <p className="text-[11px] text-gray-200 leading-relaxed">
                    People don&apos;t follow perfection. They follow <span className="text-emerald-300 font-semibold">evolution</span>.
                    If you bring your audience on a journey of who you are and who you&apos;re becoming — they&apos;ll follow you.
                    That becomes your most authentic brand.
                  </p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    Right now, Moments is a <span className="text-white font-semibold">journal</span>.
                    Phase 2 turns it into a <span className="text-white font-semibold">story</span>.
                    The difference: a journal is private and disposable. A story compounds over time, and when shared, becomes magnetic.
                  </p>
                </div>
              </div>
            </div>

            {/* Three Layers */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                The Three Layers of Moments
              </h3>
              <div className="space-y-4">
                {/* Layer 1 */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold bg-emerald-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <h4 className="text-xs font-bold text-emerald-800">Capture</h4>
                      <span className="text-[8px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">EXISTS — WORKS</span>
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
                      <h4 className="text-xs font-bold text-blue-800">Reflection</h4>
                      <span className="text-[8px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">PARTIALLY EXISTS — NEEDS DEPTH</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-700 leading-relaxed mb-2.5">
                    Your Day story exists, but only for one day at a time. No zoomed-out view. No &quot;here&apos;s how your last 30 days looked.&quot;
                    No &quot;your mornings shifted from Heavy to Hopeful over 3 weeks.&quot;
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 space-y-1.5">
                    <p className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider">What to Build</p>
                    <p className="text-[10px] text-blue-700">• <span className="font-semibold">Evolution View</span> — zoom out from today to 7 days, 30 days, 90 days. See the emotional arc of your life, not just your day.</p>
                    <p className="text-[10px] text-blue-700">• <span className="font-semibold">Weekly Reflection</span> — &quot;This week you felt most peaceful on mornings you walked. Tuesdays tend to be heavy.&quot;</p>
                    <p className="text-[10px] text-blue-700">• <span className="font-semibold">Monthly Pattern Map</span> — 30-day emotional landscape heatmap. Visual proof of growth over time.</p>
                    <p className="text-[10px] text-blue-700">• <span className="font-semibold">Bloom AI Memory</span> — &quot;Last Thursday you felt inspired — what sparked that?&quot; Your moments woven into conversations.</p>
                  </div>
                </div>

                {/* Layer 3 — THE BIG NEW THING */}
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold bg-violet-600 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-violet-600" />
                      <h4 className="text-xs font-bold text-violet-800">Evolution Story</h4>
                      <span className="text-[8px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">NEW — THE PHASE 2 DIFFERENTIATOR</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-violet-700 leading-relaxed mb-3">
                    The user takes their emotional arc — not individual moments, but the <span className="font-semibold">shape of their change over time</span> — and shares it.
                    Not &quot;here&apos;s my sad Tuesday.&quot; Instead: &quot;Here&apos;s my month. I started overwhelmed. I ended peaceful. This is what the curve looks like.&quot;
                  </p>
                  <div className="bg-white/60 rounded-lg p-3 space-y-2">
                    <p className="text-[9px] font-semibold text-violet-500 uppercase tracking-wider">What to Build</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Share2 className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">Shareable Journey Cards</p>
                          <p className="text-[10px] text-violet-600">Auto-generated from your evolution data. Not individual moments — those stay private. The <em>pattern</em> is what you share.</p>
                          <div className="mt-1.5 space-y-1">
                            <p className="text-[9px] text-violet-500 italic">&quot;My week: 12 moments, mostly peaceful mornings, one heavy Tuesday, ended with gratitude&quot;</p>
                            <p className="text-[9px] text-violet-500 italic">&quot;My first 30 days: started with 3 moods, now I use 8 — I&apos;m noticing more of what I feel&quot;</p>
                            <p className="text-[9px] text-violet-500 italic">&quot;My mornings changed: Week 1 was tired/heavy. Week 4 is calm/hopeful.&quot;</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Flower2 className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">My Evolution Profile</p>
                          <p className="text-[10px] text-violet-600">Opt-in public page showing your emotional growth journey. Not your specific moments. The arc.
                          Like a fitness tracker shows distance — this shows emotional range, growth in self-awareness, consistency of practice. Other people follow your evolution.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Heart className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-semibold text-violet-800">Practitioner Impact Stories</p>
                          <p className="text-[10px] text-violet-600">Practitioners can (with consent) showcase evolution arcs: &quot;After 8 sessions, here&apos;s how this member&apos;s emotional landscape changed.&quot;
                          Not &quot;I&apos;m a certified therapist&quot; — but &quot;look at the visible change in someone I worked with.&quot;</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How layers connect */}
              <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-gray-700 mb-2.5">How The Layers Connect</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="bg-emerald-100 text-emerald-700 rounded-lg px-3 py-2 text-center">
                    <Camera className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">Capture</p>
                    <p className="text-[8px]">daily micro-moments</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-blue-100 text-blue-700 rounded-lg px-3 py-2 text-center">
                    <BookOpen className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">Reflect</p>
                    <p className="text-[8px]">see patterns + growth</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-violet-100 text-violet-700 rounded-lg px-3 py-2 text-center">
                    <Globe className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">Share</p>
                    <p className="text-[8px]">your evolution story</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="bg-pink-100 text-pink-700 rounded-lg px-3 py-2 text-center">
                    <Users className="w-3.5 h-3.5 mx-auto mb-1" />
                    <p className="text-[9px] font-bold">Attract</p>
                    <p className="text-[8px]">people follow the journey</p>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 text-center mt-3">
                  Each layer feeds the next. The more you capture, the richer your reflection. The richer your reflection, the more compelling the story. The more you share, the more people join.
                </p>
              </div>
            </div>

            {/* Why Evolution > Perfection */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                Why This Changes Everything
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-amber-800 mb-1">The Motivation Shifts</p>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Phase 1 problem: &quot;Why should I open this today?&quot;
                      Evolution answer: You&apos;re not capturing for today. You&apos;re building a story that compounds. Every moment adds to an arc that gets more interesting over time.
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-emerald-800 mb-1">Bad Days Make It Better</p>
                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                      In a streak system, a bad day breaks your progress. In an evolution story, a bad day makes the story <em>richer</em>.
                      &quot;I had 3 heavy days and then something shifted&quot; is more powerful than any unbroken counter.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-violet-800 mb-1">Organic Distribution</p>
                    <p className="text-[10px] text-violet-700 leading-relaxed">
                      People sharing their emotional evolution on social media is free marketing. And it&apos;s the kind of content that resonates — vulnerability + growth.
                      One person&apos;s evolution card on Instagram is worth more than any ad.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-blue-800 mb-1">Network Effect</p>
                    <p className="text-[10px] text-blue-700 leading-relaxed">
                      When someone sees a friend&apos;s evolution card, they think: &quot;I want to see my own arc.&quot;
                      That&apos;s the acquisition loop. Not &quot;download this wellness app&quot; — but &quot;I want to know the shape of my emotional life.&quot;
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-gray-900 rounded-xl p-4">
                <p className="text-[10px] text-gray-300 leading-relaxed">
                  <span className="text-white font-semibold">For Investors:</span> The wellness app market is full of private journals that people abandon. Nobody abandons their story once other people are watching.
                  The evolution framing turns a solo habit into a social identity. &quot;I&apos;m someone who documents my emotional journey&quot; is an identity people <em>want</em> to have.
                  This is how Moments goes from a feature to a growth engine.
                </p>
              </div>
            </div>

            {/* What We Build — Phase 2 concrete plan */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                Phase 2 Build Tracks
              </h3>
              <div className="space-y-4">
                {[
                  {
                    num: '1',
                    title: 'Native App + Push Notifications',
                    color: 'emerald',
                    phase1Problem: 'Web-only, no home screen icon, no way to send notifications',
                    whatToBuild: [
                      'React Native or Expo wrapper for iOS + Android',
                      'Home screen icon with app badge',
                      'Morning prompt: "How are you starting your day?" (9am)',
                      'Evening recap: "Your day had 4 moments — replay?" (8pm)',
                      'Smart frequency — learn user patterns, don\'t over-notify',
                    ],
                    successMetric: 'D7 retention jumps from Phase 1 baseline to 40%+',
                    designChange: 'Same capture flow — lives in a native shell with notification permissions on first launch.',
                  },
                  {
                    num: '2',
                    title: 'Guided Onboarding + First Moment',
                    color: 'blue',
                    phase1Problem: '15-min verbal explanation, no in-app guidance, users saw an empty screen',
                    whatToBuild: [
                      '"Bloomsline helps you see the shape of your day — and over time, the shape of your growth"',
                      'Show the curve preview + example evolution card: "This is what 30 days looks like"',
                      'Guided first moment: walk through capture → mood → save',
                      'Show timeline with first dot: "You just started your story"',
                      'Prompt second moment: "Capture one more to see the curve connect"',
                    ],
                    successMetric: '80%+ users capture first moment during onboarding. 50%+ capture second.',
                    designChange: '4-5 screen onboarding. Ends with first moment on timeline and a glimpse of what the evolution view will look like.',
                  },
                  {
                    num: '3',
                    title: 'Reflection Layer',
                    color: 'amber',
                    phase1Problem: 'Today\'s Flow is beautiful but only shows today. No zoomed-out view, no pattern recognition, no reason to keep building.',
                    whatToBuild: [
                      'Evolution View: zoom out from today → 7 days → 30 days → 90 days. See the emotional arc, not just the day.',
                      'Weekly Reflection: "This week you felt most peaceful on mornings you walked"',
                      'Monthly Pattern Map: emotional landscape heatmap — visual proof that something is changing',
                      'Gentle milestones: "10 moments captured" → unlock first weekly reflection. Cumulative, never resets.',
                      'Bloom AI references your history: "Last Thursday you felt inspired — what was different?"',
                    ],
                    successMetric: 'Users who see their first weekly reflection retain 2x better. 40%+ users reach 10 moments in 14 days.',
                    designChange: 'New "My Evolution" tab. Weekly insight card on home. No counters that reset to zero — everything grows.',
                  },
                  {
                    num: '4',
                    title: 'Evolution Story (Shareable)',
                    color: 'violet',
                    phase1Problem: 'Moments exist in isolation — no one sees the journey except the user. No social proof, no organic growth loop.',
                    whatToBuild: [
                      'Auto-generated Journey Cards from evolution data — shareable to Instagram, WhatsApp, within Bloomsline',
                      'Individual moments stay private. The pattern and arc are what you share.',
                      'My Evolution Profile: opt-in public page showing emotional growth over time',
                      'Practitioner Impact Stories: "After 8 sessions, here\'s how this member\'s emotional landscape changed" (with consent)',
                      'Social discovery: follow someone\'s evolution, get inspired by their growth',
                    ],
                    successMetric: '15%+ users share at least one journey card in first 30 days. Each shared card drives 2+ app installs.',
                    designChange: 'Share button on weekly/monthly reflections. Public evolution profile page. Practitioner dashboard shows shareable impact arcs.',
                  },
                  {
                    num: '5',
                    title: 'Practitioner Connection + Stability',
                    color: 'gray',
                    phase1Problem: 'Practitioner has no visibility into member\'s emotional journey. App was buggy on mobile.',
                    whatToBuild: [
                      'Practitioner dashboard: member\'s weekly emotional curve + evolution arc',
                      'Session prep: "This week Alex felt overwhelmed Mon/Tue, peaceful Thu-Sun"',
                      'Member opt-in sharing: "Share this week with my practitioner?"',
                      'Crash reporting (Sentry), offline capture, image compression',
                      'Performance profiling on low-end devices',
                    ],
                    successMetric: 'Practitioners reference moments in 50%+ sessions. Crash rate < 1%.',
                    designChange: 'Practitioner sees evolution curve on member profile. Loading/error states on capture flow.',
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
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phase 1 Problem</p>
                          <p className="text-[10px] text-gray-600 mb-3">{track.phase1Problem}</p>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">What to Build</p>
                          <div className="space-y-1">
                            {track.whatToBuild.map((item, j) => (
                              <p key={j} className={`text-[10px] ${c.light}`}>• {item}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Success Metric</p>
                          <p className={`text-[10px] font-semibold ${c.text} mb-3`}>{track.successMetric}</p>
                          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Design Change</p>
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
                Phase 2: New User Journey
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
              <p className="text-[9px] text-gray-400 mt-3">Green = new in Phase 2. Gray = exists from Phase 1. The journey doesn&apos;t just redesign the first day — it creates a 30-day arc where value increases over time.</p>
            </div>

            {/* Phase 2 success criteria */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                Phase 2 Success Criteria
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { metric: 'D7 Retention', target: '> 40%', phase1: `${analytics?.retention.find(r => r.day === 7)?.pct || '—'}%`, color: 'text-emerald-600' },
                  { metric: 'D30 Retention', target: '> 20%', phase1: `${analytics?.retention.find(r => r.day === 30)?.pct || '—'}%`, color: 'text-blue-600' },
                  { metric: 'Evolution Card Shared', target: '> 15%', phase1: 'N/A', color: 'text-violet-600' },
                  { metric: 'Onboarding → 1st Moment', target: '> 80%', phase1: 'N/A', color: 'text-pink-600' },
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
              <h3 className="text-xs font-bold text-white mb-4">Build Timeline</h3>
              <div className="space-y-3">
                {[
                  { phase: 'Weeks 1-2', label: 'Foundation', items: ['Native app shell (Expo/React Native)', 'Push notification infrastructure', 'Bug fixes + crash reporting + offline support', 'Guided onboarding flow (4-5 screens)'], color: 'bg-emerald-400' },
                  { phase: 'Weeks 3-4', label: 'Triggers + First Moment', items: ['First moment during onboarding', 'Morning / evening notification schedule', 'Smart frequency — learn user patterns', 'Practitioner dashboard: weekly emotional curve'], color: 'bg-blue-400' },
                  { phase: 'Weeks 5-6', label: 'Reflection Layer', items: ['Evolution View (7d / 30d / 90d zoom out)', 'Weekly reflection generation from mood patterns', 'Monthly pattern map (emotional landscape heatmap)', 'Bloom AI moment memory integration'], color: 'bg-amber-400' },
                  { phase: 'Weeks 7-8', label: 'Evolution Story + Launch', items: ['Auto-generated shareable journey cards', 'My Evolution public profile (opt-in)', 'Practitioner impact stories', 'Phase 2 pilot launch (30-50 users)'], color: 'bg-violet-400' },
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
                  <span className="text-white font-semibold">Phase 2 pilot launch: Week 8</span> — 30-50 users, native app, full onboarding, notifications, reflection layer, and evolution sharing active.
                  Observe for 30 days. The key new metric: do users share their evolution? If yes, Moments is a growth engine, not just a feature.
                </p>
              </div>
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

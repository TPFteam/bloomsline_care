'use client'

import { useState } from 'react'
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

export default function MomentsProductDesignPage() {
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

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── Hero ────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
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
        <motion.section {...fadeUp(0.05)}>
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
        <motion.section {...fadeUp(0.1)}>
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
        <motion.section {...fadeUp(0.15)}>
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
        <motion.section {...fadeUp(0.2)}>
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
        <motion.section {...fadeUp(0.25)}>
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
        {/* ── COMPLETE TOUCHPOINT MAP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.3)}>
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

        {/* ── Key Stats ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
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
  )
}

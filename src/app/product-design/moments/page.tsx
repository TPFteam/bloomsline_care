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
  Gift,
  XCircle,
  CircleDot,
  Smile,
  Frown,
  Meh,
  Image,
  Play,
  Send,
  Plus,
  Search,
  Shield,
  Users,
  Bookmark,
  Calendar,
  Mail,
  Lock,
  Home,
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
// ── VISUAL FLOW DATA ────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

interface FlowScreen {
  id: string
  title: string
  status: 'built' | 'partial' | 'missing'
  dropoff: 'low' | 'medium' | 'high' | 'critical'
  emotion: string
  emotionIcon: 'smile' | 'meh' | 'frown'
  wireframe: { type: 'header' | 'button' | 'input' | 'text' | 'card' | 'icon-row' | 'divider' | 'image' | 'toggle'; label: string; highlight?: boolean; color?: string }[]
  userTaps: string
  timeOnScreen: string
}

const ONBOARDING_FLOW: FlowScreen[] = [
  {
    id: 'T1',
    title: 'Practitioner Invitation',
    status: 'built',
    dropoff: 'medium',
    emotion: 'Curious',
    emotionIcon: 'meh',
    wireframe: [
      { type: 'header', label: 'Email / SMS' },
      { type: 'text', label: 'Dr. Martin invited you to Bloomsline' },
      { type: 'text', label: '"Track moments between our sessions"' },
      { type: 'button', label: 'Open Bloomsline →', highlight: true, color: 'bg-blue-500 text-white' },
    ],
    userTaps: 'Taps "Open Bloomsline" link',
    timeOnScreen: '30-60s',
  },
  {
    id: 'T2',
    title: 'Sign Up',
    status: 'built',
    dropoff: 'high',
    emotion: 'Anxious',
    emotionIcon: 'frown',
    wireframe: [
      { type: 'header', label: 'Create Account' },
      { type: 'image', label: 'Bloomsline Logo' },
      { type: 'input', label: 'Email address' },
      { type: 'input', label: 'Password' },
      { type: 'button', label: 'Sign Up', highlight: true, color: 'bg-gray-900 text-white' },
      { type: 'text', label: 'Or continue with Google' },
    ],
    userTaps: 'Fills form → taps "Sign Up"',
    timeOnScreen: '1-3 min',
  },
  {
    id: 'T3',
    title: 'User Type Selection',
    status: 'built',
    dropoff: 'low',
    emotion: 'Confused',
    emotionIcon: 'frown',
    wireframe: [
      { type: 'header', label: 'Welcome, Lea! 👋' },
      { type: 'text', label: 'I am a...' },
      { type: 'card', label: '💚 Practitioner' },
      { type: 'card', label: '💜 Member', highlight: true, color: 'border-violet-400 bg-violet-50' },
      { type: 'button', label: 'Continue', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Selects "Member" → taps "Continue"',
    timeOnScreen: '10-15s',
  },
  {
    id: 'T4',
    title: 'Consent Modal',
    status: 'built',
    dropoff: 'medium',
    emotion: 'Impatient',
    emotionIcon: 'frown',
    wireframe: [
      { type: 'header', label: 'Data Privacy' },
      { type: 'text', label: 'We take your privacy seriously...' },
      { type: 'text', label: '[Legal text — 200+ words]' },
      { type: 'toggle', label: '☐ I accept the terms' },
      { type: 'button', label: 'Accept & Continue', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Checks box → taps "Accept"',
    timeOnScreen: '10-30s',
  },
  {
    id: 'T5',
    title: 'Member Home (Empty)',
    status: 'partial',
    dropoff: 'critical',
    emotion: 'Disappointed',
    emotionIcon: 'frown',
    wireframe: [
      { type: 'header', label: 'Home' },
      { type: 'card', label: '✅ Connected with Dr. Martin' },
      { type: 'text', label: '' },
      { type: 'text', label: '"Your full experience is on its way."' },
      { type: 'text', label: '"Check back soon for updates."' },
      { type: 'text', label: '' },
    ],
    userTaps: '❌ Nothing to tap — closes app',
    timeOnScreen: '10-20s → leaves',
  },
]

const MOMENTS_FLOW: FlowScreen[] = [
  {
    id: 'M1',
    title: 'Moments Entry Point',
    status: 'missing',
    dropoff: 'critical',
    emotion: 'Unaware',
    emotionIcon: 'frown',
    wireframe: [
      { type: 'header', label: 'Home' },
      { type: 'card', label: '"Capture a moment" prompt' },
      { type: 'text', label: 'or' },
      { type: 'icon-row', label: '🏠 Home    📸 Moments    🤖 Bloom    👤 Profile' },
      { type: 'button', label: '+ Capture', highlight: true, color: 'bg-violet-500 text-white' },
    ],
    userTaps: 'Taps "+" FAB or "Moments" tab',
    timeOnScreen: '2-5s',
  },
  {
    id: 'M2',
    title: 'Format Selection',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Engaged',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: 'Capture a Moment' },
      { type: 'text', label: 'How do you want to capture this?' },
      { type: 'icon-row', label: '📸 Photo' },
      { type: 'icon-row', label: '🎤 Voice' },
      { type: 'icon-row', label: '✍️ Write' },
      { type: 'icon-row', label: '🎥 Video' },
    ],
    userTaps: 'Selects a capture format',
    timeOnScreen: '2-5s',
  },
]

const CAPTURE_BRANCHES: FlowScreen[] = [
  {
    id: 'M3a',
    title: 'Capture — Photo',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Present',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'image', label: '[Camera Viewfinder]' },
      { type: 'text', label: '"What caught your eye today?"' },
      { type: 'icon-row', label: '🔄 Flip    ⚡ Flash    🖼️ Gallery' },
      { type: 'button', label: '◉ Capture', highlight: true, color: 'bg-white text-gray-900 border-2 border-gray-900' },
    ],
    userTaps: 'Points camera → taps shutter',
    timeOnScreen: '5-15s',
  },
  {
    id: 'M3b',
    title: 'Capture — Voice',
    status: 'missing',
    dropoff: 'medium',
    emotion: 'Vulnerable',
    emotionIcon: 'meh',
    wireframe: [
      { type: 'text', label: '"Say whatever comes to mind"' },
      { type: 'image', label: '〰️ [Waveform visualization] 〰️' },
      { type: 'text', label: '0:12 / 2:00' },
      { type: 'button', label: '⏹ Stop Recording', highlight: true, color: 'bg-red-500 text-white' },
      { type: 'icon-row', label: '▶️ Play back    🔄 Re-record' },
    ],
    userTaps: 'Taps record → speaks → stops',
    timeOnScreen: '15-60s',
  },
  {
    id: 'M3c',
    title: 'Capture — Write',
    status: 'missing',
    dropoff: 'medium',
    emotion: 'Reflective',
    emotionIcon: 'meh',
    wireframe: [
      { type: 'header', label: 'Write a moment' },
      { type: 'text', label: '"One thing I noticed today..."' },
      { type: 'input', label: '[Text area — 200 char soft limit]' },
      { type: 'text', label: '47 / 200' },
      { type: 'button', label: 'Next →', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Types 1-3 sentences → taps "Next"',
    timeOnScreen: '15-45s',
  },
]

const POST_CAPTURE_FLOW: FlowScreen[] = [
  {
    id: 'M4',
    title: 'Mood Tagging',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Self-aware',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: 'How does this feel?' },
      { type: 'image', label: '[Preview of captured content]' },
      { type: 'icon-row', label: 'grateful  peaceful  joyful  inspired' },
      { type: 'icon-row', label: 'loved  calm  hopeful  proud' },
      { type: 'text', label: '⚠️ No negative moods available' },
      { type: 'button', label: 'Save moment ✨', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Taps 1-3 moods → taps "Save"',
    timeOnScreen: '3-8s',
  },
  {
    id: 'M6',
    title: 'Save Confirmation',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Satisfied',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'image', label: '✨ [Moment card animation]' },
      { type: 'card', label: 'Your moment — grateful, peaceful', highlight: true, color: 'border-emerald-300 bg-emerald-50' },
      { type: 'text', label: '🤖 "Saved. I\'ll remember this."' },
      { type: 'text', label: '"3 moments this week"' },
      { type: 'button', label: 'View Timeline', highlight: false },
      { type: 'button', label: '+ Capture Another', highlight: false },
    ],
    userTaps: 'Views confirmation → goes to timeline or home',
    timeOnScreen: '3-5s',
  },
  {
    id: 'M7',
    title: 'Moments Timeline',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Moved',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: 'Your Moments' },
      { type: 'text', label: 'This week — 3 moments' },
      { type: 'card', label: '📸 Sunset walk — grateful, peaceful — 2h ago' },
      { type: 'card', label: '✍️ "Felt calm after session" — 1d ago' },
      { type: 'card', label: '🎤 Voice note — hopeful — 3d ago' },
      { type: 'button', label: '+ Capture', highlight: true, color: 'bg-violet-500 text-white' },
    ],
    userTaps: 'Scrolls moments → taps to expand → or captures new',
    timeOnScreen: '30-120s',
  },
]

const ENGAGEMENT_FLOW: FlowScreen[] = [
  {
    id: 'M9',
    title: 'Daily Notification',
    status: 'missing',
    dropoff: 'critical',
    emotion: 'Reminded',
    emotionIcon: 'meh',
    wireframe: [
      { type: 'header', label: '📱 Push Notification' },
      { type: 'text', label: '' },
      { type: 'card', label: '🌸 Bloomsline', highlight: true, color: 'border-violet-300 bg-violet-50' },
      { type: 'text', label: '"A moment to pause. How are you feeling?"' },
      { type: 'text', label: '' },
      { type: 'text', label: '→ Deep links to capture screen' },
    ],
    userTaps: 'Taps notification → opens capture',
    timeOnScreen: '2-3s',
  },
  {
    id: 'M8',
    title: 'Bloom AI Reflection',
    status: 'partial',
    dropoff: 'low',
    emotion: 'Surprised + valued',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: '🤖 Bloom' },
      { type: 'text', label: '"I noticed something about your week..."' },
      { type: 'card', label: '"You captured grateful moments 3 mornings in a row. What\'s been inspiring you?"' },
      { type: 'input', label: 'Type a reply...' },
      { type: 'button', label: 'Send', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Reads reflection → replies or dismisses',
    timeOnScreen: '30-90s',
  },
  {
    id: 'M10',
    title: 'Practitioner References',
    status: 'partial',
    dropoff: 'low',
    emotion: 'Validated',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: '🗣️ In Therapy Session' },
      { type: 'text', label: '' },
      { type: 'text', label: '"I saw you captured a moment about' },
      { type: 'text', label: 'feeling anxious at work..."' },
      { type: 'text', label: '' },
      { type: 'card', label: '→ Member realizes: it reached my therapist', highlight: true, color: 'border-emerald-300 bg-emerald-50' },
    ],
    userTaps: 'Discusses in session → returns to app motivated',
    timeOnScreen: 'During session',
  },
  {
    id: 'M11',
    title: 'Weekly Summary',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Proud',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: 'Your Week in Moments' },
      { type: 'text', label: '6 moments captured' },
      { type: 'icon-row', label: '😊 grateful ×3  🧘 peaceful ×2  ☀️ hopeful ×1' },
      { type: 'card', label: '🤖 "A week of peaceful mornings for you."' },
      { type: 'text', label: 'vs. last week: +2 moments' },
      { type: 'button', label: 'Set intention for next week', highlight: true, color: 'bg-gray-900 text-white' },
    ],
    userTaps: 'Views summary → sets intention',
    timeOnScreen: '30-60s',
  },
  {
    id: 'M12',
    title: 'Milestone Celebration',
    status: 'missing',
    dropoff: 'low',
    emotion: 'Accomplished',
    emotionIcon: 'smile',
    wireframe: [
      { type: 'header', label: '🎉 Milestone!' },
      { type: 'text', label: '' },
      { type: 'card', label: '"You\'ve captured 25 moments"', highlight: true, color: 'border-amber-300 bg-amber-50' },
      { type: 'text', label: 'Your first moment → vs → Today' },
      { type: 'text', label: '🤖 "Look how far you\'ve come."' },
      { type: 'text', label: '' },
    ],
    userTaps: 'Views celebration → feels accomplished',
    timeOnScreen: '15-30s',
  },
]

// ── Screen Node Component ───────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  built: 'bg-emerald-400',
  partial: 'bg-amber-400',
  missing: 'bg-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  built: 'Built',
  partial: 'Partial',
  missing: 'Missing',
}

const DROPOFF_BORDER: Record<string, string> = {
  low: 'border-gray-200',
  medium: 'border-amber-300',
  high: 'border-orange-400',
  critical: 'border-red-400 border-2',
}

const DROPOFF_BG: Record<string, string> = {
  low: '',
  medium: '',
  high: '',
  critical: 'bg-red-50/50',
}

function ScreenNode({ screen }: { screen: FlowScreen }) {
  return (
    <div className={`bg-white ${DROPOFF_BORDER[screen.dropoff]} ${DROPOFF_BG[screen.dropoff]} rounded-2xl shadow-sm w-full max-w-[240px] overflow-hidden`}>
      {/* Phone frame top bar */}
      <div className="bg-gray-900 px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono text-gray-400">{screen.id}</span>
          <span className="text-[9px] font-semibold text-white truncate">{screen.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[screen.status]}`} />
          <span className="text-[7px] text-gray-400">{STATUS_LABEL[screen.status]}</span>
        </div>
      </div>

      {/* Wireframe content */}
      <div className="px-3 py-2.5 space-y-1.5 min-h-[140px]">
        {screen.wireframe.map((el, i) => {
          switch (el.type) {
            case 'header':
              return <p key={i} className="text-[9px] font-bold text-gray-700 border-b border-gray-100 pb-1">{el.label}</p>
            case 'button':
              return (
                <div key={i} className={`text-[8px] font-semibold text-center py-1.5 rounded-lg ${
                  el.highlight ? (el.color || 'bg-gray-900 text-white') : 'bg-gray-100 text-gray-500'
                } ${el.highlight ? 'ring-2 ring-violet-300 ring-offset-1' : ''}`}>
                  {el.label}
                </div>
              )
            case 'input':
              return <div key={i} className="text-[8px] text-gray-400 border border-dashed border-gray-200 rounded px-2 py-1.5 bg-gray-50">{el.label}</div>
            case 'text':
              return <p key={i} className="text-[8px] text-gray-500 leading-relaxed">{el.label || '\u00A0'}</p>
            case 'card':
              return (
                <div key={i} className={`text-[8px] text-gray-600 border rounded-lg px-2 py-1.5 ${
                  el.highlight ? (el.color || 'border-gray-200 bg-gray-50') : 'border-gray-200 bg-gray-50'
                }`}>
                  {el.label}
                </div>
              )
            case 'icon-row':
              return <p key={i} className="text-[8px] text-gray-500 text-center bg-gray-50 rounded px-1 py-1">{el.label}</p>
            case 'image':
              return <div key={i} className="text-[8px] text-gray-400 text-center bg-gray-100 rounded-lg py-3 italic">{el.label}</div>
            case 'toggle':
              return <p key={i} className="text-[8px] text-gray-500">{el.label}</p>
            case 'divider':
              return <div key={i} className="border-t border-gray-100" />
            default:
              return null
          }
        })}
      </div>

      {/* Bottom: user action + metadata */}
      <div className="bg-gray-50 border-t border-gray-100 px-3 py-2">
        <p className="text-[8px] text-gray-700 font-medium mb-1">👆 {screen.userTaps}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {screen.emotionIcon === 'smile' ? <Smile className="w-3 h-3 text-emerald-400" /> :
             screen.emotionIcon === 'meh' ? <Meh className="w-3 h-3 text-gray-400" /> :
             <Frown className="w-3 h-3 text-amber-500" />}
            <span className="text-[7px] text-gray-500">{screen.emotion}</span>
          </div>
          <span className="text-[7px] text-gray-400">{screen.timeOnScreen}</span>
        </div>
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
// ── DETAILED TOUCHPOINT DATA (kept for deep-dive section) ───────────────
// ══════════════════════════════════════════════════════════════════════════

interface Touchpoint {
  id: string
  screen: string
  action: string
  description: string
  userSees: string[]
  userDoes: string[]
  motivation: { type: 'intrinsic' | 'extrinsic' | 'none'; label: string; strength: number }
  emotion: { value: number; label: string }
  friction: number
  timeSpent: string
  dropoffRisk: 'low' | 'medium' | 'high' | 'critical'
  currentState: 'built' | 'partial' | 'missing'
  painPoints: string[]
  recommendations: string[]
}

const ONBOARDING_TOUCHPOINTS: Touchpoint[] = [
  {
    id: 'T1', screen: 'Practitioner Invitation', action: 'Receives invitation from practitioner',
    description: 'The member\'s first contact with Bloomsline. They receive an email or SMS from their practitioner saying "I\'d like you to use this between our sessions." This is the highest-trust moment — the practitioner\'s recommendation carries enormous weight.',
    userSees: ['Email/SMS from practitioner (or verbal mention in session)', 'Link to download app or open web app', 'Brief description: "track moments between sessions"'],
    userDoes: ['Reads invitation', 'Decides whether to click the link', 'Downloads app or opens web link'],
    motivation: { type: 'extrinsic', label: 'Practitioner told me to', strength: 4 },
    emotion: { value: 0, label: 'Curious but passive' }, friction: 2, timeSpent: '30-60 seconds', dropoffRisk: 'medium', currentState: 'built',
    painPoints: ['Invitation email is generic — doesn\'t explain WHY this will help their specific situation', 'No preview of what the app looks like before downloading', 'Member may not check email/SMS immediately — 48-hour window matters', 'No urgency or emotional hook in the invitation copy'],
    recommendations: ['Let practitioners personalize the invitation: "I\'d love you to capture moments when you notice [specific thing we discussed]"', 'Add a 15-second video preview in the invitation showing the capture flow', 'Send a follow-up reminder after 24 hours if link not clicked', 'A/B test: practitioner photo in invitation vs. generic Bloomsline branding'],
  },
  {
    id: 'T2', screen: 'App First Open', action: 'Opens app for the first time',
    description: 'The member opens Bloomsline for the first time. This is the most fragile moment — they have zero context, zero investment, and are evaluating whether to give this 30 more seconds of attention.',
    userSees: ['Sign-up / sign-in screen', 'Bloomsline branding and visual design', 'Create account form (email, password, or social auth)'],
    userDoes: ['Creates account or signs in', 'Enters email and password', 'Verifies email (if required)'],
    motivation: { type: 'extrinsic', label: 'Following through on practitioner request', strength: 3 },
    emotion: { value: -1, label: 'Mildly anxious — "another app"' }, friction: 3, timeSpent: '1-3 minutes', dropoffRisk: 'high', currentState: 'built',
    painPoints: ['Sign-up friction — email verification adds another step', 'No immediate value shown before requiring account creation', 'Member doesn\'t know what they\'re signing up FOR yet', 'Password requirements feel clinical, not welcoming'],
    recommendations: ['Show a 3-screen onboarding carousel BEFORE sign-up: "Capture → Feel → Reflect"', 'Offer magic link login (no password) — reduces friction significantly', 'Show practitioner\'s name: "Dr. Martin invited you" — personalizes the experience', 'Delay email verification — let them explore first, verify later'],
  },
  {
    id: 'T3', screen: 'Onboarding — User Type Selection', action: 'Selects "Member" role',
    description: 'Current onboarding asks: "Are you a practitioner or member?" This is a dead-end question for members — they already know they\'re a member (their therapist sent them). It adds friction without value.',
    userSees: ['"Welcome, [Name]!" greeting', 'Two large cards: Practitioner vs. Member', 'Descriptions of each role', '"Continue" button'],
    userDoes: ['Reads the two options', 'Selects "Member"', 'Clicks continue'],
    motivation: { type: 'none', label: 'Obligatory — no value added', strength: 1 },
    emotion: { value: -1, label: 'Confused — "why are you asking?"' }, friction: 2, timeSpent: '10-15 seconds', dropoffRisk: 'low', currentState: 'built',
    painPoints: ['This step adds zero value for members — they were invited BY a practitioner', 'The role selection feels like a corporate form, not a personal welcome', 'Members may pause and wonder if they clicked the wrong link', 'No context about what happens next after selecting'],
    recommendations: ['Auto-detect member role from invitation link — skip this screen entirely', 'If must keep: replace with "You\'re joining [Practitioner Name]\'s care space"', 'Remove dual-role selection for invited members — they should never see "Practitioner" option', 'Use this screen for something valuable: "What brings you here?" (anxiety, stress, growth, etc.)'],
  },
  {
    id: 'T4', screen: 'Consent Modal', action: 'Accepts data privacy terms',
    description: 'Member must accept privacy terms before proceeding. Essential for GDPR compliance, but currently a friction wall. The consent content is legal, not human.',
    userSees: ['Modal overlay with privacy/consent text', 'Checkboxes or accept button', 'Legal language about data processing'],
    userDoes: ['Scrolls through consent text (or skips it)', 'Clicks "Accept"'],
    motivation: { type: 'none', label: 'Gate — must click to proceed', strength: 1 },
    emotion: { value: -1, label: 'Impatient — "just let me in"' }, friction: 3, timeSpent: '10-30 seconds', dropoffRisk: 'medium', currentState: 'built',
    painPoints: ['Legal language is intimidating for someone sharing mental health data', 'Feels like a barrier, not a safety feature', 'No visual reassurance about data security', 'Users don\'t read it — they just click accept'],
    recommendations: ['Rewrite in human language: "Your data stays yours. Your therapist sees what you share. Nobody else does."', 'Add visual trust badges: GDPR compliant, EU data residency, Delete anytime', 'Show a 3-bullet summary above the legal text: privacy, ownership, control', 'Move detailed legal to "Read full terms" expandable — keep default view simple'],
  },
  {
    id: 'T5', screen: 'Member Home (Empty State)', action: 'Lands on empty member dashboard',
    description: 'After onboarding, the member lands on the home screen. Currently this shows a practitioner connection status and a placeholder message. There is NO immediate action to take, NO introduction to Moments, and NO reason to stay.',
    userSees: ['"Connected with your practitioner" message (if connected)', '"Your full experience is on its way" placeholder text', 'Sidebar with Home and Library links', 'Empty, minimal interface'],
    userDoes: ['Looks around the empty dashboard', 'Wonders "what am I supposed to do now?"', 'Possibly closes the app'],
    motivation: { type: 'none', label: 'No clear next action', strength: 0 },
    emotion: { value: -2, label: 'Disappointed — "that\'s it?"' }, friction: 5, timeSpent: '10-20 seconds (then leaves)', dropoffRisk: 'critical', currentState: 'partial',
    painPoints: ['CRITICAL: Empty state gives zero reason to stay or return', 'No introduction to Moments — the core feature is invisible', '"Your full experience is on its way" signals the app isn\'t ready yet', 'No first-time guidance, tutorial, or suggested action', 'Member thinks: "I did what my therapist asked, now I wait" — and never comes back'],
    recommendations: ['REPLACE empty state with "Your First Moment" guided capture — start the experience immediately', 'Show Bloom AI greeting: "Hey [Name], welcome! Let\'s capture your first moment together."', 'Auto-prompt: "How are you feeling right now?" with one-tap mood selection', 'Show what the timeline WILL look like: ghost/skeleton moments with "Your journey starts here"', 'Add a "Your therapist said:" section with the personalized note from invitation'],
  },
]

const MOMENTS_TOUCHPOINTS: Touchpoint[] = [
  { id: 'M1', screen: 'Moments Entry Point', action: 'Discovers the Moments feature', description: 'The member encounters the Moments capture option for the first time. Currently there is no dedicated Moments section in the member app navigation — the feature exists in the backend but has no front door.', userSees: ['(Currently) Nothing — Moments has no entry point in the member app', '(Proposed) Prominent "+" capture button or "Capture a moment" card on home', '(Proposed) Bottom nav with Moments tab'], userDoes: ['(Currently) Cannot access Moments from the app', '(Proposed) Taps the capture button or Moments tab'], motivation: { type: 'none', label: 'Feature not discoverable', strength: 0 }, emotion: { value: -1, label: 'Unaware — doesn\'t know it exists' }, friction: 5, timeSpent: 'N/A — never reaches this', dropoffRisk: 'critical', currentState: 'missing', painPoints: ['CRITICAL: The core B2C feature has no front-end entry point', 'Backend, storage, and service layer are complete but inaccessible', 'Users who "used Moments" likely did so through a direct link or testing environment', 'The landing page showcases Moments beautifully — but the actual app doesn\'t have it'], recommendations: ['Add floating "+" capture button (FAB) on member home — always visible, one tap to capture', 'Add "Moments" as primary tab in bottom navigation (Home, Moments, Bloom, Profile)', 'First visit: animated tutorial showing "Tap + to capture your first moment"', 'Contextual triggers: "Leaving your session? Capture how you\'re feeling right now"'] },
  { id: 'M2', screen: 'Format Selection', action: 'Chooses capture format', description: 'Member selects how they want to capture this moment: Photo, Video, Voice Note, or Written Text. This is the "what kind of expression feels right?" moment.', userSees: ['4 format options: Photo, Video, Voice, Write', 'Each option with icon and short label', 'Possibly a suggested format based on context'], userDoes: ['Scans the 4 options', 'Selects the format that matches their current state', 'Taps to proceed'], motivation: { type: 'intrinsic', label: 'Choosing self-expression mode', strength: 3 }, emotion: { value: 1, label: 'Engaged — making a creative choice' }, friction: 1, timeSpent: '2-5 seconds', dropoffRisk: 'low', currentState: 'missing', painPoints: ['Four options may cause decision paralysis for first-time users', 'No guidance on which format works best for what situation', '"Write" feels less exciting than photo/voice — may be underused', 'Video requires more effort — may be avoided'], recommendations: ['Default to the most used format (Photo for most users) — pre-select it', 'For first moment: suggest "Write" with prompt "How are you feeling right now?" — lowest barrier', 'Show subtle hints: "Quick thought? → Write. Beautiful view? → Photo. Want to talk it out? → Voice"', 'Add "Mixed" option later — combine photo + voice caption for richer moments'] },
  { id: 'M4', screen: 'Mood Tagging', action: 'Selects mood tags for the moment', description: 'After capturing, the member tags the moment with moods. This is where emotional awareness happens — naming feelings is therapeutic. But currently, ALL 8 moods are positive.', userSees: ['8 mood buttons in a grid or horizontal scroll', 'Each mood as a pill/chip with label', 'Captured content preview above', 'Skip option (optional)'], userDoes: ['Scans mood options', 'Taps 1-3 that fit the moment', 'Selected moods highlight/animate', 'Taps "Done" or "Next"'], motivation: { type: 'intrinsic', label: 'Emotional labeling — self-awareness', strength: 3 }, emotion: { value: 1, label: 'Self-aware — naming what I feel' }, friction: 1, timeSpent: '3-8 seconds', dropoffRisk: 'low', currentState: 'missing', painPoints: ['PROBLEM: All 8 moods are positive — what about bad days?', 'Members can\'t tag a moment as "anxious", "sad", "frustrated"', 'This creates a "highlight reel" bias — only positive moments get captured', 'Users on bad days have no vocabulary → they don\'t capture → habit breaks'], recommendations: ['ADD negative/neutral moods: anxious, sad, frustrated, overwhelmed, tired, lonely, numb, confused', 'Organize moods by energy level, not valence', 'Allow custom mood entry: "Add your own word"', 'Show mood as a spectrum/wheel, not a list — less judgment on "negative" selections'] },
  { id: 'M6', screen: 'Moment Saved Confirmation', action: 'Sees confirmation that moment was saved', description: 'The moment is saved. This is the CRITICAL reward moment — the user just invested 10-30 seconds of emotional energy. What they see NOW determines whether they\'ll do this again tomorrow. Currently: nothing exists here.', userSees: ['(Current) Nothing — no save confirmation exists', '(Proposed) Beautiful card showing their moment in final form', '(Proposed) Celebration micro-animation', '(Proposed) Bloom AI acknowledgment'], userDoes: ['Views the confirmation', 'Feels satisfied (or not) about the experience', 'Decides subconsciously whether this was "worth it"'], motivation: { type: 'intrinsic', label: 'Completion satisfaction', strength: 2 }, emotion: { value: 1, label: 'Satisfied — "I captured something meaningful"' }, friction: 0, timeSpent: '3-5 seconds', dropoffRisk: 'low', currentState: 'missing', painPoints: ['CRITICAL: No reward signal after saving — the experience just... ends', 'No acknowledgment that this moment matters', 'No connection to the bigger picture (timeline, progress, practitioner)', 'No reason to come back tomorrow presented at this exact moment'], recommendations: ['Instant reward: beautiful card animation showing the moment in its "final form"', 'Bloom AI message: "Saved. I\'ll remember this for your next reflection."', 'Show streak count if applicable: "3 moments this week" (subtle, not pushy)', 'Occasional delight: after 5th, 10th, 20th moment → special animation'] },
  { id: 'M7', screen: 'Moments Timeline', action: 'Views their moment history', description: 'The member scrolls through their captured moments. This is where the "scroll back and see how far you\'ve come" philosophy lives.', userSees: ['Chronological timeline of captured moments', 'Each moment as a card: media thumbnail, mood tags, date, caption', 'Time markers: "Today", "Yesterday", "Last week"', 'Empty state if no moments yet'], userDoes: ['Scrolls through past moments', 'Taps a moment to expand/view details', 'Possibly creates a new moment from here'], motivation: { type: 'intrinsic', label: 'Nostalgia + progress awareness', strength: 4 }, emotion: { value: 2, label: 'Moved — seeing their journey' }, friction: 1, timeSpent: '30-120 seconds', dropoffRisk: 'low', currentState: 'missing', painPoints: ['Empty timeline (first days) is depressing, not inspiring', 'Timeline is only rewarding after 2-4 weeks — cold start problem', 'Linear chronological list may not surface patterns or highlights'], recommendations: ['Empty state: show "ghost moments" — placeholder cards', 'Add "This week" summary card at top', 'Color-code moments by mood — creates a visual emotional landscape', 'Monthly "memory" feature: resurface old moments'] },
  { id: 'M9', screen: 'Daily Return Trigger', action: 'Returns to app the next day', description: 'The member opens the app again. This is where the habit loop either forms or breaks. Without a clear trigger, return rate drops below 30% by Day 7.', userSees: ['(Current) Nothing — no return triggers exist', '(Proposed) Push notification with gentle prompt', '(Proposed) Home screen showing "today\'s prompt" or yesterday\'s moment'], userDoes: ['Opens app (from notification or self-initiated)', 'Sees something that invites capture', 'Creates another moment (or browses timeline)'], motivation: { type: 'extrinsic', label: 'Notification prompt', strength: 2 }, emotion: { value: 0, label: 'Habitual — "let me check in"' }, friction: 2, timeSpent: 'Variable', dropoffRisk: 'critical', currentState: 'missing', painPoints: ['CRITICAL: No trigger mechanism exists to bring users back', 'Without push notifications, return is entirely self-motivated', 'Self-motivation for between-session work is the exact problem therapy tries to solve'], recommendations: ['Daily gentle notification at user-chosen time: "A moment to pause. How are you feeling?"', 'Never notification-spam: max 1/day, skippable, tone-aware', 'Practitioner can trigger notifications: "Before our Thursday session, capture a moment about..."', 'Bloom AI morning greeting: "Good morning [Name]. Anything on your mind today?"'] },
]

// ── Drop-off styles ─────────────────────────────────────────────────────

const DROPOFF_STYLES: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
}

const STATE_STYLES: Record<string, string> = {
  built: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  missing: 'bg-red-50 text-red-700',
}

// ── Habit Loop & Priority data ──────────────────────────────────────────

const HABIT_LOOP = [
  { label: 'Trigger', strength: 1, current: 'No triggers exist. Return is entirely self-motivated.', gap: 'Without external triggers, habit formation depends on intrinsic motivation — the hardest to build.', fix: 'Daily gentle push notification + practitioner-triggered prompts + Bloom AI contextual nudges.' },
  { label: 'Action', strength: 3, current: 'Designed for 10-second capture. 4 formats. Mood tagging.', gap: 'The action is well-designed in theory — but the UI doesn\'t exist in the member app.', fix: 'One-tap capture from notification (deep link). Home screen FAB button. Reduce to 2 taps.' },
  { label: 'Variable Reward', strength: 0, current: 'Nothing. The moment is saved silently. No confirmation, no acknowledgment.', gap: 'THIS IS THE CORE PROBLEM. Capture takes effort but returns nothing immediate.', fix: 'Immediate: card animation + Bloom acknowledgment. Periodic: AI reflections. Milestone: celebrations.' },
  { label: 'Investment', strength: 2, current: 'Accumulated moments become a personal emotional archive.', gap: 'Users can\'t SEE this investment — the timeline doesn\'t exist in the member app.', fix: 'Make the growing timeline visible. Show "Your collection" count. Surface old moments as memories.' },
]

const PRIORITIES = [
  { rank: 1, action: 'Build Moments capture UI in member app', effort: 'High' as const, impact: 'Critical' as const, unblocks: 'Everything — no other improvement matters without this' },
  { rank: 2, action: 'Build Moments timeline view', effort: 'Medium' as const, impact: 'Critical' as const, unblocks: 'Progress visibility, nostalgia reward, AI pattern recognition' },
  { rank: 3, action: 'Add save confirmation + Bloom acknowledgment', effort: 'Low' as const, impact: 'Critical' as const, unblocks: 'Immediate reward loop — makes each capture feel "worth it"' },
  { rank: 4, action: 'Implement daily push notification', effort: 'Medium' as const, impact: 'Critical' as const, unblocks: 'Daily return trigger — the missing habit loop element' },
  { rank: 5, action: 'Add negative/neutral mood options', effort: 'Low' as const, impact: 'High' as const, unblocks: 'Full emotional range, better AI insights, honest data for practitioners' },
  { rank: 6, action: 'Build weekly summary card', effort: 'Medium' as const, impact: 'High' as const, unblocks: 'Periodic reward, progress visibility, re-engagement for lapsed users' },
  { rank: 7, action: 'Auto-generate pre-session summary for practitioners', effort: 'Medium' as const, impact: 'High' as const, unblocks: 'The most powerful motivation: practitioner validating that moments matter' },
  { rank: 8, action: 'Implement milestone celebrations', effort: 'Low' as const, impact: 'Medium' as const, unblocks: 'Long-term engagement, "what happens next?" curiosity' },
  { rank: 9, action: 'Redesign onboarding empty state', effort: 'Medium' as const, impact: 'High' as const, unblocks: 'Day 1 activation — members start capturing immediately' },
  { rank: 10, action: 'Connect Bloom AI reflections to moments', effort: 'High' as const, impact: 'High' as const, unblocks: 'The AI reward loop — captured moments become personalized insights' },
]

// ══════════════════════════════════════════════════════════════════════════
// ── PAGE ────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════

export default function MomentsProductDesignPage() {
  const [activeSection, setActiveSection] = useState<'onboarding' | 'moments'>('onboarding')
  const allTouchpoints = activeSection === 'onboarding' ? ONBOARDING_TOUCHPOINTS : MOMENTS_TOUCHPOINTS

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Fingerprint className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Product Design — Moments</h1>
            <p className="text-[10px] text-gray-400">User Flow Map & Interaction Analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── Hero ────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Every tap. Every screen. Every emotion.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            This is the complete user flow for the Moments feature — from the moment a practitioner sends an invitation
            to the weekly reflection that keeps members coming back. Each screen is mapped with its current build status,
            drop-off risk, and what the user sees, taps, and feels.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">17 screens mapped</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">4 critical drop-offs</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">10 missing screens</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">0 reward mechanisms</span>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-200">
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Status:</span>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[9px] text-gray-500">Built</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[9px] text-gray-500">Partial</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /><span className="text-[9px] text-gray-500">Missing</span></div>
            <span className="text-gray-200">|</span>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Border:</span>
            <span className="text-[9px] text-gray-500">Gray = low risk</span>
            <span className="text-[9px] text-amber-600">Amber = medium</span>
            <span className="text-[9px] text-orange-600">Orange = high</span>
            <span className="text-[9px] text-red-600 font-bold">Red thick = critical</span>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 1: ONBOARDING ─────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="From practitioner invitation to first app experience — 5 screens, 2 critical failures">Flow 1: Onboarding</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[1100px]">
              {ONBOARDING_FLOW.map((screen, i) => (
                <div key={screen.id} className="flex items-start">
                  <ScreenNode screen={screen} />
                  {i < ONBOARDING_FLOW.length - 1 && (
                    <FlowArrow
                      direction="right"
                      label={i === 0 ? 'Taps link' : i === 1 ? 'Submits form' : i === 2 ? 'Selects Member' : 'Accepts'}
                      critical={screen.dropoff === 'critical' || screen.dropoff === 'high'}
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Flow insight */}
            <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-red-700 mb-1">Flow breaks at T5</p>
              <p className="text-[10px] text-red-600">After 4 screens of setup, the member lands on an empty dashboard with the message &quot;Your full experience is on its way.&quot; There is no introduction to Moments, no guided first action, and no reason to stay. This is where 60-80% of members will leave and never return.</p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 2: MOMENT CAPTURE ─────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="From entry point to saved moment — format selection, capture, mood tagging, confirmation">Flow 2: Capturing a Moment</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            {/* Row 1: Entry → Format selection */}
            <div className="flex items-start gap-0 min-w-[550px] mb-4">
              <ScreenNode screen={MOMENTS_FLOW[0]} />
              <FlowArrow direction="right" label="Taps + button" critical />
              <ScreenNode screen={MOMENTS_FLOW[1]} />
            </div>

            {/* Branch label */}
            <div className="flex items-center gap-2 mb-3 ml-[270px]">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">User chooses format — branches into 3 paths</span>
            </div>

            {/* Row 2: Three capture branches */}
            <div className="flex items-start gap-4 min-w-[800px] mb-2 ml-4">
              {CAPTURE_BRANCHES.map((screen) => (
                <ScreenNode key={screen.id} screen={screen} />
              ))}
            </div>

            {/* Converge label */}
            <div className="flex items-center gap-2 mb-3 ml-[270px]">
              <ChevronDown className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">All paths converge</span>
            </div>

            {/* Row 3: Mood → Save → Timeline */}
            <div className="flex items-start gap-0 min-w-[800px]">
              {POST_CAPTURE_FLOW.map((screen, i) => (
                <div key={screen.id} className="flex items-start">
                  <ScreenNode screen={screen} />
                  {i < POST_CAPTURE_FLOW.length - 1 && (
                    <FlowArrow
                      direction="right"
                      label={i === 0 ? 'Taps Save' : 'Views timeline'}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Flow insight */}
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[9px] font-semibold text-amber-700 mb-1">Every screen in this flow is currently missing</p>
              <p className="text-[10px] text-amber-600">The entire capture flow — from entry point to saved confirmation — has no front-end implementation. The backend (database, storage, service layer) is complete. The wireframes above represent the proposed UI that needs to be built.</p>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── FLOW 3: ENGAGEMENT LOOP ────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle="The return loop — what brings users back tomorrow, next week, and next month">Flow 3: Engagement & Return</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-start gap-0 min-w-[1200px]">
              {ENGAGEMENT_FLOW.map((screen, i) => (
                <div key={screen.id} className="flex items-start">
                  <ScreenNode screen={screen} />
                  {i < ENGAGEMENT_FLOW.length - 1 && (
                    <FlowArrow
                      direction="right"
                      label={i === 0 ? 'Opens app' : i === 1 ? 'Next session' : i === 2 ? 'Sunday evening' : 'After N moments'}
                      critical={screen.dropoff === 'critical'}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Return loop arrow */}
            <div className="mt-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg p-3">
              <RefreshCw className="w-4 h-4 text-violet-500 shrink-0" />
              <div>
                <p className="text-[9px] font-semibold text-violet-700 mb-0.5">The Habit Loop</p>
                <p className="text-[10px] text-violet-600">Notification (M9) → Capture (Flow 2) → Save confirmation (M6) → Bloom reflection (M8) → Practitioner references in session (M10) → Renewed motivation → Next notification (M9). This loop must spin daily for the feature to work. Currently, none of these connections exist.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── HABIT LOOP ANALYSIS ────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle="Nir Eyal's Hook Model — where the loop breaks">Habit Loop Breakdown</SectionTitle>

          <div className="space-y-3">
            {HABIT_LOOP.map((el, i) => (
              <motion.div key={el.label} className="bg-white border border-gray-200 rounded-xl p-5" {...fadeUp(0.22 + i * 0.03)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${el.strength >= 3 ? 'bg-emerald-50 text-emerald-700' : el.strength >= 1 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{i + 1}</div>
                    <h4 className="text-xs font-bold text-gray-900">{el.label}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, j) => <div key={j} className={`w-2 h-2 rounded-full ${j < el.strength ? (el.strength >= 3 ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-gray-100'}`} />)}
                    <span className="text-[8px] text-gray-400 ml-1">{el.strength}/5</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3"><p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">Current</p><p className="text-[10px] text-gray-600">{el.current}</p></div>
                  <div className="bg-red-50 rounded-lg p-3"><p className="text-[9px] font-semibold text-red-600 uppercase mb-1">Gap</p><p className="text-[10px] text-red-600">{el.gap}</p></div>
                  <div className="bg-emerald-50 rounded-lg p-3"><p className="text-[9px] font-semibold text-emerald-600 uppercase mb-1">Fix</p><p className="text-[10px] text-emerald-600">{el.fix}</p></div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── DETAILED TOUCHPOINT DEEP-DIVE ──────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="Full analysis per screen — pain points, motivations, and recommendations">Touchpoint Deep-Dive</SectionTitle>

          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveSection('onboarding')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeSection === 'onboarding' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Onboarding (T1-T5)</button>
            <button onClick={() => setActiveSection('moments')} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeSection === 'moments' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Moments Flow (M1-M9)</button>
          </div>
        </motion.section>

        {allTouchpoints.map((tp, i) => (
          <motion.section key={tp.id} {...fadeUp(0.32 + i * 0.02)}>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">{tp.id}</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{tp.screen}</h4>
                    <p className="text-[9px] text-gray-500">{tp.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${STATE_STYLES[tp.currentState]}`}>{tp.currentState === 'built' ? 'Built' : tp.currentState === 'partial' ? 'Partial' : 'Missing'}</span>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${DROPOFF_STYLES[tp.dropoffRisk]}`}>{tp.dropoffRisk} drop-off</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{tp.description}</p>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                    {tp.emotion.value >= 1 ? <Smile className="w-3 h-3 text-emerald-500" /> : tp.emotion.value >= 0 ? <Meh className="w-3 h-3 text-gray-400" /> : <Frown className="w-3 h-3 text-amber-500" />}
                    <span className="text-[9px] text-gray-600">{tp.emotion.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full"><Clock className="w-3 h-3 text-gray-400" /><span className="text-[9px] text-gray-600">{tp.timeSpent}</span></div>
                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full"><Target className="w-3 h-3 text-gray-400" /><span className={`text-[9px] font-medium ${tp.motivation.type === 'intrinsic' ? 'text-emerald-600' : tp.motivation.type === 'extrinsic' ? 'text-blue-600' : 'text-red-600'}`}>{tp.motivation.type === 'none' ? 'No motivation' : tp.motivation.label}</span></div>
                  <div className="flex items-center gap-1"><span className="text-[8px] text-gray-400">Friction:</span>{Array.from({ length: 5 }).map((_, j) => <div key={j} className={`w-1.5 h-3 rounded-sm ${j < tp.friction ? 'bg-red-400' : 'bg-gray-100'}`} />)}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Eye className="w-3 h-3" /> User Sees</p>
                    <div className="space-y-1.5">{tp.userSees.map((s, j) => <div key={j} className="flex items-start gap-2"><CircleDot className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" /><p className="text-[10px] text-gray-600">{s}</p></div>)}</div>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Fingerprint className="w-3 h-3" /> User Does</p>
                    <div className="space-y-1.5">{tp.userDoes.map((d, j) => <div key={j} className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" /><p className="text-[10px] text-gray-600">{d}</p></div>)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Pain Points</p>
                    <div className="space-y-1.5">{tp.painPoints.map((p, j) => <p key={j} className="text-[10px] text-red-600 leading-relaxed">• {p}</p>)}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Recommendations</p>
                    <div className="space-y-1.5">{tp.recommendations.map((r, j) => <p key={j} className="text-[10px] text-emerald-600 leading-relaxed">• {r}</p>)}</div>
                  </div>
                </div>
              </div>
            </div>
            {i < allTouchpoints.length - 1 && <div className="flex justify-center py-2"><ArrowDown className="w-4 h-4 text-gray-300" /></div>}
          </motion.section>
        ))}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── PRIORITY BUILD ORDER ────────────────────────── */}
        {/* ══════════════════════════════════════════════════ */}
        <motion.section {...fadeUp(0.7)}>
          <SectionTitle subtitle="10 actions ranked by impact — what to build first">Priority Build Order</SectionTitle>
          <div className="space-y-2">
            {PRIORITIES.map((p, i) => (
              <motion.div key={p.rank} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4" {...fadeUp(0.72 + i * 0.02)}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${p.impact === 'Critical' ? 'bg-red-50 text-red-700' : p.impact === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'}`}>#{p.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-gray-900">{p.action}</p>
                  <p className="text-[9px] text-blue-600"><span className="font-semibold">Unblocks:</span> {p.unblocks}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[8px] font-bold ${p.effort === 'Low' ? 'text-emerald-600' : p.effort === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>{p.effort}</span>
                  <span className="text-[8px] text-gray-300">|</span>
                  <span className={`text-[8px] font-bold ${p.impact === 'Critical' ? 'text-red-600' : p.impact === 'High' ? 'text-amber-600' : 'text-gray-600'}`}>{p.impact}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Key Insight ─────────────────────────────────── */}
        <motion.section {...fadeUp(0.85)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">The Answer</h2>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider mb-2">Why users used Moments during testing</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">They used it because <span className="text-white font-semibold">you asked them to</span> and because <span className="text-white font-semibold">novelty was high</span>. Both decay to zero within 7-14 days.</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">Why users WILL use Moments long-term</p>
                <p className="text-[10px] text-gray-400 leading-relaxed">The habit forms when: (1) an <span className="text-white font-semibold">external trigger</span> reminds them, (2) the capture is <span className="text-white font-semibold">immediately rewarded</span>, and (3) the <span className="text-white font-semibold">practitioner references it in session</span>. All three are currently missing.</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-2">Build First: The Save Confirmation</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">The single most impactful change is making the user feel something positive the moment they tap &quot;Save.&quot; A beautiful card animation. A Bloom AI message. A subtle haptic pulse. This transforms every capture from &quot;I did a thing&quot; into &quot;I did something meaningful.&quot;</p>
            </div>
          </div>
        </motion.section>

        <motion.div {...fadeUp(0.9)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">Product Design — Moments — Feb 2026 — Bloomsline Care</p>
        </motion.div>
      </main>
    </div>
  )
}

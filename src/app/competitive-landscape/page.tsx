'use client'

import { motion } from 'framer-motion'
import {
  Target,
  CheckCircle2,
  XCircle,
  Minus,
  ArrowRight,
  Zap,
  Globe,
  Users,
  Brain,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface Competitor {
  name: string
  oneLiner: string
  pricing: string
  category: string
  features: {
    practitionerTools: boolean | 'partial'
    memberApp: boolean | 'partial'
    aiCompanion: boolean
    european: boolean | 'partial'
    b2b2c: boolean
  }
}

// ── Data ─────────────────────────────────────────────────────────────────

const COMPETITORS: Competitor[] = [
  {
    name: 'SimplePractice',
    oneLiner: 'US-focused EHR for solo mental health practitioners',
    pricing: '$49–149/mo',
    category: 'practice',
    features: { practitionerTools: true, memberApp: false, aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'TherapyNotes',
    oneLiner: 'Compliance-focused behavioral health EHR with billing',
    pricing: '$69–129/mo',
    category: 'practice',
    features: { practitionerTools: true, memberApp: false, aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Jane App',
    oneLiner: 'Canadian practice management for health & wellness clinics',
    pricing: '~€37/mo',
    category: 'practice',
    features: { practitionerTools: true, memberApp: 'partial', aiCompanion: false, european: 'partial', b2b2c: false },
  },
  {
    name: 'Doctolib',
    oneLiner: 'Dominant European healthcare booking & telehealth platform',
    pricing: '€129/mo',
    category: 'practice',
    features: { practitionerTools: 'partial', memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
  },
  {
    name: 'Headspace',
    oneLiner: 'Market-leading meditation & mindfulness content app',
    pricing: '$13/mo',
    category: 'wellness',
    features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: true, b2b2c: false },
  },
  {
    name: 'Calm',
    oneLiner: 'Premium meditation, sleep & relaxation content app',
    pricing: '$70/yr',
    category: 'wellness',
    features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: true, b2b2c: false },
  },
  {
    name: 'BetterHelp',
    oneLiner: 'Largest online therapy marketplace — text, phone & video',
    pricing: '$240–360/mo',
    category: 'wellness',
    features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Spring Health',
    oneLiner: 'Enterprise mental health platform with care matching',
    pricing: '$5–14 PEPM',
    category: 'enterprise',
    features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Lyra Health',
    oneLiner: 'Enterprise mental health benefit with outcomes-based pricing',
    pricing: '$25–50 PEPM',
    category: 'enterprise',
    features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Moka.care',
    oneLiner: 'French B2B mental wellbeing for companies',
    pricing: '€5–20 PEPM',
    category: 'enterprise',
    features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
  },
  {
    name: 'Woebot',
    oneLiner: 'CBT-based AI chatbot — consumer app shut down June 2025',
    pricing: 'B2B only',
    category: 'ai',
    features: { practitionerTools: false, memberApp: false, aiCompanion: true, european: false, b2b2c: false },
  },
  {
    name: 'Wysa',
    oneLiner: 'AI mental health chatbot with CBT/DBT exercises',
    pricing: '$75/yr',
    category: 'ai',
    features: { practitionerTools: false, memberApp: true, aiCompanion: true, european: false, b2b2c: false },
  },
]

const CATEGORIES = [
  { id: 'practice', label: 'Practice Management', color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { id: 'wellness', label: 'B2C Wellness & Therapy', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { id: 'enterprise', label: 'Enterprise B2B', color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { id: 'ai', label: 'AI Mental Health', color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
]

const DIFFERENTIATORS = [
  {
    icon: Users,
    title: 'B2B2C Model',
    subtitle: 'Practitioner as distribution',
    detail: '€50 to acquire 1 practitioner → 12 members for free. Effective member CAC: ~€4 vs €30-50 for B2C apps.',
  },
  {
    icon: Brain,
    title: 'AI in the Care Journey',
    subtitle: 'Not standalone — contextual',
    detail: 'Bloom knows the member\'s practitioner, milestones, and session history. Unlike generic chatbots, it\'s embedded in a real care relationship.',
  },
  {
    icon: Sparkles,
    title: 'Both Sides Connected',
    subtitle: 'Practitioner + member in one ecosystem',
    detail: 'No competitor connects both sides. SimplePractice has no member app. BetterHelp has no practitioner tools. We do both.',
  },
  {
    icon: Globe,
    title: 'European White Space',
    subtitle: 'No AI-native competitor in EU',
    detail: 'SimplePractice, BetterHelp, Spring Health — all US-only. Doctolib is booking, not care. We\'re GDPR-native with FR/EN/ES from day one.',
  },
  {
    icon: DollarSign,
    title: 'Price as a Weapon',
    subtitle: '€25/mo vs €50-129/mo competitors',
    detail: '2-5x cheaper than every practice management tool. 90%+ gross margin with AI cost-optimized on Claude Haiku.',
  },
]

const FEATURE_COLUMNS = [
  { key: 'practitionerTools' as const, label: 'Practitioner Tools' },
  { key: 'memberApp' as const, label: 'Member App' },
  { key: 'aiCompanion' as const, label: 'AI Companion' },
  { key: 'european' as const, label: 'European' },
  { key: 'b2b2c' as const, label: 'B2B2C' },
]

// ── Helpers ──────────────────────────────────────────────────────────────

function FeatureIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  if (value === 'partial') return <Minus className="w-3.5 h-3.5 text-amber-400" />
  return <XCircle className="w-3.5 h-3.5 text-gray-200" />
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Market Map (2x2 visual) ──────────────────────────────────────────────

function MarketMap() {
  // Position competitors on the 2x2 grid
  // X: 0 = practitioner-only, 100 = member-only
  // Y: 0 = admin/scheduling, 100 = AI-powered care
  const dots: Array<{ name: string; x: number; y: number; color: string; size?: string }> = [
    // Practice Management (left side, bottom)
    { name: 'SimplePractice', x: 12, y: 20, color: 'bg-blue-400' },
    { name: 'TherapyNotes', x: 8, y: 15, color: 'bg-blue-400' },
    { name: 'Jane App', x: 18, y: 25, color: 'bg-blue-400' },
    { name: 'Doctolib', x: 25, y: 12, color: 'bg-blue-400' },
    // B2C Wellness (right side, bottom-middle)
    { name: 'Headspace', x: 85, y: 30, color: 'bg-emerald-400' },
    { name: 'Calm', x: 90, y: 25, color: 'bg-emerald-400' },
    { name: 'BetterHelp', x: 78, y: 35, color: 'bg-emerald-400' },
    // Enterprise (middle, low)
    { name: 'Spring Health', x: 55, y: 28, color: 'bg-amber-400' },
    { name: 'Lyra Health', x: 48, y: 22, color: 'bg-amber-400' },
    { name: 'Moka.care', x: 52, y: 18, color: 'bg-amber-400' },
    // AI Mental Health (right, higher)
    { name: 'Wysa', x: 82, y: 60, color: 'bg-violet-400' },
    { name: 'Woebot', x: 72, y: 55, color: 'bg-violet-300' },
    // Bloomsline — top center (both sides + AI)
    { name: 'Bloomsline', x: 50, y: 85, color: 'bg-gray-900', size: 'large' },
  ]

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      {/* Grid background */}
      <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Quadrant labels */}
        <div className="absolute top-3 left-3 text-[9px] text-gray-300 font-medium">Admin-focused</div>
        <div className="absolute top-3 right-3 text-[9px] text-gray-300 font-medium">Admin-focused</div>
        <div className="absolute bottom-3 left-3 text-[9px] text-gray-300 font-medium">Practitioner-only</div>
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 font-medium">Member-only</div>

        {/* Axis lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" />

        {/* Axis labels */}
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2">
          <div className="flex items-center gap-12 text-[10px] text-gray-400">
            <span>Practitioner focus</span>
            <ArrowRight className="w-3 h-3" />
            <span>Member focus</span>
          </div>
        </div>
        <div className="absolute top-1/2 -left-0 -translate-x-full -translate-y-1/2 pr-2">
          <div className="flex flex-col items-center gap-8 text-[10px] text-gray-400">
            <span className="rotate-[-90deg] whitespace-nowrap">AI-powered care</span>
            <span className="rotate-[-90deg] whitespace-nowrap">Admin / scheduling</span>
          </div>
        </div>

        {/* The gap zone — highlighted */}
        <div className="absolute top-[5%] left-[30%] right-[30%] bottom-[55%] bg-indigo-50/50 border border-dashed border-indigo-200 rounded-lg flex items-center justify-center">
          <span className="text-[10px] font-semibold text-indigo-400">THE GAP</span>
        </div>

        {/* Competitor dots */}
        {dots.map((dot) => (
          <div
            key={dot.name}
            className="absolute group"
            style={{ left: `${dot.x}%`, bottom: `${dot.y}%`, transform: 'translate(-50%, 50%)' }}
          >
            <div className={`${dot.color} rounded-full ${dot.size === 'large' ? 'w-4 h-4 ring-4 ring-gray-900/10' : 'w-2.5 h-2.5'} transition-transform group-hover:scale-150`} />
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${dot.size === 'large' ? 'opacity-100' : ''}`}>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${dot.size === 'large' ? 'bg-gray-900 text-white text-[10px]' : 'bg-white text-gray-700 shadow-sm border border-gray-100'}`}>
                {dot.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── The Gap Visualization ────────────────────────────────────────────────

function GapVisualization() {
  return (
    <div className="flex items-center gap-3">
      {/* Left: Practice tools */}
      <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-blue-700 mb-1">Practice Tools</p>
        <p className="text-[10px] text-blue-500">SimplePractice, Jane, TherapyNotes, Doctolib</p>
        <p className="text-[10px] text-blue-400 mt-2">Run the business</p>
        <p className="text-[10px] text-red-400 font-medium">No member experience</p>
      </div>

      {/* Center: Bloomsline fills the gap */}
      <div className="flex flex-col items-center shrink-0">
        <ArrowRight className="w-4 h-4 text-gray-300 mb-1" />
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold">Bloomsline</p>
          <p className="text-[9px] text-gray-300">Both sides</p>
          <p className="text-[9px] text-gray-300">+ AI</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 mt-1 rotate-180" />
      </div>

      {/* Right: Wellness apps */}
      <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-emerald-700 mb-1">Wellness Apps</p>
        <p className="text-[10px] text-emerald-500">Headspace, Calm, BetterHelp, Wysa</p>
        <p className="text-[10px] text-emerald-400 mt-2">Help the individual</p>
        <p className="text-[10px] text-red-400 font-medium">No practitioner connection</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CompetitiveLandscapePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Competitive Landscape</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Market Positioning</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* ── Intro ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Where We Sit in the Market</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Mental health tech is split into silos — practice tools for practitioners, wellness apps for consumers, enterprise platforms for HR.
            Nobody connects both sides with AI. That&apos;s the gap we fill.
          </p>
        </motion.div>

        {/* ── The Gap — Simple Visual ──────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">The Gap</h3>
          <p className="text-[10px] text-gray-400 mb-5">Two worlds that don&apos;t talk to each other — Bloomsline bridges them</p>
          <GapVisualization />
        </motion.div>

        {/* ── Market Map (2x2) ─────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Market Map</h3>
          <p className="text-[10px] text-gray-400 mb-4">Hover over dots to see competitor names — Bloomsline sits alone in the AI-powered, dual-sided space</p>
          <MarketMap />
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <span className="text-[10px] text-gray-500">{cat.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-900 ring-2 ring-gray-900/10" />
              <span className="text-[10px] font-semibold text-gray-700">Bloomsline</span>
            </div>
          </div>
        </motion.div>

        {/* ── Competitor Grid by Category ──────────────────────────── */}
        {CATEGORIES.map((cat, ci) => {
          const competitors = COMPETITORS.filter((c) => c.category === cat.id)
          return (
            <motion.div key={cat.id} {...fadeUp} transition={{ delay: 0.15 + ci * 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {competitors.map((comp) => (
                  <div key={comp.name} className={`${cat.lightBg} border ${cat.borderColor} rounded-xl p-4`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${cat.textColor}`}>{comp.name}</span>
                      <span className="text-[10px] text-gray-400">{comp.pricing}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{comp.oneLiner}</p>
                    <div className="flex items-center gap-3">
                      {FEATURE_COLUMNS.map((col) => (
                        <div key={col.key} className="flex items-center gap-1">
                          <FeatureIcon value={comp.features[col.key]} />
                          <span className="text-[9px] text-gray-400">{col.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}

        {/* ── Feature Comparison Table ─────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Feature Comparison</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium w-36">Company</th>
                <th className="text-left py-2 px-2 text-gray-500 font-medium">Pricing</th>
                {FEATURE_COLUMNS.map((col) => (
                  <th key={col.key} className="text-center py-2 px-2 text-gray-500 font-medium">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Bloomsline first — highlighted */}
              <tr className="bg-gray-900 text-white rounded-lg">
                <td className="py-2.5 pr-4 font-bold rounded-l-lg pl-3">Bloomsline Care</td>
                <td className="py-2.5 px-2 font-semibold">€25/mo</td>
                {FEATURE_COLUMNS.map((col) => (
                  <td key={col.key} className="text-center py-2.5 px-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                  </td>
                ))}
              </tr>
              {COMPETITORS.map((comp) => (
                <tr key={comp.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-4 font-medium text-gray-800">{comp.name}</td>
                  <td className="py-2 px-2 text-gray-400">{comp.pricing}</td>
                  {FEATURE_COLUMNS.map((col) => (
                    <td key={col.key} className="text-center py-2 px-2">
                      <FeatureIcon value={comp.features[col.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Yes</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><Minus className="w-3 h-3 text-amber-400" /> Partial</span>
            <span className="flex items-center gap-1 text-[10px] text-gray-400"><XCircle className="w-3 h-3 text-gray-200" /> No</span>
          </div>
        </motion.div>

        {/* ── Key Differentiators ──────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Why Bloomsline Wins</h3>
          <div className="space-y-3">
            {DIFFERENTIATORS.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-gray-900">{d.title}</p>
                      <span className="text-[10px] text-gray-400">— {d.subtitle}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{d.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Woebot Validation ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">Market Validation: Woebot Shut Down Its Consumer App (June 2025)</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                The most clinically rigorous AI mental health app ($90M Series B, Stanford-backed) could not survive as a standalone B2C product.
                It pivoted to enterprise-only B2B. This validates our thesis: <span className="font-semibold">standalone AI mental health apps don&apos;t work.</span> The AI needs
                to be anchored to a real care relationship. Bloomsline&apos;s B2B2C model — AI embedded in the practitioner-member journey — is the sustainable path.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── European White Space ─────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-800 mb-1">The European Opportunity</p>
              <p className="text-xs text-indigo-700 leading-relaxed">
                SimplePractice, TherapyNotes, BetterHelp, Spring Health, Lyra Health — <span className="font-semibold">none operate in Europe.</span> Doctolib
                dominates booking but isn&apos;t a care platform. Moka.care and Unmind serve enterprises only. There is no AI-native, practitioner-focused
                mental health SaaS for the European market. Bloomsline is building in this white space — GDPR-native, French-first, with EN/FR/ES from day one.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Research as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import {
  Cpu,
  Shield,
  Globe,
  Zap,
  Database,
  Brain,
  Mail,
  BarChart3,
  Calendar,
  Smartphone,
  Lock,
  Languages,
  MonitorSmartphone,
  Server,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────

const STACK_LAYERS = [
  {
    title: 'Frontend',
    icon: MonitorSmartphone,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-600',
    items: [
      { name: 'Next.js 16', detail: 'App Router, SSR, API routes' },
      { name: 'React 19', detail: 'Latest with Server Components' },
      { name: 'TypeScript', detail: 'End-to-end type safety' },
      { name: 'Tailwind CSS', detail: 'Utility-first styling' },
      { name: 'Framer Motion', detail: 'Smooth animations' },
      { name: 'Recharts', detail: 'Data visualization' },
    ],
  },
  {
    title: 'Backend & Database',
    icon: Database,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-600',
    items: [
      { name: 'Supabase', detail: 'PostgreSQL + Auth + Real-time' },
      { name: 'Row Level Security', detail: 'Database-level access control' },
      { name: 'Next.js API Routes', detail: '20+ REST endpoints' },
      { name: 'Zod', detail: 'Runtime schema validation' },
      { name: 'Rate Limiting', detail: 'Custom per-route throttling' },
    ],
  },
  {
    title: 'AI Engine',
    icon: Brain,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-600',
    items: [
      { name: 'Claude (Anthropic)', detail: 'Bloom AI companion & assist' },
      { name: 'Haiku for scale', detail: 'Cost-optimized at ~€1.80/user/mo' },
      { name: 'Pattern analysis', detail: 'Auto-detect wellbeing trends' },
      { name: 'Session summarization', detail: 'AI-generated clinical notes' },
      { name: 'Practitioner copilot', detail: 'AI assistant for care tasks' },
    ],
  },
  {
    title: 'Integrations',
    icon: Layers,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-600',
    items: [
      { name: 'Google Calendar', detail: 'OAuth 2.0 session booking' },
      { name: 'Postmark', detail: 'Transactional email delivery' },
      { name: 'PostHog', detail: 'Product analytics (EU-hosted)' },
      { name: 'HubSpot', detail: 'CRM & feedback ticketing' },
      { name: 'Expo (React Native)', detail: 'Member mobile app' },
    ],
  },
]

const SECURITY_FEATURES = [
  { icon: Lock, label: 'AES-256-GCM encryption', detail: 'OAuth tokens encrypted at rest' },
  { icon: Shield, label: 'Row Level Security', detail: 'Postgres RLS on every table' },
  { icon: Zap, label: 'Rate limiting', detail: 'Per-route throttling (public, auth, AI)' },
  { icon: Globe, label: 'GDPR-ready', detail: 'EU-hosted analytics, data consent' },
]

const ARCHITECTURE_FLOW = [
  { label: 'Practitioner', sub: 'Web App (Next.js)', color: 'bg-blue-100 text-blue-700' },
  { label: 'Member', sub: 'Mobile App (Expo)', color: 'bg-emerald-100 text-emerald-700' },
  { label: 'API Layer', sub: 'Next.js Routes + Middleware', color: 'bg-gray-100 text-gray-700' },
  { label: 'Supabase', sub: 'PostgreSQL + Auth + RLS', color: 'bg-violet-100 text-violet-700' },
  { label: 'AI Engine', sub: 'Claude API (Bloom)', color: 'bg-amber-100 text-amber-700' },
]

const KEY_NUMBERS = [
  { value: '20+', label: 'API endpoints', icon: Server },
  { value: '3', label: 'Languages (EN/FR/ES)', icon: Languages },
  { value: '90%+', label: 'Gross margin (AI cost-optimized)', icon: BarChart3 },
  { value: '2', label: 'Platforms (Web + Mobile)', icon: Smartphone },
]

const AI_FEATURES = [
  { name: 'Bloom Chat', description: 'Conversational AI companion for member self-reflection and wellbeing tracking' },
  { name: 'Bloom Assist', description: 'Quick-action AI for practitioners — summarize sessions, extract themes, suggest focus areas' },
  { name: 'Pattern Detection', description: 'Automatically identifies wellbeing trends across mood, sleep, and activity data' },
  { name: 'Smart Notifications', description: 'AI-informed alerts when member engagement drops or milestones are reached' },
]

const API_DOMAINS = [
  { domain: 'Auth & Users', endpoints: 'Setup member, create profile, update language', count: 3 },
  { domain: 'Bloom AI', endpoints: 'Chat, greeting, patterns, assist, extract, summarize', count: 7 },
  { domain: 'Calendar & Booking', endpoints: 'Google OAuth, events, create/update bookings, sync', count: 6 },
  { domain: 'Notifications', endpoints: 'Fetch, send, mark read, preferences', count: 5 },
  { domain: 'Resources', endpoints: 'Create, check access, share', count: 3 },
]

// ── Animation helpers ────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function TechOverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Technical Overview</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Architecture & Stack</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* ── Intro ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">How Bloomsline Care is Built</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            A modern, AI-native healthcare platform with two interfaces — a web app for practitioners and a mobile app for members.
            Built on production-grade infrastructure with security, i18n, and scalability from day one.
          </p>
        </motion.div>

        {/* ── Architecture Flow ───────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">System Architecture</h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ARCHITECTURE_FLOW.map((node, i) => (
              <div key={node.label} className="flex items-center gap-2">
                <div className={`${node.color} rounded-xl px-4 py-3 text-center min-w-[120px]`}>
                  <p className="text-xs font-semibold">{node.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{node.sub}</p>
                </div>
                {i < ARCHITECTURE_FLOW.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Key Numbers ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KEY_NUMBERS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <Icon className="w-4 h-4 text-gray-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{item.label}</p>
              </div>
            )
          })}
        </motion.div>

        {/* ── Stack Layers ────────────────────────────────────────── */}
        <div>
          <motion.h3 {...fadeUp} transition={{ delay: 0.15 }} className="text-sm font-semibold text-gray-900 mb-4">
            Technology Stack
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STACK_LAYERS.map((layer, i) => {
              const Icon = layer.icon
              return (
                <motion.div
                  key={layer.title}
                  {...fadeUp}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${layer.lightColor} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">{layer.title}</h4>
                  </div>
                  <div className="space-y-2.5">
                    {layer.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${layer.color} mt-1.5 shrink-0`} />
                        <div>
                          <span className="text-xs font-medium text-gray-800">{item.name}</span>
                          <span className="text-xs text-gray-400 ml-1.5">— {item.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── AI Deep Dive ────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">AI-Native Features</h3>
            <span className="text-[10px] text-gray-400 ml-1">Powered by Anthropic Claude</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AI_FEATURES.map((feature) => (
              <div key={feature.name} className="bg-gradient-to-br from-violet-50/50 to-white border border-violet-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-900 mb-1">{feature.name}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-violet-50 border border-violet-100 rounded-lg px-4 py-2.5 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-xs text-violet-700">
              <span className="font-medium">Cost optimization:</span> Bloom uses Claude Haiku for conversations (~€1.80/practitioner/mo), keeping AI costs under 10% of revenue at €25/mo pricing.
            </p>
          </div>
        </motion.div>

        {/* ── API Surface ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">API Surface</h3>
            <span className="text-[10px] text-gray-400 ml-1">24+ endpoints across 5 domains</span>
          </div>
          <div className="space-y-2">
            {API_DOMAINS.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-800 w-32 shrink-0">{d.domain}</span>
                <span className="text-xs text-gray-400 flex-1">{d.endpoints}</span>
                <span className="text-[10px] font-medium text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security ────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">Security & Compliance</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SECURITY_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{feature.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{feature.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Multi-Platform ──────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">Multi-Platform Architecture</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
              <p className="text-xs font-semibold text-blue-700 mb-2">Practitioner — Web App</p>
              <div className="space-y-1.5">
                {['Dashboard & member management', 'Session scheduling via Google Calendar', 'AI-assisted clinical notes', 'Resource library & sharing', 'Analytics & progress tracking'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-blue-400 shrink-0" />
                    <span className="text-[11px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/30">
              <p className="text-xs font-semibold text-emerald-700 mb-2">Member — Mobile App (Expo)</p>
              <div className="space-y-1.5">
                {['Bloom AI companion for self-reflection', 'Mood tracking & daily rituals', 'Moment capture (photo, voice, text)', 'Session booking & reminders', 'Milestone progress & celebrations'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── i18n ────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Languages className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Internationalization</h3>
          </div>
          <div className="flex items-center gap-3">
            {[
              { flag: '🇬🇧', lang: 'English', code: 'en' },
              { flag: '🇫🇷', lang: 'French', code: 'fr' },
              { flag: '🇪🇸', lang: 'Spanish', code: 'es' },
            ].map((l) => (
              <div key={l.code} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm">{l.flag}</span>
                <span className="text-xs font-medium text-gray-700">{l.lang}</span>
                <span className="text-[10px] text-gray-400">{l.code}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Full UI + AI prompts + system messages translated across all supported languages.</p>
        </motion.div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Built by the Bloomsline team — shipping fast, scaling smart.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

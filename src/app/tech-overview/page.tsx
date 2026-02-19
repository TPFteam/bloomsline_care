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
  ArrowDown,
  CheckCircle2,
  Monitor,
  Users,
  MessageSquare,
  Bell,
  Activity,
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
      { name: 'Tailwind CSS 4', detail: 'Utility-first styling' },
      { name: 'Framer Motion', detail: 'Smooth animations & transitions' },
      { name: 'Recharts 3.6', detail: 'Interactive data visualizations' },
      { name: 'Radix UI', detail: 'Accessible headless components' },
      { name: 'React Hook Form + Zod', detail: 'Form handling & validation' },
    ],
  },
  {
    title: 'Backend & Database',
    icon: Database,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-600',
    items: [
      { name: 'Supabase PostgreSQL', detail: 'Primary database with real-time subscriptions' },
      { name: 'Supabase Auth', detail: 'Google OAuth + magic links + session management' },
      { name: 'Row Level Security', detail: 'Database-level access control per user' },
      { name: 'Next.js API Routes', detail: '24+ REST endpoints with middleware' },
      { name: 'Zustand + TanStack Query', detail: 'Client state & server cache management' },
      { name: 'Rate Limiting', detail: 'Custom per-route throttling (public, auth, AI)' },
    ],
  },
  {
    title: 'AI Engine',
    icon: Brain,
    color: 'bg-violet-500',
    lightColor: 'bg-violet-50 text-violet-600',
    items: [
      { name: 'Anthropic Claude API', detail: 'Primary LLM for all AI features' },
      { name: 'Claude Haiku', detail: 'Cost-optimized conversations (~€1.80/user/mo)' },
      { name: 'Claude Sonnet', detail: 'Complex tasks — summaries, pattern analysis' },
      { name: 'Bloom Chat', detail: 'AI companion for member self-reflection' },
      { name: 'Bloom Assist', detail: 'Practitioner copilot for clinical notes' },
    ],
  },
  {
    title: 'External Services',
    icon: Layers,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-600',
    items: [
      { name: 'Google Calendar API', detail: 'OAuth 2.0 — session booking & sync' },
      { name: 'Postmark', detail: 'Transactional emails (hi@bloomsline.com)' },
      { name: 'PostHog', detail: 'Product analytics & session recording (EU-hosted)' },
      { name: 'HubSpot', detail: 'CRM, feedback tickets & file uploads' },
      { name: 'Google OAuth', detail: 'Social login for practitioners' },
      { name: 'Expo (React Native)', detail: 'Cross-platform member mobile app' },
    ],
  },
]

const SECURITY_FEATURES = [
  { icon: Lock, label: 'AES-256-GCM encryption', detail: 'OAuth tokens & sensitive data encrypted at rest' },
  { icon: Shield, label: 'Row Level Security', detail: 'Postgres RLS on every table — data isolation per user' },
  { icon: Zap, label: 'Rate limiting', detail: 'Per-route throttling — public, auth, AI, summary tiers' },
  { icon: Globe, label: 'GDPR-ready', detail: 'EU-hosted analytics (PostHog EU), cookie consent, data control' },
]

const KEY_NUMBERS = [
  { value: '24+', label: 'API endpoints', icon: Server },
  { value: '3', label: 'Languages (EN/FR/ES)', icon: Languages },
  { value: '6', label: 'External services integrated', icon: Layers },
  { value: '2', label: 'Platforms (Web + Mobile)', icon: Smartphone },
]

const AI_FEATURES = [
  { name: 'Bloom Chat', description: 'Conversational AI companion for member self-reflection and wellbeing tracking' },
  { name: 'Bloom Assist', description: 'Quick-action AI for practitioners — summarize sessions, extract themes, suggest focus areas' },
  { name: 'Pattern Detection', description: 'Automatically identifies wellbeing trends across mood, sleep, and activity data' },
  { name: 'Smart Notifications', description: 'AI-informed alerts when member engagement drops or milestones are reached' },
]

const API_DOMAINS = [
  { domain: 'Auth & Users', endpoints: 'Setup member, create profile, update language, Google OAuth', count: 4 },
  { domain: 'Bloom AI', endpoints: 'Chat, greeting, patterns, assist, extract, summarize, practitioner chat', count: 7 },
  { domain: 'Calendar & Booking', endpoints: 'Google OAuth flow, calendar events, create/update bookings, sync', count: 6 },
  { domain: 'Notifications', endpoints: 'Fetch, send, mark read, mark all read, preferences', count: 5 },
  { domain: 'Resources & Content', endpoints: 'Create resource, check access, early access, feedback → HubSpot', count: 4 },
]

const EXTERNAL_SERVICES = [
  {
    name: 'Supabase',
    purpose: 'Database, Auth & Real-time',
    detail: 'PostgreSQL with Row Level Security, Google OAuth, magic links, real-time subscriptions',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    name: 'Anthropic Claude',
    purpose: 'AI / LLM Engine',
    detail: 'Haiku for cost-efficient chat, Sonnet for complex analysis. Powers Bloom companion + practitioner assist',
    color: 'bg-violet-500',
    lightBg: 'bg-violet-50',
    textColor: 'text-violet-700',
  },
  {
    name: 'Google Calendar',
    purpose: 'Session Scheduling',
    detail: 'OAuth 2.0 with offline refresh tokens, calendar sync, availability management, booking creation',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    name: 'Postmark',
    purpose: 'Email Delivery',
    detail: 'Transactional emails from hi@bloomsline.com — notifications, invitations, session reminders',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  {
    name: 'PostHog',
    purpose: 'Product Analytics',
    detail: 'EU-hosted (GDPR compliant), autocapture events, session recordings, user identification, cookie consent',
    color: 'bg-blue-600',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    name: 'HubSpot',
    purpose: 'CRM & Feedback',
    detail: 'API v3 — ticket creation from user feedback, file uploads for attachments, bug/feature/question categories',
    color: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
]

// ── Animation helpers ────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Visual Architecture Diagram ──────────────────────────────────────────

function ArchitectureDiagram() {
  return (
    <div className="relative py-4">
      {/* Row 1: Clients */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 text-center w-48">
          <Monitor className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-blue-700">Practitioner Web</p>
          <p className="text-[10px] text-blue-500">Next.js 16 + React 19</p>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-5 py-3 text-center w-48">
          <Smartphone className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-emerald-700">Member Mobile</p>
          <p className="text-[10px] text-emerald-500">Expo (React Native)</p>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center gap-6 mb-3">
        <div className="w-48 flex justify-center">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
        <div className="w-48 flex justify-center">
          <ArrowDown className="w-4 h-4 text-gray-300" />
        </div>
      </div>

      {/* Row 2: API Layer */}
      <div className="flex justify-center mb-3">
        <div className="bg-gray-100 border-2 border-gray-300 rounded-xl px-8 py-3 text-center w-[420px]">
          <Server className="w-5 h-5 text-gray-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-gray-700">API Layer</p>
          <p className="text-[10px] text-gray-500">Next.js Routes + Middleware + Rate Limiting + Auth</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {['Auth', 'Bloom AI', 'Calendar', 'Notify', 'Resources'].map((d) => (
              <span key={d} className="text-[9px] bg-white text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center mb-3">
        <ArrowDown className="w-4 h-4 text-gray-300" />
      </div>

      {/* Row 3: Core Services */}
      <div className="flex justify-center gap-4 mb-3">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 text-center w-52">
          <Database className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-emerald-700">Supabase</p>
          <p className="text-[10px] text-emerald-500">PostgreSQL + Auth + RLS</p>
          <p className="text-[10px] text-emerald-400">Real-time subscriptions</p>
        </div>
        <div className="bg-violet-50 border-2 border-violet-200 rounded-xl px-4 py-3 text-center w-52">
          <Brain className="w-5 h-5 text-violet-600 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-violet-700">Claude AI</p>
          <p className="text-[10px] text-violet-500">Haiku (chat) + Sonnet (analysis)</p>
          <p className="text-[10px] text-violet-400">Bloom companion & assist</p>
        </div>
      </div>

      {/* Arrows down */}
      <div className="flex justify-center mb-3">
        <ArrowDown className="w-4 h-4 text-gray-300" />
      </div>

      {/* Row 4: External Services */}
      <div className="flex justify-center">
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 w-full max-w-xl">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">External Services</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">Google</p>
              <p className="text-[9px] text-gray-400">Calendar + OAuth</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">Postmark</p>
              <p className="text-[9px] text-gray-400">Email delivery</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">PostHog</p>
              <p className="text-[9px] text-gray-400">Analytics (EU)</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-[10px] font-semibold text-gray-700">HubSpot</p>
              <p className="text-[9px] text-gray-400">CRM & tickets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Data Flow Diagram ────────────────────────────────────────────────────

function DataFlowDiagram() {
  const flows = [
    {
      label: 'Member opens app',
      steps: ['Expo App', 'API /bloom/chat', 'Claude Haiku', 'Response streamed back'],
      color: 'emerald',
    },
    {
      label: 'Practitioner books session',
      steps: ['Web App', 'API /bookings', 'Supabase', 'Google Calendar sync', 'Postmark email to member'],
      color: 'blue',
    },
    {
      label: 'User submits feedback',
      steps: ['Web App', 'API /feedback', 'HubSpot ticket created', 'File attachments uploaded'],
      color: 'amber',
    },
  ]

  const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
  }

  return (
    <div className="space-y-3">
      {flows.map((flow) => {
        const c = colorMap[flow.color]
        return (
          <div key={flow.label} className={`${c.bg} border ${c.border} rounded-xl px-4 py-3`}>
            <p className={`text-[10px] font-semibold ${c.text} mb-2`}>{flow.label}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {flow.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-100">{step}</span>
                  {i < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
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

        {/* ── Visual Architecture Diagram ──────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">System Architecture</h3>
          <p className="text-[10px] text-gray-400 mb-4">How everything connects — from clients to external services</p>
          <ArchitectureDiagram />
        </motion.div>

        {/* ── Data Flow Examples ───────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">How Data Flows</h3>
          <p className="text-[10px] text-gray-400 mb-3">Real request paths through the system</p>
          <DataFlowDiagram />
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

        {/* ── External Services Detail ─────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">External Services</h3>
            <span className="text-[10px] text-gray-400 ml-1">6 integrations powering the platform</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXTERNAL_SERVICES.map((svc) => (
              <div key={svc.name} className={`${svc.lightBg} border border-gray-100 rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${svc.color}`} />
                  <span className={`text-xs font-bold ${svc.textColor}`}>{svc.name}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{svc.purpose}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{svc.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── AI Deep Dive ────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
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
              <span className="font-medium">Cost optimization:</span> Bloom uses Claude Haiku for conversations (~€1.80/practitioner/mo), keeping AI costs under 10% of revenue at €25/mo pricing. Sonnet reserved for complex analysis (summaries, pattern detection).
            </p>
          </div>
        </motion.div>

        {/* ── API Surface ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">API Surface</h3>
            <span className="text-[10px] text-gray-400 ml-1">24+ endpoints across 5 domains</span>
          </div>
          <div className="space-y-2">
            {API_DOMAINS.map((d) => (
              <div key={d.domain} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-800 w-36 shrink-0">{d.domain}</span>
                <span className="text-xs text-gray-400 flex-1">{d.endpoints}</span>
                <span className="text-[10px] font-medium text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full shrink-0">{d.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Security ────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
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
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">Multi-Platform Architecture</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30">
              <p className="text-xs font-semibold text-blue-700 mb-2">Practitioner — Web App</p>
              <div className="space-y-1.5">
                {['Dashboard & member management', 'Session scheduling via Google Calendar', 'AI-assisted clinical notes (Bloom Assist)', 'Resource library & sharing', 'Analytics & progress tracking', 'Feedback system → HubSpot'].map((item) => (
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
                {['Bloom AI companion for self-reflection', 'Mood tracking & daily rituals', 'Moment capture (photo, voice, text)', 'Session booking & email reminders (Postmark)', 'Milestone progress & celebrations', 'Push notifications'].map((item) => (
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
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="bg-white border border-gray-200 rounded-xl p-5">
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
        <motion.div {...fadeUp} transition={{ delay: 0.65 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Built by the Bloomsline team — shipping fast, scaling smart.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

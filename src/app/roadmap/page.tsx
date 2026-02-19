'use client'

import { motion } from 'framer-motion'
import {
  Map,
  CheckCircle2,
  Circle,
  ArrowRight,
  Monitor,
  Smartphone,
  Globe,
  Brain,
  Users,
  Building2,
  Megaphone,
  PenTool,
  GraduationCap,
  Handshake,
  Rocket,
  TrendingUp,
  Zap,
  Shield,
  Languages,
  Search,
  Video,
  Calendar,
  Star,
  Heart,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────

interface RoadmapItem {
  label: string
  done?: boolean
}

interface Track {
  id: string
  title: string
  icon: typeof Monitor
  color: string
  lightBg: string
  textColor: string
  dotColor: string
}

interface Phase {
  id: string
  period: string
  title: string
  subtitle: string
  status: 'done' | 'current' | 'upcoming'
  items: Record<string, RoadmapItem[]>
}

// ── Data ─────────────────────────────────────────────────────────────────

const TRACKS: Track[] = [
  { id: 'product', title: 'Product & AI', icon: Brain, color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-700', dotColor: 'bg-violet-400' },
  { id: 'b2b', title: 'B2B — Practitioners', icon: Monitor, color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700', dotColor: 'bg-blue-400' },
  { id: 'b2c', title: 'B2C — Members', icon: Smartphone, color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', dotColor: 'bg-emerald-400' },
  { id: 'digital', title: 'Digital Presence', icon: Globe, color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700', dotColor: 'bg-amber-400' },
  { id: 'business', title: 'Business & Team', icon: Building2, color: 'bg-rose-500', lightBg: 'bg-rose-50', textColor: 'text-rose-700', dotColor: 'bg-rose-400' },
]

const PHASES: Phase[] = [
  {
    id: 'done',
    period: 'Q3 2025 – Q1 2026',
    title: 'Foundation',
    subtitle: 'MVP built, beta testing, validation',
    status: 'done',
    items: {
      product: [
        { label: 'Bloom AI companion (Claude-powered)', done: true },
        { label: 'Bloom Assist — AI clinical note tools', done: true },
        { label: 'Pattern detection & wellbeing trends', done: true },
        { label: 'i18n framework (EN/FR, ES ready)', done: true },
        { label: 'Rate limiting & security layer', done: true },
      ],
      b2b: [
        { label: 'Practitioner dashboard & member management', done: true },
        { label: 'Session scheduling & Google Calendar sync', done: true },
        { label: 'Progress notes & milestone tracking', done: true },
        { label: 'Resource library — create & share worksheets', done: true },
        { label: 'Analytics page (Your Flow)', done: true },
      ],
      b2c: [
        { label: 'Expo mobile app — full member experience', done: true },
        { label: 'Moment capture (photo, voice, text)', done: true },
        { label: 'Bloom AI chat — always available companion', done: true },
        { label: 'Mood tracking & daily rituals', done: true },
        { label: 'Milestone progress & celebrations', done: true },
      ],
      digital: [
        { label: 'bloomsline.com — landing page live', done: true },
        { label: 'Practitioner public profiles (/p/[slug])', done: true },
        { label: 'Public stories page (/stories/[slug])', done: true },
        { label: 'Early access waitlist system', done: true },
        { label: 'PostHog analytics (EU-hosted)', done: true },
      ],
      business: [
        { label: 'SAS incorporated in France', done: true },
        { label: '187 discovery interviews (68 practitioners, 119 users)', done: true },
        { label: '3-5 beta testers onboarded', done: true },
        { label: 'Investor data room built', done: true },
        { label: 'Pitch deck & financial model ready', done: true },
      ],
    },
  },
  {
    id: 'q2-2026',
    period: 'Q2 2026 (Apr – Jun)',
    title: 'Launch & Validate',
    subtitle: '10 → 30 paying practitioners, prove willingness to pay',
    status: 'current',
    items: {
      product: [
        { label: 'Spanish language full support' },
        { label: 'Bloom conversation memory & context improvements' },
        { label: 'Notification system — email + push (Postmark)' },
        { label: 'Practitioner onboarding flow optimization' },
      ],
      b2b: [
        { label: 'Payment integration — Stripe billing (€25/mo)' },
        { label: 'Practitioner settings & profile customization' },
        { label: 'Session recap — AI-generated pre-session brief' },
        { label: 'Member invite flow (email + link)' },
      ],
      b2c: [
        { label: 'Push notifications (session reminders, Bloom nudges)' },
        { label: 'Offline mode — capture moments without internet' },
        { label: 'Improved onboarding (member welcome journey)' },
        { label: 'Session booking from mobile app' },
      ],
      digital: [
        { label: 'French blog launch — weekly SEO content' },
        { label: 'LinkedIn presence — founder-led thought leadership' },
        { label: 'Practitioner testimonial videos (2-3 beta users)' },
        { label: 'HubSpot CRM pipeline for practitioner leads' },
      ],
      business: [
        { label: 'Close pre-seed round (€250-400K)' },
        { label: 'First 10 paying practitioners' },
        { label: 'Attend first conference (AFTCC or similar)' },
        { label: 'Launch referral program (1 free month per referral)' },
      ],
    },
  },
  {
    id: 'q3-2026',
    period: 'Q3 2026 (Jul – Sep)',
    title: 'Grow & Iterate',
    subtitle: '30 → 100 practitioners, organic inbound begins',
    status: 'upcoming',
    items: {
      product: [
        { label: 'Advanced Bloom — emotional pattern summaries' },
        { label: 'Practitioner copilot v2 — smarter session prep' },
        { label: 'Member progress reports (shareable with practitioner)' },
        { label: 'API performance optimization for scale' },
      ],
      b2b: [
        { label: 'Group practice support (multi-practitioner accounts)' },
        { label: 'Exportable clinical reports (PDF)' },
        { label: 'Practitioner-to-practitioner referral system' },
        { label: 'Custom resource templates' },
      ],
      b2c: [
        { label: 'Guided journaling prompts (AI-personalized)' },
        { label: 'Sleep tracking integration' },
        { label: 'Community features — anonymous peer support' },
        { label: 'Widget for quick mood check-in (iOS/Android)' },
      ],
      digital: [
        { label: 'SEO compounding — target 500+ organic monthly visits' },
        { label: 'Guest on 2-3 French psych podcasts' },
        { label: 'Case studies published from early adopters' },
        { label: 'Conference presence — demo booth at major event' },
      ],
      business: [
        { label: 'First hire — customer success / support' },
        { label: 'Training institute partnerships (AFTCC, IFFORTHECC)' },
        { label: 'First organic/referral signups (inflection point)' },
        { label: 'Monthly burn stable at <€10K/mo' },
      ],
    },
  },
  {
    id: 'q4-2026',
    period: 'Q4 2026 (Oct – Dec)',
    title: 'Scale & Expand',
    subtitle: '100 → 200+ practitioners, Series A prep',
    status: 'upcoming',
    items: {
      product: [
        { label: 'Bloom AI v3 — multi-modal (voice notes analysis)' },
        { label: 'Outcomes measurement framework' },
        { label: 'HDS-certified hosting evaluation (for enterprise)' },
        { label: 'API for third-party EHR integrations' },
      ],
      b2b: [
        { label: 'Enterprise plan — clinic / group practice pricing' },
        { label: 'Admin dashboard for practice managers' },
        { label: 'Insurance/reimbursement pathway exploration' },
        { label: 'White-label option for large practices' },
      ],
      b2c: [
        { label: 'Personalized wellbeing programs (AI-generated)' },
        { label: 'Family/couple mode (shared care journeys)' },
        { label: 'Wearable integrations (Apple Health, Fitbit)' },
        { label: 'Celebrate milestones — shareable achievement cards' },
      ],
      digital: [
        { label: 'Expand to French-speaking markets (Belgium, Switzerland)' },
        { label: 'SEO target: 2,000+ organic monthly visits' },
        { label: 'YouTube channel — practitioner education content' },
        { label: 'Partnership co-marketing with training institutes' },
      ],
      business: [
        { label: 'Second hire — full-stack developer' },
        { label: 'Series A data package (retention, NPS, unit economics)' },
        { label: 'Referrals = 20-30% of new signups' },
        { label: 'Start Series A conversations' },
      ],
    },
  },
  {
    id: '2027',
    period: '2027',
    title: 'Series A & Beyond',
    subtitle: 'European expansion, enterprise, advanced AI',
    status: 'upcoming',
    items: {
      product: [
        { label: 'Bloom AI v4 — predictive wellbeing alerts' },
        { label: 'Clinical evidence package (outcome data)' },
        { label: 'Open API for partner integrations' },
      ],
      b2b: [
        { label: 'UK & Germany market entry' },
        { label: 'EAP (Employee Assistance Program) channel' },
        { label: 'Multi-language practitioner support (DE, IT, PT)' },
      ],
      b2c: [
        { label: 'Bloom voice companion (real-time audio)' },
        { label: 'AR/VR mindfulness experiences' },
        { label: 'Self-guided therapeutic programs' },
      ],
      digital: [
        { label: 'Multi-market SEO (UK, DE, Benelux)' },
        { label: 'Thought leadership — conference speaking circuit' },
        { label: 'Strategic media partnerships' },
      ],
      business: [
        { label: 'Raise Series A' },
        { label: 'Team to 8-12 people' },
        { label: 'North America exploration' },
      ],
    },
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

function StatusBadge({ status }: { status: 'done' | 'current' | 'upcoming' }) {
  if (status === 'done') return <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Completed</span>
  if (status === 'current') return <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
  return <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Planned</span>
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Map className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Product Roadmap</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Where We&apos;re Going</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-10">

        {/* ── Intro ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Building the Care Platform</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            From MVP to market leader — our roadmap across product, B2B practitioner tools, B2C member experience,
            digital presence, and business growth. Built iteratively based on real practitioner feedback.
          </p>
        </motion.div>

        {/* ── Track Legend ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="flex flex-wrap items-center gap-3">
          {TRACKS.map((track) => {
            const Icon = track.icon
            return (
              <div key={track.id} className={`${track.lightBg} rounded-lg px-3 py-1.5 flex items-center gap-2`}>
                <Icon className={`w-3.5 h-3.5 ${track.textColor}`} />
                <span className={`text-[10px] font-semibold ${track.textColor}`}>{track.title}</span>
              </div>
            )
          })}
        </motion.div>

        {/* ── Timeline ────────────────────────────────────────────── */}
        <div className="space-y-8">
          {PHASES.map((phase, pi) => (
            <motion.div
              key={phase.id}
              {...fadeUp}
              transition={{ delay: 0.1 + pi * 0.05 }}
            >
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  phase.status === 'done' ? 'bg-emerald-500' :
                  phase.status === 'current' ? 'bg-blue-600' :
                  'bg-gray-300'
                }`}>
                  {phase.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : phase.status === 'current' ? (
                    <Zap className="w-5 h-5 text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">{phase.title}</h3>
                    <StatusBadge status={phase.status} />
                  </div>
                  <p className="text-[10px] text-gray-400">{phase.period} — {phase.subtitle}</p>
                </div>
              </div>

              {/* Track Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 ml-[52px]">
                {TRACKS.map((track) => {
                  const items = phase.items[track.id] || []
                  const Icon = track.icon
                  return (
                    <div
                      key={track.id}
                      className={`${phase.status === 'done' ? 'bg-white' : track.lightBg} border ${
                        phase.status === 'done' ? 'border-gray-200' : 'border-transparent'
                      } rounded-xl p-3`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${track.dotColor}`} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          phase.status === 'done' ? 'text-gray-400' : track.textColor
                        }`}>{track.title}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((item) => (
                          <div key={item.label} className="flex items-start gap-1.5">
                            {item.done ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                            )}
                            <span className={`text-[10px] leading-tight ${
                              item.done ? 'text-gray-400' : 'text-gray-600'
                            }`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Vision Summary ──────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-3">The Vision</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">End of 2026</p>
              <p className="text-xs text-gray-300">200+ practitioners across France. Proven B2B2C flywheel. Series A ready with real traction data.</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">2027</p>
              <p className="text-xs text-gray-300">European expansion (UK, Germany, Benelux). Enterprise channel. Team of 8-12. Advanced AI companion.</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Long Term</p>
              <p className="text-xs text-gray-300">The default platform for therapeutic care between sessions. Every practitioner, every member, connected through AI.</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Roadmap is iterative — priorities shift based on practitioner feedback and market signals.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import {
  Rocket,
  Users,
  MessageSquare,
  Megaphone,
  Handshake,
  Target,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Calendar,
  BookOpen,
  Globe,
  TrendingUp,
  AlertTriangle,
  Zap,
  RefreshCw,
  MapPin,
  GraduationCap,
  Mic,
  PenTool,
  UserPlus,
  Star,
} from 'lucide-react'

// ── Data ─────────────────────────────────────────────────────────────────

const MARKET_SIZE = {
  totalPsychologists: '89,800',
  independent: '~30,000',
  yoyGrowth: '+21%',
  density: '107.7 / 100K',
}

const PHASES = [
  {
    id: 'pre',
    label: 'Pre-Raise',
    timeline: 'Now → Close',
    color: 'bg-gray-900',
    lightBg: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    target: '3 → 10 practitioners',
    mrr: '€250',
    strategy: 'Founder-led direct outreach',
    activities: [
      'LinkedIn outreach: 10 personalized messages/day per founder',
      'Validate willingness to pay — convert beta testers to €25/mo',
      'Collect 3-5 testimonials and usage data',
      'Refine pitch: "what happens between sessions" positioning',
      'Build prospect list: 200 practitioners (Paris, LinkedIn + Doctolib)',
    ],
    channels: ['Direct outreach (LinkedIn)', 'Personal network', 'Demo calls'],
  },
  {
    id: 'p1',
    label: 'Phase 1',
    timeline: 'M1 – M6',
    color: 'bg-blue-600',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    target: '10 → 60 practitioners',
    mrr: '€1,500',
    strategy: 'Expand outreach + start content',
    activities: [
      'Scale LinkedIn outreach with multi-channel (email + LinkedIn + follow-up)',
      'Launch blog in French: "gestion cabinet psychologue", "suivi patient"',
      'Attend first conference (AFTCC workshop or Congrès Français de Psychiatrie)',
      'Launch referral program: 1 free month per referral',
      'Contact AFTCC and FFPP about presenting at events',
      'Publish 2 case studies from beta practitioners',
    ],
    channels: ['Direct outreach', 'Content (blog FR)', 'Events', 'Referrals'],
  },
  {
    id: 'p2',
    label: 'Phase 2',
    timeline: 'M7 – M12',
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    target: '60 → 150 practitioners',
    mrr: '€3,750',
    strategy: 'Organic inbound + partnerships',
    activities: [
      'Content marketing in full swing: weekly posts, SEO compounding',
      'Training institute partnerships (IFFORTHECC, IRCCADE, Asadis)',
      'Offer free year for newly certified practitioners',
      'Guest on French psych podcasts (Deux Psys, Catherine la Psy)',
      'First organic/referral signups should appear (inflection signal)',
      'Consider first hire: customer success / support',
    ],
    channels: ['Content (SEO)', 'Partnerships', 'Referrals', 'Podcasts', 'Inbound'],
  },
  {
    id: 'p3',
    label: 'Phase 3',
    timeline: 'M13 – M18',
    color: 'bg-violet-600',
    lightBg: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
    target: '150 → 280+ practitioners',
    mrr: '€7,000+',
    strategy: 'Flywheel spinning + Series A prep',
    activities: [
      'Referrals should be 20-30% of new signups',
      'Expand to French-speaking markets (Belgium, Switzerland)',
      'Explore group practice / multi-practitioner plans',
      'Build Series A data package: retention, NPS, unit economics',
      'Start conversations with enterprise / EAP partners',
      'Evaluate HDS certification for larger clients',
    ],
    channels: ['Referrals', 'Organic inbound', 'Partnerships', 'Expansion'],
  },
]

const CHANNELS = [
  {
    icon: MessageSquare,
    name: 'Direct Outreach (LinkedIn + Email)',
    priority: 'Primary — now',
    color: 'bg-blue-50 text-blue-600',
    when: 'Pre-raise → M6',
    why: 'Highest leverage at early stage. Multi-channel gets 287% higher reply rate vs single channel. At €25/mo, you need volume: 50+ conversations/week.',
    how: 'Build list from LinkedIn Sales Navigator + Doctolib. Personalize every message. Offer 15-min demo, not a sales pitch. Follow up 3x.',
  },
  {
    icon: PenTool,
    name: 'Content Marketing (French blog + SEO)',
    priority: 'Start now — compounds',
    color: 'bg-emerald-50 text-emerald-600',
    when: 'M1 → ongoing',
    why: 'French practitioners search for "gestion cabinet", "suivi patient", "RGPD psychologue". Low competition in French. SEO compounds over time.',
    how: 'Publish weekly in French. Target keywords practitioners search. Share on LinkedIn. Repurpose for social. Goal: organic inbound by M6.',
  },
  {
    icon: Calendar,
    name: 'Events & Conferences',
    priority: 'High — credibility',
    color: 'bg-amber-50 text-amber-600',
    when: 'M3 → M18',
    why: 'SimplePractice founder got first customers by attending local chapter meetings. AFTCC has 2,500 members. Congrès Français de Psychiatrie is the annual gathering.',
    how: 'Attend AFTCC workshops. Present at FFPP/SNP events. Demo at Congrès (Dec 2025 Cannes, Dec 2026 Strasbourg).',
  },
  {
    icon: UserPlus,
    name: 'Referral Program',
    priority: 'Activate at 10 users',
    color: 'bg-violet-50 text-violet-600',
    when: 'M3 → ongoing',
    why: '86% of B2B buyers say word-of-mouth is most influential. Referred customers have 16-25% higher LTV and lower churn.',
    how: '1 free month per successful referral. Ask every user for 2 introductions. Built into dashboard: "Invite a colleague" button.',
  },
  {
    icon: GraduationCap,
    name: 'Training Institute Partnerships',
    priority: 'Medium-term — high leverage',
    color: 'bg-rose-50 text-rose-600',
    when: 'M6 → M18',
    why: '21% growth in psychologist numbers = thousands of new practitioners setting up practice each year. Easiest early adopters.',
    how: 'Partner with AFTCC, IFFORTHECC, IRCCADE, Asadis. Free year for students/newly certified. "Recommended tool" positioning.',
  },
  {
    icon: Mic,
    name: 'Podcast Guest Appearances',
    priority: 'Complement — authority',
    color: 'bg-cyan-50 text-cyan-600',
    when: 'M6 → M18',
    why: 'Practitioners listen to Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Builds authority and trust with zero cost.',
    how: 'Pitch guest spots on 3-5 French psych podcasts. Share practitioner stories and between-session care insights.',
  },
]

const PARTNERSHIPS = [
  { name: 'AFTCC', type: 'Professional Association', members: '2,500 members', opportunity: 'Workshop sponsorship, event presence' },
  { name: 'FFPP', type: 'Federation', members: 'National umbrella', opportunity: 'Chapter meetings, newsletter features' },
  { name: 'SNP', type: 'Union', members: 'National scope', opportunity: 'Advocacy alignment, policy discussions' },
  { name: 'IFFORTHECC', type: 'Training Institute', members: 'Diploma programs', opportunity: 'Student partnerships, recommended tool' },
  { name: 'IRCCADE', type: 'Training Institute', members: 'Bordeaux/Sud-Ouest', opportunity: 'Regional expansion, graduate pipeline' },
  { name: 'Asadis', type: 'Online Training', members: 'By & for psychologists', opportunity: 'Platform integration, co-marketing' },
]

const MILESTONES = [
  { users: 10, label: 'Payment validated', signal: 'Willingness to pay proven', trigger: 'Close pre-seed' },
  { users: 30, label: 'PMF signal', signal: '<5% monthly churn', trigger: 'Stop selling, fix product if churn >10%' },
  { users: 50, label: 'First organic signup', signal: 'Someone signed up without founder contact', trigger: 'Word-of-mouth beginning' },
  { users: 100, label: 'Model proven', signal: '15-20% MoM growth, stable churn', trigger: 'Consider first hire' },
  { users: 200, label: 'Flywheel spinning', signal: 'Referrals = 20-30% of signups', trigger: 'Series A conversations' },
  { users: 280, label: 'Seed target hit', signal: '€7K+ MRR, proven unit economics', trigger: 'Raise Series A' },
]

const RISKS = [
  { risk: 'Slow adoption / long sales cycles', likelihood: 'High', mitigation: 'Multi-channel outreach, free trial, white-glove onboarding, ultra-low €25/mo friction' },
  { risk: 'Practitioners don\'t see enough value', likelihood: 'Medium', mitigation: 'Focus on member engagement data — show practitioners their clients are using it' },
  { risk: 'Doctolib adds engagement features', likelihood: 'Low-Med', mitigation: 'Move fast. Our B2C member layer + AI companion is hard to bolt on as an afterthought' },
  { risk: 'HDS compliance required', likelihood: 'Medium', mitigation: 'Get legal advice early. Evaluate HDS-certified hosting (Scalingo, OVHcloud) as backup' },
  { risk: 'Runway runs out before traction', likelihood: 'Medium', mitigation: 'Keep burn under €10K/mo. Milestone-based spending. Don\'t hire until PMF signal.' },
]

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

// ── Flywheel Visual ──────────────────────────────────────────────────────

function FlywheelDiagram() {
  const steps = [
    { icon: UserPlus, label: 'Practitioner signs up', sub: '€25/mo', color: 'bg-blue-100 text-blue-700' },
    { icon: Users, label: 'Onboards 10-15 members', sub: 'Free for members', color: 'bg-emerald-100 text-emerald-700' },
    { icon: Star, label: 'Members engage with Bloom AI', sub: 'Better outcomes', color: 'bg-violet-100 text-violet-700' },
    { icon: TrendingUp, label: 'Practitioner sees results', sub: 'Engagement data + retention', color: 'bg-amber-100 text-amber-700' },
    { icon: Megaphone, label: 'Tells peers about it', sub: 'Word-of-mouth', color: 'bg-rose-100 text-rose-700' },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon
        return (
          <div key={step.label} className="flex flex-col items-center">
            <div className={`${step.color} rounded-xl px-5 py-3 flex items-center gap-3 w-full max-w-sm`}>
              <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">{step.label}</p>
                <p className="text-[10px] opacity-70">{step.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && <ArrowDown className="w-4 h-4 text-gray-300 my-1" />}
          </div>
        )
      })}
      {/* Loop back arrow */}
      <div className="flex items-center gap-2 mt-1">
        <RefreshCw className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-semibold text-indigo-500">New practitioners join → repeat</span>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function GoToMarketPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Go-to-Market Strategy</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — From 10 to 280 Practitioners</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">

        {/* ── Thesis ──────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Practitioner-Led Growth</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            We don&apos;t sell to consumers. We sell to practitioners — they bring their entire caseload.
            One €25/mo sale = 10-15 member accounts for free. That&apos;s not marketing — that&apos;s how care works.
            Every practitioner who joins seeds the next wave through peer word-of-mouth.
          </p>
        </motion.div>

        {/* ── Market Size ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-900">France Market — Starting Here</h3>
            <span className="text-[10px] text-gray-400 ml-1">Mental health declared 2025 &quot;Grande Cause Nationale&quot;</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{MARKET_SIZE.totalPsychologists}</p>
              <p className="text-[10px] text-gray-500">Psychologists in France</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-600">{MARKET_SIZE.independent}</p>
              <p className="text-[10px] text-gray-500">Independent / mixed practice</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-600">{MARKET_SIZE.yoyGrowth}</p>
              <p className="text-[10px] text-gray-500">YoY growth (2024)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-600">{MARKET_SIZE.density}</p>
              <p className="text-[10px] text-gray-500">Per 100K inhabitants</p>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg px-4 py-2.5">
            <p className="text-xs text-indigo-700">
              <span className="font-medium">Our addressable market:</span> ~30,000 independent practitioners. At 1% penetration (300 users) = €90K ARR. At 5% (1,500) = €450K ARR.
              This is psychologists only — add psychiatrists, psychotherapists, coaches and the TAM grows significantly.
            </p>
          </div>
        </motion.div>

        {/* ── The Flywheel ────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">The Growth Flywheel</h3>
          <p className="text-[10px] text-gray-400 mb-5">Each practitioner seeds the next wave through the care network effect</p>
          <FlywheelDiagram />
        </motion.div>

        {/* ── Phased Plan ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">The Plan — 18 Months</h3>
          <div className="space-y-4">
            {PHASES.map((phase, i) => (
              <motion.div
                key={phase.id}
                {...fadeUp}
                transition={{ delay: 0.15 + i * 0.05 }}
                className={`${phase.lightBg} border ${phase.borderColor} rounded-xl p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`${phase.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-lg`}>
                      {phase.timeline}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${phase.textColor}`}>{phase.label}: {phase.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{phase.target}</p>
                    <p className="text-[10px] text-gray-400">MRR: {phase.mrr}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 mb-3">
                  {phase.activities.map((activity) => (
                    <div key={activity} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-gray-600">{activity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                  <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Channels:</span>
                  {phase.channels.map((ch) => (
                    <span key={ch} className="text-[10px] bg-white/80 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{ch}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Channel Strategy ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Channel Strategy — Ranked by Priority</h3>
          <div className="space-y-3">
            {CHANNELS.map((ch, i) => {
              const Icon = ch.icon
              return (
                <div key={ch.name} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${ch.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-gray-900">{ch.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-400">{ch.when}</span>
                          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{ch.priority}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">{ch.why}</p>
                      <p className="text-xs text-gray-400"><span className="font-medium text-gray-500">How:</span> {ch.how}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Key Partnerships ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.4 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Target Partnerships</h3>
            <span className="text-[10px] text-gray-400 ml-1">French professional ecosystem</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PARTNERSHIPS.map((p) => (
              <div key={p.name} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-amber-600">{p.name.slice(0, 2)}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-gray-900">{p.name}</p>
                    <span className="text-[9px] text-gray-400">{p.type}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{p.members}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.opportunity}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Growth Milestones ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.45 }}>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Inflection Points — What to Watch</h3>
          <div className="space-y-2">
            {MILESTONES.map((m, i) => (
              <div key={m.users} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{m.users}</span>
                  <span className="text-[8px] text-gray-400">users</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">{m.label}</p>
                  <p className="text-[10px] text-gray-500">{m.signal}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">{m.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Sales Cycle ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.5 }} className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales Cycle — Independent Practitioners</h3>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {[
              { stage: 'Awareness', time: '1-4 weeks', color: 'bg-blue-100 text-blue-700' },
              { stage: 'Demo / Trial', time: '1-2 weeks', color: 'bg-emerald-100 text-emerald-700' },
              { stage: 'Conversion', time: '2-4 weeks', color: 'bg-violet-100 text-violet-700' },
            ].map((s, i) => (
              <div key={s.stage} className="flex items-center gap-2">
                <div className={`${s.color} rounded-lg px-3 py-2 text-center`}>
                  <p className="text-[10px] font-bold">{s.stage}</p>
                  <p className="text-[9px] opacity-70">{s.time}</p>
                </div>
                {i < 2 && <ArrowRight className="w-3 h-3 text-gray-300" />}
              </div>
            ))}
            <div className="bg-gray-100 rounded-lg px-3 py-2 ml-2">
              <p className="text-[10px] font-bold text-gray-700">Total: 4-10 weeks</p>
              <p className="text-[9px] text-gray-400">Solo decision-maker, low price</p>
            </div>
          </div>

          <h4 className="text-xs font-semibold text-gray-700 mb-2">Top Objections & Counters</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { objection: '"I don\'t have time to learn a new tool"', counter: 'White-glove onboarding — we set up their account in 15 min' },
              { objection: '"I already use Doctolib"', counter: 'We\'re not replacing Doctolib. We\'re the engagement layer between sessions.' },
              { objection: '"It costs too much"', counter: '€25/mo = less than one cancelled session. Compare to Doctolib at €129/mo.' },
              { objection: '"I\'m worried about data security"', counter: 'EU-hosted, GDPR-native, AES-256 encryption, Row Level Security on every table.' },
            ].map((o) => (
              <div key={o.objection} className="bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-semibold text-red-600 mb-0.5">{o.objection}</p>
                <p className="text-[10px] text-gray-600">{o.counter}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Risks & Mitigations ─────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.55 }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">Key Risks</h3>
          </div>
          <div className="space-y-2">
            {RISKS.map((r) => (
              <div key={r.risk} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-start gap-4">
                <div className="shrink-0">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    r.likelihood === 'High' ? 'bg-red-100 text-red-600' :
                    r.likelihood === 'Medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>{r.likelihood}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900">{r.risk}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Bottom Line ─────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ delay: 0.6 }} className="bg-gray-900 rounded-xl p-6 text-white">
          <h3 className="text-sm font-semibold mb-2">The Bottom Line</h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            We&apos;re not building a marketing machine — we&apos;re building a care network. Every practitioner who joins brings 10-15 members.
            Those members see other practitioners. Those practitioners hear about us. The flywheel is the product itself.
            With €250-400K, 2 founders, and 18 months of runway, we target 280 practitioners and €84K ARR —
            enough for a credible Series A conversation.
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div {...fadeUp} transition={{ delay: 0.65 }} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Go-to-market strategy — Bloomsline Care, Feb 2026
          </p>
        </motion.div>
      </main>
    </div>
  )
}

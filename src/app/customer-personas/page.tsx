'use client'

import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Heart,
  Briefcase,
  MapPin,
  GraduationCap,
  DollarSign,
  UserCircle,
  Home,
  ArrowRight,
  Star,
  XCircle,
  Zap,
  Clock,
  Eye,
  Megaphone,
  Search,
  CreditCard,
  Monitor,
  BookOpen,
  MessageSquare,
  Lightbulb,
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

// ── Types ────────────────────────────────────────────────────────────────

interface Persona {
  name: string
  emoji: string
  role: string
  tagline: string
  quote: string
  priority: 'P0' | 'P1' | 'P2'
  priorityLabel: string
  side: 'b2b' | 'b2c'
  accentColor: string
  accentBg: string
  accentBorder: string
  accentText: string
  accentLight: string
  demographics: { label: string; value: string; icon: typeof MapPin }[]
  psychographics: {
    values: string[]
    beliefs: string[]
    lifestyle: string[]
    personality: string[]
  }
  painPoints: string[]
  goals: string[]
  buyingBehavior: {
    discovery: string[]
    evaluation: string[]
    purchase: string[]
  }
  mediaConsumption: {
    online: string[]
    offline: string[]
  }
  objections: { title: string; detail: string }[]
  triggerEvents: { event: string; emotion: string }[]
  willingness: {
    range: string
    comparisons: string[]
    sensitivity: string
  }
  retentionRisk?: string
}

// ── Persona Data ─────────────────────────────────────────────────────────

const PERSONAS: Persona[] = [
  // ── B2B ──
  {
    name: 'Marie',
    emoji: '👩‍⚕️',
    role: 'Independent Psychotherapist',
    tagline: 'Core ICP — shortest sales cycle',
    quote: '"I became a therapist to help people heal, not to spend my Sundays doing paperwork. But every week, it\'s the same — notes, follow-ups, no-shows. I feel like I\'m running a business I never signed up for."',
    priority: 'P0',
    priorityLabel: 'Core ICP',
    side: 'b2b',
    accentColor: 'bg-indigo-500',
    accentBg: 'bg-indigo-50',
    accentBorder: 'border-indigo-200',
    accentText: 'text-indigo-600',
    accentLight: 'bg-indigo-100',
    demographics: [
      { label: 'Age', value: '35-45', icon: UserCircle },
      { label: 'Income', value: '€45-65K/yr', icon: DollarSign },
      { label: 'Education', value: 'Master\'s in Psychology', icon: GraduationCap },
      { label: 'Location', value: 'Paris / Lyon', icon: MapPin },
      { label: 'Job Title', value: 'Psychotherapist (solo)', icon: Briefcase },
      { label: 'Family', value: 'Partner, 0-2 children', icon: Home },
    ],
    psychographics: {
      values: ['Client wellbeing above all', 'Evidence-based practice', 'Work-life balance', 'Continuous learning'],
      beliefs: ['Therapy works when sustained', 'Admin kills care quality', 'Tech should be invisible', 'EU tools should exist'],
      lifestyle: ['Works 4-5 days/week', 'Reads journals on weekends', 'Attends 1-2 conferences/yr', 'Exercises for self-care'],
      personality: ['Empathetic & detail-oriented', 'Skeptical of "shiny" tech', 'Pragmatic problem-solver', 'Values peer validation'],
    },
    painPoints: [
      '5-8 hrs/week on admin (notes, scheduling, follow-ups)',
      '"167-hour blind spot" — zero visibility between sessions',
      'Clients drop off silently with no early warning',
      'No EU-native, affordable tools — forced to use US software or spreadsheets',
      'Can\'t prove outcomes to referral partners or insurance',
    ],
    goals: [
      'Spend 80%+ of work time on actual therapy',
      'See clients progressing between sessions, not just during',
      'Reduce no-shows and silent dropoffs',
      'Have one tool that handles notes, scheduling, and client engagement',
    ],
    buyingBehavior: {
      discovery: ['LinkedIn peer recommendations', 'AFTCC / FFPP conference demos', 'Word-of-mouth from training cohort'],
      evaluation: ['Free trial (must work in <10 min)', 'Checks RGPD compliance first', 'Compares to current workflow cost'],
      purchase: ['Monthly subscription (no annual lock-in)', 'Solo decision — no committee', 'Converts within 2-4 weeks of trial'],
    },
    mediaConsumption: {
      online: ['LinkedIn (daily)', 'Psychology Today articles', 'Webinars on clinical tools', 'WhatsApp peer groups'],
      offline: ['AFTCC annual conference', 'Local supervision groups', 'University continuing ed', 'Professional journals'],
    },
    objections: [
      { title: '"I don\'t have time to learn another tool"', detail: 'Needs onboarding in <10 minutes. If setup takes a full afternoon, she\'ll abandon it.' },
      { title: '"Is my client data really safe?"', detail: 'RGPD/GDPR compliance is non-negotiable. Hosting must be in Europe. She needs to see the privacy policy before signing up.' },
      { title: '"My clients aren\'t tech-savvy enough"', detail: 'Needs proof that the member app works for all ages. One bad client experience = she stops recommending it.' },
    ],
    triggerEvents: [
      { event: 'Loses a client who "just stopped coming"', emotion: 'Guilt + frustration — "I should have seen this coming"' },
      { event: 'Sunday evening spent catching up on notes', emotion: 'Resentment — "This isn\'t why I became a therapist"' },
      { event: 'Referral partner asks for outcome data', emotion: 'Embarrassment — "I have nothing to show them"' },
    ],
    willingness: {
      range: '€25-50/mo',
      comparisons: ['1 cancelled session = €60-80 lost', 'Current US tools cost €50-139/mo', 'Paper + spreadsheets = "free" but 5-8 hrs/week'],
      sensitivity: 'Medium — price-conscious but values time savings',
    },
  },
  {
    name: 'Thomas',
    emoji: '👨‍💼',
    role: 'Group Practice Director',
    tagline: 'High ACV — longer sales cycle',
    quote: '"I manage 6 practitioners and I have no idea how their clients are actually doing. Everyone uses different tools, different note formats. When someone burns out and leaves, I lose months of institutional knowledge."',
    priority: 'P1',
    priorityLabel: 'High ACV',
    side: 'b2b',
    accentColor: 'bg-blue-500',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
    accentText: 'text-blue-600',
    accentLight: 'bg-blue-100',
    demographics: [
      { label: 'Age', value: '40-55', icon: UserCircle },
      { label: 'Income', value: '€65-90K/yr', icon: DollarSign },
      { label: 'Education', value: 'Master\'s + management training', icon: GraduationCap },
      { label: 'Location', value: 'Metro France (Paris, Bordeaux, Marseille)', icon: MapPin },
      { label: 'Job Title', value: 'Practice Director / Clinical Lead', icon: Briefcase },
      { label: 'Family', value: 'Partner, 1-3 children', icon: Home },
    ],
    psychographics: {
      values: ['Team wellbeing & retention', 'Operational efficiency', 'Evidence-based outcomes', 'Sustainable growth'],
      beliefs: ['Good tools reduce burnout', 'Data drives better care', 'Standardization enables quality', 'Tech must scale with team'],
      lifestyle: ['60+ hr weeks in growth phase', 'Splits time: clinical + management', 'Attends industry + business events', 'Delegates but verifies'],
      personality: ['Analytical & systems-oriented', 'Risk-averse with new vendors', 'Consensus builder', 'ROI-driven decision maker'],
    },
    painPoints: [
      'No unified view across 3-8 practitioners — each uses different tools',
      'Can\'t prove outcomes to referral partners, insurers, or funders',
      'Staff burn out on admin — loses 1-2 practitioners/year',
      'Onboarding new practitioners takes weeks of manual setup',
      'No way to identify at-risk clients across the practice',
    ],
    goals: [
      'Single platform for the entire team with unified client records',
      'Prove clinical outcomes to referral partners and insurers',
      'Reduce practitioner admin load to improve retention',
      'Scalable system that grows with the practice',
    ],
    buyingBehavior: {
      discovery: ['Team member recommends after personal trial', 'Industry conference or webinar', 'Peer practice director referral'],
      evaluation: ['Pilot with 1-2 practitioners (4-6 weeks)', 'ROI analysis: time saved x hourly rate', 'Security audit + RGPD verification'],
      purchase: ['Per-practitioner pricing (volume)', 'Annual contract preferred for budget planning', '6-12 week decision cycle'],
    },
    mediaConsumption: {
      online: ['LinkedIn (professional content)', 'Healthcare management newsletters', 'SaaS comparison sites', 'Webinars on practice growth'],
      offline: ['Healthcare management conferences', 'Regional practitioner networks', 'ARS-sponsored events', 'Business coaching groups'],
    },
    objections: [
      { title: '"My team won\'t adopt another tool"', detail: 'Needs proof of minimal learning curve. Wants to see adoption rates from similar practices before committing.' },
      { title: '"I need ROI data to justify the expense"', detail: 'Requires a clear cost-benefit analysis: time saved per practitioner x hourly rate vs. subscription cost per seat.' },
      { title: '"What about data migration from our current systems?"', detail: 'Needs import tools or white-glove onboarding. Switching cost anxiety is the #1 blocker for group practices.' },
    ],
    triggerEvents: [
      { event: 'Loses a practitioner to burnout', emotion: 'Urgency — "I need to fix the admin burden before I lose another one"' },
      { event: 'Referral partner asks for outcome data', emotion: 'Pressure — "If I can\'t show results, we lose the referral pipeline"' },
      { event: 'Insurance/ARS audit request', emotion: 'Anxiety — "We need proper documentation across the practice NOW"' },
    ],
    willingness: {
      range: '€20-25/practitioner/mo',
      comparisons: ['Losing 1 practitioner = €50-80K replacement cost', 'Manual tracking across team = 2-3 hrs/week of director time', 'Current multi-tool stack = €80-150/practitioner/mo'],
      sensitivity: 'Low — volume buyer, needs ROI justification not lowest price',
    },
  },
  // ── B2C ──
  {
    name: 'Lea',
    emoji: '👩‍💻',
    role: 'Engaged Young Professional',
    tagline: 'Self-activating, freemium upside',
    quote: '"My therapist gives me these amazing insights during sessions, but by Wednesday I can\'t remember half of what we talked about. I journal sometimes, but it feels disconnected from my actual therapy. I wish there was something that bridged the gap."',
    priority: 'P1',
    priorityLabel: 'Organic Growth',
    side: 'b2c',
    accentColor: 'bg-emerald-500',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
    accentText: 'text-emerald-600',
    accentLight: 'bg-emerald-100',
    demographics: [
      { label: 'Age', value: '26-34', icon: UserCircle },
      { label: 'Income', value: '€35-55K/yr', icon: DollarSign },
      { label: 'Education', value: 'Bachelor\'s / Master\'s', icon: GraduationCap },
      { label: 'Location', value: 'Paris (urban)', icon: MapPin },
      { label: 'Job Title', value: 'Marketing / Tech / Consulting', icon: Briefcase },
      { label: 'Family', value: 'Single or partner, no kids', icon: Home },
    ],
    psychographics: {
      values: ['Personal growth & self-awareness', 'Mental health destigmatization', 'Digital-first solutions', 'Authenticity in relationships'],
      beliefs: ['Therapy is an investment, not a weakness', 'Progress should be visible', 'Good UX matters for health tools', 'Data privacy is important'],
      lifestyle: ['Digitally native — 6+ hrs screen time/day', 'Exercises 3-4x/week', 'Active on Instagram & TikTok', 'Reads self-help & psychology content'],
      personality: ['Growth-oriented & curious', 'Willing to try new apps', 'Shares health tools with friends', 'Abandons apps with bad UX quickly'],
    },
    painPoints: [
      'Forgets therapy insights by day 3 — "What did we even talk about?"',
      'Journaling apps feel generic — not connected to her actual care plan',
      'No way to share progress moments with her therapist between sessions',
      'Meditation apps (Headspace, Calm) feel disconnected from real therapy',
      'Wants to track progress but doesn\'t know what to measure',
    ],
    goals: [
      'Retain and apply therapy insights throughout the week',
      'See tangible evidence of her mental health progress over time',
      'Have a tool her therapist actually recommends and uses',
      'Bridge the gap between weekly sessions with meaningful activities',
    ],
    buyingBehavior: {
      discovery: ['100% via therapist recommendation — never finds it alone', 'Judges app quality in first 3 uses (UX = trust signal)', 'Checks App Store reviews before downloading'],
      evaluation: ['Tries free version immediately after therapist recommends', 'Compares to Headspace/Calm experience', 'Needs to see value within first week'],
      purchase: ['Free via practitioner initially', '5-8% convert to ~€3/mo premium after 2-3 months', 'In-app upgrade — no sales contact needed'],
    },
    mediaConsumption: {
      online: ['Instagram & TikTok (mental health content)', 'Spotify podcasts (therapy & wellness)', 'App Store browsing', 'Reddit r/therapy communities'],
      offline: ['Yoga / fitness studios', 'Book clubs (self-help genre)', 'Friends\' recommendations', 'University alumni events'],
    },
    objections: [
      { title: '"Another app? I already have Headspace"', detail: 'Needs to understand this isn\'t a meditation app — it\'s connected to her actual therapy and therapist.' },
      { title: '"Will my therapist actually see what I share?"', detail: 'Wants clarity on privacy controls: what her therapist sees vs. what stays private.' },
      { title: '"I\'ll probably forget to use it after a week"', detail: 'Needs gentle nudges (not spam notifications) and therapist-driven prompts to build the habit.' },
    ],
    triggerEvents: [
      { event: 'Therapist says "I wish I could see how you\'re doing between sessions"', emotion: 'Openness — "If my therapist recommends it, I\'ll try it"' },
      { event: 'Has a breakthrough session but can\'t recall details by Friday', emotion: 'Frustration — "I need to capture these moments somehow"' },
      { event: 'Friend shares their therapy progress on social media', emotion: 'Inspiration — "I want to track my journey like that too"' },
    ],
    willingness: {
      range: '€0 to start, ~€3/mo premium',
      comparisons: ['Headspace: €12.99/mo (generic meditation)', 'Calm: €11.99/mo (sleep + relaxation)', 'Therapy session: €60-80/session (1x/week)'],
      sensitivity: 'High — expects free core, pays for extras she genuinely uses',
    },
  },
  {
    name: 'Sophie',
    emoji: '👩‍👧‍👦',
    role: 'Overwhelmed Parent',
    tagline: 'Design constraint — retention proof',
    quote: '"I know therapy is helping, but honestly, by the time I get the kids to bed and clean up, I can barely remember what my therapist said. I feel guilty for not doing the exercises, but I just don\'t have the energy to figure out another app."',
    priority: 'P2',
    priorityLabel: 'Design Constraint',
    side: 'b2c',
    accentColor: 'bg-violet-500',
    accentBg: 'bg-violet-50',
    accentBorder: 'border-violet-200',
    accentText: 'text-violet-600',
    accentLight: 'bg-violet-100',
    demographics: [
      { label: 'Age', value: '38-48', icon: UserCircle },
      { label: 'Income', value: '€22-35K/yr', icon: DollarSign },
      { label: 'Education', value: 'Bac+2 / BTS', icon: GraduationCap },
      { label: 'Location', value: 'Suburban France', icon: MapPin },
      { label: 'Job Title', value: 'Part-time (admin / retail / care)', icon: Briefcase },
      { label: 'Family', value: 'Partner + 2 children', icon: Home },
    ],
    psychographics: {
      values: ['Family stability above all', 'Practical over theoretical', 'Trust in her therapist', 'Simplicity & reliability'],
      beliefs: ['Tech is for younger people', 'Free tools have hidden costs', 'Therapy is already expensive enough', 'She shouldn\'t need help with help'],
      lifestyle: ['Zero free time — kids → work → kids → sleep', 'Phone = WhatsApp + photos only', 'Rarely downloads new apps', 'Gets info from family/friends, not internet'],
      personality: ['Warm but exhausted', 'Low tech confidence', 'Needs encouragement, not instructions', 'Will do it if it\'s truly simple'],
    },
    painPoints: [
      'Zero time — mornings are chaos, evenings are exhaustion',
      'Feels guilty about therapy cost — needs to feel it\'s "working"',
      'Forgets homework assignments and feels ashamed at next session',
      'Apps feel intimidating — "too many buttons, not sure what to do"',
      'Doesn\'t want to "bother" her therapist between sessions',
    ],
    goals: [
      'Remember and complete therapy exercises without added stress',
      'Feel that therapy money is well-spent (visible progress)',
      'Simple tool her therapist sets up FOR her — zero self-setup',
      'Quick daily check-in that fits between school run and dinner',
    ],
    buyingBehavior: {
      discovery: ['100% via therapist — sets it up IN session on her phone', 'Never discovers it alone — zero chance of organic download', 'Trusts only her therapist\'s recommendation'],
      evaluation: ['No evaluation phase — if therapist sets it up, she uses it', 'First impression happens in-session with therapist guiding', 'If confused in first 30 seconds, she closes and never returns'],
      purchase: ['€0 forever — by design', 'Her engagement IS the product value (proves B2B outcomes)', 'Never shown a paywall — protected by design'],
    },
    mediaConsumption: {
      online: ['WhatsApp (family groups)', 'Facebook (local community groups)', 'YouTube (cooking, kids\' content)', 'Google (health symptoms search)'],
      offline: ['School parent meetings', 'Local pharmacy / GP waiting room', 'Family & neighborhood network', 'Free community workshops'],
    },
    objections: [
      { title: '"I\'m not good with technology"', detail: 'Must work like WhatsApp — open, tap, done. Any complexity beyond that and she\'s lost.' },
      { title: '"I don\'t have time for this"', detail: 'Daily interaction must be <30 seconds. If it feels like homework, she\'ll associate it with failure.' },
      { title: '"What if I do it wrong?"', detail: 'No error states, no red warnings, no "you missed a day" guilt. Only positive reinforcement.' },
    ],
    triggerEvents: [
      { event: 'Therapist says "let me show you something on your phone"', emotion: 'Trust — "If she\'s setting it up for me, it must be important"' },
      { event: 'Feels progress after using a simple check-in for 1 week', emotion: 'Pride — "I\'m actually doing something for myself"' },
    ],
    willingness: {
      range: '€0 forever (by design)',
      comparisons: ['Therapy session: €60-80 (often subsidized)', 'Her engagement proves practitioner ROI', 'If she drops off, the practitioner loses data — our problem, not hers'],
      sensitivity: 'N/A — never pays. Her value is engagement data for B2B.',
    },
    retentionRisk: 'If first use takes >30 seconds to understand, she never opens it again. Onboarding must happen IN session with practitioner guiding. No self-serve setup. No tutorial screens. Open → one action → done.',
  },
]

// ── Segment Sizing Data ──────────────────────────────────────────────────

const SEGMENTS = [
  { segment: 'Solo practitioners', persona: 'Marie', pctMarket: '65%', tam: '~19.5K (France)', priority: 'P0', priorityColor: 'bg-red-50 text-red-700 border-red-200', rationale: 'Core ICP, shortest sales cycle, highest volume' },
  { segment: 'Group practices', persona: 'Thomas', pctMarket: '20%', tam: '~3-5K practices', priority: 'P1', priorityColor: 'bg-amber-50 text-amber-700 border-amber-200', rationale: 'Higher ACV, longer cycle, expansion revenue' },
  { segment: 'Engaged members', persona: 'Lea', pctMarket: '45% of members', tam: '~195K', priority: 'P1', priorityColor: 'bg-amber-50 text-amber-700 border-amber-200', rationale: 'Self-activating, freemium conversion upside' },
  { segment: 'High-risk members', persona: 'Sophie', pctMarket: '35% of members', tam: '~130K', priority: 'P2', priorityColor: 'bg-gray-50 text-gray-500 border-gray-200', rationale: 'Retention proof, drives B2B outcomes data' },
]

// ── Journey Map Data ─────────────────────────────────────────────────────

const JOURNEY_STAGES = ['Awareness', 'Evaluation', 'Onboarding', 'Engagement', 'Advocacy']

const JOURNEY_ROWS = [
  {
    persona: 'Marie',
    emoji: '👩‍⚕️',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dotColor: 'bg-indigo-500',
    stages: [
      { desc: 'Sees peer post on LinkedIn or conference demo', duration: '1-2 weeks' },
      { desc: 'Free trial, tests with 2-3 clients, checks RGPD', duration: '2-4 weeks' },
      { desc: 'Sets up practice profile, invites first 5 clients', duration: '1 day' },
      { desc: 'Daily: notes, scheduling. Weekly: reviews client progress', duration: 'Ongoing' },
      { desc: 'Recommends to supervision group, posts LinkedIn review', duration: 'Month 3+' },
    ],
  },
  {
    persona: 'Thomas',
    emoji: '👨‍💼',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    stages: [
      { desc: 'Team member shows it, or hears at conference', duration: '2-4 weeks' },
      { desc: 'Pilots with 1-2 practitioners, runs ROI analysis', duration: '6-12 weeks' },
      { desc: 'Rolls out to full team, imports client data', duration: '1-2 weeks' },
      { desc: 'Reviews team dashboard, monitors outcomes data', duration: 'Ongoing' },
      { desc: 'Refers to peer practice directors, becomes case study', duration: 'Month 6+' },
    ],
  },
  {
    persona: 'Lea',
    emoji: '👩‍💻',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    stages: [
      { desc: 'Therapist says "I want you to try this app"', duration: 'In session' },
      { desc: 'Downloads, judges UX in first 3 uses', duration: '1 week' },
      { desc: 'Completes first check-in, explores activities', duration: '10 min' },
      { desc: 'Daily mood tracking, weekly reflections, shares moments', duration: 'Ongoing' },
      { desc: 'Tells friends in therapy, leaves App Store review', duration: 'Month 2+' },
    ],
  },
  {
    persona: 'Sophie',
    emoji: '👩‍👧‍👦',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    dotColor: 'bg-violet-500',
    stages: [
      { desc: 'Therapist opens app on Sophie\'s phone IN session', duration: 'In session' },
      { desc: 'None — therapist sets it up, no self-evaluation', duration: '0' },
      { desc: 'First check-in done with therapist watching', duration: '30 sec' },
      { desc: 'Quick daily check-in between school run and dinner', duration: 'Ongoing' },
      { desc: 'Tells other parents at school pickup (word of mouth)', duration: 'Month 3+' },
    ],
  },
]

// ── Prioritization Matrix ────────────────────────────────────────────────

function PrioritizationMatrix() {
  const dots: Array<{ name: string; emoji: string; x: number; y: number; color: string; label: string }> = [
    { name: 'Marie', emoji: '👩‍⚕️', x: 75, y: 80, color: 'bg-indigo-500', label: 'P0 — Sweet spot' },
    { name: 'Thomas', emoji: '👨‍💼', x: 30, y: 85, color: 'bg-blue-500', label: 'P1 — High value' },
    { name: 'Lea', emoji: '👩‍💻', x: 72, y: 30, color: 'bg-emerald-500', label: 'P1 — Organic' },
    { name: 'Sophie', emoji: '👩‍👧‍👦', x: 25, y: 18, color: 'bg-violet-500', label: 'P2 — Design test' },
  ]

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Quadrant labels */}
        <div className="absolute top-3 left-3 text-[9px] text-gray-300 font-medium">Hard to acquire, high revenue</div>
        <div className="absolute top-3 right-3 text-[9px] text-gray-300 font-medium">Easy to acquire, high revenue</div>
        <div className="absolute bottom-3 left-3 text-[9px] text-gray-300 font-medium">Hard to acquire, low revenue</div>
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 font-medium">Easy to acquire, low revenue</div>

        {/* Grid lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" />

        {/* Sweet spot zone */}
        <div className="absolute top-[5%] right-[5%] w-[42%] h-[42%] bg-emerald-50/50 border border-dashed border-emerald-200 rounded-lg flex items-start justify-end p-2">
          <span className="text-[9px] font-semibold text-emerald-400">SWEET SPOT</span>
        </div>

        {/* Axis labels */}
        <div className="absolute -bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-2">
          <div className="flex items-center gap-12 text-[10px] text-gray-400">
            <span>Hard to acquire</span>
            <ArrowRight className="w-3 h-3" />
            <span>Easy to acquire</span>
          </div>
        </div>
        <div className="absolute top-1/2 -left-0 -translate-x-full -translate-y-1/2 pr-2">
          <div className="flex flex-col items-center gap-8 text-[10px] text-gray-400">
            <span className="rotate-[-90deg] whitespace-nowrap">High revenue</span>
            <span className="rotate-[-90deg] whitespace-nowrap">Low revenue</span>
          </div>
        </div>

        {/* Dots */}
        {dots.map((dot) => (
          <div
            key={dot.name}
            className="absolute group"
            style={{ left: `${dot.x}%`, bottom: `${dot.y}%`, transform: 'translate(-50%, 50%)' }}
          >
            <div className={`${dot.color} rounded-full w-4 h-4 ring-4 ring-gray-900/5 transition-transform group-hover:scale-125 flex items-center justify-center`}>
              <span className="text-[8px]">{dot.emoji}</span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-gray-900 text-white shadow-sm">
                {dot.name} — {dot.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Persona Card Component ───────────────────────────────────────────────

function PersonaCard({ persona, delay }: { persona: Persona; delay: number }) {
  return (
    <motion.div {...fadeUp(delay)} className={`${persona.accentBg} border ${persona.accentBorder} rounded-xl p-6`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">{persona.emoji}</span>
            <span className={`text-base font-bold ${persona.accentText}`}>{persona.name}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
              persona.priority === 'P0' ? 'bg-red-50 text-red-700 border-red-200' :
              persona.priority === 'P1' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              {persona.priority}
            </span>
          </div>
          <p className="text-xs text-gray-500">{persona.role} — {persona.tagline}</p>
        </div>
      </div>

      {/* Quote */}
      <div className="bg-white/60 rounded-lg p-4 mb-5 border-l-3 border-gray-300">
        <p className="text-xs text-gray-500 italic leading-relaxed">{persona.quote}</p>
      </div>

      {/* Retention risk callout */}
      {persona.retentionRisk && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">High Retention Risk</p>
            <p className="text-[10px] text-amber-600 leading-relaxed">{persona.retentionRisk}</p>
          </div>
        </div>
      )}

      {/* Demographics — 2x3 grid */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">Demographics</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {persona.demographics.map((d) => {
            const Icon = d.icon
            return (
              <div key={d.label} className="bg-white/70 rounded-lg px-3 py-2 flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-gray-400">{d.label}</p>
                  <p className="text-[10px] font-medium text-gray-700">{d.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Psychographics — 4 groups */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2">Psychographics</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.entries(persona.psychographics) as [string, string[]][]).map(([group, items]) => (
            <div key={group}>
              <p className={`text-[9px] font-semibold ${persona.accentText} capitalize mb-1`}>{group}</p>
              <ul className="space-y-0.5">
                {items.map((item, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className={`w-1 h-1 rounded-full ${persona.accentColor} shrink-0 mt-1.5`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points + Goals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Pain Points
          </p>
          <ul className="space-y-1.5">
            {persona.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Goals
          </p>
          <ul className="space-y-1.5">
            {persona.goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-[10px] text-gray-600">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Buying Behavior — 3 col */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <ShoppingCart className="w-3 h-3" /> Buying Behavior
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { key: 'discovery', label: 'Discovery', icon: Search },
            { key: 'evaluation', label: 'Evaluation', icon: Eye },
            { key: 'purchase', label: 'Purchase', icon: CreditCard },
          ] as const).map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white/70 rounded-lg p-3">
              <p className={`text-[9px] font-semibold ${persona.accentText} mb-1.5 flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {label}
              </p>
              <ul className="space-y-1">
                {persona.buyingBehavior[key].map((item, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Media Consumption — 2 col */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Monitor className="w-3 h-3" /> Media Consumption
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { key: 'online', label: 'Online', icon: Monitor },
            { key: 'offline', label: 'Offline', icon: BookOpen },
          ] as const).map(({ key, label, icon: Icon }) => (
            <div key={key} className="bg-white/70 rounded-lg p-3">
              <p className={`text-[9px] font-semibold ${persona.accentText} mb-1.5 flex items-center gap-1`}>
                <Icon className="w-3 h-3" /> {label}
              </p>
              <ul className="space-y-0.5">
                {persona.mediaConsumption[key].map((item, i) => (
                  <li key={i} className="text-[10px] text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Objections */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Objections
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {persona.objections.map((obj, i) => (
            <div key={i} className="bg-red-50/60 border border-red-100 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-red-700 mb-1">{obj.title}</p>
              <p className="text-[10px] text-red-600/80 leading-relaxed">{obj.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Events */}
      <div className="mb-5">
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Trigger Events
        </p>
        <div className="space-y-2">
          {persona.triggerEvents.map((t, i) => (
            <div key={i} className="bg-white/70 rounded-lg px-3 py-2 flex items-start gap-3">
              <Zap className={`w-3.5 h-3.5 ${persona.accentText} shrink-0 mt-0.5`} />
              <div>
                <p className="text-[10px] font-medium text-gray-700">{t.event}</p>
                <p className="text-[10px] text-gray-400 italic">{t.emotion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Willingness to Pay */}
      <div>
        <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
          <DollarSign className="w-3 h-3" /> Willingness to Pay
        </p>
        <div className="bg-white/70 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-900">{persona.willingness.range}</span>
            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
              persona.willingness.sensitivity.startsWith('N/A') ? 'bg-gray-50 text-gray-500 border-gray-200' :
              persona.willingness.sensitivity.includes('High') ? 'bg-amber-50 text-amber-700 border-amber-200' :
              persona.willingness.sensitivity.includes('Low') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {persona.willingness.sensitivity.split('—')[0].trim()}
            </span>
          </div>
          <div className="space-y-0.5">
            {persona.willingness.comparisons.map((c, i) => (
              <p key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
                <span className="text-gray-300 shrink-0">vs.</span>
                {c}
              </p>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CustomerPersonasPage() {
  const b2bPersonas = PERSONAS.filter((p) => p.side === 'b2b')
  const b2cPersonas = PERSONAS.filter((p) => p.side === 'b2c')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Customer Personas</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Buyer & User Profiles</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Who we&apos;re building for</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Bloomsline is a dual-sided platform. Practitioners pay (B2B) and their clients use (B2C).
            Each side has distinct needs, buying behaviors, and success criteria. These four personas define our product decisions,
            pricing architecture, and go-to-market priorities.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {PERSONAS.map((p) => (
              <span
                key={p.name}
                className={`text-[10px] font-semibold ${p.accentBg} ${p.accentText} px-3 py-1.5 rounded-full border ${p.accentBorder} flex items-center gap-1.5`}
              >
                <span className="text-sm">{p.emoji}</span>
                {p.name} — {p.role}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ── 2. B2B Section Header ────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="Practitioners who pay for Bloomsline">The Buyers</SectionTitle>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] text-gray-400">B2B — Revenue engine</span>
          </div>

          {/* ── 3-4. Marie & Thomas Cards ──────────────────────── */}
          <div className="space-y-6">
            {b2bPersonas.map((persona, i) => (
              <PersonaCard key={persona.name} persona={persona} delay={0.1 + i * 0.1} />
            ))}
          </div>
        </motion.section>

        {/* ── 5. B2C Section Header ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="Members who use Bloomsline through their practitioners">The Users</SectionTitle>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-400">B2C — Free, invited by practitioners</span>
          </div>

          {/* ── 6-7. Lea & Sophie Cards ────────────────────────── */}
          <div className="space-y-6">
            {b2cPersonas.map((persona, i) => (
              <PersonaCard key={persona.name} persona={persona} delay={0.35 + i * 0.1} />
            ))}
          </div>
        </motion.section>

        {/* ── 8. Segment Sizing Table ──────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle="How each persona maps to market size and go-to-market priority">Segment Sizing</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Segment</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Persona</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">% Market</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">TAM</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Priority</th>
                  <th className="text-left py-2 pl-2 text-gray-500 font-medium">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {SEGMENTS.map((seg) => (
                  <tr key={seg.persona} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{seg.segment}</td>
                    <td className="py-2.5 px-2 text-gray-600">{seg.persona}</td>
                    <td className="py-2.5 px-2 text-center text-gray-600">{seg.pctMarket}</td>
                    <td className="py-2.5 px-2 text-center font-medium text-gray-800">{seg.tam}</td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${seg.priorityColor}`}>
                        {seg.priority}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-gray-500 text-[10px]">{seg.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── 9. Prioritization Matrix (2x2) ──────────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <SectionTitle subtitle="Acquisition ease vs. revenue potential — where each persona sits">Prioritization Matrix</SectionTitle>
          <PrioritizationMatrix />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {PERSONAS.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${p.accentColor}`} />
                <span className="text-[10px] text-gray-500">{p.emoji} {p.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 italic">
            Marie is in the sweet spot — easiest to acquire with highest revenue potential. Start here.
          </p>
        </motion.section>

        {/* ── 10. Journey Map ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle="How each persona enters, evaluates, and progresses through Bloomsline">Journey Map</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 bg-gray-50 border-b border-gray-100">
              <div className="px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Persona</div>
              {JOURNEY_STAGES.map((stage) => (
                <div key={stage} className="px-2 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
                  {stage}
                </div>
              ))}
            </div>

            {/* Persona rows */}
            {JOURNEY_ROWS.map((row, ri) => (
              <div key={row.persona} className={`grid grid-cols-6 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-50 last:border-0`}>
                <div className="px-3 py-3 flex items-center gap-2">
                  <span className="text-sm">{row.emoji}</span>
                  <span className={`text-[10px] font-semibold ${row.color.split(' ')[1]}`}>{row.persona}</span>
                </div>
                {row.stages.map((stage, si) => (
                  <div key={si} className="px-2 py-3 flex flex-col items-center text-center">
                    <div className={`w-2 h-2 rounded-full ${row.dotColor} mb-1.5`} />
                    <p className="text-[9px] text-gray-600 leading-relaxed mb-1">{stage.desc}</p>
                    <span className="text-[8px] text-gray-400 font-medium">{stage.duration}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
            B2B personas (Marie, Thomas) follow a traditional SaaS evaluation path. B2C personas (Lea, Sophie) enter exclusively through their practitioner — zero organic acquisition.
          </p>
        </motion.section>

        {/* ── 11. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(0.65)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Key Takeaways</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍⚕️</span>
                <div>
                  <p className="text-xs font-semibold text-indigo-300">Marie is the entry point.</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Solo practitioners are the fastest to convert, easiest to reach, and bring their clients with them.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍👧‍👦</span>
                <div>
                  <p className="text-xs font-semibold text-violet-300">Sophie is the design constraint.</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">If Sophie can use it, anyone can. She forces us to build the simplest possible product.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👩‍💻</span>
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Lea is the retention engine.</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Engaged members generate data that proves practitioner ROI — and 5-8% convert to paid.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">👨‍💼</span>
                <div>
                  <p className="text-xs font-semibold text-blue-300">Thomas is the expansion path.</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">Group practices mean multi-seat deals, higher ACV, and the credibility to attract institutional partners.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 12. Footer ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.7)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Research as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

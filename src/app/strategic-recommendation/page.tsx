'use client'

import { motion } from 'framer-motion'
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Clock,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  Target,
  Shield,
  BarChart3,
  Scale,
  Eye,
  Star,
  Crosshair,
  Layers,
  Brain,
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

// ── Current State Data ──────────────────────────────────────────────────

const CURRENT_STATE = {
  strengths: [
    { label: 'B2B2C architecture is category-defining', detail: 'Only platform connecting practitioner tools + member app + AI companion in EU. SimplePractice has practitioners (237K) but no member app. Headspace has members (80M) but no practitioner tools. Nobody has both.', rating: 'Decisive' },
    { label: 'Unit economics are exceptional — on paper', detail: 'LTV/CAC 72.5x (vs. 3-5x median), 85% gross margin, €50 CAC, 1.7-month payback. The Care Network Effect (1 practitioner → 12-15 free members) makes acquisition economics structurally superior to any competitor. IF the assumptions hold.', rating: 'Strong' },
    { label: 'Product is built, not vaporware', detail: 'Full MVP live: Next.js 16 web dashboard + Expo mobile app, 24+ API endpoints, 7 AI endpoints (Claude Haiku/Sonnet), 3-language i18n (en/fr/es), Google Calendar sync, real-time subscriptions. Built entirely by founding team — no outsourced code, no technical debt from agencies.', rating: 'Strong' },
    { label: 'EU regulatory positioning creates structural moat', detail: 'GDPR-native from first line of code. AES-256-GCM encryption, Row Level Security on every table, EU-hosted analytics. EU AI Act-ready (Aug 2026 deadline). US competitors need 12-24 months to achieve parity. This advantage deepens over time.', rating: 'Strong' },
    { label: 'Market timing is favorable — window is open', detail: 'BetterHelp revenue -11%, Woebot shut down (June 2025), Talkspace pivoting B2B (+42% payor revenue). B2C model is collapsing; capital is moving to B2B/B2B2C. Therapist burnout at 93%. Zero AI-native practitioner SaaS exists in EU.', rating: 'Favorable' },
  ],
  weaknesses: [
    { label: 'Zero revenue. Zero paying customers. Zero validated demand.', detail: 'Every financial metric (LTV, CAC, churn, LTV/CAC) is modeled, not observed. 187 interviews validate interest, but stated preference ≠ purchasing behavior. Woebot had 5+ RCTs and $123M funding and still failed commercially. The gap between "interesting" and "I will pay monthly" remains uncrossed.', severity: 'Critical' },
    { label: 'Two-person team is a single point of failure', detail: 'Two founders covering product, engineering, sales, marketing, design, support, and fundraising simultaneously. No clinical advisor. No engineering hire. If one founder is unavailable for 2 weeks, the entire operation stalls. Cannot match feature velocity of funded competitors.', severity: 'Critical' },
    { label: '"Do nothing" is the real competitor', detail: '80%+ of French solo practitioners manage between-session care with paper notes or nothing at all. The cost is zero. The inertia is massive. Only 5% of therapists use AI in practice today (though 55% express interest). Changing behavior is harder than building features.', severity: 'High' },
    { label: 'No clinical evidence base', detail: 'No published outcomes data. No clinical trials. No measurement-based care validation. Germany\'s DiGA pathway requires it. EU AI Act high-risk classification expects it. Insurance reimbursement demands it. Without evidence, the regulatory and commercial pathways narrow significantly.', severity: 'High' },
  ],
}

// ── Strategic Options ───────────────────────────────────────────────────

interface StrategicOption {
  id: string
  name: string
  subtitle: string
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  iconColor: string
  thesis: string
  description: string
  investment: string
  timeline: string
  expectedOutcome: string[]
  keyRisks: string[]
  m12Revenue: string
  m12Practitioners: string
  seriesATimeline: string
  probabilityOfSuccess: string
}

const OPTIONS: StrategicOption[] = [
  {
    id: 'A',
    name: 'Capital Preservation',
    subtitle: 'Prove PMF in France with minimal spend before scaling',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
    thesis: 'The biggest risk is spending money before proving demand. Raise the minimum viable amount, keep burn at absolute minimum, and achieve product-market fit in one market before expanding. If 30 practitioners pay monthly with <5% churn, you have a business. If not, you preserved capital to pivot.',
    description: 'Raise €250-300K. Founder salaries at €2K/month each. No engineering hire for 6 months. Focus exclusively on France. Digital-only GTM: LinkedIn outreach + blog + referrals. No conferences, no partnerships until 30 practitioners achieved. Extend runway to 36+ months. Build slowly, validate deeply.',
    investment: '€250-300K seed raise',
    timeline: '36+ months runway',
    expectedOutcome: [
      'M6: 25-40 practitioners (France only)',
      'M12: 60-80 practitioners, €2-3K MRR',
      'M18: 100-120 practitioners, €4-5K MRR',
      'Validated PMF before significant capital deployment',
      'Founders retain 83-85% equity',
    ],
    keyRisks: [
      'Slow growth allows SimplePractice/Doctolib to close window',
      'Two founders burn out covering all functions for 18+ months',
      'Cannot hire engineer → product development stalls',
      'Investors may perceive lack of ambition',
      'French-only traction may not justify Series A valuation',
    ],
    m12Revenue: '€2-3K MRR',
    m12Practitioners: '60-80',
    seriesATimeline: 'M24-M30',
    probabilityOfSuccess: '45%',
  },
  {
    id: 'B',
    name: 'Validated Expansion',
    subtitle: 'Prove France, then expand to 3 markets within seed runway',
    color: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    iconColor: 'text-emerald-500',
    thesis: 'The market window is 12-18 months. You need to prove PMF in France fast (90 days), then demonstrate multi-market viability to justify Series A. Hire one engineer to accelerate product development while founders focus on GTM. Expand to Belgium and Switzerland (zero localization cost) to prove the model works beyond France. Use multi-market traction as the Series A narrative.',
    description: 'Raise €350-450K. Hire first engineer within 60 days (€2.5K/month). Founders at €2.5K/month each. Burn: €10-12K/month. France-first GTM with hard 90-day milestone (10 practitioners or pivot). Belgium/Switzerland expansion at M4-6. Begin German localization at M8. Active investor networking from M9. Target Series A by M18.',
    investment: '€350-450K seed raise',
    timeline: '28-33 months runway',
    expectedOutcome: [
      'M3: 15-20 practitioners (France), PMF signal clear',
      'M6: 50-60 practitioners across FR/BE/CH, €2K MRR',
      'M12: 120-150 practitioners across 3-4 markets, €5-6K MRR',
      'M18: 200+ practitioners, €7-8K MRR, Series A ready',
      'Multi-market proof validates B2B2C model internationally',
    ],
    keyRisks: [
      'Multi-market expansion stretches two founders + one engineer thin',
      'Belgium/Switzerland may not convert despite French language fit',
      'If France PMF takes 6 months instead of 3, timeline shifts',
      'Bridge round may be needed if Series A takes longer than M18',
    ],
    m12Revenue: '€5-6K MRR',
    m12Practitioners: '120-150',
    seriesATimeline: 'M16-M20',
    probabilityOfSuccess: '55%',
  },
  {
    id: 'C',
    name: 'Blitzscale Europe',
    subtitle: 'Maximum velocity — own the EU category before anyone else can',
    color: 'text-amber-700',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    iconColor: 'text-amber-500',
    thesis: 'The 12-18 month window before SimplePractice/Doctolib convergence is the defining strategic constraint. Speed is everything. Raise the maximum amount, hire aggressively, launch in 5 markets within 12 months, and build network effects that make the position defensible before well-funded competitors enter. Accept higher burn for faster market capture.',
    description: 'Raise €500-750K. Hire engineer (M1), community manager (M3), and part-time clinical advisor (M3). Burn: €15-18K/month. Simultaneous launch prep for France, Belgium, Switzerland. German and Spanish expansion by M8. Partner with training institutes across all markets. Aggressive conference presence. Target 5 live markets by M10. Series A by M15 at 3-5x step-up.',
    investment: '€500-750K seed raise',
    timeline: '22-28 months runway',
    expectedOutcome: [
      'M3: 25-30 practitioners (France), aggressive outreach',
      'M6: 80-100 practitioners across FR/BE/CH, €3-4K MRR',
      'M12: 200-250 practitioners across 5 markets, €8-10K MRR',
      'M15: Series A at 3-5x step-up (€8-15M valuation)',
      'Category ownership: "the European between-session care platform"',
    ],
    keyRisks: [
      'Higher burn = shorter runway = less room for pivots',
      'Speed may sacrifice product quality and retention',
      'Hiring at pre-revenue stage is expensive and risky',
      'If PMF is slower than expected, burn rate becomes existential',
      'Raising €500-750K pre-revenue in EU is challenging',
      'Team management complexity with 4-5 people before PMF',
    ],
    m12Revenue: '€8-10K MRR',
    m12Practitioners: '200-250',
    seriesATimeline: 'M12-M16',
    probabilityOfSuccess: '35%',
  },
]

// ── Priority Initiatives ────────────────────────────────────────────────

interface Initiative {
  rank: number
  title: string
  rationale: string
  owner: string
  timeline: string
  metric: string
  investment: string
  color: string
}

const INITIATIVES: Initiative[] = [
  {
    rank: 1,
    title: 'Close 10 paying practitioners in 90 days',
    rationale: 'Nothing else matters until money changes hands. Every strength (unit economics, AI, B2B2C architecture) is a hypothesis until validated by revenue. The 90-day window creates urgency. If this fails, pivot before burning more capital.',
    owner: 'Both founders',
    timeline: 'Day 1 → Day 90',
    metric: '10 practitioners paying €29/mo, <8% churn, NPS >30',
    investment: '€0 cash (100% founder time)',
    color: 'border-red-200 bg-red-50',
  },
  {
    rank: 2,
    title: 'Close seed round within 60 days',
    rationale: 'Fundraising is a full-time job that competes with sales. Every week spent fundraising is a week not spent acquiring practitioners. Target €350-450K. Minimum viable: €250K. Close fast, then redirect all energy to GTM.',
    owner: 'Lead founder',
    timeline: 'Day 1 → Day 60',
    metric: 'Term sheet signed, funds in bank',
    investment: 'Pipeline of 40+ investors, 15-20 meetings/week',
    color: 'border-amber-200 bg-amber-50',
  },
  {
    rank: 3,
    title: 'Hire first engineer',
    rationale: 'The two-person team bottleneck is a critical risk (R4, score 16). Every hour founders spend on engineering is an hour not spent on sales or fundraising. One senior full-stack engineer at €2.5K/month doubles product velocity and frees founders for GTM.',
    owner: 'CTO founder',
    timeline: 'Post-seed close → 30 days',
    metric: 'Engineer onboarded, first PR merged within 14 days',
    investment: '€2,500/month (€30K/year)',
    color: 'border-blue-200 bg-blue-50',
  },
  {
    rank: 4,
    title: 'Establish Clinical Advisory Board',
    rationale: 'No clinical advisor on the team is a high-severity weakness. Two advisors (one French psychologist, one EU health-tech regulatory expert) fill the credibility gap, de-risk AI safety, inform product development, and strengthen investor narrative. Cost: equity (0.25-0.5% each) + €500/month stipend.',
    owner: 'Both founders',
    timeline: 'Day 30 → Day 75',
    metric: '2 advisors signed, first meeting held, DPIA completed',
    investment: '0.5-1% equity + €1K/month',
    color: 'border-violet-200 bg-violet-50',
  },
  {
    rank: 5,
    title: 'Launch French content engine',
    rationale: 'SEO is the highest-ROI channel long-term (181x LTV/CAC) and compounds over time. Starting now means 500+ organic visits by M6 and 2,000+ by M12. Content = credibility + pipeline. Every blog post targeting "gestion cabinet psychologue" or "suivi patient entre séances" builds a moat competitors cannot buy.',
    owner: 'Content founder + AI assist',
    timeline: 'Day 14 → ongoing (1 post/week)',
    metric: '8 posts published in 60 days, 200+ organic visits by M3',
    investment: '€200/month (tooling + design)',
    color: 'border-emerald-200 bg-emerald-50',
  },
]

// ── Resource Requirements ───────────────────────────────────────────────

interface ResourceReq {
  category: string
  icon: typeof Users
  color: string
  items: { role: string; cost: string; when: string; why: string }[]
}

const RESOURCES: ResourceReq[] = [
  {
    category: 'People',
    icon: Users,
    color: 'text-blue-600',
    items: [
      { role: 'Full-stack engineer', cost: '€2,500/mo (€30K/yr)', when: 'M1 (post-seed)', why: 'Doubles product velocity. Frees founders for GTM. Addresses R4 (team bottleneck).' },
      { role: 'Clinical advisor (French psychologist)', cost: '0.25% equity + €500/mo', when: 'M1-M2', why: 'Product credibility, AI safety review, practitioner association introductions.' },
      { role: 'Regulatory advisor (EU health-tech)', cost: '0.25% equity + €500/mo', when: 'M2-M3', why: 'GDPR audit, AI Act prep, HDS consultation, DiGA pathway research.' },
      { role: 'German community manager (part-time)', cost: '€1,500/mo', when: 'M7-M8', why: 'German market entry. Localization quality assurance. DGPs/BDP outreach.' },
      { role: 'Customer success (part-time)', cost: '€1,500/mo', when: 'M9-M10', why: 'White-glove onboarding at scale. Retention. Churn prevention.' },
    ],
  },
  {
    category: 'Capital',
    icon: DollarSign,
    color: 'text-emerald-600',
    items: [
      { role: 'Seed round', cost: '€350-450K', when: 'M0 (immediate)', why: 'Runway for 28-33 months. Covers team, GTM, expansion, compliance.' },
      { role: 'Bpifrance Bourse French Tech', cost: '€30K (non-dilutive)', when: 'M2-M4 (apply)', why: 'Extends runway 3 months without dilution. Validates French institutional support.' },
      { role: 'EU innovation grants', cost: '€50-100K (non-dilutive)', when: 'M6-M12 (apply)', why: 'EIC Accelerator, Horizon Europe. Funds clinical evidence + German expansion.' },
    ],
  },
  {
    category: 'Tools & Infrastructure',
    icon: Layers,
    color: 'text-violet-600',
    items: [
      { role: 'Stripe (payments)', cost: '2.9% + €0.25/txn', when: 'Pre-launch', why: 'Multi-currency billing (EUR, CHF, GBP). Subscription management. Tax compliance.' },
      { role: 'LinkedIn Sales Navigator', cost: '€80/mo', when: 'Pre-launch', why: 'Targeted practitioner outreach. 287% higher reply rate vs. cold email.' },
      { role: 'HubSpot CRM (free tier)', cost: '€0', when: 'Pre-launch', why: 'Pipeline management. Investor tracking. Support tickets. Already integrated.' },
      { role: 'Penetration test', cost: '€3-5K (one-time)', when: 'M4-M6', why: 'Security validation. Addresses R14 (data breach risk). SOC 2 prep.' },
    ],
  },
]

// ── Decision Framework ──────────────────────────────────────────────────

interface DecisionCriteria {
  criterion: string
  weight: string
  description: string
  greenSignal: string
  redSignal: string
}

const DECISION_FRAMEWORK: DecisionCriteria[] = [
  {
    criterion: 'Does this accelerate time to 10 paying practitioners?',
    weight: '30%',
    description: 'Revenue validation is the single highest-priority objective. Every decision should be evaluated against its impact on closing the first 10 customers.',
    greenSignal: 'Directly creates or enables a practitioner conversion',
    redSignal: 'Nice-to-have that doesn\'t move the conversion needle',
  },
  {
    criterion: 'Does this reduce existential risk?',
    weight: '25%',
    description: 'Four critical risks (R1: slow adoption, R4: team bottleneck, R6: no PMF, R9: Series A gap) threaten company survival. Prioritize actions that directly mitigate these.',
    greenSignal: 'Addresses a critical (16) or high (12+) severity risk',
    redSignal: 'Addresses a medium/low risk that isn\'t urgent',
  },
  {
    criterion: 'Is this reversible if wrong?',
    weight: '15%',
    description: 'At pre-revenue, optionality is worth more than certainty. Prefer decisions that can be unwound in 2-4 weeks over those that lock the company into a path.',
    greenSignal: 'Can be reversed or abandoned with minimal sunk cost',
    redSignal: 'Creates long-term commitment (annual contracts, hires, entity setup)',
  },
  {
    criterion: 'Does the data support this?',
    weight: '15%',
    description: 'With 187 interviews and a live MVP, decisions should be grounded in observed behavior — not hypotheses. If no data exists, design the experiment first.',
    greenSignal: 'Based on user behavior, conversion data, or market evidence',
    redSignal: 'Based on founder intuition alone, without validation',
  },
  {
    criterion: 'Does this compound over time?',
    weight: '15%',
    description: 'The highest-ROI activities (SEO, referrals, network effects) compound. Choose actions that are 10% better each month over one-time efforts.',
    greenSignal: 'Creates an asset that grows in value (content, network, data)',
    redSignal: 'One-time effort with diminishing returns',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function StrategicRecommendationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Strategic Recommendation</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — CEO Strategy Brief, Q1 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── Confidential Banner ─────────────────────────────── */}
        <motion.div {...fadeUp()} className="bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Confidential</p>
              <p className="text-[9px] text-gray-500">Strategic Advisory — For CEO & Board Only</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-500">February 2026</p>
        </motion.div>

        {/* ── 1. Executive Summary ────────────────────────────── */}
        <motion.section {...fadeUp(0.03)}>
          <SectionTitle subtitle="3-paragraph strategic overview — 2-minute read">Executive Summary</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">The opportunity is real and time-bound.</span> Bloomsline operates in a $33B global
              digital mental health market growing at 18.6% CAGR, targeting a €166M European segment with zero direct competitors.
              The B2B2C architecture — where one practitioner sale yields 12-15 free members — creates unit economics (72.5x LTV/CAC,
              85% gross margin) that are structurally superior to any adjacent competitor. The B2C therapy model is collapsing
              (BetterHelp -11%, Woebot shutdown), and capital is migrating to practitioner-first models (Talkspace B2B +42% YoY).
              The EU regulatory landscape (GDPR, AI Act, DiGA) favors European-native builders. The window to own this category is 12-18 months
              before SimplePractice ($4B, Vista) or Doctolib (€6.4B) converge into the space.
            </p>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">The product is built. Revenue is not.</span> The MVP is complete and technically impressive:
              24+ API endpoints, 7 AI features (Claude Haiku/Sonnet), 3-language support, mobile app, real-time subscriptions.
              187 discovery interviews across 7 countries validate the problem. But every financial metric — LTV, CAC, churn, LTV/CAC — is projected,
              not observed. Two founders cover every function. There are no paying customers, no clinical evidence, and no engineering team beyond
              the founding pair. The gap between a well-built product and a viable business remains the central strategic challenge.
            </p>
            <p className="text-[11px] text-gray-700 leading-relaxed">
              <span className="font-bold text-gray-900">Our recommendation: Option B — Validated Expansion.</span> Raise €350-450K.
              Set a non-negotiable 90-day milestone: 10 paying practitioners or pivot positioning. Hire one engineer immediately post-seed
              to free founders for GTM. Expand to Belgium and Switzerland at M4-6 (zero localization cost) to prove multi-market viability.
              Begin German localization at M8. Target 120-150 practitioners across 3-4 markets by Month 12.
              This approach balances speed against capital preservation, creates a compelling Series A narrative,
              and maintains optionality to pivot if PMF is slower than modeled.
            </p>
          </div>
        </motion.section>

        {/* ── 2. Current State Assessment ─────────────────────── */}
        <motion.section {...fadeUp(0.08)}>
          <SectionTitle subtitle="Where the business stands today — an honest assessment">Current State Assessment</SectionTitle>

          {/* Situation snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Stage', value: 'Pre-revenue', sub: 'MVP complete, Q1 2026', color: 'text-amber-600' },
              { label: 'Revenue', value: '€0', sub: '0 paying customers', color: 'text-red-600' },
              { label: 'Team', value: '2 founders', sub: 'No employees', color: 'text-amber-600' },
              { label: 'Product', value: 'MVP live', sub: '24+ APIs, 7 AI endpoints', color: 'text-emerald-600' },
              { label: 'Validation', value: '187 interviews', sub: '68 practitioners, 7 countries', color: 'text-emerald-600' },
              { label: 'Funding', value: 'Seeking €250-500K', sub: 'Pre-seed / Seed', color: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                <p className={`text-sm font-bold ${item.color} mt-0.5`}>{item.value}</p>
                <p className="text-[9px] text-gray-400">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <h3 className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> What&apos;s Working
          </h3>
          <div className="space-y-2 mb-6">
            {CURRENT_STATE.strengths.map((s, i) => (
              <motion.div key={i} className="bg-white border border-emerald-100 rounded-xl p-4" {...fadeUp(0.1 + i * 0.02)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-[11px] font-bold text-gray-900">{s.label}</h4>
                  <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">{s.rating}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">{s.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Weaknesses */}
          <h3 className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> What Needs to Be Said
          </h3>
          <div className="space-y-2">
            {CURRENT_STATE.weaknesses.map((w, i) => (
              <motion.div key={i} className="bg-white border border-red-100 rounded-xl p-4" {...fadeUp(0.22 + i * 0.02)}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-[11px] font-bold text-gray-900">{w.label}</h4>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    w.severity === 'Critical' ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>{w.severity}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">{w.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 3. Strategic Options ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="Three distinct paths forward — with expected outcomes, costs, and risks">
            Strategic Options
          </SectionTitle>

          <div className="space-y-5">
            {OPTIONS.map((opt, i) => (
              <motion.div
                key={opt.id}
                className={`border ${opt.id === 'B' ? opt.borderColor + ' ring-2 ring-emerald-100' : 'border-gray-200'} rounded-xl overflow-hidden`}
                {...fadeUp(0.32 + i * 0.05)}
              >
                {/* Option header */}
                <div className={`${opt.bgColor} px-5 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-black ${opt.textColor}`}>Option {opt.id}</span>
                    <div>
                      <h3 className={`text-sm font-bold ${opt.textColor}`}>{opt.name}</h3>
                      <p className="text-[10px] text-gray-500">{opt.subtitle}</p>
                    </div>
                  </div>
                  {opt.id === 'B' && (
                    <span className="text-[9px] font-bold text-white bg-emerald-600 px-3 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  )}
                </div>

                <div className="bg-white p-5">
                  {/* Thesis */}
                  <p className="text-[10px] text-gray-600 leading-relaxed mb-4 italic border-l-2 border-gray-200 pl-3">
                    &ldquo;{opt.thesis}&rdquo;
                  </p>

                  {/* Description */}
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{opt.description}</p>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">Investment</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.investment}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">M12 Revenue</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.m12Revenue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">M12 Users</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.m12Practitioners}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-[8px] font-semibold text-gray-400 uppercase">Series A</p>
                      <p className="text-[11px] font-bold text-gray-800">{opt.seriesATimeline}</p>
                    </div>
                  </div>

                  {/* Outcomes + Risks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Expected Outcomes</p>
                      <div className="space-y-1">
                        {opt.expectedOutcome.map((o, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-emerald-700">{o}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-1.5">Key Risks</p>
                      <div className="space-y-1">
                        {opt.keyRisks.map((r, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[9px] text-red-700">{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Success probability */}
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-[9px] text-gray-400">Estimated probability of achieving Series A:</p>
                    <span className={`text-[10px] font-bold ${
                      opt.id === 'B' ? 'text-emerald-600' : opt.id === 'A' ? 'text-blue-600' : 'text-amber-600'
                    }`}>{opt.probabilityOfSuccess}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 4. Recommended Strategy ─────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle="Why Option B — and why now">Recommended Strategy</SectionTitle>

          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-800">Option B: Validated Expansion</h3>
                <p className="text-[10px] text-emerald-600">€350-450K raise, 3-4 markets in 12 months, Series A by M18</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { reason: 'Balances speed against capital preservation', detail: '28-33 months of runway provides 2 full pivots if needed, while €10-12K monthly burn supports one engineering hire and multi-market expansion. Option A is too slow for the window. Option C burns too fast for the validation stage.' },
                { reason: 'Multi-market traction is the Series A differentiator', detail: 'A French-only company with 80 practitioners is a lifestyle business. A 3-market company with 150 practitioners demonstrating B2B2C network effects across borders is a venture-scale opportunity. The Belgium/Switzerland expansion costs near-zero (French language) but multiplies the narrative.' },
                { reason: '90-day hard milestone creates accountability', detail: '10 paying practitioners by Day 90 — or pivot. This is the single most important gate. If the product cannot convert 10 practitioners in a market of 30,000 with founder-led sales, the problem is not the go-to-market. It is the product or the market.' },
                { reason: 'Maintains optionality for all scenarios', detail: 'If France exceeds expectations → accelerate to Option C velocity. If growth is slower → contract to Option A discipline. If PMF is absent → pivot or wind down with 18+ months of runway remaining. Option B is the only strategy that keeps all three doors open.' },
              ].map((r, i) => (
                <div key={i} className="bg-white/70 rounded-lg p-3.5">
                  <h4 className="text-[11px] font-bold text-emerald-800 mb-1">{r.reason}</h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>

            {/* What Option B is NOT */}
            <div className="bg-white/50 rounded-lg p-3.5 border border-emerald-100">
              <p className="text-[9px] font-semibold text-emerald-800 uppercase tracking-wider mb-2">What This Strategy Is Not</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'Not "move slow" — 90-day deadline is aggressive',
                  'Not "spend everything" — 28-33 months of runway',
                  'Not "France forever" — Belgium/Switzerland by M6',
                  'Not "hope for the best" — hard gates at M3, M6, M12',
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Crosshair className="w-3 h-3 text-emerald-500 shrink-0" />
                    <p className="text-[10px] text-emerald-700">{n}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 5. Priority Initiatives (90 days) ──────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <SectionTitle subtitle="The 5 highest-impact actions for the next 90 days — ranked">
            Priority Initiatives
          </SectionTitle>

          <div className="space-y-3">
            {INITIATIVES.map((init, i) => (
              <motion.div
                key={init.rank}
                className={`bg-white border ${init.color.split(' ')[0]} rounded-xl p-5`}
                {...fadeUp(0.57 + i * 0.03)}
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-xl ${init.color.split(' ')[1]} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-black ${init.color.split(' ')[0].replace('border-', 'text-').replace('-200', '-700')}`}>
                      {init.rank}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">{init.title}</h4>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">{init.rationale}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">Owner</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.owner}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">Timeline</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.timeline}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">Success Metric</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.metric}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[8px] font-semibold text-gray-400 uppercase">Investment</p>
                        <p className="text-[10px] font-semibold text-gray-700">{init.investment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Resource Requirements ────────────────────────── */}
        <motion.section {...fadeUp(0.7)}>
          <SectionTitle subtitle="People, capital, and tools needed to execute Option B">
            Resource Requirements
          </SectionTitle>

          <div className="space-y-4">
            {RESOURCES.map((res, i) => {
              const ResIcon = res.icon
              return (
                <motion.div key={res.category} className="bg-white border border-gray-200 rounded-xl p-5" {...fadeUp(0.72 + i * 0.03)}>
                  <div className="flex items-center gap-2 mb-4">
                    <ResIcon className={`w-4 h-4 ${res.color}`} />
                    <h3 className="text-sm font-bold text-gray-900">{res.category}</h3>
                  </div>
                  <div className="space-y-2">
                    {res.items.map((item, j) => (
                      <div key={j} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <span className="text-[10px] font-semibold text-gray-700">{item.role}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-bold text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">{item.cost}</span>
                            <span className="text-[9px] text-gray-400">{item.when}</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500">{item.why}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 7. Decision Framework ──────────────────────────── */}
        <motion.section {...fadeUp(0.8)}>
          <SectionTitle subtitle="A simple matrix for making the next 10 strategic decisions">
            Decision Framework
          </SectionTitle>

          <p className="text-[10px] text-gray-500 mb-4 leading-relaxed">
            For every strategic decision over the next 12 months, score it against these 5 criteria.
            If total score is below 60%, do not proceed. If above 80%, act immediately.
          </p>

          <div className="space-y-3">
            {DECISION_FRAMEWORK.map((d, i) => (
              <motion.div key={i} className="bg-white border border-gray-200 rounded-xl p-4" {...fadeUp(0.82 + i * 0.025)}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-[11px] font-bold text-gray-900">{d.criterion}</h4>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                    Weight: {d.weight}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-3">{d.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-emerald-700 mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Green Signal
                    </p>
                    <p className="text-[9px] text-emerald-600">{d.greenSignal}</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-red-700 mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Red Signal
                    </p>
                    <p className="text-[9px] text-red-600">{d.redSignal}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 8. "If I Only Had 1 Hour" Brief ────────────────── */}
        <motion.section {...fadeUp(0.95)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4.5 h-4.5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold">If I Only Had 1 Hour</h2>
                <p className="text-[10px] text-gray-400">The single most important insight and action</p>
              </div>
            </div>

            {/* The Insight */}
            <div className="bg-white/10 rounded-lg p-5 mb-5">
              <p className="text-[9px] font-semibold text-amber-300 uppercase tracking-wider mb-2">The Insight</p>
              <p className="text-sm text-white font-semibold leading-relaxed mb-3">
                Bloomsline has built a structurally superior product in a market with zero direct competitors
                and favorable timing. The only question that matters is whether practitioners will pay for it.
              </p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Every other question — expansion strategy, team scaling, regulatory compliance, competitive positioning —
                is downstream of this one. The 72.5x LTV/CAC ratio, the EU regulatory moat, the Care Network Effect, the
                $33B TAM — all of it is a hypothesis until the first 10 practitioners pay €29/month and continue paying
                the following month. Woebot raised $123M and had Stanford-published RCTs. They still failed. The product
                is not the hard part. Converting the first dollar of recurring revenue is the hard part.
              </p>
            </div>

            {/* The Action */}
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-5 mb-5">
              <p className="text-[9px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">The Action</p>
              <p className="text-sm text-white font-semibold leading-relaxed mb-3">
                Tomorrow morning, message 10 practitioners from your interview pool. Offer them the product at €29/month.
                Not a free trial. Not a demo. A paid subscription. Today.
              </p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                You have 187 interviews. At least 20-30 of those practitioners expressed strong interest. They have seen
                the product. They know the founders. The barrier to asking for money is psychological, not strategic.
                If 3 out of 10 say yes, you have product-market signal. If 0 out of 10 say yes, you have the most
                valuable data point in the company&apos;s history — and you got it before spending any investor capital.
              </p>
            </div>

            {/* The Logic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">If 3+ say yes</p>
                <p className="text-[10px] text-emerald-300 font-semibold">PMF signal confirmed</p>
                <p className="text-[9px] text-gray-500 mt-1">Raise seed with confidence. Execute Option B.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">If 1-2 say yes</p>
                <p className="text-[10px] text-amber-300 font-semibold">Signal but not conviction</p>
                <p className="text-[9px] text-gray-500 mt-1">Iterate on pricing or positioning. Try 10 more.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <p className="text-[9px] font-semibold text-gray-400 uppercase mb-1">If 0 say yes</p>
                <p className="text-[10px] text-red-300 font-semibold">Critical data point</p>
                <p className="text-[9px] text-gray-500 mt-1">Understand why before raising. This saves you 6 months.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <motion.div {...fadeUp(1.0)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Confidential — Strategic Advisory — February 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

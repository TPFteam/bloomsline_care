'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Target,
  AlertTriangle,
  Zap,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lightbulb,
  Users,
  DollarSign,
  Building2,
  Brain,
  Globe,
  Lock,
  Clock,
  ChevronRight,
  Layers,
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

function ForceBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}/10</span>
    </div>
  )
}

// ── SWOT Data ────────────────────────────────────────────────────────────

const STRENGTHS = [
  {
    title: 'Exceptional unit economics at pre-revenue stage',
    evidence: 'LTV/CAC of 25-50x (target >3x). €50 CAC per practitioner, each bringing 12-15 members at zero incremental cost. Effective member CAC: €3.33 vs €30-50 for B2C apps. Payback period: 2.4 months. 90% gross margin.',
    rating: 'Critical',
  },
  {
    title: 'Unique B2B2C architecture — no competitor has both sides',
    evidence: 'SimplePractice has 237K practitioners but no member app. Headspace has 80M downloads but no practitioner tools. BetterHelp has both sides but commoditizes therapists. Bloomsline is the only platform where the practitioner controls the care relationship AND the member has an AI companion.',
    rating: 'Critical',
  },
  {
    title: 'Care Network Effect creates organic distribution',
    evidence: '1 practitioner sale → 12-15 members for free (base case). Over time, each practitioner brings 20-50 members as their caseload rotates. Members can\'t churn the practitioner out — they\'re locked into the care relationship. Word-of-mouth flows through supervision groups and conferences.',
    rating: 'Critical',
  },
  {
    title: 'AI-native from day one — not bolted on',
    evidence: 'Bloom AI (Claude Haiku/Sonnet) is embedded in every workflow: notes generation, pattern detection, between-session companion, session summaries. Cost-optimized at ~€1.80/practitioner/month. 7 dedicated AI endpoints. This isn\'t a feature — it\'s the architecture.',
    rating: 'High',
  },
  {
    title: 'GDPR-native and EU AI Act-ready by design',
    evidence: 'AES-256-GCM encryption, Row Level Security on every table, EU-hosted analytics (PostHog), Supabase with EU region. Built for GDPR compliance from the first line of code, not retrofitted. EU AI Act high-risk compliance deadline is Aug 2026 — Bloomsline is already aligned.',
    rating: 'High',
  },
  {
    title: 'Deep domain validation: 187 interviews across 7 countries',
    evidence: '68 practitioners and 119+ users interviewed. Previous product (Doctalink) taught the team what practitioners don\'t want (another profile directory). The pivot to between-session care was informed by practitioner pain, not founder assumption.',
    rating: 'High',
  },
  {
    title: 'Full-stack founder execution — no outsourced development',
    evidence: 'Entire platform built by founding team: Next.js 16, React 19, Supabase, Expo mobile app, 24+ API endpoints, 3-language i18n (EN/FR/ES), AI engine with Anthropic Claude. No agency dependency, no code debt from outsourcing.',
    rating: 'Medium',
  },
]

const WEAKNESSES = [
  {
    title: 'Pre-revenue with zero paying customers',
    assessment: 'MVP is complete but there are no paying practitioners yet. The financial model is entirely projected. LTV/CAC ratios, churn assumptions, and growth rates are modeled, not observed. Willingness-to-pay is validated through interviews, not transactions.',
    severity: 'Critical',
  },
  {
    title: 'Two-person team limits execution bandwidth',
    assessment: 'Two founders covering product, engineering, sales, marketing, design, support, and fundraising. No clinical advisor on the team. Hiring plan deferred to post-seed. If one founder is unavailable, the entire operation stalls.',
    severity: 'High',
  },
  {
    title: 'No clinical validation or outcomes data',
    assessment: 'No published clinical evidence that between-session engagement via Bloomsline improves therapeutic outcomes. Woebot had 5+ RCTs and still failed commercially. Investors increasingly expect evidence-based claims. DiGA pathway (Germany) requires clinical evidence.',
    severity: 'High',
  },
  {
    title: 'Single-market dependency (France)',
    assessment: 'Go-to-market is France-first with no current presence in other EU markets. French mental health market has specific dynamics (MonParcoursPsy reimbursement rates, professional associations). Expansion to Belgium/Switzerland is Phase 3 (M13-18).',
    severity: 'Medium',
  },
  {
    title: 'Practitioner technology adoption is historically slow',
    assessment: 'APA data shows only 5% of therapists currently use AI in practice, though 55% express interest. Behavioral health is among the slowest healthcare segments to adopt new technology. Solo practitioners (core ICP) have the least time to evaluate new tools.',
    severity: 'Medium',
  },
  {
    title: 'Revenue model dependent on a single low price point',
    assessment: '€25/mo single-tier pricing. No enterprise pricing validated. No upsell path beyond the base subscription. B2C premium (€3/mo, 5-8% conversion) is a rounding error, not a revenue engine. If €25/mo proves too low for unit economics at scale, raising prices post-acquisition is painful.',
    severity: 'Medium',
  },
  {
    title: 'Platform risk: dependency on Supabase and Anthropic Claude',
    assessment: 'Core infrastructure depends on Supabase (database, auth, real-time) and Anthropic (AI engine). A Supabase outage = full platform outage. Anthropic API pricing changes directly impact gross margin. No fallback AI provider implemented.',
    severity: 'Medium',
  },
]

const OPPORTUNITIES = [
  {
    title: 'EU regulatory infrastructure creating structural moat for European-native builders',
    detail: 'EU AI Act (Aug 2026 compliance), EHDS (health data standardization), France MonParcoursPsy (reimbursed sessions), Germany DiGA (~60 apps, 45% mental health). US competitors need years to achieve regulatory parity.',
    timing: 'Now → 3yr',
    size: 'Very Large',
  },
  {
    title: 'B2C therapy marketplace collapse opening B2B2C window',
    detail: 'BetterHelp revenue -11% Q1 2025. Talkspace pivoting to payor revenue (+42% YoY). Woebot shut down June 2025. The D2C model is structurally broken — capital and talent are moving toward practitioner-first models.',
    timing: 'Now',
    size: 'Large',
  },
  {
    title: 'Therapist burnout crisis creating urgent demand for admin-reducing tools',
    detail: '93% of behavioral health workers report burnout. 29% considering leaving the field. 1/3 spend most of their time on admin. AI scribes saving 12-15 hrs/month. The pain is acute and the willingness to try new tools is at an all-time high.',
    timing: 'Now',
    size: 'Large',
  },
  {
    title: 'Germany DiGA pathway as future insurance-reimbursed revenue stream',
    detail: '~60 digital health apps prescribable with insurance reimbursement. €200-500 per 90-day prescription. 45% target mental health. If Bloomsline demonstrates clinical outcomes, a DiGA listing transforms the business model in Germany.',
    timing: '2-4yr',
    size: 'Very Large',
  },
  {
    title: 'SimplePractice (Vista, $4B) focused on US — EU white space completely open',
    detail: 'SimplePractice has 237K practitioners but zero EU presence. Doctolib is booking, not care. Moka.care serves enterprises only. There is literally no AI-native, practitioner-focused mental health SaaS in Europe.',
    timing: 'Now → 2yr',
    size: 'Large',
  },
  {
    title: 'Measurement-based care demand rising while <20% of clinicians track outcomes',
    detail: 'Insurance payers and governments demanding measurable outcomes. Only 20% of behavioral health clinicians implement MBC. The gap between demand (payers) and supply (practitioners without tools) is Bloomsline\'s product-market fit.',
    timing: '1-3yr',
    size: 'Medium',
  },
  {
    title: 'Training institute partnerships for distribution at scale',
    detail: 'France produces 5,000+ new psychologists annually (21% YoY growth in practitioners). Partnerships with AFTCC, IFFORTHECC, IRCCADE, Asadis could make Bloomsline the default tool for newly certified practitioners — capturing them before they form habits.',
    timing: '6mo → 2yr',
    size: 'Medium',
  },
]

const THREATS = [
  {
    title: 'SimplePractice/Vista evolves into a platform play',
    detail: 'Vista paid $4B. They\'re acquiring (Luminello), hiring (Head of Payer Partnerships), and building AI-enabled multi-sided solutions. If they add a member app and EU expansion simultaneously, they could close Bloomsline\'s window in 18-24 months.',
    severity: 'High',
    probability: 'Medium',
  },
  {
    title: 'Doctolib adds between-session engagement features',
    detail: '80M patients, 400K practitioners, €348M ARR, €6.4B valuation. Dominant EU booking platform. If Doctolib decides to add care features, they have the distribution to make it work. Their product DNA is admin, not care — but resources can overcome DNA.',
    severity: 'High',
    probability: 'Low-Medium',
  },
  {
    title: 'French HDS (Hébergeur de Données de Santé) compliance requirement',
    detail: 'France may require HDS certification for health data storage. Supabase is not HDS-certified. Migration to OVHcloud or Scalingo would cost 3-6 months of engineering time and increase infrastructure costs significantly.',
    severity: 'Medium',
    probability: 'Medium',
  },
  {
    title: 'AI regulation restricts clinical AI features before they generate value',
    detail: 'EU AI Act classifies mental health AI as high-risk. Conformity assessments, ongoing monitoring, and documentation requirements could add €50-100K in compliance costs. If Bloom AI is classified as a medical device, the regulatory burden multiplies.',
    severity: 'Medium',
    probability: 'Medium',
  },
  {
    title: 'Practitioner adoption slower than modeled — runway exhaustion',
    detail: 'Financial model assumes 20-30% MoM growth from 10 practitioners. If growth is 10-15% MoM, the runway math changes dramatically. At €8.7K/month burn, €300K cash = 34 months — but without revenue traction, Series A becomes impossible.',
    severity: 'High',
    probability: 'Medium',
  },
  {
    title: 'Anthropic pricing increase or API access changes',
    detail: 'Claude Haiku costs ~€1.80/practitioner/month today. If Anthropic raises prices 3-5x (as OpenAI has done), AI costs become 20-30% of ARPU. No fallback provider implemented. Switching AI providers would require rewriting prompt engineering.',
    severity: 'Medium',
    probability: 'Low',
  },
  {
    title: 'Open-source or free AI tools commoditize the AI advantage',
    detail: 'Meta Llama, Mistral, and other open-source models are approaching Claude quality. If practitioners can get "good enough" AI notes from a free tool or built into their existing EHR, Bloomsline\'s AI advantage erodes to the between-session engagement layer only.',
    severity: 'Medium',
    probability: 'Medium-High',
  },
]

// ── Cross Analysis ───────────────────────────────────────────────────────

const SO_STRATEGIES = [
  {
    strength: 'B2B2C architecture + Care Network Effect',
    opportunity: 'EU white space + B2C collapse',
    strategy: 'Land Marie (solo practitioner) in France, let the Care Network Effect do the expansion. Each practitioner brings 12-15 members; each member who recommends therapy to a friend creates a new potential practitioner lead. Own the French market before anyone else enters.',
    priority: 'P0',
  },
  {
    strength: 'AI-native architecture (€1.80/user/mo)',
    opportunity: 'Therapist burnout crisis + AI scribe demand',
    strategy: 'Lead with AI notes as the acquisition hook — the feature that gets Marie to sign up in 10 minutes. Once she\'s generating notes with AI, expand to between-session care as the retention feature. The wedge is admin reduction; the moat is engagement.',
    priority: 'P0',
  },
  {
    strength: 'GDPR-native compliance posture',
    opportunity: 'EU AI Act + EHDS creating regulatory moat',
    strategy: 'Position compliance as a feature, not a constraint. "Built in Europe, for Europe, under European rules." Use EU AI Act readiness in investor materials and practitioner marketing. This is a 3-5 year structural advantage over US entrants.',
    priority: 'P1',
  },
  {
    strength: '187 interviews + domain expertise',
    opportunity: 'Training institute partnerships',
    strategy: 'Use interview-backed insights to create clinical education content (e.g., "Between-Session Engagement: What the Research Shows"). Partner with AFTCC, IFFORTHECC to offer Bloomsline as the recommended tool for newly certified practitioners. Capture them before habits form.',
    priority: 'P1',
  },
]

const WT_RISKS = [
  {
    weakness: 'Pre-revenue with zero paying customers',
    threat: 'Practitioner adoption slower than modeled',
    risk: 'If the first 10 paying practitioners take 6 months instead of 3, the entire financial model shifts. Seed investors see no traction signal. Series A becomes unreachable. The burn rate doesn\'t change but the timeline to PMF doubles.',
    mitigation: 'Set hard milestone: 10 paying practitioners within 90 days of launch or pivot pricing/positioning. Keep burn under €8K/mo. Don\'t hire until PMF signal (30 practitioners, <5% monthly churn).',
    severity: 'Critical',
  },
  {
    weakness: 'Two-person team',
    threat: 'SimplePractice/Vista evolves into platform play',
    risk: 'Vista can deploy 50 engineers to build a member app in 6 months. Two founders can\'t match feature velocity. If SimplePractice launches in EU before Bloomsline has 200+ practitioners, the network effect window closes.',
    mitigation: 'Don\'t compete on features — compete on care quality and local market fit. SimplePractice will build a generic EU product; Bloomsline builds a French-first product with AFTCC partnerships and MonParcoursPsy optimization.',
    severity: 'High',
  },
  {
    weakness: 'No clinical validation data',
    threat: 'AI regulation restricts features before they generate value',
    risk: 'If EU AI Act classifies Bloom AI as a medical device (high-risk), and Bloomsline has no clinical evidence, the conformity assessment could take 12-18 months and €100K+. Meanwhile, competitors with clinical data (Wysa has NHS validation) advance.',
    mitigation: 'Begin informal clinical measurement from Day 1 (PHQ-9/GAD-7 at onboarding + monthly). Partner with a university psychology department for a pilot study by Month 12. Position Bloom AI as "decision support for practitioners" (lighter regulatory pathway).',
    severity: 'High',
  },
  {
    weakness: 'Single revenue price point (€25/mo)',
    threat: 'Anthropic pricing increase + open-source commoditization',
    risk: 'If AI costs rise 3x (€5.40/user/mo) while open-source alternatives commoditize the AI advantage, the €25/mo price point leaves only €10-12/mo for everything else. Margin compression makes the business unsustainable at current pricing.',
    mitigation: 'Build pricing headroom now: test €35-45/mo tiers with expanded features. Implement Claude fallback on Mistral/Llama for non-critical AI tasks. Keep the AI cost structure flexible with model routing.',
    severity: 'Medium',
  },
]

// ── Porter's Five Forces ─────────────────────────────────────────────────

const FORCES = [
  {
    name: 'Supplier Power',
    score: 4,
    verdict: 'Low-Moderate',
    color: 'bg-emerald-500',
    icon: Layers,
    summary: 'Few critical suppliers, but switching costs are manageable',
    suppliers: [
      { name: 'Anthropic (Claude AI)', power: 'Medium', detail: 'Primary AI provider. Cost: ~€1.80/user/mo. Switching to OpenAI or Mistral is possible but requires prompt re-engineering (2-4 weeks). No contractual lock-in. Open-source alternatives (Llama, Mistral) provide downward pricing pressure.' },
      { name: 'Supabase (Database/Auth)', power: 'Medium', detail: 'Core infrastructure. PostgreSQL underneath is portable. Auth and real-time subscriptions create moderate switching cost (4-8 weeks migration). Self-hosted Supabase is an option.' },
      { name: 'Vercel (Hosting)', power: 'Low', detail: 'Next.js deployer. Easily replaced by AWS, Fly.io, Railway. No data lock-in. Standard deployment patterns.' },
      { name: 'Expo (Mobile)', power: 'Low', detail: 'React Native framework. App is portable to bare React Native if needed. No proprietary lock-in beyond push notification service.' },
    ],
    bloomsline: 'Supplier power is contained. The highest-risk supplier is Anthropic (AI costs could rise), but open-source LLMs provide a strategic fallback. Supabase is portable at the PostgreSQL level. No single supplier has monopoly leverage.',
  },
  {
    name: 'Buyer Power',
    score: 6,
    verdict: 'Moderate-High',
    color: 'bg-amber-500',
    icon: Users,
    summary: 'Solo practitioners are price-sensitive but have few alternatives in EU',
    suppliers: [
      { name: 'Solo practitioners (Marie — P0)', power: 'Medium-High', detail: 'Price-sensitive (€45-65K income). Low switching costs — can cancel monthly. BUT: few alternatives in EU (no SimplePractice, no between-session tools). Switching back to spreadsheets is always an option. Each practitioner is individually small but collectively they ARE the market.' },
      { name: 'Group practice directors (Thomas — P1)', power: 'Medium', detail: 'Larger spend (€20-25/practitioner/mo × 3-8 seats). Longer decision cycle but higher lock-in once adopted. Needs ROI justification. More likely to negotiate volume discounts. Switching costs higher (data migration, team retraining).' },
      { name: 'Members (Lea, Sophie — B2C)', power: 'Low', detail: 'Members pay nothing (free via practitioner). They have zero buyer power because they\'re not buyers. Their engagement determines practitioner retention — so they have indirect power over churn but no pricing leverage.' },
    ],
    bloomsline: 'Buyer power is the primary force to manage. At €25/mo with monthly billing, the switching cost is near zero. Defense: make the data generated on the platform (session notes, client engagement history, outcome trends) the irreplaceable asset. The more data accumulated, the higher the switching cost.',
  },
  {
    name: 'Competitive Rivalry',
    score: 3,
    verdict: 'Low',
    color: 'bg-emerald-500',
    icon: Target,
    summary: 'No direct competitor in the "between-session care" category in EU',
    suppliers: [
      { name: 'Direct rivals (between-session care + AI + EU)', power: 'None', detail: 'Zero direct competitors occupy the intersection of: practitioner SaaS + member app + AI companion + European market. This is the key finding from competitive analysis.' },
      { name: 'Adjacent: Practice management (SimplePractice, Doctolib)', power: 'Low-Indirect', detail: 'SimplePractice is US-only, Doctolib is booking-only. Neither has between-session engagement. They could evolve but haven\'t yet. Jane App is Canadian/UK focused.' },
      { name: 'Adjacent: Wellness apps (Headspace, Calm, Wysa)', power: 'Low-Indirect', detail: 'Consumer apps with no practitioner connection. BetterHelp collapsing (-11% YoY). Woebot shut down. They compete for consumer attention but not for practitioner budgets.' },
      { name: 'Adjacent: Enterprise (Spring Health, Lyra Health)', power: 'Very Low', detail: 'Sell to HR departments, not practitioners. Different buyer, different product, different market. Spring Health at $3.3B doesn\'t serve solo practitioners.' },
    ],
    bloomsline: 'This is Bloomsline\'s strongest force. The "between-session care platform" category barely exists. Competition is fragmented across adjacent categories that each miss a critical piece. The risk isn\'t current rivals — it\'s future convergence from SimplePractice or Doctolib. Speed to 200+ practitioners creates defensible network effects before convergence happens.',
  },
  {
    name: 'Threat of Substitution',
    score: 7,
    verdict: 'Moderate-High',
    color: 'bg-red-500',
    icon: AlertTriangle,
    summary: 'Substitutes are weak individually but "do nothing" is the strongest competitor',
    suppliers: [
      { name: '"Do nothing" — pen, paper, spreadsheets', power: 'High', detail: 'The most dangerous substitute. 80%+ of French solo practitioners manage between-session care with paper notes or nothing at all. The cost is zero. The inertia is massive. Bloomsline must prove that "5-8 hrs/week on admin" is a solvable problem, not an inherent cost of practice.' },
      { name: 'Generic tools (WhatsApp, Google Docs, Notion)', power: 'Medium', detail: 'Many practitioners text clients via WhatsApp or share Google Docs for homework. Free, familiar, already on the phone. Not GDPR-compliant for health data, but practitioners often don\'t know or care. Hard to displace "good enough."' },
      { name: 'Free AI chatbots (ChatGPT, Claude.ai directly)', power: 'Medium', detail: 'Members can use ChatGPT for self-reflection without Bloomsline. Free, always available. But: not connected to their therapist, no care context, no clinical safeguards. The substitute is real for "AI conversation" but weak for "connected care."' },
      { name: 'Meditation/wellness apps (Headspace, Calm)', power: 'Low', detail: 'Different value proposition. These substitute for general wellness, not between-session therapeutic care. Headspace doesn\'t know your therapist or care plan.' },
    ],
    bloomsline: 'Substitution threat is real but beatable. The key defense is making the practitioner-member connection the product — not just the AI, not just the notes, but the visible link between what happens in session and what happens between sessions. "Do nothing" is beaten by demonstrating that clients who use Bloomsline show up more consistently and progress faster.',
  },
  {
    name: 'Threat of New Entry',
    score: 5,
    verdict: 'Moderate',
    color: 'bg-amber-500',
    icon: Globe,
    summary: 'Low technical barriers, but regulatory + distribution moats are real',
    suppliers: [
      { name: 'Technical barriers', power: 'Low', detail: 'Building a basic therapy notes + scheduling app is a 3-6 month project. AI integration is commodity via API. The technology is not the moat.' },
      { name: 'Regulatory barriers (EU)', power: 'Medium-High', detail: 'GDPR compliance, EU AI Act high-risk classification, potential HDS certification (France), DiGA pathway (Germany). Each adds 6-12 months and €50-100K for a US entrant. This is a real barrier.' },
      { name: 'Distribution barriers', power: 'Medium', detail: 'Solo practitioners discover tools through peer networks, conferences, and supervision groups — not app stores. Building trust with AFTCC, local supervision groups, and training institutes takes 12-24 months. Network effects compound once 50+ practitioners in a region.' },
      { name: 'Capital barriers', power: 'Low', detail: 'A well-funded startup could enter with €1-2M. VC interest in mental health is high. The barrier is not capital but product-market insight and local distribution.' },
    ],
    bloomsline: 'New entry is a medium threat. Any well-funded team could build the technology in 6 months. The defense is: (1) regulatory head start (GDPR-native, EU AI Act ready), (2) distribution network in French practitioner communities, and (3) Care Network Effect — once 100+ practitioners are on the platform with 1,200+ members, the data moat and referral loop become very hard to replicate.',
  },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function SwotAnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">SWOT & Porter&apos;s Five Forces</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Strategic Analysis, Q1 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── Hero ──────────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Strategic position: right product, right market, pre-traction.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Bloomsline is a pre-revenue B2B2C platform entering a $33B market with no direct competitor in its category (between-session care + AI + EU). The strategic challenge is not
            differentiation — it&apos;s execution speed. The window is 12-18 months before adjacent players converge.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Low competitive rivalry (3/10)</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">Moderate buyer power (6/10)</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">"Do nothing" is the real competitor</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">EU regulation = structural moat</span>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════
            PART 1: SWOT ANALYSIS
           ══════════════════════════════════════════════════════════ */}

        {/* ── SWOT 2x2 Visual ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="Internal capabilities vs. external environment">SWOT Overview</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-emerald-700">Strengths</h3>
              </div>
              <ul className="space-y-1">
                {STRENGTHS.map((s, i) => (
                  <li key={i} className="text-[10px] text-emerald-600 flex items-start gap-1">
                    <span className="text-emerald-400 shrink-0">+</span>
                    <span className="line-clamp-1">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-xs font-bold text-red-600">Weaknesses</h3>
              </div>
              <ul className="space-y-1">
                {WEAKNESSES.map((w, i) => (
                  <li key={i} className="text-[10px] text-red-500 flex items-start gap-1">
                    <span className="text-red-300 shrink-0">-</span>
                    <span className="line-clamp-1">{w.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-blue-700">Opportunities</h3>
              </div>
              <ul className="space-y-1">
                {OPPORTUNITIES.map((o, i) => (
                  <li key={i} className="text-[10px] text-blue-600 flex items-start gap-1">
                    <span className="text-blue-400 shrink-0">+</span>
                    <span className="line-clamp-1">{o.title}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-amber-600">Threats</h3>
              </div>
              <ul className="space-y-1">
                {THREATS.map((t, i) => (
                  <li key={i} className="text-[10px] text-amber-600 flex items-start gap-1">
                    <span className="text-amber-400 shrink-0">!</span>
                    <span className="line-clamp-1">{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.section>

        {/* ── Strengths Detail ─────────────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="7 internal advantages with evidence">Strengths</SectionTitle>
          <div className="space-y-3">
            {STRENGTHS.map((s, i) => (
              <motion.div
                key={i}
                className="bg-white border border-emerald-200 rounded-xl p-4"
                {...fadeUp(0.12 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-bold text-gray-900">{s.title}</h4>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    s.rating === 'Critical' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    s.rating === 'High' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {s.rating}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed pl-5.5">{s.evidence}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Weaknesses Detail ────────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="7 internal limitations — honest assessment">Weaknesses</SectionTitle>
          <div className="space-y-3">
            {WEAKNESSES.map((w, i) => (
              <motion.div
                key={i}
                className="bg-white border border-red-200 rounded-xl p-4"
                {...fadeUp(0.32 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <h4 className="text-xs font-bold text-gray-900">{w.title}</h4>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    w.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    w.severity === 'High' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {w.severity}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed pl-5.5">{w.assessment}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Opportunities Detail ─────────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle="7 external factors to exploit">Opportunities</SectionTitle>
          <div className="space-y-3">
            {OPPORTUNITIES.map((o, i) => (
              <motion.div
                key={i}
                className="bg-white border border-blue-200 rounded-xl p-4"
                {...fadeUp(0.52 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <h4 className="text-xs font-bold text-gray-900">{o.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-medium text-gray-400">{o.timing}</span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                      o.size === 'Very Large' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      o.size === 'Large' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {o.size}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed pl-5.5">{o.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Threats Detail ───────────────────────────────────── */}
        <motion.section {...fadeUp(0.7)}>
          <SectionTitle subtitle="7 external factors that could harm us">Threats</SectionTitle>
          <div className="space-y-3">
            {THREATS.map((t, i) => (
              <motion.div
                key={i}
                className="bg-white border border-amber-200 rounded-xl p-4"
                {...fadeUp(0.72 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <h4 className="text-xs font-bold text-gray-900">{t.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                      t.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {t.severity}
                    </span>
                    <span className="text-[9px] text-gray-400">P: {t.probability}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed pl-5.5">{t.detail}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Cross-Analysis ───────────────────────────────────── */}
        <motion.section {...fadeUp(0.85)}>
          <SectionTitle subtitle="Match strengths to opportunities (SO) and identify threat-weakness risks (WT)">Cross-Analysis</SectionTitle>

          <h3 className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> SO Strategies — Strengths x Opportunities
          </h3>
          <div className="space-y-3 mb-8">
            {SO_STRATEGIES.map((s, i) => (
              <motion.div
                key={i}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-5"
                {...fadeUp(0.87 + i * 0.04)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                    s.priority === 'P0' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{s.priority}</span>
                  <h4 className="text-xs font-bold text-gray-900">{s.strategy.split('.')[0]}.</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-emerald-600 mb-0.5">Strength</p>
                    <p className="text-[10px] text-gray-600">{s.strength}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-blue-600 mb-0.5">Opportunity</p>
                    <p className="text-[10px] text-gray-600">{s.opportunity}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">{s.strategy}</p>
              </motion.div>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> WT Risks — Weaknesses x Threats
          </h3>
          <div className="space-y-3">
            {WT_RISKS.map((r, i) => (
              <motion.div
                key={i}
                className="bg-red-50 border border-red-200 rounded-xl p-5"
                {...fadeUp(1.0 + i * 0.04)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                    r.severity === 'Critical' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>{r.severity}</span>
                  <h4 className="text-xs font-bold text-gray-900">{r.weakness} + {r.threat.split('/')[0]}</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-red-500 mb-0.5">Weakness</p>
                    <p className="text-[10px] text-gray-600">{r.weakness}</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-[9px] font-semibold text-amber-600 mb-0.5">Threat</p>
                    <p className="text-[10px] text-gray-600">{r.threat}</p>
                  </div>
                </div>
                <p className="text-[10px] text-red-700 leading-relaxed mb-2"><span className="font-semibold">Risk:</span> {r.risk}</p>
                <div className="bg-white/60 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-emerald-700 leading-relaxed"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════════
            PART 2: PORTER'S FIVE FORCES
           ══════════════════════════════════════════════════════════ */}

        {/* ── Forces Overview ──────────────────────────────────── */}
        <motion.section {...fadeUp(1.15)}>
          <SectionTitle subtitle="Industry structure analysis — how attractive is this market to operate in?">Porter&apos;s Five Forces</SectionTitle>

          {/* Visual summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              {FORCES.map((force) => {
                const Icon = force.icon
                return (
                  <div key={force.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-800">{force.name}</span>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        force.score <= 4 ? 'bg-emerald-50 text-emerald-700' :
                        force.score <= 6 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {force.verdict}
                      </span>
                    </div>
                    <ForceBar score={force.score} color={force.color} />
                  </div>
                )
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">Overall Industry Attractiveness</p>
                  <p className="text-[10px] text-gray-400">Average force intensity: {(FORCES.reduce((a, f) => a + f.score, 0) / FORCES.length).toFixed(1)}/10</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">7/10</p>
                  <p className="text-[10px] text-emerald-500 font-medium">Attractive</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed mt-2">
                Low competitive rivalry and low supplier power create a favorable operating environment.
                Moderate buyer power (practitioners can churn easily) and high substitution threat (&quot;do nothing&quot;) are the primary forces to manage.
                The EU regulatory environment uniquely benefits European-native entrants.
              </p>
            </div>
          </div>

          {/* Force detail cards */}
          <div className="space-y-4">
            {FORCES.map((force, fi) => {
              const Icon = force.icon
              return (
                <motion.div
                  key={force.name}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                  {...fadeUp(1.2 + fi * 0.05)}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">{force.name}</h3>
                        <p className="text-[10px] text-gray-400">{force.summary}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{force.score}/10</p>
                      <p className={`text-[9px] font-semibold ${
                        force.score <= 4 ? 'text-emerald-600' :
                        force.score <= 6 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>{force.verdict}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {force.suppliers.map((s, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-gray-700">{s.name}</span>
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            s.power.includes('High') ? 'bg-red-50 text-red-600' :
                            s.power.includes('Medium') ? 'bg-amber-50 text-amber-600' :
                            s.power === 'None' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {s.power}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">{s.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <p className="text-[10px] text-indigo-700 leading-relaxed">
                      <span className="font-semibold">Bloomsline implication:</span> {force.bloomsline}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── Strategic Synthesis ──────────────────────────────── */}
        <motion.section {...fadeUp(1.45)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Strategic Synthesis</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2">Where you win</p>
                <div className="space-y-1.5">
                  {[
                    'Only B2B2C platform connecting both sides of mental health care',
                    'Zero direct competitors in EU between-session care',
                    'Unit economics proven in model (25-50x LTV/CAC, 90% margin)',
                    'EU regulatory moat deepens every year (AI Act, EHDS, DiGA)',
                    'Woebot/BetterHelp failures validate your thesis',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2">What keeps you up at night</p>
                <div className="space-y-1.5">
                  {[
                    'Zero paying customers — all advantages are theoretical until validated',
                    '"Do nothing" inertia is stronger than any competitor',
                    'SimplePractice/Vista ($4B) could close the gap in 18 months',
                    'Two-person team vs. well-resourced adjacent players',
                    'French HDS compliance could force expensive infrastructure migration',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-2">The One Thing That Matters Right Now</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Get 10 paying practitioners within 90 days of launch. Everything else — the AI, the Care Network Effect, the EU moat,
                the 25-50x LTV/CAC — is a hypothesis until money changes hands. The SWOT is favorable. The Five Forces analysis shows
                an attractive industry. But the only force that matters at pre-seed is <span className="text-white font-semibold">converting the first dollar of revenue.</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(1.5)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Analysis as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

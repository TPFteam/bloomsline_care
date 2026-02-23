'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Globe,
  Brain,
  Shield,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Clock,
  Zap,
  Building2,
  Users,
  Landmark,
  Scale,
  Cpu,
  Lightbulb,
  Target,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Minus,
  Mic,
  Watch,
  Smartphone,
  Heart,
  BookOpen,
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

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700 inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink className="w-2 h-2" />
    </a>
  )
}

function ImpactBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${
              i < score
                ? score >= 9
                  ? 'bg-red-400'
                  : score >= 7
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
                : 'bg-gray-100'
            }`}
          />
        ))}
      </div>
      <span className={`text-[10px] font-bold ${
        score >= 9 ? 'text-red-500' : score >= 7 ? 'text-amber-500' : 'text-emerald-500'
      }`}>
        {score}/10
      </span>
    </div>
  )
}

function TimelineBadge({ timeline }: { timeline: 'short' | 'mid' | 'long' | 'structural' }) {
  const styles = {
    short: 'bg-red-50 text-red-600 border-red-200',
    mid: 'bg-amber-50 text-amber-600 border-amber-200',
    long: 'bg-blue-50 text-blue-600 border-blue-200',
    structural: 'bg-gray-900 text-white border-gray-900',
  }
  const labels = {
    short: '0-1yr',
    mid: '1-3yr',
    long: '3-5yr',
    structural: 'Structural',
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${styles[timeline]}`}>
      {labels[timeline]}
    </span>
  )
}

function FlowBadge({ direction }: { direction: 'inflow' | 'outflow' | 'consolidation' | 'emerging' }) {
  const config = {
    inflow: { icon: ArrowUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Inflow' },
    outflow: { icon: ArrowDown, color: 'text-red-600 bg-red-50 border-red-200', label: 'Outflow' },
    consolidation: { icon: Minus, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Consolidation' },
    emerging: { icon: Zap, color: 'text-violet-600 bg-violet-50 border-violet-200', label: 'Emerging' },
  }
  const { icon: Icon, color, label } = config[direction]
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${color}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

// ── Types ────────────────────────────────────────────────────────────────

interface MacroTrend {
  id: string
  title: string
  force: string
  impact: number
  timeline: 'short' | 'mid' | 'long' | 'structural'
  icon: typeof Globe
  color: string
  lightBg: string
  borderColor: string
  keyStats: string[]
  description: string
  soWhat: string
  sources: { label: string; url: string }[]
}

interface MicroTrend {
  id: string
  title: string
  impact: number
  timeline: 'short' | 'mid' | 'long' | 'structural'
  signal: string
  detail: string
  soWhat: string
  sources: { label: string; url: string }[]
}

interface TechDisruption {
  technology: string
  maturity: string
  mainstream: string
  impact: number
  icon: typeof Brain
  description: string
  keyPlayers: string
  soWhat: string
  sources: { label: string; url: string }[]
}

interface RegulatoryShift {
  regulation: string
  jurisdiction: string
  status: string
  deadline: string
  impact: string
  timeline: 'short' | 'mid' | 'long'
  sources: { label: string; url: string }[]
}

interface InvestmentSignal {
  category: string
  direction: 'inflow' | 'outflow' | 'consolidation' | 'emerging'
  signal: string
  detail: string
  sources: { label: string; url: string }[]
}

// ── Data ─────────────────────────────────────────────────────────────────

const MACRO_TRENDS: MacroTrend[] = [
  {
    id: 'demand',
    title: 'Post-Pandemic Mental Health Demand Is Now Permanent',
    force: 'Social',
    impact: 9,
    timeline: 'structural',
    icon: Heart,
    color: 'text-red-600',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200',
    keyStats: [
      '1B people globally live with a mental health condition (WHO)',
      '91% with depression can\'t access care',
      '122M+ Americans in Mental Health Shortage Areas (HRSA)',
      'US short ~31,000 practitioners by 2025 (SAMHSA)',
    ],
    description: 'The surge isn\'t receding — it\'s hardening into baseline. This isn\'t cyclical demand; it\'s a permanent supply-demand gap that only technology can close.',
    soWhat: 'Every practitioner you serve multiplies their capacity by extending care into the 167 hours between sessions. You\'re not competing for demand — you\'re the only solution that addresses the supply constraint.',
    sources: [
      { label: 'WHO Mental Health Atlas', url: 'https://www.who.int/news/item/02-09-2025-who-releases-new-reports-and-estimates-highlighting-urgent-gaps-in-mental-health' },
      { label: 'HRSA Behavioral Health Workforce 2025', url: 'https://bhw.hrsa.gov/sites/default/files/bureau-health-workforce/data-research/Behavioral-Health-Workforce-Brief-2025.pdf' },
    ],
  },
  {
    id: 'eu-regulatory',
    title: 'EU Regulatory Infrastructure Creating a Moat for European-Native Health Tech',
    force: 'Regulatory',
    impact: 8,
    timeline: 'mid',
    icon: Landmark,
    color: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    keyStats: [
      'EU AI Act: high-risk AI compliance deadline Aug 2026',
      'EHDS entered into force 2025 — standardized health data exchange',
      'France: 12 psychology sessions/yr reimbursed (MonParcoursPsy)',
      'Germany DiGA: ~60 digital health apps prescribable with insurance',
    ],
    description: 'Three regulatory forces converging simultaneously: EU AI Act (compliance advantage for EU-native builders), EHDS (standardized data), and national programs (France MonParcoursPsy, Germany DiGA) creating reimbursement pathways.',
    soWhat: 'GDPR-native, French-first, EU AI Act-ready from day one. US competitors (SimplePractice, Spring Health, BetterHelp) would need years to achieve regulatory parity. Your compliance posture is a moat, not a cost.',
    sources: [
      { label: 'EU AI Act Timeline — Trilateral Research', url: 'https://trilateralresearch.com/responsible-ai/eu-ai-act-implementation-timeline-mapping-your-models-to-the-new-risk-tiers' },
      { label: 'npj Digital Medicine — EU AI Act Healthcare', url: 'https://www.nature.com/articles/s41746-024-01213-6' },
      { label: 'DiGA New Approvals — MedTech Reimbursement', url: 'https://mtrconsult.com/news/seven-more-health-apps-obtained-reimbursement-germany-february-2024' },
    ],
  },
  {
    id: 'ai-augment',
    title: 'AI Is Reshaping Practitioner Workflows — Not Replacing Practitioners',
    force: 'Technological',
    impact: 9,
    timeline: 'short',
    icon: Brain,
    color: 'text-violet-600',
    lightBg: 'bg-violet-50',
    borderColor: 'border-violet-200',
    keyStats: [
      'AI ambient scribes save 15-30 min per session on notes',
      'Burnout drops 51.9% → 38.8% after 30 days of ambient AI (263-physician study)',
      '800+ physicians at UW Health using ambient AI after trial',
      'Woebot shutdown (June 2025, $123M raised): standalone AI therapy fails',
    ],
    description: 'The AI narrative has shifted from "replace therapists" (Woebot, failed) to "augment therapists" (ambient scribes, succeeding). Therapists save 12-15 hours/month through AI-powered note-taking. The market validated that AI embedded in care relationships — not replacing them — is the winning model.',
    soWhat: 'Bloom AI as a practitioner tool (not a therapist replacement) is exactly where the evidence points. Position aggressively around "AI that knows your therapist, your milestones, and your journey."',
    sources: [
      { label: 'UW Health — Ambient AI Study', url: 'https://www.med.wisc.edu/news/ambient-ai-improves-practitioner-well-being/' },
      { label: 'STAT News — Woebot Shutdown', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      { label: 'iCANotes Ambient AI Guide 2026', url: 'https://www.icanotes.com/2026/01/27/ambient-ai-scribe-mental-health/' },
    ],
  },
  {
    id: 'employer-spend',
    title: 'Employer Mental Health Spend Surging — EAPs Being Replaced',
    force: 'Economic',
    impact: 7,
    timeline: 'mid',
    icon: Building2,
    color: 'text-amber-600',
    lightBg: 'bg-amber-50',
    borderColor: 'border-amber-200',
    keyStats: [
      '78% of large enterprises now offer EAP (up from 52% a decade ago)',
      '80%+ of workers consider mental health benefits important for job choice',
      'EAP market: $235M (2026) → $362M (2035)',
      'Modern EAPs shifting to outcome-based, digitally-delivered solutions',
    ],
    description: 'Traditional EAPs are being replaced by outcome-based, digitally-delivered, high-acuity solutions. Spring Health ($3.3B) and Lyra Health ($5.58B) are building the replacement layer.',
    soWhat: 'Not your primary market today, but Thomas (Group Practice Director) is the bridge. Group practices that adopt Bloomsline generate the outcomes data that employers and insurers need. This is your expansion path.',
    sources: [
      { label: 'Spring Health — Beyond EAPs', url: 'https://www.springhealth.com/blog/beyond-eaps-your-guide-to-a-new-mental-health-approach-in-2026' },
      { label: 'Workplace Wellness Trends 2026', url: 'https://www.myshortlister.com/insights/workplace-wellness-trends-report-2026' },
    ],
  },
  {
    id: 'value-based',
    title: 'Economic Pressure Forcing Value-Based Mental Health Care',
    force: 'Economic',
    impact: 7,
    timeline: 'mid',
    icon: Scale,
    color: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    keyStats: [
      'Mental health costs Europe €600B+/yr (4% of EU GDP)',
      'Productivity losses (€240-260B) exceed direct healthcare spending (€190B)',
      'Fewer than 20% of clinicians implement measurement-based care',
      'Insurance payers demanding measurable outcomes, not just session counts',
    ],
    description: 'The gap between what payers demand (measurable outcomes) and what practitioners can deliver (no tracking tools) is the opportunity. MBC adoption is below 20% due to lack of EHR integration and time burden.',
    soWhat: 'Your platform generates outcomes data by design — member engagement, milestone progression, session-to-session improvement. Practitioners using Bloomsline can prove what works. This becomes their competitive advantage.',
    sources: [
      { label: 'APA — Measurement-Based Care', url: 'https://www.apa.org/monitor/2025/01/measurement-based-care-transforms-treatment' },
      { label: 'European Parliament — Mental Health Costs', url: 'https://www.europarl.europa.eu/RegData/etudes/BRIE/2023/751416/EPRS_BRI(2023)751416_EN.pdf' },
    ],
  },
]

const MICRO_TRENDS: MicroTrend[] = [
  {
    id: 'm1',
    title: 'B2C marketplace model collapsing',
    impact: 9,
    timeline: 'short',
    signal: 'BetterHelp -11% revenue Q1 2025, -9% Q2; paying users -4% YoY',
    detail: 'BetterHelp is losing subscribers quarter over quarter. Teladoc is desperately retrofitting insurance coverage — acquiring UpLift (April 2025) to access 100M insured lives. The D2C therapy model is structurally broken: consumers won\'t pay $280-400/mo indefinitely.',
    soWhat: 'Validates Bloomsline\'s B2B-first model. You don\'t depend on consumer willingness to pay for therapy access — practitioners pay, members get free value.',
    sources: [
      { label: 'BetterHelp Revenue Decline — BHB', url: 'https://bhbusiness.com/2025/02/27/betterhelp-wilts-while-other-teladoc-mental-health-services-bloom/' },
      { label: 'BetterHelp Insurance Pivot — BHB', url: 'https://bhbusiness.com/2025/10/30/teladoc-sees-in-network-coverage-as-lifeline-for-ongoing-betterhelp-weakness/' },
    ],
  },
  {
    id: 'm2',
    title: 'B2B/payor pivot validated',
    impact: 9,
    timeline: 'short',
    signal: 'Talkspace payor revenue +42% YoY; 5 consecutive profitable quarters',
    detail: 'Talkspace grew payor revenue 42% year-over-year by focusing exclusively on insurance-covered mental health. Q1 2025: revenue +15% to $52.2M, fifth profitable quarter in a row. The market is rewarding practitioner-first and payor-first models.',
    soWhat: 'The B2B mental health model works. Your B2B2C architecture (practitioner pays, members use free) is aligned with the winning business model.',
    sources: [
      { label: 'Talkspace Profitability — BHB', url: 'https://bhbusiness.com/2025/05/06/talkspace-extends-profitability-run-as-payer-strategy-fuels-growth/' },
      { label: 'Talkspace Q1 2025 — AInvest', url: 'https://www.ainvest.com/news/talkspace-strategic-shift-payer-centric-growth-sustainable-path-booming-mental-health-tech-market-2508/' },
    ],
  },
  {
    id: 'm3',
    title: 'Practice management consolidation accelerating',
    impact: 8,
    timeline: 'short',
    signal: 'Vista/SimplePractice ($4B) acquiring Luminello; building payer partnerships; 237K+ practitioners',
    detail: 'Vista Equity Partners is building a vertically integrated mental health platform. SimplePractice acquired Luminello (psychiatric EHR) for e-prescribe, is hiring Head of Payer & Employer Partnerships, and building AI-enabled multi-sided solutions.',
    soWhat: 'SimplePractice is the gorilla evolving in your direction. They have distribution but NOT: a member app, between-session care, EU presence, or B2B2C architecture. Build the thing they can\'t easily bolt on.',
    sources: [
      { label: 'SimplePractice Profile — PitchBook', url: 'https://pitchbook.com/profiles/company/234770-95' },
      { label: 'Luminello Acquisition — Yung Sidekick', url: 'https://yung-sidekick.com/blog/what-you-need-to-know-about-luminello-s-acquisition' },
    ],
  },
  {
    id: 'm4',
    title: 'AI ambient scribes reaching mainstream',
    impact: 8,
    timeline: 'short',
    signal: '800+ physicians at UW Health; therapists saving 12-15 hrs/month',
    detail: 'After a successful trial (Aug 2024 — Mar 2025), UW Health rolled out ambient AI across all clinics. Burnout dropped from 51.9% to 38.8% in 30 days. Multiple startups (Eleos Health $40M+, AutoNotes, Mentalyc, Upheal) building therapy-specific AI notes.',
    soWhat: 'AI notes should be your wedge feature. Once Marie generates notes with AI, expanding to between-session care is a natural upsell, not a product pivot.',
    sources: [
      { label: 'Ambient AI Improves Wellbeing — UW Health', url: 'https://www.med.wisc.edu/news/ambient-ai-improves-practitioner-well-being/' },
      { label: 'AI Notes for Therapists 2026 — TwoFold', url: 'https://www.trytwofold.com/blog/ai-notes-for-therapists' },
    ],
  },
  {
    id: 'm5',
    title: 'Woebot death validates care-anchored AI',
    impact: 7,
    timeline: 'short',
    signal: '$123M raised, 1.5M users — standalone AI therapy model proven unviable',
    detail: 'Woebot shut down June 30, 2025. CEO cited regulatory limbo (no FDA pathway for LLM-based therapy). The shutdown wasn\'t clinical failure — it was business model failure. Generic GenAI chatbots are booming without clinical rigor; hybrid models (AI + human oversight) are the sustainable path.',
    soWhat: 'Your thesis is validated: AI embedded in care relationships, not replacing them. Position Bloom as "what Woebot should have been — AI anchored in real therapeutic relationships."',
    sources: [
      { label: 'STAT News — Why Woebot Shut Down', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      { label: 'MobiHealthNews — Woebot Shutdown', url: 'https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app' },
    ],
  },
  {
    id: 'm6',
    title: 'VC capital consolidating into fewer, larger rounds',
    impact: 7,
    timeline: 'short',
    signal: 'Mental health funding up 150% to $352M, but rounds dropped from 20 → 13',
    detail: 'Capital is concentrating into later-stage winners. Lyra Health: $235M Series G → $5.58B. Spring Health: $100M Series E → $3.3B. Seed is harder but conviction is stronger — investors want B2B or B2B2C models, not another chatbot.',
    soWhat: 'Pre-seed fundraising is selective but the thesis investors want to fund (B2B2C, EU, practitioner-first) is exactly what you\'re building. Lead with "we\'re building the European SimplePractice with AI and a member app."',
    sources: [
      { label: 'Mental Health Investment Soars 150% — Calcalist', url: 'https://www.calcalistech.com/ctechnews/article/skhzjq8i11g' },
      { label: 'Lyra Health $5.58B — Fierce Healthcare', url: 'https://www.fiercehealthcare.com/digital-health/lyra-health-gets-235m-soars-to-5-85b-valuation-new-acquisition-for-global-expansion' },
    ],
  },
  {
    id: 'm7',
    title: 'Therapist burnout driving tool adoption',
    impact: 8,
    timeline: 'structural',
    signal: '93% report burnout; 29% considering leaving; 1/3 spend majority of time on admin',
    detail: '93% of behavioral health workers report burnout, 62% at severe levels (8-10/10). A third spend most of their time on admin. 29% of burned-out therapists consider leaving the field. Therapists spend 10-15 min per session note; 25 clients/week = 4+ hours of documentation alone.',
    soWhat: 'Burnout is the emotional trigger that converts Marie. "I became a therapist to help people, not do paperwork" is the message that resonates — and AI notes + streamlined workflows is the solution.',
    sources: [
      { label: 'Admin Friction & Burnout — PimsyEHR', url: 'https://pimsyehr.com/administrative-friction-and-clinician-burnout/' },
      { label: 'SimplePractice — Therapist Burnout Report', url: 'https://www.simplepractice.com/blog/therapist-burnout-report/' },
      { label: 'National Council — Help Wanted', url: 'https://www.thenationalcouncil.org/news/help-wanted/' },
    ],
  },
]

const TECH_DISRUPTIONS: TechDisruption[] = [
  {
    technology: 'AI ambient scribes',
    maturity: 'Early mainstream',
    mainstream: 'Now — 2026',
    impact: 9,
    icon: Mic,
    description: 'AI listens to therapy sessions, generates structured clinical notes. Saves 15-30 min per session. Burnout reduction proven in randomized trials.',
    keyPlayers: 'Eleos Health ($40M+), AutoNotes, Mentalyc, Upheal, Freed AI, iCANotes',
    soWhat: 'Trojan horse technology. Once a practitioner adopts AI for notes, they\'re primed for AI in other workflows. This is your wedge feature.',
    sources: [
      { label: 'Ambient AI Scribe RCT — PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12768499/' },
      { label: 'AI Scribes Reduce Burnout — PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12492056/' },
    ],
  },
  {
    technology: 'LLM-powered between-session companions',
    maturity: 'Emerging',
    mainstream: '2026-2027',
    impact: 9,
    icon: Brain,
    description: 'AI companions that know the member\'s care plan, milestones, and practitioner context. Woebot\'s shutdown cleared the field for care-anchored AI models.',
    keyPlayers: 'Bloomsline (Bloom AI), Wysa (hybrid), emerging startups',
    soWhat: 'This is your core product differentiator. No competitor has an AI companion anchored to a real therapeutic relationship. First-mover advantage is real.',
    sources: [
      { label: 'AI Chatbots for Mental Health — Healthcare-in-Europe', url: 'https://healthcare-in-europe.com/en/news/ai-chatbot-mental-health-regulation.html' },
    ],
  },
  {
    technology: 'Predictive dropout/risk analytics',
    maturity: 'Early stage',
    mainstream: '2027-2028',
    impact: 8,
    icon: AlertTriangle,
    description: 'ML models predict therapy dropout with 70-80% accuracy using early session data. Key predictors: missed appointments, declining homework completion, reduced between-session engagement.',
    keyPlayers: 'Spring Health (Precision MH), Crisis Text Line, Quartet Health',
    soWhat: 'Between-session engagement data is the key input. Your platform captures ritual completion, mood tracking, and AI companion interactions — the exact signals these models need.',
    sources: [
      { label: 'Spring Health $3.3B — BHB', url: 'https://bhbusiness.com/2024/07/31/mental-health-startup-spring-health-secures-100m-series-e-valuation-soars-to-3-3b/' },
    ],
  },
  {
    technology: 'Voice biomarker analysis',
    maturity: 'Research / Pilot',
    mainstream: '2028-2030',
    impact: 7,
    icon: Mic,
    description: 'Detecting depression/anxiety from 20-second voice samples with ~80% accuracy. No FDA clearance yet for standalone diagnostics.',
    keyPlayers: 'Kintsugi ($20M+), Ellipsis Health ($26M), Sonde Health ($51M)',
    soWhat: 'Watch technology. Integration into session recording or AI companion could be a future differentiator, but regulatory uncertainty makes it a Phase 3+ feature.',
    sources: [
      { label: 'Regulating AI in Mental Health — PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11450345/' },
    ],
  },
  {
    technology: 'Wearable mood/stress integration',
    maturity: 'Consumer-ready',
    mainstream: '2026-2027',
    impact: 6,
    icon: Watch,
    description: 'Apple Watch PHQ-9/GAD-7 in Health app. Oura ring HRV correlates with stress. HealthKit/Health Connect APIs enable third-party integration.',
    keyPlayers: 'Apple (watchOS 10), Oura ($2.55B), Whoop, Garmin, Fitbit/Google',
    soWhat: 'Low-effort, high-value feature via Apple HealthKit. Showing a practitioner their client\'s sleep quality + HRV alongside session notes = powerful between-session visibility.',
    sources: [
      { label: 'Digital Health Startups 2026 — Navitize', url: 'https://learn.navitize.com/blog/invest/digital-health-startups-2026' },
    ],
  },
  {
    technology: 'Digital phenotyping (passive smartphone data)',
    maturity: 'Research',
    mainstream: '2029+',
    impact: 5,
    icon: Smartphone,
    description: 'Inferring mental state from typing speed, screen time, swipe patterns. Mindstrong ($160M raised) shut down in 2023 — the model doesn\'t work at scale. GDPR makes passive data collection very difficult in EU.',
    keyPlayers: 'Mindstrong (shut down), BiAffect (research), RADAR-CNS (EU research)',
    soWhat: 'Largely discredited. Lightweight passive signals (app usage patterns) combined with active check-ins is the viable approach — which is what your rituals already do.',
    sources: [
      { label: 'Europe\'s Regulatory Failure on GenAI & Mental Health — TechPolicy', url: 'https://www.techpolicy.press/europes-regulatory-failure-on-generative-ai-and-mental-health/' },
    ],
  },
]

const REGULATORY_SHIFTS: RegulatoryShift[] = [
  {
    regulation: 'EU AI Act — High-risk AI systems',
    jurisdiction: 'EU-27',
    status: 'In force (Phase 1: Feb 2025)',
    deadline: 'Aug 2026 compliance',
    impact: 'Mental health AI = high-risk. Compliance advantage for EU-native builders. US competitors face years of retrofitting.',
    timeline: 'mid',
    sources: [{ label: 'EU AI Act Timeline', url: 'https://trilateralresearch.com/responsible-ai/eu-ai-act-implementation-timeline-mapping-your-models-to-the-new-risk-tiers' }],
  },
  {
    regulation: 'European Health Data Space (EHDS)',
    jurisdiction: 'EU-27',
    status: 'Entered into force 2025',
    deadline: 'Phased (2027-2031)',
    impact: 'Standardizes health data exchange across EU. Favors interoperable, standards-compliant platforms. Data portability reduces lock-in.',
    timeline: 'mid',
    sources: [{ label: 'European Commission — EHDS', url: 'https://health.ec.europa.eu/ehealth-digital-health-and-care/european-health-data-space-regulation-ehds_en' }],
  },
  {
    regulation: 'France MonParcoursPsy',
    jurisdiction: 'France',
    status: 'Active — "Grande Cause Nationale" 2025',
    deadline: 'Ongoing expansion',
    impact: '12 reimbursed sessions/yr. 5,500+ psychologists enrolled. Low reimbursement rates (€30-50) push practitioners toward efficiency tools.',
    timeline: 'short',
    sources: [{ label: 'info.gouv.fr — MonParcoursPsy', url: 'https://www.info.gouv.fr/actualite/monparcourspsy-un-dispositif-pour-faciliter-lacces-a-un-accompagnement-psychologique' }],
  },
  {
    regulation: 'Germany DiGA pathway',
    jurisdiction: 'Germany',
    status: '~60 apps approved, 45% mental health',
    deadline: 'Ongoing approvals',
    impact: 'Insurance-reimbursed digital mental health apps. €200-500 per 90-day prescription. Future revenue pathway for Bloomsline in DE market.',
    timeline: 'mid',
    sources: [{ label: 'DiGA Approvals — MedTech Reimbursement', url: 'https://mtrconsult.com/news/seven-more-health-apps-obtained-reimbursement-germany-february-2024' }],
  },
  {
    regulation: 'FDA SaMD guidance (AI/ML)',
    jurisdiction: 'USA',
    status: 'Evolving — 950+ AI devices authorized',
    deadline: 'TBD (2026-2027 expected)',
    impact: 'Regulatory limbo killed Woebot. Clearer rules expected. Practitioner-decision-support (lighter pathway) vs patient-facing device (heavier).',
    timeline: 'mid',
    sources: [{ label: 'Regulating AI in Shadow of Mental Health — Regulatory Review', url: 'https://www.theregreview.org/2025/07/09/silverbreit-regulating-artificial-intelligence-in-the-shadow-of-mental-heath/' }],
  },
  {
    regulation: 'GDPR enforcement in health tech',
    jurisdiction: 'EU-27',
    status: 'Accelerating — €4.5B+ cumulative fines',
    deadline: 'Ongoing',
    impact: 'BetterHelp FTC $7.8M settlement for sharing data with Facebook. GDPR-native = trust signal, not just compliance.',
    timeline: 'short',
    sources: [{ label: 'EU AI Act Healthcare — LegalNodes', url: 'https://www.legalnodes.com/article/ai-healthcare-regulation' }],
  },
]

const INVESTMENT_SIGNALS: InvestmentSignal[] = [
  {
    category: 'B2C therapy marketplaces',
    direction: 'outflow',
    signal: 'BetterHelp -11% revenue; Teladoc pivoting to insurance model',
    detail: 'Consumers won\'t pay $280-400/mo indefinitely. BetterHelp users declining 4% YoY. Teladoc acquired UpLift to retrofit insurance coverage.',
    sources: [{ label: 'BetterHelp — BHB', url: 'https://bhbusiness.com/2025/02/27/betterhelp-wilts-while-other-teladoc-mental-health-services-bloom/' }],
  },
  {
    category: 'Enterprise mental health (B2B)',
    direction: 'inflow',
    signal: 'Lyra $5.58B, Spring Health $3.3B; employers replacing legacy EAPs',
    detail: 'Lyra raised $235M Series G. Spring Health $100M Series E. Capital flooding into platforms that sell to employers and insurers.',
    sources: [{ label: 'Lyra $5.58B — Fierce Healthcare', url: 'https://www.fiercehealthcare.com/digital-health/lyra-health-gets-235m-soars-to-5-85b-valuation-new-acquisition-for-global-expansion' }],
  },
  {
    category: 'Practice management SaaS',
    direction: 'consolidation',
    signal: 'Vista/$4B SimplePractice; Luminello acquisition; 237K+ practitioners',
    detail: 'Vista building vertically integrated platform through roll-up acquisitions. Adding AI, building payer partnerships. The gorilla is moving.',
    sources: [{ label: 'SimplePractice Profile — PitchBook', url: 'https://pitchbook.com/profiles/company/234770-95' }],
  },
  {
    category: 'AI-augmented care tools',
    direction: 'emerging',
    signal: 'Post-Woebot market seeking care-anchored AI models',
    detail: 'Eleos Health ($40M+), multiple ambient scribe startups raising. Investors want AI that augments practitioners, not replaces them.',
    sources: [{ label: 'Mental Health Investment — Galen Growth', url: 'https://www.galengrowth.com/mental-healths-investment-resurgence-a-market-ripe-for-innovation/' }],
  },
  {
    category: 'European digital health',
    direction: 'emerging',
    signal: 'Massive white space; Moka.care (€17.5M) is the only notable French raise',
    detail: 'Near zero VC activity in EU practitioner SaaS. Doctolib is booking. No AI-native, practitioner-focused mental health platform has been funded in Europe.',
    sources: [{ label: 'Digital Health Startups 2026 — Navitize', url: 'https://learn.navitize.com/blog/invest/digital-health-startups-2026' }],
  },
  {
    category: 'Seed/Pre-seed mental health',
    direction: 'consolidation',
    signal: 'Fewer deals, stronger conviction; investors want B2B or B2B2C',
    detail: 'Rounds dropped from 20 to 13 while total capital rose 150%. VCs are being pickier but writing bigger checks for thesis-aligned companies.',
    sources: [{ label: 'Mental Health Investment Soars 150% — Calcalist', url: 'https://www.calcalistech.com/ctechnews/article/skhzjq8i11g' }],
  },
]

const VALUATION_BENCHMARKS = [
  { company: 'Lyra Health', category: 'Enterprise B2B', valuation: '$5.58B', multiple: '~15-20x ARR', relevance: 'Ceiling for enterprise mental health' },
  { company: 'SimplePractice (Vista)', category: 'Practice management', valuation: '$4.0B', multiple: '~40x ARR', relevance: 'Direct B2B comp — practice tools for therapists' },
  { company: 'Spring Health', category: 'Enterprise B2B', valuation: '$3.3B', multiple: '~20-25x ARR', relevance: 'Enterprise mental health with AI care matching' },
  { company: 'Headspace Health', category: 'B2C wellness', valuation: '$3.0B', multiple: '~8-10x ARR', relevance: 'B2C comp — consumer wellness brand' },
  { company: 'Talkspace', category: 'B2B pivot', valuation: '~$500M', multiple: '~2.5x ARR', relevance: 'B2C → B2B pivot validation' },
]

const CONSUMER_SHIFTS = [
  { shift: '"Therapy-native" generation entering peak earning years', evidence: 'Gen Z + Millennials normalized therapy; 80%+ consider mental health benefits important for job choice', impact: 9 },
  { shift: 'Trust flows through practitioners, not app stores', evidence: '100% of B2C member discovery via practitioner recommendation; practitioner is the trust signal', impact: 9 },
  { shift: 'Hybrid care preference (digital + in-person)', evidence: 'Patients want digital tools connected to their real therapist, not generic apps; NPS 55+ for hybrid vs 30 for digital-only', impact: 8 },
  { shift: 'Practitioner tech adoption inflection', evidence: 'AI scribes saving 12-15 hrs/month driving rapid adoption; only 5% use AI today but 55% want it for admin', impact: 8 },
  { shift: 'B2C app fatigue', evidence: 'BetterHelp losing subscribers; Woebot shut down; "another meditation app" rejected; Headspace 60%+ inactive within 6 months', impact: 7 },
  { shift: 'Demand for outcomes visibility', evidence: 'Patients want to see their progress; payers demand measurement; <20% of clinicians track it today', impact: 7 },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function TrendReportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Trend Intelligence Brief</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Digital Mental Health Sector Analysis, Q1 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Executive Summary ──────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">$33B market undergoing a structural reset.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            The B2C therapy marketplace model is collapsing (BetterHelp -11% YoY). The B2B enterprise model is consolidating
            (Lyra $5.58B, Spring Health $3.3B). A new category — <span className="font-semibold text-gray-700">AI-augmented practitioner SaaS with between-session care</span> — remains
            entirely unoccupied. For Bloomsline, this creates a rare window: structural demand is accelerating while the competitive field is fragmenting.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">$33B → $88B by 2030</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">BetterHelp -11% Q1</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Talkspace +42% payor revenue</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">0 EU competitors</span>
          </div>
        </motion.section>

        {/* ── 2. Macro Trends ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="5 global forces shaping the digital mental health industry">Macro Trends</SectionTitle>
          <div className="space-y-4">
            {MACRO_TRENDS.map((trend, i) => {
              const Icon = trend.icon
              return (
                <motion.div
                  key={trend.id}
                  className={`${trend.lightBg} border ${trend.borderColor} rounded-xl p-5`}
                  {...fadeUp(0.1 + i * 0.05)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-lg ${trend.lightBg} flex items-center justify-center border ${trend.borderColor}`}>
                        <Icon className={`w-4 h-4 ${trend.color}`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 leading-tight">{trend.title}</h3>
                        <span className="text-[9px] text-gray-400">{trend.force}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TimelineBadge timeline={trend.timeline} />
                      <ImpactBar score={trend.impact} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {trend.keyStats.map((stat, j) => (
                      <div key={j} className="bg-white/70 rounded-lg px-2.5 py-1.5">
                        <p className="text-[10px] text-gray-600 leading-relaxed">{stat}</p>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{trend.description}</p>

                  <div className="bg-gray-900 rounded-lg p-3 mb-3">
                    <p className="text-[10px] font-semibold text-gray-300 mb-0.5">So what for Bloomsline:</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">{trend.soWhat}</p>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {trend.sources.map((src, j) => (
                      <SourceLink key={j} href={src.url}>{src.label}</SourceLink>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 3. Micro Trends ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle="7 emerging patterns from the last 12 months">Micro Trends</SectionTitle>

          {/* Summary table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Trend</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Impact</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Timeline</th>
                  <th className="text-left py-2 pl-2 text-gray-500 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {MICRO_TRENDS.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2 pr-3 font-bold text-gray-400">{t.id}</td>
                    <td className="py-2 px-2 font-medium text-gray-800 max-w-[200px]">{t.title}</td>
                    <td className="py-2 px-2 text-center"><ImpactBar score={t.impact} /></td>
                    <td className="py-2 px-2 text-center"><TimelineBadge timeline={t.timeline} /></td>
                    <td className="py-2 pl-2 text-[10px] text-gray-500 max-w-[250px]">{t.signal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail cards */}
          <div className="space-y-3">
            {MICRO_TRENDS.map((trend, i) => (
              <motion.div
                key={trend.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
                {...fadeUp(0.4 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{trend.id}</span>
                    <h4 className="text-xs font-bold text-gray-900">{trend.title}</h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <TimelineBadge timeline={trend.timeline} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{trend.detail}</p>
                <div className="bg-indigo-50 rounded-lg px-3 py-2 mb-2">
                  <p className="text-[10px] text-indigo-700 leading-relaxed"><span className="font-semibold">So what:</span> {trend.soWhat}</p>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {trend.sources.map((src, j) => (
                    <SourceLink key={j} href={src.url}>{src.label}</SourceLink>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 4. Technology Disruptions ─────────────────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <SectionTitle subtitle="What new tech is changing the game — and when it hits mainstream">Technology Disruptions</SectionTitle>

          <div className="space-y-3">
            {TECH_DISRUPTIONS.map((tech, i) => {
              const Icon = tech.icon
              return (
                <motion.div
                  key={tech.technology}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                  {...fadeUp(0.6 + i * 0.04)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-violet-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{tech.technology}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-gray-400">{tech.maturity}</span>
                            <span className="text-[9px] text-gray-300">|</span>
                            <span className="text-[9px] font-medium text-violet-500">Mainstream: {tech.mainstream}</span>
                          </div>
                        </div>
                        <ImpactBar score={tech.impact} />
                      </div>
                      <p className="text-[10px] text-gray-500 leading-relaxed mb-1.5">{tech.description}</p>
                      <p className="text-[10px] text-gray-400 mb-2"><span className="font-medium text-gray-500">Key players:</span> {tech.keyPlayers}</p>
                      <div className="bg-gray-900 rounded-lg px-3 py-2 mb-2">
                        <p className="text-[10px] text-gray-400 leading-relaxed"><span className="font-semibold text-gray-300">So what:</span> {tech.soWhat}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {tech.sources.map((src, j) => (
                          <SourceLink key={j} href={src.url}>{src.label}</SourceLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 5. Regulatory Shifts ─────────────────────────────── */}
        <motion.section {...fadeUp(0.7)}>
          <SectionTitle subtitle="Upcoming legislation and policy changes to watch">Regulatory Shifts</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 text-[9px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-4 py-2.5 border-b border-gray-100">
              <span className="col-span-3">Regulation</span>
              <span className="col-span-1 text-center">Scope</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1 text-center">Deadline</span>
              <span className="col-span-4">Impact on Bloomsline</span>
              <span className="col-span-1 text-center">When</span>
            </div>
            {REGULATORY_SHIFTS.map((reg, i) => (
              <div key={reg.regulation} className={`grid grid-cols-12 px-4 py-3 text-[10px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border-b border-gray-50 last:border-0`}>
                <div className="col-span-3 font-medium text-gray-800 pr-2">
                  {reg.regulation}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reg.sources.map((src, j) => (
                      <SourceLink key={j} href={src.url}>Source</SourceLink>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 text-center text-gray-500 self-start">{reg.jurisdiction}</div>
                <div className="col-span-2 text-gray-500 pr-2">{reg.status}</div>
                <div className="col-span-1 text-center font-medium text-gray-700 self-start">{reg.deadline}</div>
                <div className="col-span-4 text-gray-600 pr-2">{reg.impact}</div>
                <div className="col-span-1 text-center self-start"><TimelineBadge timeline={reg.timeline} /></div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Consumer Behavior Changes ──────────────────────── */}
        <motion.section {...fadeUp(0.75)}>
          <SectionTitle subtitle="How buyer preferences are evolving">Consumer Behavior Shifts</SectionTitle>
          <div className="space-y-3">
            {CONSUMER_SHIFTS.map((shift, i) => (
              <motion.div
                key={shift.shift}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4"
                {...fadeUp(0.8 + i * 0.03)}
              >
                <div className="shrink-0 mt-0.5">
                  <ImpactBar score={shift.impact} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">{shift.shift}</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{shift.evidence}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-4">
            <p className="text-xs text-indigo-700 leading-relaxed">
              <span className="font-bold">Critical insight:</span> Consumers don&apos;t want <em>another app</em>. They want their therapist to recommend a tool connected to their actual care. The practitioner is the distribution channel and the trust signal. This is why B2B2C wins and B2C dies.
            </p>
          </div>
        </motion.section>

        {/* ── 7. Investment Signals ─────────────────────────────── */}
        <motion.section {...fadeUp(0.85)}>
          <SectionTitle subtitle="Where smart money is flowing — VC deals, M&A, and market signals">Investment Signals</SectionTitle>

          {/* Capital flow */}
          <div className="space-y-2 mb-6">
            {INVESTMENT_SIGNALS.map((signal, i) => (
              <motion.div
                key={signal.category}
                className="bg-white border border-gray-200 rounded-xl p-4"
                {...fadeUp(0.9 + i * 0.03)}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <FlowBadge direction={signal.direction} />
                    <h4 className="text-xs font-bold text-gray-900">{signal.category}</h4>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-gray-700 mb-1">{signal.signal}</p>
                <p className="text-[10px] text-gray-400 leading-relaxed mb-1.5">{signal.detail}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {signal.sources.map((src, j) => (
                    <SourceLink key={j} href={src.url}>{src.label}</SourceLink>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Valuation benchmarks */}
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Valuation Benchmarks</h3>
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-3 text-gray-500 font-medium">Company</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Category</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Valuation</th>
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Multiple</th>
                  <th className="text-left py-2 pl-2 text-gray-500 font-medium">Relevance</th>
                </tr>
              </thead>
              <tbody>
                {VALUATION_BENCHMARKS.map((b) => (
                  <tr key={b.company} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{b.company}</td>
                    <td className="py-2.5 px-2 text-gray-500">{b.category}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-gray-900">{b.valuation}</td>
                    <td className="py-2.5 px-2 text-center text-gray-500">{b.multiple}</td>
                    <td className="py-2.5 pl-2 text-[10px] text-gray-500">{b.relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ── 8. Timeline Map ──────────────────────────────────── */}
        <motion.section {...fadeUp(0.95)}>
          <SectionTitle subtitle="When each trend hits — and when to act">Timeline Map</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              {
                label: 'Short-term (0-1yr)',
                color: 'border-red-200',
                headerBg: 'bg-red-50',
                headerText: 'text-red-700',
                items: [
                  'B2C marketplace collapse',
                  'AI ambient scribes go mainstream',
                  'Woebot aftermath — market seeks care-anchored AI',
                  'Therapist burnout crisis',
                  'VC consolidation into fewer/bigger rounds',
                  'France MonParcoursPsy expands TAM',
                ],
              },
              {
                label: 'Mid-term (1-3yr)',
                color: 'border-amber-200',
                headerBg: 'bg-amber-50',
                headerText: 'text-amber-700',
                items: [
                  'EU AI Act high-risk deadline (Aug 2026)',
                  'EHDS full implementation begins',
                  'DiGA model spreads across EU',
                  'SimplePractice platform play accelerates',
                  'Employer EAP → platform shift',
                  'MBC adoption reaches 40%+',
                  'Gen Z enters peak therapy spending years',
                ],
              },
              {
                label: 'Long-term (3-5yr)',
                color: 'border-blue-200',
                headerBg: 'bg-blue-50',
                headerText: 'text-blue-700',
                items: [
                  'Voice biomarkers mainstream',
                  'Value-based MH reimbursement standard',
                  'Practice management fully AI-augmented',
                  'EU becomes largest digital MH market',
                  'Wearable integration ubiquitous',
                  'Digital phenotyping matures',
                ],
              },
            ]).map((col) => (
              <div key={col.label} className={`bg-white border ${col.color} rounded-xl overflow-hidden`}>
                <div className={`${col.headerBg} px-4 py-2.5`}>
                  <p className={`text-xs font-bold ${col.headerText}`}>{col.label}</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {col.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── 9. Synthesis ─────────────────────────────────────── */}
        <motion.section {...fadeUp(1.0)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Synthesis — What This Means for Bloomsline</h2>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-indigo-300 mb-1.5">The Window (12-18 months)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  'B2C model is proven dead (BetterHelp, Woebot) but care-anchored B2B2C hasn\'t been built',
                  'EU regulatory infrastructure favors European-native builders',
                  'Therapist burnout is at crisis levels — urgent demand for admin-reducing tools',
                  'AI note generation is the wedge that opens the door to full practice adoption',
                  'VC is looking for the next model — not another marketplace, not another chatbot',
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-400 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-semibold text-red-300 mb-1.5">The Risk</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                SimplePractice (Vista, $4B, 237K practitioners) is building in your direction — adding AI, building payer partnerships.
                They have distribution, capital, and 237K practitioners. They do NOT have: a member app, between-session care, EU presence,
                or B2B2C architecture. <span className="text-white font-medium">Your advantage is architectural, not resource-based. Build the thing they can&apos;t easily bolt on.</span>
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { metric: 'Market size', signal: '$33B → $88B (2030)', position: 'Inside fastest-growing segment' },
                  { metric: 'Growth rate', signal: '18.6% CAGR', position: 'Targeting 22.7% SOM CAGR' },
                  { metric: 'B2C viability', signal: 'Collapsing', position: 'B2C is free, B2B pays' },
                  { metric: 'AI positioning', signal: '"Augment, don\'t replace" winning', position: 'Care-anchored by design' },
                  { metric: 'EU competition', signal: 'Near zero', position: 'First mover in white space' },
                  { metric: 'Regulatory readiness', signal: 'EU AI Act Aug 2026', position: 'GDPR-native from day one' },
                ].map((row) => (
                  <div key={row.metric}>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">{row.metric}</p>
                    <p className="text-[10px] font-semibold text-white">{row.signal}</p>
                    <p className="text-[9px] text-emerald-400">{row.position}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-xs text-gray-300 leading-relaxed italic">
                &quot;The market is moving from &apos;apps for patients&apos; to &apos;platforms for practitioners&apos; — and nobody has built the European version yet.&quot;
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── 10. Footer ──────────────────────────────────────── */}
        <motion.div {...fadeUp(1.05)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Research as of Feb 2026 — Bloomsline Care
          </p>
          <p className="text-[9px] text-gray-300 mt-1">
            Sources: Towards Healthcare, Grand View Research, Behavioral Health Business, STAT News, HRSA, WHO, European Commission, Fierce Healthcare, PitchBook, and public company filings.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

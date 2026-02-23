'use client'

import { motion } from 'framer-motion'
import {
  Target,
  CheckCircle2,
  XCircle,
  Minus,
  ArrowRight,
  Globe,
  Users,
  Brain,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Shield,
  Clock,
  Lightbulb,
  Flag,
  ChevronRight,
  ExternalLink,
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

function FeatureIcon({ value }: { value: boolean | 'partial' }) {
  if (value === true) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  if (value === 'partial') return <Minus className="w-3.5 h-3.5 text-amber-400" />
  return <XCircle className="w-3.5 h-3.5 text-gray-200" />
}

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

// ── Types ────────────────────────────────────────────────────────────────

interface CompetitorSource {
  label: string
  url: string
}

interface Competitor {
  name: string
  oneLiner: string
  pricing: string
  pricingSource: CompetitorSource
  category: 'practice' | 'wellness' | 'enterprise' | 'ai'
  target: string
  fundingOrScale: string
  keyDifferentiator: string
  moat: string
  strengths: string[]
  weaknesses: string[]
  threatLevel: 'high' | 'medium' | 'low'
  threatReason: string
  defense: string
  sources: CompetitorSource[]
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
  // Practice Management
  {
    name: 'SimplePractice',
    oneLiner: 'US-focused EHR for solo mental health practitioners',
    pricing: '$49–99/mo',
    pricingSource: { label: 'SimplePractice Pricing', url: 'https://www.simplepractice.com/pricing/' },
    category: 'practice',
    target: 'US solo/small-group therapists',
    fundingOrScale: '250K+ practitioners, owned by Vista Equity Partners ($4B acquisition)',
    keyDifferentiator: 'All-in-one billing, scheduling, notes, and telehealth',
    moat: 'Deep US insurance integrations & network effects among therapists',
    strengths: ['Best-in-class EHR for US solo therapists', 'Strong brand — 250K+ practitioners', 'Comprehensive billing & insurance'],
    weaknesses: ['No member-facing app or engagement tools', 'Zero AI in the care journey', 'US-only — no EU presence'],
    threatLevel: 'medium',
    threatReason: 'Scale and brand could enable EU expansion',
    defense: 'They have no member app, no AI, and no EU presence. Rebuilding for B2B2C would require a full product rethink.',
    sources: [
      { label: '250K practitioners (2025 Impact)', url: 'https://www.simplepractice.com/blog/2025-impact-roundup/' },
      { label: 'Vista acquires EngageSmart ($4B)', url: 'https://www.businesswire.com/news/home/20231023294863/en/EngageSmart-Agrees-to-Be-Acquired-by-Vista-Equity-Partners-for-4-0-Billion' },
    ],
    features: { practitionerTools: true, memberApp: false, aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Jane App',
    oneLiner: 'Canadian practice management for health & wellness clinics',
    pricing: 'CAD $54–99/mo',
    pricingSource: { label: 'Jane App Pricing', url: 'https://jane.app/pricing' },
    category: 'practice',
    target: 'Canadian/AU/UK allied health & wellness clinics',
    fundingOrScale: 'Mostly bootstrapped, 200K+ practitioners, $1.8B valuation (2025)',
    keyDifferentiator: 'Multi-discipline support (physio, chiro, massage, mental health)',
    moat: 'Broad allied health coverage & strong Canadian base',
    strengths: ['Multi-discipline flexibility', 'Strong in Canada/Australia/UK — 50K+ clinics', 'Profitable since day one, ~$100M ARR'],
    weaknesses: ['Limited mental health specialization', 'No AI capabilities', 'Minimal European footprint'],
    threatLevel: 'low',
    threatReason: 'Not mental health focused, no AI or EU strategy',
    defense: 'Generalist tool — lacks the depth for mental health care journeys. No AI roadmap.',
    sources: [
      { label: '$1.8B valuation (BetaKit)', url: 'https://betakit.com/jane-software-to-be-reportedly-valued-at-1-8-billion-in-upcoming-secondary-financing/' },
      { label: 'Bootstrapped growth story', url: 'https://markmacleod.me/jane-apps-alison-taylor-on-building-a-600-person-profitable-healthcare-company-without-venture-capital/' },
    ],
    features: { practitionerTools: true, memberApp: 'partial', aiCompanion: false, european: 'partial', b2b2c: false },
  },
  {
    name: 'Doctolib',
    oneLiner: 'Dominant European healthcare booking & telehealth platform',
    pricing: '€139/mo',
    pricingSource: { label: 'Doctolib Pricing (Contrary Research)', url: 'https://research.contrary.com/company/doctolib' },
    category: 'practice',
    target: 'European GPs, specialists, hospitals',
    fundingOrScale: '80M patients, 400K practitioners, ~$850M raised, valued at $6.4B',
    keyDifferentiator: 'Largest EU patient booking network with 80M+ users',
    moat: 'Massive network effects — 80M patients, deep health system integrations',
    strengths: ['Dominant EU booking platform', 'Massive user base and trust', '€348M ARR (2024), approaching profitability'],
    weaknesses: ['Booking + admin only — no care features', 'No AI companion or between-session tools', 'Not specialized for mental health'],
    threatLevel: 'high',
    threatReason: '80M users in EU — could add care features at any time',
    defense: 'Doctolib is a booking engine, not a care platform. Adding AI-powered between-session care would require a completely different product DNA. They optimize for volume; we optimize for outcomes.',
    sources: [
      { label: '€348M ARR, 80M patients (Sifted)', url: 'https://sifted.eu/articles/doctolib-results-2024' },
      { label: '$6.4B valuation (TechCrunch)', url: 'https://techcrunch.com/2022/03/15/healthcare-tech-platform-doctolib-reaches-6-4-billion-valuation/' },
    ],
    features: { practitionerTools: 'partial', memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
  },
  // B2C Wellness
  {
    name: 'Headspace',
    oneLiner: 'Market-leading meditation & mindfulness content app',
    pricing: '$12.99/mo',
    pricingSource: { label: 'Headspace Subscriptions', url: 'https://www.headspace.com/subscriptions' },
    category: 'wellness',
    target: 'Consumers seeking mindfulness & meditation',
    fundingOrScale: '80M+ downloads, merged with Ginger → Headspace Health ($3B valuation)',
    keyDifferentiator: 'Premium brand and library of meditation/sleep content',
    moat: 'Brand recognition & vast content library',
    strengths: ['Massive brand awareness — 80M+ downloads', 'Rich content library (meditation, sleep, focus)', 'B2B enterprise offering (Headspace Health)'],
    weaknesses: ['Content only — no practitioner connection', 'No personalized AI or care plans', 'Generic wellness, not clinical mental health'],
    threatLevel: 'low',
    threatReason: 'Content play — different product category entirely',
    defense: 'Headspace is a content app, not a care platform. No practitioner tools, no AI companion, no clinical journey.',
    sources: [
      { label: '80M+ downloads (Business of Apps)', url: 'https://www.businessofapps.com/data/headspace-statistics/' },
      { label: 'Ginger merger → $3B (TechCrunch)', url: 'https://techcrunch.com/2021/08/25/headspace-and-ginger-are-merging-to-form-headspace-health/' },
    ],
    features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: true, b2b2c: false },
  },
  {
    name: 'BetterHelp',
    oneLiner: 'Largest online therapy marketplace — text, phone & video',
    pricing: '$280–400/mo',
    pricingSource: { label: 'BetterHelp Pricing', url: 'https://www.betterhelp.com/advice/general/how-much-does-betterhelp-cost/' },
    category: 'wellness',
    target: 'US consumers seeking affordable online therapy',
    fundingOrScale: '5M+ users served, Teladoc subsidiary ($1B+ annual revenue)',
    keyDifferentiator: 'Largest online therapy marketplace by volume',
    moat: 'Scale & SEO dominance for therapy keywords',
    strengths: ['Massive scale — 5M+ users, 30K+ therapists', 'Strong marketing & SEO machine', 'Low friction onboarding'],
    weaknesses: ['No practitioner tools — therapists are commoditized', 'No between-session engagement', 'Revenue declining 8% YoY (2024), US-only'],
    threatLevel: 'low',
    threatReason: 'Marketplace model misaligned with care continuity',
    defense: 'BetterHelp is a marketplace that commoditizes therapists. Practitioners don\'t choose it — they tolerate it. We empower practitioners, not replace them.',
    sources: [
      { label: '5M+ users (Yahoo Finance)', url: 'https://finance.yahoo.com/news/betterhelp-surpasses-5-million-people-170000559.html' },
      { label: 'Revenue decline (Healthcare Dive)', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
    ],
    features: { practitionerTools: false, memberApp: true, aiCompanion: false, european: false, b2b2c: false },
  },
  // Enterprise
  {
    name: 'Spring Health',
    oneLiner: 'Enterprise mental health platform with care matching',
    pricing: '~$5–14 PEPM',
    pricingSource: { label: 'Spring Health PEPM (Oliver Wyman)', url: 'https://www.oliverwyman.com/our-expertise/perspectives/health/2025/april/3-keys-to-unlocking-value-in-an-evolving-eap-market.html' },
    category: 'enterprise',
    target: 'Large employers (1,000+ employees)',
    fundingOrScale: '$509M raised, valued at $3.3B (Series E, Jul 2024)',
    keyDifferentiator: 'AI-powered care navigation for enterprise employees',
    moat: 'Enterprise contracts, clinical outcomes data, care matching algorithms',
    strengths: ['Strong enterprise sales — 450 employers, 20M+ lives covered', 'AI-powered care matching', '$509M in funding, 3,400 employees'],
    weaknesses: ['No practitioner SaaS tools', 'US-focused, limited EU presence', 'Employees only — no independent practitioner market'],
    threatLevel: 'medium',
    threatReason: 'Resources to expand into EU or add practitioner tools',
    defense: 'Spring Health sells to HR departments, not practitioners. Different buyer, different product, different market. EU expansion would take years of regulatory work.',
    sources: [
      { label: '$3.3B valuation, Series E (Fortune)', url: 'https://www.springhealth.com/news/fortune-exclusive-ai-powered-mental-health-startup-boosts-valuation' },
      { label: '450 employers, 20M+ lives (BHB)', url: 'https://bhbusiness.com/2024/07/31/mental-health-startup-spring-health-secures-100m-series-e-valuation-soars-to-3-3b/' },
    ],
    features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: false, b2b2c: false },
  },
  {
    name: 'Moka.care',
    oneLiner: 'French B2B mental wellbeing for companies',
    pricing: 'Custom PEPM',
    pricingSource: { label: 'Moka.care B2B model (TechCrunch)', url: 'https://techcrunch.com/2021/02/04/moka-care-is-a-european-mental-health-care-solution-for-employees/' },
    category: 'enterprise',
    target: 'French/EU mid-size to large companies',
    fundingOrScale: '€17.5M raised, 320+ enterprise clients (L\'Oreal, Accor, ENGIE)',
    keyDifferentiator: 'French-native B2B mental wellbeing with local practitioners',
    moat: 'French enterprise relationships & local practitioner network',
    strengths: ['French-native with EU focus', 'Strong B2B enterprise position — 320+ clients', 'Local practitioner network across 15 countries'],
    weaknesses: ['Enterprise-only — no independent practitioner tools', 'No member-facing app', 'No AI companion or between-session care'],
    threatLevel: 'low',
    threatReason: 'B2B-only model, no practitioner SaaS or AI',
    defense: 'Moka.care serves companies, not practitioners. Different buyer, different value prop. No overlap with our B2B2C model.',
    sources: [
      { label: '€15M Series A (Sifted)', url: 'https://sifted.eu/articles/moka-care-15m-series-a' },
      { label: 'Series A raise (TechCrunch)', url: 'https://techcrunch.com/2022/05/24/moka-care-raises-16-million-for-its-corporate-mental-health-service/' },
    ],
    features: { practitionerTools: false, memberApp: 'partial', aiCompanion: false, european: true, b2b2c: false },
  },
  // AI Mental Health
  {
    name: 'Woebot',
    oneLiner: 'CBT-based AI chatbot — consumer app shut down June 2025',
    pricing: 'B2B only',
    pricingSource: { label: 'Woebot B2C shutdown (STAT News)', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
    category: 'ai',
    target: 'Enterprise clients (after B2C shutdown)',
    fundingOrScale: '$123M raised, Stanford-backed, B2C app shut down June 2025',
    keyDifferentiator: 'Most clinically validated AI mental health chatbot',
    moat: 'Clinical evidence base & research partnerships',
    strengths: ['Strongest clinical evidence in AI mental health', 'Stanford/research credibility', 'FDA Breakthrough Device designation (May 2021)'],
    weaknesses: ['B2C model failed — app shut down June 2025', 'No practitioner tools', 'Pivoted to enterprise-only (limited TAM)'],
    threatLevel: 'low',
    threatReason: 'B2C failure validates our care-anchored approach',
    defense: 'Woebot\'s shutdown proves standalone AI mental health doesn\'t work. Our AI is embedded in a real care relationship — the model they couldn\'t build.',
    sources: [
      { label: 'App shutdown (MobiHealthNews)', url: 'https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app' },
      { label: '$123M total funding (BHB)', url: 'https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/' },
      { label: 'FDA Breakthrough Device (Woebot)', url: 'https://woebothealth.com/woebot-health-receives-fda-breakthrough-device-designation/' },
    ],
    features: { practitionerTools: false, memberApp: false, aiCompanion: true, european: false, b2b2c: false },
  },
  {
    name: 'Wysa',
    oneLiner: 'AI mental health chatbot with CBT/DBT exercises',
    pricing: '$99.99/yr',
    pricingSource: { label: 'Wysa App Store Pricing', url: 'https://apps.apple.com/us/app/wysa-mental-health-support/id1166585565' },
    category: 'ai',
    target: 'Consumers & enterprise employees',
    fundingOrScale: '$30.5M raised, 5M+ users, 500M+ AI conversations',
    keyDifferentiator: 'AI chatbot with structured CBT/DBT/ACT exercises',
    moat: 'NHS partnerships (31 Talking Therapy services) & clinical validation',
    strengths: ['NHS-validated — 117K+ patients referred via Wysa', 'Structured therapy exercises', '5M+ users across 90 countries'],
    weaknesses: ['No practitioner connection', 'Generic exercises — not personalized to care plan', 'Limited European presence despite NHS work'],
    threatLevel: 'low',
    threatReason: 'Standalone AI chatbot — same limitations as Woebot',
    defense: 'Wysa is a self-help tool with no practitioner connection. Our AI knows the member\'s care plan, milestones, and practitioner — contextual, not generic.',
    sources: [
      { label: '$20M Series B (TechCrunch)', url: 'https://techcrunch.com/2022/07/14/wysa-20-million-series-b-funding-expand-therapist-chatbot-wider-mental-health-services/' },
      { label: '31 NHS services, 117K patients (Wysa)', url: 'https://blogs.wysa.io/blog/company-news/nhs-tackles-mental-health-crisis-with-ai' },
    ],
    features: { practitionerTools: false, memberApp: true, aiCompanion: true, european: false, b2b2c: false },
  },
]

const CATEGORIES = [
  { id: 'practice' as const, label: 'Practice Management', color: 'bg-blue-500', lightBg: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { id: 'wellness' as const, label: 'B2C Wellness & Therapy', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { id: 'enterprise' as const, label: 'Enterprise B2B', color: 'bg-amber-500', lightBg: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { id: 'ai' as const, label: 'AI Mental Health', color: 'bg-violet-500', lightBg: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
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
    subtitle: '€25/mo vs €50-139/mo competitors',
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

const UNCONTESTED_SPACES = [
  {
    icon: Clock,
    title: 'Between-Session Care',
    description: 'The 167 hours between weekly sessions are completely unserved. 20-50% of therapy homework goes uncompleted — no tool helps practitioners extend care into daily life.',
    signal: 'JMIR: "little a therapist can do between sessions to remind clients"',
    sourceUrl: 'https://mental.jmir.org/2017/2/e20/',
  },
  {
    icon: Brain,
    title: 'AI Anchored in Care Relationships',
    description: 'Woebot proved standalone AI fails. The market needs AI embedded in real therapeutic relationships — not replacing them.',
    signal: 'Woebot B2C shutdown (June 2025) validates this gap',
    sourceUrl: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/',
  },
  {
    icon: Globe,
    title: 'European Practitioner SaaS',
    description: 'SimplePractice, BetterHelp, Spring Health — none operate in Europe. Doctolib is booking. The EU has no modern mental health SaaS.',
    signal: 'EU mental health apps market: $2.2B in 2025, projected $4.8B by 2030',
    sourceUrl: 'https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe',
  },
  {
    icon: Users,
    title: 'Dual-Sided B2B2C Platform',
    description: 'Every competitor is one-sided: practitioner-only OR member-only. Nobody connects both in a single ecosystem.',
    signal: '1 practitioner sale = 12 engaged members for free',
  },
  {
    icon: DollarSign,
    title: 'Affordable AI-Native Practice Tool',
    description: 'Practice management tools cost €50-139/mo. We deliver more (AI + member app) for €25/mo — 2-5x cheaper.',
    signal: '90%+ gross margin with AI optimized on Claude Haiku',
  },
]

const STRATEGIC_RECS = [
  {
    priority: 'critical' as const,
    title: 'Own "between-session care" as a category',
    description: 'No competitor occupies this space. Be the first to define and own it — the tool that works when the therapist isn\'t in the room.',
    icon: Target,
  },
  {
    priority: 'critical' as const,
    title: 'Win France before expanding',
    description: 'Doctolib proved France is the EU beachhead. Win 1,000 French practitioners first, then expand to DE/ES/UK with a proven playbook.',
    icon: Flag,
  },
  {
    priority: 'important' as const,
    title: 'Use B2B2C as the moat',
    description: '1 practitioner sale → ~30 members over time. This creates organic distribution that B2C and B2B competitors can\'t replicate.',
    icon: Shield,
  },
  {
    priority: 'opportunity' as const,
    title: 'Position for the "Woebot gap"',
    description: 'Woebot\'s shutdown left a gap: clinically-grounded AI mental health. Position Bloom as what Woebot should have been — AI anchored in real care.',
    icon: Lightbulb,
  },
]

// All sources referenced on this page
const ALL_SOURCES: CompetitorSource[] = [
  // Market sizing
  { label: 'Digital Mental Health Market — $33B (2025), Towards Healthcare', url: 'https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing' },
  { label: 'EU Mental Health Apps Market — $2.2B (2025), Grand View Research', url: 'https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe' },
  // Between-session gap
  { label: 'Between-session homework non-adherence 20-50%, JMIR Mental Health (2017)', url: 'https://mental.jmir.org/2017/2/e20/' },
  { label: 'Tailoring between-session activities, CHI 2024 / PMC', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11197942/' },
  // SimplePractice
  { label: 'SimplePractice Pricing ($49-99/mo)', url: 'https://www.simplepractice.com/pricing/' },
  { label: 'SimplePractice 2025 Impact — 250K+ practitioners', url: 'https://www.simplepractice.com/blog/2025-impact-roundup/' },
  { label: 'Vista Equity acquires EngageSmart for $4B, BusinessWire', url: 'https://www.businesswire.com/news/home/20231023294863/en/EngageSmart-Agrees-to-Be-Acquired-by-Vista-Equity-Partners-for-4-0-Billion' },
  // Jane App
  { label: 'Jane App Pricing (CAD $54-99/mo)', url: 'https://jane.app/pricing' },
  { label: 'Jane $1.8B valuation, BetaKit', url: 'https://betakit.com/jane-software-to-be-reportedly-valued-at-1-8-billion-in-upcoming-secondary-financing/' },
  { label: 'Jane bootstrapped growth story, Mark MacLeod', url: 'https://markmacleod.me/jane-apps-alison-taylor-on-building-a-600-person-profitable-healthcare-company-without-venture-capital/' },
  // Doctolib
  { label: 'Doctolib €348M ARR, 80M patients, 400K practitioners, Sifted', url: 'https://sifted.eu/articles/doctolib-results-2024' },
  { label: 'Doctolib $6.4B valuation, TechCrunch', url: 'https://techcrunch.com/2022/03/15/healthcare-tech-platform-doctolib-reaches-6-4-billion-valuation/' },
  { label: 'Doctolib pricing & business breakdown, Contrary Research', url: 'https://research.contrary.com/company/doctolib' },
  // Headspace
  { label: 'Headspace Pricing ($12.99/mo)', url: 'https://www.headspace.com/subscriptions' },
  { label: 'Headspace 80M+ downloads, Business of Apps', url: 'https://www.businessofapps.com/data/headspace-statistics/' },
  { label: 'Headspace-Ginger merger → $3B, TechCrunch', url: 'https://techcrunch.com/2021/08/25/headspace-and-ginger-are-merging-to-form-headspace-health/' },
  // BetterHelp
  { label: 'BetterHelp Pricing ($280-400/mo)', url: 'https://www.betterhelp.com/advice/general/how-much-does-betterhelp-cost/' },
  { label: 'BetterHelp 5M+ users, Yahoo Finance', url: 'https://finance.yahoo.com/news/betterhelp-surpasses-5-million-people-170000559.html' },
  { label: 'Teladoc $1B loss, BetterHelp revenue decline, Healthcare Dive', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
  // Spring Health
  { label: 'Spring Health $3.3B valuation, Series E, Fortune', url: 'https://www.springhealth.com/news/fortune-exclusive-ai-powered-mental-health-startup-boosts-valuation' },
  { label: 'Spring Health 450 employers, 20M+ lives, BHB', url: 'https://bhbusiness.com/2024/07/31/mental-health-startup-spring-health-secures-100m-series-e-valuation-soars-to-3-3b/' },
  { label: 'Spring Health PEPM range, Oliver Wyman', url: 'https://www.oliverwyman.com/our-expertise/perspectives/health/2025/april/3-keys-to-unlocking-value-in-an-evolving-eap-market.html' },
  // Moka.care
  { label: 'Moka.care €15M Series A, Sifted', url: 'https://sifted.eu/articles/moka-care-15m-series-a' },
  { label: 'Moka.care raises $16M, TechCrunch', url: 'https://techcrunch.com/2022/05/24/moka-care-raises-16-million-for-its-corporate-mental-health-service/' },
  // Woebot
  { label: 'Woebot app shutdown, MobiHealthNews', url: 'https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app' },
  { label: 'Woebot $123M total funding, BHB', url: 'https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/' },
  { label: 'Woebot FDA Breakthrough Device designation', url: 'https://woebothealth.com/woebot-health-receives-fda-breakthrough-device-designation/' },
  { label: 'Why Woebot shut down, STAT News', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
  // Wysa
  { label: 'Wysa $20M Series B, TechCrunch', url: 'https://techcrunch.com/2022/07/14/wysa-20-million-series-b-funding-expand-therapist-chatbot-wider-mental-health-services/' },
  { label: 'Wysa NHS — 31 services, 117K patients', url: 'https://blogs.wysa.io/blog/company-news/nhs-tackles-mental-health-crisis-with-ai' },
  { label: 'Wysa App Store pricing ($99.99/yr)', url: 'https://apps.apple.com/us/app/wysa-mental-health-support/id1166585565' },
]

// ── Market Map (2x2 visual) ──────────────────────────────────────────────

function MarketMap() {
  const dots: Array<{ name: string; x: number; y: number; color: string; size?: string }> = [
    { name: 'SimplePractice', x: 12, y: 20, color: 'bg-blue-400' },
    { name: 'Jane App', x: 18, y: 25, color: 'bg-blue-400' },
    { name: 'Doctolib', x: 25, y: 12, color: 'bg-blue-400' },
    { name: 'Headspace', x: 85, y: 30, color: 'bg-emerald-400' },
    { name: 'BetterHelp', x: 78, y: 35, color: 'bg-emerald-400' },
    { name: 'Spring Health', x: 55, y: 28, color: 'bg-amber-400' },
    { name: 'Moka.care', x: 52, y: 18, color: 'bg-amber-400' },
    { name: 'Wysa', x: 82, y: 60, color: 'bg-violet-400' },
    { name: 'Woebot', x: 72, y: 55, color: 'bg-violet-300' },
    { name: 'Bloomsline', x: 50, y: 85, color: 'bg-gray-900', size: 'large' },
  ]

  return (
    <div className="relative w-full aspect-[4/3] max-w-2xl mx-auto">
      <div className="absolute inset-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="absolute top-3 left-3 text-[9px] text-gray-300 font-medium">Admin-focused</div>
        <div className="absolute top-3 right-3 text-[9px] text-gray-300 font-medium">Admin-focused</div>
        <div className="absolute bottom-3 left-3 text-[9px] text-gray-300 font-medium">Practitioner-only</div>
        <div className="absolute bottom-3 right-3 text-[9px] text-gray-300 font-medium">Member-only</div>
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-100" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-100" />
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
        <div className="absolute top-[5%] left-[30%] right-[30%] bottom-[55%] bg-indigo-50/50 border border-dashed border-indigo-200 rounded-lg flex items-center justify-center">
          <span className="text-[10px] font-semibold text-indigo-400">THE GAP</span>
        </div>
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
      <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-blue-700 mb-1">Practice Tools</p>
        <p className="text-[10px] text-blue-500">SimplePractice, Jane, Doctolib</p>
        <p className="text-[10px] text-blue-400 mt-2">Run the business</p>
        <p className="text-[10px] text-red-400 font-medium">No member experience</p>
      </div>
      <div className="flex flex-col items-center shrink-0">
        <ArrowRight className="w-4 h-4 text-gray-300 mb-1" />
        <div className="bg-gray-900 text-white rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] font-bold">Bloomsline</p>
          <p className="text-[9px] text-gray-300">Both sides</p>
          <p className="text-[9px] text-gray-300">+ AI</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300 mt-1 rotate-180" />
      </div>
      <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-xs font-bold text-emerald-700 mb-1">Wellness Apps</p>
        <p className="text-[10px] text-emerald-500">Headspace, BetterHelp, Wysa</p>
        <p className="text-[10px] text-emerald-400 mt-2">Help the individual</p>
        <p className="text-[10px] text-red-400 font-medium">No practitioner connection</p>
      </div>
    </div>
  )
}

// ── Badges ───────────────────────────────────────────────────────────────

function ThreatBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-gray-50 text-gray-500 border-gray-200',
  }
  const labels = { high: 'High', medium: 'Medium', low: 'Low' }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: 'critical' | 'important' | 'opportunity' }) {
  const styles = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    important: 'bg-amber-50 text-amber-700 border-amber-200',
    opportunity: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border capitalize ${styles[priority]}`}>
      {priority}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CompetitiveLandscapePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Competitive Landscape</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Market Positioning & Competitive Intelligence</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ──────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nobody owns the space between sessions.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Mental health tech is fragmented into silos — practice tools for clinicians, wellness apps for consumers,
            enterprise platforms for HR. Nobody connects both sides with AI. Bloomsline sits in the gap that everyone else ignores:
            the 167 hours between weekly sessions where care should still be happening.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">$33B market</span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">0 dual-sided platforms</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">No AI-native competitor in EU</span>
          </div>
          <div className="mt-2">
            <SourceLink href="https://www.towardshealthcare.com/insights/digital-mental-health-market-sizing">
              $33B: Towards Healthcare, Digital Mental Health Market (2025)
            </SourceLink>
          </div>
        </motion.section>

        {/* ── 2. The Gap ───────────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="Two worlds that don't talk to each other">The Gap</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <GapVisualization />
          </div>
        </motion.section>

        {/* ── 3. Market Positioning Map ────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="Where each competitor sits — and the gap Bloomsline occupies alone">Market Positioning Map</SectionTitle>
          <MarketMap />
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
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
          <p className="text-[10px] text-gray-400 text-center mt-3 italic">
            No competitor sits in the upper center — AI-powered and dual-sided.
          </p>
        </motion.section>

        {/* ── 4. Competitor Profiles ───────────────────────────── */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle="What each player does well, where they fall short, and why they matter">Competitor Profiles</SectionTitle>
          {CATEGORIES.map((cat) => {
            const competitors = COMPETITORS.filter((c) => c.category === cat.id)
            if (competitors.length === 0) return null
            return (
              <div key={cat.id} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                  <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                </div>
                <div className="space-y-3">
                  {competitors.map((comp) => (
                    <div key={comp.name} className={`${cat.lightBg} border ${cat.borderColor} rounded-xl p-5`}>
                      {/* Header row */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-bold ${cat.textColor}`}>{comp.name}</span>
                            <ThreatBadge level={comp.threatLevel} />
                          </div>
                          <p className="text-xs text-gray-500">{comp.oneLiner}</p>
                        </div>
                        <a
                          href={comp.pricingSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shrink-0 hover:text-indigo-500 hover:border-indigo-200 transition-colors flex items-center gap-1"
                          title={comp.pricingSource.label}
                        >
                          {comp.pricing}
                          <ExternalLink className="w-2 h-2 opacity-40" />
                        </a>
                      </div>

                      {/* Meta row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-[10px]">
                        <div>
                          <span className="text-gray-400 font-medium">Target:</span>{' '}
                          <span className="text-gray-600">{comp.target}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Scale:</span>{' '}
                          <span className="text-gray-600">{comp.fundingOrScale}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-medium">Differentiator:</span>{' '}
                          <span className="text-gray-600">{comp.keyDifferentiator}</span>
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-600 mb-1">Strengths</p>
                          <ul className="space-y-0.5">
                            {comp.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-red-500 mb-1">Weaknesses</p>
                          <ul className="space-y-0.5">
                            {comp.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                <XCircle className="w-3 h-3 text-red-300 shrink-0 mt-0.5" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Feature icons row */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200/60">
                        {FEATURE_COLUMNS.map((col) => (
                          <div key={col.key} className="flex items-center gap-1">
                            <FeatureIcon value={comp.features[col.key]} />
                            <span className="text-[9px] text-gray-400">{col.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Sources */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-gray-200/40">
                        {comp.sources.map((src, i) => (
                          <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </motion.section>

        {/* ── 5. Feature Comparison Table ──────────────────────── */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle="Bloomsline is the only platform that checks every box">Feature Comparison</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto">
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
                    <td className="py-2 px-2 text-gray-400">
                      <a href={comp.pricingSource.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-500 transition-colors" title={comp.pricingSource.label}>
                        {comp.pricing}
                      </a>
                    </td>
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
          </div>
        </motion.section>

        {/* ── 6. Competitive Moats ────────────────────────────── */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle="What makes each competitor hard to displace — and what makes Bloomsline defensible">Competitive Moats</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-x-auto mb-6">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Competitor Moats</h3>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-medium w-32">Competitor</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Primary Moat</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium w-24">Threat</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((comp) => {
                  const cat = CATEGORIES.find((c) => c.id === comp.category)!
                  return (
                    <tr key={comp.name} className="border-b border-gray-50">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${cat.color}`} />
                          <span className="font-medium text-gray-800">{comp.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{comp.moat}</td>
                      <td className="py-2 px-2"><ThreatBadge level={comp.threatLevel} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h3 className="text-xs font-semibold text-gray-700 mb-3">Bloomsline&apos;s Defensibility</h3>
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
        </motion.section>

        {/* ── 7. Threat Assessment ────────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="Which competitors could block us — and why we believe we can win anyway">Threat Assessment</SectionTitle>

          {(() => {
            const high = COMPETITORS.filter((c) => c.threatLevel === 'high')
            const medium = COMPETITORS.filter((c) => c.threatLevel === 'medium')
            const low = COMPETITORS.filter((c) => c.threatLevel === 'low')
            return (
              <div className="space-y-4">
                {high.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🔴</span>
                      <h3 className="text-xs font-bold text-red-700">High Threat</h3>
                    </div>
                    {high.map((comp) => (
                      <div key={comp.name} className="bg-red-50 border border-red-200 rounded-xl p-5 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-red-800">{comp.name}</span>
                          <span className="text-[10px] text-red-500">{comp.fundingOrScale}</span>
                        </div>
                        <p className="text-xs text-red-700 mb-2">{comp.threatReason}</p>
                        <div className="bg-white/60 rounded-lg p-3 mb-2">
                          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Our defense:</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">{comp.defense}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {comp.sources.map((src, i) => (
                            <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {medium.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">🟡</span>
                      <h3 className="text-xs font-bold text-amber-700">Medium Threat</h3>
                    </div>
                    <div className="space-y-2">
                      {medium.map((comp) => (
                        <div key={comp.name} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-amber-800">{comp.name}</span>
                            <span className="text-[10px] text-amber-500">{comp.fundingOrScale}</span>
                          </div>
                          <p className="text-[10px] text-amber-700 mb-2">{comp.threatReason}</p>
                          <div className="bg-white/60 rounded-lg p-2.5 mb-2">
                            <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Our defense:</p>
                            <p className="text-[10px] text-gray-600 leading-relaxed">{comp.defense}</p>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {comp.sources.map((src, i) => (
                              <SourceLink key={i} href={src.url}>{src.label}</SourceLink>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {low.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">⚪</span>
                      <h3 className="text-xs font-bold text-gray-500">Low Threat</h3>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                      {low.map((comp) => (
                        <div key={comp.name} className="px-4 py-3 flex items-start gap-3">
                          <div className="flex items-center gap-2 shrink-0 w-28">
                            <span className="text-xs font-semibold text-gray-700">{comp.name}</span>
                          </div>
                          <p className="text-[10px] text-gray-500">{comp.threatReason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </motion.section>

        {/* ── 8. Uncontested Market Spaces ─────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle="Where the market is underserved — openings Bloomsline is built to own">Uncontested Market Spaces</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {UNCONTESTED_SPACES.map((space) => {
              const Icon = space.icon
              return (
                <div key={space.title} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900">{space.title}</h4>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mb-2">{space.description}</p>
                  <div className="flex items-start gap-1 mb-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-emerald-600 font-medium">{space.signal}</p>
                  </div>
                  {'sourceUrl' in space && space.sourceUrl && (
                    <SourceLink href={space.sourceUrl}>Source</SourceLink>
                  )}
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 9. Market Validation ─────────────────────────────── */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle="External signals that confirm our positioning is right">Market Validation</SectionTitle>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 mb-1">Woebot Shut Down Its Consumer App (June 2025)</p>
                <p className="text-xs text-amber-700 leading-relaxed mb-2">
                  The most clinically rigorous AI mental health app ($123M raised, Stanford-backed) could not survive as a standalone B2C product.
                  It pivoted to enterprise-only B2B. This validates our thesis: <span className="font-semibold">standalone AI mental health apps don&apos;t work.</span> The AI needs
                  to be anchored to a real care relationship. Bloomsline&apos;s B2B2C model — AI embedded in the practitioner-member journey — is the sustainable path.
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <SourceLink href="https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/">STAT News — Why Woebot shut down</SourceLink>
                  <SourceLink href="https://www.mobihealthnews.com/news/woebot-health-shutting-down-its-app">MobiHealthNews — Woebot app shutdown</SourceLink>
                  <SourceLink href="https://bhbusiness.com/2022/03/20/woebot-health-gets-9m-investment-from-bayer-ag-brings-total-funding-to-123m/">BHB — $123M total funding</SourceLink>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-800 mb-1">The European Opportunity</p>
                <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                  SimplePractice, BetterHelp, Spring Health — <span className="font-semibold">none operate in Europe.</span> Doctolib
                  dominates booking but isn&apos;t a care platform. Moka.care and Unmind serve enterprises only. There is no AI-native, practitioner-focused
                  mental health SaaS for the European market. Bloomsline is building in this white space — GDPR-native, French-first, with EN/FR/ES from day one.
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <SourceLink href="https://www.grandviewresearch.com/horizon/outlook/mental-health-apps-market/europe">Grand View Research — EU Mental Health Apps Market</SourceLink>
                  <SourceLink href="https://sifted.eu/articles/doctolib-results-2024">Sifted — Doctolib 2024 results</SourceLink>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 10. How Bloomsline Wins ──────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle="Our competitive strategy">How Bloomsline Wins</SectionTitle>
          <div className="space-y-3">
            {STRATEGIC_RECS.map((rec) => {
              const Icon = rec.icon
              return (
                <div key={rec.title} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={rec.priority} />
                      <p className="text-xs font-bold text-gray-900">{rec.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{rec.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200 shrink-0 mt-1" />
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ── 11. Sources ─────────────────────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle="All data points on this page are sourced from public filings, pricing pages, press coverage, and analyst reports">Sources</SectionTitle>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {ALL_SOURCES.map((src, i) => (
                <div key={i} className="py-1">
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-indigo-500 underline underline-offset-2 decoration-indigo-200 hover:text-indigo-700 leading-relaxed inline-flex items-start gap-1"
                  >
                    <span className="text-gray-300 shrink-0 font-mono w-4 text-right">{i + 1}.</span>
                    <span>{src.label}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── 12. Footer ──────────────────────────────────────── */}
        <motion.div {...fadeUp(0.55)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Research as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

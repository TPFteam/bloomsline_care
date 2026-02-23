'use client'

import { motion } from 'framer-motion'
import {
  Globe,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Scale,
  Zap,
  Clock,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  MapPin,
  BarChart3,
  Shield,
  Building2,
  Handshake,
  Laptop,
  Key,
  ShoppingCart,
  Eye,
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

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{value}</span>
    </div>
  )
}

function SeverityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${color}`}>
      {label}
    </span>
  )
}

// ── Market Attractiveness Data ──────────────────────────────────────────

interface MarketScore {
  country: string
  flag: string
  region: string
  phase: string
  phaseColor: string
  marketSize: number        // 1-10
  growthRate: number        // 1-10
  competitiveIntensity: number // 1-10 (10 = low competition = good)
  regulatoryEnv: number     // 1-10
  customerAccess: number    // 1-10
  infraReady: number        // 1-10
  weightedTotal: number     // calculated
  practitioners: string
  marketValue: string
  keyInsight: string
}

// Weights: Market Size 25%, Growth 15%, Competition 20%, Regulatory 20%, Customer Access 10%, Infrastructure 10%
const WEIGHTS = { marketSize: 0.25, growthRate: 0.15, competitiveIntensity: 0.20, regulatoryEnv: 0.20, customerAccess: 0.10, infraReady: 0.10 }

function calcWeighted(m: Omit<MarketScore, 'weightedTotal'>) {
  return Math.round((
    m.marketSize * WEIGHTS.marketSize +
    m.growthRate * WEIGHTS.growthRate +
    m.competitiveIntensity * WEIGHTS.competitiveIntensity +
    m.regulatoryEnv * WEIGHTS.regulatoryEnv +
    m.customerAccess * WEIGHTS.customerAccess +
    m.infraReady * WEIGHTS.infraReady
  ) * 10) / 10
}

const MARKETS_RAW: Omit<MarketScore, 'weightedTotal'>[] = [
  {
    country: 'France',
    flag: '🇫🇷',
    region: 'Western Europe',
    phase: 'Active',
    phaseColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketSize: 8,
    growthRate: 8,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 9,
    infraReady: 9,
    practitioners: '89,800 psychologists (30K independent)',
    marketValue: '€166M SOM (2025)',
    keyInsight: 'Home market. MonParcoursPsy reimbursement, AFTCC partnerships, zero AI-native competitors. 21% YoY practitioner growth.',
  },
  {
    country: 'Belgium',
    flag: '🇧🇪',
    region: 'Western Europe',
    phase: 'Phase 2',
    phaseColor: 'bg-blue-50 text-blue-700 border-blue-200',
    marketSize: 5,
    growthRate: 7,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 8,
    infraReady: 8,
    practitioners: '~12,500 psychologists',
    marketValue: '€22M estimated',
    keyInsight: 'French-speaking (Wallonia + Brussels = 55% of population). Zero localization needed for fr-BE. Natural extension of French GTM. Similar regulatory framework.',
  },
  {
    country: 'Switzerland',
    flag: '🇨🇭',
    region: 'Western Europe',
    phase: 'Phase 2',
    phaseColor: 'bg-blue-50 text-blue-700 border-blue-200',
    marketSize: 5,
    growthRate: 6,
    competitiveIntensity: 8,
    regulatoryEnv: 6,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~10,200 psychologists',
    marketValue: '€35M estimated',
    keyInsight: 'High purchasing power (CHF pricing at premium). French-speaking Romandie (25% of population) = zero localization. Non-EU but GDPR-equivalent (nDSG). Higher willingness to pay.',
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    region: 'Central Europe',
    phase: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 9,
    growthRate: 8,
    competitiveIntensity: 7,
    regulatoryEnv: 8,
    customerAccess: 5,
    infraReady: 8,
    practitioners: '~56,000 psychotherapists',
    marketValue: '€420M estimated',
    keyInsight: 'Largest EU mental health market. DiGA pathway = insurance-reimbursed revenue (€200-500 per 90-day prescription). Requires full German localization. High regulatory bar but high reward.',
  },
  {
    country: 'Netherlands',
    flag: '🇳🇱',
    region: 'Western Europe',
    phase: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 5,
    growthRate: 7,
    competitiveIntensity: 8,
    regulatoryEnv: 8,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~22,000 psychologists',
    marketValue: '€58M estimated',
    keyInsight: 'High English proficiency reduces localization costs. Progressive mental health policies. Strong digital health adoption. NZa (Dutch Healthcare Authority) data standards favorable.',
  },
  {
    country: 'Spain',
    flag: '🇪🇸',
    region: 'Southern Europe',
    phase: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 7,
    growthRate: 9,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 6,
    infraReady: 7,
    practitioners: '~38,000 psychologists',
    marketValue: '€95M estimated',
    keyInsight: 'Fastest-growing EU mental health market. i18n already supports Spanish (es). Lower pricing required (€15-22/mo). Strong private practice culture. Growing AI interest.',
  },
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Northern Europe',
    phase: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 9,
    growthRate: 7,
    competitiveIntensity: 6,
    regulatoryEnv: 6,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~65,000 registered practitioners',
    marketValue: '€380M estimated',
    keyInsight: 'Large market but more competitive (NHS ecosystem, IAPT pathway). Post-Brexit = separate data regime (UK GDPR). English = no localization. Wysa has NHS validation — Bloomsline needs evidence base.',
  },
  {
    country: 'Italy',
    flag: '🇮🇹',
    region: 'Southern Europe',
    phase: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 7,
    growthRate: 7,
    competitiveIntensity: 8,
    regulatoryEnv: 5,
    customerAccess: 5,
    infraReady: 6,
    practitioners: '~52,000 psychologists',
    marketValue: '€110M estimated',
    keyInsight: 'Large practitioner base but fragmented regional regulations. Bonus Psicologo program (government subsidy) drives demand. Italian localization required. Slower tech adoption in clinical settings.',
  },
  {
    country: 'United States',
    flag: '🇺🇸',
    region: 'North America',
    phase: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 10,
    growthRate: 8,
    competitiveIntensity: 3,
    regulatoryEnv: 5,
    customerAccess: 4,
    infraReady: 9,
    practitioners: '530K licensed professionals',
    marketValue: '$3.8B SOM',
    keyInsight: 'Largest global market but most competitive (SimplePractice 237K users, TherapyNotes, BetterHelp). HIPAA compliance required. State-by-state licensure. High CAC ($200-500). Enter only with proven EU model + Series A funding.',
  },
  {
    country: 'Canada',
    flag: '🇨🇦',
    region: 'North America',
    phase: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 6,
    growthRate: 7,
    competitiveIntensity: 5,
    regulatoryEnv: 6,
    customerAccess: 6,
    infraReady: 8,
    practitioners: '~48,000 psychologists',
    marketValue: '$280M estimated',
    keyInsight: 'Bilingual (English/French) = partial localization advantage. Jane App dominant but no AI. Provincial regulation complexity. PIPEDA privacy framework. French-Canadian market is natural bridge.',
  },
]

const MARKETS: MarketScore[] = MARKETS_RAW.map((m) => ({
  ...m,
  weightedTotal: calcWeighted(m),
})).sort((a, b) => b.weightedTotal - a.weightedTotal)

const FACTOR_LABELS = [
  { key: 'marketSize' as const, label: 'Market Size', weight: '25%' },
  { key: 'growthRate' as const, label: 'Growth Rate', weight: '15%' },
  { key: 'competitiveIntensity' as const, label: 'Low Competition', weight: '20%' },
  { key: 'regulatoryEnv' as const, label: 'Regulatory Fit', weight: '20%' },
  { key: 'customerAccess' as const, label: 'Customer Access', weight: '10%' },
  { key: 'infraReady' as const, label: 'Infrastructure', weight: '10%' },
]

// ── Entry Mode Data ─────────────────────────────────────────────────────

interface EntryMode {
  name: string
  icon: typeof Globe
  color: string
  borderColor: string
  bgColor: string
  description: string
  pros: string[]
  cons: string[]
  cost: string
  timeline: string
  bestFor: string
  recommended: boolean
  recommendedFor: string
}

const ENTRY_MODES: EntryMode[] = [
  {
    name: 'Digital-First Entry',
    icon: Laptop,
    color: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    description: 'Launch the existing platform in new markets with localization, remote marketing, and digital-only GTM. No local office or team. Leverage existing infrastructure (Supabase EU, Vercel global CDN). Lowest risk, fastest deployment.',
    pros: [
      'Lowest cost — €5-15K per market entry',
      'Fastest launch — 4-8 weeks per market',
      'Zero fixed overhead — no office, no local hires',
      'Fully reversible — can exit market with no sunk costs',
      'Tests demand before committing resources',
    ],
    cons: [
      'Limited local market knowledge without on-ground presence',
      'Harder to build trust with practitioner communities remotely',
      'Support timezone gaps for distant markets',
      'No local regulatory expertise without advisors',
    ],
    cost: '€5-15K per market',
    timeline: '4-8 weeks',
    bestFor: 'Phase 2 (Belgium, Switzerland) and Phase 3 markets',
    recommended: true,
    recommendedFor: 'All initial market entries — test demand before committing capital',
  },
  {
    name: 'Direct Entry',
    icon: Building2,
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    description: 'Establish a local entity, hire country managers, and build market presence from scratch. Full control over brand, pricing, and operations. Highest investment but deepest market penetration.',
    pros: [
      'Full control over brand positioning and pricing',
      'Deep local market understanding through dedicated team',
      'Strongest relationship-building with practitioner associations',
      'Can customize product for local regulatory requirements',
    ],
    cons: [
      'Highest cost — €80-150K per market (entity + team + compliance)',
      'Slowest — 6-12 months to first revenue',
      'Fixed overhead regardless of traction',
      'Management bandwidth stretched across multiple markets',
      'Irreversible costs if market doesn\'t work',
    ],
    cost: '€80-150K per market',
    timeline: '6-12 months',
    bestFor: 'Germany (DiGA pathway requires local entity) or US entry',
    recommended: false,
    recommendedFor: 'Only for markets with proven demand and Series A funding',
  },
  {
    name: 'Partnership / Joint Venture',
    icon: Handshake,
    color: 'text-violet-700',
    borderColor: 'border-violet-200',
    bgColor: 'bg-violet-50',
    description: 'Partner with local training institutes, professional associations, or complementary health-tech companies. They provide distribution and local credibility; Bloomsline provides the platform. Revenue share or co-marketing agreements.',
    pros: [
      'Instant local credibility through established partner brand',
      'Access to existing practitioner networks (AFTCC model replicable)',
      'Shared costs and reduced financial risk',
      'Local regulatory knowledge from partner',
      'Distribution at near-zero CAC through partner channels',
    ],
    cons: [
      'Revenue sharing reduces margin (typically 20-30% to partner)',
      'Less control over brand messaging and positioning',
      'Partner misalignment risk (different priorities)',
      'Dependency on partner\'s execution quality',
      'Slower decision-making with multiple stakeholders',
    ],
    cost: '€10-30K setup + 20-30% revenue share',
    timeline: '3-6 months',
    bestFor: 'Training institute partnerships in any EU market',
    recommended: true,
    recommendedFor: 'Phase 2-3 markets where training institutes exist',
  },
  {
    name: 'Acquisition',
    icon: ShoppingCart,
    color: 'text-amber-700',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    description: 'Acquire a small local mental health SaaS or practice management tool to gain instant user base, local compliance, and market presence. Highest cost but fastest path to scale in competitive markets.',
    pros: [
      'Instant user base and revenue (day-one traction)',
      'Acquire local compliance frameworks and certifications',
      'Eliminate a competitor while gaining their customers',
      'Team acquisition (local talent + domain expertise)',
    ],
    cons: [
      'Highest cost — €200K-2M+ depending on target',
      'Integration complexity (tech stack, culture, data migration)',
      'Requires Series A+ funding (not viable at pre-seed)',
      'Target quality varies — legacy code, high churn possible',
      'Due diligence is resource-intensive for a small team',
    ],
    cost: '€200K-2M+',
    timeline: '4-8 months (diligence + integration)',
    bestFor: 'Post-Series A expansion into competitive markets (UK, US)',
    recommended: false,
    recommendedFor: 'Only with Series A funding and >500 practitioners on platform',
  },
  {
    name: 'Licensing / Franchise',
    icon: Key,
    color: 'text-rose-700',
    borderColor: 'border-rose-200',
    bgColor: 'bg-rose-50',
    description: 'License the Bloomsline platform to local operators who manage their own market under the Bloomsline brand (or white-label). They handle sales, support, and compliance; Bloomsline provides the technology.',
    pros: [
      'Rapid geographic coverage with minimal capital',
      'Local operators handle sales and support',
      'Recurring licensing revenue with high margin',
      'Tests multiple markets simultaneously',
    ],
    cons: [
      'Lowest control over quality and brand experience',
      'Finding qualified licensees is difficult in health-tech',
      'Practitioner trust in local operator, not Bloomsline brand',
      'Complex legal framework for health data across jurisdictions',
      'Not viable until platform is proven and documented',
    ],
    cost: '€15-25K legal setup per market',
    timeline: '6-9 months (find + onboard licensee)',
    bestFor: 'Distant markets where Bloomsline has no expertise (MENA, Asia)',
    recommended: false,
    recommendedFor: 'Only post-Series B for markets outside EU/NA',
  },
]

// ── Localization Requirements ───────────────────────────────────────────

interface LocalizationReq {
  market: string
  flag: string
  product: string[]
  pricing: string
  cultural: string[]
  legal: string[]
  talent: string[]
}

const LOCALIZATIONS: LocalizationReq[] = [
  {
    market: 'Belgium',
    flag: '🇧🇪',
    product: [
      'No UI changes — French (fr-BE) supported via existing i18n',
      'Add Belgian insurance integrations (INAMI/RIZIV codes)',
      'Adapt member content for Belgian mental health terminology',
    ],
    pricing: '€19-29/mo (same as France — similar purchasing power and practitioner income €50-65K)',
    cultural: [
      'Dual-community sensitivity (Flemish vs. Walloon)',
      'Marketing in French for Wallonia/Brussels, Dutch for Flanders (Phase 3+)',
      'Belgians value personal recommendation over advertising — referral-first GTM',
    ],
    legal: [
      'GDPR applies directly (EU member state)',
      'Belgian Commission for the Protection of Privacy (APD/GBA)',
      'Psychologist title protected — verify credential requirements',
      'No HDS-equivalent but health data processing rules apply',
    ],
    talent: [
      'No local hire needed initially — serve from France',
      'French-speaking community manager (part-time) by M6 of entry',
      'Belgian psychology association liaison (BFPPS/APPPsy)',
    ],
  },
  {
    market: 'Switzerland',
    flag: '🇨🇭',
    product: [
      'No UI changes for Romandie (French-speaking Switzerland)',
      'CHF currency support (important — Swiss prefer CHF billing)',
      'Adapt to Swiss psychology association (FSP) requirements',
    ],
    pricing: 'CHF 29-39/mo (premium pricing — Swiss practitioner income €80-120K, 1.5-2x France)',
    cultural: [
      'Quality and precision matter more than price — position on clinical rigor',
      'Swiss German market (65% of population) requires separate localization',
      'Data residency expectations are high — Swiss prefer Swiss or EU hosting',
    ],
    legal: [
      'Non-EU but nDSG (new Data Protection Act) is GDPR-equivalent',
      'Federal Act on Data Protection (FADP) compliance required',
      'Cantonal variations in health regulation (26 cantons)',
      'No EU AI Act obligation but Swiss follow EU standards voluntarily',
    ],
    talent: [
      'No local hire needed for Romandie launch',
      'Swiss market advisor (contract) for regulatory navigation',
      'FSP partnership contact within 3 months of entry',
    ],
  },
  {
    market: 'Germany',
    flag: '🇩🇪',
    product: [
      'Full German localization (UI, AI prompts, member content, help docs)',
      'Add i18n locale: de-DE to existing en/fr/es framework',
      'DiGA-compatible data export and interoperability (FHIR)',
      'German-specific AI fine-tuning for clinical notes terminology',
    ],
    pricing: '€25-35/mo (German practitioners earn €55-75K, higher willingness to pay than France). DiGA reimbursement: €200-500 per 90-day prescription if approved.',
    cultural: [
      'Evidence-based positioning — Germans require clinical validation claims',
      'Privacy is paramount — lead with data protection messaging',
      'Formal communication style (Sie vs. Du decision in product)',
      'Professional association endorsement critical (DGPs, BDP)',
    ],
    legal: [
      'GDPR + Bundesdatenschutzgesetz (BDSG) — strictest EU interpretation',
      'DiGA pathway requires BfArM approval (Federal Institute for Drugs)',
      'Medical device classification assessment needed for AI features',
      'Telemediengesetz (TMG) for digital service compliance',
    ],
    talent: [
      'German-speaking country manager (full-time, €50-65K)',
      'Clinical advisor with German licensure',
      'DiGA regulatory consultant (€15-25K project)',
      'German content writer for clinical terminology',
    ],
  },
  {
    market: 'Spain',
    flag: '🇪🇸',
    product: [
      'Spanish localization already exists (es) — verify clinical terminology',
      'Adapt AI prompts for Castilian Spanish (vs. LatAm Spanish)',
      'Add Spanish-specific assessment tools (e.g., BDI-II Spanish validation)',
    ],
    pricing: '€15-22/mo (Spanish practitioners earn €35-50K — adjust pricing to 60-75% of French tier)',
    cultural: [
      'Relationship-driven sales — cold outreach less effective than introductions',
      'Regional identity matters (Catalonia, Basque Country, Andalusia)',
      'Private practice is growing rapidly but still nascent vs. public system',
      'Mental health stigma declining fast — 40% increase in therapy demand since 2020',
    ],
    legal: [
      'GDPR applies + Ley Orgánica de Protección de Datos (LOPDGDD)',
      'AEPD (Spanish Data Protection Agency) — active enforcement',
      'Registro de Actividades de Tratamiento required',
      'Regional health authority variations (17 autonomous communities)',
    ],
    talent: [
      'Spanish-speaking community manager (part-time, €25-35K)',
      'Partnership with Colegio Oficial de Psicólogos (COP)',
      'No local entity needed initially — invoice via French entity',
    ],
  },
  {
    market: 'United Kingdom',
    flag: '🇬🇧',
    product: [
      'English UI already exists — adapt for British English terminology',
      'NHS DTAC (Digital Technology Assessment Criteria) compliance',
      'Integration with UK assessment frameworks (PHQ-9, GAD-7 standard)',
      'UK-specific safeguarding protocols for AI features',
    ],
    pricing: '£22-29/mo (UK practitioners earn £40-55K — price comparable to France in GBP)',
    cultural: [
      'Evidence-based healthcare culture — NICE guidelines are the gold standard',
      'NHS referral pathways important for credibility even in private practice',
      'BACP and BPS membership signals trust — partner with both',
      'Stepped-care model (IAPT) means practitioners familiar with tech-enabled care',
    ],
    legal: [
      'UK GDPR (post-Brexit) — similar to EU GDPR but separate ICO jurisdiction',
      'Data adequacy decision allows EU-UK data transfer (until 2025 review)',
      'CQC registration may be required depending on service classification',
      'NHS DTAC for credibility in public-sector adjacent practice',
    ],
    talent: [
      'UK country manager (full-time, £45-55K)',
      'Clinical lead with HCPC registration',
      'UK entity required (Ltd company) for NHS pathway',
    ],
  },
  {
    market: 'United States',
    flag: '🇺🇸',
    product: [
      'Full HIPAA compliance build (BAA, encryption, audit logging)',
      'Integration with US EHR standards (HL7 FHIR)',
      'State-specific licensure verification for practitioner onboarding',
      'US-specific insurance/billing integration (CPT codes)',
    ],
    pricing: '$39-59/mo (US practitioners earn $60-90K — price at SimplePractice-competitive level, include AI as differentiator)',
    cultural: [
      'Feature comparison culture — practitioners compare SimplePractice vs. TherapyNotes vs. Bloomsline',
      'Insurance billing integration is table stakes (not optional)',
      'High willingness to pay for time-saving tools',
      'State-by-state marketing — no "US-wide" approach works',
    ],
    legal: [
      'HIPAA (Health Insurance Portability and Accountability Act) — full compliance required',
      'State privacy laws (CCPA in California, etc.)',
      'FDA SaMD guidance for AI features — classification assessment needed',
      '50-state patchwork of mental health licensure and telehealth laws',
    ],
    talent: [
      'US GM / VP of Sales (full-time, $120-150K)',
      'HIPAA compliance officer',
      'US entity (Delaware C-corp or subsidiary)',
      'US-based customer success team (2-3 FTEs)',
    ],
  },
]

// ── 12-Month Roadmap ────────────────────────────────────────────────────

interface RoadmapMonth {
  month: string
  phase: string
  phaseColor: string
  milestones: string[]
  markets: string
}

const ROADMAP: RoadmapMonth[] = [
  {
    month: 'M1-M2',
    phase: 'Foundation',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France (deepen)',
    milestones: [
      'Reach 30+ paying practitioners in France',
      'Validate unit economics: CAC <€50, churn <6%, NPS >40',
      'Document expansion playbook: onboarding flow, GTM checklist, support SOP',
      'Research Belgium/Switzerland practitioner associations',
      'Begin CHF billing integration for Switzerland',
    ],
  },
  {
    month: 'M3',
    phase: 'Belgium Prep',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France + Belgium (prep)',
    milestones: [
      'Launch Belgian landing page (fr-BE) — zero product changes needed',
      'Contact APPPsy and BFPPS (Belgian psychology associations)',
      'Identify 5 Belgian early-adopter practitioners through French network referrals',
      'Set up Belgian billing (same Stripe account, EUR)',
    ],
  },
  {
    month: 'M4',
    phase: 'Belgium Launch',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'France + Belgium (live)',
    milestones: [
      'Onboard first 5-10 Belgian practitioners',
      'Run first Belgian practitioner webinar (French language)',
      'Begin LinkedIn outreach to Belgian solo practitioners',
      'Track Belgium-specific metrics separately from France',
    ],
  },
  {
    month: 'M5',
    phase: 'Switzerland Prep',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France + Belgium + Switzerland (prep)',
    milestones: [
      'Launch Swiss landing page (Romandie — French-speaking)',
      'CHF billing live on Stripe',
      'Contact FSP (Swiss psychology federation)',
      'Swiss regulatory consultation (nDSG compliance check)',
      'Target: 50+ practitioners total across FR + BE',
    ],
  },
  {
    month: 'M6',
    phase: 'Switzerland Launch',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'France + Belgium + Switzerland (live)',
    milestones: [
      'Onboard first 5 Swiss practitioners (Romandie)',
      'Premium pricing validated (CHF 29-39)',
      'Milestone: 60+ practitioners, €2K+ MRR across 3 markets',
      'Document multi-market learnings for Series A investor narrative',
    ],
  },
  {
    month: 'M7-M8',
    phase: 'German Localization',
    phaseColor: 'text-violet-700 bg-violet-50 border-violet-200',
    markets: 'FR + BE + CH + Germany (prep)',
    milestones: [
      'Begin German (de-DE) localization: UI, AI prompts, help docs',
      'Hire German-speaking community manager (part-time)',
      'DiGA pathway research: engage BfArM consultant',
      'Contact DGPs and BDP (German psychology associations)',
      'Begin clinical evidence collection for DiGA application',
    ],
  },
  {
    month: 'M9',
    phase: 'Series A + Spain Prep',
    phaseColor: 'text-violet-700 bg-violet-50 border-violet-200',
    markets: 'FR + BE + CH + DE (prep) + ES (prep)',
    milestones: [
      'Series A conversations active — present multi-market traction',
      'Verify Spanish (es) clinical terminology accuracy',
      'Contact Colegio Oficial de Psicólogos (Spain)',
      'Adjust Spanish pricing tier (€15-22/mo)',
      'Target: 100+ practitioners across French-speaking markets',
    ],
  },
  {
    month: 'M10',
    phase: 'Germany + Spain Launch',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'FR + BE + CH + Germany + Spain (live)',
    milestones: [
      'Germany soft launch: 10 early-adopter practitioners',
      'Spain soft launch: 10 early-adopter practitioners',
      'German localization complete and live',
      'Spanish clinical terminology validated by local advisor',
    ],
  },
  {
    month: 'M11',
    phase: 'Scale & Optimize',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: '5 markets live',
    milestones: [
      'Per-market churn analysis — identify retention patterns by country',
      'Optimize onboarding for each market based on drop-off data',
      'Launch referral programs localized per market',
      'Target: 150+ practitioners, €5K+ MRR, 5 active markets',
    ],
  },
  {
    month: 'M12',
    phase: 'Review & Plan',
    phaseColor: 'text-amber-700 bg-amber-50 border-amber-200',
    markets: '5 markets live + UK/NL assessment',
    milestones: [
      'Full market performance review: CAC, LTV, churn, NPS per market',
      'Decision gate: which markets scale, which pause, which exit',
      'UK and Netherlands entry assessment based on Year 1 learnings',
      'DiGA application status review (Germany)',
      'Target: 200+ practitioners, €7K+ MRR, clear Series A narrative',
    ],
  },
]

// ── Investment Requirements ─────────────────────────────────────────────

interface BudgetLine {
  category: string
  amount: string
  percentage: number
  items: string[]
}

const BUDGET: BudgetLine[] = [
  {
    category: 'Product Localization',
    amount: '€35-50K',
    percentage: 25,
    items: [
      'German localization (UI + AI prompts + docs): €15-20K',
      'Spanish clinical terminology verification: €3-5K',
      'CHF billing + multi-currency infrastructure: €2-3K',
      'Per-market landing pages and SEO setup: €5-8K',
      'Assessment tool localization: €5-8K',
    ],
  },
  {
    category: 'Go-to-Market',
    amount: '€30-45K',
    percentage: 22,
    items: [
      'LinkedIn outreach campaigns per market: €8-12K',
      'Practitioner association sponsorships (5 markets): €10-15K',
      'Content creation (blog posts, webinars per language): €8-12K',
      'Conference attendance / booths (2-3 EU events): €5-8K',
    ],
  },
  {
    category: 'Team & Talent',
    amount: '€40-60K',
    percentage: 30,
    items: [
      'German community manager (part-time, 6 months): €15-20K',
      'Spanish community manager (part-time, 3 months): €8-10K',
      'Clinical advisors per market (3 markets × €3-5K): €9-15K',
      'Regulatory consultants (DiGA + nDSG): €10-15K',
    ],
  },
  {
    category: 'Legal & Compliance',
    amount: '€20-30K',
    percentage: 15,
    items: [
      'Multi-market GDPR compliance review: €8-12K',
      'Swiss nDSG compliance assessment: €3-5K',
      'DiGA pre-application consultation: €5-8K',
      'Terms of service localization (5 markets): €4-6K',
    ],
  },
  {
    category: 'Infrastructure & Operations',
    amount: '€10-15K',
    percentage: 8,
    items: [
      'Multi-region hosting optimization: €3-5K',
      'Payment provider setup (Stripe multi-currency): €2-3K',
      'Analytics and per-market dashboards: €3-4K',
      'Customer support tooling (multi-language): €2-3K',
    ],
  },
]

const TOTAL_BUDGET = '€135-200K'

// ── Success Metrics ─────────────────────────────────────────────────────

interface KPI {
  metric: string
  sixMonth: string
  twelveMonth: string
  measurement: string
}

const KPIS: KPI[] = [
  { metric: 'Total Practitioners', sixMonth: '60+', twelveMonth: '200+', measurement: 'Active paying subscriptions across all markets' },
  { metric: 'Markets Live', sixMonth: '3 (FR, BE, CH)', twelveMonth: '5 (+ DE, ES)', measurement: 'Markets with >5 paying practitioners' },
  { metric: 'Monthly Recurring Revenue', sixMonth: '€2K+', twelveMonth: '€7K+', measurement: 'Total MRR across all markets' },
  { metric: 'Blended CAC', sixMonth: '<€60', twelveMonth: '<€75', measurement: 'Total GTM spend / new practitioners acquired' },
  { metric: 'Per-Market Churn', sixMonth: '<6%', twelveMonth: '<5%', measurement: 'Monthly churn rate per market (not blended)' },
  { metric: 'NPS by Market', sixMonth: '>35', twelveMonth: '>40', measurement: 'Net Promoter Score per market (quarterly survey)' },
  { metric: 'Activation Rate', sixMonth: '>50%', twelveMonth: '>60%', measurement: '% of new signups generating first AI note within 7 days' },
  { metric: 'Member Engagement', sixMonth: '>40%', twelveMonth: '>50%', measurement: '% of invited members completing 1+ between-session activity' },
  { metric: 'Referral Rate', sixMonth: '>15%', twelveMonth: '>25%', measurement: '% of new practitioners from existing user referrals' },
  { metric: 'Revenue per Market', sixMonth: 'FR: €1.5K, BE/CH: €250 each', twelveMonth: 'FR: €4K, DE: €1K, ES: €500, BE/CH: €750 each', measurement: 'MRR per market — track concentration risk' },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function MarketEntryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Market Entry Analysis</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — European & Global Expansion Strategy, Q1 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">10 markets scored. 5 entry modes evaluated. One playbook.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Bloomsline&apos;s B2B2C architecture and existing i18n framework (en/fr/es) make multi-market expansion structurally
            efficient — each new market reuses 80-90% of the platform. This analysis scores 10 target markets on 6 weighted factors,
            evaluates 5 entry modes, maps localization requirements per country, and delivers a 12-month roadmap from France
            to 5 live European markets.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">France: home market (active)</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Phase 2: Belgium + Switzerland</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">Phase 3: Germany + Spain + UK</span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Phase 4: US + Canada + Italy</span>
          </div>

          {/* Business context summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Global TAM', value: '$33B', sub: '18.6% CAGR → $88B by 2030' },
              { label: 'EU SOM', value: '€166M', sub: '22.7% CAGR → $500M by 2030' },
              { label: 'EU Practitioners', value: '400K+', sub: 'Psychologists + counselors' },
              { label: 'Current Pricing', value: '€19-49/mo', sub: '85% gross margin, €50 CAC' },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{stat.value}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── 2. Market Attractiveness Scoring ────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="10 markets scored on 6 weighted factors — sorted by weighted total">
            Market Attractiveness Scoring
          </SectionTitle>

          {/* Factor weights legend */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {FACTOR_LABELS.map((f) => (
              <div key={f.key} className="flex items-center gap-1">
                <span className="text-[9px] font-semibold text-gray-500">{f.label}</span>
                <span className="text-[8px] text-gray-400">({f.weight})</span>
              </div>
            ))}
          </div>

          {/* Market cards */}
          <div className="space-y-3">
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.country}
                className="bg-white border border-gray-200 rounded-xl p-5"
                {...fadeUp(0.07 + i * 0.03)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{market.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{market.country}</h4>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${market.phaseColor}`}>
                          {market.phase}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">{market.region} — {market.practitioners}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${
                      market.weightedTotal >= 7.5 ? 'text-emerald-600' :
                      market.weightedTotal >= 6.5 ? 'text-blue-600' :
                      market.weightedTotal >= 5.5 ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {market.weightedTotal}
                    </p>
                    <p className="text-[9px] text-gray-400">/ 10</p>
                  </div>
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-4">
                  {FACTOR_LABELS.map((f) => (
                    <div key={f.key}>
                      <p className="text-[9px] text-gray-400 mb-0.5">{f.label}</p>
                      <ScoreBar
                        value={market[f.key]}
                        color={
                          market[f.key] >= 8 ? 'bg-emerald-500' :
                          market[f.key] >= 6 ? 'bg-blue-500' :
                          market[f.key] >= 4 ? 'bg-amber-500' :
                          'bg-red-500'
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Insight + value */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 leading-relaxed">{market.keyInsight}</p>
                  </div>
                  <div className="shrink-0 bg-gray-50 rounded-lg px-3 py-1.5 text-right">
                    <p className="text-[9px] text-gray-400">Market Value</p>
                    <p className="text-[10px] font-bold text-gray-700">{market.marketValue}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 3. Entry Mode Analysis ──────────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle="5 entry modes evaluated — pros, cons, cost, and timeline for each">
            Entry Mode Analysis
          </SectionTitle>

          <div className="space-y-4">
            {ENTRY_MODES.map((mode, i) => {
              const ModeIcon = mode.icon
              return (
                <motion.div
                  key={mode.name}
                  className={`bg-white border ${mode.recommended ? mode.borderColor : 'border-gray-200'} rounded-xl p-5`}
                  {...fadeUp(0.37 + i * 0.04)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${mode.bgColor} flex items-center justify-center`}>
                        <ModeIcon className={`w-4 h-4 ${mode.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{mode.name}</h4>
                          {mode.recommended && (
                            <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">{mode.recommendedFor}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{mode.description}</p>

                  {/* Cost + Timeline badges */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-700">{mode.cost}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-700">{mode.timeline}</span>
                    </div>
                  </div>

                  {/* Pros + Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">Advantages</p>
                      <div className="space-y-1">
                        {mode.pros.map((p, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-emerald-700">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">Challenges</p>
                      <div className="space-y-1">
                        {mode.cons.map((c, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700">{c}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Best for */}
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <p className="text-[10px] text-blue-700">
                      <span className="font-semibold">Best for:</span> {mode.bestFor}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Recommendation summary */}
          <motion.div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mt-4" {...fadeUp(0.55)}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-800">Recommended Approach: Digital-First + Partnership Hybrid</h4>
            </div>
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              Enter every market digital-first (4-8 weeks, €5-15K) to test demand. Layer partnership with local training institutes
              and professional associations for distribution. Only escalate to direct entry for markets that demonstrate strong PMF
              (Germany/DiGA pathway) or require local entity (US/HIPAA). This approach keeps total Year 1 expansion investment under €200K
              while testing 5 markets and preserving optionality to exit any market with near-zero sunk cost.
            </p>
          </motion.div>
        </motion.section>

        {/* ── 4. Localization Requirements ────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle="Product, pricing, cultural, legal, and talent needs per market">
            Localization Requirements
          </SectionTitle>

          <div className="space-y-4">
            {LOCALIZATIONS.map((loc, i) => (
              <motion.div
                key={loc.market}
                className="bg-white border border-gray-200 rounded-xl p-5"
                {...fadeUp(0.62 + i * 0.03)}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-lg">{loc.flag}</span>
                  <h4 className="text-sm font-bold text-gray-900">{loc.market}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Product */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Laptop className="w-3 h-3" /> Product Adaptations
                    </p>
                    <div className="space-y-1">
                      {loc.product.map((p, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-700">{p}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal */}
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-violet-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Legal & Compliance
                    </p>
                    <div className="space-y-1">
                      {loc.legal.map((l, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-violet-700">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cultural */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Cultural Considerations
                    </p>
                    <div className="space-y-1">
                      {loc.cultural.map((c, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-700">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Talent */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Talent & Operations
                    </p>
                    <div className="space-y-1">
                      {loc.talent.map((t, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-emerald-700">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-start gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-600">
                    <span className="font-semibold">Pricing:</span> {loc.pricing}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 5. 12-Month Entry Roadmap ───────────────────────── */}
        <motion.section {...fadeUp(0.8)}>
          <SectionTitle subtitle="Month-by-month milestones from France beachhead to 5 live markets">
            12-Month Entry Roadmap
          </SectionTitle>

          <div className="space-y-3">
            {ROADMAP.map((month, i) => (
              <motion.div
                key={month.month}
                className="bg-white border border-gray-200 rounded-xl p-4"
                {...fadeUp(0.82 + i * 0.025)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${month.phaseColor}`}>
                    {month.month}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{month.phase}</h4>
                    <p className="text-[9px] text-gray-400">{month.markets}</p>
                  </div>
                </div>
                <div className="space-y-1.5 pl-1">
                  {month.milestones.map((m, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-600">{m}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Investment Requirements ──────────────────────── */}
        <motion.section {...fadeUp(1.05)}>
          <SectionTitle subtitle="Budget estimate for Year 1 multi-market expansion">
            Investment Requirements
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            {/* Total */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-900">Total Year 1 Expansion Budget</p>
                <p className="text-[10px] text-gray-400">5 markets (FR deepening + BE + CH + DE + ES)</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{TOTAL_BUDGET}</p>
                <p className="text-[9px] text-gray-400">from seed raise (€300-500K)</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {BUDGET.map((line, i) => (
                <motion.div key={line.category} {...fadeUp(1.07 + i * 0.03)}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">{line.category}</span>
                      <span className="text-[9px] text-gray-400">({line.percentage}%)</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{line.amount}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        line.percentage >= 25 ? 'bg-blue-500' :
                        line.percentage >= 20 ? 'bg-emerald-500' :
                        line.percentage >= 15 ? 'bg-violet-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${line.percentage * 3.33}%` }}
                    />
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {line.items.map((item, j) => (
                      <p key={j} className="text-[9px] text-gray-400">{item}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Funding source note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <span className="font-semibold">Funding allocation:</span> Expansion budget represents 35-50% of seed raise (€300-500K).
              Remaining funds cover core product development (40%), France GTM (25%), team salaries (20%), and operations (10%).
              Non-dilutive funding sources can reduce pressure: Bpifrance Bourse French Tech (€30K), EU EIC Accelerator (up to €2.5M),
              Horizon Europe mental health grants. Total expansion cost per market averages €27-40K — among the lowest in health-tech
              due to the digital-first entry model and existing multi-language infrastructure.
            </p>
          </div>
        </motion.section>

        {/* ── 7. Success Metrics ──────────────────────────────── */}
        <motion.section {...fadeUp(1.2)}>
          <SectionTitle subtitle="KPIs for first 6 months and first 12 months of expansion">
            Success Metrics
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">6 Month Target</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">12 Month Target</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Measurement</th>
                  </tr>
                </thead>
                <tbody>
                  {KPIS.map((kpi, i) => (
                    <tr key={kpi.metric} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 text-[10px] font-semibold text-gray-700">{kpi.metric}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-blue-600 text-center">{kpi.sixMonth}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-emerald-600 text-center">{kpi.twelveMonth}</td>
                      <td className="px-4 py-2.5 text-[9px] text-gray-500">{kpi.measurement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision gates */}
          <motion.div className="mt-4 space-y-3" {...fadeUp(1.25)}>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              Decision Gates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Scale</p>
                <p className="text-[10px] text-emerald-700">&gt;20 practitioners, &lt;5% churn, NPS &gt;40 → increase investment, hire local team</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Hold</p>
                <p className="text-[10px] text-amber-700">10-20 practitioners, 5-8% churn → maintain presence, optimize before scaling</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-1">Exit</p>
                <p className="text-[10px] text-red-700">&lt;10 practitioners after 6 months, &gt;8% churn → pause market, reallocate budget</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── 8. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(1.3)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Strategic Synthesis</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">Structural Advantages</p>
                <div className="space-y-2">
                  {[
                    'B2B2C architecture scales to any market — 1 practitioner sale = 12-15 free members',
                    'Existing i18n (en/fr/es) covers 60% of EU population with minimal effort',
                    'Digital-first entry costs €5-15K per market — fully reversible',
                    'EU regulatory compliance (GDPR, AI Act) transfers across all 27 member states',
                    'Zero direct competitors in EU between-session care category',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">Key Constraints</p>
                <div className="space-y-2">
                  {[
                    'Two-person team cannot expand and build product simultaneously — sequence matters',
                    'France PMF must be proven before any expansion (30+ practitioners, <5% churn)',
                    'German DiGA pathway requires clinical evidence Bloomsline doesn\'t yet have',
                    'US entry requires HIPAA build + $200K+ investment — not viable before Series A',
                    'Each new language adds AI prompt engineering complexity and QA cost',
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
              <p className="text-xs font-semibold text-white mb-2">The Expansion Thesis</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                Bloomsline&apos;s expansion advantage is structural, not tactical. The B2B2C model means every new market entry is
                capital-efficient (€5-15K to test, €27-40K to scale). The regulatory moat deepens with each EU market entered.
                The playbook is simple: <span className="text-white font-semibold">win France first, expand to French-speaking markets at near-zero cost,
                then use proven unit economics to justify Series A funding for Germany, Spain, and the UK.</span> The US
                is a Phase 4 ambition — not a distraction. The path to 200+ practitioners across 5 European markets in 12 months
                is achievable with seed funding alone.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <motion.div {...fadeUp(1.35)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Analysis as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

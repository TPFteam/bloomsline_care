'use client'

import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Crown,
  Star,
  Gift,
  Percent,
  Calculator,
  Layers,
  Building2,
  Brain,
  ChevronRight,
  ExternalLink,
  Clock,
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

function ScoreBar({ score, max = 10, color }: { score: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(score / max) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-12 text-right">{score}/{max}</span>
    </div>
  )
}

// ── 1. COMPETITOR PRICING AUDIT ──────────────────────────────────────────

interface CompetitorPrice {
  name: string
  category: string
  starter: string
  mid: string
  top: string
  aiAddon: string
  memberApp: string
  target: string
  moat: string
}

const COMPETITORS: CompetitorPrice[] = [
  {
    name: 'SimplePractice',
    category: 'Practice Management',
    starter: '$49/mo',
    mid: '$79/mo',
    top: '$99/mo',
    aiAddon: 'None',
    memberApp: 'None',
    target: 'US solo practitioners',
    moat: 'Scale (250K+ users), $4B Vista acquisition',
  },
  {
    name: 'TherapyNotes',
    category: 'Practice Management',
    starter: '$69/mo',
    mid: '$79 + $50/clinician',
    top: 'Enterprise (30+ users)',
    aiAddon: '$40/mo (AI Scribe)',
    memberApp: 'None',
    target: 'US practices + groups',
    moat: 'Clinical depth, claims processing',
  },
  {
    name: 'Jane App',
    category: 'Practice Management',
    starter: 'C$54/mo (~€37)',
    mid: 'C$79/mo (~€54)',
    top: 'C$99/mo (~€68)',
    aiAddon: 'None',
    memberApp: 'None',
    target: 'CA/AU allied health',
    moat: 'Multi-discipline, $1.8B valuation',
  },
  {
    name: 'Doctolib',
    category: 'Booking/Admin',
    starter: '€139/mo',
    mid: 'Custom (group)',
    top: '+€99/mo AI assistant',
    aiAddon: '€99/mo (phone AI)',
    memberApp: 'Patient app (booking only)',
    target: 'EU physicians + specialists',
    moat: '400K practitioners, €348M ARR, network effect',
  },
  {
    name: 'Ensora Health',
    category: 'Practice Management',
    starter: '$29/mo',
    mid: '$49/mo',
    top: '$89/mo',
    aiAddon: 'None',
    memberApp: 'Client portal',
    target: 'US budget-conscious solo',
    moat: 'Low price point entry',
  },
  {
    name: 'Headspace',
    category: 'B2C Wellness',
    starter: '$12.99/mo',
    mid: '$69.99/yr',
    top: '$399.99 lifetime',
    aiAddon: 'Built-in',
    memberApp: 'Is the product',
    target: 'Consumers, students',
    moat: '80M downloads, brand recognition',
  },
  {
    name: 'Spring Health',
    category: 'Enterprise EAP',
    starter: '$5-14 PEPM',
    mid: 'Outcome-based',
    top: 'Custom enterprise',
    aiAddon: 'ML matching built-in',
    memberApp: 'Employee app',
    target: 'Large employers (450+)',
    moat: '$3.3B valuation, clinical outcomes data',
  },
]

// ── 2. VALUE-BASED PRICING ──────────────────────────────────────────────

interface ValueDriver {
  dimension: string
  practitionerValue: string
  annualSavings: string
  bloomslinePrice: string
  valueMultiple: string
}

const VALUE_DRIVERS: ValueDriver[] = [
  {
    dimension: 'Admin time saved',
    practitionerValue: '5-8 hrs/week × €40/hr = €10,400-€16,640/yr',
    annualSavings: '€10,400+',
    bloomslinePrice: '€300/yr (Starter)',
    valueMultiple: '35x',
  },
  {
    dimension: 'Client retention improvement',
    practitionerValue: '2-3 fewer dropoffs/yr × €80/session × 10 sessions = €1,600-€2,400',
    annualSavings: '€1,600+',
    bloomslinePrice: '€300/yr',
    valueMultiple: '5x',
  },
  {
    dimension: 'Between-session visibility',
    practitionerValue: 'Catch crises early, reduce no-shows, improve outcomes — priceless for reputation',
    annualSavings: '€2,000+ (est.)',
    bloomslinePrice: '€300/yr',
    valueMultiple: '7x',
  },
  {
    dimension: 'Outcome documentation',
    practitionerValue: 'Referral partners want data. Group practices need ROI proof. Insurance trend.',
    annualSavings: '€1,500+ (new revenue)',
    bloomslinePrice: '€300/yr',
    valueMultiple: '5x',
  },
  {
    dimension: 'AI-assisted notes & patterns',
    practitionerValue: 'Reduces note-taking from 20min → 5min per session. 15 sessions/week = 3.75 hrs saved.',
    annualSavings: '€7,800+ (time value)',
    bloomslinePrice: '€300/yr',
    valueMultiple: '26x',
  },
]

// ── 3. COST-PLUS ANALYSIS ───────────────────────────────────────────────

interface CostComponent {
  item: string
  costPerPractitioner: string
  monthly: string
  note: string
}

const COST_STRUCTURE: CostComponent[] = [
  {
    item: 'Claude Haiku API (AI engine)',
    costPerPractitioner: '€1.80/mo',
    monthly: '€1.80',
    note: 'Primary variable cost. Haiku 4.5: $1/MTok in, $5/MTok out. ~3K tokens/interaction.',
  },
  {
    item: 'Supabase (database + auth)',
    costPerPractitioner: '€0.50/mo',
    monthly: '€0.50',
    note: 'Pro plan at €25/mo shared across 50+ practitioners. Scales sub-linearly.',
  },
  {
    item: 'Hosting (Vercel/EU)',
    costPerPractitioner: '€0.30/mo',
    monthly: '€0.30',
    note: 'Next.js on Vercel. EU region for GDPR. Generous free tier initially.',
  },
  {
    item: 'PostHog analytics',
    costPerPractitioner: '€0.10/mo',
    monthly: '€0.10',
    note: 'EU-hosted. Free tier covers first 1M events/month.',
  },
  {
    item: 'Email/notifications',
    costPerPractitioner: '€0.05/mo',
    monthly: '€0.05',
    note: 'Transactional emails, push notifications.',
  },
  {
    item: 'Support & onboarding labor',
    costPerPractitioner: '€1.50/mo',
    monthly: '€1.50',
    note: 'White-glove onboarding amortized. Drops to €0.50 at scale with self-serve.',
  },
]

// ── 4. PRICE ELASTICITY ─────────────────────────────────────────────────

interface ElasticityPoint {
  price: number
  demandIndex: number
  revenueIndex: number
  segment: string
  note: string
}

const ELASTICITY_CURVE: ElasticityPoint[] = [
  { price: 15, demandIndex: 100, revenueIndex: 60, segment: 'Maximum adoption', note: 'Below cost floor. Unsustainable.' },
  { price: 19, demandIndex: 95, revenueIndex: 72, segment: 'High adoption', note: 'Charm price. Impulse zone. €0.63/day.' },
  { price: 25, demandIndex: 85, revenueIndex: 85, segment: 'Sweet spot', note: 'Current base model. Less than 1 cancelled session.' },
  { price: 29, demandIndex: 78, revenueIndex: 91, segment: 'Near-optimal', note: 'Charm price. "Under €30" psychological barrier.' },
  { price: 39, demandIndex: 65, revenueIndex: 101, segment: 'Revenue max', note: 'Revenue-maximizing point. Filters tire-kickers.' },
  { price: 49, demandIndex: 50, revenueIndex: 98, segment: 'Premium', note: 'Matches SimplePractice Starter. Credibility signal.' },
  { price: 79, demandIndex: 30, revenueIndex: 95, segment: 'High anchor', note: 'Pro tier territory. Only with proven outcomes.' },
  { price: 99, demandIndex: 18, revenueIndex: 71, segment: 'Exclusion', note: 'Too expensive for solo French practitioners.' },
]

// ── 5. PSYCHOLOGICAL PRICING ─────────────────────────────────────────────

interface PricingTactic {
  tactic: string
  mechanism: string
  implementation: string
  expectedLift: string
}

const PSYCH_TACTICS: PricingTactic[] = [
  {
    tactic: 'Charm pricing (€X9)',
    mechanism: 'Left-digit effect — €29 feels closer to €20 than €30. ~15-20% conversion lift in SaaS.',
    implementation: 'Price tiers at €19, €29, €49 instead of €20, €30, €50.',
    expectedLift: '+15-20%',
  },
  {
    tactic: 'Decoy effect (asymmetric dominance)',
    mechanism: 'Middle tier becomes obviously best value when surrounded by a limited cheap tier and expensive pro tier.',
    implementation: 'Essentiel at €19 (limited), Pro at €29 (best value badge), Cabinet at €49 (anchor). Pro gets 90% of signups.',
    expectedLift: '+25-30%',
  },
  {
    tactic: 'Anchoring against alternatives',
    mechanism: 'Frame price against the cost of what they already lose: 1 cancelled session = €60-80. Bloomsline = €29/mo.',
    implementation: '"Less than one cancelled session per month" on pricing page. "Doctolib costs €139/mo with no AI."',
    expectedLift: '+10-15%',
  },
  {
    tactic: 'Daily cost framing',
    mechanism: 'Reduce sticker shock by converting monthly to daily. €29/mo = €0.97/day = "less than a coffee."',
    implementation: '"For less than a daily espresso, keep your entire caseload visible between sessions."',
    expectedLift: '+8-12%',
  },
  {
    tactic: 'Loss aversion framing',
    mechanism: 'People feel losses 2x more than equivalent gains. Frame around what they lose without Bloomsline.',
    implementation: '"Every month without Bloomsline, you lose visibility on 120+ between-session hours per client."',
    expectedLift: '+12-18%',
  },
  {
    tactic: 'Social proof tiering',
    mechanism: 'Label the middle tier "Most Popular" — creates bandwagon effect, reduces decision paralysis.',
    implementation: '"Most Popular" badge on Pro tier. Show "87% of practitioners choose this plan."',
    expectedLift: '+20-25%',
  },
]

// ── 6. TIER RECOMMENDATION ──────────────────────────────────────────────

interface PricingTier {
  name: string
  price: string
  priceAnnual: string
  tagline: string
  target: string
  color: string
  borderColor: string
  badge?: string
  features: string[]
  limits: string[]
  rationale: string
}

const TIERS: PricingTier[] = [
  {
    name: 'Essentiel',
    price: '€19/mo',
    priceAnnual: '€190/yr (save €38)',
    tagline: 'Get started with between-session care',
    target: 'Solo practitioners testing the waters. Low commitment entry.',
    color: 'bg-gray-50 text-gray-700',
    borderColor: 'border-gray-200',
    features: [
      'Up to 10 active clients',
      'Member app (free for clients)',
      'Basic Bloom AI companion',
      'Session notes (manual)',
      'Progress tracking',
      'Email support',
    ],
    limits: [
      'No AI-assisted notes',
      'No pattern detection',
      'No outcome reports',
      'No custom resources',
    ],
    rationale: 'Exists to get practitioners in the door. Low price removes objections. Designed to feel limited — drives upgrades within 60 days.',
  },
  {
    name: 'Pro',
    price: '€29/mo',
    priceAnnual: '€290/yr (save €58)',
    tagline: 'The complete between-session care platform',
    target: 'Independent practitioners with 15-25 active clients. Marie persona.',
    color: 'bg-indigo-50 text-indigo-700',
    borderColor: 'border-indigo-300',
    badge: 'Most Popular',
    features: [
      'Unlimited active clients',
      'Full Bloom AI companion',
      'AI-assisted session notes',
      'Pattern detection & alerts',
      'Outcome tracking & reports',
      'Custom resource creation',
      'Client engagement dashboard',
      'Priority support',
      'Data export',
    ],
    limits: [
      'Single practitioner',
      'No team management',
      'No API access',
    ],
    rationale: 'The hero tier. 90% of solo practitioners should land here. €29 is a charm price, below the €30 psychological barrier, less than 1 cancelled session (€60-80).',
  },
  {
    name: 'Cabinet',
    price: '€49/mo base + €19/practitioner',
    priceAnnual: '€490/yr + €190/practitioner',
    tagline: 'For group practices that need a unified view',
    target: 'Group practice directors (Thomas persona). 3-8 practitioners.',
    color: 'bg-violet-50 text-violet-700',
    borderColor: 'border-violet-300',
    features: [
      'Everything in Pro',
      'Multi-practitioner management',
      'Team dashboard & analytics',
      'Cross-practitioner insights',
      'Practice-level outcome reports',
      'Custom branding (logo, colors)',
      'Admin roles & permissions',
      'Dedicated onboarding',
      'API access',
      'Phone support',
    ],
    limits: [
      'Up to 15 practitioners',
      'Enterprise needs custom quote',
    ],
    rationale: 'Higher ACV play. €49 base + €19/head → 5-practitioner group = €144/mo (~€29/head). Volume discount baked in. Anchors the solo Pro tier as a deal.',
  },
]

// ── 7. DISCOUNT STRATEGY ─────────────────────────────────────────────────

interface DiscountRule {
  scenario: string
  discount: string
  mechanism: string
  duration: string
  guard: string
}

const DISCOUNTS: DiscountRule[] = [
  {
    scenario: 'Annual commitment',
    discount: '~17% (2 months free)',
    mechanism: 'Pay annually at 10x monthly rate instead of 12x. Standard SaaS practice.',
    duration: 'Permanent while annual',
    guard: 'Auto-renews. No refund after 30 days.',
  },
  {
    scenario: 'Referral reward',
    discount: '1 month free per referral',
    mechanism: 'Practitioner refers a colleague who pays for 1+ month. Both get 1 month free.',
    duration: 'One-time credit',
    guard: 'Cap at 3 free months/year. Referee must convert to paid.',
  },
  {
    scenario: 'Training institute partnership',
    discount: '100% free for 12 months',
    mechanism: 'Newly certified practitioners from partner institutes (AFTCC, IFFORTHECC) get a free year.',
    duration: '12 months',
    guard: 'Must have graduated within 6 months. Auto-converts to Pro at €29/mo.',
  },
  {
    scenario: 'Conference/event trial',
    discount: '60-day free trial (vs standard 14)',
    mechanism: 'Extended trial for practitioners met at conferences. White-glove onboarding included.',
    duration: '60 days',
    guard: 'Requires in-person or video onboarding call. No credit card required.',
  },
  {
    scenario: 'Group volume discount',
    discount: '15-25% for 10+ seats',
    mechanism: 'Cabinet tier: 10+ practitioners → €16/head. 15+ → custom pricing.',
    duration: 'While on annual contract',
    guard: 'Minimum 12-month commitment. Annual billing only.',
  },
  {
    scenario: 'Student / trainee',
    discount: '50% off Pro',
    mechanism: '€14.50/mo for psychology students and trainees. Verified via .edu or enrollment proof.',
    duration: 'Until graduation + 6 months',
    guard: 'Must verify enrollment annually. Pipeline investment.',
  },
]

// ── NEVER DISCOUNT ──────────────────────────────────────────────────────

const NEVER_DISCOUNT = [
  'Never discount in response to price objections in the first conversation — reframe value instead.',
  'Never discount below €19/mo (cost floor is ~€4.25/mo, but brand devaluation is worse).',
  'Never offer permanent discounts — all promotions are time-bound with auto-conversion.',
  'Never publicly display discount codes — creates discount-hunting behavior.',
  'Never discount the member premium tier (€3/mo) — it\'s already trivially cheap.',
]

// ── 8. REVENUE PROJECTIONS ──────────────────────────────────────────────

interface MonthlyProjection {
  month: number
  label: string
  practitioners: number
  mrr: number
  arr: number
  memberPremium: number
  totalMrr: number
}

interface Scenario {
  name: string
  color: string
  bgColor: string
  pricing: string
  assumptions: string[]
  projections: MonthlyProjection[]
  m18Arr: string
  m36Arr: string
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Conservative',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    pricing: '€19/mo avg (heavy Essentiel mix)',
    assumptions: [
      '60% Essentiel / 35% Pro / 5% Cabinet',
      '20% initial growth → 5% mature growth',
      '5% monthly churn',
      'Blended ARPU: €19/mo',
      '3% member premium conversion',
    ],
    projections: [
      { month: 1, label: 'M1', practitioners: 10, mrr: 190, arr: 2280, memberPremium: 9, totalMrr: 199 },
      { month: 6, label: 'M6', practitioners: 45, mrr: 855, arr: 10260, memberPremium: 49, totalMrr: 904 },
      { month: 12, label: 'M12', practitioners: 105, mrr: 1995, arr: 23940, memberPremium: 113, totalMrr: 2108 },
      { month: 18, label: 'M18', practitioners: 175, mrr: 3325, arr: 39900, memberPremium: 189, totalMrr: 3514 },
      { month: 24, label: 'M24', practitioners: 230, mrr: 4370, arr: 52440, memberPremium: 248, totalMrr: 4618 },
      { month: 36, label: 'M36', practitioners: 320, mrr: 6080, arr: 72960, memberPremium: 346, totalMrr: 6426 },
    ],
    m18Arr: '€42K',
    m36Arr: '€77K',
  },
  {
    name: 'Base Case',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    pricing: '€29/mo avg (Pro-dominant mix)',
    assumptions: [
      '20% Essentiel / 70% Pro / 10% Cabinet',
      '30% initial growth → 7% mature growth',
      '4% monthly churn',
      'Blended ARPU: €29/mo',
      '5% member premium conversion at €3/mo',
    ],
    projections: [
      { month: 1, label: 'M1', practitioners: 10, mrr: 290, arr: 3480, memberPremium: 18, totalMrr: 308 },
      { month: 6, label: 'M6', practitioners: 65, mrr: 1885, arr: 22620, memberPremium: 117, totalMrr: 2002 },
      { month: 12, label: 'M12', practitioners: 180, mrr: 5220, arr: 62640, memberPremium: 324, totalMrr: 5544 },
      { month: 18, label: 'M18', practitioners: 340, mrr: 9860, arr: 118320, memberPremium: 612, totalMrr: 10472 },
      { month: 24, label: 'M24', practitioners: 500, mrr: 14500, arr: 174000, memberPremium: 900, totalMrr: 15400 },
      { month: 36, label: 'M36', practitioners: 850, mrr: 24650, arr: 295800, memberPremium: 1530, totalMrr: 26180 },
    ],
    m18Arr: '€126K',
    m36Arr: '€314K',
  },
  {
    name: 'Aggressive',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    pricing: '€35/mo avg (Pro + Cabinet upsell)',
    assumptions: [
      '10% Essentiel / 65% Pro / 25% Cabinet',
      '35% initial growth → 7% mature growth',
      '3% monthly churn',
      'Blended ARPU: €35/mo',
      '8% member premium conversion at €3/mo',
    ],
    projections: [
      { month: 1, label: 'M1', practitioners: 10, mrr: 350, arr: 4200, memberPremium: 36, totalMrr: 386 },
      { month: 6, label: 'M6', practitioners: 85, mrr: 2975, arr: 35700, memberPremium: 306, totalMrr: 3281 },
      { month: 12, label: 'M12', practitioners: 260, mrr: 9100, arr: 109200, memberPremium: 936, totalMrr: 10036 },
      { month: 18, label: 'M18', practitioners: 520, mrr: 18200, arr: 218400, memberPremium: 1872, totalMrr: 20072 },
      { month: 24, label: 'M24', practitioners: 780, mrr: 27300, arr: 327600, memberPremium: 2808, totalMrr: 30108 },
      { month: 36, label: 'M36', practitioners: 1400, mrr: 49000, arr: 588000, memberPremium: 5040, totalMrr: 54040 },
    ],
    m18Arr: '€241K',
    m36Arr: '€649K',
  },
]

// ── 9. MONETIZATION OPPORTUNITIES ────────────────────────────────────────

interface MonetizationOp {
  opportunity: string
  model: string
  timing: string
  revenueEstimate: string
  risk: string
  priority: string
}

const MONETIZATION: MonetizationOp[] = [
  {
    opportunity: 'Member premium tier',
    model: '€3/mo — advanced AI, extra rituals, priority pattern detection',
    timing: 'M3+ (post-MVP)',
    revenueEstimate: '5-8% of members convert → €1,530/mo at 850 practitioners (base M36)',
    risk: 'Low — opt-in, doesn\'t cannibalize practitioner value',
    priority: 'P0',
  },
  {
    opportunity: 'AI-powered outcome reports',
    model: '€5/report or included in Pro+ tier',
    timing: 'M6+ (after data accumulation)',
    revenueEstimate: '€2-5/practitioner/mo addon → €1,700-€4,250/mo at scale',
    risk: 'Low — high value for group practices, insurance trend',
    priority: 'P1',
  },
  {
    opportunity: 'Resource marketplace (worksheets)',
    model: '20% platform commission on practitioner-created resources',
    timing: 'M12+ (need content volume)',
    revenueEstimate: '€0.50-2 per resource × volume → €500-€2,000/mo at scale',
    risk: 'Medium — requires marketplace dynamics, moderation',
    priority: 'P2',
  },
  {
    opportunity: 'Training institute white-label',
    model: '€500-€2,000/mo per institute partnership',
    timing: 'M12+ (after proving value with new grads)',
    revenueEstimate: '5-10 institutes × €1,000/mo → €5,000-€10,000/mo',
    risk: 'Medium — long sales cycle, customization burden',
    priority: 'P2',
  },
  {
    opportunity: 'Employer/insurance channel (PEPM)',
    model: '€3-5 PEPM — white-label for corporate mental health benefits',
    timing: 'M18+ (post-Series A)',
    revenueEstimate: 'Single 1,000-employee contract = €3K-€5K/mo',
    risk: 'High — enterprise sales cycle, compliance requirements',
    priority: 'P3',
  },
  {
    opportunity: 'API access for EHR integrations',
    model: '€99-€249/mo for third-party platforms integrating Bloom AI',
    timing: 'M18+ (after API stability)',
    revenueEstimate: '10-50 integrators × €149/mo → €1,500-€7,500/mo',
    risk: 'Medium — support burden, SLA commitments',
    priority: 'P3',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════

export default function PricingAnalysisPage() {
  const totalCostPerPractitioner = COST_STRUCTURE.reduce((sum, c) => {
    const val = parseFloat(c.monthly.replace('€', ''))
    return sum + val
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Pricing Strategy</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Comprehensive Pricing Analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">
        {/* ── Hero ──────────────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pricing Strategy & Revenue Architecture</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            A comprehensive pricing analysis grounded in competitor benchmarks, value-based methodology,
            cost-floor economics, and behavioral pricing psychology. All recommendations calibrated for
            pre-seed stage with a French-first B2B2C mental health platform.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Competitor Audit', 'Value-Based Model', 'Cost-Plus Floor', 'Price Elasticity', 'Psychological Tactics', '3-Tier Design', 'Discount Rules', '3 Revenue Scenarios', 'Monetization Map'].map((tag) => (
              <span key={tag} className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 1. COMPETITOR PRICING AUDIT                          */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="What everyone else charges — and what they don't offer">
            1. Competitor Pricing Audit
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Competitor</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Category</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Starter</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Mid</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Top</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">AI Add-on</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Member App</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c, i) => (
                  <tr key={c.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-semibold text-gray-900 border-b border-gray-100">{c.name}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{c.category}</td>
                    <td className="p-3 font-mono text-gray-700 border-b border-gray-100">{c.starter}</td>
                    <td className="p-3 font-mono text-gray-700 border-b border-gray-100">{c.mid}</td>
                    <td className="p-3 font-mono text-gray-700 border-b border-gray-100">{c.top}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{c.aiAddon}</td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={c.memberApp === 'None' ? 'text-red-400' : 'text-emerald-600 font-medium'}>
                        {c.memberApp}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Bloomsline row */}
                <tr className="bg-indigo-50/60 border-t-2 border-indigo-200">
                  <td className="p-3 font-bold text-indigo-700 border-b border-indigo-100">Bloomsline</td>
                  <td className="p-3 text-indigo-600 font-medium border-b border-indigo-100">B2B2C Care Platform</td>
                  <td className="p-3 font-mono font-bold text-indigo-700 border-b border-indigo-100">€19/mo</td>
                  <td className="p-3 font-mono font-bold text-indigo-700 border-b border-indigo-100">€29/mo</td>
                  <td className="p-3 font-mono font-bold text-indigo-700 border-b border-indigo-100">€49+€19/head</td>
                  <td className="p-3 text-indigo-600 font-medium border-b border-indigo-100">Included (all tiers)</td>
                  <td className="p-3 border-b border-indigo-100">
                    <span className="text-indigo-700 font-bold">Free + €3/mo premium</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Key Insight
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              No competitor offers AI + member app + practitioner tools in a single subscription. SimplePractice charges $49-99
              with no AI or member app. Doctolib charges €139 with no AI (€99 add-on for phone AI only). TherapyNotes charges $40/mo extra for AI scribe alone.
              <strong> Bloomsline at €29/mo with AI included is a category-creating price point.</strong>
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 2. VALUE-BASED PRICING MODEL                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle="Price justified by measurable value delivered to practitioners">
            2. Value-Based Pricing Model
          </SectionTitle>

          <div className="space-y-3">
            {VALUE_DRIVERS.map((v, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{v.dimension}</h4>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {v.valueMultiple} value
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{v.practitionerValue}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-[10px] text-red-400 mb-0.5">Cost Without</p>
                    <p className="text-xs font-bold text-red-600">{v.annualSavings}/yr</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 rounded-lg">
                    <p className="text-[10px] text-emerald-400 mb-0.5">Bloomsline Cost</p>
                    <p className="text-xs font-bold text-emerald-600">{v.bloomslinePrice}</p>
                  </div>
                  <div className="text-center p-2 bg-indigo-50 rounded-lg">
                    <p className="text-[10px] text-indigo-400 mb-0.5">Value Multiple</p>
                    <p className="text-xs font-bold text-indigo-600">{v.valueMultiple}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" /> Total Value Delivered
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Combined annual value to a solo practitioner: <strong>€23,300+ in time savings, retention, and revenue enablement</strong>.
              Bloomsline Pro at €348/yr captures just <strong>1.5% of the value created</strong>. This is deliberate underpricing for
              adoption velocity — the value gap is your strongest sales argument.
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 3. COST-PLUS ANALYSIS                                 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle="Determine the absolute floor price from variable cost structure">
            3. Cost-Plus Analysis — The Price Floor
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Cost Item</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Per Practitioner/mo</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Note</th>
                </tr>
              </thead>
              <tbody>
                {COST_STRUCTURE.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-medium text-gray-900 border-b border-gray-100">{c.item}</td>
                    <td className="p-3 font-mono text-gray-700 border-b border-gray-100">{c.monthly}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{c.note}</td>
                  </tr>
                ))}
                <tr className="bg-gray-900 text-white">
                  <td className="p-3 font-bold">Total Variable Cost / Practitioner</td>
                  <td className="p-3 font-mono font-bold">€{totalCostPerPractitioner.toFixed(2)}/mo</td>
                  <td className="p-3 text-gray-300">This is the absolute floor. Below this, you lose money per user.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-[10px] text-red-400 mb-1">Cost Floor</p>
              <p className="text-lg font-bold text-red-600">€{totalCostPerPractitioner.toFixed(2)}/mo</p>
              <p className="text-[10px] text-red-400 mt-1">Never price below this</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-[10px] text-amber-400 mb-1">3x Markup (Min Viable)</p>
              <p className="text-lg font-bold text-amber-600">€{(totalCostPerPractitioner * 3).toFixed(0)}/mo</p>
              <p className="text-[10px] text-amber-400 mt-1">~67% gross margin</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
              <p className="text-[10px] text-emerald-400 mb-1">Target Margin (90%)</p>
              <p className="text-lg font-bold text-emerald-600">€{(totalCostPerPractitioner / 0.1).toFixed(0)}/mo</p>
              <p className="text-[10px] text-emerald-400 mt-1">SaaS-grade unit economics</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-xl">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Verdict:</strong> At €29/mo with a €4.25 variable cost, Bloomsline achieves <strong>85% gross margin</strong> per
              practitioner — well within SaaS best-in-class (70-90%). The AI cost (€1.80/mo) is the largest variable component
              but is optimized on Claude Haiku. Even at €19/mo (Essentiel), gross margin is 78%. <strong>There is no cost-floor problem.</strong>
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 4. PRICE ELASTICITY ESTIMATE                          */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle="How sensitive is practitioner demand to price changes?">
            4. Price Elasticity Estimate
          </SectionTitle>

          <div className="space-y-2">
            {ELASTICITY_CURVE.map((p) => (
              <div key={p.price} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 font-mono w-16">€{p.price}/mo</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      p.price === 29 ? 'bg-emerald-100 text-emerald-700' :
                      p.price === 39 ? 'bg-blue-100 text-blue-700' :
                      p.price <= 19 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {p.segment}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{p.note}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Demand Index</p>
                    <ScoreBar score={p.demandIndex} max={100} color="bg-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Revenue Index</p>
                    <ScoreBar score={p.revenueIndex} max={110} color="bg-emerald-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Recommendation
            </h4>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Revenue is maximized at <strong>€39/mo</strong> but adoption is maximized at <strong>€19-25/mo</strong>.
              For a pre-seed startup that needs adoption velocity over revenue optimization,
              <strong> €29/mo is the optimal balance</strong> — a charm price below the €30 psychological barrier with
              85% gross margin and strong adoption. Revisit at 500+ practitioners when you have pricing power.
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 5. PSYCHOLOGICAL PRICING TACTICS                      */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="Behavioral economics applied to pricing presentation">
            5. Psychological Pricing Tactics
          </SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PSYCH_TACTICS.map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{t.tactic}</h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {t.expectedLift}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t.mechanism}</p>
                <div className="p-2.5 bg-indigo-50 rounded-lg">
                  <p className="text-[10px] font-medium text-indigo-600">
                    <span className="text-indigo-400">Implementation →</span> {t.implementation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 6. TIERING RECOMMENDATION                             */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle="Three tiers designed with decoy effect and clear upgrade paths">
            6. Recommended Pricing Tiers
          </SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative bg-white border-2 rounded-2xl p-5 ${tier.borderColor} ${
                  tier.badge ? 'ring-2 ring-indigo-200 shadow-lg scale-[1.02]' : ''
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> {tier.badge}
                    </span>
                  </div>
                )}

                <div className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${tier.color} mb-3`}>
                  {tier.name}
                </div>

                <div className="mb-1">
                  <span className="text-2xl font-bold text-gray-900">{tier.price}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-1">{tier.priceAnnual}</p>
                <p className="text-xs text-gray-500 mb-4">{tier.tagline}</p>

                <div className="space-y-1.5 mb-4">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-700">{f}</span>
                    </div>
                  ))}
                </div>

                {tier.limits.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-1.5">
                    {tier.limits.map((l) => (
                      <div key={l} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-gray-300 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-gray-400">{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-2.5 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-600">Target: </span>{tier.target}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Member tier */}
          <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-violet-600" />
              <h4 className="text-sm font-bold text-violet-800">Member Premium — €3/mo</h4>
              <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">B2C Upside</span>
            </div>
            <p className="text-xs text-violet-600 mb-3">
              Opt-in for members who want advanced AI, extra rituals, priority pattern detection, and premium journal features.
              Free tier remains generous — this is gravy, not the meal.
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-white rounded-lg">
                <p className="text-[10px] text-violet-400">Base price</p>
                <p className="text-sm font-bold text-violet-700">€0/mo</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <p className="text-[10px] text-violet-400">Premium</p>
                <p className="text-sm font-bold text-violet-700">€3/mo</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <p className="text-[10px] text-violet-400">Conversion rate</p>
                <p className="text-sm font-bold text-violet-700">5-8%</p>
              </div>
              <div className="text-center p-2 bg-white rounded-lg">
                <p className="text-[10px] text-violet-400">vs Headspace</p>
                <p className="text-sm font-bold text-violet-700">77% cheaper</p>
              </div>
            </div>
          </div>

          {/* Rationale block */}
          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Why this tier structure works</h4>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span><strong>Essentiel (€19)</strong> exists to get practitioners in the door. 10-client cap creates natural upgrade pressure within 60 days.</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span><strong>Pro (€29)</strong> is the hero tier. "Most Popular" badge + charm pricing + unlimited clients = 70% of signups. Less than 1 cancelled session/month.</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span><strong>Cabinet (€49+€19/head)</strong> is the anchor. Makes Pro look like a steal. 5-practitioner group = €144/mo total (~€29/head with volume baked in).</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span><strong>Member Premium (€3)</strong> is pure upside. 5-8% of members = meaningful secondary revenue at zero incremental CAC.</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 7. DISCOUNT STRATEGY                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle="When to discount, how much, and for whom — with guardrails">
            7. Discount Strategy
          </SectionTitle>

          <div className="space-y-3">
            {DISCOUNTS.map((d, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-indigo-500" />
                    {d.scenario}
                  </h4>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {d.discount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{d.mechanism}</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-gray-400"><strong className="text-gray-600">Duration:</strong> {d.duration}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-amber-500"><strong>Guard:</strong> {d.guard}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Never discount */}
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
            <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Never Discount Rules
            </h4>
            <div className="space-y-1.5">
              {NEVER_DISCOUNT.map((rule, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-400 text-xs mt-0.5">✕</span>
                  <p className="text-xs text-red-600">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 8. REVENUE PROJECTIONS (3 SCENARIOS)                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle="Three scenarios modeling different pricing mixes and growth rates">
            8. Revenue Projections — 36 Months
          </SectionTitle>

          <div className="space-y-6">
            {SCENARIOS.map((s) => (
              <div key={s.name} className={`${s.bgColor} border border-gray-200 rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`text-sm font-bold ${s.color}`}>{s.name} Scenario</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.pricing}</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400">M18 ARR</p>
                      <p className={`text-sm font-bold ${s.color}`}>{s.m18Arr}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400">M36 ARR</p>
                      <p className={`text-sm font-bold ${s.color}`}>{s.m36Arr}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.assumptions.map((a, i) => (
                    <span key={i} className="text-[10px] bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 font-semibold text-gray-600 border-b border-gray-200/50">Month</th>
                        <th className="text-right p-2 font-semibold text-gray-600 border-b border-gray-200/50">Practitioners</th>
                        <th className="text-right p-2 font-semibold text-gray-600 border-b border-gray-200/50">B2B MRR</th>
                        <th className="text-right p-2 font-semibold text-gray-600 border-b border-gray-200/50">B2C MRR</th>
                        <th className="text-right p-2 font-semibold text-gray-600 border-b border-gray-200/50">Total MRR</th>
                        <th className="text-right p-2 font-semibold text-gray-600 border-b border-gray-200/50">ARR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.projections.map((p) => (
                        <tr key={p.label} className="border-b border-gray-100/50">
                          <td className="p-2 font-medium text-gray-700">{p.label}</td>
                          <td className="p-2 text-right font-mono text-gray-600">{p.practitioners.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono text-gray-600">€{p.mrr.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono text-gray-400">€{p.memberPremium.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-semibold text-gray-800">€{p.totalMrr.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-semibold text-gray-800">€{(p.totalMrr * 12).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gray-100 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Scenario Comparison — Key Takeaway</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              At M18 (seed window), the base case at €29/mo ARPU generates <strong>€126K ARR</strong> — 3x the conservative scenario (€42K)
              and strong enough for Series A conversations. The €10/mo price difference between conservative (€19) and base (€29) ARPU results in
              a <strong>3x revenue difference</strong> over 18 months. This is why the Pro tier at €29 matters — it&apos;s not just €10 more, it&apos;s the difference
              between a fundable and unfundable trajectory.
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 9. MONETIZATION OPPORTUNITIES                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle="Upsells, cross-sells, and new revenue streams beyond core subscriptions">
            9. Monetization Opportunities
          </SectionTitle>

          <div className="space-y-3">
            {MONETIZATION.map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.priority === 'P0' ? 'bg-red-100 text-red-600' :
                      m.priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                      m.priority === 'P2' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {m.priority}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{m.opportunity}</h4>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{m.timing}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{m.model}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <p className="text-[10px] text-emerald-400 mb-0.5">Revenue Estimate</p>
                    <p className="text-xs font-semibold text-emerald-600">{m.revenueEstimate}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-[10px] text-amber-400 mb-0.5">Risk Level</p>
                    <p className="text-xs font-semibold text-amber-600">{m.risk}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SYNTHESIS — The Pricing Verdict                        */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.55)}>
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              The Pricing Verdict
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">What should change from current model</h4>
                <div className="space-y-2">
                  {[
                    { from: '€25/mo flat price', to: '3-tier structure: €19 / €29 / €49+€19', why: 'Flat pricing leaves money on the table and offers no upgrade path. The decoy effect alone lifts conversion 25-30%.' },
                    { from: 'No entry tier below €25', to: '€19 Essentiel with 10-client cap', why: 'Eliminates the #1 objection ("too expensive to try"). 10-client cap creates natural upgrade pressure.' },
                    { from: '€25/mo for unlimited', to: '€29/mo Pro (unlimited)', why: '€4/mo increase with charm pricing. "Under €30" is psychologically cheaper than "€25" sounds. Revenue +16% at minimal demand loss.' },
                    { from: 'No group pricing', to: '€49 base + €19/practitioner', why: 'Thomas persona (group director) needs volume pricing. 5-head group = €144/mo (~€29/head). Higher ACV, longer retention.' },
                  ].map((c, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-red-400 line-through">{c.from}</span>
                        <ArrowRight className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] font-semibold text-emerald-400">{c.to}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{c.why}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-3">Unit economics at recommended pricing</h4>
                <div className="space-y-2">
                  {[
                    { metric: 'Blended ARPU', value: '€29/mo', note: '70% of users on Pro' },
                    { metric: 'Variable cost/practitioner', value: '€4.25/mo', note: 'AI + infra + support' },
                    { metric: 'Gross margin', value: '85%', note: 'SaaS best-in-class' },
                    { metric: 'CAC', value: '€50', note: 'Organic/content-driven' },
                    { metric: 'LTV (25-mo lifetime)', value: '€3,625', note: 'At 4% monthly churn' },
                    { metric: 'LTV/CAC', value: '72.5x', note: 'Exceptional (benchmark: >3x)' },
                    { metric: 'Payback period', value: '1.7 months', note: 'Break-even in under 2 months' },
                    { metric: 'B2C upside/practitioner', value: '€1.80/mo', note: '12 members × 5% × €3/mo' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5">
                      <span className="text-xs text-gray-400">{m.metric}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold text-white">{m.value}</span>
                        <span className="text-[10px] text-gray-500 ml-2">{m.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-2">The bottom line</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Move from €25/mo flat to a <strong className="text-white">€19 / €29 / €49 tiered structure</strong>.
                The current €25 flat price is neither cheap enough to be impulsive nor premium enough to signal quality.
                €29 Pro with charm pricing captures the same market at +16% revenue per user with negligible demand loss.
                The €19 Essentiel tier eliminates price objections, and the €49 Cabinet tier anchors the Pro price as a deal while
                capturing higher ACV from group practices. At 850 practitioners (base M36), this pricing architecture generates
                <strong className="text-emerald-400"> €314K ARR</strong> — a 4.3x improvement over the conservative single-price model.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ────────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.6)}
          className="flex items-center gap-2 text-[10px] text-gray-400"
        >
          <Clock className="w-3 h-3" />
          <span>Pricing analysis as of Feb 2026</span>
          <span className="text-gray-200">|</span>
          <span>Bloomsline Care — Pricing Strategy</span>
        </motion.div>
      </main>
    </div>
  )
}

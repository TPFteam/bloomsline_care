'use client'

import { motion } from 'framer-motion'
import {
  Rocket,
  Target,
  Users,
  MessageSquare,
  Megaphone,
  Handshake,
  PenTool,
  Calendar,
  GraduationCap,
  Mic,
  UserPlus,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  DollarSign,
  Globe,
  Shield,
  Eye,
  Mail,
  BookOpen,
  Trophy,
  Flame,
  ChevronRight,
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
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}/{max}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 1. LAUNCH PHASING
// ══════════════════════════════════════════════════════════════════════════

interface PhaseTask {
  task: string
  owner: string
  deliverable: string
  priority: string
}

interface LaunchPhase {
  id: string
  name: string
  timeline: string
  color: string
  lightBg: string
  borderColor: string
  textColor: string
  goal: string
  kpiTarget: string
  tasks: PhaseTask[]
}

const LAUNCH_PHASES: LaunchPhase[] = [
  {
    id: 'pre-launch',
    name: 'Pre-Launch',
    timeline: '60 days before launch (D-60 → D-1)',
    color: 'bg-gray-900',
    lightBg: 'bg-gray-50',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
    goal: 'Build the pipeline, validate messaging, create launch assets',
    kpiTarget: '200 prospect list, 30 demo calls booked, 5 beta testimonials',
    tasks: [
      { task: 'Build prospect list of 200 independent practitioners (Paris → Lyon → Bordeaux)', owner: 'Founder 1', deliverable: 'LinkedIn Sales Nav + Doctolib scrape → CRM', priority: 'P0' },
      { task: 'Run 50+ personalized LinkedIn outreach messages/week', owner: 'Founder 1 + 2', deliverable: '25/founder/week, 3-touch sequence', priority: 'P0' },
      { task: 'Convert 3-5 beta testers to paying at €29/mo', owner: 'Founder 1', deliverable: 'First revenue + testimonials', priority: 'P0' },
      { task: 'Produce 3 case study videos (90-second practitioner stories)', owner: 'Founder 2', deliverable: 'LinkedIn + website assets', priority: 'P1' },
      { task: 'Write 8 French blog posts targeting SEO keywords', owner: 'Founder 2', deliverable: '"gestion cabinet", "suivi patient", "RGPD psychologue"', priority: 'P1' },
      { task: 'Set up referral program infrastructure', owner: 'Engineering', deliverable: '"Invite a colleague" → 1 free month per referral', priority: 'P1' },
      { task: 'Create onboarding flow (15-min white-glove setup)', owner: 'Founder 1', deliverable: 'Script + Loom video + checklist', priority: 'P1' },
      { task: 'Design pricing page with 3-tier layout', owner: 'Founder 2', deliverable: 'Essentiel €19 / Pro €29 / Cabinet €49+', priority: 'P2' },
      { task: 'Apply to AFTCC conference (speaking/booth slot)', owner: 'Founder 1', deliverable: 'Conference submission + follow-up', priority: 'P2' },
      { task: 'Pitch 3 French psych podcasts for guest spots', owner: 'Founder 2', deliverable: 'Deux Psys, Catherine la Psy, Le Comptoir', priority: 'P2' },
    ],
  },
  {
    id: 'launch-week',
    name: 'Launch Week',
    timeline: 'Day 1 → Day 7',
    color: 'bg-indigo-600',
    lightBg: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    goal: 'Activate first 10 paying practitioners, generate social proof',
    kpiTarget: '10 paying users, 100+ members onboarded, 3 LinkedIn posts > 5K views',
    tasks: [
      { task: 'Personal outreach to all 30 warm leads — "We\'re live"', owner: 'Founder 1 + 2', deliverable: '15 calls/founder in 3 days', priority: 'P0' },
      { task: 'Publish LinkedIn launch post with practitioner story', owner: 'Founder 1', deliverable: 'Narrative post (not product features)', priority: 'P0' },
      { task: 'Email beta testers asking for public testimonials', owner: 'Founder 2', deliverable: '3-5 LinkedIn recommendations', priority: 'P0' },
      { task: 'Offer 60-day extended trial to first 20 signups', owner: 'Founder 1', deliverable: 'Urgency + exclusivity signal', priority: 'P1' },
      { task: 'White-glove onboard every new practitioner (15-min call)', owner: 'Founder 1', deliverable: 'Account setup + first member invite', priority: 'P0' },
      { task: 'Post day-by-day "building in public" updates on LinkedIn', owner: 'Founder 2', deliverable: '5 posts in 7 days, each with 1 real metric', priority: 'P1' },
      { task: 'Send thank-you messages to everyone who shared the launch', owner: 'Founder 1 + 2', deliverable: 'Relationship maintenance', priority: 'P2' },
    ],
  },
  {
    id: 'post-launch',
    name: 'Post-Launch',
    timeline: 'Day 8 → Day 90',
    color: 'bg-emerald-600',
    lightBg: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    goal: 'Reach 30 practitioners, prove PMF (churn < 5%), activate referral loop',
    kpiTarget: '30 practitioners, 360+ members, <5% churn, first organic signup',
    tasks: [
      { task: 'Week 2-4: Scale LinkedIn outreach to 100 messages/week', owner: 'Founder 1 + 2', deliverable: 'Multi-channel (LinkedIn + email + follow-up)', priority: 'P0' },
      { task: 'Week 2: Activate referral program for all paying users', owner: 'Engineering', deliverable: 'Dashboard prompt: "Invite a colleague"', priority: 'P0' },
      { task: 'Week 3: Publish 2 case studies with real engagement data', owner: 'Founder 2', deliverable: 'Blog + LinkedIn + email to prospects', priority: 'P1' },
      { task: 'Week 4: Analyze first-month churn — fix if > 5%', owner: 'Founder 1', deliverable: 'Churn analysis → product fixes or onboarding tweaks', priority: 'P0' },
      { task: 'Month 2: Begin SEO content cadence (1 post/week in French)', owner: 'Founder 2', deliverable: 'Target: 500 organic visits/month by M3', priority: 'P1' },
      { task: 'Month 2: Attend first professional event/conference', owner: 'Founder 1', deliverable: 'AFTCC workshop or regional FFPP chapter', priority: 'P1' },
      { task: 'Month 2: Contact IFFORTHECC about student partnership', owner: 'Founder 1', deliverable: 'Free year for newly certified → pipeline', priority: 'P2' },
      { task: 'Month 3: Review NPS — target > 40', owner: 'Founder 2', deliverable: 'In-app survey at day 30', priority: 'P1' },
      { task: 'Month 3: Evaluate first organic/referral signup signal', owner: 'Founder 1', deliverable: 'If 0 organic signups by M3, reassess messaging', priority: 'P0' },
      { task: 'Month 3: Begin group practice outreach (Cabinet tier)', owner: 'Founder 1', deliverable: '10 group practice targets identified', priority: 'P2' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 2. CHANNEL STRATEGY (RANKED BY ROI)
// ══════════════════════════════════════════════════════════════════════════

interface Channel {
  rank: number
  name: string
  icon: typeof Rocket
  roiScore: number
  costPerLead: string
  timeToImpact: string
  scalability: string
  when: string
  budget: string
  why: string
  playbook: string[]
}

const CHANNELS: Channel[] = [
  {
    rank: 1,
    name: 'Founder-Led LinkedIn Outreach',
    icon: MessageSquare,
    roiScore: 9,
    costPerLead: '€2-5 (time only)',
    timeToImpact: 'Week 1',
    scalability: 'Low (founder time)',
    when: 'Pre-launch → M6',
    budget: '€0 cash, 20 hrs/week founder time',
    why: 'Highest ROI channel at pre-seed. Multi-channel outreach gets 287% higher reply rate. Independent practitioners are reachable on LinkedIn. Zero cost, instant feedback loop.',
    playbook: [
      'Build list: LinkedIn Sales Nav + Doctolib profiles → 200 targets',
      'Sequence: Connection request → value post → DM with case study → demo offer',
      '50+ conversations/week (25 per founder)',
      'Follow up 3x minimum — 80% of sales happen after 5th touchpoint',
      'Track: reply rate > 15%, demo rate > 5%, close rate > 20%',
    ],
  },
  {
    rank: 2,
    name: 'Referral Program',
    icon: UserPlus,
    roiScore: 9,
    costPerLead: '€29 (1 month free)',
    timeToImpact: 'M2-M3',
    scalability: 'High (viral loop)',
    when: 'Activate at 10 users → ongoing',
    budget: '€0 cash (deferred revenue)',
    why: '86% of B2B buyers say word-of-mouth is most influential. Referred customers have 16-25% higher LTV and lower churn. Practitioners talk in supervision groups and conferences.',
    playbook: [
      '1 free month per successful referral (both sides)',
      'Ask every user for 2 introductions at day 14 (happiness peak)',
      'Dashboard "Invite a colleague" button — always visible',
      'Cap at 3 free months/year per referrer',
      'Target: referrals = 20-30% of signups by M12',
    ],
  },
  {
    rank: 3,
    name: 'French Blog + SEO',
    icon: PenTool,
    roiScore: 8,
    costPerLead: '€5-15 (content creation time)',
    timeToImpact: 'M3-M6 (compounds)',
    scalability: 'Very high (evergreen)',
    when: 'Start M1 → ongoing',
    budget: '€200/mo (design + tooling)',
    why: 'French practitioners search "gestion cabinet psychologue", "suivi patient", "RGPD psychologue" — low competition. SEO compounds over time. By M6, should drive 30% of pipeline.',
    playbook: [
      '1 post/week in French targeting practitioner pain points',
      'Keywords: "gestion cabinet", "suivi patient entre séances", "RGPD psychologue"',
      'Each post has clear CTA: free trial or demo booking',
      'Repurpose blog → LinkedIn carousel → email newsletter',
      'Target: 1,000 organic visits/month by M6, 5,000 by M12',
    ],
  },
  {
    rank: 4,
    name: 'Events & Conferences',
    icon: Calendar,
    roiScore: 7,
    costPerLead: '€30-80 (travel + fees)',
    timeToImpact: 'M3-M6',
    scalability: 'Medium (seasonal)',
    when: 'M3 → M18',
    budget: '€300-500/event',
    why: 'SimplePractice got their first 50 customers at local chapter meetings. AFTCC has 2,500 members. Congrès Français de Psychiatrie is the annual gathering. Face-to-face builds trust.',
    playbook: [
      'AFTCC workshops: present on "digital between-session care"',
      'FFPP/SNP chapter meetings: demo at regional events',
      'Congrès Français de Psychiatrie: booth or speaking slot',
      'Every event: collect 20+ contacts, follow up within 48 hours',
      'Bring 1 testimonial practitioner as co-presenter',
    ],
  },
  {
    rank: 5,
    name: 'Training Institute Partnerships',
    icon: GraduationCap,
    roiScore: 7,
    costPerLead: '€0 (partnership)',
    timeToImpact: 'M6-M12',
    scalability: 'High (pipeline)',
    when: 'M6 → M18',
    budget: '€0 cash (free accounts)',
    why: '21% growth in psychologist numbers = thousands setting up practice annually. Newly certified practitioners are easiest early adopters — no existing tool habits.',
    playbook: [
      'Partners: AFTCC, IFFORTHECC, IRCCADE, Asadis',
      'Offer: free year for newly certified practitioners',
      'Position as "recommended practice tool" in curriculum',
      'Co-branded onboarding materials for each institute',
      'Target: 3 institute partnerships signed by M12',
    ],
  },
  {
    rank: 6,
    name: 'Podcast Guest Appearances',
    icon: Mic,
    roiScore: 6,
    costPerLead: '€0',
    timeToImpact: 'M6-M12',
    scalability: 'Low (limited shows)',
    when: 'M6 → M18',
    budget: '€0',
    why: 'French practitioners listen to Deux Psys, Catherine la Psy, Le Comptoir de la Psychologie. Builds authority and trust. Zero cost. 1 podcast appearance = awareness among 5K-20K listeners.',
    playbook: [
      'Pitch 5 French psych podcasts with practitioner-centric angle',
      'Topic: "What happens between sessions — and why it matters"',
      'Share real practitioner stories, not product features',
      'Include unique offer code for listeners',
      'Target: 3 appearances in first 12 months',
    ],
  },
  {
    rank: 7,
    name: 'Email Newsletter (Practitioner Insights)',
    icon: Mail,
    roiScore: 6,
    costPerLead: '€1-3',
    timeToImpact: 'M3-M6',
    scalability: 'High (list grows)',
    when: 'M3 → ongoing',
    budget: '€50/mo (email tool)',
    why: 'Nurtures warm leads who aren\'t ready to buy. Positions Bloomsline as thought leader. Bi-weekly cadence keeps brand top-of-mind. Low cost, compounds over time.',
    playbook: [
      'Bi-weekly email: 1 practitioner insight + 1 product tip + 1 CTA',
      'Build list from blog subscribers, event contacts, LinkedIn connections',
      'Subject line A/B test every send',
      'Target: 500 subscribers by M6, 2,000 by M12',
      'Open rate target: > 35%, CTR: > 5%',
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 3. MESSAGING FRAMEWORK
// ══════════════════════════════════════════════════════════════════════════

const MESSAGING = {
  coreValueProp: 'Bloomsline fills the 167 hours between sessions — so practitioners see their clients\' week, and members feel supported every day.',
  positioning: 'The only platform that connects practitioners and members through gentle, AI-powered between-session care.',
  taglines: [
    'Therapy is 1 hour a week. Life is the other 167.',
    'See their week. Support their journey.',
    'Between-session care that practitioners trust and members love.',
  ],
  supportingMessages: [
    {
      message: 'Start every session already informed',
      audience: 'Practitioners',
      proofPoints: [
        '50% of session time currently spent catching up (APA Practice)',
        'Practitioners see real-time client engagement dashboard',
        'AI-generated session briefs from between-session activity',
      ],
    },
    {
      message: 'Your growth continues between appointments',
      audience: 'Members',
      proofPoints: [
        'Bloom AI companion available 24/7 for gentle support',
        'Capture moments in 10 seconds — photo, voice, text',
        'AI discovers patterns in mood and behavior over time',
      ],
    },
    {
      message: 'One sale. 15 users. Zero incremental CAC.',
      audience: 'Investors',
      proofPoints: [
        '1 practitioner → 12-15 members at no additional cost',
        'LTV/CAC of 72x (benchmark: 3x)',
        '90% gross margin, €50 CAC, 1.7-month payback',
      ],
    },
  ],
  objectionCounters: [
    { objection: '"I don\'t have time for a new tool"', counter: 'White-glove setup in 15 minutes. No data migration needed. We set it up for you.' },
    { objection: '"I already use Doctolib"', counter: 'Bloomsline doesn\'t replace Doctolib. We\'re the engagement layer between sessions — they handle booking, we handle care.' },
    { objection: '"€29/mo is too much"', counter: '€29/mo is less than one cancelled session (€60-80). Doctolib charges €139/mo with no AI. SimplePractice is $49-99.' },
    { objection: '"I worry about data privacy"', counter: 'EU-hosted, GDPR-native from line 1. AES-256 encryption. Row Level Security on every table. We\'re not American SaaS.' },
  ],
}

// ══════════════════════════════════════════════════════════════════════════
// 4. CONTENT STRATEGY
// ══════════════════════════════════════════════════════════════════════════

interface ContentItem {
  type: string
  format: string
  frequency: string
  channel: string
  purpose: string
}

interface FunnelStage {
  stage: string
  goal: string
  color: string
  content: ContentItem[]
}

const CONTENT_FUNNEL: FunnelStage[] = [
  {
    stage: 'Awareness',
    goal: 'Practitioners discover Bloomsline exists',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    content: [
      { type: 'LinkedIn thought leadership', format: 'Text posts (800-1,200 chars)', frequency: '3x/week', channel: 'LinkedIn', purpose: 'Build founder authority on "between-session care"' },
      { type: 'French SEO blog posts', format: 'Long-form (1,500+ words)', frequency: '1x/week', channel: 'Blog', purpose: 'Capture organic search: "gestion cabinet psychologue"' },
      { type: 'Podcast guest spots', format: '30-45 min interviews', frequency: '1x/month (M6+)', channel: 'Podcasts', purpose: 'Reach practitioner audiences on trusted platforms' },
      { type: 'Conference presentations', format: '20-min talk + demo', frequency: 'Quarterly', channel: 'Events', purpose: 'Face-to-face credibility with professional bodies' },
    ],
  },
  {
    stage: 'Consideration',
    goal: 'Practitioners evaluate Bloomsline seriously',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    content: [
      { type: 'Practitioner case studies', format: 'Written + 90-sec video', frequency: '2x/month', channel: 'Blog + LinkedIn', purpose: 'Social proof from real practitioners with real data' },
      { type: 'Comparison guides', format: '"Bloomsline vs Doctolib vs SimplePractice"', frequency: 'Evergreen', channel: 'Blog + SEO', purpose: 'Capture high-intent search traffic' },
      { type: 'Email nurture sequence', format: '5-email drip (one per week)', frequency: 'Automated', channel: 'Email', purpose: 'Educate warm leads who aren\'t ready to buy yet' },
      { type: 'Live demo recordings', format: '5-min product walkthrough', frequency: 'Monthly update', channel: 'Website + YouTube', purpose: 'Show, don\'t tell. Reduce friction to understanding.' },
    ],
  },
  {
    stage: 'Decision',
    goal: 'Practitioners commit to a paid plan',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    content: [
      { type: 'ROI calculator', format: 'Interactive tool on website', frequency: 'Evergreen', channel: 'Website', purpose: '"See how much time Bloomsline saves you per week"' },
      { type: 'Pricing page with social proof', format: '3-tier layout + testimonials', frequency: 'Evergreen', channel: 'Website', purpose: 'Reduce decision paralysis. "87% choose Pro."' },
      { type: 'Free trial (14 days, extended to 60 for events)', format: 'No credit card required', frequency: 'Always available', channel: 'Product', purpose: 'Remove last objection: "let me try it first"' },
      { type: 'Personal demo call with founder', format: '15-min video call', frequency: 'On demand', channel: 'Calendar', purpose: 'High-touch conversion for warm leads' },
    ],
  },
  {
    stage: 'Retention & Advocacy',
    goal: 'Practitioners renew, upgrade, and refer',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    content: [
      { type: 'Onboarding email sequence', format: '7 emails over 14 days', frequency: 'Automated', channel: 'Email', purpose: 'Guide to first value moment (first member invited)' },
      { type: 'In-app engagement nudges', format: 'Tooltips + milestone celebrations', frequency: 'Triggered', channel: 'Product', purpose: 'Drive activation: "Your first client logged a moment!"' },
      { type: 'Monthly practitioner digest', format: 'Email with usage insights', frequency: '1x/month', channel: 'Email', purpose: '"Your clients logged 47 moments this month"' },
      { type: 'Referral prompts', format: 'In-app + email at day 14', frequency: 'Triggered', channel: 'Product + Email', purpose: 'Ask for referrals when satisfaction is highest' },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 5. STRATEGIC PARTNERSHIPS
// ══════════════════════════════════════════════════════════════════════════

interface PartnershipOp {
  name: string
  type: string
  reach: string
  dealStructure: string
  timeline: string
  expectedImpact: string
  priority: string
}

const PARTNERSHIPS: PartnershipOp[] = [
  {
    name: 'AFTCC (Association Française de TCC)',
    type: 'Professional association',
    reach: '2,500 members (CBT practitioners)',
    dealStructure: 'Workshop sponsorship (€500-1,000) + "recommended tool" endorsement. Offer free trial to all members.',
    timeline: 'M3 — first event attendance',
    expectedImpact: '30-50 trials, 10-15 conversions from first event. Ongoing pipeline.',
    priority: 'P0',
  },
  {
    name: 'IFFORTHECC + IRCCADE + Asadis',
    type: 'Training institutes (bundle)',
    reach: '1,000+ graduates/year combined',
    dealStructure: 'Free year for newly certified practitioners. Co-branded "starting your practice" toolkit. Bloomsline in curriculum.',
    timeline: 'M6 — partnership signed',
    expectedImpact: '50-100 new practitioners/year entering Bloomsline at day 1 of their practice. Lifetime habits.',
    priority: 'P1',
  },
  {
    name: 'FFPP (Fédération Française des Psychologues et de Psychologie)',
    type: 'National federation',
    reach: 'National umbrella organization',
    dealStructure: 'Newsletter feature + chapter meeting demos. No direct sponsorship cost — provide value through practitioner content.',
    timeline: 'M4 — first chapter meeting',
    expectedImpact: 'Brand legitimacy + 10-20 warm leads per chapter event. Access to regional networks.',
    priority: 'P1',
  },
  {
    name: 'Doctolib (Co-existence strategy)',
    type: 'Integration partnership',
    reach: '400K practitioners, 80M patients',
    dealStructure: 'Not a competitor — complementary. Build integration: "Book on Doctolib, engage on Bloomsline." API-level calendar sync.',
    timeline: 'M12+ — after proving scale',
    expectedImpact: 'If successful: access to Doctolib\'s practitioner base. Even a 0.1% conversion = 400 practitioners.',
    priority: 'P2',
  },
  {
    name: 'Mutuelle / Assurance Complémentaire',
    type: 'Insurance/benefits channel',
    reach: 'Employer-funded mental health benefits',
    dealStructure: 'PEPM (€3-5/employee/month) for covered mental health benefits. White-label member app under mutualist brand.',
    timeline: 'M18+ — post-Series A',
    expectedImpact: 'Single 1,000-employee contract = €3K-€5K MRR. Enterprise revenue diversification.',
    priority: 'P3',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 6. BUDGET ALLOCATION
// ══════════════════════════════════════════════════════════════════════════

interface BudgetLine {
  channel: string
  monthlyBudget: string
  annualBudget: string
  percentOfGTM: string
  rationale: string
}

const BUDGET: BudgetLine[] = [
  { channel: 'Founder time (outreach)', monthlyBudget: 'Sweat equity', annualBudget: 'Sweat equity', percentOfGTM: '—', rationale: '40 hrs/week combined. Primary channel. Not in cash budget.' },
  { channel: 'Content & SEO', monthlyBudget: '€200', annualBudget: '€2,400', percentOfGTM: '24%', rationale: 'Blog tooling, Canva Pro, minor design. Writing is founder-led.' },
  { channel: 'Events & conferences', monthlyBudget: '€400 (avg)', annualBudget: '€4,800', percentOfGTM: '48%', rationale: '€300-500/event × 8-10 events/year. Travel + booth costs.' },
  { channel: 'Email tools', monthlyBudget: '€50', annualBudget: '€600', percentOfGTM: '6%', rationale: 'Mailchimp/Loops free tier → paid at 1K subscribers.' },
  { channel: 'LinkedIn Sales Nav', monthlyBudget: '€80', annualBudget: '€960', percentOfGTM: '10%', rationale: 'Premium search + InMail credits for outreach.' },
  { channel: 'Referral program costs', monthlyBudget: '~€145 (est.)', annualBudget: '~€1,740', percentOfGTM: '17%', rationale: '~5 referrals/month × €29 deferred revenue per referral.' },
  { channel: 'Paid ads', monthlyBudget: '€0', annualBudget: '€0', percentOfGTM: '0%', rationale: 'No paid ads at this stage. Organic only until PMF is proven.' },
]

// Total annual GTM cash budget
const TOTAL_GTM_CASH = '~€10,000/year'
const TOTAL_GTM_MONTHLY = '~€875/month'

// ══════════════════════════════════════════════════════════════════════════
// 7. KPI FRAMEWORK
// ══════════════════════════════════════════════════════════════════════════

interface KPI {
  metric: string
  category: string
  m3Target: string
  m6Target: string
  m12Target: string
  m18Target: string
  why: string
}

const KPIS: KPI[] = [
  { metric: 'Paying Practitioners', category: 'Growth', m3Target: '15', m6Target: '60', m12Target: '180', m18Target: '340', why: 'North star metric. Everything else follows.' },
  { metric: 'MRR', category: 'Revenue', m3Target: '€435', m6Target: '€1,740', m12Target: '€5,220', m18Target: '€9,860', why: 'Revenue trajectory for Series A readiness.' },
  { metric: 'Monthly Churn', category: 'Retention', m3Target: '<8%', m6Target: '<5%', m12Target: '<4%', m18Target: '<4%', why: 'PMF signal. >10% = pause sales, fix product.' },
  { metric: 'Active Members', category: 'Engagement', m3Target: '180', m6Target: '720', m12Target: '2,160', m18Target: '4,080', why: 'Member engagement proves practitioner value.' },
  { metric: 'Member Activation Rate', category: 'Engagement', m3Target: '>60%', m6Target: '>70%', m12Target: '>75%', m18Target: '>75%', why: '% of invited members who log first moment within 7 days.' },
  { metric: 'NPS', category: 'Satisfaction', m3Target: '>30', m6Target: '>40', m12Target: '>50', m18Target: '>50', why: 'Referral likelihood. >50 = world-class for SaaS.' },
  { metric: 'CAC', category: 'Efficiency', m3Target: '€50', m6Target: '€50', m12Target: '€45', m18Target: '€40', why: 'Should decrease as organic/referral channels compound.' },
  { metric: 'Referral %', category: 'Virality', m3Target: '5%', m6Target: '10%', m12Target: '20%', m18Target: '25%', why: '% of new signups from practitioner referrals.' },
  { metric: 'Demo → Paid Conversion', category: 'Sales', m3Target: '>20%', m6Target: '>25%', m12Target: '>30%', m18Target: '>30%', why: 'Sales efficiency metric. <15% = fix pitch.' },
  { metric: 'Organic Traffic (monthly)', category: 'Content', m3Target: '200', m6Target: '1,000', m12Target: '5,000', m18Target: '10,000', why: 'SEO compounding indicator. Leading signal for pipeline.' },
]

// ══════════════════════════════════════════════════════════════════════════
// 8. RISK MITIGATION
// ══════════════════════════════════════════════════════════════════════════

interface LaunchRisk {
  risk: string
  likelihood: string
  impact: string
  earlyWarning: string
  contingency: string
  owner: string
}

const RISKS: LaunchRisk[] = [
  {
    risk: 'Slow practitioner adoption (long sales cycles)',
    likelihood: 'High',
    impact: 'Critical',
    earlyWarning: '<5 paying users by day 30',
    contingency: 'Extend free trial to 60 days. Shift to referral-only growth. Add white-glove "we set it up for you" onboarding. Lower entry to €19/mo Essentiel tier.',
    owner: 'Founder 1',
  },
  {
    risk: 'Low member engagement (practitioners don\'t see value)',
    likelihood: 'Medium',
    impact: 'Critical',
    earlyWarning: 'Member activation rate < 50%. <3 moments/member/week.',
    contingency: 'Simplify first-use to <30 seconds. Add practitioner-triggered "homework" feature. Build engagement digest ("Your client logged 5 moments this week"). Make member value visible to practitioner.',
    owner: 'Founder 2',
  },
  {
    risk: 'Doctolib launches competing engagement features',
    likelihood: 'Low-Medium',
    impact: 'High',
    earlyWarning: 'Doctolib product announcements, job postings for "engagement" roles.',
    contingency: 'Move fast — our B2C member layer + AI companion is structurally hard to bolt on. Deepen AI differentiation. Build switching costs through data history. Consider Doctolib integration instead of competition.',
    owner: 'Founder 1',
  },
  {
    risk: 'Runway depletion before PMF',
    likelihood: 'Medium',
    impact: 'Fatal',
    earlyWarning: '<€100K remaining with <50 practitioners.',
    contingency: 'Keep burn under €10K/month. Milestone-based spending (no hires until 50+ users). Cut conference spend. Explore bridge round from existing investors. Never burn more than planned.',
    owner: 'Both Founders',
  },
  {
    risk: 'HDS (Hébergement de Données de Santé) compliance required',
    likelihood: 'Medium',
    impact: 'High',
    earlyWarning: 'Enterprise prospect or group practice requests HDS certification.',
    contingency: 'Get legal counsel early (€2K). Pre-evaluate HDS-certified hosts: Scalingo (€500/mo), OVHcloud Health. Can migrate Supabase to EU HDS-compliant host within 4-6 weeks.',
    owner: 'Founder 2',
  },
]

// ══════════════════════════════════════════════════════════════════════════
// 9. QUICK WINS (FIRST 14 DAYS)
// ══════════════════════════════════════════════════════════════════════════

interface QuickWin {
  tactic: string
  timeline: string
  expectedResult: string
  effort: string
  steps: string[]
}

const QUICK_WINS: QuickWin[] = [
  {
    tactic: 'The Warm 30 Blitz',
    timeline: 'Day 1-3',
    expectedResult: '5-10 demo calls booked, 3-5 conversions',
    effort: '2 days of focused outreach',
    steps: [
      'List every practitioner you\'ve spoken to in the last 6 months',
      'Personal message (not mass email): "We just launched. You were one of the people who shaped this. Want to be one of the first?"',
      'Offer: first month free + founding member badge (visible in profile)',
      'Book 15-min "setup call" — you do the onboarding, they don\'t lift a finger',
      'Ask each convert for 1 introduction before hanging up',
    ],
  },
  {
    tactic: 'The LinkedIn Story Sprint',
    timeline: 'Day 1-7',
    expectedResult: '5K-15K impressions, 50+ profile visits, 10+ DM conversations',
    effort: '1 hour/day writing + engagement',
    steps: [
      'Day 1: Launch post — "Today we launched Bloomsline" with founder story (why mental health, why now)',
      'Day 3: Problem post — "My therapist has no idea what happened in my week" (member perspective)',
      'Day 5: Data post — "50% of session time is spent catching up" with APA source',
      'Day 7: Proof post — first testimonial from a beta practitioner (with permission)',
      'Engage in comments of French psychology LinkedIn creators — give value, don\'t pitch',
    ],
  },
  {
    tactic: 'The 10-Second Activation Hack',
    timeline: 'Day 1-14',
    expectedResult: '75%+ member activation rate, practitioners see immediate value',
    effort: 'Product tweak + onboarding change',
    steps: [
      'During practitioner onboarding call, help them invite their first 3 clients right then',
      'Pre-compose the member invitation message (they just hit send)',
      'Member first-open: show single prompt "How are you feeling right now?" — one tap response',
      'Immediately notify practitioner: "Marie just logged her first moment"',
      'This is the magic moment — practitioner sees the value in real time, not after a week of waiting',
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function GTMPlaybookPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">GTM Playbook</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Go-to-Market Execution Plan</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">
        {/* ── Hero ────────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Go-to-Market Playbook</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            A complete, actionable GTM execution plan for Bloomsline Care. Budget: ~€10K/year cash + founder sweat equity.
            Timeline: pre-launch (60 days) → launch (week 1) → post-launch (90 days) → scale (M4-M18).
            Built for a 2-founder pre-seed team targeting French independent mental health practitioners.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Budget', value: '~€10K/yr', sub: '+ founder time' },
              { label: 'Team', value: '2 founders', sub: '+ part-time eng' },
              { label: 'Market', value: '30K', sub: 'FR independent practitioners' },
              { label: 'Price', value: '€19-49/mo', sub: '3-tier model' },
              { label: 'Target M18', value: '340 users', sub: '€118K ARR' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400">{s.label}</p>
                <p className="text-sm font-bold text-gray-900">{s.value}</p>
                <p className="text-[10px] text-gray-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 9. QUICK WINS (FIRST 14 DAYS) — up front     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="3 high-impact tactics that generate traction before everything else compounds">
            Quick Wins — First 14 Days
          </SectionTitle>

          <div className="space-y-4">
            {QUICK_WINS.map((w, i) => (
              <div key={i} className="bg-white border-2 border-amber-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{w.tactic}</h4>
                      <p className="text-[10px] text-gray-400">{w.timeline}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {w.expectedResult}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {w.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <span className="text-[10px] font-bold text-amber-500 mt-0.5 w-4 shrink-0">{j + 1}.</span>
                      <span className="text-xs text-gray-600">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 1. LAUNCH PHASING                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="Pre-launch (60 days) → Launch (week 1) → Post-launch (90 days)">
            1. Launch Phasing
          </SectionTitle>

          <div className="space-y-6">
            {LAUNCH_PHASES.map((phase) => (
              <div key={phase.id} className={`${phase.lightBg} border ${phase.borderColor} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`${phase.color} text-white text-[10px] font-bold px-3 py-1.5 rounded-lg`}>
                      {phase.name}
                    </div>
                    <span className="text-xs text-gray-500">{phase.timeline}</span>
                  </div>
                  <span className={`text-[10px] font-medium ${phase.textColor} bg-white px-2.5 py-1 rounded-full border`}>
                    {phase.kpiTarget}
                  </span>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  <strong className="text-gray-700">Goal:</strong> {phase.goal}
                </p>

                <div className="space-y-2">
                  {phase.tasks.map((task, i) => (
                    <div key={i} className="bg-white/80 rounded-lg px-3 py-2.5 flex items-start gap-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                        task.priority === 'P0' ? 'bg-red-100 text-red-600' :
                        task.priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{task.priority}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800">{task.task}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] text-gray-400"><strong>Owner:</strong> {task.owner}</span>
                          <span className="text-[10px] text-gray-400"><strong>Output:</strong> {task.deliverable}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 2. CHANNEL STRATEGY                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle="Top 7 acquisition channels ranked by expected ROI at pre-seed stage">
            2. Channel Strategy — Ranked by ROI
          </SectionTitle>

          <div className="space-y-4">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon
              return (
                <div key={ch.rank} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-600">#{ch.rank}</span>
                      </div>
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-gray-900">{ch.name}</h4>
                        <span className="text-[10px] text-gray-400">{ch.when}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">ROI Score</p>
                          <p className="text-xs font-bold text-indigo-600">{ch.roiScore}/10</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">Cost/Lead</p>
                          <p className="text-xs font-bold text-gray-700">{ch.costPerLead}</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">Time to Impact</p>
                          <p className="text-xs font-bold text-gray-700">{ch.timeToImpact}</p>
                        </div>
                        <div className="text-center p-1.5 bg-gray-50 rounded-lg">
                          <p className="text-[9px] text-gray-400">Budget</p>
                          <p className="text-xs font-bold text-gray-700">{ch.budget}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-2">{ch.why}</p>

                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-indigo-600 mb-1.5">Playbook</p>
                        <div className="space-y-1">
                          {ch.playbook.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                              <span className="text-[10px] text-indigo-700">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 3. MESSAGING FRAMEWORK                           */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle="Core value proposition, supporting messages, and proof points">
            3. Messaging Framework
          </SectionTitle>

          {/* Core value prop */}
          <div className="bg-gray-900 text-white rounded-2xl p-6 mb-4">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Core Value Proposition</p>
            <p className="text-lg font-bold leading-relaxed">{MESSAGING.coreValueProp}</p>
            <p className="text-xs text-gray-400 mt-3">{MESSAGING.positioning}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {MESSAGING.taglines.map((t, i) => (
                <span key={i} className="text-[10px] bg-white/10 text-gray-300 px-2.5 py-1 rounded-full border border-white/10">
                  &quot;{t}&quot;
                </span>
              ))}
            </div>
          </div>

          {/* Supporting messages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {MESSAGING.supportingMessages.map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  i === 0 ? 'bg-indigo-100 text-indigo-600' :
                  i === 1 ? 'bg-emerald-100 text-emerald-600' :
                  'bg-violet-100 text-violet-600'
                }`}>{m.audience}</span>
                <h4 className="text-sm font-bold text-gray-900 mt-2 mb-2">&quot;{m.message}&quot;</h4>
                <div className="space-y-1.5">
                  {m.proofPoints.map((p, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-gray-600">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Objection counters */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h4 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Top Objections & Counters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MESSAGING.objectionCounters.map((o, i) => (
                <div key={i} className="bg-white rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-red-600 mb-0.5">{o.objection}</p>
                  <p className="text-[10px] text-gray-600">{o.counter}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 4. CONTENT STRATEGY                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle="Content mapped to every stage of the practitioner buying journey">
            4. Content Strategy — Full Funnel
          </SectionTitle>

          <div className="space-y-4">
            {CONTENT_FUNNEL.map((stage, i) => (
              <div key={stage.stage} className={`${stage.color} border rounded-xl p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-bold">{stage.stage}</h4>
                  <span className="text-[10px] opacity-70">— {stage.goal}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stage.content.map((c, j) => (
                    <div key={j} className="bg-white/80 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-gray-800">{c.type}</p>
                        <span className="text-[9px] text-gray-400">{c.frequency}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-1">{c.format}</p>
                      <p className="text-[10px] text-gray-400"><strong>Channel:</strong> {c.channel} | <strong>Why:</strong> {c.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 5. PARTNERSHIPS                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle="5 strategic partnerships ranked by timeline and expected impact">
            5. Strategic Partnerships
          </SectionTitle>

          <div className="space-y-3">
            {PARTNERSHIPS.map((p, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.priority === 'P0' ? 'bg-red-100 text-red-600' :
                      p.priority === 'P1' ? 'bg-amber-100 text-amber-600' :
                      p.priority === 'P2' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{p.priority}</span>
                    <h4 className="text-sm font-semibold text-gray-900">{p.name}</h4>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{p.timeline}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">Type & Reach</p>
                    <p className="text-gray-600">{p.type} — {p.reach}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">Deal Structure</p>
                    <p className="text-gray-600">{p.dealStructure}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-0.5 font-medium">Expected Impact</p>
                    <p className="text-emerald-600 font-semibold">{p.expectedImpact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 6. BUDGET ALLOCATION                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={`Total GTM cash budget: ${TOTAL_GTM_CASH} (${TOTAL_GTM_MONTHLY}) — plus founder sweat equity`}>
            6. Budget Allocation
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Channel</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">Monthly</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">Annual</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">% of GTM</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-medium text-gray-900 border-b border-gray-100">{b.channel}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{b.monthlyBudget}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{b.annualBudget}</td>
                    <td className="p-3 text-right font-mono text-gray-500 border-b border-gray-100">{b.percentOfGTM}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{b.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-800 mb-2">Budget Philosophy</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              At pre-seed, <strong>your time is your budget</strong>. The ~€10K annual cash spend is almost rounding error —
              it&apos;s the 80+ hours/week of founder outreach, content creation, and relationship-building that drives growth.
              No paid ads. No growth hacking shortcuts. Just consistent, founder-led, trust-based acquisition in a
              niche professional community where reputation compounds. When you hit 100+ practitioners and €3K MRR,
              then evaluate whether to add a €500-1,000/mo paid channel.
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 7. KPI FRAMEWORK                                  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle="10 metrics to track with quarterly benchmarks — know what good looks like">
            7. KPI Framework
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Metric</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Category</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M3</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M6</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M12</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b border-gray-200">M18</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Why This Matters</th>
                </tr>
              </thead>
              <tbody>
                {KPIS.map((kpi, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-semibold text-gray-900 border-b border-gray-100">{kpi.metric}</td>
                    <td className="p-3 border-b border-gray-100">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        kpi.category === 'Growth' ? 'bg-blue-100 text-blue-600' :
                        kpi.category === 'Revenue' ? 'bg-emerald-100 text-emerald-600' :
                        kpi.category === 'Retention' ? 'bg-red-100 text-red-600' :
                        kpi.category === 'Engagement' ? 'bg-violet-100 text-violet-600' :
                        kpi.category === 'Satisfaction' ? 'bg-amber-100 text-amber-600' :
                        kpi.category === 'Efficiency' ? 'bg-teal-100 text-teal-600' :
                        kpi.category === 'Virality' ? 'bg-pink-100 text-pink-600' :
                        kpi.category === 'Sales' ? 'bg-indigo-100 text-indigo-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>{kpi.category}</span>
                    </td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m3Target}</td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m6Target}</td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{kpi.m12Target}</td>
                    <td className="p-3 text-center font-mono font-semibold text-gray-900 border-b border-gray-100">{kpi.m18Target}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{kpi.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-red-400 mb-1">Red Flag — Pause & Fix</p>
              <p className="text-xs font-bold text-red-600">Churn &gt; 10% at M3</p>
              <p className="text-[10px] text-red-400 mt-0.5">Stop selling. Fix the product.</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-amber-400 mb-1">Yellow Flag — Investigate</p>
              <p className="text-xs font-bold text-amber-600">0 organic signups by M3</p>
              <p className="text-[10px] text-amber-400 mt-0.5">Messaging isn&apos;t resonating. Revisit positioning.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-emerald-400 mb-1">Green Light — Accelerate</p>
              <p className="text-xs font-bold text-emerald-600">Referrals &gt; 20% by M6</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">Flywheel spinning. Consider first hire.</p>
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 8. RISK MITIGATION                                 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle="Top 5 launch risks with early warning signals and contingency plans">
            8. Risk Mitigation
          </SectionTitle>

          <div className="space-y-3">
            {RISKS.map((r, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      r.impact === 'Fatal' ? 'text-red-500' :
                      r.impact === 'Critical' ? 'text-red-400' :
                      'text-amber-400'
                    }`} />
                    <h4 className="text-sm font-semibold text-gray-900">{r.risk}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      r.likelihood === 'High' ? 'bg-red-100 text-red-600' :
                      r.likelihood === 'Medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{r.likelihood}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      r.impact === 'Fatal' ? 'bg-red-200 text-red-700' :
                      r.impact === 'Critical' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>Impact: {r.impact}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <p className="text-amber-500 font-medium mb-0.5">Early Warning</p>
                    <p className="text-amber-700">{r.earlyWarning}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg md:col-span-2">
                    <p className="text-emerald-500 font-medium mb-0.5">Contingency Plan</p>
                    <p className="text-emerald-700">{r.contingency}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2"><strong>Owner:</strong> {r.owner}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SYNTHESIS                                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.5)}>
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-indigo-400" />
              The GTM Operating System
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">What makes this work</h4>
                <div className="space-y-2">
                  {[
                    { principle: 'Founder-led distribution', detail: 'No marketing team needed. Two founders doing 50+ outreach conversations/week is more effective than any paid channel at this stage.' },
                    { principle: 'Built-in viral loop', detail: '1 practitioner → 12-15 members. Members can\'t buy Bloomsline themselves — the practitioner IS the distribution. Every sale seeds 15 potential advocates.' },
                    { principle: 'Trust-based selling', detail: 'Mental health professionals buy from peers and authority figures, not ads. Content + conferences + word-of-mouth is the only credible channel mix.' },
                    { principle: 'CAC efficiency', detail: 'At €50 CAC with 72x LTV/CAC, even 10% of your budget wasted is irrelevant. You\'re not optimizing spend — you\'re optimizing for speed to 100 users.' },
                  ].map((p, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-semibold text-white">{p.principle}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-amber-400 mb-3">The 90-day truth test</h4>
                <div className="space-y-3">
                  {[
                    { day: 'Day 14', test: 'Have you talked to 50+ practitioners?', answer: 'If no, you\'re not moving fast enough. Outreach volume trumps perfection.' },
                    { day: 'Day 30', test: 'Do you have 5+ paying users?', answer: 'If no, the pricing or value prop is wrong — not the product. Fix the pitch first.' },
                    { day: 'Day 60', test: 'Have members logged 100+ moments?', answer: 'If no, onboarding is broken. Practitioners signed up but members aren\'t activated.' },
                    { day: 'Day 90', test: 'Has anyone signed up without your direct involvement?', answer: 'If yes, you have a business. If no, you have a consulting project. Act accordingly.' },
                  ].map((t, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{t.day}</span>
                        <p className="text-xs font-semibold text-white">{t.test}</p>
                      </div>
                      <p className="text-[10px] text-gray-400">{t.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-white">Bottom line:</strong> This is a founder-led GTM.
                Your budget is your calendar. Your channel is your network. Your content is your conviction.
                The first 30 practitioners will come from sweat, not spend.
                After that, the care network effect does the rest — each practitioner bringing 12-15 members,
                each member interaction proving the product, each proved practitioner telling their peers.
                <strong className="text-emerald-400"> Get 10 paying practitioners in 30 days. Everything else follows.</strong>
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.55)}
          className="flex items-center gap-2 text-[10px] text-gray-400"
        >
          <Clock className="w-3 h-3" />
          <span>GTM playbook as of Feb 2026</span>
          <span className="text-gray-200">|</span>
          <span>Bloomsline Care — Go-to-Market Execution Plan</span>
        </motion.div>
      </main>
    </div>
  )
}

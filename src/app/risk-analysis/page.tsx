'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Eye,
  Target,
  DollarSign,
  Scale,
  Users,
  Brain,
  Lock,
  Lightbulb,
  ChevronRight,
  ArrowRight,
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

function ImpactBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-2 w-4 rounded-sm ${i < value ? color : 'bg-gray-100'}`}
        />
      ))}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${styles[severity] || styles.Medium}`}>
      {severity}
    </span>
  )
}

// ── Category config ─────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; dotColor: string; icon: typeof Shield }> = {
  Market: { color: 'text-blue-600 bg-blue-50 border-blue-200', dotColor: 'bg-blue-500', icon: TrendingUp },
  Operational: { color: 'text-orange-600 bg-orange-50 border-orange-200', dotColor: 'bg-orange-500', icon: Users },
  Financial: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dotColor: 'bg-emerald-500', icon: DollarSign },
  Regulatory: { color: 'text-violet-600 bg-violet-50 border-violet-200', dotColor: 'bg-violet-500', icon: Scale },
  Reputational: { color: 'text-rose-600 bg-rose-50 border-rose-200', dotColor: 'bg-rose-500', icon: Eye },
}

// ── Risk data ───────────────────────────────────────────────────────────

interface Risk {
  id: string
  category: string
  name: string
  probability: number
  impact: number
  score: number
  severity: string
  description: string
  earlyWarnings: string[]
  mitigation: string
  contingency: string
}

const RISKS: Risk[] = [
  {
    id: 'R1',
    category: 'Market',
    name: 'Adoption slower than modeled',
    probability: 4,
    impact: 4,
    score: 16,
    severity: 'Critical',
    description: 'Financial model assumes 20-30% MoM practitioner growth from 10 initial users. If growth is 10-15% MoM due to therapist technology inertia (only 5% of therapists currently use AI in practice), runway math shifts dramatically. At €8.7K/month burn with €300K cash, 34 months of runway means nothing without revenue traction — Series A becomes unreachable.',
    earlyWarnings: [
      'Fewer than 10 paying practitioners after 90 days of launch',
      'Demo-to-signup conversion rate below 15%',
      'Trial-to-paid conversion below 40%',
      'Average onboarding time exceeding 30 minutes',
    ],
    mitigation: 'Set hard PMF milestone: 10 paying practitioners within 90 days or pivot positioning. Implement product-led onboarding that gets first AI note generated in under 5 minutes. Build "instant value" features (AI scribe, session summaries) that demonstrate ROI before subscription commitment. Target early-adopter conferences (AFTCC, Asadis) for concentrated acquisition.',
    contingency: 'If 90-day target missed: shift to freemium model with AI notes as free hook and between-session care as paid tier. Reduce burn to €6K/month by deferring hiring. Explore partnership distribution (training institutes offering Bloomsline to graduates). If 180-day target still missed, evaluate pivot to B2B enterprise wellness or training institute licensing.',
  },
  {
    id: 'R2',
    category: 'Market',
    name: 'SimplePractice/Doctolib convergence',
    probability: 3,
    impact: 4,
    score: 12,
    severity: 'High',
    description: 'Vista paid $4B for SimplePractice (237K practitioners). They are acquiring (Luminello), hiring (Head of Payer Partnerships), and building AI features. If SimplePractice launches a member app and enters EU simultaneously, the window closes in 18-24 months. Doctolib (80M patients, €6.4B valuation) could add between-session features leveraging existing distribution.',
    earlyWarnings: [
      'SimplePractice announces EU office or GDPR compliance initiative',
      'Doctolib adds care features beyond booking',
      'Vista acquires a European therapy SaaS platform',
      'SimplePractice launches a patient/member-facing app',
    ],
    mitigation: 'Compete on care quality and local market fit, not feature breadth. SimplePractice will build a generic EU product — Bloomsline builds a French-first product with AFTCC partnerships and MonParcoursPsy optimization. Reach 200+ practitioners before convergence to establish network effects. Build data moats: accumulated session notes and engagement patterns.',
    contingency: 'If SimplePractice enters EU: double down on French-specific features and practitioner relationships. Position as "the European alternative" with EU data residency, French language support, and AFTCC integration. If Doctolib adds care features: differentiate on AI quality and between-session engagement — Doctolib\'s DNA is scheduling, not clinical care.',
  },
  {
    id: 'R3',
    category: 'Market',
    name: 'Pricing pressure from open-source AI',
    probability: 2,
    impact: 3,
    score: 6,
    severity: 'Medium',
    description: 'Meta Llama, Mistral, and other open-source models approach Claude quality rapidly. If practitioners can get "good enough" AI notes from a free tool or built into existing EHRs, Bloomsline\'s AI advantage erodes to the between-session engagement layer only. EHR vendors adding basic AI scribing could commoditize the acquisition hook.',
    earlyWarnings: [
      'Major EHR vendor announces free AI notes feature',
      'Open-source therapy-specific fine-tuned model released',
      'Competitor offers AI notes at significantly lower price point',
    ],
    mitigation: 'Position AI notes as the wedge, not the moat. The defensible value is the practitioner-member connection and between-session engagement data. Build AI model routing: use Claude for complex clinical tasks, fall back to Mistral/Llama for basic transcription. Maintain 2+ AI providers to prevent vendor lock-in. Invest in proprietary training data from platform usage.',
    contingency: 'If AI notes become commoditized: pivot marketing to "connected care" narrative — the AI notes get them in, the between-session engagement keeps them. Accelerate development of proprietary features like outcome prediction, churn detection, and personalized care plans that require platform-specific data.',
  },
  {
    id: 'R4',
    category: 'Operational',
    name: 'Two-person team bottleneck',
    probability: 4,
    impact: 4,
    score: 16,
    severity: 'Critical',
    description: 'Two founders covering product, engineering, sales, marketing, design, support, and fundraising. No clinical advisor on the team. If one founder is unavailable (illness, burnout, personal emergency), the entire operation stalls. Hiring plan deferred to post-seed. Cannot match feature velocity of well-funded competitors.',
    earlyWarnings: [
      'Feature backlog growing faster than delivery capacity',
      'Customer support response time exceeding 24 hours',
      'Founder burnout symptoms: missed deadlines, declining code quality',
      'Sales conversations stalling because of product gaps',
    ],
    mitigation: 'Hire first engineer immediately after seed close (Month 1-2). Prioritize ruthlessly: only build features that directly drive practitioner acquisition or retention. Use AI-assisted development to multiply output. Establish advisory board with 2-3 clinical advisors (compensated with equity). Document all critical systems so either founder can operate alone temporarily.',
    contingency: 'If founder becomes unavailable: activate advisor network for interim coverage. Pre-negotiate contract with senior freelance developer for emergency support (€400-600/day). If scaling requires faster hiring: convert €15-20K of seed funding to recruitment budget. Consider technical co-founder from Bpifrance\'s La French Tech network.',
  },
  {
    id: 'R5',
    category: 'Operational',
    name: 'Anthropic dependency',
    probability: 3,
    impact: 3,
    score: 9,
    severity: 'Medium',
    description: 'Core AI engine depends entirely on Anthropic Claude. Current cost ~€1.80/practitioner/month. If Anthropic raises prices 3-5x (as OpenAI has done), AI costs become 20-30% of ARPU. No fallback AI provider implemented. Switching AI providers requires rewriting prompt engineering and clinical safety guardrails.',
    earlyWarnings: [
      'Anthropic announces pricing changes or removes current tier',
      'Claude API latency exceeds 3 seconds consistently',
      'Anthropic deprecates Haiku model without equivalent replacement',
      'AI costs per practitioner trending above €3/month',
    ],
    mitigation: 'Implement model abstraction layer by Month 4: standardized interface that routes between Claude, GPT-4, and Mistral based on task complexity. Use Claude Haiku for routine tasks (notes, summaries), Claude Sonnet for complex analysis (pattern detection). Pre-build prompt templates for OpenAI and Mistral as failover. Monitor cost per API call daily.',
    contingency: 'If Anthropic costs spike: immediately activate Mistral/Llama fallback for 60-70% of non-critical AI calls. Renegotiate with Anthropic for startup pricing. If API becomes unreliable: migrate to self-hosted Mistral Large within 2-4 weeks. Temporarily reduce AI features to essentials (notes generation only) while migrating.',
  },
  {
    id: 'R6',
    category: 'Operational',
    name: 'Product-market fit not reached',
    probability: 3,
    impact: 5,
    score: 15,
    severity: 'Critical',
    description: 'The core hypothesis — that practitioners will pay €25/month for a between-session care platform — is unvalidated with revenue. Interview validation (187 conversations) shows interest, but stated preference ≠ purchasing behavior. Woebot had 5+ RCTs and still failed commercially. The gap between "this is interesting" and "I will pay monthly" remains uncrossed.',
    earlyWarnings: [
      'Monthly churn exceeding 8% after first 3 months',
      'NPS score below 30 among active practitioners',
      'Less than 40% of practitioners actively use between-session features',
      'Practitioners using only AI notes but not the member engagement layer',
    ],
    mitigation: 'Launch with minimum viable product focused on the single highest-value workflow: AI-assisted session notes + member engagement summary. Measure PMF quantitatively: track Sean Ellis "very disappointed" survey (target >40%). Implement weekly practitioner feedback loops. Build usage analytics dashboard to identify which features drive retention vs. which are ignored.',
    contingency: 'If PMF not reached by Month 9: pivot options include (1) pure AI scribe tool (remove member app, compete on notes quality), (2) B2B enterprise wellness platform (sell to group practices and clinics), (3) training institute licensing (Bloomsline as learning tool). Each pivot preserves core technology while changing distribution and business model.',
  },
  {
    id: 'R7',
    category: 'Financial',
    name: 'Seed raise falls short',
    probability: 3,
    impact: 4,
    score: 12,
    severity: 'High',
    description: 'Target: €250K-€400K pre-seed. EU health-tech seed funding declined 15% in 2024. If only €200K-€250K raised, runway shortens to 23-29 months and key hires (engineer, clinical advisor) may be delayed. Pre-revenue companies face heightened investor skepticism. French startup funding concentrated in Paris networks.',
    earlyWarnings: [
      'Investor meetings converting below 20% to follow-up',
      'Term sheet negotiations stalling on valuation',
      'Fundraise extending beyond 3 months',
      'Key target investors passing due to pre-revenue risk',
    ],
    mitigation: 'Build fundraise pipeline of 40+ investors (mix of French angels, EU health-tech VCs, Bpifrance). Lead with unit economics story: €50 CAC, 25-50x LTV/CAC, 90% gross margin. Target French public grants (Bpifrance Bourse French Tech: €30K non-dilutive, La French Tech Tremplin). Set minimum viable raise at €250K with clear milestone plan. Close seed within 3 months to minimize distraction.',
    contingency: 'If raise falls short: accept lower amount and adjust milestones accordingly. Reduce burn to €6K/month (no engineering hire, founder-only for 6 months longer). Pursue Bpifrance grants aggressively (€30-50K non-dilutive). Consider revenue-based financing if initial traction exists. Bridge with convertible notes from angel investors while building traction for larger seed.',
  },
  {
    id: 'R8',
    category: 'Financial',
    name: 'Churn exceeds 8%',
    probability: 3,
    impact: 4,
    score: 12,
    severity: 'High',
    description: 'Model assumes 5% monthly churn. At €25/month with monthly billing, switching cost is near zero. If churn reaches 8-12%, LTV drops from €500 to €208-€312, LTV/CAC ratio drops below 10x, and growth becomes a treadmill — every new practitioner just replaces a churned one. SaaS median churn for SMB is 3-7% monthly.',
    earlyWarnings: [
      'Monthly churn trending above 6% for 2 consecutive months',
      'Practitioner engagement declining after Month 2 of subscription',
      'Support tickets mentioning "not using it enough"',
      'Practitioners subscribing but not inviting members to the platform',
    ],
    mitigation: 'Build data-driven retention from Day 1. Track "activation score": practitioner generates first AI note (Day 1), invites first member (Week 1), member completes first between-session activity (Week 2). Implement proactive outreach when engagement drops. Build annual billing option with 20% discount (reduces churn to 2-3% monthly equivalent). Create "Bloomsline Champions" community for power users.',
    contingency: 'If churn exceeds 8%: conduct exit interviews to identify root cause. If value gap: enhance core features rapidly. If pricing issue: test lower price point (€19/month) or usage-based pricing. If activation issue: redesign onboarding with white-glove support for first 30 days. If structural: consider pivot to annual contracts with group practices (lower churn, higher commitment).',
  },
  {
    id: 'R9',
    category: 'Financial',
    name: 'Series A gap',
    probability: 3,
    impact: 5,
    score: 15,
    severity: 'Critical',
    description: 'Series A requires €80-100K MRR, 200+ practitioners, <5% churn, and a clear path to €1M ARR. Median time from seed to Series A in EU health-tech is 18-24 months. If seed-stage milestones aren\'t hit (50 practitioners by Month 6, 120 by Month 12), Series A timeline extends or becomes impossible. Funding winter could coincide with fundraise window.',
    earlyWarnings: [
      'Practitioner count below 30 at Month 6',
      'MRR growth flattening below 15% MoM',
      'EU health-tech Series A deals declining in volume',
      'Key metrics (churn, NPS, engagement) not at benchmark levels',
    ],
    mitigation: 'Begin Series A networking at Month 9 — don\'t wait until Month 15+. Target EU-focused health-tech funds: Heal Capital, Partech Health, Digital Health Ventures, Elaia. Build investor update cadence from Day 1 (monthly updates to seed investors + prospective Series A leads). Set internal milestone: if <50 practitioners at Month 9, evaluate bridge round or strategic alternatives.',
    contingency: 'If Series A not achievable by Month 18: pursue bridge round (€150-200K from existing investors) to extend runway 6-9 months. Apply for Bpifrance innovation grants (€50-100K). Explore strategic investment from complementary health-tech company. If all funding options exhausted: evaluate acqui-hire offers from larger platforms (SimplePractice, Doctolib) that value the team and technology.',
  },
  {
    id: 'R10',
    category: 'Regulatory',
    name: 'HDS certification mandate',
    probability: 3,
    impact: 4,
    score: 12,
    severity: 'High',
    description: 'France may require HDS (Hébergeur de Données de Santé) certification for platforms storing mental health data. Supabase is not HDS-certified. Migration to OVHcloud, Scalingo, or Clever Cloud would cost 3-6 months of engineering time and increase infrastructure costs 2-3x. HDS audit itself costs €15-30K and takes 6-12 months.',
    earlyWarnings: [
      'CNIL issues guidance classifying therapy notes as "health data" requiring HDS',
      'Competitor advertises HDS certification as differentiator',
      'French professional association recommends HDS-certified platforms only',
      'Insurance companies require HDS for reimbursement integration',
    ],
    mitigation: 'Consult HDS specialist by Month 3 to clarify current obligations. Build database abstraction layer that makes infrastructure portable. Pre-evaluate OVHcloud Managed PostgreSQL and Scalingo as migration targets. Maintain strict data separation (personal data vs. usage data) to minimize scope of any HDS requirement. Budget €30K for HDS compliance in Series A plan.',
    contingency: 'If HDS becomes mandatory: execute pre-planned migration to OVHcloud (3-month timeline). Use managed PostgreSQL to minimize code changes. Apply for interim exemption while migration is in progress. If timeline is aggressive: partner with HDS-certified hosting provider and co-locate Supabase-compatible infrastructure.',
  },
  {
    id: 'R11',
    category: 'Regulatory',
    name: 'EU AI Act high-risk classification',
    probability: 2,
    impact: 4,
    score: 8,
    severity: 'Medium',
    description: 'EU AI Act (effective August 2026) may classify mental health AI as high-risk, requiring conformity assessments, ongoing monitoring, documentation, and transparency obligations. Compliance costs estimated at €50-100K for startups. If Bloom AI is classified as a medical device, the regulatory burden multiplies significantly.',
    earlyWarnings: [
      'EU Commission guidance explicitly lists therapy AI tools as high-risk',
      'Competitor receives non-compliance notice for mental health AI features',
      'Insurance companies require AI Act certification for coverage',
      'Professional associations issue warnings about non-compliant AI tools',
    ],
    mitigation: 'Position Bloom AI as "practitioner decision support" (lighter regulatory pathway than autonomous clinical AI). Begin AI Act documentation by Month 6: data governance, risk management, human oversight, transparency. Engage EU AI Act compliance consultant (€5-10K) by Month 8. Build audit trail: every AI output logged, attributed, and reviewable by the practitioner.',
    contingency: 'If classified as high-risk: allocate €50K from Series A funding for conformity assessment. Implement enhanced human-in-the-loop workflows (all AI outputs require practitioner review before sharing with members). If medical device classification: evaluate DiGA pathway in Germany as a strategic pivot that turns compliance cost into reimbursement revenue.',
  },
  {
    id: 'R12',
    category: 'Regulatory',
    name: 'CNIL investigation',
    probability: 2,
    impact: 4,
    score: 8,
    severity: 'Medium',
    description: 'CNIL (French data protection authority) has increased enforcement actions by 40% since 2023, with specific focus on health data and AI. A complaint from a single practitioner or member could trigger an investigation. Non-compliance penalties up to €20M or 4% of annual turnover. Even an investigation without finding generates negative publicity.',
    earlyWarnings: [
      'CNIL publishes guidance targeting health-tech AI specifically',
      'Competitor receives CNIL sanction for similar data processing',
      'User complaint about data handling reaches regulatory channel',
      'CNIL announces sector-wide audit of health-tech startups',
    ],
    mitigation: 'GDPR compliance by design: DPO appointment (can be founder initially), DPIA for all AI features, explicit consent flows, data portability API, right-to-deletion automation. Conduct internal GDPR audit by Month 4. Maintain Article 30 records of processing. Implement data retention policies (auto-delete after account closure + 30 days). Use EU-only analytics (PostHog self-hosted).',
    contingency: 'If CNIL contacts: respond within 72 hours (regulatory obligation). Engage GDPR lawyer immediately (budget €5-10K). Demonstrate proactive compliance measures: DPO, DPIA, audit trail, consent records. If sanction imposed: remediate within prescribed timeline and communicate transparently to users. Consider CNIL\'s "sandbox" program for AI health innovation.',
  },
  {
    id: 'R13',
    category: 'Reputational',
    name: 'AI safety incident',
    probability: 2,
    impact: 5,
    score: 10,
    severity: 'High',
    description: 'Bloom AI interacts with vulnerable populations (mental health clients). A single harmful AI output — inappropriate advice during a crisis, clinical misinformation, or privacy breach — could generate media coverage, practitioner exodus, and regulatory scrutiny. The Tessa chatbot incident (National Eating Disorders Association, 2023) showed how quickly AI mental health failures become national news.',
    earlyWarnings: [
      'AI generating responses that bypass safety guardrails in testing',
      'User reports of inappropriate AI suggestions',
      'Edge case discovered where AI provides clinical advice beyond its scope',
      'Increased latency or errors in AI safety filter pipeline',
    ],
    mitigation: 'Multi-layer safety system from Day 1: (1) crisis keyword detection → immediate escalation to emergency resources, (2) clinical boundary enforcement — AI never diagnoses, prescribes, or contradicts practitioner guidance, (3) content filtering for self-harm, suicidal ideation, abuse disclosure, (4) practitioner review required for all AI-generated care plans. Monthly red-team testing of safety systems. Publish AI safety principles publicly.',
    contingency: 'If incident occurs: activate crisis protocol within 1 hour — disable affected AI feature, notify all affected users, issue public statement acknowledging the issue. Engage crisis communications specialist (pre-identified, not scrambled). Report to CNIL within 72 hours if personal data involved. Conduct root cause analysis and publish findings. Consider temporary AI feature suspension while implementing fixes.',
  },
  {
    id: 'R14',
    category: 'Reputational',
    name: 'Data breach',
    probability: 1,
    impact: 5,
    score: 5,
    severity: 'Medium',
    description: 'Mental health data is among the most sensitive personal data categories. A breach exposing therapy notes, session recordings, or member engagement data would be catastrophic for trust. GDPR mandates 72-hour breach notification. Healthcare data breaches average $10.9M in damages (IBM, 2023). Even a minor breach at a small startup generates outsized coverage in health-tech media.',
    earlyWarnings: [
      'Penetration test reveals critical vulnerability',
      'Unusual database access patterns detected',
      'Third-party dependency announces security vulnerability',
      'Supabase announces a security incident affecting shared infrastructure',
    ],
    mitigation: 'Defense in depth: AES-256-GCM encryption at rest, TLS 1.3 in transit, Row Level Security on every Supabase table, least-privilege API keys. Conduct penetration test by Month 6 (budget €3-5K). Implement real-time anomaly detection on database access patterns. Enable Supabase audit logging. Security-focused code review for every PR. SOC 2 Type I by Month 12.',
    contingency: 'If breach detected: activate incident response plan — isolate affected systems within 30 minutes, assess scope within 4 hours, notify CNIL within 72 hours, notify affected users within 96 hours. Engage forensic security firm (pre-identified). Offer affected users credit monitoring. Publish transparent post-mortem. Implement additional security measures and undergo independent security audit.',
  },
  {
    id: 'R15',
    category: 'Reputational',
    name: 'Practitioner backlash',
    probability: 2,
    impact: 3,
    score: 6,
    severity: 'Medium',
    description: 'Mental health professionals are protective of the therapeutic alliance and skeptical of technology intermediation. 45% of therapists express concerns about AI in clinical settings (APA 2024). If Bloomsline is perceived as "replacing the therapist" or "commoditizing care," professional associations could actively discourage adoption.',
    earlyWarnings: [
      'Negative social media posts from influential practitioners',
      'Professional association publishes guidance warning against AI therapy tools',
      'Conference panel discussion frames Bloomsline negatively',
      'Practitioners cancel subscriptions citing ethical concerns',
    ],
    mitigation: 'Messaging discipline: always position as "empowering practitioners" not "replacing therapists." Use language that reinforces practitioner authority: "your AI assistant," "practitioner-controlled," "decision support." Build Clinical Advisory Board with respected practitioners. Sponsor practitioner conferences. Publish thought leadership on ethical AI in therapy. Ensure practitioner controls every AI interaction.',
    contingency: 'If backlash emerges: respond with empathy, not defensiveness. Invite critics to advisory board or beta testing. Publish practitioner testimonials showing enhanced care quality. If specific feature draws criticism: modify or remove it. If association-level opposition: engage leadership directly and propose collaborative guidelines. Consider temporarily removing controversial features to rebuild trust.',
  },
]

// ── Scenario data ───────────────────────────────────────────────────────

interface Scenario {
  name: string
  probability: string
  color: string
  borderColor: string
  bgColor: string
  textColor: string
  narrative: string
  revenueImpact: string
  milestones: string[]
  responses: string[]
}

const SCENARIOS: Scenario[] = [
  {
    name: 'Best Case',
    probability: '15-20%',
    color: 'emerald',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    narrative: 'Strong product-market fit validated within 60 days. 30%+ MoM practitioner growth driven by word-of-mouth through supervision groups and conferences. €500K raised at favorable terms. 200 practitioners by Month 12. Series A at Month 15 at 3-4x step-up. Bloom AI becomes the default between-session tool in French therapy training programs.',
    revenueImpact: '€8K MRR by Month 12 — 200 practitioners × €40 blended ARPU',
    milestones: [
      'M3: 30 paying practitioners, <4% churn, NPS >50',
      'M6: 80 practitioners, first group practice signed',
      'M9: 140 practitioners, Series A conversations started',
      'M12: 200 practitioners, €8K MRR, Series A term sheet',
    ],
    responses: [
      'Accelerate hiring: second engineer by Month 4, designer by Month 6',
      'Begin Belgium/Switzerland expansion prep at Month 8',
      'Invest in clinical outcomes measurement for DiGA pathway',
      'Build enterprise tier for group practices (€20-25/seat/month)',
    ],
  },
  {
    name: 'Base Case',
    probability: '40-50%',
    color: 'blue',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    narrative: 'Moderate PMF — practitioners value AI notes but between-session engagement adoption is slower. 20-25% MoM growth with steady effort. €400K raised after 2-month fundraise. 120 practitioners by Month 12. Series A at Month 18-20 requiring bridge round. Core market is solo French practitioners; group practices take longer to convert.',
    revenueImpact: '€5K MRR by Month 12 — 120 practitioners × €42 blended ARPU (some annual)',
    milestones: [
      'M3: 15 paying practitioners, <6% churn, PMF signal emerging',
      'M6: 50 practitioners, first AFTCC partnership signed',
      'M9: 85 practitioners, bridge round if needed',
      'M12: 120 practitioners, €5K MRR, Series A prep',
    ],
    responses: [
      'Focus engineering on retention features: better onboarding, usage nudges',
      'Double down on content marketing: practitioner blog, case studies',
      'Pursue Bpifrance grants to extend runway without dilution',
      'Begin Series A networking by Month 9 — build relationships early',
    ],
  },
  {
    name: 'Worst Case',
    probability: '20-25%',
    color: 'amber',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    narrative: 'Weak PMF — practitioners sign up for AI notes but churn after 2-3 months. Between-session features underused. 10% MoM growth. €300K raised at less favorable terms. 50 practitioners by Month 12 with 8%+ monthly churn. Product needs significant iteration. Pivot evaluation at Month 9.',
    revenueImpact: '€2K MRR by Month 12 — 50 practitioners × €40 blended ARPU (high churn offsets growth)',
    milestones: [
      'M3: 8 paying practitioners, churn concerning at 7-8%',
      'M6: 25 practitioners, PMF survey below 30% threshold',
      'M9: 35 practitioners, pivot evaluation begins',
      'M12: 50 practitioners, decide: iterate, pivot, or wind down',
    ],
    responses: [
      'Conduct deep customer interviews to identify value gap',
      'Test pricing changes: lower price (€19/mo) or usage-based model',
      'Evaluate pivot to pure AI scribe tool or B2B enterprise wellness',
      'Reduce burn to absolute minimum (€5K/month) to extend runway for pivot',
    ],
  },
  {
    name: 'Black Swan',
    probability: '5-10%',
    color: 'gray',
    borderColor: 'border-gray-300',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    narrative: 'Convergence of catastrophic events: AI safety incident generates media coverage + CNIL launches investigation + EU funding winter deepens. Revenue drops to zero within 60 days as practitioners flee the platform. No fundraise possible in current environment. Existential threat to the company.',
    revenueImpact: 'Revenue to zero in 60 days — complete practitioner exodus',
    milestones: [
      'Day 1: AI incident occurs, media coverage begins',
      'Week 2: CNIL investigation notice, practitioner cancellations spike',
      'Month 1: Revenue down 80%, investor sentiment negative',
      'Month 2: Revenue at zero, emergency board meeting',
    ],
    responses: [
      'Immediately disable affected AI features — safety over revenue',
      'Activate crisis communications plan (pre-written templates)',
      'Evaluate acqui-hire offers from larger platforms (SimplePractice, Doctolib)',
      'If no viable path: orderly wind-down — return remaining capital to investors, help team find positions',
    ],
  },
]

// ── Roadmap data ────────────────────────────────────────────────────────

interface RoadmapPhase {
  phase: string
  period: string
  color: string
  borderColor: string
  bgColor: string
  items: { action: string; owner: string }[]
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: 'Foundation',
    period: 'M0-M6',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    items: [
      { action: 'Hire first engineer (full-stack, AI experience)', owner: 'Founders' },
      { action: 'Complete GDPR audit + DPIA for all AI features', owner: 'DPO / Legal' },
      { action: 'Run PMF pilot with 10-30 practitioners', owner: 'Product' },
      { action: 'Implement crisis detection in Bloom AI', owner: 'Engineering' },
      { action: 'HDS compliance consultation + action plan', owner: 'Legal' },
      { action: 'Build automated onboarding (first AI note < 5 min)', owner: 'Product' },
      { action: 'Implement AI model abstraction layer', owner: 'Engineering' },
      { action: 'Conduct first penetration test', owner: 'Security' },
    ],
  },
  {
    phase: 'Growth',
    period: 'M6-M12',
    color: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    items: [
      { action: 'Build churn prediction model from usage data', owner: 'Engineering' },
      { action: 'Reach 200+ practitioners (base case: 120)', owner: 'Sales' },
      { action: 'Begin EU AI Act documentation', owner: 'Compliance' },
      { action: 'Start Series A networking and investor updates', owner: 'Founders' },
      { action: 'Establish clinical ethics framework + advisory board', owner: 'Clinical' },
      { action: 'Apply for Bpifrance innovation grants', owner: 'Finance' },
    ],
  },
  {
    phase: 'Scale',
    period: 'M12-M18',
    color: 'text-violet-700',
    borderColor: 'border-violet-200',
    bgColor: 'bg-violet-50',
    items: [
      { action: 'Close Series A or secure bridge round', owner: 'Founders' },
      { action: 'HDS migration if mandated (OVHcloud / Scalingo)', owner: 'Engineering' },
      { action: 'EU AI Act conformity assessment if classified high-risk', owner: 'Compliance' },
      { action: 'Pricing review: evaluate €35-45/mo tiers', owner: 'Product' },
      { action: 'Evaluate pivot if PMF not reached by Month 15', owner: 'Board' },
    ],
  },
]

// ── Category groups for detailed cards ──────────────────────────────────

const CATEGORIES = ['Market', 'Operational', 'Financial', 'Regulatory', 'Reputational']

// ── Page ─────────────────────────────────────────────────────────────────

export default function RiskAnalysisPage() {
  const criticalCount = RISKS.filter((r) => r.severity === 'Critical').length
  const highCount = RISKS.filter((r) => r.severity === 'High').length
  const mediumCount = RISKS.filter((r) => r.severity === 'Medium').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Risk Analysis & Scenario Planning</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Investor Risk Report, Q1 2026</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">15 risks identified. Every one has a plan.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Building in EU health-tech means navigating regulatory complexity, adoption inertia, and funding cycles simultaneously.
            This report maps every material risk across five categories, models four outcome scenarios, and lays out a phased mitigation
            roadmap. No risk is unaddressed. The question is not whether risks exist — it&apos;s whether the team has planned for them.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">{criticalCount} critical</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{highCount} high</span>
            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">{mediumCount} medium</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">0 unmitigated</span>
          </div>
        </motion.section>

        {/* ── 2. Risk Heat Map ────────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="Probability × Impact — 15 risks plotted by severity">Risk Heat Map</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
            {/* Grid container */}
            <div className="relative">
              {/* Y-axis label */}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">
                Impact
              </div>

              <div className="ml-6 pt-8">
                {/* Heat map grid */}
                <div className="grid grid-cols-5 gap-px bg-gray-200 rounded-lg">
                  {/* Row by row, top (impact=5) to bottom (impact=1) */}
                  {[5, 4, 3, 2, 1].map((impact) =>
                    [1, 2, 3, 4, 5].map((prob) => {
                      const score = prob * impact
                      const bg =
                        score >= 15 ? 'bg-red-50' :
                        score >= 10 ? 'bg-amber-50' :
                        score >= 5 ? 'bg-yellow-50' :
                        'bg-emerald-50'

                      const risksInCell = RISKS.filter(
                        (r) => r.probability === prob && r.impact === impact
                      )

                      const corner =
                        impact === 5 && prob === 1 ? 'rounded-tl-lg' :
                        impact === 5 && prob === 5 ? 'rounded-tr-lg' :
                        impact === 1 && prob === 1 ? 'rounded-bl-lg' :
                        impact === 1 && prob === 5 ? 'rounded-br-lg' : ''

                      return (
                        <div
                          key={`${prob}-${impact}`}
                          className={`${bg} ${corner} min-h-[52px] sm:min-h-[60px] p-1.5 flex flex-wrap items-center justify-center gap-1 relative`}
                        >
                          {risksInCell.map((r) => {
                            const dotColor = CATEGORY_CONFIG[r.category]?.dotColor || 'bg-gray-400'
                            return (
                              <div key={r.id} className="group relative">
                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${dotColor} border-2 border-white shadow-sm flex items-center justify-center cursor-default`}>
                                  <span className="text-[7px] sm:text-[8px] font-bold text-white">{r.id.slice(1)}</span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-[9px] px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
                                    {r.id}: {r.name}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* X-axis labels */}
                <div className="grid grid-cols-5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <div key={p} className="text-center text-[9px] text-gray-400">{p}</div>
                  ))}
                </div>
                <p className="text-center text-[9px] font-semibold text-gray-400 tracking-wider uppercase mt-1">Probability</p>
              </div>

              {/* Y-axis labels */}
              <div className="absolute left-6 top-8 bottom-6 flex flex-col justify-around pointer-events-none">
                {[5, 4, 3, 2, 1].map((i) => (
                  <div key={i} className="text-[9px] text-gray-400 -ml-4 text-right w-3">{i}</div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
              {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${config.dotColor}`} />
                  <span className="text-[9px] text-gray-500">{cat}</span>
                </div>
              ))}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-emerald-50 border border-emerald-200" /><span className="text-[8px] text-gray-400">Low</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-yellow-50 border border-yellow-200" /><span className="text-[8px] text-gray-400">Med</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-amber-50 border border-amber-200" /><span className="text-[8px] text-gray-400">High</span></div>
                <div className="flex items-center gap-1"><div className="w-3 h-2 rounded-sm bg-red-50 border border-red-200" /><span className="text-[8px] text-gray-400">Critical</span></div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 3. Risk Register ────────────────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle="All 15 risks ranked by severity score (Probability × Impact)">Risk Register</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">P</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">I</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">Score</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {[...RISKS].sort((a, b) => b.score - a.score).map((risk, i) => (
                    <tr key={risk.id} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 text-[10px] font-mono font-bold text-gray-700">{risk.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_CONFIG[risk.category]?.color || ''}`}>
                          {risk.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-700 font-medium">{risk.name}</td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-600 text-center font-mono">{risk.probability}</td>
                      <td className="px-4 py-2.5 text-[10px] text-gray-600 text-center font-mono">{risk.impact}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-[10px] font-bold ${
                          risk.score >= 15 ? 'text-red-600' :
                          risk.score >= 10 ? 'text-amber-600' :
                          risk.score >= 5 ? 'text-yellow-600' :
                          'text-emerald-600'
                        }`}>
                          {risk.score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5"><SeverityBadge severity={risk.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        {/* ── 4. Detailed Risk Cards ─────────────────────────── */}
        {CATEGORIES.map((category, ci) => {
          const categoryRisks = RISKS.filter((r) => r.category === category)
          const config = CATEGORY_CONFIG[category]
          const CategoryIcon = config?.icon || Shield

          return (
            <motion.section key={category} {...fadeUp(0.15 + ci * 0.05)}>
              <SectionTitle subtitle={`${categoryRisks.length} risks — detailed analysis, early warnings, and response plans`}>
                <span className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4" />
                  {category} Risks
                </span>
              </SectionTitle>

              <div className="space-y-4">
                {categoryRisks.map((risk, ri) => (
                  <motion.div
                    key={risk.id}
                    className="bg-white border border-gray-200 rounded-xl p-5"
                    {...fadeUp(0.17 + ci * 0.05 + ri * 0.03)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-gray-400">{risk.id}</span>
                          <h4 className="text-xs font-bold text-gray-900">{risk.name}</h4>
                        </div>
                      </div>
                      <SeverityBadge severity={risk.severity} />
                    </div>

                    {/* P/I bars */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Probability ({risk.probability}/5)</p>
                        <ImpactBar value={risk.probability} color={risk.score >= 15 ? 'bg-red-400' : risk.score >= 10 ? 'bg-amber-400' : 'bg-yellow-400'} />
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Impact ({risk.impact}/5)</p>
                        <ImpactBar value={risk.impact} color={risk.score >= 15 ? 'bg-red-400' : risk.score >= 10 ? 'bg-amber-400' : 'bg-yellow-400'} />
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{risk.description}</p>

                    {/* Early warnings */}
                    <div className="mb-4">
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" /> Early Warning Signals
                      </p>
                      <div className="space-y-1">
                        {risk.earlyWarnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-gray-500">{w}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mitigation + Contingency */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Mitigation
                        </p>
                        <p className="text-[10px] text-emerald-700 leading-relaxed">{risk.mitigation}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Contingency
                        </p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">{risk.contingency}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })}

        {/* ── 5. Scenario Planning ────────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle="Four outcome models — from best case to black swan">Scenario Planning</SectionTitle>

          <div className="space-y-4">
            {SCENARIOS.map((scenario, i) => (
              <motion.div
                key={scenario.name}
                className={`${scenario.bgColor} border ${scenario.borderColor} rounded-xl p-5`}
                {...fadeUp(0.47 + i * 0.04)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className={`text-sm font-bold ${scenario.textColor}`}>{scenario.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Probability: {scenario.probability}</p>
                  </div>
                  <span className={`text-[9px] font-semibold px-2.5 py-1 rounded-full border ${scenario.borderColor} ${scenario.textColor}`}>
                    {scenario.probability}
                  </span>
                </div>

                {/* Narrative */}
                <p className="text-[10px] text-gray-600 leading-relaxed mb-4">{scenario.narrative}</p>

                {/* Revenue impact */}
                <div className="bg-white/60 rounded-lg px-3 py-2 mb-4">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Revenue Impact</p>
                  <p className={`text-xs font-bold ${scenario.textColor}`}>{scenario.revenueImpact}</p>
                </div>

                {/* Timeline milestones */}
                <div className="mb-4">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Milestones</p>
                  <div className="space-y-1.5">
                    {scenario.milestones.map((m, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-600">{m}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic responses */}
                <div>
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Strategic Response</p>
                  <div className="space-y-1.5">
                    {scenario.responses.map((r, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-600">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Risk Mitigation Roadmap ──────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle="Phased mitigation plan — from foundation to scale">Risk Mitigation Roadmap</SectionTitle>

          <div className="space-y-4">
            {ROADMAP.map((phase, pi) => (
              <motion.div
                key={phase.phase}
                className={`bg-white border ${phase.borderColor} rounded-xl p-5`}
                {...fadeUp(0.62 + pi * 0.04)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${phase.bgColor} ${phase.color} text-[10px] font-bold px-3 py-1 rounded-full`}>
                    {phase.period}
                  </div>
                  <h3 className={`text-sm font-bold ${phase.color}`}>{phase.phase}</h3>
                </div>
                <div className="space-y-2">
                  {phase.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full ${phase.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                        <ChevronRight className={`w-3 h-3 ${phase.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-700 font-medium">{item.action}</p>
                        <p className="text-[9px] text-gray-400">{item.owner}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 7. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(0.75)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Key Takeaways</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">Manageable</p>
                <div className="space-y-2">
                  {[
                    'No unmitigated risk — every threat has a specific response plan',
                    '85% gross margin provides buffer for cost shocks',
                    'B2B2C model de-risks distribution through practitioner networks',
                    'EU regulation creates structural moat that deepens over time',
                    'Pre-revenue stage means low blast radius if things go wrong',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">Uncontrollable</p>
                <div className="space-y-2">
                  {[
                    'Practitioner adoption is structurally slow — inertia is real',
                    'Funding winter is macro — no startup can control investor sentiment',
                    'AI safety risk is never zero — only manageable to asymptotic limits',
                    'HDS certification timing depends on French regulatory decisions',
                    'Doctolib and SimplePractice have resources we cannot match',
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
              <p className="text-xs font-semibold text-white mb-2">Honest Assessment</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                The question is not whether risks exist. The question is whether the team has identified them honestly,
                planned for them specifically, and built a product architecture that gives us options when things go wrong.
                This analysis covers 15 risks across 5 categories. Four are critical, four are high, seven are medium.
                None are unmitigated. The scenarios range from €8K MRR at Month 12 to complete wind-down. The roadmap
                prioritizes the risks that matter most, earliest. <span className="text-white font-semibold">That is the best any pre-revenue company can do.</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── 8. Footer ───────────────────────────────────────── */}
        <motion.div {...fadeUp(0.8)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Analysis as of Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

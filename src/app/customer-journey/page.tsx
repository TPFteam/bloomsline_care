'use client'

import { motion } from 'framer-motion'
import {
  Route,
  Users,
  User,
  Heart,
  Search,
  CheckCircle2,
  Star,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Mail,
  Globe,
  Smartphone,
  Calendar,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Shield,
  DollarSign,
  BarChart3,
  Handshake,
  Eye,
  Megaphone,
  Gift,
  RefreshCw,
  XCircle,
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

// ── Types ────────────────────────────────────────────────────────────────

interface JourneyStage {
  id: string
  stage: string
  emotion: number // -2 to +2 scale
  emotionLabel: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof Search
  description: string
  actions: string[]
  thoughts: string[]
  touchpoints: { channel: string; icon: typeof Globe }[]
  painPoints: string[]
  opportunities: string[]
  metrics: { label: string; target: string }[]
  tools: string[]
}

// ── B2B Journey (Practitioner) ──────────────────────────────────────────

const B2B_STAGES: JourneyStage[] = [
  {
    id: 'b2b-awareness',
    stage: 'Awareness',
    emotion: 0,
    emotionLabel: 'Curious',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Eye,
    description: 'Practitioner first encounters Bloomsline through peer networks, conferences, or online content. They are overwhelmed by admin work and skeptical about AI but open to solutions that respect clinical practice.',
    actions: [
      'Sees Bloomsline post in supervision group or LinkedIn',
      'Hears colleague mention AI-assisted notes at AFTCC conference',
      'Searches "AI therapy notes GDPR" or "between-session care tool"',
      'Reads blog article on practitioner burnout and technology solutions',
    ],
    thoughts: [
      '"I spend 40% of my time on paperwork instead of clients"',
      '"Another AI tool — is this actually designed for therapists?"',
      '"My colleagues at the conference seemed impressed, worth a look"',
      '"Will this comply with GDPR? I handle sensitive data"',
    ],
    touchpoints: [
      { channel: 'LinkedIn / social media', icon: Globe },
      { channel: 'Professional conferences (AFTCC, Asadis)', icon: Megaphone },
      { channel: 'Peer referral / supervision groups', icon: Users },
      { channel: 'Google search / SEO content', icon: Search },
    ],
    painPoints: [
      'Information overload — too many SaaS tools making big promises',
      'No clear differentiation from general practice management tools',
      'Distrust of AI in clinical settings (45% of therapists skeptical — APA 2024)',
      'Unclear if tool is built for French/EU market specifically',
    ],
    opportunities: [
      'Lead with practitioner burnout narrative (not AI features)',
      'Showcase "built by therapists, for therapists" positioning',
      'Provide free downloadable guides on session documentation best practices',
      'Leverage AFTCC and training institute partnerships for credibility',
    ],
    metrics: [
      { label: 'Website visitors/month', target: '2,000+' },
      { label: 'Content engagement rate', target: '>3%' },
      { label: 'Brand recall in target segment', target: '>15%' },
    ],
    tools: ['PostHog (analytics)', 'LinkedIn Ads', 'Mailchimp (newsletter)', 'Blog/SEO'],
  },
  {
    id: 'b2b-consideration',
    stage: 'Consideration',
    emotion: 1,
    emotionLabel: 'Interested',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Search,
    description: 'Practitioner evaluates Bloomsline against alternatives. They compare features, pricing, and GDPR compliance. They want proof that this works for practitioners like them — not just a generic demo.',
    actions: [
      'Visits bloomslinecare.com and explores features page',
      'Watches product demo video or attends live webinar',
      'Compares Bloomsline to SimplePractice, Doctolib Pro, Quenza',
      'Checks privacy policy and data residency information',
      'Asks colleagues who are already using it for honest feedback',
    ],
    thoughts: [
      '"The AI notes look impressive but can I trust it with clinical data?"',
      '"€25/month — that is less than one cancelled session costs me"',
      '"Will my clients actually use a between-session app?"',
      '"I need something that works with my existing workflow, not replaces it"',
    ],
    touchpoints: [
      { channel: 'Product website / feature pages', icon: Globe },
      { channel: 'Live demo / webinar', icon: Smartphone },
      { channel: 'Comparison reviews / case studies', icon: BarChart3 },
      { channel: 'Direct email from sales', icon: Mail },
    ],
    painPoints: [
      'No peer-reviewed clinical validation available yet',
      'Unclear how AI notes integrate with existing documentation workflow',
      'Concern about learning curve and time investment to set up',
      'No free tier to test before committing credit card',
    ],
    opportunities: [
      'Offer live 1:1 demo with a clinical specialist, not a sales rep',
      'Create comparison landing pages vs. SimplePractice, Quenza, Doctolib',
      'Publish practitioner testimonials with specific outcomes ("saves me 6 hrs/week")',
      'Provide 14-day free trial with full features, no credit card required',
    ],
    metrics: [
      { label: 'Demo booking rate', target: '>25%' },
      { label: 'Website → trial conversion', target: '>8%' },
      { label: 'Time on features page', target: '>3 min' },
    ],
    tools: ['Calendly (demo booking)', 'Crisp (live chat)', 'PostHog (funnel)', 'Case study PDFs'],
  },
  {
    id: 'b2b-decision',
    stage: 'Decision',
    emotion: 0,
    emotionLabel: 'Cautious',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: CheckCircle2,
    description: 'Practitioner decides whether to commit. This is the highest-friction moment — they need final reassurance on data security, clinical appropriateness, and ROI before entering payment details.',
    actions: [
      'Starts 14-day free trial and generates first AI session note',
      'Tests the member app with one client as a pilot',
      'Reads terms of service and data processing agreement',
      'Discusses with practice partner or supervisor',
      'Evaluates ROI: time saved vs. monthly cost',
    ],
    thoughts: [
      '"The AI note was actually good — better than what I write at 9 PM"',
      '"My client responded to the between-session check-in, that is new"',
      '"€25/month = 1 hour of my time. If it saves 4+ hours, it is worth it"',
      '"What happens to data if I stop paying? Can I export everything?"',
    ],
    touchpoints: [
      { channel: 'In-product trial experience', icon: Smartphone },
      { channel: 'Onboarding email sequence', icon: Mail },
      { channel: 'Checkout / pricing page', icon: DollarSign },
      { channel: 'Support chat during trial', icon: MessageSquare },
    ],
    painPoints: [
      'Payment friction — especially for solo practitioners used to free tools',
      'Anxiety about committing to a platform for sensitive clinical data',
      'Trial period may not be long enough to see member engagement results',
      'No clear exit path or data portability guarantee visible during signup',
    ],
    opportunities: [
      'Offer "first month 50% off" or extended 30-day trial for conference leads',
      'Show clear data export and account deletion options during trial',
      'Send personalized email: "Your first AI note saved 18 minutes"',
      'Provide ROI calculator: hours saved × hourly rate vs. subscription cost',
    ],
    metrics: [
      { label: 'Trial → paid conversion', target: '>40%' },
      { label: 'Days to conversion (trial)', target: '<10 days' },
      { label: 'Average revenue per signup', target: '€25-40' },
    ],
    tools: ['Stripe (payments)', 'Customer.io (email automation)', 'In-app analytics', 'ROI calculator widget'],
  },
  {
    id: 'b2b-onboarding',
    stage: 'Onboarding',
    emotion: -1,
    emotionLabel: 'Overwhelmed',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Zap,
    description: 'The critical first 7 days. Practitioner must experience the "aha moment" — generating their first AI note in under 5 minutes and inviting their first member. If onboarding takes too long or feels complex, churn risk spikes.',
    actions: [
      'Completes profile setup and practice preferences',
      'Generates first AI session note (target: within 5 minutes)',
      'Customizes note templates and clinical terminology',
      'Invites first 1-3 members to the platform',
      'Reviews first between-session engagement summary',
    ],
    thoughts: [
      '"Where do I start? There are a lot of features here"',
      '"OK the AI note was fast — but I need to review and edit it"',
      '"How do I explain this to my clients? Do they need to download an app?"',
      '"I am worried about getting the clinical language right"',
    ],
    touchpoints: [
      { channel: 'In-app guided setup wizard', icon: Smartphone },
      { channel: 'Welcome email sequence (Days 1, 3, 7)', icon: Mail },
      { channel: 'Video tutorials / help center', icon: Globe },
      { channel: 'Optional 1:1 onboarding call', icon: Calendar },
    ],
    painPoints: [
      'Setup feels like "another thing to learn" on top of clinical load',
      'Member invitation flow requires explaining a new tool to clients',
      'AI note quality varies — needs calibration to practitioner style',
      'No immediate feedback on whether members are actually engaging',
    ],
    opportunities: [
      'Guided "first session" wizard: upload or dictate → AI note in 90 seconds',
      'Pre-written member invitation templates (email, SMS, in-session script)',
      'Day 3 check-in email: "Your first note saved 18 min — here is what to try next"',
      'White-glove onboarding for first 100 practitioners (builds loyalty + feedback)',
    ],
    metrics: [
      { label: 'Time to first AI note', target: '<5 minutes' },
      { label: 'Members invited in Week 1', target: '≥1' },
      { label: 'Onboarding completion rate', target: '>75%' },
    ],
    tools: ['Product tours (Shepherd.js)', 'Intercom (in-app messaging)', 'Loom (video walkthroughs)', 'Calendly (1:1 calls)'],
  },
  {
    id: 'b2b-engagement',
    stage: 'Engagement',
    emotion: 2,
    emotionLabel: 'Delighted',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Heart,
    description: 'Practitioner has integrated Bloomsline into their daily workflow. They generate AI notes after every session, track member engagement between appointments, and see measurable time savings. This is the value realization phase.',
    actions: [
      'Generates AI notes for all sessions (2-4x/day)',
      'Reviews weekly member engagement dashboard',
      'Uses between-session care plans with 5-10 active members',
      'Tracks client progress milestones and outcomes data',
      'Shares feedback and feature requests with the team',
    ],
    thoughts: [
      '"I am saving 6+ hours per week on documentation"',
      '"My clients are more engaged between sessions — I can see the data"',
      '"The AI catches patterns I might miss across my caseload"',
      '"This is becoming essential to how I practice"',
    ],
    touchpoints: [
      { channel: 'Daily dashboard usage', icon: Smartphone },
      { channel: 'Weekly engagement reports (email)', icon: Mail },
      { channel: 'In-app feature updates', icon: Sparkles },
      { channel: 'Community forum / peer group', icon: Users },
    ],
    painPoints: [
      'Feature requests pile up — practitioners want customization',
      'AI note quality inconsistency for edge-case modalities (EMDR, art therapy)',
      'Dashboard can feel data-heavy for practitioners who prefer simplicity',
      'Member engagement varies — some clients engage daily, others not at all',
    ],
    opportunities: [
      'Launch "Practitioner Spotlight" program — feature power users in content',
      'Build modality-specific AI templates (CBT, psychodynamic, systemic)',
      'Send monthly "practice insights" email with aggregated anonymized trends',
      'Introduce outcome measurement tools that practitioners can share with referrers',
    ],
    metrics: [
      { label: 'Daily active practitioners', target: '>60% of base' },
      { label: 'AI notes per practitioner/week', target: '8-15' },
      { label: 'NPS score', target: '>50' },
    ],
    tools: ['PostHog (product analytics)', 'Customer.io (lifecycle emails)', 'Canny (feature requests)', 'Discord (community)'],
  },
  {
    id: 'b2b-loyalty',
    stage: 'Loyalty',
    emotion: 2,
    emotionLabel: 'Committed',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Star,
    description: 'Practitioner becomes an advocate. They recommend Bloomsline to peers, participate in beta testing, and upgrade to annual billing. Their data is deeply embedded in the platform — switching cost is now high.',
    actions: [
      'Switches to annual billing (20% discount)',
      'Refers 2-3 colleagues to Bloomsline',
      'Joins Clinical Advisory Board or beta program',
      'Presents Bloomsline at supervision group or local conference',
      'Has 15-30 active members on the platform',
    ],
    thoughts: [
      '"I cannot imagine going back to handwritten notes"',
      '"I told my supervision group — three of them signed up"',
      '"The team actually listens to my feedback and ships it"',
      '"This has genuinely improved my practice and reduced burnout"',
    ],
    touchpoints: [
      { channel: 'Referral program / ambassador community', icon: Gift },
      { channel: 'Annual billing renewal', icon: DollarSign },
      { channel: 'Beta feature access', icon: Sparkles },
      { channel: 'Advisory board meetings', icon: Handshake },
    ],
    painPoints: [
      'Long-term practitioners want enterprise features (multi-clinician, shared templates)',
      'Concern about platform stability and long-term viability of a startup',
      'Annual billing feels risky if the product might change direction',
      'Referral program lacks tangible incentives beyond goodwill',
    ],
    opportunities: [
      'Launch referral rewards: 1 month free per successful referral',
      'Create "Bloomsline Champions" badge with exclusive community access',
      'Offer group practice pricing for practitioners who bring their clinic',
      'Co-author case studies and blog posts with loyal practitioners',
    ],
    metrics: [
      { label: 'Annual billing adoption', target: '>30%' },
      { label: 'Referral rate', target: '>15%' },
      { label: 'Monthly churn (loyal segment)', target: '<2%' },
    ],
    tools: ['Referral program (Rewardful)', 'Slack (champions community)', 'Calendly (advisory calls)', 'Stripe (annual billing)'],
  },
  {
    id: 'b2b-churn',
    stage: 'Churn Risk',
    emotion: -2,
    emotionLabel: 'Frustrated',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Practitioner disengages. Usage drops, AI notes become infrequent, members are no longer being invited. Without intervention, they cancel within 30-60 days. Early detection and re-engagement are critical.',
    actions: [
      'Stops generating AI notes (usage drops >50% in 2 weeks)',
      'Ignores weekly engagement emails and in-app notifications',
      'Stops inviting new members to the platform',
      'Contacts support about cancellation or data export',
      'Lets subscription lapse without formal cancellation',
    ],
    thoughts: [
      '"I am not using this enough to justify the cost"',
      '"My clients did not engage with the between-session features"',
      '"The AI notes are good but I already have a workflow that works"',
      '"I am going back to my old system — it is less sophisticated but familiar"',
    ],
    touchpoints: [
      { channel: 'Churn prediction alerts (internal)', icon: AlertTriangle },
      { channel: 'Re-engagement email sequence', icon: Mail },
      { channel: 'Personal outreach from founder/CSM', icon: MessageSquare },
      { channel: 'Cancellation flow with save offers', icon: RefreshCw },
    ],
    painPoints: [
      'Feels like the platform is not tailored to their specific practice style',
      'Members did not adopt between-session care — practitioners feel it failed',
      'Feature complexity increased but core value proposition did not deepen',
      'No clear improvement in client outcomes visible from the dashboard',
    ],
    opportunities: [
      'Build churn prediction model: trigger at 50% usage drop over 14 days',
      'Offer 1:1 "practice optimization" call — reactivate value, not sales pitch',
      'Create "pause" option (3 months) instead of hard cancellation',
      'Exit survey: "What would bring you back?" — feed into product roadmap',
    ],
    metrics: [
      { label: 'Monthly churn rate', target: '<5%' },
      { label: 'Churn save rate', target: '>25%' },
      { label: 'Win-back rate (90 days)', target: '>10%' },
    ],
    tools: ['Churn prediction (custom ML)', 'Customer.io (win-back flows)', 'Typeform (exit survey)', 'Stripe (pause billing)'],
  },
]

// ── B2C Journey (Member/Client) ─────────────────────────────────────────

const B2C_STAGES: JourneyStage[] = [
  {
    id: 'b2c-awareness',
    stage: 'Awareness',
    emotion: -1,
    emotionLabel: 'Uncertain',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Eye,
    description: 'Member first learns about Bloomsline through their practitioner — not through marketing. This is a trust-transfer moment: the practitioner\'s recommendation carries enormous weight for someone already in a vulnerable therapeutic relationship.',
    actions: [
      'Practitioner mentions Bloomsline during session',
      'Receives invitation email or SMS from practitioner',
      'Hears "there is an app to help you between our sessions"',
      'Googles "Bloomsline Care" to check legitimacy and privacy',
    ],
    thoughts: [
      '"My therapist recommended this — it must be trustworthy"',
      '"Will this replace our in-person sessions?"',
      '"I already use mindfulness apps — is this different?"',
      '"Who can see my data? Is this really private?"',
    ],
    touchpoints: [
      { channel: 'In-session practitioner recommendation', icon: MessageSquare },
      { channel: 'Practitioner-sent invitation (email/SMS)', icon: Mail },
      { channel: 'Bloomsline member landing page', icon: Globe },
      { channel: 'App Store listing', icon: Smartphone },
    ],
    painPoints: [
      'Skepticism about yet another health app collecting personal data',
      'Anxiety about digital tools in a deeply personal therapeutic context',
      'Unclear on the value — "what will I actually do with this?"',
      'Fear that app engagement will be "homework" monitored by therapist',
    ],
    opportunities: [
      'Practitioner-framed introduction: "This extends our work together"',
      'Member landing page with clear privacy-first messaging and GDPR badges',
      'Show value immediately: "Track your mood, journal safely, stay connected"',
      'Emphasize practitioner control: "Your therapist chose this for you"',
    ],
    metrics: [
      { label: 'Invitation → app download', target: '>60%' },
      { label: 'Time from invitation to download', target: '<48 hours' },
      { label: 'Landing page bounce rate', target: '<40%' },
    ],
    tools: ['Deep links (Branch.io)', 'App Store optimization', 'Member landing page', 'Practitioner invitation templates'],
  },
  {
    id: 'b2c-consideration',
    stage: 'Consideration',
    emotion: 0,
    emotionLabel: 'Open-minded',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: Search,
    description: 'Member evaluates whether to engage. Unlike B2B, the practitioner has already validated the tool — so the barrier is personal comfort with digital mental health tools, not feature comparison.',
    actions: [
      'Downloads the Bloomsline member app',
      'Reads privacy policy and data sharing explanation',
      'Explores the app interface (mood tracker, journal, resources)',
      'Checks App Store reviews and ratings',
    ],
    thoughts: [
      '"The interface feels calm and welcoming — not clinical"',
      '"OK, only my therapist can see my entries — that feels safe"',
      '"A mood tracker and journal — I have tried these before and stopped"',
      '"The personalized content from my therapist makes this feel different"',
    ],
    touchpoints: [
      { channel: 'App first-open experience', icon: Smartphone },
      { channel: 'In-app privacy explainer', icon: Shield },
      { channel: 'Personalized content from practitioner', icon: Heart },
      { channel: 'Push notification (gentle)', icon: MessageSquare },
    ],
    painPoints: [
      'App fatigue — users have downloaded and abandoned similar apps before',
      'Privacy anxiety about journaling on a platform linked to their therapist',
      'Unclear how this is different from free apps (Headspace, Calm, Daylio)',
      'No immediate emotional reward from signing up',
    ],
    opportunities: [
      'First-open experience: 60-second video from practitioner (personalized or template)',
      'Show "your therapist has prepared content for you" — creates immediate value',
      'Minimal permissions asked at signup — build trust before requesting data',
      'Clear visual comparison: "This is connected to your therapy, not standalone"',
    ],
    metrics: [
      { label: 'App download → account creation', target: '>80%' },
      { label: 'First session completion (in-app)', target: '>65%' },
      { label: 'Privacy policy engagement', target: '>30% scroll' },
    ],
    tools: ['App onboarding (custom)', 'Practitioner-personalized content', 'In-app privacy flow', 'Analytics (Mixpanel)'],
  },
  {
    id: 'b2c-decision',
    stage: 'Decision',
    emotion: 1,
    emotionLabel: 'Willing',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    icon: CheckCircle2,
    description: 'Member decides to actively engage — completing their first mood check-in, journal entry, or between-session activity. This is low friction (no payment required) but high emotional commitment for someone sharing mental health data.',
    actions: [
      'Completes first mood check-in',
      'Writes first journal entry or reflection',
      'Engages with practitioner-assigned activity or resource',
      'Responds to an AI-generated check-in prompt',
    ],
    thoughts: [
      '"That mood check-in was actually quick and easy"',
      '"Writing this out between sessions feels productive"',
      '"My therapist sent me a resource — they are thinking of me between sessions"',
      '"I feel more connected to my therapy process"',
    ],
    touchpoints: [
      { channel: 'First mood check-in flow', icon: Heart },
      { channel: 'First journal entry prompt', icon: MessageSquare },
      { channel: 'Practitioner-shared resource or activity', icon: Sparkles },
      { channel: 'AI check-in notification', icon: Brain },
    ],
    painPoints: [
      'Journal prompts feel generic rather than specific to their therapeutic goals',
      'Uncertainty about what to write or share — fear of judgment',
      'Notification timing is off — arrives during work or late at night',
      'No immediate feedback or acknowledgment after first entry',
    ],
    opportunities: [
      'Celebrate first entry: warm congratulations + visual streak indicator',
      'Personalized journal prompts linked to last session themes',
      'Let members choose notification timing and frequency',
      'Bloom AI sends supportive acknowledgment: "Thank you for sharing — your therapist will see this"',
    ],
    metrics: [
      { label: 'First activity completion (48h)', target: '>50%' },
      { label: 'Second activity completion (7d)', target: '>35%' },
      { label: 'Notification opt-in rate', target: '>70%' },
    ],
    tools: ['Push notifications (OneSignal)', 'In-app celebrations', 'Practitioner content assignment', 'Bloom AI prompts'],
  },
  {
    id: 'b2c-onboarding',
    stage: 'Onboarding',
    emotion: 0,
    emotionLabel: 'Adjusting',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Zap,
    description: 'Member builds a habit over the first 2-4 weeks. The critical activation milestones: 3 mood check-ins in Week 1, 1 journal entry in Week 2, and engagement with at least 1 practitioner-assigned activity. Members who hit these milestones retain 3x better.',
    actions: [
      'Completes 3+ mood check-ins in first week',
      'Writes 2+ journal entries in first two weeks',
      'Engages with practitioner-assigned between-session activity',
      'Views the mood trend visualization after 5+ entries',
      'Discusses app experience in next therapy session',
    ],
    thoughts: [
      '"I am starting to see patterns in my mood data"',
      '"Writing before my session helps me know what to talk about"',
      '"The practitioner mentioned my journal in our session — it feels connected"',
      '"This is becoming part of my self-care routine"',
    ],
    touchpoints: [
      { channel: 'Daily mood check-in reminders', icon: Clock },
      { channel: 'Weekly progress summary', icon: BarChart3 },
      { channel: 'Practitioner mention in session', icon: MessageSquare },
      { channel: 'Resource library exploration', icon: Globe },
    ],
    painPoints: [
      'Habit formation is hard — members forget to check in after initial novelty',
      'Mood data feels abstract without context or interpretation',
      'Practitioner may not reference app data in sessions, breaking the loop',
      'Resource library can feel overwhelming if not curated per member',
    ],
    opportunities: [
      'Streak rewards: visual badges for 3-day, 7-day, 14-day check-in streaks',
      'AI-generated "week in review" summary shared with member and practitioner',
      'Coach practitioners to reference member data in sessions (closes the loop)',
      'Personalized resource recommendations based on mood patterns and journal themes',
    ],
    metrics: [
      { label: 'Week 1 activation (3+ check-ins)', target: '>45%' },
      { label: 'Week 2 journal entry', target: '>30%' },
      { label: '30-day retention', target: '>50%' },
    ],
    tools: ['Streak tracking (custom)', 'AI weekly summary', 'Push notification scheduling', 'Resource recommendation engine'],
  },
  {
    id: 'b2c-engagement',
    stage: 'Engagement',
    emotion: 2,
    emotionLabel: 'Empowered',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Heart,
    description: 'Member is an active user. They check in 3-5x/week, journal regularly, engage with practitioner-assigned activities, and use the resource library. They feel the app is a genuine extension of their therapy — not a separate obligation.',
    actions: [
      'Daily or near-daily mood check-ins (habit established)',
      'Regular journaling linked to therapeutic themes',
      'Completes between-session activities assigned by practitioner',
      'Uses Bloom AI for coping strategies and psychoeducation',
      'Reviews mood trends and shares insights in sessions',
    ],
    thoughts: [
      '"I notice more about myself between sessions now"',
      '"My therapist and I are more aligned because of the shared data"',
      '"The between-session activities make my sessions more productive"',
      '"I feel like an active participant in my healing, not just a patient"',
    ],
    touchpoints: [
      { channel: 'Daily app usage (habitual)', icon: Smartphone },
      { channel: 'Bloom AI conversations', icon: Brain },
      { channel: 'Practitioner-shared insights', icon: Sparkles },
      { channel: 'Mood trend visualizations', icon: TrendingUp },
    ],
    painPoints: [
      'Content can feel repetitive after 2-3 months of regular use',
      'AI responses sometimes feel generic for complex emotional states',
      'No peer community or shared experience features (isolation)',
      'Notifications feel intrusive once habit is established — wants more control',
    ],
    opportunities: [
      'Introduce goal tracking tied to therapeutic milestones',
      'AI-powered insights: "Over the past month, your mood improves after journaling"',
      'Expand resource library with multimedia (guided exercises, audio)',
      'Allow members to adjust notification frequency as habits mature',
    ],
    metrics: [
      { label: 'Weekly active usage', target: '>3 days/week' },
      { label: 'Avg. entries per month', target: '>12' },
      { label: 'Session preparation rate', target: '>40%' },
    ],
    tools: ['Bloom AI (between-session)', 'Mood analytics dashboard', 'Goal tracking (custom)', 'Resource library'],
  },
  {
    id: 'b2c-loyalty',
    stage: 'Loyalty',
    emotion: 2,
    emotionLabel: 'Grateful',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: Star,
    description: 'Member attributes part of their therapeutic progress to Bloomsline. They recommend it to friends in therapy, leave positive reviews, and feel genuine attachment to the platform. If they switch practitioners, they want one who also uses Bloomsline.',
    actions: [
      'Tells friends in therapy about the platform',
      'Leaves App Store review (prompted at engagement milestone)',
      'Achieves therapeutic milestones visible in the app',
      'If switching practitioners, prefers one using Bloomsline',
      'Explores additional resources beyond practitioner assignments',
    ],
    thoughts: [
      '"This app is a real part of my progress — I want to keep it"',
      '"I told my friend who started therapy to ask if their therapist uses this"',
      '"Looking at my mood data over 6 months — I can see how far I have come"',
      '"If I change therapists, I want one who uses Bloomsline"',
    ],
    touchpoints: [
      { channel: 'Milestone celebrations in-app', icon: Star },
      { channel: 'App Store review prompt', icon: Smartphone },
      { channel: 'Progress reports (shareable)', icon: BarChart3 },
      { channel: 'Practitioner referral network', icon: Handshake },
    ],
    painPoints: [
      'Fear of losing data if practitioner stops using Bloomsline',
      'Wants to maintain progress tracking even if therapy ends',
      'No formal way to recommend the platform beyond word-of-mouth',
      'Milestone definitions feel arbitrary rather than clinically meaningful',
    ],
    opportunities: [
      'Build member continuity: data persists even if they switch practitioners',
      'Create shareable (anonymized) progress reports for personal records',
      'Launch "refer your therapist" feature — close the B2C → B2B loop',
      'Clinically-validated milestones designed with advisory board input',
    ],
    metrics: [
      { label: 'App Store rating', target: '>4.5 stars' },
      { label: 'Member referral rate', target: '>10%' },
      { label: '6-month retention', target: '>40%' },
    ],
    tools: ['App Store review prompts', 'Progress visualization', 'Referral tracking', 'Milestone engine'],
  },
  {
    id: 'b2c-churn',
    stage: 'Churn Risk',
    emotion: -2,
    emotionLabel: 'Disconnected',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle,
    description: 'Member disengages. Usage drops, check-ins become sporadic, journal entries stop. Often correlates with therapy ending, practitioner switching, or a perceived lack of value. Unlike B2B, members don\'t pay — so churn manifests as silent disengagement.',
    actions: [
      'Stops daily mood check-ins (drops from 5x/week to 0-1x)',
      'Ignores push notifications or disables them',
      'Does not engage with new practitioner-assigned activities',
      'Deletes the app or just stops opening it',
      'Therapy ends and there is no standalone value proposition',
    ],
    thoughts: [
      '"I stopped therapy, so I do not need this anymore"',
      '"I was using it because my therapist asked me to, not for myself"',
      '"The check-ins feel like a chore now, not a help"',
      '"I got what I needed — my mood is better, I do not need to track anymore"',
    ],
    touchpoints: [
      { channel: 'Re-engagement push notification', icon: MessageSquare },
      { channel: 'Practitioner alert (member disengaging)', icon: AlertTriangle },
      { channel: '"We miss you" email', icon: Mail },
      { channel: 'App deletion detection', icon: Smartphone },
    ],
    painPoints: [
      'No standalone value — app only makes sense within active therapy',
      'Therapy ending = app ending for most members',
      'Re-engagement messages feel guilt-inducing for vulnerable users',
      'No graceful off-ramp or "maintenance mode" for therapy completers',
    ],
    opportunities: [
      'Build "therapy complete" mode: lighter check-ins, self-directed resources',
      'Alert practitioner when member disengages — opportunity for in-session conversation',
      'Celebrate therapy completion: "Look how far you have come" retrospective',
      'Offer maintenance plan: monthly mood check-in + access to resource library',
    ],
    metrics: [
      { label: 'Member monthly churn', target: '<8%' },
      { label: 'Practitioner notification → re-engagement', target: '>20%' },
      { label: 'Post-therapy retention (90 days)', target: '>15%' },
    ],
    tools: ['Churn prediction (custom)', 'Practitioner alert system', 'Completion retrospective generator', 'Maintenance mode'],
  },
]

// ── Emotion curve helper ────────────────────────────────────────────────

const EMOTION_LABELS: Record<number, { label: string; color: string }> = {
  '-2': { label: 'Frustrated', color: 'text-red-500' },
  '-1': { label: 'Anxious', color: 'text-amber-500' },
  '0': { label: 'Neutral', color: 'text-gray-400' },
  '1': { label: 'Positive', color: 'text-blue-500' },
  '2': { label: 'Delighted', color: 'text-emerald-500' },
}

function EmotionCurve({ stages, color }: { stages: JourneyStage[]; color: string }) {
  const height = 120
  const padding = 24
  const usableHeight = height - padding * 2
  const stepWidth = 100 / (stages.length - 1)

  // Map emotion (-2 to +2) to y coordinate (top = +2, bottom = -2)
  const toY = (emotion: number) => padding + ((2 - emotion) / 4) * usableHeight

  const points = stages.map((s, i) => ({
    x: i * stepWidth,
    y: toY(s.emotion),
    label: s.emotionLabel,
    stage: s.stage,
    emotion: s.emotion,
  }))

  // Build SVG path
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="relative" style={{ height }}>
        {/* Horizontal reference lines */}
        {[-2, -1, 0, 1, 2].map((level) => (
          <div
            key={level}
            className="absolute left-0 right-0 border-t border-dashed border-gray-100"
            style={{ top: toY(level) }}
          >
            <span className={`absolute -left-1 -translate-y-1/2 text-[8px] font-medium ${EMOTION_LABELS[level]?.color || 'text-gray-400'}`} style={{ left: -4 }}>
              {level === 2 ? '😊' : level === 1 ? '🙂' : level === 0 ? '😐' : level === -1 ? '😟' : '😣'}
            </span>
          </div>
        ))}

        {/* SVG curve */}
        <svg
          viewBox={`0 0 100 ${height}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Stage labels below */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between" style={{ bottom: -20 }}>
          {points.map((p, i) => (
            <div key={i} className="text-center" style={{ width: `${100 / stages.length}%` }}>
              <p className="text-[8px] font-semibold text-gray-500 truncate">{p.stage}</p>
              <p className={`text-[7px] font-medium ${EMOTION_LABELS[p.emotion]?.color || 'text-gray-400'}`}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Stage card renderer ─────────────────────────────────────────────────

function StageCard({ stage, index, baseDelay }: { stage: JourneyStage; index: number; baseDelay: number }) {
  const Icon = stage.icon
  return (
    <motion.div
      className={`bg-white border ${stage.borderColor} rounded-xl p-5`}
      {...fadeUp(baseDelay + index * 0.03)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${stage.bgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${stage.color}`} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">{stage.stage}</h4>
            <p className={`text-[9px] font-semibold ${stage.color}`}>{stage.emotionLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${
                i <= stage.emotion + 2
                  ? stage.emotion >= 1 ? 'bg-emerald-400' : stage.emotion >= 0 ? 'bg-blue-400' : stage.emotion >= -1 ? 'bg-amber-400' : 'bg-red-400'
                  : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{stage.description}</p>

      {/* Actions & Thoughts (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Actions</p>
          <div className="space-y-1.5">
            {stage.actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Thoughts</p>
          <div className="space-y-1.5">
            {stage.thoughts.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <Brain className="w-3 h-3 text-gray-300 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 italic">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Touchpoints */}
      <div className="mb-4">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Touchpoints</p>
        <div className="flex flex-wrap gap-2">
          {stage.touchpoints.map((tp, i) => {
            const TpIcon = tp.icon
            return (
              <div key={i} className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-full">
                <TpIcon className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] text-gray-600">{tp.channel}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pain Points & Opportunities (side by side) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Pain Points
          </p>
          <div className="space-y-1.5">
            {stage.painPoints.map((p, i) => (
              <p key={i} className="text-[10px] text-red-600 leading-relaxed">• {p}</p>
            ))}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" /> Opportunities
          </p>
          <div className="space-y-1.5">
            {stage.opportunities.map((o, i) => (
              <p key={i} className="text-[10px] text-emerald-600 leading-relaxed">• {o}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics & Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Metrics</p>
          <div className="space-y-1.5">
            {stage.metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600">{m.label}</span>
                <span className="text-[10px] font-bold text-gray-900">{m.target}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Tools</p>
          <div className="flex flex-wrap gap-1.5">
            {stage.tools.map((tool, i) => (
              <span key={i} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function CustomerJourneyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Route className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Customer Journey Map</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — B2B Practitioner & B2C Member Journeys</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Two journeys. One connected experience.</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Bloomsline operates a B2B2C model: practitioners (B2B) adopt the platform and invite their members (B2C).
            Each journey has 7 lifecycle stages — from awareness to churn risk — with distinct emotional arcs, touchpoints,
            and intervention points. Understanding both journeys is critical because practitioner retention depends on member engagement,
            and member engagement depends on practitioner activation.
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">7 B2B stages</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">7 B2C stages</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">84 touchpoints mapped</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">56 opportunities identified</span>
          </div>
        </motion.section>

        {/* ── 2. Journey Overview ─────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle="How the B2B and B2C journeys interlock in the Bloomsline flywheel">Journey Architecture</SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Users className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-blue-700 mb-1">B2B: Practitioner</p>
                <p className="text-[9px] text-blue-600">Adopts platform → generates AI notes → invites members → sees engagement data → retains subscription</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-gray-600 mb-1">Flywheel</p>
                  <p className="text-[9px] text-gray-500">Practitioner activation drives member engagement. Member engagement drives practitioner retention.</p>
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                <User className="w-5 h-5 text-rose-600 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-rose-700 mb-1">B2C: Member</p>
                <p className="text-[9px] text-rose-600">Receives invitation → downloads app → builds habit → shares data → stays connected between sessions</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── B2B PRACTITIONER JOURNEY ───────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}

        <motion.section {...fadeUp(0.1)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">B2B Practitioner Journey</h2>
              <p className="text-sm text-gray-500">Personas: Marie (psychologist, 38) & Thomas (psychiatrist, 52)</p>
            </div>
          </div>
        </motion.section>

        {/* B2B Emotional Curve */}
        <motion.section {...fadeUp(0.12)}>
          <SectionTitle subtitle="Emotional arc from first contact to loyalty or churn">Practitioner Emotional Curve</SectionTitle>
          <EmotionCurve stages={B2B_STAGES} color="#3b82f6" />
        </motion.section>

        {/* B2B Stage Cards */}
        {B2B_STAGES.map((stage, i) => (
          <StageCard key={stage.id} stage={stage} index={i} baseDelay={0.18} />
        ))}

        {/* B2B Journey Insight */}
        <motion.section {...fadeUp(0.5)}>
          <div className="bg-blue-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold">B2B Critical Insight</h3>
            </div>
            <p className="text-[10px] text-blue-200 leading-relaxed mb-3">
              The practitioner journey has one make-or-break moment: <span className="text-white font-semibold">the first AI note generated in under 5 minutes</span>.
              If a practitioner sees their first session notes generated instantly, they experience the &quot;aha moment&quot; that shifts perception
              from &quot;another SaaS tool&quot; to &quot;this changes my practice.&quot; Every touchpoint before this moment should reduce friction.
              Every touchpoint after should deepen the habit loop.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">5 min</p>
                <p className="text-[9px] text-blue-300">Time to first AI note</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">7 days</p>
                <p className="text-[9px] text-blue-300">Activation window</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">3x</p>
                <p className="text-[9px] text-blue-300">Retention lift (activated)</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── B2C MEMBER JOURNEY ─────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════ */}

        <motion.section {...fadeUp(0.55)}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <User className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">B2C Member Journey</h2>
              <p className="text-sm text-gray-500">Personas: Lea (client, 29, anxiety) & Sophie (HR manager, 41, burnout)</p>
            </div>
          </div>
        </motion.section>

        {/* B2C Emotional Curve */}
        <motion.section {...fadeUp(0.57)}>
          <SectionTitle subtitle="Emotional arc from practitioner invitation to habitual engagement or disengagement">Member Emotional Curve</SectionTitle>
          <EmotionCurve stages={B2C_STAGES} color="#f43f5e" />
        </motion.section>

        {/* B2C Stage Cards */}
        {B2C_STAGES.map((stage, i) => (
          <StageCard key={stage.id} stage={stage} index={i} baseDelay={0.62} />
        ))}

        {/* B2C Journey Insight */}
        <motion.section {...fadeUp(0.9)}>
          <div className="bg-rose-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-rose-300" />
              <h3 className="text-sm font-bold">B2C Critical Insight</h3>
            </div>
            <p className="text-[10px] text-rose-200 leading-relaxed mb-3">
              The member journey is fundamentally different from typical consumer apps: <span className="text-white font-semibold">acquisition is practitioner-driven, not marketing-driven</span>.
              This means members arrive with high trust (therapist recommendation) but low intrinsic motivation (they didn&apos;t seek the app).
              The critical challenge is converting extrinsic motivation (&quot;my therapist asked me to&quot;) into intrinsic motivation
              (&quot;I do this because it helps me&quot;) within the first 14 days.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">48 hrs</p>
                <p className="text-[9px] text-rose-300">Invite → first check-in</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">14 days</p>
                <p className="text-[9px] text-rose-300">Habit formation window</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-white">3 check-ins</p>
                <p className="text-[9px] text-rose-300">Week 1 activation target</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Cross-Journey Synthesis ─────────────────────────── */}
        <motion.section {...fadeUp(0.95)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">Cross-Journey Key Takeaways</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">Flywheel Mechanics</p>
                <div className="space-y-2">
                  {[
                    'Practitioner activation (AI note) triggers member invitation',
                    'Member engagement data reinforces practitioner value perception',
                    'Practitioner referrals create new B2B acquisition at near-zero CAC',
                    'Member "refer your therapist" closes the B2C → B2B loop',
                    'Network effects: each practitioner brings 5-15 members to the platform',
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">Churn Interdependencies</p>
                <div className="space-y-2">
                  {[
                    'Practitioner churn causes instant loss of all associated members',
                    'Low member engagement reduces practitioner perceived value → churn risk',
                    'Practitioner burnout (admin overload) is the root cause of most B2B churn',
                    'Member churn from therapy completion is natural — not a failure signal',
                    'Silent B2C disengagement is the hardest churn to detect and prevent',
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
              <p className="text-xs font-semibold text-white mb-2">The Single Most Important Metric</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                <span className="text-white font-semibold">Members per practitioner with weekly engagement.</span>{' '}
                This is the flywheel metric — it captures practitioner activation (are they inviting members?),
                member value (are members engaging?), and retention health (active engagement predicts both B2B and B2C retention).
                Target: 5+ members per practitioner with 3+ check-ins/week by Month 6. Every product, marketing,
                and support decision should be evaluated against its impact on this number.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────── */}
        <motion.div {...fadeUp(1.0)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            Customer Journey Map — Feb 2026 — Bloomsline Care
          </p>
        </motion.div>
      </main>
    </div>
  )
}

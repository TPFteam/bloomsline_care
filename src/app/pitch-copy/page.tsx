'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowUpRight,
  Globe,
  Mail,
  Calendar,
  Clock,
  Heart,
  MessageSquare,
  Zap,
  Hammer,
  Lightbulb,
  Check,
  Download,
  Shield,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

// LinkedIn brand glyph: solid rounded square with the "in" knocked out (transparent),
// so on a light background it reads as the official blue box. Color via `fill`.
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  )
}
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.notion.so/meet/bloomsline/hibloomsline'

// ─────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────

const translations = {
  en: {
    slides: {
      hero: 'Open',
      heroSplit: 'Open v2',
      problem: 'The Problem',
      history: 'How We Got Here',
      visionValues: 'Vision & Values',
      build: 'What We Built',
      story: 'A Day In The Practice',
      storyboard: 'How It Works',
      nowTime: 'Now Is The Time',
      iceberg: 'Security & The Ask',
      silence: 'The Silence',
      whyItMatters: 'Why It Matters',
      origin: 'Origin',
      product: 'Product',
      boundary: 'Boundary',
      whyNow: 'Why Now',
      security: 'Security',
      real: "What's Real",
      gtm: 'Go-to-Market',
      market: 'Market',
      landscape: 'Landscape',
      model: 'Model',
      team: 'Team',
      vision: 'Vision',
      ask: 'The Ask',
      close: 'Close',
    },
    landscape: {
      label: 'THE LANDSCAPE',
      headline1: 'Yesterday, it took a dozen tools.',
      headline2: 'Today, one.',
      todayLabel: 'A practice today',
      groups: [
        { label: 'Booking', tools: ['psychologue.net', 'Google Calendar'] },
        { label: 'In session', tools: ['Medcopilot', 'Paper notes'] },
        { label: 'Admin & billing', tools: ['SimplePractice', 'Spreadsheets'] },
        { label: 'Between sessions', tools: ['Daylio', 'WhatsApp'] },
      ],
      usLine1: 'One platform for the whole practice',
      usLine2: 'Plus the space between sessions, only here',
      takeaway: 'Not one more tool in the stack. The one that replaces it, and adds what no one else has.',
      clinicLabel: 'The one hour, in the clinic',
      betweenLabel: 'The 167 hours between',
      stage1: 'Find', owner1: 'psychologue.net · BetterHelp',
      stage2: 'Book', owner2: 'Doctolib',
      stage3: 'The session', owner3: 'Medcopilot',
      stage4: 'Bill & admin', owner4: 'SimplePractice, Liberlo',
      betweenTag: 'The continuity layer',
      betweenBody: 'Mood, exercises, check-ins, and progress, captured as they happen and synced back to the practitioner.',
      soloTool: 'Daylio',
      soloNote: 'the patient tracking alone. No therapist in the loop.',
      whyA: 'Everyone else built for the hour in the room.',
      whyB: 'We built for the 167 hours outside it, and loop them back to the practitioner.',
      quote: '"Nothing is intuitive, and it\'s expensive."',
      quoteAttr: 'a therapist on today\'s tools',
    },
    hero: {
      tag: 'Bloomsline',
      eyebrow: 'For mental-health practitioners',
      title1: 'Let therapists',
      title2: 'be present.',
      changeTooltip: 'Mood shifts. Pattern breaks. Small wins. Hard days.',
      subtitle: 'Bloomsline runs the whole practice, so their time goes back to care.',
      smallLine: 'Not another way to find a therapist.',
      stage: 'The continuity layer for clinical practice.',
      cta: 'See what\'s missing',
    },
    heroSplit: {
      eyebrow: 'For mental-health practitioners',
      title1: 'The part of therapy no one sees',
      title2: 'is the part that decides it.',
      subtitle: 'Bloomsline: care that continues between sessions.',
      leftLabel: 'The one hour',
      rightLabel: 'The rest of the week',
      cta: 'See what\'s missing',
    },
    problem: {
      label: 'THE PROBLEM',
      headline1: 'A therapist has to remember everything.',
      headline2: 'No one can.',
      body: 'Everything a patient shares lives in the therapist\'s memory, and in notes spread across paper, apps, and email. Memory fades. Notes get lost. So the next session starts from half the story.',
      triad: ['Not organized', 'Not measured', 'Not usable'],
      stakes: 'So care quietly falls apart.',
      stats: [
        { value: '~1 in 6', label: 'drop out of therapy', url: 'https://www.tandfonline.com/doi/full/10.1080/16506073.2025.2542364' },
        { value: '~36%', label: 'relapse after recovery', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11915238/' },
        { value: '€27.8bn', label: 'France\'s largest health-insurance expense, ahead of cancer', url: 'https://www.santementale.fr/2025/07/depenses-de-sante/' },
      ],
    },
    history: {
      label: 'HOW WE GOT HERE',
      headline1: 'Two years.',
      headline2: '100+ therapists.',
      headline3: 'Every answer earned.',
      timeline: [
        { year: '2024', label: 'Doctalink', body: 'Find a therapist by values, not just degrees. Practitioners liked it, but matching was only part of the problem.', accent: false },
        { year: '2025', label: 'Discovery', body: 'Conversations with practitioners revealed the deeper problem: the unsupported space between sessions.', accent: false },
        { year: '2026', label: 'Bloomsline, live', body: 'We built Bloomsline to fill that gap and create a continuity layer for clinical practice.', accent: true },
      ],
      nowLabel: 'WHERE WE ARE NOW',
      steps: [
        { tag: 'Now', n: '4', label: 'anchor practitioners' },
        { tag: 'Next', n: '20', label: 'paying customers' },
        { tag: 'Then', n: '100', label: 'and scaling' },
      ],
    },
    visionValues: {
      visionLabel: 'WHERE THIS GOES',
      visionH1: 'Make therapy measurable.',
      visionH2: 'Then become how mental health is measured.',
      visionSub: 'From software a therapist pays for today, to the trusted layer the whole field is built on.',
      path: [
        { tag: 'Today', body: 'The software therapists run their practice on, €49/month. Every session, mood, and check-in captured as structured data from day one.' },
        { tag: 'Next', body: 'Outcome measurement on data no one else has: what happens between sessions. "Anxiety down 40% in three months," shown to the therapist and the patient.' },
        { tag: 'Eventually', body: 'The evidence layer for mental health, what insurers and health systems measure outcomes against.' },
      ],
      valuesLabel: 'WHAT WE BELIEVE',
      values: [
        { name: 'Care before scale', desc: 'Patients and practitioners first, always.' },
        { name: 'Proof over opinion', desc: 'We measure what works, and show it.' },
        { name: 'Privacy is the product', desc: 'Health data, held to the highest bar.' },
        { name: 'Human, not clinical', desc: 'Technology that feels like care.' },
      ],
    },
    build: {
      label: 'WHAT WE BUILT',
      headline: 'The loop no one else has.',
      loopLabel: 'Between sessions, on Bloomsline',
      loopSteps: [
        { title: 'The patient reflects', body: 'Moments, mood, and the exercises their therapist shared.', tag: 'Free, invited by their therapist', named: false },
        { title: 'Bloom Pulse', body: 'The patient\'s week, at a glance.', tag: '', named: true },
        { title: 'The Session Brief', body: 'Before every session, the therapist is already caught up: what the patient logged, what changed, where last session left off.', tag: '', named: true },
      ],
      payoff: 'The therapist walks in present. The session starts at full depth, not from half the story.',
      practiceStrip: 'Plus everything to run the practice: booking, patient CRM, notes, payments, documents. Built in, so nothing else is needed.',
    },
    storyboard: {
      label: 'HOW IT WORKS',
      headline1: 'One continuous loop,',
      headline2: 'session after session.',
      steps: [
        { tag: 'Before', icon: 'sparkles', title: 'Session brief', body: 'A recap of the patient, so you walk in prepared.' },
        { tag: 'In session', icon: 'heart', title: 'Notes in one place', body: 'Stay present. Everything is captured.' },
        { tag: 'Between', icon: 'message', title: 'Resources & check-ins', body: 'Therapist shares, patient responds.' },
        { tag: 'Over time', icon: 'zap', title: 'Bloom Pulse', body: 'Progress becomes visible.' },
      ],
      loop: 'And it loops, every session builds on the last.',
    },
    story: {
      label: 'A DAY IN THE PRACTICE',
      name: 'Camille',
      caption: 'Psychologist, Lyon',
      intro: 'Camille sees 20 patients a week.',
      beats: [
        { tag: 'Before', text: 'By Thursday, Monday is a blur: notes scattered, context lost, no view of the week between.' },
        { tag: 'With Bloomsline', text: 'A brief before each session, and her patients\' reflections waiting between them.' },
        { tag: 'The result', text: 'She walks in ready: more engagement, visible progress, and time saved every session.' },
      ],
      punch: 'Care that continues, not restarts.',
    },
    nowTime: {
      label: 'NOW IS THE TIME',
      headline1: 'A revolution in how',
      headline2: 'care is seen.',
      sub: 'For the first time, the market, adoption, and the law all point the same way.',
      signals: [
        {
          title: 'Market',
          body: 'Consumer apps are mature. The clinical layer between patient and therapist is still unbuilt.',
          sources: [
            { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
            { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
          ],
        },
        {
          title: 'Adoption',
          body: '49% of people with mental-health needs already use AI. Acceptance is settled.',
          sources: [
            { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
          ],
        },
        {
          title: 'Regulation',
          body: 'The EU AI Act mandates clinical-AI compliance by Aug 2026. Compliant from day one is a 12–24 month lead.',
          sources: [
            { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
            { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
          ],
        },
      ],
      closing: 'A real need for AI-native clinical SaaS in the EU. The window is open.',
      ctaBook: 'Let\'s talk',
      ctaEmail: 'Email us',
    },
    iceberg: {
      label: 'THE ASK',
      headline1: '€800k pre-seed.',
      headline2: '18 months to prove the loop pays.',
      tipLabel: 'What they see',
      tipBody: 'The product, the part above the surface.',
      waterline: 'THE SURFACE',
      layers: [
        { name: 'Protected', body: 'Patient data encrypted, access tightly controlled.' },
        { name: 'Compliant', body: 'GDPR from day one. HDS certification next, the gate to French healthcare.' },
        { name: 'Responsible AI', body: 'AI assists, never diagnoses or decides. Out of medical-device regulation.' },
      ],
      askLabel: 'WHAT IT BUYS',
      buys: [
        'Prove the paying motion: 20 → 150+ paying practitioners at €49.',
        'Deepen the loop and ship outcome measurement v1, the start of the data asset.',
        'Clear the gates: HDS certification, AI Act readiness, EU health-data security.',
      ],
      fundsLabel: 'How we use it',
      funds: [
        { label: 'Team', value: 40, hot: false },
        { label: 'Product & Growth', value: 30, hot: true },
        { label: 'Security, Compliance & Legal', value: 20, hot: false },
        { label: 'Reserve', value: 10, hot: false },
      ],
      closing: 'Security isn\'t a slide. It\'s the precondition.',
    },
    silence: {
      label: 'THE PROBLEM',
      headline: 'The continuity gap is where therapy fails.',
      headline2: 'Quietly, and at scale.',
      patientLabel: 'For patients',
      patientItems: [
        'They drop out and stay in pain',
        'No control over their own recovery',
        'They relapse once support stops',
      ],
      practitionerLabel: 'For practitioners',
      practitionerItems: [
        'Deciding on partial, outdated information',
        'Time lost to admin, not care',
        'Hard to see when a patient is collapsing',
      ],
      quote: '"My client shared something painful on Tuesday. By our next session, I\'d lost the thread. I spent 15 minutes catching up instead of doing the work."',
      quoteAttribution: 'Practitioner, Paris',
      stats: [
        {
          value: '~1 in 6',
          label: 'drop out of therapy',
          source: 'CBT trials meta-analysis, 2025',
          url: 'https://www.tandfonline.com/doi/full/10.1080/16506073.2025.2542364',
        },
        {
          value: '~36%',
          label: 'relapse after recovery',
          source: 'Abu-Ashour et al., 2025',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11915238/',
        },
        {
          value: '9%',
          label: 'get minimally adequate treatment for depression',
          source: 'Lancet Psychiatry, 204 countries, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11579305/',
        },
        {
          value: '€27.8bn',
          label: 'France\'s largest health-insurance expense, ahead of cancer',
          source: 'Assurance Maladie, 2023',
          url: 'https://www.santementale.fr/2025/07/depenses-de-sante/',
        },
      ],
    },
    whyItMatters: {
      label: 'WHY IT MATTERS',
      headline1: 'Every dropout is a patient still in pain,',
      headline2: 'and lost income for the practice.',
      item1Label: 'TIME',
      item1Body: 'A quarter of every session lost to rebuilding context.',
      item2Label: 'RISK',
      item2Body: 'Patterns and relapses caught too late, or not at all.',
      incomeLabel: 'LOST INCOME',
      incomeValue: '€700–1,500',
      incomeBody: 'when a client drops out three months early. Per client. Per year.',
      quote: '"I\'m coming to therapy, but nothing\'s changing."',
      quoteCaption: 'The sentence every therapist dreads.',
    },
    origin: {
      label: 'HOW WE GOT HERE',
      headline: 'We didn\'t start here.',
      para1: 'In 2024 we built Doctalink — find a therapist by values, not just degrees. Practitioners loved it. But it never became a business.',
      para2: 'So we asked why. 100+ conversations with therapists and patients — and the same thing kept surfacing: it was never about finding a therapist.',
      para3: 'It was everything that happens between sessions — the silence where progress quietly slips away.',
      para4: 'That became Bloomsline.',
      quote: 'We\'re not guessing. It\'s what a failed product and 100+ conversations taught us.',
      timeline: [
        { period: '2024', label: 'Doctalink', body: 'Find a therapist by values, not just degrees. Practitioners liked it, but matching was only part of the problem.' },
        { period: '2025', label: 'Discovery', body: '100+ conversations revealed the deeper problem: the unsupported space between sessions.' },
        { period: '2026', label: 'Bloomsline — live', body: 'So we built Bloomsline to fill the gap between sessions and create a continuity layer for clinical practice.', accent: true },
      ],
    },
    product: {
      label: 'WHAT WE BUILT',
      hero1: 'A new layer of care.',
      hero2: '',
      supportingText: 'Bloomsline is the all-in-one platform for therapists to run their practice and support their patients\' progress between sessions.',
      cards: [
        {
          icon: 'clock',
          title: 'Before a session',
          oldWay: 'Notes pile up, context gets lost.',
          newWay: 'Everything you need, already there. No digging.',
        },
        {
          icon: 'heart',
          title: 'During a session',
          oldWay: 'Admin steals time from what matters.',
          newWay: 'Stay present. Notes flow. Nothing gets lost.',
        },
        {
          icon: 'message',
          title: 'Between sessions',
          oldWay: 'The connection fades.',
          newWay: 'Patients reflect. Practitioners see what changed.',
        },
        {
          icon: 'zap',
          title: 'Over time',
          oldWay: 'Progress lives in your head, not on screen.',
          newWay: 'See real progress, not just snapshots.',
        },
      ],
      closing: 'The person, the practitioner, and the space in between — one connected place.',
    },
    boundary: {
      label: 'THE BOUNDARY',
      hero1: 'Therapy works because of its principles.',
      hero2: 'We protect them.',
      intro: 'Therapy runs on a few hard principles — and here\'s how we keep every one of them safe.',
      defHint: 'Tap any principle to see what it means.',
      frameLabel: 'The therapeutic frame',
      frameNote: 'We build inside the frame — never over it.',
      principles: [
        { name: 'The frame', respect: 'We support therapists around their sessions without interfering with the frame, which remains under their control.', definition: 'The stable boundaries that make therapy safe — consistent time, place, role, and confidentiality. The "container" the work happens in (Winnicott\'s holding environment). Disrupt it and you harm the therapy.' },
        { name: 'The alliance', respect: 'We strengthen the therapeutic bond without ever imposing ourselves. The therapeutic relationship remains between the patient and their therapist.', definition: 'The trusting relationship between patient and therapist — the single biggest predictor of whether therapy works, more than the method used.' },
        { name: 'Non-intrusion', respect: 'Nothing is imposed. Available resources are there to help when needed, but patients remain free to use them and move at their own pace.', definition: 'The patient is the agent of their own change. They choose, they consent, and they move at their own pace. Coercion undermines the work.' },
        { name: 'Non-dependence', respect: 'The entire system is designed to support patients, never to make them dependent on it. The goal is always the same: to foster greater autonomy.', definition: '"First, do no harm" (non-maleficence). The duty to avoid creating harm — dependency, pressure, false reassurance. Engagement-maximizing design is anti-therapeutic.' },
        { name: 'Scope of practice', respect: 'Bloomsline supports patient reflection without providing diagnoses, clinical advice, or crisis management. These responsibilities belong to the therapist.', definition: 'Clinicians act only within their trained competence. Diagnosing, treating, and handling crises is the clinician\'s role — a tool must stay in its lane.' },
        { name: 'Confidentiality', respect: 'What is shared remains protected and under the control of the patient and their therapist. (Encrypted data, secure EU hosting, and GDPR compliance.)', definition: 'What a patient shares is protected. Foundational to trust in therapy — and, for digital tools, a legal duty (GDPR / health-data rules).' },
      ],
      closing: 'These aren\'t our rules. They\'re therapy\'s — applied to software.',
    },
    whyNow: {
      label: 'WHY NOW',
      headline: 'Three things just became true.',
      item1Title: 'Market',
      item1Body: 'A multi-billion, double-digit-growth market — and the consumer-app space is already mature (BetterHelp, Woebot). The clinical layer underneath, between patient and therapist, is still unbuilt. That\'s the opening.',
      item1Sources: [
        { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
        { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      ],
      item2Title: 'Adoption',
      item2Body: '49% of people with mental-health needs already use AI tools. Acceptance is settled — the opening is AI that supports the clinician, not one that replaces them.',
      item2Sources: [
        { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
      item3Title: 'Regulation',
      item3Body: 'The EU AI Act mandates clinical-AI compliance by August 2026. Compliant from day one is a 12–24 month lead over US-first competitors.',
      item3Sources: [
        { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
        { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
      ],
      closing: 'Zero AI-native clinical SaaS in EU. The wedge is open.',
    },
    security: {
      label: 'DATA SECURITY',
      headline: 'Three things decide a health company.',
      headline2: 'We\'re building each into a strength.',
      intro: '',
      pillars: [
        { name: 'Protected', claim: 'Patient data is encrypted and access is tightly controlled.', edge: 'In health, trust is everything. We protect it accordingly.' },
        { name: 'Compliant', claim: 'Built for GDPR from day one.', edge: 'HDS certification, the gate to French healthcare, is our next step. Hard to earn, which is why it protects us.' },
        { name: 'Responsible AI', claim: 'Our AI assists therapists. It never diagnoses or decides.', edge: 'That keeps us out of medical-device regulation, and free to move fast.' },
      ],
      closing: 'Security isn\'t a slide. It\'s the precondition.',
    },
    model: {
      label: 'THE MODEL',
      headline: '€49 a month.',
      headline2: 'Less than one session.',
      whyPayLabel: 'Why they pay',
      howGrowsLabel: 'How it grows',
      earnedLabel: '~€3,600 / month, solo psychologist',
      priceChip: '€49',
      priceNote: 'Less than 1.5% of their income',
      annualValue: '€588',
      annualMath: '€49 × 12',
      annualLabel: 'a full year of Bloomsline',
      retentionLine: 'One client retained one extra month pays for the entire year.',
      growItems: [
        { label: 'Distribution', body: 'Practitioners pay. Patients join free, invited by their therapist, at zero patient CAC.' },
        { label: 'Referral', body: 'Practitioners refer practitioners. We measure this, we don\'t assume it.' },
        { label: 'Expansion', body: 'Clinics and group practices. Outcome reports.' },
      ],
      cacNote: '€0 CAC, it compounds',
      loop: ['Pays €49 / mo', 'Brings patients, free', 'Refers peers'],
      flow1Label: '1 practitioner',
      flow1Value: '€49 / month',
      flow2Label: 'invites',
      flow2Value: 'their own patients',
      flow3Label: 'and refers',
      flow3Value: 'peers in their network',
      revenueTitle: 'Revenue',
      revenueItems: [
        '€49 / practitioner',
        'Patients free, at zero CAC',
        'High-margin SaaS',
        'Expansion: clinics, outcome reports',
      ],
      compoundTitle: 'Why it compounds',
      compoundItems: [
        'Practitioners bring their own patients from day one',
        'Engagement is driven by the practitioner relationship',
        'Growth happens through practitioner networks',
      ],
      footnote: 'A psychologist earns about €3,600 a month. Keeping one client a single month longer pays for a full year of Bloomsline, so we price to protect the income that dropout takes away.',
      footnoteSource: 'Avg revenue ~€51,671/yr · UNASA 2024',
      footnoteUrl: 'https://propulsebyca.fr/idees-business/psychologue',
    },
    real: {
      label: "WHAT'S REAL",
      headline: "We're pre-revenue. The product isn't.",
      builtLabel: 'BUILT',
      builtItems: [
        'Practitioner platform live',
        'Patient app in use',
        'Real users interacting with the product',
        'End-to-end system built in-house',
      ],
      learnedLabel: 'LEARNED',
      learnedItems: [
        '100+ interviews before a line of code',
        'The gap is between sessions — named in every conversation',
        'In real use, it fits how practitioners already work',
        'Continuity drives engagement — not features',
      ],
      honestLabel: 'HONEST',
      honestItems: [
        'Pre-PMF. But early usage is consistent.',
        'Practitioners recognize the problem instantly',
        'Pricing shaped by real conversations',
        'Two founders, fast iteration loop',
      ],
      quote: 'This isn\'t a concept. It\'s a working platform you can use today.',
    },
    gtm: {
      label: 'GO-TO-MARKET',
      headline: 'Listen. Support.',
      headline2: 'Trust. Grow.',
      intro: 'Therapists trust other therapists, not ads. We talked to 100 before writing any code — and we\'ll win the next 1,000 the same way.',
      columns: [
        {
          tag: 'Past',
          title: 'Clinical understanding came first.',
          num: '01',
          action: 'Talked to therapists and patients to deeply understand their needs.',
          goal: '100+ conversations · 0 ads',
        },
        {
          tag: 'Now',
          title: 'We win them one by one.',
          num: '02',
          action: 'Personal outreach and hands-on onboarding, one practitioner at a time.',
          goal: 'First 10 active users',
        },
        {
          tag: 'Next',
          title: 'Growth that builds itself.',
          num: '03',
          action: 'Therapists invite therapists; we partner with psychology schools.',
          goal: '150 therapists by early 2027',
        },
        {
          tag: 'Later',
          title: 'Go bigger.',
          num: '04',
          action: 'Clinics and group practices, expanding across Europe.',
          goal: '1,500+ therapists · €1M+ revenue',
        },
      ],
      dontLabel: 'What we don\'t do',
      dontItems: ['Paid ads', 'Cold outbound', 'B2C patient acquisition', 'Vanity metrics'],
      closing: 'We earn trust through clinical understanding, reinforce it with personalized support, and let growth spread naturally.',
    },
    market: {
      label: 'THE MARKET',
      headline: 'Start in France.',
      headline2: 'The path is bigger.',
      demand: '1 in 6 French adults face depression each year.',
      regions: [
        { name: 'France', value: '28K', sub: 'independent psychologists, our market', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { name: 'Europe', value: '450M', sub: '17× bigger. Same product, same rules.', source: '', url: '' },
        { name: 'World', value: '1B+', sub: 'live with mental illness', source: 'WHO 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
      ],
      regionTarget: '3.5% of French psychologists ≈ €588K ARR (1,000 × €49 × 12)',
      goalLabel: 'Our 2-year goal',
      potentialLabel: 'The potential',
      franceTitle: 'In France today',
      funnel: [
        { value: '69M', label: 'people live in France', source: 'INSEE 2026', url: 'https://www.insee.fr/fr/statistiques/8719824' },
        { value: '~8M', label: 'adults have depression each year (about 1 in 6)', source: 'Santé publique France 2024', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/rapportsynthese/episodes-depressifs-prevalence-et-recours-aux-soins-barometre-de-sante-publique-france-resultats-de' },
        { value: '77K', label: 'licensed psychologists, all officially registered', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '28K', label: 'work for themselves, these are who we sell to', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '1,000', label: '1,000 practitioners (3.5%), about €588K ARR', source: 'our target · 3.5% of French psychologists', url: '' },
      ],
      europeLabel: 'Europe',
      europeValue: '17× bigger',
      europeBody: '450M people. The rules we already follow in France work across Europe too.',
      worldLabel: 'World',
      worldValue: '1B+',
      worldBody: 'people live with mental health problems. Someday, not today.',
      worldSource: 'WHO 2025',
      worldUrl: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
      punch: 'France is the beachhead. Europe is the path to €100M.',
    },
    team: {
      label: 'THE TEAM',
      headline: 'Two people. Built in-house. Capital efficient.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Sales & Operations',
      sarahYears: '10+ years in sales, recruitment & psychology · Digital Marketing & AI',
      sarahBio: 'The person practitioners trust. She listens before she sells, and that\'s why they stay.',
      sarahEducation: 'Devinci Education MBA · Le Wagon',
      sarahWorkedWith: ['Explain AI', 'Arrow ECS', 'KLB Group'],
      adityaName: 'Aditya Channe',
      adityaRole: 'Product & Technology',
      adityaYears: '8+ years at SaaS startups and scale-ups · Digital transformation',
      adityaBio: 'Built every screen you see. Leads the product, and makes sure it stays close to the problem.',
      adityaEducation: 'Montpellier Business School',
      adityaWorkedWith: ['Bloq.it', 'Greenny', 'Didomi', 'Amazon Alexa', 'Revfin'],
      workedWithLabel: 'Worked with',
      educationLabel: 'Education',
      whyUsLabel: 'Why us',
      whyUs: [
        { t: 'We didn\'t study it, we lived it', d: '3+ years in the field with practitioners and patients. One thing stood out: it all happens between sessions.' },
        { t: 'We\'ve built together before', d: 'So we already know how we work when it gets hard. For us, that part isn\'t a question.' },
        { t: 'Between us, it\'s covered', d: 'One of us builds, one of us sells. And what you\'re seeing is already real, in practitioners\' and their patients\' hands.' },
      ],
      footnote: '* Actively looking for clinical advisor(s) to join the team.',
    },
    vision: {
      label: 'THE LONG GAME',
      headline: 'Software today.',
      headline2: 'Infrastructure tomorrow.',
      viewMore: 'View more',
      showLess: 'Show less',
      whatWeDoLabel: 'What we do',
      whyItMattersLabel: 'Why it matters',
      todayTag: 'Today',
      todayTitle: 'Software therapists pay for.',
      todaySub: 'A real business today — recurring revenue, inside the practice.',
      todayBody: 'This is real today. Therapists walk into every session prepared instead of playing catch-up — and patients feel held between sessions, not alone.',
      todayWhatWeDo: 'For €49/month, a therapist gets a tool that makes every session sharper, and their patients stay connected to the work between sessions. Both sides feel it.',
      todayWhyItMatters: 'Practitioners pay and keep paying. Patients come back. When both sides choose to stay, you know it works — in practice, not in theory.',
      nextTag: 'Next',
      nextTitle: 'We make therapy measurable.',
      nextSub: 'The data no one else has — proof of what actually works between sessions.',
      nextBody: 'For the first time, progress becomes visible. Every session — and every moment between — adds up to a real picture: "anxiety down 40% in three months." The patient sees they\'re getting better; the therapist sees their work land. No one has ever had this.',
      nextWhatWeDo: 'Therapists get real outcome reports; patients watch their own progress over time. And we hold the one thing no one else does — a continuous record of what happens between sessions.',
      nextWhyItMatters: 'Proof changes everything. It\'s why a practitioner upgrades, why a clinic signs on — why this stops being a nice tool and becomes essential.',
      laterTag: 'Eventually',
      laterTitle: 'The infrastructure for mental health.',
      laterSub: 'The trusted layer the whole field is built on — practitioners, clinics, researchers and health systems.',
      laterBody: 'Mental health has never had a shared way to measure what works. We become it — from one therapist\'s room to clinics, researchers, and health systems across Europe, and even consumer apps that plug into the same model, all building on the same foundation.',
      laterWhatWeDo: 'From measuring outcomes to seeing them coming — patterns that flag the hard days before they arrive, so a practitioner can reach out first. And we open the layer: clinics, researchers and consumer apps plug into the same standard. We become how care is measured.',
      laterWhyItMatters: 'When a whole field measures the same way, it builds on the same layer — ours. That\'s not a bigger product. That\'s infrastructure.',
      footnote: 'Vision earns the right to exist through execution. Right now, we\'re heads-down on Today.',
    },
    ask: {
      label: 'THE ASK',
      headline: 'Raising €800k pre-seed.',
      subhead: '18 months to turn EU compliance into a moat.',
      fundsLabel: 'Use of funds',
      fundsHint: 'Tap a line for why',
      fundsItems: [
        { label: 'Team', value: '36%', why: 'Grow from the two of us to the team we need to ship faster and sign our first paying therapists.' },
        { label: 'Security, Compliance & Legal', value: '33%', why: 'Nearly as much, because handling health data in the EU is the hard, expensive part, and it is what lets us sell at all.' },
        { label: 'Product & Growth', value: '21%', why: 'Keep improving the app and get it in front of more therapists.' },
        { label: 'Reserve', value: '10%', why: 'Cover unexpected costs and delays.' },
      ],
      closing: 'Enough to reach product-market fit, build the compliance moat, and keep patient data safe.',
    },
    close: {
      line1: 'Therapy happens in sessions.',
      line2: 'Life happens every day.',
      line3: 'And today, nothing connects the two.',
      line4: "That's the layer we're building.",
      cta: "Let's talk.",
      bookCall: 'Book a 30-min call',
      emailUs: 'hi@bloomsline.com',
      copyright: '© 2026 Bloomsline',
    },
  },
  fr: {
    slides: {
      hero: 'Ouverture',
      heroSplit: 'Ouverture v2',
      problem: 'Le Problème',
      history: 'Notre Parcours',
      visionValues: 'Vision & Valeurs',
      build: 'Ce Que Nous Avons Construit',
      story: 'Une Journée Au Cabinet',
      storyboard: 'Comment Ça Marche',
      nowTime: 'C\'est Le Moment',
      iceberg: 'Sécurité & Demande',
      silence: 'Le Silence',
      whyItMatters: 'Pourquoi Ça Compte',
      origin: 'Origine',
      product: 'Produit',
      boundary: 'Limite',
      whyNow: 'Pourquoi Maintenant',
      security: 'Sécurité',
      real: 'Ce Qui Est Réel',
      gtm: 'Go-to-Market',
      market: 'Marché',
      landscape: 'Paysage',
      model: 'Modèle',
      team: 'Équipe',
      vision: 'Vision',
      ask: 'La Demande',
      close: 'Conclusion',
    },
    landscape: {
      label: 'LE PAYSAGE',
      headline1: 'Hier, il fallait une dizaine d\'outils.',
      headline2: 'Aujourd\'hui, un seul.',
      todayLabel: 'Un cabinet aujourd\'hui',
      groups: [
        { label: 'Réservation', tools: ['psychologue.net', 'Google Agenda'] },
        { label: 'En séance', tools: ['Medcopilot', 'Notes papier'] },
        { label: 'Admin & facturation', tools: ['SimplePractice', 'Tableurs'] },
        { label: 'Entre les séances', tools: ['Daylio', 'WhatsApp'] },
      ],
      usLine1: 'Une plateforme pour tout le cabinet',
      usLine2: 'Plus l\'espace entre les séances, seulement ici',
      takeaway: 'Pas un outil de plus. Celui qui remplace la pile, et ajoute ce que personne n\'a.',
      clinicLabel: 'L\'heure de séance, au cabinet',
      betweenLabel: 'Les 167 heures entre les séances',
      stage1: 'Trouver', owner1: 'psychologue.net · BetterHelp',
      stage2: 'Réserver', owner2: 'Doctolib',
      stage3: 'La séance', owner3: 'Medcopilot',
      stage4: 'Facturation', owner4: 'SimplePractice, Liberlo',
      betweenTag: 'La couche de continuité',
      betweenBody: 'Humeur, exercices, points de suivi et progrès, captés en temps réel et synchronisés avec le praticien.',
      soloTool: 'Daylio',
      soloNote: 'le patient qui note seul. Aucun thérapeute dans la boucle.',
      whyA: 'Les autres ont conçu pour l\'heure en cabinet.',
      whyB: 'Nous avons conçu pour les 167 heures en dehors, et les relions au praticien.',
      quote: '« Rien d\'intuitif, et c\'est cher. »',
      quoteAttr: 'un thérapeute sur les outils actuels',
    },
    hero: {
      tag: 'Bloomsline',
      eyebrow: 'Pour les professionnels de santé mentale',
      title1: 'Laissez les thérapeutes',
      title2: 'être présents.',
      changeTooltip: 'Humeurs. Ruptures de schémas. Petites victoires. Jours difficiles.',
      subtitle: 'Bloomsline gère tout le cabinet, pour que leur temps revienne au soin.',
      smallLine: 'Pas une plateforme pour trouver un thérapeute.',
      stage: 'La couche de continuité pour la pratique clinique.',
      cta: 'Voyez ce qui manque',
    },
    heroSplit: {
      eyebrow: 'Pour les professionnels de santé mentale',
      title1: 'La partie de la thérapie que personne ne voit',
      title2: 'est celle qui décide de tout.',
      subtitle: 'Bloomsline : le soin qui continue entre les séances.',
      leftLabel: 'L\'heure de séance',
      rightLabel: 'Le reste de la semaine',
      cta: 'Voyez ce qui manque',
    },
    problem: {
      label: 'LE PROBLÈME',
      headline1: 'Un thérapeute doit tout retenir.',
      headline2: 'Personne n\'y arrive.',
      body: 'Tout ce qu\'un patient confie vit dans la mémoire du thérapeute, et dans des notes éparpillées sur papier, applis et e-mails. La mémoire s\'efface. Les notes se perdent. La séance suivante repart avec la moitié de l\'histoire.',
      triad: ['Non organisé', 'Non mesuré', 'Inutilisable'],
      stakes: 'Et le soin s\'effondre en silence.',
      stats: [
        { value: '~1 sur 6', label: 'abandonne la thérapie', url: 'https://www.tandfonline.com/doi/full/10.1080/16506073.2025.2542364' },
        { value: '~36%', label: 'rechutent après rétablissement', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11915238/' },
        { value: '27,8 Md€', label: 'premier poste de dépenses de l\'Assurance Maladie, devant le cancer', url: 'https://www.santementale.fr/2025/07/depenses-de-sante/' },
      ],
    },
    history: {
      label: 'NOTRE PARCOURS',
      headline1: 'Deux ans.',
      headline2: '100+ thérapeutes.',
      headline3: 'Chaque réponse, gagnée sur le terrain.',
      timeline: [
        { year: '2024', label: 'Doctalink', body: 'Trouver un thérapeute par ses valeurs, pas seulement ses diplômes. Les praticiens appréciaient, mais la mise en relation n\'était qu\'une partie du problème.', accent: false },
        { year: '2025', label: 'Découverte', body: 'Les échanges avec les praticiens ont révélé le vrai problème : l\'espace sans accompagnement entre les séances.', accent: false },
        { year: '2026', label: 'Bloomsline, en ligne', body: 'Nous avons créé Bloomsline pour combler ce manque et bâtir une couche de continuité pour la pratique clinique.', accent: true },
      ],
      nowLabel: 'OÙ NOUS EN SOMMES',
      steps: [
        { tag: 'Maintenant', n: '4', label: 'praticiens fondateurs' },
        { tag: 'Ensuite', n: '20', label: 'clients payants' },
        { tag: 'Puis', n: '100', label: 'et à l\'échelle' },
      ],
    },
    visionValues: {
      visionLabel: 'OÙ CELA MÈNE',
      visionH1: 'Rendre la thérapie mesurable.',
      visionH2: 'Puis devenir la façon dont la santé mentale se mesure.',
      visionSub: 'D\'un logiciel que le thérapeute paie aujourd\'hui, à la couche de confiance sur laquelle tout le secteur se construit.',
      path: [
        { tag: 'Aujourd\'hui', body: 'Le logiciel sur lequel les thérapeutes gèrent leur cabinet, 49 €/mois. Chaque séance, humeur et point de suivi capturé en donnée structurée dès le premier jour.' },
        { tag: 'Ensuite', body: 'La mesure des résultats sur une donnée que personne d\'autre n\'a : ce qui se passe entre les séances. « Anxiété en baisse de 40% en trois mois », montré au thérapeute et au patient.' },
        { tag: 'À terme', body: 'La couche de preuve pour la santé mentale, la référence sur laquelle mutuelles et systèmes de santé mesurent les résultats.' },
      ],
      valuesLabel: 'NOS CONVICTIONS',
      values: [
        { name: 'Le soin avant l\'échelle', desc: 'Les patients et les praticiens d\'abord, toujours.' },
        { name: 'La preuve avant l\'opinion', desc: 'On mesure ce qui marche, et on le montre.' },
        { name: 'La vie privée, notre produit', desc: 'Des données de santé au plus haut niveau d\'exigence.' },
        { name: 'Humain, pas clinique', desc: 'Une technologie qui ressemble à du soin.' },
      ],
    },
    build: {
      label: 'CE QUE NOUS AVONS CONSTRUIT',
      headline: 'La boucle que personne d\'autre n\'a.',
      loopLabel: 'Entre les séances, sur Bloomsline',
      loopSteps: [
        { title: 'Le patient réfléchit', body: 'Moments, humeur, et les exercices partagés par son thérapeute.', tag: 'Gratuit, à l\'invitation de son thérapeute', named: false },
        { title: 'Bloom Pulse', body: 'La semaine du patient, en un coup d\'œil.', tag: '', named: true },
        { title: 'Le Brief de séance', body: 'Avant chaque séance, le thérapeute est déjà à jour : ce que le patient a noté, ce qui a changé, où la dernière séance s\'est arrêtée.', tag: '', named: true },
      ],
      payoff: 'Le thérapeute arrive présent. La séance démarre en pleine profondeur, pas à moitié de l\'histoire.',
      practiceStrip: 'Et tout pour gérer le cabinet : réservation, CRM patients, notes, paiements, documents. Intégré, pour que rien d\'autre ne soit nécessaire.',
    },
    storyboard: {
      label: 'COMMENT ÇA MARCHE',
      headline1: 'Une boucle continue,',
      headline2: 'séance après séance.',
      steps: [
        { tag: 'Avant', icon: 'sparkles', title: 'Brief de séance', body: 'Un récap du patient, pour arriver préparé.' },
        { tag: 'En séance', icon: 'heart', title: 'Les notes au même endroit', body: 'Restez présent. Tout est capté.' },
        { tag: 'Entre', icon: 'message', title: 'Ressources & suivi', body: 'Le thérapeute partage, le patient répond.' },
        { tag: 'Avec le temps', icon: 'zap', title: 'Bloom Pulse', body: 'Les progrès deviennent visibles.' },
      ],
      loop: 'Et ça boucle : chaque séance s\'appuie sur la précédente.',
    },
    story: {
      label: 'UNE JOURNÉE AU CABINET',
      name: 'Camille',
      caption: 'Psychologue, Lyon',
      intro: 'Camille reçoit 20 patients par semaine.',
      beats: [
        { tag: 'Avant', text: 'Le jeudi, lundi est déjà flou : notes éparpillées, contexte perdu, aucune vue sur la semaine entre les deux.' },
        { tag: 'Avec Bloomsline', text: 'Un brief avant chaque séance, et les réflexions de ses patients qui l\'attendent entre les deux.' },
        { tag: 'Le résultat', text: 'Elle arrive prête : plus d\'engagement, des progrès visibles, du temps gagné à chaque séance.' },
      ],
      punch: 'Un soin qui continue, au lieu de repartir de zéro.',
    },
    nowTime: {
      label: 'C\'EST LE MOMENT',
      headline1: 'Une révolution dans notre façon',
      headline2: 'de voir le soin.',
      sub: 'Pour la première fois, le marché, l\'adoption et la loi vont dans le même sens.',
      signals: [
        {
          title: 'Marché',
          body: 'Les apps grand public sont matures. La couche clinique entre patient et thérapeute reste à construire.',
          sources: [
            { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
            { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
          ],
        },
        {
          title: 'Adoption',
          body: '49% des personnes concernées par la santé mentale utilisent déjà l\'IA. L\'acceptation est acquise.',
          sources: [
            { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
          ],
        },
        {
          title: 'Réglementation',
          body: 'L\'AI Act européen impose la conformité de l\'IA clinique d\'ici août 2026. Conforme dès le premier jour : 12–24 mois d\'avance.',
          sources: [
            { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
            { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
          ],
        },
      ],
      closing: 'Un vrai besoin de SaaS clinique AI-native en Europe. La fenêtre est ouverte.',
      ctaBook: 'Parlons-en',
      ctaEmail: 'Écrivez-nous',
    },
    iceberg: {
      label: 'CE QUE NOUS DEMANDONS',
      headline1: '800 k€ en pre-seed.',
      headline2: '18 mois pour prouver que la boucle rapporte.',
      tipLabel: 'Ce qu\'ils voient',
      tipBody: 'Le produit, la partie au-dessus de la surface.',
      waterline: 'LA SURFACE',
      layers: [
        { name: 'Protégées', body: 'Données patients chiffrées, accès strictement contrôlé.' },
        { name: 'Conformes', body: 'RGPD dès le départ. Certification HDS ensuite, la porte de la santé en France.' },
        { name: 'IA responsable', body: 'L\'IA assiste, ne diagnostique ni ne décide jamais. Hors dispositifs médicaux.' },
      ],
      askLabel: 'CE QUE ÇA FINANCE',
      buys: [
        'Prouver la motion payante : 20 → 150+ praticiens payants à 49 €.',
        'Approfondir la boucle et livrer la mesure des résultats v1, le début de l\'actif de données.',
        'Franchir les portes : certification HDS, préparation à l\'AI Act, sécurité des données de santé UE.',
      ],
      fundsLabel: 'Utilisation des fonds',
      funds: [
        { label: 'Équipe', value: 40, hot: false },
        { label: 'Produit & Croissance', value: 30, hot: true },
        { label: 'Sécurité, Conformité & Juridique', value: 20, hot: false },
        { label: 'Réserve', value: 10, hot: false },
      ],
      closing: 'La sécurité n\'est pas un slide. C\'est la condition préalable.',
    },
    silence: {
      label: 'LE PROBLÈME',
      headline: 'La rupture de continuité, c\'est là que la thérapie échoue.',
      headline2: 'En silence, et à grande échelle.',
      patientLabel: 'Pour les patients',
      patientItems: [
        'Ils abandonnent et restent dans la souffrance',
        'Aucun contrôle sur leur propre rétablissement',
        'Rechutent dès que l\'accompagnement s\'arrête',
      ],
      practitionerLabel: 'Pour les praticiens',
      practitionerItems: [
        'Décider sur des informations partielles et dépassées',
        'Du temps perdu en administratif, pas en soin',
        'Difficile de voir quand un patient s\'effondre',
      ],
      quote: '"Mon patient m\'a partagé quelque chose de douloureux mardi. À notre prochaine séance, j\'avais perdu le fil. J\'ai passé 15 minutes à rattraper au lieu de faire le travail."',
      quoteAttribution: 'Praticienne, Paris',
      stats: [
        {
          value: '~1 sur 6',
          label: 'abandonnent la thérapie',
          source: 'méta-analyse essais TCC, 2025',
          url: 'https://www.tandfonline.com/doi/full/10.1080/16506073.2025.2542364',
        },
        {
          value: '~36%',
          label: 'rechutent après rétablissement',
          source: 'Abu-Ashour et al., 2025',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11915238/',
        },
        {
          value: '9%',
          label: 'reçoivent un traitement minimalement adéquat pour la dépression',
          source: 'Lancet Psychiatry, 204 pays, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11579305/',
        },
        {
          value: '27,8 Md€',
          label: '1er poste de dépenses de l\'Assurance Maladie, devant le cancer',
          source: 'Assurance Maladie, 2023',
          url: 'https://www.santementale.fr/2025/07/depenses-de-sante/',
        },
      ],
    },
    whyItMatters: {
      label: 'POURQUOI ÇA COMPTE',
      headline1: 'Chaque abandon est un patient encore en souffrance,',
      headline2: 'et un revenu perdu pour le cabinet.',
      item1Label: 'TEMPS',
      item1Body: 'Un quart de chaque séance perdu à reconstruire le contexte.',
      item2Label: 'RISQUE',
      item2Body: 'Patterns et rechutes repérés trop tard, ou jamais.',
      incomeLabel: 'REVENU PERDU',
      incomeValue: '700–1 500 €',
      incomeBody: 'quand un patient abandonne trois mois trop tôt. Par patient. Par an.',
      quote: '« Je viens en thérapie, mais rien ne change. »',
      quoteCaption: 'La phrase que redoute chaque thérapeute.',
    },
    origin: {
      label: 'COMMENT NOUS SOMMES ARRIVÉS ICI',
      headline: 'Nous avons d\'abord construit la mauvaise chose.',
      para1: 'En 2024, nous avons créé Doctalink — trouver un thérapeute par ses valeurs, pas seulement ses diplômes. Les praticiens ont adoré. Mais ça n\'a jamais été un business.',
      para2: 'Alors on a cherché pourquoi. 100+ conversations avec des thérapeutes et des patients — et la même chose revenait : ce n\'était jamais une question de trouver un thérapeute.',
      para3: 'C\'était tout ce qui se passe entre les séances — ce silence où les progrès s\'effacent peu à peu.',
      para4: 'C\'est devenu Bloomsline.',
      quote: 'On ne devine pas. C\'est ce qu\'un produit raté et 100+ conversations nous ont appris.',
      timeline: [
        { period: '2024', label: 'Doctalink', body: 'Trouver un thérapeute par ses valeurs, pas seulement ses diplômes. Les praticiens appréciaient, mais la mise en relation n\'était qu\'une partie du problème.' },
        { period: '2025', label: 'Découverte', body: '100+ conversations ont révélé le problème plus profond : l\'espace sans accompagnement entre les séances.' },
        { period: '2026', label: 'Bloomsline — en production', body: 'Alors on a construit Bloomsline pour combler le vide entre les séances et créer une couche de continuité pour la pratique clinique.', accent: true },
      ],
    },
    product: {
      label: 'CE QUE NOUS AVONS CONSTRUIT',
      hero1: 'Une nouvelle couche de soin.',
      hero2: '',
      supportingText: 'Tout au même endroit. Notes, séances, et ce qui se passe vraiment entre les deux.',
      cards: [
        {
          icon: 'clock',
          title: 'Avant une séance',
          oldWay: 'Les notes s\'accumulent, le contexte se perd.',
          newWay: 'Tout est là, prêt. Sans chercher.',
        },
        {
          icon: 'heart',
          title: 'Pendant une séance',
          oldWay: 'L\'admin vole du temps à l\'essentiel.',
          newWay: 'Restez présent. Les notes suivent. Rien ne se perd.',
        },
        {
          icon: 'message',
          title: 'Entre les séances',
          oldWay: 'La connexion s\'estompe.',
          newWay: 'Les patients réfléchissent. Les praticiens voient ce qui a changé.',
        },
        {
          icon: 'zap',
          title: 'Au fil du temps',
          oldWay: 'La progression reste dans votre tête, pas à l\'écran.',
          newWay: 'Voir la vraie progression, pas juste des instantanés.',
        },
      ],
      closing: 'La personne, le praticien, et l\'espace entre les deux — un seul lieu connecté.',
    },
    boundary: {
      label: 'LA LIMITE',
      hero1: 'Il y a une limite en thérapie.',
      hero2: 'Nous la respectons.',
      intro: 'La thérapie repose sur quelques principes essentiels — et voici comment nous protégeons chacun d\'eux.',
      defHint: 'Touchez un principe pour voir ce qu\'il signifie.',
      frameLabel: 'Le cadre thérapeutique',
      frameNote: 'On construit à l\'intérieur du cadre — jamais par-dessus.',
      principles: [
        { name: 'Le cadre', respect: 'On agit uniquement autour des séances sans intervenir dans le rythme de la thérapie, qui reste sous la responsabilité du thérapeute.', definition: 'Les limites stables qui rendent la thérapie sûre — mêmes heure, lieu, rôle, et confidentialité. Le « contenant » où se fait le travail (le holding de Winnicott). Le perturber nuit à la thérapie.' },
        { name: 'L\'alliance', respect: 'Nous renforçons le lien thérapeutique, sans jamais nous imposer. Le lien thérapeutique reste entre le patient et son thérapeute.', definition: 'La relation de confiance entre patient et thérapeute — le premier prédicteur de l\'efficacité de la thérapie, plus que la méthode employée.' },
        { name: 'La non-intrusion', respect: 'Rien n\'est imposé. Les ressources disponibles sont là pour aider si besoin, mais chacun reste libre de les utiliser et avance à son propre rythme.', definition: 'Le patient est l\'acteur de son propre changement. Il choisit, il consent, il avance à son rythme. La contrainte nuit au travail.' },
        { name: 'La non-dépendance', respect: 'Tout le système est conçu pour soutenir le patient, jamais pour le rendre dépendant. L\'objectif reste toujours le même : favoriser son autonomie.', definition: '« D\'abord, ne pas nuire » (non-malfaisance). Le devoir d\'éviter tout préjudice — dépendance, pression, fausse réassurance. Un design qui maximise l\'engagement est anti-thérapeutique.' },
        { name: 'Champ de compétence', respect: 'Bloomsline soutient la réflexion du patient sans fournir de diagnostic, de conseil clinique ni de gestion de crise. Ces responsabilités reviennent au thérapeute.', definition: 'Le clinicien n\'agit que dans son domaine de compétence. Diagnostiquer, traiter et gérer les crises relève du clinicien — l\'outil reste à sa place.' },
        { name: 'Confidentialité', respect: 'Ce qui est partagé reste protégé et sous le contrôle du patient et de son thérapeute. (Données chiffrées, hébergement sécurisé en Europe et conformité RGPD.)', definition: 'Ce que le patient partage est protégé. Fondamental pour la confiance en thérapie — et, pour un outil numérique, une obligation légale (RGPD / données de santé).' },
      ],
      closing: 'Ce ne sont pas nos règles. Ce sont celles de la thérapie — appliquées au logiciel.',
    },
    whyNow: {
      label: 'POURQUOI MAINTENANT',
      headline: 'Trois choses viennent de devenir vraies.',
      item1Title: 'Marché',
      item1Body: 'Un marché de plusieurs milliards en croissance à deux chiffres — et l\'espace des apps grand public est déjà mature (BetterHelp, Woebot). La couche clinique en dessous, entre patient et thérapeute, reste à construire. C\'est là l\'ouverture.',
      item1Sources: [
        { label: 'Healthcare Dive, 2024', url: 'https://www.healthcaredive.com/news/teladoc-1-billion-net-loss-2024-betterhelp-challenges/741134/' },
        { label: 'STAT News, 2025', url: 'https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/' },
      ],
      item2Title: 'Adoption',
      item2Body: '49% des personnes concernées par la santé mentale utilisent déjà l\'IA. L\'acceptation est acquise — l\'opportunité, c\'est une IA qui soutient le clinicien, pas qui le remplace.',
      item2Sources: [
        { label: 'Sentio Research, 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
      item3Title: 'Réglementation',
      item3Body: 'L\'AI Act européen impose la conformité de l\'IA clinique d\'ici août 2026. Conforme dès le premier jour, c\'est 12–24 mois d\'avance sur les concurrents américains.',
      item3Sources: [
        { label: 'EU Digital Strategy', url: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
        { label: 'DataGuard Timeline', url: 'https://www.dataguard.com/eu-ai-act/timeline' },
      ],
      closing: 'Zéro SaaS clinique AI-native en Europe. La fenêtre est ouverte.',
    },
    security: {
      label: 'SÉCURITÉ DES DONNÉES',
      headline: 'Trois choses décident d\'une entreprise de santé.',
      headline2: 'Nous faisons de chacune une force.',
      intro: '',
      pillars: [
        { name: 'Protégées', claim: 'Les données patients sont chiffrées et l\'accès strictement contrôlé.', edge: 'En santé, la confiance est primordiale. Nous la protégeons en conséquence.' },
        { name: 'Conformes', claim: 'Conçu pour le RGPD dès le départ.', edge: 'La certification HDS, la porte du marché de la santé en France, est notre prochaine étape. Difficile à obtenir, donc elle nous protège.' },
        { name: 'IA responsable', claim: 'Notre IA assiste les thérapeutes. Elle ne diagnostique ni ne décide jamais.', edge: 'Cela nous tient hors de la réglementation des dispositifs médicaux, et libres d\'avancer vite.' },
      ],
      closing: 'La sécurité n\'est pas un slide. C\'est la condition préalable.',
    },
    model: {
      label: 'LE MODÈLE',
      headline: '49 € par mois.',
      headline2: 'Moins d\'une séance.',
      whyPayLabel: 'Pourquoi ils paient',
      howGrowsLabel: 'Comment ça grandit',
      earnedLabel: '~3 600 € / mois, psychologue solo',
      priceChip: '49 €',
      priceNote: 'Moins de 1,5% de leur revenu',
      annualValue: '588 €',
      annualMath: '49 € × 12',
      annualLabel: 'une année entière de Bloomsline',
      retentionLine: 'Un patient retenu un mois de plus paie l\'année entière.',
      growItems: [
        { label: 'Distribution', body: 'Les praticiens paient. Les patients rejoignent gratuitement, à l\'invitation de leur thérapeute, à CAC patient nul.' },
        { label: 'Recommandation', body: 'Les praticiens recommandent d\'autres praticiens. On le mesure, on ne le suppose pas.' },
        { label: 'Expansion', body: 'Cliniques et cabinets de groupe. Rapports de résultats.' },
      ],
      cacNote: '0 € CAC, ça compose',
      loop: ['Paie 49 € / mois', 'Amène ses patients', 'Recommande ses pairs'],
      flow1Label: '1 praticien',
      flow1Value: '49 € / mois',
      flow2Label: 'invite',
      flow2Value: 'ses propres patients',
      flow3Label: 'et recommande',
      flow3Value: 'ses pairs dans son réseau',
      revenueTitle: 'Revenus',
      revenueItems: [
        '49 € / praticien',
        'Patients gratuits, à coût nul',
        'SaaS à forte marge',
        'Expansion : cliniques, rapports de résultats',
      ],
      compoundTitle: 'Pourquoi ça compose',
      compoundItems: [
        'Les praticiens amènent leurs propres patients dès le premier jour',
        'L\'engagement est porté par la relation praticien',
        'La croissance passe par les réseaux de praticiens',
      ],
      footnote: 'Un psychologue gagne environ 3 600 € par mois. Retenir un patient un mois de plus paie une année entière de Bloomsline. On fixe le prix pour protéger le revenu que l\'abandon fait perdre.',
      footnoteSource: 'CA moyen ~51 671€/an · UNASA 2024',
      footnoteUrl: 'https://propulsebyca.fr/idees-business/psychologue',
    },
    real: {
      label: 'CE QUI EST RÉEL',
      headline: 'Nous sommes pré-revenu. Le produit, non.',
      builtLabel: 'CONSTRUIT',
      builtItems: [
        'Plateforme praticien en ligne',
        'App patient en utilisation',
        'De vrais utilisateurs interagissent avec le produit',
        'Système complet construit en interne',
      ],
      learnedLabel: 'APPRIS',
      learnedItems: [
        '100+ entretiens avant la moindre ligne de code',
        'Le vide est entre les séances — nommé à chaque conversation',
        'À l\'usage, il s\'intègre à la façon dont les praticiens travaillent déjà',
        'La continuité génère l\'engagement — pas les fonctionnalités',
      ],
      honestLabel: 'HONNÊTE',
      honestItems: [
        'Pré-PMF. Mais l\'usage précoce est constant.',
        'Les praticiens reconnaissent le problème instantanément',
        'Prix façonné par de vraies conversations',
        'Deux fondateurs, itération rapide',
      ],
      quote: 'Ce n\'est pas un concept. C\'est une plateforme fonctionnelle que vous pouvez utiliser aujourd\'hui.',
    },
    gtm: {
      label: 'GO-TO-MARKET',
      headline: 'La confiance d\'abord.',
      headline2: 'La croissance suit.',
      intro: 'Les thérapeutes font confiance aux thérapeutes, pas aux pubs. On a parlé à 100 avant d\'écrire une ligne de code — et on gagnera les 1 000 suivants de la même façon.',
      columns: [
        {
          tag: 'Passé',
          title: 'On a commencé par la confiance.',
          num: '01',
          action: 'Parlé à 100+ thérapeutes et construit notre réseau — avant le code.',
          goal: '100+ échanges · 0 pub',
        },
        {
          tag: 'Aujourd\'hui',
          title: 'On les convainc un par un.',
          num: '02',
          action: 'Contact personnel et onboarding accompagné, un praticien à la fois.',
          goal: '10 premiers utilisateurs actifs',
        },
        {
          tag: 'Ensuite',
          title: 'Une croissance qui se nourrit elle-même.',
          num: '03',
          action: 'Les thérapeutes en invitent d\'autres ; partenariats avec les écoles.',
          goal: '150 thérapeutes début 2027',
        },
        {
          tag: 'Plus tard',
          title: 'Voir plus grand.',
          num: '04',
          action: 'Cliniques et cabinets de groupe, expansion en Europe.',
          goal: '1 500+ thérapeutes · 1M€+ de revenus',
        },
      ],
      dontLabel: 'Ce qu\'on ne fait pas',
      dontItems: ['Publicité payante', 'Démarchage à froid', 'Acquisition patients B2C', 'Métriques de vanité'],
      closing: 'On gagne la confiance lentement, puis elle se propage seule.',
    },
    market: {
      label: 'LE MARCHÉ',
      headline: 'On démarre en France.',
      headline2: 'Le chemin est plus grand.',
      demand: '1 adulte français sur 6 traverse une dépression chaque année.',
      regions: [
        { name: 'France', value: '28K', sub: 'psychologues indépendants, notre marché', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { name: 'Europe', value: '450M', sub: '17× plus grand. Même produit, mêmes règles.', source: '', url: '' },
        { name: 'Monde', value: '1Md+', sub: 'vivent avec un trouble mental', source: 'OMS 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
      ],
      regionTarget: '3,5% des psychologues français ≈ 588K€ ARR (1 000 × 49 € × 12)',
      goalLabel: 'Objectif à 2 ans',
      potentialLabel: 'Le potentiel',
      franceTitle: 'En France aujourd\'hui',
      funnel: [
        { value: '69M', label: 'personnes vivent en France', source: 'INSEE 2026', url: 'https://www.insee.fr/fr/statistiques/8719824' },
        { value: '~8M', label: 'adultes ont une dépression chaque année (environ 1 sur 6)', source: 'Santé publique France 2024', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/rapportsynthese/episodes-depressifs-prevalence-et-recours-aux-soins-barometre-de-sante-publique-france-resultats-de' },
        { value: '77K', label: 'psychologues, chacun doit s\'enregistrer par la loi', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '28K', label: 'travaillent à leur compte, c\'est à eux qu\'on vend', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '1 000', label: '1 000 praticiens (3,5%), environ 588K€ ARR', source: 'notre cible · 3,5% des psychologues français', url: '' },
      ],
      europeLabel: 'Europe',
      europeValue: '17× plus grand',
      europeBody: '450M de personnes. Les règles qu\'on suit déjà en France marchent aussi en Europe.',
      worldLabel: 'Monde',
      worldValue: '1Md+',
      worldBody: 'de personnes vivent avec un trouble mental. Un jour, pas aujourd\'hui.',
      worldSource: 'OMS 2025',
      worldUrl: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
      punch: 'La France, c\'est la tête de pont. L\'Europe, c\'est le chemin vers 100M€.',
    },
    team: {
      label: 'L\'ÉQUIPE',
      headline: 'Deux personnes. Tout fait en interne. Efficaces en capital.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Ventes & Opérations',
      sarahYears: '10+ ans en vente, recrutement & psychologie · Marketing Digital & IA',
      sarahBio: 'La personne en qui les praticiens ont confiance. Elle écoute avant de vendre, c\'est pour ça qu\'ils restent.',
      sarahEducation: 'MBA Devinci Education · Le Wagon',
      sarahWorkedWith: ['Explain AI', 'Arrow ECS', 'KLB Group'],
      adityaName: 'Aditya Channe',
      adityaRole: 'Produit & Technologie',
      adityaYears: '8+ ans en startups et scale-ups SaaS · Transformation digitale',
      adityaBio: 'A construit chaque écran que vous voyez. Dirige le produit, et s\'assure qu\'il reste proche du problème.',
      adityaEducation: 'Montpellier Business School',
      adityaWorkedWith: ['Bloq.it', 'Greenny', 'Didomi', 'Amazon Alexa', 'Revfin'],
      workedWithLabel: 'Expériences',
      educationLabel: 'Formation',
      whyUsLabel: 'Pourquoi nous',
      whyUs: [
        { t: 'On ne l\'a pas étudié, on l\'a vécu', d: '3+ ans sur le terrain avec praticiens et patients. Une chose ressortait : tout se joue entre les séances.' },
        { t: 'On a déjà construit ensemble', d: 'Alors on sait déjà comment on avance quand ça devient dur. Pour nous, ça n\'est plus une question.' },
        { t: 'À deux, c\'est couvert', d: 'L\'un construit, l\'autre vend. Et ce que vous voyez est déjà réel, entre les mains des praticiens et de leurs patients.' },
      ],
      footnote: '* Nous cherchons activement un(des) conseiller(s) clinique(s) pour rejoindre l\'équipe.',
    },
    vision: {
      label: 'LE LONG TERME',
      headline: 'Logiciel aujourd\'hui.',
      headline2: 'Infrastructure demain.',
      viewMore: 'Voir plus',
      showLess: 'Voir moins',
      whatWeDoLabel: 'Ce qu\'on fait',
      whyItMattersLabel: 'Pourquoi c\'est important',
      todayTag: 'Aujourd\'hui',
      todayTitle: 'Un logiciel que les thérapeutes paient.',
      todaySub: 'Déjà un vrai business — des revenus récurrents, au cœur du cabinet.',
      todayBody: 'C\'est déjà réel. Les thérapeutes arrivent préparés à chaque séance au lieu de rattraper le retard — et les patients se sentent accompagnés entre les séances, plus seuls.',
      todayWhatWeDo: 'Pour 49 €/mois, le thérapeute a un outil qui rend chaque séance plus juste, et ses patients restent reliés au travail entre les séances. Les deux côtés le ressentent.',
      todayWhyItMatters: 'Les praticiens paient et continuent de payer. Les patients reviennent. Quand les deux côtés choisissent de rester, on sait que ça marche — en pratique, pas en théorie.',
      nextTag: 'Ensuite',
      nextTitle: 'On rend la thérapie mesurable.',
      nextSub: 'La donnée que personne d\'autre n\'a — la preuve de ce qui marche vraiment entre les séances.',
      nextBody: 'Pour la première fois, les progrès deviennent visibles. Chaque séance — et chaque moment entre — compose une vraie image : « anxiété en baisse de 40 % en trois mois ». Le patient voit qu\'il va mieux ; le thérapeute voit son travail porter. Personne n\'a jamais eu ça.',
      nextWhatWeDo: 'Les thérapeutes reçoivent de vrais rapports de résultats ; les patients suivent leur propre progression. Et nous détenons la seule chose que personne d\'autre n\'a — un registre continu de ce qui se passe entre les séances.',
      nextWhyItMatters: 'La preuve change tout. C\'est ce qui pousse un praticien à passer en premium, une clinique à nous rejoindre — ce qui fait passer d\'un outil sympa à un outil essentiel.',
      laterTag: 'À terme',
      laterTitle: 'L\'infrastructure de la santé mentale.',
      laterSub: 'La couche de confiance sur laquelle tout le secteur se construit — praticiens, cliniques, chercheurs et systèmes de santé.',
      laterBody: 'La santé mentale n\'a jamais eu de façon commune de mesurer ce qui marche. Nous le devenons — du cabinet d\'un thérapeute aux cliniques, chercheurs et systèmes de santé partout en Europe, et même aux applications grand public qui se branchent sur le même modèle, tous construisant sur la même fondation.',
      laterWhatWeDo: 'De mesurer les résultats à les anticiper — des signaux qui repèrent les jours difficiles avant qu\'ils n\'arrivent, pour qu\'un praticien prenne les devants. Et nous ouvrons la couche : cliniques, chercheurs et applications grand public se branchent sur le même standard. Nous devenons la façon dont le soin se mesure.',
      laterWhyItMatters: 'Quand tout un secteur mesure de la même façon, il se construit sur la même couche — la nôtre. Ce n\'est pas un produit plus gros. C\'est une infrastructure.',
      footnote: 'La vision gagne le droit d\'exister par l\'exécution. Là, on est concentrés sur Aujourd\'hui.',
    },
    ask: {
      label: 'LA DEMANDE',
      headline: 'Levée de 800 k€ en pre-seed.',
      subhead: '18 mois pour faire de la conformité européenne un avantage durable.',
      fundsLabel: 'Utilisation des fonds',
      fundsHint: 'Touchez une ligne pour le détail',
      fundsItems: [
        { label: 'Équipe', value: '36%', why: 'Passer de nous deux à l\'équipe qu\'il faut pour avancer plus vite et signer nos premiers thérapeutes payants.' },
        { label: 'Sécurité, Conformité & Juridique', value: '33%', why: 'Presque autant, car gérer les données de santé en Europe est la partie difficile et coûteuse, et c\'est ce qui nous permet de vendre.' },
        { label: 'Produit & Croissance', value: '21%', why: 'Continuer à améliorer l\'app et la faire connaître à plus de thérapeutes.' },
        { label: 'Réserve', value: '10%', why: 'Couvrir les coûts et retards imprévus.' },
      ],
      closing: 'Assez pour atteindre le product-market fit, bâtir le rempart réglementaire, et protéger les données des patients.',
    },
    close: {
      line1: 'La thérapie a lieu en séance.',
      line2: 'La vie a lieu chaque jour.',
      line3: 'Et aujourd\'hui, rien ne relie les deux.',
      line4: 'C\'est la couche que nous construisons.',
      cta: 'Discutons.',
      bookCall: 'Réserver un appel de 30 min',
      emailUs: 'hi@bloomsline.com',
      copyright: '© 2026 Bloomsline',
    },
  },
}

// ─────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────

export default function PitchCopyPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const slides = [
    { id: 'heroSplit', title: t.slides.heroSplit },
    { id: 'problem', title: t.slides.problem },
    { id: 'whyItMatters', title: t.slides.whyItMatters },
    { id: 'build', title: t.slides.build },
    { id: 'story', title: t.slides.story },
    { id: 'visionValues', title: t.slides.visionValues },
    { id: 'marketNew', title: t.slides.market },
    { id: 'landscapeNew', title: t.slides.landscape },
    { id: 'modelNew', title: t.slides.model },
    { id: 'iceberg', title: t.slides.iceberg },
    { id: 'history', title: t.slides.history },
    { id: 'teamNew', title: t.slides.team },
    { id: 'nowTime', title: t.slides.nowTime },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= slides.length) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating, slides.length])

  const nextSlide = useCallback(() => goToSlide(currentSlide + 1), [currentSlide, goToSlide])
  const prevSlide = useCallback(() => goToSlide(currentSlide - 1), [currentSlide, goToSlide])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        prevSlide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide])

  const slideVariants = {
    enter: { opacity: 0, y: 30 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -30 },
  }

  // Dark slides get dark nav styling. Detected by id so inserting/reordering
  // slides never breaks the styling (or the PDF page background).
  const isDarkSlide = (i: number) => ['hero', 'heroSplit', 'problem', 'whyItMatters', 'history', 'visionValues', 'build', 'story', 'nowTime', 'marketNew', 'landscapeNew', 'modelNew', 'iceberg', 'teamNew', 'whyNow'].includes(slides[i]?.id)
  const isDark = isDarkSlide(currentSlide)

  // One place to render a slide by index — used by the on-screen view and the
  // print stack (PDF export).
  const renderSlide = (i: number) => {
    switch (slides[i]?.id) {
      case 'hero': return <HeroSlide onNext={nextSlide} t={t.hero} />
      case 'heroSplit': return <HeroSplitSlide onNext={nextSlide} t={t.heroSplit} />
      case 'problem': return <ProblemSlide t={t.problem} />
      case 'history': return <HistorySlide t={t.history} />
      case 'visionValues': return <VisionValuesSlide t={t.visionValues} />
      case 'build': return <BuildSlide t={t.build} />
      case 'story': return <StorySlide t={t.story} />
      case 'nowTime': return <NowTimeSlide t={t.nowTime} />
      case 'marketNew': return <MarketNewSlide t={t.market} />
      case 'landscapeNew': return <LandscapeNewSlide t={t.landscape} />
      case 'modelNew': return <ModelNewSlide t={t.model} />
      case 'iceberg': return <IcebergSlide t={t.iceberg} />
      case 'teamNew': return <TeamNewSlide t={t.team} />
      case 'silence': return <SilenceSlide t={t.silence} />
      case 'whyItMatters': return <WhyItMattersSlide t={t.whyItMatters} />
      case 'origin': return <OriginSlide t={t.origin} />
      case 'product': return <ProductSlide t={t.product} />
      case 'boundary': return <BoundarySlide t={t.boundary} />
      case 'whyNow': return <WhyNowSlide t={t.whyNow} />
      case 'security': return <SecuritySlide t={t.security} />
      case 'real': return <RealSlide t={t.real} />
      case 'market': return <MarketSlide t={t.market} />
      case 'landscape': return <LandscapeSlide t={t.landscape} />
      case 'gtm': return <GTMSlide t={t.gtm} />
      case 'model': return <ModelSlide t={t.model} />
      case 'team': return <TeamSlide t={t.team} />
      case 'vision': return <VisionSlide t={t.vision} />
      case 'ask': return <AskSlide t={t.ask} />
      case 'close': return <CloseSlide t={t.close} />
      default: return null
    }
  }

  return (
    <>
    <div className="pdf-screen h-screen w-screen overflow-hidden" style={{ backgroundColor: isDark ? '#0a0a0a' : '#FAF8F5' }}>
      {/* Language Toggle + Download PDF */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => window.print()}
          title="Download as PDF"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all text-sm font-medium ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300 text-neutral-700'
          }`}
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all text-sm font-medium ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300 text-neutral-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          {locale === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Navigation dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className="group flex items-center gap-2 transition-all duration-300"
            aria-label={slide.title}
          >
            <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isDark
                ? (currentSlide === index ? 'text-teal-400' : 'text-neutral-500')
                : (currentSlide === index ? 'text-teal-600' : 'text-neutral-400')
            }`}>
              {slide.title}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isDark
                ? (currentSlide === index ? 'bg-teal-400 scale-150' : 'bg-white/30 hover:bg-white/50')
                : (currentSlide === index ? 'bg-teal-600 scale-150' : 'bg-neutral-300 hover:bg-neutral-400')
            }`} />
          </button>
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-2 rounded-full backdrop-blur-sm border transition-all ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300'
          } ${currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          aria-label="Previous slide"
        >
          <ChevronUp className={`w-5 h-5 ${isDark ? 'text-white' : 'text-neutral-600'}`} />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-2 rounded-full backdrop-blur-sm border transition-all ${
            isDark
              ? 'bg-white/10 border-white/20 hover:bg-white/20'
              : 'bg-white/80 border-neutral-200 hover:bg-white hover:border-neutral-300'
          } ${currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
          aria-label="Next slide"
        >
          <ChevronDown className={`w-5 h-5 ${isDark ? 'text-white' : 'text-neutral-600'}`} />
        </button>
      </div>

      {/* Logo — hidden on the dark hero slide, which carries its own branding. */}
      {currentSlide !== 0 && (
        <div className="fixed top-6 left-6 z-50">
          <a href="/" className="flex items-center gap-2">
            <Logo size="lg" showText variant={isDark ? 'dark' : 'light'} />
          </a>
        </div>
      )}

      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentSlide}-${locale}`}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full w-full"
        >
          {renderSlide(currentSlide)}
        </motion.div>
      </AnimatePresence>

      {/* Slide counter */}
      <div className={`fixed bottom-6 right-6 z-50 text-sm font-medium ${isDark ? 'text-white/40' : 'text-neutral-400'}`}>
        {currentSlide + 1} / {slides.length}
      </div>
    </div>

    {/* Print-only stack — every slide, one per page, for the PDF export.
        Hidden on screen; revealed by the print stylesheet below. */}
    <div className="pdf-print">
      {slides.map((_, i) => (
        <div key={i} className="pdf-page" style={{ backgroundColor: isDarkSlide(i) ? '#0a0a0a' : '#FAF8F5' }}>
          {/* Bloomsline branding, top-right on every PDF page. Slide kickers and
              headlines are all top-left, so anchoring right keeps the logo clear
              of the content. */}
          <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 50 }}>
            <Logo size="lg" showText variant={isDarkSlide(i) ? 'dark' : 'light'} />
          </div>
          {renderSlide(i)}
        </div>
      ))}
    </div>

    <style>{`
      .pdf-print { display: none; }
      @media print {
        @page { size: 1280px 720px; margin: 0; }
        html, body { margin: 0; }
        .pdf-screen { display: none !important; }
        .pdf-print { display: block !important; }
        .pdf-page {
          width: 1280px; height: 720px; overflow: hidden; position: relative;
          break-after: page; page-break-after: always;
        }
        .pdf-page:last-child { break-after: auto; page-break-after: auto; }
        /* Kill the slide scrollbars (overflow-y-auto) that print as a grey bar. */
        .pdf-print [class*="overflow-y-auto"],
        .pdf-print [class*="overflow-auto"] { overflow: hidden !important; }
        .pdf-print *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .pdf-print * { scrollbar-width: none !important; }
        /* Neutralize framer-motion mount state so content is visible in the PDF */
        .pdf-page [style*="opacity"] { opacity: 1 !important; }
        /* The print viewport doesn't trigger md:/lg: breakpoints, so the deck
           would render in its (taller) mobile layout and clip. Force the
           desktop layout for the handful of responsive utilities the slides use. */
        .pdf-print .sm\\:grid-cols-2,
        .pdf-print .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .pdf-print .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .pdf-print .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        .pdf-print .md\\:flex-row { flex-direction: row !important; }
        .pdf-print .md\\:items-end { align-items: flex-end !important; }
        /* Preserve backgrounds/colors in the PDF */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        /* Strip dead interactive affordances from the PDF: "View more" toggles can't
           be clicked on paper, so hide them; and flatten clickable-looking underlines. */
        .pdf-print .pdf-hide { display: none !important; }
        .pdf-print .pdf-static-underline { border-bottom-width: 0 !important; }
      }
    `}</style>
    </>
  )
}

// =============================================================================
// SLIDE 1: HERO — "One hour a week. 167 hours of silence."
// =============================================================================

// Opening hook: a few warm, hopeful moments of care (never sadness) scattered
// aesthetically around one engaging line, with the practice's problems named in
// the sub-copy. Minimal — inspired by, not a copy of, the reference collage.
// (Pexels, license-free, downloaded to /public/pitch — no network dependency.)
const HERO_SCATTER = [
  { n: 1, pos: 'left-[5%] top-[9%]',    size: 'w-[15vw] h-[19vw]', rot: '-rotate-3' },
  { n: 4, pos: 'right-[6%] top-[12%]',  size: 'w-[18vw] h-[13vw]', rot: 'rotate-2' },
  { n: 2, pos: 'left-[3%] top-[45%]',   size: 'w-[13vw] h-[16vw]', rot: 'rotate-3' },
  { n: 6, pos: 'left-[13%] bottom-[8%]', size: 'w-[18vw] h-[13vw]', rot: 'rotate-1' },
  { n: 5, pos: 'right-[7%] bottom-[10%]', size: 'w-[15vw] h-[19vw]', rot: '-rotate-2' },
  { n: 3, pos: 'right-[3%] top-[47%]', size: 'w-[13vw] h-[12vw]', rot: '-rotate-3' },
]

function HeroSlide({ onNext, t }: { onNext: () => void; t: typeof translations.en.hero }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-neutral-950 cursor-pointer"
      onClick={onNext}
      role="button"
      tabIndex={0}
      aria-label={t.cta}
    >
      {/* A few scattered moments of care */}
      {HERO_SCATTER.map((im, i) => (
        <motion.div
          key={im.n}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
          className={`absolute ${im.pos} ${im.size} ${im.rot} rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/60`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/pitch/care-${im.n}.jpg`} alt="" className="w-full h-full object-cover opacity-80 saturate-[0.9]" />
          <div className="absolute inset-0 bg-neutral-950/20" />
        </motion.div>
      ))}

      {/* Soft centre vignette so the headline reads clearly */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.45) 55%, rgba(8,8,8,0) 100%)' }}
      />

      {/* The hook */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-8 pointer-events-none">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
          className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400/90 uppercase mb-5"
        >
          {t.eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.7 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.08] tracking-tight max-w-4xl"
        >
          {t.title1}
          <br />
          <span className="text-teal-400">{t.title2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.3 }}
          className="mt-6 text-base sm:text-lg text-white/65 font-light max-w-2xl leading-relaxed"
        >
          {t.subtitle}
        </motion.p>
      </div>

      {/* Small positioning line at the bottom */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.7 }}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 text-xs sm:text-sm text-white/35 tracking-wide px-6 text-center pointer-events-none"
      >
        {t.smallLine}
      </motion.p>

      {/* Advance hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/30"
      >
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </motion.div>
    </div>
  )
}

// =============================================================================
// SLIDE 1 (variant): SPLIT HERO — the one hour vs the 167 hours between
// =============================================================================

// Reusable pitch characters — one silhouette, told apart by COLOUR across the
// deck: therapist = teal, patient = amber. Colour/size via className (fill is
// currentColor). `flip` faces the figure the other way in a scene.
function PitchFigure({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 100 172" fill="currentColor" aria-hidden className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <circle cx="50" cy="27" r="23" />
      <path d="M18 172 V100 a32 32 0 0 1 64 0 V172 Z" />
    </svg>
  )
}
// Semantic wrappers so slide code reads clearly and colours stay consistent.
function TherapistFigure({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <PitchFigure flip={flip} className={`text-teal-300 ${className}`} />
}
function PatientFigure({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <PitchFigure flip={flip} className={`text-amber-300 ${className}`} />
}

function HeroSplitSlide({ onNext, t }: { onNext: () => void; t: typeof translations.en.heroSplit }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-neutral-950 cursor-pointer"
      onClick={onNext}
      role="button"
      tabIndex={0}
      aria-label={t.cta}
    >
      {/* Two panels: the one hour (warm, together) | the rest of the week (cool, alone) */}
      <div className="absolute inset-0 grid grid-cols-2">
        {/* LEFT — the session: therapist and patient, together */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-neutral-950 to-neutral-950">
          <div className="absolute bottom-0 inset-x-0 flex items-end justify-center gap-2 pb-24">
            <TherapistFigure className="h-44 w-auto opacity-[0.18]" />
            <PatientFigure flip className="h-40 w-auto opacity-[0.18]" />
          </div>
        </div>
        {/* RIGHT — between sessions: the patient, alone */}
        <div className="relative overflow-hidden bg-gradient-to-bl from-teal-950/50 via-neutral-950 to-neutral-950">
          <div className="absolute bottom-0 inset-x-0 flex items-end justify-center pb-24">
            <PatientFigure className="h-52 w-auto opacity-[0.16]" />
          </div>
        </div>
      </div>

      {/* Seam between the two worlds */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />

      {/* Soft vignette so the copy stays readable over the panels */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 70% at 34% 46%, rgba(8,8,8,0.82) 0%, rgba(8,8,8,0.35) 55%, rgba(8,8,8,0) 100%)' }}
      />

      {/* The hook — left-weighted */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-10 sm:px-16 lg:px-20 pointer-events-none">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-white/45 uppercase mb-5"
          >
            {t.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.08] tracking-tight"
          >
            {t.title1}
            <br />
            <span className="text-teal-400">{t.title2}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-6 text-base sm:text-lg text-white/65 font-light max-w-xl leading-relaxed"
          >
            {t.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Panel labels, one centered under each world, made clearly readable */}
      <div className="absolute bottom-9 inset-x-0 z-20 grid grid-cols-2 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.4 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="h-px w-10 bg-amber-200/40" />
          <span className="text-xs sm:text-sm font-medium tracking-[0.22em] uppercase text-amber-200/75">{t.leftLabel}</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.5 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="h-px w-10 bg-teal-300/50" />
          <span className="text-xs sm:text-sm font-medium tracking-[0.22em] uppercase text-teal-300/85">{t.rightLabel}</span>
        </motion.div>
      </div>

      {/* Advance hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.8 }}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 text-white/30"
      >
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </motion.div>
    </div>
  )
}

// =============================================================================
// SLIDE 2: THE PROBLEM — therapy is unmeasured
// =============================================================================

function ProblemSlide({ t }: { t: typeof translations.en.problem }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      {/* Ambient depth */}
      <div className="pointer-events-none absolute -top-24 right-0 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-0 w-[440px] h-[440px] bg-gradient-to-tr from-violet-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: a therapist surrounded by scattered notes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TherapistFigure className="absolute bottom-0 left-2 sm:left-14 h-64 w-auto opacity-[0.06]" />
        <span className="absolute bottom-[46%] left-[7%] w-12 h-9 rounded-md bg-white/50 rotate-6 opacity-[0.05]" />
        <span className="absolute bottom-[56%] left-[15%] w-10 h-8 rounded-md bg-white/50 -rotate-6 opacity-[0.05]" />
        <span className="absolute bottom-[40%] left-[18%] w-14 h-10 rounded-md bg-white/50 rotate-3 opacity-[0.04]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-2xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.12] tracking-tight lg:whitespace-nowrap"
        >
          {t.headline1}
          <br />
          <span className="text-white/45">{t.headline2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-7 text-base sm:text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed"
        >
          {t.body}
        </motion.p>

        {/* The three failures */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xl sm:text-3xl font-light"
        >
          {t.triad.map((w, i) => (
            <span key={w} className="flex items-center gap-4">
              {i > 0 && <span className="text-teal-500/70 text-lg">•</span>}
              <span className="text-white/85">{w}</span>
            </span>
          ))}
        </motion.div>

        {/* Why it's a bigger problem — the stakes, in numbers */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }}
          className="mt-12 border-t border-white/10 pt-8"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/40 mb-6">{t.stakes}</p>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            {t.stats.map((s) => (
              <a
                key={s.value}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
                title="View source"
              >
                <p className="text-2xl sm:text-4xl font-light text-white tabular-nums transition-colors group-hover:text-teal-300">{s.value}</p>
                <p className="text-[11px] sm:text-xs text-white/45 mt-2 leading-snug transition-colors group-hover:text-white/70">{s.label}</p>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 3: HOW WE GOT HERE — the research
// =============================================================================

// Placeholder practitioner names for the background tags — swap for the real
// 100+ once we have them. Language-neutral, so they live outside translations.
const HISTORY_NAMES = [
  'Sophie', 'Karim', 'Élodie', 'Thomas', 'Aïcha', 'Julien', 'Marie', 'Noah',
  'Chloé', 'Lucas', 'Fatima', 'Antoine', 'Camille', 'Youssef', 'Emma', 'Hugo',
  'Sarah', 'Léa', 'Nadia', 'Paul', 'Inès', 'Gabriel', 'Manon', 'Omar',
  'Clara', 'Louis', 'Yasmine', 'Adam', 'Zoé', 'Rayan',
]
// Evolution scale — each stage grows by ~the golden ratio (dot + year) and
// rises toward the present, so 2024 → 2025 → 2026 reads as growth culminating
// in Bloomsline. Sizes step ~1, ~1.6, ~2.6× (φ⁰, φ¹, φ²).
const HISTORY_STEP = [
  { dot: 'w-2.5 h-2.5', year: 'text-2xl sm:text-3xl', rise: 'sm:mt-16' },
  { dot: 'w-4 h-4', year: 'text-3xl sm:text-5xl', rise: 'sm:mt-8' },
  { dot: 'w-6 h-6', year: 'text-4xl sm:text-7xl', rise: 'sm:mt-0' },
]
// Tag positions around the edges, clear of the centred copy.
const HISTORY_TAG_SLOTS = [
  'left-[6%] top-[12%]', 'left-[24%] top-[7%]', 'right-[26%] top-[9%]', 'right-[8%] top-[13%]',
  'left-[3%] top-[36%]', 'right-[4%] top-[40%]',
  'left-[7%] bottom-[28%]', 'right-[6%] bottom-[24%]',
  'left-[5%] bottom-[9%]', 'left-[27%] bottom-[6%]', 'right-[25%] bottom-[8%]', 'right-[7%] bottom-[11%]',
]

function HistorySlide({ t }: { t: typeof translations.en.history }) {
  const [tagNames, setTagNames] = useState<string[]>(() => HISTORY_TAG_SLOTS.map((_, i) => HISTORY_NAMES[i % HISTORY_NAMES.length]))

  useEffect(() => {
    let tick = 0
    const id = setInterval(() => {
      setTagNames((prev) => {
        const next = [...prev]
        const slot = tick % HISTORY_TAG_SLOTS.length
        const cur = HISTORY_NAMES.indexOf(prev[slot])
        next[slot] = HISTORY_NAMES[(cur + HISTORY_TAG_SLOTS.length) % HISTORY_NAMES.length]
        return next
      })
      tick++
    }, 800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-12">
      {/* Ambient depth */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Softly flipping names of the practitioners we met */}
      {HISTORY_TAG_SLOTS.map((pos, i) => (
        <div key={i} className={`absolute ${pos} hidden sm:block`} style={{ perspective: 500 }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={tagNames[i]}
              initial={{ opacity: 0, rotateX: -90 }}
              animate={{ opacity: 0.22, rotateX: 0 }}
              exit={{ opacity: 0, rotateX: 90 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-light text-white whitespace-nowrap"
            >
              {tagNames[i]}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}

      {/* Foreground story */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-5xl font-light text-white leading-[1.1] tracking-tight"
        >
          {t.headline1} <span className="text-teal-400">{t.headline2}</span>
          <br />
          <span className="text-white/45">{t.headline3}</span>
        </motion.h1>

        {/* Timeline: Doctalink → Discovery → Bloomsline */}
        {/* Evolution — grows and rises toward today */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 max-w-4xl mx-auto text-center">
          {t.timeline.map((item, i) => {
            const step = HISTORY_STEP[i] ?? HISTORY_STEP[HISTORY_STEP.length - 1]
            return (
              <motion.div
                key={item.year}
                className={step.rise}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 + i * 0.18 }}
              >
                <span className={`mx-auto mb-4 block rounded-full ${step.dot} ${item.accent ? 'bg-teal-400 shadow-[0_0_22px_rgba(45,212,191,0.5)]' : 'bg-white/70'}`} />
                <p className={`${step.year} font-light leading-none ${item.accent ? 'text-teal-400' : 'text-white'}`}>{item.year}</p>
                <p className={`text-[11px] uppercase tracking-wide mt-2 ${item.accent ? 'text-teal-400/80' : 'text-white/40'}`}>{item.label}</p>
                <p className="text-sm text-white/55 mt-3 leading-relaxed max-w-xs mx-auto">{item.body}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Where we are now: 4 → 20 → 100 */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-12 border-t border-white/10 pt-7"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/40 mb-4">{t.nowLabel}</p>
          <div className="flex items-center justify-center gap-5 sm:gap-9">
            {t.steps.map((s, i) => (
              <div key={s.n} className="flex items-center gap-5 sm:gap-9">
                {i > 0 && <ArrowRight className="w-4 h-4 text-white/25 shrink-0" />}
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wide text-teal-400/70">{s.tag}</p>
                  <p className="text-2xl sm:text-3xl font-light text-white mt-0.5 tabular-nums">{s.n}</p>
                  <p className="text-[11px] text-white/45 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 4: VISION & VALUES
// =============================================================================

function VisionValuesSlide({ t }: { t: typeof translations.en.visionValues }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/3 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: the pair multiplying into the whole field */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 flex items-end justify-center gap-3 opacity-[0.04]">
        {Array.from({ length: 13 }).map((_, i) => (
          <PitchFigure key={i} className={`h-14 w-auto ${i % 2 ? 'text-amber-300' : 'text-teal-300'}`} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        {/* Vision — the north star */}
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-6"
        >
          {t.visionLabel}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.12] tracking-tight"
        >
          {t.visionH1}
          <br />
          <span className="text-teal-400">{t.visionH2}</span>
        </motion.h1>
        {/* The chain: loop → data → measurement → infrastructure */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch gap-3 text-left">
          {t.path.map((p, i) => (
            <div key={p.tag} className="flex flex-col md:flex-row items-stretch gap-3 md:flex-1">
              {i > 0 && <ArrowRight className="hidden md:block w-5 h-5 text-teal-400/40 self-center shrink-0" />}
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.35 + i * 0.15 }}
                className={`flex-1 rounded-2xl border p-4 sm:p-5 ${i === t.path.length - 1 ? 'border-teal-400/30 bg-teal-500/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}
              >
                <p className={`text-[11px] uppercase tracking-[0.2em] ${i === t.path.length - 1 ? 'text-teal-300' : 'text-teal-400/80'}`}>{p.tag}</p>
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{p.body}</p>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Values — what we believe */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-8 border-t border-white/10 pt-6"
        >
          <p className="text-[11px] tracking-[0.3em] uppercase text-white/40 mb-4">{t.valuesLabel}</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {t.values.map((v, i) => (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1 + i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-[15px] font-semibold text-white leading-tight">{v.name}</p>
                <p className="text-sm text-white/50 mt-1.5 leading-snug">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 5: WHAT WE BUILT — product + where we are now
// =============================================================================

function StorySlide({ t }: { t: typeof translations.en.story }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute -bottom-24 left-0 w-[460px] h-[460px] bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Human image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 aspect-[4/5] max-w-sm mx-auto w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pitch/story-camille.jpg" alt={t.name} className="absolute inset-0 w-full h-full object-cover object-[12%_center]" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="text-white font-semibold">{t.name}</p>
            <p className="text-white/60 text-xs">{t.caption}</p>
          </div>
        </motion.div>

        {/* The story */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="text-2xl sm:text-3xl font-light text-white leading-tight tracking-tight"
          >
            {t.intro}
          </motion.p>

          <div className="mt-6 space-y-4">
            {t.beats.map((b, i) => (
              <motion.div
                key={b.tag}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.45 + i * 0.15 }}
                className="border-l-2 border-teal-400/40 pl-4"
              >
                <p className="text-[11px] uppercase tracking-wide text-teal-400/80">{b.tag}</p>
                <p className="text-sm sm:text-base text-white/75 mt-1 leading-relaxed">{b.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }}
            className="mt-6 text-base sm:text-lg text-white font-light"
          >
            {t.punch}
          </motion.p>
        </div>
      </div>
    </div>
  )
}

function BuildSlide({ t }: { t: typeof translations.en.build }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-8">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: therapist and patient framing the loop, facing in */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TherapistFigure className="absolute bottom-0 -left-4 h-52 w-auto opacity-[0.05]" />
        <PatientFigure flip className="absolute bottom-0 -right-4 h-52 w-auto opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.12] tracking-tight"
          >
            {t.headline}
          </motion.h1>
        </div>

        {/* PRIMARY — the between-sessions loop owns the slide */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 rounded-3xl border border-teal-400/30 bg-teal-500/[0.06] p-6 sm:p-8 shadow-[0_0_40px_-14px_rgba(45,212,191,0.4)]"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-teal-300/80 mb-6">{t.loopLabel}</p>

          {/* three steps of the loop */}
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            {t.loopSteps.map((s, i) => (
              <div key={s.title} className="flex flex-col md:flex-row items-stretch gap-3 md:flex-1">
                {i > 0 && <ArrowRight className="hidden md:block w-5 h-5 text-teal-400/40 self-center shrink-0" />}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.45 + i * 0.15 }}
                  className="flex-1 rounded-2xl border border-white/10 bg-neutral-950/50 p-4 sm:p-5"
                >
                  <span className="text-[11px] font-mono text-teal-400/60">0{i + 1}</span>
                  <p className={`mt-2 text-base sm:text-lg font-medium leading-snug ${s.named ? 'text-teal-300' : 'text-white'}`}>{s.title}</p>
                  <p className="mt-1.5 text-sm text-white/65 leading-relaxed">{s.body}</p>
                  {s.tag && (
                    <span className="inline-block mt-3 text-[10px] uppercase tracking-wide text-white/40 border border-white/10 rounded-full px-2 py-0.5">{s.tag}</span>
                  )}
                </motion.div>
              </div>
            ))}
          </div>

          {/* the payoff */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }}
            className="mt-6 pt-6 border-t border-white/10 text-lg sm:text-xl font-light text-white text-center leading-snug"
          >
            {t.payoff}
          </motion.p>
        </motion.div>

        {/* SECONDARY — the practice tools, footnote-sized */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.15 }}
          className="mt-5 text-center text-xs sm:text-sm text-white/45 font-light max-w-3xl mx-auto leading-relaxed"
        >
          {t.practiceStrip}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 6: NOW IS THE TIME — why now, reframed
// =============================================================================

function NowTimeSlide({ t }: { t: typeof translations.en.nowTime }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute -bottom-24 right-0 w-[520px] h-[520px] bg-gradient-to-tr from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: therapist and patient together again, bookending the open */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TherapistFigure className="absolute bottom-0 right-[16%] h-52 w-auto opacity-[0.05]" />
        <PatientFigure flip className="absolute bottom-0 right-[4%] h-48 w-auto opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-6"
        >
          {t.label}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-white leading-[1.12] tracking-tight"
        >
          {t.headline1}
          <br />
          <span className="text-teal-400">{t.headline2}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 text-base sm:text-lg text-white/55 font-light max-w-2xl mx-auto leading-relaxed"
        >
          {t.sub}
        </motion.p>

        {/* The three things that just became true */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-left max-w-4xl mx-auto">
          {t.signals.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 + i * 0.15 }}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-teal-400/80 mb-2">{s.title}</p>
              <p className="text-sm text-white/70 leading-relaxed">{s.body}</p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {s.sources.map((src) => (
                  <a key={src.url} href={src.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 hover:text-teal-300 transition-colors underline underline-offset-2">
                    {src.label}
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.1 }}
          className="mt-12 text-base sm:text-lg text-white font-light"
        >
          {t.closing}
        </motion.p>

        {/* Closing call to action */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.35 }}
          className="mt-8 flex flex-col items-center gap-4"
        >
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={DEMO_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-6 py-3 text-sm font-medium text-neutral-950 hover:bg-teal-300 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {t.ctaBook}
            </a>
            <a
              href="mailto:hi@bloomsline.com"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 hover:border-teal-400/50 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              {t.ctaEmail}
              <span className="text-white/40">· hi@bloomsline.com</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 7: THE MARKET — new theme (reuses market content)
// =============================================================================

// Dotted map of Europe: a dense grid of dots kept only inside a composite of
// ellipses approximating the continent (Iberia, mainland, Scandinavia, British
// Isles, Italy, Balkans, Eastern Europe). France is lit in teal. Computed once.
const EUROPE_DOTS = (() => {
  type E = { cx: number; cy: number; rx: number; ry: number }
  const shapes: E[] = [
    { cx: 112, cy: 82, rx: 58, ry: 36 },  // central mainland
    { cx: 50, cy: 122, rx: 20, ry: 24 },  // Iberia
    { cx: 172, cy: 78, rx: 34, ry: 30 },  // Eastern Europe
    { cx: 108, cy: 34, rx: 13, ry: 22 },  // Scandinavia
    { cx: 52, cy: 60, rx: 10, ry: 15 },   // British Isles
    { cx: 122, cy: 122, rx: 8, ry: 24 },  // Italy
    { cx: 150, cy: 116, rx: 15, ry: 16 }, // Balkans
  ]
  const france: E = { cx: 70, cy: 86, rx: 15, ry: 18 }
  const inside = (x: number, y: number, s: E) => ((x - s.cx) / s.rx) ** 2 + ((y - s.cy) / s.ry) ** 2 <= 1
  const eu: [number, number][] = []
  const fr: [number, number][] = []
  for (let y = 8; y <= 178; y += 6) {
    for (let x = 18; x <= 214; x += 6) {
      if (shapes.some((s) => inside(x, y, s))) {
        if (inside(x, y, france)) fr.push([x, y])
        else eu.push([x, y])
      }
    }
  }
  return { eu, fr }
})()

function DottedEurope() {
  return (
    <svg viewBox="0 0 232 186" className="w-full h-auto">
      <ellipse cx={70} cy={86} rx={22} ry={24} className="fill-teal-500/10" />
      {EUROPE_DOTS.eu.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} className="fill-white/20" />
      ))}
      {EUROPE_DOTS.fr.map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={1.9} className="fill-teal-400" />
      ))}
    </svg>
  )
}

function MarketNewSlide({ t }: { t: typeof translations.en.market }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-8">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight tracking-tight"
          >
            {t.headline} <span className="text-teal-400">{t.headline2}</span>
          </motion.h1>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          {/* Left: the dotted map, France lit */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          >
            <DottedEurope />
            <div className="mt-2 flex items-center justify-center gap-5 text-[11px]">
              <span className="flex items-center gap-1.5 text-teal-300"><span className="w-2 h-2 rounded-full bg-teal-400" />{t.regions[0].name}</span>
              <span className="flex items-center gap-1.5 text-white/40"><span className="w-2 h-2 rounded-full bg-white/25" />{t.regions[1].name}</span>
            </div>
            <p className="text-center text-xs text-white/45 mt-2">{t.demand}</p>
          </motion.div>

          {/* Right: France breakdown, then the path beyond */}
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">{t.franceTitle}</p>
            <div className="space-y-1.5">
              {t.funnel.slice(0, -1).map((f) => (
                <div key={f.value} className="flex items-baseline gap-3">
                  <span className="text-base sm:text-lg font-light tabular-nums shrink-0 w-14 sm:w-16 text-white">{f.value}</span>
                  <span className="text-xs text-white/55 leading-snug">{f.label}</span>
                  {f.source && f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/25 hover:text-teal-300 transition-colors" aria-label={f.source}><ArrowUpRight className="w-3 h-3" /></a>
                  )}
                </div>
              ))}
            </div>

            {/* Our goal — below the line, with the 3.5% for context */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[11px] uppercase tracking-[0.2em] text-teal-400/80">{t.goalLabel}</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-light text-teal-300 tabular-nums shrink-0">{t.funnel[t.funnel.length - 1].value}</span>
                <span className="text-xs text-white/60 leading-snug">{t.regionTarget}</span>
              </div>
            </div>

            {/* The potential beyond France */}
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">{t.potentialLabel}</p>
              <div className="flex items-center gap-4">
                {t.regions.slice(1).map((r, i) => (
                  <div key={r.name} className="flex items-center gap-4">
                    {i > 0 && <ArrowRight className="w-4 h-4 text-teal-400/50 shrink-0" />}
                    <div>
                      <p className="text-xl sm:text-2xl font-light text-white tabular-nums">{r.value}</p>
                      <p className="text-[11px] uppercase tracking-wide text-teal-400/70 mt-0.5">{r.name}</p>
                      <p className="text-[11px] text-white/45 mt-0.5 max-w-[11rem] leading-snug">{r.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }}
          className="mt-7 text-center text-base sm:text-lg text-white font-light"
        >
          {t.punch}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 8: THE ICEBERG — security + why + use of funds
// =============================================================================

const ICEBERG_LAYER_ICONS = [Shield, ShieldCheck, Sparkles]

function IcebergSlide({ t }: { t: typeof translations.en.iceberg }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-8">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sky-950/40 to-transparent" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight tracking-tight"
          >
            {t.headline1} <span className="text-teal-400">{t.headline2}</span>
          </motion.h1>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* The iceberg */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="max-w-sm mx-auto w-full"
          >
            {/* Tip, above the surface */}
            <div className="w-3/5 mx-auto rounded-t-xl border border-white/10 border-b-0 bg-white/[0.06] px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wide text-teal-400/80">{t.tipLabel}</p>
              <p className="text-xs text-white/70 mt-1 leading-snug">{t.tipBody}</p>
            </div>
            {/* Waterline */}
            <div className="relative my-1">
              <div className="h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />
              <p className="text-center text-[9px] tracking-[0.3em] text-teal-400/50 uppercase mt-1">{t.waterline}</p>
            </div>
            {/* The mass, below */}
            <div className="rounded-b-xl overflow-hidden border border-white/10 border-t-0 bg-gradient-to-b from-sky-950/50 to-slate-950/80">
              {t.layers.map((l, i) => {
                const Icon = ICEBERG_LAYER_ICONS[i] ?? Shield
                return (
                  <div key={l.name} className="px-5 py-4 border-t border-white/5 flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center shrink-0"><Icon className="w-4 h-4" strokeWidth={1.8} /></span>
                    <div>
                      <p className="text-sm font-semibold text-white">{l.name}</p>
                      <p className="text-xs text-white/50 mt-0.5 leading-snug">{l.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* Why + the ask + use of funds */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-teal-400/80 mb-3">{t.askLabel}</p>
            <ul className="space-y-2.5">
              {t.buys.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span className="text-sm text-white/70 leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-wide text-white/40 mb-3">{t.fundsLabel}</p>
              <div className="space-y-2.5">
                {t.funds.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className={f.hot ? 'text-white' : 'text-white/65'}>{f.label}</span>
                      <span className={`tabular-nums ${f.hot ? 'text-teal-300' : 'text-white/50'}`}>{f.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                      <div className={`h-full rounded-full ${f.hot ? 'bg-teal-300' : 'bg-teal-500/50'}`} style={{ width: `${f.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }}
          className="mt-8 text-center text-base text-white/70 font-light"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: THE MODEL — new theme (reuses model content), simplified
// =============================================================================

function ModelNewSlide({ t }: { t: typeof translations.en.model }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: therapist (pays) beside patient (free) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TherapistFigure className="absolute bottom-0 -left-6 h-56 w-auto opacity-[0.05]" />
        <PatientFigure flip className="absolute bottom-0 left-[13%] h-48 w-auto opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight tracking-tight"
          >
            {t.headline} <span className="text-teal-400">{t.headline2}</span>
          </motion.h1>
        </div>

        {/* Split screen: why they pay | how it grows */}
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {/* LEFT — the retention math */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-7 flex flex-col"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-7">{t.whyPayLabel}</p>

            {/* €49 sliver against €3,600 earned */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-white/50">{t.earnedLabel}</span>
                <span className="text-sm font-semibold text-teal-300">{t.priceChip}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: '1.4%' }} transition={{ duration: 0.8, delay: 0.7 }}
                  className="h-full rounded-full bg-teal-400 min-w-[6px]"
                />
              </div>
              <p className="text-[11px] text-white/40 mt-2">{t.priceNote}</p>
            </div>

            {/* Annual anchor — the whole year is small */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
              className="mt-9 flex items-baseline gap-3"
            >
              <span className="text-4xl sm:text-5xl font-light text-white tracking-tight">{t.annualValue}</span>
              <span className="text-sm text-white/45 leading-tight">
                {t.annualLabel}
                <br />
                <span className="text-white/30">{t.annualMath}</span>
              </span>
            </motion.div>

            <div className="mt-auto pt-8">
              <div className="h-px w-full bg-white/10" />
              {/* the punchline */}
              <p className="mt-6 text-lg sm:text-xl font-light text-white leading-snug">
                {t.retentionLine}
              </p>
              {t.footnoteSource && (
                <a href={t.footnoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 text-[10px] text-white/30 hover:text-teal-300 transition-colors">
                  {t.footnoteSource}<ArrowUpRight className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </motion.div>

          {/* RIGHT — how it grows (patient-only CAC, no circular diagram) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
            className="rounded-2xl border border-teal-400/25 bg-teal-500/[0.06] p-6 sm:p-7 flex flex-col"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-teal-300/70 mb-6">{t.howGrowsLabel}</p>

            <div className="flex flex-col gap-5">
              {t.growItems.map((g, i) => (
                <motion.div
                  key={g.label}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.6 + i * 0.15 }}
                  className="flex gap-3.5"
                >
                  <span className="mt-0.5 text-[11px] font-mono text-teal-400/60 shrink-0">0{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-teal-200 uppercase tracking-wide">{g.label}</p>
                    <p className="mt-1 text-sm text-white/70 leading-relaxed">{g.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: THE LANDSCAPE — new theme (reuses landscape content), simplified
// =============================================================================

function LandscapeNewSlide({ t }: { t: typeof translations.en.landscape }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-8">
      <div className="pointer-events-none absolute -top-24 left-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-3"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight tracking-tight"
          >
            {t.headline1} <span className="text-white/45">{t.headline2}</span>
          </motion.h1>
        </div>

        {/* Scattered tools today  →  one Bloomsline */}
        <div className="mt-10 grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
          {/* the pile */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4 text-center">{t.todayLabel}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {t.groups.map((g) => (
                <div key={g.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-[10px] uppercase tracking-wide text-white/35">{g.label}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {g.tools.map((tt) => (
                      <span key={tt} className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/55 whitespace-nowrap">{tt}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* arrow */}
          <ArrowRight className="w-7 h-7 text-teal-400/70 mx-auto rotate-90 md:rotate-0 shrink-0" />

          {/* one platform */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
            className="rounded-2xl border border-teal-400/40 bg-teal-500/10 p-5 shadow-[0_0_30px_-8px_rgba(45,212,191,0.4)]"
          >
            <p className="text-lg font-semibold text-teal-200">Bloomsline</p>
            <p className="text-sm text-white/80 mt-1.5">{t.usLine1}</p>
            <p className="text-sm text-teal-300/90 mt-1">{t.usLine2}</p>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1 }}
          className="mt-8 text-center text-sm sm:text-base text-white/55 max-w-2xl mx-auto"
        >
          {t.takeaway}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 9: THE FOUNDERS — new theme (reuses team content)
// =============================================================================

function TeamNewSlide({ t }: { t: typeof translations.en.team }) {
  const founders = [
    { name: t.sarahName, role: t.sarahRole, years: t.sarahYears, bio: t.sarahBio, education: t.sarahEducation, workedWith: t.sarahWorkedWith, img: '/team-sarah.jpg', flag: '🇫🇷', linkedin: 'https://www.linkedin.com/in/sarah-lagzouli/' },
    { name: t.adityaName, role: t.adityaRole, years: t.adityaYears, bio: t.adityaBio, education: t.adityaEducation, workedWith: t.adityaWorkedWith, img: '/team-aditya.png', flag: '🇮🇳', linkedin: 'https://www.linkedin.com/in/adi-channe/' },
  ]
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-8">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-4"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight tracking-tight"
          >
            {t.headline}
          </motion.h1>
        </div>

        {/* Founders */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4 sm:gap-5">
          {founders.map((f, i) => (
            <motion.div
              key={f.name}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.img} alt={f.name} className="w-12 h-12 rounded-full object-cover shrink-0" />
                <div>
                  <p className="text-base font-semibold text-white leading-tight flex items-center gap-2">
                    {f.name}
                    <span aria-hidden className="text-base leading-none">{f.flag}</span>
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${f.name} on LinkedIn`} className="text-sky-400 hover:text-sky-300 transition-colors"><LinkedInIcon className="w-4 h-4" /></a>
                  </p>
                  <p className="text-xs text-teal-400/80">{f.role}</p>
                </div>
              </div>
              <p className="text-[11px] text-white/40 mt-3">{f.years}</p>
              <p className="text-sm text-white/70 mt-2 leading-snug">{f.bio}</p>
              <p className="text-[11px] text-white/40 mt-3"><span className="text-white/30">{t.educationLabel}: </span>{f.education}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] uppercase tracking-wide text-white/30 mr-1 self-center">{t.workedWithLabel}</span>
                {f.workedWith.map((w) => (
                  <span key={w} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/60">{w}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why us */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {t.whyUs.map((w, i) => (
            <motion.div
              key={w.t}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
            >
              <p className="text-sm font-semibold text-white flex items-start gap-2"><Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />{w.t}</p>
              <p className="text-xs text-white/50 mt-1 leading-snug pl-6">{w.d}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-6 text-center text-[11px] text-white/35"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 10: THE SILENCE
// =============================================================================

function SilenceSlide({ t }: { t: typeof translations.en.silence }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-400 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline2}
        </motion.h2>

        {/* Two column contrast — what breaks on each side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 max-w-4xl"
        >
          <div>
            <p className="text-xs tracking-[0.2em] text-teal-700 uppercase mb-4">{t.practitionerLabel}</p>
            <ul className="space-y-2">
              {t.practitionerItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-900 font-light">{item}</li>
              ))}
            </ul>
          </div>
          <div className="md:border-l border-neutral-200 md:pl-12">
            <p className="text-xs tracking-[0.2em] text-teal-700 uppercase mb-4">{t.patientLabel}</p>
            <ul className="space-y-2">
              {t.patientItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Stats footer — two rows, each pairing a short stat with a long one so
            the wide cost/treatment lines get full width and never orphan-wrap. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="pt-8 border-t border-neutral-200 space-y-3"
        >
          {[[t.stats[0], t.stats[3]], [t.stats[1], t.stats[2]]].map((row, r) => (
            <div key={r} className="flex flex-wrap gap-x-10 gap-y-2">
              {row.map((stat, i) => stat && (
                <div key={i} className="flex items-baseline gap-2">
                  <span className="text-2xl font-light text-neutral-900">{stat.value}</span>
                  <span className="text-xs text-neutral-900">{stat.label}</span>
                  <a
                    href={stat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-400 hover:text-teal-700 underline decoration-dotted underline-offset-2 transition-colors"
                  >
                    {stat.source} ↗
                  </a>
                </div>
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 3: WHY IT MATTERS — consequences of the problem
// =============================================================================

function WhyItMattersSlide({ t }: { t: typeof translations.en.whyItMatters }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-neutral-950 flex items-center justify-center px-6 sm:px-10 py-10">
      <div className="pointer-events-none absolute -top-24 right-1/4 w-[520px] h-[520px] bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl" />

      {/* Background scene: the patient drifting away from the therapist (dropout) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <TherapistFigure className="absolute bottom-0 left-[6%] h-56 w-auto opacity-[0.06]" />
        <PatientFigure className="absolute bottom-0 left-[26%] h-48 w-auto opacity-[0.04]" />
        <PatientFigure className="absolute bottom-0 left-[42%] h-40 w-auto opacity-[0.02]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-[11px] sm:text-xs tracking-[0.35em] text-teal-400 uppercase mb-5"
          >
            {t.label}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-[1.15] tracking-tight"
          >
            {t.headline1}
            <br />
            <span className="text-teal-400">{t.headline2}</span>
          </motion.h1>
        </div>

        {/* Three costs — the third is the money punch */}
        <div className="mt-11 grid md:grid-cols-3 gap-4">
          {/* cost 1 — time */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">{t.item1Label}</p>
            <p className="text-base sm:text-lg font-light text-white/85 leading-snug">{t.item1Body}</p>
          </motion.div>

          {/* cost 2 — risk */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">{t.item2Label}</p>
            <p className="text-base sm:text-lg font-light text-white/85 leading-snug">{t.item2Body}</p>
          </motion.div>

          {/* cost 3 — the money */}
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }}
            className="rounded-2xl border border-teal-400/30 bg-teal-500/[0.07] p-5 sm:p-6 shadow-[0_0_30px_-10px_rgba(45,212,191,0.4)]"
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-teal-300/70 mb-3">{t.incomeLabel}</p>
            <p className="text-3xl sm:text-4xl font-light text-white tracking-tight">{t.incomeValue}</p>
            <p className="mt-2 text-sm text-white/70 leading-snug">{t.incomeBody}</p>
          </motion.div>
        </div>

        {/* The dreaded sentence */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.85 }}
          className="mt-11 border-t border-white/10 pt-8 text-center"
        >
          <p className="text-xl sm:text-2xl font-light text-white/90 italic leading-snug max-w-3xl mx-auto">
            {t.quote}
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/40">{t.quoteCaption}</p>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 4: ORIGIN — "We built the wrong thing first"
// =============================================================================

function OriginSlide({ t }: { t: typeof translations.en.origin }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        {/* Takeaway quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="border-l-2 border-teal-600 pl-6 py-1 mb-14"
        >
          <p className="text-xl lg:text-2xl font-light italic text-neutral-900 leading-snug whitespace-nowrap">
            &ldquo;{t.quote}&rdquo;
          </p>
        </motion.blockquote>

        {/* Horizontal timeline — the journey */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {(t.timeline as Array<{ period: string; label: string; body: string; accent?: boolean }>).map((item, i, arr) => {
            const isLast = i === arr.length - 1
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="relative"
              >
                {!isLast && (
                  <div className="hidden md:block absolute top-[7px] left-5 right-[-1.5rem] h-px bg-neutral-300" />
                )}
                <div
                  className={`w-4 h-4 rounded-full border-2 mb-5 relative z-10 ${
                    item.accent ? 'bg-teal-600 border-teal-600 ring-4 ring-teal-100' : 'bg-neutral-800 border-neutral-800'
                  }`}
                />
                <div className="flex items-baseline gap-2 mb-2">
                  <span className={`text-lg font-medium ${item.accent ? 'text-teal-700' : 'text-neutral-900'}`}>{item.period}</span>
                  <span className={`text-[10px] tracking-[0.2em] uppercase font-mono ${item.accent ? 'text-teal-600' : 'text-neutral-400'}`}>{item.label}</span>
                </div>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">{item.body}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 4: PRODUCT — "What we built"
// =============================================================================

function ProductSlide({ t }: { t: typeof translations.en.product }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-8"
        >
          {t.label}
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-6"
        >
          {t.hero1}
        </motion.h2>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg text-neutral-500 font-light leading-relaxed max-w-2xl mb-12"
        >
          {(t as any).supportingText}
        </motion.p>

        {/* 2x2 temporal cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
          {((t as any).cards as { icon: string; title: string; oldWay: string; newWay: string }[]).map((card, i) => {
            const IconComponent = { clock: Clock, heart: Heart, message: MessageSquare, zap: Zap }[card.icon] || Clock;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="rounded-xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <IconComponent className="w-4.5 h-4.5 text-teal-600" />
                  </div>
                  <h3 className="text-base font-medium text-neutral-900">{card.title}</h3>
                </div>
                <p className="text-sm text-neutral-400 line-through mb-1">{card.oldWay}</p>
                <p className="text-sm text-neutral-700">{card.newWay}</p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 5: BOUNDARY — objection handling
// =============================================================================

function BoundarySlide({ t }: { t: typeof translations.en.boundary }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        {/* Two hero lines */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.hero1}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-7"
        >
          {t.hero2}
        </motion.h2>

        {/* The therapeutic frame — the 6 principles live inside it */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
          className="relative border border-teal-200 rounded-2xl px-6 md:px-10 pt-7 pb-6 mb-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {(t.principles as Array<{ name: string; respect: string }>).map((p, i) => (
              <div key={i}>
                <span className="block text-sm font-semibold text-teal-700 mb-1">{p.name}</span>
                <p className="text-sm text-neutral-600 font-light leading-relaxed">{p.respect}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 6: WHY NOW — dark slide
// =============================================================================

function WhyNowSlide({ t }: { t: typeof translations.en.whyNow }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-400 uppercase mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.1] tracking-tight mb-12"
        >
          {t.headline}
        </motion.h2>

        <div className="space-y-6 mb-10 max-w-4xl">
          {[
            { title: t.item1Title, body: t.item1Body, sources: t.item1Sources as Array<{ label: string; url: string }>, num: '01' },
            { title: t.item2Title, body: t.item2Body, sources: t.item2Sources as Array<{ label: string; url: string }>, num: '02' },
            { title: t.item3Title, body: t.item3Body, sources: t.item3Sources as Array<{ label: string; url: string }>, num: '03' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              className="flex gap-8 items-start"
            >
              <span className="text-2xl font-light text-teal-400/50 mt-1">{item.num}</span>
              <div className="flex-1">
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mb-2">
                  <h3 className="text-2xl font-medium text-white">{item.title}</h3>
                  {item.sources && item.sources.map((src, j) => (
                    <a
                      key={j}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-neutral-600 hover:text-teal-400 underline decoration-dotted underline-offset-2 transition-colors"
                    >
                      {src.label} ↗
                    </a>
                  ))}
                </div>
                <p className="text-lg text-neutral-400 font-light leading-relaxed">{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-xl text-teal-300 italic font-light pt-8 border-t border-white/10 max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: SECURITY — three horizons
// =============================================================================

function SecuritySlide({ t }: { t: typeof translations.en.security }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.15] tracking-tight mb-3"
        >
          {t.headline}
        </motion.h2>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-teal-700 leading-[1.15] tracking-tight mb-8"
        >
          {t.headline2}
        </motion.h3>

        {t.intro && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base text-neutral-500 font-light mb-10 max-w-3xl"
          >
            {t.intro}
          </motion.p>
        )}

        {/* Three pillars: a plain claim + the investor edge it creates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-14 mb-12 mt-2">
          {t.pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
            >
              <h3 className="text-lg font-semibold text-teal-700 pb-3 mb-4 border-b border-neutral-200">{pillar.name}</h3>
              <p className="text-[15px] text-neutral-500 font-light leading-relaxed mb-3 md:min-h-[3rem]">{pillar.claim}</p>
              <p className="text-[15px] text-neutral-900 font-normal leading-relaxed">{pillar.edge}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-teal-700 italic font-light max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: LANDSCAPE — competitors mapped to the stage they own; the
// between-sessions slot is empty today, and that's ours.
// =============================================================================

function LandscapeSlide({ t }: { t: typeof translations.en.landscape }) {
  const CAP = 'text-[10px] tracking-[0.2em] uppercase font-mono'
  // Each competitor owns one narrow moment inside the clinic hour. The 167
  // hours between is the wide, unclaimed slice, and that's ours.
  const clinic = [
    { stage: t.stage1, owner: t.owner1 },
    { stage: t.stage2, owner: t.owner2 },
    { stage: t.stage3, owner: t.owner3 },
    { stage: t.stage4, owner: t.owner4 },
  ]
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-5"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-1"
        >
          {t.headline1}
        </motion.h2>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-teal-700 leading-[1.1] tracking-tight mb-9"
        >
          {t.headline2}
        </motion.h2>

        {/* Care-journey band: the clinic hour (crowded) vs the 167 hours between (ours) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {/* captions */}
          <div className="flex gap-4 mb-2.5">
            <p className={`basis-[38%] shrink-0 ${CAP} text-neutral-400`}>{t.clinicLabel}</p>
            <p className={`flex-1 ${CAP} text-teal-700`}>{t.betweenLabel}</p>
          </div>

          {/* bars */}
          <div className="flex gap-4 items-stretch">
            {/* clinic hour — four narrow slices, one owner each */}
            <div className="basis-[38%] shrink-0 rounded-2xl border border-neutral-200 bg-white/50 p-3">
              <div className="grid grid-cols-2 gap-2">
                {clinic.map((c) => (
                  <div key={c.stage} className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
                    <p className="text-[9px] tracking-[0.15em] uppercase text-neutral-400 font-mono mb-1">{c.stage}</p>
                    <p className="text-xs font-light text-neutral-700 leading-snug">{c.owner}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* the 167 hours between — one wide slice, ours */}
            <div className="flex-1 rounded-2xl bg-teal-700 p-6 relative flex flex-col justify-center min-h-[168px]">
              <div className="inline-flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-200" />
                <span className="text-xl tracking-wide text-white"><span className="font-medium">blooms</span><span className="font-light">line</span></span>
                <span className="ml-1.5 text-[10px] tracking-[0.2em] uppercase font-mono text-teal-200/80">{t.betweenTag}</span>
              </div>
              <p className="text-sm text-teal-50/90 font-light max-w-md leading-relaxed">{t.betweenBody}</p>

              {/* the one between-hours tool, and why it doesn't count */}
              <div className="mt-4 inline-flex items-center gap-2 self-start rounded-full border border-dashed border-teal-300/50 px-3 py-1">
                <span className="text-xs font-light text-teal-100">{t.soloTool}</span>
                <span className="text-[11px] text-teal-200/70">· {t.soloNote}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* the why, two-tone */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-lg sm:text-xl font-light leading-snug pt-6 mt-7 border-t border-neutral-200 max-w-4xl"
        >
          <span className="text-neutral-900">{t.whyA}</span>{' '}
          <span className="text-teal-700">{t.whyB}</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.05 }}
          className="text-sm text-neutral-500 italic font-light mt-3"
        >
          {t.quote} <span className="not-italic text-neutral-400">· {t.quoteAttr}</span>
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: GO-TO-MARKET — four horizons + what-we-don't-do strip
// =============================================================================

function GTMSlide({ t }: { t: typeof translations.en.gtm }) {
  const accents = ['teal', 'teal', 'amber', 'neutral'] as const
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <div className="mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.15] tracking-tight"
          >
            {t.headline}
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-light text-teal-700 leading-[1.15] tracking-tight"
          >
            {t.headline2}
          </motion.h3>
        </div>

        {/* Widening spread — trust radiates outward, then spreads on its own */}
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {t.columns.map((col, i) => {
              const dotCounts = [1, 4, 9, 16]
              const dots = dotCounts[i]
              const accent = accents[i]
              const dotColor = accent === 'teal' ? 'bg-teal-500' : accent === 'amber' ? 'bg-amber-400' : 'bg-neutral-400'
              const tagColor = accent === 'teal' ? 'text-teal-700' : accent === 'amber' ? 'text-amber-700' : 'text-neutral-500'
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + i * 0.12 }}
                  className="flex flex-col"
                >
                  {/* growing cluster of people = the spread */}
                  <div className="h-14 flex items-end mb-4">
                    <div className="flex flex-wrap content-end gap-1 w-16">
                      {Array.from({ length: dots }).map((_, k) => (
                        <span
                          key={k}
                          className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                          style={{ opacity: 0.45 + (0.55 * (k + 1)) / dots }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className={`text-[10px] tracking-[0.25em] uppercase font-mono mb-1 ${tagColor}`}>{col.tag}</span>
                  <h4 className="text-base font-medium text-neutral-900 mb-2 leading-snug">{col.title}</h4>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed mb-3">{col.action}</p>
                  <span className={`inline-block self-start text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    accent === 'teal' ? 'text-teal-700 bg-teal-50' : accent === 'amber' ? 'text-amber-700 bg-amber-50' : 'text-neutral-600 bg-neutral-100'
                  }`}>{col.goal}</span>
                </motion.div>
              )
            })}
          </div>

          {/* baseline — it spreads on its own */}
          <div className="mt-12">
            <div className="h-0.5 rounded-full bg-gradient-to-r from-neutral-200 via-teal-300 to-teal-500" />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-teal-700 italic font-light max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE: MARKET — top-down funnel + Europe/World multiplier
// =============================================================================

function MarketSlide({ t }: { t: typeof translations.en.market }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.15] tracking-tight mb-10"
        >
          <span className="text-neutral-900">{t.headline}</span>{' '}
          <span className="text-teal-700">{t.headline2}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs tracking-[0.25em] uppercase text-neutral-500 font-medium mb-6"
        >
          {t.franceTitle}
        </motion.p>

        {/* Funnel — narrowing rows (tightened to save vertical space) */}
        <div className="space-y-2 mb-8">
          {t.funnel.map((row, i) => {
            const isLast = i === t.funnel.length - 1
            const isPenultimate = i === t.funnel.length - 2
            const isHighlight = isLast || isPenultimate
            const widthClasses = ['w-full', 'w-[92%]', 'w-[80%]', 'w-[66%]', 'w-[50%]', 'w-[36%]']
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className={`${widthClasses[i] || 'w-full'} border-l-2 ${isHighlight ? 'border-teal-500' : 'border-neutral-200'} pl-5 py-1.5 flex items-baseline gap-4`}
              >
                <span className={`text-2xl sm:text-3xl font-light tabular-nums ${isHighlight ? 'text-teal-700' : 'text-neutral-900'} min-w-[5rem]`}>
                  {row.value}
                </span>
                <div className="flex-1 flex items-baseline gap-3 flex-wrap">
                  <span className={`text-sm sm:text-base font-light ${isHighlight ? 'text-neutral-800' : 'text-neutral-600'}`}>
                    {row.label}
                  </span>
                  {row.url ? (
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-neutral-400 hover:text-teal-700 underline decoration-dotted underline-offset-2 transition-colors whitespace-nowrap"
                    >
                      {row.source} ↗
                    </a>
                  ) : (
                    <span className="text-[10px] text-neutral-400 italic whitespace-nowrap">
                      {row.source}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Europe + World strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 pt-6 mb-6"
        >
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-medium min-w-[3.5rem]">
              {t.europeLabel}
            </span>
            <div>
              <span className="text-xl font-light text-neutral-900 mr-2">{t.europeValue}</span>
              <span className="text-sm text-neutral-500 font-light">{t.europeBody}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 font-medium min-w-[3.5rem]">
              {t.worldLabel}
            </span>
            <div>
              <span className="text-xl font-light text-neutral-900 mr-2">{t.worldValue}</span>
              <span className="text-sm text-neutral-500 font-light">{t.worldBody}</span>{' '}
              {t.worldUrl && (
                <a
                  href={t.worldUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-neutral-400 hover:text-teal-700 underline decoration-dotted underline-offset-2 transition-colors whitespace-nowrap"
                >
                  {t.worldSource} ↗
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Punchline — the path investors actually back */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="text-lg sm:text-xl font-light text-teal-700 leading-snug tracking-tight"
        >
          {t.punch}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 6: MODEL — B2B2C
// =============================================================================

function ModelSlide({ t }: { t: typeof translations.en.model }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-10"
        >
          {t.headline}
        </motion.h2>

        {/* Flow — horizontal progression: practitioner → patients → network */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-end gap-x-5 gap-y-4 mb-12"
        >
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-1">{t.flow1Label}</p>
            <p className="text-xl lg:text-2xl font-light text-neutral-900">{t.flow1Value}</p>
          </div>
          <ArrowRight className="w-6 h-6 text-neutral-300 shrink-0 mb-1.5" />
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-1">{t.flow2Label}</p>
            <p className="text-xl lg:text-2xl font-light text-teal-700">{t.flow2Value}</p>
          </div>
          <ArrowRight className="w-6 h-6 text-neutral-300 shrink-0 mb-1.5" />
          <div>
            <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-1">{t.flow3Label}</p>
            <p className="text-xl lg:text-2xl font-light text-neutral-900">{t.flow3Value}</p>
          </div>
        </motion.div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.revenueTitle}</p>
            <ul className="space-y-2">
              {t.revenueItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="md:border-l border-neutral-200 md:pl-12"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.compoundTitle}</p>
            <ul className="space-y-2">
              {t.compoundItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-sm text-neutral-500 italic pt-8 border-t border-neutral-200"
        >
          {t.footnote}{' '}
          <a
            href={t.footnoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="not-italic text-neutral-400 hover:text-teal-700 underline underline-offset-2 decoration-neutral-300"
          >
            {t.footnoteSource}
          </a>
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 7: WHAT'S REAL — traction
// =============================================================================

function RealSlide({ t }: { t: typeof translations.en.real }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            { label: t.builtLabel, items: t.builtItems, Icon: Hammer, accent: 'teal' as const, check: true },
            { label: t.learnedLabel, items: t.learnedItems, Icon: Lightbulb, accent: 'teal' as const, check: true },
            { label: t.honestLabel, items: t.honestItems, Icon: Heart, accent: 'neutral' as const, check: false },
          ].map((col, i) => {
            const isTeal = col.accent === 'teal'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                className={`rounded-2xl border p-6 ${isTeal ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200'}`}
              >
                <div className="flex items-center gap-2.5 mb-5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isTeal ? 'bg-teal-50' : 'bg-neutral-100'}`}>
                    <col.Icon className={`w-4 h-4 ${isTeal ? 'text-teal-700' : 'text-neutral-500'}`} strokeWidth={2} />
                  </div>
                  <p className={`text-xs tracking-[0.25em] uppercase font-mono ${isTeal ? 'text-teal-700' : 'text-neutral-500'}`}>{col.label}</p>
                </div>
                <ul className="space-y-3">
                  {col.items.map((item, j) => (
                    <li key={j} className="text-sm text-neutral-700 font-light leading-snug flex gap-2.5">
                      {col.check
                        ? <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                        : <span className="text-neutral-300 shrink-0 mt-0.5 leading-none">•</span>}
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="border-l-2 border-teal-600 pl-6 py-2 max-w-3xl"
        >
          <p className="text-xl text-neutral-900 italic font-light leading-relaxed">
            &ldquo;{t.quote}&rdquo;
          </p>
        </motion.blockquote>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 8: TEAM
// =============================================================================

function TeamSlide({ t }: { t: typeof translations.en.team }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-16">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-5"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl lg:text-3xl font-light text-neutral-600 leading-snug tracking-tight mb-8"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-5 items-start rounded-3xl border border-neutral-200 bg-white/50 p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/team-sarah.jpg" alt={t.sarahName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            <div>
              <h3 className="text-xl font-medium text-neutral-900 flex items-center gap-2">{t.sarahName}<span aria-hidden className="text-lg leading-none">🇫🇷</span><a href="https://www.linkedin.com/in/sarah-lagzouli/" target="_blank" rel="noopener noreferrer" aria-label={`${t.sarahName} on LinkedIn`} className="ml-1.5 text-[#0A66C2] hover:text-[#004182] transition-colors"><LinkedInIcon className="w-[18px] h-[18px]" /></a></h3>
              <p className="text-sm text-neutral-500">{t.sarahRole}</p>
              <p className="text-[11px] text-neutral-400 mb-2">{t.sarahYears}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed mb-2">{t.sarahBio}</p>
              {t.sarahEducation && (
                <p className="text-xs text-neutral-500 mb-3"><span className="text-neutral-400">{t.educationLabel}: </span>{t.sarahEducation}</p>
              )}
              <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-2">{t.workedWithLabel}</p>
              <div className="flex flex-wrap gap-2">
                {t.sarahWorkedWith.map((c) => (
                  <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">{c}</span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex gap-5 items-start rounded-3xl border border-neutral-200 bg-white/50 p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/team-aditya.png" alt={t.adityaName} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            <div>
              <h3 className="text-xl font-medium text-neutral-900 flex items-center gap-2">{t.adityaName}<span aria-hidden className="text-lg leading-none">🇮🇳</span><a href="https://www.linkedin.com/in/adi-channe/" target="_blank" rel="noopener noreferrer" aria-label={`${t.adityaName} on LinkedIn`} className="ml-1.5 text-[#0A66C2] hover:text-[#004182] transition-colors"><LinkedInIcon className="w-[18px] h-[18px]" /></a></h3>
              <p className="text-sm text-neutral-500">{t.adityaRole}</p>
              <p className="text-[11px] text-neutral-400 mb-2">{t.adityaYears}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed mb-2">{t.adityaBio}</p>
              {t.adityaEducation && (
                <p className="text-xs text-neutral-500 mb-3"><span className="text-neutral-400">{t.educationLabel}: </span>{t.adityaEducation}</p>
              )}
              <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 mb-2">{t.workedWithLabel}</p>
              <div className="flex flex-wrap gap-2">
                {t.adityaWorkedWith.map((c) => (
                  <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-700">{c}</span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Why us — the rational case beneath the founder cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-6"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-teal-700 mb-4">{t.whyUsLabel}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {t.whyUs.map((w) => (
              <div key={w.t} className="rounded-2xl border border-neutral-200 bg-white/50 px-5 py-4">
                <div className="text-sm font-semibold text-neutral-900 mb-1.5">{w.t}</div>
                <p className="text-sm font-light text-neutral-600 leading-relaxed">{w.d}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="text-sm text-neutral-500 italic"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 9: VISION — The long game
// =============================================================================

function VisionSlide({ t }: { t: typeof translations.en.vision }) {
  // One open at a time (accordion): opening a card closes the others.
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i))

  const subLabels = [(t as any).whatWeDoLabel, (t as any).whyItMattersLabel]

  const phases = [
    {
      tag: t.todayTag,
      title: t.todayTitle,
      sub: (t as any).todaySub,
      body: t.todayBody,
      items: [(t as any).todayWhatWeDo, (t as any).todayWhyItMatters],
      accent: true,
    },
    {
      tag: t.nextTag,
      title: t.nextTitle,
      sub: (t as any).nextSub,
      body: t.nextBody,
      items: [(t as any).nextWhatWeDo, (t as any).nextWhyItMatters],
      accent: false,
    },
    {
      tag: t.laterTag,
      title: t.laterTitle,
      sub: (t as any).laterSub,
      body: t.laterBody,
      items: [(t as any).laterWhatWeDo, (t as any).laterWhyItMatters],
      accent: false,
    },
  ]

  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-12"
        >
          {t.headline2}
        </motion.h2>

        {/* The climb — three ascending steps: tool → proof → the standard */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-5 mb-8">
          {phases.map((phase, i) => {
            const heights = ['md:min-h-[150px]', 'md:min-h-[210px]', 'md:min-h-[280px]']
            const isLast = i === phases.length - 1
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.2 }}
                className={`flex-1 rounded-2xl border p-6 flex flex-col justify-end ${heights[i]} ${isLast ? 'bg-teal-700 border-teal-700' : 'bg-white border-neutral-200'}`}
              >
                <p className={`text-xs tracking-[0.25em] uppercase font-mono mb-2 ${isLast ? 'text-teal-100' : 'text-teal-700'}`}>
                  {phase.tag}
                </p>
                <p className={`font-light leading-snug tracking-tight ${isLast ? 'text-2xl lg:text-3xl text-white' : 'text-xl lg:text-2xl text-neutral-900'}`}>
                  {phase.title}
                </p>
                <p className={`text-sm font-light leading-relaxed mt-2 ${isLast ? 'text-teal-50' : 'text-neutral-500'}`}>
                  {phase.sub}
                </p>
                <button
                  onClick={() => toggle(i)}
                  className={`pdf-hide mt-4 self-start inline-flex items-center gap-1.5 text-[11px] tracking-wide font-medium transition-colors ${
                    isLast ? 'text-teal-100 hover:text-white' : 'text-neutral-400 hover:text-teal-700'
                  }`}
                >
                  <span>{openIndex === i ? t.showLess : t.viewMore}</span>
                  {openIndex === i
                    ? <ChevronUp className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* Detail — expands below the climb when a card's "View more" is clicked */}
        <div className="mb-8">
          {phases.map((phase, i) => (
            <AnimatePresence initial={false} key={i}>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 pb-4">
                    <span className="text-[10px] tracking-[0.25em] uppercase font-mono text-teal-700">{phase.tag}</span>
                    <p className="text-base text-neutral-600 font-light leading-relaxed mt-2 max-w-3xl">{phase.body}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-4 pt-4 border-t border-neutral-200 max-w-3xl">
                      {phase.items.map((item, j) => (
                        <div key={j} className="flex flex-col gap-1">
                          <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-400 font-mono">
                            {subLabels[j]}
                          </span>
                          <span className="text-sm text-neutral-700 font-light leading-relaxed">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-sm text-neutral-500 italic pt-8 border-t border-neutral-200 max-w-3xl"
        >
          {t.footnote}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 10: ASK
// =============================================================================

function AskSlide({ t }: { t: typeof translations.en.ask }) {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto">
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-700 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-3"
        >
          {t.headline}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-xl text-neutral-500 font-light mb-16"
        >
          {t.subhead}
        </motion.p>

        {/* Use of funds */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="pt-8 border-t border-neutral-200 mb-10"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">
            {t.fundsLabel}
            <span className="ml-3 tracking-normal normal-case text-neutral-300">{(t as any).fundsHint}</span>
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {t.fundsItems.map((item, i) => {
              const isOpen = active === i
              return (
                <button
                  key={i}
                  onClick={() => setActive(isOpen ? null : i)}
                  className="flex items-baseline gap-2 group text-left"
                >
                  <span className={`text-2xl font-light transition-colors ${isOpen ? 'text-teal-700' : 'text-neutral-900'}`}>{item.value}</span>
                  <span className={`pdf-static-underline text-sm border-b border-dashed transition-colors ${isOpen ? 'text-teal-700 border-teal-300' : 'text-neutral-500 border-neutral-300 group-hover:text-neutral-900'}`}>{item.label}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence initial={false} mode="wait">
            {active !== null && (
              <motion.p
                key={active}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="mt-5 text-sm text-neutral-600 font-light leading-relaxed max-w-3xl"
              >
                {(t.fundsItems[active] as any).why}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-neutral-600 italic font-light max-w-3xl"
        >
          {t.closing}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 11: CLOSE
// =============================================================================

function CloseSlide({ t }: { t: typeof translations.en.close }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden px-8">
      {/* Subtle blob echoing hero */}
      <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-gradient-to-br from-teal-100/40 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-3 mb-16"
        >
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.15] tracking-tight">
            {t.line1}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.15] tracking-tight">
            {t.line2}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-400 leading-[1.15] tracking-tight">
            {t.line3}
          </p>
          <p className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.15] tracking-tight pt-2">
            {t.line4}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-2xl text-neutral-700 font-light mb-6"
        >
          {t.cta}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-wrap gap-4 mb-16"
        >
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="px-10 py-5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-base font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              {t.bookCall}
            </Button>
          </a>
          <a href={`mailto:${t.emailUs}`}>
            <Button variant="outline" className="px-10 py-5 border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-full text-base font-medium">
              <Mail className="w-4 h-4 mr-2" />
              {t.emailUs}
            </Button>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="text-xs text-neutral-400 tracking-wide"
        >
          {t.copyright}
        </motion.p>
      </div>
    </div>
  )
}

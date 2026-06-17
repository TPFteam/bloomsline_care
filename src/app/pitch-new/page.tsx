'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
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
} from 'lucide-react'
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
      model: 'Model',
      team: 'Team',
      vision: 'Vision',
      ask: 'The Ask',
      close: 'Close',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'There\'s a part of therapy no one sees.',
      title2: 'It\'s where the work actually happens.',
      changeTooltip: 'Mood shifts. Pattern breaks. Small wins. Hard days.',
      subtitle: 'This part is unstructured, unmeasured, and unusable.',
      stage: 'The continuity layer for clinical practice.',
      cta: 'See what\'s missing',
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
          value: '~35%',
          label: 'of patients drop out of therapy',
          source: 'PMC meta-analysis, 146 studies, 2022',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9667417/',
        },
        {
          value: '~50%',
          label: 'relapse — most within 6 months',
          source: 'Depression relapse meta-analyses',
          url: 'https://bjgp.org/content/70/691/54',
        },
        {
          value: '9%',
          label: 'receive adequate care for depression',
          source: 'WHO 2025',
          url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
        },
      ],
    },
    whyItMatters: {
      label: 'WHY IT MATTERS',
      headline1: 'This isn\'t just inefficient.',
      headline2: 'It changes the depth of care.',
      item1Label: 'TIME',
      item1Body: 'A quarter of every session lost to rebuilding context.',
      item2Label: 'SIGNALS',
      item2Body: 'Patterns, improvements, relapses are hard to catch in time.',
      item3Label: 'FEELING',
      item3Body: '"I\'m coming to therapy, but nothing\'s changing."',
      item4Label: 'BUSINESS',
      item4Body: 'Disengagement. Lower retention. Reputation at risk.',
      closing: '',
      stats: [
        {
          value: '35%',
          label: 'of clinician time goes to documentation',
          source: 'AHRQ Technical Brief, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/',
        },
        {
          value: '42%',
          label: 'of Gen Z in therapy — up 22% since 2022',
          source: 'Grow Therapy, 2025',
          url: 'https://growtherapy.com/blog/mental-health-statistics/',
        },
      ],
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
      supportingText: 'Everything in one place. Notes, sessions, and what actually happens between them.',
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
      headline: 'Mental health data is the highest-stakes category in EU law.',
      headline2: 'We treat it that way.',
      intro: 'Three layers — infrastructure, governance, AI safety.',
      liveTag: 'Live',
      soonTag: 'Soon',
      layers: [
        { name: 'Infrastructure', items: [
          { t: 'AES-256-GCM at rest, TLS 1.3 in transit', live: true },
          { t: 'Row-Level Security on every table', live: true },
          { t: 'EU data residency (AWS)', live: true },
        ] },
        { name: 'Governance', items: [
          { t: 'HDS certification — the French gate', live: false },
          { t: 'Fractional CISO, then in-house security team', live: false },
          { t: 'Pen test (ANSSI) · SOC 2 → ISO 27001', live: false },
        ] },
        { name: 'AI safety', items: [
          { t: 'Summarizes notes — never diagnoses, medicates, or intervenes', live: true },
          { t: 'Bounds written into the system prompts', live: true },
          { t: 'Every output traces back to source data', live: true },
        ] },
      ],
      closing: 'Security isn\'t a slide. It\'s the precondition.',
    },
    model: {
      label: 'THE MODEL',
      headline: 'Practitioners are our distribution.',
      flow1Label: '1 practitioner',
      flow1Value: '€29 / month',
      flow2Label: 'invites',
      flow2Value: 'their own patients',
      flow3Label: 'and refers',
      flow3Value: 'peers in their network',
      revenueTitle: 'Revenue',
      revenueItems: [
        '€29 / practitioner — our landing price',
        'Patients free — brought in at zero CAC',
        'High-margin SaaS',
        'Expansion: clinics, premium AI, B2C',
      ],
      compoundTitle: 'Why it compounds',
      compoundItems: [
        'Practitioners bring their own patients from day one',
        'Engagement is driven by the practitioner relationship',
        'Growth happens through practitioner networks',
      ],
      footnote: '15 sessions/week × €60 × ~4 weeks ≈ €3,600/month. We charge €29 — less than one session. Too small to ever cancel, with huge room to charge more.',
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
      headline: 'Trust first.',
      headline2: 'Growth follows.',
      intro: 'Therapists trust other therapists, not ads. We talked to 100 before writing any code — and we\'ll win the next 1,000 the same way.',
      columns: [
        {
          tag: 'Past',
          title: 'We started with trust.',
          num: '01',
          action: 'Talked to 100+ therapists and built our network — before any code.',
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
      closing: 'We win trust slowly, then it spreads on its own.',
    },
    market: {
      label: 'THE MARKET',
      headline: 'Start in France.',
      headline2: 'The path is bigger.',
      franceTitle: 'In France today',
      funnel: [
        { value: '69M', label: 'people live in France', source: 'INSEE 2026', url: 'https://www.insee.fr/fr/statistiques/8719824' },
        { value: '~8M', label: 'adults have depression each year (about 1 in 6)', source: 'Santé publique France 2024', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/rapportsynthese/episodes-depressifs-prevalence-et-recours-aux-soins-barometre-de-sante-publique-france-resultats-de' },
        { value: '77K', label: 'licensed psychologists — all officially registered', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '28K', label: 'work for themselves — these are who we sell to', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '1,000', label: 'our goal by Year 5 — about €350K a year', source: 'our target · 3.5% of them', url: '' },
      ],
      europeLabel: 'Europe',
      europeValue: '17× bigger',
      europeBody: '450M people. The rules we already follow in France work across Europe too.',
      worldLabel: 'World',
      worldValue: '1B+',
      worldBody: 'people live with mental health problems. Someday — not today.',
      worldSource: 'WHO 2025',
      worldUrl: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
      closing: 'We don\'t need the world. We need 1,000 French psychologists.',
    },
    team: {
      label: 'THE TEAM',
      headline: 'Two people. Built in-house. Near-zero burn.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Sales & Operations',
      sarahBio: 'The person practitioners trust. She listens before she sells — and that\'s why they stay.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Product & Technology',
      adityaBio: 'Built every screen you see. Leads the product — and makes sure it stays close to the problem.',
      quote: 'Two people. Everything in-house. Because this had to be built by people who feel the problem.',
      footnote: 'Actively looking for a clinical advisor. The clinical voice is in the product — not yet on the cap table.',
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
      todayWhatWeDo: 'For €29/month, a therapist gets a tool that makes every session sharper, and their patients stay connected to the work between sessions. Both sides feel it.',
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
      headline: 'Raising €1.1M pre-seed.',
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
      model: 'Modèle',
      team: 'Équipe',
      vision: 'Vision',
      ask: 'La Demande',
      close: 'Conclusion',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'Il y a une partie de la thérapie que personne ne voit.',
      title2: 'C\'est là que le vrai travail se fait.',
      changeTooltip: 'Humeurs. Ruptures de schémas. Petites victoires. Jours difficiles.',
      subtitle: 'Cette partie est désorganisée, non mesurée et inutilisable.',
      stage: 'La couche de continuité pour la pratique clinique.',
      cta: 'Voyez ce qui manque',
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
          value: '~35%',
          label: 'des patients abandonnent la thérapie',
          source: 'PMC méta-analyse, 146 études, 2022',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9667417/',
        },
        {
          value: '~50%',
          label: 'rechutent — la plupart sous 6 mois',
          source: 'Méta-analyses, rechute dépressive',
          url: 'https://bjgp.org/content/70/691/54',
        },
        {
          value: '9%',
          label: 'reçoivent des soins adéquats pour la dépression',
          source: 'OMS 2025',
          url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
        },
      ],
    },
    whyItMatters: {
      label: 'POURQUOI ÇA COMPTE',
      headline1: 'Ce n\'est pas juste inefficace.',
      headline2: 'Ça change la profondeur des soins.',
      item1Label: 'TEMPS',
      item1Body: 'Un quart de chaque séance perdu à reconstruire le contexte.',
      item2Label: 'SIGNAUX',
      item2Body: 'Patterns, progrès, rechutes difficiles à repérer à temps.',
      item3Label: 'RESSENTI',
      item3Body: '« Je viens en thérapie, mais rien ne change. »',
      item4Label: 'BUSINESS',
      item4Body: 'Désengagement. Rétention en baisse. Réputation en jeu.',
      closing: '',
      stats: [
        {
          value: '35%',
          label: 'du temps clinicien consacré à la documentation',
          source: 'AHRQ Technical Brief, 2024',
          url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/',
        },
        {
          value: '42%',
          label: 'de la Gen Z en thérapie — +22% depuis 2022',
          source: 'Grow Therapy, 2025',
          url: 'https://growtherapy.com/blog/mental-health-statistics/',
        },
      ],
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
      headline: 'Les données de santé mentale sont la catégorie la plus sensible du droit européen.',
      headline2: 'Nous les traitons comme telles.',
      intro: 'Trois couches — infrastructure, gouvernance, sécurité IA.',
      liveTag: 'En place',
      soonTag: 'En cours',
      layers: [
        { name: 'Infrastructure', items: [
          { t: 'AES-256-GCM au repos, TLS 1.3 en transit', live: true },
          { t: 'Row-Level Security sur chaque table', live: true },
          { t: 'Données hébergées en UE (AWS)', live: true },
        ] },
        { name: 'Gouvernance', items: [
          { t: 'Certification HDS — la porte française', live: false },
          { t: 'CISO externalisé, puis équipe sécurité interne', live: false },
          { t: 'Test d\'intrusion (ANSSI) · SOC 2 → ISO 27001', live: false },
        ] },
        { name: 'Sécurité IA', items: [
          { t: 'Synthétise les notes — ne diagnostique, médicamente, ni n\'intervient', live: true },
          { t: 'Limites inscrites dans les system prompts', live: true },
          { t: 'Chaque sortie traçable jusqu\'à la donnée source', live: true },
        ] },
      ],
      closing: 'La sécurité n\'est pas un slide. C\'est la condition préalable.',
    },
    model: {
      label: 'LE MODÈLE',
      headline: 'Les praticiens sont notre distribution.',
      flow1Label: '1 praticien',
      flow1Value: '€29 / mois',
      flow2Label: 'invite',
      flow2Value: 'ses propres patients',
      flow3Label: 'et recommande',
      flow3Value: 'ses pairs dans son réseau',
      revenueTitle: 'Revenus',
      revenueItems: [
        '€29 / praticien — notre prix d\'entrée',
        'Patients gratuits — acquis à coût nul',
        'SaaS à forte marge',
        'Expansion : cliniques, IA premium, B2C',
      ],
      compoundTitle: 'Pourquoi ça compose',
      compoundItems: [
        'Les praticiens amènent leurs propres patients dès le premier jour',
        'L\'engagement est porté par la relation praticien',
        'La croissance passe par les réseaux de praticiens',
      ],
      footnote: '15 séances/semaine × 60€ × ~4 semaines ≈ 3 600€/mois. On facture 29€ — moins d\'une séance. Trop petit pour résilier un jour, avec une marge énorme pour augmenter nos prix.',
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
      franceTitle: 'En France aujourd\'hui',
      funnel: [
        { value: '69M', label: 'personnes vivent en France', source: 'INSEE 2026', url: 'https://www.insee.fr/fr/statistiques/8719824' },
        { value: '~8M', label: 'adultes ont une dépression chaque année (environ 1 sur 6)', source: 'Santé publique France 2024', url: 'https://www.santepubliquefrance.fr/sante-mentale/depression-et-anxiete/rapportsynthese/episodes-depressifs-prevalence-et-recours-aux-soins-barometre-de-sante-publique-france-resultats-de' },
        { value: '77K', label: 'psychologues — chacun doit s\'enregistrer par la loi', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '28K', label: 'travaillent à leur compte — c\'est à eux qu\'on vend', source: 'DREES 2024', url: 'https://drees.solidarites-sante.gouv.fr/communique-de-presse-jeux-de-donnees/241202_Data_professionnels-de-sante-1er-janvier-2024' },
        { value: '1 000', label: 'notre objectif en année 5 — environ 350K€ par an', source: 'notre cible · 3,5% d\'entre eux', url: '' },
      ],
      europeLabel: 'Europe',
      europeValue: '17× plus grand',
      europeBody: '450M de personnes. Les règles qu\'on suit déjà en France marchent aussi en Europe.',
      worldLabel: 'Monde',
      worldValue: '1Md+',
      worldBody: 'de personnes vivent avec un trouble mental. Un jour — pas aujourd\'hui.',
      worldSource: 'OMS 2025',
      worldUrl: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up',
      closing: 'On n\'a pas besoin du monde. On a besoin de 1 000 psychologues français.',
    },
    team: {
      label: 'L\'ÉQUIPE',
      headline: 'Deux personnes. Tout fait en interne. Burn quasi nul.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Ventes & Opérations',
      sarahBio: 'La personne en qui les praticiens ont confiance. Elle écoute avant de vendre — c\'est pour ça qu\'ils restent.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Produit & Technologie',
      adityaBio: 'A construit chaque écran que vous voyez. Dirige le produit — et s\'assure qu\'il reste proche du problème.',
      quote: 'Ce problème est trop proche pour être délégué. Alors on l\'a construit nous-mêmes — deux personnes, en interne, burn quasi nul.',
      footnote: 'Nous cherchons activement un conseiller clinique. La voix clinique est dans le produit — pas encore au cap table.',
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
      todayWhatWeDo: 'Pour 29 €/mois, le thérapeute a un outil qui rend chaque séance plus juste, et ses patients restent reliés au travail entre les séances. Les deux côtés le ressentent.',
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
      headline: 'Levée de 1,1 M€ en pre-seed.',
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

export default function PitchNewPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const slides = [
    { id: 'hero', title: t.slides.hero },
    { id: 'silence', title: t.slides.silence },
    { id: 'whyItMatters', title: t.slides.whyItMatters },
    { id: 'origin', title: t.slides.origin },
    { id: 'product', title: t.slides.product },
    { id: 'boundary', title: t.slides.boundary },
    { id: 'whyNow', title: t.slides.whyNow },
    { id: 'security', title: t.slides.security },
    { id: 'real', title: t.slides.real },
    { id: 'gtm', title: t.slides.gtm },
    { id: 'market', title: t.slides.market },
    { id: 'model', title: t.slides.model },
    { id: 'team', title: t.slides.team },
    { id: 'vision', title: t.slides.vision },
    { id: 'ask', title: t.slides.ask },
    { id: 'close', title: t.slides.close },
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

  // Dark slide gets dark nav styling
  const isDark = currentSlide === 6 // whyNow

  // One place to render a slide by index — used by the on-screen view and the
  // print stack (PDF export).
  const renderSlide = (i: number) => {
    switch (i) {
      case 0: return <HeroSlide onNext={nextSlide} t={t.hero} />
      case 1: return <SilenceSlide t={t.silence} />
      case 2: return <WhyItMattersSlide t={t.whyItMatters} />
      case 3: return <OriginSlide t={t.origin} />
      case 4: return <ProductSlide t={t.product} />
      case 5: return <BoundarySlide t={t.boundary} />
      case 6: return <WhyNowSlide t={t.whyNow} />
      case 7: return <SecuritySlide t={t.security} />
      case 8: return <RealSlide t={t.real} />
      case 9: return <GTMSlide t={t.gtm} />
      case 10: return <MarketSlide t={t.market} />
      case 11: return <ModelSlide t={t.model} />
      case 12: return <TeamSlide t={t.team} />
      case 13: return <VisionSlide t={t.vision} />
      case 14: return <AskSlide t={t.ask} />
      case 15: return <CloseSlide t={t.close} />
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

      {/* Logo */}
      <div className="fixed top-6 left-6 z-50">
        <a href="/" className="flex items-center gap-2">
          <Logo size="md" showText />
        </a>
      </div>

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
    <div className="pdf-print" aria-hidden>
      {slides.map((_, i) => (
        <div key={i} className="pdf-page" style={{ backgroundColor: i === 6 ? '#0a0a0a' : '#FAF8F5' }}>
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
      }
    `}</style>
    </>
  )
}

// =============================================================================
// SLIDE 1: HERO — "One hour a week. 167 hours of silence."
// =============================================================================

function HeroSlide({ onNext, t }: { onNext: () => void; t: typeof translations.en.hero }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden px-8">
      {/* Subtle blob */}
      <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-teal-100/40 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />
      <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/30 to-transparent rounded-full mix-blend-multiply filter blur-3xl" />

      <div className="relative z-10 max-w-5xl w-full">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-3xl sm:text-4xl lg:text-[3.5rem] font-light text-neutral-900 leading-[1.1] tracking-tight mb-4"
        >
          {t.title1}
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-[3.5rem] font-light leading-[1.1] tracking-tight mb-16"
        >
          <span className="text-teal-700">{t.title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-2xl sm:text-3xl font-light text-neutral-700 mb-4 max-w-2xl leading-snug"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex items-center gap-4 mt-10"
        >
          <p className="text-base text-neutral-500">
            <span className="text-neutral-700 font-medium">Bloomsline</span> — {t.stage}
          </p>
          <button
            onClick={onNext}
            aria-label={t.cta}
            title={t.cta}
            className="shrink-0 w-10 h-10 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 2: THE SILENCE
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

        {/* Stats footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex flex-wrap gap-8 pt-8 border-t border-neutral-200"
        >
          {t.stats.map((stat, i) => (
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
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 3: WHY IT MATTERS — consequences of the problem
// =============================================================================

function WhyItMattersSlide({ t }: { t: typeof translations.en.whyItMatters }) {
  const items = [
    { label: t.item1Label, body: t.item1Body },
    { label: t.item2Label, body: t.item2Body },
    { label: t.item3Label, body: t.item3Body },
    { label: t.item4Label, body: t.item4Body },
  ]

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
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.headline1}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline2}
        </motion.h2>

        {/* Four consequence quadrants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-14 max-w-4xl">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="flex flex-col gap-2"
            >
              <p className="text-xs tracking-[0.25em] uppercase font-mono text-teal-700">
                {item.label}
              </p>
              <p className="text-lg text-neutral-800 font-light leading-snug">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg text-neutral-500 italic font-light pt-6 border-t border-neutral-200 max-w-3xl mb-6"
        >
          {t.closing}
        </motion.p>

        {/* Stats */}
        {(t as any).stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="flex flex-wrap gap-8"
          >
            {((t as any).stats as Array<{ value: string; label: string; source: string; url: string }>).map((stat, i) => (
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
          </motion.div>
        )}
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-base text-neutral-500 font-light mb-10 max-w-3xl"
        >
          {t.intro}
        </motion.p>

        {/* The three layers, each item tagged Live / Soon */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-10">
          {t.layers.map((layer, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
            >
              <h3 className="text-sm font-semibold text-neutral-900 pb-2 mb-3 border-b border-neutral-200">{layer.name}</h3>
              <ul className="space-y-2.5">
                {layer.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 text-[9px] tracking-[0.15em] uppercase font-mono px-1.5 py-0.5 rounded-full ${
                      item.live ? 'text-teal-700 bg-teal-50' : 'text-amber-700 bg-amber-50'
                    }`}>
                      {item.live ? t.liveTag : t.soonTag}
                    </span>
                    <span className="text-sm text-neutral-600 font-light leading-relaxed">{item.t}</span>
                  </li>
                ))}
              </ul>
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

        {/* What we don't do */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="pt-6 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <span className="text-xs tracking-[0.2em] uppercase text-neutral-500 font-medium">{t.dontLabel}</span>
          {t.dontItems.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-sm text-neutral-400 font-light">
              <span className="text-rose-300">✕</span>
              {item}
            </span>
          ))}
        </motion.div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex gap-5 items-start"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium" style={{ background: 'linear-gradient(135deg, #D4856A, #E8A87C)' }}>
              SL
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-900">{t.sarahName}</h3>
              <p className="text-sm text-neutral-500 mb-2">{t.sarahRole}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed">{t.sarahBio}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex gap-5 items-start"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium bg-gradient-to-br from-teal-500 to-teal-600">
              AC
            </div>
            <div>
              <h3 className="text-xl font-medium text-neutral-900">{t.adityaName}</h3>
              <p className="text-sm text-neutral-500 mb-2">{t.adityaRole}</p>
              <p className="text-base text-neutral-700 font-light leading-relaxed">{t.adityaBio}</p>
            </div>
          </motion.div>
        </div>

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="border-l-2 border-teal-600 pl-6 py-2 max-w-4xl mb-8"
        >
          <p className="text-xl text-neutral-900 italic font-light leading-relaxed">
            &ldquo;{t.quote}&rdquo;
          </p>
        </motion.blockquote>

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
                  className={`mt-4 self-start inline-flex items-center gap-1.5 text-[11px] tracking-wide font-medium transition-colors ${
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
                  <span className={`text-sm border-b border-dashed transition-colors ${isOpen ? 'text-teal-700 border-teal-300' : 'text-neutral-500 border-neutral-300 group-hover:text-neutral-900'}`}>{item.label}</span>
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Brain,
  Heart,
  Users,
  TrendingUp,
  Sparkles,
  Target,
  Rocket,
  Mail,
  Calendar,
  ArrowRight,
  Check,
  Clock,
  Lightbulb,
  Globe,
  Building2,
  Zap,
  Stethoscope
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

// Translations
const translations = {
  en: {
    slides: {
      hero: 'Hero',
      problem: 'Problem',
      solution: 'Solution',
      why: 'Why Us',
      product: 'Product',
      features: 'Features',
      traction: 'Traction',
      progress: 'Progress',
      market: 'Market',
      marketSize: 'Market Size',
      differentiation: 'Differentiation',
      business: 'Business Model',
      vision: 'Vision',
      team: 'Team',
      ask: 'The Ask',
      contact: 'Contact',
    },
    hero: {
      title1: 'Reimagining',
      title2: 'therapeutic care',
      subtitle: 'Where small moments become meaningful change.',
      subtitle2: 'Connecting practitioners and members through gentle, consistent growth.',
      cta: 'View Pitch',
      seed: 'Seed Round • 2026',
    },
    problem: {
      label: 'THE PROBLEM',
      line1: 'There are 168 hours in a week.',
      line2: 'Therapy is',
      highlight1: '1.',
      line3: 'What happens in the other',
      highlight2: '167?',
      closer: "That's where they need support — and where progress gets lost.",
      stats: [
        { value: '~50%', label: 'of session time spent "catching up"', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'receive no treatment globally', source: 'WHO Sept 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '58%', label: 'of providers: waitlist longer than ever', source: 'National Council 2024', url: 'https://www.thenationalcouncil.org/news/help-wanted/' },
        { value: '49%', label: 'with mental health issues use AI', source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
    },
    solution: {
      label: 'THE SOLUTION',
      title: 'Bloomsline fills the 167.',
      subtitle: 'A companion app for members. A visibility tool for practitioners.',
      pillars: [
        {
          title: 'For Members',
          tagline: 'Companion App',
          features: [
            'Log moments in 10 seconds (photo, voice, or text)',
            'See AI-discovered patterns in mood and behavior',
            'Chat with Bloom — an always-available AI companion',
          ],
          outcome: 'They stay engaged between sessions.'
        },
        {
          title: 'For Practitioners',
          tagline: 'Visibility Dashboard',
          features: [
            'Understand their week through what they share',
            'Share worksheets and resources in one click',
            'Start sessions already informed',
          ],
          outcome: 'Sessions go deeper, faster.'
        },
      ],
      bridge: 'One platform. Two sides of care. Connected.',
    },
    why: {
      label: 'WHY BLOOMSLINE',
      title: 'What brings them here',
      practitioner: {
        title: 'Why Practitioners Choose Us',
        motivation: 'They know healing doesn\'t happen in 50 minutes a week.',
        painPoints: [
          'Clients regress between sessions',
          'No way to see the full picture',
          'Limited tools beyond the couch',
          'Burnout from emotional labor',
        ],
        outcome: 'Bloomsline extends their care — without extending their hours.',
        value: 'Clients stay longer. Sessions go deeper.',
      },
      member: {
        title: 'Why Members Stay',
        motivation: 'They want to feel better — not track more.',
        painPoints: [
          'Apps feel like work',
          'Tracking but not changing',
          'Alone between sessions',
          'Guilt when they slip',
        ],
        outcome: 'Bloomsline helps them grow — without making it feel like work.',
        value: 'Real progress. Not just numbers.',
      },
    },
    product: {
      label: 'THE PRODUCT',
      title: 'Built for both sides',
      membersLabel: 'Members',
      practitionersLabel: 'Practitioners',
      memberFeatures: [
        { name: 'Moments', desc: 'Capture memories with mood tracking' },
        { name: 'Rituals', desc: 'Daily practices that adapt to your energy' },
        { name: 'Progress', desc: 'Narrative growth, not scores' },
        { name: 'Bloom AI', desc: 'Personalized guidance and check-ins' },
      ],
      practitionerFeatures: [
        { name: 'Resources', desc: 'Create worksheets, exercises, psychoeducation' },
        { name: 'Sessions', desc: 'Scheduling and session management' },
        { name: 'Overview', desc: 'Client engagement and insights' },
      ],
      quote: '"See not just hard days, but the full picture — the effort, the small wins, the patterns over time."',
    },
    features: {
      label: 'CORE FEATURES',
      title: 'The two things that matter',
      moments: {
        title: 'Moments',
        forWho: 'For Members',
        problem: 'Life happens fast. We forget the small things that shape us.',
        solution: 'Moments lets you capture everyday life — a walk, a meal, a feeling. It builds your journey over time.',
        howItWorks: 'Snap a photo. Add how you felt. Done.',
        whyItWorks: 'It\'s not about good or bad. It\'s about noticing. Every moment teaches something.',
        noFriction: '10 seconds. No streaks. No guilt if you skip.',
        whyTheyDoIt: 'Why they\'ll actually do it',
        motivation: 'Scroll back and see how far you\'ve come.',
        motivationDetail: 'Like looking at old photos — but for your growth. That\'s the reward.',
      },
      resources: {
        title: 'Resources',
        forWho: 'For Practitioners',
        problem: 'You create great materials. But sharing them is a mess.',
        solution: 'Resources lets you build a library — worksheets, exercises, guides — and share with one click.',
        howItWorks: 'Create once. Assign to any client. Track who viewed it.',
        whyItWorks: 'Your toolkit grows over time. Less repetition, more impact.',
        noFriction: 'Not more admin. Just better delivery of what you already do.',
        whyTheyDoIt: 'Why they\'ll actually do it',
        motivation: 'Create once. Help hundreds.',
        motivationDetail: 'Every resource you build compounds. Less repeating yourself, more connecting.',
      },
    },
    traction: {
      label: 'TRACTION',
      title: "Where we are today",
      subtitle: "This isn't our first attempt — it's our informed one.",
      research: {
        title: 'Deep Research',
        items: [
          { value: '68', desc: 'Practitioner interviews', detail: 'Across 7 countries' },
          { value: '119', desc: 'User interviews', detail: 'Learning what people actually need' },
        ],
      },
      pivot: {
        title: 'What we learned',
        before: 'We first tried building a platform for practitioners to create "human" profiles — personal stories, values, personality quizzes — moving beyond just degrees and reviews.',
        learning: 'We learned the market was crowded, timing was early, and we couldn\'t find a valid business model. But we discovered something bigger:',
        insight: 'The real gap isn\'t finding a therapist. It\'s what happens after — between sessions.',
      },
      now: {
        title: 'Now',
        items: [
          { value: 'MVP', desc: 'Platform built', detail: 'Full B2B + B2C features ready' },
          { value: '2', desc: 'Person team', detail: 'Moving fast, staying focused' },
        ],
      },
      quote: '"We didn\'t just build a product. We earned the insight to build the right one."',
    },
    progress: {
      label: 'PROGRESS',
      title: 'Our journey',
      timeline: [
        {
          date: 'Q1 2025',
          title: 'Doctalink Pivot',
          desc: 'Realized our first product wasn\'t viable. Crowded market, no clear business model.',
          status: 'pivot',
        },
        {
          date: 'Q3 2025',
          title: 'Bloomsline Started',
          desc: 'Applied our learnings. Started building the between-sessions platform.',
          status: 'done',
        },
        {
          date: 'Dec 2025',
          title: 'MVP Complete',
          desc: 'Full platform built. B2B + B2C features ready for launch.',
          status: 'done',
        },
        {
          date: 'Q1 2026',
          title: 'Finding PMF',
          desc: 'Onboarding early practitioners and members. Validating product-market fit.',
          status: 'current',
        },
        {
          date: 'Q2 2026',
          title: 'Beta Launch',
          desc: 'Public beta with paying customers.',
          status: 'upcoming',
        },
        {
          date: 'Q3 2026',
          title: 'Scale',
          desc: 'Expand across Europe with proven model.',
          status: 'upcoming',
        },
      ],
      currentFocus: 'Current Focus',
      focusItems: [
        'Onboarding first practitioners',
        'Gathering user feedback',
        'Iterating on core features',
        'Building case studies',
      ],
    },
    market: {
      label: 'MARKET OPPORTUNITY',
      title: 'Mental health is mainstream',
      stats: [
        { value: '$47B', desc: 'U.S. Digital Mental Health by 2035' },
        { value: '20%', desc: 'Annual market growth (CAGR)' },
        { value: '68%', desc: 'Practices using tele-mental-health' },
      ],
      whyNow: 'Why Now?',
      reasons: [
        'Post-2020 mental health is destigmatized',
        'AI companions are socially accepted',
        'Medicare began covering digital mental health (Jan 2025)',
        'Insurance demands measurable progress',
      ],
    },
    marketSize: {
      title: 'Market Size',
      tam: {
        label: 'TAM',
        value: '$47B',
        desc: 'U.S. Digital Mental Health Market by 2035',
      },
      sam: {
        label: 'SAM',
        value: '$5.5B',
        desc: 'Practice Management & Between-Session Tools',
      },
      som: {
        label: 'SOM',
        value: '$500M',
        desc: 'Practitioners seeking client engagement tools',
      },
      obtainable: 'Our wedge: Each practitioner brings 20-50 members. Built-in distribution, lower CAC than consumer apps.',
    },
    differentiation: {
      label: 'DIFFERENTIATION',
      title: 'A new category',
      headers: ['', 'SimplePractice', 'Headspace', 'Bloomsline'],
      subheaders: ['', '& similar', 'Calm, etc.', ''],
      rows: [
        { label: 'What it does', values: ['Run a business', 'Feel-good content', 'Real progress'] },
        { label: 'Between sessions', values: ['—', 'Same for everyone', '✓'] },
        { label: 'What therapists see', values: ['Invoices only', '—', 'Client\'s full journey'] },
        { label: 'AI companion', values: ['—', '—', '✓'] },
        { label: 'Approach', values: ['Save time on admin', 'Streaks & badges', 'Fits into your day'] },
      ],
      summary: 'SimplePractice helps run a practice.',
      summaryHighlight: 'Bloomsline helps deliver better care.',
    },
    business: {
      label: 'BUSINESS MODEL',
      title: 'B2B SaaS',
      revenueTitle: 'Revenue Model',
      revenuePoints: [
        { title: 'Practitioner subscription', desc: 'Monthly SaaS per seat' },
        { title: 'Members use free', desc: 'Invited by their practitioner' },
        { title: 'Clinic/enterprise tiers', desc: 'Volume pricing for group practices' },
      ],
      gtmTitle: 'Go-to-Market',
      gtmPoints: [
        { title: 'Start: Europe', desc: 'Focus on France, UK, Germany' },
        { title: 'Expand: Global', desc: 'North America, APAC' },
        { title: 'Partnerships', desc: 'EHR integrations, employer programs' },
      ],
      metrics: [
        { value: '€29-79', desc: 'per practitioner/month' },
        { value: '90%+', desc: 'target gross margin' },
        { value: '<12mo', desc: 'target payback period' },
      ],
    },
    vision: {
      label: 'THE VISION',
      title1: 'Beyond an app.',
      title2: 'A research lab for humanity.',
      description: "Every ritual completed, every moment captured, every pattern observed — with consent, we're building the world's deepest understanding of human growth.",
      phases: [
        { title: 'Phase 1', desc: 'Therapeutic support platform. Prove the model.' },
        { title: 'Phase 2', desc: 'Behavioral data labeling. Train understanding models.' },
        { title: 'Phase 3', desc: 'Human intelligence research lab. Build thoughtful products.' },
      ],
      footer: "We don't track people. We witness them. And in that witnessing, we learn what it means to be human.",
    },
    team: {
      label: 'THE TEAM',
      title: 'Built by people who care',
      members: [
        {
          name: 'Aditya',
          role: 'Product & Technology',
          background: 'Ex-[Company] • X years in product & engineering',
          bio: 'Built the entire Bloomsline platform solo. Background in [relevant experience]. Personal journey with mental health drives the mission.',
          linkedin: '#',
        },
        {
          name: 'Sarah',
          role: 'Sales & Operations',
          background: 'Ex-[Company] • X years in sales & ops',
          bio: 'Building the go-to-market engine. Experience in [relevant field]. Passionate about making mental health support accessible.',
          linkedin: '#',
        },
      ],
      whyUs: 'Why us?',
      whyUsPoints: [
        'Personal connection to the problem — we built what we needed',
        'Full-stack execution — product built by founders, not outsourced',
        'Domain obsessed — deep research into therapeutic practices',
      ],
      quote: '"We\'re not building this because it\'s a business opportunity. We\'re building what we needed — and what we know others need too."',
    },
    ask: {
      label: 'THE ASK',
      title: 'Raising €500K - €750K',
      subtitle: 'Seed Round • 18 months runway',
      useOfFundsTitle: 'Use of Funds',
      useOfFunds: [
        { label: 'Product Development', percent: 40 },
        { label: 'Team Growth', percent: 30 },
        { label: 'Go-to-Market', percent: 20 },
        { label: 'Operations', percent: 10 },
      ],
      milestonesTitle: 'Milestones',
      milestones: [
        { title: 'Product-Market Fit', desc: '100+ paying practitioners, 80%+ retention' },
        { title: 'Team Expansion', desc: '2-3 key hires (eng, design, clinical)' },
        { title: 'European Presence', desc: 'France, UK, Germany launch' },
        { title: 'AI Enhancement', desc: 'Mobile app, advanced Bloom capabilities' },
      ],
    },
    contact: {
      title: "Let's build the future of care",
      subtitle: 'Interested in joining our journey?',
      bookMeeting: 'Book a Meeting',
      emailUs: 'Email Us',
      location: 'Europe • Global',
    },
  },
  fr: {
    slides: {
      hero: 'Accueil',
      problem: 'Problème',
      solution: 'Solution',
      why: 'Pourquoi',
      product: 'Produit',
      features: 'Fonctions',
      traction: 'Traction',
      progress: 'Progrès',
      market: 'Marché',
      marketSize: 'Taille du Marché',
      differentiation: 'Différenciation',
      business: 'Modèle',
      vision: 'Vision',
      team: 'Équipe',
      ask: 'Demande',
      contact: 'Contact',
    },
    hero: {
      title1: 'Réinventer',
      title2: 'les soins thérapeutiques',
      subtitle: 'Là où les petits moments deviennent des changements significatifs.',
      subtitle2: 'Connecter praticiens et membres à travers une croissance douce et constante.',
      cta: 'Voir le Pitch',
      seed: 'Seed Round • 2026',
    },
    problem: {
      label: 'LE PROBLÈME',
      line1: 'Il y a 168 heures dans une semaine.',
      line2: 'La thérapie, c\'est',
      highlight1: '1.',
      line3: 'Que se passe-t-il dans les',
      highlight2: '167 autres ?',
      closer: "C'est là qu'ils ont besoin de soutien — et où le progrès se perd.",
      stats: [
        { value: '~50%', label: 'du temps de séance à "rattraper"', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'sans traitement mondial', source: 'OMS Sept 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '58%', label: 'des psys: liste d\'attente record', source: 'National Council 2024', url: 'https://www.thenationalcouncil.org/news/help-wanted/' },
        { value: '49%', label: 'avec problèmes psy utilisent l\'IA', source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
    },
    solution: {
      label: 'LA SOLUTION',
      title: 'Bloomsline remplit les 167.',
      subtitle: 'Une app compagnon pour les membres. Un outil de visibilité pour les praticiens.',
      pillars: [
        {
          title: 'Pour les Membres',
          tagline: 'App Compagnon',
          features: [
            'Enregistrer des moments en 10 sec (photo, voix ou texte)',
            'Voir les patterns découverts par l\'IA dans l\'humeur et le comportement',
            'Discuter avec Bloom — un compagnon IA toujours disponible',
          ],
          outcome: 'Ils restent engagés entre les séances.'
        },
        {
          title: 'Pour les Praticiens',
          tagline: 'Tableau de Bord Visibilité',
          features: [
            'Comprendre leur semaine à travers ce qu\'ils partagent',
            'Partager fiches et ressources en un clic',
            'Commencer les séances déjà informé',
          ],
          outcome: 'Les séances vont plus loin, plus vite.'
        },
      ],
      bridge: 'Une plateforme. Deux côtés du soin. Connectés.',
    },
    why: {
      label: 'POURQUOI BLOOMSLINE',
      title: 'Ce qui les amène ici',
      practitioner: {
        title: 'Pourquoi les Praticiens nous choisissent',
        motivation: 'Ils savent que la guérison ne se fait pas en 50 minutes par semaine.',
        painPoints: [
          'Les clients régressent entre les séances',
          'Pas moyen de voir le tableau complet',
          'Outils limités au-delà du cabinet',
          'Épuisement dû à la charge émotionnelle',
        ],
        outcome: 'Bloomsline étend leur soin — sans étendre leurs heures.',
        value: 'Les clients restent plus longtemps. Les séances vont plus loin.',
      },
      member: {
        title: 'Pourquoi les Membres restent',
        motivation: 'Ils veulent aller mieux — pas tracker plus.',
        painPoints: [
          'Les apps ressemblent à du travail',
          'Tracker sans changer',
          'Seuls entre les séances',
          'Culpabilité quand ils craquent',
        ],
        outcome: 'Bloomsline les aide à grandir — sans que ça ressemble à du travail.',
        value: 'Du vrai progrès. Pas juste des chiffres.',
      },
    },
    product: {
      label: 'LE PRODUIT',
      title: 'Conçu pour les deux côtés',
      membersLabel: 'Membres',
      practitionersLabel: 'Praticiens',
      memberFeatures: [
        { name: 'Moments', desc: "Capturez des souvenirs avec suivi de l'humeur" },
        { name: 'Rituels', desc: "Des pratiques quotidiennes qui s'adaptent à votre énergie" },
        { name: 'Progrès', desc: 'Une croissance narrative, pas des scores' },
        { name: 'Bloom IA', desc: 'Accompagnement personnalisé et suivis' },
      ],
      practitionerFeatures: [
        { name: 'Ressources', desc: 'Créez des fiches, exercices, psychoéducation' },
        { name: 'Séances', desc: 'Planification et gestion des séances' },
        { name: 'Aperçu', desc: 'Engagement client et insights' },
      ],
      quote: '"Voir non seulement les jours difficiles, mais le tableau complet — l\'effort, les petites victoires, les patterns au fil du temps."',
    },
    features: {
      label: 'FONCTIONS CLÉS',
      title: 'Les deux choses qui comptent',
      moments: {
        title: 'Moments',
        forWho: 'Pour les Membres',
        problem: 'La vie va vite. On oublie les petites choses qui nous façonnent.',
        solution: 'Moments permet de capturer le quotidien — une balade, un repas, une émotion. Ça construit votre parcours.',
        howItWorks: 'Une photo. Une émotion. C\'est tout.',
        whyItWorks: 'Ce n\'est pas une question de bon ou mauvais. C\'est remarquer. Chaque moment apprend quelque chose.',
        noFriction: '10 secondes. Pas de séries. Pas de culpabilité si vous sautez.',
        whyTheyDoIt: 'Pourquoi ils le feront',
        motivation: 'Revenir en arrière et voir le chemin parcouru.',
        motivationDetail: 'Comme regarder de vieilles photos — mais pour sa croissance. C\'est ça la récompense.',
      },
      resources: {
        title: 'Ressources',
        forWho: 'Pour les Praticiens',
        problem: 'Vous créez de super contenus. Mais les partager, c\'est le bazar.',
        solution: 'Ressources vous permet de construire une bibliothèque — fiches, exercices, guides — et de partager en un clic.',
        howItWorks: 'Créez une fois. Assignez à n\'importe quel client. Suivez qui a consulté.',
        whyItWorks: 'Votre boîte à outils grandit avec le temps. Moins de répétition, plus d\'impact.',
        noFriction: 'Pas plus d\'admin. Juste une meilleure façon de livrer ce que vous faites déjà.',
        whyTheyDoIt: 'Pourquoi ils le feront',
        motivation: 'Créer une fois. Aider des centaines.',
        motivationDetail: 'Chaque ressource que vous créez se cumule. Moins vous répéter, plus connecter.',
      },
    },
    traction: {
      label: 'TRACTION',
      title: "Où nous en sommes",
      subtitle: "Ce n'est pas notre première tentative — c'est notre tentative éclairée.",
      research: {
        title: 'Recherche Approfondie',
        items: [
          { value: '68', desc: 'Entretiens praticiens', detail: 'Dans 7 pays' },
          { value: '119', desc: 'Entretiens utilisateurs', detail: 'Apprendre ce dont les gens ont vraiment besoin' },
        ],
      },
      pivot: {
        title: 'Ce que nous avons appris',
        before: 'Nous avons d\'abord essayé de construire une plateforme pour que les praticiens créent des profils "humains" — histoires personnelles, valeurs, quiz de personnalité — au-delà des diplômes et avis.',
        learning: 'Nous avons appris que le marché était saturé, le timing précoce, et nous n\'avons pas trouvé de modèle économique viable. Mais nous avons découvert quelque chose de plus grand :',
        insight: 'Le vrai fossé n\'est pas de trouver un thérapeute. C\'est ce qui se passe après — entre les séances.',
      },
      now: {
        title: 'Maintenant',
        items: [
          { value: 'MVP', desc: 'Plateforme construite', detail: 'Fonctionnalités B2B + B2C prêtes' },
          { value: '2', desc: 'Personnes dans l\'équipe', detail: 'Avancer vite, rester concentrés' },
        ],
      },
      quote: '"Nous n\'avons pas juste construit un produit. Nous avons gagné l\'insight pour construire le bon."',
    },
    progress: {
      label: 'PROGRÈS',
      title: 'Notre parcours',
      timeline: [
        {
          date: 'T1 2025',
          title: 'Pivot Doctalink',
          desc: 'Réalisé que notre premier produit n\'était pas viable. Marché saturé, pas de modèle clair.',
          status: 'pivot',
        },
        {
          date: 'T3 2025',
          title: 'Début Bloomsline',
          desc: 'Appliqué nos apprentissages. Commencé à construire la plateforme entre-séances.',
          status: 'done',
        },
        {
          date: 'Déc 2025',
          title: 'MVP Terminé',
          desc: 'Plateforme complète construite. Fonctionnalités B2B + B2C prêtes.',
          status: 'done',
        },
        {
          date: 'T1 2026',
          title: 'Recherche PMF',
          desc: 'Onboarding des premiers praticiens et membres. Validation du product-market fit.',
          status: 'current',
        },
        {
          date: 'T2 2026',
          title: 'Lancement Bêta',
          desc: 'Bêta publique avec clients payants.',
          status: 'upcoming',
        },
        {
          date: 'T3 2026',
          title: 'Passage à l\'échelle',
          desc: 'Expansion en Europe avec modèle prouvé.',
          status: 'upcoming',
        },
      ],
      currentFocus: 'Focus Actuel',
      focusItems: [
        'Onboarding des premiers praticiens',
        'Collecte des retours utilisateurs',
        'Itération sur les fonctionnalités clés',
        'Construction d\'études de cas',
      ],
    },
    market: {
      label: 'OPPORTUNITÉ DE MARCHÉ',
      title: 'La santé mentale est grand public',
      stats: [
        { value: '47 Mrd$', desc: 'Marché numérique santé mentale US d\'ici 2035' },
        { value: '20%', desc: 'Croissance annuelle du marché (TCAC)' },
        { value: '68%', desc: 'Cabinets utilisant la télé-santé mentale' },
      ],
      whyNow: 'Pourquoi maintenant ?',
      reasons: [
        'Post-2020, la santé mentale est déstigmatisée',
        'Les compagnons IA sont socialement acceptés',
        'Medicare couvre la santé mentale numérique (Jan 2025)',
        "Les assurances exigent des progrès mesurables",
      ],
    },
    marketSize: {
      title: 'Taille du Marché',
      tam: {
        label: 'TAM',
        value: '47 Mrd$',
        desc: 'Marché numérique santé mentale US d\'ici 2035',
      },
      sam: {
        label: 'SAM',
        value: '5,5 Mrd$',
        desc: 'Gestion de cabinet & outils entre-séances',
      },
      som: {
        label: 'SOM',
        value: '500 M$',
        desc: 'Praticiens cherchant des outils d\'engagement client',
      },
      obtainable: 'Notre levier : Chaque praticien amène 20-50 membres. Distribution intégrée, CAC plus bas que les apps B2C.',
    },
    differentiation: {
      label: 'DIFFÉRENCIATION',
      title: 'Une nouvelle catégorie',
      headers: ['', 'SimplePractice', 'Headspace', 'Bloomsline'],
      subheaders: ['', '& similaires', 'Calm, etc.', ''],
      rows: [
        { label: 'Ce que ça fait', values: ['Gérer un business', 'Contenu feel-good', 'Vrai progrès'] },
        { label: 'Entre les séances', values: ['—', 'Pareil pour tous', '✓'] },
        { label: 'Ce que voit le psy', values: ['Factures seulement', '—', 'Parcours complet du client'] },
        { label: 'Compagnon IA', values: ['—', '—', '✓'] },
        { label: 'Approche', values: ['Gagner du temps admin', 'Séries & badges', 'S\'intègre à votre journée'] },
      ],
      summary: 'SimplePractice aide à gérer un cabinet.',
      summaryHighlight: 'Bloomsline aide à délivrer de meilleurs soins.',
    },
    business: {
      label: 'MODÈLE ÉCONOMIQUE',
      title: 'B2B SaaS',
      revenueTitle: 'Modèle de Revenus',
      revenuePoints: [
        { title: 'Abonnement praticien', desc: 'SaaS mensuel par siège' },
        { title: 'Gratuit pour les membres', desc: 'Invités par leur praticien' },
        { title: 'Forfaits clinique/entreprise', desc: 'Tarification volume pour les cabinets de groupe' },
      ],
      gtmTitle: 'Stratégie de Marché',
      gtmPoints: [
        { title: 'Départ : Europe', desc: 'Focus sur France, UK, Allemagne' },
        { title: 'Expansion : Mondial', desc: 'Amérique du Nord, APAC' },
        { title: 'Partenariats', desc: 'Intégrations DSE, programmes employeurs' },
      ],
      metrics: [
        { value: '29-79€', desc: 'par praticien/mois' },
        { value: '90%+', desc: 'marge brute cible' },
        { value: '<12 mois', desc: 'délai de rentabilisation cible' },
      ],
    },
    vision: {
      label: 'LA VISION',
      title1: 'Au-delà d\'une app.',
      title2: 'Un laboratoire de recherche pour l\'humanité.',
      description: "Chaque rituel complété, chaque moment capturé, chaque pattern observé — avec consentement, nous construisons la compréhension la plus profonde de la croissance humaine.",
      phases: [
        { title: 'Phase 1', desc: 'Plateforme de soutien thérapeutique. Prouver le modèle.' },
        { title: 'Phase 2', desc: 'Étiquetage de données comportementales. Entraîner des modèles de compréhension.' },
        { title: 'Phase 3', desc: 'Laboratoire de recherche en intelligence humaine. Construire des produits réfléchis.' },
      ],
      footer: "Nous ne pistons pas les gens. Nous les accompagnons. Et dans cet accompagnement, nous apprenons ce que signifie être humain.",
    },
    team: {
      label: "L'ÉQUIPE",
      title: 'Construit par des gens qui s\'en soucient',
      members: [
        {
          name: 'Aditya',
          role: 'Produit & Technologie',
          background: 'Ex-[Entreprise] • X ans en produit & ingénierie',
          bio: 'A construit toute la plateforme Bloomsline seul. Expérience en [domaine pertinent]. Parcours personnel avec la santé mentale motive la mission.',
          linkedin: '#',
        },
        {
          name: 'Sarah',
          role: 'Ventes & Opérations',
          background: 'Ex-[Entreprise] • X ans en ventes & ops',
          bio: 'Construit le moteur go-to-market. Expérience en [domaine pertinent]. Passionnée par rendre le soutien en santé mentale accessible.',
          linkedin: '#',
        },
      ],
      whyUs: 'Pourquoi nous ?',
      whyUsPoints: [
        'Connexion personnelle au problème — nous avons construit ce dont nous avions besoin',
        'Exécution full-stack — produit construit par les fondateurs, pas externalisé',
        'Obsédés par le domaine — recherche approfondie sur les pratiques thérapeutiques',
      ],
      quote: '"Nous ne construisons pas cela parce que c\'est une opportunité business. Nous construisons ce dont nous avions besoin — et ce dont nous savons que d\'autres ont besoin aussi."',
    },
    ask: {
      label: 'LA DEMANDE',
      title: 'Levée de 500K€ - 750K€',
      subtitle: 'Seed Round • 18 mois de runway',
      useOfFundsTitle: 'Utilisation des Fonds',
      useOfFunds: [
        { label: 'Développement Produit', percent: 40 },
        { label: 'Croissance Équipe', percent: 30 },
        { label: 'Go-to-Market', percent: 20 },
        { label: 'Opérations', percent: 10 },
      ],
      milestonesTitle: 'Jalons',
      milestones: [
        { title: 'Product-Market Fit', desc: '100+ praticiens payants, 80%+ rétention' },
        { title: 'Expansion Équipe', desc: '2-3 recrutements clés (dev, design, clinique)' },
        { title: 'Présence Européenne', desc: 'Lancement France, UK, Allemagne' },
        { title: 'Amélioration IA', desc: 'App mobile, capacités Bloom avancées' },
      ],
    },
    contact: {
      title: 'Construisons l\'avenir des soins',
      subtitle: 'Intéressé à rejoindre notre aventure ?',
      bookMeeting: 'Réserver un RDV',
      emailUs: 'Nous Écrire',
      location: 'Europe • Mondial',
    },
  },
}

export default function PitchPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const slides = [
    { id: 'hero', title: t.slides.hero },
    { id: 'problem', title: t.slides.problem },
    { id: 'solution', title: t.slides.solution },
    { id: 'product', title: t.slides.product },
    { id: 'features', title: t.slides.features },
    { id: 'why', title: t.slides.why },
    { id: 'differentiation', title: t.slides.differentiation },
    { id: 'market', title: t.slides.market },
    { id: 'marketSize', title: t.slides.marketSize },
    { id: 'traction', title: t.slides.traction },
    { id: 'progress', title: t.slides.progress },
    { id: 'business', title: t.slides.business },
    { id: 'team', title: t.slides.team },
    { id: 'vision', title: t.slides.vision },
    { id: 'ask', title: t.slides.ask },
    { id: 'contact', title: t.slides.contact },
  ]

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const goToSlide = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= slides.length) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating, slides.length])

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1)
  }, [currentSlide, goToSlide])

  // Keyboard navigation
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
    enter: { opacity: 0, y: 50 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      {/* Language Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        <button
          onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-700"
        >
          <Globe className="w-4 h-4" />
          {locale === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Navigation dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`group flex items-center gap-2 transition-all duration-300`}
            aria-label={slide.title}
          >
            <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              currentSlide === index ? 'text-teal-600' : 'text-neutral-400'
            }`}>
              {slide.title}
            </span>
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'bg-teal-500 scale-125'
                : 'bg-neutral-300 hover:bg-neutral-400'
            }`} />
          </button>
        ))}
      </div>

      {/* Navigation arrows - left side */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className={`p-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all ${
            currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : ''
          }`}
          aria-label="Previous slide"
        >
          <ChevronUp className="w-5 h-5 text-neutral-600" />
        </button>
        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className={`p-2 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all ${
            currentSlide === slides.length - 1 ? 'opacity-30 cursor-not-allowed' : 'animate-bounce'
          }`}
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5 text-neutral-600" />
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
          {currentSlide === 0 && <HeroSlide onNext={nextSlide} t={t.hero} />}
          {currentSlide === 1 && <ProblemSlide t={t.problem} />}
          {currentSlide === 2 && <SolutionSlide t={t.solution} />}
          {currentSlide === 3 && <ProductSlide t={t.product} />}
          {currentSlide === 4 && <FeaturesSlide t={t.features} />}
          {currentSlide === 5 && <WhySlide t={t.why} />}
          {currentSlide === 6 && <DifferentiationSlide t={t.differentiation} />}
          {currentSlide === 7 && <MarketSlide t={t.market} />}
          {currentSlide === 8 && <MarketSizeSlide t={t.marketSize} />}
          {currentSlide === 9 && <TractionSlide t={t.traction} />}
          {currentSlide === 10 && <ProgressSlide t={t.progress} />}
          {currentSlide === 11 && <BusinessModelSlide t={t.business} />}
          {currentSlide === 12 && <TeamSlide t={t.team} />}
          {currentSlide === 13 && <VisionSlide t={t.vision} />}
          {currentSlide === 14 && <AskSlide t={t.ask} />}
          {currentSlide === 15 && <ContactSlide t={t.contact} />}
        </motion.div>
      </AnimatePresence>

      {/* Slide counter */}
      <div className="fixed bottom-6 right-6 z-50 text-sm text-neutral-400 font-medium">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE COMPONENTS
// =============================================================================

interface HeroSlideProps {
  onNext: () => void
  t: typeof translations.en.hero
}

function HeroSlide({ onNext, t }: HeroSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white to-lavender-50/30" />

      {/* Decorative blobs */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-teal-200/40 to-teal-300/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-lavender-200/40 to-lavender-300/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Logo size="lg" showText={false} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-light text-neutral-900 mb-6 leading-[1.1]"
        >
          {t.title1}
          <br />
          <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
            {t.title2}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          {t.subtitle}
          <br />
          {t.subtitle2}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={onNext}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-full shadow-lg shadow-teal-500/30 hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-lg"
          >
            {t.cta}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-sm text-neutral-400 mt-8"
        >
          {t.seed}
        </motion.p>
      </div>
    </div>
  )
}

interface ProblemSlideProps {
  t: typeof translations.en.problem
}

function ProblemSlide({ t }: ProblemSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 lg:px-16">
      <div className="w-full max-w-5xl mx-auto text-center">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-8"
        >
          {t.label}
        </motion.p>

        {/* Line 1: Context */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl sm:text-3xl text-neutral-400 mb-8"
        >
          {t.line1}
        </motion.p>

        {/* 168 Dots Visual */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-1.5 max-w-3xl mx-auto mb-4">
            {Array.from({ length: 168 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + i * 0.005 }}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                  i === 0 ? 'bg-teal-500' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-neutral-600"><span className="font-bold">1</span> hour of therapy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-200" />
              <span className="text-neutral-400"><span className="font-bold">167</span> hours on your own</span>
            </div>
          </div>
        </motion.div>

        {/* Closing Statement */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto mb-12"
        >
          {t.closer}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-12"
        >
          {t.stats.map((stat: { value: string; label: string; source: string; url: string }, index: number) => (
            <div key={index} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-red-500 mb-1">{stat.value}</p>
              <p className="text-sm text-neutral-600 mb-1">{stat.label}</p>
              <a
                href={stat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-teal-600 underline underline-offset-2 transition-colors"
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

interface SolutionSlideProps {
  t: typeof translations.en.solution
}

function SolutionSlide({ t }: SolutionSlideProps) {
  const icons = [Sparkles, Stethoscope]  // Members = teal, Practitioners = peachy

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 leading-[1.1]"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl sm:text-2xl text-neutral-500 mb-10 max-w-3xl mx-auto"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8"
        >
          {t.pillars.map((pillar: { title: string; tagline: string; features: string[]; outcome: string }, index: number) => {
            const Icon = icons[index]
            // Members = teal, Practitioners = #D4856A (peachy)
            const bgColors = ['bg-teal-50', 'bg-[#D4856A]/10']
            const borderColors = ['border-teal-200', 'border-[#D4856A]/30']
            const textColors = ['text-teal-600', 'text-[#D4856A]']
            const iconBgColors = ['bg-teal-100', 'bg-[#D4856A]/20']
            return (
              <div key={index} className={`p-6 rounded-2xl ${bgColors[index]} border ${borderColors[index]} text-left`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${iconBgColors[index]} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${textColors[index]}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${textColors[index]} uppercase tracking-wide`}>{pillar.tagline}</p>
                    <h3 className="font-semibold text-neutral-900 text-lg">{pillar.title}</h3>
                  </div>
                </div>
                <ul className="space-y-2 mb-4">
                  {pillar.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check className={`w-4 h-4 ${textColors[index]} mt-0.5 flex-shrink-0`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <p className={`text-sm font-medium ${textColors[index]} pt-3 border-t ${borderColors[index]}`}>
                  → {pillar.outcome}
                </p>
              </div>
            )
          })}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-lg font-medium text-neutral-700"
        >
          {t.bridge}
        </motion.p>
      </div>
    </div>
  )
}

interface WhySlideProps {
  t: typeof translations.en.why
}

function WhySlide({ t }: WhySlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Practitioners */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#D4856A]/10 to-white border border-[#D4856A]/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4856A]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#D4856A]" />
              </div>
              <h3 className="font-semibold text-neutral-900">{t.practitioner.title}</h3>
            </div>

            <p className="text-lg text-[#D4856A] font-medium mb-4 italic">
              &ldquo;{t.practitioner.motivation}&rdquo;
            </p>

            <div className="space-y-2 mb-6">
              {t.practitioner.painPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2 text-neutral-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4856A]/50" />
                  {point}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#D4856A]/10 border border-[#D4856A]/20">
              <p className="text-[#D4856A] font-medium text-center">
                {t.practitioner.outcome}
              </p>
              <p className="text-[#D4856A]/70 text-sm text-center mt-1">
                {t.practitioner.value}
              </p>
            </div>
          </motion.div>

          {/* Members */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-white border border-teal-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-neutral-900">{t.member.title}</h3>
            </div>

            <p className="text-lg text-teal-600 font-medium mb-4 italic">
              &ldquo;{t.member.motivation}&rdquo;
            </p>

            <div className="space-y-2 mb-6">
              {t.member.painPoints.map((point, index) => (
                <div key={index} className="flex items-center gap-2 text-neutral-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
                  {point}
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
              <p className="text-teal-600 font-medium text-center">
                {t.member.outcome}
              </p>
              <p className="text-teal-600/70 text-sm text-center mt-1">
                {t.member.value}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface ProductSlideProps {
  t: typeof translations.en.product
}

function ProductSlide({ t }: ProductSlideProps) {
  const memberIcons = [Heart, Clock, TrendingUp, Brain]
  const practitionerIcons = [Lightbulb, Calendar, Users]

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-white border border-teal-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
                {t.membersLabel}
              </div>
            </div>
            <div className="space-y-4">
              {t.memberFeatures.map((feature, index) => {
                const Icon = memberIcons[index]
                const isHero = index === 0 // Moments is the hero feature
                return (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      isHero
                        ? 'bg-teal-100/50 border-2 border-teal-300 shadow-sm'
                        : 'hover:bg-teal-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isHero ? 'bg-teal-500 text-white' : 'bg-teal-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isHero ? '' : 'text-teal-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-neutral-900">{feature.name}</h4>
                        {isHero && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-teal-500 text-white rounded-full">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{feature.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Practitioners */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#D4856A]/10 to-white border border-[#D4856A]/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 rounded-full bg-[#D4856A]/20 text-[#D4856A] text-sm font-medium">
                {t.practitionersLabel}
              </div>
            </div>
            <div className="space-y-4">
              {t.practitionerFeatures.map((feature, index) => {
                const Icon = practitionerIcons[index]
                const isHero = index === 0 // Resources is the hero feature
                return (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                      isHero
                        ? 'bg-[#D4856A]/20 border-2 border-[#D4856A]/40 shadow-sm'
                        : 'hover:bg-[#D4856A]/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isHero ? 'bg-[#D4856A] text-white' : 'bg-[#D4856A]/20'
                    }`}>
                      <Icon className={`w-5 h-5 ${isHero ? '' : 'text-[#D4856A]'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-neutral-900">{feature.name}</h4>
                        {isHero && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-[#D4856A] text-white rounded-full">
                            Core
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{feature.desc}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-white/80 border border-[#D4856A]/10">
              <p className="text-sm text-neutral-600 italic">
                {t.quote}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface FeaturesSlideProps {
  t: typeof translations.en.features
}

function FeaturesSlide({ t }: FeaturesSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Moments - For Members */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-white border border-teal-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900">{t.moments.title}</h3>
                  <span className="text-sm text-teal-600">{t.moments.forWho}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm font-medium text-red-700 mb-1">The problem</p>
                <p className="text-neutral-700">{t.moments.problem}</p>
              </div>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <p className="text-sm font-medium text-teal-700 mb-1">The solution</p>
                <p className="text-neutral-700">{t.moments.solution}</p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">How it works</p>
                <p className="text-neutral-900 font-medium">{t.moments.howItWorks}</p>
              </div>

              {/* The hook - why they'll actually do it */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                <p className="text-sm font-medium text-teal-100 mb-1">{t.moments.whyTheyDoIt}</p>
                <p className="text-white font-semibold">{t.moments.motivation}</p>
                <p className="text-teal-100 text-sm mt-1">{t.moments.motivationDetail}</p>
              </div>

              <div className="pt-4 border-t border-teal-100">
                <p className="text-sm text-teal-600 italic">{t.moments.whyItWorks}</p>
                <p className="text-xs text-neutral-500 mt-2">{t.moments.noFriction}</p>
              </div>
            </div>
          </motion.div>

          {/* Resources - For Practitioners */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#D4856A]/10 to-white border border-[#D4856A]/30"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#D4856A] flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-neutral-900">{t.resources.title}</h3>
                  <span className="text-sm text-[#D4856A]">{t.resources.forWho}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm font-medium text-red-700 mb-1">The problem</p>
                <p className="text-neutral-700">{t.resources.problem}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#D4856A]/10 border border-[#D4856A]/20">
                <p className="text-sm font-medium text-[#D4856A] mb-1">The solution</p>
                <p className="text-neutral-700">{t.resources.solution}</p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">How it works</p>
                <p className="text-neutral-900 font-medium">{t.resources.howItWorks}</p>
              </div>

              {/* The hook - why they'll actually do it */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#D4856A] to-[#E8A87C] text-white">
                <p className="text-sm font-medium text-orange-100 mb-1">{t.resources.whyTheyDoIt}</p>
                <p className="text-white font-semibold">{t.resources.motivation}</p>
                <p className="text-orange-100 text-sm mt-1">{t.resources.motivationDetail}</p>
              </div>

              <div className="pt-4 border-t border-[#D4856A]/20">
                <p className="text-sm text-[#D4856A] italic">{t.resources.whyItWorks}</p>
                <p className="text-xs text-neutral-500 mt-2">{t.resources.noFriction}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface MarketSlideProps {
  t: typeof translations.en.market
}

function MarketSlide({ t }: MarketSlideProps) {
  const statColors = [
    'bg-gradient-to-br from-teal-500 to-teal-600',
    'bg-gradient-to-br from-lavender-500 to-lavender-600',
    'bg-gradient-to-br from-[#D4856A] to-[#E8A87C]',
  ]
  const statTextColors = ['text-teal-100', 'text-lavender-100', 'text-orange-100']

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {t.stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`p-6 rounded-2xl ${statColors[index]} text-white text-center`}
            >
              <p className="text-4xl font-bold mb-2">{stat.value}</p>
              <p className={`${statTextColors[index]} text-sm`}>{stat.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200"
        >
          <h3 className="font-semibold text-neutral-900 mb-4">{t.whyNow}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {t.reasons.map((reason, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                <p className="text-neutral-600">{reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface MarketSizeSlideProps {
  t: typeof translations.en.marketSize
}

function MarketSizeSlide({ t }: MarketSizeSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-12"
        >
          {t.title}
        </motion.h2>

        {/* TAM/SAM/SOM Nested Ovals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative flex items-center justify-center mb-8"
        >
          {/* TAM - outermost oval */}
          <div className="relative border-2 border-dashed border-red-400 rounded-[100px] px-8 py-12 flex items-center">
            {/* SAM - middle oval */}
            <div className="border-2 border-dashed border-blue-400 rounded-[80px] px-8 py-10 flex items-center">
              {/* SOM - innermost oval */}
              <div className="border-2 border-dashed border-teal-500 rounded-[60px] px-6 py-8 bg-white">
                <div>
                  <p className="text-teal-600 font-bold text-xl">{t.som.label}</p>
                  <p className="text-teal-700 font-bold text-2xl">{t.som.value}</p>
                  <p className="text-neutral-600 text-sm max-w-[180px] leading-tight mt-1">{t.som.desc}</p>
                </div>
              </div>
              {/* SAM label - positioned to the right */}
              <div className="ml-6">
                <p className="text-blue-600 font-bold text-xl">{t.sam.label}</p>
                <p className="text-blue-700 font-bold text-2xl">{t.sam.value}</p>
                <p className="text-neutral-600 text-sm max-w-[150px] leading-tight mt-1">{t.sam.desc}</p>
              </div>
            </div>
            {/* TAM label - positioned to the right */}
            <div className="ml-6">
              <p className="text-red-500 font-bold text-xl">{t.tam.label}</p>
              <p className="text-red-600 font-bold text-2xl">{t.tam.value}</p>
              <p className="text-neutral-600 text-sm max-w-[150px] leading-tight mt-1">{t.tam.desc}</p>
            </div>
          </div>
        </motion.div>

        {/* Obtainable note */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-neutral-700 text-lg font-medium text-center"
        >
          **{t.obtainable}
        </motion.p>
      </div>
    </div>
  )
}

interface DifferentiationSlideProps {
  t: typeof translations.en.differentiation
}

function DifferentiationSlide({ t }: DifferentiationSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden rounded-3xl border border-neutral-200"
        >
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                {t.headers.map((header, index) => (
                  <th
                    key={index}
                    className={`text-center p-4 font-medium ${
                      index === 3 ? 'text-teal-600 bg-teal-50' : index === 0 ? 'text-left text-neutral-900' : 'text-neutral-500'
                    }`}
                  >
                    {header}
                    {t.subheaders[index] && (
                      <><br/><span className="text-xs font-normal">{t.subheaders[index]}</span></>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {t.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-4 text-neutral-600">{row.label}</td>
                  {row.values.map((value, colIndex) => (
                    <td
                      key={colIndex}
                      className={`p-4 text-center ${
                        colIndex === 2 ? 'bg-teal-50/50' : ''
                      } ${value === '✓' ? '' : colIndex === 2 ? 'text-sm text-teal-700 font-medium' : 'text-neutral-500 text-sm'}`}
                    >
                      {value === '✓' ? (
                        <Check className="w-5 h-5 text-teal-500 mx-auto" />
                      ) : value === '—' ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-neutral-500 mt-6"
        >
          {t.summary} <span className="text-teal-600 font-medium">{t.summaryHighlight}</span>
        </motion.p>
      </div>
    </div>
  )
}

interface BusinessModelSlideProps {
  t: typeof translations.en.business
}

function BusinessModelSlide({ t }: BusinessModelSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-500" />
              {t.revenueTitle}
            </h3>
            <ul className="space-y-4">
              {t.revenuePoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-teal-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{point.title}</p>
                    <p className="text-sm text-neutral-500">{point.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-lavender-500" />
              {t.gtmTitle}
            </h3>
            <ul className="space-y-4">
              {t.gtmPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-lavender-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-lavender-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{point.title}</p>
                    <p className="text-sm text-neutral-500">{point.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center gap-8 text-center"
        >
          {t.metrics.map((metric, index) => (
            <div key={index}>
              <p className="text-3xl font-bold text-neutral-900">{metric.value}</p>
              <p className="text-sm text-neutral-500">{metric.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

interface VisionSlideProps {
  t: typeof translations.en.vision
}

function VisionSlide({ t }: VisionSlideProps) {
  const phaseIcons = [Zap, Brain, Building2]
  const phaseColors = ['bg-teal-500/20', 'bg-lavender-500/20', 'bg-[#D4856A]/20']
  const phaseTextColors = ['text-teal-400', 'text-lavender-400', 'text-[#E8A87C]']

  return (
    <div className="h-full w-full flex items-center justify-center px-6 bg-neutral-900">
      <div className="max-w-5xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-400 font-medium mb-4"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-8 leading-[1.1]"
        >
          {t.title1}
          <br />
          <span className="text-teal-400">{t.title2}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-neutral-400 mb-12 max-w-3xl mx-auto"
        >
          {t.description}
        </motion.p>

        <div className="grid sm:grid-cols-3 gap-6">
          {t.phases.map((phase, index) => {
            const Icon = phaseIcons[index]
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className={`w-12 h-12 rounded-xl ${phaseColors[index]} flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-6 h-6 ${phaseTextColors[index]}`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{phase.title}</h3>
                <p className="text-sm text-neutral-400">{phase.desc}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-neutral-500 mt-10 text-sm"
        >
          {t.footer}
        </motion.p>
      </div>
    </div>
  )
}

interface TractionSlideProps {
  t: typeof translations.en.traction
}

function TractionSlide({ t }: TractionSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-3 text-center"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-neutral-500 text-center mb-8"
        >
          {t.subtitle}
        </motion.p>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Research */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-2xl bg-teal-50 border border-teal-100"
          >
            <h3 className="font-semibold text-neutral-900 mb-4">{t.research.title}</h3>
            <div className="space-y-4">
              {t.research.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-teal-600">{item.value}</div>
                  <div>
                    <p className="font-medium text-neutral-900">{item.desc}</p>
                    <p className="text-xs text-neutral-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pivot Story */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-lg lg:col-span-1"
          >
            <h3 className="font-semibold text-neutral-900 mb-3">{t.pivot.title}</h3>
            <p className="text-sm text-neutral-600 mb-3">{t.pivot.before}</p>
            <p className="text-sm text-neutral-500 mb-3">{t.pivot.learning}</p>
            <p className="text-sm font-medium text-teal-600 italic">&ldquo;{t.pivot.insight}&rdquo;</p>
          </motion.div>

          {/* Now */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white"
          >
            <h3 className="font-semibold mb-4">{t.now.title}</h3>
            <div className="space-y-4">
              {t.now.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{item.value}</div>
                  <div>
                    <p className="font-medium">{item.desc}</p>
                    <p className="text-xs text-teal-100">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-neutral-500 mt-8 italic"
        >
          {t.quote}
        </motion.p>
      </div>
    </div>
  )
}

interface ProgressSlideProps {
  t: typeof translations.en.progress
}

function ProgressSlide({ t }: ProgressSlideProps) {
  const statusColors = {
    pivot: { bg: 'bg-amber-100', border: 'border-amber-300', dot: 'bg-amber-500', text: 'text-amber-700' },
    done: { bg: 'bg-teal-100', border: 'border-teal-300', dot: 'bg-teal-500', text: 'text-teal-700' },
    current: { bg: 'bg-gradient-to-r from-teal-500 to-teal-600', border: 'border-teal-500', dot: 'bg-white', text: 'text-white' },
    upcoming: { bg: 'bg-neutral-50', border: 'border-neutral-200', dot: 'bg-neutral-300', text: 'text-neutral-500' },
  }

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-10 text-center"
        >
          {t.title}
        </motion.h2>

        {/* Timeline */}
        <div className="relative">
          {/* Horizontal line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-neutral-200 hidden lg:block" />

          {/* Timeline items */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {t.timeline.map((item, index) => {
              const colors = statusColors[item.status as keyof typeof statusColors]
              const isCurrent = item.status === 'current'
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="relative"
                >
                  {/* Dot on timeline */}
                  <div className="hidden lg:flex justify-center mb-4">
                    <div className={`w-4 h-4 rounded-full ${colors.dot} border-2 ${colors.border} z-10 bg-white`}>
                      {isCurrent && (
                        <div className="absolute -inset-1 rounded-full bg-teal-500/30 animate-ping" />
                      )}
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`p-4 rounded-xl ${colors.bg} ${colors.border} border ${isCurrent ? 'shadow-lg shadow-teal-500/20' : ''}`}>
                    <p className={`text-xs font-medium mb-1 ${isCurrent ? 'text-teal-100' : 'text-neutral-500'}`}>
                      {item.date}
                    </p>
                    <h4 className={`font-semibold text-sm mb-1 ${colors.text} ${isCurrent ? '' : ''}`}>
                      {item.title}
                    </h4>
                    <p className={`text-xs ${isCurrent ? 'text-teal-100' : 'text-neutral-500'}`}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Current Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 p-6 rounded-2xl bg-teal-50 border border-teal-100"
        >
          <h4 className="font-semibold text-neutral-900 mb-3">{t.currentFocus}</h4>
          <div className="grid sm:grid-cols-2 gap-2">
            {t.focusItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <span className="text-sm text-neutral-700">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface TeamSlideProps {
  t: typeof translations.en.team
}

function TeamSlide({ t }: TeamSlideProps) {
  const colors = [
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-[#D4856A] to-[#E8A87C]',
  ]
  const roleColors = ['text-teal-600', 'text-[#D4856A]']

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-10 text-center"
        >
          {t.title}
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {t.members.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-lg"
            >
              <div className="flex items-start gap-5">
                <div className={`w-16 h-16 rounded-full ${colors[index]} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl font-bold text-white">{member.name[0]}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900">{member.name}</h3>
                  <p className={`${roleColors[index]} font-medium text-sm mb-1`}>{member.role}</p>
                  <p className="text-xs text-neutral-400 mb-2">{member.background}</p>
                  <p className="text-neutral-600 text-sm">{member.bio}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why Us section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 rounded-2xl bg-teal-50 border border-teal-100 mb-6"
        >
          <h4 className="font-semibold text-neutral-900 mb-3">{t.whyUs}</h4>
          <ul className="space-y-2">
            {t.whyUsPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <p className="text-neutral-500 italic text-sm">
            {t.quote}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

interface AskSlideProps {
  t: typeof translations.en.ask
}

function AskSlide({ t }: AskSlideProps) {
  const fundColors = ['bg-teal-500', 'bg-lavender-500', 'bg-[#D4856A]', 'bg-neutral-400']
  const milestoneIcons = [Rocket, Users, Globe, Brain]
  const milestoneColors = [
    { bg: 'bg-teal-100', text: 'text-teal-600' },
    { bg: 'bg-lavender-100', text: 'text-lavender-600' },
    { bg: 'bg-[#D4856A]/20', text: 'text-[#D4856A]' },
    { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  ]

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-5xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-4 text-center"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-4 text-center"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-neutral-500 text-center mb-12"
        >
          {t.subtitle}
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6">{t.useOfFundsTitle}</h3>
            <div className="space-y-4">
              {t.useOfFunds.map((item, index) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">{item.label}</span>
                    <span className="font-medium text-neutral-900">{item.percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      className={`h-full rounded-full ${fundColors[index]}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6">{t.milestonesTitle}</h3>
            <ul className="space-y-4">
              {t.milestones.map((milestone, index) => {
                const Icon = milestoneIcons[index]
                const colors = milestoneColors[index]
                return (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{milestone.title}</p>
                      <p className="text-sm text-neutral-500">{milestone.desc}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

interface ContactSlideProps {
  t: typeof translations.en.contact
}

function ContactSlide({ t }: ContactSlideProps) {
  return (
    <div className="h-full w-full flex items-center justify-center px-6 bg-gradient-to-br from-teal-50 via-white to-lavender-50">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Logo size="lg" showText={false} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-6"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-neutral-600 mb-10"
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href={DEMO_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-full shadow-lg shadow-teal-500/30 hover:shadow-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              {t.bookMeeting}
            </Button>
          </a>

          <a href="mailto:hi@bloomsline.com">
            <Button variant="outline" className="px-8 py-4 rounded-full border-2 border-neutral-300 text-neutral-700 font-medium hover:border-neutral-400 hover:bg-white transition-all text-lg">
              <Mail className="w-5 h-5 mr-2" />
              {t.emailUs}
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-neutral-400 text-sm"
        >
          <p>hi@bloomsline.com</p>
          <p className="mt-1">{t.location}</p>
        </motion.div>
      </div>
    </div>
  )
}

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
  Globe,
  Building2,
  Zap,
  Stethoscope,
  Code,
  Megaphone,
  Handshake,
  Palette,
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

// ─────────────────────────────────────────────────────
// TRANSLATIONS (EN only for now — FR can be added later)
// ─────────────────────────────────────────────────────

const translations = {
  en: {
    slides: {
      hero: 'Hero',
      problem: 'Problem',
      solution: 'Solution',
      whyNow: 'Why Now',
      differentiation: 'Differentiation',
      product: 'Product',
      traction: 'Traction',
      execution: 'Execution',
      business: 'Business',
      team: 'Team',
      vision: 'Vision',
      ask: 'The Ask',
      contact: 'Contact',
    },
    hero: {
      title1: 'The between-session',
      title2: 'care platform',
      subtitle: 'Less admin, more presence.',
      subtitle2: '',
      cta: 'View Pitch',
      seed: 'Pre-Seed · Pre-Revenue · 2026',
    },
    problem: {
      label: 'THE PROBLEM',
      headline: 'Therapy is 1 hour a week.',
      subheadline: 'Life is the other 167.',
      punchline: "That's where people need support — and where progress gets lost.",
      consequences: [
        { icon: 'clock', text: 'Half of every session is spent just catching up' },
        { icon: 'blind', text: 'Practitioners can\'t see what happens between visits' },
        { icon: 'alone', text: 'People feel alone between sessions — and disengage' },
      ],
      stats: [
        { value: '~50%', label: 'of session time: catching up', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'get no mental health treatment', source: 'WHO 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '49%', label: 'with issues already use AI', source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
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
            'Capture moments in 10 seconds — photo, voice, or text',
            'AI-discovered patterns in mood and behavior',
            'Bloom — an always-available AI companion',
            'Daily rituals that adapt to your energy',
          ],
          outcome: 'They stay engaged between sessions.'
        },
        {
          title: 'For Practitioners',
          tagline: 'Visibility Dashboard',
          features: [
            'See their week through what they share',
            'Create & share worksheets in one click',
            'Start sessions already informed',
            'Track client engagement over time',
          ],
          outcome: 'Sessions go deeper, faster.'
        },
      ],
      bridge: 'One platform. Two sides of care. Connected.',
    },
    whyNow: {
      label: 'WHY NOW',
      title: 'Three tailwinds converging',
      reasons: [
        'Post-2020: mental health is destigmatized — demand up 40%',
        'AI companions are socially accepted (49% of people with MH issues already use AI)',
        'France launched Mon Soutien Psychologique (govt reimbursement) — practitioners need tools',
        'No dominant between-session platform exists in EU — market is open',
      ],
      tam: { label: 'TAM', value: '€12B', desc: 'EU Digital Mental Health by 2030' },
      sam: { label: 'SAM', value: '€2B', desc: 'Practice tools + between-session segment' },
      som: { label: 'SOM', value: '€50M', desc: 'France + UK practitioners (Year 1-3 focus)' },
      wedge: 'Each practitioner brings 20-50 members at zero acquisition cost. Built-in distribution that B2C competitors can\'t match.',
      marketGrowth: '25% CAGR',
    },
    differentiation: {
      label: 'WHERE WE FIT',
      title: 'Nobody owns this space',
      buckets: [
        {
          label: 'Practice tools',
          examples: 'SimplePractice, Jane, TherapyNotes',
          does: 'Run the business',
          detail: 'Billing, scheduling, clinical notes',
          emoji: '📋',
        },
        {
          label: 'Wellness apps',
          examples: 'Headspace, Calm, BetterHelp',
          does: 'Help individuals cope',
          detail: 'Meditations, self-help, generic content',
          emoji: '🧘',
        },
      ],
      gap: "Who connects the practitioner and the client between sessions?",
      answer: 'Bloomsline.',
      answerDetail: 'The between-session care platform — where both sides stay connected.',
    },
    product: {
      label: 'THE PRODUCT',
      title: 'The missing layer between sessions',
      practitioners: {
        title: 'For Practitioners',
        tagline: 'See. Understand. Extend.',
        features: [
          { name: 'Between-Session Visibility', desc: 'See what\'s happening in your client\'s life between visits. Patterns, shifts, and what they chose to share. A living picture, not a 5-day-old memory.' },
          { name: 'AI-Powered Preparation', desc: 'Before each session: what happened, what shifted, what to explore. Start at the insight, not the recap. 25 min of catching up — gone.' },
          { name: 'Therapeutic Resources', desc: 'Worksheets, exercises, and psychoeducation you create once, delivered to their phone. They do the work between sessions, you see the engagement.' },
        ],
      },
      members: {
        title: 'For Members',
        tagline: 'Stay connected to your care, not just an app',
        features: [
          { name: 'Moments', desc: 'A 10-second reflection that builds self-awareness over time. What you capture between sessions becomes part of your therapeutic journey.' },
          { name: 'Bloom AI', desc: 'Not a replacement therapist. A companion that holds the thread between sessions — and knows your context.' },
          { name: 'My Practitioner', desc: 'Stay connected to your practitioner between visits. See their resources, share what matters, and walk into your next session already on the same page.' },
        ],
      },
      loop: [
        'Members share',
        'AI connects the dots',
        'Practitioners arrive informed',
        'Every session starts deeper',
      ],
    },
    traction: {
      label: 'WHERE WE ARE — HONESTLY',
      title: "Pre-revenue, post-learning",
      subtitle: "0 paying customers. A live product. And 18 months of research that shaped what we built.",
      research: [
        { value: '15', desc: 'Beta testers (not paying)' },
        { value: '119', desc: 'Discovery interviews across 7 countries' },
      ],
      pivotInsight: 'We started with practitioner profiles (Doctalink). Market was crowded. But through 119 interviews we found the real gap: practitioners have zero visibility into what happens between sessions. That insight became Bloomsline.',
      timeline: [
        { date: 'Q1 2025', title: 'Doctalink Pivot', status: 'pivot' },
        { date: 'Q3 2025', title: 'Bloomsline Started', status: 'done' },
        { date: 'Dec 2025', title: 'MVP Complete', status: 'done' },
        { date: 'Q1 2026', title: 'Finding PMF', status: 'current' },
        { date: 'Q2 2026', title: 'First Paying Users', status: 'upcoming' },
        { date: 'Q3 2026', title: 'Scale If PMF', status: 'upcoming' },
      ],
      quote: '"Pre-revenue is a risk. But we\'ve de-risked the product — 119 interviews shaped every feature. The question is distribution, not product."',
    },
    execution: {
      label: 'HOW WE WIN',
      title: 'Product. Distribution. Retention.',
      subtitle: 'Three things that matter at our stage — and where we are on each.',
      why: 'Build → Get found → Convert → Retain',
      areas: [
        {
          title: 'Product',
          items: [
            'Full MVP live — web dashboard for practitioners + mobile app for members',
            'AI context engine that learns from logged moments, spots emotional patterns, and gives practitioners a pre-session brief. Not a chatbot — a tool that makes sessions more productive.',
          ],
          status: 'MVP live',
          why: 'What we sell',
          highlight: '',
        },
        {
          title: 'Distribution',
          items: [
            'Each practitioner publishes their profile on Bloomsline → SEO brings inbound practitioners organically, zero ad spend needed at this stage',
            'LinkedIn outreach + peer referrals are our primary channels — low cost, high intent',
          ],
          status: 'Plan ready, not yet proven',
          why: 'How we get practitioners',
          highlight: '',
        },
        {
          title: 'Network Effect',
          items: [
            'Every practitioner invites 20-50 members (their clients). Members see the product, tell other practitioners. One sale seeds the next. This is our CAC advantage — if it works.',
            'Hypothesis: organic referrals compound. Risk: practitioners may not invite members actively.',
          ],
          status: 'Unproven — key assumption',
          why: 'How we scale without $$',
          highlight: '',
        },
        {
          title: 'Retention',
          items: [
            'Mental health apps have ~90% drop-off in month 1. We designed around this: no streaks, no guilt, progress shown as story not score.',
            'This is a bet on design philosophy. We believe it drives retention but have no data yet.',
          ],
          status: 'Designed, not measured',
          why: 'Why they stay',
          highlight: '',
        },
      ],
    },
    business: {
      label: 'BUSINESS MODEL',
      title: 'B2B SaaS — practitioners pay, members free',
      revenuePoints: [
        { title: '3 tiers: €19 / €29 / €49', desc: 'Essentiel → Pro → Cabinet, per practitioner/month' },
        { title: 'Members use it free', desc: 'Invited by their practitioner — zero acquisition cost' },
        { title: 'B2C premium upside (future)', desc: '€3/mo member premium — not in current model' },
      ],
      gtmPoints: [
        { title: 'Start: France', desc: 'Our home market, where we have network' },
        { title: 'Then: EU (UK, Germany)', desc: 'Same language support, similar regulations' },
        { title: 'Later: N. America', desc: 'Only after proving EU product-market fit' },
      ],
      metrics: [
        { value: '€19-49', desc: 'per practitioner/month' },
        { value: '~83%', desc: 'modeled gross margin (unproven)' },
      ],
    },
    team: {
      label: 'THE TEAM',
      title: '2 founders, full-stack execution',
      members: [
        {
          name: 'Sarah',
          role: 'Co-founder · Sales & Operations',
          background: 'Building the GTM engine from scratch',
          bio: 'Responsible for practitioner acquisition, partnerships, and operations. First sales conversations happening now — results pending.',
        },
        {
          name: 'Aditya',
          role: 'Co-founder · Product & Technology',
          background: 'Solo-built the entire platform (web + mobile + AI)',
          bio: 'Engineer who built Bloomsline end-to-end: Next.js dashboard, React Native mobile app, Supabase backend, Claude AI integration. Personal experience with therapy drove the product insight.',
        },
      ],
      whyUsPoints: [
        'Entire product built by founders — no outsourcing, no burn before launch',
        '119 discovery interviews shaped every feature decision',
        'Risk: 2-person team. Plan: first 2 hires are engineer + sales (included in use of funds)',
      ],
    },
    vision: {
      label: 'THE LONG GAME',
      title1: 'When this works, the data becomes',
      title2: 'the real asset.',
      description: "Every moment logged, every pattern observed, every therapeutic outcome tracked — with consent, this dataset becomes uniquely valuable for mental health research. But first we need to prove the platform works.",
      phases: [
        { title: 'Phase 1', desc: 'Between-session care platform. Prove product-market fit.' },
        { title: 'Phase 2', desc: 'Behavioral pattern dataset. Valuable for research partnerships.' },
        { title: 'Phase 3', desc: 'Mental health research infrastructure. Only if Phase 1-2 succeed.' },
      ],
      footer: "This vision is ambitious and far-off. Our focus is Phase 1: get 100+ practitioners paying, and prove the model works.",
    },
    ask: {
      label: 'THE ASK',
      title: 'Raising €400K-€500K',
      subtitle: 'Pre-seed · 18 months to prove product-market fit',
      useOfFunds: [
        { label: 'Product (AI + mobile)', percent: 40 },
        { label: 'Team (eng + sales)', percent: 25 },
        { label: 'Go-to-Market', percent: 25 },
        { label: 'Ops & Legal', percent: 10 },
      ],
      milestones: [
        { title: 'M6: First 30-50 paying practitioners', desc: 'Proof someone will swipe their card' },
        { title: 'M12: 100+ practitioners, 80%+ retention', desc: 'Product-market fit signal' },
        { title: 'M18: €100K+ ARR, Series A ready', desc: 'Data to raise next round at 3-5x' },
        { title: 'If we miss: concrete pivot triggers', desc: 'See financial model for M3/M6/M9/M12 thresholds' },
      ],
      vision: {
        title1: 'When this works, the data becomes',
        title2: 'the real asset.',
        phases: [
          'Between-session care platform',
          'Behavioral pattern dataset',
          'Mental health research infrastructure',
        ],
      },
    },
    contact: {
      title: "Let's talk",
      subtitle: 'We\'re raising now. Happy to walk through the financial model live.',
      bookMeeting: 'Book a 20-min Call',
      emailUs: 'Email Us',
    },
  },
  fr: {
    slides: {
      hero: 'Accueil',
      problem: 'Problème',
      solution: 'Solution',
      whyNow: 'Pourquoi',
      differentiation: 'Différenciation',
      product: 'Produit',
      traction: 'Traction',
      execution: 'Exécution',
      business: 'Modèle',
      team: 'Équipe',
      vision: 'Vision',
      ask: 'Demande',
      contact: 'Contact',
    },
    hero: {
      title1: 'La plateforme de soin',
      title2: 'entre les séances',
      subtitle: 'Moins d\'admin, plus de présence.',
      subtitle2: '',
      cta: 'Voir le Pitch',
      seed: 'Pré-Seed · Pré-Revenu · 2026',
    },
    problem: {
      label: 'LE PROBLÈME',
      headline: "La thérapie, c'est 1 heure par semaine.",
      subheadline: 'La vie, ce sont les 167 autres.',
      punchline: "C'est là que les gens ont besoin de soutien — et où le progrès se perd.",
      consequences: [
        { icon: 'clock', text: 'La moitié de chaque séance est passée à rattraper le retard' },
        { icon: 'blind', text: 'Les praticiens ne voient pas ce qui se passe entre les visites' },
        { icon: 'alone', text: 'Les gens se sentent seuls entre les séances — et décrochent' },
      ],
      stats: [
        { value: '~50%', label: 'du temps de séance : rattrapage', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'sans traitement en santé mentale', source: 'OMS 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '49%', label: "avec des problèmes utilisent déjà l'IA", source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
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
            'Capturer des moments en 10 sec — photo, voix ou texte',
            "Patterns découverts par l'IA dans l'humeur et le comportement",
            'Bloom — un compagnon IA toujours disponible',
            "Rituels quotidiens qui s'adaptent à votre énergie",
          ],
          outcome: 'Ils restent engagés entre les séances.'
        },
        {
          title: 'Pour les Praticiens',
          tagline: 'Tableau de Bord Visibilité',
          features: [
            "Comprendre leur semaine à travers ce qu'ils partagent",
            'Créer et partager fiches et ressources en un clic',
            'Commencer les séances déjà informé',
            "Suivre l'engagement client dans le temps",
          ],
          outcome: 'Les séances vont plus loin, plus vite.'
        },
      ],
      bridge: 'Une plateforme. Deux côtés du soin. Connectés.',
    },
    whyNow: {
      label: 'POURQUOI MAINTENANT',
      title: 'Trois vents favorables convergent',
      reasons: [
        'Post-2020 : santé mentale déstigmatisée — demande en hausse de 40%',
        'Les compagnons IA sont socialement acceptés (49% des personnes avec des troubles MH utilisent déjà l\'IA)',
        'La France a lancé Mon Soutien Psychologique (remboursement) — les praticiens ont besoin d\'outils',
        'Aucune plateforme entre-séances dominante en UE — le marché est ouvert',
      ],
      tam: { label: 'TAM', value: '12 Mrd€', desc: 'Santé mentale numérique UE d\'ici 2030' },
      sam: { label: 'SAM', value: '2 Mrd€', desc: 'Outils de cabinet + segment entre-séances' },
      som: { label: 'SOM', value: '50 M€', desc: 'Praticiens France + UK (focus années 1-3)' },
      wedge: 'Chaque praticien amène 20-50 membres à coût d\'acquisition zéro. Distribution intégrée que les concurrents B2C ne peuvent pas égaler.',
      marketGrowth: '25% TCAC',
    },
    differentiation: {
      label: 'OÙ NOUS NOUS SITUONS',
      title: 'Personne ne couvre cet espace',
      buckets: [
        {
          label: 'Outils de cabinet',
          examples: 'SimplePractice, Jane, TherapyNotes',
          does: 'Gérer le business',
          detail: 'Facturation, planning, notes cliniques',
          emoji: '📋',
        },
        {
          label: 'Apps bien-être',
          examples: 'Headspace, Calm, BetterHelp',
          does: 'Aider à se sentir mieux',
          detail: 'Méditations, auto-aide, contenu générique',
          emoji: '🧘',
        },
      ],
      gap: 'Qui connecte le praticien et le client entre les séances ?',
      answer: 'Bloomsline.',
      answerDetail: 'La plateforme de soin entre les séances — où les deux côtés restent connectés.',
    },
    product: {
      label: 'LE PRODUIT',
      title: 'La couche manquante entre les séances',
      practitioners: {
        title: 'Pour les Praticiens',
        tagline: 'Voir. Comprendre. Étendre.',
        features: [
          { name: 'Visibilité Entre-Séances', desc: 'Voir ce qui se passe dans la vie de votre client entre les visites. Patterns, évolutions, et ce qu\'il choisit de partager. Une image vivante, pas un souvenir de 5 jours.' },
          { name: 'Préparation par l\'IA', desc: 'Avant chaque séance : ce qui s\'est passé, ce qui a changé, ce qu\'il faut explorer. Commencez par l\'insight, pas par le rattrapage. 25 min de mise à jour — disparues.' },
          { name: 'Ressources Thérapeutiques', desc: 'Fiches, exercices et psychoéducation créés une fois, livrés sur leur téléphone. Ils travaillent entre les séances, vous voyez l\'engagement.' },
        ],
      },
      members: {
        title: 'Pour les Membres',
        tagline: 'Restez connecté à votre soin, pas juste à une app',
        features: [
          { name: 'Moments', desc: 'Une réflexion de 10 secondes qui construit la conscience de soi au fil du temps. Ce que vous capturez entre les séances fait partie de votre parcours thérapeutique.' },
          { name: 'Bloom IA', desc: 'Pas un thérapeute de remplacement. Un compagnon qui tient le fil entre les séances — et connaît votre contexte.' },
          { name: 'Mon Praticien', desc: 'Restez connecté à votre praticien entre les visites. Consultez ses ressources, partagez ce qui compte, et arrivez à votre prochaine séance déjà sur la même longueur d\'onde.' },
        ],
      },
      loop: [
        'Les membres partagent',
        'L\'IA connecte les points',
        'Les praticiens arrivent informés',
        'Chaque séance commence plus profond',
      ],
    },
    traction: {
      label: 'OÙ NOUS EN SOMMES — HONNÊTEMENT',
      title: "Pré-revenu, post-apprentissage",
      subtitle: "0 client payant. Un produit live. Et 18 mois de recherche qui ont façonné ce que nous avons construit.",
      research: [
        { value: '15', desc: 'Testeurs bêta (non payants)' },
        { value: '119', desc: 'Entretiens découverte dans 7 pays' },
      ],
      pivotInsight: "Nous avons commencé avec des profils praticiens (Doctalink). Marché saturé. Mais à travers 119 entretiens, nous avons trouvé le vrai fossé : les praticiens n'ont aucune visibilité sur ce qui se passe entre les séances. Cet insight est devenu Bloomsline.",
      timeline: [
        { date: 'T1 2025', title: 'Pivot Doctalink', status: 'pivot' },
        { date: 'T3 2025', title: 'Début Bloomsline', status: 'done' },
        { date: 'Déc 2025', title: 'MVP Terminé', status: 'done' },
        { date: 'T1 2026', title: 'Recherche PMF', status: 'current' },
        { date: 'T2 2026', title: 'Premiers clients payants', status: 'upcoming' },
        { date: "T3 2026", title: "Scale si PMF", status: 'upcoming' },
      ],
      quote: '"Pré-revenu est un risque. Mais nous avons dé-risqué le produit — 119 entretiens ont façonné chaque fonctionnalité. La question est la distribution, pas le produit."',
    },
    execution: {
      label: 'COMMENT ON GAGNE',
      title: 'Produit. Distribution. Rétention.',
      subtitle: 'Trois choses qui comptent à notre stade — et où nous en sommes sur chacune.',
      why: 'Construire → Se faire trouver → Convertir → Retenir',
      areas: [
        {
          title: 'Produit',
          items: [
            'MVP complet — dashboard web pour praticiens + app mobile pour membres',
            'Moteur IA contextuel qui apprend des moments capturés, détecte les patterns émotionnels, et donne aux praticiens un brief pré-séance. Pas un chatbot — un outil qui rend les séances plus productives.',
          ],
          status: 'MVP prêt',
          why: 'Ce qu\'on vend',
          highlight: '',
        },
        {
          title: 'Distribution',
          items: [
            'Chaque praticien publie son profil sur Bloomsline → le SEO amène des praticiens organiquement, zéro budget pub à ce stade',
            'LinkedIn outreach + parrainages pairs sont nos canaux principaux — faible coût, haute intention',
          ],
          status: 'Plan prêt, pas encore prouvé',
          why: 'Comment on trouve les praticiens',
          highlight: '',
        },
        {
          title: 'Effet réseau',
          items: [
            'Chaque praticien invite 20-50 membres (ses clients). Les membres voient le produit, en parlent à d\'autres praticiens. Une vente génère la suivante. C\'est notre avantage CAC — si ça marche.',
            'Hypothèse : les parrainages organiques se composent. Risque : les praticiens n\'invitent peut-être pas activement leurs membres.',
          ],
          status: 'Non prouvé — hypothèse clé',
          why: 'Comment on scale sans $$',
          highlight: '',
        },
        {
          title: 'Rétention',
          items: [
            'Les apps santé mentale ont ~90% d\'abandon au mois 1. Nous avons conçu autrement : pas de séries, pas de culpabilité, progrès en récit pas en score.',
            'C\'est un pari sur la philosophie de design. On pense que ça drive la rétention mais on n\'a pas encore de données.',
          ],
          status: 'Conçu, pas mesuré',
          why: 'Pourquoi ils restent',
          highlight: '',
        },
      ],
    },
    business: {
      label: 'MODÈLE ÉCONOMIQUE',
      title: 'B2B SaaS — les praticiens paient, les membres gratuit',
      revenuePoints: [
        { title: '3 paliers : 19€ / 29€ / 49€', desc: 'Essentiel → Pro → Cabinet, par praticien/mois' },
        { title: 'Les membres utilisent gratuitement', desc: 'Invités par leur praticien — coût d\'acquisition zéro' },
        { title: 'Premium B2C (futur)', desc: '3€/mois premium membre — pas dans le modèle actuel' },
      ],
      gtmPoints: [
        { title: 'Départ : France', desc: 'Notre marché domestique, où nous avons le réseau' },
        { title: 'Puis : UE (UK, Allemagne)', desc: 'Même support linguistique, réglementations similaires' },
        { title: 'Ensuite : Amérique du N.', desc: 'Uniquement après avoir prouvé le PMF en UE' },
      ],
      metrics: [
        { value: '19-49€', desc: 'par praticien/mois' },
        { value: '~83%', desc: 'marge brute modélisée (non prouvée)' },
      ],
    },
    team: {
      label: "L'ÉQUIPE",
      title: '2 fondateurs, exécution full-stack',
      members: [
        {
          name: 'Sarah',
          role: 'Co-fondatrice · Ventes & Opérations',
          background: 'Construit le moteur GTM de zéro',
          bio: 'Responsable de l\'acquisition praticiens, partenariats et opérations. Premières conversations commerciales en cours — résultats en attente.',
        },
        {
          name: 'Aditya',
          role: 'Co-fondateur · Produit & Technologie',
          background: 'A construit seul toute la plateforme (web + mobile + IA)',
          bio: 'Ingénieur qui a construit Bloomsline de A à Z : dashboard Next.js, app mobile React Native, backend Supabase, intégration IA Claude. Expérience personnelle avec la thérapie a guidé l\'insight produit.',
        },
      ],
      whyUsPoints: [
        'Produit entier construit par les fondateurs — pas d\'externalisation, pas de burn avant le lancement',
        '119 entretiens découverte ont façonné chaque décision produit',
        'Risque : équipe de 2. Plan : les 2 premiers recrutements sont ingénieur + commercial (inclus dans l\'utilisation des fonds)',
      ],
    },
    vision: {
      label: 'LE LONG TERME',
      title1: 'Quand ça marche, les données deviennent',
      title2: 'le vrai actif.',
      description: "Chaque moment capturé, chaque pattern observé, chaque résultat thérapeutique suivi — avec consentement, ce dataset devient uniquement précieux pour la recherche en santé mentale. Mais d'abord, nous devons prouver que la plateforme fonctionne.",
      phases: [
        { title: 'Phase 1', desc: 'Plateforme de soin entre-séances. Prouver le product-market fit.' },
        { title: 'Phase 2', desc: 'Dataset de patterns comportementaux. Valeur pour les partenariats recherche.' },
        { title: 'Phase 3', desc: 'Infrastructure de recherche en santé mentale. Uniquement si phases 1-2 réussissent.' },
      ],
      footer: "Cette vision est ambitieuse et lointaine. Notre focus est la Phase 1 : avoir 100+ praticiens payants, et prouver que le modèle fonctionne.",
    },
    ask: {
      label: 'LA DEMANDE',
      title: 'Levée de 400K€-500K€',
      subtitle: 'Pré-seed · 18 mois pour prouver le product-market fit',
      useOfFunds: [
        { label: 'Produit (IA + mobile)', percent: 40 },
        { label: 'Équipe (dev + commercial)', percent: 25 },
        { label: 'Go-to-Market', percent: 25 },
        { label: 'Ops & Juridique', percent: 10 },
      ],
      milestones: [
        { title: 'M6 : 30-50 premiers praticiens payants', desc: 'Preuve que quelqu\'un sort sa carte' },
        { title: 'M12 : 100+ praticiens, 80%+ rétention', desc: 'Signal de product-market fit' },
        { title: 'M18 : 100K€+ ARR, prêt Série A', desc: 'Données pour lever le tour suivant à 3-5x' },
        { title: 'Si on rate : déclencheurs pivot concrets', desc: 'Voir le modèle financier pour les seuils M3/M6/M9/M12' },
      ],
      vision: {
        title1: 'Quand ça marche, les données deviennent',
        title2: 'le vrai actif.',
        phases: [
          'Plateforme de soin entre-séances',
          'Dataset de patterns comportementaux',
          'Infrastructure de recherche en santé mentale',
        ],
      },
    },
    contact: {
      title: "Parlons-en",
      subtitle: 'Nous levons maintenant. Nous pouvons présenter le modèle financier en direct.',
      bookMeeting: 'Réserver un appel de 20 min',
      emailUs: 'Nous Écrire',
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
    { id: 'problem', title: t.slides.problem },
    { id: 'solution', title: t.slides.solution },
    { id: 'whyNow', title: t.slides.whyNow },
    { id: 'differentiation', title: t.slides.differentiation },
    { id: 'product', title: t.slides.product },
    { id: 'traction', title: t.slides.traction },
    { id: 'execution', title: t.slides.execution },
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
    enter: { opacity: 0, y: 50 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
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
            className="group flex items-center gap-2 transition-all duration-300"
            aria-label={slide.title}
          >
            <span className={`text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              currentSlide === index ? 'text-teal-600' : 'text-neutral-400'
            }`}>
              {slide.title}
            </span>
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSlide === index ? 'bg-teal-500 scale-125' : 'bg-neutral-300 hover:bg-neutral-400'
            }`} />
          </button>
        ))}
      </div>

      {/* Navigation arrows */}
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
          {currentSlide === 3 && <WhyNowSlide t={t.whyNow} />}
          {currentSlide === 4 && <DifferentiationSlide t={t.differentiation} />}
          {currentSlide === 5 && <ProductSlide t={t.product} />}
          {currentSlide === 6 && <TractionSlide t={t.traction} />}
          {currentSlide === 7 && <ExecutionSlide t={t.execution} />}
          {currentSlide === 8 && <BusinessSlide t={t.business} />}
          {currentSlide === 9 && <TeamSlide t={t.team} />}
          {currentSlide === 10 && <VisionSlide t={t.vision} />}
          {currentSlide === 11 && <AskSlide t={t.ask} />}
          {currentSlide === 12 && <ContactSlide t={t.contact} />}
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
// SLIDE 1: HERO
// =============================================================================

function HeroSlide({ onNext, t }: { onNext: () => void; t: typeof translations.en.hero }) {
  return (
    <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-white to-lavender-50/30" />
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
          {t.title1}<br />
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
          {t.subtitle}<br />{t.subtitle2}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
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


// =============================================================================
// SLIDE 2: PROBLEM — simple, visceral
// =============================================================================

function ProblemSlide({ t }: { t: typeof translations.en.problem }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 lg:px-16">
      <div className="w-full max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-teal-600 font-medium mb-10"
        >
          {t.label}
        </motion.p>

        {/* Big statement */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 mb-2 leading-[1.1]"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-red-500 mb-8 leading-[1.1]"
        >
          {t.subheadline}
        </motion.h2>

        {/* Visual ratio bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ transformOrigin: 'left' }}
          className="max-w-2xl mx-auto mb-4"
        >
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-teal-500 rounded-l-full" style={{ width: `${(1 / 168) * 100}%`, minWidth: '6px' }} />
            <div className="bg-neutral-200 flex-1 rounded-r-full" />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 mt-2 px-1">
            <span className="text-teal-600 font-semibold">1h therapy</span>
            <span>167h on their own</span>
          </div>
        </motion.div>

        {/* Punchline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-lg text-neutral-500 max-w-xl mx-auto mb-12"
        >
          {t.punchline}
        </motion.p>

        {/* 3 consequences — what this means */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10"
        >
          {t.consequences.map((c, i) => (
            <div key={i} className="p-4 rounded-2xl bg-red-50 border border-red-100">
              <p className="text-sm text-neutral-700">{c.text}</p>
            </div>
          ))}
        </motion.div>

        {/* Stats — proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="flex justify-center gap-10"
        >
          {t.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-red-500 mb-1">{stat.value}</p>
              <p className="text-xs text-neutral-600 mb-1">{stat.label}</p>
              <a
                href={stat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-neutral-400 hover:text-teal-600 underline underline-offset-2 transition-colors"
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
// SLIDE 3: SOLUTION — merged Solution + Product features
// =============================================================================

function SolutionSlide({ t }: { t: typeof translations.en.solution }) {
  const icons = [Sparkles, Stethoscope]
  const bgColors = ['bg-teal-50', 'bg-[#D4856A]/10']
  const borderColors = ['border-teal-200', 'border-[#D4856A]/30']
  const textColors = ['text-teal-600', 'text-[#D4856A]']
  const iconBgColors = ['bg-teal-100', 'bg-[#D4856A]/20']

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
          {t.pillars.map((pillar, index) => {
            const Icon = icons[index]
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
                  {pillar.features.map((feature, i) => (
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


// =============================================================================
// SLIDE 4: WHY NOW — merged Market + Why Now + TAM/SAM/SOM
// =============================================================================

function WhyNowSlide({ t }: { t: typeof translations.en.whyNow }) {
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Why Now reasons */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-neutral-50 border border-neutral-200"
          >
            <h3 className="font-semibold text-neutral-900 mb-5 text-lg">Tailwinds</h3>
            <div className="space-y-4">
              {t.reasons.map((reason, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
                  <p className="text-neutral-600">{reason}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-neutral-200 text-center">
              <p className="text-3xl font-bold text-teal-600">{t.marketGrowth}</p>
              <p className="text-sm text-neutral-500">Annual market growth</p>
            </div>
          </motion.div>

          {/* Right: TAM/SAM/SOM stacked */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            {[
              { data: t.tam, color: 'border-red-300 bg-red-50', valueColor: 'text-red-600', labelColor: 'text-red-500' },
              { data: t.sam, color: 'border-blue-300 bg-blue-50', valueColor: 'text-blue-600', labelColor: 'text-blue-500' },
              { data: t.som, color: 'border-teal-300 bg-teal-50', valueColor: 'text-teal-600', labelColor: 'text-teal-500' },
            ].map(({ data, color, valueColor, labelColor }, index) => (
              <motion.div
                key={data.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + index * 0.1 }}
                className={`p-5 rounded-2xl border ${color} flex items-center gap-4`}
              >
                <div className={`text-sm font-bold ${labelColor} w-10`}>{data.label}</div>
                <div className={`text-3xl font-bold ${valueColor}`}>{data.value}</div>
                <div className="text-sm text-neutral-600 flex-1">{data.desc}</div>
              </motion.div>
            ))}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="text-sm text-neutral-500 italic mt-2 px-2"
            >
              {t.wedge}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 5: DIFFERENTIATION — visual gap
// =============================================================================

function DifferentiationSlide({ t }: { t: typeof translations.en.differentiation }) {
  const bucketColors = [
    { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-600' },
    { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-600' },
  ]

  return (
    <div className="h-full w-full flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
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
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-12"
        >
          {t.title}
        </motion.h2>

        {/* Two existing buckets */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {t.buckets.map((bucket, index) => (
            <motion.div
              key={bucket.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`p-6 rounded-2xl ${bucketColors[index].bg} border ${bucketColors[index].border}`}
            >
              <p className="text-3xl mb-3">{bucket.emoji}</p>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">{bucket.label}</h3>
              <p className="text-sm text-neutral-400 mb-3">{bucket.examples}</p>
              <p className="text-base font-medium text-neutral-700 mb-1">{bucket.does}</p>
              <p className="text-sm text-neutral-500">{bucket.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* The gap */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-6"
        >
          <div className="inline-block px-8 py-4 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-lg sm:text-xl font-medium text-red-600">{t.gap}</p>
          </div>
        </motion.div>

        {/* Bloomsline — the answer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-teal-50 to-teal-100/50 border-2 border-teal-300"
        >
          <p className="text-3xl sm:text-4xl font-bold text-teal-600 mb-2">{t.answer}</p>
          <p className="text-lg text-neutral-600">{t.answerDetail}</p>
        </motion.div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 6: PRODUCT — what we built
// =============================================================================

function ProductSlide({ t }: { t: typeof translations.en.product }) {
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
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-10 leading-[1.1]"
        >
          {t.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8"
        >
          {/* Practitioners column */}
          <div className="p-6 rounded-2xl bg-[#D4856A]/10 border border-[#D4856A]/30 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#D4856A]/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-[#D4856A]" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-lg">{t.practitioners.title}</h3>
            </div>
            <p className="text-sm font-medium text-[#D4856A] mb-5 ml-[52px]">{t.practitioners.tagline}</p>
            <div className="space-y-4">
              {t.practitioners.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#D4856A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[#D4856A] text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{feature.name}</p>
                    <p className="text-[13px] text-neutral-500 leading-snug">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members column */}
          <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200 text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 text-lg">{t.members.title}</h3>
            </div>
            <p className="text-sm font-medium text-teal-600 mb-5 ml-[52px]">{t.members.tagline}</p>
            <div className="space-y-4">
              {t.members.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-teal-600 text-xs font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{feature.name}</p>
                    <p className="text-[13px] text-neutral-500 leading-snug">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* The loop — the real USP */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 text-sm"
        >
          {t.loop.map((step, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-white font-medium">{step}</span>
              {i < t.loop.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-teal-400" />}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 7: TRACTION — merged Traction + Progress timeline
// =============================================================================

function TractionSlide({ t }: { t: typeof translations.en.traction }) {
  const statusColors = {
    pivot: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700' },
    done: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700' },
    current: { bg: 'bg-gradient-to-r from-teal-500 to-teal-600', border: 'border-teal-500', text: 'text-white' },
    upcoming: { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-500' },
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

        {/* Top row: research stats + pivot insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4 mb-8"
        >
          {t.research.map((item, index) => (
            <div key={index} className="p-5 rounded-2xl bg-teal-50 border border-teal-100 text-center">
              <p className="text-3xl font-bold text-teal-600">{item.value}</p>
              <p className="text-sm text-neutral-600 mt-1">{item.desc}</p>
            </div>
          ))}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <p className="text-sm text-neutral-600 leading-relaxed">{t.pivotInsight}</p>
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-neutral-200 hidden lg:block" />
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {t.timeline.map((item, index) => {
                const colors = statusColors[item.status as keyof typeof statusColors]
                const isCurrent = item.status === 'current'
                return (
                  <div key={index} className="relative">
                    <div className="hidden lg:flex justify-center mb-3">
                      <div className={`w-3 h-3 rounded-full ${isCurrent ? 'bg-teal-500' : item.status === 'done' ? 'bg-teal-400' : item.status === 'pivot' ? 'bg-amber-400' : 'bg-neutral-300'} z-10`}>
                        {isCurrent && <div className="absolute -inset-1 rounded-full bg-teal-500/30 animate-ping" />}
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border ${isCurrent ? 'shadow-lg shadow-teal-500/20' : ''}`}>
                      <p className={`text-xs font-medium mb-0.5 ${isCurrent ? 'text-teal-100' : 'text-neutral-500'}`}>{item.date}</p>
                      <h4 className={`font-semibold text-sm ${colors.text}`}>{item.title}</h4>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-neutral-500 mt-6 italic text-sm"
        >
          {t.quote}
        </motion.p>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 7: EXECUTION — Building the Foundation
// =============================================================================

function ExecutionSlide({ t }: { t: typeof translations.en.execution }) {
  const areaConfig = [
    { icon: Code, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', statusBg: 'bg-teal-100', statusText: 'text-teal-700' },
    { icon: Megaphone, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', statusBg: 'bg-violet-100', statusText: 'text-violet-700' },
    { icon: Handshake, color: 'text-[#D4856A]', bg: 'bg-[#D4856A]/10', border: 'border-[#D4856A]/30', statusBg: 'bg-[#D4856A]/20', statusText: 'text-[#D4856A]' },
    { icon: Heart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', statusBg: 'bg-blue-100', statusText: 'text-blue-700' },
  ]

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
          className="text-4xl sm:text-5xl font-light text-neutral-900 mb-3 text-center"
        >
          {t.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-neutral-500 text-center mb-4"
        >
          {t.subtitle}
        </motion.p>

        {/* Connecting logic */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center text-sm font-medium text-neutral-400 mb-8"
        >
          {t.why}
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.areas.map((area, index) => {
            const config = areaConfig[index]
            const Icon = config.icon
            return (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 + index * 0.1 }}
                className={`p-5 rounded-2xl ${config.bg} border ${config.border} flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-9 h-9 rounded-xl ${config.statusBg} flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                  </div>
                  <h3 className="font-semibold text-neutral-900">{area.title}</h3>
                </div>

                <p className={`text-xs font-medium ${config.color} mb-4 ml-12`}>{area.why}</p>

                <ul className="space-y-2 flex-1">
                  {area.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <Check className={`w-3.5 h-3.5 ${config.color} mt-0.5 flex-shrink-0`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className={`mt-4 pt-3 border-t ${config.border}`}>
                  <span className={`text-xs font-semibold ${config.statusText} ${config.statusBg} px-2.5 py-1 rounded-full`}>
                    {area.status}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 8: BUSINESS MODEL
// =============================================================================

function BusinessSlide({ t }: { t: typeof translations.en.business }) {
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
          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-500" />
              Revenue Model
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

          {/* GTM */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-lavender-500" />
              Go-to-Market
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

        {/* Metrics */}
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


// =============================================================================
// SLIDE 8: TEAM
// =============================================================================

function TeamSlide({ t }: { t: typeof translations.en.team }) {
  const colors = [
    'bg-gradient-to-br from-[#D4856A] to-[#E8A87C]',
    'bg-gradient-to-br from-teal-400 to-teal-600',
  ]
  const roleColors = ['text-[#D4856A]', 'text-teal-600']

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

        {/* Why Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 rounded-2xl bg-teal-50 border border-teal-100"
        >
          <ul className="space-y-2">
            {t.whyUsPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-neutral-700">
                <Check className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 9: THE ASK — with vision teaser at bottom
// =============================================================================

function AskSlide({ t }: { t: typeof translations.en.ask }) {
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
          className="text-neutral-500 text-center mb-10"
        >
          {t.subtitle}
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Use of Funds */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6">Use of Funds</h3>
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

          {/* Milestones */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-8 rounded-3xl bg-white border border-neutral-200 shadow-lg"
          >
            <h3 className="font-semibold text-neutral-900 mb-6">Milestones</h3>
            <ul className="space-y-4">
              {t.milestones.map((milestone, index) => {
                const Icon = milestoneIcons[index]
                const mColors = milestoneColors[index]
                return (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${mColors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-3.5 h-3.5 ${mColors.text}`} />
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


// =============================================================================
// SLIDE 11: VISION — The Long Game
// =============================================================================

function VisionSlide({ t }: { t: typeof translations.en.vision }) {
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


// =============================================================================
// SLIDE 12: CONTACT
// =============================================================================

function ContactSlide({ t }: { t: typeof translations.en.contact }) {
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
          <a href={DEMO_BOOKING_URL} target="_blank" rel="noopener noreferrer">
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 text-neutral-400 text-sm"
        >
          hi@bloomsline.com
        </motion.p>
      </div>
    </div>
  )
}

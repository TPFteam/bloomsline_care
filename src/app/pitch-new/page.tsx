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
      traction: 'Traction',
      execution: 'Execution',
      business: 'Business',
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
      title: 'The timing is right',
      reasons: [
        'Post-2020 mental health is destigmatized',
        'AI companions are socially accepted',
        'Medicare covers digital mental health (Jan 2025)',
        'Insurance demands measurable progress',
      ],
      tam: { label: 'TAM', value: '$47B', desc: 'U.S. Digital Mental Health by 2035' },
      sam: { label: 'SAM', value: '$5.5B', desc: 'Practice Management & Between-Session Tools' },
      som: { label: 'SOM', value: '$500M', desc: 'Practitioners seeking engagement tools' },
      wedge: 'Each practitioner brings 20-50 members. Built-in distribution, lower CAC than consumer apps.',
      marketGrowth: '20% CAGR',
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
    traction: {
      label: 'TRACTION & PROGRESS',
      title: "Where we are today",
      subtitle: "This isn't our first attempt — it's our informed one.",
      research: [
        { value: '68', desc: 'Practitioners across 7 countries' },
        { value: '119', desc: 'User interviews' },
      ],
      pivotInsight: 'We first built a platform for practitioner profiles. The market was crowded and timing early. But we discovered the real gap: what happens between sessions.',
      timeline: [
        { date: 'Q1 2025', title: 'Doctalink Pivot', status: 'pivot' },
        { date: 'Q3 2025', title: 'Bloomsline Started', status: 'done' },
        { date: 'Dec 2025', title: 'MVP Complete', status: 'done' },
        { date: 'Q1 2026', title: 'Finding PMF', status: 'current' },
        { date: 'Q2 2026', title: 'Beta Launch', status: 'upcoming' },
        { date: 'Q3 2026', title: 'Scale', status: 'upcoming' },
      ],
      quote: '"We didn\'t just build a product. We earned the insight to build the right one."',
    },
    execution: {
      label: 'BUILDING THE FOUNDATION',
      title: 'Four pillars. One company.',
      subtitle: 'A great product alone isn\'t enough. We\'re building every layer needed to scale.',
      why: 'Build it. Be found. Close it. Make it feel right.',
      areas: [
        {
          title: 'Product',
          items: [
            'Full MVP live — web dashboard + mobile app',
            'BCS — Bloom Context System — a behavioral context model that learns from every moment logged, understands emotional patterns over time, and gives practitioners and members a shared language for growth. Not a chatbot. A context engine for human behavior.',
          ],
          status: 'MVP live',
          why: 'The engine',
          highlight: 'BCS',
        },
        {
          title: 'Digital Presence',
          items: [
            'PLG — Practitioner-Led Growth — every practitioner who joins publishes their story, their approach, and their expertise through Bloomsline. They become the content. They become the distribution. Zero ad spend, organic flywheel.',
            'SEO-optimized public pages so practitioners find us naturally',
          ],
          status: '4-month foundation plan',
          why: 'How they find us',
          highlight: 'PLG',
        },
        {
          title: 'Sales',
          items: [
            'CNE — Care Network Effect — every practitioner brings 20-50 members. Those members see other practitioners. Those practitioners hear about Bloomsline through their clients. One sale seeds the next. Growth compounds through care relationships that already exist.',
            'Early adopter program turning first users into advocates',
          ],
          status: 'Pipeline building',
          why: 'How we close',
          highlight: 'CNE',
        },
        {
          title: 'Gentle UX',
          items: [
            'GUX — Gentle UX — most mental health apps copy fitness patterns: streaks, scores, guilt. 90% of users quit within a month. Gentle UX is our answer — progress shown as narrative, not numbers. No pressure. The interface itself is therapeutic. That\'s not design. That\'s retention.',
            'Competitors can copy features. They can\'t copy a philosophy baked into every interaction.',
          ],
          status: 'Standard defined',
          why: 'Why they stay',
          highlight: 'GUX',
        },
      ],
    },
    business: {
      label: 'BUSINESS MODEL',
      title: 'B2B SaaS',
      revenuePoints: [
        { title: 'Practitioner subscription', desc: 'Monthly SaaS per seat' },
        { title: 'Members use free', desc: 'Invited by their practitioner' },
        { title: 'Clinic/enterprise tiers', desc: 'Volume pricing for group practices' },
      ],
      gtmPoints: [
        { title: 'Start: Europe', desc: 'France, UK, Germany' },
        { title: 'Expand: Global', desc: 'North America, APAC' },
        { title: 'Partnerships', desc: 'EHR integrations, employer programs' },
      ],
      metrics: [
        { value: '€29-79', desc: 'per practitioner/month' },
        { value: '90%+', desc: 'target gross margin' },
      ],
    },
    team: {
      label: 'THE TEAM',
      title: 'Built by people who care',
      members: [
        {
          name: 'Aditya',
          role: 'Product & Technology',
          background: 'Ex-[Company] • X years in product & engineering',
          bio: 'Built the entire Bloomsline platform solo. Personal journey with mental health drives the mission.',
        },
        {
          name: 'Sarah',
          role: 'Sales & Operations',
          background: 'Ex-[Company] • X years in sales & ops',
          bio: 'Building the go-to-market engine. Passionate about making mental health support accessible.',
        },
      ],
      whyUsPoints: [
        'Personal connection to the problem — we built what we needed',
        'Full-stack execution — product built by founders, not outsourced',
        'Domain obsessed — 187 interviews across 7 countries',
      ],
    },
    ask: {
      label: 'THE ASK',
      title: 'Raising €500K - €750K',
      subtitle: 'Seed Round • 18 months runway',
      useOfFunds: [
        { label: 'Product Development', percent: 40 },
        { label: 'Team Growth', percent: 30 },
        { label: 'Go-to-Market', percent: 20 },
        { label: 'Operations', percent: 10 },
      ],
      milestones: [
        { title: 'Product-Market Fit', desc: '100+ paying practitioners, 80%+ retention' },
        { title: 'Team Expansion', desc: '2-3 key hires (eng, design, clinical)' },
        { title: 'European Presence', desc: 'France, UK, Germany launch' },
        { title: 'AI Enhancement', desc: 'Advanced Bloom capabilities' },
      ],
      vision: {
        title1: 'Beyond an app.',
        title2: 'A research lab for humanity.',
        phases: [
          'Therapeutic support platform',
          'Behavioral data labeling',
          'Human intelligence research lab',
        ],
      },
    },
    contact: {
      title: "Let's build the future of care",
      subtitle: 'Interested in joining our journey?',
      bookMeeting: 'Book a Meeting',
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
      traction: 'Traction',
      execution: 'Exécution',
      business: 'Modèle',
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
      title: 'Le timing est bon',
      reasons: [
        'Post-2020, la santé mentale est déstigmatisée',
        'Les compagnons IA sont socialement acceptés',
        'Medicare couvre la santé mentale numérique (Jan 2025)',
        'Les assurances exigent des progrès mesurables',
      ],
      tam: { label: 'TAM', value: '47 Mrd$', desc: 'Marché numérique santé mentale US d\'ici 2035' },
      sam: { label: 'SAM', value: '5,5 Mrd$', desc: 'Gestion de cabinet & outils entre-séances' },
      som: { label: 'SOM', value: '500 M$', desc: "Praticiens cherchant des outils d'engagement" },
      wedge: 'Chaque praticien amène 20-50 membres. Distribution intégrée, CAC plus bas que les apps B2C.',
      marketGrowth: '20% TCAC',
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
    traction: {
      label: 'TRACTION & PROGRÈS',
      title: 'Où nous en sommes',
      subtitle: "Ce n'est pas notre première tentative — c'est notre tentative éclairée.",
      research: [
        { value: '68', desc: 'Praticiens dans 7 pays' },
        { value: '119', desc: 'Entretiens utilisateurs' },
      ],
      pivotInsight: "Nous avons d'abord construit une plateforme de profils praticiens. Marché saturé, timing précoce. Mais nous avons découvert le vrai fossé : ce qui se passe entre les séances.",
      timeline: [
        { date: 'T1 2025', title: 'Pivot Doctalink', status: 'pivot' },
        { date: 'T3 2025', title: 'Début Bloomsline', status: 'done' },
        { date: 'Déc 2025', title: 'MVP Terminé', status: 'done' },
        { date: 'T1 2026', title: 'Recherche PMF', status: 'current' },
        { date: 'T2 2026', title: 'Lancement Bêta', status: 'upcoming' },
        { date: "T3 2026", title: "Passage à l'échelle", status: 'upcoming' },
      ],
      quote: '"Nous n\'avons pas juste construit un produit. Nous avons gagné l\'insight pour construire le bon."',
    },
    execution: {
      label: 'CONSTRUIRE LES FONDATIONS',
      title: 'Quatre piliers. Une entreprise.',
      subtitle: 'Un bon produit ne suffit pas. Nous construisons chaque couche nécessaire pour scaler.',
      why: 'Construire. Être trouvé. Convertir. Fidéliser.',
      areas: [
        {
          title: 'Produit',
          items: [
            'MVP complet — dashboard web + app mobile',
            'BCS — Bloom Context System — un modèle de contexte comportemental qui apprend de chaque moment capturé, comprend les patterns émotionnels dans le temps, et donne aux praticiens et membres un langage commun pour la croissance. Pas un chatbot. Un moteur de contexte pour le comportement humain.',
          ],
          status: 'MVP prêt',
          why: 'Le moteur',
          highlight: 'BCS',
        },
        {
          title: 'Présence Digitale',
          items: [
            'PLG — Practitioner-Led Growth — chaque praticien qui rejoint publie son histoire, son approche et son expertise via Bloomsline. Ils deviennent le contenu. Ils deviennent la distribution. Zéro budget pub, flywheel organique.',
            'Pages publiques SEO pour que les praticiens nous trouvent naturellement',
          ],
          status: 'Plan fondation 4 mois',
          why: 'Comment ils nous trouvent',
          highlight: 'PLG',
        },
        {
          title: 'Ventes',
          items: [
            'CNE — Care Network Effect — chaque praticien amène 20-50 membres. Ces membres voient d\'autres praticiens. Ces praticiens découvrent Bloomsline par leurs clients. Une vente génère la suivante. La croissance se compose à travers les relations de soin qui existent déjà.',
            'Programme early adopter transformant les premiers utilisateurs en ambassadeurs',
          ],
          status: 'Pipeline en cours',
          why: 'Comment on convertit',
          highlight: 'CNE',
        },
        {
          title: 'Gentle UX',
          items: [
            'GUX — Gentle UX — la plupart des apps santé mentale copient les patterns fitness : séries, scores, culpabilité. 90% des utilisateurs abandonnent en un mois. Gentle UX est notre réponse — le progrès montré en récit, pas en chiffres. Pas de pression. L\'interface elle-même est thérapeutique. Ce n\'est pas du design. C\'est de la rétention.',
            'Les concurrents peuvent copier les fonctionnalités. Pas une philosophie ancrée dans chaque interaction.',
          ],
          status: 'Standard défini',
          why: 'Pourquoi ils restent',
          highlight: 'GUX',
        },
      ],
    },
    business: {
      label: 'MODÈLE ÉCONOMIQUE',
      title: 'B2B SaaS',
      revenuePoints: [
        { title: 'Abonnement praticien', desc: 'SaaS mensuel par siège' },
        { title: 'Gratuit pour les membres', desc: 'Invités par leur praticien' },
        { title: 'Forfaits clinique/entreprise', desc: 'Tarification volume pour les cabinets de groupe' },
      ],
      gtmPoints: [
        { title: 'Départ : Europe', desc: 'France, UK, Allemagne' },
        { title: 'Expansion : Mondial', desc: 'Amérique du Nord, APAC' },
        { title: 'Partenariats', desc: 'Intégrations DSE, programmes employeurs' },
      ],
      metrics: [
        { value: '29-79€', desc: 'par praticien/mois' },
        { value: '90%+', desc: 'marge brute cible' },
      ],
    },
    team: {
      label: "L'ÉQUIPE",
      title: "Construit par des gens qui s'en soucient",
      members: [
        {
          name: 'Aditya',
          role: 'Produit & Technologie',
          background: 'Ex-[Entreprise] • X ans en produit & ingénierie',
          bio: 'A construit toute la plateforme Bloomsline seul. Parcours personnel avec la santé mentale motive la mission.',
        },
        {
          name: 'Sarah',
          role: 'Ventes & Opérations',
          background: 'Ex-[Entreprise] • X ans en ventes & ops',
          bio: "Construit le moteur go-to-market. Passionnée par rendre le soutien en santé mentale accessible.",
        },
      ],
      whyUsPoints: [
        'Connexion personnelle au problème — nous avons construit ce dont nous avions besoin',
        'Exécution full-stack — produit construit par les fondateurs, pas externalisé',
        'Obsédés par le domaine — 187 entretiens dans 7 pays',
      ],
    },
    ask: {
      label: 'LA DEMANDE',
      title: 'Levée de 500K€ - 750K€',
      subtitle: 'Seed Round • 18 mois de runway',
      useOfFunds: [
        { label: 'Développement Produit', percent: 40 },
        { label: 'Croissance Équipe', percent: 30 },
        { label: 'Go-to-Market', percent: 20 },
        { label: 'Opérations', percent: 10 },
      ],
      milestones: [
        { title: 'Product-Market Fit', desc: '100+ praticiens payants, 80%+ rétention' },
        { title: 'Expansion Équipe', desc: '2-3 recrutements clés (dev, design, clinique)' },
        { title: 'Présence Européenne', desc: 'Lancement France, UK, Allemagne' },
        { title: 'Amélioration IA', desc: 'Capacités Bloom avancées' },
      ],
      vision: {
        title1: "Au-delà d'une app.",
        title2: "Un laboratoire de recherche pour l'humanité.",
        phases: [
          'Plateforme de soutien thérapeutique',
          'Étiquetage de données comportementales',
          'Laboratoire de recherche en intelligence humaine',
        ],
      },
    },
    contact: {
      title: "Construisons l'avenir des soins",
      subtitle: 'Intéressé à rejoindre notre aventure ?',
      bookMeeting: 'Réserver un RDV',
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
    { id: 'traction', title: t.slides.traction },
    { id: 'execution', title: t.slides.execution },
    { id: 'business', title: t.slides.business },
    { id: 'team', title: t.slides.team },
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
          {currentSlide === 5 && <TractionSlide t={t.traction} />}
          {currentSlide === 6 && <ExecutionSlide t={t.execution} />}
          {currentSlide === 7 && <BusinessSlide t={t.business} />}
          {currentSlide === 8 && <TeamSlide t={t.team} />}
          {currentSlide === 9 && <AskSlide t={t.ask} />}
          {currentSlide === 10 && <ContactSlide t={t.contact} />}
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
// SLIDE 6: TRACTION — merged Traction + Progress timeline
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
                  {area.items.map((item, i) => {
                    const isBCS = 'highlight' in area && item.startsWith(area.highlight as string)
                    if (isBCS) {
                      const parts = item.split(' — ')
                      const name = parts.slice(0, 2).join(' — ')
                      const desc = parts.slice(2).join(' — ')
                      return (
                        <li key={i} className={`p-3 rounded-xl ${config.statusBg} border ${config.border}`}>
                          <p className={`text-sm font-bold ${config.color}`}>{name}</p>
                          <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{desc}</p>
                        </li>
                      )
                    }
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <Check className={`w-3.5 h-3.5 ${config.color} mt-0.5 flex-shrink-0`} />
                        <span>{item}</span>
                      </li>
                    )
                  })}
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

        {/* Vision teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-5 rounded-2xl bg-neutral-900 text-center"
        >
          <p className="text-white font-light text-lg">
            {t.vision.title1} <span className="text-teal-400 font-medium">{t.vision.title2}</span>
          </p>
          <div className="flex justify-center gap-4 mt-3">
            {t.vision.phases.map((phase, i) => {
              const phaseIcons = [Zap, Brain, Building2]
              const PhaseIcon = phaseIcons[i]
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <PhaseIcon className="w-3.5 h-3.5" />
                  {phase}
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}


// =============================================================================
// SLIDE 10: CONTACT
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

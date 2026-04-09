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
} from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

// ─────────────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────────────

const translations = {
  en: {
    slides: {
      hero: 'Open',
      silence: 'The Silence',
      origin: 'Origin',
      product: 'Product',
      whyNow: 'Why Now',
      model: 'Model',
      real: "What's Real",
      team: 'Team',
      vision: 'Vision',
      ask: 'The Ask',
      close: 'Close',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'Therapy happens in sessions.',
      title2: 'The work happens everywhere else.',
      subtitle: 'The between-session care platform.',
      stage: 'Pre-seed · Pre-revenue · 2026',
      cta: 'See what we built',
    },
    silence: {
      label: 'THE PROBLEM',
      headline: 'Therapy is structured around sessions.',
      headline2: 'Human change isn\'t.',
      inRoom: 'In the room',
      inRoomItems: ['reflection', 'interpretation', 'guidance'],
      inLife: 'In life',
      inLifeItems: ['arguments', 'stress', 'habits', 'decisions', '2am moments'],
      quote: '"My client shared something painful on Tuesday. By our next session, I\'d lost the thread. I spent 15 minutes catching up instead of doing the work."',
      quoteAttribution: 'Practitioner, Paris',
      stats: [
        { value: '~50%', label: 'of session time is catch-up', source: 'APA' },
        { value: '86%', label: 'get no mental health treatment', source: 'WHO 2025' },
        { value: '49%', label: 'already use AI tools', source: 'Sentio 2025' },
      ],
    },
    origin: {
      label: 'HOW WE GOT HERE',
      headline: 'We built the wrong thing first.',
      para1: 'In 2023, Sarah and I built Doctalink — a way to find a therapist based on values, not degrees. It failed.',
      para2: 'But in 119 interviews across 7 countries, the same thing kept coming up: finding a therapist wasn\'t the problem.',
      para3: 'The silence after was.',
      para4: 'Bloomsline is what we built with that insight.',
      quote: 'We didn\'t find a problem and build a product. We earned the insight through a product that failed.',
      timeline1: '2023',
      timeline1Label: 'Doctalink',
      timeline2: '2024-25',
      timeline2Label: '119 interviews · 7 countries',
      timeline3: '2026',
      timeline3Label: 'Bloomsline — live',
    },
    product: {
      label: 'WHAT WE BUILT',
      headline: 'Bloomsline makes what happens between sessions visible.',
      practitionerTag: 'For practitioners',
      practitionerTitle: 'Walk into every session prepared.',
      practitionerItems: [
        'Pre-session context, not catch-up',
        'Resources in one place, connected to the person',
        'Less admin, more presence',
      ],
      memberTag: 'For members',
      memberTitle: '10 seconds. No streaks. No guilt.',
      memberItems: [
        'Capture a moment — photo, voice, a few words',
        'Bloom AI companion, always in context',
        'Quiet progress, not performance',
      ],
      connector: 'The same person. Both sides of the room.',
      footer: 'Live in production · Web + mobile · EN + FR',
    },
    whyNow: {
      label: 'WHY NOW',
      headline: 'Three things just became true.',
      item1Title: 'B2C therapy collapsed.',
      item1Body: 'BetterHelp is down. Woebot shut down. The market learned you can\'t cut out the therapist.',
      item2Title: 'AI is clinically acceptable.',
      item2Body: '49% of people with mental health issues already use AI tools. The resistance is gone.',
      item3Title: 'Europe has a regulatory moat.',
      item3Body: 'EU AI Act mandates healthcare AI compliance by August 2026. Building compliant from day 1 is a 12–24 month lead over US competitors.',
      closing: 'Zero AI-native clinical SaaS in EU. The wedge is open.',
    },
    model: {
      label: 'THE MODEL',
      headline: 'Practitioners are our distribution.',
      flow1Label: '1 practitioner',
      flow1Value: '€29 / month',
      flow2Label: 'brings',
      flow2Value: '20–50 members',
      flow3Label: 'who invite',
      flow3Value: 'peers, organically',
      revenueTitle: 'Revenue',
      revenueItems: [
        '€19 / €29 / €49 per seat',
        '~83% modeled gross margin',
        'Future: member premium €3/mo',
      ],
      compoundTitle: 'Why it compounds',
      compoundItems: [
        'Practitioners refer each other in a tight community',
        'SEO-indexed practitioner profiles',
        'Every member is a future practitioner-referrer',
      ],
      footnote: 'Solo practitioner baseline: €4,800/mo. One prevented cancellation pays for 6 months of Bloomsline.',
    },
    real: {
      label: "WHAT'S REAL",
      headline: "We're pre-revenue. The product isn't.",
      builtLabel: 'BUILT',
      builtItems: [
        'Practitioner web app',
        'Member mobile app',
        'Bloom AI companion',
        '3 languages · 24+ API endpoints',
        'Live in production',
      ],
      learnedLabel: 'LEARNED',
      learnedItems: [
        '119 interviews · 7 countries',
        '15 beta testers',
        'Pivoted once',
        'Found the wedge',
      ],
      honestLabel: 'HONEST',
      honestItems: [
        'No PMF yet — close',
        'Pricing not set — learning',
        'Two people — moving fast',
      ],
      quote: 'This isn\'t a deck. It\'s a working platform you can touch today.',
    },
    team: {
      label: 'THE TEAM',
      headline: 'Two people. Built in-house. Near-zero burn.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Sales & Operations',
      sarahBio: 'Talks to practitioners. Understands their world. Runs GTM.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Product & Technology',
      adityaBio: 'Built everything — web and mobile. Personal connection to the problem.',
      quote: 'We built what most teams take 18 months and €1M to build — with near-zero burn. That\'s not a limitation. That\'s proof we execute.',
      footnote: 'Actively looking for a clinical advisor. The clinical voice is in the product — not yet on the cap table.',
    },
    vision: {
      label: 'THE LONG GAME',
      headline: 'Software today.',
      headline2: 'Infrastructure tomorrow.',
      viewMore: 'View more',
      showLess: 'Show less',
      buildingLabel: 'How',
      unlocksLabel: 'What it unlocks',
      impactLabel: 'Business impact',
      headsLabel: 'Where it heads',
      todayTag: 'Today',
      todayTitle: 'We sell a platform to practitioners.',
      todayBody: 'Get 100+ paying. Prove patients keep coming back.',
      todayBuilding: 'Practitioner web app, member mobile app, Bloom AI — live in production.',
      todayUnlocks: 'First-party data on what actually predicts patient continuity.',
      todayImpact: '100+ paying practitioners by M12 → €30K+ ARR. Proof of model.',
      todayHeads: 'A trusted relationship in the most sensitive data category in tech.',
      nextTag: 'Next',
      nextTitle: 'We turn the platform into a dataset.',
      nextBody: 'Turn what we capture into insights researchers and insurers pay for.',
      nextBuilding: 'Anonymized behavioral patterns across thousands of practitioner–patient loops.',
      nextUnlocks: 'The first longitudinal "moments → interventions → outcomes" dataset outside academia.',
      nextImpact: 'Research partnerships, insurance pilots, premium analytics tier for practitioners.',
      nextHeads: 'From "a tool we sell" to "the data partner the industry needs."',
      laterTag: 'Eventually',
      laterTitle: 'We turn the dataset into infrastructure.',
      laterBody: 'Become the layer every mental health tool plugs into.',
      laterBuilding: 'An interoperable layer for clinical workflows, research, and insurance.',
      laterUnlocks: 'The industry standard for therapeutic continuity data in Europe.',
      laterImpact: 'Multi-product SaaS · data licensing · research partnerships.',
      laterHeads: 'The default substrate for how mental health care is measured and improved.',
      footnote: 'Vision earns the right to exist through execution. Right now, we\'re heads-down on Today.',
    },
    ask: {
      label: 'THE ASK',
      headline: 'Raising €400–500K pre-seed.',
      subhead: '18 months of runway. Three milestones.',
      m6Label: 'M6',
      m6Value: '30–50 paying practitioners',
      m12Label: 'M12',
      m12Value: '100+ practitioners · 80%+ retention',
      m12Note: 'PMF signal',
      m18Label: 'M18',
      m18Value: '€100K+ ARR',
      fundsLabel: 'Use of funds',
      fundsItems: [
        { label: 'Product', value: '40%' },
        { label: 'Team', value: '25%' },
        { label: 'Go-to-market', value: '25%' },
        { label: 'Operations', value: '10%' },
      ],
      closing: 'Enough to find product-market fit without compromising the story we\'re building.',
    },
    close: {
      line1: 'Care doesn\'t happen once a week.',
      line2: 'Life happens every day.',
      line3: 'And today, nothing connects the two.',
      line4: "That's the layer we're building.",
      cta: "Let's talk.",
      bookCall: 'Book a 20-min call',
      emailUs: 'hi@bloomsline.com',
      copyright: '© 2026 Bloomsline',
    },
  },
  fr: {
    slides: {
      hero: 'Ouverture',
      silence: 'Le Silence',
      origin: 'Origine',
      product: 'Produit',
      whyNow: 'Pourquoi Maintenant',
      model: 'Modèle',
      real: 'Ce Qui Est Réel',
      team: 'Équipe',
      vision: 'Vision',
      ask: 'La Demande',
      close: 'Conclusion',
    },
    hero: {
      tag: 'Bloomsline',
      title1: 'La thérapie se passe en séance.',
      title2: 'Le travail se passe partout ailleurs.',
      subtitle: 'La plateforme de soins entre les séances.',
      stage: 'Pre-seed · Pré-revenu · 2026',
      cta: 'Voir ce que nous avons construit',
    },
    silence: {
      label: 'LE PROBLÈME',
      headline: 'La thérapie est structurée autour des séances.',
      headline2: 'Le changement humain, non.',
      inRoom: 'Dans la pièce',
      inRoomItems: ['réflexion', 'interprétation', 'accompagnement'],
      inLife: 'Dans la vie',
      inLifeItems: ['disputes', 'stress', 'habitudes', 'décisions', 'moments de 2h du matin'],
      quote: '"Mon patient m\'a partagé quelque chose de douloureux mardi. À notre prochaine séance, j\'avais perdu le fil. J\'ai passé 15 minutes à rattraper au lieu de faire le travail."',
      quoteAttribution: 'Praticienne, Paris',
      stats: [
        { value: '~50%', label: 'du temps de séance en rattrapage', source: 'APA' },
        { value: '86%', label: 'sans traitement de santé mentale', source: 'OMS 2025' },
        { value: '49%', label: 'utilisent déjà l\'IA', source: 'Sentio 2025' },
      ],
    },
    origin: {
      label: 'COMMENT NOUS SOMMES ARRIVÉS ICI',
      headline: 'Nous avons d\'abord construit la mauvaise chose.',
      para1: 'En 2023, Sarah et moi avons construit Doctalink — un moyen de trouver un thérapeute basé sur les valeurs, pas les diplômes. Ça a échoué.',
      para2: 'Mais en 119 entretiens à travers 7 pays, la même chose revenait : trouver un thérapeute n\'était pas le problème.',
      para3: 'Le silence après, l\'était.',
      para4: 'Bloomsline est ce que nous avons construit avec cette insight.',
      quote: 'Nous n\'avons pas trouvé un problème puis construit un produit. Nous avons gagné l\'insight à travers un produit qui a échoué.',
      timeline1: '2023',
      timeline1Label: 'Doctalink',
      timeline2: '2024-25',
      timeline2Label: '119 entretiens · 7 pays',
      timeline3: '2026',
      timeline3Label: 'Bloomsline — en production',
    },
    product: {
      label: 'CE QUE NOUS AVONS CONSTRUIT',
      headline: 'Bloomsline rend visible ce qui se passe entre les séances.',
      practitionerTag: 'Pour les praticiens',
      practitionerTitle: 'Entrer dans chaque séance préparé.',
      practitionerItems: [
        'Contexte avant séance, pas de rattrapage',
        'Ressources en un seul endroit, connectées à la personne',
        'Moins d\'admin, plus de présence',
      ],
      memberTag: 'Pour les membres',
      memberTitle: '10 secondes. Pas de streaks. Pas de culpabilité.',
      memberItems: [
        'Capturer un moment — photo, voix, quelques mots',
        'Bloom, un compagnon IA toujours en contexte',
        'Progression silencieuse, pas de performance',
      ],
      connector: 'La même personne. Des deux côtés de la pièce.',
      footer: 'En production · Web + mobile · EN + FR',
    },
    whyNow: {
      label: 'POURQUOI MAINTENANT',
      headline: 'Trois choses viennent de devenir vraies.',
      item1Title: 'La thérapie B2C s\'est effondrée.',
      item1Body: 'BetterHelp est en baisse. Woebot a fermé. Le marché a appris qu\'on ne peut pas exclure le thérapeute.',
      item2Title: 'L\'IA est cliniquement acceptable.',
      item2Body: '49% des personnes ayant des problèmes de santé mentale utilisent déjà l\'IA. La résistance a disparu.',
      item3Title: 'L\'Europe a un fossé réglementaire.',
      item3Body: 'L\'AI Act européen impose la conformité IA santé d\'ici août 2026. Construire conforme dès le jour 1, c\'est 12–24 mois d\'avance sur les concurrents US.',
      closing: 'Zéro SaaS clinique AI-native en Europe. La fenêtre est ouverte.',
    },
    model: {
      label: 'LE MODÈLE',
      headline: 'Les praticiens sont notre distribution.',
      flow1Label: '1 praticien',
      flow1Value: '€29 / mois',
      flow2Label: 'apporte',
      flow2Value: '20–50 membres',
      flow3Label: 'qui invitent',
      flow3Value: 'leurs pairs, organiquement',
      revenueTitle: 'Revenus',
      revenueItems: [
        '€19 / €29 / €49 par siège',
        '~83% de marge brute modélisée',
        'Futur : premium membre €3/mois',
      ],
      compoundTitle: 'Pourquoi ça compose',
      compoundItems: [
        'Les praticiens se recommandent dans une communauté serrée',
        'Profils praticiens indexés SEO',
        'Chaque membre est un futur parrain de praticien',
      ],
      footnote: 'Revenu de base d\'un praticien solo : €4 800/mois. Une annulation évitée paie 6 mois de Bloomsline.',
    },
    real: {
      label: 'CE QUI EST RÉEL',
      headline: 'Nous sommes pré-revenu. Le produit, non.',
      builtLabel: 'CONSTRUIT',
      builtItems: [
        'App web praticien',
        'App mobile membre',
        'Compagnon IA Bloom',
        '3 langues · 24+ endpoints API',
        'En production',
      ],
      learnedLabel: 'APPRIS',
      learnedItems: [
        '119 entretiens · 7 pays',
        '15 beta testeurs',
        'Un pivot',
        'Wedge trouvé',
      ],
      honestLabel: 'HONNÊTE',
      honestItems: [
        'Pas encore de PMF — proche',
        'Prix non fixé — on apprend',
        'Deux personnes — rapide',
      ],
      quote: 'Ce n\'est pas un deck. C\'est une plateforme fonctionnelle que vous pouvez toucher aujourd\'hui.',
    },
    team: {
      label: 'L\'ÉQUIPE',
      headline: 'Deux personnes. Tout fait en interne. Burn quasi nul.',
      sarahName: 'Sarah Lagzouli',
      sarahRole: 'Ventes & Opérations',
      sarahBio: 'Parle aux praticiens. Comprend leur monde. Dirige le GTM.',
      adityaName: 'Aditya Channe',
      adityaRole: 'Produit & Technologie',
      adityaBio: 'A tout construit — web et mobile. Connexion personnelle au problème.',
      quote: 'Nous avons construit ce que la plupart des équipes mettent 18 mois et €1M à construire — avec un burn quasi nul. Ce n\'est pas une limitation. C\'est la preuve que nous exécutons.',
      footnote: 'Nous cherchons activement un conseiller clinique. La voix clinique est dans le produit — pas encore au cap table.',
    },
    vision: {
      label: 'LE LONG TERME',
      headline: 'Logiciel aujourd\'hui.',
      headline2: 'Infrastructure demain.',
      viewMore: 'Voir plus',
      showLess: 'Voir moins',
      buildingLabel: 'Comment',
      unlocksLabel: 'Ce que ça débloque',
      impactLabel: 'Impact business',
      headsLabel: 'Direction',
      todayTag: 'Aujourd\'hui',
      todayTitle: 'On vend une plateforme aux praticiens.',
      todayBody: 'Atteindre 100+ praticiens payants. Prouver que les patients reviennent.',
      todayBuilding: 'App web praticien, app mobile membre, Bloom IA — en production.',
      todayUnlocks: 'Données de première main sur ce qui prédit vraiment la continuité patient.',
      todayImpact: '100+ praticiens payants à M12 → €30K+ ARR. Preuve du modèle.',
      todayHeads: 'Une relation de confiance dans la catégorie de données la plus sensible.',
      nextTag: 'Ensuite',
      nextTitle: 'On transforme la plateforme en dataset.',
      nextBody: 'Transformer ce qu\'on capture en insights que chercheurs et assureurs paient.',
      nextBuilding: 'Patterns comportementaux anonymisés sur des milliers de boucles praticien-patient.',
      nextUnlocks: 'Premier dataset longitudinal "moments → interventions → résultats" hors académique.',
      nextImpact: 'Partenariats recherche, pilotes assurance, tier analytics premium pour praticiens.',
      nextHeads: 'D\'un "outil qu\'on vend" à "le partenaire data dont l\'industrie a besoin."',
      laterTag: 'Un jour',
      laterTitle: 'On transforme le dataset en infrastructure.',
      laterBody: 'Devenir la couche dans laquelle chaque outil de santé mentale se branche.',
      laterBuilding: 'Une couche interopérable pour les workflows cliniques, la recherche, l\'assurance.',
      laterUnlocks: 'Le standard de l\'industrie pour les données de continuité thérapeutique en Europe.',
      laterImpact: 'SaaS multi-produits · licences data · partenariats recherche.',
      laterHeads: 'Le substrat par défaut pour mesurer et améliorer les soins de santé mentale.',
      footnote: 'La vision gagne le droit d\'exister par l\'exécution. Là, on est concentrés sur Aujourd\'hui.',
    },
    ask: {
      label: 'LA DEMANDE',
      headline: 'Levée de €400–500K en pre-seed.',
      subhead: '18 mois de runway. Trois jalons.',
      m6Label: 'M6',
      m6Value: '30–50 praticiens payants',
      m12Label: 'M12',
      m12Value: '100+ praticiens · 80%+ de rétention',
      m12Note: 'signal PMF',
      m18Label: 'M18',
      m18Value: '€100K+ ARR',
      fundsLabel: 'Utilisation des fonds',
      fundsItems: [
        { label: 'Produit', value: '40%' },
        { label: 'Équipe', value: '25%' },
        { label: 'Go-to-market', value: '25%' },
        { label: 'Opérations', value: '10%' },
      ],
      closing: 'Assez pour trouver le product-market fit sans compromettre l\'histoire que nous construisons.',
    },
    close: {
      line1: 'Les soins ne se passent pas une fois par semaine.',
      line2: 'La vie se passe chaque jour.',
      line3: 'Et aujourd\'hui, rien ne connecte les deux.',
      line4: 'C\'est la couche que nous construisons.',
      cta: 'Discutons.',
      bookCall: 'Réserver un appel de 20 min',
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
    { id: 'origin', title: t.slides.origin },
    { id: 'product', title: t.slides.product },
    { id: 'whyNow', title: t.slides.whyNow },
    { id: 'model', title: t.slides.model },
    { id: 'real', title: t.slides.real },
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
  const isDark = currentSlide === 4 // whyNow

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: isDark ? '#0a0a0a' : '#FAF8F5' }}>
      {/* Language Toggle */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
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
          {currentSlide === 0 && <HeroSlide onNext={nextSlide} t={t.hero} />}
          {currentSlide === 1 && <SilenceSlide t={t.silence} />}
          {currentSlide === 2 && <OriginSlide t={t.origin} />}
          {currentSlide === 3 && <ProductSlide t={t.product} />}
          {currentSlide === 4 && <WhyNowSlide t={t.whyNow} />}
          {currentSlide === 5 && <ModelSlide t={t.model} />}
          {currentSlide === 6 && <RealSlide t={t.real} />}
          {currentSlide === 7 && <TeamSlide t={t.team} />}
          {currentSlide === 8 && <VisionSlide t={t.vision} />}
          {currentSlide === 9 && <AskSlide t={t.ask} />}
          {currentSlide === 10 && <CloseSlide t={t.close} />}
        </motion.div>
      </AnimatePresence>

      {/* Slide counter */}
      <div className={`fixed bottom-6 right-6 z-50 text-sm font-medium ${isDark ? 'text-white/40' : 'text-neutral-400'}`}>
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
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
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm tracking-[0.3em] text-neutral-500 mb-12 uppercase"
        >
          {t.tag}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-4xl sm:text-5xl lg:text-[4.5rem] font-light text-neutral-900 leading-[1.1] tracking-tight mb-4"
        >
          {t.title1}
        </motion.h1>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="text-4xl sm:text-5xl lg:text-[4.5rem] font-light leading-[1.1] tracking-tight mb-16"
        >
          <span className="text-teal-700">{t.title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-xl text-neutral-600 mb-2"
        >
          {t.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-sm text-neutral-400 mb-12"
        >
          {t.stage}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <Button
            onClick={onNext}
            className="px-8 py-6 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-base font-medium"
          >
            {t.cta}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
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
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-2"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-400 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline2}
        </motion.h2>

        {/* Two column contrast */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 gap-12 mb-16 max-w-3xl"
        >
          <div>
            <p className="text-xs tracking-[0.2em] text-neutral-400 uppercase mb-4">{t.inRoom}</p>
            <ul className="space-y-2">
              {t.inRoomItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-700 font-light">{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-l border-neutral-200 pl-12">
            <p className="text-xs tracking-[0.2em] text-teal-700 uppercase mb-4">{t.inLife}</p>
            <ul className="space-y-2">
              {t.inLifeItems.map((item, i) => (
                <li key={i} className="text-lg text-neutral-900 font-light">{item}</li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Pull quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="border-l-2 border-teal-600 pl-6 py-2 max-w-3xl mb-12"
        >
          <p className="text-xl text-neutral-700 italic leading-relaxed font-light">
            {t.quote}
          </p>
          <footer className="text-sm text-neutral-500 mt-3">— {t.quoteAttribution}</footer>
        </motion.blockquote>

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
              <span className="text-xs text-neutral-500">{stat.label}</span>
              <span className="text-xs text-neutral-300">· {stat.source}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 3: ORIGIN — "We built the wrong thing first"
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-5 text-lg text-neutral-700 font-light leading-relaxed"
          >
            <p>{t.para1}</p>
            <p>{t.para2}</p>
            <p className="text-neutral-900 font-medium">{t.para3}</p>
            <p className="text-neutral-700">{t.para4}</p>
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="lg:col-span-3 lg:pl-12 lg:border-l border-neutral-200"
          >
            <p className="text-3xl lg:text-4xl font-light italic text-neutral-900 leading-snug">
              &ldquo;{t.quote}&rdquo;
            </p>
          </motion.blockquote>
        </div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="pt-8 border-t border-neutral-200"
        >
          <div className="flex items-start justify-between max-w-3xl">
            <div>
              <p className="text-sm font-medium text-neutral-900">{t.timeline1}</p>
              <p className="text-xs text-neutral-500 mt-1">{t.timeline1Label}</p>
            </div>
            <div className="flex-1 mx-6 mt-2 border-t border-dashed border-neutral-300" />
            <div>
              <p className="text-sm font-medium text-neutral-900">{t.timeline2}</p>
              <p className="text-xs text-neutral-500 mt-1">{t.timeline2Label}</p>
            </div>
            <div className="flex-1 mx-6 mt-2 border-t border-dashed border-neutral-300" />
            <div>
              <p className="text-sm font-medium text-teal-700">{t.timeline3}</p>
              <p className="text-xs text-teal-600 mt-1">{t.timeline3Label}</p>
            </div>
          </div>
        </motion.div>
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
          className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 leading-[1.15] tracking-tight mb-16 max-w-4xl"
        >
          {t.headline}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#D4856A' }}>
              {t.practitionerTag}
            </p>
            <h3 className="text-2xl font-medium text-neutral-900 mb-6">{t.practitionerTitle}</h3>
            <ul className="space-y-3">
              {t.practitionerItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 flex items-start gap-3 font-light">
                  <span className="text-neutral-300 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="md:border-l border-neutral-200 md:pl-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase mb-3 text-teal-700">
              {t.memberTag}
            </p>
            <h3 className="text-2xl font-medium text-neutral-900 mb-6">{t.memberTitle}</h3>
            <ul className="space-y-3">
              {t.memberItems.map((item, i) => (
                <li key={i} className="text-base text-neutral-700 flex items-start gap-3 font-light">
                  <span className="text-neutral-300 mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-lg text-neutral-600 italic text-center mb-10"
        >
          {t.connector}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-xs tracking-[0.2em] uppercase text-neutral-400 text-center pt-8 border-t border-neutral-200"
        >
          {t.footer}
        </motion.p>
      </div>
    </div>
  )
}

// =============================================================================
// SLIDE 5: WHY NOW — dark slide
// =============================================================================

function WhyNowSlide({ t }: { t: typeof translations.en.whyNow }) {
  return (
    <div className="h-full w-full flex items-center justify-center px-8 overflow-y-auto" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="max-w-6xl w-full py-20">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs tracking-[0.3em] text-teal-400 uppercase mb-6"
        >
          {t.label}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.1] tracking-tight mb-20"
        >
          {t.headline}
        </motion.h2>

        <div className="space-y-10 mb-16 max-w-4xl">
          {[
            { title: t.item1Title, body: t.item1Body, num: '01' },
            { title: t.item2Title, body: t.item2Body, num: '02' },
            { title: t.item3Title, body: t.item3Body, num: '03' },
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
                <h3 className="text-2xl font-medium text-white mb-2">{item.title}</h3>
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
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight mb-16"
        >
          {t.headline}
        </motion.h2>

        {/* Flow math */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-4 mb-16 max-w-3xl"
        >
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">{t.flow1Label}</span>
            <span className="text-2xl font-light text-neutral-900">{t.flow1Value}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">→ {t.flow2Label}</span>
            <span className="text-2xl font-light text-teal-700">{t.flow2Value}</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-sm text-neutral-500 w-32">→ {t.flow3Label}</span>
            <span className="text-2xl font-light text-neutral-900">{t.flow3Value}</span>
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
          {t.footnote}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {[
            { label: t.builtLabel, items: t.builtItems, color: 'text-teal-700' },
            { label: t.learnedLabel, items: t.learnedItems, color: 'text-neutral-700' },
            { label: t.honestLabel, items: t.honestItems, color: 'text-neutral-500' },
          ].map((col, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
            >
              <p className={`text-xs tracking-[0.25em] uppercase mb-5 font-mono ${col.color}`}>{col.label}</p>
              <ul className="space-y-2.5">
                {col.items.map((item, j) => (
                  <li key={j} className="text-base text-neutral-700 font-light leading-snug">{item}</li>
                ))}
              </ul>
            </motion.div>
          ))}
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
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const subLabels = [t.buildingLabel, t.unlocksLabel, t.impactLabel, t.headsLabel]

  const phases = [
    {
      tag: t.todayTag,
      title: t.todayTitle,
      body: t.todayBody,
      items: [t.todayBuilding, t.todayUnlocks, t.todayImpact, t.todayHeads],
      accent: true,
    },
    {
      tag: t.nextTag,
      title: t.nextTitle,
      body: t.nextBody,
      items: [t.nextBuilding, t.nextUnlocks, t.nextImpact, t.nextHeads],
      accent: false,
    },
    {
      tag: t.laterTag,
      title: t.laterTitle,
      body: t.laterBody,
      items: [t.laterBuilding, t.laterUnlocks, t.laterImpact, t.laterHeads],
      accent: false,
    },
  ]

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
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-neutral-900 leading-[1.1] tracking-tight"
        >
          {t.headline}
        </motion.h2>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-light text-teal-700 leading-[1.1] tracking-tight mb-20"
        >
          {t.headline2}
        </motion.h2>

        {/* Three phases — one supporting line each, expandable */}
        <div className="space-y-8 mb-12">
          {phases.map((phase, i) => {
            const isOpen = expanded.has(i)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="grid grid-cols-12 gap-6 items-baseline"
              >
                <div className="col-span-12 lg:col-span-2">
                  <p className={`text-xs tracking-[0.25em] uppercase font-mono ${phase.accent ? 'text-teal-700' : 'text-neutral-400'}`}>
                    {phase.tag}
                  </p>
                </div>
                <div className="col-span-12 lg:col-span-10">
                  <p className={`text-xl lg:text-2xl font-light leading-snug mb-2 ${phase.accent ? 'text-neutral-900' : 'text-neutral-700'}`}>
                    {phase.title}
                  </p>
                  <p className="text-sm text-neutral-500 font-light">{phase.body}</p>

                  <button
                    onClick={() => toggle(i)}
                    className="mt-3 inline-flex items-center gap-1 text-[11px] tracking-wide text-neutral-400 hover:text-teal-700 transition-colors group"
                  >
                    <span>{isOpen ? t.showLess : t.viewMore}</span>
                    {isOpen
                      ? <ChevronUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
                      : <ChevronDown className="w-3 h-3 transition-transform group-hover:translate-y-0.5" />
                    }
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mt-5 pt-5 border-t border-neutral-200">
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
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

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-3 gap-8 mb-16 max-w-4xl"
        >
          {[
            { label: t.m6Label, value: t.m6Value, note: null },
            { label: t.m12Label, value: t.m12Value, note: t.m12Note },
            { label: t.m18Label, value: t.m18Value, note: null },
          ].map((m, i) => (
            <div key={i} className="relative">
              <div className="w-3 h-3 rounded-full bg-teal-600 mb-4" />
              <p className="text-sm font-medium text-teal-700 mb-2">{m.label}</p>
              <p className="text-lg text-neutral-900 font-light leading-snug">{m.value}</p>
              {m.note && <p className="text-xs text-neutral-500 italic mt-1">{m.note}</p>}
            </div>
          ))}
        </motion.div>

        {/* Use of funds */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="pt-8 border-t border-neutral-200 mb-10"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">{t.fundsLabel}</p>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {t.fundsItems.map((item, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-2xl font-light text-neutral-900">{item.value}</span>
                <span className="text-sm text-neutral-500">{item.label}</span>
              </div>
            ))}
          </div>
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
            <Button className="px-7 py-6 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-base font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              {t.bookCall}
            </Button>
          </a>
          <a href={`mailto:${t.emailUs}`}>
            <Button variant="outline" className="px-7 py-6 border-neutral-300 text-neutral-900 hover:bg-neutral-50 rounded-full text-base font-medium">
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

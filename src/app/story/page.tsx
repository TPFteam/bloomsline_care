'use client'

import { Globe, Download, ArrowLeft, Heart, Lightbulb, Layers, Sparkles, BarChart3, Users, MessageSquareQuote, Target, Shield, ExternalLink, ArrowRight, Monitor, Smartphone, Brain, RefreshCw, ChevronRight, AlertTriangle, CheckCircle2, HelpCircle, XCircle, Microscope } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const translations = {
  en: {
    title: 'The Bloomsline Story',
    subtitle: 'Everything you need to know — from why we started to where we\'re going',
    back: 'Back to Dataroom',
    nav: {
      origin: 'Origin',
      problem: 'Problem',
      product: 'Product',
      loop: 'The Loop',
      different: 'Edge',
      status: 'Status',
      voices: 'Voices',
      business: 'Business',
      gaps: 'Gaps',
      deeptech: 'Deep Tech',
      join: 'Join',
    },
    origin: {
      title: 'How We Got Here',
      timeline: [
        { year: 'Personal', label: 'We suffered', detail: 'Both of us went through mental health struggles. Couldn\'t find tools that felt human.' },
        { year: 'Doctalink', label: 'We built Doctalink, a doctor-patient platform (2023)', detail: 'Saw firsthand how fragmented practitioner workflows are.' },
        { year: 'Discovery', label: 'Talked to real practitioners', detail: 'Google Drive folders, paper notebooks, zero continuity between sessions.' },
        { year: 'Bloomsline', label: 'Built the product', detail: 'Didn\'t study the market in a slide deck. Stumbled into it, built, showed, iterated.' },
      ],
    },
    problem: {
      title: 'The Problem',
      before: {
        label: 'Today (Without Bloomsline)',
        items: [
          'Google Drive folder per patient',
          'Paper notebooks, scattered notes',
          'Can\'t find what was said 5 sessions ago',
          'Nothing between sessions — client waits',
          'No way to share resources and track usage',
          'Tools that look like they were designed in 2005',
        ],
      },
      after: {
        label: 'With Bloomsline Care',
        items: [
          'Everything in one place per member',
          'Smart notes with AI-powered search',
          'Bloom surfaces relevant history instantly',
          'Resources shared and tracked between sessions',
          'Member engages daily via mobile app',
          'UX therapists understand in minutes',
        ],
      },
    },
    product: {
      title: 'What We Built',
      platform: { name: 'Practitioner Platform', emoji: 'Web', features: ['Sessions & scheduling', 'Progress notes', 'Milestones tracking', 'Resource library', 'Member management', 'AI pre-session briefs'] },
      mobile: { name: 'Member App', emoji: 'Mobile', features: ['Shared resources', 'Moments capture', 'Emotional check-ins', 'Bloom AI companion', 'Daily reflections', 'Progress visibility'] },
      ai: { name: 'Bloom AI', emoji: 'AI', features: ['Pre-session briefs', 'Note surfacing', 'Pattern tracking', 'Session summaries', 'Risk signals', 'Clinical assistant'] },
      link: { text: 'Technical Overview', href: '/tech-overview' },
    },
    loop: {
      title: 'The Loop — Why It Matters',
      subtitle: 'No competitor connects both sides. We do.',
      steps: [
        { label: 'Practitioner creates', detail: 'Resources, exercises, assessments', color: 'teal' },
        { label: 'Shares with member', detail: 'Assigned directly to their profile', color: 'blue' },
        { label: 'Member engages', detail: 'Completes on mobile, captures moments', color: 'violet' },
        { label: 'Practitioner sees engagement', detail: 'Before the next session — informed, prepared', color: 'emerald' },
      ],
    },
    different: {
      title: 'Our Edge',
      items: [
        { icon: 'loop', label: 'Full loop built', detail: 'Web + mobile + AI. Both sides connected.' },
        { icon: 'ai', label: 'AI that\'s actually useful', detail: '"What would a practitioner want 5 min before a session?"' },
        { icon: 'ux', label: 'UX they love', detail: '"I could figure this out without you explaining." — Yoann' },
        { icon: 'retention', label: 'Resources = retention', detail: '"The indirect key that triggers the decision to come back." — Kevin' },
      ],
      link: { text: 'Competitive Landscape', href: '/competitive-landscape' },
    },
    status: {
      title: 'Where We Are — March 2026',
      metrics: [
        { label: 'Product', value: 'Live', status: 'green' },
        { label: 'Revenue', value: '0 EUR', status: 'red' },
        { label: 'Team', value: '2 people', status: 'amber' },
        { label: 'Burn rate', value: 'Near zero', status: 'green' },
        { label: 'Demos done', value: 'Yes', status: 'green' },
        { label: 'PMF', value: 'Searching', status: 'amber' },
      ],
      links: [
        { text: 'What We Need', href: '/what-we-need' },
        { text: 'Unit Economics', href: '/unit-economics' },
      ],
    },
    voices: {
      title: 'Real Practitioner Voices',
      quotes: [
        { who: 'Sandra', role: 'Psychologist', text: '"It works like a second brain."', insight: '#1 pain: fragmentation' },
        { who: 'Kevin', role: 'Coach', text: '"Resources between sessions trigger the decision to come back."', insight: 'Resources = retention' },
        { who: 'Yoann', role: 'Therapist', text: '"I\'d invest 20 EUR/month — no problem."', insight: 'Price point validated' },
        { who: 'Patricia', role: 'Psychologist', text: '"I would never put patient data on a platform."', insight: 'Privacy = real barrier' },
      ],
    },
    business: {
      title: 'The Business',
      model: [
        { label: 'SaaS', detail: 'Essentiel 19 EUR/mo' },
        { label: 'Target', detail: 'Solo practitioners & small cabinets' },
        { label: 'B2C future', detail: 'Member app & Bloom companion' },
      ],
      funnel: [
        'Discovery call',
        'Personalized demo',
        'White-glove onboarding',
        'Active practitioner',
        'Members invited',
        'Loop activated',
      ],
      links: [
        { text: 'Business Canvas', href: '/business-canvas' },
        { text: 'Pricing Strategy', href: '/pricing-analysis' },
        { text: 'Go-to-Market', href: '/go-to-market' },
        { text: 'Market Sizing', href: '/market-sizing' },
        { text: 'Customer Personas', href: '/customer-personas' },
      ],
    },
    gaps: {
      title: 'What We Still Need to Figure Out',
      items: [
        { label: 'Product-market fit', status: 'searching', detail: 'Still looking for the wedge' },
        { label: 'First paying customer', status: 'blocked', detail: 'Interest but no revenue' },
        { label: 'Clinical expertise', status: 'missing', detail: 'No clinician on the team' },
        { label: 'Self-serve onboarding', status: 'unknown', detail: 'Currently hand-holding everyone' },
        { label: 'Regulation (GDPR, HDS)', status: 'learning', detail: 'Mapping the maze' },
      ],
      links: [
        { text: 'Full Gaps & Risks', href: '/what-we-need' },
        { text: 'Risk Analysis', href: '/risk-analysis' },
        { text: 'SWOT', href: '/swot-analysis' },
      ],
    },
    deeptech: {
      title: 'The Deep Tech Vision',
      subtitle: 'SaaS today. Deep tech tomorrow.',
      phases: [
        { phase: '1', label: 'Prove Therapy Works', timing: 'Now — M12', detail: 'Continuous outcome measurement from behavioral data. Not questionnaires — real signals.', color: 'violet', examples: [
          'Practitioner sees: "Sarah\'s anxiety dropped 40% over 3 months"',
          'Member sees their own progress visually over time',
          'Reports that prove therapy is working — for insurers, for clients, for themselves',
        ]},
        { phase: '2', label: 'Predict Before Crisis', timing: 'M6 — M18', detail: 'Practitioner alerts from mood, sleep, and engagement patterns. Each alert trains the AI.', color: 'blue', examples: [
          'Practitioner gets: "This member\'s sleep declined 5 days + mood dropping — check in?"',
          'Member gets a gentle nudge: "You seem off this week. Want to talk to your practitioner?"',
          'AI learns what patterns lead to relapse — before it happens',
        ]},
        { phase: '3', label: 'Intelligence Layer', timing: 'M18+', detail: 'From data platform to consumer products. Mental health becomes personalized and proactive.', color: 'emerald', examples: [
          'Personalized mental health wearables that understand your behavioral patterns',
          'Consumer wellness products built on real clinical data — not guesswork',
          'Anonymized research data that helps scientists understand mental health at scale',
          'AI that suggests "people with patterns like yours improved with X" — backed by real outcomes',
          'Wild dream: a brain-computer interface that reads emotional states directly — real-time mental health monitoring without self-reporting',
        ]},
      ],
      dataWeCollect: {
        title: 'Data We Already Collect',
        items: [
          { icon: 'mood', label: '14 moods daily' },
          { icon: 'sleep', label: 'Sleep & balance' },
          { icon: 'session', label: 'Session outcomes' },
          { icon: 'milestone', label: 'Milestone velocity' },
          { icon: 'homework', label: 'Homework completion' },
          { icon: 'engagement', label: 'Engagement trends' },
        ],
      },
      flywheel: [
        'More practitioners',
        'More behavioral data',
        'Better predictions',
        'Better outcomes',
      ],
      vs: [
        { name: 'Woebot / Wysa', us: 'Both sides of care', them: 'Consumer-only chatbot' },
        { name: 'Spring Health', us: 'Solo practitioner depth', them: 'Enterprise matching' },
        { name: 'SimplePractice', us: 'AI + outcome data', them: 'Practice management only' },
      ],
      vsLabel: { us: 'Us', them: 'Them' },
      moatTitle: 'The Moat',
      moatItems: [
        'Practitioner validates every prediction = labeled training data',
        'Both sides connected: daily behavior + clinical sessions',
        'Longitudinal data takes 6-12 months to build — can\'t shortcut it',
      ],
    },
    join: {
      title: 'Why Join Now',
      cards: [
        { icon: 'product', label: 'Working product', detail: 'Not a pitch deck — a live platform with real feedback' },
        { icon: 'equity', label: 'Founding equity', detail: 'Pre-revenue = maximum influence and ownership' },
        { icon: 'market', label: 'Growing market', detail: 'Mental health tooling is broken. Tailwinds are structural.' },
        { icon: 'honesty', label: 'Radical honesty', detail: 'This page exists because we believe in transparency over spin' },
      ],
      cta: { text: 'See Full Transparency: Greens, Greys & Reds', href: '/what-we-need' },
    },
    explore: {
      title: 'Explore the Full Dataroom',
      items: [
        { text: 'Pitch Deck', href: '/pitch' },
        { text: 'Financial Model', href: '/financial-model' },
        { text: 'Product Roadmap', href: '/roadmap' },
        { text: 'Strategic Recommendation', href: '/strategic-recommendation' },
        { text: 'GTM Playbook', href: '/gtm-playbook' },
        { text: 'Customer Journey', href: '/customer-journey' },
      ],
    },
  },
  fr: {
    title: 'L\'Histoire Bloomsline',
    subtitle: 'Tout ce qu\'il faut savoir — de pourquoi on a commence a ou on va',
    back: 'Retour au Dataroom',
    nav: {
      origin: 'Origine',
      problem: 'Probleme',
      product: 'Produit',
      loop: 'La Boucle',
      different: 'Avantage',
      status: 'Statut',
      voices: 'Voix',
      business: 'Business',
      gaps: 'Manques',
      deeptech: 'Deep Tech',
      join: 'Rejoindre',
    },
    origin: {
      title: 'Comment On en Est Arrives La',
      timeline: [
        { year: 'Personnel', label: 'On a souffert', detail: 'On a tous les deux traverse des epreuves de sante mentale. Pas trouve d\'outils humains.' },
        { year: 'Doctalink', label: 'On a construit Doctalink, une plateforme medecin-patient (2023)', detail: 'On a vu de premiere main la fragmentation des workflows praticiens.' },
        { year: 'Decouverte', label: 'Parle a de vrais praticiens', detail: 'Dossiers Google Drive, carnets papier, zero continuite entre seances.' },
        { year: 'Bloomsline', label: 'Construit le produit', detail: 'Pas etudie le marche dans un slide deck. Tombe dedans, construit, montre, itere.' },
      ],
    },
    problem: {
      title: 'Le Probleme',
      before: {
        label: 'Aujourd\'hui (Sans Bloomsline)',
        items: [
          'Un dossier Google Drive par patient',
          'Carnets papier, notes eparpillees',
          'Impossible de retrouver ce qui a ete dit il y a 5 seances',
          'Rien entre les seances — le client attend',
          'Pas moyen de partager des ressources et suivre l\'usage',
          'Des outils qui ont l\'air concu en 2005',
        ],
      },
      after: {
        label: 'Avec Bloomsline Care',
        items: [
          'Tout au meme endroit par membre',
          'Notes intelligentes avec recherche IA',
          'Bloom fait remonter l\'historique pertinent',
          'Ressources partagees et suivies entre seances',
          'Le membre s\'engage au quotidien via l\'app mobile',
          'UX que les therapeutes comprennent en minutes',
        ],
      },
    },
    product: {
      title: 'Ce Qu\'on a Construit',
      platform: { name: 'Plateforme Praticien', emoji: 'Web', features: ['Seances & agenda', 'Notes de suivi', 'Suivi de jalons', 'Bibliotheque de ressources', 'Gestion des membres', 'Briefs IA pre-seance'] },
      mobile: { name: 'App Membre', emoji: 'Mobile', features: ['Ressources partagees', 'Capture de moments', 'Check-ins emotionnels', 'Compagnon Bloom IA', 'Reflexions quotidiennes', 'Visibilite du progres'] },
      ai: { name: 'Bloom IA', emoji: 'IA', features: ['Briefs pre-seance', 'Remontee de notes', 'Suivi de patterns', 'Resumes de seance', 'Signaux de risque', 'Assistant clinique'] },
      link: { text: 'Apercu Technique', href: '/tech-overview' },
    },
    loop: {
      title: 'La Boucle — Pourquoi C\'est Important',
      subtitle: 'Aucun concurrent ne connecte les deux cotes. Nous si.',
      steps: [
        { label: 'Le praticien cree', detail: 'Ressources, exercices, evaluations', color: 'teal' },
        { label: 'Partage avec le membre', detail: 'Assigne directement a son profil', color: 'blue' },
        { label: 'Le membre s\'engage', detail: 'Complete sur mobile, capture des moments', color: 'violet' },
        { label: 'Le praticien voit l\'engagement', detail: 'Avant la prochaine seance — informe, prepare', color: 'emerald' },
      ],
    },
    different: {
      title: 'Notre Avantage',
      items: [
        { icon: 'loop', label: 'Boucle complete construite', detail: 'Web + mobile + IA. Les deux cotes connectes.' },
        { icon: 'ai', label: 'IA vraiment utile', detail: '"Que voudrait un praticien 5 min avant une seance ?"' },
        { icon: 'ux', label: 'UX qu\'ils adorent', detail: '"Je pourrais m\'en sortir sans qu\'on m\'explique." — Yoann' },
        { icon: 'retention', label: 'Ressources = retention', detail: '"La cle indirecte qui declenche la decision de revenir." — Kevin' },
      ],
      link: { text: 'Paysage Concurrentiel', href: '/competitive-landscape' },
    },
    status: {
      title: 'Ou On en Est — Mars 2026',
      metrics: [
        { label: 'Produit', value: 'Live', status: 'green' },
        { label: 'Revenu', value: '0 EUR', status: 'red' },
        { label: 'Equipe', value: '2 personnes', status: 'amber' },
        { label: 'Burn rate', value: 'Quasi zero', status: 'green' },
        { label: 'Demos faites', value: 'Oui', status: 'green' },
        { label: 'PMF', value: 'En recherche', status: 'amber' },
      ],
      links: [
        { text: 'Ce Dont On a Besoin', href: '/what-we-need' },
        { text: 'Unit Economics', href: '/unit-economics' },
      ],
    },
    voices: {
      title: 'Vraies Voix de Praticiens',
      quotes: [
        { who: 'Sandra', role: 'Psychologue', text: '"Ca fonctionne comme un second cerveau."', insight: 'Douleur #1 : fragmentation' },
        { who: 'Kevin', role: 'Coach', text: '"Les ressources entre les seances declenchent la decision de revenir."', insight: 'Ressources = retention' },
        { who: 'Yoann', role: 'Therapeute', text: '"J\'investirais 20 EUR/mois — sans probleme."', insight: 'Prix valide' },
        { who: 'Patricia', role: 'Psychologue', text: '"Je ne mettrais jamais des donnees patient sur une plateforme."', insight: 'Vie privee = vraie barriere' },
      ],
    },
    business: {
      title: 'Le Business',
      model: [
        { label: 'SaaS', detail: 'Essentiel 19 EUR/mois' },
        { label: 'Cible', detail: 'Praticiens solo & petits cabinets' },
        { label: 'Futur B2C', detail: 'App membre & compagnon Bloom' },
      ],
      funnel: [
        'Appel decouverte',
        'Demo personnalisee',
        'Onboarding sur-mesure',
        'Praticien actif',
        'Membres invites',
        'Boucle activee',
      ],
      links: [
        { text: 'Business Canvas', href: '/business-canvas' },
        { text: 'Strategie de Pricing', href: '/pricing-analysis' },
        { text: 'Go-to-Market', href: '/go-to-market' },
        { text: 'Taille du Marche', href: '/market-sizing' },
        { text: 'Personas Clients', href: '/customer-personas' },
      ],
    },
    gaps: {
      title: 'Ce Qu\'on Doit Encore Trouver',
      items: [
        { label: 'Product-market fit', status: 'searching', detail: 'On cherche encore le levier' },
        { label: 'Premier client payant', status: 'blocked', detail: 'Interet mais pas de revenu' },
        { label: 'Expertise clinique', status: 'missing', detail: 'Pas de clinicien dans l\'equipe' },
        { label: 'Onboarding self-serve', status: 'unknown', detail: 'Actuellement on accompagne tout le monde' },
        { label: 'Reglementation (RGPD, HDS)', status: 'learning', detail: 'On cartographie le labyrinthe' },
      ],
      links: [
        { text: 'Manques & Risques Complets', href: '/what-we-need' },
        { text: 'Analyse des Risques', href: '/risk-analysis' },
        { text: 'SWOT', href: '/swot-analysis' },
      ],
    },
    deeptech: {
      title: 'La Vision Deep Tech',
      subtitle: 'SaaS aujourd\'hui. Deep tech demain.',
      phases: [
        { phase: '1', label: 'Prouver que la Therapie Fonctionne', timing: 'Maintenant — M12', detail: 'Mesure continue des resultats a partir de donnees comportementales. Pas des questionnaires — de vrais signaux.', color: 'violet', examples: [
          'Le praticien voit : "L\'anxiete de Sarah a baisse de 40% en 3 mois"',
          'Le membre voit sa propre progression visuellement dans le temps',
          'Des rapports qui prouvent que la therapie fonctionne — pour les assureurs, les clients, eux-memes',
        ]},
        { phase: '2', label: 'Predire Avant la Crise', timing: 'M6 — M18', detail: 'Alertes praticien basees sur l\'humeur, le sommeil et l\'engagement. Chaque alerte entraine l\'IA.', color: 'blue', examples: [
          'Le praticien recoit : "Le sommeil de ce membre a decline 5 jours + humeur en baisse — verifier ?"',
          'Le membre recoit un rappel doux : "Tu as l\'air pas bien cette semaine. Envie de parler a ton praticien ?"',
          'L\'IA apprend quels patterns menent a une rechute — avant qu\'elle arrive',
        ]},
        { phase: '3', label: 'Couche d\'Intelligence', timing: 'M18+', detail: 'De la plateforme de donnees aux produits grand public. La sante mentale devient personnalisee et proactive.', color: 'emerald', examples: [
          'Des wearables de sante mentale personnalises qui comprennent vos patterns comportementaux',
          'Des produits bien-etre grand public construits sur de vraies donnees cliniques — pas des suppositions',
          'Des donnees de recherche anonymisees qui aident les scientifiques a comprendre la sante mentale a grande echelle',
          'Une IA qui suggere "les personnes avec des patterns comme les votres se sont ameliorees avec X" — base sur de vrais resultats',
          'Reve fou : une interface cerveau-ordinateur qui lit les etats emotionnels directement — suivi de sante mentale en temps reel sans auto-declaration',
        ]},
      ],
      dataWeCollect: {
        title: 'Donnees Qu\'on Collecte Deja',
        items: [
          { icon: 'mood', label: '14 humeurs/jour' },
          { icon: 'sleep', label: 'Sommeil & equilibre' },
          { icon: 'session', label: 'Resultats de seance' },
          { icon: 'milestone', label: 'Vitesse des jalons' },
          { icon: 'homework', label: 'Completion exercices' },
          { icon: 'engagement', label: 'Tendances engagement' },
        ],
      },
      flywheel: [
        'Plus de praticiens',
        'Plus de donnees comportementales',
        'Meilleures predictions',
        'Meilleurs resultats',
      ],
      vs: [
        { name: 'Woebot / Wysa', us: 'Les deux cotes du soin', them: 'Chatbot grand public' },
        { name: 'Spring Health', us: 'Profondeur praticien solo', them: 'Matching entreprise' },
        { name: 'SimplePractice', us: 'IA + donnees de resultats', them: 'Gestion de cabinet seule' },
      ],
      vsLabel: { us: 'Nous', them: 'Eux' },
      moatTitle: 'Le Fosse',
      moatItems: [
        'Le praticien valide chaque prediction = donnees d\'entrainement etiquetees',
        'Les deux cotes connectes : comportement quotidien + seances cliniques',
        'Les donnees longitudinales prennent 6-12 mois — pas de raccourci',
      ],
    },
    join: {
      title: 'Pourquoi Nous Rejoindre Maintenant',
      cards: [
        { icon: 'product', label: 'Produit fonctionnel', detail: 'Pas un pitch deck — une plateforme live avec de vrais retours' },
        { icon: 'equity', label: 'Equity de fondateur', detail: 'Pre-revenu = influence et ownership maximum' },
        { icon: 'market', label: 'Marche en croissance', detail: 'L\'outillage sante mentale est casse. Vents porteurs structurels.' },
        { icon: 'honesty', label: 'Honnetete radicale', detail: 'Cette page existe parce qu\'on croit en la transparence plutot que le spin' },
      ],
      cta: { text: 'Voir la Transparence Totale : Verts, Gris & Rouges', href: '/what-we-need' },
    },
    explore: {
      title: 'Explorer le Dataroom Complet',
      items: [
        { text: 'Pitch Deck', href: '/pitch' },
        { text: 'Modele Financier', href: '/financial-model' },
        { text: 'Roadmap Produit', href: '/roadmap' },
        { text: 'Recommandation Strategique', href: '/strategic-recommendation' },
        { text: 'GTM Playbook', href: '/gtm-playbook' },
        { text: 'Parcours Client', href: '/customer-journey' },
      ],
    },
  },
}

function SectionLink({ text, href }: { text: string; href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors">
      {text}
      <ExternalLink className="w-3 h-3" />
    </Link>
  )
}

const statusColors: Record<string, string> = {
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-400',
}

const statusIcons: Record<string, React.ReactNode> = {
  searching: <HelpCircle className="w-4 h-4 text-amber-500" />,
  blocked: <XCircle className="w-4 h-4 text-red-500" />,
  missing: <AlertTriangle className="w-4 h-4 text-red-400" />,
  unknown: <HelpCircle className="w-4 h-4 text-neutral-400" />,
  learning: <RefreshCw className="w-4 h-4 text-amber-500" />,
}

const loopColors: Record<string, { bg: string; border: string; text: string; arrow: string }> = {
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', arrow: 'text-teal-400' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', arrow: 'text-blue-400' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', arrow: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', arrow: 'text-emerald-400' },
}

export default function StoryPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const navItems = [
    { id: 'origin', label: t.nav.origin },
    { id: 'problem', label: t.nav.problem },
    { id: 'product', label: t.nav.product },
    { id: 'loop', label: t.nav.loop },
    { id: 'different', label: t.nav.different },
    { id: 'status', label: t.nav.status },
    { id: 'voices', label: t.nav.voices },
    { id: 'business', label: t.nav.business },
    { id: 'gaps', label: t.nav.gaps },
    { id: 'deeptech', label: t.nav.deeptech },
    { id: 'join', label: t.nav.join },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 text-white hover:bg-teal-700 transition-all text-sm font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          PDF
        </button>
        <button
          onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 hover:bg-white hover:border-neutral-300 transition-all text-sm font-medium text-neutral-600"
        >
          <Globe className="w-3.5 h-3.5" />
          {locale === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-6 print:pt-6">
        <Link href="/dataroom" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 print:hidden">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.back}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Logo size="sm" showText={false} />
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t.title}</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">{t.subtitle}</p>

        {/* Jump nav */}
        <div className="flex flex-wrap gap-1.5">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-2.5 py-1 text-[11px] font-medium rounded-full border border-neutral-200 text-neutral-400 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-20 space-y-16 print:space-y-8 print:pb-4">

        {/* ═══ ORIGIN — Visual Timeline ═══ */}
        <section id="origin">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-4 h-4 text-rose-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.origin.title}</h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-rose-300 via-teal-300 to-teal-500" />
            <div className="space-y-6">
              {t.origin.timeline.map((step, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="relative z-10 w-9 h-9 rounded-full bg-white border-2 border-teal-400 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold text-teal-600">{i + 1}</span>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold text-teal-600 uppercase tracking-wider">{step.year}</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-800">{step.label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PROBLEM — Before / After ═══ */}
        <section id="problem">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.problem.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Before */}
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">{t.problem.before.label}</p>
              </div>
              <div className="space-y-2">
                {t.problem.before.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-1 h-1 rounded-full bg-red-300 mt-1.5 shrink-0" />
                    <p className="text-xs text-red-700/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* After */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t.problem.after.label}</p>
              </div>
              <div className="space-y-2">
                {t.problem.after.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <p className="text-xs text-emerald-700/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PRODUCT — 3-Column Architecture ═══ */}
        <section id="product">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="w-4 h-4 text-teal-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.product.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[t.product.platform, t.product.mobile, t.product.ai].map((block, i) => {
              const icons = [<Monitor key="m" className="w-5 h-5" />, <Smartphone key="s" className="w-5 h-5" />, <Brain key="b" className="w-5 h-5" />]
              const bgColors = ['bg-teal-50', 'bg-violet-50', 'bg-amber-50']
              const borderColors = ['border-teal-200', 'border-violet-200', 'border-amber-200']
              const textColors = ['text-teal-600', 'text-violet-600', 'text-amber-600']
              const dotColors = ['bg-teal-400', 'bg-violet-400', 'bg-amber-400']
              return (
                <div key={i} className={`rounded-xl border ${borderColors[i]} ${bgColors[i]} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${bgColors[i]} border ${borderColors[i]} flex items-center justify-center ${textColors[i]}`}>
                      {icons[i]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{block.name}</p>
                      <p className={`text-[10px] font-medium ${textColors[i]} uppercase tracking-wider`}>{block.emoji}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {block.features.map((f, j) => (
                      <div key={j} className="flex gap-2 items-center">
                        <div className={`w-1 h-1 rounded-full ${dotColors[i]} shrink-0`} />
                        <p className="text-xs text-neutral-600">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <SectionLink text={t.product.link.text} href={t.product.link.href} />
        </section>

        {/* ═══ THE LOOP — Visual Flow ═══ */}
        <section id="loop">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-teal-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.loop.title}</h2>
          </div>
          <p className="text-xs text-neutral-400 mb-6">{t.loop.subtitle}</p>

          {/* Loop visualization */}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {t.loop.steps.map((step, i) => {
                const c = loopColors[step.color]
                return (
                  <div key={i} className="relative">
                    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 h-full`}>
                      <div className={`w-7 h-7 rounded-full border-2 ${c.border} flex items-center justify-center mb-2`}>
                        <span className={`text-xs font-bold ${c.text}`}>{i + 1}</span>
                      </div>
                      <p className={`text-sm font-semibold ${c.text} mb-1`}>{step.label}</p>
                      <p className="text-xs text-neutral-500">{step.detail}</p>
                    </div>
                    {i < 3 && (
                      <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                        <ChevronRight className={`w-4 h-4 ${c.arrow}`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Return arrow */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                <RefreshCw className="w-3 h-3 text-teal-500" />
                <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                  {locale === 'fr' ? 'Le cycle recommence' : 'Cycle repeats'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ OUR EDGE — Icon Cards ═══ */}
        <section id="different">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.different.title}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {t.different.items.map((item, i) => {
              const icons = [
                <RefreshCw key="r" className="w-5 h-5 text-teal-500" />,
                <Brain key="b" className="w-5 h-5 text-violet-500" />,
                <Heart key="h" className="w-5 h-5 text-rose-500" />,
                <Target key="t" className="w-5 h-5 text-amber-500" />,
              ]
              return (
                <div key={i} className="rounded-xl border border-neutral-200 p-4 hover:border-teal-200 transition-colors">
                  <div className="mb-2">{icons[i]}</div>
                  <p className="text-sm font-semibold text-neutral-800 mb-1">{item.label}</p>
                  <p className="text-xs text-neutral-500 leading-relaxed">{item.detail}</p>
                </div>
              )
            })}
          </div>
          <SectionLink text={t.different.link.text} href={t.different.link.href} />
        </section>

        {/* ═══ STATUS — Dashboard Metrics ═══ */}
        <section id="status">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.status.title}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {t.status.metrics.map((m, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{m.label}</p>
                  <div className={`w-2 h-2 rounded-full ${statusColors[m.status]}`} />
                </div>
                <p className="text-lg font-bold text-neutral-900">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {t.status.links.map((l, i) => (
              <SectionLink key={i} text={l.text} href={l.href} />
            ))}
          </div>
        </section>

        {/* ═══ VOICES — Quote Cards ═══ */}
        <section id="voices">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquareQuote className="w-4 h-4 text-teal-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.voices.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.voices.quotes.map((q, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 p-4 relative overflow-hidden">
                <div className="absolute top-3 right-3 text-4xl text-neutral-100 font-serif select-none">&ldquo;</div>
                <div className="relative z-10">
                  <p className="text-sm text-neutral-700 italic mb-3 leading-relaxed">{q.text}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">{q.who[0]}</div>
                      <div>
                        <p className="text-xs font-medium text-neutral-800">{q.who}</p>
                        <p className="text-[10px] text-neutral-400">{q.role}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{q.insight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ BUSINESS — Model + Funnel ═══ */}
        <section id="business">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-4 h-4 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.business.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Model cards */}
            <div className="space-y-2">
              {t.business.model.map((item, i) => (
                <div key={i} className="rounded-lg border border-neutral-200 px-4 py-3 flex items-center gap-3">
                  <span className="text-sm font-bold text-teal-600 w-16 shrink-0">{item.label}</span>
                  <span className="text-xs text-neutral-500">{item.detail}</span>
                </div>
              ))}
            </div>

            {/* Funnel */}
            <div className="rounded-xl border border-neutral-200 p-4">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                {locale === 'fr' ? 'Entonnoir' : 'Funnel'}
              </p>
              <div className="space-y-1">
                {t.business.funnel.map((step, i) => {
                  const widths = ['w-full', 'w-[90%]', 'w-[80%]', 'w-[70%]', 'w-[60%]', 'w-[50%]']
                  return (
                    <div key={i} className={`${widths[i]} mx-auto`}>
                      <div className="bg-teal-50 border border-teal-200 rounded-md px-3 py-1.5 text-center">
                        <p className="text-[11px] text-teal-700 font-medium">{step}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {t.business.links.map((l, i) => (
              <SectionLink key={i} text={l.text} href={l.href} />
            ))}
          </div>
        </section>

        {/* ═══ GAPS — Status Board ═══ */}
        <section id="gaps">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">{t.gaps.title}</h2>
          </div>
          <div className="space-y-2 mb-4">
            {t.gaps.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3">
                {statusIcons[item.status]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800">{item.label}</p>
                  <p className="text-xs text-neutral-400">{item.detail}</p>
                </div>
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider shrink-0">{item.status}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {t.gaps.links.map((l, i) => (
              <SectionLink key={i} text={l.text} href={l.href} />
            ))}
          </div>
        </section>

        {/* ═══ DEEP TECH VISION ═══ */}
        <section id="deeptech" className="rounded-2xl bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 p-6 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Microscope className="w-4 h-4 text-violet-300" />
            <h2 className="text-lg font-semibold">{t.deeptech.title}</h2>
          </div>
          <p className="text-xs text-violet-300 mb-6">{t.deeptech.subtitle}</p>

          {/* 3-Phase visual cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {t.deeptech.phases.map((phase, i) => {
              const phaseColors = [
                { bg: 'bg-violet-800/40', border: 'border-violet-500/30', number: 'bg-violet-500', accent: 'text-violet-300' },
                { bg: 'bg-blue-800/40', border: 'border-blue-500/30', number: 'bg-blue-500', accent: 'text-blue-300' },
                { bg: 'bg-emerald-800/40', border: 'border-emerald-500/30', number: 'bg-emerald-500', accent: 'text-emerald-300' },
              ]
              const c = phaseColors[i]
              return (
                <div key={i} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded-full ${c.number} flex items-center justify-center`}>
                      <span className="text-[10px] font-bold text-white">{phase.phase}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${c.accent}`}>{phase.timing}</span>
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">{phase.label}</p>
                  <p className="text-xs text-violet-200/70 leading-relaxed mb-3">{phase.detail}</p>
                  <div className="space-y-1.5 border-t border-white/10 pt-2.5">
                    <p className="text-[9px] font-bold text-violet-300/60 uppercase tracking-wider">{locale === 'fr' ? 'En pratique' : 'What this looks like'}</p>
                    {phase.examples.map((ex: string, j: number) => (
                      <div key={j} className="flex gap-1.5 items-start">
                        <span className="text-violet-400/60 text-[10px] mt-px">-</span>
                        <p className="text-[11px] text-violet-200/60 leading-relaxed">{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Arrow flow between phases */}
          <div className="hidden sm:flex items-center justify-center gap-2 mb-6">
            {t.deeptech.phases.map((phase, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-violet-300/60">{phase.label}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-violet-400/40" />}
              </div>
            ))}
          </div>

          {/* Data we collect — icon grid */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
            <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-3">{t.deeptech.dataWeCollect.title}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {t.deeptech.dataWeCollect.items.map((item, i) => {
                const iconElements = [
                  <Heart key="h" className="w-3.5 h-3.5" />,
                  <BarChart3 key="b" className="w-3.5 h-3.5" />,
                  <Layers key="c" className="w-3.5 h-3.5" />,
                  <Target key="t" className="w-3.5 h-3.5" />,
                  <CheckCircle2 key="ch" className="w-3.5 h-3.5" />,
                  <Sparkles key="s" className="w-3.5 h-3.5" />,
                ]
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-violet-400">{iconElements[i]}</span>
                    <span className="text-[11px] text-violet-200">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Flywheel — circular flow */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 flex-wrap justify-center">
                {t.deeptech.flywheel.map((step: string, i: number) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs font-medium text-white bg-violet-600/50 px-3 py-1.5 rounded-full border border-violet-400/30">{step}</span>
                    <ArrowRight className="w-3 h-3 text-violet-400/50 shrink-0" />
                  </div>
                ))}
                <RefreshCw className="w-3.5 h-3.5 text-violet-400/50 shrink-0" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Moat */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider mb-2">{t.deeptech.moatTitle}</p>
              <div className="space-y-1.5">
                {t.deeptech.moatItems.map((item: string, i: number) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Shield className="w-3 h-3 text-violet-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-violet-200/80">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vs competitors — visual comparison */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">vs.</p>
                <div className="flex gap-3">
                  <span className="text-[10px] font-medium text-emerald-400">{t.deeptech.vsLabel.us}</span>
                  <span className="text-[10px] font-medium text-neutral-400">{t.deeptech.vsLabel.them}</span>
                </div>
              </div>
              <div className="space-y-2">
                {t.deeptech.vs.map((comp: { name: string; us: string; them: string }, i: number) => (
                  <div key={i} className="rounded-lg bg-white/5 px-3 py-2">
                    <p className="text-[10px] font-semibold text-violet-300 mb-1">{comp.name}</p>
                    <div className="flex gap-3">
                      <span className="text-[10px] text-emerald-400/80 flex-1">{comp.us}</span>
                      <span className="text-[10px] text-neutral-500 flex-1">{comp.them}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ WHY JOIN — Dark CTA ═══ */}
        <section id="join" className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">{t.join.title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {t.join.cards.map((card, i) => {
              const icons = [
                <Layers key="l" className="w-5 h-5 text-teal-400" />,
                <Sparkles key="s" className="w-5 h-5 text-violet-400" />,
                <BarChart3 key="b" className="w-5 h-5 text-emerald-400" />,
                <Heart key="h" className="w-5 h-5 text-rose-400" />,
              ]
              return (
                <div key={i} className="rounded-xl border border-neutral-700 bg-neutral-800/50 p-4">
                  <div className="mb-2">{icons[i]}</div>
                  <p className="text-sm font-semibold text-white mb-1">{card.label}</p>
                  <p className="text-xs text-neutral-400 leading-relaxed">{card.detail}</p>
                </div>
              )
            })}
          </div>
          <Link
            href={t.join.cta.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            {t.join.cta.text}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </section>

        {/* ═══ EXPLORE ═══ */}
        <section className="pt-4 border-t border-neutral-200">
          <h3 className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wider">{t.explore.title}</h3>
          <div className="flex flex-wrap gap-2">
            {t.explore.items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-neutral-200 text-neutral-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
              >
                {item.text}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}

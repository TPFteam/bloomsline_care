'use client'

import { Globe, Download, ArrowLeft, Heart, Sparkles, Shield, Eye, Feather, Users, Target, Zap, MessageSquare } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const T = '#4A9A86'
const L = '#A88AE1'

const translations = {
  en: {
    title: 'Brand Foundation',
    subtitle: 'The principles, voice, and identity behind Bloomsline Care',
    back: 'Back to Dataroom',

    // Mission
    mission: {
      title: 'Mission',
      statement: 'Help practitioners stay connected to the people they support — and give everyone the tools to keep growing, without guilt, at their own pace.',
      belief: 'We believe care is more than a session.',
    },

    // Positioning
    positioning: {
      title: 'Positioning',
      line: 'Where care continues between sessions.',
      description: 'Not a practice management tool. Not a wellness app. The bridge between both — connecting practitioners and members into one continuous experience of care.',
      gap: 'The gap between "managing a practice" and "delivering care" is wide open. That\'s where we sit.',
    },

    // Values
    values: {
      title: 'Values',
      items: [
        { icon: 'heart', label: 'Small moments matter', detail: 'Healing doesn\'t always happen in breakthroughs. Sometimes it\'s a quiet walk, a deep breath, or writing three words in a journal.' },
        { icon: 'feather', label: 'Gentleness by design', detail: 'Every interaction should feel safe. We design with softness, never pressure. No streaks, no guilt, no scores.' },
        { icon: 'eye', label: 'Showing up over doing more', detail: 'Consistency beats intensity. We celebrate presence, not perfection.' },
        { icon: 'users', label: 'Human connection first', detail: 'Technology should bring people closer, not replace the warmth of real relationships.' },
        { icon: 'shield', label: 'Care without barriers', detail: 'Support should be accessible to everyone, regardless of language, location, or circumstance.' },
      ],
    },

    // Personality
    personality: {
      title: 'Brand Personality',
      traits: [
        { trait: 'Warm', not: 'Not clinical' },
        { trait: 'Honest', not: 'Not polished' },
        { trait: 'Gentle', not: 'Not passive' },
        { trait: 'Present', not: 'Not pushy' },
        { trait: 'Thoughtful', not: 'Not slow' },
        { trait: 'Minimal', not: 'Not empty' },
      ],
      description: 'Bloomsline feels like a friend who studied psychology — approachable, smart, never judgmental. We speak to people in care the way a good practitioner would: with empathy, clarity, and respect for their pace.',
    },

    // Voice
    voice: {
      title: 'Tone of Voice',
      principles: [
        { label: 'We say', examples: ['"Take a moment when you\'re ready"', '"Your journey starts with one click"', '"We\'re glad you\'re here"'] },
        { label: 'We never say', examples: ['"You missed a day!"', '"Complete your streak"', '"Your score dropped"'] },
      ],
      guidelines: [
        { rule: 'Lead with empathy', detail: 'Acknowledge what someone might be feeling before telling them what to do.' },
        { rule: 'Be direct, not blunt', detail: 'Say what needs to be said, but choose words that feel safe.' },
        { rule: 'Use "you" more than "we"', detail: 'The user\'s experience matters more than our features.' },
        { rule: 'Short sentences', detail: 'Breathing room in text mirrors breathing room in life.' },
        { rule: 'No jargon', detail: 'Write like you\'re talking to someone, not presenting to a board.' },
      ],
    },

    // Visual identity
    visual: {
      title: 'Visual Identity',
      palette: {
        title: 'Palette',
        colors: [
          { name: 'Teal', hex: '#4A9A86', meaning: 'Calm, trust, growth' },
          { name: 'Lavender', hex: '#A88AE1', meaning: 'Awareness, insight, creativity' },
          { name: 'Neutral', hex: '#1A1A1A', meaning: 'Clarity, professionalism' },
          { name: 'White', hex: '#FFFFFF', meaning: 'Breathing space, openness' },
        ],
      },
      typography: 'Geist Sans — clean, modern, humanist. Light weights for breathing room, medium for emphasis.',
      designPrinciples: [
        'Rounded corners, never sharp',
        'Generous white space',
        'Soft shadows, no hard borders',
        'Subtle animations that breathe',
        'No gamification elements',
      ],
    },

    // Audience
    audience: {
      title: 'Who We Speak To',
      segments: [
        { name: 'Practitioners', detail: 'Therapists, psychologists, coaches, counselors. They care deeply about their clients but lack tools that match their values. They don\'t trust flashy apps. They trust things that feel human.' },
        { name: 'Members', detail: 'People in care — navigating anxiety, grief, growth, or everyday struggles. They need support between appointments, not another app that makes them feel behind.' },
      ],
    },

    // Differentiators
    differentiators: {
      title: 'What Makes Us Different',
      items: [
        'Both sides of care connected in one platform',
        'Focused on what happens between sessions',
        'Design philosophy rooted in therapeutic ethics',
        'No streaks, no scores, no guilt mechanics',
        'Bilingual from day one (EN/FR)',
        'Built by people who lived the problem',
      ],
    },

    // Branded concepts
    concepts: {
      title: 'Strategic Pillars',
      items: [
        { code: 'BCS', name: 'Bloom Context System', detail: 'Context engine that learns emotional patterns and creates shared language between practitioner and member.' },
        { code: 'PLG', name: 'Practitioner-Led Growth', detail: 'Every practitioner becomes a distribution channel. Their care relationship seeds the next.' },
        { code: 'CNE', name: 'Care Network Effect', detail: 'One practitioner brings 10-50 members. Growth compounds through existing care relationships.' },
        { code: 'GUX', name: 'Gentle UX', detail: 'Design philosophy that builds trust and retention without guilt mechanics. Progress as narrative, not numbers.' },
      ],
    },
  },
  fr: {
    title: 'Fondation de la Marque',
    subtitle: 'Les principes, la voix et l\'identite derriere Bloomsline Care',
    back: 'Retour au Dataroom',

    mission: {
      title: 'Mission',
      statement: 'Aider les praticiens a rester connectes aux personnes qu\'ils accompagnent — et donner a chacun les outils pour continuer a grandir, sans culpabilite, a son propre rythme.',
      belief: 'Nous croyons que le soin va au-dela d\'une seance.',
    },

    positioning: {
      title: 'Positionnement',
      line: 'La ou le soin continue entre les seances.',
      description: 'Ni un outil de gestion de cabinet. Ni une app de bien-etre. Le pont entre les deux — connectant praticiens et membres dans une experience de soin continue.',
      gap: 'L\'espace entre "gerer un cabinet" et "delivrer du soin" est grand ouvert. C\'est la qu\'on se place.',
    },

    values: {
      title: 'Valeurs',
      items: [
        { icon: 'heart', label: 'Les petits moments comptent', detail: 'La guerison ne passe pas toujours par des percees. Parfois c\'est une marche tranquille, une respiration profonde, ou trois mots dans un journal.' },
        { icon: 'feather', label: 'Douceur par conception', detail: 'Chaque interaction doit etre securisante. On concoit avec douceur, jamais de pression. Pas de series, pas de culpabilite, pas de scores.' },
        { icon: 'eye', label: 'Etre present plutot que faire plus', detail: 'La constance bat l\'intensite. On celebre la presence, pas la perfection.' },
        { icon: 'users', label: 'La connexion humaine d\'abord', detail: 'La technologie doit rapprocher les gens, pas remplacer la chaleur des vraies relations.' },
        { icon: 'shield', label: 'Le soin sans barrieres', detail: 'L\'accompagnement doit etre accessible a tous, quelle que soit la langue, le lieu ou la situation.' },
      ],
    },

    personality: {
      title: 'Personnalite de la Marque',
      traits: [
        { trait: 'Chaleureuse', not: 'Pas clinique' },
        { trait: 'Honnete', not: 'Pas lisse' },
        { trait: 'Douce', not: 'Pas passive' },
        { trait: 'Presente', not: 'Pas insistante' },
        { trait: 'Reflechie', not: 'Pas lente' },
        { trait: 'Minimale', not: 'Pas vide' },
      ],
      description: 'Bloomsline ressemble a un ami qui a etudie la psychologie — accessible, intelligent, jamais jugeant. On parle aux personnes en soin comme le ferait un bon praticien : avec empathie, clarte et respect de leur rythme.',
    },

    voice: {
      title: 'Ton de Voix',
      principles: [
        { label: 'On dit', examples: ['"Prenez un moment quand vous etes pret(e)"', '"Votre parcours commence en un clic"', '"On est contents que vous soyez la"'] },
        { label: 'On ne dit jamais', examples: ['"Vous avez manque un jour !"', '"Completez votre serie"', '"Votre score a baisse"'] },
      ],
      guidelines: [
        { rule: 'Commencer par l\'empathie', detail: 'Reconnaitre ce que quelqu\'un pourrait ressentir avant de lui dire quoi faire.' },
        { rule: 'Direct, pas brutal', detail: 'Dire ce qui doit etre dit, mais choisir des mots qui rassurent.' },
        { rule: 'Utiliser "vous" plus que "nous"', detail: 'L\'experience de l\'utilisateur compte plus que nos fonctionnalites.' },
        { rule: 'Phrases courtes', detail: 'L\'espace dans le texte reflete l\'espace dans la vie.' },
        { rule: 'Pas de jargon', detail: 'Ecrire comme si on parlait a quelqu\'un, pas comme si on presentait a un comite.' },
      ],
    },

    visual: {
      title: 'Identite Visuelle',
      palette: {
        title: 'Palette',
        colors: [
          { name: 'Teal', hex: '#4A9A86', meaning: 'Calme, confiance, croissance' },
          { name: 'Lavande', hex: '#A88AE1', meaning: 'Conscience, intuition, creativite' },
          { name: 'Neutre', hex: '#1A1A1A', meaning: 'Clarte, professionnalisme' },
          { name: 'Blanc', hex: '#FFFFFF', meaning: 'Espace, ouverture' },
        ],
      },
      typography: 'Geist Sans — propre, moderne, humaniste. Poids legers pour respirer, medium pour l\'emphase.',
      designPrinciples: [
        'Coins arrondis, jamais anguleux',
        'Espace blanc genereux',
        'Ombres douces, pas de bordures dures',
        'Animations subtiles qui respirent',
        'Aucun element de gamification',
      ],
    },

    audience: {
      title: 'A Qui On Parle',
      segments: [
        { name: 'Praticiens', detail: 'Therapeutes, psychologues, coachs, conseillers. Ils se soucient profondement de leurs clients mais manquent d\'outils qui correspondent a leurs valeurs.' },
        { name: 'Membres', detail: 'Les personnes en soin — qui traversent l\'anxiete, le deuil, la croissance, ou les luttes du quotidien. Ils ont besoin de soutien entre les rendez-vous.' },
      ],
    },

    differentiators: {
      title: 'Ce Qui Nous Differencie',
      items: [
        'Les deux cotes du soin connectes sur une seule plateforme',
        'Focus sur ce qui se passe entre les seances',
        'Philosophie de design ancree dans l\'ethique therapeutique',
        'Pas de series, pas de scores, pas de mecanique de culpabilite',
        'Bilingue des le premier jour (EN/FR)',
        'Construit par des gens qui ont vecu le probleme',
      ],
    },

    concepts: {
      title: 'Piliers Strategiques',
      items: [
        { code: 'BCS', name: 'Bloom Context System', detail: 'Moteur de contexte qui apprend les patterns emotionnels et cree un langage partage entre praticien et membre.' },
        { code: 'PLG', name: 'Practitioner-Led Growth', detail: 'Chaque praticien devient un canal de distribution. Sa relation de soin ensemence la suivante.' },
        { code: 'CNE', name: 'Care Network Effect', detail: 'Un praticien amene 10-50 membres. La croissance se compose via les relations de soin existantes.' },
        { code: 'GUX', name: 'Gentle UX', detail: 'Philosophie de design qui construit confiance et retention sans mecanique de culpabilite. Le progres comme recit, pas comme chiffre.' },
      ],
    },
  },
}

const iconMap: Record<string, React.ReactNode> = {
  heart: <Heart className="w-5 h-5" />,
  feather: <Feather className="w-5 h-5" />,
  eye: <Eye className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
}

export default function BrandPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

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
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-6 print:pt-6">
        <Link href="/dataroom" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 print:hidden">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.back}
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Logo size="sm" showText={false} />
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t.title}</h1>
        </div>
        <p className="text-neutral-500 text-sm">{t.subtitle}</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20 space-y-16 print:space-y-8 print:pb-4">

        {/* ═══ MISSION ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">{t.mission.title}</p>
          <p className="text-sm text-neutral-400 italic mb-4">{t.mission.belief}</p>
          <p className="text-lg text-neutral-800 leading-relaxed font-medium">{t.mission.statement}</p>
        </section>

        {/* ═══ POSITIONING ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-3">{t.positioning.title}</p>
          <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 p-8 mb-4">
            <p className="text-xl font-semibold text-teal-800 text-center">{t.positioning.line}</p>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed mb-3">{t.positioning.description}</p>
          <p className="text-sm text-neutral-500 italic">{t.positioning.gap}</p>
        </section>

        {/* ═══ VALUES ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.values.title}</p>
          <div className="space-y-4">
            {t.values.items.map((v, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                  {iconMap[v.icon]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800 mb-0.5">{v.label}</p>
                  <p className="text-sm text-neutral-500 leading-relaxed">{v.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PERSONALITY ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.personality.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {t.personality.traits.map((p, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-semibold text-neutral-800">{p.trait}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{p.not}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed">{t.personality.description}</p>
        </section>

        {/* ═══ TONE OF VOICE ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.voice.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {t.voice.principles.map((p, i) => (
              <div key={i} className={`rounded-xl p-5 ${i === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${i === 0 ? 'text-emerald-600' : 'text-red-600'}`}>{p.label}</p>
                <div className="space-y-2">
                  {p.examples.map((ex, j) => (
                    <p key={j} className={`text-sm italic ${i === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{ex}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {t.voice.guidelines.map((g, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-neutral-800">{g.rule}</span>
                  <span className="text-sm text-neutral-500"> — {g.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ VISUAL IDENTITY ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.visual.title}</p>

          {/* Color palette */}
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">{t.visual.palette.title}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {t.visual.palette.colors.map((c, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 overflow-hidden">
                <div className="h-16" style={{ backgroundColor: c.hex, border: c.hex === '#FFFFFF' ? '1px solid #e5e5e5' : 'none' }} />
                <div className="p-3">
                  <p className="text-xs font-semibold text-neutral-800">{c.name}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">{c.hex}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">{c.meaning}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Typography */}
          <p className="text-sm text-neutral-600 mb-6">{t.visual.typography}</p>

          {/* Design principles */}
          <div className="flex flex-wrap gap-2">
            {t.visual.designPrinciples.map((p, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-neutral-50 border border-neutral-200 text-xs text-neutral-600">{p}</span>
            ))}
          </div>
        </section>

        {/* ═══ AUDIENCE ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.audience.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.audience.segments.map((s, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 p-5">
                <p className="text-sm font-semibold text-neutral-800 mb-2">{s.name}</p>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ DIFFERENTIATORS ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-4">{t.differentiators.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {t.differentiators.items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start px-4 py-3 rounded-lg bg-neutral-50">
                <Sparkles className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                <p className="text-xs text-neutral-700">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ STRATEGIC PILLARS ═══ */}
        <section>
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-6">{t.concepts.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.concepts.items.map((c, i) => {
              const colors = [
                'bg-teal-50 border-teal-200 text-teal-700',
                'bg-blue-50 border-blue-200 text-blue-700',
                'bg-violet-50 border-violet-200 text-violet-700',
                'bg-amber-50 border-amber-200 text-amber-700',
              ]
              return (
                <div key={i} className={`rounded-xl border p-5 ${colors[i]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold font-mono opacity-60">{c.code}</span>
                    <span className="text-sm font-semibold">{c.name}</span>
                  </div>
                  <p className="text-xs opacity-80 leading-relaxed">{c.detail}</p>
                </div>
              )
            })}
          </div>
        </section>

      </div>
    </div>
  )
}

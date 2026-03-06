'use client'

import { Globe, Download, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

const translations = {
  en: {
    title: 'Business Model Canvas',
    subtitle: 'How Bloomsline creates, delivers, and captures value',
    back: 'Back to Dataroom',
    blocks: [
      {
        id: 'customer-segments',
        label: 'Customer Segments',
        question: 'Who do we serve?',
        color: 'bg-teal-50 border-teal-200',
        accent: 'text-teal-700',
        items: [
          'Solo psychologists and psychotherapists (15-30 clients)',
          'Group practices / cabinets (3-8 practitioners)',
          'Coaches and brief therapy practitioners',
          'Their clients (members) who use the free companion app',
        ],
      },
      {
        id: 'value-proposition',
        label: 'Value Proposition',
        question: 'What problem do we solve?',
        color: 'bg-violet-50 border-violet-200',
        accent: 'text-violet-700',
        items: [
          'Fills the 167 hours/week gap between therapy sessions',
          'Practitioners start sessions already informed, not catching up',
          'Members capture moments (mood, reflections) in 10 seconds',
          'AI surfaces patterns and generates pre-session briefs',
          'One platform replaces scattered notes, WhatsApp check-ins, and paper worksheets',
        ],
      },
      {
        id: 'channels',
        label: 'Channels',
        question: 'How do we reach them?',
        color: 'bg-orange-50 border-orange-200',
        accent: 'text-orange-700',
        items: [
          'SEO: practitioner profiles rank on Google (zero ad spend)',
          'Word-of-mouth: practitioners recommend to peers',
          'B2B2C: each practitioner invites 20-50 members at zero CAC',
          'Professional networks: conferences, associations, supervision groups',
        ],
      },
      {
        id: 'customer-relationships',
        label: 'Customer Relationships',
        question: 'How do we keep them?',
        color: 'bg-blue-50 border-blue-200',
        accent: 'text-blue-700',
        items: [
          'White-glove onboarding: personal setup call with each practitioner',
          'Bloom AI companion: daily engagement for members (no guilt, no streaks)',
          'Continuous value: AI insights improve as more data flows in',
          'Community: peer groups, shared resources library',
        ],
      },
      {
        id: 'revenue-streams',
        label: 'Revenue Streams',
        question: 'How do we make money?',
        color: 'bg-emerald-50 border-emerald-200',
        accent: 'text-emerald-700',
        items: [
          'Essentiel: \u20ac19/month \u2014 solo practitioner, core features',
          'Pro: \u20ac29/month \u2014 full platform + AI insights (core ICP)',
          'Cabinet: \u20ac49 + \u20ac19/practitioner \u2014 group practices',
          'Members: free (future optional premium)',
        ],
      },
      {
        id: 'key-resources',
        label: 'Key Resources',
        question: 'What do we need?',
        color: 'bg-rose-50 border-rose-200',
        accent: 'text-rose-700',
        items: [
          'AI engine: context-aware companion + pattern detection (Claude)',
          'Clinical trust: 119 practitioner interviews validating the approach',
          'Product: Next.js platform + mobile app (React Native)',
          'Data moat: every session note + member moment deepens the AI',
        ],
      },
      {
        id: 'key-activities',
        label: 'Key Activities',
        question: 'What must we do well?',
        color: 'bg-amber-50 border-amber-200',
        accent: 'text-amber-700',
        items: [
          'Build a product practitioners actually want to use daily',
          'Make the member experience so gentle people come back without reminders',
          'Generate AI insights that save practitioners real time',
          'Maintain clinical-grade data security (GDPR, HDS-ready)',
        ],
      },
      {
        id: 'key-partners',
        label: 'Key Partners',
        question: 'Who helps us win?',
        color: 'bg-indigo-50 border-indigo-200',
        accent: 'text-indigo-700',
        items: [
          'Anthropic (Claude API): powers Bloom AI companion',
          'Supabase: database, auth, real-time infrastructure',
          'Professional associations: distribution and credibility',
          'Early adopter practitioners: co-design partners and referral engine',
        ],
      },
      {
        id: 'cost-structure',
        label: 'Cost Structure',
        question: 'Where does money go?',
        color: 'bg-gray-50 border-gray-200',
        accent: 'text-gray-700',
        items: [
          'Team: 2 founders + future hires (largest cost)',
          'AI API costs: ~\u20ac1.80/user/month (Claude Haiku)',
          'Infrastructure: Supabase + Vercel (~\u20ac0.50/user/month)',
          'GTM: conferences, content, no paid ads planned',
          'Target gross margin: 83%',
        ],
      },
    ],
  },
  fr: {
    title: 'Business Model Canvas',
    subtitle: 'Comment Bloomsline cr\u00e9e, d\u00e9livre et capture de la valeur',
    back: 'Retour au Dataroom',
    blocks: [
      {
        id: 'customer-segments',
        label: 'Segments Clients',
        question: 'Qui servons-nous ?',
        color: 'bg-teal-50 border-teal-200',
        accent: 'text-teal-700',
        items: [
          'Psychologues et psychoth\u00e9rapeutes ind\u00e9pendants (15-30 clients)',
          'Cabinets de groupe (3-8 praticiens)',
          'Coachs et praticiens en th\u00e9rapie br\u00e8ve',
          'Leurs clients (membres) qui utilisent l\u2019app gratuite',
        ],
      },
      {
        id: 'value-proposition',
        label: 'Proposition de Valeur',
        question: 'Quel probl\u00e8me r\u00e9solvons-nous ?',
        color: 'bg-violet-50 border-violet-200',
        accent: 'text-violet-700',
        items: [
          'Comble les 167 heures/semaine entre les s\u00e9ances',
          'Le praticien commence inform\u00e9, pas en rattrapant',
          'Les membres capturent des moments (humeur, r\u00e9flexions) en 10 secondes',
          'L\u2019IA d\u00e9tecte des patterns et g\u00e9n\u00e8re des briefs pr\u00e9-s\u00e9ance',
          'Une plateforme remplace notes \u00e9parpill\u00e9es, WhatsApp et fiches papier',
        ],
      },
      {
        id: 'channels',
        label: 'Canaux',
        question: 'Comment les atteindre ?',
        color: 'bg-orange-50 border-orange-200',
        accent: 'text-orange-700',
        items: [
          'SEO : profils praticiens r\u00e9f\u00e9renc\u00e9s sur Google (z\u00e9ro pub)',
          'Bouche-\u00e0-oreille : recommandations entre pairs',
          'B2B2C : chaque praticien invite 20-50 membres \u00e0 CAC z\u00e9ro',
          'R\u00e9seaux pro : conf\u00e9rences, associations, groupes de supervision',
        ],
      },
      {
        id: 'customer-relationships',
        label: 'Relations Clients',
        question: 'Comment les fid\u00e9liser ?',
        color: 'bg-blue-50 border-blue-200',
        accent: 'text-blue-700',
        items: [
          'Onboarding personnalis\u00e9 : appel de setup avec chaque praticien',
          'Bloom IA : engagement quotidien pour les membres (sans culpabilit\u00e9)',
          'Valeur continue : les insights IA s\u2019am\u00e9liorent avec le temps',
          'Communaut\u00e9 : groupes de pairs, biblioth\u00e8que partag\u00e9e',
        ],
      },
      {
        id: 'revenue-streams',
        label: 'Sources de Revenus',
        question: 'Comment gagne-t-on de l\u2019argent ?',
        color: 'bg-emerald-50 border-emerald-200',
        accent: 'text-emerald-700',
        items: [
          'Essentiel : 19\u20ac/mois \u2014 praticien solo, fonctions cl\u00e9s',
          'Pro : 29\u20ac/mois \u2014 plateforme compl\u00e8te + insights IA',
          'Cabinet : 49\u20ac + 19\u20ac/praticien \u2014 cabinets de groupe',
          'Membres : gratuit (premium optionnel pr\u00e9vu)',
        ],
      },
      {
        id: 'key-resources',
        label: 'Ressources Cl\u00e9s',
        question: 'De quoi avons-nous besoin ?',
        color: 'bg-rose-50 border-rose-200',
        accent: 'text-rose-700',
        items: [
          'Moteur IA : compagnon contextuel + d\u00e9tection de patterns (Claude)',
          'Confiance clinique : 119 entretiens praticiens validant l\u2019approche',
          'Produit : plateforme Next.js + app mobile (React Native)',
          'Moat data : chaque note et moment enrichit l\u2019IA',
        ],
      },
      {
        id: 'key-activities',
        label: 'Activit\u00e9s Cl\u00e9s',
        question: 'Que devons-nous bien faire ?',
        color: 'bg-amber-50 border-amber-200',
        accent: 'text-amber-700',
        items: [
          'Construire un produit que les praticiens veulent utiliser chaque jour',
          'Rendre l\u2019exp\u00e9rience membre si douce qu\u2019ils reviennent sans rappel',
          'G\u00e9n\u00e9rer des insights IA qui font gagner du temps r\u00e9el',
          'Maintenir une s\u00e9curit\u00e9 clinique (RGPD, HDS-ready)',
        ],
      },
      {
        id: 'key-partners',
        label: 'Partenaires Cl\u00e9s',
        question: 'Qui nous aide \u00e0 gagner ?',
        color: 'bg-indigo-50 border-indigo-200',
        accent: 'text-indigo-700',
        items: [
          'Anthropic (Claude API) : alimente le compagnon IA Bloom',
          'Supabase : base de donn\u00e9es, auth, infrastructure temps r\u00e9el',
          'Associations professionnelles : distribution et cr\u00e9dibilit\u00e9',
          'Praticiens early adopters : co-design et moteur de recommandation',
        ],
      },
      {
        id: 'cost-structure',
        label: 'Structure de Co\u00fbts',
        question: 'O\u00f9 va l\u2019argent ?',
        color: 'bg-gray-50 border-gray-200',
        accent: 'text-gray-700',
        items: [
          '\u00c9quipe : 2 fondateurs + futurs recrutements (co\u00fbt principal)',
          'API IA : ~1,80\u20ac/utilisateur/mois (Claude Haiku)',
          'Infrastructure : Supabase + Vercel (~0,50\u20ac/utilisateur/mois)',
          'GTM : conf\u00e9rences, contenu, pas de publicit\u00e9 pay\u00e9e pr\u00e9vue',
          'Marge brute cible : 83%',
        ],
      },
    ],
  },
}

export default function BusinessCanvasPage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — hidden in print */}
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
      <div className="max-w-5xl mx-auto px-6 pt-12 pb-8 print:pt-6 print:pb-4">
        <Link href="/dataroom" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-8 print:hidden">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.back}
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <Logo size="sm" showText={false} />
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t.title}</h1>
            <p className="text-sm text-neutral-500">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Canvas Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16 print:pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-3">
          {t.blocks.map((block, i) => {
            // Layout: make Value Proposition and Customer Segments span 2 cols
            const isWide = i === 1 // Value Proposition
            return (
              <div
                key={block.id}
                className={`rounded-xl border p-5 print:p-3 ${block.color} ${isWide ? 'md:col-span-2' : ''}`}
              >
                <div className="mb-3">
                  <h2 className={`text-sm font-semibold uppercase tracking-wider ${block.accent}`}>
                    {block.label}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">{block.question}</p>
                </div>
                <ul className="space-y-1.5">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-neutral-700 leading-relaxed">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${block.accent.replace('text-', 'bg-')} shrink-0 opacity-60`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 print:mt-4 print:pt-3">
          <span>Bloomsline Care &middot; Pre-Seed &middot; 2026</span>
          <span>B2B SaaS &middot; &euro;19&ndash;49/mo &middot; Members free</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </div>
  )
}

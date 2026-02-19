'use client'

import { Globe, Calendar, Mail, Code, Megaphone, Handshake, Heart, Check, TrendingUp, Rocket, Download } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useLanguage } from '@/lib/i18n/context'

const DEMO_BOOKING_URL = 'https://calendar.app.google/DwruLrgYZ6TEegL58'

const translations = {
  en: {
    header: {
      tagline: 'Reimagining therapeutic care',
      seed: 'Seed Round \u00b7 2026',
      web: 'bloomsline.com',
      email: 'hi@bloomsline.com',
    },
    problem: {
      label: 'THE PROBLEM',
      headline: 'Therapy is 1 hour a week. Life is the other 167.',
      stats: [
        { value: '~50%', label: 'of session time spent catching up', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'get no mental health treatment', source: 'WHO 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '49%', label: 'with issues already use AI', source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
    },
    solution: {
      label: 'THE SOLUTION',
      members: {
        title: 'For Members',
        features: [
          'Capture moments in 10s \u2014 photo, voice, text',
          'Bloom AI companion, always available',
          'AI-discovered patterns in mood & behavior',
        ],
      },
      practitioners: {
        title: 'For Practitioners',
        features: [
          'See their week through what they share',
          'Create & share worksheets in one click',
          'Start sessions already informed',
        ],
      },
    },
    whyNow: {
      label: 'WHY NOW',
      reasons: [
        'Mental health destigmatized post-2020',
        'AI companions socially accepted',
        'Medicare covers digital MH (Jan 2025)',
        'Insurance demands measurable data',
      ],
    },
    market: {
      label: 'MARKET',
      tam: { label: 'TAM', value: '$47B' },
      sam: { label: 'SAM', value: '$5.5B' },
      som: { label: 'SOM', value: '$500M' },
      growth: '20% CAGR',
    },
    pillars: {
      label: 'FOUR PILLARS',
      items: [
        { acronym: 'BCS', name: 'Bloom Context System', desc: 'Behavioral context engine that learns from every moment logged' },
        { acronym: 'PLG', name: 'Practitioner-Led Growth', desc: 'Practitioners become the content and distribution' },
        { acronym: 'CNE', name: 'Care Network Effect', desc: 'Each practitioner brings 20\u201350 members, growth compounds' },
        { acronym: 'GUX', name: 'Gentle UX', desc: 'Progress as narrative, not numbers \u2014 the interface is therapeutic' },
      ],
    },
    traction: {
      label: 'WHERE WE ARE',
      text: 'MVP live \u00b7 Finding product-market fit \u00b7 Q1 2026',
    },
    ask: {
      label: 'THE ASK',
      amount: '\u20ac500K \u2013 \u20ac750K',
      runway: '18 months runway',
      funds: [
        { label: 'Product', percent: 40 },
        { label: 'Team', percent: 30 },
        { label: 'GTM', percent: 20 },
        { label: 'Ops', percent: 10 },
      ],
    },
    footer: {
      model: 'B2B SaaS \u00b7 \u20ac29\u201379/mo \u00b7 Members free',
      cta: 'Book a Meeting',
    },
  },
  fr: {
    header: {
      tagline: 'R\u00e9inventer les soins th\u00e9rapeutiques',
      seed: 'Seed Round \u00b7 2026',
      web: 'bloomsline.com',
      email: 'hi@bloomsline.com',
    },
    problem: {
      label: 'LE PROBL\u00c8ME',
      headline: "La th\u00e9rapie, c'est 1h/semaine. La vie, ce sont les 167 autres.",
      stats: [
        { value: '~50%', label: 'du temps de s\u00e9ance : rattrapage', source: 'APA Practice', url: 'https://www.apa.org/monitor/2024/01/trends-pathways-access-mental-health-care' },
        { value: '86%', label: 'sans traitement en sant\u00e9 mentale', source: 'OMS 2025', url: 'https://www.who.int/news/item/02-09-2025-over-a-billion-people-living-with-mental-health-conditions-services-require-urgent-scale-up' },
        { value: '49%', label: "avec des probl\u00e8mes utilisent d\u00e9j\u00e0 l'IA", source: 'Sentio 2025', url: 'https://sentio.org/ai-research/ai-survey' },
      ],
    },
    solution: {
      label: 'LA SOLUTION',
      members: {
        title: 'Pour les Membres',
        features: [
          'Capturer des moments en 10s \u2014 photo, voix, texte',
          'Bloom, compagnon IA toujours disponible',
          "Patterns d\u00e9couverts par l'IA dans l'humeur",
        ],
      },
      practitioners: {
        title: 'Pour les Praticiens',
        features: [
          "Comprendre leur semaine \u00e0 travers ce qu'ils partagent",
          'Cr\u00e9er et partager des fiches en un clic',
          'Commencer les s\u00e9ances d\u00e9j\u00e0 inform\u00e9',
        ],
      },
    },
    whyNow: {
      label: 'POURQUOI MAINTENANT',
      reasons: [
        'Sant\u00e9 mentale d\u00e9stigmatis\u00e9e post-2020',
        'Compagnons IA socialement accept\u00e9s',
        'Medicare couvre la sant\u00e9 mentale num\u00e9rique',
        'Les assurances exigent des donn\u00e9es mesurables',
      ],
    },
    market: {
      label: 'MARCH\u00c9',
      tam: { label: 'TAM', value: '47 Mrd$' },
      sam: { label: 'SAM', value: '5,5 Mrd$' },
      som: { label: 'SOM', value: '500 M$' },
      growth: '20% TCAC',
    },
    pillars: {
      label: 'QUATRE PILIERS',
      items: [
        { acronym: 'BCS', name: 'Bloom Context System', desc: 'Moteur de contexte comportemental qui apprend de chaque moment' },
        { acronym: 'PLG', name: 'Practitioner-Led Growth', desc: 'Les praticiens deviennent le contenu et la distribution' },
        { acronym: 'CNE', name: 'Care Network Effect', desc: 'Chaque praticien am\u00e8ne 20\u201350 membres, croissance compos\u00e9e' },
        { acronym: 'GUX', name: 'Gentle UX', desc: "Le progr\u00e8s en r\u00e9cit, pas en chiffres \u2014 l'interface est th\u00e9rapeutique" },
      ],
    },
    traction: {
      label: 'O\u00d9 NOUS EN SOMMES',
      text: 'MVP en ligne \u00b7 Recherche product-market fit \u00b7 T1 2026',
    },
    ask: {
      label: 'LA DEMANDE',
      amount: '500K\u20ac \u2013 750K\u20ac',
      runway: '18 mois de runway',
      funds: [
        { label: 'Produit', percent: 40 },
        { label: '\u00c9quipe', percent: 30 },
        { label: 'GTM', percent: 20 },
        { label: 'Ops', percent: 10 },
      ],
    },
    footer: {
      model: 'B2B SaaS \u00b7 29\u201379\u20ac/mois \u00b7 Membres gratuit',
      cta: 'R\u00e9server un RDV',
    },
  },
}

export default function OnePagePage() {
  const { locale, setLocale } = useLanguage()
  const t = (translations as Record<string, typeof translations.en>)[locale] || translations.en

  const pillarIcons = [Code, Megaphone, Handshake, Heart]
  const pillarColors = [
    'bg-teal-50 border-teal-200 text-teal-700',
    'bg-violet-50 border-violet-200 text-violet-700',
    'bg-orange-50 border-orange-200 text-orange-700',
    'bg-blue-50 border-blue-200 text-blue-700',
  ]

  return (
    <div className="one-pager-page min-h-screen bg-white">
      {/* Language Toggle — hidden in print */}
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

      {/* A4 Container */}
      <div className="max-w-[210mm] mx-auto bg-white print:max-w-none print:mx-0">
        <div className="px-8 py-6 print:px-0 print:py-0 space-y-4 print:space-y-3">

          {/* ── HEADER ─────────────────────────────────────── */}
          <header className="flex items-start justify-between pb-3 border-b-2 border-teal-500 print:border-teal-600">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Logo size="sm" showText className="print:[&_div]:!animate-none" />
              </div>
              <p className="text-sm text-neutral-600 italic">{t.header.tagline}</p>
              <p className="text-xs text-neutral-400 mt-0.5">
                {t.header.web} &middot; {t.header.email}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-700 print:bg-transparent print:border-teal-400">
                {t.header.seed}
              </span>
            </div>
          </header>

          {/* ── PROBLEM ────────────────────────────────────── */}
          <section>
            <SectionLabel>{t.problem.label}</SectionLabel>
            <p className="text-base font-bold text-neutral-900 mb-2 leading-snug">
              {t.problem.headline}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {t.problem.stats.map((stat, i) => (
                <div key={i} className="text-center p-2 rounded-lg bg-red-50 border border-red-100 print:bg-transparent print:border-red-200">
                  <p className="text-xl font-bold text-red-500 print:text-red-600">{stat.value}</p>
                  <p className="text-[11px] text-neutral-600 leading-tight">{stat.label}</p>
                  <a
                    href={stat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-neutral-400 hover:text-teal-600 underline underline-offset-2 print:text-neutral-500 print:no-underline"
                  >
                    {stat.source}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* ── SOLUTION + WHY NOW / MARKET (2-column) ───── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left — Solution */}
            <section>
              <SectionLabel>{t.solution.label}</SectionLabel>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-1">{t.solution.members.title}</p>
                  <ul className="space-y-0.5">
                    {t.solution.members.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                        <Check className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">{t.solution.practitioners.title}</p>
                  <ul className="space-y-0.5">
                    {t.solution.practitioners.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                        <Check className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Right — Why Now + Market */}
            <section className="space-y-3">
              <div>
                <SectionLabel>{t.whyNow.label}</SectionLabel>
                <ul className="space-y-0.5">
                  {t.whyNow.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                      <TrendingUp className="w-3 h-3 text-teal-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <SectionLabel>{t.market.label}</SectionLabel>
                <div className="flex items-center gap-3 text-[11px]">
                  <span><strong className="text-red-600">{t.market.tam.label}</strong> {t.market.tam.value}</span>
                  <span className="text-neutral-300">&middot;</span>
                  <span><strong className="text-blue-600">{t.market.sam.label}</strong> {t.market.sam.value}</span>
                  <span className="text-neutral-300">&middot;</span>
                  <span><strong className="text-teal-600">{t.market.som.label}</strong> {t.market.som.value}</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-0.5">{t.market.growth}</p>
              </div>
            </section>
          </div>

          {/* ── FOUR PILLARS ───────────────────────────────── */}
          <section>
            <SectionLabel>{t.pillars.label}</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {t.pillars.items.map((pillar, i) => {
                const Icon = pillarIcons[i]
                return (
                  <div key={i} className={`p-2 rounded-lg border ${pillarColors[i]} print:bg-transparent`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-bold">{pillar.acronym}</span>
                    </div>
                    <p className="text-[10px] font-medium text-neutral-800 leading-tight">{pillar.name}</p>
                    <p className="text-[10px] text-neutral-600 leading-tight mt-0.5">{pillar.desc}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── STATUS + THE ASK (2-column) ──────────────── */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left — Where we are */}
            <section>
              <SectionLabel>{t.traction.label}</SectionLabel>
              <p className="text-sm font-medium text-neutral-700">{t.traction.text}</p>
            </section>

            {/* Right — The Ask */}
            <section>
              <SectionLabel>{t.ask.label}</SectionLabel>
              <p className="text-base font-bold text-neutral-900">{t.ask.amount}</p>
              <p className="text-[11px] text-neutral-500 mb-1.5">{t.ask.runway}</p>
              <div className="flex gap-2">
                {t.ask.funds.map((fund, i) => {
                  const barColors = ['bg-teal-500', 'bg-violet-500', 'bg-orange-400', 'bg-neutral-400']
                  return (
                    <div key={i} className="flex-1 text-center">
                      <div className="h-1.5 rounded-full bg-neutral-100 mb-0.5 overflow-hidden">
                        <div className={`h-full rounded-full ${barColors[i]}`} style={{ width: `${fund.percent}%` }} />
                      </div>
                      <p className="text-[9px] text-neutral-600">{fund.label} {fund.percent}%</p>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ── FOOTER ─────────────────────────────────────── */}
          <footer className="pt-3 border-t border-neutral-200 flex items-center justify-between">
            <p className="text-xs text-neutral-500 font-medium">{t.footer.model}</p>
            <div className="flex items-center gap-3">
              <a
                href={DEMO_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors print:bg-transparent print:text-teal-700 print:border print:border-teal-600"
              >
                <Calendar className="w-3 h-3" />
                {t.footer.cta}
              </a>
              <a
                href="mailto:hi@bloomsline.com"
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <Mail className="w-3 h-3" />
                {t.header.email}
              </a>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1 print:text-teal-700">
      {children}
    </p>
  )
}

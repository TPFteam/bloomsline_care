'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Target,
  Shield,
  BarChart3,
  Globe,
  Presentation,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Layers,
  Scale,
  Rocket,
} from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

const SectionTitle = ({ number, children, subtitle }: { number: string; children: React.ReactNode; subtitle?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{number}</span>
      <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-500 mt-1 ml-10">{subtitle}</p>}
  </div>
)

const Table = ({ headers, rows, compact }: { headers: string[]; rows: (string | React.ReactNode)[][]; compact?: boolean }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="text-left px-3 py-2 bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
            {row.map((cell, j) => (
              <td key={j} className={`px-3 ${compact ? 'py-1.5' : 'py-2.5'} text-gray-700 ${j === 0 ? 'font-medium' : ''}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Badge = ({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

type Lang = 'en' | 'fr'

export default function BusinessModelPage() {
  const [lang, setLang] = useState<Lang>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/dataroom" className="text-gray-400 hover:text-gray-600 transition-colors mr-1">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Business Model Analysis', 'Analyse du modèle économique')}</h1>
              <p className="text-[10px] text-gray-400">Bloomsline Care — {t('Investor Memo, Q1 2026', 'Mémo investisseur, T1 2026')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-12">

        {/* ── Confidential Banner ─────────────────────────────── */}
        <motion.div {...fadeUp()} className="bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs font-semibold">{t('Confidential — Investor Materials', 'Confidentiel — Documents investisseurs')}</p>
              <p className="text-[10px] text-gray-400">{t('Pre-Seed | Pre-Revenue | France-First', 'Pré-seed | Pré-revenu | France en priorité')}</p>
            </div>
          </div>
          <span className="text-[10px] text-gray-500">{t('February 2026', 'Février 2026')}</span>
        </motion.div>

        {/* ── Executive Summary ───────────────────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('Executive Summary', 'Résumé exécutif')}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              {t(
                'Bloomsline is building the between-session care layer for mental health — a dual-sided platform connecting practitioners (B2B SaaS, €19-49/mo) and their clients (free companion app) in the 167 hours between therapy sessions where no tool currently exists.',
                'Bloomsline construit la couche de soin entre les séances pour la santé mentale — une plateforme double reliant praticiens (SaaS B2B, €19-49/mois) et leurs clients (app compagnon gratuite) dans les 167 heures entre les séances de thérapie où aucun outil n\'existe actuellement.'
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: TrendingUp, text: t('€12B EU market at 25% CAGR — zero dominant between-session platform', 'Marché UE de 12 Md€ à 25% TCAC — aucune plateforme dominante entre séances') },
                { icon: Users, text: t('B2B2C model: each practitioner brings 20-50 members at zero CAC', 'Modèle B2B2C : chaque praticien amène 20-50 membres à CAC zéro') },
                { icon: DollarSign, text: t('83% gross margin, €50 CAC, 5x LTV/CAC, 2-month payback (modeled)', '83% marge brute, €50 CAC, 5x LTV/CAC, remboursement en 2 mois (modélisé)') },
                { icon: Rocket, text: t('Raising €400-500K pre-seed for 18 months → 100+ practitioners, Series A ready', 'Levée €400-500K pré-seed pour 18 mois → 100+ praticiens, prêt pour Série A') },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <p className="text-xs text-amber-800">
                <strong>{t('Critical caveat:', 'Avertissement critique :')}</strong> {t('Every financial metric in this memo is modeled, not observed. Zero paying customers today. This analysis distinguishes between validated data (interviews, market research) and assumptions (pricing, churn, adoption).', 'Chaque métrique financière de ce mémo est modélisée, non observée. Zéro client payant aujourd\'hui. Cette analyse distingue les données validées (entretiens, études de marché) des hypothèses (tarification, churn, adoption).')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── 1. Core Value Proposition ───────────────────────── */}
        <motion.section {...fadeUp(0.1)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="01" subtitle={t('Problem, urgency, value creation, differentiation', 'Problème, urgence, création de valeur, différenciation')}>
              {t('Core Value Proposition', 'Proposition de valeur fondamentale')}
            </SectionTitle>

            <div className="bg-gray-900 text-white rounded-lg p-4">
              <p className="text-sm font-medium">{t('Therapy is 1 hour/week. Life is 167 hours/week.', 'La thérapie dure 1h/semaine. La vie dure 167h/semaine.')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('Those hours are a black box. No tool exists to connect practitioners and clients between sessions.', 'Ces heures sont une boîte noire. Aucun outil ne relie praticiens et clients entre les séances.')}</p>
            </div>

            <Table
              headers={[t('Dimension', 'Dimension'), t('Data Point', 'Donnée'), t('Source', 'Source')]}
              rows={[
                [t('Session inefficiency', 'Inefficacité des séances'), t('~50% of session time spent catching up', '~50% du temps de séance passé à rattraper'), 'APA Practice 2024'],
                [t('Treatment gap', 'Écart de traitement'), t('86% get no mental health treatment', '86% ne reçoivent aucun traitement'), 'WHO 2025'],
                [t('AI readiness', 'Maturité IA'), t('49% with MH issues already use AI', '49% avec problèmes de SM utilisent déjà l\'IA'), 'Sentio 2025'],
                [t('Homework non-completion', 'Non-complétion des exercices'), t('20-50% of therapy homework uncompleted', '20-50% des exercices thérapeutiques non complétés'), t('Clinical literature', 'Littérature clinique')],
                [t('Admin burden', 'Charge admin'), t('5-8 hours/week on notes, scheduling', '5-8h/semaine en notes, planification'), t('Discovery interviews (n=119)', 'Entretiens découverte (n=119)')],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900 mt-4">{t('Quantified Value Creation', 'Création de valeur quantifiée')}</h3>
            <Table
              headers={[t('Value Driver', 'Levier de valeur'), t('Annual Value', 'Valeur annuelle'), t('Bloomsline Cost', 'Coût Bloomsline'), t('Multiple', 'Multiple')]}
              rows={[
                [t('Admin time saved (5-8 hrs/week)', 'Temps admin économisé (5-8h/sem)'), '€10,400-€16,640', '€348/yr', '35x'],
                [t('Client retention improvement', 'Amélioration rétention clients'), '€1,600-€2,400', '€348/yr', '5x'],
                [t('AI-assisted notes (20→5 min)', 'Notes assistées IA (20→5 min)'), '€7,800+', '€348/yr', '26x'],
                [t('Between-session visibility', 'Visibilité entre séances'), '~€2,000', '€348/yr', '7x'],
                [t('Outcome documentation', 'Documentation des résultats'), '€1,500+', '€348/yr', '5x'],
                [<strong key="total">{t('Total value delivered', 'Valeur totale délivrée')}</strong>, <strong key="v">€23,300+</strong>, <strong key="c">€348/yr</strong>, <strong key="m">~67x</strong>],
              ]}
            />
            <p className="text-xs text-gray-500 italic">{t('Bloomsline captures 1.5% of value created — deliberately underpriced for adoption velocity.', 'Bloomsline capture 1,5% de la valeur créée — délibérément sous-tarifé pour la vitesse d\'adoption.')}</p>

            <h3 className="text-sm font-semibold text-gray-900 mt-4">{t('The Market Gap', 'Le trou dans le marché')}</h3>
            <Table
              headers={[t('Category', 'Catégorie'), t('Players', 'Acteurs'), t('What They Do', 'Ce qu\'ils font'), t('Gap', 'Manque')]}
              rows={[
                [t('Practice Tools', 'Outils cabinet'), 'SimplePractice, Jane, Doctolib', t('Run the business (billing, EHR)', 'Gèrent le cabinet (facturation, DME)'), t('No member engagement', 'Pas d\'engagement membre')],
                [t('Wellness Apps', 'Apps bien-être'), 'Headspace, Calm, BetterHelp', t('Help individuals cope', 'Aident à gérer seul'), t('No practitioner connection', 'Pas de lien praticien')],
                ['Enterprise', 'Spring Health, Moka.care', t('Employer-sponsored navigation', 'Navigation sponsorisée employeur'), t('No independent practitioner tools', 'Pas d\'outils praticien indépendant')],
                [t('AI Chatbots', 'Chatbots IA'), 'Woebot ✝, Wysa', t('Standalone AI therapy', 'Thérapie IA autonome'), t('Woebot shut down — standalone fails', 'Woebot fermé — l\'autonome échoue')],
                [<strong key="b">Bloomsline</strong>, '—', <strong key="w">{t('Connects both sides between sessions', 'Relie les deux côtés entre séances')}</strong>, <Badge key="badge" color="green">{t('Uncontested', 'Incontesté')}</Badge>],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 2. Revenue Model ───────────────────────────────── */}
        <motion.section {...fadeUp(0.15)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="02" subtitle={t('Revenue streams, pricing, ARPU, scalability', 'Sources de revenus, tarification, ARPU, scalabilité')}>
              {t('Revenue Model Breakdown', 'Décomposition du modèle de revenus')}
            </SectionTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Essentiel', price: '€19/mo', target: t('Solo testing', 'Solo en test'), margin: '~78%', color: 'border-gray-300' },
                { name: 'Pro', price: '€29/mo', target: t('Core ICP (15-25 clients)', 'ICP principal (15-25 clients)'), margin: '~85%', color: 'border-emerald-400', badge: t('Recommended', 'Recommandé') },
                { name: 'Cabinet', price: '€49 + €19/head', target: t('Group practices (3-8)', 'Cabinets de groupe (3-8)'), margin: '~87%', color: 'border-violet-300' },
              ].map(tier => (
                <div key={tier.name} className={`rounded-lg border-2 ${tier.color} p-4`}>
                  {tier.badge && <Badge color="green">{tier.badge}</Badge>}
                  <p className="text-lg font-bold text-gray-900 mt-1">{tier.price}</p>
                  <p className="text-sm font-semibold text-gray-700">{tier.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{tier.target}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('Gross margin', 'Marge brute')}: {tier.margin}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>{t('Key insight:', 'Insight clé :')}</strong> {t('€10/mo ARPU difference (€19 vs €29) = 3x revenue difference at M18. Getting 70% of practitioners onto Pro is the single most important pricing lever.', 'Un écart de 10€/mois d\'ARPU (€19 vs €29) = 3x de différence de revenus à M18. Placer 70% des praticiens en Pro est le levier tarifaire le plus important.')}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('ARPU Assumptions', 'Hypothèses ARPU')}</h3>
            <Table
              headers={[t('Scenario', 'Scénario'), t('Tier Mix', 'Répartition'), t('Blended ARPU', 'ARPU pondéré'), t('B2C Upside', 'Upside B2C')]}
              rows={[
                [t('Conservative', 'Conservateur'), '60% E / 35% P / 5% C', '€19/mo', '€0.72/mo'],
                [<strong key="b">{t('Base', 'Base')}</strong>, <strong key="m">20% E / 70% P / 10% C</strong>, <strong key="a">€25.50/mo</strong>, <strong key="u">€1.80/mo</strong>],
                [t('Aggressive', 'Agressif'), '10% E / 55% P / 35% C', '€32/mo', '€3.60/mo'],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('5-Year Revenue Model', 'Modèle de revenus 5 ans')}</h3>
            <Table
              headers={[t('Year', 'Année'), t('Practitioners', 'Praticiens'), t('Members', 'Membres'), 'MRR', 'ARR', t('Key Driver', 'Levier principal')]}
              rows={[
                ['Y1 (2026)', '10 → 120', '120 → 1,440', '€290 → €3,400', '€3.5K → €41K', t('Founder-led sales', 'Vente fondateur')],
                ['Y2 (2027)', '120 → 410', '1,440 → 4,920', '€3,400 → €11,900', '€41K → €143K', t('Referral loop, partnerships', 'Boucle de parrainage')],
                ['Y3 (2028)', '410 → 850', '4,920 → 10,200', '€11,900 → €24,650', '€143K → €296K', t('Organic + Belgium/Switzerland', 'Organique + Belgique/Suisse')],
                ['Y4 (2029)', '850 → 1,800', '10,200 → 21,600', '€24,650 → €52,200', '€296K → €626K', t('Germany/Spain, enterprise', 'Allemagne/Espagne, enterprise')],
                ['Y5 (2030)', '1,800 → 3,500', '21,600 → 42,000', '€52,200 → €101,500', '€626K → €1.2M', t('Multi-market, member premium', 'Multi-marché, premium membre')],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 3. Unit Economics ───────────────────────────────── */}
        <motion.section {...fadeUp(0.2)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="03" subtitle={t('CAC, LTV, margins, break-even, sensitivity', 'CAC, LTV, marges, seuil de rentabilité, sensibilité')}>
              {t('Unit Economics & Profitability', 'Unit Economics & Rentabilité')}
            </SectionTitle>

            <h3 className="text-sm font-semibold text-gray-900">{t('Gross Margin Waterfall (Pro Tier)', 'Cascade de marge brute (Tier Pro)')}</h3>
            <Table
              headers={[t('Item', 'Poste'), t('Amount', 'Montant'), t('% Revenue', '% Revenu')]}
              compact
              rows={[
                [t('Revenue', 'Revenu'), '€29.00', '100%'],
                ['Claude Haiku API', '-€1.80', '6.2%'],
                ['Supabase (DB + auth)', '-€0.50', '1.7%'],
                ['Hosting (Vercel EU)', '-€0.30', '1.0%'],
                ['PostHog', '-€0.10', '0.3%'],
                ['Email/Notifications', '-€0.05', '0.2%'],
                ['Support & onboarding', '-€1.50', '5.2%'],
                [<strong key="vc">{t('Total Variable Cost', 'Coût variable total')}</strong>, <strong key="v">€4.25</strong>, <strong key="p">14.7%</strong>],
                [<strong key="gp">{t('Gross Profit', 'Marge brute')}</strong>, <strong key="v2">€24.75</strong>, <strong key="p2">85.3%</strong>],
                ['CAC (25-mo amortized)', '-€2.00', '6.9%'],
                [<strong key="cm">{t('Contribution Margin', 'Marge de contribution')}</strong>, <strong key="v3">€22.75</strong>, <strong key="p3">78.4%</strong>],
              ]}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'LTV', value: '€3,625', sub: t('25-month avg lifetime', 'Durée de vie moy. 25 mois') },
                { label: 'CAC', value: '€50', sub: t('Blended, no paid', 'Pondéré, sans pub') },
                { label: 'LTV/CAC', value: '72x', sub: t('Target: >5x', 'Cible : >5x') },
                { label: t('Payback', 'Remboursement'), value: t('~2 months', '~2 mois'), sub: t('Top decile SaaS', 'Top décile SaaS') },
              ].map(m => (
                <div key={m.label} className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600 font-medium">{m.label}</p>
                  <p className="text-xl font-bold text-emerald-800">{m.value}</p>
                  <p className="text-[10px] text-emerald-500">{m.sub}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('LTV Sensitivity', 'Sensibilité LTV')}</h3>
            <Table
              headers={[t('Scenario', 'Scénario'), t('Churn', 'Churn'), 'ARPU', 'LTV', 'LTV/CAC']}
              rows={[
                [<span key="w" className="text-red-600">{t('Worst', 'Pire')}</span>, '7%', '€19', '€1,779', '36x'],
                [<strong key="b">{t('Base', 'Base')}</strong>, <strong key="c">4%</strong>, <strong key="a">€29</strong>, <strong key="l">€3,625</strong>, <strong key="r">72x</strong>],
                [<span key="be" className="text-emerald-600">{t('Best', 'Meilleur')}</span>, '2.5%', '€39', '€5,800', '116x'],
              ]}
            />

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
              <p className="text-xs text-amber-800">
                <strong>{t('Critical:', 'Critique :')}</strong> {t('1% churn change = €1,800 LTV swing. Churn is the most sensitive variable and has zero data points.', '1% de variation du churn = €1 800 de variation LTV. Le churn est la variable la plus sensible et n\'a aucune donnée réelle.')}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('Break-Even Analysis', 'Analyse du seuil de rentabilité')}</h3>
            <Table
              headers={[t('Scenario', 'Scénario'), t('Fixed Costs/mo', 'Coûts fixes/mois'), t('Contribution/User', 'Contribution/Utilisateur'), t('Break-Even', 'Seuil'), t('Expected Month', 'Mois attendu')]}
              rows={[
                [t('Conservative', 'Conservateur'), '€6,700', '€14.75', t('454 practitioners', '454 praticiens'), 'M28-M32'],
                [<strong key="b">{t('Base', 'Base')}</strong>, <strong key="f">€8,600</strong>, <strong key="c">€24.75</strong>, <strong key="p">{t('347 practitioners', '347 praticiens')}</strong>, <strong key="m">M22-M26</strong>],
                [t('Aggressive', 'Agressif'), '€11,000', '€30.75', t('358 practitioners', '358 praticiens'), 'M16-M20'],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Red Flag Triggers', 'Alertes critiques')}</h3>
            <div className="space-y-1.5">
              {[
                { metric: t('Monthly churn > 8%', 'Churn mensuel > 8%'), consequence: t('LTV crashes to €2,175', 'LTV tombe à €2 175') },
                { metric: t('Zero organic signups by M3', 'Zéro inscription organique à M3'), consequence: t('Distribution model broken', 'Modèle de distribution cassé') },
                { metric: t('Member activation < 50%', 'Activation membres < 50%'), consequence: t('Practitioners churn within 60 days', 'Praticiens churneront sous 60 jours') },
                { metric: t('CAC > €150', 'CAC > €150'), consequence: t('Organic channels saturated', 'Canaux organiques saturés') },
                { metric: t('Cash < €150K with < 50 practitioners', 'Cash < €150K avec < 50 praticiens'), consequence: t('Not Series A-ready', 'Pas prêt pour Série A') },
              ].map((flag, i) => (
                <div key={i} className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5">
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700 font-medium">{flag.metric}</span>
                  <span className="text-xs text-red-500">→ {flag.consequence}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── 4. Cost Structure ───────────────────────────────── */}
        <motion.section {...fadeUp(0.25)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="04" subtitle={t('Fixed vs variable, cost drivers, operating leverage', 'Fixe vs variable, inducteurs de coûts, levier opérationnel')}>
              {t('Cost Structure', 'Structure des coûts')}
            </SectionTitle>

            <Table
              headers={[t('Cost Category', 'Catégorie'), 'M1', 'M12', 'M36', t('Type', 'Type')]}
              compact
              rows={[
                [t('Team (founders + contractors)', 'Équipe (fondateurs + prestataires)'), '€6,500', '€6,500', '€12,000', t('Fixed (stepped)', 'Fixe (par paliers)')],
                ['Marketing', '€1,000', '€1,000', '€2,000', t('Fixed', 'Fixe')],
                [t('Legal/accounting', 'Juridique/comptabilité'), '€400', '€400', '€800', t('Fixed', 'Fixe')],
                ['Claude Haiku API', '€18', '€211', '€1,530', t('Variable', 'Variable')],
                ['Supabase', '€25', '€50', '€200', t('Semi-variable', 'Semi-variable')],
                ['Hosting (Vercel)', '€0', '€30', '€200', t('Semi-variable', 'Semi-variable')],
                ['CAC spend', '€150', '€1,755', '€4,500', t('Variable', 'Variable')],
                ['Support labor', '€15', '€176', '€425', t('Variable', 'Variable')],
                [<strong key="t">{t('Total', 'Total')}</strong>, <strong key="m1">€8,108</strong>, <strong key="m12">€10,122</strong>, <strong key="m36">€21,755</strong>, ''],
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: t('Team costs', 'Coûts équipe'), pct: '65-75%', note: t('Founders below market rate', 'Fondateurs sous le marché') },
                { title: t('Capital intensity', 'Intensité capitalistique'), pct: t('LOW', 'FAIBLE'), note: t('Cloud-native, no CAPEX', 'Cloud-natif, pas de CAPEX') },
                { title: t('Operating leverage', 'Levier opérationnel'), pct: t('STRONG', 'FORT'), note: t('€4.25 variable/user at any scale', '€4,25 variable/utilisateur à toute échelle') },
              ].map(item => (
                <div key={item.title} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{item.title}</p>
                  <p className="text-lg font-bold text-gray-900">{item.pct}</p>
                  <p className="text-[10px] text-gray-400">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── 5. Distribution & GTM ──────────────────────────── */}
        <motion.section {...fadeUp(0.3)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="05" subtitle={t('Channels, economics, sales cycle, network effects', 'Canaux, économie, cycle de vente, effets de réseau')}>
              {t('Distribution & Go-to-Market', 'Distribution & Go-to-Market')}
            </SectionTitle>

            <h3 className="text-sm font-semibold text-gray-900">{t('Sales Model: Hybrid', 'Modèle de vente : Hybride')}</h3>
            <Table
              headers={[t('Phase', 'Phase'), t('Timeline', 'Calendrier'), t('Model', 'Modèle'), t('Primary Channel', 'Canal principal')]}
              rows={[
                ['Phase 1', 'M1-M6', t('Founder-led direct sales', 'Vente directe fondateur'), t('LinkedIn, 50+ conversations/week', 'LinkedIn, 50+ conversations/sem')],
                ['Phase 2', 'M7-M12', t('Organic inbound + referrals', 'Inbound organique + parrainage'), t('Content SEO, referral program', 'SEO contenu, programme parrainage')],
                ['Phase 3', 'M13-M18', t('Community-led growth', 'Croissance communautaire'), t('Word-of-mouth, training institutes', 'Bouche-à-oreille, instituts de formation')],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Channel Economics', 'Économie des canaux')}</h3>
            <Table
              headers={[t('Channel', 'Canal'), 'CAC', t('Quality', 'Qualité'), 'LTV/CAC', t('Scalability', 'Scalabilité')]}
              rows={[
                ['Founder LinkedIn', '€35-50', t('High', 'Haute'), '86x', t('Limited', 'Limitée')],
                [t('Referral program', 'Parrainage'), '€29', t('Highest', 'La plus haute'), '150x', t('High', 'Haute')],
                ['French SEO', '€15-25', t('High', 'Haute'), '181x', t('Very high', 'Très haute')],
                [t('Events', 'Événements'), '€60-100', t('Very high', 'Très haute'), '45x', t('Low', 'Faible')],
                [t('Training institutes', 'Instituts de formation'), '€0', t('Medium', 'Moyenne'), '∞', t('High', 'Haute')],
              ]}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">{t('Network Effect Flywheel (UNPROVEN)', 'Effet de réseau (NON PROUVÉ)')}</h4>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-blue-700">
                {(lang === 'fr'
                  ? ['Praticien s\'inscrit', 'Invite 20-50 membres', 'Membres s\'engagent', 'Praticien voit les résultats', 'En parle aux pairs', 'Nouveaux praticiens']
                  : ['Practitioner signs up', 'Invites 20-50 members', 'Members engage', 'Practitioner sees results', 'Tells peers', 'New practitioners join']
                ).map((step, i, arr) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="bg-blue-100 px-2 py-0.5 rounded-full font-medium">{step}</span>
                    {i < arr.length - 1 && <span className="text-blue-400">→</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── 6. Competitive Landscape & Moat ────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="06" subtitle={t('Competitors, switching costs, defensibility, positioning', 'Concurrents, coûts de changement, défensibilité, positionnement')}>
              {t('Competitive Landscape & Moat Strategy', 'Paysage concurrentiel & Stratégie de moat')}
            </SectionTitle>

            <Table
              headers={[t('Competitor', 'Concurrent'), t('Category', 'Catégorie'), t('Pricing', 'Prix'), t('Scale', 'Échelle'), t('Threat', 'Menace')]}
              rows={[
                ['SimplePractice', t('Practice mgmt', 'Gestion cabinet'), '$49-99/mo', '250K users', <Badge key="m" color="amber">MEDIUM</Badge>],
                ['Doctolib', t('Booking + admin', 'Réservation + admin'), '€139/mo', '80M patients', <Badge key="h" color="red">HIGH</Badge>],
                ['Jane App', t('Multi-discipline', 'Multi-discipline'), 'C$54-99/mo', '$1.8B val', <Badge key="l" color="green">LOW</Badge>],
                ['Headspace', t('Wellness', 'Bien-être'), '$12.99/mo', '80M downloads', <Badge key="l2" color="green">LOW</Badge>],
                ['Spring Health', 'Enterprise EAP', '$5-14 PEPM', '$3.3B val', <Badge key="m2" color="amber">MEDIUM</Badge>],
                ['Woebot ✝', t('AI chatbot', 'Chatbot IA'), t('Shut down', 'Fermé'), '$123M raised', <Badge key="v" color="gray">{t('VALIDATED US', 'NOUS VALIDE')}</Badge>],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Defensibility Assessment', 'Évaluation de la défensibilité')}</h3>
            <Table
              headers={[t('Moat Type', 'Type de moat'), t('Today', 'Aujourd\'hui'), t('12 Months', '12 mois'), t('36 Months', '36 mois')]}
              rows={[
                [t('Data moat (behavioral patterns)', 'Moat données (patterns comportementaux)'), <Badge key="n" color="gray">{t('None', 'Aucun')}</Badge>, <Badge key="l" color="amber">Low</Badge>, <Badge key="mh" color="green">MED-HIGH</Badge>],
                [t('Network effects (B2B2C)', 'Effets de réseau (B2B2C)'), <Badge key="n2" color="gray">{t('None', 'Aucun')}</Badge>, <Badge key="lm" color="amber">Low-Med</Badge>, <Badge key="h2" color="green">HIGH</Badge>],
                [t('Regulatory barrier (GDPR/HDS)', 'Barrière réglementaire'), <Badge key="m3" color="amber">Medium</Badge>, <Badge key="m4" color="amber">Medium</Badge>, <Badge key="h3" color="green">HIGH</Badge>],
                [t('Ecosystem (practitioner+member+AI)', 'Écosystème'), <Badge key="b" color="amber">{t('Built', 'Construit')}</Badge>, <Badge key="m5" color="amber">Medium</Badge>, <Badge key="h4" color="green">HIGH</Badge>],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 7. Business Model Risks ────────────────────────── */}
        <motion.section {...fadeUp(0.4)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="07" subtitle={t('15 risks identified — 4 critical, 4 high, 7 medium', '15 risques identifiés — 4 critiques, 4 élevés, 7 moyens')}>
              {t('Business Model Risks', 'Risques du modèle économique')}
            </SectionTitle>

            <div className="space-y-2">
              {[
                { id: 'R1', risk: t('Adoption slower than modeled', 'Adoption plus lente que modélisée'), cat: t('Market', 'Marché'), score: '16', severity: 'CRITICAL', color: 'red', mitigation: t('Hard 90-day checkpoint: 10 paying or pivot', 'Checkpoint strict 90 jours : 10 payants ou pivot') },
                { id: 'R4', risk: t('Two-person team bottleneck', 'Goulot d\'étranglement équipe 2 personnes'), cat: t('Operational', 'Opérationnel'), score: '16', severity: 'CRITICAL', color: 'red', mitigation: t('Hire engineer M1-2, clinical advisor M1', 'Recrutement ingénieur M1-2, conseiller clinique M1') },
                { id: 'R6', risk: t('PMF not reached', 'PMF non atteint'), cat: t('Operational', 'Opérationnel'), score: '15', severity: 'CRITICAL', color: 'red', mitigation: t('Pivot options at M9: AI scribe, enterprise, licensing', 'Options de pivot à M9 : scribe IA, enterprise, licensing') },
                { id: 'R9', risk: t('Series A gap', 'Écart Série A'), cat: t('Financial', 'Financier'), score: '15', severity: 'CRITICAL', color: 'red', mitigation: t('VC networking from M9, bridge round option', 'Networking VC dès M9, option bridge') },
                { id: 'R2', risk: t('SimplePractice/Doctolib convergence', 'Convergence SimplePractice/Doctolib'), cat: t('Market', 'Marché'), score: '12', severity: 'HIGH', color: 'amber', mitigation: t('18-24 month window; compete on care quality + local fit', 'Fenêtre 18-24 mois ; concurrencer sur qualité des soins') },
                { id: 'R8', risk: t('Churn exceeds 8%', 'Churn dépasse 8%'), cat: t('Financial', 'Financier'), score: '12', severity: 'HIGH', color: 'amber', mitigation: t('Activation score from Day 1; annual billing +20% discount', 'Score d\'activation dès J1 ; facturation annuelle +20%') },
                { id: 'R10', risk: t('HDS certification mandate', 'Obligation certification HDS'), cat: t('Regulatory', 'Réglementaire'), score: '12', severity: 'HIGH', color: 'amber', mitigation: t('HDS specialist by M3; portable DB layer; OVHcloud backup', 'Spécialiste HDS à M3 ; couche DB portable ; backup OVHcloud') },
                { id: 'R5', risk: t('Anthropic Claude dependency', 'Dépendance Anthropic Claude'), cat: t('Operational', 'Opérationnel'), score: '9', severity: 'MEDIUM', color: 'gray', mitigation: t('Model abstraction layer by M4; Mistral fallback', 'Couche d\'abstraction M4 ; fallback Mistral') },
              ].map(r => (
                <div key={r.id} className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 ${r.color === 'red' ? 'border-red-200 bg-red-50/50' : r.color === 'amber' ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <Badge color={r.color}>{r.severity}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">{r.id}</span>
                      <span className="text-xs font-semibold text-gray-900">{r.risk}</span>
                      <span className="text-[10px] text-gray-400">{r.cat}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">{t('Mitigation:', 'Atténuation :')} {r.mitigation}</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 flex-shrink-0">{r.score}</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('Scenario Outcomes', 'Résultats par scénario')}</h3>
            <Table
              headers={[t('Scenario', 'Scénario'), t('Probability', 'Probabilité'), t('M18 Outcome', 'Résultat M18'), t('Implication', 'Implication')]}
              rows={[
                [<span key="b" className="text-emerald-600 font-medium">{t('PMF found', 'PMF trouvé')}</span>, '35%', '180+ practitioners, €70K MRR', <Badge key="s" color="green">{t('Series A ready', 'Prêt Série A')}</Badge>],
                [<span key="s" className="text-amber-600 font-medium">{t('Slower adoption', 'Adoption lente')}</span>, '40%', '80 practitioners, €28K MRR', <Badge key="w" color="amber">{t('Weaker position', 'Position plus faible')}</Badge>],
                [<span key="st" className="text-red-600 font-medium">{t('Very slow', 'Très lent')}</span>, '20%', '20 practitioners, €8K MRR', <Badge key="p" color="red">{t('Pivot required', 'Pivot nécessaire')}</Badge>],
                [<span key="bl" className="text-gray-500 font-medium">{t('Market rejection', 'Rejet marché')}</span>, '5%', '<3 practitioners', <Badge key="w2" color="red">{t('Wind-down', 'Dissolution')}</Badge>],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 8. TAM → Revenue Capture ────────────────────────── */}
        <motion.section {...fadeUp(0.45)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="08" subtitle={t('TAM to revenue logic with penetration model', 'De la TAM aux revenus avec modèle de pénétration')}>
              {t('TAM → Revenue Capture Logic', 'TAM → Logique de capture de revenus')}
            </SectionTitle>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TAM', value: '€12B', sub: t('EU Digital Mental Health 2025', 'Santé mentale numérique UE 2025'), growth: '→ €30B (2030)' },
                { label: 'SAM', value: '€2B', sub: t('Practice tools + MH apps in EU', 'Outils cabinet + apps SM en UE'), growth: '→ €5B (2030)' },
                { label: 'SOM', value: '€50M', sub: t('France independent practitioners', 'Praticiens indépendants France'), growth: t('30,000 practitioners', '30 000 praticiens') },
              ].map(m => (
                <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 font-medium">{m.label}</p>
                  <p className="text-xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-[10px] text-gray-400">{m.sub}</p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{m.growth}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('France Penetration Path', 'Trajectoire de pénétration France')}</h3>
            <Table
              headers={[t('Penetration', 'Pénétration'), t('Practitioners', 'Praticiens'), t('MRR (at €29)', 'MRR (à €29)'), 'ARR', t('Timeline', 'Calendrier')]}
              rows={[
                ['0.03%', '10', '€290', '€3,480', 'M6'],
                ['0.4%', '120', '€3,480', '€41,760', 'M12'],
                ['1%', '300', '€8,700', '€104,400', 'M18'],
                ['3%', '900', '€26,100', '€313,200', 'M36'],
                ['5%', '1,500', '€43,500', '€522,000', 'Y5'],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Multi-Market Expansion (Y3-Y5)', 'Expansion multi-marché (A3-A5)')}</h3>
            <Table
              headers={[t('Market', 'Marché'), t('Practitioners', 'Praticiens'), t('Target Penetration', 'Pénétration cible'), t('Incremental ARR', 'ARR incrémental')]}
              rows={[
                [t('France', 'France'), '30,000', '3-5%', '€313K-€522K'],
                [t('Belgium', 'Belgique'), '12,500', '1-2%', '€43K-€87K'],
                [t('Switzerland', 'Suisse'), '10,200', '1-2%', '€53K-€106K'],
                [t('Spain', 'Espagne'), '38,000', '0.5-1%', '€41K-€100K'],
                [t('Germany', 'Allemagne'), '56,000', '0.5-1%', '€101K-€202K'],
                [<strong key="t">{t('Total Y5', 'Total A5')}</strong>, <strong key="n">146,700</strong>, <strong key="p">1-3%</strong>, <strong key="a">€551K-€1.02M</strong>],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 9. Strategic Expansion Path ─────────────────────── */}
        <motion.section {...fadeUp(0.5)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="09" subtitle={t('Adjacent revenue, platform potential, international expansion', 'Revenus adjacents, potentiel plateforme, expansion internationale')}>
              {t('Strategic Expansion Path', 'Trajectoire d\'expansion stratégique')}
            </SectionTitle>

            <h3 className="text-sm font-semibold text-gray-900">{t('Adjacent Revenue Opportunities', 'Opportunités de revenus adjacents')}</h3>
            <Table
              headers={[t('Opportunity', 'Opportunité'), t('Timing', 'Calendrier'), t('Model', 'Modèle'), t('Revenue (at scale)', 'Revenu (à l\'échelle)'), t('Risk', 'Risque')]}
              rows={[
                [t('Member premium (€3/mo)', 'Premium membre (€3/mois)'), 'M3+', t('Freemium upsell', 'Upsell freemium'), '€1,530/mo', <Badge key="l" color="green">Low</Badge>],
                [t('AI outcome reports', 'Rapports résultats IA'), 'M6+', t('Per-report add-on', 'Add-on par rapport'), '€1,700-€4,250/mo', <Badge key="l2" color="green">Low</Badge>],
                [t('Resource marketplace', 'Marketplace ressources'), 'M12+', t('20% commission', 'Commission 20%'), '€500-€2,000/mo', <Badge key="m" color="amber">Medium</Badge>],
                [t('Training institute white-label', 'White-label instituts'), 'M12+', t('Enterprise license', 'Licence enterprise'), '€5,000-€10,000/mo', <Badge key="m2" color="amber">Medium</Badge>],
                [t('Employer/insurance', 'Employeur/assurance'), 'M18+', 'PEPM', '€3,000-€5,000/mo', <Badge key="h" color="red">High</Badge>],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Platform Vision (3 Phases)', 'Vision plateforme (3 phases)')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { phase: t('Phase 1 (Now-M12)', 'Phase 1 (Maintenant-M12)'), title: t('Between-Session Care', 'Soin entre séances'), desc: t('Prove the core value proposition', 'Prouver la proposition de valeur'), color: 'border-emerald-300 bg-emerald-50' },
                { phase: t('Phase 2 (M12-M24)', 'Phase 2 (M12-M24)'), title: t('Behavioral Data Asset', 'Actif données comportementales'), desc: t('Unique consent-based dataset', 'Dataset unique avec consentement'), color: 'border-violet-300 bg-violet-50' },
                { phase: t('Phase 3 (Future)', 'Phase 3 (Futur)'), title: t('Research Infrastructure', 'Infrastructure de recherche'), desc: t('Anonymized insights for pharma & research', 'Insights anonymisés pour pharma & recherche'), color: 'border-gray-300 bg-gray-50' },
              ].map(p => (
                <div key={p.phase} className={`rounded-lg border-2 ${p.color} p-3`}>
                  <p className="text-[10px] text-gray-400 font-semibold">{p.phase}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{p.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('International Expansion', 'Expansion internationale')}</h3>
            <Table
              headers={[t('Phase', 'Phase'), t('Markets', 'Marchés'), t('Timeline', 'Calendrier'), t('Investment', 'Investissement'), t('Entry Mode', 'Mode d\'entrée')]}
              rows={[
                ['1', t('France (active)', 'France (actif)'), t('Now', 'Maintenant'), t('In pre-seed', 'Dans pré-seed'), 'Digital-first'],
                ['2', t('Belgium, Switzerland', 'Belgique, Suisse'), 'M3-M6', '€5-15K each', t('Zero localization (French)', 'Zéro localisation (français)')],
                ['3', t('Germany, Spain, NL', 'Allemagne, Espagne, NL'), 'M7-M12', '€35-50K total', 'Digital-first + partnerships'],
                ['4', t('UK', 'Royaume-Uni'), 'M12-M18', '€15-25K', 'Digital-first'],
                ['5', t('US (post-Series A only)', 'US (post-Série A uniquement)'), t('Not recommended pre-seed', 'Non recommandé pré-seed'), '€80-150K+', 'HIPAA build required'],
              ]}
            />
          </div>
        </motion.section>

        {/* ── 10. Investor Framing ───────────────────────────── */}
        <motion.section {...fadeUp(0.55)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <SectionTitle number="10" subtitle={t('Why invest, what to track, milestones, capital efficiency', 'Pourquoi investir, quoi suivre, jalons, efficacité du capital')}>
              {t('Investor Framing', 'Cadrage investisseur')}
            </SectionTitle>

            <h3 className="text-sm font-semibold text-gray-900">{t('Why This Is Venture-Scale', 'Pourquoi c\'est une opportunité venture')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: TrendingUp, text: t('€12B market at 25% CAGR, no dominant player', 'Marché 12 Md€ à 25% TCAC, aucun acteur dominant') },
                { icon: Users, text: t('B2B2C flywheel: viral coefficient potentially >1', 'Flywheel B2B2C : coefficient viral potentiellement >1') },
                { icon: BarChart3, text: t('83% gross margin — better than SaaS median (70-75%)', '83% marge brute — meilleur que la médiane SaaS (70-75%)') },
                { icon: Layers, text: t('Data moat: years of between-session behavioral data', 'Moat données : années de données comportementales') },
                { icon: Globe, text: t('Build in France, expand to Germany (DiGA), UK, then US', 'Construit en France, expansion Allemagne (DiGA), UK, puis US') },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-700">{text}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-gray-900">{t('Milestones That De-Risk', 'Jalons de dé-risquage')}</h3>
            <Table
              headers={[t('Milestone', 'Jalon'), t('Target', 'Cible'), t('What It Proves', 'Ce que ça prouve'), t('Risk Eliminated', 'Risque éliminé')]}
              rows={[
                [t('First 10 paying', '10 premiers payants'), 'M3', t('WTP exists', 'La DDP existe'), <Badge key="p" color="amber">{t('PMF partial', 'PMF partiel')}</Badge>],
                ['<5% churn', 'M6', t('Product retains', 'Le produit retient'), <Badge key="c" color="amber">{t('Churn risk', 'Risque churn')}</Badge>],
                [t('First organic signup', '1er signup organique'), 'M4-M6', t('Word-of-mouth works', 'Le bouche-à-oreille fonctionne'), <Badge key="d" color="amber">{t('Distribution', 'Distribution')}</Badge>],
                ['100 practitioners, 80%+ retention', 'M12', t('PMF achieved', 'PMF atteint'), <Badge key="pmf" color="green">{t('PMF fully', 'PMF complet')}</Badge>],
                ['€100K+ ARR', 'M18', t('Series A economics', 'Économie Série A'), <Badge key="sa" color="green">{t('Series A gap', 'Écart Série A')}</Badge>],
              ]}
            />

            <h3 className="text-sm font-semibold text-gray-900">{t('Capital Efficiency', 'Efficacité du capital')}</h3>
            <Table
              headers={[t('Metric', 'Métrique'), t('Bloomsline (Modeled)', 'Bloomsline (Modélisé)'), t('SaaS Median', 'Médiane SaaS'), t('Assessment', 'Évaluation')]}
              rows={[
                [t('Gross margin', 'Marge brute'), '~83%', '70-75%', <Badge key="a" color="green">{t('Above median', 'Au-dessus')}</Badge>],
                ['LTV/CAC', '~5x', '3-5x', <Badge key="at" color="green">{t('At median', 'À la médiane')}</Badge>],
                [t('CAC payback', 'Remboursement CAC'), t('~2 months', '~2 mois'), t('12-18 months', '12-18 mois'), <Badge key="td" color="green">{t('Top decile', 'Top décile')}</Badge>],
                ['CAC', '€50', '€200-500', <Badge key="td2" color="green">{t('Top decile', 'Top décile')}</Badge>],
                [t('Monthly burn', 'Burn mensuel'), '€8.6K', '—', <Badge key="l" color="green">{t('Extremely lean', 'Extrêmement lean')}</Badge>],
                [t('Runway on €400K', 'Runway sur €400K'), t('46 months (gross)', '46 mois (brut)'), '—', <Badge key="c2" color="green">{t('Conservative buffer', 'Buffer conservateur')}</Badge>],
              ]}
            />

            <div className="bg-gray-900 text-white rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-2">{t('The Ask', 'La demande')}</h4>
              <p className="text-xs text-gray-300 mb-3">{t('€400-500K pre-seed for 18 months to answer one question: will practitioners pay and stay?', '€400-500K pré-seed pour 18 mois pour répondre à une question : les praticiens paieront-ils et resteront-ils ?')}</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: t('Product (AI+Mobile)', 'Produit (IA+Mobile)'), pct: '40%' },
                  { label: t('Team (Eng+Sales)', 'Équipe (Ing+Ventes)'), pct: '25%' },
                  { label: 'Go-to-Market', pct: '25%' },
                  { label: t('Ops & Legal', 'Ops & Juridique'), pct: '10%' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <p className="text-lg font-bold text-white">{item.pct}</p>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Appendix: Key Assumptions ──────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('Appendix — Key Assumptions & Confidence', 'Annexe — Hypothèses clés & Confiance')}</h2>
            <Table
              headers={[t('Assumption', 'Hypothèse'), t('Value', 'Valeur'), t('Confidence', 'Confiance'), t('Basis', 'Base')]}
              rows={[
                [t('Starting practitioners', 'Praticiens de départ'), '10', <Badge key="l" color="red">Low</Badge>, t('WTP unproven', 'DDP non prouvée')],
                ['Blended ARPU', '€25.50/mo', <Badge key="m" color="amber">Medium</Badge>, t('Pricing research + benchmarks', 'Étude tarifaire + benchmarks')],
                [t('Monthly churn', 'Churn mensuel'), '4%', <Badge key="l2" color="red">Low</Badge>, t('Zero real data', 'Aucune donnée réelle')],
                ['CAC', '€50', <Badge key="m2" color="amber">Medium</Badge>, t('Modeled, not observed', 'Modélisé, non observé')],
                [t('Gross margin', 'Marge brute'), '~83%', <Badge key="h" color="green">High</Badge>, t('API costs known', 'Coûts API connus')],
                [t('Members/practitioner', 'Membres/praticien'), '12', <Badge key="l3" color="red">Low</Badge>, t('Network effect unproven', 'Effet de réseau non prouvé')],
                [t('Growth rate', 'Taux de croissance'), '30% → 7%', <Badge key="m3" color="amber">Medium</Badge>, t('Founder sales capacity', 'Capacité de vente fondateur')],
                [t('Team cost', 'Coût équipe'), '€8,600/mo', <Badge key="h2" color="green">High</Badge>, t('Founders below market', 'Fondateurs sous le marché')],
              ]}
            />
          </div>
        </motion.section>

        {/* ── Appendix: 36-Month Cash Flow ───────────────────── */}
        <motion.section {...fadeUp(0.65)}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('Appendix — 36-Month Cash Flow (Base Case)', 'Annexe — Flux de trésorerie 36 mois (Cas de base)')}</h2>
            <Table
              headers={[t('Period', 'Période'), t('Practitioners', 'Praticiens'), 'MRR', t('Gross Profit', 'Marge brute'), t('Fixed Costs', 'Coûts fixes'), t('Net', 'Net'), t('Cumulative Cash', 'Trésorerie cumulée')]}
              compact
              rows={[
                ['M1', '10', '€290', '€247', '€8,600', <span key="n" className="text-red-600">-€8,503</span>, '€391,497'],
                ['M6', '32', '€928', '€792', '€8,600', <span key="n" className="text-red-600">-€8,288</span>, '€349,531'],
                ['M12', '117', '€3,393', '€2,896', '€8,600', <span key="n" className="text-red-600">-€7,459</span>, '€302,230'],
                ['M18', '240', '€6,960', '€5,940', '€10,200', <span key="n" className="text-red-600">-€6,060</span>, '€260,972'],
                ['M24', '410', '€11,890', '€10,147', '€11,000', <span key="n" className="text-red-600">-€2,786</span>, '€237,774'],
                [<strong key="p">M28</strong>, <strong key="pr">600</strong>, <strong key="m">€17,400</strong>, <strong key="g">€14,850</strong>, <strong key="f">€12,000</strong>, <strong key="n" className="text-emerald-600">+€850</strong>, <strong key="c">€235,449</strong>],
                ['M36', '850', '€24,650', '€21,035', '€12,000', <span key="n" className="text-emerald-600 font-semibold">+€6,704</span>, '€265,779'],
              ]}
            />
            <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-4 py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">{t('Cash-flow positive: ~Month 28. Cash never drops below €235K on base case.', 'Cash-flow positif : ~Mois 28. La trésorerie ne descend jamais sous €235K en cas de base.')}</p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ─────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.7)} className="text-center py-6">
          <p className="text-[10px] text-gray-400">{t('Bloomsline Care SAS — Confidential Investor Materials — February 2026', 'Bloomsline Care SAS — Documents investisseurs confidentiels — Février 2026')}</p>
          <Link href="/dataroom" className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2 inline-block">
            ← {t('Back to Data Room', 'Retour à la Data Room')}
          </Link>
        </motion.div>

      </main>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FolderOpen,
  Presentation,
  Sparkles,
  Calculator,
  FileText,
  Mic,
  Cpu,
  Target,
  Rocket,
  Map,
  ExternalLink,
  Clock,
  ArrowRight,
  Users,
  Monitor,
  PieChart,
  Scale,
  BarChart3,
  MessageSquare,
  Lock,
  TrendingUp,
  Shield,
  DollarSign,
  Zap,
  Globe,
  Briefcase,
  Route,
  LayoutGrid,
  Compass,
  BookOpen,
  Palette,
} from 'lucide-react'

type Lang = 'en' | 'fr'
type T = (en: string, fr: string) => string

interface PageItem {
  id: string
  label: string
  description: string
  href: string
  icon: typeof FolderOpen
  color: string
  borderColor: string
  tag: string
  external?: boolean
  comingSoon?: boolean
}

function getPAGES(t: T): PageItem[] {
  return [
    {
      id: 'positioning',
      label: t('Positioning', 'Positionnement'),
      description: t('What we sell, why it matters, and how we say it', 'Ce que nous vendons, pourquoi c\'est important, et comment nous le disons'),
      href: '/positioning',
      icon: Target,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200 hover:border-teal-300',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'pitch-new',
      label: t('Pitch Deck', 'Pitch Deck'),
      description: t('Investor pitch — updated narrative, product, vision, and ask', 'Pitch investisseur — récit, produit, vision et demande actualisés'),
      href: '/pitch',
      icon: Presentation,
      color: 'bg-violet-50 text-violet-600',
      borderColor: 'border-violet-200 hover:border-violet-300',
      tag: t('Latest', 'Récent'),
    },
    {
      id: 'financial-model',
      label: t('Financial Model', 'Modèle financier'),
      description: t('Interactive 36-month projections with editable assumptions', 'Projections interactives sur 36 mois avec hypothèses modifiables'),
      href: '/financial-model',
      icon: Calculator,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      tag: t('Interactive', 'Interactif'),
    },
    {
      id: 'business-canvas',
      label: t('Business Model Canvas', 'Business Model Canvas'),
      description: t('9-block canvas — who we serve, how we win, where the money flows', 'Canvas 9 blocs — qui nous servons, comment nous gagnons, o\u00f9 va l\'argent'),
      href: '/business-canvas',
      icon: LayoutGrid,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200 hover:border-teal-300',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'brand',
      label: t('Brand Foundation', 'Fondation de la Marque'),
      description: t('Mission, values, personality, tone of voice, visual identity, and strategic pillars', 'Mission, valeurs, personnalite, ton de voix, identite visuelle et piliers strategiques'),
      href: '/brand',
      icon: Palette,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200 hover:border-teal-300',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'story',
      label: t('The Bloomsline Story', 'L\'Histoire Bloomsline'),
      description: t('Everything a potential joiner needs to know — origin, product, business, gaps, and why now', 'Tout ce qu\'un potentiel co-fondateur doit savoir — origine, produit, business, manques, et pourquoi maintenant'),
      href: '/story',
      icon: BookOpen,
      color: 'bg-violet-50 text-violet-600',
      borderColor: 'border-violet-200 hover:border-violet-300',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'what-we-need',
      label: t('What We Need to Succeed', 'Ce Dont Nous Avons Besoin'),
      description: t('Honest founder assessment — team gaps, real blockers, next 90 days, and what it takes to go from 0 to 1', '\u00c9valuation honn\u00eate — manques \u00e9quipe, vrais blocages, 90 prochains jours, et ce qu\'il faut pour passer de 0 \u00e0 1'),
      href: '/what-we-need',
      icon: Compass,
      color: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-200 hover:border-rose-300',
      tag: t('Internal', 'Interne'),
    },
    {
      id: 'business-model',
      label: t('Business Model Analysis', 'Analyse du modèle économique'),
      description: t('McKinsey-style memo — value proposition, unit economics, moat strategy, 5-year revenue model, risk matrix, and investor framing', 'Mémo style McKinsey — proposition de valeur, unit economics, stratégie de moat, modèle de revenus 5 ans, matrice des risques et cadrage investisseur'),
      href: '/business-model',
      icon: Briefcase,
      color: 'bg-gray-800 text-white',
      borderColor: 'border-gray-300 hover:border-gray-400',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'one-pager',
      label: t('One Pager', 'One Pager'),
      description: t('Executive summary — single page overview for quick sharing', 'Résumé exécutif — vue d\'ensemble sur une page pour un partage rapide'),
      href: '/one-pager',
      icon: FileText,
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-200 hover:border-amber-300',
      tag: t('Shareable', 'Partageable'),
    },
    {
      id: 'go-to-market',
      label: t('Go-to-Market', 'Go-to-Market'),
      description: t('Practitioner-led growth — phased plan, channels, partnerships, milestones', 'Croissance portée par les praticiens — plan par phases, canaux, partenariats, jalons'),
      href: '/go-to-market',
      icon: Rocket,
      color: 'bg-orange-50 text-orange-600',
      borderColor: 'border-orange-200 hover:border-orange-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'market-sizing',
      label: t('Market Sizing', 'Dimensionnement du marché'),
      description: t('TAM/SAM/SOM analysis — top-down & bottom-up, growth projections, analyst comps', 'Analyse TAM/SAM/SOM — approches top-down et bottom-up, projections de croissance, comparables analystes'),
      href: '/market-sizing',
      icon: PieChart,
      color: 'bg-teal-50 text-teal-600',
      borderColor: 'border-teal-200 hover:border-teal-300',
      tag: t('Market', 'Marché'),
    },
    {
      id: 'competitive-landscape',
      label: t('Competitive Landscape', 'Paysage concurrentiel'),
      description: t('9 competitor profiles, threat assessment, moats, gap analysis, and strategic positioning', '9 profils concurrents, évaluation des menaces, avantages compétitifs, analyse des écarts et positionnement stratégique'),
      href: '/competitive-landscape',
      icon: Target,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200 hover:border-red-300',
      tag: t('Market', 'Marché'),
    },
    {
      id: 'customer-personas',
      label: t('Customer Personas', 'Personas clients'),
      description: t('4 buyer & user personas — demographics, pain points, buying behavior, and prioritization', '4 personas acheteurs et utilisateurs — démographie, irritants, comportement d\'achat et priorisation'),
      href: '/customer-personas',
      icon: Users,
      color: 'bg-pink-50 text-pink-600',
      borderColor: 'border-pink-200 hover:border-pink-300',
      tag: t('Market', 'Marché'),
    },
    {
      id: 'trend-report',
      label: t('Trend Intelligence', 'Veille stratégique'),
      description: t('Sector analysis — macro/micro trends, tech disruptions, regulatory shifts, investment signals', 'Analyse sectorielle — tendances macro/micro, ruptures technologiques, évolutions réglementaires, signaux d\'investissement'),
      href: '/trend-report',
      icon: TrendingUp,
      color: 'bg-lime-50 text-lime-600',
      borderColor: 'border-lime-200 hover:border-lime-300',
      tag: t('Market', 'Marché'),
    },
    {
      id: 'swot-analysis',
      label: t('SWOT & Porter\'s Five Forces', 'SWOT & Cinq forces de Porter'),
      description: t('Strategic assessment — SWOT matrix, Porter\'s analysis, cross-strategies, and industry attractiveness', 'Évaluation stratégique — matrice SWOT, analyse de Porter, stratégies croisées et attractivité du secteur'),
      href: '/swot-analysis',
      icon: Shield,
      color: 'bg-slate-50 text-slate-600',
      borderColor: 'border-slate-200 hover:border-slate-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'risk-analysis',
      label: t('Risk Analysis & Scenarios', 'Analyse des risques et scénarios'),
      description: t('15 risks, heat map, mitigation roadmap, and 4 scenario models', '15 risques, carte de chaleur, feuille de route d\'atténuation et 4 modèles de scénarios'),
      href: '/risk-analysis',
      icon: Shield,
      color: 'bg-red-50 text-red-600',
      borderColor: 'border-red-200 hover:border-red-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'market-entry',
      label: t('Market Entry Analysis', 'Analyse d\'entrée sur le marché'),
      description: t('10 markets scored, 5 entry modes, localization matrix, and 12-month expansion roadmap', '10 marchés évalués, 5 modes d\'entrée, matrice de localisation et feuille de route d\'expansion sur 12 mois'),
      href: '/market-entry',
      icon: Globe,
      color: 'bg-cyan-50 text-cyan-600',
      borderColor: 'border-cyan-200 hover:border-cyan-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'strategic-recommendation',
      label: t('Strategic Recommendation', 'Recommandation stratégique'),
      description: t('CEO strategy brief — current state, 3 options, priority initiatives, and decision framework', 'Note stratégique CEO — état actuel, 3 options, initiatives prioritaires et cadre de décision'),
      href: '/strategic-recommendation',
      icon: Briefcase,
      color: 'bg-gray-800 text-white',
      borderColor: 'border-gray-300 hover:border-gray-400',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'customer-journey',
      label: t('Customer Journey Map', 'Parcours client'),
      description: t('B2B practitioner & B2C member journeys — 7 stages, emotional curves, touchpoints, and opportunities', 'Parcours praticien B2B et membre B2C — 7 étapes, courbes émotionnelles, points de contact et opportunités'),
      href: '/customer-journey',
      icon: Route,
      color: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-200 hover:border-rose-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'pricing-analysis',
      label: t('Pricing Strategy', 'Stratégie tarifaire'),
      description: t('Competitor audit, value-based model, 3-tier design, elasticity, discounts, and 3 revenue scenarios', 'Audit concurrentiel, modèle basé sur la valeur, design 3 niveaux, élasticité, remises et 3 scénarios de revenus'),
      href: '/pricing-analysis',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-600',
      borderColor: 'border-emerald-200 hover:border-emerald-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'gtm-playbook',
      label: t('GTM Playbook', 'Playbook GTM'),
      description: t('Launch phasing, channel strategy, messaging framework, content plan, partnerships, KPIs, and risk mitigation', 'Phasage du lancement, stratégie de canaux, cadre de messaging, plan de contenu, partenariats, KPIs et atténuation des risques'),
      href: '/gtm-playbook',
      icon: Zap,
      color: 'bg-amber-50 text-amber-600',
      borderColor: 'border-amber-200 hover:border-amber-300',
      tag: t('Execution', 'Exécution'),
    },
    {
      id: 'unit-economics',
      label: t('Unit Economics & Financial Model', 'Unit Economics et modèle financier'),
      description: t('CAC by channel, LTV calculation, margin waterfall, 3-year projection, break-even, sensitivity, benchmarks', 'CAC par canal, calcul LTV, cascade de marges, projection 3 ans, seuil de rentabilité, sensibilité, benchmarks'),
      href: '/unit-economics',
      icon: BarChart3,
      color: 'bg-sky-50 text-sky-600',
      borderColor: 'border-sky-200 hover:border-sky-300',
      tag: t('Financial', 'Financier'),
    },
    {
      id: 'tech-overview',
      label: t('Technical Overview', 'Aperçu technique'),
      description: t('Full architecture, tech stack, AI engine, security, and API surface', 'Architecture complète, stack technique, moteur IA, sécurité et surface API'),
      href: '/tech-overview',
      icon: Cpu,
      color: 'bg-cyan-50 text-cyan-600',
      borderColor: 'border-cyan-200 hover:border-cyan-300',
      tag: t('Architecture', 'Architecture'),
    },
    {
      id: 'roadmap',
      label: t('Product Roadmap', 'Feuille de route produit'),
      description: t('Five-track roadmap — product, B2B, B2C, digital presence, and business milestones', 'Feuille de route en cinq axes — produit, B2B, B2C, présence digitale et jalons business'),
      href: '/roadmap',
      icon: Map,
      color: 'bg-purple-50 text-purple-600',
      borderColor: 'border-purple-200 hover:border-purple-300',
      tag: t('Strategy', 'Stratégie'),
    },
    {
      id: 'interviews',
      label: t('Practitioner Interviews', 'Entretiens praticiens'),
      description: t('User research recordings — real practitioner discovery interviews', 'Enregistrements de recherche utilisateur — entretiens découverte avec de vrais praticiens'),
      href: 'https://drive.google.com/drive/folders/1PDjVln_6AFeAPuplWgDHUayQo0l8FyYd?usp=sharing',
      icon: Mic,
      color: 'bg-rose-50 text-rose-600',
      borderColor: 'border-rose-200 hover:border-rose-300',
      tag: t('External', 'Externe'),
      external: true,
    },
    // ── Coming Soon ──────────────────────────
    {
      id: 'team',
      label: t('Team', 'Équipe'),
      description: t('Founder bios, backgrounds, and why we\'re the right team', 'Biographies des fondateurs, parcours et pourquoi nous sommes la bonne équipe'),
      href: '#',
      icon: Users,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('To do', 'À faire'),
      comingSoon: true,
    },
    {
      id: 'product',
      label: t('Product', 'Produit'),
      description: t('What\'s live, how the core loop works, and what\'s next', 'Ce qui est en production, comment fonctionne la boucle, et la suite'),
      href: '/product',
      icon: Monitor,
      color: 'bg-blue-50 text-blue-600',
      borderColor: 'border-blue-200 hover:border-blue-300',
      tag: t('New', 'Nouveau'),
    },
    {
      id: 'cap-table',
      label: t('Cap Table', 'Table de capitalisation'),
      description: t('Equity structure, founder allocation, and ESOP pool', 'Structure du capital, répartition fondateurs et pool ESOP'),
      href: '#',
      icon: PieChart,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('To do', 'À faire'),
      comingSoon: true,
    },
    {
      id: 'legal-docs',
      label: t('Legal Documents', 'Documents juridiques'),
      description: t('Articles of incorporation (SAS), shareholder agreements, RGPD compliance', 'Statuts (SAS), pacte d\'actionnaires, conformité RGPD'),
      href: '#',
      icon: Scale,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('To do', 'À faire'),
      comingSoon: true,
    },
    {
      id: 'metrics',
      label: t('Metrics Dashboard', 'Tableau de bord métriques'),
      description: t('Live traction data — MRR, users, retention, engagement, NPS', 'Données de traction en direct — MRR, utilisateurs, rétention, engagement, NPS'),
      href: '#',
      icon: BarChart3,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('Apr 2026', 'Avr 2026'),
      comingSoon: true,
    },
    {
      id: 'case-studies',
      label: t('Customer Case Studies', 'Études de cas clients'),
      description: t('Practitioner testimonials, outcomes data, and usage stories', 'Témoignages de praticiens, données de résultats et histoires d\'utilisation'),
      href: '#',
      icon: MessageSquare,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('Apr 2026', 'Avr 2026'),
      comingSoon: true,
    },
    // ── Reference Only ──────────────────────────
    {
      id: 'pitch-old',
      label: t('Pitch Deck (Original)', 'Pitch Deck (Original)'),
      description: t('Earlier version of the pitch — kept for reference only', 'Version antérieure du pitch — conservée pour référence uniquement'),
      href: '/pitch-old',
      icon: Presentation,
      color: 'bg-gray-100 text-gray-400',
      borderColor: 'border-gray-200',
      tag: t('Reference', 'Référence'),
    },
  ]
}

export default function DataroomPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const t: T = (en, fr) => lang === 'fr' ? fr : en

  const pages = getPAGES(t)
  const livePages = pages.filter((p) => !p.comingSoon)
  const comingSoonPages = pages.filter((p) => p.comingSoon)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Data Room</h1>
              <p className="text-[10px] text-gray-400">Bloomsline Care — {t('Investor Materials', 'Documents investisseurs')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t('Investor Materials', 'Documents investisseurs')}</h2>
          <p className="text-sm text-gray-500">{t('All fundraising documents in one place. Click any card to open.', 'Tous les documents de levée de fonds au même endroit. Cliquez sur une carte pour l\'ouvrir.')}</p>
        </motion.div>

        {/* ── Live Pages ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {livePages.map((page, i) => {
            const Icon = page.icon
            const isExternal = page.external
            const card = (
              <div
                className={`group relative bg-white border rounded-xl p-5 transition-all cursor-pointer ${page.borderColor} hover:shadow-md`}
                onMouseEnter={() => setHoveredId(page.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${page.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {page.tag}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  {page.label}
                  <ExternalLink className={`w-3 h-3 text-gray-300 transition-all ${hoveredId === page.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`} />
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{page.description}</p>
                <div className={`absolute bottom-5 right-5 transition-all ${hoveredId === page.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            )

            return (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                {isExternal ? (
                  <a href={page.href} target="_blank" rel="noopener noreferrer">{card}</a>
                ) : (
                  <Link href={page.href}>{card}</Link>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* ── Coming Soon ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-3.5 h-3.5 text-gray-300" />
            <h3 className="text-sm font-semibold text-gray-400">{t('Coming Soon', 'Bientôt disponible')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comingSoonPages.map((page, i) => {
              const Icon = page.icon
              return (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.04 }}
                >
                  <div className="relative bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 opacity-60">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg ${page.color} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-medium text-gray-300 bg-white px-1.5 py-0.5 rounded-full border border-gray-100">
                        {page.tag}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-0.5">{page.label}</h4>
                    <p className="text-[10px] text-gray-300 leading-relaxed">{page.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick access footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center gap-2 text-[10px] text-gray-400"
        >
          <Clock className="w-3 h-3" />
          <span>{t('Pre-seed fundraise', 'Levée pré-seed')} — €250K-€400K</span>
          <span className="text-gray-200">|</span>
          <span>{t('Last updated', 'Dernière mise à jour')}: {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', year: 'numeric' })}</span>
        </motion.div>
      </main>
    </div>
  )
}

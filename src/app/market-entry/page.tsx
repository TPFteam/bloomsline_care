'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe,
  Target,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Scale,
  Zap,
  Clock,
  ArrowRight,
  ChevronRight,
  Lightbulb,
  MapPin,
  BarChart3,
  Shield,
  Building2,
  Handshake,
  Laptop,
  Key,
  ShoppingCart,
  Eye,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
)

function ScoreBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-600 w-6 text-right">{value}</span>
    </div>
  )
}

function SeverityBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${color}`}>
      {label}
    </span>
  )
}

// ── Market Attractiveness Data ──────────────────────────────────────────

interface MarketScore {
  country: string
  countryFr: string
  flag: string
  region: string
  regionFr: string
  phase: string
  phaseFr: string
  phaseColor: string
  marketSize: number        // 1-10
  growthRate: number        // 1-10
  competitiveIntensity: number // 1-10 (10 = low competition = good)
  regulatoryEnv: number     // 1-10
  customerAccess: number    // 1-10
  infraReady: number        // 1-10
  weightedTotal: number     // calculated
  practitioners: string
  practitionersFr: string
  marketValue: string
  marketValueFr: string
  keyInsight: string
  keyInsightFr: string
}

// Weights: Market Size 25%, Growth 15%, Competition 20%, Regulatory 20%, Customer Access 10%, Infrastructure 10%
const WEIGHTS = { marketSize: 0.25, growthRate: 0.15, competitiveIntensity: 0.20, regulatoryEnv: 0.20, customerAccess: 0.10, infraReady: 0.10 }

function calcWeighted(m: Omit<MarketScore, 'weightedTotal'>) {
  return Math.round((
    m.marketSize * WEIGHTS.marketSize +
    m.growthRate * WEIGHTS.growthRate +
    m.competitiveIntensity * WEIGHTS.competitiveIntensity +
    m.regulatoryEnv * WEIGHTS.regulatoryEnv +
    m.customerAccess * WEIGHTS.customerAccess +
    m.infraReady * WEIGHTS.infraReady
  ) * 10) / 10
}

const MARKETS_RAW: Omit<MarketScore, 'weightedTotal'>[] = [
  {
    country: 'France',
    countryFr: 'France',
    flag: '🇫🇷',
    region: 'Western Europe',
    regionFr: 'Europe de l\'Ouest',
    phase: 'Active',
    phaseFr: 'Actif',
    phaseColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    marketSize: 8,
    growthRate: 8,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 9,
    infraReady: 9,
    practitioners: '89,800 psychologists (30K independent)',
    practitionersFr: '89 800 psychologues (30 K indépendants)',
    marketValue: '€166M SOM (2025)',
    marketValueFr: '166 M€ SOM (2025)',
    keyInsight: 'Home market. MonParcoursPsy reimbursement, AFTCC partnerships, zero AI-native competitors. 21% YoY practitioner growth.',
    keyInsightFr: 'Marché domestique. Remboursement MonParcoursPsy, partenariats AFTCC, zéro concurrent natif IA. Croissance de 21 % par an des praticiens.',
  },
  {
    country: 'Belgium',
    countryFr: 'Belgique',
    flag: '🇧🇪',
    region: 'Western Europe',
    regionFr: 'Europe de l\'Ouest',
    phase: 'Phase 2',
    phaseFr: 'Phase 2',
    phaseColor: 'bg-blue-50 text-blue-700 border-blue-200',
    marketSize: 5,
    growthRate: 7,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 8,
    infraReady: 8,
    practitioners: '~12,500 psychologists',
    practitionersFr: '~12 500 psychologues',
    marketValue: '€22M estimated',
    marketValueFr: '22 M€ estimé',
    keyInsight: 'French-speaking (Wallonia + Brussels = 55% of population). Zero localization needed for fr-BE. Natural extension of French GTM. Similar regulatory framework.',
    keyInsightFr: 'Francophone (Wallonie + Bruxelles = 55 % de la population). Aucune localisation nécessaire pour fr-BE. Extension naturelle du GTM français. Cadre réglementaire similaire.',
  },
  {
    country: 'Switzerland',
    countryFr: 'Suisse',
    flag: '🇨🇭',
    region: 'Western Europe',
    regionFr: 'Europe de l\'Ouest',
    phase: 'Phase 2',
    phaseFr: 'Phase 2',
    phaseColor: 'bg-blue-50 text-blue-700 border-blue-200',
    marketSize: 5,
    growthRate: 6,
    competitiveIntensity: 8,
    regulatoryEnv: 6,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~10,200 psychologists',
    practitionersFr: '~10 200 psychologues',
    marketValue: '€35M estimated',
    marketValueFr: '35 M€ estimé',
    keyInsight: 'High purchasing power (CHF pricing at premium). French-speaking Romandie (25% of population) = zero localization. Non-EU but GDPR-equivalent (nDSG). Higher willingness to pay.',
    keyInsightFr: 'Pouvoir d\'achat élevé (tarification premium en CHF). Romandie francophone (25 % de la population) = zéro localisation. Hors UE mais équivalent RGPD (nLPD). Plus grande disposition à payer.',
  },
  {
    country: 'Germany',
    countryFr: 'Allemagne',
    flag: '🇩🇪',
    region: 'Central Europe',
    regionFr: 'Europe centrale',
    phase: 'Phase 3',
    phaseFr: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 9,
    growthRate: 8,
    competitiveIntensity: 7,
    regulatoryEnv: 8,
    customerAccess: 5,
    infraReady: 8,
    practitioners: '~56,000 psychotherapists',
    practitionersFr: '~56 000 psychothérapeutes',
    marketValue: '€420M estimated',
    marketValueFr: '420 M€ estimé',
    keyInsight: 'Largest EU mental health market. DiGA pathway = insurance-reimbursed revenue (€200-500 per 90-day prescription). Requires full German localization. High regulatory bar but high reward.',
    keyInsightFr: 'Plus grand marché européen de la santé mentale. Parcours DiGA = revenus remboursés par l\'assurance (200-500 € par prescription de 90 jours). Localisation allemande complète requise. Exigences réglementaires élevées mais forte récompense.',
  },
  {
    country: 'Netherlands',
    countryFr: 'Pays-Bas',
    flag: '🇳🇱',
    region: 'Western Europe',
    regionFr: 'Europe de l\'Ouest',
    phase: 'Phase 3',
    phaseFr: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 5,
    growthRate: 7,
    competitiveIntensity: 8,
    regulatoryEnv: 8,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~22,000 psychologists',
    practitionersFr: '~22 000 psychologues',
    marketValue: '€58M estimated',
    marketValueFr: '58 M€ estimé',
    keyInsight: 'High English proficiency reduces localization costs. Progressive mental health policies. Strong digital health adoption. NZa (Dutch Healthcare Authority) data standards favorable.',
    keyInsightFr: 'Maîtrise élevée de l\'anglais réduisant les coûts de localisation. Politiques progressistes en santé mentale. Forte adoption de la santé numérique. Standards de données NZa (Autorité néerlandaise de santé) favorables.',
  },
  {
    country: 'Spain',
    countryFr: 'Espagne',
    flag: '🇪🇸',
    region: 'Southern Europe',
    regionFr: 'Europe du Sud',
    phase: 'Phase 3',
    phaseFr: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 7,
    growthRate: 9,
    competitiveIntensity: 9,
    regulatoryEnv: 7,
    customerAccess: 6,
    infraReady: 7,
    practitioners: '~38,000 psychologists',
    practitionersFr: '~38 000 psychologues',
    marketValue: '€95M estimated',
    marketValueFr: '95 M€ estimé',
    keyInsight: 'Fastest-growing EU mental health market. i18n already supports Spanish (es). Lower pricing required (€15-22/mo). Strong private practice culture. Growing AI interest.',
    keyInsightFr: 'Marché de santé mentale à la croissance la plus rapide en UE. L\'i18n supporte déjà l\'espagnol (es). Tarification inférieure requise (15-22 €/mois). Forte culture du cabinet privé. Intérêt croissant pour l\'IA.',
  },
  {
    country: 'United Kingdom',
    countryFr: 'Royaume-Uni',
    flag: '🇬🇧',
    region: 'Northern Europe',
    regionFr: 'Europe du Nord',
    phase: 'Phase 3',
    phaseFr: 'Phase 3',
    phaseColor: 'bg-violet-50 text-violet-700 border-violet-200',
    marketSize: 9,
    growthRate: 7,
    competitiveIntensity: 6,
    regulatoryEnv: 6,
    customerAccess: 7,
    infraReady: 9,
    practitioners: '~65,000 registered practitioners',
    practitionersFr: '~65 000 praticiens agréés',
    marketValue: '€380M estimated',
    marketValueFr: '380 M€ estimé',
    keyInsight: 'Large market but more competitive (NHS ecosystem, IAPT pathway). Post-Brexit = separate data regime (UK GDPR). English = no localization. Wysa has NHS validation — Bloomsline needs evidence base.',
    keyInsightFr: 'Grand marché mais plus concurrentiel (écosystème NHS, parcours IAPT). Post-Brexit = régime de données séparé (UK GDPR). Anglais = aucune localisation. Wysa a la validation NHS — Bloomsline doit constituer une base de preuves.',
  },
  {
    country: 'Italy',
    countryFr: 'Italie',
    flag: '🇮🇹',
    region: 'Southern Europe',
    regionFr: 'Europe du Sud',
    phase: 'Phase 4',
    phaseFr: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 7,
    growthRate: 7,
    competitiveIntensity: 8,
    regulatoryEnv: 5,
    customerAccess: 5,
    infraReady: 6,
    practitioners: '~52,000 psychologists',
    practitionersFr: '~52 000 psychologues',
    marketValue: '€110M estimated',
    marketValueFr: '110 M€ estimé',
    keyInsight: 'Large practitioner base but fragmented regional regulations. Bonus Psicologo program (government subsidy) drives demand. Italian localization required. Slower tech adoption in clinical settings.',
    keyInsightFr: 'Large base de praticiens mais réglementations régionales fragmentées. Le programme Bonus Psicologo (subvention gouvernementale) stimule la demande. Localisation italienne requise. Adoption technologique plus lente en milieu clinique.',
  },
  {
    country: 'United States',
    countryFr: 'États-Unis',
    flag: '🇺🇸',
    region: 'North America',
    regionFr: 'Amérique du Nord',
    phase: 'Phase 4',
    phaseFr: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 10,
    growthRate: 8,
    competitiveIntensity: 3,
    regulatoryEnv: 5,
    customerAccess: 4,
    infraReady: 9,
    practitioners: '530K licensed professionals',
    practitionersFr: '530 K professionnels agréés',
    marketValue: '$3.8B SOM',
    marketValueFr: '3,8 Md$ SOM',
    keyInsight: 'Largest global market but most competitive (SimplePractice 237K users, TherapyNotes, BetterHelp). HIPAA compliance required. State-by-state licensure. High CAC ($200-500). Enter only with proven EU model + Series A funding.',
    keyInsightFr: 'Plus grand marché mondial mais le plus concurrentiel (SimplePractice 237 K utilisateurs, TherapyNotes, BetterHelp). Conformité HIPAA requise. Licences État par État. CAC élevé (200-500 $). Entrer uniquement avec un modèle UE prouvé + financement Series A.',
  },
  {
    country: 'Canada',
    countryFr: 'Canada',
    flag: '🇨🇦',
    region: 'North America',
    regionFr: 'Amérique du Nord',
    phase: 'Phase 4',
    phaseFr: 'Phase 4',
    phaseColor: 'bg-gray-100 text-gray-500 border-gray-200',
    marketSize: 6,
    growthRate: 7,
    competitiveIntensity: 5,
    regulatoryEnv: 6,
    customerAccess: 6,
    infraReady: 8,
    practitioners: '~48,000 psychologists',
    practitionersFr: '~48 000 psychologues',
    marketValue: '$280M estimated',
    marketValueFr: '280 M$ estimé',
    keyInsight: 'Bilingual (English/French) = partial localization advantage. Jane App dominant but no AI. Provincial regulation complexity. PIPEDA privacy framework. French-Canadian market is natural bridge.',
    keyInsightFr: 'Bilingue (anglais/français) = avantage partiel de localisation. Jane App dominant mais sans IA. Complexité des réglementations provinciales. Cadre de confidentialité PIPEDA. Le marché franco-canadien est un pont naturel.',
  },
]

const MARKETS: MarketScore[] = MARKETS_RAW.map((m) => ({
  ...m,
  weightedTotal: calcWeighted(m),
})).sort((a, b) => b.weightedTotal - a.weightedTotal)

const FACTOR_LABELS = [
  { key: 'marketSize' as const, label: 'Market Size', labelFr: 'Taille du marché', weight: '25%' },
  { key: 'growthRate' as const, label: 'Growth Rate', labelFr: 'Taux de croissance', weight: '15%' },
  { key: 'competitiveIntensity' as const, label: 'Low Competition', labelFr: 'Faible concurrence', weight: '20%' },
  { key: 'regulatoryEnv' as const, label: 'Regulatory Fit', labelFr: 'Cadre réglementaire', weight: '20%' },
  { key: 'customerAccess' as const, label: 'Customer Access', labelFr: 'Accès client', weight: '10%' },
  { key: 'infraReady' as const, label: 'Infrastructure', labelFr: 'Infrastructure', weight: '10%' },
]

// ── Entry Mode Data ─────────────────────────────────────────────────────

interface EntryMode {
  name: string
  nameFr: string
  icon: typeof Globe
  color: string
  borderColor: string
  bgColor: string
  description: string
  descriptionFr: string
  pros: string[]
  prosFr: string[]
  cons: string[]
  consFr: string[]
  cost: string
  costFr: string
  timeline: string
  timelineFr: string
  bestFor: string
  bestForFr: string
  recommended: boolean
  recommendedFor: string
  recommendedForFr: string
}

const ENTRY_MODES: EntryMode[] = [
  {
    name: 'Digital-First Entry',
    nameFr: 'Entrée 100 % numérique',
    icon: Laptop,
    color: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    bgColor: 'bg-emerald-50',
    description: 'Launch the existing platform in new markets with localization, remote marketing, and digital-only GTM. No local office or team. Leverage existing infrastructure (Supabase EU, Vercel global CDN). Lowest risk, fastest deployment.',
    descriptionFr: 'Lancer la plateforme existante sur de nouveaux marchés avec localisation, marketing à distance et GTM entièrement numérique. Aucun bureau ni équipe locale. Infrastructure existante (Supabase EU, Vercel CDN mondial). Risque minimal, déploiement le plus rapide.',
    pros: [
      'Lowest cost — €5-15K per market entry',
      'Fastest launch — 4-8 weeks per market',
      'Zero fixed overhead — no office, no local hires',
      'Fully reversible — can exit market with no sunk costs',
      'Tests demand before committing resources',
    ],
    prosFr: [
      'Coût le plus bas — 5-15 K€ par entrée sur un marché',
      'Lancement le plus rapide — 4 à 8 semaines par marché',
      'Zéro frais fixes — pas de bureau, pas de recrutement local',
      'Entièrement réversible — sortie du marché sans coûts irrécupérables',
      'Teste la demande avant d\'engager des ressources',
    ],
    cons: [
      'Limited local market knowledge without on-ground presence',
      'Harder to build trust with practitioner communities remotely',
      'Support timezone gaps for distant markets',
      'No local regulatory expertise without advisors',
    ],
    consFr: [
      'Connaissance limitée du marché local sans présence sur le terrain',
      'Plus difficile de bâtir la confiance avec les praticiens à distance',
      'Décalages horaires pour le support des marchés éloignés',
      'Aucune expertise réglementaire locale sans conseillers',
    ],
    cost: '€5-15K per market',
    costFr: '5-15 K€ par marché',
    timeline: '4-8 weeks',
    timelineFr: '4-8 semaines',
    bestFor: 'Phase 2 (Belgium, Switzerland) and Phase 3 markets',
    bestForFr: 'Phase 2 (Belgique, Suisse) et marchés Phase 3',
    recommended: true,
    recommendedFor: 'All initial market entries — test demand before committing capital',
    recommendedForFr: 'Toutes les entrées initiales — tester la demande avant d\'engager du capital',
  },
  {
    name: 'Direct Entry',
    nameFr: 'Entrée directe',
    icon: Building2,
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50',
    description: 'Establish a local entity, hire country managers, and build market presence from scratch. Full control over brand, pricing, and operations. Highest investment but deepest market penetration.',
    descriptionFr: 'Créer une entité locale, recruter des responsables pays et développer la présence commerciale de zéro. Contrôle total sur la marque, les tarifs et les opérations. Investissement le plus élevé mais pénétration de marché la plus profonde.',
    pros: [
      'Full control over brand positioning and pricing',
      'Deep local market understanding through dedicated team',
      'Strongest relationship-building with practitioner associations',
      'Can customize product for local regulatory requirements',
    ],
    prosFr: [
      'Contrôle total sur le positionnement de marque et les tarifs',
      'Compréhension approfondie du marché local grâce à une équipe dédiée',
      'Création de relations solides avec les associations professionnelles',
      'Possibilité d\'adapter le produit aux exigences réglementaires locales',
    ],
    cons: [
      'Highest cost — €80-150K per market (entity + team + compliance)',
      'Slowest — 6-12 months to first revenue',
      'Fixed overhead regardless of traction',
      'Management bandwidth stretched across multiple markets',
      'Irreversible costs if market doesn\'t work',
    ],
    consFr: [
      'Coût le plus élevé — 80-150 K€ par marché (entité + équipe + conformité)',
      'Le plus lent — 6 à 12 mois avant le premier revenu',
      'Frais fixes indépendamment de la traction',
      'Bande passante managériale étirée sur plusieurs marchés',
      'Coûts irrécupérables si le marché ne fonctionne pas',
    ],
    cost: '€80-150K per market',
    costFr: '80-150 K€ par marché',
    timeline: '6-12 months',
    timelineFr: '6-12 mois',
    bestFor: 'Germany (DiGA pathway requires local entity) or US entry',
    bestForFr: 'Allemagne (le parcours DiGA exige une entité locale) ou entrée aux États-Unis',
    recommended: false,
    recommendedFor: 'Only for markets with proven demand and Series A funding',
    recommendedForFr: 'Uniquement pour les marchés avec demande prouvée et financement Series A',
  },
  {
    name: 'Partnership / Joint Venture',
    nameFr: 'Partenariat / Coentreprise',
    icon: Handshake,
    color: 'text-violet-700',
    borderColor: 'border-violet-200',
    bgColor: 'bg-violet-50',
    description: 'Partner with local training institutes, professional associations, or complementary health-tech companies. They provide distribution and local credibility; Bloomsline provides the platform. Revenue share or co-marketing agreements.',
    descriptionFr: 'S\'associer avec des instituts de formation locaux, des associations professionnelles ou des entreprises de santé numérique complémentaires. Ils apportent la distribution et la crédibilité locale ; Bloomsline fournit la plateforme. Partage de revenus ou accords de co-marketing.',
    pros: [
      'Instant local credibility through established partner brand',
      'Access to existing practitioner networks (AFTCC model replicable)',
      'Shared costs and reduced financial risk',
      'Local regulatory knowledge from partner',
      'Distribution at near-zero CAC through partner channels',
    ],
    prosFr: [
      'Crédibilité locale immédiate grâce à la marque du partenaire',
      'Accès aux réseaux de praticiens existants (modèle AFTCC réplicable)',
      'Coûts partagés et risque financier réduit',
      'Expertise réglementaire locale du partenaire',
      'Distribution à CAC quasi nul via les canaux du partenaire',
    ],
    cons: [
      'Revenue sharing reduces margin (typically 20-30% to partner)',
      'Less control over brand messaging and positioning',
      'Partner misalignment risk (different priorities)',
      'Dependency on partner\'s execution quality',
      'Slower decision-making with multiple stakeholders',
    ],
    consFr: [
      'Le partage de revenus réduit la marge (20-30 % au partenaire)',
      'Moins de contrôle sur le message et le positionnement de marque',
      'Risque de désalignement du partenaire (priorités différentes)',
      'Dépendance à la qualité d\'exécution du partenaire',
      'Prise de décision plus lente avec plusieurs parties prenantes',
    ],
    cost: '€10-30K setup + 20-30% revenue share',
    costFr: '10-30 K€ installation + 20-30 % de partage de revenus',
    timeline: '3-6 months',
    timelineFr: '3-6 mois',
    bestFor: 'Training institute partnerships in any EU market',
    bestForFr: 'Partenariats avec des instituts de formation sur tout marché de l\'UE',
    recommended: true,
    recommendedFor: 'Phase 2-3 markets where training institutes exist',
    recommendedForFr: 'Marchés Phase 2-3 où des instituts de formation existent',
  },
  {
    name: 'Acquisition',
    nameFr: 'Acquisition',
    icon: ShoppingCart,
    color: 'text-amber-700',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50',
    description: 'Acquire a small local mental health SaaS or practice management tool to gain instant user base, local compliance, and market presence. Highest cost but fastest path to scale in competitive markets.',
    descriptionFr: 'Acquérir un petit SaaS local de santé mentale ou un outil de gestion de cabinet pour obtenir instantanément une base utilisateurs, la conformité locale et une présence sur le marché. Coût le plus élevé mais chemin le plus rapide vers la croissance dans les marchés concurrentiels.',
    pros: [
      'Instant user base and revenue (day-one traction)',
      'Acquire local compliance frameworks and certifications',
      'Eliminate a competitor while gaining their customers',
      'Team acquisition (local talent + domain expertise)',
    ],
    prosFr: [
      'Base utilisateurs et revenus instantanés (traction dès le premier jour)',
      'Acquisition de cadres de conformité et certifications locaux',
      'Élimination d\'un concurrent tout en récupérant ses clients',
      'Acquisition d\'équipe (talents locaux + expertise métier)',
    ],
    cons: [
      'Highest cost — €200K-2M+ depending on target',
      'Integration complexity (tech stack, culture, data migration)',
      'Requires Series A+ funding (not viable at pre-seed)',
      'Target quality varies — legacy code, high churn possible',
      'Due diligence is resource-intensive for a small team',
    ],
    consFr: [
      'Coût le plus élevé — 200 K€-2 M€+ selon la cible',
      'Complexité d\'intégration (stack technique, culture, migration de données)',
      'Nécessite un financement Series A+ (non viable en pré-amorçage)',
      'Qualité variable de la cible — code legacy, fort churn possible',
      'La due diligence est coûteuse en ressources pour une petite équipe',
    ],
    cost: '€200K-2M+',
    costFr: '200 K€-2 M€+',
    timeline: '4-8 months (diligence + integration)',
    timelineFr: '4-8 mois (due diligence + intégration)',
    bestFor: 'Post-Series A expansion into competitive markets (UK, US)',
    bestForFr: 'Expansion post-Series A sur les marchés concurrentiels (UK, US)',
    recommended: false,
    recommendedFor: 'Only with Series A funding and >500 practitioners on platform',
    recommendedForFr: 'Uniquement avec financement Series A et >500 praticiens sur la plateforme',
  },
  {
    name: 'Licensing / Franchise',
    nameFr: 'Licence / Franchise',
    icon: Key,
    color: 'text-rose-700',
    borderColor: 'border-rose-200',
    bgColor: 'bg-rose-50',
    description: 'License the Bloomsline platform to local operators who manage their own market under the Bloomsline brand (or white-label). They handle sales, support, and compliance; Bloomsline provides the technology.',
    descriptionFr: 'Licencier la plateforme Bloomsline à des opérateurs locaux qui gèrent leur propre marché sous la marque Bloomsline (ou en marque blanche). Ils gèrent les ventes, le support et la conformité ; Bloomsline fournit la technologie.',
    pros: [
      'Rapid geographic coverage with minimal capital',
      'Local operators handle sales and support',
      'Recurring licensing revenue with high margin',
      'Tests multiple markets simultaneously',
    ],
    prosFr: [
      'Couverture géographique rapide avec un capital minimal',
      'Les opérateurs locaux gèrent les ventes et le support',
      'Revenus de licence récurrents à marge élevée',
      'Teste plusieurs marchés simultanément',
    ],
    cons: [
      'Lowest control over quality and brand experience',
      'Finding qualified licensees is difficult in health-tech',
      'Practitioner trust in local operator, not Bloomsline brand',
      'Complex legal framework for health data across jurisdictions',
      'Not viable until platform is proven and documented',
    ],
    consFr: [
      'Contrôle minimal sur la qualité et l\'expérience de marque',
      'Trouver des licenciés qualifiés est difficile dans la santé numérique',
      'Les praticiens font confiance à l\'opérateur local, pas à la marque Bloomsline',
      'Cadre juridique complexe pour les données de santé entre juridictions',
      'Non viable tant que la plateforme n\'est pas prouvée et documentée',
    ],
    cost: '€15-25K legal setup per market',
    costFr: '15-25 K€ installation juridique par marché',
    timeline: '6-9 months (find + onboard licensee)',
    timelineFr: '6-9 mois (trouver + intégrer le licencié)',
    bestFor: 'Distant markets where Bloomsline has no expertise (MENA, Asia)',
    bestForFr: 'Marchés éloignés où Bloomsline n\'a pas d\'expertise (MENA, Asie)',
    recommended: false,
    recommendedFor: 'Only post-Series B for markets outside EU/NA',
    recommendedForFr: 'Uniquement post-Series B pour les marchés hors UE/AN',
  },
]

// ── Localization Requirements ───────────────────────────────────────────

interface LocalizationReq {
  market: string
  marketFr: string
  flag: string
  product: string[]
  productFr: string[]
  pricing: string
  pricingFr: string
  cultural: string[]
  culturalFr: string[]
  legal: string[]
  legalFr: string[]
  talent: string[]
  talentFr: string[]
}

const LOCALIZATIONS: LocalizationReq[] = [
  {
    market: 'Belgium',
    marketFr: 'Belgique',
    flag: '🇧🇪',
    product: [
      'No UI changes — French (fr-BE) supported via existing i18n',
      'Add Belgian insurance integrations (INAMI/RIZIV codes)',
      'Adapt member content for Belgian mental health terminology',
    ],
    productFr: [
      'Aucune modification d\'interface — français (fr-BE) pris en charge via l\'i18n existant',
      'Ajouter les intégrations d\'assurance belge (codes INAMI/RIZIV)',
      'Adapter le contenu patient à la terminologie belge de santé mentale',
    ],
    pricing: '€19-29/mo (same as France — similar purchasing power and practitioner income €50-65K)',
    pricingFr: '19-29 €/mois (identique à la France — pouvoir d\'achat similaire et revenu des praticiens 50-65 K€)',
    cultural: [
      'Dual-community sensitivity (Flemish vs. Walloon)',
      'Marketing in French for Wallonia/Brussels, Dutch for Flanders (Phase 3+)',
      'Belgians value personal recommendation over advertising — referral-first GTM',
    ],
    culturalFr: [
      'Sensibilité aux deux communautés (flamande vs. wallonne)',
      'Marketing en français pour la Wallonie/Bruxelles, en néerlandais pour la Flandre (Phase 3+)',
      'Les Belges valorisent la recommandation personnelle plutôt que la publicité — GTM axé sur le parrainage',
    ],
    legal: [
      'GDPR applies directly (EU member state)',
      'Belgian Commission for the Protection of Privacy (APD/GBA)',
      'Psychologist title protected — verify credential requirements',
      'No HDS-equivalent but health data processing rules apply',
    ],
    legalFr: [
      'Le RGPD s\'applique directement (État membre de l\'UE)',
      'Commission belge pour la protection de la vie privée (APD/GBA)',
      'Titre de psychologue protégé — vérifier les exigences d\'accréditation',
      'Pas d\'équivalent HDS mais les règles de traitement des données de santé s\'appliquent',
    ],
    talent: [
      'No local hire needed initially — serve from France',
      'French-speaking community manager (part-time) by M6 of entry',
      'Belgian psychology association liaison (BFPPS/APPPsy)',
    ],
    talentFr: [
      'Aucun recrutement local nécessaire au départ — opérer depuis la France',
      'Community manager francophone (temps partiel) au M6 de l\'entrée',
      'Liaison avec les associations belges de psychologie (BFPPS/APPPsy)',
    ],
  },
  {
    market: 'Switzerland',
    marketFr: 'Suisse',
    flag: '🇨🇭',
    product: [
      'No UI changes for Romandie (French-speaking Switzerland)',
      'CHF currency support (important — Swiss prefer CHF billing)',
      'Adapt to Swiss psychology association (FSP) requirements',
    ],
    productFr: [
      'Aucune modification d\'interface pour la Romandie (Suisse francophone)',
      'Prise en charge du CHF (important — les Suisses préfèrent la facturation en CHF)',
      'S\'adapter aux exigences de l\'association suisse de psychologie (FSP)',
    ],
    pricing: 'CHF 29-39/mo (premium pricing — Swiss practitioner income €80-120K, 1.5-2x France)',
    pricingFr: 'CHF 29-39/mois (tarification premium — revenu des praticiens suisses 80-120 K€, 1,5-2x la France)',
    cultural: [
      'Quality and precision matter more than price — position on clinical rigor',
      'Swiss German market (65% of population) requires separate localization',
      'Data residency expectations are high — Swiss prefer Swiss or EU hosting',
    ],
    culturalFr: [
      'La qualité et la précision comptent plus que le prix — se positionner sur la rigueur clinique',
      'Le marché suisse alémanique (65 % de la population) nécessite une localisation séparée',
      'Les exigences de résidence des données sont élevées — les Suisses préfèrent un hébergement suisse ou européen',
    ],
    legal: [
      'Non-EU but nDSG (new Data Protection Act) is GDPR-equivalent',
      'Federal Act on Data Protection (FADP) compliance required',
      'Cantonal variations in health regulation (26 cantons)',
      'No EU AI Act obligation but Swiss follow EU standards voluntarily',
    ],
    legalFr: [
      'Hors UE mais la nLPD (nouvelle loi sur la protection des données) est équivalente au RGPD',
      'Conformité requise à la loi fédérale sur la protection des données (LPD)',
      'Variations cantonales en matière de réglementation sanitaire (26 cantons)',
      'Pas d\'obligation liée à l\'AI Act de l\'UE mais la Suisse suit volontairement les normes européennes',
    ],
    talent: [
      'No local hire needed for Romandie launch',
      'Swiss market advisor (contract) for regulatory navigation',
      'FSP partnership contact within 3 months of entry',
    ],
    talentFr: [
      'Aucun recrutement local nécessaire pour le lancement en Romandie',
      'Conseiller marché suisse (contrat) pour la navigation réglementaire',
      'Contact de partenariat FSP dans les 3 mois suivant l\'entrée',
    ],
  },
  {
    market: 'Germany',
    marketFr: 'Allemagne',
    flag: '🇩🇪',
    product: [
      'Full German localization (UI, AI prompts, member content, help docs)',
      'Add i18n locale: de-DE to existing en/fr/es framework',
      'DiGA-compatible data export and interoperability (FHIR)',
      'German-specific AI fine-tuning for clinical notes terminology',
    ],
    productFr: [
      'Localisation complète en allemand (interface, prompts IA, contenu patient, documentation)',
      'Ajouter la locale i18n : de-DE au framework existant en/fr/es',
      'Export de données compatible DiGA et interopérabilité (FHIR)',
      'Fine-tuning IA spécifique à l\'allemand pour la terminologie des notes cliniques',
    ],
    pricing: '€25-35/mo (German practitioners earn €55-75K, higher willingness to pay than France). DiGA reimbursement: €200-500 per 90-day prescription if approved.',
    pricingFr: '25-35 €/mois (les praticiens allemands gagnent 55-75 K€, plus grande disposition à payer qu\'en France). Remboursement DiGA : 200-500 € par prescription de 90 jours si approuvé.',
    cultural: [
      'Evidence-based positioning — Germans require clinical validation claims',
      'Privacy is paramount — lead with data protection messaging',
      'Formal communication style (Sie vs. Du decision in product)',
      'Professional association endorsement critical (DGPs, BDP)',
    ],
    culturalFr: [
      'Positionnement fondé sur les preuves — les Allemands exigent des arguments de validation clinique',
      'La vie privée est primordiale — mettre en avant la protection des données',
      'Style de communication formel (choix Sie vs. Du dans le produit)',
      'L\'aval des associations professionnelles est essentiel (DGPs, BDP)',
    ],
    legal: [
      'GDPR + Bundesdatenschutzgesetz (BDSG) — strictest EU interpretation',
      'DiGA pathway requires BfArM approval (Federal Institute for Drugs)',
      'Medical device classification assessment needed for AI features',
      'Telemediengesetz (TMG) for digital service compliance',
    ],
    legalFr: [
      'RGPD + Bundesdatenschutzgesetz (BDSG) — interprétation la plus stricte de l\'UE',
      'Le parcours DiGA exige l\'approbation du BfArM (Institut fédéral des médicaments)',
      'Évaluation de classification en tant que dispositif médical nécessaire pour les fonctionnalités IA',
      'Telemediengesetz (TMG) pour la conformité des services numériques',
    ],
    talent: [
      'German-speaking country manager (full-time, €50-65K)',
      'Clinical advisor with German licensure',
      'DiGA regulatory consultant (€15-25K project)',
      'German content writer for clinical terminology',
    ],
    talentFr: [
      'Responsable pays germanophone (temps plein, 50-65 K€)',
      'Conseiller clinique avec licence allemande',
      'Consultant réglementaire DiGA (projet à 15-25 K€)',
      'Rédacteur de contenu allemand pour la terminologie clinique',
    ],
  },
  {
    market: 'Spain',
    marketFr: 'Espagne',
    flag: '🇪🇸',
    product: [
      'Spanish localization already exists (es) — verify clinical terminology',
      'Adapt AI prompts for Castilian Spanish (vs. LatAm Spanish)',
      'Add Spanish-specific assessment tools (e.g., BDI-II Spanish validation)',
    ],
    productFr: [
      'La localisation espagnole existe déjà (es) — vérifier la terminologie clinique',
      'Adapter les prompts IA pour l\'espagnol castillan (vs. espagnol d\'Amérique latine)',
      'Ajouter des outils d\'évaluation spécifiques à l\'Espagne (ex. : validation espagnole du BDI-II)',
    ],
    pricing: '€15-22/mo (Spanish practitioners earn €35-50K — adjust pricing to 60-75% of French tier)',
    pricingFr: '15-22 €/mois (les praticiens espagnols gagnent 35-50 K€ — ajuster les tarifs à 60-75 % du palier français)',
    cultural: [
      'Relationship-driven sales — cold outreach less effective than introductions',
      'Regional identity matters (Catalonia, Basque Country, Andalusia)',
      'Private practice is growing rapidly but still nascent vs. public system',
      'Mental health stigma declining fast — 40% increase in therapy demand since 2020',
    ],
    culturalFr: [
      'Ventes basées sur la relation — la prospection à froid est moins efficace que les recommandations',
      'L\'identité régionale compte (Catalogne, Pays basque, Andalousie)',
      'Le cabinet privé se développe rapidement mais reste émergent face au système public',
      'La stigmatisation de la santé mentale recule rapidement — augmentation de 40 % de la demande de thérapie depuis 2020',
    ],
    legal: [
      'GDPR applies + Ley Orgánica de Protección de Datos (LOPDGDD)',
      'AEPD (Spanish Data Protection Agency) — active enforcement',
      'Registro de Actividades de Tratamiento required',
      'Regional health authority variations (17 autonomous communities)',
    ],
    legalFr: [
      'Le RGPD s\'applique + Ley Orgánica de Protección de Datos (LOPDGDD)',
      'AEPD (Agence espagnole de protection des données) — application active',
      'Registro de Actividades de Tratamiento requis',
      'Variations des autorités sanitaires régionales (17 communautés autonomes)',
    ],
    talent: [
      'Spanish-speaking community manager (part-time, €25-35K)',
      'Partnership with Colegio Oficial de Psicólogos (COP)',
      'No local entity needed initially — invoice via French entity',
    ],
    talentFr: [
      'Community manager hispanophone (temps partiel, 25-35 K€)',
      'Partenariat avec le Colegio Oficial de Psicólogos (COP)',
      'Aucune entité locale nécessaire au départ — facturation via l\'entité française',
    ],
  },
  {
    market: 'United Kingdom',
    marketFr: 'Royaume-Uni',
    flag: '🇬🇧',
    product: [
      'English UI already exists — adapt for British English terminology',
      'NHS DTAC (Digital Technology Assessment Criteria) compliance',
      'Integration with UK assessment frameworks (PHQ-9, GAD-7 standard)',
      'UK-specific safeguarding protocols for AI features',
    ],
    productFr: [
      'L\'interface en anglais existe déjà — adapter à la terminologie de l\'anglais britannique',
      'Conformité NHS DTAC (Digital Technology Assessment Criteria)',
      'Intégration avec les cadres d\'évaluation britanniques (PHQ-9, GAD-7 standard)',
      'Protocoles de protection spécifiques au Royaume-Uni pour les fonctionnalités IA',
    ],
    pricing: '£22-29/mo (UK practitioners earn £40-55K — price comparable to France in GBP)',
    pricingFr: '22-29 £/mois (les praticiens britanniques gagnent 40-55 K£ — tarifs comparables à la France en GBP)',
    cultural: [
      'Evidence-based healthcare culture — NICE guidelines are the gold standard',
      'NHS referral pathways important for credibility even in private practice',
      'BACP and BPS membership signals trust — partner with both',
      'Stepped-care model (IAPT) means practitioners familiar with tech-enabled care',
    ],
    culturalFr: [
      'Culture de santé fondée sur les preuves — les recommandations NICE sont la référence',
      'Les parcours de soins NHS sont importants pour la crédibilité même en cabinet privé',
      'L\'adhésion à la BACP et la BPS est un signal de confiance — s\'associer aux deux',
      'Le modèle de soins par paliers (IAPT) signifie que les praticiens connaissent les soins assistés par la technologie',
    ],
    legal: [
      'UK GDPR (post-Brexit) — similar to EU GDPR but separate ICO jurisdiction',
      'Data adequacy decision allows EU-UK data transfer (until 2025 review)',
      'CQC registration may be required depending on service classification',
      'NHS DTAC for credibility in public-sector adjacent practice',
    ],
    legalFr: [
      'UK GDPR (post-Brexit) — similaire au RGPD de l\'UE mais juridiction ICO séparée',
      'La décision d\'adéquation permet le transfert de données UE-UK (jusqu\'à la révision 2025)',
      'L\'inscription CQC peut être requise selon la classification du service',
      'NHS DTAC pour la crédibilité dans les pratiques proches du secteur public',
    ],
    talent: [
      'UK country manager (full-time, £45-55K)',
      'Clinical lead with HCPC registration',
      'UK entity required (Ltd company) for NHS pathway',
    ],
    talentFr: [
      'Responsable pays UK (temps plein, 45-55 K£)',
      'Responsable clinique avec inscription HCPC',
      'Entité britannique requise (Ltd company) pour le parcours NHS',
    ],
  },
  {
    market: 'United States',
    marketFr: 'États-Unis',
    flag: '🇺🇸',
    product: [
      'Full HIPAA compliance build (BAA, encryption, audit logging)',
      'Integration with US EHR standards (HL7 FHIR)',
      'State-specific licensure verification for practitioner onboarding',
      'US-specific insurance/billing integration (CPT codes)',
    ],
    productFr: [
      'Développement de la conformité HIPAA complète (BAA, chiffrement, journalisation d\'audit)',
      'Intégration avec les standards EHR américains (HL7 FHIR)',
      'Vérification des licences par État pour l\'intégration des praticiens',
      'Intégration assurance/facturation spécifique aux États-Unis (codes CPT)',
    ],
    pricing: '$39-59/mo (US practitioners earn $60-90K — price at SimplePractice-competitive level, include AI as differentiator)',
    pricingFr: '39-59 $/mois (les praticiens américains gagnent 60-90 K$ — tarifs compétitifs face à SimplePractice, l\'IA comme différenciateur)',
    cultural: [
      'Feature comparison culture — practitioners compare SimplePractice vs. TherapyNotes vs. Bloomsline',
      'Insurance billing integration is table stakes (not optional)',
      'High willingness to pay for time-saving tools',
      'State-by-state marketing — no "US-wide" approach works',
    ],
    culturalFr: [
      'Culture de comparaison des fonctionnalités — les praticiens comparent SimplePractice, TherapyNotes et Bloomsline',
      'L\'intégration de la facturation d\'assurance est un minimum requis (pas en option)',
      'Forte disposition à payer pour des outils qui font gagner du temps',
      'Marketing État par État — aucune approche « nationale » ne fonctionne',
    ],
    legal: [
      'HIPAA (Health Insurance Portability and Accountability Act) — full compliance required',
      'State privacy laws (CCPA in California, etc.)',
      'FDA SaMD guidance for AI features — classification assessment needed',
      '50-state patchwork of mental health licensure and telehealth laws',
    ],
    legalFr: [
      'HIPAA (Health Insurance Portability and Accountability Act) — conformité totale requise',
      'Lois étatiques sur la vie privée (CCPA en Californie, etc.)',
      'Directives FDA SaMD pour les fonctionnalités IA — évaluation de classification nécessaire',
      'Mosaïque de 50 États en matière de licence de santé mentale et de télésanté',
    ],
    talent: [
      'US GM / VP of Sales (full-time, $120-150K)',
      'HIPAA compliance officer',
      'US entity (Delaware C-corp or subsidiary)',
      'US-based customer success team (2-3 FTEs)',
    ],
    talentFr: [
      'DG / VP des ventes US (temps plein, 120-150 K$)',
      'Responsable conformité HIPAA',
      'Entité américaine (C-corp Delaware ou filiale)',
      'Équipe succès client basée aux États-Unis (2-3 ETP)',
    ],
  },
]

// ── 12-Month Roadmap ────────────────────────────────────────────────────

interface RoadmapMonth {
  month: string
  phase: string
  phaseFr: string
  phaseColor: string
  milestones: string[]
  milestonesFr: string[]
  markets: string
  marketsFr: string
}

const ROADMAP: RoadmapMonth[] = [
  {
    month: 'M1-M2',
    phase: 'Foundation',
    phaseFr: 'Fondation',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France (deepen)',
    marketsFr: 'France (approfondissement)',
    milestones: [
      'Reach 30+ paying practitioners in France',
      'Validate unit economics: CAC <€50, churn <6%, NPS >40',
      'Document expansion playbook: onboarding flow, GTM checklist, support SOP',
      'Research Belgium/Switzerland practitioner associations',
      'Begin CHF billing integration for Switzerland',
    ],
    milestonesFr: [
      'Atteindre 30+ praticiens payants en France',
      'Valider les indicateurs unitaires : CAC <50 €, churn <6 %, NPS >40',
      'Documenter le playbook d\'expansion : flux d\'onboarding, checklist GTM, SOP support',
      'Rechercher les associations de praticiens en Belgique/Suisse',
      'Lancer l\'intégration de facturation en CHF pour la Suisse',
    ],
  },
  {
    month: 'M3',
    phase: 'Belgium Prep',
    phaseFr: 'Préparation Belgique',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France + Belgium (prep)',
    marketsFr: 'France + Belgique (préparation)',
    milestones: [
      'Launch Belgian landing page (fr-BE) — zero product changes needed',
      'Contact APPPsy and BFPPS (Belgian psychology associations)',
      'Identify 5 Belgian early-adopter practitioners through French network referrals',
      'Set up Belgian billing (same Stripe account, EUR)',
    ],
    milestonesFr: [
      'Lancer la page d\'atterrissage belge (fr-BE) — aucune modification produit nécessaire',
      'Contacter l\'APPPsy et la BFPPS (associations belges de psychologie)',
      'Identifier 5 praticiens belges early-adopters via les recommandations du réseau français',
      'Mettre en place la facturation belge (même compte Stripe, EUR)',
    ],
  },
  {
    month: 'M4',
    phase: 'Belgium Launch',
    phaseFr: 'Lancement Belgique',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'France + Belgium (live)',
    marketsFr: 'France + Belgique (en production)',
    milestones: [
      'Onboard first 5-10 Belgian practitioners',
      'Run first Belgian practitioner webinar (French language)',
      'Begin LinkedIn outreach to Belgian solo practitioners',
      'Track Belgium-specific metrics separately from France',
    ],
    milestonesFr: [
      'Intégrer les 5-10 premiers praticiens belges',
      'Animer le premier webinaire pour praticiens belges (en français)',
      'Lancer la prospection LinkedIn auprès des praticiens belges indépendants',
      'Suivre les métriques spécifiques à la Belgique séparément de la France',
    ],
  },
  {
    month: 'M5',
    phase: 'Switzerland Prep',
    phaseFr: 'Préparation Suisse',
    phaseColor: 'text-blue-700 bg-blue-50 border-blue-200',
    markets: 'France + Belgium + Switzerland (prep)',
    marketsFr: 'France + Belgique + Suisse (préparation)',
    milestones: [
      'Launch Swiss landing page (Romandie — French-speaking)',
      'CHF billing live on Stripe',
      'Contact FSP (Swiss psychology federation)',
      'Swiss regulatory consultation (nDSG compliance check)',
      'Target: 50+ practitioners total across FR + BE',
    ],
    milestonesFr: [
      'Lancer la page d\'atterrissage suisse (Romandie — francophone)',
      'Facturation en CHF opérationnelle sur Stripe',
      'Contacter la FSP (fédération suisse de psychologie)',
      'Consultation réglementaire suisse (vérification de conformité nLPD)',
      'Objectif : 50+ praticiens au total en FR + BE',
    ],
  },
  {
    month: 'M6',
    phase: 'Switzerland Launch',
    phaseFr: 'Lancement Suisse',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'France + Belgium + Switzerland (live)',
    marketsFr: 'France + Belgique + Suisse (en production)',
    milestones: [
      'Onboard first 5 Swiss practitioners (Romandie)',
      'Premium pricing validated (CHF 29-39)',
      'Milestone: 60+ practitioners, €2K+ MRR across 3 markets',
      'Document multi-market learnings for Series A investor narrative',
    ],
    milestonesFr: [
      'Intégrer les 5 premiers praticiens suisses (Romandie)',
      'Tarification premium validée (CHF 29-39)',
      'Jalon : 60+ praticiens, 2 K€+ MRR sur 3 marchés',
      'Documenter les enseignements multi-marchés pour le récit investisseur Series A',
    ],
  },
  {
    month: 'M7-M8',
    phase: 'German Localization',
    phaseFr: 'Localisation allemande',
    phaseColor: 'text-violet-700 bg-violet-50 border-violet-200',
    markets: 'FR + BE + CH + Germany (prep)',
    marketsFr: 'FR + BE + CH + Allemagne (préparation)',
    milestones: [
      'Begin German (de-DE) localization: UI, AI prompts, help docs',
      'Hire German-speaking community manager (part-time)',
      'DiGA pathway research: engage BfArM consultant',
      'Contact DGPs and BDP (German psychology associations)',
      'Begin clinical evidence collection for DiGA application',
    ],
    milestonesFr: [
      'Lancer la localisation allemande (de-DE) : interface, prompts IA, documentation',
      'Recruter un community manager germanophone (temps partiel)',
      'Recherche sur le parcours DiGA : engager un consultant BfArM',
      'Contacter les DGPs et BDP (associations allemandes de psychologie)',
      'Lancer la collecte de preuves cliniques pour la candidature DiGA',
    ],
  },
  {
    month: 'M9',
    phase: 'Series A + Spain Prep',
    phaseFr: 'Series A + Préparation Espagne',
    phaseColor: 'text-violet-700 bg-violet-50 border-violet-200',
    markets: 'FR + BE + CH + DE (prep) + ES (prep)',
    marketsFr: 'FR + BE + CH + DE (préparation) + ES (préparation)',
    milestones: [
      'Series A conversations active — present multi-market traction',
      'Verify Spanish (es) clinical terminology accuracy',
      'Contact Colegio Oficial de Psicólogos (Spain)',
      'Adjust Spanish pricing tier (€15-22/mo)',
      'Target: 100+ practitioners across French-speaking markets',
    ],
    milestonesFr: [
      'Discussions Series A actives — présenter la traction multi-marchés',
      'Vérifier la précision de la terminologie clinique espagnole (es)',
      'Contacter le Colegio Oficial de Psicólogos (Espagne)',
      'Ajuster le palier tarifaire espagnol (15-22 €/mois)',
      'Objectif : 100+ praticiens sur les marchés francophones',
    ],
  },
  {
    month: 'M10',
    phase: 'Germany + Spain Launch',
    phaseFr: 'Lancement Allemagne + Espagne',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: 'FR + BE + CH + Germany + Spain (live)',
    marketsFr: 'FR + BE + CH + Allemagne + Espagne (en production)',
    milestones: [
      'Germany soft launch: 10 early-adopter practitioners',
      'Spain soft launch: 10 early-adopter practitioners',
      'German localization complete and live',
      'Spanish clinical terminology validated by local advisor',
    ],
    milestonesFr: [
      'Lancement en douceur en Allemagne : 10 praticiens early-adopters',
      'Lancement en douceur en Espagne : 10 praticiens early-adopters',
      'Localisation allemande terminée et en production',
      'Terminologie clinique espagnole validée par un conseiller local',
    ],
  },
  {
    month: 'M11',
    phase: 'Scale & Optimize',
    phaseFr: 'Croissance et optimisation',
    phaseColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    markets: '5 markets live',
    marketsFr: '5 marchés en production',
    milestones: [
      'Per-market churn analysis — identify retention patterns by country',
      'Optimize onboarding for each market based on drop-off data',
      'Launch referral programs localized per market',
      'Target: 150+ practitioners, €5K+ MRR, 5 active markets',
    ],
    milestonesFr: [
      'Analyse du churn par marché — identifier les schémas de rétention par pays',
      'Optimiser l\'onboarding pour chaque marché en fonction des données d\'abandon',
      'Lancer des programmes de parrainage localisés par marché',
      'Objectif : 150+ praticiens, 5 K€+ MRR, 5 marchés actifs',
    ],
  },
  {
    month: 'M12',
    phase: 'Review & Plan',
    phaseFr: 'Bilan et planification',
    phaseColor: 'text-amber-700 bg-amber-50 border-amber-200',
    markets: '5 markets live + UK/NL assessment',
    marketsFr: '5 marchés en production + évaluation UK/NL',
    milestones: [
      'Full market performance review: CAC, LTV, churn, NPS per market',
      'Decision gate: which markets scale, which pause, which exit',
      'UK and Netherlands entry assessment based on Year 1 learnings',
      'DiGA application status review (Germany)',
      'Target: 200+ practitioners, €7K+ MRR, clear Series A narrative',
    ],
    milestonesFr: [
      'Revue complète des performances par marché : CAC, LTV, churn, NPS par marché',
      'Porte de décision : quels marchés accélérer, lesquels suspendre, lesquels quitter',
      'Évaluation de l\'entrée au Royaume-Uni et aux Pays-Bas basée sur les enseignements de l\'Année 1',
      'Revue du statut de la candidature DiGA (Allemagne)',
      'Objectif : 200+ praticiens, 7 K€+ MRR, récit Series A clair',
    ],
  },
]

// ── Investment Requirements ─────────────────────────────────────────────

interface BudgetLine {
  category: string
  categoryFr: string
  amount: string
  percentage: number
  items: string[]
  itemsFr: string[]
}

const BUDGET: BudgetLine[] = [
  {
    category: 'Product Localization',
    categoryFr: 'Localisation produit',
    amount: '€35-50K',
    percentage: 25,
    items: [
      'German localization (UI + AI prompts + docs): €15-20K',
      'Spanish clinical terminology verification: €3-5K',
      'CHF billing + multi-currency infrastructure: €2-3K',
      'Per-market landing pages and SEO setup: €5-8K',
      'Assessment tool localization: €5-8K',
    ],
    itemsFr: [
      'Localisation allemande (interface + prompts IA + docs) : 15-20 K€',
      'Vérification de la terminologie clinique espagnole : 3-5 K€',
      'Facturation CHF + infrastructure multi-devises : 2-3 K€',
      'Pages d\'atterrissage par marché et configuration SEO : 5-8 K€',
      'Localisation des outils d\'évaluation : 5-8 K€',
    ],
  },
  {
    category: 'Go-to-Market',
    categoryFr: 'Go-to-Market',
    amount: '€30-45K',
    percentage: 22,
    items: [
      'LinkedIn outreach campaigns per market: €8-12K',
      'Practitioner association sponsorships (5 markets): €10-15K',
      'Content creation (blog posts, webinars per language): €8-12K',
      'Conference attendance / booths (2-3 EU events): €5-8K',
    ],
    itemsFr: [
      'Campagnes de prospection LinkedIn par marché : 8-12 K€',
      'Sponsoring d\'associations de praticiens (5 marchés) : 10-15 K€',
      'Création de contenu (articles de blog, webinaires par langue) : 8-12 K€',
      'Participation à des conférences / stands (2-3 événements UE) : 5-8 K€',
    ],
  },
  {
    category: 'Team & Talent',
    categoryFr: 'Équipe et recrutement',
    amount: '€40-60K',
    percentage: 30,
    items: [
      'German community manager (part-time, 6 months): €15-20K',
      'Spanish community manager (part-time, 3 months): €8-10K',
      'Clinical advisors per market (3 markets × €3-5K): €9-15K',
      'Regulatory consultants (DiGA + nDSG): €10-15K',
    ],
    itemsFr: [
      'Community manager germanophone (temps partiel, 6 mois) : 15-20 K€',
      'Community manager hispanophone (temps partiel, 3 mois) : 8-10 K€',
      'Conseillers cliniques par marché (3 marchés × 3-5 K€) : 9-15 K€',
      'Consultants réglementaires (DiGA + nLPD) : 10-15 K€',
    ],
  },
  {
    category: 'Legal & Compliance',
    categoryFr: 'Juridique et conformité',
    amount: '€20-30K',
    percentage: 15,
    items: [
      'Multi-market GDPR compliance review: €8-12K',
      'Swiss nDSG compliance assessment: €3-5K',
      'DiGA pre-application consultation: €5-8K',
      'Terms of service localization (5 markets): €4-6K',
    ],
    itemsFr: [
      'Revue de conformité RGPD multi-marchés : 8-12 K€',
      'Évaluation de conformité nLPD suisse : 3-5 K€',
      'Consultation pré-candidature DiGA : 5-8 K€',
      'Localisation des conditions d\'utilisation (5 marchés) : 4-6 K€',
    ],
  },
  {
    category: 'Infrastructure & Operations',
    categoryFr: 'Infrastructure et opérations',
    amount: '€10-15K',
    percentage: 8,
    items: [
      'Multi-region hosting optimization: €3-5K',
      'Payment provider setup (Stripe multi-currency): €2-3K',
      'Analytics and per-market dashboards: €3-4K',
      'Customer support tooling (multi-language): €2-3K',
    ],
    itemsFr: [
      'Optimisation de l\'hébergement multi-régions : 3-5 K€',
      'Configuration du fournisseur de paiement (Stripe multi-devises) : 2-3 K€',
      'Analytique et tableaux de bord par marché : 3-4 K€',
      'Outils de support client (multilingue) : 2-3 K€',
    ],
  },
]

const TOTAL_BUDGET = '€135-200K'

// ── Success Metrics ─────────────────────────────────────────────────────

interface KPI {
  metric: string
  metricFr: string
  sixMonth: string
  sixMonthFr?: string
  twelveMonth: string
  twelveMonthFr?: string
  measurement: string
  measurementFr: string
}

const KPIS: KPI[] = [
  { metric: 'Total Practitioners', metricFr: 'Total praticiens', sixMonth: '60+', twelveMonth: '200+', measurement: 'Active paying subscriptions across all markets', measurementFr: 'Abonnements payants actifs sur tous les marchés' },
  { metric: 'Markets Live', metricFr: 'Marchés en production', sixMonth: '3 (FR, BE, CH)', twelveMonth: '5 (+ DE, ES)', measurement: 'Markets with >5 paying practitioners', measurementFr: 'Marchés avec >5 praticiens payants' },
  { metric: 'Monthly Recurring Revenue', metricFr: 'Revenu mensuel récurrent', sixMonth: '€2K+', twelveMonth: '€7K+', measurement: 'Total MRR across all markets', measurementFr: 'MRR total sur tous les marchés' },
  { metric: 'Blended CAC', metricFr: 'CAC consolidé', sixMonth: '<€60', twelveMonth: '<€75', measurement: 'Total GTM spend / new practitioners acquired', measurementFr: 'Dépenses GTM totales / nouveaux praticiens acquis' },
  { metric: 'Per-Market Churn', metricFr: 'Churn par marché', sixMonth: '<6%', twelveMonth: '<5%', measurement: 'Monthly churn rate per market (not blended)', measurementFr: 'Taux de churn mensuel par marché (non consolidé)' },
  { metric: 'NPS by Market', metricFr: 'NPS par marché', sixMonth: '>35', twelveMonth: '>40', measurement: 'Net Promoter Score per market (quarterly survey)', measurementFr: 'Net Promoter Score par marché (enquête trimestrielle)' },
  { metric: 'Activation Rate', metricFr: 'Taux d\'activation', sixMonth: '>50%', twelveMonth: '>60%', measurement: '% of new signups generating first AI note within 7 days', measurementFr: '% des nouvelles inscriptions générant une première note IA sous 7 jours' },
  { metric: 'Member Engagement', metricFr: 'Engagement des patients', sixMonth: '>40%', twelveMonth: '>50%', measurement: '% of invited members completing 1+ between-session activity', measurementFr: '% des patients invités complétant 1+ activité inter-séance' },
  { metric: 'Referral Rate', metricFr: 'Taux de parrainage', sixMonth: '>15%', twelveMonth: '>25%', measurement: '% of new practitioners from existing user referrals', measurementFr: '% des nouveaux praticiens issus du parrainage d\'utilisateurs existants' },
  { metric: 'Revenue per Market', metricFr: 'Revenu par marché', sixMonth: 'FR: €1.5K, BE/CH: €250 each', sixMonthFr: 'FR : 1,5 K€, BE/CH : 250 € chacun', twelveMonth: 'FR: €4K, DE: €1K, ES: €500, BE/CH: €750 each', twelveMonthFr: 'FR : 4 K€, DE : 1 K€, ES : 500 €, BE/CH : 750 € chacun', measurement: 'MRR per market — track concentration risk', measurementFr: 'MRR par marché — suivre le risque de concentration' },
]

// ── Page ─────────────────────────────────────────────────────────────────

export default function MarketEntryPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Market Entry Analysis', 'Analyse d\'entrée sur les marchés')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — European & Global Expansion Strategy, Q1 2026', 'Bloomsline Care — Stratégie d\'expansion européenne et mondiale, T1 2026')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '🇫🇷 Français' : '🇬🇧 English'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-14">

        {/* ── 1. Hero ─────────────────────────────────────────── */}
        <motion.section {...fadeUp()}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('10 markets scored. 5 entry modes evaluated. One playbook.', '10 marchés évalués. 5 modes d\'entrée analysés. Un seul playbook.')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            {t(
              'Bloomsline\'s B2B2C architecture and existing i18n framework (en/fr/es) make multi-market expansion structurally efficient — each new market reuses 80-90% of the platform. This analysis scores 10 target markets on 6 weighted factors, evaluates 5 entry modes, maps localization requirements per country, and delivers a 12-month roadmap from France to 5 live European markets.',
              'L\'architecture B2B2C de Bloomsline et le framework i18n existant (en/fr/es) rendent l\'expansion multi-marchés structurellement efficace — chaque nouveau marché réutilise 80-90 % de la plateforme. Cette analyse évalue 10 marchés cibles sur 6 facteurs pondérés, analyse 5 modes d\'entrée, cartographie les exigences de localisation par pays et propose une feuille de route sur 12 mois de la France à 5 marchés européens en production.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{t('France: home market (active)', 'France : marché principal (actif)')}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{t('Phase 2: Belgium + Switzerland', 'Phase 2 : Belgique + Suisse')}</span>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{t('Phase 3: Germany + Spain + UK', 'Phase 3 : Allemagne + Espagne + UK')}</span>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{t('Phase 4: US + Canada + Italy', 'Phase 4 : États-Unis + Canada + Italie')}</span>
          </div>

          {/* Business context summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: t('Global TAM', 'TAM mondial'), value: t('$33B', '33 Md$'), sub: t('18.6% CAGR → $88B by 2030', '18,6 % TCAC → 88 Md$ d\'ici 2030') },
              { label: t('EU SOM', 'SOM UE'), value: t('€166M', '166 M€'), sub: t('22.7% CAGR → $500M by 2030', '22,7 % TCAC → 500 M$ d\'ici 2030') },
              { label: t('EU Practitioners', 'Praticiens UE'), value: '400 K+', sub: t('Psychologists + counselors', 'Psychologues + conseillers') },
              { label: t('Current Pricing', 'Tarification actuelle'), value: t('€19-49/mo', '19-49 €/mois'), sub: t('85% gross margin, €50 CAC', '85 % de marge brute, 50 € CAC') },
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{stat.value}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── 2. Market Attractiveness Scoring ────────────────── */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('10 markets scored on 6 weighted factors — sorted by weighted total', '10 marchés évalués sur 6 facteurs pondérés — classés par score pondéré')}>
            {t('Market Attractiveness Scoring', 'Évaluation de l\'attractivité des marchés')}
          </SectionTitle>

          {/* Factor weights legend */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            {FACTOR_LABELS.map((f) => (
              <div key={f.key} className="flex items-center gap-1">
                <span className="text-[9px] font-semibold text-gray-500">{lang === 'fr' ? f.labelFr : f.label}</span>
                <span className="text-[8px] text-gray-400">({f.weight})</span>
              </div>
            ))}
          </div>

          {/* Market cards */}
          <div className="space-y-3">
            {MARKETS.map((market, i) => (
              <motion.div
                key={market.country}
                className="bg-white border border-gray-200 rounded-xl p-5"
                {...fadeUp(0.07 + i * 0.03)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{market.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{lang === 'fr' ? market.countryFr : market.country}</h4>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${market.phaseColor}`}>
                          {lang === 'fr' ? market.phaseFr : market.phase}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">{lang === 'fr' ? market.regionFr : market.region} — {lang === 'fr' ? market.practitionersFr : market.practitioners}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${
                      market.weightedTotal >= 7.5 ? 'text-emerald-600' :
                      market.weightedTotal >= 6.5 ? 'text-blue-600' :
                      market.weightedTotal >= 5.5 ? 'text-amber-600' :
                      'text-gray-600'
                    }`}>
                      {market.weightedTotal}
                    </p>
                    <p className="text-[9px] text-gray-400">/ 10</p>
                  </div>
                </div>

                {/* Score bars */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-4">
                  {FACTOR_LABELS.map((f) => (
                    <div key={f.key}>
                      <p className="text-[9px] text-gray-400 mb-0.5">{lang === 'fr' ? f.labelFr : f.label}</p>
                      <ScoreBar
                        value={market[f.key]}
                        color={
                          market[f.key] >= 8 ? 'bg-emerald-500' :
                          market[f.key] >= 6 ? 'bg-blue-500' :
                          market[f.key] >= 4 ? 'bg-amber-500' :
                          'bg-red-500'
                        }
                      />
                    </div>
                  ))}
                </div>

                {/* Insight + value */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 leading-relaxed">{lang === 'fr' ? market.keyInsightFr : market.keyInsight}</p>
                  </div>
                  <div className="shrink-0 bg-gray-50 rounded-lg px-3 py-1.5 text-right">
                    <p className="text-[9px] text-gray-400">{t('Market Value', 'Valeur du marché')}</p>
                    <p className="text-[10px] font-bold text-gray-700">{lang === 'fr' ? market.marketValueFr : market.marketValue}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 3. Entry Mode Analysis ──────────────────────────── */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={t('5 entry modes evaluated — pros, cons, cost, and timeline for each', '5 modes d\'entrée évalués — avantages, inconvénients, coût et calendrier pour chacun')}>
            {t('Entry Mode Analysis', 'Analyse des modes d\'entrée')}
          </SectionTitle>

          <div className="space-y-4">
            {ENTRY_MODES.map((mode, i) => {
              const ModeIcon = mode.icon
              return (
                <motion.div
                  key={mode.name}
                  className={`bg-white border ${mode.recommended ? mode.borderColor : 'border-gray-200'} rounded-xl p-5`}
                  {...fadeUp(0.37 + i * 0.04)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${mode.bgColor} flex items-center justify-center`}>
                        <ModeIcon className={`w-4 h-4 ${mode.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{lang === 'fr' ? mode.nameFr : mode.name}</h4>
                          {mode.recommended && (
                            <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {t('RECOMMENDED', 'RECOMMANDÉ')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">{lang === 'fr' ? mode.recommendedForFr : mode.recommendedFor}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{lang === 'fr' ? mode.descriptionFr : mode.description}</p>

                  {/* Cost + Timeline badges */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-700">{lang === 'fr' ? mode.costFr : mode.cost}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-semibold text-gray-700">{lang === 'fr' ? mode.timelineFr : mode.timeline}</span>
                    </div>
                  </div>

                  {/* Pros + Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5">{t('Advantages', 'Avantages')}</p>
                      <div className="space-y-1">
                        {(lang === 'fr' ? mode.prosFr : mode.pros).map((p, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-emerald-700">{p}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5">{t('Challenges', 'Défis')}</p>
                      <div className="space-y-1">
                        {(lang === 'fr' ? mode.consFr : mode.cons).map((c, j) => (
                          <div key={j} className="flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-700">{c}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Best for */}
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                    <p className="text-[10px] text-blue-700">
                      <span className="font-semibold">{t('Best for:', 'Idéal pour :')}</span> {lang === 'fr' ? mode.bestForFr : mode.bestFor}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Recommendation summary */}
          <motion.div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mt-4" {...fadeUp(0.55)}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-indigo-800">{t('Recommended Approach: Digital-First + Partnership Hybrid', 'Approche recommandée : Numérique d\'abord + Partenariat hybride')}</h4>
            </div>
            <p className="text-[10px] text-indigo-700 leading-relaxed">
              {t(
                'Enter every market digital-first (4-8 weeks, €5-15K) to test demand. Layer partnership with local training institutes and professional associations for distribution. Only escalate to direct entry for markets that demonstrate strong PMF (Germany/DiGA pathway) or require local entity (US/HIPAA). This approach keeps total Year 1 expansion investment under €200K while testing 5 markets and preserving optionality to exit any market with near-zero sunk cost.',
                'Entrer sur chaque marché en numérique d\'abord (4-8 semaines, 5-15 K€) pour tester la demande. Ajouter des partenariats avec des instituts de formation locaux et des associations professionnelles pour la distribution. Ne passer à l\'entrée directe que pour les marchés démontrant un fort PMF (Allemagne/parcours DiGA) ou nécessitant une entité locale (États-Unis/HIPAA). Cette approche maintient l\'investissement total d\'expansion Année 1 sous 200 K€ tout en testant 5 marchés et en conservant la possibilité de sortir de tout marché à coût quasi nul.'
              )}
            </p>
          </motion.div>
        </motion.section>

        {/* ── 4. Localization Requirements ────────────────────── */}
        <motion.section {...fadeUp(0.6)}>
          <SectionTitle subtitle={t('Product, pricing, cultural, legal, and talent needs per market', 'Besoins produit, tarification, culture, juridique et recrutement par marché')}>
            {t('Localization Requirements', 'Exigences de localisation')}
          </SectionTitle>

          <div className="space-y-4">
            {LOCALIZATIONS.map((loc, i) => (
              <motion.div
                key={loc.market}
                className="bg-white border border-gray-200 rounded-xl p-5"
                {...fadeUp(0.62 + i * 0.03)}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-lg">{loc.flag}</span>
                  <h4 className="text-sm font-bold text-gray-900">{lang === 'fr' ? loc.marketFr : loc.market}</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Product */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Laptop className="w-3 h-3" /> {t('Product Adaptations', 'Adaptations produit')}
                    </p>
                    <div className="space-y-1">
                      {(lang === 'fr' ? loc.productFr : loc.product).map((p, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-700">{p}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal */}
                  <div className="bg-violet-50 border border-violet-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-violet-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> {t('Legal & Compliance', 'Juridique et conformité')}
                    </p>
                    <div className="space-y-1">
                      {(lang === 'fr' ? loc.legalFr : loc.legal).map((l, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-violet-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-violet-700">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cultural */}
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t('Cultural Considerations', 'Considérations culturelles')}
                    </p>
                    <div className="space-y-1">
                      {(lang === 'fr' ? loc.culturalFr : loc.cultural).map((c, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-amber-700">{c}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Talent */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Target className="w-3 h-3" /> {t('Talent & Operations', 'Recrutement et opérations')}
                    </p>
                    <div className="space-y-1">
                      {(lang === 'fr' ? loc.talentFr : loc.talent).map((item, j) => (
                        <div key={j} className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-emerald-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-lg p-2.5 flex items-start gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-600">
                    <span className="font-semibold">{t('Pricing:', 'Tarification :')}</span> {lang === 'fr' ? loc.pricingFr : loc.pricing}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 5. 12-Month Entry Roadmap ───────────────────────── */}
        <motion.section {...fadeUp(0.8)}>
          <SectionTitle subtitle={t('Month-by-month milestones from France beachhead to 5 live markets', 'Jalons mois par mois de la base française à 5 marchés en production')}>
            {t('12-Month Entry Roadmap', 'Feuille de route d\'entrée sur 12 mois')}
          </SectionTitle>

          <div className="space-y-3">
            {ROADMAP.map((month, i) => (
              <motion.div
                key={month.month}
                className="bg-white border border-gray-200 rounded-xl p-4"
                {...fadeUp(0.82 + i * 0.025)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${month.phaseColor}`}>
                    {month.month}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{lang === 'fr' ? month.phaseFr : month.phase}</h4>
                    <p className="text-[9px] text-gray-400">{lang === 'fr' ? month.marketsFr : month.markets}</p>
                  </div>
                </div>
                <div className="space-y-1.5 pl-1">
                  {(lang === 'fr' ? month.milestonesFr : month.milestones).map((m, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-600">{m}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── 6. Investment Requirements ──────────────────────── */}
        <motion.section {...fadeUp(1.05)}>
          <SectionTitle subtitle={t('Budget estimate for Year 1 multi-market expansion', 'Estimation du budget pour l\'expansion multi-marchés Année 1')}>
            {t('Investment Requirements', 'Besoins d\'investissement')}
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            {/* Total */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-900">{t('Total Year 1 Expansion Budget', 'Budget total d\'expansion Année 1')}</p>
                <p className="text-[10px] text-gray-400">{t('5 markets (FR deepening + BE + CH + DE + ES)', '5 marchés (approfondissement FR + BE + CH + DE + ES)')}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{t(TOTAL_BUDGET, '135-200 K€')}</p>
                <p className="text-[9px] text-gray-400">{t('from seed raise (€300-500K)', 'sur la levée d\'amorçage (300-500 K€)')}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-4">
              {BUDGET.map((line, i) => (
                <motion.div key={line.category} {...fadeUp(1.07 + i * 0.03)}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800">{lang === 'fr' ? line.categoryFr : line.category}</span>
                      <span className="text-[9px] text-gray-400">({line.percentage}%)</span>
                    </div>
                    <span className="text-xs font-bold text-gray-700">{line.amount}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full ${
                        line.percentage >= 25 ? 'bg-blue-500' :
                        line.percentage >= 20 ? 'bg-emerald-500' :
                        line.percentage >= 15 ? 'bg-violet-500' :
                        'bg-amber-500'
                      }`}
                      style={{ width: `${line.percentage * 3.33}%` }}
                    />
                  </div>
                  <div className="pl-3 space-y-0.5">
                    {(lang === 'fr' ? line.itemsFr : line.items).map((item, j) => (
                      <p key={j} className="text-[9px] text-gray-400">{item}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Funding source note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[10px] text-blue-700 leading-relaxed">
              <span className="font-semibold">{t('Funding allocation:', 'Allocation du financement :')}</span> {t(
                'Expansion budget represents 35-50% of seed raise (€300-500K). Remaining funds cover core product development (40%), France GTM (25%), team salaries (20%), and operations (10%). Non-dilutive funding sources can reduce pressure: Bpifrance Bourse French Tech (€30K), EU EIC Accelerator (up to €2.5M), Horizon Europe mental health grants. Total expansion cost per market averages €27-40K — among the lowest in health-tech due to the digital-first entry model and existing multi-language infrastructure.',
                'Le budget d\'expansion représente 35-50 % de la levée d\'amorçage (300-500 K€). Les fonds restants couvrent le développement produit (40 %), le GTM France (25 %), les salaires (20 %) et les opérations (10 %). Les financements non dilutifs peuvent réduire la pression : Bpifrance Bourse French Tech (30 K€), EU EIC Accelerator (jusqu\'à 2,5 M€), subventions Horizon Europe pour la santé mentale. Le coût moyen d\'expansion par marché est de 27-40 K€ — parmi les plus bas en santé numérique grâce au modèle d\'entrée numérique et à l\'infrastructure multilingue existante.'
              )}
            </p>
          </div>
        </motion.section>

        {/* ── 7. Success Metrics ──────────────────────────────── */}
        <motion.section {...fadeUp(1.2)}>
          <SectionTitle subtitle={t('KPIs for first 6 months and first 12 months of expansion', 'KPIs pour les 6 premiers mois et les 12 premiers mois d\'expansion')}>
            {t('Success Metrics', 'Indicateurs de succès')}
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{t('Metric', 'Indicateur')}</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">{t('6 Month Target', 'Objectif à 6 mois')}</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider text-center">{t('12 Month Target', 'Objectif à 12 mois')}</th>
                    <th className="px-4 py-2.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{t('Measurement', 'Mesure')}</th>
                  </tr>
                </thead>
                <tbody>
                  {KPIS.map((kpi, i) => (
                    <tr key={kpi.metric} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-2.5 text-[10px] font-semibold text-gray-700">{lang === 'fr' ? kpi.metricFr : kpi.metric}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-blue-600 text-center">{lang === 'fr' && kpi.sixMonthFr ? kpi.sixMonthFr : kpi.sixMonth}</td>
                      <td className="px-4 py-2.5 text-[10px] font-bold text-emerald-600 text-center">{lang === 'fr' && kpi.twelveMonthFr ? kpi.twelveMonthFr : kpi.twelveMonth}</td>
                      <td className="px-4 py-2.5 text-[9px] text-gray-500">{lang === 'fr' ? kpi.measurementFr : kpi.measurement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision gates */}
          <motion.div className="mt-4 space-y-3" {...fadeUp(1.25)}>
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              {t('Decision Gates', 'Portes de décision')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">{t('Scale', 'Accélérer')}</p>
                <p className="text-[10px] text-emerald-700">{t('>20 practitioners, <5% churn, NPS >40 → increase investment, hire local team', '>20 praticiens, <5 % churn, NPS >40 → augmenter l\'investissement, recruter une équipe locale')}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider mb-1">{t('Hold', 'Maintenir')}</p>
                <p className="text-[10px] text-amber-700">{t('10-20 practitioners, 5-8% churn → maintain presence, optimize before scaling', '10-20 praticiens, 5-8 % churn → maintenir la présence, optimiser avant d\'accélérer')}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-[9px] font-semibold text-red-700 uppercase tracking-wider mb-1">{t('Exit', 'Sortir')}</p>
                <p className="text-[10px] text-red-700">{t('<10 practitioners after 6 months, >8% churn → pause market, reallocate budget', '<10 praticiens après 6 mois, >8 % churn → suspendre le marché, réallouer le budget')}</p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* ── 8. Key Takeaways ────────────────────────────────── */}
        <motion.section {...fadeUp(1.3)}>
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold">{t('Strategic Synthesis', 'Synthèse stratégique')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-2.5">{t('Structural Advantages', 'Avantages structurels')}</p>
                <div className="space-y-2">
                  {(lang === 'fr' ? [
                    'L\'architecture B2B2C s\'adapte à tout marché — 1 vente praticien = 12-15 patients gratuits',
                    'L\'i18n existant (en/fr/es) couvre 60 % de la population de l\'UE avec un effort minimal',
                    'L\'entrée numérique coûte 5-15 K€ par marché — entièrement réversible',
                    'La conformité réglementaire UE (RGPD, AI Act) se transfère à l\'ensemble des 27 États membres',
                    'Zéro concurrent direct dans la catégorie soins inter-séances en UE',
                  ] : [
                    'B2B2C architecture scales to any market — 1 practitioner sale = 12-15 free members',
                    'Existing i18n (en/fr/es) covers 60% of EU population with minimal effort',
                    'Digital-first entry costs €5-15K per market — fully reversible',
                    'EU regulatory compliance (GDPR, AI Act) transfers across all 27 member states',
                    'Zero direct competitors in EU between-session care category',
                  ]).map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-red-300 uppercase tracking-wider mb-2.5">{t('Key Constraints', 'Contraintes clés')}</p>
                <div className="space-y-2">
                  {(lang === 'fr' ? [
                    'Une équipe de deux personnes ne peut pas s\'étendre et développer le produit simultanément — la séquence compte',
                    'Le PMF en France doit être prouvé avant toute expansion (30+ praticiens, <5 % churn)',
                    'Le parcours DiGA en Allemagne exige des preuves cliniques que Bloomsline n\'a pas encore',
                    'L\'entrée aux États-Unis nécessite un développement HIPAA + 200 K€+ d\'investissement — non viable avant la Series A',
                    'Chaque nouvelle langue ajoute de la complexité en ingénierie de prompts IA et en coûts de QA',
                  ] : [
                    'Two-person team cannot expand and build product simultaneously — sequence matters',
                    'France PMF must be proven before any expansion (30+ practitioners, <5% churn)',
                    'German DiGA pathway requires clinical evidence Bloomsline doesn\'t yet have',
                    'US entry requires HIPAA build + $200K+ investment — not viable before Series A',
                    'Each new language adds AI prompt engineering complexity and QA cost',
                  ]).map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs font-semibold text-white mb-2">{t('The Expansion Thesis', 'La thèse d\'expansion')}</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {lang === 'fr' ? (
                  <>
                    L&apos;avantage d&apos;expansion de Bloomsline est structurel, pas tactique. Le modèle B2B2C signifie que chaque entrée sur un nouveau marché est efficiente en capital (5-15 K€ pour tester, 27-40 K€ pour croître). Le fossé réglementaire se renforce à chaque marché de l&apos;UE conquis. Le playbook est simple : <span className="text-white font-semibold">gagner la France d&apos;abord, s&apos;étendre aux marchés francophones à coût quasi nul, puis utiliser des indicateurs unitaires prouvés pour justifier un financement Series A pour l&apos;Allemagne, l&apos;Espagne et le Royaume-Uni.</span> Les États-Unis sont une ambition Phase 4 — pas une distraction. Le chemin vers 200+ praticiens sur 5 marchés européens en 12 mois est réalisable avec le seul financement d&apos;amorçage.
                  </>
                ) : (
                  <>
                    Bloomsline&apos;s expansion advantage is structural, not tactical. The B2B2C model means every new market entry is
                    capital-efficient (€5-15K to test, €27-40K to scale). The regulatory moat deepens with each EU market entered.
                    The playbook is simple: <span className="text-white font-semibold">win France first, expand to French-speaking markets at near-zero cost,
                    then use proven unit economics to justify Series A funding for Germany, Spain, and the UK.</span> The US
                    is a Phase 4 ambition — not a distraction. The path to 200+ practitioners across 5 European markets in 12 months
                    is achievable with seed funding alone.
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <motion.div {...fadeUp(1.35)} className="text-center pt-4 pb-8">
          <p className="text-[10px] text-gray-400">
            {t('Analysis as of Feb 2026 — Bloomsline Care', 'Analyse en date de février 2026 — Bloomsline Care')}
          </p>
        </motion.div>
      </main>
    </div>
  )
}

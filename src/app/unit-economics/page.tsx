'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Clock,
  Zap,
  ChevronRight,
  Flame,
  Shield,
  PieChart,
  Layers,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────

type TFunc = (en: string, fr: string) => string

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

const SectionTitle = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-gray-900">{children}</h2>
    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
)

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 1. UNIT ECONOMICS — CAC BY CHANNEL
// ══════════════════════════════════════════════════════════════════════════

interface ChannelCAC {
  channel: string
  cac: string
  cacNum: number
  volume: string
  timeline: string
  quality: string
  ltv: string
  ltvCacRatio: string
}

function getChannelCAC(t: TFunc): ChannelCAC[] {
  return [
    {
      channel: t('Founder LinkedIn outreach', 'Prospection LinkedIn du fondateur'),
      cac: '€35-50',
      cacNum: 42,
      volume: t('50+ conversations/week', '50+ conversations/semaine'),
      timeline: t('Pre-launch → M6', 'Pré-lancement → M6'),
      quality: t('High (personal relationship, high intent)', 'Élevée (relation personnelle, forte intention)'),
      ltv: '€3,625',
      ltvCacRatio: '86x',
    },
    {
      channel: t('Referral program', 'Programme de parrainage'),
      cac: t('€29 (1 month free)', '€29 (1 mois offert)'),
      cacNum: 29,
      volume: t('5-15 referrals/month at scale', '5-15 parrainages/mois à grande échelle'),
      timeline: t('M3 → ongoing', 'M3 → continu'),
      quality: t('Highest (16-25% higher LTV, lower churn)', 'Maximale (LTV 16-25% supérieure, attrition plus faible)'),
      ltv: t('€4,350 (est. +20%)', '€4 350 (est. +20%)'),
      ltvCacRatio: '150x',
    },
    {
      channel: t('French SEO / content', 'SEO / contenu francophone'),
      cac: '€15-25',
      cacNum: 20,
      volume: t('Scales with content volume', 'Évolue avec le volume de contenu'),
      timeline: t('M3-M6 (compounds)', 'M3-M6 (effet cumulé)'),
      quality: t('High (self-selected, problem-aware)', 'Élevée (auto-sélection, connaissance du besoin)'),
      ltv: '€3,625',
      ltvCacRatio: '181x',
    },
    {
      channel: t('Events & conferences', 'Événements et conférences'),
      cac: '€60-100',
      cacNum: 80,
      volume: t('10-20 leads/event', '10-20 prospects/événement'),
      timeline: 'M3 → M18',
      quality: t('Very high (face-to-face, trust-based)', 'Très élevée (en présentiel, basée sur la confiance)'),
      ltv: '€3,625',
      ltvCacRatio: '45x',
    },
    {
      channel: t('Training institute partnerships', 'Partenariats avec les instituts de formation'),
      cac: t('€0 (free accounts)', '€0 (comptes gratuits)'),
      cacNum: 0,
      volume: t('50-100 graduates/year', '50-100 diplômés/an'),
      timeline: 'M6 → M18',
      quality: t('Medium (newly certified, habit formation)', 'Moyenne (nouvellement certifiés, création d\'habitudes)'),
      ltv: t('€2,900 (est. 80% of avg)', '€2 900 (est. 80% de la moy.)'),
      ltvCacRatio: t('∞ (no CAC)', '∞ (pas de CAC)'),
    },
    {
      channel: t('Podcast guest appearances', 'Passages en podcast'),
      cac: '€0',
      cacNum: 0,
      volume: t('2-5 signups per episode', '2-5 inscriptions par épisode'),
      timeline: t('M6 → ongoing', 'M6 → continu'),
      quality: t('High (authority-driven)', 'Élevée (basée sur l\'autorité)'),
      ltv: '€3,625',
      ltvCacRatio: t('∞ (no CAC)', '∞ (pas de CAC)'),
    },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 2. LTV CALCULATION
// ══════════════════════════════════════════════════════════════════════════

interface LTVComponent {
  label: string
  formula: string
  value: string
  assumption: string
}

function getLTVCalc(t: TFunc): LTVComponent[] {
  return [
    { label: t('ARPU (monthly, modeled)', 'ARPU (mensuel, modélisé)'), formula: t('Blended average of tier mix', 'Moyenne pondérée des offres'), value: '~€24.00/mo', assumption: t('40% Essentiel (€19) + 50% Pro (€29) + 10% Cabinet (~€29/head). Tier mix is projected, not observed — weighted toward lower tiers until PMF.', '40% Essentiel (19€) + 50% Pro (29€) + 10% Cabinet (~29€/tête). La répartition est projetée, non observée — pondérée vers les offres basses avant le PMF.') },
    { label: t('Gross margin (modeled)', 'Marge brute (modélisée)'), formula: t('(Revenue - Variable Cost) / Revenue', '(Revenu - Coût variable) / Revenu'), value: '~82%', assumption: t('Variable cost €4.25/practitioner/mo (AI €1.80 + infra €0.95 + support €1.50). Against blended ARPU of ~€24.', 'Coût variable 4,25€/praticien/mois (IA 1,80€ + infra 0,95€ + support 1,50€). Contre un ARPU pondéré de ~24€.') },
    { label: t('Monthly churn rate', 'Taux d\'attrition mensuel'), formula: t('Churned customers / Start-of-month customers', 'Clients perdus / Clients en début de mois'), value: '5%', assumption: t('SaaS benchmark 2-10%. Starting at 5% (new product, unproven PMF). Expected to improve to 3-4% as product matures and care relationships lock in.', 'Référence SaaS 2-10%. Démarrage à 5% (produit nouveau, PMF non prouvé). Attendu à 3-4% à mesure que le produit mûrit et les relations de soin se renforcent.') },
    { label: t('Average lifetime', 'Durée de vie moyenne'), formula: t('1 / Monthly churn rate', '1 / Taux d\'attrition mensuel'), value: t('20 months', '20 mois'), assumption: t('At 5% churn. If churn improves to 4%: 25 months. At 7% (stress): 14 months.', 'À 5% d\'attrition. Si l\'attrition descend à 4% : 25 mois. À 7% (stress) : 14 mois.') },
    { label: t('Lifetime Value (LTV)', 'Valeur vie client (LTV)'), formula: t('ARPU × Lifetime × Gross margin', 'ARPU × Durée de vie × Marge brute'), value: '~€394', assumption: t('€24 × 20 × 0.82 = €394. Conservative estimate. Improves significantly if churn drops or ARPU rises via upsell.', '24€ × 20 × 0,82 = 394€. Estimation conservatrice. S\'améliore significativement si l\'attrition baisse ou l\'ARPU monte via upsell.') },
    { label: t('B2C upside per practitioner', 'Potentiel B2C par praticien'), formula: t('Members × conversion % × premium price × lifetime', 'Membres × taux de conversion × prix premium × durée de vie'), value: '+€24', assumption: t('10 members × 4% × €3/mo × 20 months. Not included in core LTV — this is upside.', '10 membres × 4% × 3€/mois × 20 mois. Non inclus dans la LTV de base — c\'est du bonus.') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 3. GROSS MARGIN & CONTRIBUTION MARGIN
// ══════════════════════════════════════════════════════════════════════════

interface MarginLine {
  item: string
  perPractitioner: string
  percent: string
  note: string
  isTotal?: boolean
  isHeader?: boolean
}

function getMarginWaterfall(t: TFunc): MarginLine[] {
  return [
    { item: t('Revenue', 'Revenu'), perPractitioner: '€24.00', percent: '100%', note: t('Blended ARPU (40% Essentiel + 50% Pro + 10% Cabinet)', 'ARPU pondéré (40% Essentiel + 50% Pro + 10% Cabinet)'), isHeader: true },
    { item: 'Claude Haiku API', perPractitioner: '-€1.80', percent: '6.2%', note: t('$1/MTok in, $5/MTok out. ~3K tokens/interaction, ~20 interactions/practitioner/mo.', '1$/MTok entrée, 5$/MTok sortie. ~3K tokens/interaction, ~20 interactions/praticien/mois.') },
    { item: 'Supabase (DB + auth)', perPractitioner: '-€0.50', percent: '1.7%', note: t('Supabase Pro plan shared across practitioners. Scales sub-linearly with users.', 'Plan Pro Supabase partagé entre les praticiens. Croissance sous-linéaire avec les utilisateurs.') },
    { item: 'Hosting (Vercel EU)', perPractitioner: '-€0.30', percent: '1.0%', note: t('Next.js on Vercel. EU region for GDPR. Generous free tier initially.', 'Next.js sur Vercel. Région UE pour le RGPD. Offre gratuite généreuse au départ.') },
    { item: 'PostHog analytics', perPractitioner: '-€0.10', percent: '0.3%', note: t('EU-hosted. Free tier covers first 1M events/month.', 'Hébergé en UE. L\'offre gratuite couvre 1M d\'événements/mois.') },
    { item: t('Email / notifications', 'E-mail / notifications'), perPractitioner: '-€0.05', percent: '0.2%', note: t('Transactional emails, push notifications.', 'E-mails transactionnels, notifications push.') },
    { item: t('Support & onboarding', 'Support et onboarding'), perPractitioner: '-€1.50', percent: '5.2%', note: t('White-glove onboarding amortized. Drops to €0.50 at scale.', 'Onboarding personnalisé amorti. Tombe à 0,50€ à grande échelle.') },
    { item: t('Gross Profit', 'Marge brute'), perPractitioner: '€19.75', percent: '82.3%', note: t('Variable cost: €4.25/practitioner/mo', 'Coût variable : 4,25€/praticien/mois'), isTotal: true },
    { item: t('CAC amortized (over 20-mo lifetime)', 'CAC amorti (sur 20 mois de durée de vie)'), perPractitioner: '-€7.00', percent: '29.2%', note: t('€140 CAC / 20 months = €7.00/mo fully-loaded (includes founder time)', '140€ de CAC / 20 mois = 7,00€/mois en charge complète (inclut le temps fondateur)') },
    { item: t('Contribution Margin', 'Marge de contribution'), perPractitioner: '€12.75', percent: '53.1%', note: t('After both COGS and amortized acquisition. Healthy for pre-seed SaaS.', 'Après coût des ventes et acquisition amortie. Sain pour un SaaS pré-seed.'), isTotal: true },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 4. 3-YEAR FINANCIAL PROJECTION
// ══════════════════════════════════════════════════════════════════════════

interface ProjectionRow {
  period: string
  practitioners: number
  members: number
  mrr: number
  arr: number
  revenue: number
  variableCosts: number
  grossProfit: number
  fixedCosts: number
  cacSpend: number
  netBurn: number
  cumulativeCash: number
  highlight?: boolean
}

// Base case (modeled): €29 ARPU, 30% initial → 7% mature growth, 4% churn, €450K starting cash (mid-point of €400-500K raise)
const YEAR1_MONTHLY: ProjectionRow[] = [
  { period: 'M1', practitioners: 10, members: 120, mrr: 290, arr: 3480, revenue: 290, variableCosts: 43, grossProfit: 247, fixedCosts: 8600, cacSpend: 150, netBurn: -8503, cumulativeCash: 291497 },
  { period: 'M2', practitioners: 13, members: 156, mrr: 377, arr: 4524, revenue: 377, variableCosts: 55, grossProfit: 322, fixedCosts: 8600, cacSpend: 195, netBurn: -8473, cumulativeCash: 283024 },
  { period: 'M3', practitioners: 16, members: 192, mrr: 464, arr: 5568, revenue: 464, variableCosts: 68, grossProfit: 396, fixedCosts: 8600, cacSpend: 240, netBurn: -8444, cumulativeCash: 274580, highlight: true },
  { period: 'M4', practitioners: 20, members: 240, mrr: 580, arr: 6960, revenue: 580, variableCosts: 85, grossProfit: 495, fixedCosts: 8600, cacSpend: 300, netBurn: -8405, cumulativeCash: 266175 },
  { period: 'M5', practitioners: 25, members: 300, mrr: 725, arr: 8700, revenue: 725, variableCosts: 106, grossProfit: 619, fixedCosts: 8600, cacSpend: 375, netBurn: -8356, cumulativeCash: 257819 },
  { period: 'M6', practitioners: 32, members: 384, mrr: 928, arr: 11136, revenue: 928, variableCosts: 136, grossProfit: 792, fixedCosts: 8600, cacSpend: 480, netBurn: -8288, cumulativeCash: 249531, highlight: true },
  { period: 'M7', practitioners: 40, members: 480, mrr: 1160, arr: 13920, revenue: 1160, variableCosts: 170, grossProfit: 990, fixedCosts: 8600, cacSpend: 600, netBurn: -8210, cumulativeCash: 241321 },
  { period: 'M8', practitioners: 50, members: 600, mrr: 1450, arr: 17400, revenue: 1450, variableCosts: 213, grossProfit: 1237, fixedCosts: 8600, cacSpend: 750, netBurn: -8113, cumulativeCash: 233208 },
  { period: 'M9', practitioners: 62, members: 744, mrr: 1798, arr: 21576, revenue: 1798, variableCosts: 264, grossProfit: 1534, fixedCosts: 8600, cacSpend: 930, netBurn: -7996, cumulativeCash: 225212 },
  { period: 'M10', practitioners: 77, members: 924, mrr: 2233, arr: 26796, revenue: 2233, variableCosts: 327, grossProfit: 1906, fixedCosts: 8600, cacSpend: 1155, netBurn: -7849, cumulativeCash: 217363 },
  { period: 'M11', practitioners: 95, members: 1140, mrr: 2755, arr: 33060, revenue: 2755, variableCosts: 404, grossProfit: 2351, fixedCosts: 8600, cacSpend: 1425, netBurn: -7674, cumulativeCash: 209689 },
  { period: 'M12', practitioners: 117, members: 1404, mrr: 3393, arr: 40716, revenue: 3393, variableCosts: 497, grossProfit: 2896, fixedCosts: 8600, cacSpend: 1755, netBurn: -7459, cumulativeCash: 202230, highlight: true },
]

const YEAR2_QUARTERLY: ProjectionRow[] = [
  { period: 'Q5 (M13-15)', practitioners: 170, members: 2040, mrr: 4930, arr: 59160, revenue: 14790, variableCosts: 2168, grossProfit: 12622, fixedCosts: 30600, cacSpend: 5100, netBurn: -23078, cumulativeCash: 179152 },
  { period: 'Q6 (M16-18)', practitioners: 240, members: 2880, mrr: 6960, arr: 83520, revenue: 20880, variableCosts: 3060, grossProfit: 17820, fixedCosts: 30600, cacSpend: 5400, netBurn: -18180, cumulativeCash: 160972, highlight: true },
  { period: 'Q7 (M19-21)', practitioners: 320, members: 3840, mrr: 9280, arr: 111360, revenue: 27840, variableCosts: 4080, grossProfit: 23760, fixedCosts: 33000, cacSpend: 5600, netBurn: -14840, cumulativeCash: 146132 },
  { period: 'Q8 (M22-24)', practitioners: 410, members: 4920, mrr: 11890, arr: 142680, revenue: 35670, variableCosts: 5228, grossProfit: 30442, fixedCosts: 33000, cacSpend: 5800, netBurn: -8358, cumulativeCash: 137774, highlight: true },
]

const YEAR3_QUARTERLY: ProjectionRow[] = [
  { period: 'Q9 (M25-27)', practitioners: 500, members: 6000, mrr: 14500, arr: 174000, revenue: 43500, variableCosts: 6375, grossProfit: 37125, fixedCosts: 36000, cacSpend: 6000, netBurn: -4875, cumulativeCash: 132899 },
  { period: 'Q10 (M28-30)', practitioners: 600, members: 7200, mrr: 17400, arr: 208800, revenue: 52200, variableCosts: 7650, grossProfit: 44550, fixedCosts: 36000, cacSpend: 6000, netBurn: 2550, cumulativeCash: 135449, highlight: true },
  { period: 'Q11 (M31-33)', practitioners: 710, members: 8520, mrr: 20590, arr: 247080, revenue: 61770, variableCosts: 9052, grossProfit: 52718, fixedCosts: 36000, cacSpend: 6500, netBurn: 10218, cumulativeCash: 145667 },
  { period: 'Q12 (M34-36)', practitioners: 850, members: 10200, mrr: 24650, arr: 295800, revenue: 73950, variableCosts: 10838, grossProfit: 63112, fixedCosts: 36000, cacSpend: 7000, netBurn: 20112, cumulativeCash: 165779, highlight: true },
]

// ══════════════════════════════════════════════════════════════════════════
// 5. FIXED vs VARIABLE COSTS
// ══════════════════════════════════════════════════════════════════════════

interface CostCategory {
  category: string
  type: 'Fixed' | 'Variable' | 'Semi-variable'
  m1: string
  m12: string
  m36: string
  scalesWith: string
}

function getCostStructure(t: TFunc): CostCategory[] {
  return [
    { category: t('Team (founders + contractors)', 'Équipe (fondateurs + prestataires)'), type: 'Fixed', m1: '€6,500', m12: '€6,500', m36: '€12,000', scalesWith: t('Stepped: +hire at 100 users, +hire at 300 users', 'Par paliers : +recrutement à 100 utilisateurs, +recrutement à 300 utilisateurs') },
    { category: 'Claude Haiku API', type: 'Variable', m1: '€18', m12: '€211', m36: '€1,530', scalesWith: t('Linear with practitioners (€1.80/practitioner/mo)', 'Linéaire avec les praticiens (1,80€/praticien/mois)') },
    { category: 'Supabase', type: 'Semi-variable', m1: '€25', m12: '€50', m36: '€200', scalesWith: t('Sub-linear. Pro plan covers 0-500, then scales.', 'Sous-linéaire. Le plan Pro couvre 0-500, puis évolue.') },
    { category: 'Hosting (Vercel)', type: 'Semi-variable', m1: '€0', m12: '€30', m36: '€200', scalesWith: t('Free tier → Pro at ~50 users → Enterprise at 500+', 'Offre gratuite → Pro à ~50 utilisateurs → Enterprise à 500+') },
    { category: 'PostHog analytics', type: 'Semi-variable', m1: '€0', m12: '€0', m36: '€100', scalesWith: t('Free tier (1M events/mo). Paid only at high volume.', 'Offre gratuite (1M événements/mois). Payant uniquement à fort volume.') },
    { category: t('Marketing spend', 'Dépenses marketing'), type: 'Fixed', m1: '€1,000', m12: '€1,000', m36: '€2,000', scalesWith: t('Content + events. No paid ads until PMF.', 'Contenu + événements. Pas de publicité payante avant le PMF.') },
    { category: t('Other (legal, accounting)', 'Autres (juridique, comptabilité)'), type: 'Fixed', m1: '€400', m12: '€400', m36: '€800', scalesWith: t('Stepped: +legal at HDS certification', 'Par paliers : +juridique à la certification HDS') },
    { category: t('Customer acquisition (CAC)', 'Acquisition client (CAC)'), type: 'Variable', m1: '€150', m12: '€1,755', m36: '€4,500', scalesWith: t('Linear with new practitioners acquired × €50/each', 'Linéaire avec les nouveaux praticiens acquis × 50€/chacun') },
    { category: t('Support labor', 'Main-d\'œuvre support'), type: 'Variable', m1: '€15', m12: '€176', m36: '€425', scalesWith: t('€1.50/practitioner/mo initially, €0.50 at scale (self-serve)', '1,50€/praticien/mois au départ, 0,50€ à grande échelle (libre-service)') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 6. BREAK-EVEN ANALYSIS
// ══════════════════════════════════════════════════════════════════════════

interface BreakEvenScenario {
  scenario: string
  fixedCosts: string
  contributionMargin: string
  breakEvenUsers: string
  breakEvenMRR: string
  expectedMonth: string
  color: string
}

function getBreakEven(t: TFunc): BreakEvenScenario[] {
  return [
    {
      scenario: t('Conservative (€19 ARPU, 5% churn)', 'Conservateur (ARPU 19€, 5% d\'attrition)'),
      fixedCosts: '€6,700/mo',
      contributionMargin: t('€14.75/user/mo', '14,75€/utilisateur/mois'),
      breakEvenUsers: t('454 practitioners', '454 praticiens'),
      breakEvenMRR: '€8,626',
      expectedMonth: 'M28-M32',
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      scenario: t('Base case (€29 ARPU, 4% churn)', 'Cas de base (ARPU 29€, 4% d\'attrition)'),
      fixedCosts: '€8,600/mo',
      contributionMargin: t('€24.75/user/mo', '24,75€/utilisateur/mois'),
      breakEvenUsers: t('347 practitioners', '347 praticiens'),
      breakEvenMRR: '€10,063',
      expectedMonth: 'M22-M26',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      scenario: t('Aggressive (€35 ARPU, 3% churn)', 'Agressif (ARPU 35€, 3% d\'attrition)'),
      fixedCosts: '€11,000/mo',
      contributionMargin: t('€30.75/user/mo', '30,75€/utilisateur/mois'),
      breakEvenUsers: t('358 practitioners', '358 praticiens'),
      breakEvenMRR: '€12,530',
      expectedMonth: 'M16-M20',
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 7. SENSITIVITY ANALYSIS
// ══════════════════════════════════════════════════════════════════════════

interface SensitivityVar {
  variable: string
  worst: string
  base: string
  best: string
  impactOnLTV: string
  impactOnRunway: string
}

function getSensitivity(t: TFunc): SensitivityVar[] {
  return [
    { variable: t('Monthly churn', 'Attrition mensuelle'), worst: '7%', base: '4%', best: '2.5%', impactOnLTV: '€1,779 / €3,625 / €5,800', impactOnRunway: t('High — 1% churn change = €1,800 LTV swing', 'Élevé — 1% de variation d\'attrition = 1 800€ d\'écart de LTV') },
    { variable: 'ARPU', worst: '€19', base: '€29', best: '€39', impactOnLTV: '€2,375 / €3,625 / €4,875', impactOnRunway: t('High — €10 ARPU = 3x revenue difference at M18', 'Élevé — 10€ d\'ARPU = 3x de différence de revenu à M18') },
    { variable: 'CAC', worst: '€220', base: '€140', best: '€80', impactOnLTV: t('LTV/CAC: 1.8x / 2.8x / 4.9x', 'LTV/CAC : 1,8x / 2,8x / 4,9x'), impactOnRunway: t('High — CAC is the biggest lever after churn. Referral program critical to keep blended CAC below €150.', 'Élevé — le CAC est le plus grand levier après l\'attrition. Le programme de parrainage est critique pour maintenir le CAC pondéré sous 150€.') },
    { variable: t('Initial growth rate', 'Taux de croissance initial'), worst: '15%', base: '30%', best: '40%', impactOnLTV: t('Same LTV, different time to scale', 'Même LTV, délai de mise à l\'échelle différent'), impactOnRunway: t('Critical — determines when you hit break-even', 'Critique — détermine le moment du seuil de rentabilité') },
    { variable: t('Members/practitioner', 'Membres/praticien'), worst: '8', base: '12', best: '20', impactOnLTV: t('B2C upside: €288 / €540 / €900 per practitioner', 'Potentiel B2C : 288€ / 540€ / 900€ par praticien'), impactOnRunway: t('Low-Med — member revenue is upside, not core', 'Faible-Moyen — le revenu des membres est un bonus, pas le cœur') },
    { variable: t('AI cost per practitioner', 'Coût IA par praticien'), worst: '€3.50', base: '€1.80', best: '€1.00', impactOnLTV: t('Gross margin: 77% / 85% / 89%', 'Marge brute : 77% / 85% / 89%'), impactOnRunway: t('Low — even worst case maintains healthy margins', 'Faible — même le pire scénario maintient des marges saines') },
    { variable: t('Fixed costs (team)', 'Coûts fixes (équipe)'), worst: '€12,000/mo', base: '€8,600/mo', best: '€6,500/mo', impactOnLTV: t('N/A (affects break-even, not LTV)', 'N/A (affecte le seuil de rentabilité, pas la LTV)'), impactOnRunway: t('High — €3.4K/mo difference = 10+ months of runway', 'Élevé — 3,4K€/mois de différence = 10+ mois de trésorerie') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 8. KEY ASSUMPTIONS TABLE
// ══════════════════════════════════════════════════════════════════════════

interface Assumption {
  assumption: string
  value: string
  justification: string
  risk: string
}

function getAssumptions(t: TFunc): Assumption[] {
  return [
    { assumption: t('Starting practitioners at raise close', 'Praticiens au bouclage de la levée'), value: '5-8', justification: t('15 beta testers today, 0 paying. Target: 5-8 paying by close. WTP not yet validated with transactions — this is the biggest unknown.', '15 bêta-testeurs aujourd\'hui, 0 payant. Objectif : 5-8 payants au bouclage. La volonté de payer n\'est pas encore validée — c\'est la plus grande inconnue.'), risk: t('High — WTP unproven', 'Élevé — volonté de payer non prouvée') },
    { assumption: t('Monthly price (blended ARPU)', 'Prix mensuel (ARPU pondéré)'), value: '~€24', justification: t('Weighted: 40% Essentiel (€19) + 50% Pro (€29) + 10% Cabinet (~€29/head). Skewed toward lower tiers early — practitioners start cheap and upgrade as they see value. Pricing not yet validated.', 'Pondéré : 40% Essentiel (19€) + 50% Pro (29€) + 10% Cabinet (~29€/tête). Pondéré vers les offres basses au début — les praticiens commencent bas et montent en gamme en voyant la valeur. Tarification non validée.'), risk: t('Medium — pricing unproven', 'Moyen — tarification non prouvée') },
    { assumption: t('Monthly churn rate', 'Taux d\'attrition mensuel'), value: '5%', justification: t('SaaS benchmark 2-10%. Starting at 5% for a new, unproven product. Care relationship may reduce churn over time (hypothesis). No churn data — zero paying customers.', 'Référence SaaS 2-10%. Démarrage à 5% pour un produit nouveau et non prouvé. La relation de soin peut réduire l\'attrition au fil du temps (hypothèse). Aucune donnée — zéro client payant.'), risk: t('High — entirely modeled, no real data', 'Élevé — entièrement modélisé, aucune donnée réelle') },
    { assumption: 'CAC', value: '~€140', justification: t('Blended: LinkedIn outreach (€80-120 incl. founder time), referrals (€29), SEO (€40-60), events (€150-200). Founder time is a real cost — 3h per conversion at €30/h opportunity cost. No paid ads. Below SaaS benchmark (€200-500) but higher than organic-only estimates.', 'Pondéré : prospection LinkedIn (80-120€ incl. temps fondateur), parrainages (29€), SEO (40-60€), événements (150-200€). Le temps fondateur est un vrai coût — 3h par conversion à 30€/h de coût d\'opportunité. Pas de publicité payante. Sous la référence SaaS (200-500€) mais plus élevé que les estimations purement organiques.'), risk: t('Medium-High — modeled, includes founder time cost', 'Moyen-Élevé — modélisé, inclut le coût du temps fondateur') },
    { assumption: t('Gross margin', 'Marge brute'), value: '~82%', justification: t('Modeled. Variable cost €4.25/mo against ~€24 blended ARPU. AI on Claude Haiku ($1/$5 per MTok). Upper quartile SaaS (median 70-75%).', 'Modélisé. Coût variable 4,25€/mois contre ~24€ d\'ARPU pondéré. IA sur Claude Haiku (1$/5$ par MTok). Quartile supérieur SaaS (médiane 70-75%).'), risk: t('Low — Haiku pricing is stable and declining', 'Faible — les tarifs Haiku sont stables et en baisse') },
    { assumption: t('Members per practitioner', 'Membres par praticien'), value: '8-12', justification: t('Average caseload 15-25 clients per practitioner. Adoption when recommended by therapist is unproven. Conservative estimate: 8-12 members per practitioner using the app.', 'Charge de travail moyenne 15-25 clients par praticien. Adoption quand recommandé par le thérapeute non prouvée. Estimation conservatrice : 8-12 membres par praticien utilisant l\'app.'), risk: t('High — network effect unproven', 'Élevé — effet réseau non prouvé') },
    { assumption: t('Growth rate (initial → mature)', 'Taux de croissance (initial → mature)'), value: '18% → 6%', justification: t('Linear decay over 36 months. Organic B2B SaaS for solo practitioners typically grows 10-25% MoM at pre-seed. 6% mature = stabilized.', 'Décroissance linéaire sur 36 mois. Le SaaS B2B organique pour praticiens solo croît typiquement de 10-25% MoM en pré-seed. 6% mature = stabilisé.'), risk: t('Medium-High — depends on market response and conversion rates', 'Moyen-Élevé — dépend de la réponse du marché et des taux de conversion') },
    { assumption: t('Starting cash', 'Trésorerie de départ'), value: '€500,000', justification: t('Base case pre-seed raise target. Provides 28-30 months runway at projected burn rate (~€14-15K/mo early, growing to €18-20K by M12). Enough to reach Series A milestones.', 'Objectif de levée pré-seed cas de base. Offre 28-30 mois de runway au rythme de burn projeté (~14-15K€/mois au début, croissant à 18-20K€ vers M12). Suffisant pour atteindre les jalons Série A.'), risk: t('Low — within standard EU pre-seed range (€250K-€750K)', 'Faible — dans la fourchette standard pré-seed UE (250K€-750K€)') },
    { assumption: t('Team cost', 'Coût de l\'équipe'), value: '€11,000/mo', justification: t('2 founders (€2.5K each) + dev (€3K) + sales (€2K) + advisor (€1K). Steps up €2.5K every 6 months. All below market rate — founders betting on equity.', '2 fondateurs (2,5K€ chacun) + dev (3K€) + commercial (2K€) + conseiller (1K€). Augmente de 2,5K€ tous les 6 mois. Tous sous le prix du marché — fondateurs parient sur l\'equity.'), risk: t('Low — conservative. Will need to increase for talent retention.', 'Faible — conservateur. Devra augmenter pour retenir les talents.') },
    { assumption: t('No paid acquisition', 'Pas d\'acquisition payante'), value: t('€0 ads', '0€ publicité'), justification: t('Mental health professionals buy through trust, not ads. Content + referrals + events are the channels. If organic stalls at 80-100 users, paid channels become necessary (adds €50-100/CAC).', 'Les professionnels de santé mentale achètent par la confiance, pas la publicité. Contenu + parrainages + événements sont les canaux. Si l\'organique stagne à 80-100 utilisateurs, les canaux payants deviennent nécessaires (+50-100€/CAC).'), risk: t('Medium — may need paid if organic stalls', 'Moyen — la publicité peut être nécessaire si l\'organique stagne') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 9. BENCHMARKS
// ══════════════════════════════════════════════════════════════════════════

interface Benchmark {
  metric: string
  bloomsline: string
  saasMedian: string
  topDecile: string
  verdict: string
}

function getBenchmarks(t: TFunc): Benchmark[] {
  return [
    { metric: t('Gross margin', 'Marge brute'), bloomsline: '~83% (modeled)', saasMedian: '70-75%', topDecile: '85-90%', verdict: t('Projected top quartile. AI costs modeled on Haiku pricing. No actual revenue data.', 'Quartile supérieur projeté. Coûts IA modélisés sur les tarifs Haiku. Aucune donnée de revenu réelle.') },
    { metric: 'LTV/CAC', bloomsline: '~5x (modeled)', saasMedian: '3-5x', topDecile: '10-15x', verdict: t('Within healthy range if assumptions hold. All modeled — zero real data. CAC and churn are unproven.', 'Dans la fourchette saine si les hypothèses se vérifient. Tout est modélisé — aucune donnée réelle. Le CAC et l\'attrition ne sont pas prouvés.') },
    { metric: t('CAC payback', 'Retour sur CAC'), bloomsline: t('~2 months (modeled)', '~2 mois (modélisé)'), saasMedian: t('12-18 months', '12-18 mois'), topDecile: t('5-6 months', '5-6 mois'), verdict: t('Projected. Organic channels + low price + modeled margin. Unproven.', 'Projeté. Canaux organiques + prix bas + marge modélisée. Non prouvé.') },
    { metric: t('Monthly churn', 'Attrition mensuelle'), bloomsline: '4% (modeled)', saasMedian: '5-7%', topDecile: '2-3%', verdict: t('Entirely modeled. Zero churn data. Care lock-in is the core hypothesis — unproven.', 'Entièrement modélisé. Aucune donnée d\'attrition. La fidélisation par le soin est l\'hypothèse centrale — non prouvée.') },
    { metric: t('Net revenue retention', 'Rétention nette du revenu'), bloomsline: t('~100% (est.)', '~100% (est.)'), saasMedian: '90-100%', topDecile: '120-140%', verdict: t('Needs upsell motion (Essentiel → Pro, Pro → Cabinet) to reach 110%+.', 'Nécessite un mécanisme d\'upsell (Essentiel → Pro, Pro → Cabinet) pour atteindre 110%+.') },
    { metric: 'CAC', bloomsline: '€50 (modeled)', saasMedian: '€200-500', topDecile: '€50-100', verdict: t('Modeled, not observed. Organic-only assumption. Will rise if paid channels needed.', 'Modélisé, non observé. Hypothèse organique uniquement. Augmentera si des canaux payants sont nécessaires.') },
    { metric: 'ARPU', bloomsline: '€24/mo', saasMedian: '€50-100/mo', topDecile: t('Varies', 'Variable'), verdict: t('Below median. Compensated by high margin and B2B2C acquisition efficiency. Room to grow via upsell to Pro/Cabinet.', 'Sous la médiane. Compensé par la marge élevée et l\'efficacité d\'acquisition B2B2C. Marge de progression via upsell Pro/Cabinet.') },
    { metric: t('Rule of 40', 'Règle des 40'), bloomsline: t('-30 (pre-rev)', '-30 (pré-revenu)'), saasMedian: '40+', topDecile: '60+', verdict: t('N/A at pre-revenue. Target: 40+ by M18 with growth + margin.', 'N/A en pré-revenu. Objectif : 40+ à M18 avec croissance + marge.') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// 10. RED FLAGS
// ══════════════════════════════════════════════════════════════════════════

interface RedFlag {
  flag: string
  threshold: string
  whyDangerous: string
  action: string
  checkAt: string
}

function getRedFlags(t: TFunc): RedFlag[] {
  return [
    { flag: t('Churn exceeds 8%', 'Attrition supérieure à 8%'), threshold: t('>8% monthly', '>8% mensuel'), whyDangerous: t('At 8% churn, average lifetime drops to 12.5 months. LTV crashes to €2,175. You\'re losing customers faster than you can acquire them.', 'À 8% d\'attrition, la durée de vie moyenne tombe à 12,5 mois. La LTV chute à 2 175€. Vous perdez des clients plus vite que vous n\'en acquérez.'), action: t('STOP selling. Interview every churned user. Fix top 3 churn reasons before resuming growth.', 'ARRÊTEZ de vendre. Interrogez chaque client perdu. Corrigez les 3 premières causes d\'attrition avant de reprendre la croissance.'), checkAt: t('Monthly from M2', 'Mensuel à partir de M2') },
    { flag: t('Zero organic signups by M3', 'Zéro inscription organique à M3'), threshold: t('0 inbound by day 90', '0 entrant au jour 90'), whyDangerous: t('If no one finds you without your direct involvement, word-of-mouth isn\'t working. The product isn\'t remarkable enough to talk about.', 'Si personne ne vous trouve sans votre implication directe, le bouche-à-oreille ne fonctionne pas. Le produit n\'est pas assez remarquable.'), action: t('Reassess messaging. Run 10 user interviews. Consider pricing/positioning pivot.', 'Réévaluez le message. Réalisez 10 entretiens utilisateurs. Envisagez un pivot prix/positionnement.'), checkAt: t('M3 check-in', 'Bilan M3') },
    { flag: t('Member activation below 50%', 'Activation des membres sous 50%'), threshold: t('<50% invited members log first moment', '<50% des membres invités enregistrent un premier moment'), whyDangerous: t('The practitioner signed up, but their clients aren\'t using it. The practitioner sees no value. They\'ll churn within 60 days.', 'Le praticien s\'est inscrit, mais ses clients ne l\'utilisent pas. Le praticien n\'y voit pas de valeur. Il partira dans les 60 jours.'), action: t('Redesign first-use experience. Make first moment <10 seconds. Add practitioner-triggered nudges.', 'Repensez l\'expérience de première utilisation. Premier moment en <10 secondes. Ajoutez des rappels déclenchés par le praticien.'), checkAt: t('Monthly from M1', 'Mensuel à partir de M1') },
    { flag: t('CAC rises above €150', 'CAC supérieur à 150€'), threshold: t('>€150/practitioner', '>150€/praticien'), whyDangerous: t('LTV/CAC drops to 24x — still healthy, but signals organic channels are saturating. Paid acquisition is expensive in healthcare.', 'Le LTV/CAC tombe à 24x — encore sain, mais signe que les canaux organiques saturent. L\'acquisition payante est coûteuse en santé.'), action: t('Double down on referral program. Invest more in content/SEO. Don\'t chase paid ads.', 'Doublez les efforts sur le programme de parrainage. Investissez davantage dans le contenu/SEO. Ne poursuivez pas la publicité payante.'), checkAt: t('Quarterly', 'Trimestriel') },
    { flag: t('Burn exceeds €12K/month', 'Burn supérieur à 12K€/mois'), threshold: t('>€12K/mo net burn', '>12K€/mois de burn net'), whyDangerous: t('At €400-500K starting cash, €12K/mo burn = 33-42 months runway. But if revenue isn\'t growing, you\'re bleeding out.', 'Avec 400-500K€ de trésorerie de départ, un burn de 12K€/mois = 33-42 mois de runway. Mais si le revenu ne croît pas, vous vous épuisez.'), action: t('Audit every expense. Defer hiring. Cut conference spend. Founder salaries to €0 if needed.', 'Auditez chaque dépense. Reportez les recrutements. Réduisez les conférences. Salaires des fondateurs à 0€ si nécessaire.'), checkAt: t('Monthly', 'Mensuel') },
    { flag: t('Demo-to-paid conversion below 15%', 'Conversion démo-payant sous 15%'), threshold: t('<15% of demos convert', '<15% des démos convertissent'), whyDangerous: t('Either the demo is bad, the price is wrong, or you\'re targeting the wrong practitioners. At 50 demos/month, you need >7 conversions.', 'Soit la démo est mauvaise, soit le prix est incorrect, soit vous ciblez les mauvais praticiens. À 50 démos/mois, il faut >7 conversions.'), action: t('Record and review 10 demos. A/B test pitch. Test €19 entry offer for hesitant prospects.', 'Enregistrez et analysez 10 démos. Testez A/B le pitch. Testez une offre d\'entrée à 19€ pour les prospects hésitants.'), checkAt: t('Monthly from M2', 'Mensuel à partir de M2') },
    { flag: t('Cash below €150K with <50 practitioners', 'Trésorerie sous 150K€ avec <50 praticiens'), threshold: t('<€150K remaining, <50 users', '<150K€ restants, <50 utilisateurs'), whyDangerous: t('Less than 15 months runway with insufficient traction. Not Series A-ready. Not break-even trajectory.', 'Moins de 15 mois de runway avec une traction insuffisante. Pas prêt pour une Série A. Pas sur la trajectoire de rentabilité.'), action: t('Emergency mode: cut to bare essentials, explore bridge round, or find revenue partnership.', 'Mode urgence : réduire au strict minimum, explorer un tour de pont, ou trouver un partenariat de revenu.'), checkAt: t('Monthly cash review', 'Revue mensuelle de trésorerie') },
  ]
}

// ══════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════

export default function UnitEconomicsPage() {
  const [lang, setLang] = useState<'en' | 'fr'>('en')
  const t = (en: string, fr: string) => lang === 'fr' ? fr : en

  const channelCAC = getChannelCAC(t)
  const ltvCalc = getLTVCalc(t)
  const marginWaterfall = getMarginWaterfall(t)
  const costStructure = getCostStructure(t)
  const breakEven = getBreakEven(t)
  const sensitivity = getSensitivity(t)
  const assumptions = getAssumptions(t)
  const benchmarks = getBenchmarks(t)
  const redFlags = getRedFlags(t)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">{t('Unit Economics & Financial Model', 'Économie unitaire et modèle financier')}</h1>
              <p className="text-[10px] text-gray-400">{t('Bloomsline Care — 36-Month Financial Projection', 'Bloomsline Care — Projection financière sur 36 mois')}</p>
            </div>
          </div>
          <button
            onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            {lang === 'en' ? '\u{1F1EB}\u{1F1F7} Fran\u00e7ais' : '\u{1F1EC}\u{1F1E7} English'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-14">
        {/* ── Hero ────────────────────────────────────── */}
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('Unit Economics & 3-Year Financial Model', 'Économie unitaire et modèle financier sur 3 ans')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
            {t(
              'Projected financial model grounded in Bloomsline\u2019s modeled cost structure, pricing architecture, and growth assumptions. All formulas shown. All assumptions justified. All metrics are modeled, not observed \u2014 zero paying customers today. Built for investor scrutiny.',
              'Modèle financier projeté fondé sur la structure de coûts modélisée de Bloomsline, son architecture tarifaire et ses hypothèses de croissance. Toutes les formules sont exposées. Toutes les hypothèses sont justifiées. Tous les indicateurs sont modélisés, non observés \u2014 zéro client payant aujourd\u2019hui. Conçu pour résister au regard des investisseurs.'
            )}
          </p>

          {/* Summary cards */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-2">
            {[
              { label: t('LTV (modeled)', 'LTV (modélisée)'), value: '€3,625', color: 'text-emerald-600' },
              { label: t('CAC (modeled)', 'CAC (modélisé)'), value: '€50', color: 'text-blue-600' },
              { label: t('LTV/CAC (modeled)', 'LTV/CAC (modélisé)'), value: '~5x', color: 'text-indigo-600' },
              { label: t('Payback (modeled)', 'Retour (modélisé)'), value: t('~2 mo', '~2 mois'), color: 'text-violet-600' },
              { label: t('Gross Margin (modeled)', 'Marge brute (modélisée)'), value: '~83%', color: 'text-emerald-600' },
              { label: t('Break-even (projected)', 'Seuil de rentabilité (projeté)'), value: '~M24', color: 'text-amber-600' },
            ].map((m) => (
              <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 1. CAC BY CHANNEL                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.05)}>
          <SectionTitle subtitle={t('Customer acquisition cost broken down by acquisition channel', 'Coût d\'acquisition client ventilé par canal d\'acquisition')}>
            {t('1. CAC by Channel', '1. CAC par canal')}
          </SectionTitle>

          <div className="space-y-3">
            {channelCAC.map((ch, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">{ch.channel}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      CAC: {ch.cac}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      LTV/CAC: {ch.ltvCacRatio}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-[10px]">
                  <div><span className="text-gray-400">{t('Volume:', 'Volume :')}</span> <span className="text-gray-600">{ch.volume}</span></div>
                  <div><span className="text-gray-400">{t('Timeline:', 'Calendrier :')}</span> <span className="text-gray-600">{ch.timeline}</span></div>
                  <div><span className="text-gray-400">{t('Lead quality:', 'Qualité du prospect :')}</span> <span className="text-gray-600">{ch.quality}</span></div>
                  <div><span className="text-gray-400">{t('Channel LTV:', 'LTV du canal :')}</span> <span className="text-gray-600">{ch.ltv}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs text-indigo-700">
              {lang === 'fr' ? (
                <>
                  <strong>CAC pondéré : 50€.</strong> Moyenne pondérée sur tous les canaux. Pas d&apos;acquisition payante.
                  Les canaux de parrainage et organiques ont un CAC de 0€ — uniquement le temps des fondateurs. Le CAC pondéré montera à 60-80€
                  à mesure que les événements et partenariats nécessitent des dépenses, mais le LTV/CAC reste bien au-dessus de 40x.
                </>
              ) : (
                <>
                  <strong>Blended CAC: ~€140.</strong> Weighted average across all channels including founder time. No paid acquisition — but founder hours have a real cost.
                  Referral and organic channels have €0 cash CAC — only founder time. Blended CAC will rise to €60-80
                  as events and partnerships require spend, but LTV/CAC remains well above 40x.
                </>
              )}
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 2. LTV CALCULATION                               */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.1)}>
          <SectionTitle subtitle={t('Lifetime value calculation with transparent assumptions', 'Calcul de la valeur vie client avec des hypothèses transparentes')}>
            {t('2. LTV Calculation', '2. Calcul de la LTV')}
          </SectionTitle>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {ltvCalc.map((row, i) => (
              <div key={i} className={`px-4 py-3 flex items-start gap-4 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${i === ltvCalc.length - 1 ? 'bg-emerald-50' : ''} border-b border-gray-100`}>
                <div className="w-48 shrink-0">
                  <p className={`text-xs font-semibold ${i === ltvCalc.length - 1 ? 'text-emerald-800' : 'text-gray-900'}`}>{row.label}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{row.formula}</p>
                </div>
                <div className="w-24 shrink-0">
                  <p className={`text-sm font-bold ${i === ltvCalc.length - 1 ? 'text-emerald-700' : 'text-gray-900'}`}>{row.value}</p>
                </div>
                <p className="text-[10px] text-gray-500 flex-1">{row.assumption}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-red-400">{t('Worst case (7% churn, €19 ARPU)', 'Pire scénario (7% d\'attrition, ARPU 19€)')}</p>
              <p className="text-lg font-bold text-red-600">€1,779</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-emerald-400">{t('Base case (4% churn, €29 ARPU)', 'Cas de base (4% d\'attrition, ARPU 29€)')}</p>
              <p className="text-lg font-bold text-emerald-600">€3,625</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <p className="text-[10px] text-blue-400">{t('Best case (2.5% churn, €39 ARPU)', 'Meilleur scénario (2,5% d\'attrition, ARPU 39€)')}</p>
              <p className="text-lg font-bold text-blue-600">€5,800</p>
            </div>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 3. GROSS & CONTRIBUTION MARGIN                    */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.15)}>
          <SectionTitle subtitle={t('Revenue waterfall from top-line to contribution margin', 'Cascade de revenu du chiffre d\'affaires à la marge de contribution')}>
            {t('3. Margin Waterfall — Per Practitioner / Month', '3. Cascade des marges — Par praticien / Mois')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Line Item', 'Poste')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Per Practitioner/mo', 'Par praticien/mois')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b border-gray-200">{t('% of Revenue', '% du revenu')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">{t('Note', 'Note')}</th>
                </tr>
              </thead>
              <tbody>
                {marginWaterfall.map((row, i) => (
                  <tr key={i} className={`${
                    row.isTotal ? 'bg-gray-900 text-white' :
                    row.isHeader ? 'bg-indigo-50' :
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}>
                    <td className={`p-3 border-b border-gray-100 ${row.isTotal || row.isHeader ? 'font-bold' : 'font-medium'} ${row.isTotal ? 'text-white' : 'text-gray-900'}`}>
                      {row.item}
                    </td>
                    <td className={`p-3 text-right font-mono border-b border-gray-100 ${row.isTotal ? 'font-bold text-emerald-400' : row.isHeader ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                      {row.perPractitioner}
                    </td>
                    <td className={`p-3 text-right font-mono border-b border-gray-100 ${row.isTotal ? 'text-gray-300' : 'text-gray-500'}`}>
                      {row.percent}
                    </td>
                    <td className={`p-3 border-b border-gray-100 ${row.isTotal ? 'text-gray-400' : 'text-gray-500'}`}>
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 4. 3-YEAR PROJECTION                              */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.2)}>
          <SectionTitle subtitle={t('Base case (modeled): ~€24 blended ARPU, 18% initial growth, 5% churn, €400K pre-seed raise, €140 blended CAC', 'Cas de base (modélisé) : ~24€ d\'ARPU pondéré, croissance initiale 18%, 5% d\'attrition, levée pré-seed 400K€, 140€ de CAC pondéré')}>
            {t('4. Three-Year Financial Projection', '4. Projection financière sur trois ans')}
          </SectionTitle>

          {/* Year 1 — Monthly */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">{t('Year 1', 'Année 1')}</span>
              {t('Monthly Detail', 'Détail mensuel')}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left font-semibold text-gray-600 border-b">{t('Period', 'Période')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Practitioners', 'Praticiens')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Members', 'Membres')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">MRR</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">ARR</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Gross Profit', 'Marge brute')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Fixed Costs', 'Coûts fixes')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Net Burn', 'Burn net')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Cash', 'Trésorerie')}</th>
                  </tr>
                </thead>
                <tbody>
                  {YEAR1_MONTHLY.map((r) => (
                    <tr key={r.period} className={r.highlight ? 'bg-blue-50/50' : ''}>
                      <td className="p-2 font-semibold text-gray-800 border-b border-gray-50">{r.period}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">{r.practitioners}</td>
                      <td className="p-2 text-right font-mono text-gray-500 border-b border-gray-50">{r.members.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">€{r.mrr.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">€{r.arr.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-emerald-600 border-b border-gray-50">€{r.grossProfit.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-gray-500 border-b border-gray-50">€{r.fixedCosts.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-red-500 border-b border-gray-50">€{r.netBurn.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold text-gray-800 border-b border-gray-50">€{r.cumulativeCash.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Year 2 — Quarterly */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px]">{t('Year 2', 'Année 2')}</span>
              {t('Quarterly', 'Trimestriel')}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left font-semibold text-gray-600 border-b">{t('Period', 'Période')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Practitioners', 'Praticiens')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Revenue (qtr)', 'Revenu (trim.)')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Gross Profit', 'Marge brute')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Fixed Costs', 'Coûts fixes')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Net Burn (qtr)', 'Burn net (trim.)')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Cash', 'Trésorerie')}</th>
                  </tr>
                </thead>
                <tbody>
                  {YEAR2_QUARTERLY.map((r) => (
                    <tr key={r.period} className={r.highlight ? 'bg-emerald-50/50' : ''}>
                      <td className="p-2 font-semibold text-gray-800 border-b border-gray-50">{r.period}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">{r.practitioners}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">€{r.revenue.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-emerald-600 border-b border-gray-50">€{r.grossProfit.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-gray-500 border-b border-gray-50">€{r.fixedCosts.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-red-500 border-b border-gray-50">€{r.netBurn.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold text-gray-800 border-b border-gray-50">€{r.cumulativeCash.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Year 3 — Quarterly */}
          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-2">
              <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[10px]">{t('Year 3', 'Année 3')}</span>
              {t('Quarterly — Path to Profitability', 'Trimestriel — Chemin vers la rentabilité')}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left font-semibold text-gray-600 border-b">{t('Period', 'Période')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Practitioners', 'Praticiens')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Revenue (qtr)', 'Revenu (trim.)')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Gross Profit', 'Marge brute')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Fixed Costs', 'Coûts fixes')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Net Profit (qtr)', 'Bénéfice net (trim.)')}</th>
                    <th className="p-2 text-right font-semibold text-gray-600 border-b">{t('Cash', 'Trésorerie')}</th>
                  </tr>
                </thead>
                <tbody>
                  {YEAR3_QUARTERLY.map((r) => (
                    <tr key={r.period} className={r.highlight ? 'bg-violet-50/50' : ''}>
                      <td className="p-2 font-semibold text-gray-800 border-b border-gray-50">{r.period}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">{r.practitioners}</td>
                      <td className="p-2 text-right font-mono text-gray-700 border-b border-gray-50">€{r.revenue.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-emerald-600 border-b border-gray-50">€{r.grossProfit.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-gray-500 border-b border-gray-50">€{r.fixedCosts.toLocaleString()}</td>
                      <td className={`p-2 text-right font-mono font-semibold border-b border-gray-50 ${r.netBurn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {r.netBurn >= 0 ? '+' : ''}€{r.netBurn.toLocaleString()}
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-gray-800 border-b border-gray-50">€{r.cumulativeCash.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 mb-1">{t('Cash flow inflection: Q10 (~M29)', 'Point d\'inflexion de trésorerie : Q10 (~M29)')}</h4>
            <p className="text-xs text-emerald-700">
              {t(
                'Projected: the business turns cash-flow positive in Q10 with ~600 practitioners and €17.4K MRR (€209K ARR). These are modeled projections based on a €400-500K pre-seed raise — zero revenue exists today.',
                'Projeté : l\'entreprise devient positive en trésorerie au Q10 avec ~600 praticiens et 17,4K€ de MRR (209K€ d\'ARR). Ce sont des projections modélisées basées sur une levée pré-seed de 400-500K€ — aucun revenu n\'existe aujourd\'hui.'
              )}
              <strong>{t(' The model is capital-efficient by design.', ' Le modèle est conçu pour être efficient en capital.')}</strong>
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 5. COST STRUCTURE                                 */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.25)}>
          <SectionTitle subtitle={t('Fixed vs variable costs — how the cost structure scales with growth', 'Coûts fixes vs variables — comment la structure de coûts évolue avec la croissance')}>
            {t('5. Cost Structure Breakdown', '5. Détail de la structure de coûts')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Category', 'Catégorie')}</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b">{t('Type', 'Type')}</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b">M1</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b">M12</th>
                  <th className="text-right p-3 font-semibold text-gray-700 border-b">M36</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Scales With', 'Évolue avec')}</th>
                </tr>
              </thead>
              <tbody>
                {costStructure.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-medium text-gray-900 border-b border-gray-100">{c.category}</td>
                    <td className="p-3 text-center border-b border-gray-100">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        c.type === 'Fixed' ? 'bg-blue-100 text-blue-600' :
                        c.type === 'Variable' ? 'bg-amber-100 text-amber-600' :
                        'bg-violet-100 text-violet-600'
                      }`}>{c.type === 'Fixed' ? t('Fixed', 'Fixe') : c.type === 'Variable' ? t('Variable', 'Variable') : t('Semi-variable', 'Semi-variable')}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{c.m1}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{c.m12}</td>
                    <td className="p-3 text-right font-mono text-gray-700 border-b border-gray-100">{c.m36}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{c.scalesWith}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 6. BREAK-EVEN ANALYSIS                            */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.3)}>
          <SectionTitle subtitle={t('When does revenue cover all costs? Formula: Break-even = Fixed costs / Contribution margin per user', 'Quand le revenu couvre-t-il tous les coûts ? Formule : Seuil de rentabilité = Coûts fixes / Marge de contribution par utilisateur')}>
            {t('6. Break-Even Analysis', '6. Analyse du seuil de rentabilité')}
          </SectionTitle>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {breakEven.map((b, i) => (
              <div key={i} className={`${b.color} border rounded-xl p-4`}>
                <h4 className="text-sm font-bold mb-3">{b.scenario}</h4>
                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between"><span className="opacity-70">{t('Fixed costs:', 'Coûts fixes :')}</span> <span className="font-mono font-bold">{b.fixedCosts}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">{t('Contribution/user:', 'Contribution/utilisateur :')}</span> <span className="font-mono font-bold">{b.contributionMargin}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">{t('Break-even users:', 'Utilisateurs au seuil :')}</span> <span className="font-mono font-bold">{b.breakEvenUsers}</span></div>
                  <div className="flex justify-between"><span className="opacity-70">{t('Break-even MRR:', 'MRR au seuil :')}</span> <span className="font-mono font-bold">{b.breakEvenMRR}</span></div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold">{t('Expected month:', 'Mois prévu :')}</span>
                    <span className="font-bold">{b.expectedMonth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 7. SENSITIVITY ANALYSIS                           */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.35)}>
          <SectionTitle subtitle={t('How do key variables affect LTV, margins, and runway?', 'Comment les variables clés affectent-elles la LTV, les marges et la trésorerie ?')}>
            {t('7. Sensitivity Analysis', '7. Analyse de sensibilité')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Variable', 'Variable')}</th>
                  <th className="text-center p-3 font-semibold text-red-500 border-b">{t('Worst', 'Pire')}</th>
                  <th className="text-center p-3 font-semibold text-gray-700 border-b">{t('Base', 'Base')}</th>
                  <th className="text-center p-3 font-semibold text-emerald-600 border-b">{t('Best', 'Meilleur')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Impact on LTV', 'Impact sur la LTV')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Impact on Runway', 'Impact sur la trésorerie')}</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.map((s, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-semibold text-gray-900 border-b border-gray-100">{s.variable}</td>
                    <td className="p-3 text-center font-mono text-red-500 border-b border-gray-100">{s.worst}</td>
                    <td className="p-3 text-center font-mono text-gray-700 border-b border-gray-100">{s.base}</td>
                    <td className="p-3 text-center font-mono text-emerald-600 border-b border-gray-100">{s.best}</td>
                    <td className="p-3 text-gray-600 border-b border-gray-100">{s.impactOnLTV}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{s.impactOnRunway}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 mb-1">{t('Sensitivity ranking — what matters most:', 'Classement de sensibilité — ce qui compte le plus :')}</h4>
            <p className="text-xs text-amber-700">
              {lang === 'fr' ? (
                <>
                  <strong>1. Attrition</strong> (1% de variation = 1 800€ d&apos;écart de LTV) &gt; <strong>2. ARPU</strong> (10€ de variation = 3x le revenu) &gt;
                  <strong> 3. Taux de croissance</strong> (détermine le moment du seuil de rentabilité) &gt; <strong>4. Coûts fixes</strong> (taille de l&apos;équipe) &gt;
                  <strong> 5. CAC</strong> (encore sain même à 2x). Le coût IA est la variable la moins sensible — même à 3,50€/mois, les marges sont de 77%.
                </>
              ) : (
                <>
                  <strong>1. Churn</strong> (1% change = €1,800 LTV swing) &gt; <strong>2. ARPU</strong> (€10 change = 3x revenue) &gt;
                  <strong> 3. Growth rate</strong> (determines break-even timing) &gt; <strong>4. Fixed costs</strong> (team size) &gt;
                  <strong> 5. CAC</strong> (still healthy even at 2x). AI cost is the least sensitive variable — even at €3.50/mo, margins are 77%.
                </>
              )}
            </p>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 8. KEY ASSUMPTIONS                                */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.4)}>
          <SectionTitle subtitle={t('Every assumption justified — nothing hand-waved', 'Chaque hypothèse justifiée — rien de flou')}>
            {t('8. Key Assumptions', '8. Hypothèses clés')}
          </SectionTitle>

          <div className="space-y-2">
            {assumptions.map((a, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{a.assumption}</span>
                    <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{a.value}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    a.risk.includes('Low') || a.risk.includes('Faible') ? 'bg-emerald-100 text-emerald-600' :
                    a.risk.includes('Medium') || a.risk.includes('Moyen') ? 'bg-amber-100 text-amber-600' :
                    'bg-red-100 text-red-600'
                  }`}>{a.risk} {t('risk', 'risque')}</span>
                </div>
                <p className="text-[10px] text-gray-500">{a.justification}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 9. BENCHMARKS                                     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.45)}>
          <SectionTitle subtitle={t('How Bloomsline metrics compare to SaaS industry standards', 'Comment les indicateurs de Bloomsline se comparent aux standards de l\'industrie SaaS')}>
            {t('9. Industry Benchmarks', '9. Références sectorielles')}
          </SectionTitle>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Metric', 'Indicateur')}</th>
                  <th className="text-center p-3 font-semibold text-indigo-600 border-b">Bloomsline</th>
                  <th className="text-center p-3 font-semibold text-gray-600 border-b">{t('SaaS Median', 'Médiane SaaS')}</th>
                  <th className="text-center p-3 font-semibold text-emerald-600 border-b">{t('Top Decile', 'Décile supérieur')}</th>
                  <th className="text-left p-3 font-semibold text-gray-700 border-b">{t('Verdict', 'Verdict')}</th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((b, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="p-3 font-semibold text-gray-900 border-b border-gray-100">{b.metric}</td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600 border-b border-gray-100">{b.bloomsline}</td>
                    <td className="p-3 text-center font-mono text-gray-600 border-b border-gray-100">{b.saasMedian}</td>
                    <td className="p-3 text-center font-mono text-emerald-600 border-b border-gray-100">{b.topDecile}</td>
                    <td className="p-3 text-gray-500 border-b border-gray-100">{b.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* 10. RED FLAGS                                     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.5)}>
          <SectionTitle subtitle={t('Numbers that should trigger immediate action — don\'t ignore these', 'Des chiffres qui doivent déclencher une action immédiate — ne les ignorez pas')}>
            {t('10. Red Flags — What Should Worry You', '10. Signaux d\'alerte — Ce qui doit vous inquiéter')}
          </SectionTitle>

          <div className="space-y-3">
            {redFlags.map((f, i) => (
              <div key={i} className="bg-white border-2 border-red-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h4 className="text-sm font-bold text-gray-900">{f.flag}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-mono">
                      {f.threshold}
                    </span>
                    <span className="text-[9px] text-gray-400">{f.checkAt}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">{f.whyDangerous}</p>
                <div className="p-2.5 bg-emerald-50 rounded-lg">
                  <p className="text-[10px] text-emerald-700">
                    <strong className="text-emerald-600">{t('Action:', 'Action :')}</strong> {f.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* SYNTHESIS                                         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <motion.section {...fadeUp(0.55)}>
          <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              {t('The Financial Verdict', 'Le verdict financier')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">{t('Why the numbers work', 'Pourquoi les chiffres fonctionnent')}</h4>
                <div className="space-y-2">
                  {[
                    { point: t('B2B2C multiplier is the moat', 'Le multiplicateur B2B2C est le fossé concurrentiel'), detail: t('€140 to acquire 1 practitioner who brings 10 members = €14 effective member CAC. B2C apps pay €30-50 per user. This is 2-3x more efficient — and the member arrives with trust already built through their practitioner.', '140€ pour acquérir 1 praticien qui amène 10 membres = 14€ de CAC effectif par membre. Les apps B2C paient 30-50€ par utilisateur. C\'est 2-3x plus efficace — et le membre arrive avec une confiance déjà établie via son praticien.') },
                    { point: t('Gross margin leaves room for everything', 'La marge brute laisse de la place pour tout'), detail: t('85% gross margin means €24.75 of every €29 is available for growth, team, and product. At 1,000 users, that\'s €24,750/mo to reinvest.', 'Une marge brute de 85% signifie que 24,75€ sur chaque 29€ sont disponibles pour la croissance, l\'équipe et le produit. À 1 000 utilisateurs, cela représente 24 750€/mois à réinvestir.') },
                    { point: t('Capital efficiency is modeled as exceptional', 'L\'efficacité du capital est modélisée comme exceptionnelle'), detail: t('€400-500K pre-seed projected to reach 850 practitioners and €296K ARR in 36 months (modeled). All projections — zero revenue today. Most SaaS startups burn 3-5x their raise.', '400-500K€ de pré-seed projetés pour atteindre 850 praticiens et 296K€ d\'ARR en 36 mois (modélisé). Tout est projeté — zéro revenu aujourd\'hui. La plupart des startups SaaS brûlent 3-5x leur levée.') },
                    { point: t('Path to profitability without Series A', 'Chemin vers la rentabilité sans Série A'), detail: t('Cash-flow positive at ~M29 with ~600 practitioners. No second raise required. Series A becomes optional — a growth accelerant, not survival.', 'Trésorerie positive à ~M29 avec ~600 praticiens. Pas de seconde levée nécessaire. La Série A devient optionnelle — un accélérateur de croissance, pas une question de survie.') },
                  ].map((p, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-semibold text-white">{p.point}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{p.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-3">{t('What to watch', 'Points de vigilance')}</h4>
                <div className="space-y-2">
                  {[
                    { concern: t('These are modeled numbers, not observed', 'Ce sont des chiffres modélisés, pas observés'), detail: t('Zero paying customers today. LTV, churn, and CAC are projections. The model is only as good as its assumptions. Validate every number within the first 90 days.', 'Zéro client payant aujourd\'hui. La LTV, l\'attrition et le CAC sont des projections. Le modèle ne vaut que par ses hypothèses. Validez chaque chiffre dans les 90 premiers jours.') },
                    { concern: t('Churn is the biggest unknown', 'L\'attrition est la plus grande inconnue'), detail: t('1% churn difference = €1,800 LTV swing = 50% revenue difference at M36. If churn is 7% instead of 4%, break-even moves from M24 to M32.', '1% de différence d\'attrition = 1 800€ d\'écart de LTV = 50% de différence de revenu à M36. Si l\'attrition est de 7% au lieu de 4%, le seuil de rentabilité passe de M24 à M32.') },
                    { concern: t('All metrics are modeled, not observed', 'Tous les indicateurs sont modélisés, pas observés'), detail: t('~5x LTV/CAC is projected. Zero paying customers. CAC, churn, and ARPU are assumptions. Expect CAC to rise to €80-100 at scale. The biggest unknown: will practitioners actually pay?', '~5x de LTV/CAC est projeté. Zéro client payant. Le CAC, l\'attrition et l\'ARPU sont des hypothèses. Attendez-vous à un CAC de 80-100€ à grande échelle. La plus grande inconnue : les praticiens paieront-ils réellement ?') },
                    { concern: t('Fixed costs will step up', 'Les coûts fixes vont augmenter par paliers'), detail: t('Team costs assumed flat at €8.6K/mo. First hire (€3K/mo) at 100 users. Second hire (€3.5K/mo) at 300 users. Budget accordingly.', 'Coûts d\'équipe supposés constants à 8,6K€/mois. Premier recrutement (3K€/mois) à 100 utilisateurs. Second recrutement (3,5K€/mois) à 300 utilisateurs. Budgétisez en conséquence.') },
                  ].map((c, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-semibold text-red-300">{c.concern}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{c.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                {lang === 'fr' ? (
                  <>
                    <strong className="text-white">En résumé :</strong> L&apos;économie unitaire modélisée est structurellement saine. ~83% de marge brute (projetée),
                    ~5x de LTV/CAC (modélisé), ~2 mois de retour sur investissement (projeté), et un chemin vers la rentabilité en 36 mois avec 400-500K€. Le modèle atteint
                    le seuil de rentabilité à ~347 praticiens (~M24) et génère 20K€+/trimestre de bénéfice à M36.
                    Le plus grand risque n&apos;est pas le modèle — c&apos;est de savoir si les praticiens paieront et si l&apos;effet réseau se matérialisera.
                    <strong className="text-emerald-400"> Si l&apos;attrition reste sous 5% et que vous atteignez 30 praticiens à M3, ce modèle commence à se valider.</strong>
                  </>
                ) : (
                  <>
                    <strong className="text-white">Bottom line:</strong> The modeled unit economics are structurally sound. ~83% gross margin (projected),
                    ~5x LTV/CAC (modeled), ~2-month payback (projected), and a path to profitability within 36 months on €400-500K. The model breaks
                    even at ~347 practitioners (~M24) and generates €20K+/quarter profit by M36.
                    The biggest risk isn&apos;t the model — it&apos;s whether practitioners will pay and the network effect materializes.
                    <strong className="text-emerald-400"> If churn stays below 5% and you hit 30 practitioners by M3, this model starts to validate.</strong>
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ── Footer ────────────────────────────────────── */}
        <motion.div
          {...fadeUp(0.6)}
          className="flex items-center gap-2 text-[10px] text-gray-400"
        >
          <Clock className="w-3 h-3" />
          <span>{t('Financial model as of Feb 2026', 'Modèle financier en date de février 2026')}</span>
          <span className="text-gray-200">|</span>
          <span>{t('Bloomsline Care — Unit Economics & 3-Year Projection', 'Bloomsline Care — Économie unitaire et projection sur 3 ans')}</span>
        </motion.div>
      </main>
    </div>
  )
}

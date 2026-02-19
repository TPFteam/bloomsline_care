'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Calculator,
  Users,
  DollarSign,
  Target,
  Zap,
  Flame,
  Rocket,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useLanguage } from '@/lib/i18n/context'

// ── Types ────────────────────────────────────────────────────────────────

interface Assumptions {
  startingPractitioners: number
  initialGrowthPct: number
  endGrowthPct: number
  churnPct: number
  pricePerMonth: number
  membersPerPractitioner: number
  cac: number
  teamCost: number
  infraCost: number
  marketingCost: number
  otherCost: number
  startingCash: number
  grossMarginPct: number
  useOfFunds: { product: number; gtm: number; team: number; ops: number }
}

interface MonthProjection {
  month: number
  label: string
  practitioners: number
  members: number
  growthRate: number
  mrr: number
  arr: number
  expenses: number
  teamExp: number
  infraExp: number
  marketingExp: number
  otherExp: number
  acquisitionExp: number
  netBurn: number
  cumulativeCash: number
  effectiveMemberCAC: number
}

interface UnitEconomics {
  arpu: number
  ltv: number
  cac: number
  ltvCacRatio: number
  paybackMonths: number
  grossMarginPct: number
  effectiveMemberCAC: number
}

interface RunwayInfo {
  runwayMonths: number
  breakEvenMonth: number | null
  arr100kMonth: number | null
  arr1mMonth: number | null
  m18Practitioners: number
  m18Arr: number
  monthlyBurn: number
}

// ── Scenario Presets ─────────────────────────────────────────────────────

// All scenarios start from 10 paying practitioners at time of raise close.
// Justification: 3-5 beta testers today → 10 paying users by close (~3-6 months of outreach).
// This signals validated willingness to pay and in-market momentum before capital deploys.
// Costs justified bottom-up:
//   Team = 2 founders (€1,500 each) + dev (equity + reduced salary) + expert (€1,000)
//   CAC is low (€50) — organic outreach/content/partnerships, no paid ads
//   Infra scales with users (Claude Haiku API is primary cost driver)
//   Gross margin assumes Haiku-primary for Bloom (~€1.80 AI cost per practitioner/mo)

const SCENARIOS: Record<string, Assumptions> = {
  conservative: {
    startingPractitioners: 10,
    initialGrowthPct: 20,
    endGrowthPct: 5,
    churnPct: 5,
    pricePerMonth: 25,
    membersPerPractitioner: 10,
    cac: 50,
    teamCost: 5000,    // 2 founders €3K + dev part-time €1.5K avg + expert €500 avg
    infraCost: 500,
    marketingCost: 800,
    otherCost: 400,
    startingCash: 250000,
    grossMarginPct: 90,
    useOfFunds: { product: 40, gtm: 25, team: 25, ops: 10 },
  },
  base: {
    startingPractitioners: 10,
    initialGrowthPct: 30,
    endGrowthPct: 7,
    churnPct: 4,
    pricePerMonth: 25,
    membersPerPractitioner: 12,
    cac: 50,
    teamCost: 6500,    // 2 founders €3K + dev equity+salary €2.5K + expert €1K
    infraCost: 700,
    marketingCost: 1000,
    otherCost: 400,
    startingCash: 300000,
    grossMarginPct: 90,
    useOfFunds: { product: 40, gtm: 30, team: 20, ops: 10 },
  },
  aggressive: {
    startingPractitioners: 10,
    initialGrowthPct: 35,
    endGrowthPct: 7,
    churnPct: 3,
    pricePerMonth: 25,
    membersPerPractitioner: 15,
    cac: 50,
    teamCost: 8000,    // 2 founders €3K + dev full €3.5K + expert €1K + marketer from M9
    infraCost: 1000,
    marketingCost: 1500,
    otherCost: 500,
    startingCash: 400000,
    grossMarginPct: 90,
    useOfFunds: { product: 35, gtm: 30, team: 25, ops: 10 },
  },
}

// ── Growth decay: linear interpolation from initial → end over 36 months ─

function growthAtMonth(m: number, initial: number, end: number): number {
  const t = (m - 1) / 35
  return initial + (end - initial) * t
}

// ── Calculation Functions ────────────────────────────────────────────────

function computeProjections(a: Assumptions): MonthProjection[] {
  const rows: MonthProjection[] = []
  // Use floats for accumulation — only round for display
  // This prevents small-number rounding from killing early-stage compounding
  let practFloat = a.startingPractitioners
  let cash = a.startingCash
  const arpu = a.pricePerMonth

  for (let m = 1; m <= 36; m++) {
    const growthRate = growthAtMonth(m, a.initialGrowthPct, a.endGrowthPct)
    const newPract = practFloat * (growthRate / 100)
    const churned = practFloat * (a.churnPct / 100)
    practFloat = Math.max(1, practFloat + newPract - churned)

    const practitioners = Math.round(practFloat)
    const members = Math.round(practFloat * a.membersPerPractitioner)
    const mrr = practFloat * arpu
    const arr = mrr * 12

    const acquisitionExp = newPract * a.cac
    const totalExpenses = a.teamCost + a.infraCost + a.marketingCost + a.otherCost + acquisitionExp
    const grossRevenue = mrr * (a.grossMarginPct / 100)
    const netBurn = grossRevenue - totalExpenses
    cash += netBurn

    const effectiveMemberCAC = a.membersPerPractitioner > 0 ? a.cac / a.membersPerPractitioner : a.cac

    rows.push({
      month: m,
      label: `M${m}`,
      practitioners,
      members,
      growthRate: Math.round(growthRate * 10) / 10,
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      expenses: Math.round(totalExpenses),
      teamExp: a.teamCost,
      infraExp: a.infraCost,
      marketingExp: a.marketingCost,
      otherExp: a.otherCost,
      acquisitionExp: Math.round(acquisitionExp),
      netBurn: Math.round(netBurn),
      cumulativeCash: Math.round(cash),
      effectiveMemberCAC: Math.round(effectiveMemberCAC * 100) / 100,
    })
  }

  return rows
}

function computeUnitEconomics(a: Assumptions): UnitEconomics {
  const arpu = a.pricePerMonth
  const churnRate = a.churnPct / 100
  const avgLifetimeMonths = churnRate > 0 ? 1 / churnRate : 100
  const ltv = arpu * avgLifetimeMonths * (a.grossMarginPct / 100)
  const ltvCacRatio = a.cac > 0 ? ltv / a.cac : 0
  const monthlyGrossProfit = arpu * (a.grossMarginPct / 100)
  const paybackMonths = monthlyGrossProfit > 0 ? a.cac / monthlyGrossProfit : 0
  const effectiveMemberCAC = a.membersPerPractitioner > 0 ? a.cac / a.membersPerPractitioner : a.cac

  return {
    arpu: Math.round(arpu * 100) / 100,
    ltv: Math.round(ltv),
    cac: a.cac,
    ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    grossMarginPct: a.grossMarginPct,
    effectiveMemberCAC: Math.round(effectiveMemberCAC),
  }
}

function computeRunway(projections: MonthProjection[], startingCash: number): RunwayInfo {
  let breakEvenMonth: number | null = null
  let arr100kMonth: number | null = null
  let arr1mMonth: number | null = null
  let runwayMonths = 36

  for (const p of projections) {
    if (breakEvenMonth === null && p.netBurn >= 0) breakEvenMonth = p.month
    if (arr100kMonth === null && p.arr >= 100000) arr100kMonth = p.month
    if (arr1mMonth === null && p.arr >= 1000000) arr1mMonth = p.month
    if (p.cumulativeCash <= 0 && runwayMonths === 36) runwayMonths = p.month
  }

  const m18 = projections[17] || projections[projections.length - 1]
  const firstMonth = projections[0]
  const monthlyBurn = firstMonth ? Math.abs(firstMonth.netBurn) : 0

  return {
    runwayMonths,
    breakEvenMonth,
    arr100kMonth,
    arr1mMonth,
    m18Practitioners: m18.practitioners,
    m18Arr: m18.arr,
    monthlyBurn,
  }
}

// ── Formatters ───────────────────────────────────────────────────────────

function fmtEuro(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `€${(value / 1_000).toFixed(0)}K`
  return `€${value.toFixed(0)}`
}

function fmtNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

// ── Chart Tooltips ───────────────────────────────────────────────────────

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-indigo-600">MRR: {fmtEuro(d.mrr)}</p>
      <p className="text-gray-500">ARR: {fmtEuro(d.arr)}</p>
      <p className="text-gray-400">Growth: {d.growthRate}%/mo</p>
    </div>
  )
}

function GrowthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-blue-600">Practitioners: {d.practitioners}</p>
      <p className="text-emerald-600">Members: {d.members}</p>
      <p className="text-gray-400">Growth: {d.growthRate}%/mo</p>
    </div>
  )
}

function ExpenseTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-blue-600">Team: {fmtEuro(d.teamExp)}</p>
      <p className="text-violet-600">Infra: {fmtEuro(d.infraExp)}</p>
      <p className="text-amber-600">Marketing: {fmtEuro(d.marketingExp)}</p>
      <p className="text-gray-500">Other: {fmtEuro(d.otherExp)}</p>
      <p className="text-orange-600">Acquisition: {fmtEuro(d.acquisitionExp)}</p>
      <p className="font-medium text-gray-900 mt-1 pt-1 border-t border-gray-100">Total: {fmtEuro(d.expenses)}</p>
    </div>
  )
}

function RunwayTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-emerald-600">Cash: {fmtEuro(d.cumulativeCash)}</p>
      <p className="text-gray-500">Net burn: {fmtEuro(d.netBurn)}</p>
    </div>
  )
}

// ── Input Components ─────────────────────────────────────────────────────

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  prefix = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
  prefix?: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700 tabular-nums">
          {prefix}{typeof step === 'number' && step < 1 ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
      />
    </div>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  prefix = '',
  suffix = '',
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(max !== undefined ? Math.min(v, max) : v)
          }}
          className="w-full px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 tabular-nums"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function FinancialModelPage() {
  const { locale } = useLanguage()
  const [scenario, setScenario] = useState<'conservative' | 'base' | 'aggressive'>('base')
  const [assumptions, setAssumptions] = useState<Assumptions>(SCENARIOS.base)

  const setScenarioPreset = useCallback((s: 'conservative' | 'base' | 'aggressive') => {
    setScenario(s)
    setAssumptions(SCENARIOS[s])
  }, [])

  const updateAssumption = useCallback(<K extends keyof Assumptions>(key: K, value: Assumptions[K]) => {
    setAssumptions((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Derived data
  const projections = useMemo(() => computeProjections(assumptions), [assumptions])
  const unitEconomics = useMemo(() => computeUnitEconomics(assumptions), [assumptions])
  const runway = useMemo(() => computeRunway(projections, assumptions.startingCash), [projections, assumptions.startingCash])

  const lastMonth = projections[35]
  const m18 = projections[17]

  // Chart data — sample every 3 months for bar chart readability
  const barChartData = useMemo(
    () => projections.filter((_, i) => i % 3 === 2),
    [projections],
  )

  const t = {
    title: locale === 'fr' ? 'Modèle financier' : locale === 'es' ? 'Modelo financiero' : 'Financial Model',
    conservative: locale === 'fr' ? 'Prudent' : locale === 'es' ? 'Conservador' : 'Conservative',
    base: locale === 'fr' ? 'Base' : locale === 'es' ? 'Base' : 'Base',
    aggressive: locale === 'fr' ? 'Ambitieux' : locale === 'es' ? 'Agresivo' : 'Aggressive',
    growth: locale === 'fr' ? 'Croissance' : locale === 'es' ? 'Crecimiento' : 'Growth',
    revenue: locale === 'fr' ? 'Revenus' : locale === 'es' ? 'Ingresos' : 'Revenue',
    costs: locale === 'fr' ? 'Coûts' : locale === 'es' ? 'Costos' : 'Costs',
    funding: locale === 'fr' ? 'Financement' : locale === 'es' ? 'Financiación' : 'Funding',
    assumptions: locale === 'fr' ? 'Hypothèses' : locale === 'es' ? 'Supuestos' : 'Assumptions',
    startingPractitioners: locale === 'fr' ? 'Praticiens initiaux' : locale === 'es' ? 'Practicantes iniciales' : 'Starting practitioners',
    initialGrowth: locale === 'fr' ? 'Croissance initiale' : locale === 'es' ? 'Crecimiento inicial' : 'Initial growth (M1)',
    endGrowth: locale === 'fr' ? 'Croissance finale' : locale === 'es' ? 'Crecimiento final' : 'Mature growth (M36)',
    churn: locale === 'fr' ? 'Attrition mensuelle' : locale === 'es' ? 'Deserción mensual' : 'Monthly churn',
    membersPerPractitioner: locale === 'fr' ? 'Membres/praticien' : locale === 'es' ? 'Miembros/practicante' : 'Members/practitioner',
    cacLabel: 'CAC',
    team: locale === 'fr' ? 'Équipe' : locale === 'es' ? 'Equipo' : 'Team',
    infra: locale === 'fr' ? 'Infrastructure' : locale === 'es' ? 'Infraestructura' : 'Infrastructure',
    marketing: 'Marketing',
    other: locale === 'fr' ? 'Autres' : locale === 'es' ? 'Otros' : 'Other',
    startingCash: locale === 'fr' ? 'Trésorerie initiale' : locale === 'es' ? 'Caja inicial' : 'Seed raise',
    grossMargin: locale === 'fr' ? 'Marge brute' : locale === 'es' ? 'Margen bruto' : 'Gross margin',
    practitionersLabel: locale === 'fr' ? 'Praticiens' : locale === 'es' ? 'Practicantes' : 'Practitioners',
    monthLabel: locale === 'fr' ? 'mois' : locale === 'es' ? 'mes' : 'mo',
    never: locale === 'fr' ? '> 36 mois' : locale === 'es' ? '> 36 meses' : '> 36 months',
  }

  const scenarioButtons: Array<{ key: 'conservative' | 'base' | 'aggressive'; label: string }> = [
    { key: 'conservative', label: t.conservative },
    { key: 'base', label: t.base },
    { key: 'aggressive', label: t.aggressive },
  ]

  // Use of funds data
  const uof = assumptions.useOfFunds
  const fundSegments = [
    { label: 'Product', pct: uof.product, color: 'bg-indigo-500', amount: Math.round(assumptions.startingCash * uof.product / 100) },
    { label: 'Go-to-market', pct: uof.gtm, color: 'bg-emerald-500', amount: Math.round(assumptions.startingCash * uof.gtm / 100) },
    { label: 'Team', pct: uof.team, color: 'bg-blue-500', amount: Math.round(assumptions.startingCash * uof.team / 100) },
    { label: 'Operations', pct: uof.ops, color: 'bg-gray-400', amount: Math.round(assumptions.startingCash * uof.ops / 100) },
  ]

  // Path to Series A milestones
  const milestones = [
    { label: locale === 'fr' ? 'Levée Seed' : 'Seed Raise', value: fmtEuro(assumptions.startingCash), done: true, month: 'Now' },
    { label: '€100K ARR', value: runway.arr100kMonth ? `M${runway.arr100kMonth}` : t.never, done: false, month: runway.arr100kMonth ? `Month ${runway.arr100kMonth}` : '' },
    { label: locale === 'fr' ? 'Rentabilité' : 'Break-even', value: runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never, done: false, month: runway.breakEvenMonth ? `Month ${runway.breakEvenMonth}` : '' },
    { label: locale === 'fr' ? 'Prêt Série A' : 'Series A Ready', value: `${fmtNumber(m18.practitioners)} pract.`, done: false, month: 'M18 target' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{t.title}</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care</p>
          </div>
        </div>
        {/* Scenario Toggle — in header for always-visible access */}
        <div className="flex items-center gap-1.5">
          {scenarioButtons.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenarioPreset(s.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                scenario === s.key
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <div className="p-8">
          {/* ─── The Pitch — Narrative Summary ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
          >
            {(() => {
              const seriesAReady = m18.arr >= 100000
              const positionText = seriesAReady
                ? (locale === 'fr' ? 'une position crédible pour la Série A' : 'a credible Series A position')
                : (locale === 'fr' ? 'une base solide pour accélérer ou lever un bridge' : 'a solid foundation to accelerate or raise a bridge')

              return locale === 'fr' ? (
                <p className="text-sm text-gray-600 leading-relaxed">
                  Nous levons <span className="font-semibold text-gray-900">{fmtEuro(assumptions.startingCash)}</span>. À un burn de <span className="font-semibold text-gray-900">{fmtEuro(runway.monthlyBurn)}/mois</span>, cela nous donne <span className="font-semibold text-gray-900">{runway.runwayMonths}+ mois</span> de trésorerie. En 18 mois, nous visons <span className="font-semibold text-gray-900">{fmtNumber(m18.practitioners)} praticiens</span> et <span className="font-semibold text-gray-900">{fmtEuro(m18.arr)} ARR</span> — {positionText}. Nos marges sont de <span className="font-semibold text-emerald-600">{assumptions.grossMarginPct}%</span>, LTV/CAC de <span className="font-semibold text-emerald-600">{unitEconomics.ltvCacRatio}x</span>, remboursement en <span className="font-semibold text-emerald-600">{unitEconomics.paybackMonths} mois</span>.
                </p>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  We&apos;re raising <span className="font-semibold text-gray-900">{fmtEuro(assumptions.startingCash)}</span>. At a burn rate of <span className="font-semibold text-gray-900">{fmtEuro(runway.monthlyBurn)}/mo</span>, that&apos;s <span className="font-semibold text-gray-900">{runway.runwayMonths}+ months</span> of runway. In 18 months, we target <span className="font-semibold text-gray-900">{fmtNumber(m18.practitioners)} practitioners</span> and <span className="font-semibold text-gray-900">{fmtEuro(m18.arr)} ARR</span> — {positionText}. Our unit economics: <span className="font-semibold text-emerald-600">{assumptions.grossMarginPct}% gross margin</span>, <span className="font-semibold text-emerald-600">{unitEconomics.ltvCacRatio}x LTV/CAC</span>, <span className="font-semibold text-emerald-600">{unitEconomics.paybackMonths}{t.monthLabel} payback</span>.
                </p>
              )
            })()}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Assumptions Panel (Sticky) ──────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-4 xl:col-span-3"
            >
              <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-[73px] max-h-[calc(100vh-92px)] overflow-y-auto">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">{t.assumptions}</h2>

                {/* Growth */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.growth}</h3>
                  <div className="space-y-3">
                    <NumberInput
                      label={t.startingPractitioners}
                      value={assumptions.startingPractitioners}
                      onChange={(v) => updateAssumption('startingPractitioners', Math.max(1, v))}
                      min={1}
                      max={100}
                    />
                    <SliderInput
                      label={t.initialGrowth}
                      value={assumptions.initialGrowthPct}
                      onChange={(v) => updateAssumption('initialGrowthPct', v)}
                      min={5}
                      max={50}
                      suffix="%"
                    />
                    <SliderInput
                      label={t.endGrowth}
                      value={assumptions.endGrowthPct}
                      onChange={(v) => updateAssumption('endGrowthPct', v)}
                      min={1}
                      max={15}
                      suffix="%"
                    />
                    <SliderInput
                      label={t.churn}
                      value={assumptions.churnPct}
                      onChange={(v) => updateAssumption('churnPct', v)}
                      min={0}
                      max={15}
                      suffix="%"
                    />
                  </div>
                </div>

                {/* Revenue */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.revenue}</h3>
                  <div className="space-y-3">
                    <NumberInput
                      label={locale === 'fr' ? 'Prix / praticien' : 'Price / practitioner'}
                      value={assumptions.pricePerMonth}
                      onChange={(v) => updateAssumption('pricePerMonth', Math.max(1, v))}
                      prefix="€"
                      suffix="/mo"
                    />
                    <SliderInput
                      label={t.membersPerPractitioner}
                      value={assumptions.membersPerPractitioner}
                      onChange={(v) => updateAssumption('membersPerPractitioner', v)}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>

                {/* Costs */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.costs}</h3>
                  <div className="space-y-3">
                    <NumberInput
                      label={t.cacLabel}
                      value={assumptions.cac}
                      onChange={(v) => updateAssumption('cac', Math.max(0, v))}
                      prefix="€"
                    />
                    <NumberInput
                      label={`${t.team} (/mo)`}
                      value={assumptions.teamCost}
                      onChange={(v) => updateAssumption('teamCost', Math.max(0, v))}
                      prefix="€"
                    />
                    <NumberInput
                      label={`${t.infra} (/mo)`}
                      value={assumptions.infraCost}
                      onChange={(v) => updateAssumption('infraCost', Math.max(0, v))}
                      prefix="€"
                    />
                    <NumberInput
                      label={`${t.marketing} (/mo)`}
                      value={assumptions.marketingCost}
                      onChange={(v) => updateAssumption('marketingCost', Math.max(0, v))}
                      prefix="€"
                    />
                    <NumberInput
                      label={`${t.other} (/mo)`}
                      value={assumptions.otherCost}
                      onChange={(v) => updateAssumption('otherCost', Math.max(0, v))}
                      prefix="€"
                    />
                  </div>
                </div>

                {/* Funding */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.funding}</h3>
                  <div className="space-y-3">
                    <NumberInput
                      label={t.startingCash}
                      value={assumptions.startingCash}
                      onChange={(v) => updateAssumption('startingCash', Math.max(0, v))}
                      prefix="€"
                    />
                    <SliderInput
                      label={t.grossMargin}
                      value={assumptions.grossMarginPct}
                      onChange={(v) => updateAssumption('grossMarginPct', v)}
                      min={50}
                      max={98}
                      suffix="%"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── Output Panel ────────────────────────────────────────── */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">

              {/* Burn Rate + Runway + Use of Funds — top priority */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {/* Monthly Burn Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Monthly Burn & Runway</span>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <p className="text-2xl font-bold text-gray-900">{fmtEuro(runway.monthlyBurn)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                    <span className="text-gray-300">|</span>
                    <p className="text-lg font-bold text-gray-900">{runway.runwayMonths}<span className="text-sm font-normal text-gray-400"> months</span></p>
                  </div>
                  {/* Runway bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full ${runway.runwayMonths >= 24 ? 'bg-emerald-400' : runway.runwayMonths >= 18 ? 'bg-amber-400' : 'bg-red-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((runway.runwayMonths / 36) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>M0</span>
                    <span className="font-medium text-gray-500">
                      {runway.runwayMonths >= 18 ? 'Seed window covered (18mo+)' : 'Warning: < 18mo runway'}
                    </span>
                    <span>M36</span>
                  </div>
                </div>

                {/* Use of Funds */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Use of Funds — {fmtEuro(assumptions.startingCash)}</span>
                  </div>
                  {/* Stacked bar */}
                  <div className="flex h-3 rounded-full overflow-hidden mb-4">
                    {fundSegments.map((s) => (
                      <motion.div
                        key={s.label}
                        className={`${s.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {fundSegments.map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                        <span className="text-xs font-semibold text-gray-700 ml-auto tabular-nums">{fmtEuro(s.amount)}</span>
                        <span className="text-[10px] text-gray-400">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Path to Series A */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Rocket className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-medium text-gray-900">Path to Series A</h3>
                  <span className="text-[10px] text-gray-400 ml-1">18-month seed window</span>
                </div>
                <div className="flex items-center gap-0">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-center flex-1">
                      <div className="flex flex-col items-center text-center flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                          m.done ? 'bg-emerald-500' : 'bg-gray-100'
                        }`}>
                          {m.done ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">{i + 1}</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-900">{m.label}</p>
                        <p className="text-xs font-bold text-indigo-600">{m.value}</p>
                        <p className="text-[10px] text-gray-400">{m.month}</p>
                      </div>
                      {i < milestones.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 -mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics — 4 cards */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-xs text-gray-500">MRR @ M18</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{fmtEuro(m18.mrr)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">M36: {fmtEuro(lastMonth.mrr)} ({fmtEuro(lastMonth.arr)} ARR)</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500">{t.practitionersLabel} @ M18</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{fmtNumber(m18.practitioners)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">M36: {fmtNumber(lastMonth.practitioners)} ({fmtNumber(lastMonth.members)} members)</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-gray-500">LTV/CAC</span>
                  </div>
                  <p className={`text-xl font-bold ${unitEconomics.ltvCacRatio >= 3 ? 'text-emerald-600' : unitEconomics.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                    {unitEconomics.ltvCacRatio}x
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{unitEconomics.ltvCacRatio >= 3 ? 'Healthy (target: >3x)' : 'Below target (>3x)'}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-xs text-gray-500">Break-even</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{runway.runwayMonths} months runway</p>
                </div>
              </motion.div>

              {/* B2B2C Advantage — the moat visual */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 border border-indigo-100/50 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">B2B2C Advantage — Why Our CAC is Different</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">€{unitEconomics.cac}</p>
                    <p className="text-xs text-gray-500 mt-1">Practitioner CAC</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>1 practitioner</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-semibold text-gray-600">{assumptions.membersPerPractitioner} members</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Members onboarded by practitioner — zero acquisition cost</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">€{unitEconomics.effectiveMemberCAC}</p>
                    <p className="text-xs text-gray-500 mt-1">Effective member CAC</p>
                    <p className="text-[10px] text-gray-400">vs. €30-50 for B2C apps</p>
                  </div>
                </div>
              </motion.div>

              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Revenue Projection</h3>
                <p className="text-xs text-gray-400 mb-4">MRR over 36 months — growth tapers from {assumptions.initialGrowthPct}% to {assumptions.endGrowthPct}%/mo</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtEuro(v)} width={50} />
                      <Tooltip content={<RevenueTooltip />} cursor={false} />
                      {/* M18 seed window marker */}
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'M18', position: 'top', fontSize: 9, fill: '#6366f1' }} />
                      <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Customer Growth Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Customer Growth</h3>
                <p className="text-xs text-gray-400 mb-4">Practitioners and members (B2B2C multiplier: 1 pract. = {assumptions.membersPerPractitioner} members)</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id="practGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtNumber(v)} width={50} />
                      <Tooltip content={<GrowthTooltip />} cursor={false} />
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} />
                      <Area type="monotone" dataKey="members" stroke="#10b981" strokeWidth={2} fill="url(#memberGrad)" dot={false} />
                      <Area type="monotone" dataKey="practitioners" stroke="#3b82f6" strokeWidth={2} fill="url(#practGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> {t.practitionersLabel}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Members
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-1 h-3 border-l border-dashed border-indigo-400" /> M18 seed window
                  </span>
                </div>
              </motion.div>

              {/* Unit Economics — 6 cards */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">Unit Economics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">ARPU</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{unitEconomics.arpu}</p>
                    <p className="text-[10px] text-gray-400">/practitioner/mo</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">LTV</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{fmtEuro(unitEconomics.ltv)}</p>
                    <p className="text-[10px] text-gray-400">lifetime value</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">CAC</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{unitEconomics.cac}</p>
                    <p className="text-[10px] text-gray-400">acquisition cost</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">LTV/CAC</span>
                    <p className={`text-lg font-bold mt-1 ${unitEconomics.ltvCacRatio >= 3 ? 'text-emerald-600' : unitEconomics.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {unitEconomics.ltvCacRatio}x
                    </p>
                    <p className="text-[10px] text-gray-400">target: &gt;3x</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">Payback</span>
                    <p className={`text-lg font-bold mt-1 ${unitEconomics.paybackMonths <= 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {unitEconomics.paybackMonths} {t.monthLabel}
                    </p>
                    <p className="text-[10px] text-gray-400">target: &lt;12mo</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">Gross Margin</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{unitEconomics.grossMarginPct}%</p>
                    <p className="text-[10px] text-gray-400">SaaS benchmark: 70%+</p>
                  </div>
                </div>
              </motion.div>

              {/* Expense Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Expense Breakdown</h3>
                <p className="text-xs text-gray-400 mb-4">Quarterly expenses by category</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtEuro(v)} width={50} />
                      <Tooltip content={<ExpenseTooltip />} cursor={false} />
                      <Bar dataKey="teamExp" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Team" />
                      <Bar dataKey="infraExp" stackId="a" fill="#8b5cf6" name="Infra" />
                      <Bar dataKey="marketingExp" stackId="a" fill="#f59e0b" name="Marketing" />
                      <Bar dataKey="otherExp" stackId="a" fill="#9ca3af" name="Other" />
                      <Bar dataKey="acquisitionExp" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} name="Acquisition" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-blue-500" />{t.team}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-violet-500" />{t.infra}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-500" />{t.marketing}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400" />{t.other}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-orange-500" />CAC</span>
                </div>
              </motion.div>

              {/* Runway & Cash */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Runway & Cash Position</h3>
                <p className="text-xs text-gray-400 mb-4">Cumulative cash with milestones</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projections} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} interval={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtEuro(v)} width={55} />
                      <Tooltip content={<RunwayTooltip />} cursor={false} />
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Seed window', position: 'top', fontSize: 9, fill: '#6366f1' }} />
                      {runway.breakEvenMonth && (
                        <ReferenceLine x={`M${runway.breakEvenMonth}`} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Break-even', position: 'top', fontSize: 9, fill: '#10b981' }} />
                      )}
                      {runway.arr100kMonth && (
                        <ReferenceLine x={`M${runway.arr100kMonth}`} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} label={{ value: '€100K ARR', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
                      )}
                      <Area type="monotone" dataKey="cumulativeCash" stroke="#10b981" strokeWidth={2} fill="url(#cashGrad)" dot={false} activeDot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

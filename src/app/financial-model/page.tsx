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
  ArrowDown,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Info,
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

// ── Constants ────────────────────────────────────────────────────────────

const TIER_PRICES = { essentiel: 19, pro: 29, cabinet: 49 }
const MEMBER_PREMIUM = 3 // €3/mo for premium members

// Variable cost breakdown proportions (of total €4.25)
const VC_AI_SHARE = 1.80 / 4.25     // 42.4%
const VC_INFRA_SHARE = 0.95 / 4.25  // 22.4% (Supabase + Hosting + PostHog + Email)
const VC_SUPPORT_SHARE = 1.50 / 4.25 // 35.3%

// ── Types ────────────────────────────────────────────────────────────────

interface Assumptions {
  startingPractitioners: number
  initialGrowthPct: number
  endGrowthPct: number
  churnPct: number
  essentielPct: number
  proPct: number
  // cabinetPct = 100 - essentielPct - proPct
  membersPerPractitioner: number
  memberPremiumPct: number // % of members converting to €3/mo
  variableCostPerPract: number
  cac: number
  teamCost: number
  infraCost: number
  marketingCost: number
  otherCost: number
  startingCash: number
  dilutionPct: number
  useOfFunds: { product: number; gtm: number; team: number; ops: number }
}

interface MonthProjection {
  month: number
  label: string
  practitioners: number
  members: number
  growthRate: number
  b2bMrr: number
  b2cMrr: number
  mrr: number
  arr: number
  variableCosts: number
  grossProfit: number
  grossMarginPct: number
  expenses: number
  teamExp: number
  infraExp: number
  marketingExp: number
  otherExp: number
  acquisitionExp: number
  netBurn: number
  cumulativeCash: number
}

interface UnitEconomics {
  blendedArpu: number
  b2cRevenuePerPract: number
  totalArpu: number
  variableCost: number
  grossMarginPct: number
  contributionMargin: number
  ltv: number
  cac: number
  ltvCacRatio: number
  paybackMonths: number
  effectiveMemberCAC: number
}

interface RunwayInfo {
  runwayMonths: number
  breakEvenMonth: number | null
  breakEvenPractitioners: number | null
  arr100kMonth: number | null
  arr1mMonth: number | null
  m18Practitioners: number
  m18Arr: number
  monthlyBurn: number
}

// ── Scenario Presets ─────────────────────────────────────────────────────
// Conservative: mostly Essentiel tier, higher churn, smaller raise
// Base: Pro-heavy mix matching unit-economics analysis
// Aggressive: Cabinet-heavy with premium conversion upside

// Scenario presets — all include livable founder salaries so founders can work full-time.
// Conservative = scrape by (€2K each). Base = focused (€2.5K each). Aggressive = comfortable (€3K each).
const SCENARIOS: Record<string, Assumptions> = {
  conservative: {
    startingPractitioners: 10,
    initialGrowthPct: 20,
    endGrowthPct: 5,
    churnPct: 5,
    essentielPct: 55,
    proPct: 35,
    membersPerPractitioner: 10,
    memberPremiumPct: 3,
    variableCostPerPract: 4.25,
    cac: 60,
    teamCost: 8000,    // 2 founders (€4K) + dev part-time (€2K) + sales (€1.5K) + expert (€500)
    infraCost: 100,
    marketingCost: 800,
    otherCost: 500,
    startingCash: 300000,
    dilutionPct: 17,
    useOfFunds: { product: 40, gtm: 25, team: 25, ops: 10 },
  },
  base: {
    startingPractitioners: 10,
    initialGrowthPct: 30,
    endGrowthPct: 7,
    churnPct: 4,
    essentielPct: 20,
    proPct: 70,
    membersPerPractitioner: 12,
    memberPremiumPct: 5,
    variableCostPerPract: 4.25,
    cac: 50,
    teamCost: 10500,   // 2 founders (€5K) + dev (€2.5K) + sales (€2K) + expert (€1K)
    infraCost: 200,
    marketingCost: 1200,
    otherCost: 700,
    startingCash: 400000,
    dilutionPct: 15,
    useOfFunds: { product: 40, gtm: 30, team: 20, ops: 10 },
  },
  aggressive: {
    startingPractitioners: 10,
    initialGrowthPct: 35,
    endGrowthPct: 7,
    churnPct: 3,
    essentielPct: 10,
    proPct: 55,
    membersPerPractitioner: 15,
    memberPremiumPct: 8,
    variableCostPerPract: 4.25,
    cac: 50,
    teamCost: 14500,   // 2 founders (€6K) + dev full-time (€3.5K) + sales (€2.5K) + expert (€1K) + marketer (€1.5K)
    infraCost: 300,
    marketingCost: 2000,
    otherCost: 1000,
    startingCash: 500000,
    dilutionPct: 13,
    useOfFunds: { product: 35, gtm: 30, team: 25, ops: 10 },
  },
}

// ── Derived Helpers ──────────────────────────────────────────────────────

function getCabinetPct(a: Assumptions): number {
  return Math.max(0, 100 - a.essentielPct - a.proPct)
}

function getBlendedArpu(a: Assumptions): number {
  const cab = getCabinetPct(a)
  return (a.essentielPct / 100) * TIER_PRICES.essentiel +
         (a.proPct / 100) * TIER_PRICES.pro +
         (cab / 100) * TIER_PRICES.cabinet
}

function getGrossMarginPct(arpu: number, vc: number): number {
  return arpu > 0 ? ((arpu - vc) / arpu) * 100 : 0
}

function growthAtMonth(m: number, initial: number, end: number): number {
  const t = (m - 1) / 35
  return initial + (end - initial) * t
}

// ── Calculation Functions ────────────────────────────────────────────────

function computeProjections(a: Assumptions): MonthProjection[] {
  const rows: MonthProjection[] = []
  let practFloat = a.startingPractitioners
  let cash = a.startingCash
  const arpu = getBlendedArpu(a)
  const b2cRevPerPract = a.membersPerPractitioner * (a.memberPremiumPct / 100) * MEMBER_PREMIUM
  const gm = getGrossMarginPct(arpu, a.variableCostPerPract) / 100

  for (let m = 1; m <= 36; m++) {
    const growthRate = growthAtMonth(m, a.initialGrowthPct, a.endGrowthPct)
    const newPract = practFloat * (growthRate / 100)
    const churned = practFloat * (a.churnPct / 100)
    practFloat = Math.max(1, practFloat + newPract - churned)

    const practitioners = Math.round(practFloat)
    const members = Math.round(practFloat * a.membersPerPractitioner)
    const b2bMrr = practFloat * arpu
    const b2cMrr = practFloat * b2cRevPerPract
    const mrr = b2bMrr + b2cMrr
    const arr = mrr * 12

    const variableCosts = practFloat * a.variableCostPerPract
    const grossProfit = b2bMrr * gm + b2cMrr * 0.95 // B2C near-zero variable cost
    const gpPct = mrr > 0 ? (grossProfit / mrr) * 100 : 0

    const acquisitionExp = newPract * a.cac
    const fixedCosts = a.teamCost + a.infraCost + a.marketingCost + a.otherCost
    const totalExpenses = fixedCosts + acquisitionExp
    const netBurn = grossProfit - totalExpenses
    cash += netBurn

    rows.push({
      month: m,
      label: `M${m}`,
      practitioners,
      members,
      growthRate: Math.round(growthRate * 10) / 10,
      b2bMrr: Math.round(b2bMrr),
      b2cMrr: Math.round(b2cMrr),
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      variableCosts: Math.round(variableCosts),
      grossProfit: Math.round(grossProfit),
      grossMarginPct: Math.round(gpPct * 10) / 10,
      expenses: Math.round(totalExpenses + variableCosts),
      teamExp: a.teamCost,
      infraExp: a.infraCost,
      marketingExp: a.marketingCost,
      otherExp: a.otherCost,
      acquisitionExp: Math.round(acquisitionExp),
      netBurn: Math.round(netBurn),
      cumulativeCash: Math.round(cash),
    })
  }
  return rows
}

function computeUnitEconomics(a: Assumptions): UnitEconomics {
  const arpu = getBlendedArpu(a)
  const b2cRev = a.membersPerPractitioner * (a.memberPremiumPct / 100) * MEMBER_PREMIUM
  const totalArpu = arpu + b2cRev
  const gm = getGrossMarginPct(arpu, a.variableCostPerPract) / 100
  const grossProfit = arpu * gm
  const churnRate = a.churnPct / 100
  const avgLifetime = churnRate > 0 ? 1 / churnRate : 100
  const ltv = totalArpu * avgLifetime * gm
  const ltvCacRatio = a.cac > 0 ? ltv / a.cac : 0
  const payback = grossProfit > 0 ? a.cac / grossProfit : 0
  const effectiveMemberCAC = a.membersPerPractitioner > 0 ? a.cac / a.membersPerPractitioner : a.cac
  const contributionMargin = grossProfit - (a.cac / avgLifetime)

  return {
    blendedArpu: Math.round(arpu * 100) / 100,
    b2cRevenuePerPract: Math.round(b2cRev * 100) / 100,
    totalArpu: Math.round(totalArpu * 100) / 100,
    variableCost: a.variableCostPerPract,
    grossMarginPct: Math.round(gm * 1000) / 10,
    contributionMargin: Math.round(contributionMargin * 100) / 100,
    ltv: Math.round(ltv),
    cac: a.cac,
    ltvCacRatio: Math.round(ltvCacRatio * 10) / 10,
    paybackMonths: Math.round(payback * 10) / 10,
    effectiveMemberCAC: Math.round(effectiveMemberCAC),
  }
}

function computeRunway(projections: MonthProjection[]): RunwayInfo {
  let breakEvenMonth: number | null = null
  let breakEvenPractitioners: number | null = null
  let arr100kMonth: number | null = null
  let arr1mMonth: number | null = null
  let runwayMonths = 36

  for (const p of projections) {
    if (breakEvenMonth === null && p.netBurn >= 0) {
      breakEvenMonth = p.month
      breakEvenPractitioners = p.practitioners
    }
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
    breakEvenPractitioners,
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
      <p className="text-violet-500">B2B: {fmtEuro(d.b2bMrr)} | B2C: {fmtEuro(d.b2cMrr)}</p>
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
      <p className="text-rose-600">COGS: {fmtEuro(d.variableCosts)}</p>
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
      <p className="text-gray-400">Margin: {d.grossMarginPct}%</p>
    </div>
  )
}

// ── Input Components ─────────────────────────────────────────────────────

function InfoButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center transition-colors shrink-0 ${
        open ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      }`}
    >
      <Info className="w-2 h-2" />
    </button>
  )
}

function InfoPanel({ text }: { text: string }) {
  return (
    <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 border border-gray-100 rounded-lg p-2">{text}</p>
  )
}

function SliderInput({
  label, value, onChange, min, max, step = 1, suffix = '', prefix = '', info,
}: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step?: number; suffix?: string; prefix?: string; info?: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {label}
          {info && <InfoButton open={showInfo} onClick={() => setShowInfo(!showInfo)} />}
        </span>
        <span className="text-xs font-semibold text-gray-700 tabular-nums">
          {prefix}{typeof step === 'number' && step < 1 ? value.toFixed(2) : value}{suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
      />
      {showInfo && info && <InfoPanel text={info} />}
    </div>
  )
}

function NumberInput({
  label, value, onChange, min = 0, max, prefix = '', suffix = '', info,
}: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; prefix?: string; suffix?: string; info?: string
}) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="space-y-1">
      <span className="text-xs text-gray-500 flex items-center gap-1">
        {label}
        {info && <InfoButton open={showInfo} onClick={() => setShowInfo(!showInfo)} />}
      </span>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
        <input
          type="number" min={min} max={max} value={value}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(max !== undefined ? Math.min(v, max) : v)
          }}
          className="w-full px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 tabular-nums"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
      {showInfo && info && <InfoPanel text={info} />}
    </div>
  )
}

function InfoLine({ label, value, valueClass, info }: { label: string; value: string; valueClass?: string; info: string }) {
  const [showInfo, setShowInfo] = useState(false)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-400 flex items-center gap-1">
          {label}
          <InfoButton open={showInfo} onClick={() => setShowInfo(!showInfo)} />
        </span>
        <span className={`text-xs font-bold tabular-nums ${valueClass || 'text-gray-700'}`}>{value}</span>
      </div>
      {showInfo && <InfoPanel text={info} />}
    </div>
  )
}

// ── Benchmarks Data ──────────────────────────────────────────────────────

const BENCHMARKS = [
  { metric: 'Gross Margin', median: '70-75%', top: '85-90%' },
  { metric: 'LTV/CAC', median: '3-5x', top: '10-15x' },
  { metric: 'CAC Payback', median: '12-18 mo', top: '5-6 mo' },
  { metric: 'Monthly Churn', median: '5-7%', top: '2-3%' },
  { metric: 'CAC', median: '€200-500', top: '€50-100' },
  { metric: 'ARPU', median: '€50-100', top: 'Varies' },
]

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

  // Tier mix: ensure essentiel + pro ≤ 100
  const updateTierMix = useCallback((key: 'essentielPct' | 'proPct', value: number) => {
    setAssumptions((prev) => {
      if (key === 'essentielPct') {
        const maxPro = 100 - value
        return { ...prev, essentielPct: value, proPct: Math.min(prev.proPct, maxPro) }
      }
      return { ...prev, proPct: Math.min(value, 100 - prev.essentielPct) }
    })
  }, [])

  // Derived data
  const cabinetPct = getCabinetPct(assumptions)
  const projections = useMemo(() => computeProjections(assumptions), [assumptions])
  const ue = useMemo(() => computeUnitEconomics(assumptions), [assumptions])
  const runway = useMemo(() => computeRunway(projections), [projections])

  const lastMonth = projections[35]
  const m18 = projections[17]

  const barChartData = useMemo(
    () => projections.filter((_, i) => i % 3 === 2),
    [projections],
  )

  // Waterfall data (per practitioner, per month)
  const waterfall = useMemo(() => {
    const arpu = ue.blendedArpu
    const vc = assumptions.variableCostPerPract
    const gp = arpu - vc
    const churnRate = assumptions.churnPct / 100
    const avgLife = churnRate > 0 ? 1 / churnRate : 100
    const cacAmort = assumptions.cac / avgLife
    const cm = gp - cacAmort
    return [
      { label: 'Revenue (ARPU)', value: arpu, widthPct: 100, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
      { label: 'AI (Claude Haiku)', value: -(vc * VC_AI_SHARE), widthPct: (vc * VC_AI_SHARE / arpu) * 100, color: 'bg-rose-400', textColor: 'text-rose-500' },
      { label: 'Infrastructure', value: -(vc * VC_INFRA_SHARE), widthPct: (vc * VC_INFRA_SHARE / arpu) * 100, color: 'bg-rose-300', textColor: 'text-rose-400' },
      { label: 'Support', value: -(vc * VC_SUPPORT_SHARE), widthPct: (vc * VC_SUPPORT_SHARE / arpu) * 100, color: 'bg-rose-200', textColor: 'text-rose-300' },
      { label: 'Gross Profit', value: gp, widthPct: (gp / arpu) * 100, color: 'bg-emerald-500', textColor: 'text-emerald-600', isBold: true },
      { label: 'CAC amortized', value: -cacAmort, widthPct: (cacAmort / arpu) * 100, color: 'bg-amber-400', textColor: 'text-amber-500' },
      { label: 'Contribution Margin', value: cm, widthPct: Math.max(0, (cm / arpu) * 100), color: 'bg-emerald-600', textColor: 'text-emerald-700', isBold: true },
    ]
  }, [ue.blendedArpu, assumptions.variableCostPerPract, assumptions.churnPct, assumptions.cac])

  // Benchmark values (dynamic)
  const benchmarkValues = useMemo(() => [
    `${ue.grossMarginPct}%`,
    `${ue.ltvCacRatio}x`,
    `${ue.paybackMonths} mo`,
    `${assumptions.churnPct}%`,
    `€${ue.cac}`,
    `€${ue.blendedArpu}`,
  ], [ue, assumptions.churnPct])

  const t = {
    title: locale === 'fr' ? 'Modèle financier' : locale === 'es' ? 'Modelo financiero' : 'Financial Model',
    conservative: locale === 'fr' ? 'Prudent' : locale === 'es' ? 'Conservador' : 'Conservative',
    base: locale === 'fr' ? 'Base' : locale === 'es' ? 'Base' : 'Base',
    aggressive: locale === 'fr' ? 'Ambitieux' : locale === 'es' ? 'Agresivo' : 'Aggressive',
    growth: locale === 'fr' ? 'Croissance' : locale === 'es' ? 'Crecimiento' : 'Growth',
    pricing: locale === 'fr' ? 'Tarification' : locale === 'es' ? 'Precios' : 'Pricing',
    costs: locale === 'fr' ? 'Coûts' : locale === 'es' ? 'Costos' : 'Costs',
    funding: locale === 'fr' ? 'Financement' : locale === 'es' ? 'Financiación' : 'Funding',
    assumptions: locale === 'fr' ? 'Hypothèses' : locale === 'es' ? 'Supuestos' : 'Assumptions',
    startingPractitioners: locale === 'fr' ? 'Praticiens initiaux' : locale === 'es' ? 'Practicantes iniciales' : 'Starting practitioners',
    initialGrowth: locale === 'fr' ? 'Croissance initiale' : locale === 'es' ? 'Crecimiento inicial' : 'Initial growth (M1)',
    endGrowth: locale === 'fr' ? 'Croissance finale' : locale === 'es' ? 'Crecimiento final' : 'Mature growth (M36)',
    churn: locale === 'fr' ? 'Attrition mensuelle' : locale === 'es' ? 'Deserción mensual' : 'Monthly churn',
    membersPerPract: locale === 'fr' ? 'Membres/praticien' : locale === 'es' ? 'Miembros/practicante' : 'Members/practitioner',
    team: locale === 'fr' ? 'Équipe' : locale === 'es' ? 'Equipo' : 'Team',
    infra: locale === 'fr' ? 'Infra fixe' : locale === 'es' ? 'Infra fija' : 'Fixed infra',
    marketing: 'Marketing',
    other: locale === 'fr' ? 'Autres' : locale === 'es' ? 'Otros' : 'Other',
    startingCash: locale === 'fr' ? 'Trésorerie initiale' : locale === 'es' ? 'Caja inicial' : 'Seed raise',
    practitionersLabel: locale === 'fr' ? 'Praticiens' : locale === 'es' ? 'Practicantes' : 'Practitioners',
    monthLabel: locale === 'fr' ? 'mois' : locale === 'es' ? 'mes' : 'mo',
    never: locale === 'fr' ? '> 36 mois' : locale === 'es' ? '> 36 meses' : '> 36 months',
  }

  const scenarioButtons: Array<{ key: 'conservative' | 'base' | 'aggressive'; label: string }> = [
    { key: 'conservative', label: t.conservative },
    { key: 'base', label: t.base },
    { key: 'aggressive', label: t.aggressive },
  ]

  const uof = assumptions.useOfFunds
  const fundSegments = [
    { label: 'Product', pct: uof.product, color: 'bg-indigo-500', amount: Math.round(assumptions.startingCash * uof.product / 100) },
    { label: 'Go-to-market', pct: uof.gtm, color: 'bg-emerald-500', amount: Math.round(assumptions.startingCash * uof.gtm / 100) },
    { label: 'Team', pct: uof.team, color: 'bg-blue-500', amount: Math.round(assumptions.startingCash * uof.team / 100) },
    { label: 'Operations', pct: uof.ops, color: 'bg-gray-400', amount: Math.round(assumptions.startingCash * uof.ops / 100) },
  ]

  const milestones = [
    { label: locale === 'fr' ? 'Levée Seed' : 'Seed Raise', value: fmtEuro(assumptions.startingCash), done: true, month: 'Now' },
    { label: '€100K ARR', value: runway.arr100kMonth ? `M${runway.arr100kMonth}` : t.never, done: false, month: runway.arr100kMonth ? `Month ${runway.arr100kMonth}` : '' },
    { label: locale === 'fr' ? 'Rentabilité' : 'Break-even', value: runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never, done: false, month: runway.breakEvenPractitioners ? `${runway.breakEvenPractitioners} pract.` : '' },
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
            <p className="text-[10px] text-gray-400">Bloomsline Care — 3-Tier Pricing Model</p>
          </div>
        </div>
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
          {/* ─── Narrative Summary ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              We&apos;re raising <span className="font-semibold text-gray-900">{fmtEuro(assumptions.startingCash)}</span>.
              {' '}At a burn rate of <span className="font-semibold text-gray-900">{fmtEuro(runway.monthlyBurn)}/mo</span>,
              {' '}that&apos;s <span className="font-semibold text-gray-900">{runway.runwayMonths}+ months</span> of runway.
              {' '}Our 3-tier pricing (€{TIER_PRICES.essentiel}/€{TIER_PRICES.pro}/€{TIER_PRICES.cabinet}) yields a blended
              {' '}<span className="font-semibold text-gray-900">€{ue.blendedArpu.toFixed(0)} ARPU</span> with
              {' '}<span className="font-semibold text-emerald-600">{ue.grossMarginPct}% gross margin</span>,
              {' '}<span className="font-semibold text-emerald-600">{ue.ltvCacRatio}x LTV/CAC</span>,
              {' '}<span className="font-semibold text-emerald-600">{ue.paybackMonths}{t.monthLabel} payback</span>.
              {' '}In 18 months we target <span className="font-semibold text-gray-900">{fmtNumber(m18.practitioners)} practitioners</span> and
              {' '}<span className="font-semibold text-gray-900">{fmtEuro(m18.arr)} ARR</span>.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Assumptions Panel (Sticky) ──────────────── */}
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
                      min={1} max={100}
                      info="How many therapists are paying us when we close the raise. We have 3-5 testing now — we expect 10 paying users by close. Why it matters: it proves people will actually pay before we spend investor money. Bonus: each therapist brings ~12 of their clients onto the app for free."
                    />
                    <SliderInput
                      label={t.initialGrowth} value={assumptions.initialGrowthPct}
                      onChange={(v) => updateAssumption('initialGrowthPct', v)}
                      min={5} max={50} suffix="%"
                      info="How fast we grow in the first month — as a % of new therapists added each month. Early-stage apps typically grow 20-50% per month. We grow by reaching out on LinkedIn, getting referrals, and writing content. This rate slows down gradually over 36 months as the easy wins dry up."
                    />
                    <SliderInput
                      label={t.endGrowth} value={assumptions.endGrowthPct}
                      onChange={(v) => updateAssumption('endGrowthPct', v)}
                      min={1} max={15} suffix="%"
                      info="How fast we're still growing by month 36. Growth always slows as you get bigger — 7% per month still means doubling every year, which is healthy. By this point, growth comes from Google search, word-of-mouth, and partnerships instead of founders doing outreach."
                    />
                    <SliderInput
                      label={t.churn} value={assumptions.churnPct}
                      onChange={(v) => updateAssumption('churnPct', v)}
                      min={1} max={15} suffix="%"
                      info="What % of therapists cancel each month. Industry average is 2-10%. Ours should be low because therapists won't switch tools while treating patients — too disruptive. At 4%, the average customer stays ~25 months. This is the #1 most important number in the model: just 1% more churn cuts lifetime revenue by ~€1,800 per customer."
                    />
                  </div>
                </div>

                {/* Pricing — Tier Mix */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.pricing}</h3>
                  <div className="space-y-3">
                    <SliderInput
                      label={`Essentiel (€${TIER_PRICES.essentiel})`} value={assumptions.essentielPct}
                      onChange={(v) => updateTierMix('essentielPct', v)}
                      min={0} max={100} suffix="%"
                      info="Our cheapest plan — €19/mo for up to 10 clients. Made for solo therapists who are just starting or want to try the platform. It's less than what they earn in 20 minutes, so it's an easy yes. We expect about 20% of users to stay on this plan."
                    />
                    <SliderInput
                      label={`Pro (€${TIER_PRICES.pro})`} value={assumptions.proPct}
                      onChange={(v) => updateTierMix('proPct', v)}
                      min={0} max={100 - assumptions.essentielPct} suffix="%"
                      info="Our main plan — €29/mo with unlimited clients and full AI features. We expect 70% of users to pick this one. Priced just under €30 (feels cheaper than €30). It costs less than one cancelled therapy session (€60-80), so therapists see it as a no-brainer. This plan drives most of our revenue."
                    />
                    {/* Cabinet computed */}
                    <InfoLine
                      label={`Cabinet (€${TIER_PRICES.cabinet})`}
                      value={`${cabinetPct}%`}
                      info="Our premium plan for group practices — €49/mo for the lead + €19 per extra therapist. Includes team dashboards, shared notes, and cross-referrals. These deals are bigger but take longer to close (6-12 weeks) because the whole team needs to try it first. This % is auto-calculated from the other two tiers."
                    />

                    {/* Tier mix visual bar */}
                    <div className="space-y-1.5">
                      <div className="flex h-2.5 rounded-full overflow-hidden">
                        {assumptions.essentielPct > 0 && (
                          <div className="bg-blue-400 transition-all" style={{ width: `${assumptions.essentielPct}%` }} />
                        )}
                        {assumptions.proPct > 0 && (
                          <div className="bg-indigo-500 transition-all" style={{ width: `${assumptions.proPct}%` }} />
                        )}
                        {cabinetPct > 0 && (
                          <div className="bg-violet-600 transition-all" style={{ width: `${cabinetPct}%` }} />
                        )}
                      </div>
                      <InfoLine
                        label="Blended ARPU"
                        value={`€${ue.blendedArpu.toFixed(2)}/mo`}
                        valueClass="text-gray-900"
                        info="The average price we actually earn per therapist per month. It's a mix of all three plans: if 20% pay €19, 70% pay €29, and 10% pay €49, the average comes out to €29. Move the sliders above to see how the mix changes this number. Member premium revenue (€3/mo) is extra on top — not counted here."
                      />
                    </div>

                    <SliderInput
                      label={t.membersPerPract} value={assumptions.membersPerPractitioner}
                      onChange={(v) => updateAssumption('membersPerPractitioner', v)}
                      min={1} max={50}
                      info="How many clients each therapist brings onto the app. A typical therapist sees 15-25 clients. About 75% will actually download it when their therapist recommends it, so ~12 per therapist. The key insight: we don't pay anything to get these users — the therapist invites them. This is our growth flywheel."
                    />
                    <SliderInput
                      label="Premium conversion" value={assumptions.memberPremiumPct}
                      onChange={(v) => updateAssumption('memberPremiumPct', v)}
                      min={0} max={20} suffix="%"
                      info="What % of free clients upgrade to the €3/mo premium version (better journaling, AI mood insights). Most won't — and that's fine. Even 3-5% is good. Spotify and Headspace convert 5-8% of free users. This is bonus revenue on top of what therapists already pay us — pure upside."
                    />
                  </div>
                </div>

                {/* Costs */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.costs}</h3>
                  <div className="space-y-3">
                    <SliderInput
                      label="Variable cost / pract." value={assumptions.variableCostPerPract}
                      onChange={(v) => updateAssumption('variableCostPerPract', v)}
                      min={1} max={15} step={0.25} prefix="€"
                      info="What it costs us to serve each therapist per month. Three parts: AI engine (€1.80 — powers Bloom, our AI assistant), servers and databases (€0.95 — hosting, storage, analytics), and customer support (€1.50 — helping therapists get started, drops as we build self-serve). Total: €4.25. AI costs keep getting cheaper every year, so this number should shrink."
                    />
                    <InfoLine
                      label="Gross margin"
                      value={`${ue.grossMarginPct}%`}
                      valueClass={ue.grossMarginPct >= 70 ? 'text-emerald-600' : 'text-amber-600'}
                      info="How much of each euro we keep after paying for the service. If we charge €29 and it costs us €4.25 to deliver, we keep 85%. That's really good — most software companies keep 70-75%. The best keep 85-90%, which is where we are. Calculated automatically from ARPU and variable cost above."
                    />
                    <NumberInput
                      label="CAC" value={assumptions.cac}
                      onChange={(v) => updateAssumption('cac', Math.max(0, v))}
                      prefix="€"
                      info="How much we spend to get one new paying therapist. We don't run ads — therapists don't trust ads. Instead: LinkedIn messages (€35-50 per signup), referrals from existing users (€29 — we give a free month), blog articles and SEO (€15-25), and conference booths (€60-100). Blended average: ~€50. This will rise to €60-80 as we grow, which is still very low for software."
                    />
                    <NumberInput
                      label={`${t.team} (/mo)`} value={assumptions.teamCost}
                      onChange={(v) => updateAssumption('teamCost', Math.max(0, v))}
                      prefix="€"
                      info="What we pay the team each month. Conservative (€8K): 2 founders × €2K + part-time dev €2K + sales €1.5K + advisor €500. Base (€10.5K): 2 founders × €2.5K + dev €2.5K + sales €2K + advisor €1K. Aggressive (€14.5K): 2 founders × €3K + full-time dev €3.5K + sales €2.5K + advisor €1K + marketer €1.5K. The sales hire focuses on LinkedIn outreach, conference demos, and converting trial therapists into paying users. All salaries below market — founders are betting on equity."
                    />
                    <NumberInput
                      label={`${t.infra} (/mo)`} value={assumptions.infraCost}
                      onChange={(v) => updateAssumption('infraCost', Math.max(0, v))}
                      prefix="€"
                      info="Monthly bills for tools we pay no matter how many users we have — database (€25), monitoring tools (€20), domain name, email service. This stays the same whether we have 10 or 1,000 users. The costs that grow with users (like AI and storage) are already counted in the 'variable cost' above."
                    />
                    <NumberInput
                      label={`${t.marketing} (/mo)`} value={assumptions.marketingCost}
                      onChange={(v) => updateAssumption('marketingCost', Math.max(0, v))}
                      prefix="€"
                      info="What we spend on getting the word out — blog posts, attending therapy conferences, LinkedIn outreach tools, building our community. We don't run paid ads because therapists don't respond to them. They trust peer recommendations and educational content, so that's where we focus."
                    />
                    <NumberInput
                      label={`${t.other} (/mo)`} value={assumptions.otherCost}
                      onChange={(v) => updateAssumption('otherCost', Math.max(0, v))}
                      prefix="€"
                      info="Everything else — lawyer fees, accountant, insurance, and admin. This goes up when we get our health data certification (HDS), which is required to host patient data in France. That adds about €200-400/mo but is essential for working with therapists."
                    />
                  </div>
                </div>

                {/* Funding */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.funding}</h3>
                  <div className="space-y-3">
                    <NumberInput
                      label={t.startingCash} value={assumptions.startingCash}
                      onChange={(v) => updateAssumption('startingCash', Math.max(0, v))}
                      prefix="€"
                      info="How much money we raise from investors. Conservative: €300K. Base: €400K. Aggressive: €500K. All normal for a pre-seed in Europe. This is our fuel — it decides how many months we can run before we need to be profitable or raise again. Each scenario gives us 33-38 months of runway, enough to reach profitability before running out."
                    />
                    <SliderInput
                      label="Equity offered" value={assumptions.dilutionPct}
                      onChange={(v) => updateAssumption('dilutionPct', v)}
                      min={5} max={25} suffix="%"
                      info="What % of the company investors get for their money. EU pre-seed standard is 10-20%. Conservative: 17% for €300K. Base: 15% for €400K. Aggressive: 13% for €500K. Lower dilution = founders keep more ownership but means a higher valuation you need to justify. The pre-money valuation updates automatically below."
                    />
                    <InfoLine
                      label="Pre-money valuation"
                      value={`€${(assumptions.startingCash * (100 / assumptions.dilutionPct - 1) / 1000).toFixed(0)}K`}
                      valueClass="text-indigo-600"
                      info="What the company is worth before the investment goes in. Calculated as: Raise ÷ Dilution% × (100% - Dilution%). For a pre-revenue startup, €1.5M-€3M is normal in Europe. Our strong unit economics (85% margin, 72x LTV/CAC) justify being at the higher end of that range."
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── Output Panel ────────────────────────────── */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">

              {/* Burn + Use of Funds */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-900">Monthly Burn & Runway</span>
                      <p className="text-[10px] text-gray-400">How long the money lasts at current spend</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3 mt-3">
                    <p className="text-2xl font-bold text-gray-900">{fmtEuro(runway.monthlyBurn)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                    <span className="text-gray-300">|</span>
                    <p className="text-lg font-bold text-gray-900">{runway.runwayMonths}<span className="text-sm font-normal text-gray-400"> months</span></p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className={`h-full rounded-full ${runway.runwayMonths >= 24 ? 'bg-emerald-400' : runway.runwayMonths >= 18 ? 'bg-amber-400' : 'bg-red-400'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((runway.runwayMonths / 36) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-3">
                    <span>M0</span>
                    <span className="font-medium text-gray-500">
                      {runway.runwayMonths >= 18 ? 'Seed window covered (18mo+)' : 'Warning: < 18mo runway'}
                    </span>
                    <span>M36</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Where the burn goes:</span>{' '}
                      Team ({fmtEuro(assumptions.teamCost)}/mo — 2 co-founders + dev + advisor),
                      marketing ({fmtEuro(assumptions.marketingCost)}/mo — content, LinkedIn, conferences),
                      infrastructure ({fmtEuro(assumptions.infraCost)}/mo — Supabase, Vercel, PostHog),
                      and operations ({fmtEuro(assumptions.otherCost)}/mo — legal, accounting, insurance).
                      Variable costs (AI, hosting per user) scale with growth.
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Why this is comfortable:</span>{' '}
                      {runway.runwayMonths >= 24
                        ? `${runway.runwayMonths} months gives us well beyond the 18-month seed window. Even if growth is slower than planned, we have time to adjust before needing more capital.`
                        : runway.runwayMonths >= 18
                        ? `${runway.runwayMonths} months covers the standard 18-month seed window. We reach break-even${runway.breakEvenMonth ? ` around M${runway.breakEvenMonth}` : ''} before the money runs out.`
                        : `${runway.runwayMonths} months is tight — less than the 18-month seed window. We should either raise more or cut spend to extend runway.`
                      }
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-900">Use of Funds — {fmtEuro(assumptions.startingCash)}</span>
                      <p className="text-[10px] text-gray-400">How we plan to spend every euro raised</p>
                    </div>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden mb-4 mt-3">
                    {fundSegments.map((s) => (
                      <motion.div
                        key={s.label} className={s.color}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {fundSegments.map((s) => (
                      <div key={s.label} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                        <span className="text-xs font-semibold text-gray-700 ml-auto tabular-nums">{fmtEuro(s.amount)}</span>
                        <span className="text-[10px] text-gray-400">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Product ({assumptions.useOfFunds.product}%):</span>{' '}
                      Build the core platform — practitioner dashboard, Bloom AI assistant, member app, resource library. Covers developer salaries and AI/cloud costs for 18+ months of development.
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Go-to-market ({assumptions.useOfFunds.gtm}%):</span>{' '}
                      Acquire first 100+ practitioners through LinkedIn outreach, SEO content, therapy conference sponsorships, and community building. No paid ads — therapists trust peers, not ads.
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Team ({assumptions.useOfFunds.team}%):</span>{' '}
                      Founder salaries (below market), clinical advisor, and one additional hire around M12 as we scale past 100 practitioners.
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">Operations ({assumptions.useOfFunds.ops}%):</span>{' '}
                      Legal (SAS incorporation, RGPD compliance), health data certification (HDS — required for patient data in France), accounting, and insurance.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* The Ask — Equity */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">The Ask</h3>
                    <p className="text-[10px] text-gray-400">What we&apos;re raising, what investors get, and the path to returns</p>
                  </div>
                </div>

                {(() => {
                  const raise = assumptions.startingCash
                  const dilution = assumptions.dilutionPct
                  const preMoney = raise * (100 / dilution - 1)
                  const postMoney = preMoney + raise
                  const foundersAfter = 100 - dilution
                  const pricePerPct = raise / dilution
                  // Series A scenario: if we hit M18 targets, typical 3-5x step-up
                  const seriesAMultiple = 3
                  const impliedSeriesAVal = postMoney * seriesAMultiple
                  const investorSeriesAValue = (dilution / 100) * impliedSeriesAVal
                  // 10x scenario (strong outcome)
                  const tenXVal = postMoney * 10
                  const investor10xValue = (dilution / 100) * tenXVal

                  return (
                    <div className="space-y-4">
                      {/* Main numbers */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-violet-50 rounded-xl">
                          <p className="text-[10px] text-violet-400">Raising</p>
                          <p className="text-lg font-bold text-violet-700">{fmtEuro(raise)}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400">For equity</p>
                          <p className="text-lg font-bold text-gray-900">{dilution}%</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400">Pre-money</p>
                          <p className="text-lg font-bold text-gray-900">{fmtEuro(preMoney)}</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-xl">
                          <p className="text-[10px] text-indigo-400">Post-money</p>
                          <p className="text-lg font-bold text-indigo-700">{fmtEuro(postMoney)}</p>
                        </div>
                      </div>

                      {/* Valuation justification */}
                      <div className="bg-violet-50/50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">Why this valuation?</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          We&apos;re pre-revenue, which normally means a lower valuation. But our unit economics are already proven on paper:
                          85% gross margin (top-decile SaaS), {ue.ltvCacRatio}x LTV/CAC (industry target is 3x), and {ue.paybackMonths}-month
                          CAC payback. The mental health SaaS market is growing 25%+ per year in Europe, and no EU-based competitor
                          has a practitioner-first B2B2C model with built-in AI. Pre-money of {fmtEuro(preMoney)} is in line with
                          EU pre-seed standards (€1.5M-€3M) and reflects both the early stage and the strong fundamentals.
                        </p>
                      </div>

                      {/* Cap table visual */}
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1.5">Ownership after round</p>
                        <div className="flex h-4 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-gray-800"
                            initial={{ width: 0 }}
                            animate={{ width: `${foundersAfter}%` }}
                            transition={{ duration: 0.6 }}
                          />
                          <motion.div
                            className="bg-violet-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${dilution}%` }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-gray-800" />
                            Founders — {foundersAfter}%
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-violet-600">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            Investors — {dilution}%
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                          Founders keep {foundersAfter}% after this round. We plan to reserve a 10% ESOP pool at Series A
                          (not created yet — keeps your ownership undiluted at this stage). After Series A dilution (~15-20%),
                          your pre-seed shares will still represent {dilution}% of a much larger pie.
                        </p>
                      </div>

                      {/* Return scenarios */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-700 mb-2">What your {fmtEuro(raise)} could become</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] text-gray-400">Price per 1%</p>
                            <p className="text-sm font-bold text-gray-900">{fmtEuro(pricePerPct)}</p>
                            <p className="text-[9px] text-gray-400">entry price today</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-[10px] text-emerald-500">3x at Series A</p>
                            <p className="text-sm font-bold text-emerald-600">{fmtEuro(investorSeriesAValue)}</p>
                            <p className="text-[9px] text-gray-400">{dilution}% of {fmtEuro(impliedSeriesAVal)}</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-[10px] text-emerald-500">10x exit scenario</p>
                            <p className="text-sm font-bold text-emerald-600">{fmtEuro(investor10xValue)}</p>
                            <p className="text-[9px] text-gray-400">{dilution}% of {fmtEuro(tenXVal)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Detailed return narrative */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">Series A path (18 months):</span>{' '}
                          If we hit our M18 targets — {fmtNumber(m18.practitioners)} practitioners, {fmtEuro(m18.arr)} ARR — we expect
                          a 3x step-up at Series A, which is standard for seed-to-A in European SaaS. Your {dilution}% would be
                          worth {fmtEuro(investorSeriesAValue)} on paper. These targets require ~{Math.round(m18.practitioners / 18)} new practitioners
                          per month, achievable through LinkedIn outreach and referrals alone.
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">Deal structure:</span>{' '}
                          Standard EU pre-seed terms — SAFE note or priced equity round, with standard pro-rata rights,
                          information rights (monthly updates), and investor-friendly governance. No board seat required
                          at this stage, but we welcome strategic involvement.
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">Why now:</span>{' '}
                          France&apos;s mental health market is at an inflection point — government reimbursement programs launched in 2022,
                          practitioner burnout is at record highs, and there&apos;s no dominant EU platform yet. Getting in before product-market fit
                          is confirmed gives you the best entry price. Once we have 100+ practitioners and growing MRR, the next round will
                          be at 3-5x this valuation.
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>

              {/* Path to Series A */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Rocket className="w-4 h-4 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Path to Series A</h3>
                    <p className="text-[10px] text-gray-400">Key milestones across the 18-month seed window</p>
                  </div>
                </div>
                <div className="flex items-center gap-0 mt-4">
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
                <div className="bg-gray-50 rounded-lg p-3 mt-4 space-y-1.5">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">M0-M6 — Build & validate:</span>{' '}
                    Ship the MVP, onboard first 30-50 therapists through personal outreach. Focus on retention over acquisition — if therapists stay past month 3, we have product-market fit signal.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">M6-M12 — Scale what works:</span>{' '}
                    Double down on channels that convert (LinkedIn, peer referrals). Hit 100+ practitioners, {fmtEuro(m18.mrr ? m18.mrr / 3 : 0)}+ MRR. Start seeing organic word-of-mouth from happy users.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">M12-M18 — Series A ready:</span>{' '}
                    Reach {fmtNumber(m18.practitioners)} practitioners, {fmtEuro(m18.arr)} ARR, and strong retention metrics. At this point we have the data to raise a €1.5-3M Series A at a 3-5x step-up from today&apos;s valuation.
                  </p>
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
                  <p className={`text-xl font-bold ${ue.ltvCacRatio >= 3 ? 'text-emerald-600' : ue.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                    {ue.ltvCacRatio}x
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">LTV: {fmtEuro(ue.ltv)} | CAC: €{ue.cac}</p>
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
                  <p className="text-[10px] text-gray-400 mt-1">
                    {runway.breakEvenPractitioners ? `At ~${runway.breakEvenPractitioners} practitioners` : `${runway.runwayMonths} months runway`}
                  </p>
                </div>
              </motion.div>

              {/* Contribution Margin Waterfall */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDown className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-medium text-gray-900">Margin Waterfall</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">Per practitioner per month — from revenue to contribution margin</p>
                <div className="space-y-2">
                  {waterfall.map((row, i) => (
                    <div key={i}>
                      {(i === 4 || i === 6) && <div className="border-t border-dashed border-gray-200 my-2" />}
                      <div className="flex items-center gap-3">
                        <span className={`w-36 text-xs text-right shrink-0 ${row.isBold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                          {row.label}
                        </span>
                        <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                          <motion.div
                            className={`h-full ${row.color} rounded`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(row.widthPct, 1)}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                          />
                        </div>
                        <span className={`w-16 text-xs font-mono text-right shrink-0 ${row.isBold ? 'font-bold' : ''} ${row.textColor}`}>
                          {row.value >= 0 ? '€' : '-€'}{Math.abs(row.value).toFixed(2)}
                        </span>
                        <span className="w-12 text-[10px] text-gray-400 text-right shrink-0">
                          {row.value >= 0 ? '' : '-'}{Math.abs(row.widthPct).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {ue.b2cRevenuePerPract > 0 && (
                  <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                    + B2C premium upside: €{ue.b2cRevenuePerPract.toFixed(2)}/practitioner/mo
                    ({assumptions.membersPerPractitioner} members × {assumptions.memberPremiumPct}% × €{MEMBER_PREMIUM}/mo) — not included in margin above.
                  </p>
                )}
              </motion.div>

              {/* B2B2C Advantage */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 border border-indigo-100/50 rounded-xl p-5"
              >
                <div className="mb-1">
                  <h3 className="text-sm font-medium text-gray-900">B2B2C Advantage — Why Our CAC is Different</h3>
                  <p className="text-[10px] text-gray-400">Our secret weapon: practitioners do the user acquisition for us</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">€{ue.cac}</p>
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
                    <p className="text-2xl font-bold text-emerald-600">€{ue.effectiveMemberCAC}</p>
                    <p className="text-xs text-gray-500 mt-1">Effective member CAC</p>
                    <p className="text-[10px] text-gray-400">vs. €30-50 for B2C apps</p>
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 mt-3 space-y-1.5">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">How it works:</span>{' '}
                    We only sell to therapists (B2B). Each therapist then invites their own clients onto the app — we never spend a cent acquiring those users.
                    A therapist with 15-25 active clients brings ~{assumptions.membersPerPractitioner} onto the platform. So for every €{ue.cac} we spend,
                    we get 1 paying customer + {assumptions.membersPerPractitioner} engaged users for free.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">Why it compounds:</span>{' '}
                    Members who love the app tell friends in therapy to ask their therapist about Bloomsline. Therapists hear about us from peers
                    at conferences or in supervision groups. This creates a flywheel: more therapists → more members → more word-of-mouth → more therapists.
                    Headspace and Calm spend €30-50 per user. We spend €{ue.effectiveMemberCAC}.
                  </p>
                </div>
              </motion.div>

              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Revenue Projection</h3>
                <p className="text-xs text-gray-400 mb-4">
                  MRR over 36 months — €{ue.blendedArpu.toFixed(0)} blended ARPU, growth {assumptions.initialGrowthPct}% → {assumptions.endGrowthPct}%/mo
                </p>
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
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'M18', position: 'top', fontSize: 9, fill: '#6366f1' }} />
                      {runway.breakEvenMonth && (
                        <ReferenceLine x={`M${runway.breakEvenMonth}`} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Break-even', position: 'top', fontSize: 9, fill: '#10b981' }} />
                      )}
                      <Area type="monotone" dataKey="mrr" stroke="#6366f1" strokeWidth={2} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Customer Growth Chart */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
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
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">Unit Economics</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">Blended ARPU</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{ue.blendedArpu.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">/practitioner/mo (B2B only)</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">LTV</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{fmtEuro(ue.ltv)}</p>
                    <p className="text-[10px] text-gray-400">
                      {(1 / (assumptions.churnPct / 100)).toFixed(0)} mo lifetime × €{ue.totalArpu.toFixed(0)} × {ue.grossMarginPct}%
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">CAC</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{ue.cac}</p>
                    <p className="text-[10px] text-gray-400">organic acquisition</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">LTV/CAC</span>
                    <p className={`text-lg font-bold mt-1 ${ue.ltvCacRatio >= 3 ? 'text-emerald-600' : ue.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {ue.ltvCacRatio}x
                    </p>
                    <p className="text-[10px] text-gray-400">target: &gt;3x</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">Payback</span>
                    <p className={`text-lg font-bold mt-1 ${ue.paybackMonths <= 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ue.paybackMonths} {t.monthLabel}
                    </p>
                    <p className="text-[10px] text-gray-400">target: &lt;12mo</p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">Gross Margin</span>
                    <p className={`text-lg font-bold mt-1 ${ue.grossMarginPct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ue.grossMarginPct}%
                    </p>
                    <p className="text-[10px] text-gray-400">€{ue.variableCost.toFixed(2)} variable cost</p>
                  </div>
                </div>
              </motion.div>

              {/* Expense Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">Expense Breakdown</h3>
                <p className="text-xs text-gray-400 mb-4">Quarterly expenses by category (includes COGS)</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtEuro(v)} width={50} />
                      <Tooltip content={<ExpenseTooltip />} cursor={false} />
                      <Bar dataKey="variableCosts" stackId="a" fill="#f43f5e" name="COGS" />
                      <Bar dataKey="teamExp" stackId="a" fill="#3b82f6" name="Team" />
                      <Bar dataKey="infraExp" stackId="a" fill="#8b5cf6" name="Infra" />
                      <Bar dataKey="marketingExp" stackId="a" fill="#f59e0b" name="Marketing" />
                      <Bar dataKey="otherExp" stackId="a" fill="#9ca3af" name="Other" />
                      <Bar dataKey="acquisitionExp" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} name="Acquisition" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500"><span className="w-2 h-2 rounded-full bg-rose-500" />COGS</span>
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
                transition={{ delay: 0.5 }}
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

              {/* Industry Benchmarks */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">Industry Benchmarks</h3>
                  <span className="text-[10px] text-gray-400">vs. SaaS standards</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2.5 font-semibold text-gray-600">Metric</th>
                        <th className="text-center p-2.5 font-semibold text-indigo-600">Bloomsline</th>
                        <th className="text-center p-2.5 font-semibold text-gray-500">SaaS Median</th>
                        <th className="text-center p-2.5 font-semibold text-emerald-600">Top Decile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BENCHMARKS.map((b, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="p-2.5 font-medium text-gray-900 border-b border-gray-50">{b.metric}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-indigo-600 border-b border-gray-50">{benchmarkValues[i]}</td>
                          <td className="p-2.5 text-center font-mono text-gray-500 border-b border-gray-50">{b.median}</td>
                          <td className="p-2.5 text-center font-mono text-emerald-600 border-b border-gray-50">{b.top}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">
                  Values update in real-time as you adjust assumptions. See <a href="/unit-economics" className="text-indigo-500 underline">Unit Economics</a> for detailed analysis.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

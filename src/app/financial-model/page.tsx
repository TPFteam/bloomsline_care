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
  Calendar,
  AlertTriangle,
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
  teamCostStepUp: number      // €/mo added per step-up
  teamStepUpInterval: number  // months between step-ups
  cacGrowthPctPerQuarter: number // CAC grows this % each quarter
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
  currentCAC: number
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
  cacM18: number
  cacM36: number
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

// Scenario presets — investor-grade assumptions.
// CAC includes founder time cost (calls, demos, follow-ups) not just ad spend.
// Team costs include livable founder salaries — this is non-negotiable for full-time commitment.
// Growth rates calibrated to organic B2B SaaS benchmarks for solo-practitioner market.
// Churn starts high (new product, unproven PMF) and improves as product matures.
const SCENARIOS: Record<string, Assumptions> = {
  conservative: {
    startingPractitioners: 5,
    initialGrowthPct: 12,
    endGrowthPct: 4,
    churnPct: 7,
    essentielPct: 60,
    proPct: 30,
    membersPerPractitioner: 8,
    memberPremiumPct: 2,
    variableCostPerPract: 4.25,
    cac: 180,           // Founder time (3h/conversion × €30/h) + content + events
    teamCost: 8500,     // 2 founders (€2K each) + dev part-time (€2.5K) + sales (€1.5K) + tools (€500)
    teamCostStepUp: 2000,
    teamStepUpInterval: 6,
    cacGrowthPctPerQuarter: 12,
    infraCost: 150,
    marketingCost: 1000,
    otherCost: 600,
    startingCash: 400000,   // €400K — tight but survivable with low burn
    dilutionPct: 18,
    useOfFunds: { product: 40, gtm: 25, team: 25, ops: 10 },
  },
  base: {
    startingPractitioners: 8,
    initialGrowthPct: 18,
    endGrowthPct: 6,
    churnPct: 5,
    essentielPct: 40,
    proPct: 50,
    membersPerPractitioner: 10,
    memberPremiumPct: 4,
    variableCostPerPract: 4.25,
    cac: 140,            // Blended: organic (€80) + founder time (€120) + events (€200) → weighted avg
    teamCost: 11000,     // 2 founders (€2.5K each) + dev (€3K) + sales (€2K) + expert (€1K)
    teamCostStepUp: 2500,
    teamStepUpInterval: 6,
    cacGrowthPctPerQuarter: 8,
    infraCost: 250,
    marketingCost: 1500,
    otherCost: 800,
    startingCash: 500000,   // €500K — 28-30 months runway, enough for Series A window
    dilutionPct: 16,
    useOfFunds: { product: 35, gtm: 30, team: 25, ops: 10 },
  },
  aggressive: {
    startingPractitioners: 10,
    initialGrowthPct: 25,
    endGrowthPct: 7,
    churnPct: 4,
    essentielPct: 20,
    proPct: 55,
    membersPerPractitioner: 12,
    memberPremiumPct: 6,
    variableCostPerPract: 4.25,
    cac: 100,            // Referral program kicks in, lower blended CAC
    teamCost: 15000,     // 2 founders (€3K each) + dev full-time (€4K) + sales (€2.5K) + expert (€1K) + marketer (€1.5K)
    teamCostStepUp: 3000,
    teamStepUpInterval: 6,
    cacGrowthPctPerQuarter: 6,
    infraCost: 350,
    marketingCost: 2500,
    otherCost: 1000,
    startingCash: 650000,   // €650K — bigger team needs more fuel for 28-30 months
    dilutionPct: 14,
    useOfFunds: { product: 35, gtm: 30, team: 25, ops: 10 },
  },
  stress: {
    startingPractitioners: 5,
    initialGrowthPct: 8,
    endGrowthPct: 2,
    churnPct: 9,
    essentielPct: 65,
    proPct: 25,
    membersPerPractitioner: 6,
    memberPremiumPct: 1,
    variableCostPerPract: 4.25,
    cac: 220,            // Organic stalls, need paid channels + higher founder time per conversion
    teamCost: 8500,
    teamCostStepUp: 1500,
    teamStepUpInterval: 6,
    cacGrowthPctPerQuarter: 15,
    infraCost: 150,
    marketingCost: 1000,
    otherCost: 600,
    startingCash: 400000,   // €400K — survival mode, minimal spend
    dilutionPct: 18,
    useOfFunds: { product: 40, gtm: 25, team: 25, ops: 10 },
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

    // Dynamic team cost: step up every N months
    const stepUps = a.teamStepUpInterval > 0 ? Math.floor((m - 1) / a.teamStepUpInterval) : 0
    const dynamicTeamCost = a.teamCost + stepUps * a.teamCostStepUp

    // Evolving CAC: grows each quarter
    const quarterIndex = Math.floor((m - 1) / 3)
    const currentCAC = a.cac * Math.pow(1 + a.cacGrowthPctPerQuarter / 100, quarterIndex)

    const acquisitionExp = newPract * currentCAC
    const fixedCosts = dynamicTeamCost + a.infraCost + a.marketingCost + a.otherCost
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
      teamExp: dynamicTeamCost,
      infraExp: a.infraCost,
      marketingExp: a.marketingCost,
      otherExp: a.otherCost,
      acquisitionExp: Math.round(acquisitionExp),
      currentCAC: Math.round(currentCAC),
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

  // CAC at M18 (quarter 5) and M36 (quarter 11)
  const cacM18 = a.cac * Math.pow(1 + a.cacGrowthPctPerQuarter / 100, 5)
  const cacM36 = a.cac * Math.pow(1 + a.cacGrowthPctPerQuarter / 100, 11)

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
    cacM18: Math.round(cacM18),
    cacM36: Math.round(cacM36),
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

// ── Quarterly P&L ────────────────────────────────────────────────────────

interface QuarterlyPnL {
  label: string
  revenue: number
  cogs: number
  grossProfit: number
  team: number
  marketing: number
  infra: number
  other: number
  cac: number
  ebitda: number
  cumulativeCash: number
  practitioners: number
  arr: number
}

function computeQuarterlyPnL(projections: MonthProjection[]): QuarterlyPnL[] {
  const quarters: QuarterlyPnL[] = []
  for (let q = 0; q < 12; q++) {
    const start = q * 3
    const slice = projections.slice(start, start + 3)
    if (slice.length === 0) break
    const last = slice[slice.length - 1]
    quarters.push({
      label: `Q${q + 1}`,
      revenue: slice.reduce((s, p) => s + p.mrr, 0),
      cogs: slice.reduce((s, p) => s + p.variableCosts, 0),
      grossProfit: slice.reduce((s, p) => s + p.grossProfit, 0),
      team: slice.reduce((s, p) => s + p.teamExp, 0),
      marketing: slice.reduce((s, p) => s + p.marketingExp, 0),
      infra: slice.reduce((s, p) => s + p.infraExp, 0),
      other: slice.reduce((s, p) => s + p.otherExp, 0),
      cac: slice.reduce((s, p) => s + p.acquisitionExp, 0),
      ebitda: slice.reduce((s, p) => s + p.netBurn, 0),
      cumulativeCash: last.cumulativeCash,
      practitioners: last.practitioners,
      arr: last.arr,
    })
  }
  return quarters
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

function RevenueTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }>; locale?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isFr = locale === 'fr'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-indigo-600">MRR: {fmtEuro(d.mrr)}</p>
      <p className="text-violet-500">B2B: {fmtEuro(d.b2bMrr)} | B2C: {fmtEuro(d.b2cMrr)}</p>
      <p className="text-gray-500">ARR: {fmtEuro(d.arr)}</p>
      <p className="text-gray-400">{isFr ? 'Croissance' : 'Growth'}: {d.growthRate}%/{isFr ? 'mois' : 'mo'}</p>
    </div>
  )
}

function GrowthTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }>; locale?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isFr = locale === 'fr'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-blue-600">{isFr ? 'Praticiens' : 'Practitioners'}: {d.practitioners}</p>
      <p className="text-emerald-600">{isFr ? 'Membres' : 'Members'}: {d.members}</p>
      <p className="text-gray-400">{isFr ? 'Croissance' : 'Growth'}: {d.growthRate}%/{isFr ? 'mois' : 'mo'}</p>
    </div>
  )
}

function ExpenseTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }>; locale?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isFr = locale === 'fr'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-rose-600">COGS: {fmtEuro(d.variableCosts)}</p>
      <p className="text-blue-600">{isFr ? 'Équipe' : 'Team'}: {fmtEuro(d.teamExp)}</p>
      <p className="text-violet-600">Infra: {fmtEuro(d.infraExp)}</p>
      <p className="text-amber-600">Marketing: {fmtEuro(d.marketingExp)}</p>
      <p className="text-gray-500">{isFr ? 'Autres' : 'Other'}: {fmtEuro(d.otherExp)}</p>
      <p className="text-orange-600">Acquisition: {fmtEuro(d.acquisitionExp)}</p>
      <p className="font-medium text-gray-900 mt-1 pt-1 border-t border-gray-100">Total: {fmtEuro(d.expenses)}</p>
    </div>
  )
}

function RunwayTooltip({ active, payload, locale }: { active?: boolean; payload?: Array<{ value: number; payload: MonthProjection }>; locale?: string }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isFr = locale === 'fr'
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1">{d.label}</p>
      <p className="text-emerald-600">{isFr ? 'Trésorerie' : 'Cash'}: {fmtEuro(d.cumulativeCash)}</p>
      <p className="text-gray-500">{isFr ? 'Burn net' : 'Net burn'}: {fmtEuro(d.netBurn)}</p>
      <p className="text-gray-400">{isFr ? 'Marge' : 'Margin'}: {d.grossMarginPct}%</p>
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

// ── Page ─────────────────────────────────────────────────────────────────

export default function FinancialModelPage() {
  const { locale, setLocale } = useLanguage()
  const [scenario, setScenario] = useState<'conservative' | 'base' | 'aggressive' | 'stress'>('base')
  const [assumptions, setAssumptions] = useState<Assumptions>(SCENARIOS.base)

  const setScenarioPreset = useCallback((s: 'conservative' | 'base' | 'aggressive' | 'stress') => {
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

  const quarterlyPnL = useMemo(() => computeQuarterlyPnL(projections), [projections])

  // Stress test: always compute stress projections for comparison
  const stressProjections = useMemo(() => computeProjections(SCENARIOS.stress), [])
  const stressRunway = useMemo(() => computeRunway(stressProjections), [stressProjections])

  const fr = locale === 'fr'

  const t = {
    title: fr ? 'Modèle financier' : 'Financial Model',
    subtitle: fr ? 'Bloomsline Care — Tarification 3 niveaux' : 'Bloomsline Care — 3-Tier Pricing Model',
    conservative: fr ? 'Prudent' : 'Conservative',
    base: fr ? 'Base' : 'Base',
    aggressive: fr ? 'Ambitieux' : 'Aggressive',
    growth: fr ? 'Croissance' : 'Growth',
    pricing: fr ? 'Tarification' : 'Pricing',
    costs: fr ? 'Coûts' : 'Costs',
    funding: fr ? 'Financement' : 'Funding',
    assumptions: fr ? 'Hypothèses' : 'Assumptions',
    startingPractitioners: fr ? 'Praticiens initiaux' : 'Starting practitioners',
    initialGrowth: fr ? 'Croissance initiale (M1)' : 'Initial growth (M1)',
    endGrowth: fr ? 'Croissance mature (M36)' : 'Mature growth (M36)',
    churn: fr ? 'Attrition mensuelle' : 'Monthly churn',
    membersPerPract: fr ? 'Membres/praticien' : 'Members/practitioner',
    team: fr ? 'Équipe' : 'Team',
    infra: fr ? 'Infra fixe' : 'Fixed infra',
    marketing: 'Marketing',
    other: fr ? 'Autres' : 'Other',
    startingCash: fr ? 'Levée Seed' : 'Seed raise',
    practitionersLabel: fr ? 'Praticiens' : 'Practitioners',
    monthLabel: fr ? 'mois' : 'mo',
    never: fr ? '> 36 mois' : '> 36 months',
    members: fr ? 'Membres' : 'Members',
    // Info tooltips — Growth section
    infoStartingPract: fr
      ? "Combien de thérapeutes nous paient au moment de la clôture. Nous avons 3-5 en test actuellement — nous prévoyons 10 utilisateurs payants d'ici la clôture. Pourquoi c'est important : cela prouve que les gens paient réellement avant de dépenser l'argent des investisseurs. Bonus : chaque thérapeute amène environ 12 de ses patients sur l'application gratuitement."
      : "How many therapists are paying us when we close the raise. We have 3-5 testing now — we expect 10 paying users by close. Why it matters: it proves people will actually pay before we spend investor money. Bonus: each therapist brings ~12 of their clients onto the app for free.",
    infoInitialGrowth: fr
      ? "Vitesse de croissance le premier mois — en % de nouveaux thérapeutes ajoutés chaque mois. Les applications en phase de démarrage croissent typiquement de 20-50% par mois. Nous grandissons via LinkedIn, le parrainage et le contenu. Ce taux ralentit progressivement sur 36 mois."
      : "How fast we grow in the first month — as a % of new therapists added each month. Early-stage apps typically grow 20-50% per month. We grow by reaching out on LinkedIn, getting referrals, and writing content. This rate slows down gradually over 36 months as the easy wins dry up.",
    infoEndGrowth: fr
      ? "Vitesse de croissance au mois 36. La croissance ralentit toujours quand on grandit — 7% par mois signifie encore doubler chaque année, ce qui est sain. À ce stade, la croissance vient du référencement Google, du bouche-à-oreille et des partenariats."
      : "How fast we're still growing by month 36. Growth always slows as you get bigger — 7% per month still means doubling every year, which is healthy. By this point, growth comes from Google search, word-of-mouth, and partnerships instead of founders doing outreach.",
    infoChurn: fr
      ? "Quel % de thérapeutes se désabonnent chaque mois. La moyenne du secteur est de 2-10%. Le nôtre devrait être bas car les thérapeutes ne changent pas d'outil en cours de traitement — trop perturbant. À 4%, le client moyen reste environ 25 mois. C'est le chiffre le plus important du modèle : 1% de plus d'attrition réduit le revenu à vie d'environ 1 800 € par client."
      : "What % of therapists cancel each month. Industry average is 2-10%. Ours should be low because therapists won't switch tools while treating patients — too disruptive. At 4%, the average customer stays ~25 months. This is the #1 most important number in the model: just 1% more churn cuts lifetime revenue by ~€1,800 per customer.",
    // Info tooltips — Pricing section
    infoEssentiel: fr
      ? "Notre plan le moins cher — 19 €/mois pour jusqu'à 10 patients. Conçu pour les thérapeutes qui débutent ou veulent essayer la plateforme. C'est moins que ce qu'ils gagnent en 20 minutes, donc c'est un oui facile. Nous prévoyons qu'environ 20% des utilisateurs resteront sur ce plan."
      : "Our cheapest plan — €19/mo for up to 10 clients. Made for solo therapists who are just starting or want to try the platform. It's less than what they earn in 20 minutes, so it's an easy yes. We expect about 20% of users to stay on this plan.",
    infoPro: fr
      ? "Notre plan principal — 29 €/mois avec clients illimités et toutes les fonctionnalités IA. Nous prévoyons que 70% des utilisateurs choisiront celui-ci. Tarifé juste en dessous de 30 € (semble moins cher). Ça coûte moins qu'une séance annulée (60-80 €), donc les thérapeutes le voient comme évident. Ce plan génère la majorité de notre chiffre d'affaires."
      : "Our main plan — €29/mo with unlimited clients and full AI features. We expect 70% of users to pick this one. Priced just under €30 (feels cheaper than €30). It costs less than one cancelled therapy session (€60-80), so therapists see it as a no-brainer. This plan drives most of our revenue.",
    infoCabinet: fr
      ? "Notre plan premium pour les cabinets de groupe — 49 €/mois pour le référent + 19 € par thérapeute supplémentaire. Inclut les tableaux de bord d'équipe, les notes partagées et les recommandations croisées. Ces contrats sont plus importants mais prennent plus de temps (6-12 semaines). Ce % est calculé automatiquement."
      : "Our premium plan for group practices — €49/mo for the lead + €19 per extra therapist. Includes team dashboards, shared notes, and cross-referrals. These deals are bigger but take longer to close (6-12 weeks) because the whole team needs to try it first. This % is auto-calculated from the other two tiers.",
    infoBlendedArpu: fr
      ? "Le prix moyen que nous gagnons réellement par thérapeute par mois. C'est un mélange des trois plans : si 20% paient 19 €, 70% paient 29 € et 10% paient 49 €, la moyenne est de 29 €. Déplacez les curseurs pour voir comment le mix change ce chiffre. Le revenu premium des membres (3 €/mois) est en plus — non compté ici."
      : "The average price we actually earn per therapist per month. It's a mix of all three plans: if 20% pay €19, 70% pay €29, and 10% pay €49, the average comes out to €29. Move the sliders above to see how the mix changes this number. Member premium revenue (€3/mo) is extra on top — not counted here.",
    infoMembersPerPract: fr
      ? "Combien de patients chaque thérapeute amène sur l'appli. Un thérapeute typique suit 15-25 patients. Environ 75% vont la télécharger quand leur thérapeute la recommande, soit environ 12 par thérapeute. Le point clé : nous ne payons rien pour acquérir ces utilisateurs — le thérapeute les invite. C'est notre volant de croissance."
      : "How many clients each therapist brings onto the app. A typical therapist sees 15-25 clients. About 75% will actually download it when their therapist recommends it, so ~12 per therapist. The key insight: we don't pay anything to get these users — the therapist invites them. This is our growth flywheel.",
    premiumConversion: fr ? 'Conversion premium' : 'Premium conversion',
    infoPremiumConversion: fr
      ? "Quel % des patients gratuits passent à la version premium à 3 €/mois (meilleur journal intime, insights IA sur l'humeur). La plupart ne le feront pas — et c'est normal. Même 3-5% c'est bien. Spotify et Headspace convertissent 5-8% des utilisateurs gratuits. C'est un revenu bonus en plus de ce que les thérapeutes paient déjà — pur potentiel de hausse."
      : "What % of free clients upgrade to the €3/mo premium version (better journaling, AI mood insights). Most won't — and that's fine. Even 3-5% is good. Spotify and Headspace convert 5-8% of free users. This is bonus revenue on top of what therapists already pay us — pure upside.",
    // Info tooltips — Costs section
    variableCostLabel: fr ? 'Coût variable / prat.' : 'Variable cost / pract.',
    infoVariableCost: fr
      ? "Ce qu'il nous coûte de servir chaque thérapeute par mois. Trois parties : moteur IA (1,80 € — alimente Bloom, notre assistant IA), serveurs et bases de données (0,95 € — hébergement, stockage, analytics), et support client (1,50 € — aide au démarrage, diminue avec le self-service). Total : 4,25 €. Les coûts de l'IA baissent chaque année, donc ce nombre devrait diminuer."
      : "What it costs us to serve each therapist per month. Three parts: AI engine (€1.80 — powers Bloom, our AI assistant), servers and databases (€0.95 — hosting, storage, analytics), and customer support (€1.50 — helping therapists get started, drops as we build self-serve). Total: €4.25. AI costs keep getting cheaper every year, so this number should shrink.",
    grossMarginLabel: fr ? 'Marge brute' : 'Gross margin',
    infoGrossMargin: fr
      ? "Combien de chaque euro nous conservons après avoir payé le service. Si nous facturons 29 € et que ça nous coûte 4,25 € à livrer, nous gardons 85%. C'est excellent — la plupart des sociétés de logiciel gardent 70-75%. Les meilleures gardent 85-90%, ce qui est notre cas. Calculé automatiquement à partir du ARPU et du coût variable ci-dessus."
      : "How much of each euro we keep after paying for the service. If we charge €29 and it costs us €4.25 to deliver, we keep 85%. That's really good — most software companies keep 70-75%. The best keep 85-90%, which is where we are. Calculated automatically from ARPU and variable cost above.",
    infoCAC: fr
      ? "Combien nous dépensons pour acquérir un nouveau thérapeute payant — y compris le temps fondateur. Nous ne faisons pas de publicité — les thérapeutes ne font pas confiance aux pubs. Au lieu de cela : messages LinkedIn (80-120 € par inscription en comptant le temps), parrainages (29 € — nous offrons un mois gratuit), articles de blog et SEO (40-60 €), et stands en conférence (150-200 €). Moyenne pondérée : ~140 €. Cela augmentera vers 160-200 € en grandissant à mesure que les canaux organiques saturent. Reste en dessous de la médiane SaaS B2B (200-500 €)."
      : "How much we spend to get one new paying therapist — including founder time. We don't run ads — therapists don't trust ads. Instead: LinkedIn outreach (€80-120 per signup including founder hours), referrals (€29 — we give a free month), SEO & content (€40-60), and conferences (€150-200). Blended average: ~€140. This will rise to €160-200 as organic channels saturate. Still below typical B2B SaaS CAC (€200-500).",
    infoTeam: fr
      ? "Ce que nous payons l'équipe chaque mois. Prudent (8,5K €) : 2 fondateurs × 2K € + dev temps partiel 2,5K € + commercial 1,5K € + outils 500 €. Base (11K €) : 2 fondateurs × 2,5K € + dev 3K € + commercial 2K € + conseiller 1K €. Ambitieux (15K €) : 2 fondateurs × 3K € + dev temps plein 4K € + commercial 2,5K € + conseiller 1K € + marketeur 1,5K €. Augmente de 1,5-3K € tous les 6 mois pour accompagner la croissance. Tous les salaires en dessous du marché — les fondateurs misent sur l'equity."
      : "What we pay the team each month. Conservative (€8.5K): 2 founders × €2K + part-time dev €2.5K + sales €1.5K + tools €500. Base (€11K): 2 founders × €2.5K + dev €3K + sales €2K + advisor €1K. Aggressive (€15K): 2 founders × €3K + full-time dev €4K + sales €2.5K + advisor €1K + marketer €1.5K. Steps up €1.5-3K every 6 months as growth demands. All salaries below market — founders are betting on equity.",
    infoInfra: fr
      ? "Factures mensuelles pour les outils que nous payons quel que soit le nombre d'utilisateurs — base de données (25 €), outils de monitoring (20 €), nom de domaine, service d'email. Ça reste identique que nous ayons 10 ou 1 000 utilisateurs. Les coûts qui évoluent avec les utilisateurs (IA et stockage) sont déjà comptés dans le « coût variable » ci-dessus."
      : "Monthly bills for tools we pay no matter how many users we have — database (€25), monitoring tools (€20), domain name, email service. This stays the same whether we have 10 or 1,000 users. The costs that grow with users (like AI and storage) are already counted in the 'variable cost' above.",
    infoMarketing: fr
      ? "Ce que nous dépensons pour nous faire connaître — articles de blog, participation aux congrès de thérapie, outils de prospection LinkedIn, construction de communauté. Nous ne faisons pas de publicité payante car les thérapeutes n'y répondent pas. Ils font confiance aux recommandations de pairs et au contenu éducatif, c'est donc là que nous concentrons nos efforts."
      : "What we spend on getting the word out — blog posts, attending therapy conferences, LinkedIn outreach tools, building our community. We don't run paid ads because therapists don't respond to them. They trust peer recommendations and educational content, so that's where we focus.",
    infoOther: fr
      ? "Tout le reste — frais d'avocat, comptable, assurance et administration. Cela augmente quand nous obtenons la certification hébergement de données de santé (HDS), requise pour héberger des données patients en France. Cela ajoute environ 200-400 €/mois mais est indispensable pour travailler avec les thérapeutes."
      : "Everything else — lawyer fees, accountant, insurance, and admin. This goes up when we get our health data certification (HDS), which is required to host patient data in France. That adds about €200-400/mo but is essential for working with therapists.",
    infoStartingCash: fr
      ? "Combien d'argent nous levons auprès des investisseurs. Prudent : 400K €. Base : 500K €. Ambitieux : 650K €. Normal pour un pré-seed en Europe (250K-750K €). C'est notre carburant — ça détermine combien de mois nous pouvons fonctionner avant d'être rentables ou de lever à nouveau. Chaque scénario vise 28-30 mois de trésorerie, suffisant pour la fenêtre Série A."
      : "How much money we raise from investors. Conservative: €400K. Base: €500K. Aggressive: €650K. All within normal EU pre-seed range (€250K-€750K). This is our fuel — it decides how many months we can run before we need to be profitable or raise again. Each scenario targets 28-30 months of runway, enough for the Series A window.",
    equityOffered: fr ? 'Equity proposée' : 'Equity offered',
    infoEquity: fr
      ? "Quel % de la société les investisseurs obtiennent pour leur argent. Le standard pré-seed en UE est 10-20%. Prudent : 18% pour 400K €. Base : 16% pour 500K €. Ambitieux : 14% pour 650K €. Moins de dilution = les fondateurs gardent plus de parts mais implique une valorisation plus élevée à justifier. La valorisation pré-money se met à jour automatiquement ci-dessous."
      : "What % of the company investors get for their money. EU pre-seed standard is 10-20%. Conservative: 18% for €400K. Base: 16% for €500K. Aggressive: 14% for €650K. Lower dilution = founders keep more ownership but means a higher valuation you need to justify. The pre-money valuation updates automatically below.",
    preMoneyVal: fr ? 'Valorisation pré-money' : 'Pre-money valuation',
    infoPreMoney: fr
      ? "Ce que vaut la société avant l'investissement. Calculé comme : Levée ÷ Dilution% × (100% - Dilution%). Pour une startup pré-revenu, 1,5M-3M € est normal en Europe. Le produit fonctionnel, les marges brutes élevées (~83%) et la boucle complète praticien-membre justifient cette fourchette."
      : "What the company is worth before the investment goes in. Calculated as: Raise ÷ Dilution% × (100% - Dilution%). For a pre-revenue startup, €1.5M-€3M is normal in Europe. A working product, high gross margins (~83%), and the complete practitioner-member loop justify this range.",
    // Burn & Runway section
    monthlyBurnRunway: fr ? 'Burn mensuel & Trésorerie' : 'Monthly Burn & Runway',
    burnSubtitle: fr ? "Combien de temps l'argent dure au rythme actuel" : 'How long the money lasts at current spend',
    months: fr ? 'mois' : 'months',
    seedWindowCovered: fr ? 'Fenêtre seed couverte (18 mois+)' : 'Seed window covered (18mo+)',
    seedWindowWarning: fr ? 'Attention : < 18 mois de trésorerie' : 'Warning: < 18mo runway',
    whereBurnGoes: fr ? 'Où va le burn :' : 'Where the burn goes:',
    burnTeamDesc: fr ? '2 co-fondateurs + dev + conseiller' : '2 co-founders + dev + advisor',
    burnMarketingDesc: fr ? 'contenu, LinkedIn, conférences' : 'content, LinkedIn, conferences',
    burnInfraDesc: fr ? 'Supabase, Vercel, PostHog' : 'Supabase, Vercel, PostHog',
    burnOpsDesc: fr ? 'juridique, comptabilité, assurance' : 'legal, accounting, insurance',
    variableCostsScale: fr ? 'Les coûts variables (IA, hébergement par utilisateur) évoluent avec la croissance.' : 'Variable costs (AI, hosting per user) scale with growth.',
    whyComfortable: fr ? 'Pourquoi c\'est confortable :' : 'Why this is comfortable:',
    burnComfort36: (months: number) => fr
      ? `${months} mois nous donnent bien au-delà de la fenêtre seed de 18 mois. Même si la croissance est plus lente que prévu, nous avons le temps de nous ajuster avant d'avoir besoin de plus de capital.`
      : `${months} months gives us well beyond the 18-month seed window. Even if growth is slower than planned, we have time to adjust before needing more capital.`,
    burnComfort18: (months: number, beMonth: number | null) => fr
      ? `${months} mois couvrent la fenêtre seed standard de 18 mois. Nous atteignons la rentabilité${beMonth ? ` vers M${beMonth}` : ''} avant que l'argent ne s'épuise.`
      : `${months} months covers the standard 18-month seed window. We reach break-even${beMonth ? ` around M${beMonth}` : ''} before the money runs out.`,
    burnTight: (months: number) => fr
      ? `${months} mois c'est serré — moins que la fenêtre seed de 18 mois. Nous devrions soit lever plus, soit réduire les dépenses pour étendre la trésorerie.`
      : `${months} months is tight — less than the 18-month seed window. We should either raise more or cut spend to extend runway.`,
    // Use of Funds section
    useOfFunds: fr ? 'Utilisation des fonds' : 'Use of Funds',
    useOfFundsSubtitle: fr ? 'Comment nous prévoyons de dépenser chaque euro levé' : 'How we plan to spend every euro raised',
    product: fr ? 'Produit' : 'Product',
    goToMarket: fr ? 'Mise en marché' : 'Go-to-market',
    operations: fr ? 'Opérations' : 'Operations',
    uofProductDesc: fr
      ? "Construire la plateforme principale — tableau de bord praticien, assistant IA Bloom, application membre, bibliothèque de ressources. Couvre les salaires développeur et les coûts IA/cloud pour 18+ mois de développement."
      : "Build the core platform — practitioner dashboard, Bloom AI assistant, member app, resource library. Covers developer salaries and AI/cloud costs for 18+ months of development.",
    uofGtmDesc: fr
      ? "Acquérir les 100+ premiers praticiens via la prospection LinkedIn, le contenu SEO, le sponsoring de congrès de thérapie et la construction de communauté. Pas de publicité payante — les thérapeutes font confiance aux pairs, pas aux pubs."
      : "Acquire first 100+ practitioners through LinkedIn outreach, SEO content, therapy conference sponsorships, and community building. No paid ads — therapists trust peers, not ads.",
    uofTeamDesc: fr
      ? "Salaires des fondateurs (en dessous du marché), conseiller clinique, et un recrutement supplémentaire vers M12 quand nous dépasserons 100 praticiens."
      : "Founder salaries (below market), clinical advisor, and one additional hire around M12 as we scale past 100 practitioners.",
    uofOpsDesc: fr
      ? "Juridique (constitution SAS, conformité RGPD), certification hébergement de données de santé (HDS — obligatoire pour les données patients en France), comptabilité et assurance."
      : "Legal (SAS incorporation, RGPD compliance), health data certification (HDS — required for patient data in France), accounting, and insurance.",
    // The Ask section
    theAsk: fr ? 'La demande' : 'The Ask',
    theAskSubtitle: fr ? "Ce que nous levons, ce que les investisseurs obtiennent, et le chemin vers les retours" : "What we're raising, what investors get, and the path to returns",
    raising: fr ? 'Levée' : 'Raising',
    forEquity: fr ? 'Pour equity' : 'For equity',
    preMoney: fr ? 'Pré-money' : 'Pre-money',
    postMoney: fr ? 'Post-money' : 'Post-money',
    whyThisValuation: fr ? 'Pourquoi cette valorisation ?' : 'Why this valuation?',
    valuationJustification: fr
      ? "Soyons directs : nous sommes pré-revenu, donc cette valorisation repose sur le potentiel, pas sur la preuve. Ce qui la justifie : (1) Un produit fonctionnel complet — pas un prototype — avec la boucle praticien-membre déjà construite. (2) Des marges brutes modélisées à ~83%, dans le haut de la fourchette SaaS, avec un LTV/CAC de {ltvCac}x et un retour sur CAC de {payback} mois — à confirmer avec de vrais clients. (3) Le marché SaaS santé mentale en UE croît de 25%+/an sans plateforme dominante. La pré-money de {preMoney} est dans la fourchette standard pré-seed UE (1,5M-3M €). Si cela vous semble élevé pour du pré-revenu, nous sommes ouverts à une décote avec des milestones."
      : "Let's be direct: we're pre-revenue, so this valuation is based on potential, not proof. What justifies it: (1) A complete working product — not a prototype — with the full practitioner-member loop already built. (2) Modeled gross margins of ~83%, top-quartile for SaaS, with {ltvCac}x LTV/CAC and {payback}-month payback — though unproven with real customers. (3) The EU mental health SaaS market is growing 25%+/year with no dominant platform. Pre-money of {preMoney} is within standard EU pre-seed range (€1.5M-€3M). If that feels high for pre-revenue, we're open to a milestone-based discount.",
    ownershipAfterRound: fr ? 'Répartition du capital après le tour' : 'Ownership after round',
    founders: fr ? 'Fondateurs' : 'Founders',
    investors: fr ? 'Investisseurs' : 'Investors',
    foundersKeep: (pct: number) => fr
      ? `Les fondateurs gardent ${pct}% après ce tour. Nous prévoyons de réserver un pool ESOP de 10% en Série A (pas encore créé — préserve votre participation à ce stade). Après la dilution Série A (~15-20%), vos parts pré-seed représenteront toujours ${100 - pct}% d'un gâteau bien plus gros.`
      : `Founders keep ${pct}% after this round. We plan to reserve a 10% ESOP pool at Series A (not created yet — keeps your ownership undiluted at this stage). After Series A dilution (~15-20%), your pre-seed shares will still represent ${100 - pct}% of a much larger pie.`,
    whatYourInvestmentBecomes: fr ? 'Ce que vos {amount} pourraient devenir' : 'What your {amount} could become',
    pricePer1Pct: fr ? 'Prix par 1%' : 'Price per 1%',
    entryPriceToday: fr ? "prix d'entrée aujourd'hui" : 'entry price today',
    atSeriesA: fr ? '3x en Série A' : '3x at Series A',
    exitScenario10x: fr ? 'Scénario sortie 10x' : '10x exit scenario',
    seriesAPath: fr ? 'Chemin Série A (18 mois) :' : 'Series A path (18 months):',
    seriesAPathDesc: (pract: string, arr: string, dilution: number, value: string, perMonth: number) => fr
      ? `Si nous atteignons nos objectifs M18 — ${pract} praticiens, ${arr} ARR — nous prévoyons un step-up 3x en Série A, standard pour un seed-to-A en SaaS européen. Vos ${dilution}% vaudraient ${value} sur le papier. Ces objectifs nécessitent environ ${perMonth} nouveaux praticiens par mois, réalisable par la prospection LinkedIn et les parrainages seuls.`
      : `If we hit our M18 targets — ${pract} practitioners, ${arr} ARR — we expect a 3x step-up at Series A, which is standard for seed-to-A in European SaaS. Your ${dilution}% would be worth ${value} on paper. These targets require ~${perMonth} new practitioners per month, achievable through LinkedIn outreach and referrals alone.`,
    dealStructure: fr ? 'Structure du deal :' : 'Deal structure:',
    dealStructureDesc: fr
      ? "Conditions standard pré-seed UE — SAFE note ou tour pricé, avec droits pro-rata standards, droits d'information (rapports mensuels) et gouvernance favorable aux investisseurs. Pas de siège au conseil requis à ce stade, mais nous accueillons l'implication stratégique."
      : "Standard EU pre-seed terms — SAFE note or priced equity round, with standard pro-rata rights, information rights (monthly updates), and investor-friendly governance. No board seat required at this stage, but we welcome strategic involvement.",
    whyNow: fr ? 'Pourquoi maintenant :' : 'Why now:',
    whyNowDesc: fr
      ? "Le marché français de la santé mentale est à un point d'inflexion — les programmes de remboursement gouvernementaux ont été lancés en 2022, le burnout des praticiens est à des niveaux records, et il n'y a pas encore de plateforme dominante en UE. Investir avant que le product-market fit soit confirmé vous donne le meilleur prix d'entrée. Une fois que nous aurons 100+ praticiens et un MRR croissant, le prochain tour sera à 3-5x cette valorisation."
      : "France's mental health market is at an inflection point — government reimbursement programs launched in 2022, practitioner burnout is at record highs, and there's no dominant EU platform yet. Getting in before product-market fit is confirmed gives you the best entry price. Once we have 100+ practitioners and growing MRR, the next round will be at 3-5x this valuation.",
    // Path to Series A
    pathToSeriesA: fr ? 'Chemin vers la Série A' : 'Path to Series A',
    pathToSeriesASubtitle: fr ? 'Jalons clés sur la fenêtre seed de 18 mois' : 'Key milestones across the 18-month seed window',
    seedRaiseMilestone: fr ? 'Levée Seed' : 'Seed Raise',
    breakEven: fr ? 'Rentabilité' : 'Break-even',
    seriesAReady: fr ? 'Prêt Série A' : 'Series A Ready',
    now: fr ? 'Maintenant' : 'Now',
    month: fr ? 'Mois' : 'Month',
    pract: fr ? 'prat.' : 'pract.',
    m18Target: fr ? 'Objectif M18' : 'M18 target',
    m0m6Title: fr ? 'M0-M6 — Construire & valider :' : 'M0-M6 — Build & validate:',
    m0m6Desc: fr
      ? "Livrer le MVP, embarquer les 30-50 premiers thérapeutes par démarchage personnel. Se concentrer sur la rétention plutôt que l'acquisition — si les thérapeutes restent après le mois 3, c'est un signal de product-market fit."
      : "Ship the MVP, onboard first 30-50 therapists through personal outreach. Focus on retention over acquisition — if therapists stay past month 3, we have product-market fit signal.",
    m6m12Title: fr ? 'M6-M12 — Accélérer ce qui marche :' : 'M6-M12 — Scale what works:',
    m6m12Desc: (mrr: string) => fr
      ? `Doubler sur les canaux qui convertissent (LinkedIn, parrainages). Atteindre 100+ praticiens, ${mrr}+ MRR. Commencer à voir le bouche-à-oreille organique des utilisateurs satisfaits.`
      : `Double down on channels that convert (LinkedIn, peer referrals). Hit 100+ practitioners, ${mrr}+ MRR. Start seeing organic word-of-mouth from happy users.`,
    m12m18Title: fr ? 'M12-M18 — Prêt pour la Série A :' : 'M12-M18 — Series A ready:',
    m12m18Desc: (pract: string, arr: string) => fr
      ? `Atteindre ${pract} praticiens, ${arr} ARR, et des métriques de rétention solides. À ce stade, nous avons les données pour lever une Série A de 1,5-3M € avec un step-up de 3-5x par rapport à la valorisation actuelle.`
      : `Reach ${pract} practitioners, ${arr} ARR, and strong retention metrics. At this point we have the data to raise a €1.5-3M Series A at a 3-5x step-up from today's valuation.`,
    pathConclusionTitle: fr ? 'Ce que cela signifie pour vous :' : 'What this means for you:',
    pathConclusion: (runwayMonths: number, beMonth: number | null, arr100k: number | null, m18Arr: string, raise: string) => {
      const hitsBreakEven = beMonth !== null && beMonth <= 36
      const hits100k = arr100k !== null && arr100k <= 36
      if (fr) {
        return `Votre ${raise} finance ${runwayMonths} mois d'exploitation.${hitsBreakEven ? ` Nous atteignons la rentabilité vers M${beMonth}, donc l'entreprise s'autofinance avant que l'argent ne s'épuise.` : ` Nous n'atteignons pas encore la rentabilité sur cette fenêtre — l'objectif est d'atteindre suffisamment de traction pour lever un tour suivant avant.`}${hits100k ? ` Nous franchissons les 100K € d'ARR vers M${arr100k}.` : ''} À M18, nous visons ${m18Arr} d'ARR — si nous y arrivons, c'est la preuve pour lever une Série A. Si la croissance est plus lente, nous avons assez de trésorerie pour ajuster le plan sans panique.`
      }
      return `Your ${raise} funds ${runwayMonths} months of operations.${hitsBreakEven ? ` We hit break-even around M${beMonth}, so the business sustains itself before the money runs out.` : ` We don't reach break-even within this window — the goal is to build enough traction to raise a follow-on round before then.`}${hits100k ? ` We cross €100K ARR around M${arr100k}.` : ''} By M18 we target ${m18Arr} ARR — if we get there, that's the proof point to raise a Series A. If growth is slower, we have enough runway to adjust the plan without panic.`
    },
    // Key metrics cards
    mrrAtM18: fr ? 'MRR @ M18' : 'MRR @ M18',
    practAtM18: fr ? 'Praticiens @ M18' : 'Practitioners @ M18',
    atPractitioners: (n: number) => fr ? `À environ ${n} praticiens` : `At ~${n} practitioners`,
    monthsRunway: (n: number) => fr ? `${n} mois de trésorerie` : `${n} months runway`,
    // Key metric takeaways
    takeawayMrr: (m18Arr: string, m36Arr: string) => fr
      ? `À M18 c'est notre preuve pour lever une Série A. À M36 (${m36Arr} ARR), c'est un vrai business SaaS.`
      : `At M18 this is our proof point to raise a Series A. By M36 (${m36Arr} ARR), this is a real SaaS business.`,
    takeawayPract: (membersPerPract: number) => fr
      ? `Chaque praticien amène ~${membersPerPract} patients gratuitement. C'est la distribution, pas juste du revenu.`
      : `Each practitioner brings ~${membersPerPract} clients for free. This is distribution, not just revenue.`,
    takeawayLtvCac: (ratio: number) => {
      if (ratio >= 10) return fr
        ? `La cible sectorielle est 3x. ${ratio}x signifie que chaque euro de marketing en rapporte ${ratio}. L'économie fonctionne.`
        : `Industry target is 3x. ${ratio}x means every €1 of marketing returns €${ratio}. The economics work.`
      if (ratio >= 3) return fr
        ? `Au-dessus de la cible de 3x — chaque euro d'acquisition génère un retour sain.`
        : `Above the 3x target — every acquisition euro generates a healthy return.`
      return fr
        ? `En dessous de la cible de 3x — l'acquisition coûte trop cher par rapport à la valeur client.`
        : `Below the 3x target — acquisition costs too much relative to customer value.`
    },
    takeawayBreakEven: (beMonth: number | null, runwayMonths: number) => {
      if (beMonth && beMonth <= 18) return fr
        ? `Rentable avant la fenêtre Série A. Pas de pression pour lever — on lève par choix, pas par nécessité.`
        : `Profitable before the Series A window. No pressure to raise — we raise by choice, not necessity.`
      if (beMonth && beMonth <= runwayMonths) return fr
        ? `Rentable avant que l'argent ne s'épuise. Pas besoin de tour de secours.`
        : `Profitable before the money runs out. No emergency round needed.`
      return fr
        ? `Pas encore rentable sur cette fenêtre — l'objectif est d'avoir assez de traction pour lever un tour suivant.`
        : `Not yet profitable in this window — the goal is enough traction to raise a follow-on round.`
    },
    // Waterfall section
    marginWaterfall: fr ? 'Cascade de marge' : 'Margin Waterfall',
    waterfallSubtitle: fr ? 'Par praticien par mois — du revenu à la marge de contribution' : 'Per practitioner per month — from revenue to contribution margin',
    revenueArpu: fr ? 'Revenu (ARPU)' : 'Revenue (ARPU)',
    revenueArpuCtx: fr
      ? `Ce que chaque praticien nous paie par mois — moyenne pondérée : ${assumptions.essentielPct}% × €${TIER_PRICES.essentiel} + ${assumptions.proPct}% × €${TIER_PRICES.pro} + ${cabinetPct}% × €${TIER_PRICES.cabinet}`
      : `What each practitioner pays us per month — weighted average: ${assumptions.essentielPct}% × €${TIER_PRICES.essentiel} + ${assumptions.proPct}% × €${TIER_PRICES.pro} + ${cabinetPct}% × €${TIER_PRICES.cabinet}`,
    aiClaude: fr ? 'IA (Claude Haiku)' : 'AI (Claude Haiku)',
    aiClaudeCtx: fr ? "Coût de l'IA par praticien — alimente Bloom, notre assistant IA. Baisse chaque année" : 'AI cost per practitioner — powers Bloom, our AI assistant. Gets cheaper every year',
    infrastructure: fr ? 'Infrastructure' : 'Infrastructure',
    infrastructureCtx: fr ? 'Hébergement, base de données, analytics, email — indépendant du nombre d\'utilisateurs' : 'Hosting, database, analytics, email — does not scale with users',
    support: 'Support',
    supportCtx: fr ? "Aide à l'onboarding des praticiens — diminue avec le self-service" : 'Helping practitioners get started — shrinks as we build self-serve',
    grossProfit: fr ? 'Marge brute' : 'Gross Profit',
    grossProfitCtx: fr ? 'Ce qui reste après avoir payé la livraison du service — notre vraie marge' : "What's left after paying to deliver the service — our true margin",
    cacAmortized: fr ? 'CAC amorti' : 'CAC amortized',
    cacAmortizedCtx: (cac: number, lifetime: string) => fr
      ? `Coût d'acquisition (€${cac}) étalé sur la durée de vie du client (${lifetime} mois) — le coût mensuel réel d'avoir acquis ce praticien`
      : `Acquisition cost (€${cac}) spread over customer lifetime (${lifetime} months) — the real monthly cost of having acquired this practitioner`,
    contributionMargin: fr ? 'Marge de contribution' : 'Contribution Margin',
    contributionMarginCtx: fr ? 'Le profit réel par praticien après tout — service + acquisition. Si ce chiffre est positif, chaque nouveau client rend le business plus rentable' : 'Real profit per practitioner after everything — serving + acquisition. If this number is positive, every new customer makes the business more profitable',
    waterfallHowToRead: fr
      ? "Comment lire : on commence par ce qu'un praticien nous rapporte (ARPU), on soustrait ce que ça coûte de le servir (IA, infra, support), ce qui donne la marge brute. Ensuite on soustrait le coût d'acquisition amorti sur sa durée de vie — ce qui reste est ce qu'on gagne réellement par praticien."
      : "How to read this: start with what one practitioner pays us (ARPU), subtract what it costs to serve them (AI, infra, support) to get gross profit. Then subtract the acquisition cost spread over their lifetime — what's left is what we actually earn per practitioner.",
    waterfallTakeaway: (cm: string, cmPct: string, gmPct: string) => fr
      ? `Conclusion : sur chaque €1 de revenu, nous gardons ${gmPct}% après les coûts de service et ${cmPct}% après acquisition. Ça signifie que chaque nouveau praticien génère ${cm}/mois de profit réel — le modèle se paie de lui-même.`
      : `Bottom line: of every €1 in revenue, we keep ${gmPct}% after serving costs and ${cmPct}% after acquisition. That means every new practitioner generates ${cm}/mo in real profit — the model pays for itself.`,
    b2cPremiumUpside: fr
      ? `Bonus non compté ci-dessus : chaque praticien amène ~{members} patients sur l'app. Si {pct}% d'entre eux passent à la version premium (€{price}/mois), ça ajoute €{amount}/praticien/mois de revenu supplémentaire — sans aucun coût d'acquisition. On ne compte pas dessus dans le modèle, mais c'est du pur potentiel de hausse.`
      : `Bonus not counted above: each practitioner brings ~{members} clients onto the app. If {pct}% of them upgrade to premium (€{price}/mo), that adds €{amount}/practitioner/mo in extra revenue — at zero acquisition cost. We don't bank on this in the model, but it's pure upside.`,
    // B2B2C Advantage
    b2b2cTitle: fr ? 'Avantage B2B2C — Pourquoi notre CAC est différent' : 'B2B2C Advantage — Why Our CAC is Different',
    b2b2cSubtitle: fr ? "Notre arme secrète : les praticiens font l'acquisition d'utilisateurs pour nous" : 'Our secret weapon: practitioners do the user acquisition for us',
    practitionerCAC: fr ? 'CAC praticien' : 'Practitioner CAC',
    onePractitioner: fr ? '1 praticien' : '1 practitioner',
    effectiveMemberCAC: fr ? 'CAC membre effectif' : 'Effective member CAC',
    vsB2CApps: fr ? 'vs. 30-50 € pour les apps B2C' : 'vs. €30-50 for B2C apps',
    membersOnboardedZeroCost: fr ? 'Membres embarqués par le praticien — zéro coût d\'acquisition' : 'Members onboarded by practitioner — zero acquisition cost',
    howItWorks: fr ? 'Comment ça marche :' : 'How it works:',
    howItWorksDesc: (cac: number, membersPerPract: number) => fr
      ? `Nous vendons uniquement aux thérapeutes (B2B). Chaque thérapeute invite ensuite ses propres patients sur l'application — nous ne dépensons pas un centime pour acquérir ces utilisateurs. Un thérapeute avec 15-25 patients actifs en amène environ ${membersPerPract} sur la plateforme. Donc pour chaque ${cac} € dépensé, nous obtenons 1 client payant + ${membersPerPract} utilisateurs engagés gratuitement.`
      : `We only sell to therapists (B2B). Each therapist then invites their own clients onto the app — we never spend a cent acquiring those users. A therapist with 15-25 active clients brings ~${membersPerPract} onto the platform. So for every €${cac} we spend, we get 1 paying customer + ${membersPerPract} engaged users for free.`,
    whyItCompounds: fr ? 'Pourquoi ça compose :' : 'Why it compounds:',
    whyItCompoundsDesc: (effectiveMemberCAC: number) => fr
      ? `Les membres qui aiment l'application disent à leurs amis en thérapie de demander à leur thérapeute Bloomsline. Les thérapeutes entendent parler de nous par leurs pairs en congrès ou en supervision. Cela crée un volant : plus de thérapeutes → plus de membres → plus de bouche-à-oreille → plus de thérapeutes. Headspace et Calm dépensent 30-50 € par utilisateur. Nous dépensons ${effectiveMemberCAC} €.`
      : `Members who love the app tell friends in therapy to ask their therapist about Bloomsline. Therapists hear about us from peers at conferences or in supervision groups. This creates a flywheel: more therapists → more members → more word-of-mouth → more therapists. Headspace and Calm spend €30-50 per user. We spend €${effectiveMemberCAC}.`,
    // Revenue projection
    revenueProjection: fr ? 'Projection de revenus' : 'Revenue Projection',
    revenueProjectionDesc: (arpu: string, initialGrowth: number, endGrowth: number) => fr
      ? `MRR sur 36 mois — ${arpu} € ARPU pondéré, croissance ${initialGrowth}% → ${endGrowth}%/mois`
      : `MRR over 36 months — €${arpu} blended ARPU, growth ${initialGrowth}% → ${endGrowth}%/mo`,
    revenueProjectionCtx: (m18Mrr: string, m36Mrr: string) => fr
      ? `Ce graphique montre notre revenu mensuel récurrent (MRR) — ce que les praticiens nous paient chaque mois. La courbe accélère car chaque nouveau praticien ajoute du revenu récurrent. La ligne pointillée marque le mois 18 — notre fenêtre cible pour lever une Série A. À gauche de la ligne : ce qu'on construit avec la levée seed. À droite : comment le business continue de croître après. M18 : ${m18Mrr}/mois. M36 : ${m36Mrr}/mois.`
      : `This chart shows our monthly recurring revenue (MRR) — what practitioners pay us each month. The curve accelerates because every new practitioner adds recurring revenue on top. The dashed line marks month 18 — our target window to raise a Series A. Left of the line: what we build with seed money. Right of the line: how the business keeps growing after. M18: ${m18Mrr}/mo. M36: ${m36Mrr}/mo.`,
    // Customer growth
    customerGrowth: fr ? 'Croissance clients' : 'Customer Growth',
    customerGrowthDesc: (membersPerPract: number) => fr
      ? `Praticiens et membres (multiplicateur B2B2C : 1 prat. = ${membersPerPract} membres)`
      : `Practitioners and members (B2B2C multiplier: 1 pract. = ${membersPerPract} members)`,
    customerGrowthCtx: (m18Pract: string, m18Members: string, membersPerPract: number) => fr
      ? `Deux courbes, un seul coût d'acquisition. La ligne bleue (praticiens) représente nos clients payants — c'est eux qu'on acquiert. La ligne verte (membres) représente leurs patients qui utilisent l'app gratuitement — chaque praticien en amène ~${membersPerPract}. La ligne pointillée marque le mois 18 (fenêtre Série A). L'écart entre les deux courbes est notre avantage B2B2C : une base d'utilisateurs massive sans payer pour les acquérir. M18 : ${m18Pract} praticiens → ${m18Members} membres.`
      : `Two curves, one acquisition cost. The blue line (practitioners) is our paying customers — these are who we acquire. The green line (members) is their clients using the app for free — each practitioner brings ~${membersPerPract}. The dashed line marks month 18 (Series A window). The gap between the two curves is our B2B2C advantage: a massive user base without paying to acquire them. M18: ${m18Pract} practitioners → ${m18Members} members.`,
    m18SeedWindow: fr ? 'Fenêtre seed M18' : 'M18 seed window',
    // Unit economics
    unitEconomics: fr ? 'Unit economics' : 'Unit Economics',
    blendedArpu: fr ? 'ARPU pondéré' : 'Blended ARPU',
    perPractMoB2B: fr ? '/praticien/mois (B2B uniquement)' : '/practitioner/mo (B2B only)',
    ltv: 'LTV',
    moLifetime: fr ? 'mois de durée de vie' : 'mo lifetime',
    cac: 'CAC',
    organicAcquisition: fr ? 'acquisition organique' : 'organic acquisition',
    ltvCac: 'LTV/CAC',
    target3x: fr ? 'cible : >3x' : 'target: >3x',
    payback: fr ? 'Retour sur CAC' : 'Payback',
    targetLt12mo: fr ? 'cible : <12 mois' : 'target: <12mo',
    variableCost: fr ? 'coût variable' : 'variable cost',
    unitEconomicsCtx: fr
      ? "Les unit economics répondent à une question simple : est-ce que chaque client nous rapporte plus qu'il ne nous coûte ? Si oui, le business devient plus rentable à chaque nouveau client. Ces 6 métriques sont ce que les investisseurs SaaS regardent en premier — elles montrent si le moteur fonctionne avant même de regarder la croissance."
      : "Unit economics answer one simple question: does each customer bring in more than they cost? If yes, the business gets more profitable with every new customer. These 6 metrics are what SaaS investors look at first — they show whether the engine works before even looking at growth.",
    // Expense breakdown
    expenseBreakdown: fr ? 'Répartition des dépenses' : 'Expense Breakdown',
    expenseBreakdownDesc: fr ? 'Dépenses trimestrielles par catégorie (inclut le COGS)' : 'Quarterly expenses by category (includes COGS)',
    expenseBreakdownCtx: fr
      ? "Ce graphique montre où va chaque euro, trimestre par trimestre. Le bleu (équipe) est le plus gros poste — c'est normal en SaaS, les gens sont le principal investissement. Le rose (COGS) grandit avec le nombre d'utilisateurs — c'est le coût IA et serveurs. L'orange (CAC) augmente quand on acquiert plus vite. Si le bleu domine et le reste reste petit, la structure de coûts est saine."
      : "This chart shows where every euro goes, quarter by quarter. Blue (team) is the biggest block — that's normal in SaaS, people are the main investment. Pink (COGS) grows with users — that's AI and server costs. Orange (CAC) increases as we acquire faster. If blue dominates and everything else stays small, the cost structure is healthy.",
    // Runway & Cash
    runwayCash: fr ? 'Trésorerie & Position de caisse' : 'Runway & Cash Position',
    runwayCashDesc: fr ? 'Trésorerie cumulée avec jalons' : 'Cumulative cash with milestones',
    runwayCashCtx: (raise: string, runwayMonths: number, beMonth: number | null) => fr
      ? `Ce graphique montre combien d'argent il reste en banque mois après mois. On commence avec ${raise} (la levée seed) et on dépense chaque mois pour l'équipe, le marketing et l'infrastructure. La ligne verte descend tant qu'on dépense plus qu'on ne gagne. La ligne rouge pointillée à €0 est le seuil critique — si la courbe la croise, on est à court de cash. La ligne pointillée verticale « M18 » marque la fenêtre Série A.${beMonth ? ` La ligne verte « Rentabilité » à M${beMonth} montre quand les revenus couvrent enfin les dépenses — après ce point, la courbe remonte.` : ' Dans ce scénario, on n\'atteint pas la rentabilité sur 36 mois — l\'objectif est de lever un tour suivant avant que le cash ne s\'épuise.'} Trésorerie actuelle : ${runwayMonths} mois avant d'atteindre zéro.`
      : `This chart shows how much money is left in the bank month by month. We start with ${raise} (the seed raise) and spend each month on team, marketing, and infrastructure. The green line slopes down as long as we spend more than we earn. The red dashed line at €0 is the danger zone — if the curve crosses it, we're out of cash. The vertical dashed "M18" line marks the Series A window.${beMonth ? ` The green "Break-even" line at M${beMonth} shows when revenue finally covers expenses — after that point, the curve bends back up.` : " In this scenario, we don't reach break-even within 36 months — the goal is to raise a follow-on round before cash runs out."} Current runway: ${runwayMonths} months before hitting zero.`,
    seedWindow: fr ? 'Fenêtre seed' : 'Seed window',
    // Industry benchmarks
    industryBenchmarks: fr ? 'Benchmarks sectoriels' : 'Industry Benchmarks',
    industryBenchmarksCtx: fr
      ? "Ce tableau compare nos métriques aux standards du secteur SaaS. La colonne « Médiane SaaS » montre où se situe une entreprise SaaS typique. « Top décile » montre les 10% les meilleurs. Notre colonne (Bloomsline) se met à jour en temps réel quand vous ajustez les hypothèses. L'objectif : être au-dessus de la médiane sur chaque ligne, idéalement proche du top décile. Ça prouve aux investisseurs que notre modèle économique n'est pas juste « correct » — il est dans les meilleurs de sa catégorie."
      : "This table compares our metrics against SaaS industry standards. The \"SaaS Median\" column shows where a typical SaaS company lands. \"Top Decile\" shows the top 10%. Our column (Bloomsline) updates in real-time as you adjust assumptions. The goal: be above the median on every row, ideally near the top decile. This proves to investors that our business model isn't just \"okay\" — it's best-in-class.",
    vsSaasStandards: fr ? 'vs. standards SaaS' : 'vs. SaaS standards',
    metric: fr ? 'Métrique' : 'Metric',
    saasMedian: fr ? 'Médiane SaaS' : 'SaaS Median',
    topDecile: fr ? 'Top décile' : 'Top Decile',
    benchmarkFooter: fr
      ? 'Les valeurs se mettent à jour en temps réel quand vous ajustez les hypothèses. Voir'
      : 'Values update in real-time as you adjust assumptions. See',
    unitEconomicsLink: fr ? 'Unit Economics' : 'Unit Economics',
    forDetailedAnalysis: fr ? "pour l'analyse détaillée." : 'for detailed analysis.',
    // Benchmark metric names
    benchGrossMargin: fr ? 'Marge brute' : 'Gross Margin',
    benchLtvCac: 'LTV/CAC',
    benchCacPayback: fr ? 'Retour sur CAC' : 'CAC Payback',
    benchMonthlyChurn: fr ? 'Attrition mensuelle' : 'Monthly Churn',
    benchCAC: 'CAC',
    benchARPU: 'ARPU',
    benchCacPaybackMo: fr ? 'mois' : 'mo',
    // Narrative summary
    narrativeRaising: fr ? 'Nous levons' : "We're raising",
    narrativeBurnRate: fr ? 'À un burn rate de' : 'At a burn rate of',
    narrativeRunway: fr ? "c'est" : "that's",
    narrativeRunwayPlus: fr ? '+ mois de trésorerie.' : '+ months of runway.',
    narrativeTierPricing: fr ? 'Notre tarification 3 niveaux' : 'Our 3-tier pricing',
    narrativeYieldsBlended: fr ? 'produit un' : 'yields a blended',
    narrativeArpu: 'ARPU',
    narrativeWith: fr ? 'avec' : 'with',
    narrativeGrossMargin: fr ? 'de marge brute' : 'gross margin',
    narrativePayback: fr ? 'de retour sur CAC' : 'payback',
    narrativeIn18Months: fr ? 'En 18 mois nous visons' : 'In 18 months we target',
    narrativeAnd: fr ? 'et' : 'and',
    narrativeHonestNote: fr
      ? "Ces unit economics sont calculés, pas prouvés. Nous n'avons pas encore de clients payants. Le modèle ci-dessous teste si les fondamentaux tiennent sous différentes hypothèses — ajustez les curseurs pour casser le modèle et voir où il résiste."
      : "These unit economics are modeled, not proven. We have no paying customers yet. The model below stress-tests whether the fundamentals hold under different assumptions — move the sliders to break it and see where it holds.",
    // Chart tooltips
    tooltipGrowth: fr ? 'Croissance' : 'Growth',
    tooltipPractitioners: fr ? 'Praticiens' : 'Practitioners',
    tooltipMembers: fr ? 'Membres' : 'Members',
    tooltipCash: fr ? 'Trésorerie' : 'Cash',
    tooltipNetBurn: fr ? 'Burn net' : 'Net burn',
    tooltipMargin: fr ? 'Marge' : 'Margin',
    tooltipCOGS: 'COGS',
    tooltipAcquisition: fr ? 'Acquisition' : 'Acquisition',
    tooltipTotal: fr ? 'Total' : 'Total',
    // Today anchor banner
    todayTitle: fr ? "Aujourd'hui — Février 2026" : 'Today — February 2026',
    todayPreRevenue: fr ? 'Pré-revenu' : 'Pre-revenue',
    todayPaying: fr ? '0 praticien payant' : '0 paying practitioners',
    todayBeta: fr ? '15 testeurs bêta' : '15 beta testers',
    todayLive: fr ? 'Produit en ligne' : 'Product live',
    todayGrounding: fr
      ? "Soyons honnêtes sur le point de départ. Nous sommes pré-revenu avec un produit live et des testeurs bêta, pas des clients payants. L'objectif avant la clôture du tour : convertir 5-10 praticiens en clients payants pour prouver que quelqu'un sortira sa carte bancaire. Toutes les projections ci-dessous partent de 10 praticiens payants — un objectif réaliste mais non garanti."
      : "Let's be honest about the starting point. We're pre-revenue with a live product and beta testers, not paying customers. The goal before close: convert 5-10 practitioners into paying customers to prove someone will swipe their card. All projections below start from 10 paying practitioners — a realistic but not guaranteed assumption.",
    // Scaling team costs
    teamStepUp: fr ? 'Augmentation par palier' : 'Step-up per hire',
    teamStepInterval: fr ? 'Intervalle palier' : 'Step interval',
    infoTeamStepUp: fr
      ? "Combien le coût d'équipe mensuel augmente à chaque palier. Représente les embauches progressives — dev, marketing, support — à mesure que nous grandissons."
      : 'How much the monthly team cost increases at each step-up. Represents gradual hires — dev, marketing, support — as we scale.',
    infoTeamStepInterval: fr
      ? "Tous les combien de mois nous ajoutons un nouveau palier de coût d'équipe. 6 mois est typique pour une startup en phase de démarrage."
      : 'How many months between each team cost step-up. 6 months is typical for an early-stage startup.',
    // CAC evolution
    cacGrowthLabel: fr ? 'Croissance CAC / trimestre' : 'CAC growth / quarter',
    infoCacGrowth: fr
      ? "Le CAC augmente naturellement en grandissant — les premiers clients sont les plus faciles. 7% par trimestre signifie que le CAC double environ en 3 ans. C'est réaliste pour l'acquisition organique."
      : 'CAC naturally rises as you scale — the first customers are the easiest. 7% per quarter means CAC roughly doubles over 3 years. This is realistic for organic acquisition.',
    cacEvolution: fr ? 'Évolution CAC' : 'CAC evolution',
    // Stress test
    stressTest: fr ? 'Stress test' : 'Stress Test',
    downsideTitle: fr ? 'Analyse scénario pessimiste' : 'Downside Scenario Analysis',
    downsideSubtitle: fr
      ? 'Que se passe-t-il si les choses ne se passent pas comme prévu — et notre plan de réaction'
      : "What happens if things don't go as planned — and our response plan",
    currentScenario: fr ? 'Scénario actuel' : 'Current scenario',
    stressScenario: fr ? 'Scénario stress' : 'Stress scenario',
    stressRunway: fr ? 'Trésorerie' : 'Runway',
    stressBreakEven: fr ? 'Rentabilité' : 'Break-even',
    stressM18Pract: fr ? 'Praticiens M18' : 'M18 practitioners',
    stressM18Arr: fr ? 'ARR M18' : 'M18 ARR',
    stressCashM18: fr ? 'Cash M18' : 'Cash at M18',
    pivotPlanTitle: fr ? 'Plan de pivot' : 'Pivot plan',
    pivotPlanDesc: fr
      ? "On ne prétend pas que tout ira bien. Voici nos déclencheurs concrets : (1) M3 — si <5 praticiens payants, on arrête le développement produit et on passe 100% en vente directe. (2) M6 — si burn > prévisions de 20%, on coupe les coûts d'équipe de 30% immédiatement. (3) M9 — si la rétention est <80% à 3 mois, on pivote le produit avant de dépenser plus en acquisition. (4) M12 — si <€2K MRR, on lève un bridge de 100-150K € ou on prépare un shutdown propre avec 3 mois de cash restant. Pas de déni — des seuils clairs et des actions définies."
      : "We're not pretending everything will work. Here are our concrete triggers: (1) M3 — if <5 paying practitioners, we stop product development and go 100% direct sales. (2) M6 — if burn exceeds forecast by 20%, we cut team costs 30% immediately. (3) M9 — if retention is <80% at 3 months, we pivot the product before spending more on acquisition. (4) M12 — if <€2K MRR, we raise a €100-150K bridge or prepare a clean shutdown with 3 months cash remaining. No denial — clear thresholds, defined actions.",
    // Stress mode banner
    stressBannerTitle: fr ? 'Mode stress test actif' : 'Stress test mode active',
    stressBannerDesc: fr
      ? "Vous regardez le scénario pessimiste : croissance divisée par deux (15%), attrition plus élevée (7%), CAC plus cher (70 €), levée réduite (350K €). Ce scénario teste ce qui se passe quand tout est plus dur que prévu. Comparez avec les scénarios Base ou Prudent pour voir l'écart."
      : "You're viewing the downside scenario: half the growth (15%), higher churn (7%), more expensive CAC (€70), smaller raise (€350K). This scenario tests what happens when everything is harder than planned. Switch to Base or Conservative to see the gap.",
    // Quarterly P&L
    quarterlyPnL: fr ? 'Compte de résultat trimestriel' : 'Quarterly P&L',
    quarterlyPnLSubtitle: fr ? 'Agrégé par trimestre sur 3 ans' : 'Aggregated by quarter over 3 years',
    pnlRevenue: fr ? 'Revenu' : 'Revenue',
    pnlCOGS: 'COGS',
    pnlGrossProfit: fr ? 'Marge brute' : 'Gross Profit',
    pnlEBITDA: 'EBITDA',
    pnlCumulativeCash: fr ? 'Trésorerie cumulée' : 'Cumulative Cash',
    pnlPractitioners: fr ? 'Praticiens' : 'Practitioners',
    pnlARR: 'ARR',
  }

  // Waterfall data (per practitioner, per month)
  const waterfall = useMemo(() => {
    const arpu = ue.blendedArpu
    const vc = assumptions.variableCostPerPract
    const gp = arpu - vc
    const churnRate = assumptions.churnPct / 100
    const avgLife = churnRate > 0 ? 1 / churnRate : 100
    const cacAmort = assumptions.cac / avgLife
    const cm = gp - cacAmort
    const lifetimeStr = avgLife.toFixed(0)
    return [
      { label: t.revenueArpu, value: arpu, widthPct: 100, color: 'bg-indigo-500', textColor: 'text-indigo-600', ctx: t.revenueArpuCtx },
      { label: t.aiClaude, value: -(vc * VC_AI_SHARE), widthPct: (vc * VC_AI_SHARE / arpu) * 100, color: 'bg-rose-400', textColor: 'text-rose-500', ctx: t.aiClaudeCtx },
      { label: t.infrastructure, value: -(vc * VC_INFRA_SHARE), widthPct: (vc * VC_INFRA_SHARE / arpu) * 100, color: 'bg-rose-300', textColor: 'text-rose-400', ctx: t.infrastructureCtx },
      { label: t.support, value: -(vc * VC_SUPPORT_SHARE), widthPct: (vc * VC_SUPPORT_SHARE / arpu) * 100, color: 'bg-rose-200', textColor: 'text-rose-300', ctx: t.supportCtx },
      { label: t.grossProfit, value: gp, widthPct: (gp / arpu) * 100, color: 'bg-emerald-500', textColor: 'text-emerald-600', isBold: true, ctx: t.grossProfitCtx },
      { label: t.cacAmortized, value: -cacAmort, widthPct: (cacAmort / arpu) * 100, color: 'bg-amber-400', textColor: 'text-amber-500', ctx: t.cacAmortizedCtx(assumptions.cac, lifetimeStr) },
      { label: t.contributionMargin, value: cm, widthPct: Math.max(0, (cm / arpu) * 100), color: 'bg-emerald-600', textColor: 'text-emerald-700', isBold: true, ctx: t.contributionMarginCtx },
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ue.blendedArpu, assumptions.variableCostPerPract, assumptions.churnPct, assumptions.cac, locale])

  // Benchmark values (dynamic)
  const benchmarkValues = useMemo(() => [
    `${ue.grossMarginPct}%`,
    `${ue.ltvCacRatio}x`,
    `${ue.paybackMonths} ${fr ? 'mois' : 'mo'}`,
    `${assumptions.churnPct}%`,
    `€${ue.cac}`,
    `€${ue.blendedArpu}`,
  ], [ue, assumptions.churnPct, fr])

  const scenarioButtons: Array<{ key: 'conservative' | 'base' | 'aggressive' | 'stress'; label: string; isStress?: boolean }> = [
    { key: 'conservative', label: t.conservative },
    { key: 'base', label: t.base },
    { key: 'aggressive', label: t.aggressive },
    { key: 'stress', label: t.stressTest, isStress: true },
  ]

  const uof = assumptions.useOfFunds
  const fundSegments = [
    { label: t.product, pct: uof.product, color: 'bg-indigo-500', amount: Math.round(assumptions.startingCash * uof.product / 100) },
    { label: t.goToMarket, pct: uof.gtm, color: 'bg-emerald-500', amount: Math.round(assumptions.startingCash * uof.gtm / 100) },
    { label: t.team, pct: uof.team, color: 'bg-blue-500', amount: Math.round(assumptions.startingCash * uof.team / 100) },
    { label: t.operations, pct: uof.ops, color: 'bg-gray-400', amount: Math.round(assumptions.startingCash * uof.ops / 100) },
  ]

  const milestones = [
    { label: t.seedRaiseMilestone, value: fmtEuro(assumptions.startingCash), done: true, month: t.now },
    { label: '€100K ARR', value: runway.arr100kMonth ? `M${runway.arr100kMonth}` : t.never, done: false, month: runway.arr100kMonth ? `${t.month} ${runway.arr100kMonth}` : '' },
    { label: t.breakEven, value: runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never, done: false, month: runway.breakEvenPractitioners ? `${runway.breakEvenPractitioners} ${t.pract}` : '' },
    { label: t.seriesAReady, value: `${fmtNumber(m18.practitioners)} ${t.pract}`, done: false, month: t.m18Target },
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
            <p className="text-[10px] text-gray-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {scenarioButtons.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenarioPreset(s.key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                scenario === s.key
                  ? s.isStress ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-900 text-white shadow-sm'
                  : s.isStress ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.isStress && <AlertTriangle className="w-3 h-3" />}
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {locale === 'en' ? 'FR' : 'EN'}
          </button>
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
              {t.narrativeRaising} <span className="font-semibold text-gray-900">{fmtEuro(assumptions.startingCash)}</span>.
              {' '}{t.narrativeBurnRate} <span className="font-semibold text-gray-900">{fmtEuro(runway.monthlyBurn)}/{fr ? 'mois' : 'mo'}</span>,
              {' '}{t.narrativeRunway} <span className="font-semibold text-gray-900">{runway.runwayMonths} {t.narrativeRunwayPlus}</span>
              {' '}{t.narrativeTierPricing} (€{TIER_PRICES.essentiel}/€{TIER_PRICES.pro}/€{TIER_PRICES.cabinet}) {t.narrativeYieldsBlended}
              {' '}<span className="font-semibold text-gray-900">€{ue.blendedArpu.toFixed(0)} {t.narrativeArpu}</span> {t.narrativeWith}
              {' '}<span className="font-semibold text-emerald-600">{ue.grossMarginPct}% {t.narrativeGrossMargin}</span>,
              {' '}<span className="font-semibold text-emerald-600">{ue.ltvCacRatio}x LTV/CAC</span>,
              {' '}<span className="font-semibold text-emerald-600">{ue.paybackMonths} {t.monthLabel} {t.narrativePayback}</span>.
              {' '}{t.narrativeIn18Months} <span className="font-semibold text-gray-900">{fmtNumber(m18.practitioners)} {t.practitionersLabel.toLowerCase()}</span> {t.narrativeAnd}
              {' '}<span className="font-semibold text-gray-900">{fmtEuro(m18.arr)} ARR</span>.
            </p>
            <p className="text-xs text-amber-600 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
              {t.narrativeHonestNote}
            </p>
          </motion.div>

          {/* ─── Today Anchor Banner ──────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">{t.todayTitle}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[t.todayPreRevenue, t.todayPaying, t.todayBeta, t.todayLive].map((pill) => (
                  <span key={pill} className="px-2.5 py-1 text-[11px] font-medium bg-amber-100 text-amber-800 rounded-full">
                    {pill}
                  </span>
                ))}
              </div>
              <p className="text-xs text-amber-700 mt-2 leading-relaxed">{t.todayGrounding}</p>
            </div>
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
                      info={t.infoStartingPract}
                    />
                    <SliderInput
                      label={t.initialGrowth} value={assumptions.initialGrowthPct}
                      onChange={(v) => updateAssumption('initialGrowthPct', v)}
                      min={5} max={50} suffix="%"
                      info={t.infoInitialGrowth}
                    />
                    <SliderInput
                      label={t.endGrowth} value={assumptions.endGrowthPct}
                      onChange={(v) => updateAssumption('endGrowthPct', v)}
                      min={1} max={15} suffix="%"
                      info={t.infoEndGrowth}
                    />
                    <SliderInput
                      label={t.churn} value={assumptions.churnPct}
                      onChange={(v) => updateAssumption('churnPct', v)}
                      min={1} max={15} suffix="%"
                      info={t.infoChurn}
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
                      info={t.infoEssentiel}
                    />
                    <SliderInput
                      label={`Pro (€${TIER_PRICES.pro})`} value={assumptions.proPct}
                      onChange={(v) => updateTierMix('proPct', v)}
                      min={0} max={100 - assumptions.essentielPct} suffix="%"
                      info={t.infoPro}
                    />
                    {/* Cabinet computed */}
                    <InfoLine
                      label={`Cabinet (€${TIER_PRICES.cabinet})`}
                      value={`${cabinetPct}%`}
                      info={t.infoCabinet}
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
                        label={t.blendedArpu}
                        value={`€${ue.blendedArpu.toFixed(2)}/${fr ? 'mois' : 'mo'}`}
                        valueClass="text-gray-900"
                        info={t.infoBlendedArpu}
                      />
                    </div>

                    <SliderInput
                      label={t.membersPerPract} value={assumptions.membersPerPractitioner}
                      onChange={(v) => updateAssumption('membersPerPractitioner', v)}
                      min={1} max={50}
                      info={t.infoMembersPerPract}
                    />
                    <SliderInput
                      label={t.premiumConversion} value={assumptions.memberPremiumPct}
                      onChange={(v) => updateAssumption('memberPremiumPct', v)}
                      min={0} max={20} suffix="%"
                      info={t.infoPremiumConversion}
                    />
                  </div>
                </div>

                {/* Costs */}
                <div className="mb-5">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.costs}</h3>
                  <div className="space-y-3">
                    <SliderInput
                      label={t.variableCostLabel} value={assumptions.variableCostPerPract}
                      onChange={(v) => updateAssumption('variableCostPerPract', v)}
                      min={1} max={15} step={0.25} prefix="€"
                      info={t.infoVariableCost}
                    />
                    <InfoLine
                      label={t.grossMarginLabel}
                      value={`${ue.grossMarginPct}%`}
                      valueClass={ue.grossMarginPct >= 70 ? 'text-emerald-600' : 'text-amber-600'}
                      info={t.infoGrossMargin}
                    />
                    <NumberInput
                      label="CAC" value={assumptions.cac}
                      onChange={(v) => updateAssumption('cac', Math.max(0, v))}
                      prefix="€"
                      info={t.infoCAC}
                    />
                    <SliderInput
                      label={t.cacGrowthLabel} value={assumptions.cacGrowthPctPerQuarter}
                      onChange={(v) => updateAssumption('cacGrowthPctPerQuarter', v)}
                      min={0} max={20} suffix="%"
                      info={t.infoCacGrowth}
                    />
                    <NumberInput
                      label={`${t.team} (/${fr ? 'mois' : 'mo'})`} value={assumptions.teamCost}
                      onChange={(v) => updateAssumption('teamCost', Math.max(0, v))}
                      prefix="€"
                      info={t.infoTeam}
                    />
                    <SliderInput
                      label={t.teamStepUp} value={assumptions.teamCostStepUp}
                      onChange={(v) => updateAssumption('teamCostStepUp', v)}
                      min={0} max={5000} step={500} prefix="€"
                      info={t.infoTeamStepUp}
                    />
                    <SliderInput
                      label={t.teamStepInterval} value={assumptions.teamStepUpInterval}
                      onChange={(v) => updateAssumption('teamStepUpInterval', v)}
                      min={3} max={12} suffix={` ${fr ? 'mois' : 'mo'}`}
                      info={t.infoTeamStepInterval}
                    />
                    <NumberInput
                      label={`${t.infra} (/${fr ? 'mois' : 'mo'})`} value={assumptions.infraCost}
                      onChange={(v) => updateAssumption('infraCost', Math.max(0, v))}
                      prefix="€"
                      info={t.infoInfra}
                    />
                    <NumberInput
                      label={`${t.marketing} (/${fr ? 'mois' : 'mo'})`} value={assumptions.marketingCost}
                      onChange={(v) => updateAssumption('marketingCost', Math.max(0, v))}
                      prefix="€"
                      info={t.infoMarketing}
                    />
                    <NumberInput
                      label={`${t.other} (/${fr ? 'mois' : 'mo'})`} value={assumptions.otherCost}
                      onChange={(v) => updateAssumption('otherCost', Math.max(0, v))}
                      prefix="€"
                      info={t.infoOther}
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
                      info={t.infoStartingCash}
                    />
                    <SliderInput
                      label={t.equityOffered} value={assumptions.dilutionPct}
                      onChange={(v) => updateAssumption('dilutionPct', v)}
                      min={5} max={25} suffix="%"
                      info={t.infoEquity}
                    />
                    <InfoLine
                      label={t.preMoneyVal}
                      value={`€${(assumptions.startingCash * (100 / assumptions.dilutionPct - 1) / 1000).toFixed(0)}K`}
                      valueClass="text-indigo-600"
                      info={t.infoPreMoney}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ─── Output Panel ────────────────────────────── */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">

              {/* Stress Test Banner */}
              {scenario === 'stress' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-600 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.stressBannerTitle}</p>
                    <p className="text-xs text-red-100 mt-1 leading-relaxed">{t.stressBannerDesc}</p>
                  </div>
                </motion.div>
              )}

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
                      <span className="text-xs font-medium text-gray-900">{t.monthlyBurnRunway}</span>
                      <p className="text-[10px] text-gray-400">{t.burnSubtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3 mt-3">
                    <p className="text-2xl font-bold text-gray-900">{fmtEuro(runway.monthlyBurn)}<span className="text-sm font-normal text-gray-400">/{fr ? 'mois' : 'mo'}</span></p>
                    <span className="text-gray-300">|</span>
                    <p className="text-lg font-bold text-gray-900">{runway.runwayMonths}<span className="text-sm font-normal text-gray-400"> {t.months}</span></p>
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
                      {runway.runwayMonths >= 18 ? t.seedWindowCovered : t.seedWindowWarning}
                    </span>
                    <span>M36</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">{t.whereBurnGoes}</span>{' '}
                      {t.team} ({fmtEuro(assumptions.teamCost)}/{fr ? 'mois' : 'mo'} — {t.burnTeamDesc}),
                      {' '}{t.marketing.toLowerCase()} ({fmtEuro(assumptions.marketingCost)}/{fr ? 'mois' : 'mo'} — {t.burnMarketingDesc}),
                      {' '}{t.infra.toLowerCase()} ({fmtEuro(assumptions.infraCost)}/{fr ? 'mois' : 'mo'} — {t.burnInfraDesc}),
                      {' '}{fr ? 'et' : 'and'} {t.operations.toLowerCase()} ({fmtEuro(assumptions.otherCost)}/{fr ? 'mois' : 'mo'} — {t.burnOpsDesc}).
                      {' '}{t.variableCostsScale}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">{t.whyComfortable}</span>{' '}
                      {runway.runwayMonths >= 24
                        ? t.burnComfort36(runway.runwayMonths)
                        : runway.runwayMonths >= 18
                        ? t.burnComfort18(runway.runwayMonths, runway.breakEvenMonth)
                        : t.burnTight(runway.runwayMonths)
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
                      <span className="text-xs font-medium text-gray-900">{t.useOfFunds} — {fmtEuro(assumptions.startingCash)}</span>
                      <p className="text-[10px] text-gray-400">{t.useOfFundsSubtitle}</p>
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
                      <span className="font-semibold text-gray-700">{t.product} ({assumptions.useOfFunds.product}%) :</span>{' '}
                      {t.uofProductDesc}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">{t.goToMarket} ({assumptions.useOfFunds.gtm}%) :</span>{' '}
                      {t.uofGtmDesc}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">{t.team} ({assumptions.useOfFunds.team}%) :</span>{' '}
                      {t.uofTeamDesc}
                    </p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      <span className="font-semibold text-gray-700">{t.operations} ({assumptions.useOfFunds.ops}%) :</span>{' '}
                      {t.uofOpsDesc}
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
                    <h3 className="text-sm font-medium text-gray-900">{t.theAsk}</h3>
                    <p className="text-[10px] text-gray-400">{t.theAskSubtitle}</p>
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
                          <p className="text-[10px] text-violet-400">{t.raising}</p>
                          <p className="text-lg font-bold text-violet-700">{fmtEuro(raise)}</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400">{t.forEquity}</p>
                          <p className="text-lg font-bold text-gray-900">{dilution}%</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400">{t.preMoney}</p>
                          <p className="text-lg font-bold text-gray-900">{fmtEuro(preMoney)}</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-xl">
                          <p className="text-[10px] text-indigo-400">{t.postMoney}</p>
                          <p className="text-lg font-bold text-indigo-700">{fmtEuro(postMoney)}</p>
                        </div>
                      </div>

                      {/* Valuation justification */}
                      <div className="bg-violet-50/50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-gray-700 mb-1">{t.whyThisValuation}</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          {t.valuationJustification
                            .replace('{ltvCac}', String(ue.ltvCacRatio))
                            .replace('{payback}', String(ue.paybackMonths))
                            .replace('{preMoney}', fmtEuro(preMoney))}
                        </p>
                      </div>

                      {/* Cap table visual */}
                      <div>
                        <p className="text-[10px] text-gray-400 mb-1.5">{t.ownershipAfterRound}</p>
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
                            {t.founders} — {foundersAfter}%
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-violet-600">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            {t.investors} — {dilution}%
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                          {t.foundersKeep(foundersAfter)}
                        </p>
                      </div>

                      {/* Return scenarios */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-[10px] font-semibold text-gray-700 mb-2">{t.whatYourInvestmentBecomes.replace('{amount}', fmtEuro(raise))}</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-3 bg-gray-50 rounded-xl">
                            <p className="text-[10px] text-gray-400">{t.pricePer1Pct}</p>
                            <p className="text-sm font-bold text-gray-900">{fmtEuro(pricePerPct)}</p>
                            <p className="text-[9px] text-gray-400">{t.entryPriceToday}</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-[10px] text-emerald-500">{t.atSeriesA}</p>
                            <p className="text-sm font-bold text-emerald-600">{fmtEuro(investorSeriesAValue)}</p>
                            <p className="text-[9px] text-gray-400">{dilution}% {fr ? 'de' : 'of'} {fmtEuro(impliedSeriesAVal)}</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-xl">
                            <p className="text-[10px] text-emerald-500">{t.exitScenario10x}</p>
                            <p className="text-sm font-bold text-emerald-600">{fmtEuro(investor10xValue)}</p>
                            <p className="text-[9px] text-gray-400">{dilution}% {fr ? 'de' : 'of'} {fmtEuro(tenXVal)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Detailed return narrative */}
                      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">{t.seriesAPath}</span>{' '}
                          {t.seriesAPathDesc(fmtNumber(m18.practitioners), fmtEuro(m18.arr), dilution, fmtEuro(investorSeriesAValue), Math.round(m18.practitioners / 18))}
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">{t.dealStructure}</span>{' '}
                          {t.dealStructureDesc}
                        </p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">
                          <span className="font-semibold text-gray-700">{t.whyNow}</span>{' '}
                          {t.whyNowDesc}
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
                    <h3 className="text-sm font-medium text-gray-900">{t.pathToSeriesA}</h3>
                    <p className="text-[10px] text-gray-400">{t.pathToSeriesASubtitle}</p>
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
                    <span className="font-semibold text-gray-700">{t.m0m6Title}</span>{' '}
                    {t.m0m6Desc}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{t.m6m12Title}</span>{' '}
                    {t.m6m12Desc(fmtEuro(m18.mrr ? m18.mrr / 3 : 0))}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{t.m12m18Title}</span>{' '}
                    {t.m12m18Desc(fmtNumber(m18.practitioners), fmtEuro(m18.arr))}
                  </p>
                </div>
                <div className={`rounded-lg p-3 mt-2 ${runway.breakEvenMonth && runway.breakEvenMonth <= 36 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <p className="text-[10px] leading-relaxed">
                    <span className={`font-semibold ${runway.breakEvenMonth && runway.breakEvenMonth <= 36 ? 'text-emerald-700' : 'text-amber-700'}`}>{t.pathConclusionTitle}</span>{' '}
                    <span className={runway.breakEvenMonth && runway.breakEvenMonth <= 36 ? 'text-emerald-600' : 'text-amber-600'}>
                      {t.pathConclusion(runway.runwayMonths, runway.breakEvenMonth, runway.arr100kMonth, fmtEuro(m18.arr), fmtEuro(assumptions.startingCash))}
                    </span>
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
                    <span className="text-xs text-gray-500">{t.mrrAtM18}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{fmtEuro(m18.mrr)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">M36: {fmtEuro(lastMonth.mrr)} ({fmtEuro(lastMonth.arr)} ARR)</p>
                  <p className="text-[9px] text-indigo-500 mt-2 pt-2 border-t border-gray-100 leading-relaxed">{t.takeawayMrr(fmtEuro(m18.arr), fmtEuro(lastMonth.arr))}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500">{t.practAtM18}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{fmtNumber(m18.practitioners)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">M36: {fmtNumber(lastMonth.practitioners)} ({fmtNumber(lastMonth.members)} {t.members.toLowerCase()})</p>
                  <p className="text-[9px] text-blue-500 mt-2 pt-2 border-t border-gray-100 leading-relaxed">{t.takeawayPract(assumptions.membersPerPractitioner)}</p>
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
                  <p className={`text-[9px] mt-2 pt-2 border-t border-gray-100 leading-relaxed ${ue.ltvCacRatio >= 3 ? 'text-emerald-500' : ue.ltvCacRatio >= 1 ? 'text-amber-500' : 'text-red-500'}`}>{t.takeawayLtvCac(ue.ltvCacRatio)}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-xs text-gray-500">{t.breakEven}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {runway.breakEvenPractitioners ? t.atPractitioners(runway.breakEvenPractitioners) : t.monthsRunway(runway.runwayMonths)}
                  </p>
                  <p className={`text-[9px] mt-2 pt-2 border-t border-gray-100 leading-relaxed ${runway.breakEvenMonth && runway.breakEvenMonth <= runway.runwayMonths ? 'text-emerald-500' : 'text-amber-500'}`}>{t.takeawayBreakEven(runway.breakEvenMonth, runway.runwayMonths)}</p>
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
                  <h3 className="text-sm font-medium text-gray-900">{t.marginWaterfall}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">{t.waterfallSubtitle}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">{t.waterfallHowToRead}</p>
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
                      {row.ctx && (
                        <p className="text-[9px] text-gray-400 ml-[156px] mt-0.5 leading-snug">{row.ctx}</p>
                      )}
                    </div>
                  ))}
                </div>
                {ue.b2cRevenuePerPract > 0 && (
                  <p className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100">
                    {t.b2cPremiumUpside
                      .replace('{amount}', ue.b2cRevenuePerPract.toFixed(2))
                      .replace('{members}', String(assumptions.membersPerPractitioner))
                      .replace('{pct}', String(assumptions.memberPremiumPct))
                      .replace('{price}', String(MEMBER_PREMIUM))}
                  </p>
                )}
                <div className={`rounded-lg p-3 mt-3 ${ue.contributionMargin > 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <p className={`text-[10px] leading-relaxed ${ue.contributionMargin > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {t.waterfallTakeaway(
                      `€${Math.abs(ue.contributionMargin).toFixed(2)}`,
                      ((ue.contributionMargin / ue.blendedArpu) * 100).toFixed(0),
                      String(ue.grossMarginPct),
                    )}
                  </p>
                </div>
              </motion.div>

              {/* B2B2C Advantage */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-r from-indigo-50/50 to-emerald-50/50 border border-indigo-100/50 rounded-xl p-5"
              >
                <div className="mb-1">
                  <h3 className="text-sm font-medium text-gray-900">{t.b2b2cTitle}</h3>
                  <p className="text-[10px] text-gray-400">{t.b2b2cSubtitle}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">€{ue.cac}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.practitionerCAC}</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{t.onePractitioner}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-semibold text-gray-600">{assumptions.membersPerPractitioner} {t.members.toLowerCase()}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{t.membersOnboardedZeroCost}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">€{ue.effectiveMemberCAC}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.effectiveMemberCAC}</p>
                    <p className="text-[10px] text-gray-400">{t.vsB2CApps}</p>
                  </div>
                </div>
                <div className="bg-white/60 rounded-lg p-3 mt-3 space-y-1.5">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{t.howItWorks}</span>{' '}
                    {t.howItWorksDesc(ue.cac, assumptions.membersPerPractitioner)}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{t.whyItCompounds}</span>{' '}
                    {t.whyItCompoundsDesc(ue.effectiveMemberCAC)}
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
                <h3 className="text-sm font-medium text-gray-900">{t.revenueProjection}</h3>
                <p className="text-xs text-gray-400 mb-2">
                  {t.revenueProjectionDesc(ue.blendedArpu.toFixed(0), assumptions.initialGrowthPct, assumptions.endGrowthPct)}
                </p>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">
                  {t.revenueProjectionCtx(fmtEuro(m18.mrr), fmtEuro(lastMonth.mrr))}
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
                      <Tooltip content={<RevenueTooltip locale={locale} />} cursor={false} />
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'M18', position: 'top', fontSize: 9, fill: '#6366f1' }} />
                      {runway.breakEvenMonth && (
                        <ReferenceLine x={`M${runway.breakEvenMonth}`} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: t.breakEven, position: 'top', fontSize: 9, fill: '#10b981' }} />
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
                <h3 className="text-sm font-medium text-gray-900">{t.customerGrowth}</h3>
                <p className="text-xs text-gray-400 mb-2">{t.customerGrowthDesc(assumptions.membersPerPractitioner)}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">
                  {t.customerGrowthCtx(fmtNumber(m18.practitioners), fmtNumber(m18.members), assumptions.membersPerPractitioner)}
                </p>
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
                      <Tooltip content={<GrowthTooltip locale={locale} />} cursor={false} />
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t.members}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span className="w-1 h-3 border-l border-dashed border-indigo-400" /> {t.m18SeedWindow}
                  </span>
                </div>
              </motion.div>

              {/* Unit Economics — 6 cards */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-2">{t.unitEconomics}</h3>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-3">{t.unitEconomicsCtx}</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.blendedArpu}</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{ue.blendedArpu.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">{t.perPractMoB2B}</p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? "Le prix moyen qu'on touche par praticien — pondéré entre les 3 plans. C'est notre revenu de base par client." : "The average price we collect per practitioner — weighted across all 3 plans. This is our baseline revenue per customer."}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.ltv}</span>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{fmtEuro(ue.ltv)}</p>
                    <p className="text-[10px] text-gray-400">
                      {(1 / (assumptions.churnPct / 100)).toFixed(0)} {t.moLifetime} × €{ue.totalArpu.toFixed(0)} × {ue.grossMarginPct}%
                    </p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? "Le revenu total qu'un praticien génère sur toute sa durée de vie, après coûts de service. Plus il reste longtemps et plus la marge est haute, plus ce chiffre monte." : "Total revenue one practitioner generates over their entire lifetime, after serving costs. The longer they stay and the higher our margin, the bigger this number."}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.cac}</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">€{ue.cac}</p>
                    <p className="text-[10px] text-gray-400">{t.organicAcquisition}</p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? "Ce qu'on dépense pour acquérir un praticien payant — LinkedIn, parrainages, conférences. Pas de pub payante. Ce coût augmente en grandissant (voir évolution ci-dessous)." : "What we spend to acquire one paying practitioner — LinkedIn, referrals, conferences. No paid ads. This cost rises as we scale (see evolution below)."}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-[9px] text-gray-400 mb-1">{t.cacEvolution}</p>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-gray-500">M1: <span className="font-semibold text-gray-700">€{ue.cac}</span></span>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-gray-500">M18: <span className="font-semibold text-amber-600">€{ue.cacM18}</span></span>
                        <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
                        <span className="text-gray-500">M36: <span className="font-semibold text-red-500">€{ue.cacM36}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.ltvCac}</span>
                    <p className={`text-lg font-bold mt-1 ${ue.ltvCacRatio >= 3 ? 'text-emerald-600' : ue.ltvCacRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                      {ue.ltvCacRatio}x
                    </p>
                    <p className="text-[10px] text-gray-400">{t.target3x}</p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? `Chaque €1 dépensé en acquisition génère €${ue.ltvCacRatio} de revenu sur la vie du client. Les investisseurs veulent voir >3x — en dessous, l'acquisition coûte trop cher.` : `Every €1 spent on acquisition generates €${ue.ltvCacRatio} in revenue over the customer's life. Investors want to see >3x — below that, acquisition costs too much.`}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.payback}</span>
                    <p className={`text-lg font-bold mt-1 ${ue.paybackMonths <= 12 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ue.paybackMonths} {t.monthLabel}
                    </p>
                    <p className="text-[10px] text-gray-400">{t.targetLt12mo}</p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? `En ${ue.paybackMonths} mois, le revenu du praticien a remboursé son coût d'acquisition. Après ça, tout est du profit. La cible est <12 mois — plus c'est rapide, moins on a besoin de cash pour croître.` : `In ${ue.paybackMonths} months, the practitioner's revenue has paid back their acquisition cost. After that, it's all profit. Target is <12 months — the faster, the less cash we need to grow.`}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <span className="text-xs text-gray-500">{t.grossMarginLabel}</span>
                    <p className={`text-lg font-bold mt-1 ${ue.grossMarginPct >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {ue.grossMarginPct}%
                    </p>
                    <p className="text-[10px] text-gray-400">€{ue.variableCost.toFixed(2)} {t.variableCost}</p>
                    <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-100 leading-relaxed">
                      {fr ? `Sur chaque €1 de revenu, on garde ${ue.grossMarginPct} centimes après les coûts de service (IA, infra, support). La médiane SaaS est 70-75% — on est dans le haut de la fourchette à ${ue.grossMarginPct}%.` : `Of every €1 in revenue, we keep ${ue.grossMarginPct} cents after serving costs (AI, infra, support). SaaS median is 70-75% — we're in the upper quartile at ${ue.grossMarginPct}%.`}
                    </p>
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
                <h3 className="text-sm font-medium text-gray-900">{t.expenseBreakdown}</h3>
                <p className="text-xs text-gray-400 mb-2">{t.expenseBreakdownDesc}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">{t.expenseBreakdownCtx}</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => fmtEuro(v)} width={50} />
                      <Tooltip content={<ExpenseTooltip locale={locale} />} cursor={false} />
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

              {/* Quarterly P&L */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.47 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">{t.quarterlyPnL}</h3>
                <p className="text-xs text-gray-400 mb-4">{t.quarterlyPnLSubtitle}</p>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[120px]">&nbsp;</th>
                        {quarterlyPnL.map((q) => (
                          <th key={q.label} className="text-right p-2 font-semibold text-gray-500 min-w-[72px]">{q.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Revenue */}
                      <tr>
                        <td className="p-2 text-gray-600 sticky left-0 bg-white z-10">{t.pnlRevenue}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-700 tabular-nums">{fmtEuro(q.revenue)}</td>
                        ))}
                      </tr>
                      {/* COGS */}
                      <tr className="bg-gray-50/50">
                        <td className="p-2 text-gray-600 sticky left-0 bg-gray-50/50 z-10">{t.pnlCOGS}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-rose-500 tabular-nums">-{fmtEuro(q.cogs)}</td>
                        ))}
                      </tr>
                      {/* Gross Profit */}
                      <tr className="border-t border-gray-200">
                        <td className="p-2 font-bold text-gray-900 sticky left-0 bg-white z-10">{t.pnlGrossProfit}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono font-bold text-gray-900 tabular-nums">{fmtEuro(q.grossProfit)}</td>
                        ))}
                      </tr>
                      {/* Team */}
                      <tr>
                        <td className="p-2 text-gray-600 sticky left-0 bg-white z-10">{t.team}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">-{fmtEuro(q.team)}</td>
                        ))}
                      </tr>
                      {/* Marketing */}
                      <tr className="bg-gray-50/50">
                        <td className="p-2 text-gray-600 sticky left-0 bg-gray-50/50 z-10">{t.marketing}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">-{fmtEuro(q.marketing)}</td>
                        ))}
                      </tr>
                      {/* Infra */}
                      <tr>
                        <td className="p-2 text-gray-600 sticky left-0 bg-white z-10">{t.infra}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">-{fmtEuro(q.infra)}</td>
                        ))}
                      </tr>
                      {/* Other */}
                      <tr className="bg-gray-50/50">
                        <td className="p-2 text-gray-600 sticky left-0 bg-gray-50/50 z-10">{t.other}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">-{fmtEuro(q.other)}</td>
                        ))}
                      </tr>
                      {/* CAC */}
                      <tr>
                        <td className="p-2 text-gray-600 sticky left-0 bg-white z-10">CAC</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-orange-500 tabular-nums">-{fmtEuro(q.cac)}</td>
                        ))}
                      </tr>
                      {/* EBITDA */}
                      <tr className="border-t border-gray-200">
                        <td className="p-2 font-bold text-gray-900 sticky left-0 bg-white z-10">{t.pnlEBITDA}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className={`p-2 text-right font-mono font-bold tabular-nums ${q.ebitda >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {q.ebitda >= 0 ? '' : '-'}{fmtEuro(Math.abs(q.ebitda))}
                          </td>
                        ))}
                      </tr>
                      {/* Cumulative Cash */}
                      <tr className="border-t border-gray-200 bg-gray-50/50">
                        <td className="p-2 font-bold text-gray-900 sticky left-0 bg-gray-50/50 z-10">{t.pnlCumulativeCash}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className={`p-2 text-right font-mono font-bold tabular-nums ${q.cumulativeCash >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {fmtEuro(q.cumulativeCash)}
                          </td>
                        ))}
                      </tr>
                      {/* Practitioners */}
                      <tr className="border-t border-dashed border-gray-200">
                        <td className="p-2 text-gray-500 sticky left-0 bg-white z-10">{t.pnlPractitioners}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">{fmtNumber(q.practitioners)}</td>
                        ))}
                      </tr>
                      {/* ARR */}
                      <tr className="bg-gray-50/50">
                        <td className="p-2 text-gray-500 sticky left-0 bg-gray-50/50 z-10">{t.pnlARR}</td>
                        {quarterlyPnL.map((q) => (
                          <td key={q.label} className="p-2 text-right font-mono text-gray-500 tabular-nums">{fmtEuro(q.arr)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Runway & Cash */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h3 className="text-sm font-medium text-gray-900">{t.runwayCash}</h3>
                <p className="text-xs text-gray-400 mb-2">{t.runwayCashDesc}</p>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">
                  {t.runwayCashCtx(fmtEuro(assumptions.startingCash), runway.runwayMonths, runway.breakEvenMonth)}
                </p>
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
                      <Tooltip content={<RunwayTooltip locale={locale} />} cursor={false} />
                      <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                      <ReferenceLine x="M18" stroke="#6366f1" strokeDasharray="3 3" strokeWidth={1} label={{ value: t.seedWindow, position: 'top', fontSize: 9, fill: '#6366f1' }} />
                      {runway.breakEvenMonth && (
                        <ReferenceLine x={`M${runway.breakEvenMonth}`} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} label={{ value: t.breakEven, position: 'top', fontSize: 9, fill: '#10b981' }} />
                      )}
                      {runway.arr100kMonth && (
                        <ReferenceLine x={`M${runway.arr100kMonth}`} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} label={{ value: '€100K ARR', position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
                      )}
                      <Area type="monotone" dataKey="cumulativeCash" stroke="#10b981" strokeWidth={2} fill="url(#cashGrad)" dot={false} activeDot={{ r: 3, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Downside Scenario Analysis — always visible */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52 }}
                className="bg-white border border-red-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t.downsideTitle}</h3>
                    <p className="text-[10px] text-gray-400">{t.downsideSubtitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/* Current scenario column */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.currentScenario}</p>
                    <div className="space-y-2">
                      {[
                        { label: t.stressRunway, value: `${runway.runwayMonths} ${t.months}`, color: 'text-gray-900' },
                        { label: t.stressBreakEven, value: runway.breakEvenMonth ? `M${runway.breakEvenMonth}` : t.never, color: 'text-gray-900' },
                        { label: t.stressM18Pract, value: fmtNumber(runway.m18Practitioners), color: 'text-gray-900' },
                        { label: t.stressM18Arr, value: fmtEuro(runway.m18Arr), color: 'text-gray-900' },
                        { label: t.stressCashM18, value: fmtEuro(projections[17]?.cumulativeCash ?? 0), color: projections[17]?.cumulativeCash >= 0 ? 'text-emerald-600' : 'text-red-500' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                          <span className="text-[10px] text-gray-500">{item.label}</span>
                          <span className={`text-xs font-bold tabular-nums ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stress scenario column */}
                  <div className="bg-red-50/50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-2">{t.stressScenario}</p>
                    <div className="space-y-2">
                      {[
                        { label: t.stressRunway, value: `${stressRunway.runwayMonths} ${t.months}`, color: 'text-red-700' },
                        { label: t.stressBreakEven, value: stressRunway.breakEvenMonth ? `M${stressRunway.breakEvenMonth}` : t.never, color: 'text-red-700' },
                        { label: t.stressM18Pract, value: fmtNumber(stressRunway.m18Practitioners), color: 'text-red-700' },
                        { label: t.stressM18Arr, value: fmtEuro(stressRunway.m18Arr), color: 'text-red-700' },
                        { label: t.stressCashM18, value: fmtEuro(stressProjections[17]?.cumulativeCash ?? 0), color: stressProjections[17]?.cumulativeCash >= 0 ? 'text-amber-600' : 'text-red-600' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-red-100/50">
                          <span className="text-[10px] text-red-400">{item.label}</span>
                          <span className={`text-xs font-bold tabular-nums ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pivot plan */}
                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    <span className="font-semibold text-gray-700">{t.pivotPlanTitle}:</span>{' '}
                    {t.pivotPlanDesc}
                  </p>
                </div>
              </motion.div>

              {/* Industry Benchmarks */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">{t.industryBenchmarks}</h3>
                  <span className="text-[10px] text-gray-400">{t.vsSaasStandards}</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-2.5 mb-4">{t.industryBenchmarksCtx}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2.5 font-semibold text-gray-600">{t.metric}</th>
                        <th className="text-center p-2.5 font-semibold text-indigo-600">Bloomsline</th>
                        <th className="text-center p-2.5 font-semibold text-gray-500">{t.saasMedian}</th>
                        <th className="text-center p-2.5 font-semibold text-emerald-600">{t.topDecile}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { metric: t.benchGrossMargin, median: '70-75%', top: '85-90%' },
                        { metric: t.benchLtvCac, median: '3-5x', top: '10-15x' },
                        { metric: t.benchCacPayback, median: `12-18 ${t.benchCacPaybackMo}`, top: `5-6 ${t.benchCacPaybackMo}` },
                        { metric: t.benchMonthlyChurn, median: '5-7%', top: '2-3%' },
                        { metric: t.benchCAC, median: '€200-500', top: '€50-100' },
                        { metric: t.benchARPU, median: '€50-100', top: fr ? 'Variable' : 'Varies' },
                      ].map((b, i) => (
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
                  {t.benchmarkFooter} <a href="/unit-economics" className="text-indigo-500 underline">{t.unitEconomicsLink}</a> {t.forDetailedAnalysis}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

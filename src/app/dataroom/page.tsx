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
} from 'lucide-react'

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

const PAGES: PageItem[] = [
  {
    id: 'pitch',
    label: 'Pitch Deck',
    description: 'Full investor pitch presentation with all slides',
    href: '/pitch',
    icon: Presentation,
    color: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-indigo-200 hover:border-indigo-300',
    tag: 'Original',
  },
  {
    id: 'pitch-new',
    label: 'Pitch Deck v2',
    description: 'Redesigned pitch with updated narrative and visuals',
    href: '/pitch-new',
    icon: Sparkles,
    color: 'bg-violet-50 text-violet-600',
    borderColor: 'border-violet-200 hover:border-violet-300',
    tag: 'Latest',
  },
  {
    id: 'financial-model',
    label: 'Financial Model',
    description: 'Interactive 36-month projections with editable assumptions',
    href: '/financial-model',
    icon: Calculator,
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
    tag: 'Interactive',
  },
  {
    id: 'one-pager',
    label: 'One Pager',
    description: 'Executive summary — single page overview for quick sharing',
    href: '/one-pager',
    icon: FileText,
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-200 hover:border-amber-300',
    tag: 'Shareable',
  },
  {
    id: 'go-to-market',
    label: 'Go-to-Market',
    description: 'Practitioner-led growth — phased plan, channels, partnerships, milestones',
    href: '/go-to-market',
    icon: Rocket,
    color: 'bg-orange-50 text-orange-600',
    borderColor: 'border-orange-200 hover:border-orange-300',
    tag: 'Strategy',
  },
  {
    id: 'market-sizing',
    label: 'Market Sizing',
    description: 'TAM/SAM/SOM analysis — top-down & bottom-up, growth projections, analyst comps',
    href: '/market-sizing',
    icon: PieChart,
    color: 'bg-teal-50 text-teal-600',
    borderColor: 'border-teal-200 hover:border-teal-300',
    tag: 'Market',
  },
  {
    id: 'competitive-landscape',
    label: 'Competitive Landscape',
    description: '9 competitor profiles, threat assessment, moats, gap analysis, and strategic positioning',
    href: '/competitive-landscape',
    icon: Target,
    color: 'bg-red-50 text-red-600',
    borderColor: 'border-red-200 hover:border-red-300',
    tag: 'Market',
  },
  {
    id: 'customer-personas',
    label: 'Customer Personas',
    description: '4 buyer & user personas — demographics, pain points, buying behavior, and prioritization',
    href: '/customer-personas',
    icon: Users,
    color: 'bg-pink-50 text-pink-600',
    borderColor: 'border-pink-200 hover:border-pink-300',
    tag: 'Market',
  },
  {
    id: 'trend-report',
    label: 'Trend Intelligence',
    description: 'Sector analysis — macro/micro trends, tech disruptions, regulatory shifts, investment signals',
    href: '/trend-report',
    icon: TrendingUp,
    color: 'bg-lime-50 text-lime-600',
    borderColor: 'border-lime-200 hover:border-lime-300',
    tag: 'Market',
  },
  {
    id: 'swot-analysis',
    label: 'SWOT & Porter\'s Five Forces',
    description: 'Strategic assessment — SWOT matrix, Porter\'s analysis, cross-strategies, and industry attractiveness',
    href: '/swot-analysis',
    icon: Shield,
    color: 'bg-slate-50 text-slate-600',
    borderColor: 'border-slate-200 hover:border-slate-300',
    tag: 'Strategy',
  },
  {
    id: 'risk-analysis',
    label: 'Risk Analysis & Scenarios',
    description: '15 risks, heat map, mitigation roadmap, and 4 scenario models',
    href: '/risk-analysis',
    icon: Shield,
    color: 'bg-red-50 text-red-600',
    borderColor: 'border-red-200 hover:border-red-300',
    tag: 'Strategy',
  },
  {
    id: 'market-entry',
    label: 'Market Entry Analysis',
    description: '10 markets scored, 5 entry modes, localization matrix, and 12-month expansion roadmap',
    href: '/market-entry',
    icon: Globe,
    color: 'bg-cyan-50 text-cyan-600',
    borderColor: 'border-cyan-200 hover:border-cyan-300',
    tag: 'Strategy',
  },
  {
    id: 'strategic-recommendation',
    label: 'Strategic Recommendation',
    description: 'CEO strategy brief — current state, 3 options, priority initiatives, and decision framework',
    href: '/strategic-recommendation',
    icon: Briefcase,
    color: 'bg-gray-800 text-white',
    borderColor: 'border-gray-300 hover:border-gray-400',
    tag: 'Strategy',
  },
  {
    id: 'customer-journey',
    label: 'Customer Journey Map',
    description: 'B2B practitioner & B2C member journeys — 7 stages, emotional curves, touchpoints, and opportunities',
    href: '/customer-journey',
    icon: Route,
    color: 'bg-rose-50 text-rose-600',
    borderColor: 'border-rose-200 hover:border-rose-300',
    tag: 'Strategy',
  },
  {
    id: 'pricing-analysis',
    label: 'Pricing Strategy',
    description: 'Competitor audit, value-based model, 3-tier design, elasticity, discounts, and 3 revenue scenarios',
    href: '/pricing-analysis',
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-200 hover:border-emerald-300',
    tag: 'Strategy',
  },
  {
    id: 'gtm-playbook',
    label: 'GTM Playbook',
    description: 'Launch phasing, channel strategy, messaging framework, content plan, partnerships, KPIs, and risk mitigation',
    href: '/gtm-playbook',
    icon: Zap,
    color: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-200 hover:border-amber-300',
    tag: 'Execution',
  },
  {
    id: 'unit-economics',
    label: 'Unit Economics & Financial Model',
    description: 'CAC by channel, LTV calculation, margin waterfall, 3-year projection, break-even, sensitivity, benchmarks',
    href: '/unit-economics',
    icon: BarChart3,
    color: 'bg-sky-50 text-sky-600',
    borderColor: 'border-sky-200 hover:border-sky-300',
    tag: 'Financial',
  },
  {
    id: 'tech-overview',
    label: 'Technical Overview',
    description: 'Full architecture, tech stack, AI engine, security, and API surface',
    href: '/tech-overview',
    icon: Cpu,
    color: 'bg-cyan-50 text-cyan-600',
    borderColor: 'border-cyan-200 hover:border-cyan-300',
    tag: 'Architecture',
  },
  {
    id: 'roadmap',
    label: 'Product Roadmap',
    description: 'Five-track roadmap — product, B2B, B2C, digital presence, and business milestones',
    href: '/roadmap',
    icon: Map,
    color: 'bg-purple-50 text-purple-600',
    borderColor: 'border-purple-200 hover:border-purple-300',
    tag: 'Strategy',
  },
  {
    id: 'interviews',
    label: 'Practitioner Interviews',
    description: 'User research recordings — real practitioner discovery interviews',
    href: 'https://drive.google.com/drive/folders/1PDjVln_6AFeAPuplWgDHUayQo0l8FyYd?usp=sharing',
    icon: Mic,
    color: 'bg-rose-50 text-rose-600',
    borderColor: 'border-rose-200 hover:border-rose-300',
    tag: 'External',
    external: true,
  },
  // ── Coming Soon — April 2026 ──────────────────────────
  {
    id: 'team',
    label: 'Team',
    description: 'Founder bios, backgrounds, and why we\'re the right team',
    href: '#',
    icon: Users,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'To do',
    comingSoon: true,
  },
  {
    id: 'product-demo',
    label: 'Product Demo',
    description: 'Visual walkthrough — dashboard, member app, Bloom AI, resource library',
    href: '#',
    icon: Monitor,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'To do',
    comingSoon: true,
  },
  {
    id: 'cap-table',
    label: 'Cap Table',
    description: 'Equity structure, founder allocation, and ESOP pool',
    href: '#',
    icon: PieChart,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'To do',
    comingSoon: true,
  },
  {
    id: 'legal-docs',
    label: 'Legal Documents',
    description: 'Articles of incorporation (SAS), shareholder agreements, RGPD compliance',
    href: '#',
    icon: Scale,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'To do',
    comingSoon: true,
  },
  {
    id: 'metrics',
    label: 'Metrics Dashboard',
    description: 'Live traction data — MRR, users, retention, engagement, NPS',
    href: '#',
    icon: BarChart3,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'Apr 2026',
    comingSoon: true,
  },
  {
    id: 'case-studies',
    label: 'Customer Case Studies',
    description: 'Practitioner testimonials, outcomes data, and usage stories',
    href: '#',
    icon: MessageSquare,
    color: 'bg-gray-100 text-gray-400',
    borderColor: 'border-gray-200',
    tag: 'Apr 2026',
    comingSoon: true,
  },
]

export default function DataroomPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const livePages = PAGES.filter((p) => !p.comingSoon)
  const comingSoonPages = PAGES.filter((p) => p.comingSoon)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Data Room</h1>
            <p className="text-[10px] text-gray-400">Bloomsline Care — Investor Materials</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-1">Investor Materials</h2>
          <p className="text-sm text-gray-500">All fundraising documents in one place. Click any card to open.</p>
        </motion.div>

        {/* ── Live Pages ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h3 className="text-sm font-semibold text-gray-400">Coming Soon</h3>
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
          <span>Pre-seed fundraise — €250K-€400K</span>
          <span className="text-gray-200">|</span>
          <span>Last updated: {new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
        </motion.div>
      </main>
    </div>
  )
}

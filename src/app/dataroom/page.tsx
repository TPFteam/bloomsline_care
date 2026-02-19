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
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react'

const PAGES = [
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
] as const

export default function DataroomPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAGES.map((page, i) => {
            const Icon = page.icon
            const isExternal = 'external' in page && page.external
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

        {/* Quick access footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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

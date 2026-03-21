'use client'

import { useState } from 'react'
import { ArrowLeft, Heart, TrendingUp, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function PositioningPage() {
  const { locale, setLocale } = useLanguage()
  const t = locale === 'fr' ? fr : en
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dataroom" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'fr' : 'en', false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-gray-200 hover:bg-gray-50 transition-all text-sm font-medium text-gray-600"
            >
              <Globe className="w-3.5 h-3.5" />
              {locale === 'en' ? 'FR' : 'EN'}
            </button>
            <Logo size="sm" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-gray-500 text-lg">{t.subtitle}</p>
        </div>

        {/* ============================================ */}
        {/* THE FINISHED POSITION (always visible)       */}
        {/* ============================================ */}

        {/* Positioning summary */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center">
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-3">In one line</p>
          <p className="text-2xl md:text-3xl font-bold text-white mb-3">{t.oneLine.whatItIs}</p>
          <p className="text-sm text-gray-500 mb-8">{t.oneLine.clarifier}</p>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-lg text-gray-400 italic">{t.oneLine.feeling}</p>
            <p className="text-lg text-gray-400 italic">{t.oneLine.thought}</p>
          </div>
        </section>

        {/* The Position (4 layers) */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <div className="max-w-2xl mx-auto space-y-10">
            {/* Layer 1 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-400">1</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.positionLabels.hook}</p>
                  <p className="text-[11px] text-gray-400">{t.positionLabels.hookUse}</p>
                </div>
              </div>
              <p className="text-xl md:text-2xl font-semibold text-gray-900 leading-snug pl-10">
                {t.oneLine.hook}
              </p>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Layer 2 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-teal-50 flex items-center justify-center text-xs font-bold text-teal-500">2</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.positionLabels.promise}</p>
                  <p className="text-[11px] text-gray-400">{t.positionLabels.promiseUse}</p>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug pl-10">
                {t.oneLine.statement}
              </p>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Layer 3 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">3</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.positionLabels.clarity}</p>
                  <p className="text-[11px] text-gray-400">{t.positionLabels.clarityUse}</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 font-medium pl-10">{t.oneLine.supporting}</p>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Layer 4 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">4</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.positionLabels.proof}</p>
                  <p className="text-[11px] text-gray-400">{t.positionLabels.proofUse}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 pl-10 bg-gray-50 rounded-lg px-4 py-3 ml-10">{t.oneLine.proof}</p>
            </div>
          </div>
        </section>

        {/* The Real Problem */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.problem.title}</h2>
          <p className="text-gray-500 mb-8 max-w-2xl">{t.problem.intro}</p>

          {/* The Root */}
          <div className="bg-gray-900 rounded-xl p-6 mb-6 text-center">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mb-2">{t.problem.root.label}</p>
            <p className="text-lg font-semibold text-white mb-1">{t.problem.root.statement}</p>
            <p className="text-sm text-gray-400">{t.problem.root.detail}</p>
          </div>

          {/* Two branches */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Identity pain */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.problem.identity.title}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.problem.identity.side}</p>
                </div>
              </div>
              {/* Trace to root */}
              <div className="space-y-4 mb-4">
                {(['Surface', 'Deeper', 'Root'] as const).map((depth) => {
                  const items = t.problem.identity.layers.filter((l: { depth: string }) => l.depth === depth);
                  if (items.length === 0) return null;
                  const indent = depth === 'Surface' ? 0 : depth === 'Deeper' ? 16 : 32;
                  return (
                    <div key={depth} style={{ paddingLeft: indent }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {depth !== 'Surface' && <span className="text-[10px] text-gray-300">↓</span>}
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{depth}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((l: { depth: string; text: string; source?: string; sourceUrl?: string }, i: number) => (
                          <div key={i}>
                            <p className="text-sm text-gray-600">{l.text}</p>
                            {l.source && <p className="text-[10px] text-gray-400 mt-0.5">{l.sourceUrl ? <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">{l.source}</a> : l.source}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <blockquote className="text-sm italic text-gray-600 border-l-2 border-red-200 pl-3">
                {t.problem.identity.quote}
              </blockquote>
            </div>
            {/* Business pain */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{t.problem.business.title}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{t.problem.business.side}</p>
                </div>
              </div>
              {/* Trace to root */}
              <div className="space-y-4 mb-4">
                {(['Surface', 'Deeper', 'Root'] as const).map((depth) => {
                  const items = t.problem.business.layers.filter((l: { depth: string }) => l.depth === depth);
                  if (items.length === 0) return null;
                  const indent = depth === 'Surface' ? 0 : depth === 'Deeper' ? 16 : 32;
                  return (
                    <div key={depth} style={{ paddingLeft: indent }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {depth !== 'Surface' && <span className="text-[10px] text-gray-300">↓</span>}
                        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{depth}</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((l: { depth: string; text: string; source?: string; sourceUrl?: string }, i: number) => (
                          <div key={i}>
                            <p className="text-sm text-gray-600">{l.text}</p>
                            {l.source && <p className="text-[10px] text-gray-400 mt-0.5">{l.sourceUrl ? <a href={l.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">{l.source}</a> : l.source}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <blockquote className="text-sm italic text-gray-600 border-l-2 border-amber-200 pl-3">
                {t.problem.business.quote}
              </blockquote>
            </div>
          </div>

          {/* Connection */}
          <div className="bg-teal-50 rounded-xl border border-teal-100 p-6 text-center">
            <p className="text-sm font-semibold text-teal-900 mb-1">{t.problem.connection.title}</p>
            <p className="text-sm text-teal-700">{t.problem.connection.detail}</p>
          </div>
        </section>

        {/* Verified Stats */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-12">
          <h2 className="text-xl font-bold text-white mb-8">{t.stats.title}</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {t.stats.items.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
                <a href={stat.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-500 hover:text-gray-300 underline">
                  {stat.source}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================ */}
        {/* HOW WE GOT HERE (collapsible)               */}
        {/* ============================================ */}
        <section>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between py-4 px-6 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900 text-left">{locale === 'fr' ? 'Comment nous y sommes arrivés' : 'How we got here'}</h2>
              <p className="text-sm text-gray-500 text-left">{locale === 'fr' ? 'Le raisonnement, le framework, et le playbook interne' : 'The reasoning, framework, and internal playbook'}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          </button>
        </section>

        {showDetails && (
        <>

        {/* What We Sell vs What We Are */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-8">{t.whatWeSell.title}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-xl p-6">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">{t.whatWeSell.product.label}</p>
              <ul className="space-y-2">
                {t.whatWeSell.product.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border-2 border-teal-200 p-6">
              <p className="text-[10px] font-medium text-teal-600 uppercase tracking-widest mb-3">{t.whatWeSell.feeling.label}</p>
              <ul className="space-y-2">
                {t.whatWeSell.feeling.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-800 font-medium flex items-start gap-2">
                    <span className="text-teal-500 mt-0.5">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Two Layers */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.layers.title}</h2>
          <p className="text-gray-500 mb-8 max-w-2xl">{t.layers.intro}</p>

          <div className="space-y-6">
            {/* Layer 1: Feeling */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-semibold text-teal-900">{t.layers.feeling.title}</h3>
                    <p className="text-sm text-teal-600">{t.layers.feeling.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-lg font-semibold text-gray-900 mb-4 italic">&ldquo;{t.layers.feeling.statement}&rdquo;</p>
                <p className="text-sm text-gray-500">{t.layers.feeling.explanation}</p>
              </div>
            </div>

            {/* Connector */}
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <div className="h-px w-12 bg-gray-200" />
              <span className="text-xs font-medium uppercase tracking-wider">{t.layers.connector}</span>
              <div className="h-px w-12 bg-gray-200" />
            </div>

            {/* Layer 2: Business */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="font-semibold text-amber-900">{t.layers.business.title}</h3>
                    <p className="text-sm text-amber-600">{t.layers.business.role}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-lg font-semibold text-gray-900 mb-4 italic">&ldquo;{t.layers.business.statement}&rdquo;</p>
                <p className="text-sm text-gray-500 mb-4">{t.layers.business.explanation}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {t.layers.business.mechanics.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs font-semibold text-gray-900">{m.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{m.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Mechanism */}
        <section className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.mechanism.title}</h2>
          <p className="text-gray-500 mb-8 max-w-2xl">{t.mechanism.intro}</p>

          <div className="space-y-4">
            {t.mechanism.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500">
                  {i + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-gray-900 font-medium">{step.action}</p>
                  <p className="text-sm text-gray-500">{step.result}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-teal-50 rounded-lg border border-teal-100">
            <p className="text-sm font-semibold text-teal-900">{t.mechanism.conclusion}</p>
          </div>
        </section>

        {/* Feature Reframing */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.reframe.title}</h2>
          <p className="text-gray-500 mb-6 max-w-2xl">{t.reframe.intro}</p>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 gap-0 bg-gray-50 border-b border-gray-200 px-6 py-3">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{t.reframe.headers[0]}</p>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{t.reframe.headers[1]}</p>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{t.reframe.headers[2]}</p>
            </div>
            {t.reframe.rows.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 gap-0 px-6 py-3 ${i < t.reframe.rows.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <p className="text-sm text-gray-700">{row.feature}</p>
                <p className="text-sm text-gray-400 line-through">{row.old}</p>
                <p className="text-sm text-gray-900 font-medium">{row.new_}</p>
              </div>
            ))}
          </div>
        </section>

        </>
        )}

        {/* Competitive Positioning */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.competitive.title}</h2>
          <p className="text-gray-500 mb-6 max-w-2xl">{t.competitive.intro}</p>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {t.competitive.competitors.map((c, i) => (
              <div key={i} className={`rounded-xl border p-5 ${c.highlight ? 'border-teal-300 bg-teal-50/50' : 'border-gray-200 bg-white'}`}>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{c.category}</p>
                <h3 className="font-semibold text-gray-900 mb-2">{c.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{c.sells}</p>
                <p className={`text-xs font-medium ${c.highlight ? 'text-teal-700' : 'text-gray-400'}`}>{c.position}</p>
              </div>
            ))}
          </div>

          {/* Visual: The Bridge */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-10">
            <div className="flex items-stretch gap-0 max-w-3xl mx-auto">
              {/* Left cliff: Practice Management */}
              <div className="flex-1 bg-white rounded-l-xl border border-gray-200 border-r-0 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{locale === 'fr' ? 'Pendant la séance' : 'During the session'}</p>
                  <p className="text-sm font-semibold text-gray-700 mb-2">SimplePractice / Doctolib</p>
                  <div className="space-y-1">
                    {(locale === 'fr' ? ['Facturation', 'Planification', 'Formulaires'] : ['Billing', 'Scheduling', 'Forms']).map((item, i) => (
                      <p key={i} className="text-xs text-gray-400">{item}</p>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 mt-3 uppercase tracking-wider">{locale === 'fr' ? 'L\'admin' : 'The admin'}</p>
              </div>

              {/* Bridge: Bloomsline */}
              <div className="w-36 md:w-48 bg-teal-600 flex flex-col items-center justify-center px-4 py-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                  {locale === 'fr' ? 'Le fossé' : 'The gap'}
                </div>
                <p className="text-white font-bold text-sm text-center mb-1">Bloomsline</p>
                <p className="text-teal-200 text-[10px] text-center leading-tight">
                  {locale === 'fr' ? 'Entre les séances. Là où le soin continue.' : 'Between sessions. Where care continues.'}
                </p>
                <div className="flex gap-1 mt-3">
                  <span className="text-teal-300 text-lg">←</span>
                  <span className="text-teal-200 text-[9px] uppercase tracking-wider self-center">{locale === 'fr' ? 'Pont' : 'Bridge'}</span>
                  <span className="text-teal-300 text-lg">→</span>
                </div>
              </div>

              {/* Right cliff: Wellness */}
              <div className="flex-1 bg-white rounded-r-xl border border-gray-200 border-l-0 p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">{locale === 'fr' ? 'Seul chez soi' : 'Alone at home'}</p>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Headspace / Calm</p>
                  <div className="space-y-1">
                    {(locale === 'fr' ? ['Méditation', 'Journal', 'Auto-aide'] : ['Meditation', 'Journaling', 'Self-help']).map((item, i) => (
                      <p key={i} className="text-xs text-gray-400">{item}</p>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-gray-300 mt-3 uppercase tracking-wider">{locale === 'fr' ? 'Sans praticien' : 'No practitioner'}</p>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6 max-w-md mx-auto">
              {locale === 'fr'
                ? 'La gestion de cabinet gère l\'admin. Les apps bien-être aident seul. Personne ne connecte le praticien et le client entre les séances.'
                : 'Practice management handles admin. Wellness apps help alone. Nobody connects practitioner and client between sessions.'}
            </p>
          </div>
        </section>

        {/* Why Now */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.whyNow.title}</h2>
          <p className="text-gray-500 mb-6 max-w-2xl">{t.whyNow.intro}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.whyNow.signals.map((s: { label: string; detail: string; year: string; source?: string; sourceUrl?: string }, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{s.label}</h3>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{s.year}</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{s.detail}</p>
                {s.source && <p className="text-[10px] text-gray-400">{s.sourceUrl ? <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 underline">{s.source}</a> : s.source}</p>}
              </div>
            ))}
          </div>
        </section>


        {/* Playbook (only visible when details expanded) */}
        {showDetails && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.usage.title}</h2>
          <p className="text-gray-500 mb-6 max-w-2xl">{t.usage.intro}</p>

          <div className="space-y-4">
            {t.usage.contexts.map((ctx: { context: string; audience: string; goal: string; open: string; follow: string; never: string }, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">{ctx.context}</h3>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{ctx.audience}</span>
                </div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">{ctx.goal}</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{t.usage.labels.open}</p>
                    <p className="text-sm text-gray-800 font-medium">{ctx.open}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{t.usage.labels.then}</p>
                    <p className="text-sm text-gray-600">{ctx.follow}</p>
                  </div>
                  <div className="bg-red-50/50 rounded-lg p-3">
                    <p className="text-[9px] text-red-400 uppercase tracking-wider mb-1">{t.usage.labels.never}</p>
                    <p className="text-sm text-red-600/70">{ctx.never}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* The Sentences */}
        <section className="bg-gray-900 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-medium text-teal-400 uppercase tracking-widest mb-4">{t.sentence.primaryLabel}</p>
              <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed mb-3">
                {t.sentence.primary}
              </p>
              <p className="text-sm text-gray-400">{t.sentence.primaryUse}</p>
            </div>
            <div className="text-center md:text-left md:border-l md:border-gray-700 md:pl-8">
              <p className="text-[10px] font-medium text-amber-400 uppercase tracking-widest mb-4">{t.sentence.secondaryLabel}</p>
              <p className="text-xl md:text-2xl text-white font-semibold leading-relaxed mb-3">
                {t.sentence.secondary}
              </p>
              <p className="text-sm text-gray-400">{t.sentence.secondaryUse}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ===== ENGLISH =====
const en = {
  back: 'Back to Dataroom',
  title: 'Positioning',
  subtitle: 'What we sell, why it matters, and how we say it.',

  rationale: {
    title: 'Why This Positioning',
    intro: 'We talked to practitioners. Showed demos. Listened to what they said and what they didn\'t say. Here\'s what we learned and why it shaped everything.',

    insight: {
      title: 'What We Learned From Real Practitioners',
      points: [
        { label: 'They don\'t want another tool.', text: 'Every practitioner we met already has a system. Google Drive, paper notes, Excel. They\'re not looking for software. They\'re looking for the feeling of being on top of things.' },
        { label: 'The pain isn\'t admin. It\'s forgetting.', text: 'Sandra didn\'t say "I need better organization." She said "it works like a second brain." The emotional core is: I forgot something my client trusted me with. That hurts.' },
        { label: 'Retention is the business problem nobody names.', text: 'Kevin told us resources between sessions "trigger the decision to come back." He wasn\'t talking about features. He was describing his revenue model without realizing it.' },
        { label: 'They compare to free, not to competitors.', text: 'No practitioner said "SimplePractice is too expensive." They said "I use Google Drive, it\'s fine." Our competitor is doing nothing, not doing something else.' },
      ],
    },

    framework: {
      title: 'The 4-Layer Framework',
      intro: 'Each layer has one job. If it fails, the layer below never gets a chance.',
      steps: [
        { num: 'Layer 1', name: 'Hook', job: 'Stops the scroll. Paints a scene they recognize.', example: 'You see 6 patients today. Can you remember what each one told you last time?', color: 'border-red-200 bg-red-50/50' },
        { num: 'Layer 2', name: 'Promise', job: 'Shows the future. The feeling of having this solved.', example: 'Every session starts like you never stopped listening.', color: 'border-teal-200 bg-teal-50/50' },
        { num: 'Layer 3', name: 'Clarity', job: 'Explains what it is. Product, not poetry.', example: 'Your notes, your patients\' moments, and Bloom prepares your next session.', color: 'border-gray-200 bg-gray-50' },
        { num: 'Layer 4', name: 'Proof', job: 'Shows how. Removes the "sounds too good" doubt.', example: 'Bloomsline remembers for you. Before, during, and after.', color: 'border-gray-200 bg-gray-50' },
      ],
      flow: ['Pain', 'Feeling', 'Product', 'How'],
    },

    twoLayers: {
      title: 'Why Both Feeling AND Business',
      bloomsline: {
        label: 'What we build vs. what we sell',
        product: 'Product: notes, Bloom briefs, member app',
        sells: 'Sells: "Being the therapist you wanted to be"',
      },
      punchline: 'The feeling layer gets them in the door. The business layer keeps them paying. They\'re not two strategies. Being a present therapist IS the retention strategy. Patients who feel heard come back, stay longer, and refer friends.',
    },
  },

  positionLabels: {
    hook: 'The question they already ask themselves',
    hookUse: 'LinkedIn posts, landing page hero, cold email opening line',
    promise: 'What life looks like with this solved',
    promiseUse: 'Landing page, about page, social bio, pitch deck',
    clarity: 'What Bloomsline actually does',
    clarityUse: 'Landing page below fold, product page, demo intro',
    proof: 'Why it works from day one',
    proofUse: 'Pricing page, FAQ, onboarding, objection handling',
  },

  oneLine: {
    label: 'The Position',
    whatItIs: 'Bloomsline keeps practitioners and their patients connected between sessions, so therapy doesn\'t stop when the session ends.',
    clarifier: 'Not messaging. Not breaking boundaries. Patients reflect on their own. Practitioners arrive prepared.',
    feeling: '"It feels like a quiet extension of my care. Like I\'m not doing this alone anymore."',
    thought: 'You walk in knowing. They walk out feeling it.',
    hook: 'You see 6 patients today. Can you remember what each one told you last time?',
    statement: 'Every session starts like you never stopped listening.',
    supporting: 'Bloomsline connects your sessions, structures your notes, and prepares your next appointment. When patients share between sessions, you see that too.',
    proof: 'Works from day one with just your notes. Gets stronger when patients engage between sessions.',
  },

  problem: {
    title: 'The Real Problem (Two Branches, One Root)',
    intro: 'Practitioners experience two pains they rarely connect. But when you trace both to their root, they come from the same place.',
    root: {
      label: 'The Root',
      statement: 'Nothing connects one session to the next.',
      detail: 'Therapy is designed as episodes. Life is continuous. The gap between sessions is where both the therapist and the client lose each other.',
    },
    identity: {
      title: 'The Identity Pain',
      side: 'The therapist\'s side of the gap',
      layers: [
        { depth: 'Surface', text: '"I forgot what my patient told me last session."', source: 'Clinicians spend 35% of time on documentation, ~16 min per encounter. (AHRQ Technical Brief, PMC 2024)', sourceUrl: 'https://www.thenationalcouncil.org/news/help-wanted/' },
        { depth: 'Surface', text: '"I can\'t organize my notes well enough to prepare."', source: '', sourceUrl: '' },
        { depth: 'Surface', text: '"I\'m not feeling well, but I can\'t cancel — my patients need me."', source: '', sourceUrl: '' },
        { depth: 'Deeper', text: '"I can\'t hold 30 patients\' stories in my head."', source: '93% of behavioral health workers report burnout. 62% rate it 8-10 out of 10. (National Council for Mental Wellbeing, 2023)', sourceUrl: 'https://www.thenationalcouncil.org/news/help-wanted/' },
        { depth: 'Deeper', text: '"I\'m spending more time on paperwork than on my patients."', source: '', sourceUrl: '' },
        { depth: 'Deeper', text: '"I\'m becoming the kind of therapist I never wanted to be."', source: 'Burnout linked to 23% reduction in treatment effectiveness. 28% vs 37% patient improvement. (PMC 2024)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11024738/' },
        { depth: 'Root', text: '"My tools handle billing and scheduling — but nothing helps me carry context from one session to the next."', source: '"It works like a second brain." Sandra, psychologist (Bloomsline interview)', sourceUrl: '' },
      ],
      quote: '',
    },
    business: {
      title: 'The Business Pain',
      side: 'The patient\'s side of the gap',
      layers: [
        { depth: 'Surface', text: '"My therapist didn\'t remember what I said last time."', source: '', sourceUrl: '' },
        { depth: 'Surface', text: '"I don\'t feel like anything happens between sessions."', source: '', sourceUrl: '' },
        { depth: 'Surface', text: '"Half of patients drop out by session 3. Most never make it past session 6."', source: '~50% dropout by session 3, ~35% after first session. (Garfield 1994; Barrett et al., PMC 2009; confirmed in 2024 meta-analyses)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2762228/' },
        { depth: 'Deeper', text: '"They don\'t feel connected enough between appointments to come back."', source: '56% of psychologists have no openings. Avg waitlist: 3+ months. (APA Survey, 2023; NPR)', sourceUrl: 'https://www.npr.org/sections/health-shots/2023/12/06/1217487323/psychologists-waitlist-demand-mental-health-care' },
        { depth: 'Deeper', text: '"What happens between sessions — a bad week, a breakthrough — never makes it back to the therapist."', source: 'Administrative frictions reduce mental health workforce capacity and patient access. (PMC 2024)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11203202/' },
        { depth: 'Root', text: '"The gap between sessions is where patients are lost."', source: 'U.S. projected short ~31,000 mental health practitioners by 2025. (HRSA Behavioral Health Workforce Brief, 2025)', sourceUrl: 'https://bhw.hrsa.gov/sites/default/files/bureau-health-workforce/data-research/Behavioral-Health-Workforce-Brief-2025.pdf' },
      ],
      quote: '',
    },
    connection: {
      title: 'Same gap. Two symptoms. One solution.',
      detail: 'The therapist forgets because nothing connects sessions. The client leaves because nothing connects sessions. Bloomsline fills the gap. The therapist remembers (identity healed). The client feels held (business healed).',
    },
  },

  stats: {
    title: 'The Numbers (Verified)',
    items: [
      { value: '93%', label: 'of behavioral health workers report burnout', source: 'National Council for Mental Wellbeing, 2023', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/' },
      { value: '25.6%', label: 'premature therapy dropout rate', source: '2024 meta-analysis, 719K participants', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2762228/' },
      { value: '35%', label: 'of clinician time goes to documentation', source: 'AHRQ Technical Brief, PMC 2024', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/' },
      { value: '31K', label: 'projected mental health practitioner shortage', source: 'HRSA Workforce Brief, 2025', sourceUrl: 'https://bhw.hrsa.gov/sites/default/files/bureau-health-workforce/data-research/Behavioral-Health-Workforce-Brief-2025.pdf' },
    ],
  },

  whatWeSell: {
    title: 'What We Sell vs. What We Build',
    product: {
      label: 'What we build (the product)',
      items: [
        'Pre-session briefs prepared automatically',
        'Clinical context that connects across sessions',
        'Member reflections captured between appointments',
        'Resources shared with engagement tracking',
        'Bloom, always there between sessions',
        'Calendar integration (Google Calendar)',
      ],
    },
    feeling: {
      label: 'What we sell (the feeling)',
      items: [
        'Walking into every session already knowing',
        'Never asking "what did we talk about last time?"',
        'Patients who feel heard between appointments',
        'A practice that grows because you\'re great. not because you\'re marketing',
        'Going home without a pile of notes to write',
        'Being the therapist you became one to be',
      ],
    },
  },

  layers: {
    title: 'The Two-Layer Position',
    intro: 'The feeling gets them in the door. The business case keeps them paying. They\'re not contradictions. they\'re the same mechanism.',
    feeling: {
      title: 'Layer 1: The Feeling',
      role: 'Gets them emotionally: why they open the page',
      statement: 'Every session starts like you never stopped listening.',
      explanation: 'For practitioners who care deeply, the worst feeling isn\'t being busy. It\'s forgetting. Losing the thread. Missing something a client trusted them with. Bloomsline makes sure that never happens.',
    },
    connector: 'therefore',
    business: {
      title: 'Layer 2: The Business Case',
      role: 'Gets them to pay: the ROI conversation',
      statement: 'Patients who feel heard don\'t ghost. They come back, they stay longer, and they tell their friends.',
      explanation: 'Being a more present therapist IS the client retention strategy. It\'s not "be better AND grow." It\'s "be better, THEREFORE grow."',
      mechanics: [
        { label: 'Fewer no-shows', detail: 'Engaged patients show up' },
        { label: 'Longer retention', detail: 'Heard patients stay' },
        { label: 'More referrals', detail: 'Cared-for patients talk' },
        { label: 'Less burnout', detail: 'Less admin, more presence' },
      ],
    },
  },

  mechanism: {
    title: 'The Mechanism: How Presence Becomes Growth',
    intro: 'This is our thesis. Research supports each link. Our product hasn\'t proven the full chain yet.',
    steps: [
      { action: 'Practitioner uses Bloomsline to structure sessions and connect context across visits', result: 'Preparation drops from 10-15 minutes to seconds. (Proven: product works)' },
      { action: 'Over time, members share reflections between sessions', result: 'Practitioner sees context before the next session. (Requires member adoption)' },
      { action: 'Client feels truly heard and remembered', result: 'Research shows alliance predicts retention. (Proven by research, not our product yet)' },
      { action: 'Fewer no-shows, longer retention, organic referrals', result: 'Practice grows through care quality, not marketing. (Our thesis, unproven)' },
    ],
    conclusion: 'One client saved from ghosting pays for 6 months of Bloomsline. This is our model, not proven data. The test: can one practitioner point to one client they kept because of Bloomsline?',
  },

  reframe: {
    title: 'Feature Reframing',
    intro: 'Same features. Different story. Every feature maps to the core position.',
    headers: ['Feature', 'Don\'t say', 'Say instead'],
    rows: [
      { feature: 'Pre-session briefs', old: 'Auto-generated clinical summaries', new_: 'You sit down already knowing' },
      { feature: 'Tagged notes', old: 'Organized documentation system', new_: 'Find any moment from any session, instantly' },
      { feature: 'Member app', old: 'Between-session engagement platform', new_: 'They share, you arrive prepared' },
      { feature: 'Bloom', old: 'Companion for members', new_: 'Bloom isn\'t intelligence that replaces yours. It\'s memory that supports it.' },
      { feature: 'Resource sharing', old: 'Digital homework distribution', new_: 'The conversation continues without extra work' },
      { feature: 'Session management', old: 'Calendar and scheduling', new_: 'Less admin, more time for what matters' },
    ],
  },

  competitive: {
    title: 'Where We Sit',
    intro: 'We are the bridge between what happens during the session and what happens alone after it. Nobody owns that space yet.',
    competitors: [
      { category: 'Practice Management', name: 'SimplePractice / Doctolib', sells: 'Efficiency. Billing. Scheduling. Forms. Admin streamlining.', position: 'Sells: "Run your practice faster"', highlight: false },
      { category: 'Wellness Apps', name: 'Headspace / Calm', sells: 'Self-help. Meditation. Journaling. No practitioner involvement.', position: 'Sells: "Feel better on your own"', highlight: false },
      { category: 'Clinical Bridge', name: 'Bloomsline', sells: 'Clinical continuity. Context. Presence. The work between sessions that makes sessions better.', position: 'Sells: "Be the therapist you wanted to be, and grow because of it"', highlight: true },
    ],
  },

  whyNow: {
    title: 'Why Now',
    intro: 'This window didn\'t exist 3 years ago. Four things changed at the same time.',
    signals: [
      { label: 'B2C therapy collapsed', detail: 'BetterHelp revenue down 9% to $950M in 2025, paying users declining every quarter. Woebot shut down June 2025. Talkspace pivoted to B2B with 25% revenue growth and first profitable year. The market learned: you can\'t cut out the therapist.', year: '2024-2025', source: 'Teladoc Q4 2025 Results; STAT News; Talkspace Q4 2024', sourceUrl: 'https://ir.teladochealth.com/news-and-events/investor-news/press-release-details/2026/Teladoc-Health-Reports-Fourth-Quarter-and-Full-Year-2025-Results/default.aspx' },
      { label: 'AI became clinically acceptable', detail: '49% of people with mental health issues already use AI tools (Sentio 2025). Practitioners went from "AI will replace us" to "show me how it helps."', year: '2025', source: 'Sentio AI Survey 2025', sourceUrl: 'https://sentio.org/ai-research/ai-survey' },
      { label: 'No AI-native clinical SaaS exists in EU', detail: 'SimplePractice (US, 237K practitioners), Jane App (Canada), Doctolib (scheduling only). Zero platforms combining clinical intelligence + member app in the EU market.', year: '2026', source: '', sourceUrl: '' },
      { label: 'EU regulation creates a moat', detail: 'EU AI Act entered force Aug 2024. High-risk healthcare AI compliance mandatory Aug 2026. US competitors 12-24 months behind. Building compliant from day 1 is a structural advantage.', year: '2024-2026', source: 'EU AI Act Implementation Timeline; European Commission', sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    ],
  },

  whyUs: {
    title: 'Why Us',
    intro: 'We\'re not clinicians. We\'re not healthtech veterans. Here\'s why that\'s actually the point.',
    points: [
      { label: 'We built the product before the pitch.', text: 'Live MVP: Next.js 16, Expo mobile app, 24+ API endpoints, 3 languages, Google Calendar integration, Bloom pre-session briefs. This isn\'t a Figma file. Practitioners have used it.' },
      { label: 'We came from the patient side.', text: 'We started this because we experienced broken care firsthand. That gives us empathy for the member experience that most practice management tools completely ignore.' },
      { label: 'We already failed the first version.', text: 'Started as Doctalink. It didn\'t work. We scrapped it, talked to practitioners, rebuilt from zero. The positioning on this page comes from those failures, not from a strategy book.' },
      { label: 'We need a clinician, and we know it.', text: 'We\'re actively recruiting a clinical advisor as a founding team member (equity, not a free account). We don\'t pretend to know clinical practice. We know how to build tools that serve it.' },
      { label: 'The burn is sustainable.', text: '2 founders, no office, ~€2/user variable cost. At €500K raise, that\'s 28-30 months of runway. Enough time to find PMF without panic.' },
    ],
  },

  risks: {
    title: 'What Could Kill This Positioning',
    intro: 'If we\'re being honest with investors, we need to name the risks to this position specifically.',
    items: [
      { risk: 'This positioning is untested.', counter: 'Zero practitioners have converted because of these specific messages. We have the interviews. We have the product. We don\'t yet have proof that this positioning converts to revenue.' },
      { risk: '"Doing nothing" might win.', counter: '80%+ of practitioners use paper or Google Drive. If inertia is stronger than the pain we\'re describing, the position doesn\'t matter. The test: can 5 practitioners switch in 90 days?' },
      { risk: 'The retention-through-presence thesis is unproven.', counter: 'We claim that being more present leads to client retention which leads to practice growth. Research supports the link between alliance and outcomes. But we haven\'t proven OUR product creates that chain.' },
      { risk: 'SimplePractice could add session briefs tomorrow.', counter: 'They could. But they\'d be adding it to a billing/scheduling platform. Our entire product is built around clinical context. It\'s architectural, not a feature toggle.' },
    ],
  },

  usage: {
    title: 'How to Say It (Internal Playbook)',
    intro: 'This section is for the team. Same positioning, different words depending on who you\'re talking to and what you need them to do next.',
    labels: { open: 'Open with', then: 'Then say', never: 'Never say' },
    contexts: [
      {
        context: 'Landing page hero',
        audience: 'Practitioners browsing',
        goal: 'Goal: stop the scroll, make them read the next line',
        open: 'You see 6 patients today. Can you remember what each one told you last time?',
        follow: 'Bloomsline connects your sessions, structures your context, and prepares your next appointment. Every session starts like you never stopped listening.',
        never: 'Never lead with features ("AI-powered pre-session briefs") or jargon ("clinical continuity platform").',
      },
      {
        context: 'Cold outreach (LinkedIn / email)',
        audience: 'Solo practitioners',
        goal: 'Goal: get a reply, not a sale',
        open: 'Quick question: how do you prepare for your first session on Monday morning? Do you flip through notes or go from memory?',
        follow: 'We built something that prepares your sessions for you. Would love to show you in 10 minutes if you\'re curious.',
        never: 'Never pitch the product in the first message. Never say "revolutionary" or "game-changing." Never attach a deck.',
      },
      {
        context: 'Investor meeting',
        audience: 'Pre-seed / seed investors',
        goal: 'Goal: make them understand the gap, not the product',
        open: 'Half of patients drop out by session 3. Most never make it past session 6. Both problems come from the same place: nothing connects one session to the next.',
        follow: 'Bloomsline fills that gap. The therapist remembers, the client feels held, and the practice grows through retention, not marketing.',
        never: 'Never lead with the tech stack. Never say "we\'re like SimplePractice but with AI." Never claim PMF before you have it.',
      },
      {
        context: 'Social content (LinkedIn)',
        audience: 'Therapist community',
        goal: 'Goal: relatability first, product second (or never)',
        open: 'That moment before a client walks in when you\'re scrambling to remember what you talked about last time. You\'re not a bad therapist. You\'re a human with 30 patients.',
        follow: 'What if your notes were already connected and your next session was already prepared? (No pitch. Just the question.)',
        never: 'Never make it an ad. Never say "try Bloomsline." Let them come to you. The content should be valuable even without the product.',
      },
      {
        context: '30-second elevator pitch',
        audience: 'Anyone, anywhere',
        goal: 'Goal: one sentence they can repeat to someone else',
        open: 'We help therapists remember their patients. So every session starts where it should, not 15 minutes in.',
        follow: 'Patients who feel remembered come back. That\'s the whole business model.',
        never: 'Never explain how the AI works. Never mention the tech. If they ask "how?", that\'s a win. Answer then.',
      },
      {
        context: 'Pricing page',
        audience: 'Practitioners ready to decide',
        goal: 'Goal: make the price feel small compared to what they get',
        open: 'One client saved from cancelling pays for 6 months of Bloomsline.',
        follow: 'You get session briefs ready before every appointment, notes that connect across months, and patients who feel heard between sessions.',
        never: 'Never compare to competitors by price. Never say "cheaper than SimplePractice." We\'re not in the same category.',
      },
    ],
  },

  sentence: {
    primaryLabel: 'For practitioners. Emotional, identity-based.',
    primary: 'When you remember your patients, your patients remember you.',
    primaryUse: 'Landing page, social bio, outreach. Speaks to the therapist\'s identity: remembering is caring.',
    secondaryLabel: 'For investors and partners. Outcome-based.',
    secondary: 'Therapist presence drives client retention. Retention drives practice growth.',
    secondaryUse: 'Pitch deck, pricing page, investor meetings. Speaks to the business mechanism: presence → retention → revenue.',
  },
}

// ===== FRENCH =====
const fr = {
  back: 'Retour au Dataroom',
  title: 'Positionnement',
  subtitle: 'Ce que nous vendons, pourquoi c\'est important, et comment nous le disons.',

  rationale: {
    title: 'Pourquoi Ce Positionnement',
    intro: 'Nous avons parlé à des praticiens. Montré des démos. Écouté ce qu\'ils disaient et ce qu\'ils ne disaient pas. Voici ce que nous avons appris et pourquoi ça a tout façonné.',

    insight: {
      title: 'Ce Que Nous Avons Appris Des Vrais Praticiens',
      points: [
        { label: 'Ils ne veulent pas un outil de plus.', text: 'Chaque praticien a déjà un système. Google Drive, notes papier, Excel. Ils ne cherchent pas un logiciel. Ils cherchent le sentiment d\'être au-dessus de tout.' },
        { label: 'La douleur, ce n\'est pas l\'admin. C\'est l\'oubli.', text: 'Sandra n\'a pas dit "j\'ai besoin de mieux m\'organiser." Elle a dit "ça fonctionne comme un second cerveau." Le noyau émotionnel : j\'ai oublié quelque chose que mon client m\'a confié. Ça fait mal.' },
        { label: 'La rétention est le problème business que personne ne nomme.', text: 'Kevin nous a dit que les ressources entre les séances "déclenchent la décision de revenir." Il ne parlait pas de fonctionnalités. Il décrivait son modèle de revenus sans le réaliser.' },
        { label: 'Ils comparent au gratuit, pas aux concurrents.', text: 'Aucun praticien n\'a dit "SimplePractice est trop cher." Ils ont dit "j\'utilise Google Drive, ça va." Notre concurrent, c\'est ne rien faire, pas faire autre chose.' },
      ],
    },

    framework: {
      title: 'Le Framework en 4 Niveaux',
      intro: 'Chaque niveau a un seul job. S\'il échoue, le niveau suivant n\'a jamais sa chance.',
      steps: [
        { num: 'Niveau 1', name: 'Accroche', job: 'Arrête le scroll. Peint une scène qu\'ils reconnaissent.', example: 'Vous voyez 6 patients aujourd\'hui. Vous vous souvenez de ce que chacun vous a dit la dernière fois ?', color: 'border-red-200 bg-red-50/50' },
        { num: 'Niveau 2', name: 'Promesse', job: 'Montre le futur. Le sentiment d\'avoir résolu ce problème.', example: 'Chaque séance commence comme si vous n\'aviez jamais cessé d\'écouter.', color: 'border-teal-200 bg-teal-50/50' },
        { num: 'Niveau 3', name: 'Clarté', job: 'Explique ce que c\'est. Le produit, pas de la poésie.', example: 'Vos notes, les moments de vos patients, et une IA qui prépare votre prochaine séance.', color: 'border-gray-200 bg-gray-50' },
        { num: 'Niveau 4', name: 'Preuve', job: 'Montre comment. Supprime le doute "trop beau pour être vrai".', example: 'Bloomsline se souvient pour vous. Avant, pendant et après.', color: 'border-gray-200 bg-gray-50' },
      ],
      flow: ['Douleur', 'Ressenti', 'Produit', 'Comment'],
    },

    twoLayers: {
      title: 'Pourquoi le Ressenti ET le Business',
      bloomsline: {
        label: 'Ce que nous construisons vs. ce que nous vendons',
        product: 'Produit : notes, résumés Bloom, app membre',
        sells: 'Vend : "Être le thérapeute que vous vouliez être"',
      },
      punchline: 'Le ressenti les fait entrer. Le business case les fait payer. Ce ne sont pas deux stratégies. Être un thérapeute présent EST la stratégie de rétention. Les patients qui se sentent écoutés reviennent, restent plus longtemps, et recommandent.',
    },
  },

  positionLabels: {
    hook: 'La question qu\'ils se posent déjà',
    hookUse: 'Posts LinkedIn, hero de la page d\'accueil, accroche email',
    promise: 'À quoi ressemble la vie une fois ce problème résolu',
    promiseUse: 'Page d\'accueil, page à propos, bio social, pitch deck',
    clarity: 'Ce que Bloomsline fait concrètement',
    clarityUse: 'Page d\'accueil (sous le fold), page produit, intro démo',
    proof: 'Pourquoi ça fonctionne dès le premier jour',
    proofUse: 'Page de prix, FAQ, onboarding, traitement des objections',
  },

  oneLine: {
    label: 'La Position',
    whatItIs: 'Bloomsline garde praticiens et patients connectés entre les séances, pour que la thérapie ne s\'arrête pas quand la séance se termine.',
    clarifier: 'Pas de messagerie. Pas de rupture du cadre. Les patients réfléchissent à leur rythme. Les praticiens arrivent préparés.',
    feeling: '« C\'est comme une extension silencieuse de mon soin. Comme si je ne faisais plus ça tout seul. »',
    thought: 'Vous arrivez préparé. Ils repartent compris.',
    hook: 'Vous voyez 6 patients aujourd\'hui. Vous vous souvenez de ce que chacun vous a dit la dernière fois ?',
    statement: 'Chaque séance commence comme si vous n\'aviez jamais cessé d\'écouter.',
    supporting: 'Bloomsline connecte vos séances, structure vos notes et prépare votre prochain rendez-vous. Quand vos patients partagent entre les séances, vous le voyez aussi.',
    proof: 'Fonctionne dès le premier jour avec vos notes seules. Devient plus puissant quand les patients s\'engagent entre les séances.',
  },

  problem: {
    title: 'Le Vrai Problème (Deux Branches, Une Racine)',
    intro: 'Les praticiens vivent deux douleurs qu\'ils connectent rarement. Mais quand on remonte à la racine, elles viennent du même endroit.',
    root: {
      label: 'La Racine',
      statement: 'Rien ne connecte une séance à la suivante.',
      detail: 'La thérapie est conçue en épisodes. La vie est continue. L\'espace entre les séances est là où le thérapeute et le client se perdent mutuellement.',
    },
    identity: {
      title: 'La Douleur d\'Identité',
      side: 'Le côté thérapeute du fossé',
      layers: [
        { depth: 'Surface', text: '« J\'ai oublié ce que mon client m\'a dit la dernière fois. »', source: '93% des travailleurs en santé mentale rapportent un burnout. 62% le notent 8-10/10. (National Council, 2023)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/' },
        { depth: 'Plus profond', text: '« Je ne peux pas retenir l\'histoire de 30 patients dans ma tête. »', source: 'Les cliniciens passent 35% de leur temps en documentation, ~16 min par rencontre. (AHRQ, PMC 2024)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/' },
        { depth: 'Plus profond', text: '« Je deviens le genre de thérapeute que je n\'ai jamais voulu être. »', source: 'Revue systématique : charge de travail élevée significativement associée au burnout. (Simionato & Simpson, PMC 2022)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9423708/' },
        { depth: 'Racine', text: '« Je suis devenu thérapeute pour vraiment voir les gens. Quand j\'oublie, je cesse de les voir. »', source: '« Ça fonctionne comme un second cerveau. » Sandra, psychologue (entretien Bloomsline)', sourceUrl: '' },
      ],
      quote: '',
    },
    business: {
      title: 'La Douleur Business',
      side: 'Le côté client du fossé',
      layers: [
        { depth: 'Surface', text: '« ~20% des patients interrompent prématurément la thérapie. 65% partent avant la 10e séance. »', source: 'Swift & Greenberg, méta-analyse de 669 ECR, ~84 000 patients. (J. Consulting and Clinical Psychology, 2012)', sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/22506792/' },
        { depth: 'Plus profond', text: '« Ils ne se sentent pas assez connectés entre les rendez-vous pour revenir. »', source: 'L\'alliance thérapeutique est un prédicteur constant des résultats cliniques positifs. (Horvath et al., PMC 2011)', sourceUrl: 'https://www.npr.org/sections/health-shots/2023/12/06/1217487323/psychologists-waitlist-demand-mental-health-care' },
        { depth: 'Plus profond', text: '« La thérapie s\'arrête à la porte. La vie, non. »', source: 'Les frictions administratives réduisent la capacité de la main-d\'oeuvre en santé mentale. (PMC 2024)', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11203202/' },
        { depth: 'Racine', text: '« L\'espace entre les séances est là où les patients se perdent. »', source: 'Taux d\'absence : 18% en psychiatrie ambulatoire. Nouveaux patients 2x plus. (Deifeii et al., évalué par les pairs)', sourceUrl: 'https://bhw.hrsa.gov/sites/default/files/bureau-health-workforce/data-research/Behavioral-Health-Workforce-Brief-2025.pdf' },
      ],
      quote: '',
    },
    connection: {
      title: 'Même fossé. Deux symptômes. Une solution.',
      detail: 'Le thérapeute oublie parce que rien ne connecte les séances. Le client part parce que rien ne connecte les séances. Bloomsline comble le fossé. Le thérapeute se souvient (identité guérie). Le client se sent accompagné (business guéri).',
    },
  },

  stats: {
    title: 'Les Chiffres (Vérifiés)',
    items: [
      { value: '93%', label: 'des travailleurs en santé mentale en burnout', source: 'National Council for Mental Wellbeing, 2023', sourceUrl: 'https://www.thenationalcouncil.org/news/help-wanted/' },
      { value: '25.6%', label: 'taux d\'abandon prématuré de thérapie', source: 'Méta-analyse 2024, 719K participants', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2762228/' },
      { value: '35%', label: 'du temps clinicien en documentation', source: 'AHRQ Technical Brief, PMC 2024', sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11534919/' },
      { value: '18%', label: 'taux d\'absence en psychiatrie ambulatoire', source: 'Deifeii et al., évalué par les pairs', sourceUrl: 'https://www.psychologytoday.com/sites/default/files/attachments/2259/2010ptxnoshowsdefifeetal.pdf' },
    ],
  },

  whatWeSell: {
    title: 'Ce Que Nous Vendons vs. Ce Que Nous Construisons',
    product: {
      label: 'Ce que nous construisons (le produit)',
      items: [
        'Résumés pré-séance, prêts quand vous l\'êtes',
        'Notes cliniques taguées avec recherche instantanée',
        'App membre avec capture de moments',
        'Partage de ressources avec suivi d\'ouverture',
        'Bloom, toujours là entre les séances',
        'Gestion de séances et planification',
      ],
    },
    feeling: {
      label: 'Ce que nous vendons (le ressenti)',
      items: [
        'Arriver à chaque séance en sachant déjà',
        'Ne plus jamais demander « de quoi on a parlé la dernière fois ? »',
        'Des patients qui se sentent écoutés entre les rendez-vous',
        'Un cabinet qui grandit parce que vous êtes excellent, pas parce que vous faites du marketing',
        'Rentrer chez soi sans une pile de notes à rédiger',
        'Être le thérapeute que vous avez toujours voulu être',
      ],
    },
  },

  layers: {
    title: 'Le Positionnement à Deux Niveaux',
    intro: 'Le ressenti les fait entrer. Le business case les fait payer. Ce ne sont pas des contradictions. c\'est le même mécanisme.',
    feeling: {
      title: 'Niveau 1 : Le Ressenti',
      role: 'Les touche émotionnellement: pourquoi ils ouvrent la page',
      statement: 'Chaque séance commence comme si vous n\'aviez jamais cessé d\'écouter.',
      explanation: 'Pour les praticiens qui se soucient profondément, le pire sentiment n\'est pas d\'être occupé. c\'est d\'oublier. Perdre le fil. Rater quelque chose qu\'un client leur a confié. Bloomsline s\'assure que ça n\'arrive jamais.',
    },
    connector: 'donc',
    business: {
      title: 'Niveau 2 : Le Business Case',
      role: 'Les fait payer: la conversation ROI',
      statement: 'Les patients qui se sentent écoutés ne disparaissent pas. Ils reviennent, restent plus longtemps, et en parlent autour d\'eux.',
      explanation: 'Être un thérapeute plus présent EST la stratégie de rétention. Ce n\'est pas « soyez meilleur ET grandissez. » C\'est « soyez meilleur, DONC grandissez. »',
      mechanics: [
        { label: 'Moins d\'absences', detail: 'Les patients engagés viennent' },
        { label: 'Meilleure rétention', detail: 'Les patients écoutés restent' },
        { label: 'Plus de recommandations', detail: 'Les patients soignés parlent' },
        { label: 'Moins de burnout', detail: 'Moins d\'admin, plus de présence' },
      ],
    },
  },

  mechanism: {
    title: 'Le Mécanisme : Comment la Présence Devient la Croissance',
    intro: 'Ce n\'est pas aspirationnel. C\'est la chaîne causale réelle.',
    steps: [
      { action: 'Le membre partage une réflexion entre les séances (fiche psychoéducative, réflexions, ressources)', result: 'Le praticien le voit avant la prochaine séance, aucune préparation nécessaire' },
      { action: 'Le praticien arrive en sachant ce qui s\'est passé', result: 'Pas de rattrapage. La séance commence dès la minute 1.' },
      { action: 'Le client se sent vraiment entendu et mémorisé', result: 'Il n\'annule pas. Il reprend rendez-vous. Il en parle à un ami.' },
      { action: 'Une absence évitée = 60-100€', result: 'Une recommandation = 0€ de CAC. Bloomsline se rentabilise en un seul client sauvé.' },
    ],
    conclusion: 'Un seul client sauvé du ghosting paie 6 mois de Bloomsline. Le ROI n\'est pas théorique. c\'est une relation.',
  },

  reframe: {
    title: 'Recadrage des Fonctionnalités',
    intro: 'Mêmes fonctionnalités. Autre histoire. Chaque fonctionnalité s\'inscrit dans la position centrale.',
    headers: ['Fonctionnalité', 'Ne dites pas', 'Dites plutôt'],
    rows: [
      { feature: 'Résumés pré-séance', old: 'Synthèses cliniques automatiques', new_: 'Vous vous asseyez en sachant déjà' },
      { feature: 'Notes taguées', old: 'Système de documentation organisé', new_: 'Retrouvez n\'importe quel moment de n\'importe quelle séance, instantanément' },
      { feature: 'App membre', old: 'Plateforme d\'engagement inter-séance', new_: 'Ils partagent, vous arrivez préparé' },
      { feature: 'Bloom', old: 'Compagnon pour les patients', new_: 'Bloom n\'est pas une intelligence qui remplace la vôtre. C\'est une mémoire qui la soutient.' },
      { feature: 'Partage de ressources', old: 'Distribution de devoirs numériques', new_: 'La conversation continue sans effort supplémentaire' },
      { feature: 'Gestion de séances', old: 'Calendrier et planification', new_: 'Moins d\'admin, plus de temps pour ce qui compte' },
    ],
  },

  competitive: {
    title: 'Où Nous Nous Situons',
    intro: 'Nous sommes le pont entre ce qui se passe pendant la séance et ce qui se passe seul après. Personne n\'occupe encore cet espace.',
    competitors: [
      { category: 'Gestion de Cabinet', name: 'SimplePractice / Doctolib', sells: 'Efficacité. Facturation. Planification. Formulaires. Simplification administrative.', position: 'Vend : "Gérez votre cabinet plus vite"', highlight: false },
      { category: 'Apps Bien-être', name: 'Headspace / Calm', sells: 'Auto-aide. Méditation. Journal. Aucune implication du praticien.', position: 'Vend : "Allez mieux tout seul"', highlight: false },
      { category: 'Pont Clinique', name: 'Bloomsline', sells: 'Continuité clinique. Contexte. Présence. Le travail entre les séances qui rend les séances meilleures.', position: 'Vend : "Soyez le thérapeute que vous vouliez être, et grandissez grâce à ça"', highlight: true },
    ],
  },

  whyNow: {
    title: 'Pourquoi Maintenant',
    intro: 'Cette fenêtre n\'existait pas il y a 3 ans. Quatre choses ont changé en même temps.',
    signals: [
      { label: 'Le B2C thérapie s\'est effondré', detail: 'BetterHelp : revenus en baisse de 9% à 950M$ en 2025, utilisateurs payants en déclin chaque trimestre. Woebot fermé en juin 2025. Talkspace pivoté B2B : +25% de revenus, première année rentable. Le marché a appris : on ne peut pas couper le thérapeute.', year: '2024-2025', source: 'Teladoc Q4 2025; STAT News; Talkspace Q4 2024', sourceUrl: 'https://ir.teladochealth.com/news-and-events/investor-news/press-release-details/2026/Teladoc-Health-Reports-Fourth-Quarter-and-Full-Year-2025-Results/default.aspx' },
      { label: 'L\'IA est devenue cliniquement acceptable', detail: '49% des personnes avec des problèmes de santé mentale utilisent déjà des outils IA (Sentio 2025). Les praticiens sont passés de "l\'IA va nous remplacer" à "montrez-moi comment ça aide."', year: '2025', source: 'Sentio AI Survey 2025', sourceUrl: 'https://sentio.org/ai-research/ai-survey' },
      { label: 'Aucun SaaS clinique IA-natif n\'existe en UE', detail: 'SimplePractice (US, 237K praticiens), Jane App (Canada), Doctolib (prise de RDV uniquement). Zéro plateforme combinant intelligence clinique + app membre sur le marché européen.', year: '2026', source: '', sourceUrl: '' },
      { label: 'La réglementation UE crée un avantage structurel', detail: 'EU AI Act en vigueur depuis août 2024. Conformité IA santé à haut risque obligatoire août 2026. Concurrents US 12-24 mois en retard. Construire conforme dès le jour 1 est un avantage structurel.', year: '2024-2026', source: 'EU AI Act; Commission Européenne', sourceUrl: 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai' },
    ],
  },

  whyUs: {
    title: 'Pourquoi Nous',
    intro: 'Nous ne sommes pas cliniciens. Nous ne sommes pas des vétérans du healthtech. Voici pourquoi c\'est justement le point.',
    points: [
      { label: 'On a construit le produit avant le pitch.', text: 'MVP live : Next.js 16, app mobile Expo, 24+ endpoints API, 3 langues, intégration Google Calendar, résumés pré-séance Bloom. Ce n\'est pas un fichier Figma. Des praticiens l\'ont utilisé.' },
      { label: 'On vient du côté patient.', text: 'On a commencé parce qu\'on a vécu un parcours de soin cassé. Ça nous donne une empathie pour l\'expérience du membre que la plupart des outils de gestion de cabinet ignorent totalement.' },
      { label: 'On a déjà échoué avec la première version.', text: 'On a commencé avec Doctalink. Ça n\'a pas marché. On a tout jeté, parlé à des praticiens, reconstruit de zéro. Le positionnement sur cette page vient de ces échecs, pas d\'un livre de stratégie.' },
      { label: 'On a besoin d\'un clinicien, et on le sait.', text: 'On recrute activement un conseiller clinique comme membre fondateur (equity, pas un compte gratuit). On ne prétend pas connaître la pratique clinique. On sait construire des outils qui la servent.' },
      { label: 'Le burn est soutenable.', text: '2 fondateurs, pas de bureau, ~2€/utilisateur en coût variable. Avec une levée de 500K€, c\'est 28-30 mois de runway. Assez de temps pour trouver le PMF sans paniquer.' },
    ],
  },

  risks: {
    title: 'Ce Qui Pourrait Tuer Ce Positionnement',
    intro: 'Si on est honnête avec les investisseurs, il faut nommer les risques spécifiques à cette position.',
    items: [
      { risk: 'Ce positionnement n\'est pas testé.', counter: 'Zéro praticien n\'a converti à cause de ces messages spécifiques. On a les interviews. On a le produit. On n\'a pas encore la preuve que ce positionnement convertit en revenus.' },
      { risk: '"Ne rien faire" pourrait gagner.', counter: '80%+ des praticiens utilisent le papier ou Google Drive. Si l\'inertie est plus forte que la douleur qu\'on décrit, le positionnement n\'a pas d\'importance. Le test : 5 praticiens peuvent-ils basculer en 90 jours ?' },
      { risk: 'La thèse rétention-par-la-présence n\'est pas prouvée.', counter: 'On affirme qu\'être plus présent mène à la rétention client qui mène à la croissance du cabinet. La recherche soutient le lien entre alliance et résultats. Mais on n\'a pas prouvé que NOTRE produit crée cette chaîne.' },
      { risk: 'SimplePractice pourrait ajouter des résumés IA demain.', counter: 'Ils pourraient. Mais ils l\'ajouteraient à une plateforme de facturation/planification. Tout notre produit est construit autour du contexte clinique. C\'est architectural, pas un toggle de fonctionnalité.' },
    ],
  },

  usage: {
    title: 'Comment le Dire',
    intro: 'Même positionnement, mots différents selon l\'interlocuteur et l\'action attendue.',
    labels: { open: 'Ouvrir avec', then: 'Puis dire', never: 'Ne jamais dire' },
    contexts: [
      {
        context: 'Page d\'accueil',
        audience: 'Praticiens en navigation',
        goal: 'Objectif : arrêter le scroll, les faire lire la suite',
        open: 'Vous voyez 6 patients aujourd\'hui. Vous vous souvenez de ce que chacun vous a dit la dernière fois ?',
        follow: 'Bloomsline connecte vos séances, vos notes et les réflexions de vos patients. Pour que chaque séance commence comme si vous n\'aviez jamais cessé d\'écouter.',
        never: 'Ne jamais ouvrir avec des fonctionnalités ("résumés pré-séance par IA") ou du jargon ("plateforme de continuité clinique").',
      },
      {
        context: 'Prospection (LinkedIn / email)',
        audience: 'Praticiens en libéral',
        goal: 'Objectif : obtenir une réponse, pas une vente',
        open: 'Petite question : comment préparez-vous votre première séance du lundi matin ? Vous relisez vos notes ou vous y allez de mémoire ?',
        follow: 'On a construit quelque chose qui prépare vos séances pour vous. Je serais ravi de vous montrer en 10 minutes si ça vous intéresse.',
        never: 'Ne jamais pitcher le produit dans le premier message. Ne jamais dire "révolutionnaire". Ne jamais joindre un deck.',
      },
      {
        context: 'Réunion investisseur',
        audience: 'Investisseurs pré-seed / seed',
        goal: 'Objectif : faire comprendre le fossé, pas le produit',
        open: 'La moitié des patients abandonnent avant la 3e séance. La plupart ne dépassent pas la 6e. Le problème vient du même endroit : rien ne connecte une séance à la suivante.',
        follow: 'Bloomsline comble ce fossé. Le thérapeute se souvient, le client se sent accompagné, et le cabinet grandit par la rétention, pas par le marketing.',
        never: 'Ne jamais commencer par la stack technique. Ne jamais dire "on est comme SimplePractice mais avec de l\'IA." Ne jamais prétendre avoir le PMF avant de l\'avoir.',
      },
      {
        context: 'Contenu social (LinkedIn)',
        audience: 'Communauté de thérapeutes',
        goal: 'Objectif : relatabilité d\'abord, produit ensuite (ou jamais)',
        open: 'Ce moment avant qu\'un client entre, quand vous essayez de vous rappeler de quoi vous avez parlé la dernière fois. Vous n\'êtes pas un mauvais thérapeute. Vous êtes un humain avec 30 patients.',
        follow: 'Et si vos notes étaient déjà connectées et votre prochaine séance déjà préparée ? (Pas de pitch. Juste la question.)',
        never: 'Ne jamais en faire une pub. Ne jamais dire "essayez Bloomsline." Laissez-les venir. Le contenu doit avoir de la valeur même sans le produit.',
      },
      {
        context: 'Pitch en 30 secondes',
        audience: 'N\'importe qui, n\'importe où',
        goal: 'Objectif : une phrase qu\'ils peuvent répéter à quelqu\'un d\'autre',
        open: 'On aide les thérapeutes à se souvenir de leurs patients. Pour que chaque séance commence là où elle devrait, pas 15 minutes après.',
        follow: 'Les patients qui se sentent mémorisés reviennent. C\'est tout le business model.',
        never: 'Ne jamais expliquer comment fonctionne l\'IA. Ne jamais mentionner la tech. S\'ils demandent "comment ?", c\'est gagné. Répondez alors.',
      },
      {
        context: 'Page de prix',
        audience: 'Praticiens prêts à décider',
        goal: 'Objectif : rendre le prix petit par rapport à ce qu\'ils obtiennent',
        open: 'Un client sauvé d\'une annulation paie 6 mois de Bloomsline.',
        follow: 'Vous avez des résumés de séance prêts avant chaque rendez-vous, des notes connectées sur des mois, et des patients qui se sentent écoutés entre les séances.',
        never: 'Ne jamais comparer aux concurrents par le prix. Ne jamais dire "moins cher que SimplePractice." On n\'est pas dans la même catégorie.',
      },
    ],
  },

  sentence: {
    primaryLabel: 'Pour les praticiens. Émotionnel, identitaire.',
    primary: 'Quand vous vous souvenez de vos patients, vos patients se souviennent de vous.',
    primaryUse: 'Page d\'accueil, bio social, prospection. Parle à l\'identité du thérapeute : se souvenir, c\'est prendre soin.',
    secondaryLabel: 'Pour investisseurs et partenaires. Axé résultats.',
    secondary: 'La présence du thérapeute favorise la rétention client. La rétention favorise la croissance du cabinet.',
    secondaryUse: 'Pitch deck, page de prix, réunions investisseurs. Parle au mécanisme business : présence → rétention → revenus.',
  },
}
